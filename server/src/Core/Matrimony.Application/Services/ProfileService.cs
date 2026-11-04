using Matrimony.Application.Common;
using Matrimony.Application.DTOs;
using Matrimony.Application.Interfaces;
using Matrimony.Domain.Entities;
using Matrimony.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Matrimony.Application.Services;

// Everything the logged-in user can do with THEIR OWN profile.
public class ProfileService(IAppDbContext db)
{
    public const int MinAboutMeLength = 30;

    // ---------- Read ----------

    public async Task<MyProfileResponse?> GetMyProfileAsync(string userId)
    {
        var profile = await LoadMyProfileAsync(userId);
        return profile is null ? null : ToResponse(profile);
    }

    // ---------- Update profile (called after each wizard step) ----------

    public async Task<ServiceResult<MyProfileResponse>> UpdateMyProfileAsync(string userId, UpdateProfileRequest r)
    {
        var profile = await LoadMyProfileAsync(userId);
        if (profile is null) return ServiceResult<MyProfileResponse>.Fail("Profile not found.");

        var dobError = AgeRules.Validate(r.DateOfBirth!.Value);
        if (dobError is not null) return ServiceResult<MyProfileResponse>.Fail(dobError);

        // Basic
        profile.ProfileFor = r.ProfileFor!.Value;
        profile.FirstName = r.FirstName.Trim();
        profile.LastName = Clean(r.LastName);
        profile.ShowLastName = r.ShowLastName;
        profile.Gender = r.Gender!.Value;
        profile.DateOfBirth = r.DateOfBirth.Value;
        profile.MaritalStatus = r.MaritalStatus!.Value;
        profile.HeightCm = r.HeightCm;

        // Location
        profile.Country = Clean(r.Country) ?? "India";
        profile.State = Clean(r.State);
        profile.City = Clean(r.City) ?? string.Empty;

        // Education & work
        profile.Education = Clean(r.Education);
        profile.Occupation = Clean(r.Occupation);

        // Religion & about
        profile.Sect = r.Sect;
        profile.Religiosity = r.Religiosity;
        profile.MotherTongue = Clean(r.MotherTongue);
        profile.AboutMe = Clean(r.AboutMe);

        // Family
        profile.FatherOccupation = Clean(r.FatherOccupation);
        profile.MotherOccupation = Clean(r.MotherOccupation);
        profile.Brothers = r.Brothers;
        profile.Sisters = r.Sisters;
        profile.FamilyDetails = Clean(r.FamilyDetails);

        // Privacy
        if (r.PhotoPrivacy is not null) profile.PhotoPrivacy = r.PhotoPrivacy.Value;

        // Moderation: an approved profile that is edited must be checked again
        if (profile.Status == ProfileStatus.Approved)
            profile.Status = ProfileStatus.PendingApproval;
        else if (profile.Status == ProfileStatus.Rejected)
            profile.Status = ProfileStatus.Draft;   // fix the problem, then submit again

        profile.UpdatedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync();

        return ServiceResult<MyProfileResponse>.Ok(ToResponse(profile));
    }

    // ---------- Partner preferences ----------

    public async Task<ServiceResult<MyProfileResponse>> UpdatePreferencesAsync(string userId, PartnerPreferenceRequest r)
    {
        var profile = await LoadMyProfileAsync(userId);
        if (profile is null) return ServiceResult<MyProfileResponse>.Fail("Profile not found.");

        var errors = new List<string>();
        if (r.AgeMax < r.AgeMin) errors.Add("Maximum age must be the same as or more than minimum age.");
        if (r.HeightMinCm is not null && r.HeightMaxCm is not null && r.HeightMaxCm < r.HeightMinCm)
            errors.Add("Maximum height must be the same as or more than minimum height.");

        var maritalStatuses = CleanList(r.MaritalStatuses);
        var sects = CleanList(r.Sects);
        var cities = CleanList(r.Cities);

        // Only accept real enum names ("Divorced"), not random text or numbers
        errors.AddRange(maritalStatuses.Where(s => !Enum.GetNames<MaritalStatus>().Contains(s))
            .Select(s => $"Unknown marital status: {s}"));
        errors.AddRange(sects.Where(s => !Enum.GetNames<Sect>().Contains(s))
            .Select(s => $"Unknown sect: {s}"));
        if (cities.Any(c => c.Length > 60)) errors.Add("City names must be 60 characters or less.");

        if (errors.Count > 0) return ServiceResult<MyProfileResponse>.Fail(errors.ToArray());

        // Create on first save, update afterwards
        var pref = profile.PartnerPreference;
        if (pref is null)
        {
            pref = new PartnerPreference { ProfileId = profile.Id };
            db.PartnerPreferences.Add(pref);
            profile.PartnerPreference = pref;
        }

        pref.AgeMin = r.AgeMin;
        pref.AgeMax = r.AgeMax;
        pref.HeightMinCm = r.HeightMinCm;
        pref.HeightMaxCm = r.HeightMaxCm;
        pref.MaritalStatuses = maritalStatuses;
        pref.Sects = sects;
        pref.Cities = cities;
        pref.Education = Clean(r.Education);
        pref.Notes = Clean(r.Notes);

        profile.UpdatedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync();

        return ServiceResult<MyProfileResponse>.Ok(ToResponse(profile));
    }

