import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, type Variants } from 'motion/react';
import {
  FileText,
  Search,
  Settings2,
  Image,
  Users,
  Lightbulb,
  Compass,
  ArrowRight,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { useUserContext } from '../../context/UserContext';
import {
  ApiError,
  getCareerImpact,
  getCareerRecommendations,
  getCurrentRoadmap,
  listExperiences,
  runCareerImpact,
  type CareerImpactAnalysis,
  type CareerRecommendation,
  type ImpactLevel,
} from '../../lib/api';

/** Loading: ellipsis. Otherwise: rounded percent. */
function formatPercent(isLoading: boolean, value: number | undefined): string {
  if (isLoading) return '…'
  if (value === undefined) return '—'
  return `${Math.round(value)}%`
}

function formatImpactLevelLabel(isLoading: boolean, level: ImpactLevel | undefined): string {
  if (isLoading) return 'Analyzing'
  switch (level) {
    case 'LOW':
      return 'Low'
    case 'MODERATE':
      return 'Moderate'
    case 'HIGH':
      return 'High'
    default:
      return 'Not Yet Assessed'
  }
}

// Icon sets reused to render each real backend task/strength as a card,
// since automationTasks/augmentedTasks/humanStrengths are flat string lists
// (no per-item icon or description from the backend).
const AUTOMATE_ICONS = [Settings2, FileText, Image];
const AUGMENT_ICONS = [Search, Compass, Settings2];
const HUMAN_STRENGTH_ICONS = [Users, Lightbulb, Compass, FileText, Users, Search];

const CareerAssessment: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUserContext();

  const [analysis, setAnalysis] = useState<CareerImpactAnalysis | null>(null);
  const [recommendations, setRecommendations] = useState<CareerRecommendation[]>([]);
  const [phaseProgress, setPhaseProgress] = useState<{ foundation: number; development: number; proof: number } | null>(null);
  const [hasRoadmap, setHasRoadmap] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadAssessment() {
      setIsLoading(true);
      setLoadError('');
      try {
        const { experiences } = await listExperiences();
        if (cancelled) return;

        const experience = experiences[0];
        if (!experience) {
          // Onboarding makes experience optional and, once completed, redirects
          // away from the onboarding flow - so pointing there would dead-end.
          // Profile is where an experience can be added at any time.
          setLoadError(
            'This assessment reads the responsibilities in a work experience record, so it needs one before it can run. Add your real work experience on your Profile page and this will unlock.',
          );
          return;
        }

        try {
          const existing = await getCareerImpact(experience.id);
          if (cancelled) return;
          setAnalysis(existing);
        } catch (err) {
          if (cancelled) return;
          if (err instanceof ApiError && err.code === 'RESOURCE_NOT_FOUND') {
            setIsGenerating(true);
            const generated = await runCareerImpact(experience.id);
            if (cancelled) return;
            setAnalysis(generated);
          } else {
            throw err;
          }
        }

        // Non-fatal enrichment: real career matches + 30/60/90 roadmap progress.
        try {
          const { recommendations: recs } = await getCareerRecommendations(3);
          if (cancelled) return;
          setRecommendations(recs);
        } catch {
          // Career matches stay empty if not ready yet.
        }

        try {
          const roadmap = await getCurrentRoadmap();
          if (cancelled) return;
          const pct = (tasks: { status: string }[]) =>
            tasks.length === 0 ? 0 : Math.round((tasks.filter((t) => t.status === 'COMPLETED').length / tasks.length) * 100);
          setPhaseProgress({
            foundation: pct(roadmap.phases.DAY_30),
            development: pct(roadmap.phases.DAY_60),
            proof: pct(roadmap.phases.DAY_90),
          });
          setHasRoadmap(true);
        } catch {
          // No roadmap yet - the callout shows its empty state.
        }
      } catch (err) {
        if (cancelled) return;
        setLoadError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
      } finally {
        if (!cancelled) {
          setIsLoading(false);
          setIsGenerating(false);
        }
      }
    }

    void loadAssessment();
    return () => {
      cancelled = true;
    };
  }, []);

  const automationTasks = analysis && analysis.automationTasks.length > 0 ? analysis.automationTasks : null;
  const augmentedTasks = analysis && analysis.augmentedTasks.length > 0 ? analysis.augmentedTasks : null;
  const humanStrengths = analysis && analysis.humanStrengths.length > 0 ? analysis.humanStrengths : null;

  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 25 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="max-w-5xl mx-auto space-y-10 pb-20 pt-2 font-sans text-gray-800"
    >
      {/* Header Section */}
      <motion.div variants={item} className="space-y-4">
        <div className="inline-flex items-center gap-2 bg-purple-100 text-[#8C3F96] px-3.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
          <Sparkles size={12} className="text-[#F05A7E]" /> HerNext AI Career Assessment
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-[#2D1B4E] leading-tight tracking-tight">
          Your career,<br/>understood differently.
        </h1>
        <p className="text-gray-600 text-xs md:text-sm max-w-2xl leading-relaxed">
          We've analyzed your experience through the lens of emerging AI trends. This isn't just about what you've done—it's about where your unique human perspective is most valuable next.
        </p>
        <div className="inline-flex items-center gap-3.5 bg-white/90 backdrop-blur-md border border-purple-100 rounded-2xl p-2.5 px-4 shadow-xs">
          {user.avatar ? (
            <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-purple-200">
              <img src={user.avatar} alt={user.fullName} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-purple-200 bg-[#8C3F96] text-white flex items-center justify-center text-xs font-bold">
              {user.fullName ? user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '—'}
            </div>
          )}
          <div>
            <h3 className="font-bold text-[#2D1B4E] text-xs md:text-sm">{user.fullName || 'HerNext Participant'}</h3>
            <p className="text-[10px] text-gray-500">Participant · AI Career Assessment</p>
          </div>
        </div>
      </motion.div>

      {loadError && (
        <motion.div variants={item} className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 space-y-2">
          <p>{loadError}</p>
          <button
            type="button"
            onClick={() => navigate('/dashboard/profile')}
            className="font-semibold underline hover:text-rose-900"
          >
            Go to my Profile
          </button>
        </motion.div>
      )}

      {isGenerating && (
        <motion.div variants={item} className="rounded-xl border border-purple-200 bg-purple-50 p-3 text-xs text-[#8C3F96]">
          Generating your personalized AI Career Assessment... this can take a few seconds.
        </motion.div>
      )}

      {/* AI Evolution Index & Insights */}
      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 md:p-8 shadow-xs border border-purple-100 flex flex-col sm:flex-row items-center gap-6">
           <div className="relative w-32 h-32 flex-shrink-0">
             <svg className="w-full h-full transform -rotate-90">
               <circle cx="64" cy="64" r="54" fill="transparent" stroke="#F4EFF7" strokeWidth="12" />
<motion.circle
                  initial={{ strokeDashoffset: 339.29 }}
                  animate={{ strokeDashoffset: 339.29 - (339.29 * (analysis?.score ?? 0)) / 100 }}
                  transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
                  cx="64" cy="64" r="54" fill="transparent" stroke="#8C3F96" strokeWidth="12" strokeDasharray="339.29"
                  strokeLinecap="round"
                />
             </svg>
             <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-black text-[#2D1B4E]">{analysis ? formatPercent(isLoading, analysis.score) : '—'}</span>
             </div>
           </div>
           <div>
             <div className="inline-block bg-purple-50 text-[#8C3F96] px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2">
                {analysis ? `${formatImpactLevelLabel(isLoading, analysis.level)} Task Impact` : 'Not Yet Assessed'}
             </div>
             <h3 className="text-lg font-bold text-[#2D1B4E] mb-1.5">AI Evolution Index</h3>
             <p className="text-xs text-gray-500 leading-relaxed">
                {analysis
                  ? analysis.explanation
                  : 'Complete your AI Career Assessment to see how automation and augmentation may affect your work.'}
             </p>
           </div>
        </div>

        <div className="bg-gradient-to-br from-[#FFF4EE] to-[#FFF9F5] rounded-3xl p-6 md:p-8 border border-[#FBE3D6] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-[#D47B5A] mb-3">
               <TrendingUp size={16} />
               <span className="text-[10px] font-bold uppercase tracking-widest">Emerging Skills to Build</span>
            </div>
            {analysis && analysis.emergingSkills.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {analysis.emergingSkills.map((skill) => (
                  <span key={skill} className="bg-white/80 border border-[#F5D8C7] text-gray-700 text-xs font-bold px-3 py-1.5 rounded-full">
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs md:text-sm text-gray-700 leading-relaxed font-medium">
                Complete your AI Career Assessment to see which skills are emerging in your field.
              </p>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-[#F5D8C7] flex items-center justify-between gap-3">
            <span className="text-[11px] font-bold text-gray-500">Human Value Factors</span>
            <span className="text-xs font-black text-[#D47B5A]">{analysis ? `${analysis.humanStrengths.length} distinct strengths` : '—'}</span>
          </div>
        </div>
      </motion.div>

      {/* Breakdown Grid */}
      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-4">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-[#2D1B4E]">What AI may automate</h2>
            <p className="text-xs text-gray-500">Tasks shifting rapidly towards AI assistance.</p>
          </div>
          
          {automationTasks ? (
            automationTasks.map((task, index) => {
              const Icon = AUTOMATE_ICONS[index % AUTOMATE_ICONS.length];
              return (
                <div key={task} className="bg-white/90 backdrop-blur-md rounded-2xl p-4 md:p-5 border border-purple-100/70 shadow-xs flex gap-4 items-start">
                   <div className="bg-purple-50 p-2.5 rounded-xl text-[#8C3F96] shrink-0"><Icon size={18} /></div>
                   <div>
                     <h4 className="text-xs md:text-sm font-bold text-gray-800 mb-0.5">{task}</h4>
                   </div>
                </div>
              );
            })
          ) : (
            <div className="bg-white/90 backdrop-blur-md rounded-2xl p-5 border border-purple-100/70 shadow-xs text-center">
              <p className="text-xs text-gray-500">No automation analysis yet. Complete your assessment to see which tasks AI may take over.</p>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-[#2D1B4E]">Where AI can make you stronger</h2>
            <p className="text-xs text-gray-500">High-leverage areas where AI acts as a multiplier.</p>
          </div>

          {augmentedTasks ? (
            augmentedTasks.map((task, index) => {
              const Icon = AUGMENT_ICONS[index % AUGMENT_ICONS.length];
              return (
                <div key={task} className="bg-white/90 backdrop-blur-md rounded-2xl p-4 md:p-5 border border-purple-100/70 shadow-xs flex gap-4 items-start">
                   <div className="bg-purple-50 p-2.5 rounded-xl text-[#8C3F96] shrink-0"><Icon size={18} /></div>
                   <div>
                     <h4 className="text-xs md:text-sm font-bold text-gray-800 mb-0.5">{task}</h4>
                   </div>
                </div>
              );
            })
          ) : (
            <div className="bg-white/90 backdrop-blur-md rounded-2xl p-5 border border-purple-100/70 shadow-xs text-center">
              <p className="text-xs text-gray-500">No augmentation analysis yet. Complete your assessment to see where AI can strengthen your work.</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* What remains distinctly human */}
      <motion.div variants={item} className="pt-6 text-center">
        <h2 className="text-2xl font-black text-[#2D1B4E] mb-2">What remains distinctly human</h2>
        <p className="text-xs text-gray-500 max-w-2xl mx-auto mb-8">
          These are your enduring anchors. As technical tasks automate, these uniquely human capabilities become your primary differentiator and most valuable asset.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {humanStrengths ? humanStrengths.map((label, index) => {
            const Icon = HUMAN_STRENGTH_ICONS[index % HUMAN_STRENGTH_ICONS.length];
            return (
              <motion.div
                key={label}
                whileHover={{ y: -4 }}
                className="bg-white rounded-2xl py-6 px-3 shadow-xs border border-purple-50 flex flex-col items-center justify-center transition-all"
              >
                <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-[#8C3F96] mb-2">
                  <Icon size={18} />
                </div>
                <span className="text-xs font-bold text-gray-800">{label}</span>
              </motion.div>
            );
          }) : (
            <div className="col-span-full bg-white rounded-2xl py-6 px-3 shadow-xs border border-purple-50 text-center">
              <p className="text-xs text-gray-500">Complete your assessment to see which human strengths set you apart.</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Career Paths */}
      <motion.div variants={item} className="pt-4">
        <h2 className="text-2xl font-black text-[#2D1B4E] mb-6">Where could these skills take you?</h2>
        {recommendations.length === 0 ? (
          <div className="bg-white/95 backdrop-blur-md border border-purple-100 shadow-xs rounded-3xl p-8 text-center">
            <p className="text-sm text-gray-500">
              No career recommendations yet. Complete your profile and AI assessment to unlock your best career matches.
            </p>
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recommendations.map((rec, index) => {
            const isTop = index === 0;
            return (
              <div
                key={rec.careerId}
                className={`${
                  isTop
                    ? 'bg-[#FFF4EE] border-2 border-[#D47B5A]'
                    : 'bg-white/90 backdrop-blur-md border border-purple-100 shadow-xs'
                } rounded-3xl p-6 relative flex flex-col justify-between`}
              >
                <div>
                  {isTop && (
                    <div className="inline-flex items-center gap-1 bg-[#D47B5A] text-white text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider mb-4">
                      <Search size={10} /> Recommended Fit
                    </div>
                  )}
                  <div className="flex justify-between items-start mb-2">
                     <h3 className="text-lg font-bold text-[#2D1B4E] leading-tight">{rec.careerName}</h3>
                     <span className={`text-2xl ${isTop ? 'font-black text-[#D47B5A]' : 'font-bold text-[#2D1B4E]'}`}>{rec.matchScore}%</span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed mb-6">
                     {rec.reason}
                  </p>
                </div>
                <button
                  onClick={() => navigate('/dashboard/skills')}
                  className={`w-full font-bold text-xs py-2.5 rounded-xl transition-colors shadow-sm cursor-pointer ${
                    isTop
                      ? 'bg-[#D47B5A] hover:bg-[#c26d4d] text-white'
                      : 'bg-purple-50 hover:bg-purple-100 text-[#2D1B4E]'
                  }`}
                >
                   Explore Required Skills
                </button>
              </div>
            );
          })}
        </div>
        )}
      </motion.div>

      {/* Personalized Roadmap Callout */}
      <motion.div variants={item} className="bg-gradient-to-r from-[#261338] via-[#431D54] to-[#612A76] rounded-3xl p-8 md:p-10 text-white flex flex-col md:flex-row items-center justify-between shadow-xl gap-8">
         <div className="md:w-1/2 space-y-3">
           <span className="text-[10px] font-bold tracking-widest uppercase bg-white/10 text-purple-200 px-3 py-1 rounded-full border border-white/10">
             Personalized 30/60/90-Day Roadmap
           </span>
           <h2 className="text-2xl md:text-3xl font-black leading-tight">Start your tailored career roadmap</h2>
           <p className="text-xs text-purple-200/80 leading-relaxed">
             Your roadmap breaks down the skills you need to develop into practical 30, 60, and 90-day steps for your recommended career.
           </p>
           <motion.button
             whileHover={{ scale: 1.05 }}
             whileTap={{ scale: 0.95 }}
             onClick={() => navigate('/dashboard/roadmap')}
             className="bg-[#D47B5A] hover:bg-[#c26d4d] text-white font-bold px-6 py-3 rounded-xl transition-all flex items-center gap-2 text-xs shadow-lg cursor-pointer pt-2"
           >
             <span>View My Roadmap</span>
             <ArrowRight size={15} />
           </motion.button>
         </div>

         <div className="md:w-5/12 w-full bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/15 shadow-inner">
           <div className="flex justify-between items-center mb-5">
              <span className="text-[10px] font-bold text-purple-200 uppercase tracking-wider">Milestone Progress</span>
              <Settings2 size={16} className="text-purple-300" />
           </div>
           {!hasRoadmap || !phaseProgress ? (
             <p className="text-xs text-purple-200/80">
               Generate your roadmap to start tracking progress through each phase.
             </p>
           ) : (
           <div className="space-y-4">
             <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#D47B5A] text-white flex items-center justify-center text-xs font-bold shrink-0">M1</div>
                <div className="flex-1">
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="font-semibold text-white">Foundation</span>
                    <span className="font-bold text-[#FF9E79]">{phaseProgress.foundation}%</span>
                  </div>
                  <div className="h-2 bg-black/30 w-full rounded-full overflow-hidden">
                    <div className="h-full bg-[#D47B5A] rounded-full" style={{ width: `${phaseProgress.foundation}%` }}></div>
                  </div>
                </div>
             </div>
             <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/10 text-white/70 flex items-center justify-center text-xs font-bold shrink-0">M2</div>
                <div className="flex-1">
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="font-semibold text-white">Development</span>
                    <span className="font-bold text-white/60">{phaseProgress.development}%</span>
                  </div>
                  <div className="h-2 bg-black/30 w-full rounded-full overflow-hidden">
                    <div className="h-full bg-white/40 rounded-full" style={{ width: `${phaseProgress.development}%` }}></div>
                  </div>
                </div>
             </div>
             <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/10 text-white/50 flex items-center justify-center text-xs font-bold shrink-0">M3</div>
                <div className="flex-1">
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="font-semibold text-white/60">Career Proof</span>
                    <span className="font-bold text-white/40">{phaseProgress.proof}%</span>
                  </div>
                  <div className="h-2 bg-black/30 w-full rounded-full overflow-hidden">
                    <div className="h-full bg-white/20 rounded-full" style={{ width: `${phaseProgress.proof}%` }}></div>
                  </div>
                </div>
             </div>
           </div>
           )}
         </div>
      </motion.div>
    </motion.div>
  );
};

export default CareerAssessment;
