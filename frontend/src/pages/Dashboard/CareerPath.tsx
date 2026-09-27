import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Briefcase, 
  Clock, 
  Target, 
  ArrowRight, 
  PlusCircle, 
  MessageSquare, 
  Cpu, 
  Lightbulb, 
  Layers, 
  ChevronRight,
  Check
} from 'lucide-react';
import PurpleBackgroundDots from '../../components/dashboard/PurpleBackgroundDots';
import PathActivationModal from '../../components/dashboard/PathActivationModal';
import SkillTransferModal from '../../components/dashboard/SkillTransferModal';
import CareerFitDetailModal from '../../components/dashboard/CareerFitDetailModal';
import NewCareerPathModal from '../../components/dashboard/NewCareerPathModal';
import { useNavigate } from 'react-router-dom';

interface PathData {
  id: string;
  title: string;
  matchScore: string;
  matchTier: string;
  description: string;
  currentStrengths: string[];
  aiNeeds: string[];
  fitBreakdown: {
    salaryRating: string;
    salaryText: string;
    demandRating: string;
    demandText: string;
    learningRating: string;
    learningText: string;
    balanceRating: string;
    balanceText: string;
  };
  skillsToDevelop: {
    title: string;
    description: string;
    level: string;
    progress: number;
    icon: any;
  }[];
  futureTimeline: {
    today: string;
    next2Years: string;
    next5Years: string;
  };
}

