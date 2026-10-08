import { useState, useMemo, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
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
} from "lucide-react";
import PurpleBackgroundDots from "../components/dashboard/PurpleBackgroundDots";
import Button from "../components/Button";
import { useUserContext, type OnboardingState } from "../context/UserContext";
import { hasActiveSession } from "../lib/session";
import {
  ApiError,
  completeOnboarding,
  listCatalogueCareers,
  listCatalogueSkills,
  type CatalogueCareer,
  type CatalogueSkill,
  type EmploymentType,
} from "../lib/api";

/**
 * Maps the Onboarding "work situation" button-group value to the backend's
 * employmentType enum. No exact match exists for every option, so the
 * closest reasonable enum value is used (see project decision).
 */
function mapWorkSituationToEmploymentType(
  workSituation: string,
): EmploymentType {
  switch (workSituation) {
    case "Full-time":
      return "EMPLOYED";
    case "Part-time":
      return "EMPLOYED";
    case "Freelance":
      return "FREELANCER";
    case "Self-employed":
      return "SELF_EMPLOYED";
    case "Student":
      return "STUDENT";
    case "Career break":
      return "UNEMPLOYED";
    case "Other / Transitional":
      return "UNEMPLOYED";
    default:
      return "UNEMPLOYED";
  }
}

/**
 * Maps the Onboarding "years of experience" range option to the explicit
 * numeric value the backend requires.
 */
function mapYearsExperienceToNumber(yearsExperience: string): number {
  switch (yearsExperience) {
    case "0-1 years":
      return 0;
    case "1-3 years":
      return 2;
    case "3-5 years":
      return 4;
    case "5-8 years":
      return 6;
    case "8+ years":
      return 8;
    default:
      return 0;
  }
}

// ==========================================
// DYNAMIC CAREER DATABASE & ROLE ADAPTATION
// ==========================================
// ... (ROLE_DATABASE kept intact)

interface RolePreset {
  title: string;
  category:
    | "Design"
    | "Engineering"
    | "Product"
    | "Data & AI"
    | "Strategy & Ops"
    | "Marketing";
  popularSkills: {
    name: string;
    type: "Technical" | "Business" | "Creative" | "People" | "Tools";
  }[];
  suggestedTargetRoles: string[];
  guidancePrompts: { label: string; hint: string }[];
}

const ROLE_DATABASE: Record<string, RolePreset> = {
  "Mobile Developer": {
    title: "Mobile Developer",
    category: "Engineering",
    popularSkills: [
      { name: "React Native", type: "Technical" },
      { name: "Flutter", type: "Technical" },
      { name: "Swift", type: "Technical" },
      { name: "Kotlin", type: "Technical" },
      { name: "iOS Development", type: "Technical" },
      { name: "Android Studio", type: "Tools" },
      { name: "App Store CI/CD", type: "Tools" },
      { name: "REST APIs", type: "Technical" },
      { name: "Mobile UI/UX", type: "Creative" },
      { name: "State Management (Redux/Zustand)", type: "Technical" },
    ],
    suggestedTargetRoles: [
      "Senior Mobile Engineer",
      "Mobile Solutions Architect",
      "Lead iOS/Android Engineer",
      "AI Mobile Product Engineer",
    ],
    guidancePrompts: [
      {
        label: "Responsibilities",
        hint: "What were you personally responsible for?",
      },
      {
        label: "Projects",
        hint: "What did you build or work on, and for whom?",
      },
      {
        label: "Problems Solved",
        hint: "What went wrong, and what did you do about it?",
      },
      { label: "Tools & Methods", hint: "What did you use day to day?" },
    ],
  },
  "Frontend Developer": {
    title: "Frontend Developer",
    category: "Engineering",
    popularSkills: [
      { name: "React", type: "Technical" },
      { name: "TypeScript", type: "Technical" },
      { name: "Next.js", type: "Technical" },
      { name: "Tailwind CSS", type: "Tools" },
      { name: "Web Performance", type: "Technical" },
      { name: "State Management", type: "Technical" },
      { name: "GraphQL", type: "Technical" },
      { name: "AI SDKs (Vercel/OpenAI)", type: "Tools" },
      { name: "Component Libraries (Storybook)", type: "Tools" },
      { name: "Accessibility (a11y)", type: "Technical" },
    ],
    suggestedTargetRoles: [
      "Senior Frontend Engineer",
      "Full-Stack AI Developer",
      "Design Systems Engineer",
      "Frontend Architect",
    ],
    guidancePrompts: [
      {
        label: "Responsibilities",
        hint: "What were you personally responsible for?",
      },
      {
        label: "Projects",
        hint: "What did you build or work on, and for whom?",
      },
      {
        label: "Problems Solved",
        hint: "What went wrong, and what did you do about it?",
      },
      { label: "Tools & Methods", hint: "What did you use day to day?" },
    ],
  },
  "Backend Developer": {
    title: "Backend Developer",
    category: "Engineering",
    popularSkills: [
      { name: "Node.js", type: "Technical" },
      { name: "Python", type: "Technical" },
      { name: "Go", type: "Technical" },
      { name: "PostgreSQL", type: "Technical" },
      { name: "Docker & Kubernetes", type: "Tools" },
      { name: "Microservices", type: "Technical" },
      { name: "Redis", type: "Technical" },
      { name: "API Security & OAuth", type: "Technical" },
      { name: "AWS Cloud Services", type: "Tools" },
    ],
    suggestedTargetRoles: [
      "Senior Backend Engineer",
      "Distributed Systems Architect",
      "Principal Cloud Backend Engineer",
      "AI Platform Backend Engineer",
    ],
    guidancePrompts: [
      {
        label: "Responsibilities",
        hint: "What were you personally responsible for?",
      },
      {
        label: "Projects",
        hint: "What did you build or work on, and for whom?",
      },
      {
        label: "Problems Solved",
        hint: "What went wrong, and what did you do about it?",
      },
      { label: "Tools & Methods", hint: "What did you use day to day?" },
    ],
  },
  "UI/UX Designer": {
    title: "UI/UX Designer",
    category: "Design",
    popularSkills: [
      { name: "UI/UX Design", type: "Creative" },
      { name: "Figma", type: "Tools" },
      { name: "User Research", type: "People" },
      { name: "Prototyping", type: "Creative" },
      { name: "Design Systems", type: "Creative" },
      { name: "Wireframing", type: "Creative" },
      { name: "Usability Testing", type: "People" },
      { name: "Interaction Design", type: "Creative" },
      { name: "Information Architecture", type: "Business" },
    ],
    suggestedTargetRoles: [
      "AI Product Designer",
      "Senior UX Architect",
      "Design Systems Lead",
      "Head of Product Design",
    ],
    guidancePrompts: [
      {
        label: "Responsibilities",
        hint: "What were you personally responsible for?",
      },
      {
        label: "Projects",
        hint: "What did you build or work on, and for whom?",
      },
      {
        label: "Problems Solved",
        hint: "What went wrong, and what did you do about it?",
      },
      { label: "Tools & Methods", hint: "What did you use day to day?" },
    ],
  },
  "Product Manager": {
    title: "Product Manager",
    category: "Product",
    popularSkills: [
      { name: "Product Strategy", type: "Business" },
      { name: "Roadmapping", type: "Business" },
      { name: "User Stories & PRDs", type: "Business" },
      { name: "Agile & Scrum", type: "People" },
      { name: "A/B Testing", type: "Technical" },
      { name: "Product Analytics (Mixpanel)", type: "Tools" },
      { name: "Stakeholder Management", type: "People" },
      { name: "Go-To-Market (GTM)", type: "Business" },
    ],
    suggestedTargetRoles: [
      "Senior Product Manager",
      "AI Product Lead",
      "Director of Product",
      "Group Product Manager",
    ],
    guidancePrompts: [
      {
        label: "Responsibilities",
        hint: "What were you personally responsible for?",
      },
      {
        label: "Projects",
        hint: "What did you build or work on, and for whom?",
      },
      {
        label: "Problems Solved",
        hint: "What went wrong, and what did you do about it?",
      },
      { label: "Tools & Methods", hint: "What did you use day to day?" },
    ],
  },
  "Data Analyst": {
    title: "Data Analyst",
    category: "Data & AI",
    popularSkills: [
      { name: "SQL", type: "Technical" },
      { name: "Python (Pandas/NumPy)", type: "Technical" },
      { name: "Tableau / Power BI", type: "Tools" },
      { name: "Data Visualization", type: "Creative" },
      { name: "A/B Test Analysis", type: "Business" },
      { name: "Predictive Modeling", type: "Technical" },
      { name: "Business Intelligence", type: "Business" },
      { name: "dbt / Snowflake", type: "Tools" },
    ],
    suggestedTargetRoles: [
      "Senior Data Analyst",
      "Lead Product Analyst",
      "Data Science Manager",
      "AI Data Strategist",
    ],
    guidancePrompts: [
      {
        label: "Responsibilities",
        hint: "What were you personally responsible for?",
      },
      {
        label: "Projects",
        hint: "What did you build or work on, and for whom?",
      },
      {
        label: "Problems Solved",
        hint: "What went wrong, and what did you do about it?",
      },
      { label: "Tools & Methods", hint: "What did you use day to day?" },
    ],
  },
};

