using Matrimony.Application.Common;
using Matrimony.Application.DTOs;
using Matrimony.Application.Interfaces;
using Matrimony.Domain.Constants;
using Matrimony.Domain.Entities;
using Matrimony.Domain.Enums;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Matrimony.Application.Services;

// Admin panel: approve profiles/photos, handle reports, suspend members, view the activity log.
// Every change writes a row to AdminAuditLogs.
public class AdminService(IAppDbContext db, UserManager<AppUser> userManager)
{
    public const int PageSize = 20;

    // Who is doing the action (for the activity log)
    public record AdminActor(string UserId, string Email);

    // ---------- Overview ----------

    public async Task<AdminStatsResponse> GetStatsAsync()
    {
        var now = DateTime.UtcNow;
        var weekAgo = now.AddDays(-7);
        var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        return new AdminStatsResponse(
            TotalMembers: await db.Profiles.CountAsync(),
            NewMembersLast7Days: await db.Profiles.CountAsync(p => p.CreatedAtUtc >= weekAgo),
            PendingProfiles: await db.Profiles.CountAsync(p => p.Status == ProfileStatus.PendingApproval),
            ApprovedProfiles: await db.Profiles.CountAsync(p => p.Status == ProfileStatus.Approved),
            PendingPhotos: await db.ProfilePhotos.CountAsync(p => p.Status == PhotoStatus.Pending),
            OpenReports: await db.Reports.CountAsync(r => r.Status == ReportStatus.Open),
            ActivePremiumMembers: await db.Subscriptions
                .Where(s => s.Status == SubscriptionStatus.Active && s.StartsAtUtc <= now && s.EndsAtUtc > now)
                .Select(s => s.UserId).Distinct().CountAsync(),
            RevenueThisMonthInPaise: await db.Payments
                .Where(p => p.Status == PaymentStatus.Paid && p.PaidAtUtc >= monthStart)
                .SumAsync(p => (int?)p.AmountInPaise) ?? 0);
    }

    // ---------- Profiles ----------

    public async Task<PagedResult<AdminProfileReview>> GetPendingProfilesAsync(int page)
    {
        var q = db.Profiles.AsNoTracking().Where(p => p.Status == ProfileStatus.PendingApproval);
        var total = await q.CountAsync();

        var profiles = await q
            .OrderBy(p => p.UpdatedAtUtc)   // oldest waiting first
            .Skip((page - 1) * PageSize).Take(PageSize)
            .Include(p => p.User)
            .Include(p => p.Photos)
            .ToListAsync();

        var items = profiles.Select(p => new AdminProfileReview(
            p.Id, p.User.Email ?? string.Empty, p.CreatedAtUtc, p.UpdatedAtUtc, p.Status,
            p.ProfileFor, p.FirstName, p.LastName, p.Gender, p.DateOfBirth, AgeRules.CalculateAge(p.DateOfBirth),
            p.MaritalStatus, p.HeightCm, p.Country, p.State, p.City,
            p.Education, p.Occupation, p.Sect, p.Religiosity, p.MotherTongue, p.AboutMe,
            p.FatherOccupation, p.MotherOccupation, p.Brothers, p.Sisters, p.FamilyDetails,
            p.Photos.OrderByDescending(ph => ph.IsMain).ThenBy(ph => ph.UploadedAtUtc)
                .Select(ph => new AdminPhotoItem(ph.Id, p.Id, p.FirstName, ph.IsMain, ph.Status, ph.UploadedAtUtc))
                .ToList()))
            .ToList();

        return new PagedResult<AdminProfileReview>(items, page, PageSize, total);
    }

