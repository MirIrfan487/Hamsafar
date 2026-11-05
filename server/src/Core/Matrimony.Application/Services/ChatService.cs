using Matrimony.Application.Common;
using Matrimony.Application.DTOs;
using Matrimony.Application.Interfaces;
using Matrimony.Domain.Entities;
using Matrimony.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Matrimony.Application.Services;

// Private chat between connected members (a Conversation is created when an interest is accepted).
public class ChatService(IAppDbContext db, IPresenceTracker presence)
{
    public const int MaxMessageLength = 2000;
    public const int MaxMessagesPerMinute = 30;   // simple anti-spam
    public const int PageSize = 50;

    // ---------- Conversation list ----------

    public async Task<IReadOnlyList<ConversationSummaryResponse>?> ListAsync(string userId)
    {
        var me = await MyProfileIdAsync(userId);
        if (me is null) return null;

        var convs = await db.Conversations.AsNoTracking()
            .Where(c => c.Profile1Id == me || c.Profile2Id == me)
            .Select(c => new
            {
                c.Id,
                OtherId = c.Profile1Id == me ? c.Profile2Id : c.Profile1Id,
                InterestAccepted = c.Interest.Status == InterestStatus.Accepted,
                c.CreatedAtUtc,
                Last = c.Messages
                    .OrderByDescending(m => m.Id)
                    .Select(m => new { m.Body, m.SenderProfileId, m.SentAtUtc })
                    .FirstOrDefault(),
                Unread = c.Messages.Count(m => m.SenderProfileId != me && m.ReadAtUtc == null)
            })
            .ToListAsync();

        var otherIds = convs.Select(c => c.OtherId).ToList();
        var blockedIds = await BlockedWithMeAsync(me.Value, otherIds);

        var others = await db.Profiles.AsNoTracking()
            .Where(p => otherIds.Contains(p.Id))
            .Select(p => new { p.Id, p.UserId, p.User.IsSuspended })
            .ToDictionaryAsync(p => p.Id);
        var acceptedIds = await ProfileCards.AcceptedInterestProfileIdsAsync(db, me.Value);
        var cards = (await ProfileCards.ToRows(db.Profiles.AsNoTracking().Where(p => otherIds.Contains(p.Id))).ToListAsync())
            .ToDictionary(x => x.Id, x => ProfileCards.ToCard(x, acceptedIds));

        return convs
            .Where(c => !blockedIds.Contains(c.OtherId) && cards.ContainsKey(c.OtherId))   // blocked chats disappear
            .OrderByDescending(c => c.Last?.SentAtUtc ?? c.CreatedAtUtc)
            .Select(c =>
            {
                var other = others[c.OtherId];
                return new ConversationSummaryResponse(
                    c.Id, cards[c.OtherId],
                    c.Last?.Body, c.Last?.SenderProfileId, c.Last?.SentAtUtc,
                    c.Unread,
                    CanSend: c.InterestAccepted && !other.IsSuspended,
                    IsOnline: presence.IsOnline(other.UserId));
            })
            .ToList();
    }

    // ---------- Messages ----------

    // Newest page first, or the page before message `beforeId` ("Load earlier messages")
    public async Task<IReadOnlyList<ChatMessageResponse>?> GetMessagesAsync(string userId, int conversationId, long? beforeId)
    {
        var access = await GetAccessAsync(userId, conversationId);
        if (access is null) return null;

        var page = await db.Messages.AsNoTracking()
            .Where(m => m.ConversationId == conversationId && (beforeId == null || m.Id < beforeId))
            .OrderByDescending(m => m.Id)
            .Take(PageSize)
            .Select(m => new ChatMessageResponse(m.Id, m.ConversationId, m.SenderProfileId, m.Body, m.SentAtUtc, m.ReadAtUtc))
            .ToListAsync();

        page.Reverse();   // oldest at the top
        return page;
    }

    public async Task<ServiceResult<SentMessageResult>> SendAsync(string userId, int conversationId, string body)
    {
        var access = await GetAccessAsync(userId, conversationId);
        if (access is null) return ServiceResult<SentMessageResult>.Fail("Conversation not found.");
        if (!access.CanSend) return ServiceResult<SentMessageResult>.Fail("You can no longer send messages in this conversation.");

        var text = body?.Trim() ?? string.Empty;
        if (text.Length == 0) return ServiceResult<SentMessageResult>.Fail("Please type a message.");
        if (text.Length > MaxMessageLength)
            return ServiceResult<SentMessageResult>.Fail($"Messages can be up to {MaxMessageLength} characters.");

        var oneMinuteAgo = DateTime.UtcNow.AddMinutes(-1);
        var recent = await db.Messages.CountAsync(m => m.SenderProfileId == access.MyProfileId && m.SentAtUtc > oneMinuteAgo);
        if (recent >= MaxMessagesPerMinute)
            return ServiceResult<SentMessageResult>.Fail("You are sending messages too quickly. Please wait a moment.");

        var message = new Message { ConversationId = conversationId, SenderProfileId = access.MyProfileId, Body = text };
        db.Messages.Add(message);

        var conversation = await db.Conversations.FirstAsync(c => c.Id == conversationId);
        conversation.LastMessageAtUtc = message.SentAtUtc;

        await db.SaveChangesAsync();

        var dto = new ChatMessageResponse(message.Id, conversationId, message.SenderProfileId, message.Body, message.SentAtUtc, null);
        return ServiceResult<SentMessageResult>.Ok(new SentMessageResult(dto, userId, access.OtherUserId));
    }

