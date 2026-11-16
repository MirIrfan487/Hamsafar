using Matrimony.Application.Common;
using Matrimony.Application.DTOs;
using Matrimony.Application.Services;
using Matrimony.Domain.Entities;
using Matrimony.Domain.Enums;
using Matrimony.Persistence;
using Matrimony.Tests.Helpers;
using Microsoft.EntityFrameworkCore;

namespace Matrimony.Tests.Application;

// Admin rules from CLAUDE.md (Phase 8):
//  - approve only profiles waiting for approval; rejecting needs a reason (the member sees it)
//  - an admin cannot suspend themselves or another admin
//  - resolving a report can also suspend the reported member
//  - EVERY admin action writes an AdminAuditLogs row
public class AdminServiceTests : IDisposable
{
    private readonly TestDatabase _database = new();

    public void Dispose() => _database.Dispose();

    private static AdminService NewService(AppDbContext db) => new(db, TestIdentity.UserManager(db));

    private async Task<AdminActor> AddAdminAsync()
    {
        using var db = _database.NewContext();
        var admin = await TestIdentity.AddAdminAsync(db);
        return new AdminActor(admin.Id, admin.Email!);
    }

    private async Task<Profile> AddMemberAsync(ProfileStatus status = ProfileStatus.PendingApproval)
    {
        using var db = _database.NewContext();
        return await TestData.AddMemberAsync(db, Gender.Female, status);
    }

    private async Task<List<AdminAuditLog>> AuditLogAsync()
    {
        using var db = _database.NewContext();
        return await db.AdminAuditLogs.OrderBy(a => a.Id).ToListAsync();
    }

    private async Task<Profile> ReloadAsync(Profile profile)
    {
        using var db = _database.NewContext();
        return await db.Profiles.Include(p => p.User).SingleAsync(p => p.Id == profile.Id);
    }

    // ---------- Profiles ----------

    [Fact]
    public async Task Approving_a_waiting_profile_makes_it_approved_and_is_logged()
    {
        var admin = await AddAdminAsync();
        var member = await AddMemberAsync();

        using (var db = _database.NewContext())
            Assert.True((await NewService(db).ReviewProfileAsync(admin, member.Id, approve: true, reason: null)).Succeeded);

        Assert.Equal(ProfileStatus.Approved, (await ReloadAsync(member)).Status);
        var log = Assert.Single(await AuditLogAsync());
        Assert.Equal(("ApproveProfile", "Profile", member.Id.ToString(), admin.Email),
            (log.Action, log.TargetType, log.TargetId, log.AdminEmail));
    }

