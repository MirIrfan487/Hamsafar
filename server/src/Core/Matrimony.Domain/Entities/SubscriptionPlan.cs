namespace Matrimony.Domain.Entities;

// A plan users can buy (table: SubscriptionPlans). Admin can change prices later.
public class SubscriptionPlan
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;   // e.g. "PREMIUM_MONTHLY"
    public string Name { get; set; } = string.Empty;

    // Money is stored in PAISE as a whole number (₹299 = 29900).
    // Razorpay also works in paise, and integers avoid rounding errors.
    public int PriceInPaise { get; set; }
    public int DurationDays { get; set; }

    // What the plan unlocks
    public bool CanChat { get; set; }
    public bool CanViewContactDetails { get; set; }
    public int? InterestsPerMonth { get; set; }   // null = unlimited

    public bool IsActive { get; set; } = true;
}
