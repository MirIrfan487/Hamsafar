import { apiRequest } from './api'
import type { ProfileCard } from './search'

export interface ChatMessage {
  id: number
  conversationId: number
  senderProfileId: number
  body: string
  sentAtUtc: string
  readAtUtc: string | null
}

export interface ConversationSummary {
  id: number
  otherProfile: ProfileCard
  lastMessage: string | null
  lastMessageSenderProfileId: number | null
  lastMessageAtUtc: string | null
  unreadCount: number
  canSend: boolean
  isOnline: boolean
}

export const chatApi = {
  list: () => apiRequest<ConversationSummary[]>('/conversations', { auth: true }),
  unreadCount: () => apiRequest<{ count: number }>('/conversations/unread-count', { auth: true }),
  messages: (conversationId: number, before?: number) =>
    apiRequest<ChatMessage[]>(`/conversations/${conversationId}/messages${before ? `?before=${before}` : ''}`, { auth: true }),
  send: (conversationId: number, body: string) =>
    apiRequest<ChatMessage>(`/conversations/${conversationId}/messages`, { method: 'POST', body: { body }, auth: true }),
  markRead: (conversationId: number) => apiRequest<void>(`/conversations/${conversationId}/read`, { method: 'POST', auth: true }),
}
