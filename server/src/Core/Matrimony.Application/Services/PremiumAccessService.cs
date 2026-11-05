using Matrimony.Application.Interfaces;
using Matrimony.Application.Interfaces.Services;
using Matrimony.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Matrimony.Application.Services;

// "Does this user have an active plan that allows X?" in one place.
// Injected as IPremiumAccessService (registered automatically).
public class PremiumAccessService(IAppDbContext db) : IPremiumAccessService
{
    public Task<bool> CanChatAsync(string userId)
    {
        var now = DateTime.UtcNow;
        return db.Subscriptions.AnyAsync(s =>
            s.UserId == userId && s.Status == SubscriptionStatus.Active &&
            s.StartsAtUtc <= now && s.EndsAtUtc > now && s.Plan.CanChat);
    }

    public Task<bool> CanViewContactsAsync(string userId)
    {
        var now = DateTime.UtcNow;
        return db.Subscriptions.AnyAsync(s =>
            s.UserId == userId && s.Status == SubscriptionStatus.Active &&
            s.StartsAtUtc <= now && s.EndsAtUtc > now && s.Plan.CanViewContactDetails);
    }

    // Of these users, which ones can chat right now?
    public async Task<HashSet<string>> UsersWhoCanChatAsync(IEnumerable<string> userIds)
    {
        var ids = userIds.Distinct().ToList();
        var now = DateTime.UtcNow;
        var rows = await db.Subscriptions
            .Where(s => ids.Contains(s.UserId) && s.Status == SubscriptionStatus.Active &&
                        s.StartsAtUtc <= now && s.EndsAtUtc > now && s.Plan.CanChat)
            .Select(s => s.UserId)
            .Distinct()
            .ToListAsync();
        return rows.ToHashSet();
    }
}