const PATHS_DATA: Record<string, PathData> = {
  'ai-product-designer': {
    id: 'ai-product-designer',
    title: 'AI Product Designer',
    matchScore: '91%',
    matchTier: 'Strong Fit',
    description: 'AI Product Designers shape how users interact with intelligent systems. Your deep empathy for users and prototyping skills give you a massive head start in designing intuitive AI experiences.',
    currentStrengths: [
      'User Research & Empathy',
      'Rapid Prototyping',
      'Information Architecture'
    ],
    aiNeeds: [
      'Understanding AI limitations & biases',
      'Designing for probabilistic outcomes',
      'Conversational UX paradigms'
    ],
    fitBreakdown: {
      salaryRating: 'Excellent',
      salaryText: 'High growth trajectory compared to traditional UX.',
      demandRating: 'Very High',
      demandText: 'Explosive job market growth in AI sectors.',
      learningRating: 'Moderate',
      learningText: 'Requires picking up new technical concepts.',
      balanceRating: 'Good',
      balanceText: 'Standard tech industry hours, remote friendly.'
    },
    skillsToDevelop: [
      {
        title: 'Conversational UI',
        description: 'Designing natural language interactions, handling error states gracefully in chat interfaces, and guiding user expectations.',
        level: 'Beginner Level',
        progress: 25,
        icon: MessageSquare
      },
      {
        title: 'AI Literacy',
        description: 'Understanding basic machine learning concepts, data privacy implications, and how models process inputs to generate outputs.',
        level: 'Intermediate Level',
        progress: 50,
        icon: Cpu
      }
    ],
    futureTimeline: {
      today: 'Designing basic chat interfaces and AI wrappers.',
      next2Years: 'Integrating AI seamlessly into existing workflows.',
      next5Years: 'Creating agentic systems that autonomously solve complex problems.'
    }
  },
  'ux-researcher': {
    id: 'ux-researcher',
    title: 'UX Researcher',
    matchScore: '85%',
    matchTier: 'Strong Fit',
    description: 'UX Researchers uncover deep psychological insights, run qualitative usability studies, and translate user telemetry into data-backed product direction.',
    currentStrengths: [
      'User Interview Moderation',
      'Qualitative Data Synthesis',
      'Empathy Mapping'
    ],
    aiNeeds: [
      'Evaluating Model Hallucination Impact',
      'Quantitative Telemetry Analytics',
      'Synthetic User Persona Audits'
    ],
    fitBreakdown: {
      salaryRating: 'Great',
      salaryText: 'High stability with premium research budgets.',
      demandRating: 'High',
      demandText: 'Steady demand across enterprise SaaS & AI products.',
      learningRating: 'Low Lift',
      learningText: 'Leverages 90% of your existing research toolkit.',
      balanceRating: 'Excellent',
      balanceText: 'Flexible hours and high autonomy.'
    },
    skillsToDevelop: [
      {
        title: 'AI Telemetry Analysis',
        description: 'Tracking how users query LLMs and interpreting confidence drop-offs.',
        level: 'Intermediate Level',
        progress: 40,
        icon: Cpu
      },
      {
        title: 'Ethical AI Testing',
        description: 'Identifying model bias, hallucination risks, and user safety guardrails.',
        level: 'Beginner Level',
        progress: 30,
        icon: Briefcase
      }
    ],
    futureTimeline: {
      today: 'Testing basic user prompt comprehension.',
      next2Years: 'Evaluating multi-modal AI voice & canvas interactions.',
      next5Years: 'Orchestrating autonomous user feedback loops.'
    }
  },
  'design-systems-lead': {
    id: 'design-systems-lead',
    title: 'Design Systems Lead',
    matchScore: '82%',
    matchTier: 'Good Fit',
    description: 'Design System Leads construct multi-brand design tokens, component architecture, and automated design governance used across product teams.',
    currentStrengths: [
      'Figma Component Tokens',
      'Visual Hierarchy',
      'Style Guide Governance'
    ],
    aiNeeds: [
      'Automated AI Token Generation',
      'WCAG Accessibility Auditing',
      'Code-to-Design Synchronization'
    ],
    fitBreakdown: {
      salaryRating: 'Excellent',
      salaryText: 'Very high compensation for design system architects.',
      demandRating: 'Very High',
      demandText: 'Essential foundation for scaling AI products.',
      learningRating: 'Moderate',
      learningText: 'Requires learning React tokens & storybook basics.',
      balanceRating: 'Good',
      balanceText: 'Structured team schedules and high clarity.'
    },
    skillsToDevelop: [
      {
        title: 'AI Token Automation',
        description: 'Leveraging AI tools to automatically output design tokens to code.',
        level: 'Intermediate Level',
        progress: 45,
        icon: Layers
      },
      {
        title: 'Component Governance',
        description: 'Creating accessible, scalable design rules across web & mobile.',
        level: 'Advanced Level',
        progress: 65,
        icon: Target
      }
    ],
    futureTimeline: {
      today: 'Maintaining manual Figma variant libraries.',
      next2Years: 'AI-generated adaptive component themes.',
      next5Years: 'Self-healing design token code sync.'
    }
  },
  'accessibility-specialist': {
    id: 'accessibility-specialist',
    title: 'Accessibility Specialist',
    matchScore: '78%',
    matchTier: 'Good Fit',
    description: 'Accessibility Specialists ensure digital products adhere to WCAG standards, screen-reader compatibility, and inclusive usability for all people.',
    currentStrengths: [
      'Inclusive User Empathy',
      'Contrast & Typography Rules',
      'User Flow Structuring'
    ],
    aiNeeds: [
      'Screen Reader AI Speech UX',
      'Multi-modal Input Alternatives',
      'Automated WCAG Auditing'
    ],
    fitBreakdown: {
      salaryRating: 'Solid',
      salaryText: 'Consistent growth with regulatory mandates.',
      demandRating: 'High',
      demandText: 'Increased legal requirements driving hiring.',
      learningRating: 'Low Lift',
      learningText: 'Specialization on top of existing UX empathy.',
      balanceRating: 'Excellent',
      balanceText: 'High job satisfaction and work-life balance.'
    },
    skillsToDevelop: [
      {
        title: 'WCAG 2.2 Compliance',
        description: 'Deep understanding of modern digital accessibility standards.',
        level: 'Intermediate Level',
        progress: 50,
        icon: Briefcase
      },
      {
        title: 'Voice & Speech UX',
        description: 'Designing inclusive voice interfaces for users with disabilities.',
        level: 'Beginner Level',
        progress: 20,
        icon: MessageSquare
      }
    ],
    futureTimeline: {
      today: 'Manual screen-reader and contrast testing.',
      next2Years: 'AI-powered automated accessibility remediations.',
      next5Years: 'Universal multi-sensory AI interactions.'
    }
  }
};

