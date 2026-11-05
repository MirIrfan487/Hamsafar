using Matrimony.Application.Common;
using Matrimony.Application.DTOs;
using Matrimony.Domain.Enums;

namespace Matrimony.Application.Interfaces.Services;

// Conversations and messages between connected members. Implemented by ChatService (Application/Services).
public interface IChatService
{
    Task<IReadOnlyList<ConversationSummaryResponse>?> ListAsync(string userId);
    Task<ServiceResult<IReadOnlyList<ChatMessageResponse>>> GetMessagesAsync(string userId, int conversationId, long? beforeId);
    Task<ServiceResult<SentMessageResult>> SendAsync(string userId, int conversationId, string body);
    Task<ReadReceiptResult?> MarkReadAsync(string userId, int conversationId);
    Task<int> GetUnreadCountAsync(string userId);
    Task<string?> GetOtherUserIdAsync(string userId, int conversationId);
    Task<PresenceInfo?> GetPresenceInfoAsync(string userId);
}
