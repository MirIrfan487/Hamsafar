import { useEffect, useState } from 'react'
import { getDbHealth, getHealth, type DbHealthResponse, type HealthResponse } from '../services/api'

// Developer page: checks that React -> API -> SQL Server all work. URL: /status
export default function StatusPage() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const [db, setDb] = useState<DbHealthResponse | null>(null)
  const [dbError, setDbError] = useState<string | null>(null)

  useEffect(() => {
    getHealth().then(setHealth).catch((e: Error) => setApiError(e.message))
    getDbHealth().then(setDb).catch((e: Error) => setDbError(e.message))
  }, [])

  return (
    <div className="mx-auto max-w-md space-y-3 px-4 py-10">
      <h1 className="text-xl font-semibold text-gray-900">System status</h1>

      <div className="rounded-lg border bg-white p-4">
        <p className="text-sm font-medium text-gray-500">Backend API</p>
        {health && <p className="mt-1 text-green-600">✅ Connected — {health.app}</p>}
        {apiError && <p className="mt-1 text-red-600">❌ Not connected: {apiError}</p>}
        {!health && !apiError && <p className="mt-1 text-gray-400">Checking…</p>}
      </div>

      <div className="rounded-lg border bg-white p-4">
        <p className="text-sm font-medium text-gray-500">SQL Server database</p>
        {db?.databaseConnected && (
          <p className="mt-1 text-green-600">
            ✅ Connected — {db.profileCount} profiles, {db.planCount} plan(s)
          </p>
        )}
        {db && !db.databaseConnected && <p className="mt-1 text-red-600">❌ Database not found. Run Update-Database.</p>}
        {dbError && <p className="mt-1 text-red-600">❌ Error: {dbError}</p>}
        {!db && !dbError && <p className="mt-1 text-gray-400">Checking…</p>}
      </div>
    </div>
  )
}
