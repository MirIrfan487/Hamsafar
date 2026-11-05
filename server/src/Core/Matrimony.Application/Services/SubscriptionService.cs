using System.Text.Json;
using Matrimony.Application.Common;
using Matrimony.Application.DTOs;
using Matrimony.Application.Interfaces;
using Matrimony.Application.Interfaces.Services;
using Matrimony.Domain.Entities;
using Matrimony.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Matrimony.Application.Services;

// Plans, Razorpay payments and Premium periods.
//
// Flow:  1) CreateOrderAsync  -> server creates a Razorpay order (amount comes from OUR database)
//        2) browser pays in Razorpay Checkout
//        3) VerifyAsync       -> check signature + ask Razorpay the payment status/amount -> activate
//        4) HandleWebhookAsync -> Razorpay tells us directly (works even if the browser was closed)
// The browser is never trusted to say "I paid".
public class SubscriptionService(IAppDbContext db, IPaymentGateway gateway) : ISubscriptionService
{
    private const string Currency = "INR";

    // ---------- Plans & status ----------

    public async Task<IReadOnlyList<PlanResponse>> GetPlansAsync() =>
        await db.SubscriptionPlans.AsNoTracking()
            .Where(p => p.IsActive)
            .OrderBy(p => p.PriceInPaise)
            .Select(p => new PlanResponse(p.Code, p.Name, p.PriceInPaise, p.DurationDays, p.CanChat, p.CanViewContactDetails, p.InterestsPerMonth))
            .ToListAsync();

    public async Task<MySubscriptionResponse> GetMySubscriptionAsync(string userId)
    {
        var now = DateTime.UtcNow;
        var current = await db.Subscriptions.AsNoTracking()
            .Where(s => s.UserId == userId && s.Status == SubscriptionStatus.Active && s.EndsAtUtc > now)
            .OrderByDescending(s => s.EndsAtUtc)
            .Select(s => new { s.EndsAtUtc, s.StartsAtUtc, PlanName = s.Plan.Name })
            .ToListAsync();

        var isPremium = current.Any(s => s.StartsAtUtc <= now);
        var payments = await db.Payments.AsNoTracking()
            .Where(p => p.UserId == userId && p.Status != PaymentStatus.Created)   // hide unfinished attempts
            .OrderByDescending(p => p.CreatedAtUtc)
            .Take(20)
            .Select(p => new PaymentHistoryItem(p.Id, p.Plan.Name, p.AmountInPaise, p.Status, p.CreatedAtUtc, p.PaidAtUtc))
            .ToListAsync();

        return new MySubscriptionResponse(isPremium, current.FirstOrDefault()?.PlanName, current.FirstOrDefault()?.EndsAtUtc, payments);
    }

    // ---------- 1) Create order ----------

    public async Task<ServiceResult<CreateOrderResponse>> CreateOrderAsync(string userId, string planCode)
    {
        if (!gateway.IsConfigured)
            return ServiceResult<CreateOrderResponse>.Fail("Payments are not set up yet. Add the Razorpay keys (see CLAUDE.md).");

        var plan = await db.SubscriptionPlans.FirstOrDefaultAsync(p => p.Code == planCode && p.IsActive);
        if (plan is null) return ServiceResult<CreateOrderResponse>.Fail("This plan is not available.");

        var me = await db.Profiles.AsNoTracking()
            .Where(p => p.UserId == userId)
            .Select(p => new { p.FirstName, p.User.Email })
            .FirstOrDefaultAsync();
        if (me is null) return ServiceResult<CreateOrderResponse>.Fail("Profile not found.");

        GatewayOrder order;
        try
        {
            var receipt = $"u_{userId[..Math.Min(8, userId.Length)]}_{DateTime.UtcNow:yyyyMMddHHmmss}";   // max 40 chars
            order = await gateway.CreateOrderAsync(plan.PriceInPaise, Currency, receipt);
        }
        catch (PaymentGatewayException ex)
        {
            return ServiceResult<CreateOrderResponse>.Fail(ex.Message);
        }

        db.Payments.Add(new Payment
        {
            UserId = userId,
            PlanId = plan.Id,
            AmountInPaise = plan.PriceInPaise,   // price copied at purchase time
            Currency = Currency,
            RazorpayOrderId = order.Id,
            Status = PaymentStatus.Created
        });
        await db.SaveChangesAsync();

        return ServiceResult<CreateOrderResponse>.Ok(new CreateOrderResponse(
            gateway.PublicKeyId, order.Id, order.AmountInPaise, order.Currency, plan.Name, me.FirstName, me.Email ?? string.Empty));
    }