/**
 * Skill confidence, stored using the same vocabulary as the persisted
 * `SkillProficiency['level']` union so no value has to be invented or
 * translated on the way into the profile cache.
 */
const CONFIDENCE_LEVELS: Array<{
  value: OnboardingState["skills"][number]["level"];
  label: string;
}> = [
  { value: "Beginner", label: "Beginner" },
  { value: "Intermediate", label: "Comfortable" },
  { value: "Advanced", label: "Advanced" },
];

const DEFAULT_PRESET: RolePreset = {
  title: "Professional Specialist",
  category: "Strategy & Ops",
  popularSkills: [
    { name: "Project Management", type: "Business" },
    { name: "Problem Solving", type: "People" },
    { name: "Communication", type: "People" },
    { name: "Strategic Planning", type: "Business" },
    { name: "Data Analysis", type: "Technical" },
    { name: "Process Optimization", type: "Business" },
    { name: "Cross-Functional Collaboration", type: "People" },
    { name: "Leadership", type: "People" },
  ],
  suggestedTargetRoles: [
    "Senior Operations Lead",
    "Strategy & Growth Manager",
    "Product Operations Specialist",
    "AI Transformation Consultant",
  ],
  guidancePrompts: [
    {
      label: "Responsibilities",
      hint: "What were you personally responsible for?",
    },
    { label: "Projects", hint: "What did you build or work on, and for whom?" },
    {
      label: "Problems Solved",
      hint: "What went wrong, and what did you do about it?",
    },
    { label: "Tools & Methods", hint: "What did you use day to day?" },
  ],
};

interface OnboardingDraft {
  currentStep: number;
  currentRole: string;
  industry: string;
  yearsExperience: string;
  workSituation: string;
  education: string;
  selectedSkillIds: string[];
  selectedCustomSkills: string[];
  confidenceLevel: OnboardingState["skills"][number]["level"];
  practicalExperience: string;
  goalDirection: string;
  nextChapterPriorities: string[];
  targetCareerId: string;
  targetRoleName: string;
}

const ONBOARDING_DRAFT_KEY = "hernext_onboarding_draft:";

function onboardingDraftKey(email: string): string {
  return `${ONBOARDING_DRAFT_KEY}${email.trim().toLowerCase()}`;
}

function loadOnboardingDraft(email: string): Partial<OnboardingDraft> {
  if (!email) return {};
  try {
    const stored = localStorage.getItem(onboardingDraftKey(email));
    if (!stored) return {};
    const value: unknown = JSON.parse(stored);
    if (typeof value !== "object" || value === null) return {};
    const draft = value as Record<string, unknown>;
    const result: Partial<OnboardingDraft> = {};
    if (
      typeof draft.currentStep === "number" &&
      Number.isInteger(draft.currentStep) &&
      draft.currentStep >= 1 &&
      draft.currentStep <= 7
    )
      result.currentStep = draft.currentStep;
    for (const key of [
      "currentRole",
      "industry",
      "yearsExperience",
      "workSituation",
      "education",
      "practicalExperience",
      "goalDirection",
      "targetCareerId",
      "targetRoleName",
    ] as const) {
      if (typeof draft[key] === "string") result[key] = draft[key];
    }
    if (
      Array.isArray(draft.selectedSkillIds) &&
      draft.selectedSkillIds.every((item) => typeof item === "string")
    )
      result.selectedSkillIds = draft.selectedSkillIds;
    if (
      Array.isArray(draft.selectedCustomSkills) &&
      draft.selectedCustomSkills.every((item) => typeof item === "string")
    )
      result.selectedCustomSkills = draft.selectedCustomSkills;
    if (
      Array.isArray(draft.nextChapterPriorities) &&
      draft.nextChapterPriorities.every((item) => typeof item === "string")
    )
      result.nextChapterPriorities = draft.nextChapterPriorities;
    if (
      draft.confidenceLevel === "Beginner" ||
      draft.confidenceLevel === "Intermediate" ||
      draft.confidenceLevel === "Advanced" ||
      draft.confidenceLevel === "Expert"
    )
      result.confidenceLevel = draft.confidenceLevel;
    return result;
  } catch {
    return {};
  }
}

