import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  X, 
  Sparkles, 
  CheckCircle2, 
  Cpu, 
  Database, 
  Target, 
  GitBranch, 
  Layers, 
  ShieldCheck,
  Search,
  Code,
  FileText
} from 'lucide-react';

import { useUserContext } from '../../context/UserContext';

interface DiscoveryInsightModalProps {
  initialStepIndex?: number;
  onClose: () => void;
}

export const DiscoveryInsightModal: React.FC<DiscoveryInsightModalProps> = ({
  initialStepIndex = 0,
  onClose
}) => {
  const { user, onboarding } = useUserContext();
  const [selectedStep, setSelectedStep] = useState<number>(initialStepIndex);

  const steps = [
    {
      id: 'data-gathered',
      title: '1. Data Gathered',
      shortDesc: 'Analyzed your portfolio, GitHub repositories, and uploaded experience.',
      icon: Database,
      details: `HerNext ingested 4 primary data sources from ${user.fullName}'s submitted profile, experience records, and ${onboarding.currentRole} projects.`,
      items: [
        { label: 'Submitted Skills & Frameworks', count: `${onboarding.skills.length} skills analyzed`, icon: Layers },
        { label: 'Work Experience Record', count: `${onboarding.yearsOfExperience} ${onboarding.currentRole} tenure`, icon: FileText },
        { label: 'Industry & Domain Signals', count: `${onboarding.industry} domain verified`, icon: Code },
        { label: 'Role Capability Verification', count: '18 research synthesis sessions', icon: Search }
      ]
    },
    {
      id: 'ai-analysis',
      title: '2. AI Analysis',
      shortDesc: 'Mapped to 10k+ successful women tech leaders\' career transitions.',
      icon: Cpu,
      details: `Our specialized neural career vector model mapped ${user.fullName}'s cross-functional competencies against high-growth ${onboarding.targetRole} trajectories.`,
      items: [
        { label: 'Semantic Career Embeddings', count: `High correlation with ${onboarding.targetRole}`, icon: GitBranch },
        { label: 'Role Benchmark Database', count: '10,400+ validated career paths', icon: Database },
        { label: 'Market Velocity Tracking', count: `High demand surge in 2026`, icon: Target },
        { label: 'Bias-Free Skill Extraction', count: 'Objective competency scoring', icon: ShieldCheck }
      ]
    },
    {
      id: 'match-found',
      title: '3. Match Found',
      shortDesc: 'Identified high-value transferable skills with clear upgrade paths.',
      icon: Target,
      details: `We identified that ${user.fullName} possesses deep foundational ${onboarding.currentRole} capabilities that directly transfer into ${onboarding.targetRole} without needing to restart from scratch.`,
      items: [
        { label: 'Discovered Skills', count: `${onboarding.skills.length} validated capabilities`, icon: CheckCircle2 },
        { label: 'Career-Relevant Match', count: `Core ${onboarding.currentRole} competencies`, icon: CheckCircle2 },
        { label: 'Target Upgrades', count: 'High-ROI skills to develop', icon: Target },
        { label: 'Overall Readiness Index', count: '84% Transition Ready', icon: Sparkles }
      ]
    }
  ];

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
        className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-purple-100 overflow-hidden my-6"
      >
        {/* Header */}
        <div className="bg-[#261338] text-white p-6 relative">
          <button 
            onClick={onClose}
            className="absolute top-5 right-5 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
          <div className="inline-flex items-center gap-2 bg-[#F05A7E]/20 text-[#F05A7E] px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2 border border-[#F05A7E]/30">
            <Sparkles size={12} />
            HerNext Discovery Engine
          </div>
          <h3 className="text-2xl font-black text-white">
            How HerNext Discovered Your Skills
          </h3>
          <p className="text-xs text-purple-200/80 max-w-lg mt-1">
            Explore the transparent AI pipeline that evaluated your portfolio data against millions of professional data points.
          </p>
        </div>

        {/* Step Selector Tabs */}
        <div className="grid grid-cols-3 border-b border-gray-100 bg-gray-50/80 p-2 gap-2">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isSelected = selectedStep === idx;
            return (
              <button
                key={step.id}
                onClick={() => setSelectedStep(idx)}
                className={`p-3 rounded-2xl text-left transition-all cursor-pointer flex flex-col gap-1 border ${
                  isSelected 
                    ? 'bg-white text-[#2D1B4E] border-purple-200 shadow-sm ring-1 ring-[#8C3F96]/20' 
                    : 'bg-transparent text-gray-500 border-transparent hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Icon size={14} className={isSelected ? 'text-[#8C3F96]' : 'text-gray-400'} />
                  <span>{step.title}</span>
                </div>
                <span className="text-[10px] text-gray-400 line-clamp-1">{step.shortDesc}</span>
              </button>
            );
          })}
        </div>

        {/* Active Step Content */}
        <div className="p-6 space-y-4">
          <div className="bg-purple-50/70 p-4 rounded-2xl border border-purple-100">
            <h4 className="text-sm font-bold text-[#2D1B4E] mb-1">
              {steps[selectedStep].title}: Deep Inspection
            </h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              {steps[selectedStep].details}
            </p>
          </div>

          <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Key Signals & Verification Proof
          </h5>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {steps[selectedStep].items.map((it, idx) => {
              const ItemIcon = it.icon;
              return (
                <div key={idx} className="p-3.5 bg-gray-50 rounded-xl border border-gray-100 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 text-[#8C3F96] flex items-center justify-center shrink-0">
                    <ItemIcon size={16} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#2D1B4E] block">{it.label}</span>
                    <span className="text-[11px] text-gray-500">{it.count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <span className="text-[10px] text-gray-400">
            Encrypted & Verified via HerNext Career Privacy Standard
          </span>
          <button
            onClick={onClose}
            className="bg-[#2D1B4E] hover:bg-[#431F69] text-white px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Got It
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DiscoveryInsightModal;
