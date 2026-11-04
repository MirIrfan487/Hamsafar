namespace Matrimony.Api.Models;

// One member sends an interest to another (table: Interests).
// Chat is only allowed after the receiver ACCEPTS.
public class Interest
{
    public int Id { get; set; }

    public int SenderProfileId { get; set; }
    public Profile Sender { get; set; } = null!;

    public int ReceiverProfileId { get; set; }
    public Profile Receiver { get; set; } = null!;

    public InterestStatus Status { get; set; } = InterestStatus.Pending;
    public string? Note { get; set; }   // optional short message with the interest

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? RespondedAtUtc { get; set; }
}
