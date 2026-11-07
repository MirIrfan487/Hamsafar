import { Fragment, useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import ErrorAlert from '../components/ErrorAlert'
import { Avatar, DayDivider, MessageBubble, NoConversation, Openers, PremiumLock, TypingBubble } from '../components/chat/ChatParts'
import { useChat } from '../hooks/useChat'
import { ApiError } from '../services/api'
import { chatApi, type ChatMessage, type ConversationSummary } from '../services/chat'
import { formatChatTime, formatDayLabel } from '../utils/date'

const PAGE_SIZE = 50 // same as ChatService.PageSize
const MAX_LENGTH = 2000 // longest message the API accepts
const RUN_GAP_MS = 5 * 60 * 1000 // messages closer together than this form one block

// Both members need Premium to read and send messages
const canRead = (c: ConversationSummary) => c.iAmPremium && c.otherIsPremium

const errorMessages = (err: unknown) =>
  err instanceof ApiError ? err.messages : ['Could not reach the server. Is the API running?']

const isSameDay = (a: ChatMessage, b: ChatMessage) => new Date(a.sentAtUtc).toDateString() === new Date(b.sentAtUtc).toDateString()

// Same person, same day, sent close together
const isSameRun = (a: ChatMessage, b: ChatMessage) =>
  a.senderProfileId === b.senderProfileId &&
  isSameDay(a, b) &&
  Math.abs(new Date(b.sentAtUtc).getTime() - new Date(a.sentAtUtc).getTime()) < RUN_GAP_MS

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
  const [filter, setFilter] = useState('')
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const newAfterId = useRef(Number.MAX_SAFE_INTEGER) // only messages after this id animate in

  // Refs let the live-event handlers read the latest values without re-subscribing
  const activeIdRef = useRef(activeId)
  const conversationsRef = useRef(conversations)
  useEffect(() => {
    activeIdRef.current = activeId
    conversationsRef.current = conversations
  })

  const active = conversations?.find((c) => c.id === activeId) ?? null
  const activeCanRead = active ? canRead(active) : false
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
    if (activeId === null || !activeCanRead) return // no Premium on both sides: messages stay hidden and unread
    let cancelled = false
    setLoadingThread(true)
    setErrors([])
    chatApi
      .messages(activeId)
      .then((list) => {
        if (cancelled) return
        newAfterId.current = list.length ? list[list.length - 1].id : 0
        setMessages(list)
        setHasMore(list.length === PAGE_SIZE)
        markRead(activeId)
      })
      .catch((err) => !cancelled && setErrors(errorMessages(err)))
      .finally(() => !cancelled && setLoadingThread(false))
    return () => {
      cancelled = true
    }
  }, [activeId, activeCanRead, markRead])

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

  // The message box grows with the text (up to max-h-32), and shrinks again after sending
  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight + 2}px`
  }, [draft])

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
      inputRef.current?.focus()
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

  const pickOpener = (text: string) => {
    setDraft(text)
    inputRef.current?.focus()
  }

  // Name filter, shown once the list is long enough to need it
  const nameFilter = filter.trim().toLowerCase()
  const shownConversations = conversations?.filter((c) => c.otherProfile.displayName.toLowerCase().includes(nameFilter))

  return (
    <div className="bg-peach-50">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="grid h-[calc(100vh-9rem)] min-h-[520px] overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_-28px_rgba(14,29,54,0.45)] ring-1 ring-peach-200 grid-cols-1 md:grid-cols-[330px_minmax(0,1fr)]">
          {/* ---------- Conversation list (navy, like the dashboard hero) ---------- */}
          <aside className={`${activeId ? 'hidden md:flex' : 'flex'} on-dark min-h-0 flex-col bg-linear-to-b from-brand-900 via-brand-800 to-brand-700 text-white`}>
            <div className="px-5 pb-3 pt-5">
              <p className="flex items-center gap-2 text-xs font-medium text-white/70">
                <span className={`h-2 w-2 rounded-full ${connected ? 'bg-green-400' : 'bg-white/30'}`} aria-hidden="true" />
                {connected ? 'Live' : 'Connecting…'}
              </p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight">
                Your <span className="italic text-gold">messages</span>
              </h1>
              {(conversations?.length ?? 0) >= 4 && (
                <>
                  <label htmlFor="chat-filter" className="sr-only">
                    Find a conversation by name
                  </label>
                  <input
                    id="chat-filter"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    placeholder="Find by name"
                    className="mt-3 w-full rounded-lg border border-white/20 bg-brand-900/70 px-3 py-2 text-sm text-white placeholder:text-white/50 hover:border-white/40"
                  />
                </>
              )}
            </div>
            <div className="mx-5 h-px bg-linear-to-r from-gold/60 to-transparent" aria-hidden="true" />

            <div className="min-h-0 flex-1 overflow-y-auto py-2">
              {conversations === null && <p className="p-5 text-sm text-white/70">Loading…</p>}
              {conversations?.length === 0 && (
                <div className="p-6 text-center text-sm text-white/80">
                  <p>When an interest is accepted, you can chat here.</p>
                  <Link to="/interests" className="mt-3 inline-block font-semibold text-gold hover:text-accent-400">
                    Go to Interests
                  </Link>
                </div>
              )}
              {conversations && conversations.length > 0 && shownConversations?.length === 0 && (
                <p className="p-5 text-center text-sm text-white/70">Nobody with that name.</p>
              )}
              <ul>
                {shownConversations?.map((c) => {
                  const selected = c.id === activeId
                  const mineLast = c.lastMessageSenderProfileId !== null && c.lastMessageSenderProfileId !== c.otherProfile.id
                  return (
                    <li key={c.id}>
                      <Link
                        to={`/chat/${c.id}`}
                        className={`flex items-center gap-3 border-l-[3px] py-3 pl-[17px] pr-4 ${
                          selected ? 'border-gold bg-white/10' : 'border-transparent hover:bg-white/5'
                        }`}
                        aria-current={selected ? 'page' : undefined}
                      >
                        <Avatar profile={c.otherProfile} online={isOnline(c)} />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-baseline justify-between gap-2">
                            <span className="truncate font-semibold">{c.otherProfile.displayName}</span>
                            {c.lastMessageAtUtc && (
                              <span className={`shrink-0 text-xs ${c.unreadCount ? 'text-gold' : 'text-white/60'}`}>{formatChatTime(c.lastMessageAtUtc)}</span>
                            )}
                          </span>
                          <span className="flex items-center justify-between gap-2">
                            <span className={`truncate text-sm ${c.unreadCount ? 'font-semibold text-white' : 'text-white/70'}`}>
                              {!canRead(c)
                                ? c.iAmPremium
                                  ? `Waiting for ${c.otherProfile.displayName} to get Premium`
                                  : c.unreadCount
                                    ? 'New messages: upgrade to read'
                                    : 'Upgrade to Premium to chat'
                                : c.lastMessage
                                  ? `${mineLast ? 'You: ' : ''}${c.lastMessage}`
                                  : 'Say salaam to start the conversation'}
                            </span>
                            {c.unreadCount > 0 && (
                              <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-accent-500 px-1.5 text-xs font-bold text-brand-900">
                                {c.unreadCount}
                              </span>
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
          <section className={`${activeId ? 'flex' : 'hidden md:flex'} chat-wallpaper min-h-0 flex-col`}>
            {activeId === null && <NoConversation />}

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
                <header className="flex items-center gap-3 border-b border-peach-200 bg-white px-4 py-3">
                  <Link to="/chat" className="-ml-1 rounded-full p-1.5 text-brand-600 hover:bg-peach-50 md:hidden" aria-label="Back to all messages">
                    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M16 10H4M9 5l-5 5 5 5" />
                    </svg>
                  </Link>
                  <Avatar profile={active.otherProfile} online={isOnline(active)} size="h-11 w-11" />
                  <div className="min-w-0 flex-1">
                    <Link to={`/profiles/${active.otherProfile.id}`} className="block truncate font-display text-lg font-bold text-ink hover:text-brand-700">
                      {active.otherProfile.displayName}, {active.otherProfile.age}
                    </Link>
                    <p className={`text-xs ${otherTyping ? 'font-medium text-accent-600' : 'text-ink-soft'}`}>
                      {otherTyping ? 'typing…' : isOnline(active) ? 'Online' : active.otherProfile.city}
                    </p>
                  </div>
                  <Link
                    to={`/profiles/${active.otherProfile.id}`}
                    className="hidden shrink-0 rounded-full border border-brand-200 px-4 py-1.5 text-sm font-medium text-ink hover:bg-peach-50 sm:block"
                  >
                    View profile
                  </Link>
                </header>

                <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6" aria-live="polite">
                  <p className="mx-auto flex w-fit max-w-md items-start gap-2 rounded-xl bg-white/80 px-3 py-2 text-xs leading-relaxed text-ink-soft ring-1 ring-peach-200">
                    <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0 text-accent-600" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M12 3 5 6v5c0 4.5 3 8.3 7 10 4-1.7 7-5.5 7-10V6l-7-3Z" />
                      <path d="m9 12 2 2 4-4" />
                    </svg>
                    Keep conversations respectful and involve your families. Never send money to anyone you meet here.
                  </p>

                  {hasMore && (
                    <div className="mt-3 text-center">
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

                  {!activeCanRead && (
                    <PremiumLock
                      showPlans={!active.iAmPremium}
                      text={
                        active.iAmPremium
                          ? `You have Premium. Messages open as soon as ${active.otherProfile.displayName} also has Premium.`
                          : active.unreadCount > 0
                            ? `You have ${active.unreadCount} unread message(s). Upgrade to read them and reply.`
                            : 'Upgrade to read and send messages.'
                      }
                    />
                  )}

                  {loadingThread && <p className="mt-4 text-center text-sm text-ink-soft">Loading messages…</p>}

                  {activeCanRead && active.canSend && !loadingThread && messages.length === 0 && (
                    <Openers name={active.otherProfile.displayName} onPick={pickOpener} />
                  )}

                  {messages.map((m, i) => {
                    const previous = messages[i - 1]
                    const next = messages[i + 1]
                    const newDay = !previous || !isSameDay(previous, m)
                    return (
                      <Fragment key={m.id}>
                        {newDay && <DayDivider label={formatDayLabel(m.sentAtUtc)} />}
                        <MessageBubble
                          message={m}
                          mine={m.senderProfileId !== active.otherProfile.id}
                          startsGroup={newDay || !isSameRun(previous, m)}
                          endsGroup={!next || !isSameRun(m, next)}
                          isNew={m.id > newAfterId.current}
                        />
                      </Fragment>
                    )
                  })}

                  {otherTyping && <TypingBubble name={active.otherProfile.displayName} />}
                </div>

                {(activeCanRead || errors.length > 0) && (
                  <div className="border-t border-peach-200 bg-white p-3">
                    <ErrorAlert messages={errors} />
                    {active.canSend ? (
                      <form onSubmit={handleSubmit} className="flex items-end gap-2">
                        <label htmlFor="chat-input" className="sr-only">
                          Message
                        </label>
                        <textarea
                          id="chat-input"
                          ref={inputRef}
                          value={draft}
                          onChange={(e) => {
                            setDraft(e.target.value)
                            sendTyping(active.id)
                          }}
                          onKeyDown={handleKeyDown}
                          maxLength={MAX_LENGTH}
                          rows={1}
                          placeholder="Write a message"
                          className="max-h-32 min-h-[44px] flex-1 resize-none rounded-3xl border border-peach-200 bg-peach-50 px-4 py-2.5 text-sm text-ink placeholder:text-ink-soft focus:border-accent-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent-400/40"
                        />
                        <button
                          type="submit"
                          disabled={sending || !draft.trim()}
                          aria-label={sending ? 'Sending' : 'Send message'}
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-500 text-brand-900 hover:bg-accent-400 disabled:bg-peach-100 disabled:text-ink-soft"
                        >
                          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M21 3 10.5 13.5M21 3l-6.5 18-4-7.5L3 9.5 21 3Z" />
                          </svg>
                        </button>
                      </form>
                    ) : !activeCanRead ? null : (
                      <p className="text-center text-sm text-ink-soft">You can no longer send messages in this conversation.</p>
                    )}
                    {draft.length >= MAX_LENGTH - 200 && (
                      <p className="mt-1 pr-14 text-right text-xs text-ink-soft">
                        {draft.length} / {MAX_LENGTH}
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
