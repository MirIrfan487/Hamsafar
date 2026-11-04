using Matrimony.Domain.Enums;

namespace Matrimony.Domain.Entities;

// A payment attempt through Razorpay (table: Payments).
// Status becomes Paid ONLY after the server verifies Razorpay's signature.
public class Payment
{
    public int Id { get; set; }

    public string UserId { get; set; } = string.Empty;
    public AppUser User { get; set; } = null!;

    public int PlanId { get; set; }
    public SubscriptionPlan Plan { get; set; } = null!;

    public int AmountInPaise { get; set; }   // copied from the plan at the time of purchase
    public string Currency { get; set; } = "INR";

    public string RazorpayOrderId { get; set; } = string.Empty;
    public string? RazorpayPaymentId { get; set; }

    public PaymentStatus Status { get; set; } = PaymentStatus.Created;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? PaidAtUtc { get; set; }
}
