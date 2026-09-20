import { useState, useMemo, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import {
  ArrowRight,
  Briefcase,
  Check,
  CheckCircle2,
  Clock,
  Edit2,
  Lock,
  Plus,
  Search,
  Sparkles,
  X,
  Target,
  BrainCircuit,
  Award,
} from 'lucide-react'
import PurpleBackgroundDots from '../components/dashboard/PurpleBackgroundDots'
import Button from '../components/Button'
import { useUserContext } from '../context/UserContext'
import { ApiError, createExperience, updateProfile, type EmploymentType } from '../lib/api'

/**
 * Maps the Onboarding "work situation" button-group value to the backend's
 * employmentType enum. No exact match exists for every option, so the
 * closest reasonable enum value is used (see project decision).
 */
function mapWorkSituationToEmploymentType(workSituation: string): EmploymentType {
  switch (workSituation) {
    case 'Full-time':
      return 'EMPLOYED'
    case 'Part-time':
      return 'EMPLOYED'
    case 'Freelance':
      return 'FREELANCER'
    case 'Self-employed':
      return 'SELF_EMPLOYED'
    case 'Student':
      return 'STUDENT'
    case 'Career break':
      return 'UNEMPLOYED'
    case 'Other / Transitional':
      return 'UNEMPLOYED'
    default:
      return 'UNEMPLOYED'
  }
}

/**
 * Maps the Onboarding "years of experience" range option to the explicit
 * numeric value the backend requires.
 */
function mapYearsExperienceToNumber(yearsExperience: string): number {
  switch (yearsExperience) {
    case '0–1 years':
      return 0
    case '1–3 years':
      return 2
    case '3–5 years':
      return 4
    case '5–8 years':
      return 6
    case '8+ years':
      return 8
    default:
      return 0
  }
}

// ==========================================
// DYNAMIC CAREER DATABASE & ROLE ADAPTATION
// ==========================================
// ... (ROLE_DATABASE kept intact)

interface RolePreset {
  title: string
  category: 'Design' | 'Engineering' | 'Product' | 'Data & AI' | 'Strategy & Ops' | 'Marketing'
  popularSkills: { name: string; type: 'Technical' | 'Business' | 'Creative' | 'People' | 'Tools' }[]
  suggestedTargetRoles: string[]
  sampleExperience: string
  guidancePrompts: { label: string; text: string }[]
}

const ROLE_DATABASE: Record<string, RolePreset> = {
  'Mobile Developer': {
    title: 'Mobile Developer',
    category: 'Engineering',
    popularSkills: [
      { name: 'React Native', type: 'Technical' },
      { name: 'Flutter', type: 'Technical' },
      { name: 'Swift', type: 'Technical' },
      { name: 'Kotlin', type: 'Technical' },
      { name: 'iOS Development', type: 'Technical' },
      { name: 'Android Studio', type: 'Tools' },
      { name: 'App Store CI/CD', type: 'Tools' },
      { name: 'REST APIs', type: 'Technical' },
      { name: 'Mobile UI/UX', type: 'Creative' },
      { name: 'State Management (Redux/Zustand)', type: 'Technical' },
    ],
    suggestedTargetRoles: [
      'Senior Mobile Engineer',
      'Mobile Solutions Architect',
      'Lead iOS/Android Engineer',
      'AI Mobile Product Engineer',
    ],
    sampleExperience:
      'For the past 4 years as a Mobile Developer, I built and published cross-platform iOS and Android apps using React Native and Swift. Integrated push notifications, offline caching, and optimized UI frame rates to 60fps across devices.',
    guidancePrompts: [
      { label: 'Responsibilities', text: 'Architected mobile frontend components and integrated GraphQL/REST endpoints.' },
      { label: 'Projects', text: 'Shipped a mobile banking app with 500k+ downloads on App Store & Google Play.' },
      { label: 'Problems Solved', text: 'Reduced app bundle size by 35% and improved cold start startup time by 400ms.' },
      { label: 'Tools & Methods', text: 'React Native, Swift, Kotlin, Xcode, Android Studio, Fastlane, Firebase.' },
    ],
  },
  'Frontend Developer': {
    title: 'Frontend Developer',
    category: 'Engineering',
    popularSkills: [
      { name: 'React', type: 'Technical' },
      { name: 'TypeScript', type: 'Technical' },
      { name: 'Next.js', type: 'Technical' },
      { name: 'Tailwind CSS', type: 'Tools' },
      { name: 'Web Performance', type: 'Technical' },
      { name: 'State Management', type: 'Technical' },
      { name: 'GraphQL', type: 'Technical' },
      { name: 'AI SDKs (Vercel/OpenAI)', type: 'Tools' },
      { name: 'Component Libraries (Storybook)', type: 'Tools' },
      { name: 'Accessibility (a11y)', type: 'Technical' },
    ],
    suggestedTargetRoles: [
      'Senior Frontend Engineer',
      'Full-Stack AI Developer',
      'Design Systems Engineer',
      'Frontend Architect',
    ],
    sampleExperience:
      'Architected responsive web applications using React, Next.js, and TypeScript. Improved Lighthouse performance scores by 40% and built dynamic AI-assisted workflow interfaces for B2B users.',
    guidancePrompts: [
      { label: 'Responsibilities', text: 'Led frontend architecture and built reusable UI component libraries.' },
      { label: 'Projects', text: 'Spearheaded migration from legacy SPA to Next.js App Router.' },
      { label: 'Problems Solved', text: 'Eliminated render bottlenecks, reducing initial page load time from 3.2s to 0.8s.' },
      { label: 'Tools & Methods', text: 'React 19, TypeScript, Next.js, Tailwind CSS, Vite, Jest, Storybook.' },
    ],
  },
  'Backend Developer': {
    title: 'Backend Developer',
    category: 'Engineering',
    popularSkills: [
      { name: 'Node.js', type: 'Technical' },
      { name: 'Python', type: 'Technical' },
      { name: 'Go', type: 'Technical' },
      { name: 'PostgreSQL', type: 'Technical' },
      { name: 'Docker & Kubernetes', type: 'Tools' },
      { name: 'Microservices', type: 'Technical' },
      { name: 'Redis', type: 'Technical' },
      { name: 'API Security & OAuth', type: 'Technical' },
      { name: 'AWS Cloud Services', type: 'Tools' },
    ],
    suggestedTargetRoles: [
      'Senior Backend Engineer',
      'Distributed Systems Architect',
      'Principal Cloud Backend Engineer',
      'AI Platform Backend Engineer',
    ],
    sampleExperience:
      'Engineered high-throughput backend services using Python (FastAPI) and Node.js. Designed relational and NoSQL database schemas handling over 10M requests per day with sub-50ms latency.',
    guidancePrompts: [
      { label: 'Responsibilities', text: 'Maintained API gateways, database migrations, and microservice orchestration.' },
      { label: 'Projects', text: 'Built real-time event streaming pipeline processing 100k events/sec with Kafka.' },
      { label: 'Problems Solved', text: 'Refactored slow SQL queries, reducing P99 latency by 75%.' },
      { label: 'Tools & Methods', text: 'Node.js, Python, PostgreSQL, Redis, Docker, Kubernetes, AWS, gRPC.' },
    ],
  },
  'UI/UX Designer': {
    title: 'UI/UX Designer',
    category: 'Design',
    popularSkills: [
      { name: 'UI/UX Design', type: 'Creative' },
      { name: 'Figma', type: 'Tools' },
      { name: 'User Research', type: 'People' },
      { name: 'Prototyping', type: 'Creative' },
      { name: 'Design Systems', type: 'Creative' },
      { name: 'Wireframing', type: 'Creative' },
      { name: 'Usability Testing', type: 'People' },
      { name: 'Interaction Design', type: 'Creative' },
      { name: 'Information Architecture', type: 'Business' },
    ],
    suggestedTargetRoles: [
      'AI Product Designer',
      'Senior UX Architect',
      'Design Systems Lead',
      'Head of Product Design',
    ],
    sampleExperience:
      'For the past 4 years as a UI/UX designer, I led product design for consumer mobile applications and responsive dashboards. I conducted user interviews with over 60 participants and shipped scalable Figma design systems.',
    guidancePrompts: [
      { label: 'Responsibilities', text: 'Owned end-to-end design process from discovery research to high-fidelity Figma handoff.' },
      { label: 'Projects', text: 'Redesigned core onboarding flow, increasing user completion rate by 32%.' },
      { label: 'Problems Solved', text: 'Standardized design system components across web and mobile platforms.' },
      { label: 'Tools & Methods', text: 'Figma, FigJam, Maze, Principle, Design Tokens, User Testing.' },
    ],
  },
  'Product Manager': {
    title: 'Product Manager',
    category: 'Product',
    popularSkills: [
      { name: 'Product Strategy', type: 'Business' },
      { name: 'Roadmapping', type: 'Business' },
      { name: 'User Stories & PRDs', type: 'Business' },
      { name: 'Agile & Scrum', type: 'People' },
      { name: 'A/B Testing', type: 'Technical' },
      { name: 'Product Analytics (Mixpanel)', type: 'Tools' },
      { name: 'Stakeholder Management', type: 'People' },
      { name: 'Go-To-Market (GTM)', type: 'Business' },
    ],
    suggestedTargetRoles: [
      'Senior Product Manager',
      'AI Product Lead',
      'Director of Product',
      'Group Product Manager',
    ],
    sampleExperience:
      'Owned the product vision and execution for a B2B SaaS platform. Collaborated cross-functionally with engineering and design to launch 4 major feature releases that boosted ARR by $1.2M.',
    guidancePrompts: [
      { label: 'Responsibilities', text: 'Managed product backlog, sprint prioritization, and quarterly roadmap execution.' },
      { label: 'Projects', text: 'Launched AI-powered analytics assistant feature used by 80% of enterprise clients.' },
      { label: 'Problems Solved', text: 'Aligned engineering velocity with business goals, reducing time-to-market by 25%.' },
      { label: 'Tools & Methods', text: 'Jira, Amplitude, Mixpanel, Notion, Figma, Agile/Scrum.' },
    ],
  },
  'Data Analyst': {
    title: 'Data Analyst',
    category: 'Data & AI',
    popularSkills: [
      { name: 'SQL', type: 'Technical' },
      { name: 'Python (Pandas/NumPy)', type: 'Technical' },
      { name: 'Tableau / Power BI', type: 'Tools' },
      { name: 'Data Visualization', type: 'Creative' },
      { name: 'A/B Test Analysis', type: 'Business' },
      { name: 'Predictive Modeling', type: 'Technical' },
      { name: 'Business Intelligence', type: 'Business' },
      { name: 'dbt / Snowflake', type: 'Tools' },
    ],
    suggestedTargetRoles: [
      'Senior Data Analyst',
      'Lead Product Analyst',
      'Data Science Manager',
      'AI Data Strategist',
    ],
    sampleExperience:
      'Analyzed large-scale user interaction datasets to extract actionable business insights. Created automated executive dashboards in Tableau and optimized SQL data pipelines.',
    guidancePrompts: [
      { label: 'Responsibilities', text: 'Built real-time metric dashboards and conducted cohort retention analysis.' },
      { label: 'Projects', text: 'Discovered key funnel drop-off points, driving recommendations that recovered $450k in lost conversions.' },
      { label: 'Problems Solved', text: 'Automated manual weekly reporting scripts into Snowflake + dbt models.' },
      { label: 'Tools & Methods', text: 'SQL, Python, Tableau, Snowflake, dbt, Metabase, Excel.' },
    ],
  },
}

const DEFAULT_PRESET: RolePreset = {
  title: 'Professional Specialist',
  category: 'Strategy & Ops',
  popularSkills: [
    { name: 'Project Management', type: 'Business' },
    { name: 'Problem Solving', type: 'People' },
    { name: 'Communication', type: 'People' },
    { name: 'Strategic Planning', type: 'Business' },
    { name: 'Data Analysis', type: 'Technical' },
    { name: 'Process Optimization', type: 'Business' },
    { name: 'Cross-Functional Collaboration', type: 'People' },
    { name: 'Leadership', type: 'People' },
  ],
  suggestedTargetRoles: [
    'Senior Operations Lead',
    'Strategy & Growth Manager',
    'Product Operations Specialist',
    'AI Transformation Consultant',
  ],
  sampleExperience:
    'Led cross-functional initiatives to streamline business operations and improve execution speed. Partnered with technical and executive teams to ship high-impact programs.',
  guidancePrompts: [
    { label: 'Responsibilities', text: 'Managed project scope, stakeholder alignment, and resource allocation.' },
    { label: 'Projects', text: 'Spearheaded operational workflow redesign saving 15 hours per team member weekly.' },
    { label: 'Problems Solved', text: 'Identified efficiency gaps and implemented modern digital automation tools.' },
    { label: 'Tools & Methods', text: 'Asana, Notion, Slack, Google Workspace, Data Analytics, Agile.' },
  ],
}

export default function Onboarding() {
  const navigate = useNavigate()
  const { onboarding, updateOnboarding } = useUserContext()
  const [currentStep, setCurrentStep] = useState<number>(1)

  // Step 2 Form State
  const [currentRole, setCurrentRole] = useState<string>(onboarding.currentRole || 'Frontend Developer')
  const [industry, setIndustry] = useState<string>(onboarding.industry || 'Technology & Software')
  const [yearsExperience, setYearsExperience] = useState<string>(onboarding.yearsOfExperience || '3–5 years')
  const [workSituation, setWorkSituation] = useState<string>(onboarding.workSituation || 'Full-time')
  const [education, setEducation] = useState<string>(onboarding.education || "Bachelor's Degree")

  // Step 3 Skills State
  const activeRolePreset = useMemo(() => {
    return ROLE_DATABASE[currentRole] || DEFAULT_PRESET
  }, [currentRole])

  const [selectedSkills, setSelectedSkills] = useState<string[]>(
    onboarding.skills && onboarding.skills.length > 0
      ? onboarding.skills.map((s) => s.name)
      : activeRolePreset.popularSkills.slice(0, 6).map((s) => s.name)
  )
  const [skillSearchInput, setSkillSearchInput] = useState<string>('')
  const [confidenceLevel, setConfidenceLevel] = useState<string>('Comfortable')

  const handleRoleSelect = (roleName: string) => {
    setCurrentRole(roleName)
    const preset = ROLE_DATABASE[roleName] || DEFAULT_PRESET
    const initialSkillNames = preset.popularSkills.slice(0, 6).map((s) => s.name)
    setSelectedSkills(initialSkillNames)
  }

  // Step 4 Experience State
  const [practicalExperience, setPracticalExperience] = useState<string>('')

  const handleInsertGuidance = (text: string) => {
    setPracticalExperience((prev) => (prev ? `${prev} ${text}` : text))
  }

  // Step 5 Goals State
  const [goalDirection, setGoalDirection] = useState<string>(
    onboarding.goalType === 'Growth' ? 'Grow in my current role' : 'Move into a new role'
  )
  const [targetRole, setTargetRole] = useState<string>(onboarding.targetRole || 'AI Engineer')
  const [nextChapterPriorities, setNextChapterPriorities] = useState<string[]>([
    'Higher Income',
    'AI & New Skills',
    'Remote / Hybrid',
  ])

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const handleFinishOnboarding = async () => {
    if (isSubmitting) return
    setSubmitError('')
    setIsSubmitting(true)

    const employmentType = mapWorkSituationToEmploymentType(workSituation)
    const yearsOfExperience = mapYearsExperienceToNumber(yearsExperience)

    try {
      await updateProfile({
        currentOccupation: currentRole,
        industry,
        yearsOfExperience,
        employmentType,
        education,
      })

      await createExperience({
        title: currentRole,
        description: practicalExperience,
        employmentType,
      })

      updateOnboarding({
        currentRole,
        yearsOfExperience: yearsExperience,
        workSituation,
        industry,
        education,
        skills: selectedSkills.map((name) => ({ name, level: 'Advanced', category: 'Technical' })),
        goalType: goalDirection.toLowerCase().includes('new role') ? 'Transition' : 'Growth',
        targetRole: targetRole || activeRolePreset.suggestedTargetRoles[0] || 'AI Engineer',
        aiAnalysis: `High capability transfer from ${currentRole} to ${targetRole || 'AI Role'}.`,
        isOnboarded: true,
      })

      navigate('/dashboard/insights')
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
      setIsSubmitting(false)
    }
  }

  // Step 7 Analysis Radar Orbit State
  const [analysisProgress, setAnalysisProgress] = useState<number>(12)
  const [analysisPhase, setAnalysisPhase] = useState<string>('Understanding your experience...')
  const [isAnalysisComplete, setIsAnalysisComplete] = useState<boolean>(false)

  // Radar orbital node animation tick
  const [orbitAngle, setOrbitAngle] = useState<number>(0)

  useEffect(() => {
    if (currentStep === 7) {
      const interval = setInterval(() => {
        setOrbitAngle((prev) => (prev + 3) % 360)
      }, 50)
      return () => clearInterval(interval)
    }
  }, [currentStep])

  useEffect(() => {
    if (currentStep === 7) {
      setIsAnalysisComplete(false)
      setAnalysisProgress(15)
      setAnalysisPhase('Understanding your experience...')

      const t1 = setTimeout(() => {
        setAnalysisProgress(42)
        setAnalysisPhase('Mapping your skills & competencies...')
      }, 1000)

      const t2 = setTimeout(() => {
        setAnalysisProgress(74)
        setAnalysisPhase('Assessing AI readiness & market impact...')
      }, 2200)

      const t3 = setTimeout(() => {
        setAnalysisProgress(88)
        setAnalysisPhase('Harmonizing career trajectory...')
      }, 3400)

      const t4 = setTimeout(() => {
        setAnalysisProgress(100)
        setAnalysisPhase('Executive career passport ready!')
        setIsAnalysisComplete(true)
      }, 4500)

      return () => {
        clearTimeout(t1)
        clearTimeout(t2)
        clearTimeout(t3)
        clearTimeout(t4)
      }
    }
  }, [currentStep])

  const addSkill = (skillName: string) => {
    if (!skillName.trim()) return
    if (!selectedSkills.includes(skillName.trim())) {
      setSelectedSkills([...selectedSkills, skillName.trim()])
    }
    setSkillSearchInput('')
  }

  const removeSkill = (skillName: string) => {
    setSelectedSkills(selectedSkills.filter((s) => s !== skillName))
  }

  const handleNextStep = () => {
    if (currentStep < 7) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handlePrevStep = () => {
    if (currentStep > 1 && currentStep !== 7) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const ROLE_SUGGESTIONS_LIST = [
    'Mobile Developer',
    'Frontend Developer',
    'Backend Developer',
    'UI/UX Designer',
    'Product Manager',
    'Data Analyst',
    'AI Engineer',
    'Full Stack Engineer',
    'Graphic Designer',
    'Brand Strategist',
    'DevOps Engineer',
    'Accountant',
    'Virtual Assistant',
    'Project Manager',
  ]

  return (
    <div className="flex min-h-screen w-full bg-slate-50 font-sans text-ink">
      {/* LEFT SIDE PANEL: Brand Photo & Signature Overlay */}
      <div className="relative hidden w-[42%] flex-col justify-between overflow-hidden bg-plum-950 p-10 text-white lg:flex xl:p-14">
        {/* Downloaded Image for Onboarding */}
        <div className="absolute inset-0 z-0">
          <img
            src="/onboarding-hero-woman.jpg"
            alt="HerNext Professional Onboarding"
            className="h-full w-full object-cover object-top opacity-85 transition-opacity duration-300"
          />
          {/* Signature Figma Dark Plum Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#200922] via-[#200922]/70 to-[#200922]/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#200922]/80 via-transparent to-transparent" />
        </div>

        {/* Top Brand Logo */}
        <div className="relative z-20 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2.5 font-display text-2xl font-bold tracking-tight text-white transition-opacity hover:opacity-90"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-peach-300 text-plum-950 font-bold shadow-md">
              H
            </span>
            <span>HerNext</span>
          </Link>
        </div>

        {/* Lower Content Box with Scoped Background Animation */}
        <div className="relative z-20 overflow-hidden rounded-3xl border border-white/10 bg-plum-950/40 p-6 backdrop-blur-md">
          <PurpleBackgroundDots dotCount={15} className="z-0 opacity-50" />

          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="relative z-10 max-w-lg space-y-3"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-peach-300/30 bg-plum-900/60 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-peach-200">
              <Sparkles size={13} className="text-peach-300" />
              YOUR CAREER. YOUR NEXT CHAPTER.
            </span>

            <h1 className="font-display text-2xl font-semibold leading-tight text-white lg:text-3xl xl:text-4xl">
              {currentStep === 1 && 'Your experience can take you further.'}
              {currentStep === 2 && `Customizing for ${currentRole}.`}
              {currentStep === 3 && 'Mapping your transferable skills.'}
              {currentStep === 4 && 'Synthesizing your practical work.'}
              {currentStep === 5 && 'Designing your ideal career target.'}
              {currentStep === 6 && "You're almost ready to begin."}
              {currentStep === 7 && 'Your career story is coming together.'}
            </h1>

            <p className="text-xs leading-relaxed text-white/80 sm:text-sm">
              {currentStep === 6
                ? 'Review your information, then let HerNext uncover your next career move.'
                : currentStep === 7
                  ? "We're turning your experience into your next career direction."
                  : 'Discover where your skills, experience, and ambitions can take you next.'}
            </p>

            <div className="pt-2">
              <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3.5 py-1.5 text-xs font-medium text-white backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                {currentRole} Path Active
              </span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* RIGHT SIDE CANVAS: 7-Step Interactive Onboarding Stepper */}
      <div className="relative flex min-h-screen w-full flex-1 flex-col justify-between overflow-y-auto bg-white lg:w-[58%]">
        <PurpleBackgroundDots dotCount={20} className="z-0 opacity-30" />

        {/* STEPPER HEADER TOP BAR */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-hairline bg-white/95 px-6 py-4 backdrop-blur lg:px-10">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-plum-900 font-display text-sm font-bold text-white lg:hidden">
              H
            </span>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-plum-900">
                Step {currentStep} of 7
              </span>
              <span className="font-display text-sm font-bold text-ink hidden sm:block">
                {currentStep === 1 && '1. Welcome'}
                {currentStep === 2 && '2. Career Right Now'}
                {currentStep === 3 && '3. Your Skills'}
                {currentStep === 4 && '4. Your Experience'}
                {currentStep === 5 && '5. Your Goals'}
                {currentStep === 6 && '6. Review & Confirmation'}
                {currentStep === 7 && '7. AI Career Analysis'}
              </span>
            </div>
          </div>

          {/* Stepper Progress Bar Segment Visualizer */}
          <div className="hidden md:flex items-center gap-1.5">
            {[1, 2, 3, 4, 5, 6, 7].map((num) => (
              <div
                key={num}
                className={`h-2 rounded-full transition-all duration-300 ${
                  num === currentStep
                    ? 'w-8 bg-plum-800'
                    : num < currentStep
                      ? 'w-4 bg-plum-300'
                      : 'w-4 bg-slate-200'
                }`}
              />
            ))}
          </div>

          <Link
            to="/dashboard"
            className="text-xs font-semibold text-body transition-colors hover:text-ink"
          >
            Save & Exit
          </Link>
        </header>

        {/* STEP CONTENT BODY */}
        <main className="relative z-10 mx-auto my-auto w-full max-w-2xl px-6 py-8 sm:px-10">
          <AnimatePresence mode="wait">
            {/* STEP 1: WELCOME TO HERNEXT */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-peach-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-plum-900">
                    Step 1 of 7
                  </span>
                  <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                    Welcome to HerNext
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-body sm:text-base">
                    Let&apos;s map where you are and where you want to go next. In the next few steps, tell us about your career, skills, experience, and goals.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-ink/80">
                    What We&apos;ll Cover Together
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-hairline bg-slate-50/60 p-4 transition-all hover:border-plum-200 hover:bg-white">
                      <div className="flex items-center gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-plum-100 text-xs font-bold text-plum-900">
                          01
                        </span>
                        <div>
                          <h4 className="font-display text-sm font-semibold text-ink">Your career</h4>
                          <p className="text-xs text-body">Tell us where you are today.</p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-hairline bg-slate-50/60 p-4 transition-all hover:border-plum-200 hover:bg-white">
                      <div className="flex items-center gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-plum-100 text-xs font-bold text-plum-900">
                          02
                        </span>
                        <div>
                          <h4 className="font-display text-sm font-semibold text-ink">Your skills</h4>
                          <p className="text-xs text-body">Show us what you already know.</p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-hairline bg-slate-50/60 p-4 transition-all hover:border-plum-200 hover:bg-white">
                      <div className="flex items-center gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-plum-100 text-xs font-bold text-plum-900">
                          03
                        </span>
                        <div>
                          <h4 className="font-display text-sm font-semibold text-ink">Your experience</h4>
                          <p className="text-xs text-body">Tell us about the work you&apos;ve done.</p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-hairline bg-slate-50/60 p-4 transition-all hover:border-plum-200 hover:bg-white">
                      <div className="flex items-center gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-plum-100 text-xs font-bold text-plum-900">
                          04
                        </span>
                        <div>
                          <h4 className="font-display text-sm font-semibold text-ink">Your direction</h4>
                          <p className="text-xs text-body">Tell us where you&apos;d like to go.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-peach-200 bg-peach-50/70 p-4 text-xs text-plum-950">
                  <Clock size={18} className="shrink-0 text-plum-700" />
                  <span>
                    <strong>Takes about 5–7 minutes.</strong> You can save your progress and come back at any time.
                  </span>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-hairline bg-slate-50 p-4 text-xs text-body">
                  <Lock size={18} className="shrink-0 text-plum-800" />
                  <span>
                    <strong>Your information is private & protected.</strong> Your answers are strictly used to personalize your HerNext experience.
                  </span>
                </div>

                <Button
                  variant="primary"
                  onClick={handleNextStep}
                  className="w-full py-3.5 text-sm font-semibold shadow-md transition-transform active:scale-[0.99]"
                >
                  <span className="inline-flex items-center justify-center gap-2">
                    Start my journey
                    <ArrowRight size={16} />
                  </span>
                </Button>
              </motion.div>
            )}

            {/* STEP 2: YOUR CAREER RIGHT NOW */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-plum-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-plum-900">
                    Step 2 of 7: Your Career Right Now
                  </span>
                  <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                    Where are you in your career today?
                  </h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-ink/80">
                      What do you do currently?
                    </label>
                    <div className="relative mt-1.5">
                      <Briefcase
                        size={18}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-body/50"
                      />
                      <input
                        type="text"
                        value={currentRole}
                        onChange={(e) => {
                          setCurrentRole(e.target.value)
                        }}
                        placeholder="Search or enter your role e.g. Mobile Developer, Product Manager..."
                        className="w-full rounded-xl border border-hairline bg-slate-50/50 py-2.5 pl-10 pr-3.5 text-sm text-ink outline-none transition-all focus:border-plum-600 focus:bg-white focus:ring-2 focus:ring-plum-500/20"
                      />
                    </div>

                    {/* Role Suggestion Chips */}
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      <span className="text-[11px] font-medium text-body/70 self-center">
                        Popular Suggestions:
                      </span>
                      {ROLE_SUGGESTIONS_LIST.map((roleName) => (
                        <button
                          key={roleName}
                          type="button"
                          onClick={() => handleRoleSelect(roleName)}
                          className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                            currentRole === roleName
                              ? 'bg-plum-900 text-white shadow-xs'
                              : 'bg-slate-100 text-body hover:bg-plum-100 hover:text-plum-900'
                          }`}
                        >
                          {roleName}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-ink/80">
                        What industry do you work in?
                      </label>
                      <select
                        value={industry}
                        onChange={(e) => setIndustry(e.target.value)}
                        className="mt-1.5 w-full rounded-xl border border-hairline bg-slate-50/50 px-3.5 py-2.5 text-sm text-ink outline-none focus:border-plum-600 focus:bg-white"
                      >
                        <option>Technology & Software</option>
                        <option>Finance & Fintech</option>
                        <option>Healthcare & Biotech</option>
                        <option>E-commerce & Retail</option>
                        <option>Consulting & Strategy</option>
                        <option>Media & Entertainment</option>
                        <option>Education & EdTech</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-ink/80">
                        Years of work experience?
                      </label>
                      <select
                        value={yearsExperience}
                        onChange={(e) => setYearsExperience(e.target.value)}
                        className="mt-1.5 w-full rounded-xl border border-hairline bg-slate-50/50 px-3.5 py-2.5 text-sm text-ink outline-none focus:border-plum-600 focus:bg-white"
                      >
                        <option>0–1 years</option>
                        <option>1–3 years</option>
                        <option>3–5 years</option>
                        <option>5–8 years</option>
                        <option>8+ years</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-ink/80 mb-1.5">
                      What best describes your current work situation?
                    </label>
                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                      {[
                        'Full-time',
                        'Part-time',
                        'Freelance',
                        'Self-employed',
                        'Career break',
                        'Student',
                        'Other / Transitional',
                      ].map((sit) => (
                        <button
                          key={sit}
                          type="button"
                          onClick={() => setWorkSituation(sit)}
                          className={`rounded-xl border p-3 text-center text-xs font-medium transition-all ${
                            workSituation === sit
                              ? 'border-plum-600 bg-plum-50 text-plum-950 font-bold shadow-xs'
                              : 'border-hairline bg-white text-body hover:border-plum-200'
                          }`}
                        >
                          {sit}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-ink/80">
                      Highest level of education?
                    </label>
                    <select
                      value={education}
                      onChange={(e) => setEducation(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-hairline bg-slate-50/50 px-3.5 py-2.5 text-sm text-ink outline-none focus:border-plum-600 focus:bg-white"
                    >
                      <option>Bachelor&apos;s Degree</option>
                      <option>Master&apos;s Degree</option>
                      <option>Doctorate / PhD</option>
                      <option>Associate&apos;s Degree</option>
                      <option>Self-Taught / Bootcamp</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <Button variant="outline" onClick={handlePrevStep} className="px-6 py-2.5 text-xs font-semibold">
                    ← Back
                  </Button>
                  <Button variant="primary" onClick={handleNextStep} className="px-6 py-2.5 text-xs font-semibold">
                    Continue to Skills →
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: YOUR SKILLS */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-plum-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-plum-900">
                    Step 3 of 7: Your Skills
                  </span>
                  <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                    Your Skills
                  </h2>
                  <p className="mt-1.5 text-sm text-body">
                    What can you already do? Showing suggestions tailored for{' '}
                    <strong className="font-semibold text-plum-900">{currentRole}</strong>.
                  </p>
                </div>

                <div>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search
                        size={18}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-body/50"
                      />
                      <input
                        type="text"
                        value={skillSearchInput}
                        onChange={(e) => setSkillSearchInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            addSkill(skillSearchInput)
                          }
                        }}
                        placeholder="Search or type a skill e.g. React Native, Swift, Figma..."
                        className="w-full rounded-xl border border-hairline bg-slate-50/50 py-2.5 pl-10 pr-3.5 text-sm text-ink outline-none transition-all focus:border-plum-600 focus:bg-white"
                      />
                    </div>
                    <Button
                      variant="primary"
                      onClick={() => addSkill(skillSearchInput)}
                      className="px-4 py-2.5 text-xs font-semibold shrink-0"
                    >
                      <Plus size={16} /> Add Skill
                    </Button>
                  </div>
                </div>

                <div className="rounded-2xl border border-hairline bg-slate-50/60 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-ink">
                      Your Selected Skills ({selectedSkills.length})
                    </span>
                    {selectedSkills.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedSkills([])}
                        className="text-[11px] text-rose-600 hover:underline"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {selectedSkills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-1.5 rounded-full border border-plum-200 bg-plum-50 px-3 py-1 text-xs font-semibold text-plum-950 shadow-2xs"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="rounded-full p-0.5 hover:bg-plum-200 text-plum-800"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink/80">
                    Popular Suggestions for {currentRole}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {activeRolePreset.popularSkills.map((item) => {
                      const isSelected = selectedSkills.includes(item.name)
                      return (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() =>
                            isSelected ? removeSkill(item.name) : addSkill(item.name)
                          }
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                            isSelected
                              ? 'border-plum-700 bg-plum-900 text-white shadow-xs'
                              : 'border-hairline bg-white text-body hover:border-plum-300 hover:text-plum-900'
                          }`}
                        >
                          {isSelected ? <Check size={12} /> : <Plus size={12} />}
                          {item.name}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="rounded-xl border border-hairline bg-white p-4 space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-ink/80">
                    Overall Confidence Level across your skills
                  </label>
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    {['Beginner', 'Comfortable', 'Advanced'].map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setConfidenceLevel(lvl)}
                        className={`rounded-xl border py-2 text-center text-xs font-semibold transition-all ${
                          confidenceLevel === lvl
                            ? 'border-plum-600 bg-plum-900 text-white'
                            : 'border-hairline bg-slate-50 text-body hover:bg-slate-100'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <Button variant="outline" onClick={handlePrevStep} className="px-6 py-2.5 text-xs font-semibold">
                    ← Back
                  </Button>
                  <Button variant="primary" onClick={handleNextStep} className="px-6 py-2.5 text-xs font-semibold">
                    Continue to Experience →
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STEP 4: YOUR EXPERIENCE */}
            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-plum-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-plum-900">
                    Step 4 of 7: Your Experience
                  </span>
                  <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                    Your Experience
                  </h2>
                  <p className="mt-1.5 text-sm text-body">
                    Tell us about the work you&apos;ve actually done as a{' '}
                    <strong className="font-semibold text-plum-900">{currentRole}</strong>.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-ink/80">
                      Describe your practical experience
                    </label>
                    <span className="inline-flex items-center gap-1 rounded-full bg-plum-100 px-2.5 py-0.5 text-[10px] font-bold text-plum-900">
                      <Sparkles size={11} /> AI Synthesizer Ready
                    </span>
                  </div>

                  <textarea
                    rows={6}
                    value={practicalExperience}
                    onChange={(e) => setPracticalExperience(e.target.value)}
                    placeholder={`e.g. ${activeRolePreset.sampleExperience}`}
                    className="w-full rounded-2xl border border-hairline bg-slate-50/50 p-4 text-sm text-ink outline-none transition-all focus:border-plum-600 focus:bg-white focus:ring-2 focus:ring-plum-500/20"
                  />

                  <div className="flex items-center justify-between pt-1.5 text-xs text-body/70">
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                      <CheckCircle2 size={13} /> Minimum 100 characters recommended
                    </span>
                    <span>{practicalExperience.length} / 2000 characters</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink/80">
                    Click any guidance prompt to add to your narrative:
                  </span>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {activeRolePreset.guidancePrompts.map((prompt) => (
                      <button
                        key={prompt.label}
                        type="button"
                        onClick={() => handleInsertGuidance(prompt.text)}
                        className="rounded-xl border border-hairline bg-slate-50/70 p-3 text-left transition-all hover:border-plum-300 hover:bg-white"
                      >
                        <span className="text-xs font-bold text-plum-950 block">
                          + {prompt.label}
                        </span>
                        <span className="text-[11px] text-body line-clamp-2 mt-0.5">
                          {prompt.text}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <Button variant="outline" onClick={handlePrevStep} className="px-6 py-2.5 text-xs font-semibold">
                    ← Back
                  </Button>
                  <Button variant="primary" onClick={handleNextStep} className="px-6 py-2.5 text-xs font-semibold">
                    Continue to Goals →
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STEP 5: YOUR GOALS */}
            {currentStep === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-plum-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-plum-900">
                    Step 5 of 7: Career Goals
                  </span>
                  <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                    What would you like your career to look like?
                  </h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-ink/80 mb-1.5">
                      What are you looking for?
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {[
                        'Grow in current career',
                        'Move into a new role',
                        'Pivot to new industry',
                        'Explore career shift',
                      ].map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setGoalDirection(g)}
                          className={`rounded-xl border p-3.5 text-left transition-all ${
                            goalDirection === g
                              ? 'border-plum-600 bg-plum-50 text-plum-950 font-bold shadow-xs'
                              : 'border-hairline bg-white text-body hover:border-plum-200'
                          }`}
                        >
                          <span className="text-xs block">{g}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-ink/80">
                      Target Role Interest
                    </label>
                    <input
                      type="text"
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      placeholder="e.g. Senior Mobile Engineer, AI Product Developer..."
                      className="mt-1.5 w-full rounded-xl border border-hairline bg-slate-50/50 py-2.5 px-3.5 text-sm text-ink outline-none focus:border-plum-600 focus:bg-white"
                    />

                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="text-[11px] text-body/70 self-center">Suggestions:</span>
                      {activeRolePreset.suggestedTargetRoles.map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setTargetRole(r)}
                          className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-body hover:bg-plum-100 hover:text-plum-900"
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-ink/80 mb-1.5">
                      What matters most in your next chapter? (Select Priorities)
                    </label>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {[
                        'Higher Income',
                        'AI & New Skills',
                        'Remote / Hybrid',
                        'Career Growth',
                        'Leadership',
                        'Work-Life Balance',
                      ].map((p) => {
                        const isSelected = nextChapterPriorities.includes(p)
                        return (
                          <button
                            key={p}
                            type="button"
                            onClick={() =>
                              setNextChapterPriorities((prev) =>
                                isSelected ? prev.filter((item) => item !== p) : [...prev, p]
                              )
                            }
                            className={`rounded-xl border p-2.5 text-center text-xs font-medium transition-all ${
                              isSelected
                                ? 'border-plum-600 bg-plum-900 text-white shadow-xs'
                                : 'border-hairline bg-white text-body hover:border-plum-300'
                            }`}
                          >
                            {p}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <Button variant="outline" onClick={handlePrevStep} className="px-6 py-2.5 text-xs font-semibold">
                    ← Back
                  </Button>
                  <Button variant="primary" onClick={handleNextStep} className="px-6 py-2.5 text-xs font-semibold">
                    Continue to Review →
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STEP 6 OF 7: REVIEW YOUR INFORMATION (EXACT FIGMA LAYOUT) */}
            {currentStep === 6 && (
              <motion.div
                key="step6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-plum-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-plum-900">
                      Step 6 of 7 &bull; Review & Confirmation
                    </span>
                    <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                      Review Your Information
                    </h2>
                    <p className="mt-1 text-sm text-body">
                      Make sure everything looks right before we analyze your career profile.
                    </p>
                  </div>
                  <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-peach-300 bg-peach-50 px-3 py-1 text-xs font-semibold text-plum-950">
                    <CheckCircle2 size={13} className="text-emerald-600" />
                    4 Steps Completed
                  </span>
                </div>

                {/* 4 DETAILED FIGMA CARDS */}
                <div className="space-y-4">
                  {/* Card 1: Career Right Now */}
                  <div className="rounded-2xl border border-hairline bg-white p-5 shadow-xs transition-all hover:border-plum-200">
                    <div className="flex items-center justify-between border-b border-hairline/60 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-peach-100 text-plum-900">
                          <Briefcase size={16} />
                        </div>
                        <div>
                          <h4 className="font-display text-sm font-bold text-ink">Career Right Now</h4>
                          <span className="text-[11px] text-body">From Step 2</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(2)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-plum-900 hover:underline"
                      >
                        <Edit2 size={13} /> Edit
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-3 sm:grid-cols-4 text-xs">
                      <div>
                        <span className="text-[10px] font-semibold uppercase text-body/70">Role / Title</span>
                        <p className="font-bold text-ink">{currentRole}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold uppercase text-body/70">Industry</span>
                        <p className="font-bold text-ink">{industry}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold uppercase text-body/70">Experience</span>
                        <p className="font-bold text-ink">{yearsExperience}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold uppercase text-body/70">Employment</span>
                        <p className="font-bold text-ink">{workSituation}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between pt-2 border-t border-hairline/40 text-xs">
                      <span className="text-body">Education: <strong>{education}</strong></span>
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Verified Profile
                      </span>
                    </div>
                  </div>

                  {/* Card 2: Skills */}
                  <div className="rounded-2xl border border-hairline bg-white p-5 shadow-xs transition-all hover:border-plum-200">
                    <div className="flex items-center justify-between border-b border-hairline/60 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-plum-100 text-plum-900">
                          <BrainCircuit size={16} />
                        </div>
                        <div>
                          <h4 className="font-display text-sm font-bold text-ink">Skills</h4>
                          <span className="text-[11px] text-body">
                            From Step 3 &bull; {selectedSkills.length} Core Competencies
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(3)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-plum-900 hover:underline"
                      >
                        <Edit2 size={13} /> Edit
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-3">
                      {selectedSkills.map((s) => (
                        <span key={s} className="rounded-lg border border-hairline bg-slate-50 px-2.5 py-1 text-xs font-medium text-ink">
                          {s}
                        </span>
                      ))}
                    </div>

                    <div className="mt-3 flex items-center justify-between pt-2 border-t border-hairline/40 text-xs">
                      <span className="text-body">Overall Confidence Level:</span>
                      <span className="font-bold text-plum-900 bg-peach-100 px-2.5 py-0.5 rounded-md text-[11px]">
                        {confidenceLevel} (Proficient)
                      </span>
                    </div>
                  </div>

                  {/* Card 3: Experience */}
                  <div className="rounded-2xl border border-hairline bg-white p-5 shadow-xs transition-all hover:border-plum-200">
                    <div className="flex items-center justify-between border-b border-hairline/60 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-900">
                          <Award size={16} />
                        </div>
                        <div>
                          <h4 className="font-display text-sm font-bold text-ink">Experience</h4>
                          <span className="text-[11px] text-body">From Step 4 &bull; Practical Narrative</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(4)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-plum-900 hover:underline"
                      >
                        <Edit2 size={13} /> Edit
                      </button>
                    </div>

                    <div className="mt-3 rounded-xl bg-slate-50 p-3.5 text-xs italic text-body border border-hairline/60">
                      &quot;{practicalExperience || activeRolePreset.sampleExperience}&quot;
                    </div>
                  </div>

                  {/* Card 4: Career Direction */}
                  <div className="rounded-2xl border border-hairline bg-white p-5 shadow-xs transition-all hover:border-plum-200">
                    <div className="flex items-center justify-between border-b border-hairline/60 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-peach-200 text-plum-950">
                          <Target size={16} />
                        </div>
                        <div>
                          <h4 className="font-display text-sm font-bold text-ink">Career Direction</h4>
                          <span className="text-[11px] text-body">From Step 5 &bull; Goals & Next Chapter</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(5)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-plum-900 hover:underline"
                      >
                        <Edit2 size={13} /> Edit
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-3 sm:grid-cols-3 text-xs">
                      <div>
                        <span className="text-[10px] font-semibold uppercase text-body/70">Career Intention</span>
                        <p className="font-bold text-ink">{goalDirection}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold uppercase text-body/70">Target Role</span>
                        <p className="font-bold text-plum-900">{targetRole}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold uppercase text-body/70">What Matters Most</span>
                        <p className="font-bold text-ink">{nextChapterPriorities.join(', ')}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ready Banner */}
                <div className="flex items-center gap-3.5 rounded-2xl border border-plum-200 bg-plum-50/70 p-4 text-xs text-plum-950">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-plum-900 text-white">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <strong className="font-bold text-plum-950">Ready to continue?</strong>
                    <p className="text-[11px] leading-relaxed text-plum-900/90">
                      HerNext will use this information to understand your experience, identify transferable skills, assess AI impact, and recommend your next career path.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Button variant="outline" onClick={handlePrevStep} className="px-6 py-2.5 text-xs font-semibold">
                    ← Back
                  </Button>
                  <Button variant="primary" onClick={handleNextStep} className="px-8 py-3 text-xs font-bold shadow-md">
                    Start My Career Analysis →
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STEP 7 OF 7: ANIMATED RADAR ORBIT NODE SYNTHESIS (EXACT FIGMA DESIGNS) */}
            {currentStep === 7 && (
              <motion.div
                key="step7"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6 text-center py-4"
              >
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-plum-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-plum-900">
                    STEP 7 OF 7 &bull; AI Career Analysis
                  </span>
                  <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                    Analyzing your career...
                  </h2>
                  <p className="mt-1.5 text-xs text-body sm:text-sm">
                    We&apos;re finding the connections that could shape your next move.
                  </p>
                </div>

                {/* ANIMATED ORBITAL RADAR CIRCLE WITH REVOLVING NODES */}
                <div className="relative mx-auto my-6 flex h-64 w-64 items-center justify-center sm:h-72 sm:w-72">
                  {/* Outer Orbital Pulse Ring 1 */}
                  <div className="absolute inset-0 rounded-full border border-plum-200/60 bg-peach-50/30 animate-pulse" />

                  {/* Concentric Orbit Track 2 */}
                  <div className="absolute inset-4 rounded-full border border-dashed border-plum-300/80" />

                  {/* Concentric Orbit Track 3 */}
                  <div className="absolute inset-10 rounded-full border border-plum-400/40" />

                  {/* REVOLVING ORBITAL PARTICLES */}
                  <div
                    className="absolute inset-0 rounded-full pointer-events-none"
                    style={{ transform: `rotate(${orbitAngle}deg)`, transition: 'transform 0.05s linear' }}
                  >
                    <div className="absolute top-2 left-1/2 -ml-2 h-4 w-4 rounded-full bg-plum-700 shadow-lg shadow-plum-500/50" />
                    <div className="absolute bottom-2 left-1/2 -ml-2 h-3 w-3 rounded-full bg-peach-400 shadow-md" />
                    <div className="absolute top-1/2 right-2 -mt-2 h-3.5 w-3.5 rounded-full bg-emerald-500 shadow-md" />
                  </div>

                  {/* 4 CONNECTED NODES AT CARDINAL POINTS */}
                  {/* Node 1: Experience (Top) */}
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-plum-200 bg-white px-3 py-1 text-[11px] font-bold text-plum-950 shadow-md">
                    &bull; Experience
                  </div>

                  {/* Node 2: Skills (Right) */}
                  <div className="absolute top-1/2 -right-6 -translate-y-1/2 rounded-full border border-plum-200 bg-white px-3 py-1 text-[11px] font-bold text-plum-950 shadow-md">
                    &bull; Skills
                  </div>

                  {/* Node 3: AI Impact (Bottom) */}
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-plum-200 bg-white px-3 py-1 text-[11px] font-bold text-plum-950 shadow-md">
                    &bull; AI Impact
                  </div>

                  {/* Node 4: Next Role (Left) */}
                  <div className="absolute top-1/2 -left-6 -translate-y-1/2 rounded-full border border-plum-200 bg-white px-3 py-1 text-[11px] font-bold text-plum-950 shadow-md">
                    &bull; Next Role
                  </div>

                  {/* CENTER CORE HARMONIZING BADGE */}
                  <div className="relative z-10 flex h-32 w-32 flex-col items-center justify-center rounded-full border-4 border-plum-700 bg-plum-950 text-white shadow-2xl">
                    <Sparkles size={18} className="text-peach-300 animate-spin" />
                    <span className="font-display text-2xl font-extrabold text-white mt-1">
                      {analysisProgress}%
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-peach-200">
                      {isAnalysisComplete ? 'COMPLETE' : 'HARMONIZING'}
                    </span>
                  </div>
                </div>

                {/* CURRENT LIVE PHASE STATUS BADGE */}
                <div className="mx-auto max-w-sm">
                  <span className="inline-flex items-center gap-2 rounded-full border border-peach-300 bg-peach-50 px-4 py-1.5 text-xs font-bold text-plum-950 shadow-2xs">
                    <span className="h-2 w-2 rounded-full bg-plum-700 animate-ping" />
                    {analysisPhase}
                  </span>
                </div>

                {/* COMPLETION STATE CARD & CTA */}
                {isAnalysisComplete && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mx-auto max-w-md space-y-4 pt-2"
                  >
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5 text-center shadow-xs">
                      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 mb-2">
                        <CheckCircle2 size={22} />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                        ANALYSIS READY
                      </span>
                      <h4 className="mt-1 font-display text-base font-bold text-emerald-950">
                        Your executive trajectory is prepared!
                      </h4>
                      <p className="mt-1 text-xs text-emerald-800">
                        3 tailored career pathways generated from your background as a{' '}
                        <strong className="font-semibold">{currentRole}</strong>.
                      </p>
                    </div>

                    {submitError && (
                      <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                        {submitError}
                      </div>
                    )}

                    <Button
                      variant="primary"
                      onClick={handleFinishOnboarding}
                      disabled={isSubmitting}
                      className="w-full py-3.5 text-sm font-bold shadow-lg transition-transform active:scale-[0.99]"
                    >
                      {isSubmitting ? (
                        <span className="inline-flex items-center justify-center gap-2">
                          <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                          Saving your profile...
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center gap-2">
                          See My Career Insights
                          <ArrowRight size={18} />
                        </span>
                      )}
                    </Button>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* STEPPER FOOTER */}
        <footer className="relative z-10 border-t border-hairline/60 py-4 text-center text-xs text-body/70">
          256-bit encrypted &bull; Strictly confidential &bull; Step {currentStep} of 7 &bull; HerNext Inc.
        </footer>
      </div>
    </div>
  )
}
