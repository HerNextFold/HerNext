import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  Share2,
  Download,
  Edit3,
  CheckCircle2,
  Sparkles,
  Award,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Copy,
  Check,
  X,
  Lightbulb,
  ExternalLink,
  Plus
} from 'lucide-react';
import PurpleBackgroundDots from '../../components/dashboard/PurpleBackgroundDots';
import { useUserContext } from '../../context/UserContext';
import { ApiError, generatePassport, getPassport, type Passport } from '../../lib/api';

export const CareerPassport: React.FC = () => {
  const navigate = useNavigate();
  const { user, onboarding, updateUser } = useUserContext();

  const [showShareModal, setShowShareModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [passport, setPassport] = useState<Passport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [hasNoPassport, setHasNoPassport] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState('');
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadPassport() {
      setIsLoading(true);
      setLoadError('');
      setHasNoPassport(false);
      try {
        const { passport: data } = await getPassport();
        if (!cancelled) setPassport(data);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.code === 'RESOURCE_NOT_FOUND') {
          setHasNoPassport(true);
        } else {
          setLoadError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadPassport();
    return () => {
      cancelled = true;
    };
  }, []);

  // Editable Profile fields (local only - the backend has no bio/summary field)
  const [editName, setEditName] = useState(user.fullName);

  const userInitials = user.fullName
    ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleGeneratePassport = async () => {
    if (isGenerating) return;
    setGenerateError('');
    setIsGenerating(true);
    try {
      const { passport: generated } = await generatePassport();
      setPassport(generated);
      setHasNoPassport(false);
    } catch (err) {
      setGenerateError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const publicPassportUrl = passport ? `${window.location.origin}/passport/public/${passport.slug}` : '';

  const handleCopyShareLink = async () => {
    if (!passport) {
      showToast('Generate your Career Passport first.');
      return;
    }
    if (isSharing) return;
    setIsSharing(true);
    try {
      let current = passport;
      if (!current.isPublic) {
        const { passport: updated } = await generatePassport({ isPublic: true });
        setPassport(updated);
        current = updated;
      }
      await navigator.clipboard.writeText(`${window.location.origin}/passport/public/${current.slug}`);
      setCopiedLink(true);
      showToast('📋 Passport verification link copied to clipboard!');
      setTimeout(() => setCopiedLink(false), 3000);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSharing(false);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({ fullName: editName });
    setShowEditProfileModal(false);
    showToast('✨ Career Passport profile updated successfully!');
  };

  // Field-validated = self-reported/verified from real experience; HerNext-developed = AI-derived/earned via challenges.
  const fieldValidatedSkills = passport
    ? passport.skills.filter((s) => s.source === 'SELF_REPORTED' || s.source === 'VERIFIED')
    : null;
  const herNextSkills = passport
    ? passport.skills.filter((s) => s.source === 'AI_DERIVED' || s.source === 'CHALLENGE')
    : null;

  const passportSteps = passport
    ? [
        { title: 'Experience', sub: passport.experience.length > 0 ? 'Baseline logged' : 'Add experience', status: passport.experience.length > 0 ? 'done' : 'pending' },
        { title: 'Skills', sub: passport.skills.length > 0 ? 'Competencies mapped' : 'Discover skills', status: passport.skills.length > 0 ? 'done' : 'pending' },
        { title: 'Roadmap', sub: passport.roadmapProgress > 0 ? 'Learning path' : 'Build your roadmap', status: passport.roadmapProgress > 0 ? 'done' : 'pending' },
        { title: 'Evidence', sub: passport.evidence.length > 0 ? 'Challenges passed' : 'Complete challenges', status: passport.evidence.length > 0 ? 'done' : 'pending' },
        { title: 'Career Ready', sub: passport.readiness.label, status: 'active' }
      ]
    : [];

  return (
    <div className="relative min-h-screen bg-[#FAF8FC] font-sans text-gray-800 pb-20">
      {/* Background Ambient Particles */}
      <PurpleBackgroundDots dotCount={40} />

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-20 right-4 sm:right-8 z-50 bg-[#261338] text-white text-xs px-4 py-3 rounded-2xl shadow-2xl border border-purple-400/30 flex items-center gap-2.5 backdrop-blur-md max-w-sm sm:max-w-md"
          >
            <div className="w-6 h-6 rounded-full bg-[#F05A7E]/20 text-[#F05A7E] flex items-center justify-center shrink-0">
              <Sparkles size={13} />
            </div>
            <span className="font-semibold leading-relaxed">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto space-y-7 relative z-10 px-4 sm:px-6 pt-4">
        
        {/* Top Breadcrumb Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-gray-500 font-medium">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => navigate('/dashboard/roadmap')}
              className="text-[#8C3F96] hover:text-[#5B2975] font-bold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <ArrowLeft size={14} />
              <span>Back to Career Roadmap</span>
            </button>
            <span className="text-gray-300">/</span>
            <span className="text-gray-600 font-semibold">Overview</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1 bg-[#FDF2F5] text-[#F05A7E] text-[11px] font-bold px-3 py-1 rounded-full border border-pink-100">
              <Sparkles size={12} /> AI Track Active
            </span>
            <span className="text-xs font-bold text-[#2D1B4E]">
              {user.fullName || 'HerNext Participant'}
              {onboarding.targetRole && <span className="font-medium text-gray-400"> ({onboarding.targetRole})</span>}
            </span>
          </div>
        </div>

        {/* 1. Header Section matching Figma Screenshot 1 */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-5 border-b border-purple-100/70 pb-6">
          <div className="space-y-1 max-w-3xl">
            <span className="text-[10px] font-extrabold text-[#9E4733] uppercase tracking-wider block">
              • CAREER PASSPORT
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-[#2D1B4E] tracking-tight">
              My Career Passport
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 font-medium leading-relaxed mt-1">
              Your verified professional profile, skills portfolio, experiential track record, and applied career evidence — curated in one authoritative credential.
            </p>
          </div>

          {/* Action Buttons Top Right matching Figma */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setShowShareModal(true)}
              className="px-4 py-2.5 rounded-xl border border-purple-200 text-xs font-bold text-[#2D1B4E] bg-white hover:bg-purple-50 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Share2 size={14} className="text-[#8C3F96]" />
              <span>Share Passport</span>
            </button>

            <button
              onClick={() => setShowDownloadModal(true)}
              className="px-5 py-2.5 rounded-xl bg-[#2D1B4E] hover:bg-[#431F69] text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Download size={14} />
              <span>Download Passport</span>
            </button>
          </div>
        </div>

        {isLoading && (
          <div className="rounded-xl border border-purple-100 bg-purple-50/60 p-3 text-xs text-[#8C3F96]">
            Loading your Career Passport...
          </div>
        )}

        {loadError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            {loadError}
          </div>
        )}

        {hasNoPassport ? (
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-purple-100/80 shadow-xs text-center space-y-4">
            <div className="w-12 h-12 mx-auto bg-purple-50 rounded-2xl flex items-center justify-center text-[#8C3F96]">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-[#2D1B4E]">You don't have a Career Passport yet</h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-md mx-auto">
                Generate your verified profile, skills, experience, and evidence into one shareable credential.
              </p>
            </div>

            {generateError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 max-w-md mx-auto">
                {generateError}
              </div>
            )}

            <button
              onClick={handleGeneratePassport}
              disabled={isGenerating}
              className="px-6 py-3 rounded-xl bg-[#2D1B4E] hover:bg-[#431F69] text-white text-xs font-bold transition-all inline-flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-60"
            >
              <Sparkles size={14} />
              <span>{isGenerating ? 'Generating your Career Passport...' : 'Generate My Career Passport'}</span>
            </button>
          </div>
        ) : (
        <>
        {/* 2. User Profile Card matching Figma Screenshot 1 */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100/80 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            
            {/* Initials Circle */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-[#2D1B4E] to-[#8C3F96] text-white text-2xl font-black flex items-center justify-center shrink-0 shadow-lg shadow-purple-900/20 ring-4 ring-purple-100">
              {userInitials}
            </div>

            {/* User Profile Info */}
            <div className="flex-1 text-center sm:text-left space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center justify-center sm:justify-start gap-2.5 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-black text-[#2D1B4E] tracking-tight">
                    {(user?.fullName || 'HerNext Participant').toUpperCase()}
                  </h2>
                  <span className="bg-pink-50 text-[#F05A7E] text-[10px] font-extrabold px-3 py-1 rounded-full border border-pink-100 flex items-center gap-1">
                    <ShieldCheck size={12} /> Identity Verified
                  </span>
                </div>

                <button
                  onClick={() => setShowEditProfileModal(true)}
                  className="self-center sm:self-auto inline-flex items-center gap-1.5 text-xs font-bold text-[#8C3F96] hover:text-[#5B2975] bg-purple-50 px-3.5 py-1.5 rounded-xl border border-purple-100 hover:bg-purple-100 transition-all cursor-pointer"
                >
                  <Edit3 size={13} />
                  <span>Edit Profile</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs font-semibold text-gray-500">
                <span>{passport?.profile?.currentOccupation || onboarding.currentRole || 'Participant'}</span>
                {user.country && (
                  <>
                    <span>•</span>
                    <span>{user.state ? `${user.state}, ${user.country}` : user.country}</span>
                  </>
                )}
              </div>

              <div className="inline-block bg-purple-50/70 border border-purple-100/80 text-[11px] font-bold text-[#8C3F96] px-3 py-1 rounded-xl">
                Target: {(passport?.careerGoal ?? onboarding.targetRole) || 'Your recommended career goal'}
              </div>

              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-medium pt-1 max-w-3xl">
                {passport?.headline || 'Complete your profile and generate your passport to build a verified professional summary.'}
              </p>
            </div>
          </div>
        </div>

        {/* 3. Split Grid: Career Readiness + Skills Matrix matching Figma Screenshot 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
          
          {/* Left: Career Readiness Card (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-7 border border-purple-100/80 shadow-xs space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-[#2D1B4E]">Career Readiness</h3>
                  <p className="text-[11px] text-gray-400 font-medium">Algorithmic capability and evidence audit</p>
                </div>
                <span className="bg-rose-50 text-[#9E4733] text-[10px] font-extrabold px-3 py-1 rounded-full border border-rose-100">
                  {passport?.readiness.label ?? 'No Passport Yet'}
                </span>
              </div>

              {/* Gauge Score Ring */}
              <div className="flex items-center gap-5 p-4 bg-purple-50/30 rounded-2xl border border-purple-100/60">
                <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-purple-100"
                      strokeWidth="4"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-[#9E4733]"
                      strokeDasharray={`${passport?.readiness.score ?? 0}, 100`}
                      strokeWidth="4"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-lg font-black text-[#2D1B4E] leading-none">{passport?.readiness.score ?? 0}%</span>
                    <span className="text-[8px] font-extrabold text-gray-400 uppercase tracking-tighter mt-0.5">OVERALL</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-[#2D1B4E]">Overall Readiness</h4>
                  <p className="text-[11px] text-gray-500 leading-tight">
                    Your career readiness score, calculated by HerNext from your experience, skills, AI-readiness, and evidence.
                  </p>
                </div>
              </div>

              {/* Progress Bars */}
              <div className="space-y-3 pt-1">
                {[
                  { title: 'Experience Foundation', pct: passport?.readiness.breakdown.experience ?? 0 },
                  { title: 'Skills Alignment', pct: passport?.readiness.breakdown.skills ?? 0 },
                  { title: 'AI Operational Readiness', pct: passport?.readiness.breakdown.aiReadiness ?? 0 },
                  { title: 'Demonstrated Evidence', pct: passport?.readiness.breakdown.evidence ?? 0 }
                ].map((item, idx) => (
                  <div key={idx} className="space-y-1 text-xs">
                    <div className="flex items-center justify-between font-bold text-[#2D1B4E]">
                      <span>{item.title}</span>
                      <span className="text-gray-500 font-semibold">{item.pct}%</span>
                    </div>
                    <div className="w-full bg-purple-50 rounded-full h-2 overflow-hidden border border-purple-100/60">
                      <div 
                        className="bg-gradient-to-r from-[#9E4733] to-[#F05A7E] h-full rounded-full" 
                        style={{ width: `${item.pct}%` }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Strategic Opportunity Callout */}
            <div className="bg-[#FAF4F7] border border-[#F5E1EC] rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-gray-600 mt-2">
              <div className="w-6 h-6 rounded-lg bg-pink-100 text-[#F05A7E] flex items-center justify-center shrink-0 mt-0.5">
                <Lightbulb size={14} />
              </div>
              <p className="text-[11px] leading-snug">
                <strong className="text-[#2D1B4E] font-bold">Insight:</strong> Complete challenges and add evidence to strengthen your career readiness score.
              </p>
            </div>
          </div>

          {/* Right: Skills Matrix Card (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-purple-100/80 shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-[#2D1B4E]">Skills Matrix</h3>
                <p className="text-[11px] text-gray-400 font-medium">Skills developed through direct field tenure and validated via HerNext experiential modules.</p>
              </div>
              <span className="text-[10px] font-extrabold text-[#8C3F96] bg-purple-50 px-3 py-1 rounded-full border border-purple-100">
                {passport ? passport.skills.length : 0} Competencies Mapped
              </span>
            </div>

            {/* Section 1: Transferable Skills */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">
                <span>TRANSFERABLE SKILLS (FIELD-VALIDATED)</span>
                <span className="text-[#8C3F96]">{fieldValidatedSkills?.length ?? 0} Mastered</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {(fieldValidatedSkills ?? []).map((sk, idx) => (
                  <span
                    key={idx}
                    className="bg-purple-50/60 text-[#2D1B4E] text-xs font-semibold px-3 py-1.5 rounded-xl border border-purple-100 flex items-center gap-1.5"
                  >
                    <CheckCircle2 size={13} className="text-[#8C3F96]" />
                    {sk.name}
                  </span>
                ))}
                {fieldValidatedSkills?.length === 0 && (
                  <span className="text-[11px] text-gray-400 font-medium">No field-validated skills yet.</span>
                )}
              </div>
            </div>

            {/* Section 2: HerNext Developed Skills */}
            <div className="space-y-2.5 pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between text-[10px] font-extrabold text-[#9E4733] uppercase tracking-wider">
                <span>HERNEXT DEVELOPED & MODERNIZED SKILLS</span>
                <span className="text-[#9E4733]">{herNextSkills?.length ?? 0} High-Impact</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {(herNextSkills ?? []).map((sk, idx) => (
                  <span
                    key={idx}
                    className="bg-rose-50/70 text-[#9E4733] text-xs font-bold px-3.5 py-1.5 rounded-xl border border-rose-200/80 flex items-center gap-1.5"
                  >
                    <Sparkles size={13} className="text-[#F05A7E]" />
                    {sk.name}
                  </span>
                ))}
                {herNextSkills?.length === 0 && (
                  <span className="text-[11px] text-gray-400 font-medium">No HerNext-developed skills yet.</span>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-purple-100/60 flex items-center justify-between text-xs text-gray-500 font-medium">
              <span>Mapped against the HerNext skills catalogue</span>
              <button 
                onClick={() => navigate('/dashboard/skills')}
                className="text-[#8C3F96] hover:text-[#5B2975] font-bold flex items-center gap-1 cursor-pointer hover:underline"
              >
                <span>Explore full taxonomy</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* 4. Split Grid: Experience + Evidence & Achievements matching Figma Screenshot 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
          
          {/* Left: Experience Column (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-7 border border-purple-100/80 shadow-xs space-y-6">
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-[#2D1B4E]">Experience</h3>
              <p className="text-[11px] text-gray-400 font-medium">Validated commercial experience</p>
            </div>

            {/* Experience Item(s) */}
            {passport ? (
              passport.experience.map((exp, idx) => (
                <div key={idx} className="p-5 rounded-2xl bg-purple-50/30 border border-purple-100/70 space-y-1">
                  <h4 className="text-sm font-black text-[#2D1B4E]">{exp.title}</h4>
                  <span className="text-[11px] text-gray-500 font-medium block">
                    {[exp.organization, exp.years ? `${exp.years} years tenure` : null].filter(Boolean).join(' · ') || exp.employmentType}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-5 rounded-2xl bg-purple-50/30 border border-purple-100/70">
                <p className="text-xs text-gray-500 font-medium">No experience records yet. Add your work experience to build your passport.</p>
              </div>
            )}

            {/* Add Supplementary Experience Button */}
            <button 
              onClick={() => showToast('✨ Supplementary experience form coming soon!')}
              className="w-full p-4 rounded-2xl border-2 border-dashed border-purple-200 text-xs font-bold text-[#8C3F96] hover:bg-purple-50/50 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus size={16} />
              <span>Have supplementary experience? Add Entry</span>
            </button>
          </div>

          {/* Right: Evidence & Achievements Column (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-purple-100/80 shadow-xs space-y-6">
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-[#2D1B4E]">Evidence & Achievements</h3>
              <p className="text-[11px] text-gray-400 font-medium">Applied proof of what you've demonstrated through practical challenges on HerNext.</p>
            </div>

            <div className="space-y-4">
              {passport ? (
                passport.evidence.length > 0 ? (
                  passport.evidence.map((item) => (
                    <div key={item.id} className="p-5 rounded-2xl bg-[#FAF4F7] border border-[#F5E1EC] space-y-2.5">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-black text-[#2D1B4E]">{item.title}</h4>
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 size={11} /> {item.status === 'VERIFIED' ? 'Verified' : 'Pending'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed font-medium">
                        {item.description}
                      </p>
                      {item.skillName && (
                        <div className="flex flex-wrap gap-1.5 text-[10px] font-bold text-[#8C3F96]">
                          <span>Skill demonstrated:</span>
                          <span className="bg-white px-2 py-0.5 rounded border border-purple-100">{item.skillName}</span>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 font-medium">No evidence submitted yet.</p>
                )
              ) : (
                <p className="text-xs text-gray-400 font-medium">Generate your passport to see your submitted evidence here.</p>
              )}
            </div>

            {/* Credential Badges Acquired section matching Figma Screenshot 2 */}
            <div className="pt-3 border-t border-purple-100/60 space-y-3">
              <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">
                CREDENTIAL BADGES ACQUIRED
              </span>

              {passport ? (
                passport.achievements.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {passport.achievements.map((ach) => (
                      <div key={ach.name} className="p-3 bg-purple-50/50 rounded-2xl border border-purple-100 text-center space-y-1">
                        <div className="w-8 h-8 rounded-xl bg-purple-100 text-[#8C3F96] flex items-center justify-center mx-auto">
                          <Award size={16} />
                        </div>
                        <span className="font-bold text-xs text-[#2D1B4E] block">{ach.name}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 font-medium">No achievements earned yet.</p>
                )
              ) : (
                <p className="text-xs text-gray-400 font-medium">No achievements earned yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* 5. Career Development Journey Stepper Track matching Figma Screenshot 3 */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100/80 shadow-xs space-y-7">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-100/60 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-[#2D1B4E]">Career Development Journey</h3>
              <p className="text-[11px] text-gray-400 font-medium">Progress tracking across standardized transition phases</p>
            </div>
            <span className="text-xs font-bold text-[#8C3F96] bg-purple-50 px-3 py-1 rounded-full border border-purple-100 self-start sm:self-auto">
              Active Target: {(passport?.careerGoal ?? onboarding.targetRole) || 'Not set'}
            </span>
          </div>

          {/* Stepper Node Line */}
          <div className="relative py-4">
            <div className="absolute top-1/2 left-4 right-4 h-1 bg-purple-100 -translate-y-1/2 z-0" />
            <div
              className="absolute top-1/2 left-4 h-1 bg-gradient-to-r from-[#2D1B4E] via-[#8C3F96] to-[#9E4733] -translate-y-1/2 z-0"
              style={{ width: `${passport ? Math.min(100, Math.round(passport.roadmapProgress)) : 0}%` }}
            />

            <div className="grid grid-cols-5 relative z-10 text-center">
              {(passportSteps.length > 0
                ? passportSteps
                : [
                    { title: 'Experience', sub: 'Not started', status: 'pending' },
                    { title: 'Skills', sub: 'Not started', status: 'pending' },
                    { title: 'Roadmap', sub: 'Not started', status: 'pending' },
                    { title: 'Evidence', sub: 'Not started', status: 'pending' },
                    { title: 'Career Ready', sub: 'Not started', status: 'pending' }
                  ]
              ).map((step, idx) => (
                <div key={idx} className="flex flex-col items-center space-y-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ring-4 ring-white ${
                    step.status === 'active'
                      ? 'bg-[#9E4733] text-white ring-[#9E4733]/20 shadow-md scale-110'
                      : step.status === 'done'
                      ? 'bg-[#2D1B4E] text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {step.status === 'done' ? <Check size={14} /> : idx + 1}
                  </div>
                  <div>
                    <h4 className={`text-xs font-bold ${step.status === 'active' ? 'text-[#9E4733]' : 'text-[#2D1B4E]'}`}>
                      {step.title}
                    </h4>
                    <span className="text-[10px] text-gray-400 block font-medium hidden sm:block">
                      {step.sub}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stat Summary Boxes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-purple-50/40 rounded-2xl border border-purple-100/70 space-y-1">
              <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">ROADMAP PROGRESS</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-[#2D1B4E]">{passport ? Math.round(passport.roadmapProgress) : 0}%</span>
                <span className="text-xs text-gray-500 font-semibold">of roadmap tasks completed</span>
              </div>
            </div>

            <div className="p-4 bg-purple-50/40 rounded-2xl border border-purple-100/70 space-y-1">
              <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">SKILLS MAPPED</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-[#8C3F96]">{passport ? passport.skills.length : 0}</span>
                <span className="text-xs text-gray-500 font-semibold">competencies mapped</span>
              </div>
            </div>

            <div className="p-4 bg-purple-50/40 rounded-2xl border border-purple-100/70 space-y-1">
              <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">EVIDENCE SUBMITTED</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-[#9E4733]">{passport ? passport.evidence.length : 0}</span>
                <span className="text-xs text-gray-500 font-semibold">evidence submissions</span>
              </div>
            </div>
          </div>
        </div>

        {/* 6. Bottom Share Callout Banner matching Figma Screenshot 3 */}
        <div className="bg-[#FAF4F7] border border-[#F5E1EC] rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xs">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-base sm:text-lg font-black text-[#2D1B4E]">Ready to share your progress?</h3>
            <p className="text-xs text-gray-600 font-medium max-w-xl leading-relaxed">
              Your Career Passport brings together your field experience, tested competencies, and demonstrated abilities in an employer-ready format.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleCopyShareLink}
              className="px-4 py-2.5 rounded-xl border border-purple-200 text-xs font-bold text-[#2D1B4E] bg-white hover:bg-purple-50 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Share2 size={14} className="text-[#8C3F96]" />
              <span>Share Passport</span>
            </button>

            <button
              onClick={() => setShowShareModal(true)}
              className="px-5 py-2.5 rounded-xl bg-[#2D1B4E] hover:bg-[#431F69] text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Download size={14} />
              <span>Share Passport Link</span>
            </button>
          </div>
        </div>
        </>
        )}

      </div>

      {/* MODAL 1: Share Passport Modal */}
      <AnimatePresence>
        {showShareModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50"
            onClick={() => setShowShareModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-purple-100 text-center space-y-5"
            >
              <div className="w-14 h-14 bg-purple-100 text-[#8C3F96] rounded-2xl flex items-center justify-center mx-auto shadow-md">
                <Share2 size={28} />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-extrabold text-[#2D1B4E]">Share Career Passport</h3>
                <p className="text-xs text-gray-500">
                  Provide recruiters and hiring managers with instant access to your verified competencies.
                </p>
              </div>

              <div className="bg-purple-50/70 p-3 rounded-2xl border border-purple-100 flex items-center justify-between text-xs text-[#2D1B4E] font-semibold">
                <span className="truncate max-w-[240px] text-gray-600">
                  {passport ? (passport.isPublic ? publicPassportUrl : 'A public link will be created when you copy it') : 'Generate your Career Passport first'}
                </span>
                <button
                  onClick={handleCopyShareLink}
                  disabled={isSharing}
                  className="bg-[#2D1B4E] text-white text-xs font-bold px-3 py-1.5 rounded-xl hover:bg-[#431F69] transition-colors flex items-center gap-1 shrink-0 disabled:opacity-60"
                >
                  {copiedLink ? <Check size={13} /> : <Copy size={13} />}
                  <span>{isSharing ? 'Copying...' : copiedLink ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <button 
                  onClick={() => {
                    window.open('https://www.linkedin.com', '_blank');
                    setShowShareModal(false);
                  }}
                  className="py-2.5 rounded-xl border border-purple-200 text-xs font-bold text-[#8C3F96] hover:bg-purple-50 flex items-center justify-center gap-1.5"
                >
                  <ExternalLink size={14} />
                  <span>Share to LinkedIn</span>
                </button>
                <button 
                  onClick={() => setShowShareModal(false)}
                  className="py-2.5 rounded-xl bg-gray-100 text-xs font-bold text-gray-700 hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL 2: Download PDF Modal */}
      <AnimatePresence>
        {showDownloadModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50"
            onClick={() => setShowDownloadModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-purple-100 text-center space-y-5"
            >
              <div className="w-14 h-14 bg-gradient-to-tr from-[#9E4733] to-[#F05A7E] text-white rounded-2xl flex items-center justify-center mx-auto shadow-md">
                <Download size={28} />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-extrabold text-[#2D1B4E]">Download Career Passport PDF</h3>
                <p className="text-xs text-gray-500">
                  PDF export is not available yet. Your public share link gives recruiters a live, verified version of your skills and evidence.
                </p>
              </div>

              <button
                onClick={() => {
                  setShowDownloadModal(false);
                  setShowShareModal(true);
                }}
                className="w-full bg-[#2D1B4E] hover:bg-[#431F69] text-white py-3 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Share2 size={15} />
                <span>Share Passport Link Instead</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL 3: Edit Profile Modal */}
      <AnimatePresence>
        {showEditProfileModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50"
            onClick={() => setShowEditProfileModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-purple-100 text-left space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h3 className="text-lg font-extrabold text-[#2D1B4E]">Edit Passport Profile</h3>
                <button onClick={() => setShowEditProfileModal(false)} className="text-gray-400 hover:text-gray-700">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-[#2D1B4E] block">Full Name</label>
                  <input 
                    type="text" 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-purple-50/40 border border-purple-100 rounded-xl p-3 text-xs font-semibold text-[#2D1B4E] focus:outline-none focus:ring-2 focus:ring-[#8C3F96]"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full bg-[#2D1B4E] hover:bg-[#431F69] text-white py-3 rounded-xl font-bold text-xs shadow-md transition-all"
                >
                  Save Changes
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default CareerPassport;
