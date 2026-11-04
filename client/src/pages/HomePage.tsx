import { Link } from 'react-router'
import { useAuth } from '../hooks/useAuth'

const FEATURES = [
  { title: 'Verified profiles', text: 'Every profile and photo is reviewed before it is shown.' },
  { title: 'Privacy first', text: 'You decide who sees your photos. Contact details are never shown automatically.' },
  { title: 'Family friendly', text: 'Parents and siblings can create a profile for a son, daughter, brother or sister.' },
]

export default function HomePage() {
  const { user } = useAuth()

  return (
    <div className="space-y-12 py-6">
      <section className="text-center">
        <h1 className="text-3xl font-semibold text-gray-900 sm:text-4xl">Find a life partner with trust and dignity</h1>
        <p className="mx-auto mt-3 max-w-xl text-gray-600">
          A safe matrimonial platform for Muslim individuals and families.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          {user ? (
            <Link to="/dashboard" className="rounded-lg bg-rose-600 px-5 py-2.5 font-medium text-white hover:bg-rose-700">
              Go to dashboard
            </Link>
          ) : (
            <>
              <Link to="/register" className="rounded-lg bg-rose-600 px-5 py-2.5 font-medium text-white hover:bg-rose-700">
                Register free
              </Link>
              <Link to="/login" className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 font-medium text-gray-700 hover:bg-gray-50">
                Log in
              </Link>
            </>
          )}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.title} className="rounded-2xl border border-rose-100 bg-white p-5">
            <h2 className="font-medium text-rose-700">{f.title}</h2>
            <p className="mt-1 text-sm text-gray-600">{f.text}</p>
          </div>
        ))}
      </section>

      <p className="text-center text-xs text-gray-400">
        <Link to="/status" className="hover:underline">
          System status
        </Link>
      </p>
    </div>
  )
}
