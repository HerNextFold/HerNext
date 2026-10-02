import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Edit3,
  Clock,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Lock,
  X
} from 'lucide-react';
import PurpleBackgroundDots from '../../components/dashboard/PurpleBackgroundDots';
import { useNavigate } from 'react-router-dom';

import {
  ApiError,
  generateRoadmap,
  getCareerRecommendations,
  getCurrentRoadmap,
  getProgressSummary,
  getSkillGaps,
  type RoadmapTask,
  type RoadmapWithPhases,
} from '../../lib/api';

/** Adapts a real backend roadmap task onto the existing MilestoneStep shape
 * the page's JSX already renders, so no rendering code needs to change.
 * 'type' has no backend equivalent, so it keeps the same 'LEARN' fallback
 * this file already used before any task data existed. */
function taskToMilestone(task: RoadmapTask, index: number): MilestoneStep {
  return {
    id: task.id,
    number: index + 1,
    title: task.title,
    subtitle: task.description,
    duration: task.estimatedMinutes ? `${task.estimatedMinutes} min` : '—',
    type: 'LEARN',
    completed: task.status === 'COMPLETED',
    active: index === 0,
  };
}

function formatPercent(isLoading: boolean, value: number | undefined): string {
  if (isLoading) return '…'
  if (value === undefined) return '—'
  return `${Math.round(value)}`
}

interface MilestoneStep {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  duration: string;
  type: 'LEARN' | 'PRACTICE' | 'CHALLENGE' | 'AI FEEDBACK';
  completed: boolean;
  active?: boolean;
}

