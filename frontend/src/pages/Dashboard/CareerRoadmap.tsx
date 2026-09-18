import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Edit3, 
  Clock, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  Lock,
  X,
  Crown
} from 'lucide-react';
import PurpleBackgroundDots from '../../components/dashboard/PurpleBackgroundDots';
import { useNavigate } from 'react-router-dom';

import { useUserContext } from '../../context/UserContext';

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

const getMilestonesForRole = (roleTitle: string): MilestoneStep[] => {
  const role = (roleTitle || '').toLowerCase();

  if (role.includes('graphics') || role.includes('graphic') || role.includes('visual')) {
    return [
      {
        id: 'step-1',
        number: 1,
        title: 'Visual Design Principles & Composition',
        subtitle: 'Master layout hierarchy, grid systems, and brand composition fundamentals.',
        duration: '15 min',
        type: 'LEARN',
        completed: false,
        active: true
      },
      {
        id: 'step-2',
        number: 2,
        title: 'Practice: Typography & Color Systems',
        subtitle: 'Practice Activity · Pair typography, construct palettes, and audit visual balance.',
        duration: '20 min',
        type: 'PRACTICE',
        completed: false
      },
      {
        id: 'step-3',
        number: 3,
        title: 'Challenge: Brand Identity Design System',
        subtitle: 'Real-World Simulation · Design logo assets, brand guidelines, and vector collateral.',
        duration: '30 min',
        type: 'CHALLENGE',
        completed: false
      },
      {
        id: 'step-4',
        number: 4,
        title: 'Design Critique & Portfolio Verification',
        subtitle: 'Career Evidence Review · Receive structured critique on your brand system package.',
        duration: '5 min',
        type: 'AI FEEDBACK',
        completed: false
      }
    ];
  }

  if (role.includes('data') || role.includes('analyst') || role.includes('analytics')) {
    return [
      {
        id: 'step-1',
        number: 1,
        title: 'Data Fundamentals & Excel Automation',
        subtitle: 'Learn data cleaning, pivot tables, and statistical summaries for business datasets.',
        duration: '15 min',
        type: 'LEARN',
        completed: false,
        active: true
      },
      {
        id: 'step-2',
        number: 2,
        title: 'Practice: SQL Queries & Aggregations',
        subtitle: 'Practice Activity · Write SELECT queries, JOINs, subqueries, and window functions.',
        duration: '20 min',
        type: 'PRACTICE',
        completed: false
      },
      {
        id: 'step-3',
        number: 3,
        title: 'Challenge: Financial Reconciliation & Dashboarding',
        subtitle: 'Real-World Simulation · Detect transfer discrepancies and build interactive dashboards.',
        duration: '30 min',
        type: 'CHALLENGE',
        completed: false
      },
      {
        id: 'step-4',
        number: 4,
        title: 'Data Audit & Passport Verification',
        subtitle: 'Career Evidence Review · Verify analytical report accuracy against industry benchmarks.',
        duration: '5 min',
        type: 'AI FEEDBACK',
        completed: false
      }
    ];
  }

  if (role.includes('frontend') || role.includes('front-end') || role.includes('web') || role.includes('developer')) {
    return [
      {
        id: 'step-1',
        number: 1,
        title: 'Modern Frontend Architecture & React 19',
        subtitle: 'Master component hierarchy, JSX patterns, hooks, and responsive layouts.',
        duration: '15 min',
        type: 'LEARN',
        completed: false,
        active: true
      },
      {
        id: 'step-2',
        number: 2,
        title: 'Practice: State Management & API Integration',
        subtitle: 'Practice Activity · Connect REST APIs, manage async loading, and control global state.',
        duration: '20 min',
        type: 'PRACTICE',
        completed: false
      },
      {
        id: 'step-3',
        number: 3,
        title: 'Challenge: Interactive Web Application Build',
        subtitle: 'Real-World Simulation · Build a dynamic dashboard UI with Tailwind CSS & animations.',
        duration: '30 min',
        type: 'CHALLENGE',
        completed: false
      },
      {
        id: 'step-4',
        number: 4,
        title: 'Code Audit & Passport Verification',
        subtitle: 'Career Evidence Review · Code review for performance, accessibility, and type safety.',
        duration: '5 min',
        type: 'AI FEEDBACK',
        completed: false
      }
    ];
  }

  // Default / Product Design / Custom Role
  return [
    {
      id: 'step-1',
      number: 1,
      title: `${roleTitle || 'Career'} Core Fundamentals & Best Practices`,
      subtitle: `Learn essential domain concepts and foundational workflows for ${roleTitle || 'your career'}.`,
      duration: '15 min',
      type: 'LEARN',
      completed: false,
      active: true
    },
    {
      id: 'step-2',
      number: 2,
      title: `Practice: Applied ${roleTitle || 'Skill'} Workspaces`,
      subtitle: `Practice Activity · Interactive exercises and practical domain tasks.`,
      duration: '20 min',
      type: 'PRACTICE',
      completed: false
    },
    {
      id: 'step-3',
      number: 3,
      title: `Challenge: Real-World ${roleTitle || 'Project'} Simulation`,
      subtitle: `Real-World Simulation · Solve an industry case study and produce deliverables.`,
      duration: '30 min',
      type: 'CHALLENGE',
      completed: false
    },
    {
      id: 'step-4',
      number: 4,
      title: 'Career Evidence Review & Verification',
      subtitle: 'Passport Verification · Validate your project output to your Career Passport.',
      duration: '5 min',
      type: 'AI FEEDBACK',
      completed: false
    }
  ];
};

