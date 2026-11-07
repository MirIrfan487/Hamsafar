import { Link } from 'react-router'
import { ArchRings } from '../Decor'
import SecurePhoto from '../SecurePhoto'
import type { ChatMessage } from '../../services/chat'
import type { ProfileCard } from '../../services/search'
import { formatMessageTime } from '../../utils/date'

// The small display pieces of the chat page. ChatPage.tsx keeps the data and the live events.

export function Avatar({ profile, online, size = 'h-11 w-11' }: { profile: ProfileCard; online?: boolean; size?: string }) {
  return (
    <span className={`relative shrink-0 ${size}`}>
      {profile.photoId ? (
        <SecurePhoto photoId={profile.photoId} alt="" className={`${size} rounded-full object-cover ring-2 ring-gold/60`} />
      ) : (
        <span className={`flex ${size} items-center justify-center rounded-full bg-linear-to-br from-accent-400 to-accent-500 font-display font-bold text-brand-900`}>
          {profile.displayName.slice(0, 1).toUpperCase()}
        </span>
      )}
      {online && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 ring-2 ring-white" aria-label="Online" />}
    </span>
  )
}

// "Today" between two gold lines, like the ornament on the home page
export function DayDivider({ label }: { label: string }) {
  return (
    <div className="my-4 flex items-center justify-center gap-3" role="separator">
      <span className="h-px w-12 bg-linear-to-r from-transparent to-accent-500" aria-hidden="true" />
      <span className="h-1.5 w-1.5 rotate-45 bg-accent-500" aria-hidden="true" />
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">{label}</span>
      <span className="h-1.5 w-1.5 rotate-45 bg-accent-500" aria-hidden="true" />
      <span className="h-px w-12 bg-linear-to-l from-transparent to-accent-500" aria-hidden="true" />
    </div>
  )
}

// One tick = sent, two gold ticks = the other member has read it
function Ticks({ read }: { read: boolean }) {
  return (
    <svg viewBox="0 0 20 12" className={`h-3 w-4.5 ${read ? 'text-accent-600' : 'text-ink-soft'}`} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m1.5 6.5 3.5 3.5 6.5-8" />
      {read && <path d="m8.5 9 1 1 6.5-8" />}
    </svg>
  )
}

interface BubbleProps {
  message: ChatMessage
  mine: boolean
  startsGroup: boolean // first message in a run from the same person
  endsGroup: boolean // last message in the run: this one shows the time
  isNew: boolean // arrived while the chat was open, so it animates in
}

export function MessageBubble({ message, mine, startsGroup, endsGroup, isNew }: BubbleProps) {
  // Corners next to another message in the same run stay tight, so a run reads as one block
  const corners = mine
    ? `rounded-l-2xl ${startsGroup ? 'rounded-tr-2xl' : 'rounded-tr-md'} ${endsGroup ? 'rounded-br-sm' : 'rounded-br-md'}`
    : `rounded-r-2xl ${startsGroup ? 'rounded-tl-2xl' : 'rounded-tl-md'} ${endsGroup ? 'rounded-bl-sm' : 'rounded-bl-md'}`

  return (
    <div className={`flex flex-col ${mine ? 'items-end' : 'items-start'} ${startsGroup ? 'mt-3' : 'mt-0.5'} ${isNew ? 'bubble-in' : ''}`}>
      <div
        className={`max-w-[80%] whitespace-pre-wrap break-words px-3.5 py-2 text-sm leading-relaxed shadow-sm ${corners} ${
          mine ? 'bg-linear-to-br from-brand-600 to-brand-800 text-white' : 'bg-white text-ink ring-1 ring-peach-200'
        }`}
      >
        {message.body}
      </div>
      {endsGroup && (
        <span className="mt-1 flex items-center gap-1 px-1 text-xs text-ink-soft" title={new Date(message.sentAtUtc).toLocaleString()}>
          {formatMessageTime(message.sentAtUtc)}
          {mine && <Ticks read={!!message.readAtUtc} />}
          {mine && <span className="sr-only">{message.readAtUtc ? 'Seen' : 'Sent'}</span>}
        </span>
      )}
    </div>
  )
}

export function TypingBubble({ name }: { name: string }) {
  return (
    <div className="bubble-in mt-3 flex items-start">
      <div className="flex items-center gap-1 rounded-r-2xl rounded-tl-2xl rounded-bl-sm bg-white px-3.5 py-3 shadow-sm ring-1 ring-peach-200">
        <span className="sr-only">{name} is typing</span>
        {[0, 1, 2].map((i) => (
          <span key={i} className="typing-dot h-2 w-2 rounded-full bg-accent-500" style={{ animationDelay: `${i * 160}ms` }} aria-hidden="true" />
        ))}
      </div>
    </div>
  )
}

const OPENERS = [
  { label: 'Assalamu alaikum', text: 'Assalamu alaikum' },
  { label: 'I read your profile', text: 'Assalamu alaikum, I read your profile and would like to know more about you.' },
  { label: 'Ask about family', text: 'Assalamu alaikum, could you tell me a little about your family?' },
]

// Shown in an empty conversation. A tap fills the message box; nothing is sent until the member presses send.
export function Openers({ name, onPick }: { name: string; onPick: (text: string) => void }) {
  return (
    <div className="mx-auto mt-8 max-w-sm text-center">
      <p className="font-display text-2xl font-bold text-ink">Say salaam to {name}</p>
      <p className="mt-1 text-sm text-ink-soft">A kind first message goes a long way. Pick one to start with, or write your own.</p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {OPENERS.map((o) => (
          <button
            key={o.label}
            type="button"
            onClick={() => onPick(o.text)}
            className="rounded-full bg-white px-3.5 py-1.5 text-sm font-medium text-brand-700 ring-1 ring-peach-200 hover:ring-accent-500"
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// Navy card, same framed look as the dashboard panel. text says why this chat is locked.
export function PremiumLock({ text, showPlans }: { text: string; showPlans: boolean }) {
  return (
    <div className="on-dark relative mx-auto mt-8 max-w-sm rounded-2xl bg-linear-to-br from-brand-900 via-brand-800 to-brand-700 p-6 text-center text-white shadow-[0_24px_60px_-24px_rgba(14,29,54,0.6)]">
      <span className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 bg-gold" aria-hidden="true" />
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-gold/50 text-gold">
        <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <rect x="4" y="9" width="12" height="8" rx="2" />
          <path d="M7 9V6.5a3 3 0 0 1 6 0V9" />
        </svg>
      </span>
      <p className="mt-3 font-display text-xl font-bold">Both members need Premium to chat</p>
      <p className="mt-2 text-sm leading-relaxed text-white/80">{text}</p>
      {showPlans && (
        <Link to="/plans" className="mt-5 inline-block rounded-lg bg-accent-500 px-6 py-2.5 text-sm font-bold text-brand-900 hover:bg-accent-400">
          See plans
        </Link>
      )}
    </div>
  )
}

// The right side before a conversation is chosen
export function NoConversation() {
  return (
    <div className="m-auto max-w-xs p-6 text-center">
      <ArchRings className="mx-auto w-44" />
      <p className="mt-4 font-display text-2xl font-bold text-ink">Your conversations</p>
      <p className="mt-1 text-sm text-ink-soft">Choose someone from the list to read and reply to messages.</p>
    </div>
  )
}
