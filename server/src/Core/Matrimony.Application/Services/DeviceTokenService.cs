using Matrimony.Application.DTOs;
using Matrimony.Application.Interfaces;
using Matrimony.Application.Interfaces.Services;
using Matrimony.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Matrimony.Application.Services;

// Saves which phones belong to which member, so the server knows where to send push notifications.
public class DeviceTokenService(IAppDbContext db) : IDeviceTokenService
{
    // Old phones are dropped so one account cannot collect endless tokens
    private const int MaxDevicesPerUser = 10;

    public async Task RegisterAsync(string userId, RegisterDeviceRequest request)
    {
        var token = request.Token.Trim();
        var existing = await db.DeviceTokens.FirstOrDefaultAsync(d => d.Token == token);

        if (existing is null)
        {
            db.DeviceTokens.Add(new DeviceToken { UserId = userId, Token = token, Platform = request.Platform!.Value });
        }
        else
        {
            // Same phone again (app restarted) or another account logged in on this phone:
            // the phone now belongs to whoever is logged in, so the previous account stops getting its notifications.
            existing.UserId = userId;
            existing.Platform = request.Platform!.Value;
            existing.LastSeenAtUtc = DateTime.UtcNow;
        }
        await db.SaveChangesAsync();

        // Keep only the most recently seen phones of this member
        var extra = await db.DeviceTokens
            .Where(d => d.UserId == userId)
            .OrderByDescending(d => d.LastSeenAtUtc)
            .Skip(MaxDevicesPerUser)
            .ToListAsync();
        if (extra.Count > 0)
        {
            db.DeviceTokens.RemoveRange(extra);
            await db.SaveChangesAsync();
        }
    }

    public async Task UnregisterAsync(string userId, string token)
    {
        // Only the owner can remove it (someone else's token is simply ignored)
        var device = await db.DeviceTokens.FirstOrDefaultAsync(d => d.Token == token.Trim() && d.UserId == userId);
        if (device is null) return;
        db.DeviceTokens.Remove(device);
        await db.SaveChangesAsync();
    }
}
