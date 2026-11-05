// "YYYY-MM-DD" in the user's LOCAL time (toISOString would use UTC and can be a day off)
export function toDateInputValue(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// Latest date of birth allowed for someone who must be `years` old today
export function maxBirthDateForAge(years: number): string {
  const d = new Date()
  d.setFullYear(d.getFullYear() - years)
  return toDateInputValue(d)
}

// "14:05" today, "Mon" this week, "3 Nov" otherwise
export function formatChatTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  const days = (now.getTime() - d.getTime()) / 86_400_000
  if (days < 6) return d.toLocaleDateString(undefined, { weekday: 'short' })
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

export function formatMessageTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}
