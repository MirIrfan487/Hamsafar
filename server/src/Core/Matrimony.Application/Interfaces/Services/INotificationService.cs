using Matrimony.Application.Common;

namespace Matrimony.Application.Interfaces.Services;

// Push notifications to a member's phones. Implemented by NotificationService (Application/Services).
// Never throws: a failed notification must never break the action that caused it (sending an interest, a message...).
public interface INotificationService
{
    Task NotifyUserAsync(string userId, PushMessage message);
    Task NotifyProfileAsync(int profileId, PushMessage message);
}
