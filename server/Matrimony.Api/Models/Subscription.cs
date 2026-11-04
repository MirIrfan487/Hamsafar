namespace Matrimony.Api.Models;

// A user's active (or past) premium period (table: Subscriptions).
// Created only after a payment is verified.
public class Subscription
{
    public int Id { get; set; }

    public string UserId { get; set; } = string.Empty;
    public AppUser User { get; set; } = null!;

    public int PlanId { get; set; }
    public SubscriptionPlan Plan { get; set; } = null!;

    public int? PaymentId { get; set; }   // the payment that paid for it
    public Payment? Payment { get; set; }

    public DateTime StartsAtUtc { get; set; }
    public DateTime EndsAtUtc { get; set; }
    public SubscriptionStatus Status { get; set; } = SubscriptionStatus.Active;
}
