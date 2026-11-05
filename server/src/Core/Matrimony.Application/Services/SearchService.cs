using Matrimony.Application.Common;
using Matrimony.Application.DTOs;
using Matrimony.Application.Interfaces;
using Matrimony.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Matrimony.Application.Services;

// Finding and viewing OTHER members' profiles.
// Rules for who appears: approved profile, opposite gender, not yourself,
// no block in either direction, account not suspended.
public class SearchService(IAppDbContext db)
{
    public async Task<ServiceResult<PagedResult<ProfileCardResponse>>> SearchAsync(string viewerUserId, SearchRequest r)
    {
        var me = await db.Profiles.AsNoTracking()
            .Where(p => p.UserId == viewerUserId)
            .Select(p => new { p.Id, p.Gender })
            .FirstOrDefaultAsync();
        if (me is null) return ServiceResult<PagedResult<ProfileCardResponse>>.Fail("Profile not found.");

        if (r.AgeMin is not null && r.AgeMax is not null && r.AgeMax < r.AgeMin)
            return ServiceResult<PagedResult<ProfileCardResponse>>.Fail("Maximum age must be the same as or more than minimum age.");

        var targetGender = me.Gender == Gender.Male ? Gender.Female : Gender.Male;
        var acceptedIds = await ProfileCards.AcceptedInterestProfileIdsAsync(db, me.Id);

        // ---------- Who can appear at all ----------
        var q = db.Profiles.AsNoTracking().Where(p =>
            p.Status == ProfileStatus.Approved &&
            p.Gender == targetGender &&
            p.Id != me.Id &&
            !p.User.IsSuspended &&
            !db.Blocks.Any(b =>
                (b.BlockerProfileId == me.Id && b.BlockedProfileId == p.Id) ||
                (b.BlockerProfileId == p.Id && b.BlockedProfileId == me.Id)));

        // ---------- Filters ----------
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        if (r.AgeMin is not null)
        {
            var latestDob = today.AddYears(-r.AgeMin.Value);          // at least AgeMin years old
            q = q.Where(p => p.DateOfBirth <= latestDob);
        }
        if (r.AgeMax is not null)
        {
            var earliestDob = today.AddYears(-(r.AgeMax.Value + 1));  // not yet AgeMax + 1
            q = q.Where(p => p.DateOfBirth > earliestDob);
        }
        if (r.HeightMinCm is not null) q = q.Where(p => p.HeightCm >= r.HeightMinCm);
        if (r.HeightMaxCm is not null) q = q.Where(p => p.HeightCm <= r.HeightMaxCm);

        if (r.MaritalStatuses.Count > 0) q = q.Where(p => r.MaritalStatuses.Contains(p.MaritalStatus));
        if (r.Sects.Count > 0)
        {
            var sects = r.Sects.Select(s => (Sect?)s).ToList();
            q = q.Where(p => sects.Contains(p.Sect));
        }
        if (r.Religiosities.Count > 0)
        {
            var levels = r.Religiosities.Select(x => (Religiosity?)x).ToList();
            q = q.Where(p => levels.Contains(p.Religiosity));
        }

        if (!string.IsNullOrWhiteSpace(r.City))
        {
            var city = r.City.Trim();
            q = q.Where(p => p.City.Contains(city) || (p.State != null && p.State.Contains(city)));
        }
        if (!string.IsNullOrWhiteSpace(r.Education))
        {
            var education = r.Education.Trim();
            q = q.Where(p => p.Education != null && p.Education.Contains(education));
        }

        if (r.WithPhotoOnly)
        {
            // Only profiles whose photo THIS viewer can actually see
            q = q.Where(p =>
                p.Photos.Any(ph => ph.Status == PhotoStatus.Approved) &&
                (p.PhotoPrivacy == PhotoPrivacy.AllMembers ||
                 (p.PhotoPrivacy == PhotoPrivacy.AcceptedInterestsOnly && acceptedIds.Contains(p.Id))));
        }

        // ---------- Count, sort, page ----------
        var total = await q.CountAsync();

        q = r.Sort switch
        {
            SearchSort.Youngest => q.OrderByDescending(p => p.DateOfBirth).ThenBy(p => p.Id),
            SearchSort.Oldest => q.OrderBy(p => p.DateOfBirth).ThenBy(p => p.Id),
            _ => q.OrderByDescending(p => p.CreatedAtUtc).ThenBy(p => p.Id)
        };

        var rows = await ProfileCards.ToRows(q.Skip((r.Page - 1) * r.PageSize).Take(r.PageSize)).ToListAsync();
        var items = rows.Select(x => ProfileCards.ToCard(x, acceptedIds)).ToList();

        return ServiceResult<PagedResult<ProfileCardResponse>>.Ok(new PagedResult<ProfileCardResponse>(items, r.Page, r.PageSize, total));
    }

