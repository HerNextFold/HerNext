import { endSession, getAccessToken } from './session'

const API_BASE_URL = import.meta.env.VITE_API_URL

const GENERIC_ERROR_MESSAGE = 'Something went wrong. Please try again.'

/**
 * What kind of failure this is, so callers react to the cause instead of
 * treating every rejection as "the user's data is missing".
 *
 * `auth` is the only kind that means the session ended. `forbidden`,
 * `notFound`, `server` and `network` are all data/server conditions and must
 * never trigger a sign-out.
 */
export type ApiErrorKind =
  | 'auth'
  | 'forbidden'
  | 'notFound'
  | 'server'
  | 'network'
  | 'client'

function classifyStatus(status: number): ApiErrorKind {
  if (status === 0) return 'network'
  if (status === 401) return 'auth'
  if (status === 403) return 'forbidden'
  if (status === 404) return 'notFound'
  if (status >= 500) return 'server'
  return 'client'
}

/**
 * One entry from the backend's `error.details` array.
 *
 * Fastify/Zod puts the per-field reason here (e.g. "targetCareerId must be a
 * valid uuid"), while `error.message` is only the generic "Invalid request
 * data". Without this the UI cannot tell the participant *which* field was
 * rejected, so a strict schema produces an unactionable error.
 */
export interface ApiErrorDetail {
  instancePath?: string
  path?: string
  message?: string
  params?: Record<string, unknown>
}

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly kind: ApiErrorKind
  readonly details: ApiErrorDetail[]

  constructor(message: string, status: number, code = '', details: ApiErrorDetail[] = []) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.kind = classifyStatus(status)
    this.details = details
  }

  /**
   * A specific, human-readable reason taken from `details`, or null when the
   * backend gave none. Prefers the first entry that actually carries a message,
   * because Fastify validation arrays can include parameter-only entries.
   */
  get firstDetailMessage(): string | null {
    for (const detail of this.details) {
      if (typeof detail.message === 'string' && detail.message.trim() !== '') {
        return detail.message
      }
    }
    return null
  }
}

/**
 * True when the failure was the backend refusing the session rather than
 * missing data. Used to hand over to the centralized sign-out instead of
 * rendering an error about the participant's records.
 */
