// Shared helper for every call to the backend.
// The Vite proxy (vite.config.ts) sends /api/... to http://localhost:5080/api/...

const TOKEN_KEY = 'matrimony_token'

// Where we keep the JWT between page reloads.
// try/catch because some browsers (private mode) can block localStorage.
export const tokenStorage = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY)
    } catch {
      return null
    }
  },
  set(token: string) {
    try {
      localStorage.setItem(TOKEN_KEY, token)
    } catch {
      /* ignore */
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY)
    } catch {
      /* ignore */
    }
  },
}

// Error thrown when the API answers with 4xx/5xx. `messages` are ready to show to the user.
export class ApiError extends Error {
  status: number
  messages: string[]

  constructor(status: number, messages: string[]) {
    super(messages[0] ?? `Request failed (${status})`)
    this.status = status
    this.messages = messages
  }
}

// The API sends errors in two shapes:
//  - our own:            { "errors": ["Email already taken"] }
//  - ASP.NET validation: { "errors": { "Password": ["The Password field is required."] } }
async function readErrors(res: Response): Promise<string[]> {
  try {
    const data = await res.json()
    if (Array.isArray(data?.errors)) return data.errors
    if (data?.errors && typeof data.errors === 'object') {
      return Object.values(data.errors).flat() as string[]
    }
    if (typeof data?.title === 'string') return [data.title]
  } catch {
    /* body was not JSON */
  }
  return [`Request failed (${res.status})`]
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: unknown // an object (sent as JSON) or FormData (for file uploads)
  auth?: boolean // true = send the saved JWT in the Authorization header
}

function authHeader(): Record<string, string> {
  const token = tokenStorage.get()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const isForm = options.body instanceof FormData
  const headers: Record<string, string> = { Accept: 'application/json', ...(options.auth ? authHeader() : {}) }

  // For FormData the browser sets Content-Type itself (with the multipart boundary)
  if (options.body !== undefined && !isForm) headers['Content-Type'] = 'application/json'

  const res = await fetch(`/api${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body === undefined ? undefined : isForm ? (options.body as FormData) : JSON.stringify(options.body),
  })

  if (!res.ok) throw new ApiError(res.status, await readErrors(res))
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

// For images that need login: <img src> cannot send our token, so we download the file
// with the token and show it from memory (see components/SecurePhoto.tsx)
export async function apiBlob(path: string): Promise<Blob> {
  const res = await fetch(`/api${path}`, { headers: authHeader() })
  if (!res.ok) throw new ApiError(res.status, [`Request failed (${res.status})`])
  return res.blob()
}

// ---------- Health checks (used by /status) ----------

export interface HealthResponse {
  status: string
  app: string
  serverTimeUtc: string
}

export interface DbHealthResponse {
  databaseConnected: boolean
  profileCount: number
  planCount: number
}

export const getHealth = () => apiRequest<HealthResponse>('/health')
export const getDbHealth = () => apiRequest<DbHealthResponse>('/health/db')
