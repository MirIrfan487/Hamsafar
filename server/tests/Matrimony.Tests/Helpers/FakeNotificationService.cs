using Matrimony.Application.Common;
using Matrimony.Application.Interfaces.Services;

namespace Matrimony.Tests.Helpers;

// Stands in for the real NotificationService: nothing is sent to Firebase,
// it only remembers who would have been notified, so tests can check it.
public class FakeNotificationService : INotificationService
{
    public List<(int ProfileId, PushMessage Message)> ToProfiles { get; } = [];
    public List<(string UserId, PushMessage Message)> ToUsers { get; } = [];

    public Task NotifyProfileAsync(int profileId, PushMessage message)
    {
        ToProfiles.Add((profileId, message));
        return Task.CompletedTask;
    }

    public Task NotifyUserAsync(string userId, PushMessage message)
    {
        ToUsers.Add((userId, message));
        return Task.CompletedTask;
    }
}