export const CareerRoadmap: React.FC = () => {
  const navigate = useNavigate();
  const [activePhase, setActivePhase] = useState<'foundation' | 'development' | 'proof'>('foundation');
  const [showFullRoadmapModal, setShowFullRoadmapModal] = useState(false);

  const [dayThirtyTasks, setDayThirtyTasks] = useState<RoadmapTask[] | null>(null);
  const [roadmapData, setRoadmapData] = useState<RoadmapWithPhases | null>(null);
  const [roadmapProgress, setRoadmapProgress] = useState<number | undefined>(undefined);
  const [targetRole, setTargetRole] = useState('');
  const [buildingSkills, setBuildingSkills] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [hasNoRoadmap, setHasNoRoadmap] = useState(false);
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);
  const [generateError, setGenerateError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadRoadmap() {
      setIsLoading(true);
      setLoadError('');
      setHasNoRoadmap(false);

      try {
        const summary = await getProgressSummary();
        if (!cancelled) {
          setRoadmapProgress(summary.roadmapProgress);
          setTargetRole(summary.currentCareerGoal ?? '');
        }
      } catch {
        // Non-fatal: progress and goal just stay unknown until generated.
      }

      try {
        const { recommendations } = await getCareerRecommendations(1);
        const topCareer = recommendations[0];
        if (topCareer && !cancelled) {
          try {
            const gaps = await getSkillGaps(topCareer.careerId);
            if (!cancelled) {
              const develop = gaps.skills.filter((g) => g.status === 'NEEDS_DEVELOPMENT').map((g) => g.skillName);
              setBuildingSkills(develop.length > 0 ? develop : gaps.skills.map((g) => g.skillName));
            }
          } catch {
            // Non-fatal: the skills widget just stays empty.
          }
        }
      } catch {
        // Non-fatal.
      }

      try {
        const data = await getCurrentRoadmap();
        if (cancelled) return;
        setDayThirtyTasks(data.phases.DAY_30);
        setRoadmapData(data);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.code === 'RESOURCE_NOT_FOUND') {
          setHasNoRoadmap(true);
        } else {
          setLoadError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadRoadmap();
    return () => {
      cancelled = true;
    };
  }, []);

  const realMilestones = dayThirtyTasks && dayThirtyTasks.length > 0 ? dayThirtyTasks.map(taskToMilestone) : null;
  const milestones = realMilestones ?? [];
  const completedCount = dayThirtyTasks?.filter((t) => t.status === 'COMPLETED').length;
  const totalCount = dayThirtyTasks?.length;

  const handleGenerateRoadmap = async () => {
    if (isGeneratingRoadmap) return;
    setGenerateError('');
    setIsGeneratingRoadmap(true);
    try {
      const { recommendations } = await getCareerRecommendations(1);
      const topCareer = recommendations[0];
      if (!topCareer) {
        setGenerateError('Complete your Career Insights first so we know which career to build a roadmap for.');
        return;
      }
      const generated = await generateRoadmap({ careerPathId: topCareer.careerId });
      setDayThirtyTasks(generated.phases.DAY_30);
      setRoadmapData(generated);
      setHasNoRoadmap(false);
      try {
        const summary = await getProgressSummary();
        setRoadmapProgress(summary.roadmapProgress);
        setTargetRole(summary.currentCareerGoal ?? topCareer.careerName);
      } catch {
        setTargetRole(topCareer.careerName);
      }
    } catch (err) {
      setGenerateError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsGeneratingRoadmap(false);
    }
  };

  /**
   * Carries the selected task to the learning page.
   *
   * Without the id, every task opened the same generic course because the
   * learning page had nothing to key content on.
   */
  const handleStartLesson = (taskId?: string) => {
    navigate(taskId ? `/dashboard/roadmap/overview/${taskId}` : '/dashboard/roadmap/overview');
  };

  const handleSelectPhase = (phase: 'foundation' | 'development' | 'proof') => {
    setActivePhase(phase);
    setShowFullRoadmapModal(true);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <div className="relative min-h-screen">
      {/* Background Animated Purple Particles */}
      <PurpleBackgroundDots dotCount={40} />

      {/* Main Roadmap Container matching Screenshot 2 */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="max-w-6xl mx-auto space-y-7 pb-24 pt-2 font-sans text-gray-800 relative z-10"
      >
        {/* 1. Header Section matching Screenshot 2 */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2D1B4E] tracking-tight">
              Career Roadmap
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 font-medium">
              Your personalized steps to becoming a <span className="font-bold text-[#2D1B4E]">{targetRole}</span>
            </p>
          </div>

          <button 
            onClick={() => navigate('/dashboard/path')}
            className="self-start sm:self-center inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-[#8C3F96] bg-purple-50/80 hover:bg-purple-100 border border-purple-100 transition-all cursor-pointer shadow-2xs"
          >
            <Edit3 size={14} />
            <span>Edit Career Path</span>
          </button>
        </motion.div>

        {loadError && (
          <motion.div variants={itemVariants} className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            {loadError}
          </motion.div>
        )}

        {hasNoRoadmap ? (
          <motion.div variants={itemVariants}>
            <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-purple-100/80 shadow-xs text-center space-y-4">
              <div className="w-12 h-12 mx-auto bg-purple-50 rounded-2xl flex items-center justify-center text-[#8C3F96]">
                <Sparkles size={22} />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-[#2D1B4E]">You don't have a roadmap yet</h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-md mx-auto">
                  Generate your personalized 30/60/90-day roadmap based on your top career match.
                </p>
              </div>

              {generateError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 max-w-md mx-auto">
                  {generateError}
                </div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGenerateRoadmap}
                disabled={isGeneratingRoadmap}
                className="bg-[#2D1B4E] hover:bg-[#431F69] text-white font-bold text-xs px-6 py-3 rounded-2xl shadow-lg transition-all inline-flex items-center gap-2 cursor-pointer disabled:opacity-60"
              >
                <span>{isGeneratingRoadmap ? 'Generating your roadmap...' : 'Generate My Roadmap'}</span>
                {!isGeneratingRoadmap && <ArrowRight size={15} />}
              </motion.button>
            </div>
          </motion.div>
        ) : (
        <>
        {/* 2. Top "YOUR JOURNEY" Stepper Card matching Screenshot 2 */}
        <motion.div variants={itemVariants}>
          <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 border border-purple-100/80 shadow-xs space-y-6">
            {/* Top Bar inside Journey Card */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-extrabold text-[#8C3F96] tracking-wider uppercase block mb-1">
                  YOUR JOURNEY
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-black text-[#2D1B4E]">{formatPercent(isLoading, roadmapProgress)}% complete</span>
                  {completedCount !== undefined && totalCount !== undefined && (
                    <span className="text-xs text-gray-400 font-medium">· {completedCount} of {totalCount} steps done</span>
                  )}
                </div>
              </div>

              {/* Mini progress track indicator */}
              <div className="w-full sm:w-64 bg-purple-50 rounded-full h-2.5 overflow-hidden border border-purple-100/60">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${roadmapProgress ?? 0}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="bg-gradient-to-r from-[#9E4733] to-[#F05A7E] h-full rounded-full"
                />
              </div>
            </div>

            {/* 3 Phases Stepper Grid matching Screenshot 2 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Phase 1: Foundation (Active) */}
              <div 
                onClick={() => handleSelectPhase('foundation')}
                className={`rounded-2xl p-4 border transition-all cursor-pointer relative ${
                  activePhase === 'foundation'
                    ? 'bg-[#FDF7FA] border-[#F05A7E]/60 shadow-xs ring-2 ring-[#F05A7E]/20'
                    : 'bg-white border-purple-100/70 hover:border-purple-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#2D1B4E]">01 Foundation</span>
                  <span className="inline-flex items-center gap-1 bg-[#FDF2F5] text-[#F05A7E] text-[10px] font-bold px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F05A7E] animate-ping" />
                    Active · Days 01-30
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium">
                  <span>{dayThirtyTasks ? `${dayThirtyTasks.length} tasks` : 'Foundation phase'}</span>
                  <span className="text-gray-400">Days 01-30</span>
                </div>
              </div>

              {/* Phase 2: Development */}
              <div
                onClick={() => handleSelectPhase('development')}
                className="rounded-2xl p-4 border transition-all cursor-pointer relative bg-white border-purple-100/70 hover:border-purple-300 opacity-95 group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-700 group-hover:text-[#8C3F96]">02 Development</span>
                  <span className="bg-purple-50 text-[#8C3F96] border border-purple-100 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    Days 31-60
                  </span>
                </div>
                <div className="text-[11px] text-gray-400 font-medium">
                  {roadmapData?.phases.DAY_60.length ? `${roadmapData.phases.DAY_60.length} tasks` : 'Locked until Phase 1'}
                </div>
              </div>

              {/* Phase 3: Career Proof */}
              <div
                onClick={() => handleSelectPhase('proof')}
                className="rounded-2xl p-4 border transition-all cursor-pointer relative bg-white border-purple-100/70 hover:border-purple-300 opacity-95 group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-700 group-hover:text-[#8C3F96]">03 Career Proof</span>
                  <span className="bg-purple-50 text-[#8C3F96] border border-purple-100 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    Days 61-90
                  </span>
                </div>
                <div className="text-[11px] text-gray-400 font-medium">
                  {roadmapData?.phases.DAY_90.length ? `${roadmapData.phases.DAY_90.length} tasks` : 'Locked until Phase 2'}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 3. Main Content Grid (2 Columns: Left 65%, Right 35%) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-7 items-start">
          
          {/* LEFT COLUMN: Hero Next Step & Coming Up List */}
          <div className="lg:col-span-2 space-y-7">

            {/* Featured Hero Card: YOUR NEXT STEP matching Screenshot 2 */}
            <motion.div variants={itemVariants}>
              <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-7 border border-purple-100/80 shadow-xs relative overflow-hidden space-y-5">
                
                {/* Header bar of next step */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold tracking-wider text-gray-400 uppercase">
                      YOUR NEXT STEP
                    </span>
                    <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                      Ready to start
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-gray-400 flex items-center gap-1">
                    <Clock size={13} />
                    {milestones[0]?.duration || '—'}
                  </span>
                </div>

                {/* Lesson Details */}
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-1.5 bg-[#FDF2F5] text-[#F05A7E] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    <span>{milestones[0]?.type || 'LEARN'} · HERNEXT LESSON</span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-extrabold text-[#2D1B4E] leading-snug">
                    {milestones[0]?.title || 'Start your career roadmap'}
                  </h2>

                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed max-w-xl">
                    {milestones[0]?.subtitle || 'Generate your roadmap to see your first learning step.'}
                  </p>
                </div>

                {/* Primary CTA Button */}
                <div>
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleStartLesson(milestones[0]?.id)}
                    className="bg-[#2D1B4E] hover:bg-[#431F69] text-white font-bold text-xs px-6 py-3 rounded-2xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <span>Start Learning</span>
                    <ArrowRight size={15} />
                  </motion.button>
                </div>

                {/* Bottom Note Container matching Screenshot 2 */}
                <div className="bg-[#FAF8FC] border border-purple-100/70 rounded-2xl p-3.5 text-xs text-gray-600 flex items-center gap-2.5">
                  <Sparkles size={16} className="text-[#8C3F96] shrink-0" />
                  <p className="text-[11px] leading-relaxed">
                    <strong className="text-[#2D1B4E]">Why this matters:</strong> Build the foundation you'll need for the challenges ahead.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* COMING UP Section matching Screenshot 2 */}
            <motion.div variants={itemVariants} className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-[#2D1B4E] tracking-tight">
                    COMING UP
                  </h3>
                  <p className="text-[11px] text-gray-400 font-medium">
                    Next sequential steps
                  </p>
                </div>
              </div>

              {/* Sequential Step Cards */}
              <div className="space-y-3">
                {milestones.slice(1).map((step) => {
                  return (
                    <motion.div 
                      key={step.id}
                      whileHover={{ x: 2 }}
                      onClick={() => handleStartLesson(step.id)}
                      className={`bg-white/95 backdrop-blur-md rounded-2xl p-4 border border-purple-100/70 shadow-xs flex items-center justify-between gap-4 transition-all cursor-pointer hover:border-purple-200 group`}
                    >
                      <div className="flex items-center gap-4">
                        {/* Circle step index */}
                        <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 bg-purple-50 text-[#8C3F96] group-hover:bg-purple-100">
                          {step.number}
                        </div>

                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-[#2D1B4E] group-hover:text-[#8C3F96] transition-colors">
                            {step.title}
                          </h4>
                          <span className="text-[11px] text-gray-400 font-medium block mt-0.5">
                            {step.subtitle}
                          </span>
                        </div>
                      </div>

                      {/* Right Tag Badge matching Screenshot 2 */}
                      <div className="shrink-0">
                        {step.type === 'PRACTICE' && (
                          <span className="bg-[#FAF0E6] text-[#9E4733] text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                            PRACTICE
                          </span>
                        )}
                        {step.type === 'CHALLENGE' && (
                          <span className="bg-[#FDF2F5] text-[#F05A7E] text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                            CHALLENGE
                          </span>
                        )}
                        {step.type === 'AI FEEDBACK' && (
                          <span className="bg-[#F4ECF8] text-[#8C3F96] text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                            AI FEEDBACK
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Link to view full roadmap */}
              <div className="text-center pt-2">
                <button 
                  onClick={() => setShowFullRoadmapModal(true)}
                  className="text-xs font-bold text-[#8C3F96] hover:text-[#5B2975] inline-flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>Preview your full roadmap</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </motion.div>

          </div>

          {/* RIGHT COLUMN: Sidebar Widgets */}
          <div className="space-y-6">

            {/* Widget 1: THIS WEEK matching Screenshot 2 */}
            <motion.div variants={itemVariants}>
              <div className="bg-white/95 backdrop-blur-md rounded-3xl p-5 border border-purple-100/80 shadow-xs space-y-3">
                <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">
                  THIS WEEK
                </span>
                
                <div>
                  <h4 className="text-sm font-extrabold text-[#2D1B4E]">
                    {completedCount !== undefined && totalCount !== undefined
                      ? `${completedCount} of ${totalCount} steps complete`
                      : 'No steps complete yet'}
                  </h4>
                  <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                    On pace to complete Foundation. Please stay on schedule.
                  </p>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-purple-50 rounded-full h-2 overflow-hidden">
                  <div
                    className={`bg-[#8C3F96] h-full rounded-full ${totalCount ? '' : 'w-1/2'}`}
                    style={totalCount ? { width: `${((completedCount ?? 0) / totalCount) * 100}%` } : undefined}
                  />
                </div>
              </div>
            </motion.div>

            {/* Widget 2: SKILLS YOU'RE BUILDING matching Screenshot 2 */}
            <motion.div variants={itemVariants}>
              <div className="bg-white/95 backdrop-blur-md rounded-3xl p-5 border border-purple-100/80 shadow-xs space-y-3">
                <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">
                  SKILLS YOU'RE BUILDING
                </span>

                <div className="flex flex-wrap gap-2 pt-1">
                  {buildingSkills.length > 0 ? buildingSkills.map((skill, idx) => (
                    <button 
                      key={idx}
                      onClick={() => navigate('/dashboard/skills')}
                      className="bg-[#F4ECF8] hover:bg-purple-100 text-[#8C3F96] text-xs font-bold px-3 py-1.5 rounded-full border border-purple-100/80 transition-all cursor-pointer"
                    >
                      {skill}
                    </button>
                  )) : (
                    <p className="text-[11px] text-gray-400">No skill targets yet.</p>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Widget 3: Career Passport Verified Card matching Screenshot 2 */}
            <motion.div variants={itemVariants}>
              <div className="bg-[#FDF2F5]/80 backdrop-blur-md rounded-3xl p-5 border border-[#FDF2F5] shadow-xs space-y-3 relative overflow-hidden">
                <div className="w-9 h-9 rounded-2xl bg-[#F05A7E]/15 text-[#F05A7E] flex items-center justify-center">
                  <ShieldCheck size={20} />
                </div>

                <div>
                  <h4 className="text-xs sm:text-sm font-extrabold text-[#2D1B4E]">
                    Career Passport
                  </h4>
                  <p className="text-[11px] text-gray-600 mt-1 leading-relaxed">
                    Completing roadmap steps, challenges, and evidence keeps your Career Passport up to date.
                  </p>
                </div>
              </div>
            </motion.div>

          </div>

        </div>
        </>
        )}

        {/* 4. Footer Lock Line matching Screenshot 2 */}
        <motion.div variants={itemVariants} className="pt-8 border-t border-purple-100/60 text-center space-y-1">
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400 font-medium">
            <Lock size={12} className="text-gray-400" />
            <span>256-bit SSL Encrypted & Secure · HerNext Career Concierge © 2026.</span>
          </div>
        </motion.div>
      </motion.div>

      {/* MODAL 1: Full Roadmap Drawer Modal */}
      <AnimatePresence>
        {showFullRoadmapModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50"
            onClick={() => setShowFullRoadmapModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl border border-purple-100 max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div>
                  <h3 className="text-lg font-extrabold text-[#2D1B4E]">
                    {roadmapData?.roadmap.title ?? 'Your Career Roadmap'}
                  </h3>
                  {targetRole && (
                    <p className="text-xs text-gray-500">Pathway to {targetRole}</p>
                  )}
                </div>
                <button 
                  onClick={() => setShowFullRoadmapModal(false)}
                  className="p-1 text-gray-400 hover:text-gray-700 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-4 space-y-5 pr-1">
                {([
                  { label: 'Foundation · Days 01-30', tasks: roadmapData?.phases.DAY_30 ?? dayThirtyTasks ?? [] },
                  { label: 'Development · Days 31-60', tasks: roadmapData?.phases.DAY_60 ?? [] },
                  { label: 'Career Proof · Days 61-90', tasks: roadmapData?.phases.DAY_90 ?? [] },
                ]).map((phase) => (
                  phase.tasks.length > 0 && (
                    <div key={phase.label} className="space-y-3">
                      <h4 className="text-[11px] font-extrabold tracking-wider uppercase text-[#8C3F96]">
                        {phase.label}
                      </h4>
                      {phase.tasks.map((st: RoadmapTask) => (
                        <div
                          key={st.id}
                          className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                            st.status === 'COMPLETED'
                              ? 'bg-emerald-50/50 border-emerald-100/60'
                              : 'bg-purple-50/50 border-purple-100/60 hover:bg-purple-50'
                          } transition-colors`}
                        >
                          <div className="flex items-center gap-3">
                            {st.status === 'COMPLETED' ? (
                              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-[#2D1B4E] text-white text-xs font-bold flex items-center justify-center">
                                {st.order}
                              </div>
                            )}
                            <div>
                              <h4 className="text-xs font-bold text-[#2D1B4E]">{st.title}</h4>
                              <span className="text-[10px] text-gray-500">{st.description}</span>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-[#8C3F96] bg-purple-100/80 px-2 py-0.5 rounded-full shrink-0">
                            {st.estimatedMinutes ? `${st.estimatedMinutes} min` : '—'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )
                ))}
              </div>

              <button 
                onClick={() => setShowFullRoadmapModal(false)}
                className="w-full mt-4 bg-[#2D1B4E] hover:bg-[#431F69] text-white py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Close Roadmap Preview
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CareerRoadmap;
