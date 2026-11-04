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