    public async Task<ServiceResult<bool>> ReviewProfileAsync(AdminActor admin, int profileId, bool approve, string? reason)
    {
        var profile = await db.Profiles.FirstOrDefaultAsync(p => p.Id == profileId);
        if (profile is null) return ServiceResult<bool>.FailWithCode(ErrorCodes.NotFound, "Profile not found.");

        if (approve)
        {
            if (profile.Status != ProfileStatus.PendingApproval)
                return ServiceResult<bool>.Fail("Only profiles waiting for approval can be approved.");
            profile.Status = ProfileStatus.Approved;
            profile.RejectionReason = null;
        }
        else
        {
            if (string.IsNullOrWhiteSpace(reason)) return ServiceResult<bool>.Fail("Please give a reason. The member will see it.");
            if (profile.Status is not (ProfileStatus.PendingApproval or ProfileStatus.Approved))
                return ServiceResult<bool>.Fail("This profile cannot be rejected in its current status.");
            profile.Status = ProfileStatus.Rejected;   // also removes an approved profile from search
            profile.RejectionReason = reason.Trim();
        }

        Log(admin, approve ? "ApproveProfile" : "RejectProfile", "Profile", profileId.ToString(), approve ? null : reason);
        await db.SaveChangesAsync();
        return ServiceResult<bool>.Ok(true);
    }

    // ---------- Photos ----------

    public async Task<PagedResult<AdminPhotoItem>> GetPendingPhotosAsync(int page)
    {
        var q = db.ProfilePhotos.AsNoTracking().Where(p => p.Status == PhotoStatus.Pending);
        var total = await q.CountAsync();
        var items = await q
            .OrderBy(p => p.UploadedAtUtc)
            .Skip((page - 1) * PageSize).Take(PageSize)
            .Select(p => new AdminPhotoItem(p.Id, p.ProfileId, p.Profile.FirstName, p.IsMain, p.Status, p.UploadedAtUtc))
            .ToListAsync();
        return new PagedResult<AdminPhotoItem>(items, page, PageSize, total);
    }

    public async Task<ServiceResult<bool>> ReviewPhotoAsync(AdminActor admin, int photoId, bool approve, string? reason)
    {
        var photo = await db.ProfilePhotos.FirstOrDefaultAsync(p => p.Id == photoId);
        if (photo is null) return ServiceResult<bool>.FailWithCode(ErrorCodes.NotFound, "Photo not found.");

        photo.Status = approve ? PhotoStatus.Approved : PhotoStatus.Rejected;
        Log(admin, approve ? "ApprovePhoto" : "RejectPhoto", "Photo", photoId.ToString(), reason);
        await db.SaveChangesAsync();
        return ServiceResult<bool>.Ok(true);
    }

    // ---------- Reports ----------

    public async Task<PagedResult<AdminReportItem>> GetReportsAsync(ReportStatus status, int page)
    {
        var q = db.Reports.AsNoTracking().Where(r => r.Status == status);
        var total = await q.CountAsync();

        var items = await q
            .OrderBy(r => r.CreatedAtUtc)
            .Skip((page - 1) * PageSize).Take(PageSize)
            .Select(r => new AdminReportItem(
                r.Id, r.Reason, r.Details, r.Status, r.CreatedAtUtc, r.AdminNote,
                new AdminPersonRef(r.Reporter.Id, r.Reporter.FirstName, r.Reporter.User.Email ?? "", r.Reporter.UserId, r.Reporter.User.IsSuspended),
                new AdminPersonRef(r.Reported.Id, r.Reported.FirstName, r.Reported.User.Email ?? "", r.Reported.UserId, r.Reported.User.IsSuspended),
                db.Reports.Count(x => x.ReportedProfileId == r.ReportedProfileId)))
            .ToListAsync();

        return new PagedResult<AdminReportItem>(items, page, PageSize, total);
    }

    public async Task<ServiceResult<bool>> ResolveReportAsync(AdminActor admin, int reportId, ResolveReportRequest r)
    {
        var report = await db.Reports.Include(x => x.Reported).FirstOrDefaultAsync(x => x.Id == reportId);
        if (report is null) return ServiceResult<bool>.FailWithCode(ErrorCodes.NotFound, "Report not found.");
        if (report.Status != ReportStatus.Open) return ServiceResult<bool>.Fail("This report has already been handled.");
        if (r.Outcome is not (ReportStatus.ActionTaken or ReportStatus.Dismissed))
            return ServiceResult<bool>.Fail("Choose 'ActionTaken' or 'Dismissed'.");

        report.Status = r.Outcome.Value;
        report.AdminNote = string.IsNullOrWhiteSpace(r.Note) ? null : r.Note.Trim();
        report.ReviewedAtUtc = DateTime.UtcNow;
        Log(admin, r.Outcome == ReportStatus.Dismissed ? "DismissReport" : "ResolveReport", "Report", reportId.ToString(), report.AdminNote);

        if (r.SuspendReportedMember)
        {
            var result = await SetSuspendedCoreAsync(admin, report.Reported.UserId, true, $"Report #{reportId}: {report.AdminNote}");
            if (!result.Succeeded) return result;
        }

        await db.SaveChangesAsync();
        return ServiceResult<bool>.Ok(true);
    }

