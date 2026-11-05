import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import ErrorAlert from '../components/ErrorAlert'
import SecurePhoto from '../components/SecurePhoto'
import { useChat } from '../hooks/useChat'
import { ApiError } from '../services/api'
import { chatApi, type ChatMessage, type ConversationSummary } from '../services/chat'
import type { ProfileCard } from '../services/search'
import { formatChatTime, formatMessageTime } from '../utils/date'

const PAGE_SIZE = 50 // same as ChatService.PageSize

const errorMessages = (err: unknown) =>
  err instanceof ApiError ? err.messages : ['Could not reach the server. Is the API running?']

function Avatar({ profile, online, size = 'h-11 w-11' }: { profile: ProfileCard; online?: boolean; size?: string }) {
  return (
    <span className={`relative shrink-0 ${size}`}>
      {profile.photoId ? (
        <SecurePhoto photoId={profile.photoId} alt="" className={`${size} rounded-full object-cover`} />
      ) : (
        <span className={`flex ${size} items-center justify-center rounded-full bg-peach-100 font-bold text-brand-700`}>
          {profile.displayName.slice(0, 1).toUpperCase()}
        </span>
      )}
      {online && (
        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 ring-2 ring-white" aria-label="Online" />
      )}
    </span>
  )
}

// /chat and /chat/:conversationId   (also /chat?with=<profileId> to open the chat with a member)
export default function ChatPage() {
  const { conversationId } = useParams()
  const activeId = conversationId ? Number(conversationId) : null
  const [searchParams] = useSearchParams()
  const withProfile = searchParams.get('with')
  const navigate = useNavigate()
  const { connected, on, presence, refreshUnread, sendTyping } = useChat()

  const [conversations, setConversations] = useState<ConversationSummary[] | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [loadingThread, setLoadingThread] = useState(false)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [otherTyping, setOtherTyping] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  // Refs let the live-event handlers read the latest values without re-subscribing
  const activeIdRef = useRef(activeId)
  const conversationsRef = useRef(conversations)
  useEffect(() => {
    activeIdRef.current = activeId
    conversationsRef.current = conversations
  })

  const active = conversations?.find((c) => c.id === activeId) ?? null
  const isOnline = (c: ConversationSummary) => presence.get(c.otherProfile.id) ?? c.isOnline

  const loadList = useCallback(() => {
    chatApi
      .list()
      .then(setConversations)
      .catch((err) => setErrors(errorMessages(err)))
  }, [])

  const markRead = useCallback(
    (id: number) => {
      chatApi
        .markRead(id)
        .then(() => {
          refreshUnread()
          setConversations((prev) => prev?.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c)) ?? prev)
        })
        .catch(() => {})
    },
    [refreshUnread],
  )

  // Put a new message at the top of the list
  const bumpConversation = (msg: ChatMessage, countAsUnread: boolean) =>
    setConversations((prev) => {
      const conv = prev?.find((c) => c.id === msg.conversationId)
      if (!prev || !conv) return prev
      const updated: ConversationSummary = {
        ...conv,
        lastMessage: msg.body,
        lastMessageSenderProfileId: msg.senderProfileId,
        lastMessageAtUtc: msg.sentAtUtc,
        unreadCount: countAsUnread ? conv.unreadCount + 1 : conv.unreadCount,
      }
      return [updated, ...prev.filter((c) => c.id !== conv.id)]
    })

  // 1) Chat list
  useEffect(() => {
    loadList()
  }, [loadList])

  // 2) /chat?with=12 -> open the conversation with profile 12
  useEffect(() => {
    if (!withProfile || !conversations) return
    const match = conversations.find((c) => c.otherProfile.id === Number(withProfile))
    if (match) navigate(`/chat/${match.id}`, { replace: true })
  }, [withProfile, conversations, navigate])

  // 3) Open a conversation: load the latest messages and mark them read
  useEffect(() => {
    setMessages([])
    setDraft('')
    setOtherTyping(false)
    if (activeId === null) return
    let cancelled = false
    setLoadingThread(true)
    setErrors([])
    chatApi
      .messages(activeId)
      .then((list) => {
        if (cancelled) return
        setMessages(list)
        setHasMore(list.length === PAGE_SIZE)
        markRead(activeId)
      })
      .catch((err) => !cancelled && setErrors(errorMessages(err)))
      .finally(() => !cancelled && setLoadingThread(false))
    return () => {
      cancelled = true
    }
  }, [activeId, markRead])

  // 4) Live events from the hub
  useEffect(() => {
    if (!connected) return

    const offMessage = on('ReceiveMessage', (msg: ChatMessage) => {
      const conv = conversationsRef.current?.find((c) => c.id === msg.conversationId)
      if (!conv) return loadList() // a brand-new conversation
      const fromThem = msg.senderProfileId === conv.otherProfile.id
      const isActive = msg.conversationId === activeIdRef.current

      if (isActive) {
        setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]))
        if (fromThem) {
          setOtherTyping(false)
          markRead(msg.conversationId)
        }
      }
      bumpConversation(msg, fromThem && !isActive)
    })

    const offRead = on('MessagesRead', (convId: number, readAtUtc: string) => {
      if (convId !== activeIdRef.current) return
      const otherId = conversationsRef.current?.find((c) => c.id === convId)?.otherProfile.id
      setMessages((prev) => prev.map((m) => (m.senderProfileId !== otherId && !m.readAtUtc ? { ...m, readAtUtc } : m)))
    })

    const offTyping = on('Typing', (convId: number) => {
      if (convId === activeIdRef.current) setOtherTyping(true)
    })

    return () => {
      offMessage()
      offRead()
      offTyping()
    }
  }, [connected, on, loadList, markRead])

  // "typing…" disappears after 4 seconds without a new signal
  useEffect(() => {
    if (!otherTyping) return
    const t = setTimeout(() => setOtherTyping(false), 4000)
    return () => clearTimeout(t)
  }, [otherTyping])

  // Keep the newest message in view
  const lastId = messages.length ? messages[messages.length - 1].id : 0
  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [lastId, otherTyping])

  const loadOlder = async () => {
    if (!activeId || messages.length === 0) return
    setLoadingOlder(true)
    try {
      const older = await chatApi.messages(activeId, messages[0].id)
      setMessages((prev) => [...older, ...prev])
      setHasMore(older.length === PAGE_SIZE)
    } catch (err) {
      setErrors(errorMessages(err))
    } finally {
      setLoadingOlder(false)
    }
  }

  const send = async () => {
    const body = draft.trim()
    if (!body || !activeId || sending) return
    setSending(true)
    setErrors([])
    try {
      const msg = await chatApi.send(activeId, body)
      setDraft('')
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]))
      bumpConversation(msg, false)
    } catch (err) {
      setErrors(errorMessages(err))
    } finally {
      setSending(false)
    }
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    send()
  }

  // Enter sends, Shift+Enter makes a new line
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const lastMineReadId = [...messages].reverse().find((m) => active && m.senderProfileId !== active.otherProfile.id)
  const showSeenOn = lastMineReadId?.readAtUtc ? lastMineReadId.id : null

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="grid h-[calc(100vh-9rem)] min-h-[480px] overflow-hidden rounded-2xl bg-white ring-1 ring-peach-200 md:grid-cols-[320px_1fr]">
        {/* ---------- Conversation list ---------- */}
        <aside className={`${activeId ? 'hidden md:flex' : 'flex'} min-h-0 flex-col border-r border-peach-100`}>
          <div className="flex items-center justify-between border-b border-peach-100 px-4 py-3">
            <h1 className="text-lg font-bold text-ink">Messages</h1>
            <span className="flex items-center gap-1.5 text-xs text-ink-soft">
              <span className={`h-2 w-2 rounded-full ${connected ? 'bg-green-500' : 'bg-gray-300'}`} />
              {connected ? 'Live' : 'Connecting…'}
            </span>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {conversations === null && <p className="p-4 text-sm text-ink-soft">Loading…</p>}
            {conversations?.length === 0 && (
              <div className="p-6 text-center text-sm text-ink-soft">
                <p>When an interest is accepted, you can chat here.</p>
                <Link to="/interests" className="mt-3 inline-block font-semibold text-brand-700 hover:underline">
                  Go to Interests
                </Link>
              </div>
            )}
            <ul>
              {conversations?.map((c) => {
                const selected = c.id === activeId
                const mineLast = c.lastMessageSenderProfileId !== null && c.lastMessageSenderProfileId !== c.otherProfile.id
                return (
                  <li key={c.id}>
                    <Link
                      to={`/chat/${c.id}`}
                      className={`flex items-center gap-3 px-4 py-3 hover:bg-peach-50 ${selected ? 'bg-brand-50' : ''}`}
                      aria-current={selected ? 'page' : undefined}
                    >
                      <Avatar profile={c.otherProfile} online={isOnline(c)} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className="truncate font-semibold text-ink">{c.otherProfile.displayName}</span>
                          {c.lastMessageAtUtc && <span className="shrink-0 text-xs text-ink-soft">{formatChatTime(c.lastMessageAtUtc)}</span>}
                        </span>
                        <span className="flex items-center justify-between gap-2">
                          <span className={`truncate text-sm ${c.unreadCount ? 'font-semibold text-ink' : 'text-ink-soft'}`}>
                            {c.lastMessage ? `${mineLast ? 'You: ' : ''}${c.lastMessage}` : 'Say salaam to start the conversation'}
                          </span>
                          {c.unreadCount > 0 && (
                            <span className="shrink-0 rounded-full bg-accent-500 px-1.5 text-xs font-semibold text-white">{c.unreadCount}</span>
                          )}
                        </span>
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        </aside>

        {/* ---------- Conversation ---------- */}
        <section className={`${activeId ? 'flex' : 'hidden md:flex'} min-h-0 flex-col`}>
          {activeId === null && (
            <div className="m-auto max-w-xs p-6 text-center text-sm text-ink-soft">Choose a conversation to start chatting.</div>
          )}

          {activeId !== null && conversations !== null && !active && (
            <div className="m-auto p-6 text-center text-sm text-ink-soft">
              This conversation is not available.{' '}
              <Link to="/chat" className="font-semibold text-brand-700 hover:underline">
                Back to messages
              </Link>
            </div>
          )}

          {active && (
            <>
              <header className="flex items-center gap-3 border-b border-peach-100 px-4 py-3">
                <Link to="/chat" className="text-sm font-medium text-brand-600 md:hidden" aria-label="Back to all messages">
                  Back
                </Link>
                <Avatar profile={active.otherProfile} online={isOnline(active)} size="h-10 w-10" />
                <div className="min-w-0">
                  <Link to={`/profiles/${active.otherProfile.id}`} className="block truncate font-semibold text-ink hover:text-brand-700">
                    {active.otherProfile.displayName}, {active.otherProfile.age}
                  </Link>
                  <p className="text-xs text-ink-soft">{otherTyping ? 'typing…' : isOnline(active) ? 'Online' : active.otherProfile.city}</p>
                </div>
              </header>

              <div ref={listRef} className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-peach-50/50 px-4 py-4" aria-live="polite">
                <p className="mx-auto max-w-sm text-center text-xs text-ink-soft">
                  Keep conversations respectful and involve your families. Never send money to anyone you meet here.
                </p>

                {hasMore && (
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={loadOlder}
                      disabled={loadingOlder}
                      className="rounded-full bg-white px-3 py-1 text-xs font-medium text-brand-700 ring-1 ring-peach-200 hover:bg-peach-50 disabled:opacity-60"
                    >
                      {loadingOlder ? 'Loading…' : 'Load earlier messages'}
                    </button>
                  </div>
                )}

                {loadingThread && <p className="text-center text-sm text-ink-soft">Loading messages…</p>}

                {messages.map((m) => {
                  const mine = m.senderProfileId !== active.otherProfile.id
                  return (
                    <div key={m.id} className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
                      <div
                        className={`max-w-[80%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm ${
                          mine ? 'rounded-br-md bg-brand-600 text-white' : 'rounded-bl-md bg-white text-ink ring-1 ring-peach-200'
                        }`}
                      >
                        {m.body}
                      </div>
                      <span className="mt-0.5 px-1 text-[11px] text-ink-soft" title={new Date(m.sentAtUtc).toLocaleString()}>
                        {formatMessageTime(m.sentAtUtc)}
                        {m.id === showSeenOn && ' · Seen'}
                      </span>
                    </div>
                  )
                })}

                {otherTyping && <p className="text-xs italic text-ink-soft">{active.otherProfile.displayName} is typing…</p>}
              </div>

              <div className="border-t border-peach-100 p-3">
                <ErrorAlert messages={errors} />
                {active.canSend ? (
                  <form onSubmit={handleSubmit} className="mt-2 flex items-end gap-2">
                    <label htmlFor="chat-input" className="sr-only">
                      Message
                    </label>
                    <textarea
                      id="chat-input"
                      value={draft}
                      onChange={(e) => {
                        setDraft(e.target.value)
                        sendTyping(active.id)
                      }}
                      onKeyDown={handleKeyDown}
                      maxLength={2000}
                      rows={1}
                      placeholder="Write a message"
                      className="max-h-32 min-h-[42px] flex-1 resize-none rounded-xl border border-gray-300 px-3 py-2 text-sm text-ink focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                    />
                    <button
                      type="submit"
                      disabled={sending || !draft.trim()}
                      className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
                    >
                      {sending ? 'Sending…' : 'Send'}
                    </button>
                  </form>
                ) : (
                  <p className="mt-2 text-center text-sm text-ink-soft">You can no longer send messages in this conversation.</p>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
