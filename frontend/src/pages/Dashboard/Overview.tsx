import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Target,
  Sparkles,
  Zap,
  ArrowRight,
  Activity,
  Cpu,
  Heart,
  CheckCircle2
} from 'lucide-react';
import { useDashboardContext } from '../../context/DashboardContext';
import { useUserContext } from '../../context/UserContext';
import {
  ApiError,
  getCareerRecommendations,
  getProgressSummary,
  type CareerRecommendation,
  type ImpactLevel,
  type ProgressSummary,
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

const Overview: React.FC = () => {
  const { careerData } = useDashboardContext();
  const { user, onboarding } = useUserContext();
  const navigate = useNavigate();

  // Fallback default data from user context so page is always tailored
  const displayData = careerData || {
    targetRole: onboarding.targetRole || 'AI Engineer',
    company: 'Tech Enterprise',
    jobDescription: `Building AI-native products and leading high-impact technical initiatives.`,
    currentRole: onboarding.currentRole || 'Frontend Developer',
    yearsExperience: onboarding.yearsOfExperience || '3-5 years',
    topSkills: onboarding.skills && onboarding.skills.length > 0 ? onboarding.skills.map(s => s.name).join(', ') : 'React, TypeScript, Next.js'
  };

  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [topRecommendation, setTopRecommendation] = useState<CareerRecommendation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadDashboardData() {
      setIsLoading(true);
      setLoadError('');
      try {
        const [summaryData, recommendationsData] = await Promise.all([
          getProgressSummary(),
          getCareerRecommendations(1),
        ]);
        if (cancelled) return;
        setSummary(summaryData);
        setTopRecommendation(recommendationsData.recommendations[0] ?? null);
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

  const targetRoleName = topRecommendation?.careerName ?? summary?.currentCareerGoal ?? displayData.targetRole;

  // Animation variants
  const container: any = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item: any = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="max-w-6xl mx-auto space-y-6 pb-16 pt-2 font-sans"
    >
      {/* Top Banner Greeting */}
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-purple-100 text-[#8C3F96] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2">
            <Sparkles size={12} className="text-[#F05A7E]" /> HerNext Career Intelligence Report
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-[#2D1B4E]">Welcome back, {user.fullName}.</h1>
          <p className="text-xs text-gray-500 mt-1">Here is your real-time readiness breakdown for <strong>{displayData.targetRole}</strong>.</p>
        </div>
        
        <div className="flex items-center gap-3">
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
      </motion.div>

      {loadError && (
        <motion.div variants={item} className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
          {loadError}
        </motion.div>
      )}

      {/* Top Row: Readiness & Target Role */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Readiness Overview */}
        <div className="lg:col-span-2 bg-white/90 backdrop-blur-md rounded-3xl shadow-sm p-6 md:p-8 border border-purple-100 relative overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-bold text-gray-800">Career Readiness Overview</h2>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full flex items-center gap-1">
              <CheckCircle2 size={12} /> High Transition Viability
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
            <h3 className="text-xl font-black text-[#2D1B4E] mb-2">{targetRoleName}</h3>
            {displayData.company && (
              <span className="text-xs text-purple-700 font-semibold bg-purple-50 px-2.5 py-0.5 rounded-full">
                @ {displayData.company}
              </span>
            )}

            <div className="flex items-center justify-center gap-3 my-4">
               <span className="text-3xl font-black text-[#8C3F96]">{formatPercent(isLoading, topRecommendation?.matchScore)}</span>
               <span className="text-[10px] text-gray-500 text-left leading-tight font-medium">Predicted<br/>Career Match</span>
            </div>
          </div>

          <div className="text-left bg-purple-50/60 rounded-2xl p-4 border border-purple-100/60">
            <p className="text-xs font-bold text-[#2D1B4E] mb-2 flex items-center gap-1.5">
              <Sparkles size={14} className="text-[#F05A7E]" /> Priority skills to master:
            </p>
            <ul className="text-xs text-gray-600 space-y-1.5">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F05A7E]"></span>
                <span>Prompt Engineering for Multimodal UI</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F05A7E]"></span>
                <span>AI Ethics & Model Bias Auditing</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F05A7E]"></span>
                <span>Conversational Agent Wireframing</span>
              </li>
            </ul>
          </div>
        </div>
      </motion.div>

      {/* AI Insight Row */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#FFF8F8] rounded-3xl shadow-sm p-6 md:p-8 border border-[#FFE8E8]">
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles size={15} className="text-[#F05A7E]" />
            <span className="text-[10px] font-bold text-[#F05A7E] uppercase tracking-wider">AI Impact Analysis</span>
          </div>
          <div className="flex justify-between items-start mb-4">
             <div>
               <h3 className="text-lg font-bold text-gray-800">AI Impact on {displayData.currentRole}</h3>
               <p className="text-xs text-gray-600">How generative automation is reshaping your daily workflow in 2026.</p>
             </div>
             <div className="text-right">
               <span className="text-2xl font-black text-[#F05A7E]">{formatPercent(isLoading, summary?.aiImpact?.score)}</span>
               <p className="text-[10px] text-gray-500 leading-tight mt-0.5 font-medium">{formatImpactLevelLabel(isLoading, summary?.aiImpact?.level)}<br/>Task Impact</p>
             </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white/80 rounded-2xl p-3.5 border border-pink-100 shadow-xs">
              <h4 className="text-xs font-bold text-gray-800 mb-1 flex items-center gap-1.5"><Zap size={13} className="text-amber-500" /> Automated</h4>
              <p className="text-[11px] text-gray-500 leading-snug">Layout variations, icon styling, design token synchronization.</p>
            </div>
            <div className="bg-white/80 rounded-2xl p-3.5 border border-pink-100 shadow-xs">
              <h4 className="text-xs font-bold text-gray-800 mb-1 flex items-center gap-1.5"><Cpu size={13} className="text-indigo-500" /> Augmented</h4>
              <p className="text-[11px] text-gray-500 leading-snug">User research clustering, prompt prototyping, persona synthesis.</p>
            </div>
            <div className="bg-white/80 rounded-2xl p-3.5 border border-pink-100 shadow-xs">
              <h4 className="text-xs font-bold text-gray-800 mb-1 flex items-center gap-1.5"><Heart size={13} className="text-[#F05A7E]" /> Human Empathy</h4>
              <p className="text-[11px] text-gray-500 leading-snug">User trust, ethical accountability, strategic product intuition.</p>
            </div>
          </div>
        </div>
        
        {/* Next Best Action */}
        <div className="bg-[#FAF5ED] rounded-3xl shadow-sm p-6 md:p-8 border border-[#F5EAD4] flex flex-col justify-between">
           <div>
             <div className="flex items-center gap-1.5 mb-2">
                <Activity size={15} className="text-[#C47D3B]" />
                <span className="text-[10px] font-bold text-[#C47D3B] uppercase tracking-wider">Next Recommended Action</span>
             </div>
             <h3 className="text-base font-bold text-gray-800 mb-1.5">Complete AI UX Sandbox Challenge</h3>
             <p className="text-xs text-gray-600 mb-4">Design a multimodal voice & visual flow for an AI healthcare assistant to earn verified badge.</p>
           </div>
           <div className="flex items-center justify-between pt-3 border-t border-[#F0DFCA]">
             <span className="text-[11px] font-bold text-gray-600 bg-white px-2.5 py-1 rounded-lg border border-gray-200">⏱ 45 min</span>
             <motion.button 
               whileHover={{ scale: 1.05 }}
               whileTap={{ scale: 0.95 }}
               onClick={() => navigate('/dashboard/skills')}
               className="bg-[#2D1B4E] text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-black transition-colors shadow-sm cursor-pointer"
             >
               Launch Task
             </motion.button>
           </div>
        </div>
      </motion.div>

      {/* Transition Roadmap */}
      <motion.div variants={item}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#2D1B4E]">90-Day Transition Pathway</h2>
          <span className="text-xs text-[#8C3F96] font-bold hover:underline cursor-pointer">Export Pathway PDF</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div whileHover={{ y: -3 }} className="bg-white p-5 rounded-2xl border border-purple-100 shadow-sm relative overflow-hidden transition-all">
             <div className="absolute top-0 left-0 w-1.5 h-full bg-[#8C3F96]"></div>
             <div className="flex justify-between items-start mb-2">
               <span className="text-[10px] font-bold text-gray-400 uppercase">Phase 1 • 0-30 Days</span>
               <span className="text-xs font-black text-[#8C3F96]">80% Complete</span>
             </div>
             <h3 className="text-sm font-bold text-gray-800 mb-1">Foundations & Tooling</h3>
             <p className="text-xs text-gray-500">Mastering generative design tooling, prompt frameworks, and LLM behavior constraints.</p>
          </motion.div>
          <motion.div whileHover={{ y: -3 }} className="bg-white p-5 rounded-2xl border border-purple-100 shadow-sm relative overflow-hidden transition-all">
             <div className="absolute top-0 left-0 w-1.5 h-full bg-[#F05A7E]"></div>
             <div className="flex justify-between items-start mb-2">
               <span className="text-[10px] font-bold text-gray-400 uppercase">Phase 2 • 30-60 Days</span>
               <span className="text-xs font-black text-[#F05A7E]">40% In Progress</span>
             </div>
             <h3 className="text-sm font-bold text-gray-800 mb-1">Applied Prototyping</h3>
             <p className="text-xs text-gray-500">Building live multimodal interfaces and conversational micro-interactions in real products.</p>
          </motion.div>
          <motion.div whileHover={{ y: -3 }} className="bg-white p-5 rounded-2xl border border-purple-100 shadow-sm relative overflow-hidden transition-all">
             <div className="absolute top-0 left-0 w-1.5 h-full bg-gray-300"></div>
             <div className="flex justify-between items-start mb-2">
               <span className="text-[10px] font-bold text-gray-400 uppercase">Phase 3 • 60-90 Days</span>
               <span className="text-xs font-black text-gray-400">20% Upcoming</span>
             </div>
             <h3 className="text-sm font-bold text-gray-800 mb-1">Portfolio & Mentor Reviews</h3>
             <p className="text-xs text-gray-500">Polishing 2 high-impact case studies with senior female executive mentors.</p>
          </motion.div>
        </div>
      </motion.div>

      {/* Verified Profile Banner */}
      <motion.div variants={item} className="bg-gradient-to-r from-[#261338] via-[#431D54] to-[#612A76] rounded-3xl p-6 md:p-8 text-white flex flex-col md:flex-row items-center justify-between shadow-xl gap-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
          <div className="w-20 h-20 bg-gray-300 rounded-2xl overflow-hidden border-2 border-white/30 shrink-0 shadow-lg">
             <img src="/aisha_avatar.jpg" alt="Aisha Abdullah" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-1.5 mb-1.5">
              <CheckCircle2 size={13} className="text-[#F05A7E]" />
              <span className="bg-white/10 px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase">Verified HerNext Member</span>
            </div>
            <h2 className="text-2xl font-black">Aisha Abdullah</h2>
            <p className="text-purple-200 text-xs mb-2">Aspiring {displayData.targetRole}</p>
            <p className="text-xs text-white/75 max-w-md leading-relaxed">
              Bridging human empathy with artificial intelligence. Specialized in translating complex AI capabilities into intuitive, accessible user experiences.
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
               <span className="block text-[9px] text-purple-200 uppercase font-bold">Estimated Level</span>
               <span className="font-bold text-xs text-white">Mid-Senior (5 Yrs)</span>
             </div>
             <div className="bg-white/10 rounded-xl p-2 px-3.5 text-center backdrop-blur-md">
               <span className="block text-[9px] text-purple-200 uppercase font-bold">Readiness Score</span>
               <span className="font-bold text-xs text-[#F05A7E]">78%</span>
             </div>
           </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Overview;