export function isSessionExpiredError(err: unknown): boolean {
  return err instanceof ApiError && err.kind === 'auth'
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

/**
 * The backend is not typed, so `details` arrives as `unknown`. Anything that is
 * not an array of objects is discarded rather than trusted, which keeps a
 * malformed payload from turning into a crash in the error path.
 */
function toErrorDetails(details: unknown): ApiErrorDetail[] {
  if (!Array.isArray(details)) return []
  return details.filter(
    (entry): entry is ApiErrorDetail =>
      typeof entry === 'object' && entry !== null && !Array.isArray(entry),
  )
}

async function parseEnvelope<T>(response: Response): Promise<T> {
  let envelope: ApiEnvelope<T>
  try {
    envelope = (await response.json()) as ApiEnvelope<T>
  } catch {
    throw new ApiError(GENERIC_ERROR_MESSAGE, response.status)
  }

  if (!envelope.success) {
    throw new ApiError(
      envelope.error.message || GENERIC_ERROR_MESSAGE,
      response.status,
      envelope.error.code,
      toErrorDetails(envelope.error.details),
    )
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
 *
 * This is the only helper that sends a token, which is what makes it the only
 * safe place to treat a 401 as an ended session. The token-free helpers above
 * are used by sign in, sign up, email verification and the public passport, so
 * their failures (including a 401 for bad credentials) are never mistaken for
 * an expired session.
 */
async function authRequest<T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown,
): Promise<T> {
  const token = getAccessToken()
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
    // The request never completed. That is a network problem, not a session
    // problem, so nothing is signed out here.
    throw new ApiError(GENERIC_ERROR_MESSAGE, 0)
  }

  try {
    return await parseEnvelope<T>(response)
  } catch (err) {
    // A token we sent was rejected: the session is over. Clear it and return
    // to sign-in once, instead of leaving a dead token to fail every later
    // request. 403/404/5xx are left to the caller.
    if (isSessionExpiredError(err) && token) {
      endSession('expired')
    }
    throw err
  }
}

export interface RegisterPayload {
  firstName: string
  lastName: string
  email: string
  password: string
  country: string
  state?: string
}

export interface PublicUser {
  id: string
  firstName: string
  lastName: string
  email: string
  emailVerified: boolean
  role: string
  country: string
  state: string | null
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

/**
 * Returns the currently authenticated user. Used to re-hydrate the session
 * (including `country` and `state`) from the server after a reload, so the
 * persisted location is never sourced from local storage.
 */
export function getCurrentUser(): Promise<PublicUser> {
  return authRequest<PublicUser>('GET', '/auth/me')
}

/**
 * Permanently deletes the signed-in participant's own account and every record
 * owned by it.
 *
 * There is no id in this call on purpose: the backend takes the user id from the
 * access token, so the request cannot be pointed at another account. The caller
 * must clear its local session only after this resolves, because a rejected
 * request means the account is still there.
 *
 * The empty `{}` body is required only to satisfy Fastify's JSON parser, which
 * rejects a bodyless request that declares `Content-Type: application/json`. The
 * route reads no body; see runCareerImpact() for the same pattern.
 */
export function deleteCurrentAccount(): Promise<void> {
  return authRequest<void>('DELETE', '/auth/me', {})
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
  country?: string
  state?: string | null
  /**
   * Skills the participant typed that are not in the approved catalogue.
   *
   * These are added to the participant's profile; existing skills are never
   * replaced, because the backend upserts them rather than overwriting the
   * list. The backend trims each name, rejects blanks, de-duplicates
   * case-insensitively, and reuses an approved catalogue skill only when the
   * name matches one exactly (ignoring case).
   *
   * Omit the field to leave custom skills untouched.
   */
  customSkills?: string[]
}

export interface CareerProfile {
  id: string
  country: string
  state: string | null
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
 *
 * Prefer `completeOnboarding()` for the onboarding screen: this endpoint saves
 * only the profile fields and deliberately does not mark onboarding complete,
 * so a partial save can never be mistaken for a finished onboarding.
 * `country`/`state` are optional: omit a field to keep its stored value, or
 * pass `state: null` to clear the stored state or province.
 *
 * `customSkills` is the read-modify-free path for adding a skill the
 * participant typed that HerNext does not suggest. It is additive: the backend
 * upserts the named skills and never removes or rewrites the ones already on
 * the profile, so a caller can send just the new names.
 */
export function updateProfile(payload: UpdateProfilePayload): Promise<CareerProfile> {
  return authRequest<CareerProfile>('PUT', '/profile', payload)
}

// ---------------------------------------------------------------------------
// Approved catalogue
//
// The backend owns the career and skill catalogue (docs/AGENTS.md §16, §20).
// A participant's target career and self-reported skills can only be persisted
// as approved catalogue ids, so the onboarding UI resolves real user choices
// against these lists instead of inventing an id or defaulting to one.
// ---------------------------------------------------------------------------

export interface CatalogueCareer {
  id: string
  name: string
  industry: string
  description: string
  level: string
}

export interface CatalogueSkill {
  id: string
  name: string
  category: string
  description: string
}

export function listCatalogueCareers(): Promise<CatalogueCareer[]> {
  return authRequest<CatalogueCareer[]>('GET', '/catalogue/careers')
}

export function listCatalogueSkills(): Promise<CatalogueSkill[]> {
  return authRequest<CatalogueSkill[]>('GET', '/catalogue/skills')
}

// ---------------------------------------------------------------------------
// Onboarding
// ---------------------------------------------------------------------------

export interface OnboardingExperiencePayload {
  title: string
  description: string
  employmentType: EmploymentType
  organization?: string | null
  years?: number | null
  startDate?: string | null
  endDate?: string | null
}

export interface CompleteOnboardingPayload {
  currentOccupation: string
  industry: string
  yearsOfExperience: number
  employmentType: EmploymentType
  education?: string | null
  careerInterests?: string[] | null
  country?: string
  state?: string | null
  /** Approved catalogue career id the participant actually selected. */
  targetCareerId: string
  /** Approved catalogue skill ids the participant actually reported. */
  skillIds: string[]
  /**
   * Skills the participant typed that are not in the approved catalogue.
   * Suggestions are not an allowlist, so a genuine skill must always be
   * recordable. The backend trims these, ignores blank entries, de-duplicates
   * case-insensitively, and reuses an approved catalogue skill when the name
   * matches one.
   */
  customSkills?: string[]
  /**
   * Omit (or send null) when the participant has no genuine experience to
   * record. The backend inserts nothing in that case - no placeholder or
   * invented employment history is ever created.
   */
  experience?: OnboardingExperiencePayload | null
}

export interface OnboardingStatus {
  completed: boolean
  completedAt: string | null
}

/**
 * Submits the whole onboarding payload to the backend, which validates it and
 * commits the profile, skills, target career, optional experience and the
 * completion marker in a single transaction.
 *
 * This replaces the previous three independent client writes (PUT /profile,
 * POST /experiences, then a local-only "onboarded" flag), which could leave a
 * half-written profile behind whenever the experience write failed.
 */
export function completeOnboarding(payload: CompleteOnboardingPayload): Promise<CareerProfile> {
  return authRequest<CareerProfile>('POST', '/onboarding', payload)
}

/**
 * Server-owned onboarding completion state. Returns 200 even when the
 * participant has no profile row, so route guards never have to infer
 * completion from a 404 or from the profile's existence.
 */
export function getOnboardingStatus(): Promise<OnboardingStatus> {
  return authRequest<OnboardingStatus>('GET', '/onboarding/status')
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

export type NextActionType =
  | 'COMPLETE_PROFILE'
  | 'ADD_EXPERIENCE'
  | 'COMPLETE_ASSESSMENT'
  | 'DISCOVER_SKILLS'
  | 'SELECT_CAREER'
  | 'REVIEW_SKILL_GAPS'
  | 'COMPLETE_ROADMAP_TASK'
  | 'COMPLETE_CHALLENGE'
  | 'CREATE_EVIDENCE'
  | 'GENERATE_PASSPORT'
  | 'JOURNEY_COMPLETE'

export interface NextAction {
  type: NextActionType
  action: string
  reason: string
  resourceId?: string
}

/** Returns the backend's deterministic single next best action for the participant. */
export function getNextAction(): Promise<NextAction> {
  return authRequest<NextAction>('GET', '/progress/next-action')
}

export interface CareerRecommendation {
  careerId: string
  careerName: string
  matchScore: number
  rank: number
  reason: string
}

/**
 * READY             - the participant's own stored data separated the careers,
 *                     so `recommendations` is a genuine ranking.
 * INSUFFICIENT_DATA - the backend could not tell any two careers apart, so
 *                     `recommendations` is empty and `missing` says what the
 *                     participant still needs to provide. An empty array here is
 *                     NOT a bug to paper over: never substitute a catalogue
 *                     career for it.
 */
export type CareerRecommendationStatus = 'READY' | 'INSUFFICIENT_DATA'

export interface CareerRecommendationsResponse {
  status: CareerRecommendationStatus
  missing: string[]
  recommendations: CareerRecommendation[]
}

/** True when the backend declined to rank careers for lack of participant data. */
export function isInsufficientData(
  response: CareerRecommendationsResponse,
): response is CareerRecommendationsResponse & { status: 'INSUFFICIENT_DATA' } {
  return response.status === 'INSUFFICIENT_DATA'
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

/**
 * Generates a new assessment (or reuses one already valid for the current experience).
 *
 * The empty object is required, not decorative. authRequest always sends
 * `Content-Type: application/json`, and Fastify's JSON parser rejects a bodyless
 * request carrying that header with FST_ERR_CTP_EMPTY_JSON_BODY (400
 * "Invalid request data") before the route handler runs. The route takes no
 * body, so `{}` is the honest body for it.
 */
export function runCareerImpact(experienceId: string): Promise<CareerImpactAnalysis> {
  return authRequest<CareerImpactAnalysis>('POST', `/ai/career-impact/${experienceId}`, {})
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

export interface RoadmapTaskStatusUpdate {
  taskId: string
  status: RoadmapTaskStatus
  completedAt: string | null
  /** Server-recomputed from the task rows; never calculated on the client. */
  roadmapProgress: number
  phaseProgress: { DAY_30: number; DAY_60: number; DAY_90: number }
}

/**
 * Updates a roadmap task's status through the existing authoritative endpoint.
 *
 * The server recomputes every progress figure from the stored task rows, so
 * callers must render whatever it returns rather than tracking progress
 * locally. Throws ApiError(404) when the task does not belong to the caller.
 */
export function updateRoadmapTaskStatus(
  taskId: string,
  status: RoadmapTaskStatus,
): Promise<RoadmapTaskStatusUpdate> {
  return authRequest<RoadmapTaskStatusUpdate>('PATCH', `/roadmaps/tasks/${taskId}`, { status })
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

/**
 * Backend-computed relevance, derived from the challenge_skills table:
 * RECOMMENDED builds a skill the participant's target career requires,
 * BUILDING builds a skill they already have, EXPLORING has no overlap yet.
 * Every catalogue challenge is always returned - this only orders and labels.
 */
export type ChallengeRelevance = 'RECOMMENDED' | 'BUILDING' | 'EXPLORING'

export interface ChallengeListItem {
  id: string
  title: string
  description: string
  difficulty: ChallengeDifficulty
  skills: ChallengeSkillRef[]
  relevance: ChallengeRelevance
  relevanceReason: string
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
