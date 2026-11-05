namespace Matrimony.Application.Interfaces;

// The payment provider (Razorpay). Implemented in Infrastructure (RazorpayGateway).
public interface IPaymentGateway
{
    bool IsConfigured { get; }   // false if the API keys are missing
    string PublicKeyId { get; }  // the "key_id" the browser needs to open checkout (safe to share)

    Task<GatewayOrder> CreateOrderAsync(int amountInPaise, string currency, string receipt, CancellationToken cancellationToken = default);

    // Checks the signature Razorpay gives the browser after payment
    bool VerifyPaymentSignature(string orderId, string paymentId, string signature);

    // Checks the X-Razorpay-Signature header on webhooks
    bool VerifyWebhookSignature(string body, string signature);

    // Asks Razorpay directly about a payment (null if not found)
    Task<GatewayPayment?> GetPaymentAsync(string paymentId, CancellationToken cancellationToken = default);
}

public record GatewayOrder(string Id, int AmountInPaise, string Currency);

// Status is Razorpay's: "created", "authorized", "captured", "refunded" or "failed"
public record GatewayPayment(string Id, string? OrderId, int AmountInPaise, string Status);
