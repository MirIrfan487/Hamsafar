namespace Matrimony.Api.Models;

// A private chat between two members (table: Conversations).
// Created automatically when an interest is accepted.
public class Conversation
{
    public int Id { get; set; }

    // The accepted interest that allowed this chat
    public int InterestId { get; set; }
    public Interest Interest { get; set; } = null!;

    // Rule: we always store the SMALLER profile id in Profile1Id.
    // That way the same pair can never have two conversations.
    public int Profile1Id { get; set; }
    public Profile Profile1 { get; set; } = null!;

    public int Profile2Id { get; set; }
    public Profile Profile2 { get; set; } = null!;

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? LastMessageAtUtc { get; set; }   // for sorting the chat list

    public List<Message> Messages { get; set; } = new();
}
