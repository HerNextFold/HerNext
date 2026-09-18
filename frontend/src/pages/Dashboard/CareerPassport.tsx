import React, { useState } from 'react';
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
  Star, 
  ExternalLink,
  Plus
} from 'lucide-react';
import PurpleBackgroundDots from '../../components/dashboard/PurpleBackgroundDots';
import { useUserContext } from '../../context/UserContext';

export const CareerPassport: React.FC = () => {
  const navigate = useNavigate();
  const { user, onboarding, updateUser } = useUserContext();

  const [showShareModal, setShowShareModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Editable Profile fields
  const [editName, setEditName] = useState(user.fullName);
  const [editTargetRole, setEditTargetRole] = useState(onboarding.targetRole || 'Fintech Operations Associate');
  const [editSummary, setEditSummary] = useState(
    'Customer-focused professional with direct enterprise experience in financial transactions, rigorous cash and record management, multi-channel customer resolution, and proactive systems problem solving.'
  );

  const userInitials = user.fullName
    ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'AA';

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    showToast('📋 Passport verification link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleDownloadPDF = () => {
    showToast('📥 Downloading verified HerNext Career Passport (PDF)...');
    setTimeout(() => {
      setShowDownloadModal(false);
      showToast('✅ Download Complete: HerNext_Career_Passport.pdf');
    }, 1500);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({ fullName: editName });
    setShowEditProfileModal(false);
    showToast('✨ Career Passport profile updated successfully!');
  };

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
              {user.fullName} <span className="font-medium text-gray-400">({onboarding.targetRole || 'AI Product Design Track'})</span>
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
                    {(user?.fullName || 'User').toUpperCase()}
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
                <span>{onboarding.currentRole || 'Fintech Operations Candidate'}</span>
                <span>•</span>
                <span>Lagos, Nigeria</span>
              </div>

              <div className="inline-block bg-purple-50/70 border border-purple-100/80 text-[11px] font-bold text-[#8C3F96] px-3 py-1 rounded-xl">
                Target: {editTargetRole}
              </div>

              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-medium pt-1 max-w-3xl">
                {editSummary}
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
                  Career Ready
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
                      strokeDasharray="78, 100"
                      strokeWidth="4"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-lg font-black text-[#2D1B4E] leading-none">78%</span>
                    <span className="text-[8px] font-extrabold text-gray-400 uppercase tracking-tighter mt-0.5">OVERALL</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-[#2D1B4E]">Benchmark Readiness</h4>
                  <p className="text-[11px] text-gray-500 leading-tight">
                    Your evaluation exceeds the standard threshold of 75% for junior-to-mid operations positions across regional fintech sectors.
                  </p>
                </div>
              </div>

              {/* Progress Bars */}
              <div className="space-y-3 pt-1">
                {[
                  { title: 'Experience Foundation', pct: 90 },
                  { title: 'Skills Alignment', pct: 72 },
                  { title: 'AI Operational Readiness', pct: 70 },
                  { title: 'Demonstrated Evidence', pct: 60 }
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
                <strong className="text-[#2D1B4E] font-bold">Strategic Opportunity:</strong> Completing 1 additional evidence module will boost your profile into the top 10% candidate tier.
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
                10 Competencies Mapped
              </span>
            </div>

            {/* Section 1: Transferable Skills */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">
                <span>TRANSFERABLE SKILLS (FIELD-VALIDATED)</span>
                <span className="text-[#8C3F96]">6 Mastered</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {[
                  'Financial Operations',
                  'Customer Service',
                  'Transaction Processing',
                  'Record Keeping',
                  'Cash Management',
                  'Problem Solving'
                ].map((sk, idx) => (
                  <span 
                    key={idx} 
                    className="bg-purple-50/60 text-[#2D1B4E] text-xs font-semibold px-3 py-1.5 rounded-xl border border-purple-100 flex items-center gap-1.5"
                  >
                    <CheckCircle2 size={13} className="text-[#8C3F96]" />
                    {sk}
                  </span>
                ))}
              </div>
            </div>

            {/* Section 2: HerNext Developed Skills */}
            <div className="space-y-2.5 pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between text-[10px] font-extrabold text-[#9E4733] uppercase tracking-wider">
                <span>HERNEXT DEVELOPED & MODERNIZED SKILLS</span>
                <span className="text-[#9E4733]">4 High-Impact</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {[
                  'AI Product Thinking',
                  'Data Analysis',
                  'UX Analysis',
                  'Financial Reconciliation'
                ].map((sk, idx) => (
                  <span 
                    key={idx} 
                    className="bg-rose-50/70 text-[#9E4733] text-xs font-bold px-3.5 py-1.5 rounded-xl border border-rose-200/80 flex items-center gap-1.5"
                  >
                    <Sparkles size={13} className="text-[#F05A7E]" />
                    {sk}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-purple-100/60 flex items-center justify-between text-xs text-gray-500 font-medium">
              <span>Matched against 42 Fintech job descriptors</span>
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

            {/* Experience Item */}
            <div className="p-5 rounded-2xl bg-purple-50/30 border border-purple-100/70 space-y-3 relative group">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-sm font-black text-[#2D1B4E]">POS Business Operator</h4>
                  <span className="text-[11px] text-gray-500 font-medium block">Independent Financial Terminal Operations · 4 years tenure</span>
                </div>
                <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-200 shrink-0">
                  Verified
                </span>
              </div>

              <p className="text-xs text-gray-600 leading-relaxed font-medium">
                Administered retail agency banking operations handling heavy daily transaction volume, merchant dispute escalations, and strict ledger auditing.
              </p>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {['Customer transactions', 'Cash management', 'Financial records', 'Customer support'].map((tag, idx) => (
                  <span key={idx} className="bg-white text-gray-600 text-[10px] font-semibold px-2 py-0.5 rounded-md border border-purple-100">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="pt-2 border-t border-purple-100/60 flex items-center justify-between text-[11px] font-bold text-[#8C3F96]">
                <span>10,000+ Transactions</span>
                <span className="hover:underline cursor-pointer">View audit breakdown →</span>
              </div>
            </div>

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
              {/* Evidence Item 1 */}
              <div className="p-5 rounded-2xl bg-[#FAF4F7] border border-[#F5E1EC] space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-[#2D1B4E]">AI UX Evaluation</h4>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 size={11} /> Completed
                  </span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed font-medium">
                  Evaluated consumer payment failure paths across 3 digital wallets and articulated UX optimization protocols.
                </p>
                <div className="flex flex-wrap gap-1.5 text-[10px] font-bold text-[#8C3F96]">
                  <span>Skills demonstrated:</span>
                  <span className="bg-white px-2 py-0.5 rounded border border-purple-100">AI Product Thinking</span>
                  <span className="bg-white px-2 py-0.5 rounded border border-purple-100">Problem Identification</span>
                  <span className="bg-white px-2 py-0.5 rounded border border-purple-100">UX Analysis</span>
                </div>
              </div>

              {/* Evidence Item 2 */}
              <div className="p-5 rounded-2xl bg-purple-50/30 border border-purple-100/70 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-[#2D1B4E]">Financial Reconciliation Challenge</h4>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 size={11} /> Passed
                  </span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed font-medium">
                  Identified $12,400 in discrepant batch transfers under timed conditions with 99.4% precision.
                </p>
                <div className="flex flex-wrap gap-1.5 text-[10px] font-bold text-[#8C3F96]">
                  <span>Skills demonstrated:</span>
                  <span className="bg-white px-2 py-0.5 rounded border border-purple-100">Financial Analysis</span>
                  <span className="bg-white px-2 py-0.5 rounded border border-purple-100">Reconciliation</span>
                  <span className="bg-white px-2 py-0.5 rounded border border-purple-100">Problem Solving</span>
                </div>
              </div>
            </div>

            {/* Credential Badges Acquired section matching Figma Screenshot 2 */}
            <div className="pt-3 border-t border-purple-100/60 space-y-3">
              <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">
                CREDENTIAL BADGES ACQUIRED
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-purple-50/50 rounded-2xl border border-purple-100 text-center space-y-1">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-[#8C3F96] flex items-center justify-center mx-auto">
                    <Star size={16} />
                  </div>
                  <span className="font-bold text-xs text-[#2D1B4E] block">Career Explorer</span>
                  <span className="text-[9px] text-gray-400 block font-medium">Milestone 1</span>
                </div>

                <div className="p-3 bg-purple-50/50 rounded-2xl border border-purple-100 text-center space-y-1">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-[#8C3F96] flex items-center justify-center mx-auto">
                    <Sparkles size={16} />
                  </div>
                  <span className="font-bold text-xs text-[#2D1B4E] block">Skill Discoverer</span>
                  <span className="text-[9px] text-gray-400 block font-medium">Milestone 2</span>
                </div>

                <div className="p-3 bg-purple-50/50 rounded-2xl border border-purple-100 text-center space-y-1">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-[#8C3F96] flex items-center justify-center mx-auto">
                    <ShieldCheck size={16} />
                  </div>
                  <span className="font-bold text-xs text-[#2D1B4E] block">Proof Builder</span>
                  <span className="text-[9px] text-gray-400 block font-medium">Milestone 3</span>
                </div>

                <div className="p-3 bg-gradient-to-tr from-[#9E4733] to-[#F05A7E] text-white rounded-2xl shadow-md text-center space-y-1">
                  <div className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center mx-auto">
                    <Award size={16} />
                  </div>
                  <span className="font-bold text-xs block">Career Ready</span>
                  <span className="text-[9px] text-pink-100 block font-medium">Current State</span>
                </div>
              </div>
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
              Transition Stage: Final Polish
            </span>
          </div>

          {/* Stepper Node Line */}
          <div className="relative py-4">
            <div className="absolute top-1/2 left-4 right-4 h-1 bg-purple-100 -translate-y-1/2 z-0" />
            <div className="absolute top-1/2 left-4 w-4/5 h-1 bg-gradient-to-r from-[#2D1B4E] via-[#8C3F96] to-[#9E4733] -translate-y-1/2 z-0" />

            <div className="grid grid-cols-6 relative z-10 text-center">
              {[
                { title: 'Experience', sub: 'Baseline logged', status: 'done' },
                { title: 'Skills', sub: 'Taxonomy audit', status: 'done' },
                { title: 'Learning', sub: 'Modules taken', status: 'done' },
                { title: 'Practice', sub: 'Simulations', status: 'done' },
                { title: 'Evidence', sub: 'Challenges passed', status: 'done' },
                { title: 'Career Ready', sub: 'Active Target', status: 'active' }
              ].map((step, idx) => (
                <div key={idx} className="flex flex-col items-center space-y-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ring-4 ring-white ${
                    step.status === 'active'
                      ? 'bg-[#9E4733] text-white ring-[#9E4733]/20 shadow-md scale-110'
                      : 'bg-[#2D1B4E] text-white'
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
                <span className="text-2xl font-black text-[#2D1B4E]">64%</span>
                <span className="text-xs text-gray-500 font-semibold">towards tier-1 candidate</span>
              </div>
            </div>

            <div className="p-4 bg-purple-50/40 rounded-2xl border border-purple-100/70 space-y-1">
              <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">SKILLS DEVELOPED</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-[#8C3F96]">6 / 9</span>
                <span className="text-xs text-gray-500 font-semibold">fintech focus skills</span>
              </div>
            </div>

            <div className="p-4 bg-purple-50/40 rounded-2xl border border-purple-100/70 space-y-1">
              <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">EVIDENCE COMPLETED</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-[#9E4733]">3 / 5</span>
                <span className="text-xs text-gray-500 font-semibold">validated submissions</span>
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
              onClick={handleDownloadPDF}
              className="px-5 py-2.5 rounded-xl bg-[#2D1B4E] hover:bg-[#431F69] text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Download size={14} />
              <span>Download Career Passport</span>
            </button>
          </div>
        </div>

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
                <span className="truncate max-w-[240px] text-gray-600">{window.location.href}</span>
                <button
                  onClick={handleCopyShareLink}
                  className="bg-[#2D1B4E] text-white text-xs font-bold px-3 py-1.5 rounded-xl hover:bg-[#431F69] transition-colors flex items-center gap-1 shrink-0"
                >
                  {copiedLink ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copiedLink ? 'Copied' : 'Copy'}</span>
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
                  Generate a official tamper-proof PDF report containing your verified evidence and skills matrix.
                </p>
              </div>

              <div className="bg-purple-50/70 p-4 rounded-2xl border border-purple-100 text-left text-xs space-y-2 text-[#2D1B4E] font-medium">
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle2 size={15} className="text-[#9E4733]" /> Includes verified project evidence
                </div>
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle2 size={15} className="text-[#9E4733]" /> Includes verified benchmark readiness (78%)
                </div>
              </div>

              <button
                onClick={handleDownloadPDF}
                className="w-full bg-[#2D1B4E] hover:bg-[#431F69] text-white py-3 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Download size={15} />
                <span>Confirm & Download PDF</span>
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

                <div className="space-y-1">
                  <label className="font-bold text-[#2D1B4E] block">Target Role</label>
                  <input 
                    type="text" 
                    value={editTargetRole}
                    onChange={(e) => setEditTargetRole(e.target.value)}
                    className="w-full bg-purple-50/40 border border-purple-100 rounded-xl p-3 text-xs font-semibold text-[#2D1B4E] focus:outline-none focus:ring-2 focus:ring-[#8C3F96]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#2D1B4E] block">Professional Summary</label>
                  <textarea 
                    rows={4}
                    value={editSummary}
                    onChange={(e) => setEditSummary(e.target.value)}
                    className="w-full bg-purple-50/40 border border-purple-100 rounded-xl p-3 text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#8C3F96] leading-relaxed"
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
