using Matrimony.Domain.Enums;

namespace Matrimony.Domain.Entities;

// A photo belonging to a profile (table: ProfilePhotos).
// Every photo needs admin approval before other members can see it.
public class ProfilePhoto
{
    public int Id { get; set; }

    public int ProfileId { get; set; }
    public Profile Profile { get; set; } = null!;

    public string FilePath { get; set; } = string.Empty;  // where the image file is stored
    public bool IsMain { get; set; }                       // the photo shown on profile cards
    public PhotoStatus Status { get; set; } = PhotoStatus.Pending;

    public DateTime UploadedAtUtc { get; set; } = DateTime.UtcNow;
}
