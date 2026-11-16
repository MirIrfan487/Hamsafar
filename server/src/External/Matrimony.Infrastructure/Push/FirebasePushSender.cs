using FirebaseAdmin;
using FirebaseAdmin.Messaging;
using Google.Apis.Auth.OAuth2;
using Matrimony.Application.Common;
using Matrimony.Application.Interfaces;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Matrimony.Infrastructure.Push;

// Sends push notifications through Firebase Cloud Messaging (FCM), Google's free push service for Android.
// Singleton: the Firebase connection is created once and reused.
public class FirebasePushSender : IPushSender
{
    private readonly FirebaseMessaging? _messaging;   // null = not configured, nothing is sent
    private readonly ILogger<FirebasePushSender> _logger;

    public FirebasePushSender(IOptions<FirebaseSettings> options, ILogger<FirebasePushSender> logger)
    {
        _logger = logger;
        var path = options.Value.CredentialsPath;

        if (string.IsNullOrWhiteSpace(path))
        {
            _logger.LogWarning("Push notifications are off: Firebase:CredentialsPath is not set.");
            return;
        }
        if (!File.Exists(path))
        {
            _logger.LogError("Push notifications are off: Firebase credentials file not found at {Path}.", path);
            return;
        }

        var credential = CredentialFactory.FromFile<ServiceAccountCredential>(path).ToGoogleCredential();
        var app = FirebaseApp.GetInstance("matrimony")
                  ?? FirebaseApp.Create(new AppOptions { Credential = credential }, "matrimony");
        _messaging = FirebaseMessaging.GetMessaging(app);
    }

    public async Task<IReadOnlyList<string>> SendAsync(IReadOnlyList<string> tokens, PushMessage message, CancellationToken ct = default)
    {
        if (_messaging is null || tokens.Count == 0) return [];

        var multicast = new MulticastMessage
        {
            // The app sends FCM registration tokens (@capacitor/push-notifications), so we use Tokens.
            // The SDK marks it obsolete in favour of Fids (installation ids), which the app does not have.
#pragma warning disable CS0618
            Tokens = tokens.ToList(),
#pragma warning restore CS0618
            Notification = new Notification { Title = message.Title, Body = message.Body },
            Data = new Dictionary<string, string> { ["url"] = message.Url },   // read by the app when tapped
            Android = new AndroidConfig
            {
                Priority = Priority.High,
                Notification = new AndroidNotification
                {
                    Tag = message.Tag,     // same tag = replaces the previous notification
                    Color = "#0a1526",     // Hamsafar navy
                },
            },
        };

        var result = await _messaging.SendEachForMulticastAsync(multicast, ct);

        // Collect tokens Firebase says are dead, so the caller can delete them
        var dead = new List<string>();
        for (var i = 0; i < result.Responses.Count; i++)
        {
            var r = result.Responses[i];
            if (r.IsSuccess) continue;
            var code = r.Exception?.MessagingErrorCode;
            if (code is MessagingErrorCode.Unregistered or MessagingErrorCode.InvalidArgument or MessagingErrorCode.SenderIdMismatch)
                dead.Add(tokens[i]);
            else
                _logger.LogWarning(r.Exception, "Push notification failed ({Code}).", code);
        }
        return dead;
    }
}