    // ---------- Members ----------

    public async Task<PagedResult<AdminMemberItem>> SearchMembersAsync(string? query, int page)
    {
        var now = DateTime.UtcNow;
        var q = db.Profiles.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(query))
        {
            var text = query.Trim();
            q = q.Where(p => p.FirstName.Contains(text) || (p.LastName != null && p.LastName.Contains(text))
                             || (p.User.Email != null && p.User.Email.Contains(text)) || p.City.Contains(text));
        }

        var total = await q.CountAsync();
        var items = await q
            .OrderByDescending(p => p.CreatedAtUtc)
            .Skip((page - 1) * PageSize).Take(PageSize)
            .Select(p => new AdminMemberItem(
                p.UserId, p.User.Email ?? "", p.Id, p.FirstName, p.Gender, p.City, p.Status, p.User.IsSuspended,
                db.Subscriptions.Any(s => s.UserId == p.UserId && s.Status == SubscriptionStatus.Active
                                          && s.StartsAtUtc <= now && s.EndsAtUtc > now),
                p.User.CreatedAtUtc, p.User.LastActiveAtUtc))
            .ToListAsync();

        return new PagedResult<AdminMemberItem>(items, page, PageSize, total);
    }

    public async Task<ServiceResult<bool>> SetSuspendedAsync(AdminActor admin, string userId, bool suspended, string? note)
    {
        var result = await SetSuspendedCoreAsync(admin, userId, suspended, note);
        if (!result.Succeeded) return result;
        await db.SaveChangesAsync();   // saves the audit log row
        return result;
    }

    // ---------- Activity log ----------

    public async Task<PagedResult<AuditLogItem>> GetAuditLogAsync(int page)
    {
        var total = await db.AdminAuditLogs.CountAsync();
        var items = await db.AdminAuditLogs.AsNoTracking()
            .OrderByDescending(a => a.Id)
            .Skip((page - 1) * PageSize).Take(PageSize)
            .Select(a => new AuditLogItem(a.Id, a.AdminEmail, a.Action, a.TargetType, a.TargetId, a.Note, a.CreatedAtUtc))
            .ToListAsync();
        return new PagedResult<AuditLogItem>(items, page, PageSize, total);
    }

    // ---------- Helpers ----------

    private async Task<ServiceResult<bool>> SetSuspendedCoreAsync(AdminActor admin, string userId, bool suspended, string? note)
    {
        if (userId == admin.UserId) return ServiceResult<bool>.Fail("You cannot suspend your own account.");

        var user = await userManager.FindByIdAsync(userId);
        if (user is null) return ServiceResult<bool>.FailWithCode(ErrorCodes.NotFound, "Member not found.");
        if (await userManager.IsInRoleAsync(user, Roles.Admin)) return ServiceResult<bool>.Fail("Admin accounts cannot be suspended here.");

        if (user.IsSuspended != suspended)
        {
            user.IsSuspended = suspended;
            var update = await userManager.UpdateAsync(user);   // saves immediately
            if (!update.Succeeded) return ServiceResult<bool>.Fail(update.Errors.Select(e => e.Description).ToArray());
        }

        Log(admin, suspended ? "SuspendMember" : "UnsuspendMember", "User", userId, note);
        return ServiceResult<bool>.Ok(true);
    }

    private void Log(AdminActor admin, string action, string targetType, string targetId, string? note) =>
        db.AdminAuditLogs.Add(new AdminAuditLog
        {
            AdminUserId = admin.UserId,
            AdminEmail = admin.Email,
            Action = action,
            TargetType = targetType,
            TargetId = targetId,
            Note = string.IsNullOrWhiteSpace(note) ? null : note.Trim()[..Math.Min(500, note.Trim().Length)]
        });
}
