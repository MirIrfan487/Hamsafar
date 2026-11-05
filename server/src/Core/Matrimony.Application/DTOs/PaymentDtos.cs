using System.ComponentModel.DataAnnotations;
using Matrimony.Domain.Enums;

namespace Matrimony.Application.DTOs;

public record PlanResponse(
    string Code, string Name, int PriceInPaise, int DurationDays,
    bool CanChat, bool CanViewContactDetails, int? InterestsPerMonth);

public record PaymentHistoryItem(int Id, string PlanName, int AmountInPaise, PaymentStatus Status, DateTime CreatedAtUtc, DateTime? PaidAtUtc);

public record MySubscriptionResponse(
    bool IsPremium,
    string? PlanName,
    DateTime? PremiumUntilUtc,              // the latest end date (renewals stack)
    IReadOnlyList<PaymentHistoryItem> Payments);

// POST /api/payments/order
public class CreateOrderRequest
{
    [Required, MaxLength(40)] public string PlanCode { get; set; } = string.Empty;
}

// What the browser needs to open Razorpay Checkout
public record CreateOrderResponse(
    string KeyId, string OrderId, int AmountInPaise, string Currency,
    string PlanName, string PrefillName, string PrefillEmail);

// POST /api/payments/verify — the three values Razorpay Checkout returns after payment
public class VerifyPaymentRequest
{
    [Required, MaxLength(50)] public string RazorpayOrderId { get; set; } = string.Empty;
    [Required, MaxLength(50)] public string RazorpayPaymentId { get; set; } = string.Empty;
    [Required, MaxLength(200)] public string RazorpaySignature { get; set; } = string.Empty;
}

// GET /api/profiles/{id}/contact (Premium + connected)
public record ContactDetailsResponse(string? Email, string? PhoneNumber);
