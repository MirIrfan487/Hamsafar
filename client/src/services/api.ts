// All calls to the backend live in /services.
// The Vite proxy (vite.config.ts) sends /api/... to https://localhost:7080/api/...

export interface HealthResponse {
  status: string
  app: string
  serverTimeUtc: string
}

export async function getHealth(): Promise<HealthResponse> {
  const res = await fetch('/api/health')
  if (!res.ok) {
    throw new Error(`API returned ${res.status}`)
  }
  return res.json()
}

export interface DbHealthResponse {
  databaseConnected: boolean
  profileCount: number
  planCount: number
}

export async function getDbHealth(): Promise<DbHealthResponse> {
  const res = await fetch('/api/health/db')
  if (!res.ok) {
    throw new Error(`API returned ${res.status}`)
  }
  return res.json()
}
