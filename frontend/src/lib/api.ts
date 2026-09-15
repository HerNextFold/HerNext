const API_BASE_URL = import.meta.env.VITE_API_URL

const GENERIC_ERROR_MESSAGE = 'Something went wrong. Please try again.'

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

interface ApiSuccess<T> {
  success: true
  data: T
  message?: string
}

interface ApiFailure {
  success: false
  error: {
    code: string
    message: string
    details?: unknown
  }
}

type ApiEnvelope<T> = ApiSuccess<T> | ApiFailure

async function postJson<T>(path: string, body: unknown): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    throw new ApiError(GENERIC_ERROR_MESSAGE, 0)
  }

  let envelope: ApiEnvelope<T>
  try {
    envelope = (await response.json()) as ApiEnvelope<T>
  } catch {
    throw new ApiError(GENERIC_ERROR_MESSAGE, response.status)
  }

  if (!envelope.success) {
    throw new ApiError(envelope.error.message || GENERIC_ERROR_MESSAGE, response.status)
  }

  return envelope.data
}

export interface RegisterPayload {
  firstName: string
  lastName: string
  email: string
  password: string
  country: string
}

export interface AuthUser {
  id: string
  firstName: string
  lastName: string
  email: string
  country: string
  role: string
}

export interface AuthResponse {
  user: AuthUser
  accessToken: string
}

export function registerUser(payload: RegisterPayload): Promise<AuthResponse> {
  return postJson<AuthResponse>('/auth/register', payload)
}
