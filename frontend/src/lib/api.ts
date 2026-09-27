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

/** For genuinely public, unauthenticated endpoints - never attaches a token. */
async function getJson<T>(path: string): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { method: 'GET' })
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

export function listExperiences(): Promise<{ experiences: ExperienceRecord[] }> {
  return authRequest<{ experiences: ExperienceRecord[] }>('GET', '/experiences')
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

export interface CareerImpactAnalysis {
  id: string
  experienceId: string
  score: number
  level: ImpactLevel
  automationTasks: string[]
  augmentedTasks: string[]
  humanStrengths: string[]
  emergingSkills: string[]
  explanation: string
  createdAt: string
}

/** Read-first: returns the persisted assessment. Throws ApiError(404, 'RESOURCE_NOT_FOUND') if none exists yet. */
export function getCareerImpact(experienceId: string): Promise<CareerImpactAnalysis> {
  return authRequest<CareerImpactAnalysis>('GET', `/ai/career-impact/${experienceId}`)
}

/** Generates a new assessment (or reuses one already valid for the current experience). */
export function runCareerImpact(experienceId: string): Promise<CareerImpactAnalysis> {
  return authRequest<CareerImpactAnalysis>('POST', `/ai/career-impact/${experienceId}`)
}

export type RoadmapTaskStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'

export interface RoadmapTask {
  id: string
  title: string
  description: string
  skillId: string | null
  estimatedMinutes: number | null
  order: number
  status: RoadmapTaskStatus
  completedAt: string | null
}

export interface RoadmapSummary {
  id: string
  careerPathId: string
  title: string
  description: string
  createdAt: string
}

export interface RoadmapWithPhases {
  roadmap: RoadmapSummary
  phases: {
    DAY_30: RoadmapTask[]
    DAY_60: RoadmapTask[]
    DAY_90: RoadmapTask[]
  }
}

/** Read-first: returns the participant's current roadmap. Throws ApiError(404, 'RESOURCE_NOT_FOUND') when none has been generated yet. */
export function getCurrentRoadmap(): Promise<RoadmapWithPhases> {
  return authRequest<RoadmapWithPhases>('GET', '/roadmaps/current')
}

export interface GenerateRoadmapPayload {
  careerPathId: string
}

/** Generates a roadmap for the given approved career (or reuses the current one if it's still for the same career). */
export function generateRoadmap(payload: GenerateRoadmapPayload): Promise<RoadmapWithPhases> {
  return authRequest<RoadmapWithPhases>('POST', '/roadmaps/generate', payload)
}

export type SkillSource = 'SELF_REPORTED' | 'AI_DERIVED' | 'CHALLENGE' | 'VERIFIED'

export interface PassportSkill {
  name: string
  category: string
  source: SkillSource
  proficiency: number
}

export interface PassportExperienceItem {
  title: string
  organization: string | null
  years: number | null
  employmentType: EmploymentType
}

export interface PassportReadiness {
  score: number
  label: ReadinessLabel
  breakdown: ReadinessBreakdown
}

export interface PassportChallenge {
  challengeId: string
  title: string
}

export interface PassportEvidenceItem {
  id: string
  title: string
  description: string
  result: string
  status: string
  skillName: string | null
  createdAt: string
}

export interface PassportAchievement {
  name: string
  earnedAt: string
}

export interface PassportPhaseProgress {
  DAY_30: number
  DAY_60: number
  DAY_90: number
}

export interface Passport {
  id: string
  slug: string
  isPublic: boolean
  createdAt: string
  name: string
  country: string | null
  headline: string | null
  profile: {
    currentOccupation: string
    industry: string
    yearsOfExperience: number
    education: string | null
    employmentType: EmploymentType
  } | null
  experience: PassportExperienceItem[]
  skills: PassportSkill[]
  careerGoal: string | null
  readiness: PassportReadiness
  aiImpact: ImpactSnapshot | null
  challenges: PassportChallenge[]
  evidence: PassportEvidenceItem[]
  achievements: PassportAchievement[]
  roadmapProgress: number
  phaseProgress: PassportPhaseProgress
  updatedAt: string
}

/** Read-first: returns the authenticated participant's Career Passport. Throws ApiError(404, 'RESOURCE_NOT_FOUND') if it hasn't been generated yet. */
export function getPassport(): Promise<{ passport: Passport }> {
  return authRequest<{ passport: Passport }>('GET', '/passport')
}

export interface GeneratePassportPayload {
  isPublic?: boolean
}

/** Generates or updates the participant's Career Passport. Private by default - pass isPublic:true to make the public share link live. */
export function generatePassport(payload: GeneratePassportPayload = {}): Promise<{ passport: Passport }> {
  return authRequest<{ passport: Passport }>('POST', '/passport/generate', payload)
}

export interface PublicPassport {
  name: string
  country: string | null
  headline: string | null
  experience: Array<{ title: string; organization: string | null; years: number | null }>
  skills: PassportSkill[]
  careerGoal: string | null
  readiness: number
  readinessLabel: ReadinessLabel
  aiImpact: ImpactSnapshot | null
  roadmapProgress: number
  phaseProgress: PassportPhaseProgress
  challenges: Array<{ title: string }>
  evidence: Array<{ title: string; description: string; result: string; status: string; skillName: string | null; createdAt: string }>
  achievements: PassportAchievement[]
  updatedAt: string
}

/** Public, unauthenticated. Throws ApiError(404) if the slug doesn't exist or the passport isn't public. */
export function getPublicPassport(slug: string): Promise<{ passport: PublicPassport }> {
  return getJson<{ passport: PublicPassport }>(`/passport/public/${encodeURIComponent(slug)}`)
}

export type ChallengeDifficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'

export type SubmissionStatus = 'PENDING' | 'PASSED' | 'FAILED'

export interface ChallengeSkillRef {
  skillId: string
  skillName: string
}

export interface ChallengeLatestAttempt {
  status: SubmissionStatus
  score: number | null
  submittedAt: string
}

export interface ChallengeListItem {
  id: string
  title: string
  description: string
  difficulty: ChallengeDifficulty
  skills: ChallengeSkillRef[]
  latestAttempt: ChallengeLatestAttempt | null
}

export interface ListChallengesFilters {
  skillId?: string
  difficulty?: ChallengeDifficulty
}

export function listChallenges(filters: ListChallengesFilters = {}): Promise<{ challenges: ChallengeListItem[] }> {
  const params = new URLSearchParams()
  if (filters.skillId) params.set('skillId', filters.skillId)
  if (filters.difficulty) params.set('difficulty', filters.difficulty)
  const query = params.toString()
  return authRequest<{ challenges: ChallengeListItem[] }>('GET', `/challenges${query ? `?${query}` : ''}`)
}

export function getChallenge(id: string): Promise<{ challenge: ChallengeListItem }> {
  return authRequest<{ challenge: ChallengeListItem }>('GET', `/challenges/${id}`)
}

export interface SubmitChallengeResult {
  submissionId: string
  status: SubmissionStatus
  score: number
  feedback: string
  evidenceCreated: number
}

/** Throws ApiError(404) if the challenge doesn't exist or doesn't support submissions yet. */
export function submitChallenge(id: string, answer: Record<string, unknown>): Promise<SubmitChallengeResult> {
  return authRequest<SubmitChallengeResult>('POST', `/challenges/${id}/submit`, { answer })
}

/** Returns the authenticated participant's career profile, including existingSkills. Throws ApiError(404) if none exists yet. */
export function getProfile(): Promise<CareerProfile> {
  return authRequest<CareerProfile>('GET', '/profile')
}

export interface TransferableSkill {
  skillId: string
  skillName: string | null
  reason: string
  confidence: number
}

/** Read-first: returns transferable skills already persisted for the participant. Empty list if none have been derived yet (not an error). */
export function getTransferableSkills(): Promise<{ skills: TransferableSkill[] }> {
  return authRequest<{ skills: TransferableSkill[] }>('GET', '/ai/transferable-skills')
}

export type SkillGapStatus = 'HAS_SKILL' | 'NEEDS_DEVELOPMENT'
export type SkillGapPriority = 'HIGH' | 'MEDIUM' | 'LOW'

export interface SkillGapItem {
  skillId: string
  skillName: string
  status: SkillGapStatus
  priority: SkillGapPriority
}

export interface SkillGapsResponse {
  career: { id: string; name: string }
  skills: SkillGapItem[]
}

/** Read-first, deterministic (no AI call). Throws ApiError(404) if the career id isn't in the approved catalogue. */
export function getSkillGaps(careerId: string): Promise<SkillGapsResponse> {
  return authRequest<SkillGapsResponse>('GET', `/careers/${careerId}/skill-gaps`)
}
