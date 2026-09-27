import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Target,
  Sparkles,
  ArrowRight,
  Activity,
  Route
} from 'lucide-react';
import { useDashboardContext } from '../../context/DashboardContext';
import { useUserContext } from '../../context/UserContext';
import {
  ApiError,
  getCareerRecommendations,
  getCurrentRoadmap,
  getNextAction,
  getProfile,
  getProgressSummary,
  getSkillGaps,
  type CareerProfile,
  type CareerRecommendation,
  type ImpactLevel,
  type NextAction,
  type ProgressSummary,
  type RoadmapWithPhases,
  type SkillGapItem,
} from '../../lib/api';

/** Loading: ellipsis. Missing/unavailable: em dash. Otherwise: rounded percent. */
function formatPercent(isLoading: boolean, value: number | undefined | null): string {
  if (isLoading) return '…'
  if (value === undefined || value === null) return '—'
  return `${Math.round(value)}%`
}

function formatImpactLevelLabel(isLoading: boolean, level: ImpactLevel | undefined): string {
  if (isLoading) return '…'
  switch (level) {
    case 'LOW':
      return 'Low'
    case 'MODERATE':
      return 'Moderate'
    case 'HIGH':
      return 'High'
    default:
      return 'Not yet'
  }
}

const PRIORITY_WEIGHT: Record<SkillGapItem['priority'], number> = { HIGH: 0, MEDIUM: 1, LOW: 2 }

function phaseCompletion(tasks: RoadmapWithPhases['phases']['DAY_30']): number {
  if (tasks.length === 0) return 0
  const done = tasks.filter((t) => t.status === 'COMPLETED').length
  return Math.round((done / tasks.length) * 100)
}

function nextActionRoute(action: NextAction): string {
  switch (action.type) {
    case 'COMPLETE_PROFILE':
      return '/onboarding'
    case 'ADD_EXPERIENCE':
      return '/onboarding'
    case 'COMPLETE_ASSESSMENT':
      return '/dashboard/assessment'
    case 'DISCOVER_SKILLS':
      return '/dashboard/skills'
    case 'SELECT_CAREER':
      return '/dashboard/insights'
    case 'REVIEW_SKILL_GAPS':
      return '/dashboard/skills'
    case 'COMPLETE_ROADMAP_TASK':
      return '/dashboard/roadmap'
    case 'COMPLETE_CHALLENGE':
      return action.resourceId ? `/dashboard/challenges/${action.resourceId}` : '/dashboard/challenges'
    case 'CREATE_EVIDENCE':
      return '/dashboard/challenges'
    case 'GENERATE_PASSPORT':
      return '/dashboard/passport'
    case 'JOURNEY_COMPLETE':
      return '/dashboard/passport'
  }
}

