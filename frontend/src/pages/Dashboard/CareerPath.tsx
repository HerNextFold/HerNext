import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Briefcase,
  Clock,
  Target,
  ArrowRight,
  Check,
  Sparkles
} from 'lucide-react';
import PurpleBackgroundDots from '../../components/dashboard/PurpleBackgroundDots';
import { useNavigate } from 'react-router-dom';
import { useUserContext } from '../../context/UserContext';
import {
  ApiError,
  getProfile,
  getCareerRecommendations,
  getSkillGaps,
  type CareerProfile,
  type CareerRecommendation,
  type SkillGapItem
} from '../../lib/api';

const PRIORITY_LABELS: Record<string, string> = {
  HIGH: 'High Priority',
  MEDIUM: 'Medium Priority',
  LOW: 'Low Priority'
};

export const CareerPath: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUserContext();

  const [profile, setProfile] = useState<CareerProfile | null>(null);
  const [recommendations, setRecommendations] = useState<CareerRecommendation[]>([]);
  const [activeCareerId, setActiveCareerId] = useState<string | null>(null);
  const [skillGaps, setSkillGaps] = useState<SkillGapItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [gapsLoading, setGapsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      setLoadError('');
      try {
        const [profileData, recsData] = await Promise.all([getProfile(), getCareerRecommendations()]);
        if (cancelled) return;
        setProfile(profileData);
        setRecommendations(recsData.recommendations ?? []);
        if (recsData.recommendations && recsData.recommendations.length > 0) {
          setActiveCareerId(recsData.recommendations[0].careerId);
        }
      } catch (err) {
        if (!cancelled) setLoadError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!activeCareerId) return;
    const careerId: string = activeCareerId;
    let cancelled = false;
    async function loadGaps() {
      setGapsLoading(true);
      try {
        const data = await getSkillGaps(careerId);
        if (!cancelled) setSkillGaps(data.skills ?? []);
      } catch {
        if (!cancelled) setSkillGaps([]);
      } finally {
        if (!cancelled) setGapsLoading(false);
      }
    }
    void loadGaps();
    return () => { cancelled = true; };
  }, [activeCareerId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSelectPath = (careerId: string) => {
    setActiveCareerId(careerId);
    const rec = recommendations.find((r) => r.careerId === careerId);
    showToast(`Switched career path view to ${rec?.careerName ?? 'this career'}.`);
  };

  const topRecommendation = recommendations.find((r) => r.careerId === activeCareerId) ?? recommendations[0];
  const hasSkills = skillGaps.filter((s) => s.status === 'HAS_SKILL');
  const developSkills = skillGaps.filter((s) => s.status === 'NEEDS_DEVELOPMENT');

  const currentRole = profile?.currentOccupation || 'Not set';
  const yearsLabel = profile ? `${profile.yearsOfExperience} yrs` : '—';
  const industry = profile?.industry || 'Not set';

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.45 } }
  };

  return (
    <div className="relative min-h-screen">
      {/* Ambient Floating Purple Background Dots */}
      <PurpleBackgroundDots dotCount={50} />

      {/* Main Container */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="max-w-5xl mx-auto space-y-8 pb-24 pt-2 font-sans text-gray-800 relative z-10"
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
                <Briefcase size={13} />
              </div>
              <span className="font-medium">{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 1. Header Section */}
        <motion.div variants={itemVariants} className="space-y-3">
          <div className="inline-flex items-center gap-1.5 bg-[#F4ECF8] text-[#8C3F96] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
            <span>HERNEXT CAREER DISCOVERY</span>
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-[40px] font-bold text-[#2D1B4E] leading-tight tracking-tight">
            Where could your experience take you next?
          </h1>

          <p className="text-gray-600 text-xs sm:text-sm max-w-3xl leading-relaxed">
            Based on your profile, HerNext matched your experience and skills against the approved careers in the fintech catalogue. These are the paths where your background provides the strongest foundation.
          </p>

          {/* User Profile Summary Strip Card */}
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-purple-100/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
            <div className="flex flex-wrap items-center gap-6 sm:gap-12 w-full sm:w-auto">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-purple-50 text-[#8C3F96] flex items-center justify-center">
                  <Briefcase size={17} />
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Current Role</span>
                  <span className="text-xs font-bold text-[#2D1B4E]">{currentRole}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-purple-50 text-[#8C3F96] flex items-center justify-center">
                  <Clock size={17} />
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Experience</span>
                  <span className="text-xs font-bold text-[#2D1B4E]">{yearsLabel}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-purple-50 text-[#8C3F96] flex items-center justify-center">
                  <Target size={17} />
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Industry</span>
                  <span className="text-xs font-bold text-[#2D1B4E]">{industry}</span>
                </div>
              </div>
            </div>

            {user.country && (
              <span className="text-[11px] font-bold text-gray-500 bg-purple-50 px-3 py-1.5 rounded-full border border-purple-100 whitespace-nowrap">
                {user.state ? `${user.state}, ${user.country}` : user.country}
              </span>
            )}
          </div>
        </motion.div>

        {isLoading && (
          <div className="rounded-xl border border-purple-100 bg-purple-50/60 p-3 text-xs text-[#8C3F96]">
            Loading your career recommendations...
          </div>
        )}

        {loadError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            {loadError}
          </div>
        )}

        {!isLoading && !loadError && recommendations.length === 0 && (
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-purple-100/80 shadow-xs text-center space-y-3">
            <div className="w-12 h-12 mx-auto bg-purple-50 rounded-2xl flex items-center justify-center text-[#8C3F96]">
              <Target size={22} />
            </div>
            <h2 className="text-lg font-extrabold text-[#2D1B4E]">No career recommendations yet</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-md mx-auto">
              Add a profile and run the AI Career Assessment to receive personalized career matches.
            </p>
            <button
              onClick={() => navigate('/dashboard/assessment')}
              className="mt-3 px-6 py-3 rounded-xl bg-[#2D1B4E] hover:bg-[#431F69] text-white text-xs font-bold transition-all inline-flex items-center gap-2 cursor-pointer shadow-md"
            >
              <Sparkles size={14} />
              <span>Run the AI Assessment</span>
            </button>
          </div>
        )}

        {!isLoading && !loadError && recommendations.length > 0 && topRecommendation && (
        <>
        {/* 2. Top Recommendation Hero Card */}
        <motion.div variants={itemVariants}>
          <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-purple-100/80 shadow-xs relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 flex-1 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 bg-[#FAF0E6] text-[#9E4733] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                <span className="text-xs">📍</span> Top Recommendation
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-[#2D1B4E]">
                {topRecommendation.careerName}
              </h2>

              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                {topRecommendation.reason || 'Based on your experience and skills.'}
              </p>
            </div>

            {/* Score Card */}
            <div className="bg-[#FAF8FC] border border-purple-100/80 rounded-2xl p-6 text-center w-full md:w-48 shrink-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black text-[#2D1B4E] block mb-1">
                {Math.round(topRecommendation.matchScore)}%
              </span>
              <span className="text-xs font-bold text-[#2D1B4E] block mb-2">
                Career Match
              </span>
              <div className="w-20 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-[#2D1B4E] h-full rounded-full"
                  style={{ width: `${Math.min(100, Math.round(topRecommendation.matchScore))}%` }}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* 3. Why this makes sense for you Section */}
        <motion.div variants={itemVariants} className="space-y-4">
          <h2 className="text-xl font-bold text-[#2D1B4E]">Why this makes sense for you</h2>

          {gapsLoading ? (
            <div className="rounded-xl border border-purple-100 bg-purple-50/60 p-3 text-xs text-[#8C3F96]">
              Loading skill alignment...
            </div>
          ) : (
            <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-purple-100/80 shadow-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative items-center">
                {/* Left Column: Skills you already have */}
                <div className="space-y-4">
                  <h3 className="font-bold text-[#2D1B4E] text-sm flex items-center gap-2">
                    <span className="text-[#8C3F96]">✓</span> Skills You Already Have
                  </h3>
                  {hasSkills.length > 0 ? (
                    <div className="space-y-3">
                      {hasSkills.map((skill, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 text-xs font-medium text-gray-700 p-2 rounded-xl hover:bg-purple-50/60 transition-colors"
                        >
                          <Check size={16} className="text-[#8C3F96] shrink-0" />
                          <span>{skill.skillName}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 font-medium">No matching skills mapped yet.</p>
                  )}
                </div>

                {/* Center Arrow in Desktop */}
                <div className="hidden md:flex absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-gray-300">
                  <ArrowRight size={24} />
                </div>

                {/* Right Column: Skills this career needs */}
                <div className="space-y-4 md:pl-6 border-t md:border-t-0 md:border-l border-gray-100 pt-6 md:pt-0">
                  <h3 className="font-bold text-[#2D1B4E] text-sm flex items-center gap-2">
                    <span className="text-[#9E4733]">▶</span> Skills This Career Needs
                  </h3>
                  {developSkills.length > 0 ? (
                    <div className="space-y-3">
                      {developSkills.map((skill, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 text-xs font-medium text-gray-700 p-2 rounded-xl hover:bg-orange-50/60 transition-colors"
                        >
                          <Check size={16} className="text-[#9E4733] shrink-0" />
                          <span>{skill.skillName}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 font-medium">All required skills are already mapped.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* 4. Skills to Develop Section */}
        <motion.div variants={itemVariants} className="space-y-4">
          <h2 className="text-xl font-bold text-[#2D1B4E]">Skills to Develop</h2>

          {gapsLoading ? (
            <div className="rounded-xl border border-purple-100 bg-purple-50/60 p-3 text-xs text-[#8C3F96]">
              Loading skills to develop...
            </div>
          ) : developSkills.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {developSkills.map((skill, idx) => (
                <div
                  key={idx}
                  onClick={() => navigate('/dashboard/skills')}
                  className="bg-white/95 backdrop-blur-md rounded-3xl p-6 border border-purple-100/80 shadow-xs flex flex-col justify-between cursor-pointer hover:border-purple-200 transition-all group"
                >
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-8 h-8 rounded-xl bg-purple-50 text-[#8C3F96] flex items-center justify-center">
                      <Sparkles size={16} />
                    </div>
                    <h3 className="font-bold text-[#2D1B4E] text-base group-hover:text-[#8C3F96] transition-colors">
                      {skill.skillName}
                    </h3>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-medium text-gray-400">Required for {topRecommendation.careerName}</span>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                      skill.priority === 'HIGH'
                        ? 'bg-[#FAF0E6] text-[#9E4733]'
                        : skill.priority === 'MEDIUM'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {PRIORITY_LABELS[skill.priority] ?? skill.priority}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 border border-purple-100/80 shadow-xs">
              <p className="text-xs text-gray-400 font-medium">No skill gaps for this career path.</p>
            </div>
          )}
        </motion.div>

        {/* 5. Career Recommendations */}
        <motion.div variants={itemVariants} className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#2D1B4E]">Recommended Career Paths</h2>
            <span className="text-xs text-gray-500 font-medium">Click a card to inspect that path</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {recommendations.map((rec) => (
              <motion.div
                key={rec.careerId}
                whileHover={{ y: -3 }}
                onClick={() => handleSelectPath(rec.careerId)}
                className={`rounded-3xl p-6 border transition-all cursor-pointer flex flex-col justify-between ${
                  activeCareerId === rec.careerId
                    ? 'bg-purple-50/80 border-[#8C3F96] shadow-md ring-1 ring-[#8C3F96]'
                    : 'bg-white/95 border-purple-100/80 shadow-xs hover:border-purple-200'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-8 h-8 rounded-xl bg-purple-50 text-[#8C3F96] flex items-center justify-center">
                      <Target size={16} />
                    </div>
                    <span className="bg-[#FAF0E6] text-[#8C3F96] text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                      {Math.round(rec.matchScore)}% Match
                    </span>
                  </div>

                  <h3 className="font-bold text-[#2D1B4E] text-base mb-1.5">
                    {rec.careerName}
                  </h3>

                  <p className="text-xs text-gray-500 leading-relaxed">
                    {rec.reason || 'Aligned with your experience and skills.'}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* 6. Roadmap Call-to-Action Section */}
        <motion.div variants={itemVariants} className="text-center py-6 space-y-3">
          <p className="text-sm font-bold text-[#2D1B4E]">Ready to start this journey?</p>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/dashboard/roadmap')}
            className="bg-[#2D1B4E] hover:bg-[#431F69] text-white font-bold text-sm px-8 py-3.5 rounded-2xl shadow-xl transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            <span>Build Your {topRecommendation.careerName} Roadmap</span>
            <ArrowRight size={16} />
          </motion.button>

          <p className="text-[11px] text-gray-400 font-medium block">
            Your personalized 30/60/90 day plan follows the skills this career requires.
          </p>
        </motion.div>

        {/* 7. Next Steps Section */}
        <motion.div variants={itemVariants} className="space-y-4">
          <h2 className="text-xl font-bold text-[#2D1B4E]">Next Steps</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div
              onClick={() => navigate('/dashboard/roadmap')}
              className="flex flex-col items-center text-center p-4 rounded-2xl bg-white/60 hover:bg-white border border-gray-100 transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-full bg-purple-50 text-[#2D1B4E] font-bold text-sm flex items-center justify-center mb-3">
                1
              </div>
              <h4 className="font-bold text-[#2D1B4E] text-xs mb-1 group-hover:text-[#8C3F96] transition-colors">
                Build Your Roadmap
              </h4>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                We'll generate a 30/60/90 day learning plan around the required skills.
              </p>
            </div>

            {/* Step 2 */}
            <div
              onClick={() => navigate('/dashboard/skills')}
              className="flex flex-col items-center text-center p-4 rounded-2xl bg-white/60 hover:bg-white border border-gray-100 transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-full bg-purple-50 text-[#2D1B4E] font-bold text-sm flex items-center justify-center mb-3">
                2
              </div>
              <h4 className="font-bold text-[#2D1B4E] text-xs mb-1 group-hover:text-[#8C3F96] transition-colors">
                Close Your Skill Gaps
              </h4>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Review the gap skills above and track them on your skill plan.
              </p>
            </div>

            {/* Step 3 */}
            <div
              onClick={() => navigate('/dashboard/insights')}
              className="flex flex-col items-center text-center p-4 rounded-2xl bg-white/60 hover:bg-white border border-gray-100 transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-full bg-purple-50 text-[#2D1B4E] font-bold text-sm flex items-center justify-center mb-3">
                3
              </div>
              <h4 className="font-bold text-[#2D1B4E] text-xs mb-1 group-hover:text-[#8C3F96] transition-colors">
                Track Your AI Impact
              </h4>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Understand how AI affects your work and which skills to prioritize next.
              </p>
            </div>
          </div>
        </motion.div>

        {/* 8. Header Note Card */}
        <motion.div variants={itemVariants}>
          <div className="bg-[#F4ECF8] rounded-3xl p-6 sm:p-8 border border-purple-100 space-y-2 text-gray-700 relative">
            <div className="flex items-center gap-2 text-[#2D1B4E] font-bold text-sm">
              <Sparkles size={18} className="text-[#8C3F96]" />
              <span>A Note from HerNext</span>
            </div>
            <p className="text-xs sm:text-sm leading-relaxed text-gray-700">
              Focus on the high-priority skills in your roadmap first. Match scores are based on how your existing experience and skills align with each career — not on salary or market forecasts.
            </p>
          </div>
        </motion.div>

        {/* 9. Footer Disclaimer */}
        <motion.div variants={itemVariants} className="pt-4 border-t border-gray-200/80">
          <p className="text-[10px] text-gray-400 text-center leading-relaxed">
            Career recommendations are computed by the HerNext backend from your provided experience, your skills, and the approved fintech careers catalogue. Match scores reflect skill alignment only.
          </p>
        </motion.div>
        </>
        )}
      </motion.div>
    </div>
  );
};

export default CareerPath;