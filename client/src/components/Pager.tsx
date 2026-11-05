// "Previous / Page 2 of 5 / Next" under a list
export default function Pager({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (page: number) => void }) {
  if (totalPages <= 1) return null
  const btn = 'rounded-full border border-gray-300 px-4 py-1.5 text-sm font-medium text-ink hover:bg-peach-50 disabled:opacity-40'
  return (
    <div className="mt-6 flex items-center justify-center gap-3 text-sm">
      <button type="button" className={btn} disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Previous
      </button>
      <span className="text-ink-soft">
        Page {page} of {totalPages}
      </span>
      <button type="button" className={btn} disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        Next
      </button>
    </div>
  )
}
