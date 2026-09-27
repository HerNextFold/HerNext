import React from 'react';
import { motion } from 'motion/react';
import { 
  X, 
  DollarSign, 
  TrendingUp, 
  GraduationCap, 
  Scale, 
  CheckCircle2
} from 'lucide-react';

interface CareerFitDetailModalProps {
  type: 'salary' | 'demand' | 'learning' | 'balance' | null;
  roleTitle: string;
  onClose: () => void;
}

export const CareerFitDetailModal: React.FC<CareerFitDetailModalProps> = ({
  type,
  roleTitle,
  onClose
}) => {
  if (!type) return null;

  const dataMap = {
    salary: {
      title: 'Salary Potential Analysis',
      rating: 'Excellent',
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50 border-emerald-100',
      stats: [
        { label: 'Traditional UI/UX Base Range', value: '$95,000 - $130,000' },
        { label: 'AI Product Designer Range (2026)', value: '$145,000 - $195,000' },
        { label: 'Senior AI Experience Lead', value: '$200,000 - $260,000+' }
      ],
      description: 'AI Product Designers command a +38% salary premium compared to standard product design roles due to specialized understanding of non-deterministic UX and LLM interactions.',
      bullets: [
        'Equity packages in AI startups average 0.25% - 0.75%',
        'High demand for hybrid profiles (Design + AI Prompting)',
        'Top compensation in San Francisco, New York, and Remote'
      ]
    },
    demand: {
      title: 'Job Market Demand & Velocity',
      rating: 'Very High',
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 border-purple-100',
      stats: [
        { label: 'Quarterly Hiring Growth', value: '+58% Year-over-Year' },
        { label: 'Active Job Openings', value: '4,200+ Verified List' },
        { label: 'Recruiter Outreach Rate', value: '3.4x Industry Average' }
      ],
      description: 'As tech enterprises deploy custom LLM agents and copilots, demand for designers who can make AI interfaces transparent and trustworthy has exploded.',
      bullets: [
        '92% of Fortune 500 tech teams are hiring AI UX roles',
        'Strongest demand in SaaS, Fintech, Healthcare AI, and Dev Tools',
        'High urgency: Average time-to-hire is under 18 days'
      ]
    },
    learning: {
      title: 'Learning Curve & Technical Lift',
      rating: 'Moderate Lift (4-8 Weeks)',
      icon: GraduationCap,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 border-orange-100',
      stats: [
        { label: 'Est. Transition Effort', value: '3 - 5 hrs / week' },
        { label: 'Prerequisite Overlap', value: '82% Experience Match' },
        { label: 'New Skills Needed', value: '2 Core Technical Modules' }
      ],
      description: 'You do NOT need a Computer Science degree or deep Python coding experience. The lift primarily involves understanding model capabilities, latency, and conversational UI patterns.',
      bullets: [
        'Focus area 1: Conversational UI & System Fallbacks',
        'Focus area 2: Basic Machine Learning Mental Models',
        'Hands-on portfolio case study completes the transition'
      ]
    },
    balance: {
      title: 'Work-Life Balance & Remote Flexibility',
      rating: 'Good (High Remote Availability)',
      icon: Scale,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 border-blue-100',
      stats: [
        { label: 'Fully Remote Openings', value: '68% of All Roles' },
        { label: 'Flexible Work Hours', value: 'Standard 40h/week' },
        { label: 'Travel Requirement', value: 'Low (< 10% annual)' }
      ],
      description: 'AI Product Design roles offer industry-leading flexibility with asynchronous design reviews, modern token workflows, and distributed global teams.',
      bullets: [
        'High concentration of remote-first AI companies',
        'Generous health, wellness, and learning stipends ($3k+/yr)',
        'Empathetic team cultures prioritizing continuous innovation'
      ]
    }
  };

  const details = dataMap[type];
  const Icon = details.icon;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto"
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-purple-100 overflow-hidden my-6 text-gray-800"
      >
        <div className="bg-[#261338] text-white p-5 relative">
          <button 
            onClick={onClose}
            className="absolute top-5 right-5 text-white/70 hover:text-white bg-white/10 p-1.5 rounded-full cursor-pointer"
          >
            <X size={18} />
          </button>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-[#F05A7E] flex items-center justify-center">
              <Icon size={18} />
            </div>
            <div>
              <span className="text-[10px] text-purple-200/70 font-semibold uppercase tracking-wider block">Career Fit Inspector</span>
              <h3 className="text-base font-bold text-white">{details.title}</h3>
            </div>
          </div>
          <span className="text-xs text-purple-200/80">
            Path: <strong>{roleTitle}</strong>
          </span>
        </div>

        <div className="p-5 space-y-4 text-xs">
          <div className={`p-4 rounded-2xl border ${details.bgColor} space-y-1`}>
            <span className="text-[10px] font-bold uppercase tracking-wider block text-gray-500">Industry Assessment Rating</span>
            <span className={`text-lg font-black ${details.color}`}>{details.rating}</span>
            <p className="text-gray-700 leading-relaxed mt-1">{details.description}</p>
          </div>

          <div>
            <h4 className="font-bold text-[#2D1B4E] uppercase tracking-wider text-[10px] text-gray-500 mb-2">
              Key Metrics & Benchmarks
            </h4>
            <div className="space-y-2">
              {details.stats.map((s, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-gray-600 font-medium">{s.label}</span>
                  <span className="font-bold text-[#2D1B4E]">{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-bold text-[#2D1B4E] uppercase tracking-wider text-[10px] text-gray-500 mb-2">
              Insights & Highlights
            </h4>
            <div className="space-y-2">
              {details.bullets.map((b, i) => (
                <div key={i} className="flex items-start gap-2 text-gray-700">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span>{b}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-100 text-right">
          <button 
            onClick={onClose}
            className="px-5 py-2 bg-[#2D1B4E] hover:bg-[#431F69] text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            Got It
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CareerFitDetailModal;
