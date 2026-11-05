using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Matrimony.Application.Common;
using Matrimony.Application.Interfaces;
using Microsoft.Extensions.Options;

namespace Matrimony.Infrastructure.Payments;

// Talks to the Razorpay REST API (https://api.razorpay.com/v1) with Basic auth (key id + secret).
public class RazorpayGateway(HttpClient http, IOptions<RazorpaySettings> options) : IPaymentGateway
{
    private RazorpaySettings Settings => options.Value;

    public bool IsConfigured => !string.IsNullOrWhiteSpace(Settings.KeyId) && !string.IsNullOrWhiteSpace(Settings.KeySecret);
    public string PublicKeyId => Settings.KeyId;

    public async Task<GatewayOrder> CreateOrderAsync(int amountInPaise, string currency, string receipt, CancellationToken cancellationToken = default)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "orders")
        {
            Content = JsonContent.Create(new { amount = amountInPaise, currency, receipt })
        };
        request.Headers.Authorization = BasicAuth();

        using var response = await SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode)
            throw new PaymentGatewayException($"Razorpay could not create the order ({(int)response.StatusCode}). Check the API keys.");

        var json = await response.Content.ReadFromJsonAsync<JsonElement>(cancellationToken);
        return new GatewayOrder(
            json.GetProperty("id").GetString()!,
            json.GetProperty("amount").GetInt32(),
            json.GetProperty("currency").GetString()!);
    }

    public async Task<GatewayPayment?> GetPaymentAsync(string paymentId, CancellationToken cancellationToken = default)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, $"payments/{Uri.EscapeDataString(paymentId)}");
        request.Headers.Authorization = BasicAuth();

        using var response = await SendAsync(request, cancellationToken);
        if (response.StatusCode is HttpStatusCode.NotFound or HttpStatusCode.BadRequest) return null;
        if (!response.IsSuccessStatusCode)
            throw new PaymentGatewayException($"Razorpay could not be reached ({(int)response.StatusCode}). Please try again.");

        var json = await response.Content.ReadFromJsonAsync<JsonElement>(cancellationToken);
        var orderId = json.TryGetProperty("order_id", out var o) && o.ValueKind == JsonValueKind.String ? o.GetString() : null;
        return new GatewayPayment(
            json.GetProperty("id").GetString()!,
            orderId,
            json.GetProperty("amount").GetInt32(),
            json.GetProperty("status").GetString() ?? string.Empty);
    }

    // Razorpay docs: signature = HMAC-SHA256(order_id + "|" + payment_id, key_secret), as hex
    public bool VerifyPaymentSignature(string orderId, string paymentId, string signature) =>
        IsConfigured && Verify($"{orderId}|{paymentId}", signature, Settings.KeySecret);

    // Razorpay docs: X-Razorpay-Signature = HMAC-SHA256(raw request body, webhook secret), as hex
    public bool VerifyWebhookSignature(string body, string signature) =>
        !string.IsNullOrWhiteSpace(Settings.WebhookSecret) && Verify(body, signature, Settings.WebhookSecret);

    private static bool Verify(string payload, string signature, string secret)
    {
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        var expected = Convert.ToHexString(hmac.ComputeHash(Encoding.UTF8.GetBytes(payload))).ToLowerInvariant();
        // Constant-time compare, so the time taken does not leak how many characters matched
        return CryptographicOperations.FixedTimeEquals(Encoding.UTF8.GetBytes(expected), Encoding.UTF8.GetBytes(signature ?? string.Empty));
    }

    private AuthenticationHeaderValue BasicAuth() =>
        new("Basic", Convert.ToBase64String(Encoding.ASCII.GetBytes($"{Settings.KeyId}:{Settings.KeySecret}")));

    private async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        try
        {
            return await http.SendAsync(request, cancellationToken);
        }
        catch (HttpRequestException)
        {
            throw new PaymentGatewayException("Could not connect to Razorpay. Please check your internet connection.");
        }
    }
}
