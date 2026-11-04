namespace Matrimony.Api.Models;

// The matrimonial profile shown to other members (table: Profiles).
// Kept separate from AppUser so login data and profile data don't mix.
public class Profile
{
    public int Id { get; set; }

    // Link to the login account (one-to-one)
    public string UserId { get; set; } = string.Empty;
    public AppUser User { get; set; } = null!;

    // Basic
    public ProfileFor ProfileFor { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string? LastName { get; set; }
    public bool ShowLastName { get; set; }           // privacy: hide last name by default
    public Gender Gender { get; set; }
    public DateOnly DateOfBirth { get; set; }        // age is calculated from this; must be 18+
    public MaritalStatus MaritalStatus { get; set; }
    public int? HeightCm { get; set; }

    // Location
    public string Country { get; set; } = "India";
    public string? State { get; set; }
    public string City { get; set; } = string.Empty;

    // Education & work
    public string? Education { get; set; }
    public string? Occupation { get; set; }

    // Religion & background
    public Sect Sect { get; set; }
    public Religiosity Religiosity { get; set; }
    public string? MotherTongue { get; set; }
    public string? AboutMe { get; set; }

    // Privacy & moderation
    public PhotoPrivacy PhotoPrivacy { get; set; } = PhotoPrivacy.AllMembers;
    public ProfileStatus Status { get; set; } = ProfileStatus.Draft;
    public string? RejectionReason { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;

    // One profile has many photos
    public List<ProfilePhoto> Photos { get; set; } = new();

    // One profile has one set of partner preferences
    public PartnerPreference? PartnerPreference { get; set; }
}
