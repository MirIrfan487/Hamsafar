namespace Matrimony.Infrastructure.Payments;

// "Razorpay" section. Put the REAL values in User Secrets (never in appsettings.json / Git):
// Visual Studio -> right-click Matrimony.Api -> Manage User Secrets.
public class RazorpaySettings
{
    public string KeyId { get; set; } = string.Empty;          // rzp_test_... (test mode)
    public string KeySecret { get; set; } = string.Empty;      // secret — server only
    public string WebhookSecret { get; set; } = string.Empty;  // the secret you type when creating the webhook
}
