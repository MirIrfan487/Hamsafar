import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { HubConnectionBuilder, HubConnectionState, LogLevel, type HubConnection } from '@microsoft/signalr'
import { useAuth } from './useAuth'
import { isAdminOnly } from '../services/auth'
import { tokenStorage } from '../services/api'
import { chatApi } from '../services/chat'

// One live connection to /hubs/chat for the whole app, opened after login.
// Pages subscribe to events with `on(...)`; the navbar reads `unreadCount`.

type Handler = (...args: any[]) => void

interface ChatContextValue {
  connected: boolean
  unreadCount: number
  refreshUnread: () => void
  presence: Map<number, boolean> // profileId -> online (only changes seen since the page loaded)
  on: (event: string, handler: Handler) => () => void // returns "unsubscribe"
  sendTyping: (conversationId: number) => void
}

const ChatContext = createContext<ChatContextValue | null>(null)

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const connectionRef = useRef<HubConnection | null>(null)
  const [connected, setConnected] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [presence, setPresence] = useState<Map<number, boolean>>(new Map())

  const refreshUnread = useCallback(() => {
    chatApi
      .unreadCount()
      .then((r) => setUnreadCount(r.count))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!user || isAdminOnly(user)) return // admin-only accounts have no chats

    const connection = new HubConnectionBuilder()
      .withUrl('/hubs/chat', { accessTokenFactory: () => tokenStorage.get() ?? '' })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build()
    connectionRef.current = connection

    connection.on('ReceiveMessage', refreshUnread)
    connection.on('PresenceChanged', (profileId: number, isOnline: boolean) =>
      setPresence((prev) => new Map(prev).set(profileId, isOnline)),
    )
    connection.onreconnecting(() => setConnected(false))
    connection.onreconnected(() => {
      setConnected(true)
      refreshUnread()
    })
    connection.onclose(() => setConnected(false))

    connection
      .start()
      .then(() => setConnected(true))
      .catch(() => setConnected(false)) // chat still works over HTTP, only live updates are missing
    refreshUnread()

    return () => {
      connectionRef.current = null
      setConnected(false)
      connection.stop()
    }
  }, [user, refreshUnread])

  const on = useCallback((event: string, handler: Handler) => {
    const connection = connectionRef.current
    if (!connection) return () => {}
    connection.on(event, handler)
    return () => connection.off(event, handler)
  }, [])

  const lastTyping = useRef(0)
  const sendTyping = useCallback((conversationId: number) => {
    const connection = connectionRef.current
    if (!connection || connection.state !== HubConnectionState.Connected) return
    const now = Date.now()
    if (now - lastTyping.current < 2000) return // at most every 2 seconds
    lastTyping.current = now
    connection.invoke('Typing', conversationId).catch(() => {})
  }, [])

  const value = useMemo(
    () => ({ connected, unreadCount, refreshUnread, presence, on, sendTyping }),
    [connected, unreadCount, refreshUnread, presence, on, sendTyping],
  )

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export function useChat() {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error('useChat must be used inside <ChatProvider>')
  return ctx
}
