using System.Security.Cryptography;
using System.Text;
using Matrimony.Infrastructure.Payments;
using Microsoft.Extensions.Options;

namespace Matrimony.Tests.Infrastructure;

// The REAL RazorpayGateway signature checks (no internet needed: they are pure calculations).
// Razorpay docs: payment signature = HMAC-SHA256("order_id|payment_id", key_secret) as lowercase hex;
//                webhook signature = HMAC-SHA256(raw body, webhook secret) as lowercase hex.
// The secrets below are made up for the test.
public class RazorpaySignatureTests
{
    private const string KeySecret = "test_key_secret_123";
    private const string WebhookSecret = "test_webhook_secret_456";

    private static RazorpayGateway Gateway(string keySecret = KeySecret, string webhookSecret = WebhookSecret) =>
        new(new HttpClient(), Options.Create(new RazorpaySettings
        {
            KeyId = "rzp_test_abc",
            KeySecret = keySecret,
            WebhookSecret = webhookSecret,
        }));

    // Calculated independently here, the way Razorpay does it
    private static string Sign(string payload, string secret) =>
        Convert.ToHexString(HMACSHA256.HashData(Encoding.UTF8.GetBytes(secret), Encoding.UTF8.GetBytes(payload))).ToLowerInvariant();

    [Fact]
    public void A_correct_payment_signature_passes() =>
        Assert.True(Gateway().VerifyPaymentSignature("order_1", "pay_1", Sign("order_1|pay_1", KeySecret)));

    [Fact]
    public void A_signature_for_another_payment_fails() =>
        Assert.False(Gateway().VerifyPaymentSignature("order_1", "pay_2", Sign("order_1|pay_1", KeySecret)));

    [Fact]
    public void A_signature_made_with_another_secret_fails() =>
        Assert.False(Gateway().VerifyPaymentSignature("order_1", "pay_1", Sign("order_1|pay_1", "guessed_secret")));

    [Theory]
    [InlineData("")]
    [InlineData("not-a-signature")]
    public void Garbage_signatures_fail(string signature) =>
        Assert.False(Gateway().VerifyPaymentSignature("order_1", "pay_1", signature));

    [Fact]
    public void Without_keys_nothing_passes() =>
        Assert.False(Gateway(keySecret: "").VerifyPaymentSignature("order_1", "pay_1", Sign("order_1|pay_1", "")));

    [Fact]
    public void A_correct_webhook_signature_passes()
    {
        const string body = """{"event":"payment.captured"}""";
        Assert.True(Gateway().VerifyWebhookSignature(body, Sign(body, WebhookSecret)));
    }

    [Fact]
    public void A_changed_webhook_body_fails()
    {
        const string body = """{"event":"payment.captured","amount":29900}""";
        var signature = Sign(body, WebhookSecret);
        Assert.False(Gateway().VerifyWebhookSignature(body.Replace("29900", "100"), signature));
    }

    [Fact]
    public void Without_a_webhook_secret_no_webhook_passes()
    {
        const string body = """{"event":"payment.captured"}""";
        Assert.False(Gateway(webhookSecret: "").VerifyWebhookSignature(body, Sign(body, "")));
    }
}
