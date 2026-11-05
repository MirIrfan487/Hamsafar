using Matrimony.Application.Common;
using Matrimony.Application.DTOs;
using Matrimony.Application.Interfaces;
using Matrimony.Application.Interfaces.Services;
using Matrimony.Domain.Entities;
using Matrimony.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Matrimony.Application.Services;

// Members protecting themselves: report a profile to the admins, block / unblock someone.
public class SafetyService(IAppDbContext db, IProfileCardService profileCards) : ISafetyService
{
    public async Task<ServiceResult<bool>> ReportAsync(string userId, int profileId, ReportRequest r)
    {
        var myId = await MyProfileIdAsync(userId);
        if (myId is null) return ServiceResult<bool>.Fail("Profile not found.");
        if (myId == profileId) return ServiceResult<bool>.Fail("You cannot report your own profile.");
        if (!await db.Profiles.AnyAsync(p => p.Id == profileId))
            return ServiceResult<bool>.FailWithCode(ErrorCodes.NotFound, "Profile not found.");

        var alreadyOpen = await db.Reports.AnyAsync(x =>
            x.ReporterProfileId == myId && x.ReportedProfileId == profileId && x.Status == ReportStatus.Open);
        if (alreadyOpen) return ServiceResult<bool>.Fail("You have already reported this profile. Our team will review it.");

        db.Reports.Add(new Report
        {
            ReporterProfileId = myId.Value,
            ReportedProfileId = profileId,
            Reason = r.Reason!.Value,
            Details = string.IsNullOrWhiteSpace(r.Details) ? null : r.Details.Trim()
        });
        await db.SaveChangesAsync();
        return ServiceResult<bool>.Ok(true);
    }

    public async Task<ServiceResult<bool>> BlockAsync(string userId, int profileId)
    {
        var myId = await MyProfileIdAsync(userId);
        if (myId is null) return ServiceResult<bool>.Fail("Profile not found.");
        if (myId == profileId) return ServiceResult<bool>.Fail("You cannot block yourself.");
        if (!await db.Profiles.AnyAsync(p => p.Id == profileId))
            return ServiceResult<bool>.FailWithCode(ErrorCodes.NotFound, "Profile not found.");

        var exists = await db.Blocks.AnyAsync(b => b.BlockerProfileId == myId && b.BlockedProfileId == profileId);
        if (!exists)
        {
            db.Blocks.Add(new Block { BlockerProfileId = myId.Value, BlockedProfileId = profileId });
            await db.SaveChangesAsync();
        }
        // From now on search, profile pages, interests, photos and chat all hide each other (see ProfileCardService.IsBlockedAsync)
        return ServiceResult<bool>.Ok(true);
    }

    public async Task<ServiceResult<bool>> UnblockAsync(string userId, int profileId)
    {
        var myId = await MyProfileIdAsync(userId);
        if (myId is null) return ServiceResult<bool>.Fail("Profile not found.");

        var block = await db.Blocks.FirstOrDefaultAsync(b => b.BlockerProfileId == myId && b.BlockedProfileId == profileId);
        if (block is not null)
        {
            db.Blocks.Remove(block);
            await db.SaveChangesAsync();
        }
        return ServiceResult<bool>.Ok(true);
    }

    // People I blocked (so I can unblock them later)
    public async Task<IReadOnlyList<BlockedMemberResponse>> ListBlockedAsync(string userId)
    {
        var myId = await MyProfileIdAsync(userId);
        if (myId is null) return [];

        var rows = await db.Blocks.AsNoTracking()
            .Where(b => b.BlockerProfileId == myId)
            .OrderByDescending(b => b.CreatedAtUtc)
            .Select(b => new { b.BlockedProfileId, b.Blocked.FirstName, b.Blocked.LastName, b.Blocked.ShowLastName, b.Blocked.City, b.CreatedAtUtc })
            .ToListAsync();

        return rows.Select(x => new BlockedMemberResponse(
            x.BlockedProfileId, profileCards.DisplayName(x.FirstName, x.LastName, x.ShowLastName), x.City, x.CreatedAtUtc)).ToList();
    }

    private Task<int?> MyProfileIdAsync(string userId) =>
        db.Profiles.Where(p => p.UserId == userId).Select(p => (int?)p.Id).FirstOrDefaultAsync();
}
