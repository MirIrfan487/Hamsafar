namespace Matrimony.Api.Models;

// A member blocks another (table: Blocks).
// Blocked people can't see each other in search, send interests or chat.
public class Block
{
    public int Id { get; set; }

    public int BlockerProfileId { get; set; }
    public Profile Blocker { get; set; } = null!;

    public int BlockedProfileId { get; set; }
    public Profile Blocked { get; set; } = null!;

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
