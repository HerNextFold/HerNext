const API_BASE_URL = import.meta.env.VITE_API_URL

const GENERIC_ERROR_MESSAGE = 'Something went wrong. Please try again.'

export class ApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(message: string, status: number, code = '') {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
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

async function parseEnvelope<T>(response: Response): Promise<T> {
  let envelope: ApiEnvelope<T>
  try {
    envelope = (await response.json()) as ApiEnvelope<T>
  } catch {
    throw new ApiError(GENERIC_ERROR_MESSAGE, response.status)
  }

  if (!envelope.success) {
    throw new ApiError(envelope.error.message || GENERIC_ERROR_MESSAGE, response.status, envelope.error.code)
  }

  return envelope.data
}

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

  return parseEnvelope<T>(response)
}

/**
 * Reusable helper for endpoints that require `Authorization: Bearer <token>`.
 * Reads the access token written by loginUser()/verifyEmailOtp() from
 * localStorage, so callers (Onboarding, future Dashboard work) never need to
 * read the token or set the header themselves.
 */
async function authRequest<T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown,
): Promise<T> {
  const token = localStorage.getItem('accessToken')
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(GENERIC_ERROR_MESSAGE, 0)
  }

  return parseEnvelope<T>(response)
}

export interface RegisterPayload {
  firstName: string
  lastName: string
  email: string
  password: string
  country: string
}

export interface PublicUser {
  id: string
  firstName: string
  lastName: string
  email: string
  emailVerified: boolean
  role: string
  country: string
}

export interface RegisterResponse {
  user: PublicUser
  verificationStatus: 'PENDING'
}

/**
 * Creates an UNVERIFIED account and emails a 6-digit verification code.
 * No access token is returned - the account can't log in until
 * verifyEmailOtp() succeeds.
 */
export function registerUser(payload: RegisterPayload): Promise<RegisterResponse> {
  return postJson<RegisterResponse>('/auth/register', payload)
}

export interface VerifyEmailOtpPayload {
  email: string
  code: string
}

export interface AuthenticatedResponse {
  user: PublicUser
  accessToken: string
}

export function verifyEmailOtp(payload: VerifyEmailOtpPayload): Promise<AuthenticatedResponse> {
  return postJson<AuthenticatedResponse>('/auth/verify-email-otp', payload)
}

export interface LoginPayload {
  email: string
  password: string
}

/**
 * Requires a verified email. Rejects with ApiError(status 403, code
 * 'ACCOUNT_UNVERIFIED') when the account hasn't completed verifyEmailOtp().
 */
export function loginUser(payload: LoginPayload): Promise<AuthenticatedResponse> {
  return postJson<AuthenticatedResponse>('/auth/login', payload)
}

export function resendEmailVerification(email: string): Promise<Record<string, never>> {
  return postJson<Record<string, never>>('/auth/resend-email-verification', { email })
}

export type EmploymentType =
  | 'EMPLOYED'
  | 'SELF_EMPLOYED'
  | 'FREELANCER'
  | 'STUDENT'
  | 'UNEMPLOYED'
  | 'INFORMAL_WORKER'

export interface UpdateProfilePayload {
  currentOccupation: string
  industry: string
  yearsOfExperience: number
  employmentType: EmploymentType
  education?: string | null
}

export interface CareerProfile {
  id: string
  currentOccupation: string
  industry: string
  yearsOfExperience: number
  education: string | null
  employmentType: EmploymentType
  careerInterests: string[] | null
  targetCareerId: string | null
  targetCareer: { id: string; name: string; industry: string; level: string } | null
  existingSkills: { skillId: string; skillName: string; category: string | null; source: string }[]
  createdAt: string
  updatedAt: string
}

/**
 * Creates or updates the authenticated participant's career profile.
 * skillIds/targetCareerId are intentionally not accepted here yet - both
 * require approved-catalogue UUIDs and no catalogue endpoint exists on the
 * backend today, while this UI only collects free text for those fields.
 */
export function updateProfile(payload: UpdateProfilePayload): Promise<CareerProfile> {
  return authRequest<CareerProfile>('PUT', '/profile', payload)
}

export interface CreateExperiencePayload {
  title: string
  description: string
  employmentType: EmploymentType
  organization?: string | null
  years?: number | null
  startDate?: string | null
  endDate?: string | null
}

export interface ExperienceRecord {
  id: string
  title: string
  description: string
  organization: string | null
  years: number | null
  employmentType: EmploymentType
  startDate: string | null
  endDate: string | null
  createdAt: string
  updatedAt: string
}

export function createExperience(payload: CreateExperiencePayload): Promise<ExperienceRecord> {
  return authRequest<ExperienceRecord>('POST', '/experiences', payload)
}

export type ReadinessLabel = 'Opportunity Ready' | 'Developing' | 'Building Foundations' | 'Early Stage'

export type ImpactLevel = 'LOW' | 'MODERATE' | 'HIGH'

export interface ReadinessBreakdown {
  experience: number
  skills: number
  aiReadiness: number
  evidence: number
}

export interface ImpactSnapshot {
  score: number
  level: ImpactLevel
}

export interface ProgressSummary {
  currentCareerGoal: string | null
  careerReadiness: number
  readinessLabel: ReadinessLabel
  readinessBreakdown: ReadinessBreakdown
  roadmapProgress: number
  aiImpact: ImpactSnapshot | null
  skillsDeveloped: number
  skillsRemaining: number
  challengesCompleted: number
  evidenceCreated: number
}

export function getProgressSummary(): Promise<ProgressSummary> {
  return authRequest<ProgressSummary>('GET', '/progress/summary')
}

export interface CareerRecommendation {
  careerId: string
  careerName: string
  matchScore: number
  rank: number
  reason: string
}

export interface CareerRecommendationsResponse {
  recommendations: CareerRecommendation[]
}

export function getCareerRecommendations(limit?: number): Promise<CareerRecommendationsResponse> {
  const query = typeof limit === 'number' ? `?limit=${limit}` : ''
  return authRequest<CareerRecommendationsResponse>('GET', `/careers/recommendations${query}`)
}
