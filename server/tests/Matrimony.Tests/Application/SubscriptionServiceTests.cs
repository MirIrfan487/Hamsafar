using Matrimony.Application.DTOs;
using Matrimony.Application.Services;
using Matrimony.Domain.Entities;
using Matrimony.Domain.Enums;
using Matrimony.Persistence;
using Matrimony.Tests.Helpers;
using Microsoft.EntityFrameworkCore;

namespace Matrimony.Tests.Application;

// Payment rules from CLAUDE.md (Phase 7): "Never trust payment status from the frontend; verify on the server."
//  - the price comes from our database, not the browser
//  - Premium starts only after the signature AND Razorpay itself confirm the right order, amount and status
//  - the browser and the webhook can both report the same payment: Premium is added once
//  - renewals start when the current Premium ends
public class SubscriptionServiceTests : IDisposable
{
    private const string PlanCode = "PREMIUM_MONTHLY";   // seeded: Rs 299 = 29900 paise, 30 days
    private const int PlanPrice = 29900;

    private readonly TestDatabase _database = new();
    private readonly FakePaymentGateway _razorpay = new();

    public void Dispose() => _database.Dispose();

    private SubscriptionService NewService(AppDbContext db) => new(db, _razorpay);

    private async Task<Profile> AddMemberAsync()
    {
        using var db = _database.NewContext();
        return await TestData.AddMemberAsync(db, Gender.Male);
    }

    private async Task<string> CreateOrderAsync(Profile member)
    {
        using var db = _database.NewContext();
        var result = await NewService(db).CreateOrderAsync(member.UserId, PlanCode);
        Assert.True(result.Succeeded, string.Join(", ", result.Errors));
        return result.Value!.OrderId;
    }

    private async Task<Matrimony.Application.Common.ServiceResult<MySubscriptionResponse>> VerifyAsync(
        Profile member, string orderId, string paymentId = "pay_1", string signature = "good_sig")
    {
        using var db = _database.NewContext();
        return await NewService(db).VerifyAsync(member.UserId, new VerifyPaymentRequest
        {
            RazorpayOrderId = orderId,
            RazorpayPaymentId = paymentId,
            RazorpaySignature = signature,
        });
    }

    private async Task<(Payment Payment, List<Subscription> Subscriptions)> ReadAsync(string orderId)
    {
        using var db = _database.NewContext();
        var payment = await db.Payments.SingleAsync(p => p.RazorpayOrderId == orderId);
        var subscriptions = await db.Subscriptions.Where(s => s.UserId == payment.UserId).ToListAsync();
        return (payment, subscriptions);
    }

    // ---------- 1) Create order ----------

    [Fact]
    public async Task The_order_amount_comes_from_the_plan_in_our_database()
    {
        var member = await AddMemberAsync();

        var orderId = await CreateOrderAsync(member);

        Assert.Equal(PlanPrice, Assert.Single(_razorpay.CreatedOrders).AmountInPaise);
        var (payment, subscriptions) = await ReadAsync(orderId);
        Assert.Equal(PaymentStatus.Created, payment.Status);
        Assert.Equal(PlanPrice, payment.AmountInPaise);
        Assert.Empty(subscriptions);   // nothing is activated just by creating an order
    }

    [Fact]
    public async Task Unknown_plans_are_refused()
    {
        var member = await AddMemberAsync();
        using var db = _database.NewContext();

        Assert.False((await NewService(db).CreateOrderAsync(member.UserId, "FREE_FOREVER")).Succeeded);
        Assert.Empty(_razorpay.CreatedOrders);
    }

    [Fact]
    public async Task No_order_when_Razorpay_keys_are_missing()
    {
        var member = await AddMemberAsync();
        _razorpay.IsConfigured = false;
        using var db = _database.NewContext();

        Assert.False((await NewService(db).CreateOrderAsync(member.UserId, PlanCode)).Succeeded);
    }

    // ---------- 3) Verify after Checkout ----------

