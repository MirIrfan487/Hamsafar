// Shows a list of error messages (from the API or from form checks)
export default function ErrorAlert({ messages }: { messages: string[] }) {
  if (messages.length === 0) return null

  return (
    <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
      {messages.length === 1 ? (
        <p>{messages[0]}</p>
      ) : (
        <ul className="list-disc space-y-1 pl-5">
          {messages.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
