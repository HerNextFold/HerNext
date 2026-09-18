import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Search, 
  PenTool, 
  Lightbulb, 
  ArrowRight, 
  CheckCircle2, 
  TrendingUp,
  RotateCw,
  Cpu,
  Layers,
  Rocket,
  Wrench,
  Briefcase,
  Info,
  Plus,
  Check,
  Brain
} from 'lucide-react';
import PurpleBackgroundDots from '../../components/dashboard/PurpleBackgroundDots';
import SkillDetailModal from '../../components/dashboard/SkillDetailModal';
import type { SkillItem } from '../../components/dashboard/SkillDetailModal';
import RoadmapConfirmationModal from '../../components/dashboard/RoadmapConfirmationModal';
import DiscoveryInsightModal from '../../components/dashboard/DiscoveryInsightModal';
import AddCustomSkillModal from '../../components/dashboard/AddCustomSkillModal';

const INITIAL_SKILLS: SkillItem[] = [
  {
    id: 'user-research',
    name: 'User Research',
    category: 'career-relevant',
    source: 'Portfolio',
    description: 'Demonstrated ability to synthesize user needs into actionable insights.',
    proficiencyLevel: 'Advanced',
    proficiencyPercent: 80,
    icon: Search,
    color: '#8C3F96',
    evidence: [
      {
        sourceTitle: 'Fintech Mobile App Redesign (Figma Case Study)',
        details: 'Synthesized 18 user interviews and reduced drop-off in onboarding flow by 32%.',
        extractedDate: 'Validated March 2026',
        snippet: 'Led continuous usability discovery sessions to structure frictionless transaction UX.'
      },
      {
        sourceTitle: 'Uploaded Resume (2023 - Present)',
        details: 'Spearheaded user persona clustering and customer journey architecture.',
        extractedDate: 'Verified',
        snippet: 'Senior UX Designer: Responsible for qualitative research synthesis and heuristic audits.'
      }
    ],
    marketImpact: {
      salaryBoost: '+28%',
      targetRoles: ['AI Product Designer', 'Principal UX Researcher', 'Lead Experience Architect'],
      demandTrend: '+42% growth in 2026 AI Product roles'
    },
    learningModules: [
      { title: 'Generative AI User Research Synthesis', duration: '20 mins', difficulty: 'Intermediate' },
      { title: 'Qualitative LLM Prompt Testing', duration: '25 mins', difficulty: 'Advanced' }
    ]
  },
  {
    id: 'prototyping',
    name: 'Prototyping',
    category: 'career-relevant',
    source: 'GitHub',
    description: 'Rapid translation of concepts into interactive models.',
    proficiencyLevel: 'Expert',
    proficiencyPercent: 95,
    icon: PenTool,
    color: '#F05A7E',
    evidence: [
      {
        sourceTitle: 'GitHub Repo: design-system-tokens',
        details: 'Created interactive React & Tailwind micro-prototypes with dynamic state handlers.',
        extractedDate: 'Validated March 2026',
        snippet: 'Authored 45+ modular UI components with high-fidelity animated transitions.'
      },
      {
        sourceTitle: 'Figma Community Interactive UI Kit',
        details: 'Published high-fidelity component library with variables and logic states.',
        extractedDate: 'Verified',
        snippet: 'Crafted complex micro-interactions, nested component variants, and interactive overlays.'
      }
    ],
    marketImpact: {
      salaryBoost: '+35%',
      targetRoles: ['AI Design Technologist', 'Staff UI/UX Engineer', 'AI Prototyping Lead'],
      demandTrend: '+58% demand surge for live AI prototyping'
    },
    learningModules: [
      { title: 'Interactive AI Canvas & Agent UI Prototyping', duration: '30 mins', difficulty: 'Advanced' },
      { title: 'Framer & Motion for AI Copilots', duration: '25 mins', difficulty: 'Expert' }
    ]
  },
  {
    id: 'problem-solving',
    name: 'Problem Solving',
    category: 'career-relevant',
    source: 'Resume',
    description: 'Navigating ambiguity to deliver structured solutions.',
    proficiencyLevel: 'Intermediate',
    proficiencyPercent: 70,
    icon: Lightbulb,
    color: '#D47B5A',
    evidence: [
      {
        sourceTitle: 'Cross-functional Product Delivery at SaaS Corp',
        details: 'Resolved technical and business constraint trade-offs for a multi-tenant platform.',
        extractedDate: 'Validated March 2026',
        snippet: 'Synthesized complex regulatory constraints into clean, self-serve workflows.'
      }
    ],
    marketImpact: {
      salaryBoost: '+22%',
      targetRoles: ['Product Strategy Lead', 'AI Solutions Architect', 'UX Lead'],
      demandTrend: 'Essential foundational competency'
    },
    learningModules: [
      { title: 'First-Principles AI Product Framing', duration: '20 mins', difficulty: 'Intermediate' },
      { title: 'Hypothesis-Driven UX Experimentation', duration: '25 mins', difficulty: 'Advanced' }
    ]
  },
  {
    id: 'design-systems',
    name: 'Design System Architecture',
    category: 'career-relevant',
    source: 'Figma',
    description: 'Building multi-brand scalable design tokens, accessible components, and documentation.',
    proficiencyLevel: 'Expert',
    proficiencyPercent: 92,
    icon: Layers,
    color: '#8C3F96',
    evidence: [
      {
        sourceTitle: 'Enterprise Token Architecture',
        details: 'Managed 200+ multi-theme design tokens across mobile and web.',
        extractedDate: 'Validated 2026',
        snippet: 'Standardized design language system adopted across 4 distributed engineering pods.'
      }
    ],
    marketImpact: {
      salaryBoost: '+30%',
      targetRoles: ['Design Systems Architect', 'AI Design Technologist'],
      demandTrend: '+45% industry growth'
    },
    learningModules: [
      { title: 'AI-Generated Design Tokens & Governance', duration: '30 mins', difficulty: 'Advanced' }
    ]
  },
  {
    id: 'data-analytics',
    name: 'Data-Driven UX & Metrics',
    category: 'career-relevant',
    source: 'Portfolio',
    description: 'Leveraging telemetry, heatmaps, and funnel analytics to optimize product metrics.',
    proficiencyLevel: 'Advanced',
    proficiencyPercent: 82,
    icon: TrendingUp,
    color: '#F05A7E',
    evidence: [
      {
        sourceTitle: 'A/B Test Experimentation Matrix',
        details: 'Analyzed 120k user events to lift conversion rate by 19%.',
        extractedDate: 'Validated 2026',
        snippet: 'Monitored funnel telemetry and iterative variant performance.'
      }
    ],
    marketImpact: {
      salaryBoost: '+26%',
      targetRoles: ['Growth UX Lead', 'AI Product Manager'],
      demandTrend: '+39% demand surge'
    },
    learningModules: [
      { title: 'UX Analytics in Non-Deterministic AI Interfaces', duration: '25 mins', difficulty: 'Intermediate' }
    ]
  },
  {
    id: 'ai-model-constraints',
    name: 'AI Model Constraints',
    category: 'develop',
    source: 'To Strengthen',
    description: 'Understanding LLM latency, token limits, context windows, and fallback UX.',
    proficiencyLevel: 'Foundational',
    proficiencyPercent: 45,
    icon: Brain,
    color: '#D47B5A',
    evidence: [
      {
        sourceTitle: 'HerNext AI Skill Assessment',
        details: 'Identified as key growth opportunity to transition into AI Product Leadership.',
        extractedDate: 'Identified Today',
        snippet: 'Bridging this understanding will unlock senior AI Architecture roles.'
      }
    ],
    marketImpact: {
      salaryBoost: '+38%',
      targetRoles: ['AI UX Architect', 'AI Product Director'],
      demandTrend: '+65% highest emerging demand'
    },
    learningModules: [
      { title: 'Latency, Hallucinations & AI Fallback States', duration: '20 mins', difficulty: 'Intermediate' },
      { title: 'Context Window UX & Token Optimization', duration: '30 mins', difficulty: 'Advanced' }
    ]
  },
  {
    id: 'strategic-product-vision',
    name: 'Strategic Product Vision',
    category: 'develop',
    source: 'To Strengthen',
    description: 'Aligning multi-quarter technology strategy with business revenue and executive leadership.',
    proficiencyLevel: 'Intermediate',
    proficiencyPercent: 55,
    icon: Rocket,
    color: '#9E4733',
    evidence: [
      {
        sourceTitle: 'HerNext AI Trajectory Matching',
        details: 'Direct path to bridge Aisha from Senior IC to Product Executive.',
        extractedDate: 'Recommended',
        snippet: 'Strategic thinking enables cross-organizational influence and roadmap ownership.'
      }
    ],
    marketImpact: {
      salaryBoost: '+34%',
      targetRoles: ['Director of AI Product', 'Head of Design'],
      demandTrend: '+48% leadership demand'
    },
    learningModules: [
      { title: 'Executive Roadmapping for AI Products', duration: '35 mins', difficulty: 'Advanced' },
      { title: 'Business Case Modeling for Tech Leaders', duration: '30 mins', difficulty: 'Advanced' }
    ]
  }
];

