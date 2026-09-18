import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Briefcase, 
  Building2, 
  GraduationCap, 
  Target, 
  Star, 
  Edit3, 
  RotateCcw,
  CheckCircle2,
  Sparkles,
  Award
} from 'lucide-react';
import { useUserContext } from '../../context/UserContext';
import Button from '../../components/Button';

export default function Profile() {
  const navigate = useNavigate();
  const { user, onboarding, updateUser } = useUserContext();
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(user.fullName);
  const [emailInput, setEmailInput] = useState(user.email);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setNameInput(user.fullName);
    setEmailInput(user.email);
  }, [user.fullName, user.email]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({ fullName: nameInput, email: emailInput });
    setIsEditingName(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Profile Header Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#2D1B4E] via-[#4A2472] to-[#8C3F96] p-6 md:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-purple-400/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10">
          <div className="relative group">
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl overflow-hidden ring-4 ring-white/30 shadow-2xl bg-purple-100">
              <img
                src={user.avatar}
                alt={user.fullName}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-[#F05A7E] p-1.5 rounded-xl ring-2 ring-white text-white shadow-md">
              <Sparkles size={14} />
            </div>
          </div>

          <div className="flex-1 text-center md:text-left space-y-2">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight font-display">
                  {user.fullName}
                </h1>
                <p className="text-sm text-purple-200 font-medium flex items-center justify-center md:justify-start gap-2 mt-1">
                  <Briefcase size={15} />
                  <span>{onboarding.currentRole}</span>
                  <span className="text-purple-300/60">•</span>
                  <Building2 size={15} />
                  <span>{onboarding.industry}</span>
                </p>
              </div>

              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setIsEditingName(!isEditingName)}
                  className="bg-white hover:bg-purple-50 text-[#2D1B4E] font-bold py-2 px-4 text-xs rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer border border-white/50"
                >
                  <Edit3 size={14} className="text-[#8C3F96]" />
                  <span>{isEditingName ? 'Cancel' : 'Edit Personal Info'}</span>
                </button>

                <Button
                  onClick={() => navigate('/onboarding')}
                  variant="primary"
                  className="!bg-[#F05A7E] hover:!bg-[#e0496d] !py-2 !px-4 !text-xs !rounded-xl shadow-lg"
                >
                  <RotateCcw size={14} className="mr-1.5" />
                  Retake Onboarding
                </Button>
              </div>
            </div>

            {/* Quick Badges */}
            <div className="pt-3 flex flex-wrap items-center justify-center md:justify-start gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-purple-100 border border-white/20">
                <Award size={13} className="text-amber-300" />
                {onboarding.yearsOfExperience} Exp
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-purple-100 border border-white/20">
                <Target size={13} className="text-emerald-300" />
                {onboarding.goalType === 'Transition' ? `Transitioning to ${onboarding.targetRole}` : `Growing as ${onboarding.currentRole}`}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-purple-100 border border-white/20">
                <CheckCircle2 size={13} className="text-sky-300" />
                {onboarding.workSituation}
              </span>
            </div>
          </div>
        </div>
      </div>

      {saveSuccess && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-semibold flex items-center gap-2"
        >
          <CheckCircle2 size={16} className="text-emerald-600" />
          Profile updated successfully! All dashboard views have been re-synchronized.
        </motion.div>
      )}

      {/* Editable Form Modal or Inline */}
      {isEditingName && (
        <motion.form 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          onSubmit={handleSaveProfile}
          className="bg-white p-6 rounded-3xl border border-purple-100 shadow-md space-y-4"
        >
          <h3 className="text-base font-bold text-[#2D1B4E] flex items-center gap-2">
            <User size={18} className="text-[#8C3F96]" />
            Edit Profile Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8C3F96]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8C3F96]"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditingName(false)}
              className="!py-2 !px-4 !text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="!bg-[#8C3F96] hover:!bg-[#7a3484] !py-2 !px-5 !text-xs shadow-md"
            >
              Save Changes
            </Button>
          </div>
        </motion.form>
      )}

      {/* Profile Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Personal & Employment Overview */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-sm space-y-5">
            <h3 className="text-sm font-bold text-[#2D1B4E] uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3">
              <User size={16} className="text-[#8C3F96]" />
              Personal Info
            </h3>
            
            <div className="space-y-4 text-xs">
              <div>
                <span className="text-gray-400 block font-medium">Full Name</span>
                <span className="font-bold text-gray-800 text-sm">{user.fullName}</span>
              </div>
              <div>
                <span className="text-gray-400 block font-medium">Email</span>
                <span className="font-bold text-gray-800 text-sm flex items-center gap-1.5 mt-0.5">
                  <Mail size={13} className="text-gray-400" />
                  {user.email}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block font-medium">Education</span>
                <span className="font-bold text-gray-800 text-sm flex items-center gap-1.5 mt-0.5">
                  <GraduationCap size={14} className="text-purple-600" />
                  {onboarding.education}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-sm space-y-5">
            <h3 className="text-sm font-bold text-[#2D1B4E] uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3">
              <Briefcase size={16} className="text-[#8C3F96]" />
              Career Setup
            </h3>
            
            <div className="space-y-4 text-xs">
              <div>
                <span className="text-gray-400 block font-medium">Current Role</span>
                <span className="font-bold text-[#2D1B4E] text-sm">{onboarding.currentRole}</span>
              </div>
              <div>
                <span className="text-gray-400 block font-medium">Industry Domain</span>
                <span className="font-bold text-gray-800 text-sm">{onboarding.industry}</span>
              </div>
              <div>
                <span className="text-gray-400 block font-medium">Experience Level</span>
                <span className="font-bold text-gray-800 text-sm">{onboarding.yearsOfExperience}</span>
              </div>
              <div>
                <span className="text-gray-400 block font-medium">Employment Status</span>
                <span className="font-bold text-gray-800 text-sm">{onboarding.workSituation}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right 2 Columns: Career Trajectory & Verified Skills */}
        <div className="md:col-span-2 space-y-6">
          {/* Target Trajectory Card */}
          <div className="bg-gradient-to-br from-purple-50/80 via-white to-pink-50/50 p-6 rounded-3xl border border-purple-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-purple-100/60 pb-3">
              <h3 className="text-sm font-bold text-[#2D1B4E] uppercase tracking-wider flex items-center gap-2">
                <Target size={18} className="text-[#F05A7E]" />
                Career Trajectory & Goals
              </h3>
              <span className="px-3 py-1 bg-purple-100 text-[#8C3F96] text-[11px] font-bold rounded-full">
                {onboarding.goalType} Goal
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
              <div className="bg-white p-4 rounded-2xl border border-purple-100/80 shadow-2xs">
                <span className="text-gray-400 font-medium block">Target Career Role</span>
                <span className="text-base font-extrabold text-[#2D1B4E] block mt-1">
                  {onboarding.targetRole}
                </span>
                <p className="text-[11px] text-gray-500 mt-1">
                  Tailored insights and roadmap milestones are tuned specifically for this target.
                </p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-purple-100/80 shadow-2xs">
                <span className="text-gray-400 font-medium block">AI Competency Transfer</span>
                <span className="text-base font-extrabold text-[#8C3F96] block mt-1">
                  Ready for AI Integration
                </span>
                <p className="text-[11px] text-gray-500 mt-1">
                  {onboarding.aiAnalysis || 'Strong foundational skill set ready for high-growth deployment.'}
                </p>
              </div>
            </div>
          </div>

          {/* User Skills & Proficiency List */}
          <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-bold text-[#2D1B4E] uppercase tracking-wider flex items-center gap-2">
                <Star size={18} className="text-amber-500" />
                Submitted Skills & Proficiency
              </h3>
              <span className="text-xs font-semibold text-gray-500">
                {onboarding.skills.length} Skills Logged
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {onboarding.skills.map((skill, idx) => (
                <div 
                  key={idx}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-purple-50/50 border border-purple-100/80 hover:border-purple-200 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-[#8C3F96]">
                      <Star size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-800">{skill.name}</h4>
                      <span className="text-[10px] text-gray-500">{skill.category || 'Competency'}</span>
                    </div>
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                    skill.level === 'Expert' ? 'bg-purple-600 text-white' :
                    skill.level === 'Advanced' ? 'bg-[#8C3F96] text-white' :
                    skill.level === 'Intermediate' ? 'bg-purple-100 text-[#8C3F96]' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {skill.level}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
