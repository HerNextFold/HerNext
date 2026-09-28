import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
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
import {
  ApiError,
  getProfile,
  getCareerRecommendations,
  getSkillGaps,
  generateRoadmap,
  type CareerProfile,
  type CareerRecommendation,
  type RoadmapWithPhases,
  type SkillGapItem
} from '../../lib/api';

const PRIORITY_LABELS: Record<string, string> = {
  HIGH: 'High Priority',
  MEDIUM: 'Medium Priority',
  LOW: 'Low Priority'
};

const CreateCareerPathPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUserContext();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [recommendations, setRecommendations] = useState<CareerRecommendation[]>([]);
  const [selectedCareer, setSelectedCareer] = useState<CareerRecommendation | null>(null);
  const [profile, setProfile] = useState<CareerProfile | null>(null);
  const [skillGaps, setSkillGaps] = useState<SkillGapItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [gapsLoading, setGapsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState('');
  const [generatedRoadmap, setGeneratedRoadmap] = useState<RoadmapWithPhases | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      setLoadError('');
      try {
        const [profileData, recsData] = await Promise.all([getProfile(), getCareerRecommendations()]);
        if (cancelled) return;
        setProfile(profileData);
        const recs = recsData.recommendations ?? [];
        setRecommendations(recs);
        if (recs.length > 0) {
          setSelectedCareer(recs[0]);
          setSearchQuery(recs[0].careerName);
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
    if (!selectedCareer) return;
    const career: CareerRecommendation = selectedCareer;
    let cancelled = false;
    async function loadGaps() {
      setGapsLoading(true);
      try {
        const data = await getSkillGaps(career.careerId);
        if (!cancelled) setSkillGaps(data.skills ?? []);
      } catch {
        if (!cancelled) setSkillGaps([]);
      } finally {
        if (!cancelled) setGapsLoading(false);
      }
    }
    void loadGaps();
    return () => { cancelled = true; };
  }, [selectedCareer]);

  const handleSelectCareer = (rec: CareerRecommendation) => {
    setSelectedCareer(rec);
    setSearchQuery(rec.careerName);
  };

  const handleNextStep = async () => {
    if (currentStep < 3) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (currentStep === 3 && selectedCareer) {
      setGenerationError('');
      setIsSubmitting(true);
      try {
        const roadmap = await generateRoadmap({ careerPathId: selectedCareer.careerId });
        setGeneratedRoadmap(roadmap);
        setCurrentStep(4);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (err) {
        setGenerationError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleViewRoadmap = () => {
    navigate('/dashboard/roadmap');
  };

  const filteredRecs = recommendations.filter((rec) =>
    rec.careerName.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );
  const hasSkills = skillGaps.filter((s) => s.status === 'HAS_SKILL');
  const developSkills = skillGaps.filter((s) => s.status === 'NEEDS_DEVELOPMENT');
  const matchingPct = skillGaps.length > 0 ? Math.round((hasSkills.length / skillGaps.length) * 100) : 0;

  const userInitials = user.fullName
    ? user.fullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

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
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Exploring: {selectedCareer?.careerName ?? 'Not set'}
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
            {currentStep === 1 && "Explore another recommended career and build a personalized roadmap for it."}
            {currentStep === 2 && "HerNext compares the career's required skills against your experience and existing skills."}
            {currentStep === 3 && "See what you already bring to this career and what you need to develop next."}
            {currentStep === 4 && "HerNext has generated a personalized path for your new career goal."}
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
          <strong>Building this roadmap replaces your active roadmap.</strong> Your career profile and skills stay the same — only the generated roadmap switches to this new career.
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

      {isLoading ? (
        <div className="bg-white rounded-3xl p-8 text-center border border-purple-100/80 shadow-sm text-xs text-[#8C3F96]">
          Loading recommended careers...
        </div>
      ) : loadError ? (
        <div className="bg-white rounded-3xl p-8 text-center border border-purple-100/80 shadow-sm text-xs text-rose-700">
          {loadError}
        </div>
      ) : recommendations.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center border border-purple-100/80 shadow-sm space-y-3">
          <p className="text-sm font-bold text-[#2D1B4E]">No recommended careers yet</p>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            Complete your profile and run the AI Career Assessment to receive career recommendations.
          </p>
          <button
            onClick={() => navigate('/dashboard/assessment')}
            className="mt-2 px-6 py-3 rounded-xl bg-[#2D1B4E] hover:bg-[#431F69] text-white text-xs font-bold transition-all inline-flex items-center gap-2 cursor-pointer shadow-md"
          >
            <Sparkles size={14} />
            <span>Run the AI Assessment</span>
          </button>
        </div>
      ) : (
      <>
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
              Choose from your recommended careers, then we'll map a roadmap for it.
            </p>
          </div>

          {/* Input Box */}
          <div>
            <label className="block text-[10px] uppercase font-extrabold tracking-wider text-gray-500 mb-2">
              SEARCH YOUR RECOMMENDED CAREERS
            </label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search a recommended role..."
                className="w-full pl-11 pr-4 py-3.5 bg-[#FAF8FC] border border-gray-200 rounded-2xl text-xs font-bold text-[#2D1B4E] focus:outline-none focus:border-[#8C3F96] focus:bg-white transition-all shadow-xs"
              />
            </div>
          </div>

          {/* Recommended Careers Grid */}
          <div>
            <p className="text-[11px] font-medium text-gray-500 mb-3">
              Recommended careers based on your experience:
            </p>
            {filteredRecs.length === 0 ? (
              <p className="text-xs text-gray-400 font-medium">No careers match that search.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {filteredRecs.map((rec) => {
                  const isSelected = selectedCareer?.careerId === rec.careerId;
                  return (
                    <button
                      key={rec.careerId}
                      onClick={() => handleSelectCareer(rec)}
                      className={`text-left p-4 rounded-2xl border transition-all cursor-pointer space-y-1 ${
                        isSelected
                          ? 'bg-purple-50 border-[#8C3F96] shadow-md ring-2 ring-purple-300'
                          : 'bg-white border-purple-100/80 hover:border-purple-200 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-[#2D1B4E]">{rec.careerName}</span>
                        {isSelected && <Check size={14} className="text-[#8C3F96]" />}
                      </div>
                      <span className="bg-[#FAF0E6] text-[#8C3F96] text-[10px] font-bold px-2 py-0.5 rounded-full inline-block">
                        {Math.round(rec.matchScore)}% Match
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selected Career Goal Sub-Card */}
          {selectedCareer && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#FAF8FC] rounded-2xl p-5 border border-purple-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#2D1B4E] to-[#8C3F96] text-white font-black text-sm flex items-center justify-center shadow-md shrink-0">
                  {selectedCareer.careerName.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#9E4733] block mb-0.5">
                    YOUR NEW CAREER GOAL
                  </span>
                  <h4 className="text-base font-bold text-[#2D1B4E]">{selectedCareer.careerName}</h4>
                  <p className="text-xs text-gray-500">{Math.round(selectedCareer.matchScore)}% match with your profile</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedCareer(null)}
                className="text-xs font-bold text-[#8C3F96] hover:text-[#73317c] bg-white hover:bg-purple-50 px-4 py-2 rounded-xl border border-purple-100 transition-colors cursor-pointer self-start sm:self-auto"
              >
                Change role
              </button>
            </motion.div>
          )}

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
              disabled={!selectedCareer}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#2D1B4E] hover:bg-[#431F69] disabled:opacity-50 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
            >
              <span>Continue</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </motion.div>
      )}

      {/* STEP 2 FORM CARD: CAREER ANALYSIS */}
      {currentStep === 2 && selectedCareer && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-purple-100/80 space-y-7"
        >
          {/* Selected Role Card */}
          <div className="bg-[#FAF8FC] rounded-2xl p-5 border border-purple-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#2D1B4E] to-[#8C3F96] text-white font-black text-sm flex items-center justify-center shadow-md shrink-0">
                {selectedCareer.careerName.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#9E4733] block mb-0.5">
                  YOUR NEW CAREER GOAL
                </span>
                <h4 className="text-base font-bold text-[#2D1B4E]">{selectedCareer.careerName}</h4>
                <p className="text-xs text-gray-500">{Math.round(selectedCareer.matchScore)}% match with your profile</p>
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
                    <p className="text-[11px] text-gray-500 font-medium">
                      {profile?.currentOccupation || 'Not set'} {profile ? `· ${profile.yearsOfExperience} yrs` : ''}
                    </p>
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
                    <p className="text-[11px] text-gray-500 font-medium">
                      {profile?.existingSkills.length ?? 0} skills currently mapped on your profile
                    </p>
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
                    <h4 className="text-xs font-bold text-[#2D1B4E]">Skill alignment with {selectedCareer.careerName}</h4>
                    <p className="text-[11px] text-gray-500 font-medium">
                      {skillGaps.length > 0 ? `${hasSkills.length} of ${skillGaps.length} required skills already held` : 'Loading skill requirements...'}
                    </p>
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
                Career Analysis Ready
              </h4>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-3 py-0.5 rounded-full">
                {matchingPct}% Skills Aligned
              </span>
            </div>

            <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 via-[#8C3F96] to-[#9E4733] h-full rounded-full" style={{ width: `${matchingPct}%` }} />
            </div>

            <p className="text-xs text-gray-600 font-medium">
              {gapsLoading
                ? 'Comparing your skills against this career\'s requirements...'
                : skillGaps.length > 0
                ? `You already hold ${hasSkills.length} of the ${skillGaps.length} skills this career requires.`
                : 'No matching skill requirements found.'}
            </p>
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
      {currentStep === 3 && selectedCareer && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-purple-100/80 space-y-7"
        >
          {/* Selected Role Card */}
          <div className="bg-[#FAF8FC] rounded-2xl p-5 border border-purple-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#2D1B4E] to-[#8C3F96] text-white font-black text-sm flex items-center justify-center shadow-md shrink-0">
                {selectedCareer.careerName.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#9E4733] block mb-0.5">
                  YOUR NEW CAREER GOAL
                </span>
                <h4 className="text-base font-bold text-[#2D1B4E]">{selectedCareer.careerName}</h4>
                <p className="text-xs text-gray-500">{Math.round(selectedCareer.matchScore)}% match with your profile</p>
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
              Comparing your existing capabilities against the requirements for {selectedCareer.careerName}.
            </p>
          </div>

          {gapsLoading ? (
            <div className="rounded-xl border border-purple-100 bg-purple-50/60 p-3 text-xs text-[#8C3F96]">
              Loading skill comparison...
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: YOU ALREADY HAVE */}
            <div className="bg-[#F6FAF8] border border-emerald-200/80 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
                <div>
                  <h4 className="text-xs font-extrabold text-emerald-950 uppercase tracking-wider">
                    YOU ALREADY HAVE
                  </h4>
                  <p className="text-[11px] text-emerald-700 font-medium">Skills from your existing experience</p>
                </div>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-1 rounded-full">
                  {hasSkills.length} Identified
                </span>
              </div>

              {hasSkills.length > 0 ? (
                <div className="space-y-3">
                  {hasSkills.map((skill, idx) => (
                    <div key={idx} className="bg-white p-3.5 rounded-xl border border-emerald-100 shadow-2xs flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                        <Check size={12} />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-gray-900">{skill.skillName}</h5>
                        <p className="text-[10px] text-gray-500 font-medium">Already mapped on your profile</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 font-medium">No required skills mapped yet.</p>
              )}
            </div>

            {/* Right Column: TO DEVELOP */}
            <div className="bg-[#FFF8F6] border border-orange-200/80 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-orange-100 pb-3">
                <div>
                  <h4 className="text-xs font-extrabold text-[#7A2E1D] uppercase tracking-wider">
                    TO DEVELOP
                  </h4>
                  <p className="text-[11px] text-[#9E4733] font-medium">Skills that will strengthen readiness</p>
                </div>
                <span className="bg-rose-100 text-[#9E4733] text-[10px] font-extrabold px-2.5 py-1 rounded-full">
                  {developSkills.length} Growth Areas
                </span>
              </div>

              {developSkills.length > 0 ? (
                <div className="space-y-3">
                  {developSkills.map((skill, idx) => (
                    <div key={idx} className="bg-white p-3.5 rounded-xl border border-rose-100 shadow-2xs flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-rose-50 text-[#9E4733] border border-rose-200 flex items-center justify-center shrink-0 mt-0.5">
                        <Plus size={12} />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-gray-900">{skill.skillName}</h5>
                        <p className="text-[10px] text-gray-500 font-medium">
                          {PRIORITY_LABELS[skill.priority] ?? skill.priority}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 font-medium">All required skills for this career are already mapped.</p>
              )}
            </div>
          </div>
          )}

          {/* Callout Banner */}
          <div className="bg-[#FAF4F7] border border-[#F5E1EC] rounded-2xl p-4 flex items-start gap-3 text-xs text-gray-600">
            <div className="w-6 h-6 rounded-lg bg-pink-100 text-[#F05A7E] flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles size={14} />
            </div>
            <p className="text-xs text-gray-700 leading-relaxed font-medium">
              You already have a foundation to build on. HerNext will turn these development areas into a 30/60/90 day roadmap.
            </p>
          </div>

          {/* What happens next */}
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
                <span className="text-[10px] text-gray-400 block font-medium">Guided tasks</span>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-purple-100 text-center space-y-1">
                <span className="text-xs font-bold text-[#2D1B4E] block">3. Challenge</span>
                <span className="text-[10px] text-gray-400 block font-medium">Practical challenges</span>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-purple-100 text-center space-y-1">
                <span className="text-xs font-bold text-[#2D1B4E] block">4. Evidence</span>
                <span className="text-[10px] text-gray-400 block font-medium">Passport ready</span>
              </div>
            </div>
          </div>

          {generationError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              {generationError}
            </div>
          )}

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
              Generating this roadmap will make it your active roadmap on the dashboard.
            </p>
          </div>
        </motion.div>
      )}

      {/* STEP 4 FORM CARD: NEW ROADMAP READY */}
      {currentStep === 4 && selectedCareer && generatedRoadmap && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-purple-100/80 space-y-7"
        >
          {/* Selected Role Card with Path Created Badge */}
          <div className="bg-[#FAF8FC] rounded-2xl p-5 border border-purple-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#2D1B4E] to-[#8C3F96] text-white font-black text-sm flex items-center justify-center shadow-md shrink-0">
                {selectedCareer.careerName.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#9E4733] block mb-0.5">
                  YOUR NEW CAREER
                </span>
                <h4 className="text-base font-bold text-[#2D1B4E]">{selectedCareer.careerName}</h4>
                <p className="text-xs text-gray-500">Roadmap generated · {generatedRoadmap.roadmap.title}</p>
              </div>
            </div>

            <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5 self-start sm:self-auto">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Path Created · Ready to Start
            </span>
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

          {/* 30/60/90 Day Phase Preview */}
          <div className="space-y-3.5">
            {(['DAY_30', 'DAY_60', 'DAY_90'] as const).map((phase) => {
              const tasks = generatedRoadmap.phases[phase] ?? [];
              const phaseLabel = phase === 'DAY_30' ? '1. FOUNDATION' : phase === 'DAY_60' ? '2. BUILD' : '3. PRACTICE';
              return (
                <div
                  key={phase}
                  className="p-4.5 rounded-2xl bg-[#FAF8FC] border border-purple-100/80"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-black text-[#2D1B4E]`}>{phaseLabel}</span>
                    <span className="bg-purple-100 text-[#8C3F96] text-[9px] font-extrabold px-2 py-0.5 rounded-md">
                      {phase === 'DAY_30' ? 'Days 1-30' : phase === 'DAY_60' ? 'Days 31-60' : 'Days 61-90'}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                    {tasks.length} tasks · {tasks.filter((t) => t.status === 'COMPLETED').length} completed
                  </p>
                  <div className="mt-2 space-y-1.5">
                    {tasks.slice(0, 2).map((task) => (
                      <div key={task.id} className="flex items-start gap-2 text-xs">
                        <Check size={13} className="text-[#8C3F96] shrink-0 mt-0.5" />
                        <span className="text-gray-700 font-medium">{task.title}</span>
                      </div>
                    ))}
                    {tasks.length > 2 && (
                      <p className="text-[10px] text-gray-400 font-medium pl-5">+ {tasks.length - 2} more tasks</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Both Career Paths active banner → honest replacement */}
          <div className="bg-[#FAF4F7] border border-[#F5E1EC] rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-pink-100 text-[#F05A7E] flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 size={15} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#2D1B4E]">Your {selectedCareer.careerName} roadmap is active & saved</h4>
                <p className="text-xs text-gray-600 mt-0.5 font-medium">
                  You can revisit your tasks, mark them complete, and build your evidence anytime from the dashboard.
                </p>
              </div>
            </div>
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
          </div>
        </motion.div>
      )}
      </>
      )}
    </div>
  );
};

export default CreateCareerPathPage;