function saveOnboardingDraft(email: string, draft: OnboardingDraft): void {
  if (!email || !hasActiveSession()) return;
  try {
    localStorage.setItem(onboardingDraftKey(email), JSON.stringify(draft));
  } catch {
    // Storage can be unavailable; keep the in-memory onboarding flow usable.
  }
}

export default function Onboarding() {
  const navigate = useNavigate();
  const {
    user,
    onboarding,
    updateOnboarding,
    setOnboardingCompleted,
    onboardingCompleted,
    setCareerProfile,
  } = useUserContext();
  const [draft] = useState(() => {
    if (!user.email || !hasActiveSession()) return {};
    return loadOnboardingDraft(user.email);
  });
  const [currentStep, setCurrentStep] = useState<number>(
    draft.currentStep ?? 1,
  );

  // Someone who has already completed onboarding should be editing their profile
  // in Settings, not replaying this flow: re-running it would overwrite real
  // answers with whatever they type now, and would append a second experience.
  // `onboardingCompleted` is null until the server has answered, and this waits
  // for that answer rather than guessing, so a refresh on /onboarding does not
  // briefly bounce a completed participant to the dashboard.
  useEffect(() => {
    if (onboardingCompleted === true) {
      navigate("/dashboard", { replace: true });
    }
  }, [onboardingCompleted, navigate]);

  // Step 2 Form State
  //
  // These start EMPTY. The previous hardcoded fallbacks
  // ('Frontend Developer', 'Technology & Software', '3-5 years',
  // "Bachelor's Degree") were persisted as if the participant had supplied
  // them, which fed the recommendation scorer phantom experience years. An
  // unknown value is represented as unselected and must be provided by the
  // participant; see validateOnboardingBeforeSubmit().
  const [currentRole, setCurrentRole] = useState<string>(
    draft.currentRole ?? onboarding.currentRole,
  );
  const [industry, setIndustry] = useState<string>(
    draft.industry ?? onboarding.industry,
  );
  const [yearsExperience, setYearsExperience] = useState<string>(
    draft.yearsExperience ?? onboarding.yearsOfExperience,
  );
  const [workSituation, setWorkSituation] = useState<string>(
    draft.workSituation ?? onboarding.workSituation,
  );
  const [education, setEducation] = useState<string>(
    draft.education ?? onboarding.education,
  );

  // Step 3 Skills State
  //
  // Catalogue picks are stored as APPROVED CATALOGUE ids (docs/AGENTS.md A16).
  // Nothing is pre-selected: the previous behaviour auto-selected six preset
  // skills the participant never chose, which fabricated their skill profile
  // and drove the match score.
  //
  // The catalogue is a set of SUGGESTIONS, not an allowlist. A participant who
  // holds a real skill that is not catalogued records it in
  // selectedCustomSkills, which the backend persists as a custom skill.
  const [catalogueSkills, setCatalogueSkills] = useState<CatalogueSkill[]>([]);
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>(
    draft.selectedSkillIds ?? [],
  );
  /**
   * Skills the participant typed that are not in the approved catalogue. Kept as
   * plain names, not ids, because the backend creates the catalogue row for a
   * genuinely new name and reuses an existing one when the name matches.
   */
  const [selectedCustomSkills, setSelectedCustomSkills] = useState<string[]>(
    draft.selectedCustomSkills ?? [],
  );
  const [skillSearchInput, setSkillSearchInput] = useState<string>("");
  const [confidenceLevel, setConfidenceLevel] = useState<
    OnboardingState["skills"][number]["level"]
  >(draft.confidenceLevel ?? "Intermediate");
  const [catalogueLoading, setCatalogueLoading] = useState(true);
  const [catalogueError, setCatalogueError] = useState("");

  const activeRolePreset = useMemo(() => {
    return ROLE_DATABASE[currentRole] || DEFAULT_PRESET;
  }, [currentRole]);

  const selectedSkillNames = useMemo(
    () =>
      catalogueSkills
        .filter((skill) => selectedSkillIds.includes(skill.id))
        .map((skill) => skill.name),
    [catalogueSkills, selectedSkillIds],
  );

  /** Lower-cased names of the picked catalogue skills, for duplicate checks. */
  const selectedCatalogueNames = useMemo(
    () => new Set(selectedSkillNames.map((name) => name.toLowerCase())),
    [selectedSkillNames],
  );

  const skillSearchResults = useMemo(() => {
    const query = skillSearchInput.trim().toLowerCase();
    if (query === "") return [];
    return catalogueSkills
      .filter((skill) => !selectedSkillIds.includes(skill.id))
      .filter((skill) => skill.name.toLowerCase().includes(query))
      .slice(0, 8);
  }, [catalogueSkills, selectedSkillIds, skillSearchInput]);

  const addSkill = (skillId: string) => {
    if (selectedSkillIds.includes(skillId)) return;
    setSelectedSkillIds((prev) => [...prev, skillId]);
    setSkillSearchInput("");
  };

  /**
   * Adds a skill the participant typed that is not in the approved catalogue.
   *
   * The suggested list is a convenience, not an allowlist: a real skill the user
   * actually has must always be recordable, otherwise they are pushed toward
   * claiming a near-enough substitute they do not have. The name is trimmed and
   * de-duplicated case-insensitively against both the catalogue picks and the
   * other custom skills, so "React" and "react" can never both be added.
   */
  const addCustomSkill = () => {
    const name = skillSearchInput.trim();
    if (name === "") return;
    const key = name.toLowerCase();
    const alreadyChosen =
      selectedCustomSkills.some((existing) => existing.toLowerCase() === key) ||
      selectedCatalogueNames.has(key);
    if (alreadyChosen) {
      setSkillSearchInput("");
      return;
    }
    setSelectedCustomSkills((prev) => [...prev, name]);
    setSkillSearchInput("");
  };

  const removeCustomSkill = (name: string) => {
    setSelectedCustomSkills((prev) => prev.filter((entry) => entry !== name));
  };

  /** Adds the top suggestion, or the typed text when nothing matches. */
  const addSkillFromInput = () => {
    if (skillSearchResults.length > 0) {
      addSkill(skillSearchResults[0].id);
      return;
    }
    addCustomSkill();
  };

  const removeSkill = (skillId: string) => {
    setSelectedSkillIds((prev) => prev.filter((id) => id !== skillId));
  };

  const handleRoleSelect = (roleName: string) => {
    setCurrentRole(roleName);
  };

  // Step 4 Experience State
  const [practicalExperience, setPracticalExperience] = useState<string>(
    draft.practicalExperience ?? "",
  );

  /**
   * Adds a blank heading for the participant to write under.
   *
   * This used to insert a fully written sentence describing work the
   * participant may never have done ("Shipped a mobile banking app with 500k+
   * downloads"). That text was stored as their experience and then fed straight
   * into the AI assessment and the Career Passport, so the app ended up
   * asserting a history the participant never claimed - which docs/AI_SPEC.md
   * and backend/AGENTS.md §18 explicitly forbid.
   *
   * Now only the heading is added and the participant supplies the content. A
   * blank prompt is recoverable; invented history is not.
   */
  const handleInsertGuidance = (label: string) => {
    setPracticalExperience((prev) =>
      prev.trim() ? `${prev.trimEnd()}\n\n${label}:\n` : `${label}:\n`,
    );
  };

  // Step 5 Goals State
  //
  // Both of these start UNSELECTED. They used to be pre-seeded ('Grow in my
  // current role' and three priorities such as 'Higher Income'), which meant a
  // participant who simply clicked through had goals recorded that they never
  // expressed - and `careerInterests` is persisted from them, so the fabricated
  // goals reached the database. Nothing about a person's goals is known until
  // they say so.
  const [goalDirection, setGoalDirection] = useState<string>(
    draft.goalDirection ?? "",
  );
  const [nextChapterPriorities, setNextChapterPriorities] = useState<string[]>(
    draft.nextChapterPriorities ?? [],
  );
  const [catalogueCareers, setCatalogueCareers] = useState<CatalogueCareer[]>(
    [],
  );
  const [targetCareerId, setTargetCareerId] = useState<string>(
    draft.targetCareerId ?? "",
  );
  const [targetRoleName, setTargetRoleName] = useState<string>(
    draft.targetRoleName ?? onboarding.targetRole,
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function loadCatalogue() {
      try {
        const [skills, careers] = await Promise.all([
          listCatalogueSkills(),
          listCatalogueCareers(),
        ]);
        if (cancelled) return;
        setCatalogueSkills(skills);
        setCatalogueCareers(careers);
        setCatalogueError("");
      } catch (err) {
        if (cancelled) return;
        setCatalogueError(
          err instanceof ApiError
            ? err.message
            : "Could not load the approved skills and careers catalogue.",
        );
      } finally {
        if (!cancelled) setCatalogueLoading(false);
      }
    }
    void loadCatalogue();
    return () => {
      cancelled = true;
    };
  }, []);

  const validateOnboardingBeforeSubmit = (): string | null => {
    if (currentRole.trim() === "") return "Please tell us your current role.";
    if (industry.trim() === "")
      return "Please choose the industry you work in.";
    if (yearsExperience.trim() === "")
      return "Please choose your years of work experience.";
    if (workSituation.trim() === "")
      return "Please choose your current work situation.";
    if (goalDirection.trim() === "")
      return "Please choose which direction you are heading in.";
    if (targetCareerId === "")
      return "Please choose a target career from the approved catalogue.";
    return null;
  };

  useEffect(() => {
    if (isCompleted) return;
    if (!user.email || !hasActiveSession()) return;
    saveOnboardingDraft(user.email, {
      currentStep,
      currentRole,
      industry,
      yearsExperience,
      workSituation,
      education,
      selectedSkillIds,
      selectedCustomSkills,
      confidenceLevel,
      practicalExperience,
      goalDirection,
      nextChapterPriorities,
      targetCareerId,
      targetRoleName,
    });
  }, [
    user.email,
    isCompleted,
    currentStep,
    currentRole,
    industry,
    yearsExperience,
    workSituation,
    education,
    selectedSkillIds,
    selectedCustomSkills,
    confidenceLevel,
    practicalExperience,
    goalDirection,
    nextChapterPriorities,
    targetCareerId,
    targetRoleName,
  ]);

  const handleSaveAndExit = () => {
    saveOnboardingDraft(user.email, {
      currentStep,
      currentRole,
      industry,
      yearsExperience,
      workSituation,
      education,
      selectedSkillIds,
      selectedCustomSkills,
      confidenceLevel,
      practicalExperience,
      goalDirection,
      nextChapterPriorities,
      targetCareerId,
      targetRoleName,
    });
    navigate("/");
  };

  const handleFinishOnboarding = async () => {
    if (isSubmitting) return;
    setSubmitError("");

    const validationError = validateOnboardingBeforeSubmit();
    if (validationError !== null) {
      setSubmitError(validationError);
      return;
    }

    setIsSubmitting(true);

    const employmentType = mapWorkSituationToEmploymentType(workSituation);
    const yearsOfExperience = mapYearsExperienceToNumber(yearsExperience);
    const trimmedExperience = practicalExperience.trim();
    const targetCareer = catalogueCareers.find(
      (career) => career.id === targetCareerId,
    );

    try {
      // ONE atomic backend call. The profile, skills, target career, the
      // optional experience and the onboarding completion marker are validated
      // and committed together, so a failure can no longer leave a
      // half-written profile behind.
      //
      // This replaces the previous two-call flow (updateProfile, then
      // createExperience). That flow posted `description: ""` whenever the
      // participant had no experience to describe, which the backend rejected,
      // and it could save the profile while losing the experience. There is no
      // longer a partial-save state to report, so the committed profile is
      // pushed into the shared careerProfile cache directly.
      const savedProfile = await completeOnboarding({
        currentOccupation: currentRole.trim(),
        industry: industry.trim(),
        yearsOfExperience,
        employmentType,
        education: education.trim() === "" ? null : education.trim(),
        careerInterests: nextChapterPriorities,
        targetCareerId,
        skillIds: selectedSkillIds,
        // Skills typed by the participant that are not in the catalogue. Sent
        // alongside the catalogue ids so both kinds of skill are recorded.
        customSkills: selectedCustomSkills,
        // Only record an experience when the participant actually described
        // one. Otherwise nothing is stored - no placeholder job history.
        experience:
          trimmedExperience === ""
            ? null
            : {
                title: currentRole.trim(),
                description: trimmedExperience,
                employmentType,
              },
      });
      setCareerProfile(savedProfile);
      updateOnboarding({
        currentRole: currentRole.trim(),
        yearsOfExperience: yearsExperience,
        workSituation,
        industry: industry.trim(),
        education,
        skills: selectedSkillIds.map((id) => {
          const entry = catalogueSkills.find((skill) => skill.id === id);
          return {
            name: entry?.name ?? "",
            level: confidenceLevel,
            category: entry?.category ?? "",
          };
        }),
        goalType: goalDirection.toLowerCase().includes("new role")
          ? "Transition"
          : "Growth",
        targetRole: targetCareer?.name ?? targetRoleName,
        aiAnalysis: "",
        isOnboarded: true,
      });
      setOnboardingCompleted(true);
      setIsCompleted(true);
      try {
        localStorage.removeItem(onboardingDraftKey(user.email));
      } catch {
        // Completion must not depend on browser storage being available.
      }

      navigate("/dashboard");
    } catch (err) {
      // The backend's `error.details` carries the specific rejected field; its
      // `message` is only the generic "Invalid request data". Showing the detail
      // tells the participant what to actually fix.
      if (err instanceof ApiError) {
        setSubmitError(err.firstDetailMessage ?? err.message);
      } else {
        setSubmitError("Something went wrong. Please try again.");
      }
      setIsSubmitting(false);
    }
  };

  // Step 7 Analysis Radar Orbit State
  const [analysisProgress, setAnalysisProgress] = useState<number>(12);
  const [analysisPhase, setAnalysisPhase] = useState<string>(
    "Understanding your experience...",
  );
  const [isAnalysisComplete, setIsAnalysisComplete] = useState<boolean>(false);

  // Radar orbital node animation tick
  const [orbitAngle, setOrbitAngle] = useState<number>(0);

  useEffect(() => {
    if (currentStep === 7) {
      const interval = setInterval(() => {
        setOrbitAngle((prev) => (prev + 3) % 360);
      }, 50);
      return () => clearInterval(interval);
    }
  }, [currentStep]);

  useEffect(() => {
    if (currentStep === 7) {
      setIsAnalysisComplete(false);
      setAnalysisProgress(15);
      setAnalysisPhase("Understanding your experience...");

      const t1 = setTimeout(() => {
        setAnalysisProgress(42);
        setAnalysisPhase("Mapping your skills & competencies...");
      }, 1000);

      const t2 = setTimeout(() => {
        setAnalysisProgress(74);
        setAnalysisPhase("Assessing AI readiness & market impact...");
      }, 2200);

      const t3 = setTimeout(() => {
        setAnalysisProgress(88);
        setAnalysisPhase("Harmonizing career trajectory...");
      }, 3400);

      const t4 = setTimeout(() => {
        setAnalysisProgress(100);
        setAnalysisPhase("Executive career passport ready!");
        setIsAnalysisComplete(true);
      }, 4500);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
      };
    }
  }, [currentStep]);

  const handleNextStep = () => {
    if (currentStep < 7) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1 && currentStep !== 7) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const ROLE_SUGGESTIONS_LIST = [
    "Mobile Developer",
    "Frontend Developer",
    "Backend Developer",
    "UI/UX Designer",
    "Product Manager",
    "Data Analyst",
    "AI Engineer",
    "Full Stack Engineer",
    "Graphic Designer",
    "Brand Strategist",
    "DevOps Engineer",
    "Accountant",
    "Virtual Assistant",
    "Project Manager",
  ];

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
              {currentStep === 1 && "Your experience can take you further."}
              {currentStep === 2 &&
                (currentRole.trim()
                  ? "Your current role"
                  : "Tell us about your current role")}
              {currentStep === 3 && "Mapping your transferable skills."}
              {currentStep === 4 && "Synthesizing your practical work."}
              {currentStep === 5 && "Designing your ideal career target."}
              {currentStep === 6 && "You're almost ready to begin."}
              {currentStep === 7 && "Your career story is coming together."}
            </h1>

            <p className="text-xs leading-relaxed text-white/80 sm:text-sm">
              {currentStep === 6
                ? "Review your information, then let HerNext uncover your next career move."
                : currentStep === 7
                  ? "We're turning your experience into your next career direction."
                  : "Discover where your skills, experience, and ambitions can take you next."}
            </p>

            {currentRole.trim() && (
              <div className="pt-2">
                <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3.5 py-1.5 text-xs font-medium text-white backdrop-blur-md">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  Current role: {currentRole}
                </span>
              </div>
            )}
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
                {currentStep === 1 && "Welcome"}
                {currentStep === 2 && "Career Right Now"}
                {currentStep === 3 && "Your Skills"}
                {currentStep === 4 && "Your Experience"}
                {currentStep === 5 && "Your Goals"}
                {currentStep === 6 && "Review & Confirmation"}
                {currentStep === 7 && "AI Career Analysis"}
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
                    ? "w-8 bg-plum-800"
                    : num < currentStep
                      ? "w-4 bg-plum-300"
                      : "w-4 bg-slate-200"
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={handleSaveAndExit}
            className="text-xs font-semibold text-body transition-colors hover:text-ink"
          >
            Save & Exit
          </button>
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
                    Let&apos;s map where you are and where you want to go next.
                    In the next few steps, tell us about your career, skills,
                    experience, and goals.
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
                          <h4 className="font-display text-sm font-semibold text-ink">
                            Your career
                          </h4>
                          <p className="text-xs text-body">
                            Tell us where you are today.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-hairline bg-slate-50/60 p-4 transition-all hover:border-plum-200 hover:bg-white">
                      <div className="flex items-center gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-plum-100 text-xs font-bold text-plum-900">
                          02
                        </span>
                        <div>
                          <h4 className="font-display text-sm font-semibold text-ink">
                            Your skills
                          </h4>
                          <p className="text-xs text-body">
                            Show us what you already know.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-hairline bg-slate-50/60 p-4 transition-all hover:border-plum-200 hover:bg-white">
                      <div className="flex items-center gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-plum-100 text-xs font-bold text-plum-900">
                          03
                        </span>
                        <div>
                          <h4 className="font-display text-sm font-semibold text-ink">
                            Your experience
                          </h4>
                          <p className="text-xs text-body">
                            Tell us about the work you&apos;ve done.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-hairline bg-slate-50/60 p-4 transition-all hover:border-plum-200 hover:bg-white">
                      <div className="flex items-center gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-plum-100 text-xs font-bold text-plum-900">
                          04
                        </span>
                        <div>
                          <h4 className="font-display text-sm font-semibold text-ink">
                            Your direction
                          </h4>
                          <p className="text-xs text-body">
                            Tell us where you&apos;d like to go.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-peach-200 bg-peach-50/70 p-4 text-xs text-plum-950">
                  <Clock size={18} className="shrink-0 text-plum-700" />
                  <span>
                    <strong>Takes about 5–7 minutes.</strong> You can save
                    your progress and come back at any time.
                  </span>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-hairline bg-slate-50 p-4 text-xs text-body">
                  <Lock size={18} className="shrink-0 text-plum-800" />
                  <span>
                    <strong>Your information is private & protected.</strong>{" "}
                    Your answers are strictly used to personalize your HerNext
                    experience.
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
                          setCurrentRole(e.target.value);
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
                              ? "bg-plum-900 text-white shadow-xs"
                              : "bg-slate-100 text-body hover:bg-plum-100 hover:text-plum-900"
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
                        <option value="">Select your industry</option>
                        <option>Technology & Software</option>
                        <option>Finance & Fintech</option>
                        <option>Healthcare & Biotech</option>
                        <option>E-commerce & Retail</option>
                        <option>Consulting & Strategy</option>
                        <option>Media & Entertainment</option>
                        <option>Education & EdTech</option>
                      </select>
                      <p className="mt-1.5 text-xs text-body">
                        Your industry is used to tailor your AI impact
                        assessment. HerNext currently recommends careers in
                        finance, banking and fintech.
                      </p>
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
                        <option value="">Select your experience</option>
                        <option>0-1 years</option>
                        <option>1-3 years</option>
                        <option>3-5 years</option>
                        <option>5-8 years</option>
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
                        "Full-time",
                        "Part-time",
                        "Freelance",
                        "Self-employed",
                        "Career break",
                        "Student",
                        "Other / Transitional",
                      ].map((sit) => (
                        <button
                          key={sit}
                          type="button"
                          onClick={() => setWorkSituation(sit)}
                          className={`rounded-xl border p-3 text-center text-xs font-medium transition-all ${
                            workSituation === sit
                              ? "border-plum-600 bg-plum-50 text-plum-950 font-bold shadow-xs"
                              : "border-hairline bg-white text-body hover:border-plum-200"
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
                  <Button
                    variant="outline"
                    onClick={handlePrevStep}
                    className="px-6 py-2.5 text-xs font-semibold"
                  >
                    ← Back
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleNextStep}
                    className="px-6 py-2.5 text-xs font-semibold"
                  >
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
                    What can you already do? Showing suggestions tailored for{" "}
                    <strong className="font-semibold text-plum-900">
                      {currentRole}
                    </strong>
                    .
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
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addSkillFromInput();
                          }
                        }}
                        placeholder="Search skills, or type your own and press Enter"
                        className="w-full rounded-xl border border-hairline bg-slate-50/50 py-2.5 pl-10 pr-3.5 text-sm text-ink outline-none transition-all focus:border-plum-600 focus:bg-white"
                      />
                    </div>
                    <Button
                      variant="primary"
                      disabled={skillSearchInput.trim() === ""}
                      onClick={addSkillFromInput}
                      className="px-4 py-2.5 text-xs font-semibold shrink-0"
                    >
                      <Plus size={16} /> Add Skill
                    </Button>
                  </div>

                  {catalogueError !== "" && (
                    <p
                      role="alert"
                      className="mt-2 text-xs font-semibold text-rose-700"
                    >
                      {catalogueError}
                    </p>
                  )}

                  {!catalogueError && skillSearchInput.trim() !== "" && (
                    <div className="mt-2 rounded-xl border border-hairline bg-white p-1.5 shadow-xs">
                      {skillSearchResults.length === 0 ? (
                        <button
                          type="button"
                          onClick={addCustomSkill}
                          className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left transition-colors hover:bg-plum-50 cursor-pointer"
                        >
                          <span className="min-w-0">
                            <span className="block text-xs font-medium text-ink truncate">
                              Add &ldquo;{skillSearchInput.trim()}&rdquo; as
                              your own skill
                            </span>
                            <span className="block text-[11px] text-body/70">
                              Not in the suggestions? Add it anyway &mdash; we
                              keep it on your profile.
                            </span>
                          </span>
                          <Plus size={14} className="shrink-0 text-plum-700" />
                        </button>
                      ) : (
                        skillSearchResults.map((skill) => (
                          <button
                            key={skill.id}
                            type="button"
                            onClick={() => addSkill(skill.id)}
                            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-medium text-ink hover:bg-plum-50"
                          >
                            <span>{skill.name}</span>
                            <span className="text-[10px] uppercase tracking-wide text-body/60">
                              {skill.category.replace(/_/g, " ")}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-hairline bg-slate-50/60 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-ink">
                      Your Selected Skills (
                      {selectedSkillIds.length + selectedCustomSkills.length})
                    </span>
                    {(selectedSkillIds.length > 0 ||
                      selectedCustomSkills.length > 0) && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSkillIds([]);
                          setSelectedCustomSkills([]);
                        }}
                        className="text-[11px] text-rose-600 hover:underline"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                  {selectedSkillIds.length === 0 &&
                    selectedCustomSkills.length === 0 && (
                      <p className="pt-1 text-xs text-body/70">
                        No skills selected yet. Add the skills you genuinely
                        have - nothing is selected for you. Suggestions are a
                        starting point, not a limit.
                      </p>
                    )}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {selectedSkillNames.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-1.5 rounded-full border border-plum-200 bg-plum-50 px-3 py-1 text-xs font-semibold text-plum-950 shadow-2xs"
                      >
                        {skill}
                        <button
                          type="button"
                          aria-label={`Remove ${skill}`}
                          onClick={() =>
                            removeSkill(
                              catalogueSkills.find(
                                (item) => item.name === skill,
                              )?.id ?? "",
                            )
                          }
                          className="rounded-full p-0.5 hover:bg-plum-200 text-plum-800"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                    {selectedCustomSkills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-plum-300 bg-white px-3 py-1 text-xs font-semibold text-plum-900 shadow-2xs"
                      >
                        {skill}
                        <span className="rounded-full bg-plum-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-plum-700">
                          Your own
                        </span>
                        <button
                          type="button"
                          aria-label={`Remove ${skill}`}
                          onClick={() => removeCustomSkill(skill)}
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
                    {catalogueLoading
                      ? "Loading the approved skills catalogue..."
                      : `Browse the approved catalogue (${catalogueSkills.length} skills)`}
                  </span>
                  <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto">
                    {catalogueSkills.map((item) => {
                      const isSelected = selectedSkillIds.includes(item.id);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() =>
                            isSelected
                              ? removeSkill(item.id)
                              : addSkill(item.id)
                          }
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                            isSelected
                              ? "border-plum-700 bg-plum-900 text-white shadow-xs"
                              : "border-hairline bg-white text-body hover:border-plum-300 hover:text-plum-900"
                          }`}
                        >
                          {isSelected ? (
                            <Check size={12} />
                          ) : (
                            <Plus size={12} />
                          )}
                          {item.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-xl border border-hairline bg-white p-4 space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-ink/80">
                    Overall Confidence Level across your skills
                  </label>
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    {CONFIDENCE_LEVELS.map((lvl) => (
                      <button
                        key={lvl.value}
                        type="button"
                        onClick={() => setConfidenceLevel(lvl.value)}
                        className={`rounded-xl border py-2 text-center text-xs font-semibold transition-all ${
                          confidenceLevel === lvl.value
                            ? "border-plum-600 bg-plum-900 text-white"
                            : "border-hairline bg-slate-50 text-body hover:bg-slate-100"
                        }`}
                      >
                        {lvl.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={handlePrevStep}
                    className="px-6 py-2.5 text-xs font-semibold"
                  >
                    ← Back
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleNextStep}
                    className="px-6 py-2.5 text-xs font-semibold"
                  >
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
                    Tell us about the work you&apos;ve actually done as a{" "}
                    <strong className="font-semibold text-plum-900">
                      {currentRole}
                    </strong>
                    .
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
                    placeholder="Describe what you actually did. Write only what is true for you - this text is stored as your experience and is what the AI assessment analyses, so it must not describe work you did not do."
                    className="w-full rounded-2xl border border-hairline bg-slate-50/50 p-4 text-sm text-ink outline-none transition-all focus:border-plum-600 focus:bg-white focus:ring-2 focus:ring-plum-500/20"
                  />

                  <div className="flex items-center justify-between pt-1.5 text-xs text-body/70">
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                      <CheckCircle2 size={13} /> Minimum 100 characters
                      recommended
                    </span>
                    <span>{practicalExperience.length} / 2000 characters</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink/80">
                    Add a section to write under:
                  </span>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {activeRolePreset.guidancePrompts.map((prompt) => (
                      <button
                        key={prompt.label}
                        type="button"
                        onClick={() => handleInsertGuidance(prompt.label)}
                        className="rounded-xl border border-hairline bg-slate-50/70 p-3 text-left transition-all hover:border-plum-300 hover:bg-white"
                      >
                        <span className="text-xs font-bold text-plum-950 block">
                          + {prompt.label}
                        </span>
                        <span className="text-[11px] text-body line-clamp-2 mt-0.5">
                          {prompt.hint}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={handlePrevStep}
                    className="px-6 py-2.5 text-xs font-semibold"
                  >
                    ← Back
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleNextStep}
                    className="px-6 py-2.5 text-xs font-semibold"
                  >
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
                        "Grow in current career",
                        "Move into a new role",
                        "Pivot to new industry",
                        "Explore career shift",
                      ].map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setGoalDirection(g)}
                          className={`rounded-xl border p-3.5 text-left transition-all ${
                            goalDirection === g
                              ? "border-plum-600 bg-plum-50 text-plum-950 font-bold shadow-xs"
                              : "border-hairline bg-white text-body hover:border-plum-200"
                          }`}
                        >
                          <span className="text-xs block">{g}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-ink/80">
                      Target Career Interest
                    </label>
                    <p className="mt-1 text-xs text-body/70">
                      Choose a career from the approved HerNext catalogue. This
                      is stored as your target so recommendations are based on
                      your real goal. The current catalogue covers finance,
                      banking and fintech roles.
                    </p>
                    <div className="mt-2 max-h-56 overflow-y-auto rounded-xl border border-hairline bg-slate-50/50 p-1.5">
                      {catalogueLoading && (
                        <p className="px-3 py-2 text-xs text-body/70">
                          Loading catalogue...
                        </p>
                      )}
                      {!catalogueLoading && catalogueCareers.length === 0 && (
                        <p className="px-3 py-2 text-xs text-rose-700">
                          The career catalogue could not be loaded. Reload to
                          try again.
                        </p>
                      )}
                      {catalogueCareers.map((career) => {
                        const isSelected = targetCareerId === career.id;
                        return (
                          <button
                            key={career.id}
                            type="button"
                            onClick={() => {
                              setTargetCareerId(career.id);
                              setTargetRoleName(career.name);
                            }}
                            className={`flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left transition-all ${
                              isSelected
                                ? "bg-plum-900 text-white"
                                : "hover:bg-plum-50"
                            }`}
                          >
                            <span className="mt-0.5">
                              {isSelected ? (
                                <Check size={14} />
                              ) : (
                                <Target size={14} />
                              )}
                            </span>
                            <span className="min-w-0">
                              <span className="block text-xs font-semibold">
                                {career.name}
                              </span>
                              <span
                                className={`block text-[10px] ${isSelected ? "text-white/75" : "text-body/70"}`}
                              >
                                {career.industry} &middot; {career.level}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {targetCareerId !== "" && (
                      <p className="mt-2 text-xs font-semibold text-plum-900">
                        Selected target:{" "}
                        {
                          catalogueCareers.find(
                            (career) => career.id === targetCareerId,
                          )?.name
                        }
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-ink/80 mb-1.5">
                      What matters most in your next chapter? (Select
                      Priorities)
                    </label>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {[
                        "Higher Income",
                        "AI & New Skills",
                        "Remote / Hybrid",
                        "Career Growth",
                        "Leadership",
                        "Work-Life Balance",
                      ].map((p) => {
                        const isSelected = nextChapterPriorities.includes(p);
                        return (
                          <button
                            key={p}
                            type="button"
                            onClick={() =>
                              setNextChapterPriorities((prev) =>
                                isSelected
                                  ? prev.filter((item) => item !== p)
                                  : [...prev, p],
                              )
                            }
                            className={`rounded-xl border p-2.5 text-center text-xs font-medium transition-all ${
                              isSelected
                                ? "border-plum-600 bg-plum-900 text-white shadow-xs"
                                : "border-hairline bg-white text-body hover:border-plum-300"
                            }`}
                          >
                            {p}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={handlePrevStep}
                    className="px-6 py-2.5 text-xs font-semibold"
                  >
                    ← Back
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleNextStep}
                    className="px-6 py-2.5 text-xs font-semibold"
                  >
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
                      Make sure everything looks right before we analyze your
                      career profile.
                    </p>
                  </div>
                  <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-peach-300 bg-peach-50 px-3 py-1 text-xs font-semibold text-plum-950">
                    <CheckCircle2 size={13} className="text-emerald-600" />4
                    Steps Completed
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
                          <h4 className="font-display text-sm font-bold text-ink">
                            Career Right Now
                          </h4>
                          <span className="text-[11px] text-body">
                            From Step 2
                          </span>
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
                        <span className="text-[10px] font-semibold uppercase text-body/70">
                          Role / Title
                        </span>
                        <p className="font-bold text-ink">{currentRole}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold uppercase text-body/70">
                          Industry
                        </span>
                        <p className="font-bold text-ink">{industry}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold uppercase text-body/70">
                          Experience
                        </span>
                        <p className="font-bold text-ink">{yearsExperience}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold uppercase text-body/70">
                          Employment
                        </span>
                        <p className="font-bold text-ink">{workSituation}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between pt-2 border-t border-hairline/40 text-xs">
                      <span className="text-body">
                        Education: <strong>{education}</strong>
                      </span>
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{" "}
                        Verified Profile
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
                          <h4 className="font-display text-sm font-bold text-ink">
                            Skills
                          </h4>
                          <span className="text-[11px] text-body">
                            From Step 3 &bull; {selectedSkillIds.length} Core
                            Competencies
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
                      {selectedSkillNames.map((s) => (
                        <span
                          key={s}
                          className="rounded-lg border border-hairline bg-slate-50 px-2.5 py-1 text-xs font-medium text-ink"
                        >
                          {s}
                        </span>
                      ))}
                    </div>

                    <div className="mt-3 flex items-center justify-between pt-2 border-t border-hairline/40 text-xs">
                      <span className="text-body">
                        Overall Confidence Level:
                      </span>
                      <span className="font-bold text-plum-900 bg-peach-100 px-2.5 py-0.5 rounded-md text-[11px]">
                        {confidenceLevel}
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
                          <h4 className="font-display text-sm font-bold text-ink">
                            Experience
                          </h4>
                          <span className="text-[11px] text-body">
                            From Step 4 &bull; Practical Narrative
                          </span>
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

                    {practicalExperience ? (
                      <div className="mt-3 rounded-xl bg-slate-50 p-3.5 text-xs italic text-body border border-hairline/60">
                        &quot;{practicalExperience}&quot;
                      </div>
                    ) : (
                      <div className="mt-3 rounded-xl bg-slate-50 p-3.5 text-xs text-body border border-hairline/60">
                        You did not write a practical narrative. Go back to Step
                        4 to add one, otherwise your experience summary will be
                        empty.
                      </div>
                    )}
                  </div>

                  {/* Card 4: Career Direction */}
                  <div className="rounded-2xl border border-hairline bg-white p-5 shadow-xs transition-all hover:border-plum-200">
                    <div className="flex items-center justify-between border-b border-hairline/60 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-peach-200 text-plum-950">
                          <Target size={16} />
                        </div>
                        <div>
                          <h4 className="font-display text-sm font-bold text-ink">
                            Career Direction
                          </h4>
                          <span className="text-[11px] text-body">
                            From Step 5 &bull; Goals & Next Chapter
                          </span>
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
                        <span className="text-[10px] font-semibold uppercase text-body/70">
                          Career Intention
                        </span>
                        <p className="font-bold text-ink">{goalDirection}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold uppercase text-body/70">
                          Target Career
                        </span>
                        <p className="font-bold text-plum-900">
                          {catalogueCareers.find(
                            (career) => career.id === targetCareerId,
                          )?.name ?? "Not selected yet"}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold uppercase text-body/70">
                          What Matters Most
                        </span>
                        <p className="font-bold text-ink">
                          {nextChapterPriorities.length > 0
                            ? nextChapterPriorities.join(", ")
                            : "Not chosen yet"}
                        </p>
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
                    <strong className="font-bold text-plum-950">
                      Ready to continue?
                    </strong>
                    <p className="text-[11px] leading-relaxed text-plum-900/90">
                      HerNext will use this information to understand your
                      experience, identify transferable skills, assess AI
                      impact, and recommend your next career path.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Button
                    variant="outline"
                    onClick={handlePrevStep}
                    className="px-6 py-2.5 text-xs font-semibold"
                  >
                    ← Back
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleNextStep}
                    className="px-8 py-3 text-xs font-bold shadow-md"
                  >
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
                    We&apos;re finding the connections that could shape your
                    next move.
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
                    style={{
                      transform: `rotate(${orbitAngle}deg)`,
                      transition: "transform 0.05s linear",
                    }}
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
                    <Sparkles
                      size={18}
                      className="text-peach-300 animate-spin"
                    />
                    <span className="font-display text-2xl font-extrabold text-white mt-1">
                      {analysisProgress}%
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-peach-200">
                      {isAnalysisComplete ? "COMPLETE" : "HARMONIZING"}
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
                        3 tailored career pathways generated from your
                        background as a{" "}
                        <strong className="font-semibold">{currentRole}</strong>
                        .
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
          HerNext &bull; Step {currentStep} of 7
        </footer>
      </div>
    </div>
  );
}