    // ---------- 3) Verify (after Checkout) ----------

    public async Task<ServiceResult<MySubscriptionResponse>> VerifyAsync(string userId, VerifyPaymentRequest r)
    {
        var payment = await db.Payments.FirstOrDefaultAsync(p => p.RazorpayOrderId == r.RazorpayOrderId && p.UserId == userId);
        if (payment is null) return ServiceResult<MySubscriptionResponse>.Fail("Payment not found.");

        if (payment.Status != PaymentStatus.Paid)
        {
            // a) The signature proves Razorpay created this payment for THIS order
            if (!gateway.VerifyPaymentSignature(r.RazorpayOrderId, r.RazorpayPaymentId, r.RazorpaySignature))
                return ServiceResult<MySubscriptionResponse>.Fail("Payment could not be verified. If money was taken, it will be refunded by Razorpay.");

            // b) Ask Razorpay directly: right order, right amount, money actually taken?
            GatewayPayment? remote;
            try
            {
                remote = await gateway.GetPaymentAsync(r.RazorpayPaymentId);
            }
            catch (PaymentGatewayException ex)
            {
                return ServiceResult<MySubscriptionResponse>.Fail(ex.Message);
            }

            if (remote is null || remote.OrderId != payment.RazorpayOrderId || remote.AmountInPaise != payment.AmountInPaise
                || (remote.Status != "captured" && remote.Status != "authorized"))
                return ServiceResult<MySubscriptionResponse>.Fail("Payment is not complete yet. Please try again in a minute.");

            await ActivateAsync(payment, r.RazorpayPaymentId);
        }

        return ServiceResult<MySubscriptionResponse>.Ok(await GetMySubscriptionAsync(userId));
    }

    // ---------- 4) Webhook from Razorpay ----------

    // Returns false if the signature is wrong (the controller answers 400)
    public async Task<bool> HandleWebhookAsync(string body, string? signature)
    {
        if (string.IsNullOrEmpty(signature) || !gateway.VerifyWebhookSignature(body, signature)) return false;

        using var doc = JsonDocument.Parse(body);
        var root = doc.RootElement;
        var eventName = root.GetProperty("event").GetString();

        if (!root.TryGetProperty("payload", out var payload) ||
            !payload.TryGetProperty("payment", out var paymentEl) ||
            !paymentEl.TryGetProperty("entity", out var entity))
            return true;   // an event we do not use

        var paymentId = entity.GetProperty("id").GetString();
        var orderId = entity.TryGetProperty("order_id", out var o) ? o.GetString() : null;
        var amount = entity.GetProperty("amount").GetInt32();
        if (paymentId is null || orderId is null) return true;

        var payment = await db.Payments.FirstOrDefaultAsync(p => p.RazorpayOrderId == orderId);
        if (payment is null || payment.Status == PaymentStatus.Paid) return true;   // unknown, or already done

        if ((eventName == "payment.captured" || eventName == "order.paid") && amount == payment.AmountInPaise)
        {
            await ActivateAsync(payment, paymentId);
        }
        else if (eventName == "payment.failed" && payment.Status == PaymentStatus.Created)
        {
            payment.Status = PaymentStatus.Failed;
            await db.SaveChangesAsync();
        }
        return true;
    }

    // ---------- Helpers ----------

    // Marks the payment Paid and adds a Premium period. Renewals start when the current one ends.
    private async Task ActivateAsync(Payment payment, string razorpayPaymentId)
    {
        var plan = await db.SubscriptionPlans.FirstAsync(p => p.Id == payment.PlanId);
        var now = DateTime.UtcNow;

        var currentEnd = await db.Subscriptions
            .Where(s => s.UserId == payment.UserId && s.Status == SubscriptionStatus.Active && s.EndsAtUtc > now)
            .MaxAsync(s => (DateTime?)s.EndsAtUtc);
        var start = currentEnd ?? now;

        payment.Status = PaymentStatus.Paid;
        payment.RazorpayPaymentId = razorpayPaymentId;
        payment.PaidAtUtc = now;

        db.Subscriptions.Add(new Subscription
        {
            UserId = payment.UserId,
            PlanId = plan.Id,
            PaymentId = payment.Id,
            StartsAtUtc = start,
            EndsAtUtc = start.AddDays(plan.DurationDays),
            Status = SubscriptionStatus.Active
        });

        try
        {
            await db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            // The browser and the webhook activated the same payment at the same moment.
            // The unique index on Subscriptions.PaymentId stopped the duplicate; the other one already succeeded.
        }
    }
}
