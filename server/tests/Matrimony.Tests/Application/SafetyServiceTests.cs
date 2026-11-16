using Matrimony.Application.Common;
using Matrimony.Application.DTOs;
using Matrimony.Application.Services;
using Matrimony.Domain.Entities;
using Matrimony.Domain.Enums;
using Matrimony.Persistence;
using Matrimony.Tests.Helpers;
using Microsoft.EntityFrameworkCore;

namespace Matrimony.Tests.Application;

// Members protecting themselves (Phase 8): report a profile, block / unblock.
// Rules: not yourself; one OPEN report per reporter -> reported pair; blocking twice is harmless.
public class SafetyServiceTests : IDisposable
{
    private readonly TestDatabase _database = new();

    public void Dispose() => _database.Dispose();

    private static SafetyService NewService(AppDbContext db) => new(db, new ProfileCardService(db));

    private async Task<(Profile Me, Profile Other)> AddPairAsync()
    {
        using var db = _database.NewContext();
        return (await TestData.AddMemberAsync(db, Gender.Male), await TestData.AddMemberAsync(db, Gender.Female));
    }

    private async Task<ServiceResult<bool>> ReportAsync(Profile me, int profileId)
    {
        using var db = _database.NewContext();
        return await NewService(db).ReportAsync(me.UserId, profileId,
            new ReportRequest { Reason = ReportReason.FakeProfile, Details = "  Photos are from the internet  " });
    }

    // ---------- Reports ----------

    [Fact]
    public async Task A_member_can_report_a_profile()
    {
        var (me, other) = await AddPairAsync();

        Assert.True((await ReportAsync(me, other.Id)).Succeeded);

        using var check = _database.NewContext();
        var report = await check.Reports.SingleAsync();
        Assert.Equal((me.Id, other.Id, ReportStatus.Open), (report.ReporterProfileId, report.ReportedProfileId, report.Status));
        Assert.Equal("Photos are from the internet", report.Details);
    }

    [Fact]
    public async Task A_member_cannot_report_themselves()
    {
        var (me, _) = await AddPairAsync();
        Assert.False((await ReportAsync(me, me.Id)).Succeeded);
    }

    [Fact]
    public async Task Reporting_an_unknown_profile_is_not_found()
    {
        var (me, _) = await AddPairAsync();
        Assert.Equal(ErrorCodes.NotFound, (await ReportAsync(me, 999_999)).ErrorCode);
    }

    [Fact]
    public async Task Only_one_open_report_per_pair()
    {
        var (me, other) = await AddPairAsync();
        await ReportAsync(me, other.Id);

        Assert.False((await ReportAsync(me, other.Id)).Succeeded);

        using var check = _database.NewContext();
        Assert.Single(check.Reports);
    }

    [Fact]
    public async Task After_the_admin_handled_it_the_same_member_can_report_again()
    {
        var (me, other) = await AddPairAsync();
        await ReportAsync(me, other.Id);
        using (var db = _database.NewContext())
        {
            (await db.Reports.SingleAsync()).Status = ReportStatus.Dismissed;
            await db.SaveChangesAsync();
        }

        Assert.True((await ReportAsync(me, other.Id)).Succeeded);
    }

    // ---------- Blocks ----------

    [Fact]
    public async Task Blocking_twice_keeps_one_block_and_unblock_removes_it()
    {
        var (me, other) = await AddPairAsync();

        using (var db = _database.NewContext())
        {
            var service = NewService(db);
            Assert.True((await service.BlockAsync(me.UserId, other.Id)).Succeeded);
            Assert.True((await service.BlockAsync(me.UserId, other.Id)).Succeeded);
        }
        using (var db = _database.NewContext())
        {
            Assert.Single(db.Blocks);
            Assert.Equal(other.Id, Assert.Single(await NewService(db).ListBlockedAsync(me.UserId)).ProfileId);
        }

        using (var db = _database.NewContext())
            Assert.True((await NewService(db).UnblockAsync(me.UserId, other.Id)).Succeeded);
        using var check = _database.NewContext();
        Assert.Empty(check.Blocks);
    }

    [Fact]
    public async Task A_member_cannot_block_themselves()
    {
        var (me, _) = await AddPairAsync();
        using var db = _database.NewContext();
        Assert.False((await NewService(db).BlockAsync(me.UserId, me.Id)).Succeeded);
    }

    [Fact]
    public async Task Unblocking_only_removes_my_own_block()
    {
        var (me, other) = await AddPairAsync();
        using (var db = _database.NewContext())
        {
            db.Blocks.Add(new Block { BlockerProfileId = other.Id, BlockedProfileId = me.Id });   // SHE blocked ME
            await db.SaveChangesAsync();
        }

        using (var db = _database.NewContext())
            await NewService(db).UnblockAsync(me.UserId, other.Id);   // I try to lift her block

        using var check = _database.NewContext();
        Assert.Single(check.Blocks);
    }
}
