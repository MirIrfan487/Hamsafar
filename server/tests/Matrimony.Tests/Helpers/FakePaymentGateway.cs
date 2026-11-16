using Matrimony.Application.Interfaces;

namespace Matrimony.Tests.Helpers;

// Stands in for Razorpay in SubscriptionService tests: no internet, no keys.
// Tests decide what "Razorpay" answers:
//  - SignaturesThatAreValid: which "orderId|paymentId|signature" combinations pass
//  - RemotePayments:          what Razorpay reports for a payment id (null = unknown)
//  - WebhookSignatureIsValid: whether a webhook's signature passes
public class FakePaymentGateway : IPaymentGateway
{
    private int _orders;

    public bool IsConfigured { get; set; } = true;
    public string PublicKeyId => "rzp_test_fake";

    public HashSet<string> SignaturesThatAreValid { get; } = [];
    public Dictionary<string, GatewayPayment> RemotePayments { get; } = [];
    public bool WebhookSignatureIsValid { get; set; } = true;

    // Remembers the amount each order was created with (to check the server, not the browser, sets it)
    public List<GatewayOrder> CreatedOrders { get; } = [];

    public Task<GatewayOrder> CreateOrderAsync(int amountInPaise, string currency, string receipt, CancellationToken cancellationToken = default)
    {
        var order = new GatewayOrder($"order_test_{++_orders}", amountInPaise, currency);
        CreatedOrders.Add(order);
        return Task.FromResult(order);
    }

    public bool VerifyPaymentSignature(string orderId, string paymentId, string signature) =>
        SignaturesThatAreValid.Contains($"{orderId}|{paymentId}|{signature}");

    public bool VerifyWebhookSignature(string body, string signature) => WebhookSignatureIsValid;

    public Task<GatewayPayment?> GetPaymentAsync(string paymentId, CancellationToken cancellationToken = default) =>
        Task.FromResult(RemotePayments.GetValueOrDefault(paymentId));

    // Shortcut for the normal case: Razorpay says this payment is captured for this order and amount,
    // and the browser sends the matching signature "good_sig".
    public void ApprovePayment(string orderId, string paymentId, int amountInPaise, string status = "captured")
    {
        SignaturesThatAreValid.Add($"{orderId}|{paymentId}|good_sig");
        RemotePayments[paymentId] = new GatewayPayment(paymentId, orderId, amountInPaise, status);
    }
}
