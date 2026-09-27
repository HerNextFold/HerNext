import React, { useState } from 'react';
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
  Flame, 
  ArrowUpRight, 
  DollarSign, 
  Users, 
  Zap,
  ShieldCheck,
  Compass
} from 'lucide-react';
import { useDashboardContext } from '../../context/DashboardContext';
import { useUserContext } from '../../context/UserContext';

const PRESETS = [
  {
    label: 'AI Product Designer',
    company: 'Google',
    role: 'UX Designer',
    exp: '3-5 years',
    skills: 'Figma, AI Prototyping, Design Systems, Prompt Engineering, User Research',
    jd: 'Looking for a Senior AI Product Designer to lead user experiences for multimodal generative AI applications. Required: deep understanding of human-centered AI, conversational UI, and rapid prototyping.'
  },
  {
    label: 'Lead UX Strategist',
    company: 'Spotify',
    role: 'Product Designer',
    exp: '5-10 years',
    skills: 'Figma, UX Strategy, Information Architecture, Algorithmic Personalization, Workshop Facilitation',
    jd: 'Lead discovery and design strategy for our AI recommendation engine surfaces. Drive ethical UX guidelines and collaborate with ML engineering teams.'
  },
  {
    label: 'Conversational AI Designer',
    company: 'Anthropic',
    role: 'Interaction Designer',
    exp: '3-5 years',
    skills: 'Prompt Engineering, Conversational Flow, Figma, AI Ethics, LLM Evaluation',
    jd: 'Design intuitive, steerable, and transparent human-AI conversation flows. Focus on safety, clarity, and delightful interactive feedback.'
  }
];

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

const RECOMMENDED_PATHWAYS = [
  {
    title: 'AI Experience Architect',
    demand: '+64% Hiring Surge',
    salary: '$165k - $210k',
    match: 92,
    timeframe: '6-8 Weeks',
    tags: ['Multimodal UI', 'Generative Workflows', 'Strategy'],
    color: 'from-purple-600 to-indigo-600'
  },
  {
    title: 'Human-AI Interface Strategist',
    demand: '+48% Demand',
    salary: '$150k - $195k',
    match: 86,
    timeframe: '4-6 Weeks',
    tags: ['AI Ethics', 'User Empathy', 'Design Systems'],
    color: 'from-pink-500 to-rose-600'
  },
  {
    title: 'Generative Design Director',
    demand: '+52% Demand',
    salary: '$180k - $240k',
    match: 78,
    timeframe: '10-12 Weeks',
    tags: ['Leadership', 'Creative AI Tools', 'Scale'],
    color: 'from-amber-500 to-orange-600'
  }
];

const MENTORS = [
  {
    name: 'Elena Rostova',
    role: 'Principal AI Designer @ DeepMind',
    experience: '9 yrs exp',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    available: 'Available this week',
    badge: 'Top Mentor'
  },
  {
    name: 'Amara Okafor',
    role: 'Staff Product Lead @ Figma AI',
    experience: '8 yrs exp',
    avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&auto=format&fit=crop&q=80',
    available: '2 spots left',
    badge: 'AI Specialist'
  },
  {
    name: 'Jessica Vance',
    role: 'VP Design & AI Innovation @ Stripe',
    experience: '12 yrs exp',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    available: 'Tomorrow',
    badge: 'Executive Coach'
  }
];