import { useUserContext } from '../../context/UserContext';

// INITIAL_SKILLS kept intact...

export const MySkills: React.FC = () => {
  const { user } = useUserContext();
  const [skillsList, setSkillsList] = useState<SkillItem[]>(INITIAL_SKILLS);
  const [filterCategory, setFilterCategory] = useState<'all' | 'career-relevant' | 'develop'>('all');
  const [selectedSkill, setSelectedSkill] = useState<SkillItem | null>(null);
  const [roadmapModalSkill, setRoadmapModalSkill] = useState<string | null>(null);
  const [discoveryStepIndex, setDiscoveryStepIndex] = useState<number | null>(null);
  const [showAddCustomModal, setShowAddCustomModal] = useState(false);
  const [insightStageModal, setInsightStageModal] = useState<{ title: string; desc: string; role: string; salary: string } | null>(null);
  const [haveDevelopDetail, setHaveDevelopDetail] = useState<{ title: string; type: 'have' | 'develop'; desc: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [savedSkillIds, setSavedSkillIds] = useState<string[]>(['user-research', 'prototyping']);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSaveToggle = (id: string) => {
    if (savedSkillIds.includes(id)) {
      setSavedSkillIds(savedSkillIds.filter((s) => s !== id));
      showToast('Skill removed from your saved competencies');
    } else {
      setSavedSkillIds([...savedSkillIds, id]);
      showToast('Skill saved to your personal profile!');
    }
  };

  const handleAddCustomSkill = (newSkill: SkillItem) => {
    setSkillsList([newSkill, ...skillsList]);
    showToast(`✨ ${newSkill.name} extracted and added to your matrix!`);
  };

  const filteredSkills = skillsList.filter((s) => {
    if (filterCategory === 'all') return true;
    if (filterCategory === 'career-relevant') return s.category === 'career-relevant';
    if (filterCategory === 'develop') return s.category === 'develop';
    return true;
  });

  const containerVariants: any = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants: any = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.45 } }
  };

  return (
    <div className="relative min-h-screen">
      {/* Background Animated Floating Purple Dots */}
      <PurpleBackgroundDots dotCount={50} />

      {/* Main Content Container */}
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
                <Sparkles size={13} />
              </div>
              <span className="font-medium">{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 1. Header Section */}
        <motion.div variants={itemVariants} className="space-y-3">
          <div className="inline-flex items-center gap-1.5 bg-[#F4ECF8] text-[#8C3F96] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
            <Sparkles size={12} className="text-[#8C3F96]" />
            <span>HERNEXT SKILLS DISCOVERY</span>
          </div>
          
          <h1 className="text-2xl sm:text-4xl md:text-[40px] font-bold text-[#2D1B4E] leading-tight tracking-tight">
            You already have more skills than you think
          </h1>
          
          <p className="text-gray-600 text-xs sm:text-sm max-w-3xl leading-relaxed">
            We've analyzed your experience to uncover the powerful, transferable abilities that map to high-value roles.
          </p>

          {/* 2. HerNext Skills Discovery Summary Card */}
          <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-xs border border-purple-100/80 mt-6 relative overflow-hidden">
            {/* Subtle card glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-100/30 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
              <h2 className="text-lg font-bold text-[#2D1B4E]">HerNext Skills Discovery Summary</h2>
              <span className="text-[10px] font-bold text-[#8C3F96] bg-purple-50 px-2.5 py-1 rounded-full self-start sm:self-auto">
                Live AI Assessment
              </span>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-3 gap-2 sm:gap-6 mb-6 py-4 border-y border-gray-100/90 text-left sm:text-left">
              <div 
                onClick={() => setFilterCategory('all')}
                className="cursor-pointer group transition-all"
              >
                <span className="block text-3xl sm:text-5xl font-black text-[#2D1B4E] mb-1 group-hover:text-[#8C3F96] transition-colors">
                  {skillsList.length}
                </span>
                <span className="text-[9px] sm:text-[10px] text-gray-500 uppercase tracking-wider font-bold block">
                  SKILLS DISCOVERED
                </span>
              </div>

              <div 
                onClick={() => setFilterCategory('career-relevant')}
                className="cursor-pointer group transition-all border-l border-gray-100 pl-4 sm:pl-8"
              >
                <span className="block text-3xl sm:text-5xl font-black text-[#D47B5A] mb-1 group-hover:text-[#b85f3f] transition-colors">
                  {skillsList.filter(s => s.category === 'career-relevant').length}
                </span>
                <span className="text-[9px] sm:text-[10px] text-gray-500 uppercase tracking-wider font-bold block">
                  CAREER-RELEVANT
                </span>
              </div>

              <div 
                onClick={() => setFilterCategory('develop')}
                className="cursor-pointer group transition-all border-l border-gray-100 pl-4 sm:pl-8"
              >
                <span className="block text-3xl sm:text-5xl font-black text-[#8C3F96] mb-1 group-hover:text-[#6a2973] transition-colors">
                  {skillsList.filter(s => s.category === 'develop').length}
                </span>
                <span className="text-[9px] sm:text-[10px] text-gray-500 uppercase tracking-wider font-bold block">
                  TO STRENGTHEN
                </span>
              </div>
            </div>

            {/* Button + Filter Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setSelectedSkill(skillsList[0]);
                  showToast(`Opened detailed breakdown for ${user.fullName}`);
                }}
                className="bg-[#2D1B4E] hover:bg-[#3D1E68] text-white font-bold text-xs px-6 py-3 rounded-xl flex items-center justify-center sm:justify-start gap-2 transition-all shadow-md cursor-pointer"
              >
                <span>Explore My Skills</span>
                <ArrowRight size={14} />
              </motion.button>

              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                <button
                  onClick={() => setFilterCategory('all')}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                    filterCategory === 'all'
                      ? 'bg-purple-100 text-[#8C3F96]'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  All ({skillsList.length})
                </button>
                <button
                  onClick={() => setFilterCategory('career-relevant')}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                    filterCategory === 'career-relevant'
                      ? 'bg-orange-100 text-[#D47B5A]'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  Relevant ({skillsList.filter(s => s.category === 'career-relevant').length})
                </button>
                <button
                  onClick={() => setFilterCategory('develop')}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                    filterCategory === 'develop'
                      ? 'bg-purple-100 text-[#8C3F96]'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  To Strengthen ({skillsList.filter(s => s.category === 'develop').length})
                </button>
                <button
                  onClick={() => setShowAddCustomModal(true)}
                  className="px-3 py-1.5 rounded-xl text-[11px] font-bold text-[#8C3F96] hover:bg-purple-50 flex items-center gap-1 border border-dashed border-purple-200 cursor-pointer"
                >
                  <Plus size={12} />
                  <span>Add Skill</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 3. Skills HerNext Discovered Grid */}
        <motion.div variants={itemVariants} className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#2D1B4E]">Skills HerNext Discovered</h2>
            <span className="text-xs text-gray-500 font-medium">
              Click any card to inspect AI evidence & career value
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {filteredSkills.map((skill) => {
              const SkillIcon = skill.icon;
              return (
                <motion.div 
                  key={skill.id}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  onClick={() => setSelectedSkill(skill)}
                  className="bg-white/95 backdrop-blur-md rounded-3xl p-6 border border-purple-100/80 shadow-xs hover:shadow-xl hover:border-purple-200 transition-all flex flex-col justify-between cursor-pointer group"
                >
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 bg-[#F4ECF8] rounded-2xl flex items-center justify-center text-[#8C3F96] shrink-0 group-hover:scale-110 transition-transform">
                        <SkillIcon size={18} />
                      </div>
                      <span className="bg-[#FAF0E6] text-[#8C3F96] text-[10px] font-bold px-3 py-1 rounded-full">
                        Source: {skill.source}
                      </span>
                    </div>

                    <h3 className="font-bold text-[#2D1B4E] text-base mb-1.5 group-hover:text-[#8C3F96] transition-colors">
                      {skill.name}
                    </h3>
                    
                    <p className="text-xs text-gray-500 leading-relaxed mb-6">
                      {skill.description}
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between items-center text-[10px] font-bold mb-1.5">
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden mr-3">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${skill.proficiencyPercent}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className="h-full rounded-full bg-[#3B1B54]"
                        />
                      </div>
                      <span className="text-gray-500 font-medium whitespace-nowrap">
                        {skill.proficiencyLevel}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* 4. How HerNext Discovered This Section */}
        <motion.div variants={itemVariants} className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#2D1B4E]">How HerNext Discovered This</h2>
            <button 
              onClick={() => setDiscoveryStepIndex(0)}
              className="text-xs font-bold text-[#8C3F96] hover:underline cursor-pointer"
            >
              Learn how AI parses your data
            </button>
          </div>

          <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-purple-100/80 shadow-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
              {/* Step 1 */}
              <motion.div 
                whileHover={{ scale: 1.02 }}
                onClick={() => setDiscoveryStepIndex(0)}
                className="flex flex-col items-center text-center p-3 rounded-2xl hover:bg-purple-50/50 transition-colors cursor-pointer"
              >
                <div className="w-11 h-11 rounded-2xl bg-purple-50 text-[#8C3F96] flex items-center justify-center mb-3 border border-purple-100">
                  <RotateCw size={19} />
                </div>
                <h4 className="font-bold text-[#2D1B4E] text-sm mb-1">Data Gathered</h4>
                <p className="text-xs text-gray-500 max-w-xs leading-relaxed">
                  Analyzed your portfolio and resume.
                </p>
              </motion.div>

              {/* Arrow 1 */}
              <div className="hidden md:flex absolute left-[31%] top-8 transform -translate-y-1/2 text-gray-300">
                <ArrowRight size={20} />
              </div>

              {/* Step 2 */}
              <motion.div 
                whileHover={{ scale: 1.02 }}
                onClick={() => setDiscoveryStepIndex(1)}
                className="flex flex-col items-center text-center p-3 rounded-2xl hover:bg-purple-50/50 transition-colors cursor-pointer"
              >
                <div className="w-11 h-11 rounded-2xl bg-purple-50 text-[#8C3F96] flex items-center justify-center mb-3 border border-purple-100">
                  <Cpu size={19} />
                </div>
                <h4 className="font-bold text-[#2D1B4E] text-sm mb-1">AI Analysis</h4>
                <p className="text-xs text-gray-500 max-w-xs leading-relaxed">
                  Mapped to 10k+ successful paths.
                </p>
              </motion.div>

              {/* Arrow 2 */}
              <div className="hidden md:flex absolute left-[65%] top-8 transform -translate-y-1/2 text-gray-300">
                <ArrowRight size={20} />
              </div>

              {/* Step 3 */}
              <motion.div 
                whileHover={{ scale: 1.02 }}
                onClick={() => setDiscoveryStepIndex(2)}
                className="flex flex-col items-center text-center p-3 rounded-2xl hover:bg-purple-50/50 transition-colors cursor-pointer"
              >
                <div className="w-11 h-11 rounded-2xl bg-purple-50 text-[#8C3F96] flex items-center justify-center mb-3 border border-purple-100">
                  <CheckCircle2 size={19} />
                </div>
                <h4 className="font-bold text-[#2D1B4E] text-sm mb-1">Match Found</h4>
                <p className="text-xs text-gray-500 max-w-xs leading-relaxed">
                  Identified high-value transferable skills.
                </p>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* 5. Have vs. Develop Section */}
        <motion.div variants={itemVariants} className="space-y-4">
          <h2 className="text-xl font-bold text-[#2D1B4E]">Have vs. Develop</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* What You Have Card */}
            <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-purple-100/80 shadow-xs">
              <h3 className="font-bold text-[#2D1B4E] text-base flex items-center gap-2 mb-5">
                <CheckCircle2 size={18} className="text-[#8C3F96]" />
                <span>What You Have</span>
              </h3>

              <div className="space-y-3">
                {[
                  { title: 'User Research & Synthesis', detail: 'Validated across 18 user interview cycles and Figma prototypes.' },
                  { title: 'Rapid Prototyping', detail: 'Expert mastery in interactive components, variables, and logic states.' },
                  { title: 'Problem Solving', detail: 'Synthesizing ambiguous business requirements into high-conversion workflows.' }
                ].map((item, idx) => (
                  <div 
                    key={idx}
                    onClick={() => setHaveDevelopDetail({ title: item.title, type: 'have', desc: item.detail })}
                    className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-purple-50/60 transition-colors cursor-pointer group"
                  >
                    <Check size={16} className="text-[#8C3F96] shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-semibold text-gray-800 group-hover:text-[#8C3F96] transition-colors block">
                        {item.title}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* What to Develop Card */}
            <div className="bg-[#FFF4EE] rounded-3xl p-6 sm:p-8 border border-[#FBE3D6] shadow-xs">
              <h3 className="font-bold text-[#9E4733] text-base flex items-center gap-2 mb-5">
                <TrendingUp size={18} />
                <span>What to Develop</span>
              </h3>

              <div className="space-y-3">
                {[
                  { title: 'AI Model Constraints', detail: 'Master non-deterministic UI states, latency mitigation, and token budgets.' },
                  { title: 'Strategic Product Vision', detail: 'Formulate business roadmaps, executive alignment, and AI product positioning.' },
                  { title: 'Technical Leadership', detail: 'Leading multi-disciplinary engineering, data science, and UX squads.' }
                ].map((item, idx) => (
                  <div 
                    key={idx}
                    onClick={() => setHaveDevelopDetail({ title: item.title, type: 'develop', desc: item.detail })}
                    className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-white/60 transition-colors cursor-pointer group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#9E4733] shrink-0 mt-1.5" />
                    <div>
                      <span className="text-xs font-semibold text-gray-800 group-hover:text-[#9E4733] transition-colors block">
                        {item.title}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* 6. HerNext Insight Card */}
        <motion.div variants={itemVariants}>
          <div className="bg-[#331842] text-white rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden">
            {/* Ambient purple orb */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

            <div className="inline-flex items-center gap-1.5 bg-white/10 text-purple-200 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-4 border border-white/10">
              <span className="text-sm">📍</span> HERNEXT INSIGHT
            </div>

            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-8">
              You don't need to start over to move forward.
            </h3>

            {/* 3 Steps Progression */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
              {/* Node 1 */}
              <motion.div 
                whileHover={{ y: -2 }}
                onClick={() => setInsightStageModal({
                  title: 'Deep Design Expertise',
                  desc: 'Your proven 5+ years of user empathy, UX heuristics, and interactive prototyping form the perfect substrate for AI leadership.',
                  role: 'Senior Product Designer',
                  salary: '$135,000 - $160,000'
                })}
                className="flex flex-col items-center text-center p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer border border-white/5"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/10 text-white flex items-center justify-center mb-3">
                  <Briefcase size={20} />
                </div>
                <span className="text-[10px] text-purple-200/60 font-bold uppercase tracking-wider block mb-1">
                  WHAT YOU HAVE
                </span>
                <h4 className="font-bold text-white text-sm">Deep Design Expertise</h4>
              </motion.div>

              {/* Arrow 1 */}
              <div className="hidden md:flex absolute left-[31%] top-1/2 transform -translate-y-1/2 text-purple-400/60">
                <ArrowRight size={20} />
              </div>

              {/* Node 2 */}
              <motion.div 
                whileHover={{ y: -2 }}
                onClick={() => setInsightStageModal({
                  title: 'Strategic Product Thinking',
                  desc: 'By adding LLM prompt testing, latency UX, and business metrics, you upgrade from IC visual design to end-to-end strategic problem solver.',
                  role: 'Lead AI Experience Architect',
                  salary: '$170,000 - $195,000'
                })}
                className="flex flex-col items-center text-center p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer border border-white/5"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/10 text-white flex items-center justify-center mb-3">
                  <Wrench size={20} />
                </div>
                <span className="text-[10px] text-purple-200/60 font-bold uppercase tracking-wider block mb-1">
                  WHAT YOU CAN BUILD
                </span>
                <h4 className="font-bold text-white text-sm">Strategic Product Thinking</h4>
              </motion.div>

              {/* Arrow 2 */}
              <div className="hidden md:flex absolute left-[65%] top-1/2 transform -translate-y-1/2 text-purple-400/60">
                <ArrowRight size={20} />
              </div>

              {/* Node 3 */}
              <motion.div 
                whileHover={{ y: -2 }}
                onClick={() => setInsightStageModal({
                  title: 'AI Product Leadership',
                  desc: 'Steer AI product directions, lead cross-functional squads, and command top compensation in high-growth AI organizations.',
                  role: 'Director of AI Product & Design',
                  salary: '$210,000 - $260,000'
                })}
                className="flex flex-col items-center text-center p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer border border-white/5"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/10 text-white flex items-center justify-center mb-3">
                  <Rocket size={20} />
                </div>
                <span className="text-[10px] text-purple-200/60 font-bold uppercase tracking-wider block mb-1">
                  WHERE YOU CAN GO
                </span>
                <h4 className="font-bold text-white text-sm">AI Product Leadership</h4>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* 7. Recommended by HerNext Banner */}
        <motion.div variants={itemVariants}>
          <div className="bg-[#FAF0E6] rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-l-4 border-[#9E4733] shadow-xs">
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-[#9E4733] font-bold text-[10px] uppercase tracking-wider">
                <Sparkles size={12} />
                <span>RECOMMENDED BY HERNEXT</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-[#2D1B4E]">
                Strengthen your AI Product Thinking skills
              </h3>
              <p className="text-xs text-gray-600 max-w-2xl leading-relaxed">
                Bridging this gap will increase your match score for AI Product Designer roles by 34%.
              </p>
            </div>

            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setRoadmapModalSkill('Strategic AI Product Thinking')}
              className="bg-[#9E4733] hover:bg-[#863b2a] text-white font-bold text-xs px-6 py-3 rounded-xl whitespace-nowrap transition-all shadow-md cursor-pointer shrink-0"
            >
              Add to My Roadmap
            </motion.button>
          </div>
        </motion.div>

        {/* 8. Footer Disclaimer */}
        <motion.div variants={itemVariants} className="pt-2">
          <div className="flex items-start gap-2 text-[11px] text-gray-500 leading-relaxed max-w-4xl border-t border-gray-200/80 pt-4">
            <Info size={14} className="text-gray-400 shrink-0 mt-0.5" />
            <p>
              HerNext AI Skill Analysis evaluates your provided experience data against millions of professional trajectories to identify transferable patterns. Results are designed to guide your career exploration and should be considered alongside your personal goals.
            </p>
          </div>
        </motion.div>
      </motion.div>

      {/* MODALS */}

      {/* Skill Detail Modal */}
      <AnimatePresence>
        {selectedSkill && (
          <SkillDetailModal 
            skill={selectedSkill}
            onClose={() => setSelectedSkill(null)}
            onAddToRoadmap={(s) => {
              setRoadmapModalSkill(s.name);
            }}
            onSaveToggle={handleSaveToggle}
            isSaved={savedSkillIds.includes(selectedSkill.id)}
          />
        )}
      </AnimatePresence>

      {/* Roadmap Confirmation Modal */}
      <AnimatePresence>
        {roadmapModalSkill && (
          <RoadmapConfirmationModal 
            skillName={roadmapModalSkill}
            onClose={() => setRoadmapModalSkill(null)}
            onConfirm={({ weeklyHours, targetWeeks }) => {
              showToast(`🎯 Added ${roadmapModalSkill} (${weeklyHours} hrs/wk • ${targetWeeks} wks) to your 90-day trajectory!`);
            }}
          />
        )}
      </AnimatePresence>

      {/* Discovery Insight Modal */}
      <AnimatePresence>
        {discoveryStepIndex !== null && (
          <DiscoveryInsightModal 
            initialStepIndex={discoveryStepIndex}
            onClose={() => setDiscoveryStepIndex(null)}
          />
        )}
      </AnimatePresence>

      {/* Add Custom Skill Modal */}
      <AnimatePresence>
        {showAddCustomModal && (
          <AddCustomSkillModal 
            onClose={() => setShowAddCustomModal(false)}
            onAddSkill={handleAddCustomSkill}
          />
        )}
      </AnimatePresence>

      {/* HerNext Insight Stage Modal */}
      <AnimatePresence>
        {insightStageModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setInsightStageModal(null)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-purple-100 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C3F96] bg-purple-50 px-2.5 py-1 rounded-full">
                  Career Trajectory Milestone
                </span>
                <button 
                  onClick={() => setInsightStageModal(null)}
                  className="text-gray-400 hover:text-gray-700 text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              <h3 className="text-xl font-black text-[#2D1B4E]">
                {insightStageModal.title}
              </h3>

              <p className="text-xs text-gray-600 leading-relaxed">
                {insightStageModal.desc}
              </p>

              <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Mapped Role Title:</span>
                  <span className="font-bold text-[#2D1B4E]">{insightStageModal.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Market Compensation:</span>
                  <span className="font-bold text-emerald-600">{insightStageModal.salary}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setRoadmapModalSkill(insightStageModal.title);
                  setInsightStageModal(null);
                }}
                className="w-full bg-[#2D1B4E] hover:bg-[#431F69] text-white py-3 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                Plan Transition in Roadmap
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Have vs Develop Item Detail Modal */}
      <AnimatePresence>
        {haveDevelopDetail && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setHaveDevelopDetail(null)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-purple-100 space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                  haveDevelopDetail.type === 'have' ? 'bg-purple-100 text-[#8C3F96]' : 'bg-orange-100 text-[#9E4733]'
                }`}>
                  {haveDevelopDetail.type === 'have' ? 'Validated Strength' : 'Priority Growth Area'}
                </span>
                <button 
                  onClick={() => setHaveDevelopDetail(null)}
                  className="text-gray-400 hover:text-gray-700 text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              <h3 className="text-lg font-bold text-[#2D1B4E]">
                {haveDevelopDetail.title}
              </h3>

              <p className="text-xs text-gray-600 leading-relaxed">
                {haveDevelopDetail.desc}
              </p>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  onClick={() => setHaveDevelopDetail(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Close
                </button>
                {haveDevelopDetail.type === 'develop' && (
                  <button
                    onClick={() => {
                      setRoadmapModalSkill(haveDevelopDetail.title);
                      setHaveDevelopDetail(null);
                    }}
                    className="px-4 py-2 bg-[#9E4733] hover:bg-[#863b2a] text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Add to Roadmap
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MySkills;
