import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Briefcase,
  Building2,
  FileText,
  UserCircle,
  Clock,
  Sparkles,
  ChevronRight,
  Award,
  CheckCircle2,
  ArrowUpRight,
  ShieldCheck,
  Compass
} from 'lucide-react';
import { useDashboardContext } from '../../context/DashboardContext';
import { useUserContext } from '../../context/UserContext';
import {
  ApiError,
  getCareerRecommendations,
  getProfile,
  getProgressSummary,
  type CareerProfile,
  type CareerRecommendation,
  type ProgressSummary,
} from '../../lib/api';

const TRENDING_SKILLS = [
  'Prompt Engineering',
  'AI Prototyping',
  'Design Systems',
  'Conversational UI',
  'AI Ethics & Safety',
  'Figma',
  'User Research',
  'Data Visualization'
];

function yearsToString(years: number): string {
  if (years <= 2) return '0-2 years';
  if (years <= 5) return '3-5 years';
  if (years <= 8) return '5-8 years';
  if (years <= 12) return '8-12 years';
  return '12+ years';
}

const CareerInsights: React.FC = () => {
  const navigate = useNavigate();
  const { setCareerData } = useDashboardContext();
  const { user } = useUserContext();

  const [formData, setFormData] = useState({
    targetRole: '',
    company: '',
    jobDescription: '',
    currentRole: '',
    yearsExperience: '',
    topSkills: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeChecklist, setActiveChecklist] = useState<number[]>([0, 2]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [profile, setProfile] = useState<CareerProfile | null>(null);
  const [recommendations, setRecommendations] = useState<CareerRecommendation[]>([]);
  /**
   * Set when the backend declined to rank careers because the participant's own
   * data could not tell two careers apart. The list is then empty on purpose and
   * `missingReasons` explains what is needed. No catalogue career is ever
   * substituted for a real recommendation.
   */
  const [insufficientData, setInsufficientData] = useState(false);
  const [missingReasons, setMissingReasons] = useState<string[]>([]);
  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setLoadError('');
      try {
        const [profileData, recs, summaryData] = await Promise.all([
          getProfile().catch(() => null),
          getCareerRecommendations(3),
          getProgressSummary(),
        ]);
        if (cancelled) return;

        setProfile(profileData);
        setRecommendations(recs.recommendations);
        setInsufficientData(recs.status === 'INSUFFICIENT_DATA');
        setMissingReasons(recs.missing ?? []);
        setSummary(summaryData);

        if (profileData) {
          setFormData((prev) => ({
            ...prev,
            currentRole: profileData.currentOccupation || prev.currentRole,
            yearsExperience: yearsToString(profileData.yearsOfExperience),
            topSkills:
              profileData.existingSkills.map((s) => s.skillName).filter(Boolean).join(', ') ||
              prev.topSkills,
            targetRole: profileData.targetCareer?.name || prev.targetRole,
          }));
        }
      } catch (err) {
        if (cancelled) return;
        setLoadError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const topRecommendation = recommendations[0] ?? null;
  const matchScore = topRecommendation?.matchScore ?? 0;
  const displayName = user.fullName && user.fullName.trim() ? user.fullName.trim() : '';
  const breakdown = summary?.readinessBreakdown;

  const addSkill = (skill: string) => {
    if (!formData.topSkills.toLowerCase().includes(skill.toLowerCase())) {
      const updated = formData.topSkills ? `${formData.topSkills}, ${skill}` : skill;
      setFormData({ ...formData, topSkills: updated });
      if (errors.topSkills) {
        setErrors({ ...errors, topSkills: '' });
      }
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.targetRole.trim()) newErrors.targetRole = 'Target role is required';
    if (!formData.currentRole.trim()) newErrors.currentRole = 'Current role is required';
    if (!formData.topSkills.trim()) newErrors.topSkills = 'Please provide your key skills';
    return newErrors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      showToast('Please fill out the required fields to unlock Overview.');
      return;
    }

    setIsSubmitting(true);
    setCareerData(formData);
    setTimeout(() => {
      navigate('/dashboard/overview');
    }, 600);
  };

  const focusPathway = (pathway: CareerRecommendation) => {
    setFormData({
      ...formData,
      targetRole: pathway.careerName,
      jobDescription: `Targeting the ${pathway.careerName} role. ${pathway.reason}`,
    });
    showToast(`Selected pathway: ${pathway.careerName}`);
  };

  const toggleChecklist = (idx: number) => {
    if (activeChecklist.includes(idx)) {
      setActiveChecklist(activeChecklist.filter((i) => i !== idx));
    } else {
      setActiveChecklist([...activeChecklist, idx]);
      showToast('Career readiness signal added');
    }
  };

  const inputClasses = "w-full bg-white/90 border-gray-200 rounded-xl shadow-xs focus:ring-2 focus:ring-[#8C3F96] focus:border-[#8C3F96] p-3 border pl-10 text-xs md:text-sm transition-all";
  const labelClasses = "block text-xs font-bold text-gray-700 mb-1.5";

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20 pt-2 font-sans">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-20 right-8 z-50 bg-[#261338] text-white text-xs px-4 py-3 rounded-xl shadow-2xl border border-purple-400/30 flex items-center gap-2"
          >
            <Sparkles size={14} className="text-[#F05A7E]" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#2B1238] via-[#431D54] to-[#612A76] p-6 md:p-8 text-white shadow-xl shadow-purple-950/20"
      >
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-[#F05A7E]/20 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase text-purple-200 border border-white/10">
              <Sparkles size={12} className="text-[#F05A7E]" />
              <span>HerNext Career Intelligence</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Unlock Your AI-Ready Career Pathway
            </h1>
            <p className="text-purple-200/80 text-xs md:text-sm leading-relaxed">
              Define your target role and current skills. Your pathways, match scores, and readiness are derived from your own profile and experience.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 md:flex-col md:items-end shrink-0">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#F05A7E] to-[#FF8E53] flex items-center justify-center text-white font-bold">
                <Briefcase size={20} />
              </div>
              <div>
                <span className="text-[10px] text-purple-200 block uppercase font-medium">Your Profile</span>
                <span className="text-sm font-black text-white">
                  {isLoading ? '…' : (profile ? `${profile.currentOccupation || 'Profile ready'}` : 'Complete your onboarding')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {loadError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
          {loadError}
        </div>
      )}

      {/* Main Grid: Form (Left) & Real-time Match (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Career Profile Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="lg:col-span-7 bg-white/90 backdrop-blur-md rounded-3xl shadow-sm p-6 md:p-8 border border-purple-100/80 relative"
        >
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-100">
            <div>
              <h2 className="text-xl font-bold text-[#2D1B4E]">Career Profile Details</h2>
              <p className="text-gray-500 text-xs mt-0.5">Fill out your target and experience metrics.</p>
            </div>
            <span className="text-xs bg-purple-50 text-[#8C3F96] font-bold px-3 py-1 rounded-full border border-purple-100">
              Step 1 of 2
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Target Job Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#8C3F96] flex items-center gap-2">
                  <Briefcase size={15} /> 1. Target Opportunity
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses}>Target Role <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Briefcase className="absolute left-3.5 top-3.5 text-gray-400" size={17} />
                    <input
                      type="text"
                      name="targetRole"
                      value={formData.targetRole}
                      onChange={handleChange}
                      className={`${inputClasses} ${errors.targetRole ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                      placeholder="e.g. Fintech Operations Associate"
                    />
                  </div>
                  {errors.targetRole && <p className="text-red-500 text-[11px] mt-1 font-medium">{errors.targetRole}</p>}
                </div>

                <div>
                  <label className={labelClasses}>Target Company / Sector</label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-3.5 text-gray-400" size={17} />
                    <input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      className={inputClasses}
                      placeholder="Optional"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className={labelClasses}>Target Job Description</label>
                  <div className="relative">
                    <FileText className="absolute left-3.5 top-3.5 text-gray-400" size={17} />
                    <textarea
                      rows={3}
                      name="jobDescription"
                      value={formData.jobDescription}
                      onChange={handleChange}
                      className="w-full bg-white/90 border-gray-200 rounded-xl shadow-xs focus:ring-2 focus:ring-[#8C3F96] focus:border-[#8C3F96] p-3 border pl-10 text-xs md:text-sm"
                      placeholder="Optional - paste responsibilities or requirements from the target role"
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>

            {/* Current Experience Section */}
            <div className="pt-3 border-t border-gray-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#8C3F96] mb-3 flex items-center gap-2">
                <UserCircle size={15} /> 2. Your Current Experience
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses}>Current Role <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <UserCircle className="absolute left-3.5 top-3.5 text-gray-400" size={17} />
                    <input
                      type="text"
                      name="currentRole"
                      value={formData.currentRole}
                      onChange={handleChange}
                      className={`${inputClasses} ${errors.currentRole ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                      placeholder="e.g. Payments Operations Specialist"
                    />
                  </div>
                  {errors.currentRole && <p className="text-red-500 text-[11px] mt-1 font-medium">{errors.currentRole}</p>}
                </div>

                <div>
                  <label className={labelClasses}>Years of Experience</label>
                  <div className="relative">
                    <Clock className="absolute left-3.5 top-3.5 text-gray-400" size={17} />
                    <select
                      name="yearsExperience"
                      value={formData.yearsExperience}
                      onChange={handleChange}
                      className={`${inputClasses} bg-white appearance-none cursor-pointer`}
                    >
                      {!formData.yearsExperience && <option value="">Select years of experience</option>}
                      <option>0-2 years</option>
                      <option>3-5 years</option>
                      <option>5-8 years</option>
                      <option>8-12 years</option>
                      <option>12+ years</option>
                    </select>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className={labelClasses}>Top Skills & Proficiencies <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Sparkles className="absolute left-3.5 top-3.5 text-gray-400" size={17} />
                    <input
                      type="text"
                      name="topSkills"
                      value={formData.topSkills}
                      onChange={handleChange}
                      className={`${inputClasses} ${errors.topSkills ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                      placeholder="e.g. Transaction Processing, Reconciliation, Excel"
                    />
                  </div>
                  {errors.topSkills && <p className="text-red-500 text-[11px] mt-1 font-medium">{errors.topSkills}</p>}

                  <div className="mt-3">
                    <span className="text-[10px] text-gray-500 font-semibold block mb-1.5">Click to add skills:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {TRENDING_SKILLS.map((skill) => (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => addSkill(skill)}
                          className="bg-purple-50 hover:bg-[#F05A7E] hover:text-white text-purple-900 border border-purple-100 text-[11px] px-2.5 py-1 rounded-full font-medium transition-all cursor-pointer"
                        >
                          + {skill}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 flex items-center justify-between border-t border-gray-100">
              <div className="text-xs text-gray-500">
                <span>Your progress is derived from your saved profile and activities.</span>
              </div>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-[#2D1B4E] via-[#4A2663] to-[#732982] text-white px-7 py-3 rounded-xl hover:shadow-lg hover:shadow-purple-900/30 transition-all font-bold flex items-center gap-2 text-xs md:text-sm cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Compiling Overview...</span>
                  </>
                ) : (
                  <>
                    <span>Generate Career Overview</span>
                    <ChevronRight size={17} />
                  </>
                )}
              </motion.button>
            </div>
          </form>
        </motion.div>

        {/* Right Column: Real Match Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-5 space-y-5"
        >
          {/* Match Gauge Card */}
          <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 border border-purple-100 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#F05A7E]">From your profile</span>
                <h3 className="text-base font-bold text-[#2D1B4E]">Target Role Readiness</h3>
              </div>
              <span className="w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-100 animate-pulse"></span>
            </div>

            <div className="flex items-center gap-6 my-4">
              <div className="relative w-28 h-28 flex-shrink-0">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="56" cy="56" r="46" fill="transparent" stroke="#F4EFF7" strokeWidth="10" />
                  <motion.circle
                    initial={{ strokeDashoffset: 289.02 }}
                    animate={{ strokeDashoffset: 289.02 - (289.02 * matchScore) / 100 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    cx="56" cy="56" r="46" fill="transparent" stroke="#8C3F96" strokeWidth="10" strokeDasharray="289.02"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-[#2D1B4E]">{isLoading ? '…' : `${Math.round(matchScore)}%`}</span>
                  <span className="text-[9px] font-bold text-gray-400 uppercase">Match Score</span>
                </div>
              </div>

              <div className="space-y-2 flex-1">
                <div>
                  <div className="flex justify-between text-[11px] mb-0.5">
                    <span className="text-gray-600 font-medium">Core Experience</span>
                    <span className="font-bold text-[#2D1B4E]">{isLoading ? '…' : `${Math.round(breakdown?.experience ?? 0)}%`}</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#5B2975] rounded-full" style={{ width: `${breakdown?.experience ?? 0}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] mb-0.5">
                    <span className="text-gray-600 font-medium">Skills Alignment</span>
                    <span className="font-bold text-[#2D1B4E]">{isLoading ? '…' : `${Math.round(breakdown?.skills ?? 0)}%`}</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#8C3F96] rounded-full" style={{ width: `${breakdown?.skills ?? 0}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] mb-0.5">
                    <span className="text-gray-600 font-medium">AI Tooling</span>
                    <span className="font-bold text-[#F05A7E]">{isLoading ? '…' : `${Math.round(breakdown?.aiReadiness ?? 0)}%`}</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-[#F05A7E]" style={{ width: `${breakdown?.aiReadiness ?? 0}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] mb-0.5">
                    <span className="text-gray-600 font-medium">Portfolio Evidence</span>
                    <span className="font-bold text-[#2D1B4E]">{isLoading ? '…' : `${Math.round(breakdown?.evidence ?? 0)}%`}</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#5B2975] rounded-full" style={{ width: `${breakdown?.evidence ?? 0}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-gray-500 bg-purple-50/50 p-2.5 rounded-xl border border-purple-100/50">
              💡 <span className="font-semibold text-[#2D1B4E]">AI Tip:</span>{' '}
              {topRecommendation ? (
                <>Your strongest match is <strong>{topRecommendation.careerName}</strong> at {Math.round(topRecommendation.matchScore)}%. Strengthen your skill gaps to improve your match.</>
              ) : (
                <>Complete your profile and experience to unlock a personalised career match.</>
              )}
            </p>
          </div>

          {/* Recommended Pathway Summary Card */}
          <div className="bg-gradient-to-br from-[#FAF5ED] to-[#FFF9F2] rounded-3xl p-6 border border-[#F5E6CE] shadow-xs">
            <div className="flex items-center gap-2 text-[#C47D3B] mb-2">
              <Award size={16} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Top Recommended Pathway</span>
            </div>
            {topRecommendation ? (
              <>
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="text-lg font-black text-[#2D1B4E]">{topRecommendation.careerName}</span>
                  <span className="text-sm font-black text-[#8C3F96]">{Math.round(topRecommendation.matchScore)}%</span>
                </div>
                <p className="text-[11px] text-gray-600 leading-relaxed">{topRecommendation.reason}</p>
              </>
            ) : (
              <p className="text-[11px] text-gray-600">
                No recommendations yet. Build your profile and experience and check back here.
              </p>
            )}
          </div>

          {/* Floating AI Assistant Tip Badge */}
          <motion.div
            whileHover={{ y: -2 }}
            className="bg-white rounded-2xl p-4 border border-purple-100 shadow-sm flex items-center gap-3.5"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-[#8C3F96] flex items-center justify-center shrink-0">
              <Sparkles size={20} />
            </div>
            <div className="text-left">
              <h4 className="text-xs font-bold text-[#2D1B4E]">Ready to explore Overview?</h4>
              <p className="text-[11px] text-gray-500">Fill the required fields to view your full readiness report.</p>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* SECTION 1: Recommended Pathways */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="space-y-4 pt-6"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-2">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[#F05A7E] text-[10px] font-bold uppercase tracking-wider mb-1">
              <Compass size={14} /> Career Evolution Tracks
            </div>
            <h2 className="text-2xl font-black text-[#2D1B4E]">
              Recommended Pathways{displayName ? ` for ${displayName}` : ''}
            </h2>
          </div>
          <p className="text-xs text-gray-500 max-w-md">
            Derived from your saved profile, skills, and experience records.
          </p>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-3xl p-6 border border-purple-100 shadow-sm text-xs text-gray-500">
            Loading your recommendations…
          </div>
        ) : recommendations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recommendations.map((pathway) => (
              <motion.div
                key={pathway.careerId}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className="bg-white rounded-3xl p-6 border border-purple-100 shadow-sm hover:shadow-xl hover:border-purple-200 transition-all flex flex-col justify-between group relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#8C3F96] to-[#F05A7E]" />

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-[#8C3F96] px-2.5 py-1 rounded-full">
                      Recommended
                    </span>
                    <div className="flex items-center gap-1 text-xs font-black text-[#2D1B4E]">
                      <Award size={14} className="text-[#F05A7E]" />
                      <span>{Math.round(pathway.matchScore)}% Match</span>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-[#2D1B4E] group-hover:text-[#8C3F96] transition-colors mb-1.5">
                    {pathway.careerName}
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed">{pathway.reason}</p>
                </div>

                <div className="pt-4 border-t border-gray-100 flex items-center justify-between mt-4">
                  <span className="text-[11px] text-gray-500 font-medium">Why this fits you</span>
                  <button
                    onClick={() => focusPathway(pathway)}
                    className="p-2 bg-purple-50 hover:bg-[#2D1B4E] text-[#2D1B4E] hover:text-white rounded-xl transition-colors cursor-pointer"
                    aria-label={`Focus ${pathway.careerName}`}
                  >
                    <ArrowUpRight size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : insufficientData ? (
          <div className="bg-white rounded-3xl p-6 border border-purple-100 shadow-sm">
            <h3 className="text-sm font-bold text-[#2D1B4E] mb-1.5">
              We can&rsquo;t rank careers yet
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Your profile doesn&rsquo;t contain enough information yet for a career to score
              better than another, so we&rsquo;re not going to show you an arbitrary one. Add the
              following and your matches will be calculated from your real data:
            </p>
            <ul className="mt-3 space-y-1.5">
              {missingReasons.map((reason) => (
                <li key={reason} className="flex items-start gap-2 text-xs text-gray-700">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#8C3F96]" />
                  {reason}
                </li>
              ))}
            </ul>
            <button
              onClick={() => navigate('/onboarding')}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#2D1B4E] px-4 py-2 text-xs font-semibold text-white hover:bg-[#8C3F96] transition-colors"
            >
              Complete your profile
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-6 border border-purple-100 shadow-sm text-xs text-gray-600">
            No career recommendations yet. Complete your profile and experience to unlock personalised pathways.
          </div>
        )}
      </motion.section>

      {/* SECTION 2: Interactive Career Readiness Pre-Check Widget */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-br from-[#FAF7FB] via-white to-[#FDF4F7] rounded-3xl p-6 md:p-8 border border-purple-100 shadow-sm"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C3F96]">Interactive Diagnostic</span>
            <h2 className="text-xl font-bold text-[#2D1B4E]">Quick Readiness Signals Check</h2>
            <p className="text-xs text-gray-500 mt-0.5">Select each indicator that applies to your current work.</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-purple-100 text-xs font-bold text-[#2D1B4E]">
            <ShieldCheck size={16} className="text-emerald-500" />
            <span>{activeChecklist.length}/4 selected</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { id: 0, title: 'AI Tools in Workflow', desc: 'Use AI tools (e.g. ChatGPT, Copilot, automation platforms) to accelerate your work.' },
            { id: 1, title: 'Cross-functional Collaboration', desc: 'Partner with technical or operational teams on shared outcomes.' },
            { id: 2, title: 'Client-facing Communication', desc: 'Resolve customer issues, build relationships, and communicate outcomes.' },
            { id: 3, title: 'Process & Controls', desc: 'Follow or improve reconciliation, compliance, and quality-check processes.' }
          ].map((item) => {
            const isChecked = activeChecklist.includes(item.id);
            return (
              <motion.div
                key={item.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => toggleChecklist(item.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                  isChecked
                    ? 'bg-purple-50/80 border-[#8C3F96] shadow-xs'
                    : 'bg-white border-gray-200 hover:border-purple-200'
                }`}
              >
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center mt-0.5 transition-colors ${
                  isChecked ? 'bg-[#8C3F96] text-white' : 'bg-gray-100 text-transparent'
                }`}>
                  <CheckCircle2 size={16} className={isChecked ? 'opacity-100' : 'opacity-0'} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">{item.title}</h4>
                  <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">{item.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.section>
    </div>
  );
};

export default CareerInsights;