using System.ComponentModel.DataAnnotations;
using Matrimony.Domain.Enums;

namespace Matrimony.Application.DTOs;

// ---------- Requests (what the wizard sends) ----------

// PUT /api/profile/me — the wizard sends ALL fields every time it saves a step.
// Only the basics are required here; the rest is checked when the user SUBMITS.
public class UpdateProfileRequest
{
    // Basic
    [Required, EnumDataType(typeof(ProfileFor))] public ProfileFor? ProfileFor { get; set; }
    [Required, MaxLength(50)] public string FirstName { get; set; } = string.Empty;
    [MaxLength(50)] public string? LastName { get; set; }
    public bool ShowLastName { get; set; }
    [Required, EnumDataType(typeof(Gender))] public Gender? Gender { get; set; }
    [Required] public DateOnly? DateOfBirth { get; set; }
    [Required, EnumDataType(typeof(MaritalStatus))] public MaritalStatus? MaritalStatus { get; set; }
    [Range(120, 230)] public int? HeightCm { get; set; }

    // Location
    [MaxLength(60)] public string? Country { get; set; }
    [MaxLength(60)] public string? State { get; set; }
    [MaxLength(60)] public string? City { get; set; }

    // Education & work
    [MaxLength(100)] public string? Education { get; set; }
    [MaxLength(100)] public string? Occupation { get; set; }

    // Religion & about
    [EnumDataType(typeof(Sect))] public Sect? Sect { get; set; }
    [EnumDataType(typeof(Religiosity))] public Religiosity? Religiosity { get; set; }
    [MaxLength(40)] public string? MotherTongue { get; set; }
    [MaxLength(2000)] public string? AboutMe { get; set; }

    // Family
    [MaxLength(100)] public string? FatherOccupation { get; set; }
    [MaxLength(100)] public string? MotherOccupation { get; set; }
    [Range(0, 20)] public int? Brothers { get; set; }
    [Range(0, 20)] public int? Sisters { get; set; }
    [MaxLength(1000)] public string? FamilyDetails { get; set; }

    // Privacy
    [EnumDataType(typeof(PhotoPrivacy))] public PhotoPrivacy? PhotoPrivacy { get; set; }
}

// PUT /api/profile/me/preferences
public class PartnerPreferenceRequest
{
    [Range(18, 80)] public int AgeMin { get; set; } = 18;
    [Range(18, 80)] public int AgeMax { get; set; } = 40;
    [Range(120, 230)] public int? HeightMinCm { get; set; }
    [Range(120, 230)] public int? HeightMaxCm { get; set; }

    // Empty list = "any". Values must be enum names, e.g. "NeverMarried", "Sunni".
    [MaxLength(3)] public List<string> MaritalStatuses { get; set; } = new();
    [MaxLength(4)] public List<string> Sects { get; set; } = new();
    [MaxLength(10)] public List<string> Cities { get; set; } = new();

    [MaxLength(100)] public string? Education { get; set; }
    [MaxLength(500)] public string? Notes { get; set; }
}

// ---------- Responses (what the API sends back) ----------

public record PartnerPreferenceResponse(
    int AgeMin, int AgeMax, int? HeightMinCm, int? HeightMaxCm,
    IReadOnlyList<string> MaritalStatuses, IReadOnlyList<string> Sects, IReadOnlyList<string> Cities,
    string? Education, string? Notes);

// GET /api/profile/me — the owner's full profile (other members will get a smaller, privacy-safe version)
public record MyProfileResponse(
    int Id,
    ProfileFor ProfileFor, string FirstName, string? LastName, bool ShowLastName,
    Gender Gender, DateOnly DateOfBirth, int Age, MaritalStatus MaritalStatus, int? HeightCm,
    string Country, string? State, string City,
    string? Education, string? Occupation,
    Sect? Sect, Religiosity? Religiosity, string? MotherTongue, string? AboutMe,
    string? FatherOccupation, string? MotherOccupation, int? Brothers, int? Sisters, string? FamilyDetails,
    PhotoPrivacy PhotoPrivacy,
    ProfileStatus Status, string? RejectionReason,
    PartnerPreferenceResponse? PartnerPreference,
    IReadOnlyList<string> MissingFields);   // what still needs filling before Submit
