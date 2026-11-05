using Matrimony.Application.Common;
using Matrimony.Application.DTOs;
using Matrimony.Application.Interfaces;
using Matrimony.Application.Interfaces.Services;
using Matrimony.Domain.Entities;
using Matrimony.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Matrimony.Application.Services;

// Send / accept / reject / withdraw interests.
// When an interest is accepted, a Conversation is created so the two members can chat (Phase 6).
public class InterestService(IAppDbContext db, IProfileCardService profileCards) : IInterestService
{
    public const int DailySendLimit = 20;

    // ---------- Send ----------

    public async Task<ServiceResult<InterestResponse>> SendAsync(string userId, SendInterestRequest r)
    {
        var me = await db.Profiles.FirstOrDefaultAsync(p => p.UserId == userId);
        if (me is null) return Fail("Profile not found.");
        if (me.Status != ProfileStatus.Approved)
            return Fail("Your profile must be approved before you can send interests.");

        var receiverId = r.ReceiverProfileId!.Value;
        if (receiverId == me.Id) return Fail("You cannot send an interest to yourself.");

        var receiver = await db.Profiles.Include(p => p.User).FirstOrDefaultAsync(p => p.Id == receiverId);
        if (receiver is null || receiver.Status != ProfileStatus.Approved || receiver.User.IsSuspended
            || receiver.Gender == me.Gender || await profileCards.IsBlockedAsync(me.Id, receiver.Id))
            return Fail("This profile is not available.");

        // What already exists between us (either direction)?
        var existing = await db.Interests
            .Where(i => (i.SenderProfileId == me.Id && i.ReceiverProfileId == receiver.Id) ||
                        (i.SenderProfileId == receiver.Id && i.ReceiverProfileId == me.Id))
            .ToListAsync();

        if (existing.Any(i => i.Status == InterestStatus.Accepted))
            return Fail("You are already connected with this member.");
        if (existing.Any(i => i.SenderProfileId == receiver.Id && i.Status == InterestStatus.Pending))
            return Fail($"{receiver.FirstName} has already sent you an interest. You can accept it on your Interests page.");

        var mine = existing.FirstOrDefault(i => i.SenderProfileId == me.Id);
        if (mine?.Status == InterestStatus.Pending) return Fail("You have already sent an interest to this member.");
        if (mine?.Status == InterestStatus.Rejected) return Fail("This member declined your interest earlier.");

        // Anti-spam: limit per 24 hours
        var since = DateTime.UtcNow.AddHours(-24);
        var sentToday = await db.Interests.CountAsync(i => i.SenderProfileId == me.Id && i.CreatedAtUtc > since);
        if (sentToday >= DailySendLimit)
            return Fail($"You can send up to {DailySendLimit} interests a day. Please try again tomorrow.");

        var note = string.IsNullOrWhiteSpace(r.Note) ? null : r.Note.Trim();
        if (mine is not null)
        {
            // I withdrew earlier -> send again by re-using the same row (one row per direction)
            mine.Status = InterestStatus.Pending;
            mine.Note = note;
            mine.CreatedAtUtc = DateTime.UtcNow;
            mine.RespondedAtUtc = null;
        }
        else
        {
            mine = new Interest { SenderProfileId = me.Id, ReceiverProfileId = receiver.Id, Note = note };
            db.Interests.Add(mine);
        }
        await db.SaveChangesAsync();

        return ServiceResult<InterestResponse>.Ok(await ToResponseAsync(mine, me.Id));
    }

    // ---------- Accept / reject (the receiver) ----------

    public async Task<ServiceResult<InterestResponse>> RespondAsync(string userId, int interestId, bool accept)
    {
        var myId = await MyProfileIdAsync(userId);
        if (myId is null) return Fail("Profile not found.");

        var interest = await db.Interests.FirstOrDefaultAsync(i => i.Id == interestId && i.ReceiverProfileId == myId);
        if (interest is null) return Fail("Interest not found.");
        if (interest.Status != InterestStatus.Pending) return Fail("This interest has already been answered.");
        if (await profileCards.IsBlockedAsync(interest.SenderProfileId, interest.ReceiverProfileId))
            return Fail("This profile is not available.");

        interest.Status = accept ? InterestStatus.Accepted : InterestStatus.Rejected;
        interest.RespondedAtUtc = DateTime.UtcNow;

        if (accept)
        {
            // Open a private conversation (smaller profile id first, see Conversation.cs)
            var a = Math.Min(interest.SenderProfileId, interest.ReceiverProfileId);
            var b = Math.Max(interest.SenderProfileId, interest.ReceiverProfileId);
            var exists = await db.Conversations.AnyAsync(c => c.Profile1Id == a && c.Profile2Id == b);
            if (!exists)
                db.Conversations.Add(new Conversation { Interest = interest, Profile1Id = a, Profile2Id = b });
        }

        await db.SaveChangesAsync();
        return ServiceResult<InterestResponse>.Ok(await ToResponseAsync(interest, myId.Value));
    }

    // ---------- Withdraw (the sender, only while pending) ----------