    // Marks the other person's messages in this conversation as read
    public async Task<ReadReceiptResult?> MarkReadAsync(string userId, int conversationId)
    {
        var access = await GetAccessAsync(userId, conversationId);
        if (access is null) return null;

        var unread = await db.Messages
            .Where(m => m.ConversationId == conversationId && m.SenderProfileId != access.MyProfileId && m.ReadAtUtc == null)
            .ToListAsync();

        var now = DateTime.UtcNow;
        foreach (var m in unread) m.ReadAtUtc = now;
        if (unread.Count > 0) await db.SaveChangesAsync();

        return new ReadReceiptResult(conversationId, access.OtherUserId, now, unread.Count);
    }

    public async Task<int> GetUnreadCountAsync(string userId)
    {
        var me = await MyProfileIdAsync(userId);
        if (me is null) return 0;

        return await db.Messages.CountAsync(m =>
            m.ReadAtUtc == null &&
            m.SenderProfileId != me &&
            (m.Conversation.Profile1Id == me || m.Conversation.Profile2Id == me) &&
            !db.Blocks.Any(b =>
                (b.BlockerProfileId == me && b.BlockedProfileId == m.SenderProfileId) ||
                (b.BlockerProfileId == m.SenderProfileId && b.BlockedProfileId == me)));
    }

    // For "typing…": the other person's user id, or null if this user is not in the conversation
    public async Task<string?> GetOtherUserIdAsync(string userId, int conversationId) =>
        (await GetAccessAsync(userId, conversationId)) is { CanSend: true } access ? access.OtherUserId : null;

    // For online/offline updates
    public async Task<PresenceInfo?> GetPresenceInfoAsync(string userId)
    {
        var me = await MyProfileIdAsync(userId);
        if (me is null) return null;

        var partnerUserIds = await db.Conversations.AsNoTracking()
            .Where(c => (c.Profile1Id == me || c.Profile2Id == me) && c.Interest.Status == InterestStatus.Accepted)
            .Select(c => c.Profile1Id == me ? c.Profile2.UserId : c.Profile1.UserId)
            .ToListAsync();

        return new PresenceInfo(me.Value, partnerUserIds);
    }

    // ---------- Helpers ----------

    private record Access(int MyProfileId, string OtherUserId, bool CanSend);

    // Null = this user is not in the conversation (or it is hidden because of a block)
    private async Task<Access?> GetAccessAsync(string userId, int conversationId)
    {
        var me = await db.Profiles.AsNoTracking()
            .Where(p => p.UserId == userId)
            .Select(p => new { p.Id, p.User.IsSuspended })
            .FirstOrDefaultAsync();
        if (me is null) return null;

        var c = await db.Conversations.AsNoTracking()
            .Where(x => x.Id == conversationId && (x.Profile1Id == me.Id || x.Profile2Id == me.Id))
            .Select(x => new
            {
                OtherId = x.Profile1Id == me.Id ? x.Profile2Id : x.Profile1Id,
                OtherUserId = x.Profile1Id == me.Id ? x.Profile2.UserId : x.Profile1.UserId,
                OtherSuspended = x.Profile1Id == me.Id ? x.Profile2.User.IsSuspended : x.Profile1.User.IsSuspended,
                InterestAccepted = x.Interest.Status == InterestStatus.Accepted
            })
            .FirstOrDefaultAsync();
        if (c is null) return null;

        if (await ProfileCards.IsBlockedAsync(db, me.Id, c.OtherId)) return null;

        return new Access(me.Id, c.OtherUserId, CanSend: c.InterestAccepted && !c.OtherSuspended && !me.IsSuspended);
    }

    private Task<int?> MyProfileIdAsync(string userId) =>
        db.Profiles.Where(p => p.UserId == userId).Select(p => (int?)p.Id).FirstOrDefaultAsync();

    private async Task<HashSet<int>> BlockedWithMeAsync(int me, List<int> otherIds)
    {
        var rows = await db.Blocks
            .Where(b => (b.BlockerProfileId == me && otherIds.Contains(b.BlockedProfileId)) ||
                        (b.BlockedProfileId == me && otherIds.Contains(b.BlockerProfileId)))
            .Select(b => b.BlockerProfileId == me ? b.BlockedProfileId : b.BlockerProfileId)
            .ToListAsync();
        return rows.ToHashSet();
    }
}