const Overview: React.FC = () => {
  const { careerData } = useDashboardContext();
  const { user } = useUserContext();
  const navigate = useNavigate();

  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [topRecommendation, setTopRecommendation] = useState<CareerRecommendation | null>(null);
  const [nextAction, setNextAction] = useState<NextAction | null>(null);
  const [profile, setProfile] = useState<CareerProfile | null>(null);
  const [prioritySkills, setPrioritySkills] = useState<string[]>([]);
  const [roadmap, setRoadmap] = useState<RoadmapWithPhases | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadDashboardData() {
      setIsLoading(true);
      setLoadError('');
      try {
        const [summaryData, recommendationsData, nextActionData] = await Promise.all([
          getProgressSummary(),
          getCareerRecommendations(1),
          getNextAction(),
        ]);
        if (cancelled) return;
        setSummary(summaryData);
        const top = recommendationsData.recommendations[0] ?? null;
        setTopRecommendation(top);
        setNextAction(nextActionData);

        getProfile()
          .then((p) => {
            if (!cancelled) setProfile(p);
          })
          .catch(() => {
            // No career profile yet - the page shows its empty states.
          });

        getCurrentRoadmap()
          .then((r) => {
            if (!cancelled) setRoadmap(r);
          })
          .catch(() => {
            // No roadmap yet - the page shows its empty state.
          });

        if (top) {
          getSkillGaps(top.careerId)
            .then((gaps) => {
              if (cancelled) return;
              const toMaster = gaps.skills
                .filter((s) => s.status === 'NEEDS_DEVELOPMENT')
                .sort((a, b) => PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority])
                .slice(0, 3)
                .map((s) => s.skillName);
              setPrioritySkills(toMaster);
            })
            .catch(() => {
              // No skill-gap data yet - the section shows its empty state.
            });
        }
      } catch (err) {
        if (cancelled) return;
        setLoadError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadDashboardData();
    return () => {
      cancelled = true;
    };
  }, []);

  const targetRoleName =
    topRecommendation?.careerName ?? summary?.currentCareerGoal ?? careerData?.targetRole ?? '';
  const currentRoleName = profile?.currentOccupation ?? careerData?.currentRole ?? '';
  const industryName = profile?.industry ?? careerData?.company ?? '';
  const displayName = user.fullName && user.fullName.trim() ? user.fullName.trim() : 'there';
  const hasAvatar = Boolean(user.avatar && user.avatar.trim());
  const initials = (user.fullName || '').trim().split(/\s+/).filter(Boolean).map(n => n.charAt(0)).join('').slice(0, 2).toUpperCase();
  const aiImpact = summary?.aiImpact ?? null;
  const hasRoadmap = roadmap !== null;

  const roadmapPhases = [
    { key: 'DAY_30' as const, title: 'Phase 1 • Days 0-30' },
    { key: 'DAY_60' as const, title: 'Phase 2 • Days 30-60' },
    { key: 'DAY_90' as const, title: 'Phase 3 • Days 60-90' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="max-w-6xl mx-auto space-y-6 pb-16 pt-2 font-sans"
    >
      {/* Top Banner Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-purple-100 text-[#8C3F96] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2">
            <Sparkles size={12} className="text-[#F05A7E]" /> HerNext Career Intelligence Report
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-[#2D1B4E]">Welcome back, {displayName}.</h1>
          <p className="text-xs text-gray-500 mt-1">
            Here is your real-time readiness breakdown{targetRoleName ? <> for <strong>{targetRoleName}</strong></> : null}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/dashboard/assessment')}
            className="bg-[#2D1B4E] hover:bg-[#451F5A] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>Full AI Assessment</span>
            <ArrowRight size={14} />
          </motion.button>
        </div>
      </div>

      {loadError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
          {loadError}
        </div>
      )}

      {/* Top Row: Readiness & Target Role */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Readiness Overview */}
        <div className="lg:col-span-2 bg-white/90 backdrop-blur-md rounded-3xl shadow-sm p-6 md:p-8 border border-purple-100 relative overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-bold text-gray-800">Career Readiness Overview</h2>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full flex items-center gap-1">
              <Activity size={12} /> {isLoading ? '…' : (summary?.readinessLabel ?? 'Not yet assessed')}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-8">
            <div className="relative w-32 h-32 flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="64" cy="64" r="54" fill="transparent" stroke="#F4EFF7" strokeWidth="11" />
                <motion.circle
                  initial={{ strokeDashoffset: 339.29 }}
                  animate={{ strokeDashoffset: 339.29 - (339.29 * (summary?.careerReadiness ?? 0)) / 100 }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  cx="64" cy="64" r="54" fill="transparent" stroke="#8C3F96" strokeWidth="11" strokeDasharray="339.29"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-[#2D1B4E]">{formatPercent(isLoading, summary?.careerReadiness)}</span>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">Ready</span>
              </div>
            </div>

            <div className="flex-1 w-full space-y-3.5">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-gray-700">Core Experience</span>
                  <span className="font-bold text-[#2D1B4E]">{formatPercent(isLoading, summary?.readinessBreakdown.experience)}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${summary?.readinessBreakdown.experience ?? 0}%` }} transition={{ duration: 1, delay: 0.2 }} className="bg-[#5C3D6D] h-full rounded-full"></motion.div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-gray-700">Skills Alignment</span>
                  <span className="font-bold text-[#2D1B4E]">{formatPercent(isLoading, summary?.readinessBreakdown.skills)}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${summary?.readinessBreakdown.skills ?? 0}%` }} transition={{ duration: 1, delay: 0.3 }} className="bg-[#5C3D6D] h-full rounded-full"></motion.div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-gray-700">AI Tooling Proficiency</span>
                  <span className="font-bold text-[#F05A7E]">{formatPercent(isLoading, summary?.readinessBreakdown.aiReadiness)}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${summary?.readinessBreakdown.aiReadiness ?? 0}%` }} transition={{ duration: 1, delay: 0.4 }} className="bg-gradient-to-r from-[#F05A7E] to-[#FF8E53] h-full rounded-full"></motion.div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-gray-700">Portfolio Evidence</span>
                  <span className="font-bold text-[#2D1B4E]">{formatPercent(isLoading, summary?.readinessBreakdown.evidence)}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${summary?.readinessBreakdown.evidence ?? 0}%` }} transition={{ duration: 1, delay: 0.5 }} className="bg-[#5C3D6D] h-full rounded-full"></motion.div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Target Role Column */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-sm p-6 md:p-8 border border-purple-100 text-center flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 mx-auto bg-purple-50 rounded-2xl flex items-center justify-center mb-3 text-[#8C3F96]">
              <Target size={24} />
            </div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Target Role</p>
            <h3 className="text-xl font-black text-[#2D1B4E] mb-2">{targetRoleName || '—'}</h3>
            {industryName && (
              <span className="text-xs text-purple-700 font-semibold bg-purple-50 px-2.5 py-0.5 rounded-full">
                @ {industryName}
              </span>
            )}

            <div className="flex items-center justify-center gap-3 my-4">
              <span className="text-3xl font-black text-[#8C3F96]">{formatPercent(isLoading, topRecommendation?.matchScore)}</span>
              <span className="text-[10px] text-gray-500 text-left leading-tight font-medium">Predicted<br />Career Match</span>
            </div>
          </div>

          <div className="text-left bg-purple-50/60 rounded-2xl p-4 border border-purple-100/60">
            {prioritySkills.length > 0 ? (
              <>
                <p className="text-xs font-bold text-[#2D1B4E] mb-2 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-[#F05A7E]" /> Priority skills to master:
                </p>
                <ul className="text-xs text-gray-600 space-y-1.5">
                  {prioritySkills.map((skill) => (
                    <li key={skill} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#F05A7E]"></span>
                      <span>{skill}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="text-xs text-gray-600 leading-relaxed">
                No skill-gap data yet. Build your profile and pick a target career to see the skills you need to develop.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* AI Insight Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#FFF8F8] rounded-3xl shadow-sm p-6 md:p-8 border border-[#FFE8E8]">
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles size={15} className="text-[#F05A7E]" />
            <span className="text-[10px] font-bold text-[#F05A7E] uppercase tracking-wider">AI Impact Analysis</span>
          </div>
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-800">
                AI Impact Analysis{currentRoleName ? ` for ${currentRoleName}` : ''}
              </h3>
              <p className="text-xs text-gray-600">
                An assessment of automation exposure, AI augmentation opportunity, and human-value tasks.
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-[#F05A7E]">{formatPercent(isLoading, summary?.aiImpact?.score)}</span>
              <p className="text-[10px] text-gray-500 leading-tight mt-0.5 font-medium">{formatImpactLevelLabel(isLoading, summary?.aiImpact?.level)}<br />Task Impact</p>
            </div>
          </div>

          {aiImpact ? (
            <div className="bg-white/80 rounded-2xl p-4 border border-pink-100 shadow-xs">
              <p className="text-xs text-gray-600 leading-relaxed">
                Run your full AI Career Impact Assessment to see the task-level breakdown (automated, augmented, and human-value work) for your experience.
              </p>
              <button
                onClick={() => navigate('/dashboard/assessment')}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#8C3F96] hover:text-[#73317c] transition-colors cursor-pointer"
              >
                View full assessment <ArrowRight size={13} />
              </button>
            </div>
          ) : (
            <div className="bg-white/80 rounded-2xl p-4 border border-pink-100 shadow-xs">
              <p className="text-xs text-gray-600 leading-relaxed">
                Complete your AI Career Impact Assessment to see how AI may affect your current work and what to focus on next.
              </p>
              <button
                onClick={() => navigate('/dashboard/assessment')}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#8C3F96] hover:text-[#73317c] transition-colors cursor-pointer"
              >
                Complete assessment <ArrowRight size={13} />
              </button>
            </div>
          )}
        </div>

        {/* Next Best Action */}
        <div className="bg-[#FAF5ED] rounded-3xl shadow-sm p-6 md:p-8 border border-[#F5EAD4] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Activity size={15} className="text-[#C47D3B]" />
              <span className="text-[10px] font-bold text-[#C47D3B] uppercase tracking-wider">Next Recommended Action</span>
            </div>
            {nextAction ? (
              <>
                <h3 className="text-base font-bold text-gray-800 mb-1.5">{nextAction.action}</h3>
                <p className="text-xs text-gray-600 mb-4">{nextAction.reason}</p>
              </>
            ) : (
              <p className="text-xs text-gray-600 mb-4">
                Complete the steps of your HerNext journey to unlock your next recommended action.
              </p>
            )}
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-[#F0DFCA]">
            <span className="text-[11px] font-semibold text-gray-500">
              {nextAction ? 'Step toward your goal' : 'Getting started soon'}
            </span>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(nextAction ? nextActionRoute(nextAction) : '/dashboard/insights')}
              className="bg-[#2D1B4E] text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-black transition-colors shadow-sm cursor-pointer"
            >
              {nextAction ? 'Continue' : 'Get started'}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Transition Roadmap */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#2D1B4E]">90-Day Transition Pathway</h2>
          <span className="text-xs text-gray-500">Tracked from your generated career roadmap</span>
        </div>

        {isLoading ? (
          <div className="bg-white p-6 rounded-2xl border border-purple-100 shadow-sm text-xs text-gray-500">
            Loading your roadmap…
          </div>
        ) : hasRoadmap ? (
          <>
            <div className="bg-white p-5 rounded-2xl border border-purple-100 shadow-sm mb-4">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-semibold text-gray-700">Overall roadmap progress</span>
                <span className="font-bold text-[#2D1B4E]">{formatPercent(false, summary?.roadmapProgress)}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${summary?.roadmapProgress ?? 0}%` }}
                  transition={{ duration: 1 }}
                  className="bg-gradient-to-r from-[#8C3F96] to-[#F05A7E] h-full rounded-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {roadmapPhases.map((phase, i) => {
                const tasks = roadmap.phases[phase.key];
                const pct = phaseCompletion(tasks);
                const done = tasks.filter((t) => t.status === 'COMPLETED').length;
                const focus = tasks.find((t) => t.status !== 'COMPLETED') ?? null;
                const sideColors = ['bg-[#8C3F96]', 'bg-[#F05A7E]', 'bg-gray-300'];
                return (
                  <div key={phase.key} className="bg-white p-5 rounded-2xl border border-purple-100 shadow-sm relative overflow-hidden transition-all">
                    <div className={`absolute top-0 left-0 w-1.5 h-full ${sideColors[i % sideColors.length]}`}></div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">{phase.title}</span>
                      <span className="text-xs font-black text-[#2D1B4E]">{pct}%</span>
                    </div>
                    <h3 className="text-sm font-bold text-gray-800 mb-1">{done} of {tasks.length} tasks completed</h3>
                    <p className="text-xs text-gray-500">
                      {tasks.length === 0
                        ? 'No tasks in this phase yet.'
                        : focus
                          ? `Next up: ${focus.title}`
                          : 'All tasks in this phase are complete.'}
                    </p>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="bg-white p-6 rounded-2xl border border-purple-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#8C3F96] flex items-center justify-center shrink-0">
                <Route size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-800">No roadmap yet</h3>
                <p className="text-xs text-gray-500 mt-0.5">Select a target career and generate your personalised 90-day roadmap to begin.</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/dashboard/roadmap')}
              className="bg-[#2D1B4E] text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-[#451F5A] transition-colors shadow-sm cursor-pointer"
            >
              View Roadmap
            </button>
          </div>
        )}
      </div>

      {/* Profile Banner */}
      <div className="bg-gradient-to-r from-[#261338] via-[#431D54] to-[#612A76] rounded-3xl p-6 md:p-8 text-white flex flex-col md:flex-row items-center justify-between shadow-xl gap-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
          {hasAvatar ? (
            <img
              src={user.avatar}
              alt={displayName === 'there' ? 'Participant avatar' : displayName}
              className="w-20 h-20 rounded-2xl object-cover border-2 border-white/30 shrink-0 shadow-lg"
            />
          ) : (
            <div className="w-20 h-20 bg-white/10 rounded-2xl border-2 border-white/30 flex items-center justify-center text-white font-black text-xl shrink-0 shadow-lg">
              {initials || '•'}
            </div>
          )}
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-1.5 mb-1.5">
              <span className="bg-white/10 px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase">HerNext Participant</span>
            </div>
            <h2 className="text-2xl font-black">{displayName === 'there' ? 'HerNext Participant' : displayName}</h2>
            {targetRoleName && <p className="text-purple-200 text-xs mb-2">Aspiring {targetRoleName}</p>}
            <p className="text-xs text-white/75 max-w-md leading-relaxed">
              Your readiness, skill-match, and progress data are derived from your own profile, skills, and experiences.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center sm:items-end shrink-0">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/dashboard/assessment')}
            className="bg-white text-[#2D1B4E] px-6 py-2.5 rounded-xl font-bold hover:bg-purple-50 transition-all mb-4 flex items-center gap-2 text-xs shadow-lg cursor-pointer"
          >
            <span>View Full AI Assessment</span>
            <ArrowRight size={14} />
          </motion.button>
          <div className="flex gap-3">
            <div className="bg-white/10 rounded-xl p-2 px-3.5 text-center backdrop-blur-md">
              <span className="block text-[9px] text-purple-200 uppercase font-bold">Readiness</span>
              <span className="font-bold text-xs text-white">{formatPercent(isLoading, summary?.careerReadiness)}</span>
            </div>
            <div className="bg-white/10 rounded-xl p-2 px-3.5 text-center backdrop-blur-md">
              <span className="block text-[9px] text-purple-200 uppercase font-bold">Roadmap</span>
              <span className="font-bold text-xs text-[#F05A7E]">{formatPercent(isLoading, summary?.roadmapProgress)}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Overview;