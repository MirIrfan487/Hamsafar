using Matrimony.Application.Common;
using Matrimony.Application.Interfaces;
using Matrimony.Application.Interfaces.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Matrimony.Application.Services;

// Finds the member's phones (DeviceTokens), sends through IPushSender, and deletes tokens that stopped working.
public class NotificationService(IAppDbContext db, IPushSender pushSender, ILogger<NotificationService> logger) : INotificationService
{
    public async Task NotifyProfileAsync(int profileId, PushMessage message)
    {
        var userId = await db.Profiles.Where(p => p.Id == profileId).Select(p => p.UserId).FirstOrDefaultAsync();
        if (userId is not null) await NotifyUserAsync(userId, message);
    }

    public async Task NotifyUserAsync(string userId, PushMessage message)
    {
        try
        {
            // Suspended members get nothing
            var suspended = await db.Profiles.Where(p => p.UserId == userId).Select(p => p.User.IsSuspended).FirstOrDefaultAsync();
            if (suspended) return;

            var tokens = await db.DeviceTokens.Where(d => d.UserId == userId).Select(d => d.Token).ToListAsync();
            if (tokens.Count == 0) return;   // no phone with the app: nothing to do

            var dead = await pushSender.SendAsync(tokens, message);
            if (dead.Count > 0)
            {
                await db.DeviceTokens.Where(d => dead.Contains(d.Token)).ExecuteDeleteAsync();
            }
        }
        catch (Exception ex)
        {
            // Logged, not thrown: the interest / message was already saved and must still succeed
            logger.LogWarning(ex, "Could not send a push notification to user {UserId}.", userId);
        }
    }
}
