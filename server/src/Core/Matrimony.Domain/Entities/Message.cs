namespace Matrimony.Domain.Entities;

// One chat message (table: Messages). long Id because there will be many rows.
public class Message
{
    public long Id { get; set; }

    public int ConversationId { get; set; }
    public Conversation Conversation { get; set; } = null!;

    public int SenderProfileId { get; set; }
    public Profile Sender { get; set; } = null!;

    public string Body { get; set; } = string.Empty;

    public DateTime SentAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? ReadAtUtc { get; set; }   // null = not read yet (for read receipts)
}