    // Returns null if the viewer may not see this profile (the controller answers 404)
    public async Task<ProfileDetailResponse?> GetProfileAsync(string viewerUserId, int profileId)
    {
        var viewer = await db.Profiles.AsNoTracking()
            .Where(x => x.UserId == viewerUserId)
            .Select(x => new { x.Id, x.Status })
            .FirstOrDefaultAsync();
        if (viewer is null) return null;
        int viewerProfileId = viewer.Id;

        var p = await db.Profiles.AsNoTracking()
            .Include(x => x.User)
            .Include(x => x.PartnerPreference)
            .Include(x => x.Photos)
            .FirstOrDefaultAsync(x => x.Id == profileId);
        if (p is null) return null;

        var isOwn = p.Id == viewerProfileId;
        if (!isOwn)
        {
            if (p.Status != ProfileStatus.Approved || p.User.IsSuspended) return null;
            if (await ProfileCards.IsBlockedAsync(db, viewerProfileId, p.Id)) return null;
        }

        var acceptedIds = isOwn ? new List<int>() : await ProfileCards.AcceptedInterestProfileIdsAsync(db, viewerProfileId);
        var interest = isOwn ? null : await InterestService.FindBetweenAsync(db, viewerProfileId, p.Id);
        var approvedPhotos = p.Photos
            .Where(ph => isOwn || ph.Status == PhotoStatus.Approved)
            .OrderByDescending(ph => ph.IsMain).ThenBy(ph => ph.UploadedAtUtc)
            .Select(ph => ph.Id)
            .ToList();
        var canSee = isOwn || ProfileCards.CanSeePhotos(p.PhotoPrivacy, acceptedIds.Contains(p.Id));
        var locked = !canSee && approvedPhotos.Count > 0 && p.PhotoPrivacy == PhotoPrivacy.AcceptedInterestsOnly;

        var pp = p.PartnerPreference;
        return new ProfileDetailResponse(
            p.Id, ProfileCards.DisplayName(p.FirstName, p.LastName, p.ShowLastName || isOwn), isOwn, p.Status,
            p.ProfileFor, p.Gender, AgeRules.CalculateAge(p.DateOfBirth), p.MaritalStatus, p.HeightCm,
            p.Country, p.State, p.City, p.Education, p.Occupation,
            p.Sect, p.Religiosity, p.MotherTongue, p.AboutMe,
            p.FatherOccupation, p.MotherOccupation, p.Brothers, p.Sisters, p.FamilyDetails,
            pp is null ? null : new PartnerPreferenceResponse(pp.AgeMin, pp.AgeMax, pp.HeightMinCm, pp.HeightMaxCm,
                pp.MaritalStatuses, pp.Sects, pp.Cities, pp.Education, pp.Notes),
            canSee ? approvedPhotos : new List<int>(),
            locked,
            interest,
            viewer.Status == ProfileStatus.Approved);
    }

    // Email/phone of a CONNECTED member. Needs a Premium plan with contact details.
    public async Task<ServiceResult<ContactDetailsResponse>> GetContactDetailsAsync(string viewerUserId, int profileId)
    {
        var viewerProfileId = await db.Profiles
            .Where(x => x.UserId == viewerUserId).Select(x => (int?)x.Id).FirstOrDefaultAsync();
        if (viewerProfileId is null) return ServiceResult<ContactDetailsResponse>.Fail("Profile not found.");

        var interest = await InterestService.FindBetweenAsync(db, viewerProfileId.Value, profileId);
        if (interest?.Status != InterestStatus.Accepted || await ProfileCards.IsBlockedAsync(db, viewerProfileId.Value, profileId))
            return ServiceResult<ContactDetailsResponse>.Fail("Contact details are shown only after an interest is accepted.");

        if (!await PremiumAccess.CanViewContactsAsync(db, viewerUserId))
            return ServiceResult<ContactDetailsResponse>.Fail("Contact details need Premium.");

        var contact = await db.Profiles.AsNoTracking()
            .Where(x => x.Id == profileId && !x.User.IsSuspended)
            .Select(x => new ContactDetailsResponse(x.User.Email, x.User.PhoneNumber))
            .FirstOrDefaultAsync();
        return contact is null
            ? ServiceResult<ContactDetailsResponse>.Fail("This profile is not available.")
            : ServiceResult<ContactDetailsResponse>.Ok(contact);
    }
}