    // ---------- Submit for admin approval ----------

    public async Task<ServiceResult<MyProfileResponse>> SubmitForApprovalAsync(string userId)
    {
        var profile = await LoadMyProfileAsync(userId);
        if (profile is null) return ServiceResult<MyProfileResponse>.Fail("Profile not found.");

        if (profile.Status == ProfileStatus.PendingApproval)
            return ServiceResult<MyProfileResponse>.Fail("Your profile is already waiting for approval.");
        if (profile.Status == ProfileStatus.Approved)
            return ServiceResult<MyProfileResponse>.Fail("Your profile is already approved.");

        var missing = GetMissingFields(profile);
        if (missing.Count > 0)
            return ServiceResult<MyProfileResponse>.Fail(
                missing.Select(m => $"Please complete: {m}").ToArray());

        profile.Status = ProfileStatus.PendingApproval;
        profile.RejectionReason = null;
        profile.UpdatedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync();

        return ServiceResult<MyProfileResponse>.Ok(ToResponse(profile));
    }

    // ---------- Helpers ----------

    private Task<Profile?> LoadMyProfileAsync(string userId) =>
        db.Profiles
          .Include(p => p.PartnerPreference)
          .FirstOrDefaultAsync(p => p.UserId == userId);

    // What must be filled in before the profile can be submitted
    private static List<string> GetMissingFields(Profile p)
    {
        var missing = new List<string>();
        if (string.IsNullOrWhiteSpace(p.City)) missing.Add("City");
        if (string.IsNullOrWhiteSpace(p.Education)) missing.Add("Education");
        if (string.IsNullOrWhiteSpace(p.Occupation)) missing.Add("Occupation");
        if (p.Sect is null) missing.Add("Sect");
        if (p.Religiosity is null) missing.Add("Religious practice");
        if ((p.AboutMe?.Length ?? 0) < MinAboutMeLength)
            missing.Add($"About (at least {MinAboutMeLength} characters)");
        if (p.PartnerPreference is null) missing.Add("Partner preferences");
        return missing;
    }

    // "  " -> null, " Srinagar " -> "Srinagar"
    private static string? Clean(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static List<string> CleanList(IEnumerable<string>? values) =>
        (values ?? Enumerable.Empty<string>())
            .Where(v => !string.IsNullOrWhiteSpace(v))
            .Select(v => v.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

    private static MyProfileResponse ToResponse(Profile p) => new(
        p.Id,
        p.ProfileFor, p.FirstName, p.LastName, p.ShowLastName,
        p.Gender, p.DateOfBirth, AgeRules.CalculateAge(p.DateOfBirth), p.MaritalStatus, p.HeightCm,
        p.Country, p.State, p.City,
        p.Education, p.Occupation,
        p.Sect, p.Religiosity, p.MotherTongue, p.AboutMe,
        p.FatherOccupation, p.MotherOccupation, p.Brothers, p.Sisters, p.FamilyDetails,
        p.PhotoPrivacy,
        p.Status, p.RejectionReason,
        p.PartnerPreference is null ? null : new PartnerPreferenceResponse(
            p.PartnerPreference.AgeMin, p.PartnerPreference.AgeMax,
            p.PartnerPreference.HeightMinCm, p.PartnerPreference.HeightMaxCm,
            p.PartnerPreference.MaritalStatuses, p.PartnerPreference.Sects, p.PartnerPreference.Cities,
            p.PartnerPreference.Education, p.PartnerPreference.Notes),
        GetMissingFields(p));
}
