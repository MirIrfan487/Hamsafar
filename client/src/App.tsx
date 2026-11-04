import { useEffect, useState } from 'react'
import { getDbHealth, getHealth, type DbHealthResponse, type HealthResponse } from './services/api'

// Phase 1 test page: checks that React -> API -> SQL Server all work.
export default function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const [db, setDb] = useState<DbHealthResponse | null>(null)
  const [dbError, setDbError] = useState<string | null>(null)

  useEffect(() => {
    getHealth().then(setHealth).catch((e: Error) => setApiError(e.message))
    getDbHealth().then(setDb).catch((e: Error) => setDbError(e.message))
  }, [])

  return (
    <main className="min-h-screen bg-rose-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-semibold text-rose-700">Matrimony</h1>
        <p className="mt-2 text-gray-600">Phase 1 setup check</p>

        <div className="mt-6 rounded-lg border p-4">
          <p className="text-sm font-medium text-gray-500">Backend API</p>
          {health && (
            <p className="mt-1 text-green-600">
              ✅ Connected — {health.app} ({new Date(health.serverTimeUtc).toLocaleTimeString()})
            </p>
          )}
          {apiError && <p className="mt-1 text-red-600">❌ Not connected: {apiError}</p>}
          {!health && !apiError && <p className="mt-1 text-gray-400">Checking…</p>}
        </div>

        <div className="mt-3 rounded-lg border p-4">
          <p className="text-sm font-medium text-gray-500">SQL Server database</p>
          {db?.databaseConnected && (
            <p className="mt-1 text-green-600">✅ Connected — {db.profileCount} profiles, {db.planCount} plan(s)</p>
          )}
          {db && !db.databaseConnected && (
            <p className="mt-1 text-red-600">❌ Database not found. Run Update-Database.</p>
          )}
          {dbError && <p className="mt-1 text-red-600">❌ Error: {dbError}</p>}
          {!db && !dbError && <p className="mt-1 text-gray-400">Checking…</p>}
        </div>

        <p className="mt-4 text-xs text-gray-400">
          If something says "Not connected", start the API in Visual Studio (F5) and refresh.
        </p>
      </div>
    </main>
  )
}