    [Theory]
    [InlineData(ProfileStatus.Draft)]
    [InlineData(ProfileStatus.Rejected)]
    public async Task Only_profiles_waiting_for_approval_can_be_approved(ProfileStatus status)
    {
        var admin = await AddAdminAsync();
        var member = await AddMemberAsync(status);

        using (var db = _database.NewContext())
            Assert.False((await NewService(db).ReviewProfileAsync(admin, member.Id, approve: true, reason: null)).Succeeded);

        Assert.Equal(status, (await ReloadAsync(member)).Status);
        Assert.Empty(await AuditLogAsync());   // nothing happened, nothing logged
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public async Task Rejecting_needs_a_reason(string? reason)
    {
        var admin = await AddAdminAsync();
        var member = await AddMemberAsync();

        using (var db = _database.NewContext())
            Assert.False((await NewService(db).ReviewProfileAsync(admin, member.Id, approve: false, reason)).Succeeded);

        Assert.Equal(ProfileStatus.PendingApproval, (await ReloadAsync(member)).Status);
    }

    [Fact]
    public async Task Rejecting_saves_the_reason_for_the_member_and_logs_it()
    {
        var admin = await AddAdminAsync();
        var member = await AddMemberAsync(ProfileStatus.Approved);   // an approved profile can be taken down too

        using (var db = _database.NewContext())
            Assert.True((await NewService(db).ReviewProfileAsync(admin, member.Id, approve: false, "  Please use a real name.  ")).Succeeded);

        var saved = await ReloadAsync(member);
        Assert.Equal(ProfileStatus.Rejected, saved.Status);
        Assert.Equal("Please use a real name.", saved.RejectionReason);
        var log = Assert.Single(await AuditLogAsync());
        Assert.Equal("RejectProfile", log.Action);
        Assert.Equal("Please use a real name.", log.Note);
    }

    // ---------- Photos ----------

    [Theory]
    [InlineData(true, PhotoStatus.Approved, "ApprovePhoto")]
    [InlineData(false, PhotoStatus.Rejected, "RejectPhoto")]
    public async Task Reviewing_a_photo_sets_its_status_and_is_logged(bool approve, PhotoStatus expected, string action)
    {
        var admin = await AddAdminAsync();
        var member = await AddMemberAsync(ProfileStatus.Approved);
        ProfilePhoto photo;
        using (var db = _database.NewContext())
            photo = await TestData.AddPhotoAsync(db, member, PhotoStatus.Pending);

        using (var db = _database.NewContext())
            Assert.True((await NewService(db).ReviewPhotoAsync(admin, photo.Id, approve, reason: null)).Succeeded);

        using var check = _database.NewContext();
        Assert.Equal(expected, (await check.ProfilePhotos.SingleAsync()).Status);
        Assert.Equal(action, Assert.Single(await AuditLogAsync()).Action);
    }

    // ---------- Suspending ----------

    [Fact]
    public async Task Suspending_and_unsuspending_a_member_is_saved_and_logged()
    {
        var admin = await AddAdminAsync();
        var member = await AddMemberAsync(ProfileStatus.Approved);

        using (var db = _database.NewContext())
            Assert.True((await NewService(db).SetSuspendedAsync(admin, member.UserId, true, "Asked for money")).Succeeded);
        Assert.True((await ReloadAsync(member)).User.IsSuspended);

        using (var db = _database.NewContext())
            Assert.True((await NewService(db).SetSuspendedAsync(admin, member.UserId, false, "Appeal accepted")).Succeeded);
        Assert.False((await ReloadAsync(member)).User.IsSuspended);

        Assert.Equal(["SuspendMember", "UnsuspendMember"], (await AuditLogAsync()).Select(a => a.Action));
    }

    [Fact]
    public async Task An_admin_cannot_suspend_their_own_account()
    {
        var admin = await AddAdminAsync();

        using var db = _database.NewContext();
        Assert.False((await NewService(db).SetSuspendedAsync(admin, admin.UserId, true, null)).Succeeded);
        Assert.False((await db.Users.SingleAsync(u => u.Id == admin.UserId)).IsSuspended);
    }

    [Fact]
    public async Task An_admin_cannot_suspend_another_admin()
    {
        var admin = await AddAdminAsync();
        var otherAdmin = await AddAdminAsync();

        using (var db = _database.NewContext())
            Assert.False((await NewService(db).SetSuspendedAsync(admin, otherAdmin.UserId, true, null)).Succeeded);

        using var check = _database.NewContext();
        Assert.False((await check.Users.SingleAsync(u => u.Id == otherAdmin.UserId)).IsSuspended);
        Assert.Empty(await AuditLogAsync());
    }

    [Fact]
    public async Task Suspending_an_unknown_account_is_not_found()
    {
        var admin = await AddAdminAsync();

        using var db = _database.NewContext();
        Assert.Equal(ErrorCodes.NotFound, (await NewService(db).SetSuspendedAsync(admin, "no-such-user", true, null)).ErrorCode);
    }

    // ---------- Reports ----------

    private async Task<(Profile Reporter, Profile Reported, Report Report)> AddReportAsync()
    {
        using var db = _database.NewContext();
        var reporter = await TestData.AddMemberAsync(db, Gender.Male);
        var reported = await TestData.AddMemberAsync(db, Gender.Female);
        var report = new Report { ReporterProfileId = reporter.Id, ReportedProfileId = reported.Id, Reason = ReportReason.ScamOrMoneyRequest };
        db.Reports.Add(report);
        await db.SaveChangesAsync();
        return (reporter, reported, report);
    }

    private async Task<ServiceResult<bool>> ResolveAsync(AdminActor admin, Report report, ReportStatus outcome, bool suspend = false)
    {
        using var db = _database.NewContext();
        return await NewService(db).ResolveReportAsync(admin, report.Id,
            new ResolveReportRequest { Outcome = outcome, Note = "Checked the chat", SuspendReportedMember = suspend });
    }

    [Fact]
    public async Task Resolving_a_report_with_suspend_suspends_the_reported_member()
    {
        var admin = await AddAdminAsync();
        var (_, reported, report) = await AddReportAsync();

        Assert.True((await ResolveAsync(admin, report, ReportStatus.ActionTaken, suspend: true)).Succeeded);

        Assert.True((await ReloadAsync(reported)).User.IsSuspended);
        using var check = _database.NewContext();
        var saved = await check.Reports.SingleAsync();
        Assert.Equal(ReportStatus.ActionTaken, saved.Status);
        Assert.NotNull(saved.ReviewedAtUtc);
        Assert.Equal(["ResolveReport", "SuspendMember"], (await AuditLogAsync()).Select(a => a.Action));
    }

    [Fact]
    public async Task Dismissing_a_report_suspends_nobody()
    {
        var admin = await AddAdminAsync();
        var (_, reported, report) = await AddReportAsync();

        Assert.True((await ResolveAsync(admin, report, ReportStatus.Dismissed)).Succeeded);

        Assert.False((await ReloadAsync(reported)).User.IsSuspended);
        Assert.Equal("DismissReport", Assert.Single(await AuditLogAsync()).Action);
    }

    [Fact]
    public async Task A_report_can_be_handled_only_once()
    {
        var admin = await AddAdminAsync();
        var (_, _, report) = await AddReportAsync();
        await ResolveAsync(admin, report, ReportStatus.Dismissed);

        Assert.False((await ResolveAsync(admin, report, ReportStatus.ActionTaken, suspend: true)).Succeeded);
    }

    [Fact]
    public async Task Open_is_not_a_valid_outcome()
    {
        var admin = await AddAdminAsync();
        var (_, _, report) = await AddReportAsync();

        Assert.False((await ResolveAsync(admin, report, ReportStatus.Open)).Succeeded);
    }
}