    [Fact]
    public async Task A_verified_payment_gives_30_days_of_Premium()
    {
        var member = await AddMemberAsync();
        var orderId = await CreateOrderAsync(member);
        _razorpay.ApprovePayment(orderId, "pay_1", PlanPrice);

        var result = await VerifyAsync(member, orderId);

        Assert.True(result.Succeeded, string.Join(", ", result.Errors));
        Assert.True(result.Value!.IsPremium);
        var (payment, subscriptions) = await ReadAsync(orderId);
        Assert.Equal(PaymentStatus.Paid, payment.Status);
        Assert.Equal("pay_1", payment.RazorpayPaymentId);
        var subscription = Assert.Single(subscriptions);
        Assert.Equal(30, (subscription.EndsAtUtc - subscription.StartsAtUtc).TotalDays, precision: 3);
        Assert.Equal(payment.Id, subscription.PaymentId);
    }

    [Theory]
    [InlineData("captured")]
    [InlineData("authorized")]
    public async Task Captured_and_authorized_payments_both_count(string razorpayStatus)
    {
        var member = await AddMemberAsync();
        var orderId = await CreateOrderAsync(member);
        _razorpay.ApprovePayment(orderId, "pay_1", PlanPrice, razorpayStatus);

        Assert.True((await VerifyAsync(member, orderId)).Succeeded);
    }

    [Fact]
    public async Task A_wrong_signature_activates_nothing()
    {
        var member = await AddMemberAsync();
        var orderId = await CreateOrderAsync(member);
        _razorpay.ApprovePayment(orderId, "pay_1", PlanPrice);

        var result = await VerifyAsync(member, orderId, signature: "forged_by_the_browser");

        Assert.False(result.Succeeded);
        var (payment, subscriptions) = await ReadAsync(orderId);
        Assert.Equal(PaymentStatus.Created, payment.Status);
        Assert.Empty(subscriptions);
    }

    [Fact]
    public async Task A_smaller_amount_than_the_plan_activates_nothing()
    {
        var member = await AddMemberAsync();
        var orderId = await CreateOrderAsync(member);
        _razorpay.ApprovePayment(orderId, "pay_1", amountInPaise: 100);   // Rs 1 instead of Rs 299

        Assert.False((await VerifyAsync(member, orderId)).Succeeded);
        Assert.Empty((await ReadAsync(orderId)).Subscriptions);
    }

    [Fact]
    public async Task A_payment_made_for_another_order_activates_nothing()
    {
        var member = await AddMemberAsync();
        var orderId = await CreateOrderAsync(member);
        // Valid signature for this order, but Razorpay says the payment belongs to a different order
        _razorpay.SignaturesThatAreValid.Add($"{orderId}|pay_1|good_sig");
        _razorpay.RemotePayments["pay_1"] = new("pay_1", "order_someone_else", PlanPrice, "captured");

        Assert.False((await VerifyAsync(member, orderId)).Succeeded);
        Assert.Empty((await ReadAsync(orderId)).Subscriptions);
    }

    [Theory]
    [InlineData("created")]
    [InlineData("failed")]
    [InlineData("refunded")]
    public async Task Unfinished_or_failed_payments_activate_nothing(string razorpayStatus)
    {
        var member = await AddMemberAsync();
        var orderId = await CreateOrderAsync(member);
        _razorpay.ApprovePayment(orderId, "pay_1", PlanPrice, razorpayStatus);

        Assert.False((await VerifyAsync(member, orderId)).Succeeded);
        Assert.Empty((await ReadAsync(orderId)).Subscriptions);
    }

    [Fact]
    public async Task Nobody_can_verify_someone_elses_order()
    {
        var buyer = await AddMemberAsync();
        var other = await AddMemberAsync();
        var orderId = await CreateOrderAsync(buyer);
        _razorpay.ApprovePayment(orderId, "pay_1", PlanPrice);

        var result = await VerifyAsync(other, orderId);

        Assert.False(result.Succeeded);
        using var db = _database.NewContext();
        Assert.Empty(db.Subscriptions);
    }