const CareerInsights: React.FC = () => {
  const navigate = useNavigate();
  const { setCareerData } = useDashboardContext();
  const { onboarding } = useUserContext();
  
  const [formData, setFormData] = useState({
    targetRole: onboarding.targetRole || 'AI Engineer',
    company: 'Tech Enterprise',
    jobDescription: `Seeking an ambitious ${onboarding.targetRole || 'Engineering Lead'} to architect AI-native capabilities, optimize workflow throughput, and lead cross-functional technical teams.`,
    currentRole: onboarding.currentRole || 'Frontend Developer',
    yearsExperience: onboarding.yearsOfExperience || '3-5 years',
    topSkills: onboarding.skills && onboarding.skills.length > 0 ? onboarding.skills.map(s => s.name).join(', ') : 'React, TypeScript, Next.js'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeChecklist, setActiveChecklist] = useState<number[]>([0, 2]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Dynamic calculations based on user input
  const skillsList = formData.topSkills.split(',').map(s => s.trim()).filter(Boolean);
  const baseScore = 55;
  const calculatedMatch = Math.min(
    96, 
    baseScore + 
    (formData.targetRole ? 10 : 0) + 
    (formData.jobDescription.length > 30 ? 12 : 0) + 
    (skillsList.length * 4) +
    (formData.currentRole ? 8 : 0)
  );

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setFormData({
      targetRole: preset.label,
      company: preset.company,
      jobDescription: preset.jd,
      currentRole: preset.role,
      yearsExperience: preset.exp,
      topSkills: preset.skills
    });
    setErrors({});
    showToast(`Applied preset: ${preset.label}`);
  };

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
    if (!formData.jobDescription.trim()) newErrors.jobDescription = 'Job description is required';
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

  const toggleChecklist = (idx: number) => {
    if (activeChecklist.includes(idx)) {
      setActiveChecklist(activeChecklist.filter(i => i !== idx));
    } else {
      setActiveChecklist([...activeChecklist, idx]);
      showToast('Career readiness signal added (+3% boost)');
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
              <span>HerNext AI Assessment Engine 2026</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Unlock Your AI-Ready Career Pathway
            </h1>
            <p className="text-purple-200/80 text-xs md:text-sm leading-relaxed">
              Define your aspirational target role and current skill stack. Our neural evaluation model assesses your market positioning, automated task risks, and salary upside in real-time.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 md:flex-col md:items-end shrink-0">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#F05A7E] to-[#FF8E53] flex items-center justify-center text-white font-bold">
                <Flame size={20} />
              </div>
              <div>
                <span className="text-[10px] text-purple-200 block uppercase font-medium">Market Hiring Demand</span>
                <span className="text-sm font-black text-white">+52.4% for AI Designers</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Autofill Presets */}
        <div className="mt-6 pt-5 border-t border-white/10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-purple-200 uppercase tracking-wider mr-2">Quick Fill Presets:</span>
            {PRESETS.map((preset) => (
              <motion.button
                key={preset.label}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={() => applyPreset(preset)}
                className="bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Zap size={12} className="text-[#F05A7E]" />
                <span>{preset.label}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Main Grid: Form (Left) & Real-time Live Simulator (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: The Interactive Assessment Form */}
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
                      placeholder="e.g. AI Product Designer" 
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
                      placeholder="e.g. Google, Apple, Scale AI" 
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <div className="flex justify-between items-center mb-1">
                    <label className={labelClasses}>Target Job Description <span className="text-red-500">*</span></label>
                    <button
                      type="button"
                      onClick={() => setFormData({
                        ...formData,
                        jobDescription: 'Seeking an innovative AI Product Designer to spearhead human-centered AI interfaces, conversational tools, and generative workflows for consumer apps.'
                      })}
                      className="text-[11px] text-[#8C3F96] hover:underline font-semibold cursor-pointer"
                    >
                      + Paste Sample JD
                    </button>
                  </div>
                  <div className="relative">
                    <FileText className="absolute left-3.5 top-3.5 text-gray-400" size={17} />
                    <textarea 
                      rows={3} 
                      name="jobDescription"
                      value={formData.jobDescription}
                      onChange={handleChange}
                      className={`w-full bg-white/90 border-gray-200 rounded-xl shadow-xs focus:ring-2 focus:ring-[#8C3F96] focus:border-[#8C3F96] p-3 border pl-10 text-xs md:text-sm ${errors.jobDescription ? 'border-red-500 ring-1 ring-red-500' : ''}`} 
                      placeholder="Paste key responsibilities or requirements from the target role..."
                    ></textarea>
                  </div>
                  {errors.jobDescription && <p className="text-red-500 text-[11px] mt-1 font-medium">{errors.jobDescription}</p>}
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
                      placeholder="e.g. UX Designer / UI Developer" 
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
                      placeholder="e.g. Figma, Prompt Engineering, User Research, Prototyping" 
                    />
                  </div>
                  {errors.topSkills && <p className="text-red-500 text-[11px] mt-1 font-medium">{errors.topSkills}</p>}

                  {/* Clickable trending skills pills */}
                  <div className="mt-3">
                    <span className="text-[10px] text-gray-500 font-semibold block mb-1.5">⚡ Click to add trending skills:</span>
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
                <span>🔒 Analyzed securely by HerNext AI model</span>
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
                    <span>Compiling Intelligence...</span>
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

        {/* Right Column: Dynamic Live AI Readiness Simulator */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-5 space-y-5"
        >
          {/* Live Match Gauge Card */}
          <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 border border-purple-100 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#F05A7E]">Live Estimation</span>
                <h3 className="text-base font-bold text-[#2D1B4E]">Target Role Readiness</h3>
              </div>
              <span className="w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-100 animate-pulse"></span>
            </div>

            <div className="flex items-center gap-6 my-4">
              {/* Circular Gauge */}
              <div className="relative w-28 h-28 flex-shrink-0">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="56" cy="56" r="46" fill="transparent" stroke="#F4EFF7" strokeWidth="10" />
                  <motion.circle 
                    initial={{ strokeDashoffset: 289.02 }}
                    animate={{ strokeDashoffset: 289.02 - (289.02 * calculatedMatch) / 100 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    cx="56" cy="56" r="46" fill="transparent" stroke="#8C3F96" strokeWidth="10" strokeDasharray="289.02" 
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-[#2D1B4E]">{calculatedMatch}%</span>
                  <span className="text-[9px] font-bold text-gray-400 uppercase">Match Score</span>
                </div>
              </div>

              <div className="space-y-2 flex-1">
                <div>
                  <div className="flex justify-between text-[11px] mb-0.5">
                    <span className="text-gray-600 font-medium">Core UX Competency</span>
                    <span className="font-bold text-[#2D1B4E]">85%</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#5B2975] rounded-full w-[85%]"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] mb-0.5">
                    <span className="text-gray-600 font-medium">AI & GenAI Tooling</span>
                    <span className="font-bold text-[#F05A7E]">{skillsList.some(s => s.toLowerCase().includes('ai') || s.toLowerCase().includes('prompt')) ? '92%' : '45%'}</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${skillsList.some(s => s.toLowerCase().includes('ai') || s.toLowerCase().includes('prompt')) ? 'bg-[#F05A7E] w-[92%]' : 'bg-gray-400 w-[45%]'}`}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] mb-0.5">
                    <span className="text-gray-600 font-medium">Leadership & Strategy</span>
                    <span className="font-bold text-[#2D1B4E]">74%</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#8C3F96] rounded-full w-[74%]"></div>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-gray-500 bg-purple-50/50 p-2.5 rounded-xl border border-purple-100/50">
              💡 <span className="font-semibold text-[#2D1B4E]">AI Tip:</span> Adding <strong>Prompt Engineering</strong> and <strong>Conversational UI</strong> boosts match rate for {formData.targetRole || 'this target role'} by +24%.
            </p>
          </div>

          {/* Salary Benchmark & Growth Card */}
          <div className="bg-gradient-to-br from-[#FAF5ED] to-[#FFF9F2] rounded-3xl p-6 border border-[#F5E6CE] shadow-xs">
            <div className="flex items-center gap-2 text-[#C47D3B] mb-2">
              <DollarSign size={16} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Projected Compensation</span>
            </div>
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-2xl font-black text-[#2D1B4E]">$155,000 - $195,000</span>
              <span className="text-xs text-emerald-600 font-bold bg-emerald-100 px-2 py-0.5 rounded-md">+28% vs Base</span>
            </div>
            <p className="text-[11px] text-gray-600">
              Based on verified 2026 tech compensation packages for women transitioning into AI product & design specializations.
            </p>
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
              <p className="text-[11px] text-gray-500">Hit the button above or fill all inputs to view the detailed readiness report.</p>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* SECTION 1: Recommended Pathways for Her */}
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
            <h2 className="text-2xl font-black text-[#2D1B4E]">Recommended Pathways for Aisha</h2>
          </div>
          <p className="text-xs text-gray-500 max-w-md">
            Identified by HerNext intelligence algorithms based on current tech transitions in 2026.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {RECOMMENDED_PATHWAYS.map((pathway) => (
            <motion.div
              key={pathway.title}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="bg-white rounded-3xl p-6 border border-purple-100 shadow-sm hover:shadow-xl hover:border-purple-200 transition-all flex flex-col justify-between group relative overflow-hidden"
            >
              <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${pathway.color}`} />
              
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-[#8C3F96] px-2.5 py-1 rounded-full">
                    {pathway.demand}
                  </span>
                  <div className="flex items-center gap-1 text-xs font-black text-[#2D1B4E]">
                    <Award size={14} className="text-[#F05A7E]" />
                    <span>{pathway.match}% Match</span>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-[#2D1B4E] group-hover:text-[#8C3F96] transition-colors mb-1.5">
                  {pathway.title}
                </h3>
                <p className="text-sm font-semibold text-gray-700 mb-4">{pathway.salary} <span className="text-xs font-normal text-gray-400">/ year</span></p>

                <div className="space-y-1.5 mb-5">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Core Focus:</span>
                  <div className="flex flex-wrap gap-1">
                    {pathway.tags.map(t => (
                      <span key={t} className="text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md font-medium">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                <span className="text-[11px] text-gray-500 font-medium">Est. prep: <strong>{pathway.timeframe}</strong></span>
                <button 
                  onClick={() => {
                    setFormData({
                      ...formData,
                      targetRole: pathway.title,
                      jobDescription: `Targeting the ${pathway.title} track. Focus on ${pathway.tags.join(', ')}.`
                    });
                    showToast(`Selected pathway: ${pathway.title}`);
                  }}
                  className="p-2 bg-purple-50 hover:bg-[#2D1B4E] text-[#2D1B4E] hover:text-white rounded-xl transition-colors cursor-pointer"
                >
                  <ArrowUpRight size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
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
            <p className="text-xs text-gray-500 mt-0.5">Toggle each indicator that applies to your current work to boost your profile calibration.</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-purple-100 text-xs font-bold text-[#2D1B4E]">
            <ShieldCheck size={16} className="text-emerald-500" />
            <span>{activeChecklist.length}/4 Verified</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { id: 0, title: 'AI Prototyping in Workflow', desc: 'Used Claude, ChatGPT, v0, or Midjourney to accelerate design iterations.' },
            { id: 1, title: 'Cross-functional Collaboration', desc: 'Partnered with ML engineers or product managers on algorithmic features.' },
            { id: 2, title: 'Conversational & Multimodal Design', desc: 'Designed chatbots, speech interfaces, or contextual AI popups.' },
            { id: 3, title: 'Ethical Design & Bias Testing', desc: 'Audited user flows for algorithmic bias, accessibility, and transparency.' }
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

      {/* SECTION 3: Featured Female Mentors & Community Network */}
      <motion.section 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[#F05A7E] text-[10px] font-bold uppercase tracking-wider mb-1">
              <Users size={14} /> 1-on-1 Guidance
            </div>
            <h2 className="text-2xl font-black text-[#2D1B4E]">Meet Top Female AI Leaders</h2>
          </div>
          <span className="text-xs font-bold text-[#8C3F96] hover:underline cursor-pointer">
            Explore all 140+ mentors →
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {MENTORS.map((mentor) => (
            <motion.div
              key={mentor.name}
              whileHover={{ y: -4 }}
              className="bg-white rounded-3xl p-6 border border-purple-100 shadow-sm flex flex-col justify-between text-center"
            >
              <div>
                <div className="relative w-20 h-20 mx-auto mb-3">
                  <img src={mentor.avatar} alt={mentor.name} className="w-full h-full rounded-full object-cover ring-4 ring-purple-100" />
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></span>
                </div>
                <span className="inline-block bg-pink-50 text-[#F05A7E] text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full mb-1">
                  {mentor.badge}
                </span>
                <h3 className="text-base font-bold text-[#2D1B4E]">{mentor.name}</h3>
                <p className="text-xs text-gray-500 mb-2">{mentor.role}</p>
                <p className="text-[11px] text-gray-400 font-medium">{mentor.experience} • {mentor.available}</p>
              </div>

              <div className="mt-5 pt-4 border-t border-gray-100">
                <button 
                  onClick={() => showToast(`Requested coffee chat with ${mentor.name}!`)}
                  className="w-full bg-[#FAF5FB] hover:bg-[#2D1B4E] text-[#2D1B4E] hover:text-white py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Book 1:1 Intro Chat
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* SECTION 4: HerNext Community Stats & Impact Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="bg-[#261338] text-white rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl"
      >
        <div className="space-y-1 text-center md:text-left">
          <h3 className="text-xl font-bold">Empowering 12,000+ Women in AI Careers</h3>
          <p className="text-xs text-purple-200/70 max-w-xl">
            HerNext members experience an average 3.4x faster transition into senior AI product, engineering, and design roles.
          </p>
        </div>
        <div className="flex gap-4">
          <div className="bg-white/10 px-4 py-3 rounded-2xl text-center">
            <span className="block text-xl font-extrabold text-[#F05A7E]">94%</span>
            <span className="text-[10px] text-purple-200 uppercase font-medium">Placement Rate</span>
          </div>
          <div className="bg-white/10 px-4 py-3 rounded-2xl text-center">
            <span className="block text-xl font-extrabold text-amber-400">+$38k</span>
            <span className="text-[10px] text-purple-200 uppercase font-medium">Avg Salary Increase</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CareerInsights;
