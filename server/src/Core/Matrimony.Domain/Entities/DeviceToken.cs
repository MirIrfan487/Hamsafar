using Matrimony.Domain.Enums;

namespace Matrimony.Domain.Entities;

// A phone that may receive push notifications for a member (table: DeviceTokens).
// The app gets the Token from Firebase Cloud Messaging and sends it to us after login.
// One member can have several phones; one phone (token) belongs to one account at a time.
public class DeviceToken
{
    public int Id { get; set; }

    public string UserId { get; set; } = string.Empty;
    public AppUser User { get; set; } = null!;

    public string Token { get; set; } = string.Empty;
    public DevicePlatform Platform { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime LastSeenAtUtc { get; set; } = DateTime.UtcNow;   // updated each time the app registers again
}