    public async Task<ServiceResult<InterestResponse>> WithdrawAsync(string userId, int interestId)
    {
        var myId = await MyProfileIdAsync(userId);
        if (myId is null) return Fail("Profile not found.");

        var interest = await db.Interests.FirstOrDefaultAsync(i => i.Id == interestId && i.SenderProfileId == myId);
        if (interest is null) return Fail("Interest not found.");
        if (interest.Status != InterestStatus.Pending) return Fail("Only an interest that is still waiting can be withdrawn.");

        interest.Status = InterestStatus.Withdrawn;
        interest.RespondedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync();

        return ServiceResult<InterestResponse>.Ok(await ToResponseAsync(interest, myId.Value));
    }

    // ---------- Lists ----------

    public async Task<IReadOnlyList<InterestResponse>?> ListAsync(string userId, InterestBox box)
    {
        var myId = await MyProfileIdAsync(userId);
        if (myId is null) return null;

        var q = db.Interests.AsNoTracking();
        q = box switch
        {
            InterestBox.Sent => q.Where(i => i.SenderProfileId == myId && i.Status != InterestStatus.Withdrawn),
            InterestBox.Connected => q.Where(i => i.Status == InterestStatus.Accepted &&
                                                  (i.SenderProfileId == myId || i.ReceiverProfileId == myId)),
            _ => q.Where(i => i.ReceiverProfileId == myId && i.Status != InterestStatus.Withdrawn)
        };

        var interests = await q
            .OrderByDescending(i => i.RespondedAtUtc ?? i.CreatedAtUtc)
            .Take(100)
            .ToListAsync();

        return await ToResponsesAsync(interests, myId.Value);
    }

    public async Task<InterestSummaryResponse?> GetSummaryAsync(string userId)
    {
        var myId = await MyProfileIdAsync(userId);
        if (myId is null) return null;

        var mine = db.Interests.Where(i => i.SenderProfileId == myId || i.ReceiverProfileId == myId);
        return new InterestSummaryResponse(
            await mine.CountAsync(i => i.ReceiverProfileId == myId && i.Status == InterestStatus.Pending),
            await mine.CountAsync(i => i.SenderProfileId == myId && i.Status == InterestStatus.Pending),
            await mine.CountAsync(i => i.Status == InterestStatus.Accepted));
    }

    // Used by the profile page: the most relevant interest between two profiles
    public async Task<InterestBetweenResponse?> FindBetweenAsync(int myId, int otherId)
    {
        var rows = await db.Interests.AsNoTracking()
            .Where(i => (i.SenderProfileId == myId && i.ReceiverProfileId == otherId) ||
                        (i.SenderProfileId == otherId && i.ReceiverProfileId == myId))
            .ToListAsync();

        // Accepted beats pending, pending beats a final "no", withdrawn counts as nothing
        var best = rows
            .Where(i => i.Status != InterestStatus.Withdrawn)
            .OrderBy(i => i.Status switch { InterestStatus.Accepted => 0, InterestStatus.Pending => 1, _ => 2 })
            .ThenByDescending(i => i.CreatedAtUtc)
            .FirstOrDefault();

        return best is null
            ? null
            : new InterestBetweenResponse(best.Id, best.SenderProfileId == myId ? InterestDirection.Sent : InterestDirection.Received, best.Status);
    }

    // ---------- Helpers ----------

    private static ServiceResult<InterestResponse> Fail(string error) => ServiceResult<InterestResponse>.Fail(error);

    private Task<int?> MyProfileIdAsync(string userId) =>
        db.Profiles.Where(p => p.UserId == userId).Select(p => (int?)p.Id).FirstOrDefaultAsync();

    private async Task<InterestResponse> ToResponseAsync(Interest interest, int myId) =>
        (await ToResponsesAsync([interest], myId)).Single();

    private async Task<List<InterestResponse>> ToResponsesAsync(List<Interest> interests, int myId)
    {
        var otherIds = interests
            .Select(i => i.SenderProfileId == myId ? i.ReceiverProfileId : i.SenderProfileId)
            .Distinct()
            .ToList();

        // Cards for the other members (hidden if blocked or suspended since)
        var rows = await profileCards.ToRows(db.Profiles.AsNoTracking().Where(p =>
                otherIds.Contains(p.Id) &&
                !p.User.IsSuspended &&
                !db.Blocks.Any(b =>
                    (b.BlockerProfileId == myId && b.BlockedProfileId == p.Id) ||
                    (b.BlockerProfileId == p.Id && b.BlockedProfileId == myId))))
            .ToListAsync();
        var acceptedIds = await profileCards.AcceptedInterestProfileIdsAsync(myId);
        var cards = rows.ToDictionary(x => x.Id, x => profileCards.ToCard(x, acceptedIds));

        return interests
            .Select(i =>
            {
                var otherId = i.SenderProfileId == myId ? i.ReceiverProfileId : i.SenderProfileId;
                return cards.TryGetValue(otherId, out var card)
                    ? new InterestResponse(i.Id, i.SenderProfileId == myId ? InterestDirection.Sent : InterestDirection.Received,
                        i.Status, i.Note, i.CreatedAtUtc, i.RespondedAtUtc, card)
                    : null;
            })
            .Where(x => x is not null)
            .Select(x => x!)
            .ToList();
    }
}
