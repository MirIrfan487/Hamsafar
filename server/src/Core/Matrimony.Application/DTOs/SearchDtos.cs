using System.ComponentModel.DataAnnotations;
using Matrimony.Domain.Enums;

namespace Matrimony.Application.DTOs;

// GET /api/profiles/search?ageMin=24&ageMax=30&maritalStatuses=NeverMarried&city=Srinagar&page=1
// Gender is NOT a filter: members always see the opposite gender.
public class SearchRequest
{
    [Range(18, 80)] public int? AgeMin { get; set; }
    [Range(18, 80)] public int? AgeMax { get; set; }
    [Range(120, 230)] public int? HeightMinCm { get; set; }
    [Range(120, 230)] public int? HeightMaxCm { get; set; }

    public List<MaritalStatus> MaritalStatuses { get; set; } = new();   // empty = any
    public List<Sect> Sects { get; set; } = new();
    public List<Religiosity> Religiosities { get; set; } = new();

    [MaxLength(60)] public string? City { get; set; }        // "contains" match
    [MaxLength(100)] public string? Education { get; set; }  // "contains" match

    public bool WithPhotoOnly { get; set; }

    public SearchSort Sort { get; set; } = SearchSort.Newest;

    [Range(1, 1000)] public int Page { get; set; } = 1;
    [Range(1, 48)] public int PageSize { get; set; } = 12;
}

public enum SearchSort
{
    Newest,     // most recently joined first
    Youngest,
    Oldest
}

public record PagedResult<T>(IReadOnlyList<T> Items, int Page, int PageSize, int TotalCount)
{
    public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PageSize);
}

// A search result card. Only safe, public fields — never email, phone or exact date of birth.
public record ProfileCardResponse(
    int Id,
    string DisplayName,
    int Age,
    int? HeightCm,
    string City,
    string? State,
    string? Education,
    string? Occupation,
    MaritalStatus MaritalStatus,
    Sect? Sect,
    Religiosity? Religiosity,
    ProfileFor ProfileFor,
    int? PhotoId,          // set only if THIS viewer may see the photo
    bool PhotoLocked);     // true = there is a photo, but it shows after an interest is accepted

// GET /api/profiles/{id} — the full profile another member sees
public record ProfileDetailResponse(
    int Id,
    string DisplayName,
    bool IsOwnProfile,
    ProfileStatus Status,          // only meaningful for your own profile
    ProfileFor ProfileFor,
    Gender Gender,
    int Age,
    MaritalStatus MaritalStatus,
    int? HeightCm,
    string Country, string? State, string City,
    string? Education, string? Occupation,
    Sect? Sect, Religiosity? Religiosity, string? MotherTongue, string? AboutMe,
    string? FatherOccupation, string? MotherOccupation, int? Brothers, int? Sisters, string? FamilyDetails,
    PartnerPreferenceResponse? PartnerPreference,
    IReadOnlyList<int> PhotoIds,   // photos THIS viewer may see (main photo first)
    bool PhotosLocked,
    InterestBetweenResponse? Interest,   // the interest between you and this member, if any
    bool ViewerIsApproved);              // only approved members can send interests