export const CareerRoadmap: React.FC = () => {
  const navigate = useNavigate();
  const { onboarding } = useUserContext();
  const targetRole = onboarding?.targetRole || 'Data Analyst';
  const milestones = getMilestonesForRole(targetRole);

  const [activePhase, setActivePhase] = useState<'foundation' | 'development' | 'proof'>('foundation');
  const [showFullRoadmapModal, setShowFullRoadmapModal] = useState(false);
  const [showProModal, setShowProModal] = useState(false);
  const [proModalTitle, setProModalTitle] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleStartLesson = (_step?: MilestoneStep) => {
    navigate('/dashboard/roadmap/overview');
  };

  const handleSelectPhase = (phase: 'foundation' | 'development' | 'proof') => {
    if (phase === 'foundation') {
      setActivePhase('foundation');
      showToast('Phase 01: Foundation is active');
    } else if (phase === 'development') {
      setProModalTitle('Phase 02: Development (Days 31-60)');
      setShowProModal(true);
    } else {
      setProModalTitle('Phase 03: Career Proof (Days 61-90)');
      setShowProModal(true);
    }
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
        {/* Toast Notification */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="fixed top-20 right-8 z-50 bg-[#261338] text-white text-xs px-4 py-3 rounded-2xl shadow-2xl border border-purple-400/30 flex items-center gap-2.5 backdrop-blur-md"
            >
              <div className="w-6 h-6 rounded-full bg-[#F05A7E]/20 text-[#F05A7E] flex items-center justify-center">
                <Sparkles size={13} />
              </div>
              <span className="font-medium">{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

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
                  <span className="text-2xl font-black text-[#2D1B4E]">32% complete</span>
                  <span className="text-xs text-gray-400 font-medium">· 18 days left</span>
                </div>
              </div>

              {/* Mini progress track indicator */}
              <div className="w-full sm:w-64 bg-purple-50 rounded-full h-2.5 overflow-hidden border border-purple-100/60">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '32%' }}
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
                  <span>Day 12 of 30</span>
                  <span className="text-gray-400">18 days left</span>
                </div>
              </div>

              {/* Phase 2: Development */}
              <div 
                onClick={() => handleSelectPhase('development')}
                className="rounded-2xl p-4 border transition-all cursor-pointer relative bg-white border-purple-100/70 hover:border-purple-300 opacity-95 group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-700 group-hover:text-[#8C3F96]">02 Development</span>
                  <span className="bg-amber-50 text-amber-600 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Lock size={10} /> Pro · Days 31-60
                  </span>
                </div>
                <div className="text-[11px] text-gray-400 font-medium">
                  Target: Days 31-60
                </div>
              </div>

              {/* Phase 3: Career Proof */}
              <div 
                onClick={() => handleSelectPhase('proof')}
                className="rounded-2xl p-4 border transition-all cursor-pointer relative bg-white border-purple-100/70 hover:border-purple-300 opacity-95 group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-700 group-hover:text-[#8C3F96]">03 Career Proof</span>
                  <span className="bg-amber-50 text-amber-600 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Lock size={10} /> Pro · Days 61-90
                  </span>
                </div>
                <div className="text-[11px] text-gray-400 font-medium">
                  Target: Days 61-90
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
                    15 min
                  </span>
                </div>

                {/* Lesson Details */}
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-1.5 bg-[#FDF2F5] text-[#F05A7E] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    <span>{milestones[0]?.type || 'LEARN'} · HERNEXT LESSON</span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-extrabold text-[#2D1B4E] leading-snug">
                    {milestones[0]?.title || `Fundamentals for ${targetRole}`}
                  </h2>

                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed max-w-xl">
                    {milestones[0]?.subtitle || `Learn core foundational principles to kickstart your journey in ${targetRole}.`}
                  </p>
                </div>

                {/* Primary CTA Button */}
                <div>
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleStartLesson(milestones[0])}
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
                    <strong className="text-[#2D1B4E]">Why this matters:</strong> Build the foundation you'll need for the challenges ahead in {targetRole}.
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
                      onClick={() => handleStartLesson(step)}
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

              {/* Link to view full 25 milestones */}
              <div className="text-center pt-2">
                <button 
                  onClick={() => setShowFullRoadmapModal(true)}
                  className="text-xs font-bold text-[#8C3F96] hover:text-[#5B2975] inline-flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>Want to see all 25 milestones? View full roadmap</span>
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
                    2 of 4 steps complete
                  </h4>
                  <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                    On pace to complete Foundation. Please stay on schedule.
                  </p>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-purple-50 rounded-full h-2 overflow-hidden">
                  <div className="bg-[#8C3F96] h-full rounded-full w-1/2" />
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
                  {['AI Product Thinking', 'AI UX', 'UX Research'].map((skill, idx) => (
                    <button 
                      key={idx}
                      onClick={() => navigate('/dashboard/skills')}
                      className="bg-[#F4ECF8] hover:bg-purple-100 text-[#8C3F96] text-xs font-bold px-3 py-1.5 rounded-full border border-purple-100/80 transition-all cursor-pointer"
                    >
                      {skill}
                    </button>
                  ))}
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
                    Career Passport Verified
                  </h4>
                  <p className="text-[11px] text-gray-600 mt-1 leading-relaxed">
                    Completing your next step adds verified competence evidence directly to your tamper-proof Career Passport.
                  </p>
                </div>
              </div>
            </motion.div>

          </div>

        </div>

        {/* 4. Footer Lock Line matching Screenshot 2 */}
        <motion.div variants={itemVariants} className="pt-8 border-t border-purple-100/60 text-center space-y-1">
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400 font-medium">
            <Lock size={12} className="text-gray-400" />
            <span>256-bit SSL Encrypted & Secure · HerNext Career Concierge © 2026.</span>
          </div>
        </motion.div>
      </motion.div>

      {/* MODAL 1: Full 25 Milestones Drawer Modal */}
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
                  <h3 className="text-lg font-extrabold text-[#2D1B4E]">25-Step AI Career Roadmap</h3>
                  <p className="text-xs text-gray-500">AI Product Designer Path · 90-Day Trajectory</p>
                </div>
                <button 
                  onClick={() => setShowFullRoadmapModal(false)}
                  className="p-1 text-gray-400 hover:text-gray-700 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
                {milestones.map((st: MilestoneStep) => (
                  <div 
                    key={st.id}
                    className="p-3.5 rounded-2xl bg-purple-50/50 border border-purple-100/60 flex items-center justify-between gap-3 hover:bg-purple-50 transition-colors cursor-pointer"
                    onClick={() => {
                      setShowFullRoadmapModal(false);
                      handleStartLesson(st);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-[#2D1B4E] text-white text-xs font-bold flex items-center justify-center">
                        {st.number}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#2D1B4E]">{st.title}</h4>
                        <span className="text-[10px] text-gray-500">{st.subtitle}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-[#8C3F96] bg-purple-100/80 px-2 py-0.5 rounded-full">
                      {st.duration}
                    </span>
                  </div>
                ))}
                
                <div className="p-4 text-center bg-gray-50 rounded-2xl text-xs text-gray-500 font-medium">
                  + 19 remaining specialized modules unlocked progressively upon phase completion.
                </div>
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

      {/* MODAL 2: Pro Upgrade Modal */}
      <AnimatePresence>
        {showProModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50"
            onClick={() => setShowProModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-purple-100 text-center space-y-5"
            >
              <div className="w-14 h-14 bg-gradient-to-tr from-[#9E4733] to-[#F05A7E] rounded-2xl flex items-center justify-center text-white mx-auto shadow-lg shadow-pink-500/20">
                <Crown size={28} />
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-extrabold text-[#9E4733] uppercase tracking-wider block">
                  HERNEXT PRO FEATURE
                </span>
                <h3 className="text-xl font-extrabold text-[#2D1B4E]">
                  {proModalTitle || 'Unlock HerNext Pro'}
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Phase 1 (Foundation) is fully accessible on your free account. Upgrade to <strong>HerNext Pro</strong> to unlock <strong>Phase 02: Development (Days 31-60)</strong> and <strong>Phase 03: Career Proof (Days 61-90)</strong>.
                </p>
              </div>

              <div className="bg-purple-50/70 p-4 rounded-2xl space-y-2 text-left text-xs font-semibold text-[#2D1B4E] border border-purple-100">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-[#9E4733]" /> Access 19 advanced technical AI modules
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-[#9E4733]" /> Real-world simulation challenges & AI review
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-[#9E4733]" /> Executive mentor connections & priority placement
                </div>
              </div>

              <div className="space-y-2">
                <button 
                  onClick={() => setShowProModal(false)}
                  className="w-full bg-[#9E4733] hover:bg-[#863b2a] text-white py-3 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  Start 14-Day Free Pro Trial
                </button>

                <button 
                  onClick={() => setShowProModal(false)}
                  className="w-full py-2 text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
                >
                  Continue with Foundation (Free)
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CareerRoadmap;
