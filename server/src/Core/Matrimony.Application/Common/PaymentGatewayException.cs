namespace Matrimony.Application.Common;

// Thrown when Razorpay cannot be reached or rejects a request. The message is safe to show.
public class PaymentGatewayException(string message) : Exception(message);