export const CareerPath: React.FC = () => {
  const navigate = useNavigate();
  const [activePathId, setActivePathId] = useState<string>('ai-product-designer');
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [selectedTransferSkill, setSelectedTransferSkill] = useState<string | null>(null);
  const [selectedFitType, setSelectedFitType] = useState<'salary' | 'demand' | 'learning' | 'balance' | null>(null);
  const [showNewPathModal, setShowNewPathModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const currentPath = PATHS_DATA[activePathId] || PATHS_DATA['ai-product-designer'];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSelectPath = (pathId: string) => {
    setActivePathId(pathId);
    showToast(`Switched career path view to ${PATHS_DATA[pathId]?.title || pathId}!`);
  };

  const handleCustomNewPath = (title: string, match: string) => {
    const customId = `custom-${Date.now()}`;
    PATHS_DATA[customId] = {
      id: customId,
      title: title,
      matchScore: match,
      matchTier: 'Strong Fit',
      description: `Custom target direction in ${title}. HerNext mapped your 4 years of UI/UX background to calculate high transferable alignment.`,
      currentStrengths: ['User Research', 'Rapid Prototyping', 'Visual Design'],
      aiNeeds: [`${title} Mental Models`, 'System Prompt Engineering', 'Context Window UX'],
      fitBreakdown: {
        salaryRating: 'Excellent',
        salaryText: 'High compensation potential in specialized AI roles.',
        demandRating: 'Very High',
        demandText: 'Rapidly expanding market demand.',
        learningRating: 'Moderate',
        learningText: 'Targeted micro-learning modules required.',
        balanceRating: 'Good',
        balanceText: 'Flexible and remote friendly.'
      },
      skillsToDevelop: [
        {
          title: `${title} Architecture`,
          description: `Specialized competency in ${title} workflows and deployment.`,
          level: 'Beginner Level',
          progress: 30,
          icon: Target
        }
      ],
      futureTimeline: {
        today: `Foundational alignment in ${title}.`,
        next2Years: `Leading complex projects in ${title}.`,
        next5Years: `Executive leadership in ${title}.`
      }
    };
    setActivePathId(customId);
    showToast(`✨ Analyzed and activated new target direction: ${title}`);
  };

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
            Based on your 4 years of experience as a UI/UX Designer, we've analyzed your skills against emerging tech roles. Here is the path where your unique background provides the strongest foundation.
          </p>

          {/* User Profile Summary Strip Card */}
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-purple-100/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
            <div className="flex flex-wrap items-center gap-6 sm:gap-12 w-full sm:w-auto">
              <div 
                onClick={() => setShowNewPathModal(true)}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-full bg-purple-50 text-[#8C3F96] flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Briefcase size={17} />
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Current Role</span>
                  <span className="text-xs font-bold text-[#2D1B4E] group-hover:text-[#8C3F96] transition-colors">UI/UX Designer</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-purple-50 text-[#8C3F96] flex items-center justify-center">
                  <Clock size={17} />
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Experience</span>
                  <span className="text-xs font-bold text-[#2D1B4E]">4 Years</span>
                </div>
              </div>

              <div 
                onClick={() => setShowNewPathModal(true)}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-full bg-purple-50 text-[#8C3F96] flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Target size={17} />
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Target Direction</span>
                  <span className="text-xs font-bold text-[#2D1B4E] group-hover:text-[#8C3F96] transition-colors">Tech & AI</span>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setShowNewPathModal(true)}
              className="text-xs font-bold text-[#8C3F96] hover:text-[#5B2975] flex items-center gap-1 cursor-pointer whitespace-nowrap self-end sm:self-center"
            >
              <span>Switch Direction</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </motion.div>

        {/* 2. Top Recommendation Hero Card */}
        <motion.div variants={itemVariants}>
          <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-purple-100/80 shadow-xs relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 flex-1 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 bg-[#FAF0E6] text-[#9E4733] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                <span className="text-xs">📍</span> Top Recommendation
              </div>
              
              <h2 className="text-2xl sm:text-3xl font-bold text-[#2D1B4E]">
                {currentPath.title}
              </h2>
              
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                {currentPath.description}
              </p>
            </div>

            {/* Score Card */}
            <div className="bg-[#FAF8FC] border border-purple-100/80 rounded-2xl p-6 text-center w-full md:w-48 shrink-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black text-[#2D1B4E] block mb-1">
                {currentPath.matchScore}
              </span>
              <span className="text-xs font-bold text-[#2D1B4E] block mb-2">
                {currentPath.matchTier}
              </span>
              <div className="w-20 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                <div className="bg-[#2D1B4E] h-full rounded-full w-[91%]" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* 3. Why this makes sense for you Section */}
        <motion.div variants={itemVariants} className="space-y-4">
          <h2 className="text-xl font-bold text-[#2D1B4E]">Why this makes sense for you</h2>

          <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-purple-100/80 shadow-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative items-center">
              {/* Left Column: Your Current Strengths */}
              <div className="space-y-4">
                <h3 className="font-bold text-[#2D1B4E] text-sm flex items-center gap-2">
                  <span className="text-[#8C3F96]">⚒️</span> Your Current Strengths
                </h3>
                <div className="space-y-3">
                  {currentPath.currentStrengths.map((str, i) => (
                    <div 
                      key={i} 
                      onClick={() => setSelectedTransferSkill(str)}
                      className="flex items-center gap-3 text-xs font-medium text-gray-700 p-2 rounded-xl hover:bg-purple-50/60 transition-colors cursor-pointer group"
                    >
                      <Check size={16} className="text-[#8C3F96] shrink-0" />
                      <span className="group-hover:text-[#8C3F96] transition-colors">{str}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Center Arrow in Desktop */}
              <div className="hidden md:flex absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-gray-300">
                <ArrowRight size={24} />
              </div>

              {/* Right Column: AI Design Needs */}
              <div className="space-y-4 md:pl-6 border-t md:border-t-0 md:border-l border-gray-100 pt-6 md:pt-0">
                <h3 className="font-bold text-[#2D1B4E] text-sm flex items-center gap-2">
                  <span className="text-[#9E4733]">📍</span> AI Design Needs
                </h3>
                <div className="space-y-3">
                  {currentPath.aiNeeds.map((need, i) => (
                    <div 
                      key={i} 
                      onClick={() => showToast(`AI Design Need: ${need}`)}
                      className="flex items-center gap-3 text-xs font-medium text-gray-700 p-2 rounded-xl hover:bg-orange-50/60 transition-colors cursor-pointer group"
                    >
                      <PlusCircle size={16} className="text-[#9E4733] shrink-0" />
                      <span className="group-hover:text-[#9E4733] transition-colors">{need}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 4. Career Fit Breakdown */}
        <motion.div variants={itemVariants} className="space-y-4">
          <h2 className="text-xl font-bold text-[#2D1B4E]">Career Fit Breakdown</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Salary */}
            <div 
              onClick={() => setSelectedFitType('salary')}
              className="bg-white/95 backdrop-blur-md rounded-2xl p-5 border border-purple-100/80 shadow-xs hover:shadow-md transition-all cursor-pointer space-y-3 group"
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-[#8C3F96] flex items-center justify-center font-bold text-sm">
                  $
                </div>
                <span className="text-[10px] font-bold text-[#8C3F96] uppercase">
                  {currentPath.fitBreakdown.salaryRating}
                </span>
              </div>
              <div>
                <h3 className="font-bold text-[#2D1B4E] text-xs mb-1 group-hover:text-[#8C3F96] transition-colors">Salary Potential</h3>
                <p className="text-[11px] text-gray-500 leading-normal">
                  {currentPath.fitBreakdown.salaryText}
                </p>
              </div>
            </div>

            {/* Card 2: Demand Growth */}
            <div 
              onClick={() => setSelectedFitType('demand')}
              className="bg-white/95 backdrop-blur-md rounded-2xl p-5 border border-purple-100/80 shadow-xs hover:shadow-md transition-all cursor-pointer space-y-3 group"
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-[#8C3F96] flex items-center justify-center font-bold text-sm">
                  📈
                </div>
                <span className="text-[10px] font-bold text-[#8C3F96] uppercase">
                  {currentPath.fitBreakdown.demandRating}
                </span>
              </div>
              <div>
                <h3 className="font-bold text-[#2D1B4E] text-xs mb-1 group-hover:text-[#8C3F96] transition-colors">Demand Growth</h3>
                <p className="text-[11px] text-gray-500 leading-normal">
                  {currentPath.fitBreakdown.demandText}
                </p>
              </div>
            </div>

            {/* Card 3: Learning Curve */}
            <div 
              onClick={() => setSelectedFitType('learning')}
              className="bg-white/95 backdrop-blur-md rounded-2xl p-5 border border-purple-100/80 shadow-xs hover:shadow-md transition-all cursor-pointer space-y-3 group"
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-[#8C3F96] flex items-center justify-center font-bold text-sm">
                  🎓
                </div>
                <span className="text-[10px] font-bold text-[#9E4733] uppercase">
                  {currentPath.fitBreakdown.learningRating}
                </span>
              </div>
              <div>
                <h3 className="font-bold text-[#2D1B4E] text-xs mb-1 group-hover:text-[#8C3F96] transition-colors">Learning Curve</h3>
                <p className="text-[11px] text-gray-500 leading-normal">
                  {currentPath.fitBreakdown.learningText}
                </p>
              </div>
            </div>

            {/* Card 4: Work-Life Balance */}
            <div 
              onClick={() => setSelectedFitType('balance')}
              className="bg-white/95 backdrop-blur-md rounded-2xl p-5 border border-purple-100/80 shadow-xs hover:shadow-md transition-all cursor-pointer space-y-3 group"
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-[#8C3F96] flex items-center justify-center font-bold text-sm">
                  ⚖️
                </div>
                <span className="text-[10px] font-bold text-[#8C3F96] uppercase">
                  {currentPath.fitBreakdown.balanceRating}
                </span>
              </div>
              <div>
                <h3 className="font-bold text-[#2D1B4E] text-xs mb-1 group-hover:text-[#8C3F96] transition-colors">Work-Life Balance</h3>
                <p className="text-[11px] text-gray-500 leading-normal">
                  {currentPath.fitBreakdown.balanceText}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 5. Transferable Skills Section */}
        <motion.div variants={itemVariants} className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#2D1B4E]">Transferable Skills</h2>
            <span className="text-xs text-gray-500 font-medium">Click any skill to inspect AI application</span>
          </div>

          <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-purple-100/80 shadow-xs">
            <div className="flex flex-wrap gap-2.5">
              {[
                'Figma & Design Tools',
                'Wireframing',
                'Usability Testing',
                'Design Systems',
                'Agile Methodologies',
                'Cross-functional Collaboration',
                'Visual Hierarchy'
              ].map((skillPill, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedTransferSkill(skillPill)}
                  className="bg-[#F4ECF8] hover:bg-purple-100 text-[#8C3F96] font-semibold text-xs px-4 py-2 rounded-full border border-purple-100/80 transition-all cursor-pointer hover:scale-105"
                >
                  {skillPill}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* 6. Skills to Develop Section */}
        <motion.div variants={itemVariants} className="space-y-4">
          <h2 className="text-xl font-bold text-[#2D1B4E]">Skills to Develop</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {currentPath.skillsToDevelop.map((std, idx) => {
              const Icon = std.icon;
              return (
                <div 
                  key={idx}
                  onClick={() => navigate('/dashboard/skills')}
                  className="bg-white/95 backdrop-blur-md rounded-3xl p-6 border border-purple-100/80 shadow-xs flex flex-col justify-between cursor-pointer hover:border-purple-200 transition-all group"
                >
                  <div>
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="w-8 h-8 rounded-xl bg-purple-50 text-[#8C3F96] flex items-center justify-center">
                        <Icon size={16} />
                      </div>
                      <h3 className="font-bold text-[#2D1B4E] text-base group-hover:text-[#8C3F96] transition-colors">
                        {std.title}
                      </h3>
                    </div>

                    <p className="text-xs text-gray-500 leading-relaxed mb-6">
                      {std.description}
                    </p>
                  </div>

                  <div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden mb-2">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${std.progress}%` }}
                        transition={{ duration: 0.8 }}
                        className="bg-[#9E4733] h-full rounded-full"
                      />
                    </div>
                    <span className="text-[10px] font-medium text-gray-400 block">
                      {std.level}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* 7. Alternative Paths to Consider Section */}
        <motion.div variants={itemVariants} className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#2D1B4E]">Alternative Paths to Consider</h2>
            <span className="text-xs text-gray-500 font-medium">Click card to switch active trajectory</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { id: 'ux-researcher', title: 'UX Researcher', match: '85% Match', desc: 'Deepen your focus on user psychology, qualitative analysis, and data-driven design decisions.' },
              { id: 'design-systems-lead', title: 'Design Systems Lead', match: '82% Match', desc: 'Create and maintain the building blocks that power product design across entire organizations.' },
              { id: 'accessibility-specialist', title: 'Accessibility Specialist', match: '78% Match', desc: 'Champion inclusive design practices ensuring products are usable by people of all abilities.' }
            ].map((alt, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ y: -3 }}
                onClick={() => handleSelectPath(alt.id)}
                className={`rounded-3xl p-6 border transition-all cursor-pointer flex flex-col justify-between ${
                  activePathId === alt.id
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
                      {alt.match}
                    </span>
                  </div>

                  <h3 className="font-bold text-[#2D1B4E] text-base mb-1.5">
                    {alt.title}
                  </h3>

                  <p className="text-xs text-gray-500 leading-relaxed">
                    {alt.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* 8. The Future of AI Design Timeline */}
        <motion.div variants={itemVariants} className="space-y-4">
          <h2 className="text-xl font-bold text-[#2D1B4E]">The Future of AI Design</h2>

          <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-purple-100/80 shadow-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
              {/* Phase 1 */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-[#2D1B4E] block">Today</span>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {currentPath.futureTimeline.today}
                </p>
              </div>

              {/* Arrow 1 */}
              <div className="hidden md:flex absolute left-[31%] top-1/2 transform -translate-y-1/2 text-gray-300">
                <ArrowRight size={20} />
              </div>

              {/* Phase 2 */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-[#2D1B4E] block">Next 2 Years</span>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {currentPath.futureTimeline.next2Years}
                </p>
              </div>

              {/* Arrow 2 */}
              <div className="hidden md:flex absolute left-[65%] top-1/2 transform -translate-y-1/2 text-gray-300">
                <ArrowRight size={20} />
              </div>

              {/* Phase 3 */}
              <div className="space-y-2 text-right md:text-right">
                <span className="text-xs font-bold text-[#9E4733] block">Next 5 Years</span>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {currentPath.futureTimeline.next5Years}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 9. A Note from HerNext Quote Card */}
        <motion.div variants={itemVariants}>
          <div className="bg-[#FAF0E6] rounded-3xl p-6 sm:p-8 border border-[#FBE3D6] space-y-2 text-gray-700 relative">
            <div className="flex items-center gap-2 text-[#2D1B4E] font-bold text-sm">
              <Lightbulb size={18} className="text-[#2D1B4E]" />
              <span>A Note from HerNext</span>
            </div>
            <p className="text-xs sm:text-sm italic leading-relaxed text-gray-700">
              "Stepping into AI design might feel daunting, but remember: the core of good AI is good user experience. Your background in understanding human needs is exactly what the AI industry desperately needs right now. Don't underestimate the value of your empathy."
            </p>
          </div>
        </motion.div>

        {/* 10. Call-to-Action Section */}
        <motion.div variants={itemVariants} className="text-center py-6 space-y-3">
          <p className="text-sm font-bold text-[#2D1B4E]">Ready to start this journey?</p>

          <motion.button 
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowActivationModal(true)}
            className="bg-[#2D1B4E] hover:bg-[#431F69] text-white font-bold text-sm px-8 py-3.5 rounded-2xl shadow-xl transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            <span>Select {currentPath.title} Path</span>
            <ArrowRight size={16} />
          </motion.button>

          <p className="text-[11px] text-gray-400 font-medium block">
            You can always explore other paths later.
          </p>
        </motion.div>

        {/* 11. Next Steps Section */}
        <motion.div variants={itemVariants} className="space-y-4">
          <h2 className="text-xl font-bold text-[#2D1B4E]">Next Steps</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div 
              onClick={() => setShowActivationModal(true)}
              className="flex flex-col items-center text-center p-4 rounded-2xl bg-white/60 hover:bg-white border border-gray-100 transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-full bg-purple-50 text-[#2D1B4E] font-bold text-sm flex items-center justify-center mb-3">
                1
              </div>
              <h4 className="font-bold text-[#2D1B4E] text-xs mb-1 group-hover:text-[#8C3F96] transition-colors">
                Build Your Roadmap
              </h4>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                We'll generate a personalized learning plan based on your current skills.
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
                Curated Resources
              </h4>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Get access to targeted courses, articles, and practical exercises.
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
                Track Progress
              </h4>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Earn badges and unlock new milestones as you develop your AI design skills.
              </p>
            </div>
          </div>
        </motion.div>

        {/* 12. Footer Disclaimer */}
        <motion.div variants={itemVariants} className="pt-4 border-t border-gray-200/80">
          <p className="text-[10px] text-gray-400 text-center leading-relaxed">
            These recommendations are based on industry trends, job market analysis, and your provided skill profile as of October 2023. Career paths are dynamic and meant to serve as a directional guide.
          </p>
        </motion.div>
      </motion.div>

      {/* MODALS */}
      <AnimatePresence>
        {showActivationModal && (
          <PathActivationModal 
            roleTitle={currentPath.title}
            matchScore={currentPath.matchScore}
            onClose={() => setShowActivationModal(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedTransferSkill && (
          <SkillTransferModal 
            skillName={selectedTransferSkill}
            onClose={() => setSelectedTransferSkill(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedFitType && (
          <CareerFitDetailModal 
            type={selectedFitType}
            roleTitle={currentPath.title}
            onClose={() => setSelectedFitType(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showNewPathModal && (
          <NewCareerPathModal 
            onClose={() => setShowNewPathModal(false)}
            onSelectNewPath={handleCustomNewPath}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default CareerPath;
