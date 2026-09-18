import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  ArrowRight, 
  ArrowLeft,
  Info, 
  Check, 
  CheckCircle2,
  Sparkles,
  Plus
} from 'lucide-react';
import { useUserContext } from '../../context/UserContext';

const SUGGESTED_ROLES = [
  { 
    id: 'data-analyst', 
    title: 'Data Analyst', 
    category: 'Technology', 
    initials: 'DA',
    foundation: 'Excel · Data Fundamentals',
    build: 'SQL · Python · Data Visualization'
  },
  { 
    id: 'frontend-dev', 
    title: 'Frontend Developer', 
    category: 'Engineering', 
    initials: 'FD',
    foundation: 'HTML/CSS · Web Architecture',
    build: 'JavaScript · React · Tailwind CSS'
  },
  { 
    id: 'graphics-designer', 
    title: 'Graphics Designer', 
    category: 'Design & Visual Arts', 
    initials: 'GD',
    foundation: 'Design Principles · Visual Composition',
    build: 'Photoshop · Illustrator · Brand Systems'
  },
  { 
    id: 'product-manager', 
    title: 'Product Manager', 
    category: 'Technology & Strategy', 
    initials: 'PM',
    foundation: 'Product Thinking · Market Research',
    build: 'PRD Creation · User Stories · Analytics'
  },
  { 
    id: 'ux-researcher', 
    title: 'UX Researcher', 
    category: 'Design & Product', 
    initials: 'UR',
    foundation: 'User Interviewing · Usability Testing',
    build: 'Persona Mapping · Journey Audits · Heuristics'
  },
  { 
    id: 'mobile-dev', 
    title: 'Mobile App Developer', 
    category: 'Engineering', 
    initials: 'MD',
    foundation: 'Mobile UI Basics · Responsive Layouts',
    build: 'React Native · Flutter · API Integration'
  },
  { 
    id: 'brand-strategist', 
    title: 'Brand Strategist', 
    category: 'Marketing & Strategy', 
    initials: 'BS',
    foundation: 'Market Positioning · Consumer Insights',
    build: 'Brand Identity · Messaging Systems · Campaign Strategy'
  }
];

const CreateCareerPathPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateOnboarding } = useUserContext();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('Data Analyst');
  const [selectedRole, setSelectedRole] = useState(SUGGESTED_ROLES[0]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSelectRole = (role: typeof SUGGESTED_ROLES[0]) => {
    setSelectedRole(role);
    setSearchQuery(role.title);
  };

  const handleNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (currentStep === 3) {
      setIsSubmitting(true);
      setTimeout(() => {
        setIsSubmitting(false);
        setCurrentStep(4);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 1000);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleViewRoadmap = () => {
    // Update user's target role in context so the Roadmap page loads this dynamic path
    updateOnboarding({ targetRole: selectedRole.title });
    navigate('/dashboard/roadmap');
  };

  const userInitials = user.fullName
    ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'AA';

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16 font-sans">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-purple-100/60 pb-6">
        <div>
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs text-gray-500 mb-2 font-medium">
            <NavLink to="/dashboard/insights" className="hover:text-[#2D1B4E] transition-colors">
              Dashboard
            </NavLink>
            <span>/</span>
            <NavLink to="/dashboard/path" className="hover:text-[#2D1B4E] transition-colors">
              Career Paths
            </NavLink>
            <span>/</span>
            <NavLink to="/dashboard/career-paths/new" className="hover:text-[#2D1B4E] transition-colors">
              New Career Path
            </NavLink>
            {currentStep === 2 && (
              <>
                <span>/</span>
                <span className="text-[#8C3F96] font-semibold">Step 2: Career Analysis</span>
              </>
            )}
            {currentStep === 3 && (
              <>
                <span>/</span>
                <span className="text-[#8C3F96] font-semibold">Step 3: Skill Gap</span>
              </>
            )}
            {currentStep === 4 && (
              <>
                <span>/</span>
                <span className="text-[#8C3F96] font-semibold">Step 4: New Roadmap</span>
              </>
            )}
          </nav>
        </div>

        {/* User & Active Path Badge Header */}
        <div className="flex items-center gap-3 bg-white p-2.5 px-4 rounded-2xl shadow-xs border border-purple-100/80">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active Path: Product Designer
          </span>
          <div className="flex items-center gap-2.5 pl-2 border-l border-gray-200">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#9E4733] to-[#8C3F96] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {userInitials}
            </div>
          </div>
        </div>
      </div>

      {/* Subheader Flow Preview Pills Bar */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-3.5 px-6 border border-purple-100/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-bold text-[#2D1B4E]">
          <Sparkles size={16} className="text-[#8C3F96]" /> Interactive Flow Preview
        </div>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
            currentStep === 1 ? 'bg-[#2D1B4E] text-white shadow-xs' : 'bg-purple-50 text-[#8C3F96]'
          }`}>
            Step 1: Goal
          </span>
          <span className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
            currentStep === 2 ? 'bg-[#2D1B4E] text-white shadow-xs' : currentStep > 2 ? 'bg-purple-50 text-[#8C3F96]' : 'bg-gray-100 text-gray-500'
          }`}>
            Step 2: Analysis
          </span>
          <span className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
            currentStep === 3 ? 'bg-[#2D1B4E] text-white shadow-xs' : currentStep > 3 ? 'bg-purple-50 text-[#8C3F96]' : 'bg-gray-100 text-gray-500'
          }`}>
            Step 3: Skill Gap
          </span>
          <span className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
            currentStep === 4 ? 'bg-[#2D1B4E] text-white shadow-xs' : 'bg-gray-100 text-gray-500'
          }`}>
            Step 4: Roadmap
          </span>
        </div>
      </div>

      {/* Main Title Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] uppercase font-extrabold tracking-wider text-[#9E4733] block mb-1">
            STEP {currentStep} OF 4
          </span>
          <h1 className="text-2xl md:text-3xl font-black text-[#2D1B4E] flex items-center gap-2.5">
            {currentStep === 4 && (
              <span className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                <Check size={16} />
              </span>
            )}
            {currentStep === 1 && "Create a New Career Path"}
            {currentStep === 2 && "Let's understand your career goal"}
            {currentStep === 3 && "Your Skill Gap"}
            {currentStep === 4 && "Your new career roadmap is ready"}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            {currentStep === 1 && "Explore another career direction and build a personalized roadmap for it."}
            {currentStep === 2 && "HerNext is comparing your new career goal with your existing experience, skills, and interests."}
            {currentStep === 3 && "See what you already bring to this career and what you need to develop next."}
            {currentStep === 4 && "HerNext has created a personalized path for your new career goal."}
          </p>
        </div>

        <span className="bg-purple-100 text-[#8C3F96] text-xs font-bold px-3.5 py-1.5 rounded-full border border-purple-200 self-start md:self-auto">
          Step {currentStep} of 4
        </span>
      </div>

      {/* Warning / Safety Alert Banner */}
      <div className="bg-[#FFF5F2] border border-orange-200 rounded-3xl p-4 md:p-5 flex items-start gap-3.5 shadow-xs">
        <div className="w-8 h-8 rounded-2xl bg-[#9E4733]/15 text-[#9E4733] flex items-center justify-center shrink-0 mt-0.5">
          <Info size={18} />
        </div>
        <p className="text-xs text-[#7A2E1D] leading-relaxed font-medium">
          {currentStep === 4 ? (
            <>
              <strong>Your existing career path is still saved.</strong> Creating this new path did not replace or change your current Product Designer roadmap. Both paths are active in your dashboard.
            </>
          ) : (
            <>
              <strong>Your current career path is safe.</strong> Your existing Product Designer roadmap will remain fully active and available in your dashboard. This new path is created separately as an additional path.
            </>
          )}
        </p>
      </div>

      {/* Horizontal Stepper Track matching Figma */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-purple-100/80">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative">
          <div className="hidden md:block absolute top-5 left-12 right-12 h-0.5 bg-gray-200 -z-0" />

          {/* Step 1 */}
          <div className="flex items-center gap-3 relative z-10">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shadow-md transition-all ${
              currentStep > 1 
                ? 'bg-emerald-500 text-white' 
                : 'bg-[#2D1B4E] text-white ring-4 ring-purple-100'
            }`}>
              {currentStep > 1 ? <Check size={16} /> : '1'}
            </div>
            <div>
              <p className="text-xs font-bold text-[#2D1B4E]">1. Career Goal</p>
              <p className="text-[10px] font-semibold text-emerald-600">Completed</p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-center gap-3 relative z-10">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shadow-sm transition-all ${
              currentStep > 2 
                ? 'bg-emerald-500 text-white' 
                : currentStep === 2 
                ? 'bg-[#2D1B4E] text-white ring-4 ring-purple-100' 
                : 'bg-white border-2 border-gray-300 text-gray-400'
            }`}>
              {currentStep > 2 ? <Check size={16} /> : '2'}
            </div>
            <div>
              <p className="text-xs font-bold text-gray-700">2. Career Analysis</p>
              <p className={`text-[10px] font-medium ${currentStep > 2 ? 'text-emerald-600 font-semibold' : currentStep === 2 ? 'text-[#8C3F96] font-semibold' : 'text-gray-400'}`}>
                {currentStep > 2 ? 'Completed' : currentStep === 2 ? 'In Progress' : 'Upcoming'}
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-center gap-3 relative z-10">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shadow-sm transition-all ${
              currentStep > 3 
                ? 'bg-emerald-500 text-white' 
                : currentStep === 3 
                ? 'bg-[#2D1B4E] text-white ring-4 ring-purple-100' 
                : 'bg-white border-2 border-gray-300 text-gray-400'
            }`}>
              {currentStep > 3 ? <Check size={16} /> : '3'}
            </div>
            <div>
              <p className="text-xs font-bold text-gray-700">3. Skill Gap</p>
              <p className={`text-[10px] font-medium ${currentStep > 3 ? 'text-emerald-600 font-semibold' : currentStep === 3 ? 'text-[#8C3F96] font-semibold' : 'text-gray-400'}`}>
                {currentStep > 3 ? 'Completed' : currentStep === 3 ? 'In Progress' : 'Upcoming'}
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex items-center gap-3 relative z-10">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shadow-sm transition-all ${
              currentStep === 4 
                ? 'bg-[#2D1B4E] text-white ring-4 ring-purple-100' 
                : 'bg-white border-2 border-gray-300 text-gray-400'
            }`}>
              4
            </div>
            <div>
              <p className="text-xs font-bold text-gray-700">4. New Roadmap</p>
              <p className={`text-[10px] font-medium ${currentStep === 4 ? 'text-[#8C3F96] font-semibold' : 'text-gray-400'}`}>
                {currentStep === 4 ? 'Final' : 'Upcoming'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* STEP 1 FORM CARD */}
      {currentStep === 1 && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-purple-100/80 space-y-6"
        >
          <div>
            <h2 className="text-lg md:text-xl font-bold text-[#2D1B4E]">What career would you like to explore?</h2>
            <p className="text-xs text-gray-500 mt-1">
              Enter the role you're interested in and we'll help you understand what it takes to get there.
            </p>
          </div>

          {/* Input Box */}
          <div>
            <label className="block text-[10px] uppercase font-extrabold tracking-wider text-gray-500 mb-2">
              SEARCH OR ENTER A CAREER ROLE
            </label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  const match = SUGGESTED_ROLES.find(r => r.title.toLowerCase().includes(e.target.value.toLowerCase()));
                  if (match) setSelectedRole(match);
                  else setSelectedRole({ 
                    id: 'custom', 
                    title: e.target.value, 
                    category: 'General', 
                    initials: e.target.value.substring(0,2).toUpperCase() || 'CR',
                    foundation: `${e.target.value} Fundamentals & Core Practices`,
                    build: 'Tools · Technical Skills · Industry Applications'
                  });
                }}
                placeholder="Search or enter a career role (e.g. Graphics Designer, Frontend Dev...)"
                className="w-full pl-11 pr-4 py-3.5 bg-[#FAF8FC] border border-gray-200 rounded-2xl text-xs font-bold text-[#2D1B4E] focus:outline-none focus:border-[#8C3F96] focus:bg-white transition-all shadow-xs"
              />
            </div>
          </div>

          {/* Suggested Roles Tags */}
          <div>
            <p className="text-[11px] font-medium text-gray-500 mb-3">
              Suggested career paths based on your experience:
            </p>
            <div className="flex flex-wrap gap-2.5">
              {SUGGESTED_ROLES.map((role) => {
                const isSelected = selectedRole.title.toLowerCase() === role.title.toLowerCase();
                return (
                  <button
                    key={role.id}
                    onClick={() => handleSelectRole(role)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected 
                        ? 'bg-[#8C3F96] text-white shadow-md scale-102 ring-2 ring-purple-300' 
                        : 'bg-purple-50 hover:bg-purple-100 text-[#2D1B4E]'
                    }`}
                  >
                    <span>+</span>
                    <span>{role.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Career Goal Sub-Card */}
          <AnimatePresence mode="wait">
            {selectedRole && selectedRole.title && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="bg-[#FAF8FC] rounded-2xl p-5 border border-purple-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#2D1B4E] to-[#8C3F96] text-white font-black text-sm flex items-center justify-center shadow-md shrink-0">
                    {selectedRole.initials || 'CR'}
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#9E4733] block mb-0.5">
                      YOUR NEW CAREER GOAL
                    </span>
                    <h4 className="text-base font-bold text-[#2D1B4E]">{selectedRole.title}</h4>
                    <p className="text-xs text-gray-500">{selectedRole.category}</p>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedRole({ 
                      id: 'custom', 
                      title: '', 
                      category: '', 
                      initials: '',
                      foundation: '',
                      build: ''
                    });
                  }}
                  className="text-xs font-bold text-[#8C3F96] hover:text-[#73317c] bg-white hover:bg-purple-50 px-4 py-2 rounded-xl border border-purple-100 transition-colors cursor-pointer self-start sm:self-auto"
                >
                  Change role
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom Form Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-100">
            <button 
              onClick={() => navigate('/dashboard/path')}
              className="px-5 py-3 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button 
              onClick={handleNextStep}
              disabled={!selectedRole.title}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#2D1B4E] hover:bg-[#431F69] disabled:opacity-50 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
            >
              <span>Continue</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </motion.div>
      )}

      {/* STEP 2 FORM CARD: CAREER ANALYSIS */}
      {currentStep === 2 && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-purple-100/80 space-y-7"
        >
          {/* Selected Role Card */}
          <div className="bg-[#FAF8FC] rounded-2xl p-5 border border-purple-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#2D1B4E] to-[#8C3F96] text-white font-black text-sm flex items-center justify-center shadow-md shrink-0">
                {selectedRole.initials || 'DA'}
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#9E4733] block mb-0.5">
                  YOUR NEW CAREER GOAL
                </span>
                <h4 className="text-base font-bold text-[#2D1B4E]">{selectedRole.title || 'Data Analyst'}</h4>
                <p className="text-xs text-gray-500">{selectedRole.category || 'Technology'}</p>
              </div>
            </div>

            <button 
              onClick={() => setCurrentStep(1)}
              className="text-xs font-bold text-[#8C3F96] hover:text-[#73317c] bg-white hover:bg-purple-50 px-4 py-2 rounded-xl border border-purple-100 transition-colors cursor-pointer self-start sm:self-auto flex items-center gap-1"
            >
              <ArrowLeft size={13} />
              <span>Change role</span>
            </button>
          </div>

          {/* What We're Looking At Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#9E4733]" />
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#2D1B4E]">
                WHAT WE'RE LOOKING AT
              </h3>
            </div>

            <div className="space-y-3">
              {/* Item 1 */}
              <div className="p-4 rounded-2xl bg-[#FAF8FC] border border-purple-100/60 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#2D1B4E]">Your experience</h4>
                    <p className="text-[11px] text-gray-500 font-medium">Your previous work responsibilities</p>
                  </div>
                </div>
                <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-3 py-1 rounded-full border border-emerald-200">
                  Evaluated
                </span>
              </div>

              {/* Item 2 */}
              <div className="p-4 rounded-2xl bg-[#FAF8FC] border border-purple-100/60 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#2D1B4E]">Your existing skills</h4>
                    <p className="text-[11px] text-gray-500 font-medium">Skills you've already developed</p>
                  </div>
                </div>
                <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-3 py-1 rounded-full border border-emerald-200">
                  Mapped
                </span>
              </div>

              {/* Item 3 */}
              <div className="p-4 rounded-2xl bg-[#FAF8FC] border border-purple-100/60 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#2D1B4E]">Your career interests</h4>
                    <p className="text-[11px] text-gray-500 font-medium">The areas you want to grow in</p>
                  </div>
                </div>
                <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-3 py-1 rounded-full border border-emerald-200">
                  Aligned
                </span>
              </div>
            </div>
          </div>

          {/* Analysis Progress Box */}
          <div className="bg-[#FAF8FC] rounded-2xl p-5 border border-purple-100 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-[#2D1B4E] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Career Analysis Complete
              </h4>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-3 py-0.5 rounded-full">
                100% Ready
              </span>
            </div>

            <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 via-[#8C3F96] to-[#9E4733] h-full rounded-full w-full" />
            </div>

            <p className="text-xs text-gray-600 font-medium">
              We've identified the skills you already have and the areas you'll need to develop.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <span className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold px-3 py-1 rounded-xl flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Existing strengths: 4 identified
              </span>
              <span className="bg-rose-50 border border-rose-200 text-[#9E4733] text-[11px] font-bold px-3 py-1 rounded-xl flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#9E4733]" />
                Development areas: 4 identified
              </span>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-100">
            <button 
              onClick={handlePrevStep}
              className="inline-flex items-center gap-1.5 px-5 py-3 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Back</span>
            </button>

            <button 
              onClick={handleNextStep}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#2D1B4E] hover:bg-[#431F69] text-white text-xs font-bold shadow-md transition-all cursor-pointer"
            >
              <span>Continue</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </motion.div>
      )}

      {/* STEP 3 FORM CARD: SKILL GAP BREAKDOWN */}
      {currentStep === 3 && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-purple-100/80 space-y-7"
        >
          {/* Selected Role Card */}
          <div className="bg-[#FAF8FC] rounded-2xl p-5 border border-purple-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#2D1B4E] to-[#8C3F96] text-white font-black text-sm flex items-center justify-center shadow-md shrink-0">
                {selectedRole.initials || 'DA'}
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#9E4733] block mb-0.5">
                  YOUR NEW CAREER GOAL
                </span>
                <h4 className="text-base font-bold text-[#2D1B4E]">{selectedRole.title || 'Data Analyst'}</h4>
                <p className="text-xs text-gray-500">{selectedRole.category || 'Technology'}</p>
              </div>
            </div>

            <button 
              onClick={() => setCurrentStep(1)}
              className="text-xs font-bold text-[#8C3F96] hover:text-[#73317c] bg-white hover:bg-purple-50 px-4 py-2 rounded-xl border border-purple-100 transition-colors cursor-pointer self-start sm:self-auto flex items-center gap-1"
            >
              <ArrowLeft size={13} />
              <span>Change role</span>
            </button>
          </div>

          {/* Section Heading */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#9E4733]" />
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#2D1B4E]">
                SKILL GAP BREAKDOWN
              </h3>
            </div>
            <p className="text-xs text-gray-500 font-medium">
              Comparing your existing capabilities against market requirements for {selectedRole.title || 'Data Analyst'}.
            </p>
          </div>

          {/* 2-Column Skill Comparison Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left Column: YOU ALREADY HAVE (Green) */}
            <div className="bg-[#F6FAF8] border border-emerald-200/80 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
                <div>
                  <h4 className="text-xs font-extrabold text-emerald-950 uppercase tracking-wider">
                    YOU ALREADY HAVE
                  </h4>
                  <p className="text-[11px] text-emerald-700 font-medium">Skills from your existing experience</p>
                </div>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-1 rounded-full">
                  4 Identified
                </span>
              </div>

              <div className="space-y-3">
                <div className="bg-white p-3.5 rounded-xl border border-emerald-100 shadow-2xs flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={12} />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-gray-900">Foundational Analysis</h5>
                    <p className="text-[10px] text-gray-500 font-medium">Advanced · Evaluated from UX Research & Analytics</p>
                  </div>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-emerald-100 shadow-2xs flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={12} />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-gray-900">Spreadsheet & Data Tools</h5>
                    <p className="text-[10px] text-gray-500 font-medium">Proficient · Validated in Prior Roles</p>
                  </div>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-emerald-100 shadow-2xs flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={12} />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-gray-900">Problem Solving</h5>
                    <p className="text-[10px] text-gray-500 font-medium">Core Strength · Transferable Leadership</p>
                  </div>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-emerald-100 shadow-2xs flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={12} />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-gray-900">Research Methodologies</h5>
                    <p className="text-[10px] text-gray-500 font-medium">Core Strength · Qualitative & Quantitative</p>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-emerald-100 text-[11px] font-bold text-emerald-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Strong Foundation Verified</span>
              </div>
            </div>

            {/* Right Column: TO DEVELOP (Orange/Rose) */}
            <div className="bg-[#FFF8F6] border border-orange-200/80 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-orange-100 pb-3">
                <div>
                  <h4 className="text-xs font-extrabold text-[#7A2E1D] uppercase tracking-wider">
                    TO DEVELOP
                  </h4>
                  <p className="text-[11px] text-[#9E4733] font-medium">Skills that will strengthen readiness</p>
                </div>
                <span className="bg-rose-100 text-[#9E4733] text-[10px] font-extrabold px-2.5 py-1 rounded-full">
                  4 Growth Areas
                </span>
              </div>

              <div className="space-y-3">
                <div className="bg-white p-3.5 rounded-xl border border-rose-100 shadow-2xs flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-rose-50 text-[#9E4733] border border-rose-200 flex items-center justify-center shrink-0 mt-0.5">
                    <Plus size={12} />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-gray-900">Core Technical Tools</h5>
                    <p className="text-[10px] text-gray-500 font-medium">Database querying, joins, and aggregates</p>
                  </div>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-rose-100 shadow-2xs flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-rose-50 text-[#9E4733] border border-rose-200 flex items-center justify-center shrink-0 mt-0.5">
                    <Plus size={12} />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-gray-900">Domain Scripting</h5>
                    <p className="text-[10px] text-gray-500 font-medium">Data manipulation, pandas, automation</p>
                  </div>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-rose-100 shadow-2xs flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-rose-50 text-[#9E4733] border border-rose-200 flex items-center justify-center shrink-0 mt-0.5">
                    <Plus size={12} />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-gray-900">Visual System Design</h5>
                    <p className="text-[10px] text-gray-500 font-medium">Dashboards, components & presentation</p>
                  </div>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-rose-100 shadow-2xs flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-rose-50 text-[#9E4733] border border-rose-200 flex items-center justify-center shrink-0 mt-0.5">
                    <Plus size={12} />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-gray-900">Applied Evaluation</h5>
                    <p className="text-[10px] text-gray-500 font-medium">Probability, hypothesis testing & execution</p>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-orange-100 text-[11px] font-bold text-[#9E4733] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#9E4733]" />
                <span>Mapped to Roadmap Milestones</span>
              </div>
            </div>

          </div>

          {/* Callout Banner */}
          <div className="bg-[#FAF4F7] border border-[#F5E1EC] rounded-2xl p-4 flex items-start gap-3 text-xs text-gray-600">
            <div className="w-6 h-6 rounded-lg bg-pink-100 text-[#F05A7E] flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles size={14} />
            </div>
            <p className="text-xs text-gray-700 leading-relaxed font-medium">
              You already have a foundation to build on. HerNext will use these development areas to shape your new career roadmap.
            </p>
          </div>

          {/* Process Roadmap Section */}
          <div className="bg-[#FAF8FC] border border-purple-100/80 rounded-2xl p-5 space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-[#2D1B4E] text-white text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                  NEXT
                </span>
                <h4 className="text-xs font-extrabold text-[#2D1B4E]">What happens next</h4>
              </div>
              <p className="text-xs text-gray-500 font-medium">
                Your personalized roadmap will turn these development areas into:
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white p-3.5 rounded-xl border border-purple-100 text-center space-y-1">
                <span className="text-xs font-bold text-[#2D1B4E] block">1. Learn</span>
                <span className="text-[10px] text-gray-400 block font-medium">Core skills</span>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-purple-100 text-center space-y-1">
                <span className="text-xs font-bold text-[#2D1B4E] block">2. Practice</span>
                <span className="text-[10px] text-gray-400 block font-medium">Workspaces</span>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-purple-100 text-center space-y-1">
                <span className="text-xs font-bold text-[#2D1B4E] block">3. Challenge</span>
                <span className="text-[10px] text-gray-400 block font-medium">Real projects</span>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-purple-100 text-center space-y-1">
                <span className="text-xs font-bold text-[#2D1B4E] block">4. Evidence</span>
                <span className="text-[10px] text-gray-400 block font-medium">Passport ready</span>
              </div>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="space-y-3 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <button 
                onClick={handlePrevStep}
                className="inline-flex items-center gap-1.5 px-5 py-3 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>

              <button 
                onClick={handleNextStep}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-[#2D1B4E] hover:bg-[#431F69] disabled:opacity-50 text-white text-xs font-bold shadow-lg transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Building Roadmap...</span>
                ) : (
                  <>
                    <span>Build My Roadmap</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </div>

            <p className="text-center text-[11px] text-gray-400 font-medium">
              Your existing career path is still safe. Creating this new path will not change your current roadmap.
            </p>
          </div>
        </motion.div>
      )}

      {/* STEP 4 FORM CARD: NEW ROADMAP READY (Matching Figma Screenshots 1 & 2) */}
      {currentStep === 4 && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-purple-100/80 space-y-7"
        >
          {/* Selected Role Card with Path Created Badge */}
          <div className="bg-[#FAF8FC] rounded-2xl p-5 border border-purple-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#2D1B4E] to-[#8C3F96] text-white font-black text-sm flex items-center justify-center shadow-md shrink-0">
                {selectedRole.initials || 'DA'}
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#9E4733] block mb-0.5">
                  YOUR NEW CAREER
                </span>
                <h4 className="text-base font-bold text-[#2D1B4E]">{selectedRole.title || 'Data Analyst'}</h4>
                <p className="text-xs text-gray-500">{selectedRole.category || 'Technology'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-start sm:self-auto">
              <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Path Created · Ready to Start
              </span>
              <span className="text-xs font-bold text-[#8C3F96] bg-purple-50 px-3 py-1 rounded-full border border-purple-100 hidden md:inline-block">
                2 Active Paths Available
              </span>
            </div>
          </div>

          {/* Roadmap Preview Section Header */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#2D1B4E]" />
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#2D1B4E]">
                YOUR ROADMAP PREVIEW
              </h3>
            </div>
            <p className="text-xs text-gray-500 font-medium">
              A clear step-by-step path designed around your verified foundation and identified skill gaps.
            </p>
          </div>

          {/* 4 Roadmap Steps List */}
          <div className="space-y-3.5">
            
            {/* Step 1: Foundation */}
            <div className="p-4.5 rounded-2xl bg-[#F6FAF8] border border-emerald-200/80 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  <Check size={14} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-black text-[#2D1B4E]">1. FOUNDATION</span>
                    <span className="bg-emerald-100 text-emerald-800 text-[9px] font-extrabold px-2 py-0.5 rounded-md">
                      Validated / Ready
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-gray-900">
                    {selectedRole.foundation || 'Excel · Data Fundamentals'}
                  </h4>
                  <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                    Based on your verified UX analytics & research background
                  </p>
                </div>
              </div>
            </div>

            {/* Step 2: Build */}
            <div className="p-4.5 rounded-2xl bg-[#FAF8FC] border border-purple-200/80 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-7 h-7 rounded-full bg-[#2D1B4E] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-black text-[#2D1B4E]">2. BUILD</span>
                    <span className="bg-purple-100 text-[#8C3F96] text-[9px] font-extrabold px-2 py-0.5 rounded-md">
                      Next Up
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-gray-900">
                    {selectedRole.build || 'SQL · Python · Data Visualization'}
                  </h4>
                  <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                    Core technical capabilities for data-informed decision making
                  </p>
                </div>
              </div>
            </div>

            {/* Step 3: Practice */}
            <div className="p-4.5 rounded-2xl bg-white border border-gray-200 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-7 h-7 rounded-full border-2 border-gray-300 text-gray-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-bold text-gray-700">3. PRACTICE</span>
                    <span className="bg-gray-100 text-gray-600 text-[9px] font-extrabold px-2 py-0.5 rounded-md">
                      Upcoming
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-gray-800">
                    Real-world {selectedRole.title || 'Data'} Projects
                  </h4>
                  <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                    Hands-on guided practice with realistic industry datasets
                  </p>
                </div>
              </div>
            </div>

            {/* Step 4: Prove */}
            <div className="p-4.5 rounded-2xl bg-white border border-gray-200 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-7 h-7 rounded-full border-2 border-gray-300 text-gray-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  4
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-bold text-gray-700">4. PROVE</span>
                    <span className="bg-gray-100 text-gray-600 text-[9px] font-extrabold px-2 py-0.5 rounded-md">
                      Milestone
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-gray-800">Career Evidence</h4>
                  <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                    Verified portfolio artifacts codifying skills to your Career Passport
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* Journey Box ("What this roadmap does") */}
          <div className="bg-[#FAF8FC] border border-purple-100/80 rounded-2xl p-5 space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-[#2D1B4E] text-white text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                  JOURNEY
                </span>
                <h4 className="text-xs font-extrabold text-[#2D1B4E]">What this roadmap does</h4>
              </div>
              <p className="text-xs text-gray-500 font-medium">
                Your roadmap turns your skill gaps into a clear learning journey:
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="bg-white p-3.5 rounded-xl border border-purple-100 space-y-1">
                <span className="text-xs font-extrabold text-[#2D1B4E] uppercase block">LEARN</span>
                <span className="text-[10px] text-gray-400 block font-medium">Core skills</span>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-purple-100 space-y-1">
                <span className="text-xs font-extrabold text-[#2D1B4E] uppercase block">PRACTICE</span>
                <span className="text-[10px] text-gray-400 block font-medium">Workspaces</span>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-purple-100 space-y-1">
                <span className="text-xs font-extrabold text-[#2D1B4E] uppercase block">CHALLENGE</span>
                <span className="text-[10px] text-gray-400 block font-medium">Real projects</span>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-purple-100 space-y-1">
                <span className="text-xs font-extrabold text-[#2D1B4E] uppercase block">EVIDENCE</span>
                <span className="text-[10px] text-gray-400 block font-medium">Passport ready</span>
              </div>
            </div>
          </div>

          {/* Both Career Paths active banner matching Figma */}
          <div className="bg-[#FAF4F7] border border-[#F5E1EC] rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-pink-100 text-[#F05A7E] flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 size={15} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#2D1B4E]">Both Career Paths are Active & Saved</h4>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600 mt-0.5 font-medium">
                  <span><strong>Current:</strong> Product Designer <span className="text-gray-400">(In Progress · Saved)</span></span>
                  <span><strong>New:</strong> {selectedRole.title || 'Data Analyst'} <span className="text-emerald-700 font-bold">(New · Ready to start)</span></span>
                </div>
              </div>
            </div>

            <span className="bg-pink-100/70 text-[#8C3F96] text-[10px] font-extrabold px-3 py-1 rounded-full border border-pink-200 shrink-0 self-start sm:self-auto">
              2 Paths Active
            </span>
          </div>

          {/* Footer Action Bar */}
          <div className="space-y-3 pt-4 border-t border-gray-100">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <button 
                onClick={() => navigate('/dashboard/path')}
                className="w-full sm:w-auto px-5 py-3 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Back to Career Paths
              </button>

              <button 
                onClick={handleViewRoadmap}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-[#2D1B4E] hover:bg-[#431F69] text-white text-xs font-bold shadow-lg transition-all cursor-pointer"
              >
                <span>View Career Roadmap</span>
                <ArrowRight size={14} />
              </button>
            </div>

            <p className="text-center text-[11px] text-gray-400 font-medium">
              Your Product Designer roadmap is still saved and active.
            </p>
          </div>
        </motion.div>
      )}

    </div>
  );
};

export default CreateCareerPathPage;