    [Fact]
    public async Task Verifying_the_same_payment_twice_adds_Premium_once()
    {
        var member = await AddMemberAsync();
        var orderId = await CreateOrderAsync(member);
        _razorpay.ApprovePayment(orderId, "pay_1", PlanPrice);

        Assert.True((await VerifyAsync(member, orderId)).Succeeded);
        Assert.True((await VerifyAsync(member, orderId)).Succeeded);   // e.g. the page was reloaded

        Assert.Single((await ReadAsync(orderId)).Subscriptions);
    }

    [Fact]
    public async Task A_renewal_starts_when_the_current_Premium_ends()
    {
        var member = await AddMemberAsync();
        using (var setup = _database.NewContext())
            await TestData.AddPremiumAsync(setup, member, endsInDays: 10);
        var orderId = await CreateOrderAsync(member);
        _razorpay.ApprovePayment(orderId, "pay_1", PlanPrice);

        await VerifyAsync(member, orderId);

        var subscriptions = (await ReadAsync(orderId)).Subscriptions.OrderBy(s => s.EndsAtUtc).ToList();
        Assert.Equal(2, subscriptions.Count);
        Assert.Equal(subscriptions[0].EndsAtUtc, subscriptions[1].StartsAtUtc);   // no days lost
    }

    // ---------- 4) Webhook from Razorpay ----------

    // The same JSON shape Razorpay sends: { "event": ..., "payload": { "payment": { "entity": { id, order_id, amount } } } }
    private static string WebhookBody(string eventName, string orderId, int amount, string paymentId = "pay_1") =>
        System.Text.Json.JsonSerializer.Serialize(new
        {
            @event = eventName,
            payload = new { payment = new { entity = new { id = paymentId, order_id = orderId, amount } } },
        });

    private async Task<bool> WebhookAsync(string body)
    {
        using var db = _database.NewContext();
        return await NewService(db).HandleWebhookAsync(body, "signature-header");
    }

    [Fact]
    public async Task A_webhook_with_a_bad_signature_is_rejected()
    {
        var member = await AddMemberAsync();
        var orderId = await CreateOrderAsync(member);
        _razorpay.WebhookSignatureIsValid = false;

        Assert.False(await WebhookAsync(WebhookBody("payment.captured", orderId, PlanPrice)));   // the API answers 400
        Assert.Empty((await ReadAsync(orderId)).Subscriptions);
    }

    [Fact]
    public async Task A_captured_webhook_activates_Premium_even_if_the_browser_was_closed()
    {
        var member = await AddMemberAsync();
        var orderId = await CreateOrderAsync(member);

        Assert.True(await WebhookAsync(WebhookBody("payment.captured", orderId, PlanPrice)));

        var (payment, subscriptions) = await ReadAsync(orderId);
        Assert.Equal(PaymentStatus.Paid, payment.Status);
        Assert.Single(subscriptions);
    }

    [Fact]
    public async Task A_webhook_with_the_wrong_amount_activates_nothing()
    {
        var member = await AddMemberAsync();
        var orderId = await CreateOrderAsync(member);

        await WebhookAsync(WebhookBody("payment.captured", orderId, amount: 100));

        Assert.Empty((await ReadAsync(orderId)).Subscriptions);
    }

    [Fact]
    public async Task Browser_and_webhook_reporting_the_same_payment_add_Premium_once()
    {
        var member = await AddMemberAsync();
        var orderId = await CreateOrderAsync(member);
        _razorpay.ApprovePayment(orderId, "pay_1", PlanPrice);

        await VerifyAsync(member, orderId);
        await WebhookAsync(WebhookBody("payment.captured", orderId, PlanPrice));
        await WebhookAsync(WebhookBody("order.paid", orderId, PlanPrice));

        Assert.Single((await ReadAsync(orderId)).Subscriptions);
    }

    [Fact]
    public async Task A_failed_webhook_marks_the_payment_failed()
    {
        var member = await AddMemberAsync();
        var orderId = await CreateOrderAsync(member);

        await WebhookAsync(WebhookBody("payment.failed", orderId, PlanPrice));

        var (payment, subscriptions) = await ReadAsync(orderId);
        Assert.Equal(PaymentStatus.Failed, payment.Status);
        Assert.Empty(subscriptions);
    }
}
