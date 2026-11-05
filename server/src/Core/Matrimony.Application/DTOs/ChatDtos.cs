using System.ComponentModel.DataAnnotations;

namespace Matrimony.Application.DTOs;

// One chat message. The client compares SenderProfileId with the other member's id to know "mine or theirs".
public record ChatMessageResponse(long Id, int ConversationId, int SenderProfileId, string Body, DateTime SentAtUtc, DateTime? ReadAtUtc);

// One row in the chat list. LastMessage is null unless BOTH members have Premium.
public record ConversationSummaryResponse(
    int Id,
    ProfileCardResponse OtherProfile,
    string? LastMessage,
    int? LastMessageSenderProfileId,
    DateTime? LastMessageAtUtc,
    int UnreadCount,
    bool CanSend,        // connected AND both members have Premium
    bool IAmPremium,     // BOTH need Premium to read and send messages
    bool OtherIsPremium,
    bool IsOnline);

// POST /api/conversations/{id}/messages
public class SendMessageRequest
{
    [Required, MaxLength(2000)] public string Body { get; set; } = string.Empty;
}

// Returned to the controller so it can push the message live to both people
public record SentMessageResult(ChatMessageResponse Message, string SenderUserId, string RecipientUserId);

// Returned after marking messages as read, so the sender can see "Seen"
public record ReadReceiptResult(int ConversationId, string OtherUserId, DateTime ReadAtUtc, int Count);

public record UnreadCountResponse(int Count);

// For online/offline updates: my profile id + the user ids of everyone I can chat with
public record PresenceInfo(int MyProfileId, IReadOnlyList<string> PartnerUserIds);
