import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  X, 
  Sparkles, 
  CheckCircle2, 
  TrendingUp, 
  Briefcase, 
  Bookmark, 
  BookmarkCheck, 
  ChevronRight,
  Lightbulb,
  FileCheck,
  Target
} from 'lucide-react';

export interface SkillItem {
  id: string;
  name: string;
  category: 'core' | 'career-relevant' | 'develop';
  source: string;
  description: string;
  proficiencyLevel: 'Expert' | 'Advanced' | 'Intermediate' | 'Foundational';
  proficiencyPercent: number;
  icon: any;
  color: string;
  evidence: {
    sourceTitle: string;
    details: string;
    extractedDate: string;
    snippet: string;
  }[];
  marketImpact: {
    salaryBoost: string;
    targetRoles: string[];
    demandTrend: string;
  };
  learningModules: {
    title: string;
    duration: string;
    difficulty: string;
  }[];
}

interface SkillDetailModalProps {
  skill: SkillItem | null;
  onClose: () => void;
  onAddToRoadmap: (skill: SkillItem) => void;
  onSaveToggle?: (skillId: string) => void;
  isSaved?: boolean;
}

export const SkillDetailModal: React.FC<SkillDetailModalProps> = ({
  skill,
  onClose,
  onAddToRoadmap,
  onSaveToggle,
  isSaved = false
}) => {
  const [activeTab, setActiveTab] = useState<'evidence' | 'market' | 'practice'>('evidence');
  const [localSaved, setLocalSaved] = useState(isSaved);

  if (!skill) return null;

  const handleBookmark = () => {
    setLocalSaved(!localSaved);
    if (onSaveToggle) onSaveToggle(skill.id);
  };

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
        className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-purple-100 overflow-hidden my-8"
      >
        {/* Header with gradient glow */}
        <div className="bg-gradient-to-r from-[#261338] via-[#3B1B54] to-[#261338] p-6 text-white relative">
          <button 
            onClick={onClose}
            className="absolute top-5 right-5 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="bg-[#F05A7E]/20 text-[#F05A7E] border border-[#F05A7E]/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
              <Sparkles size={11} />
              Validated Competency
            </span>
            <span className="bg-white/10 text-purple-200 text-[10px] font-medium px-2.5 py-0.5 rounded-full">
              Source: {skill.source}
            </span>
          </div>

          <h2 className="text-2xl font-black tracking-tight text-white mb-1.5 flex items-center gap-3">
            {skill.name}
          </h2>
          <p className="text-xs text-purple-200/80 max-w-xl leading-relaxed">
            {skill.description}
          </p>

          {/* Proficiency Meter */}
          <div className="mt-5 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/15">
                <skill.icon size={20} />
              </div>
              <div>
                <span className="text-[10px] text-purple-200/60 uppercase font-semibold tracking-wider block">Assessed Level</span>
                <span className="text-sm font-bold text-white flex items-center gap-1.5">
                  {skill.proficiencyLevel} 
                  <span className="text-xs font-normal text-purple-300">({skill.proficiencyPercent}%)</span>
                </span>
              </div>
            </div>

            <div className="w-full sm:w-48">
              <div className="w-full bg-black/30 rounded-full h-2 overflow-hidden border border-white/10">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${skill.proficiencyPercent}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="bg-gradient-to-r from-[#F05A7E] to-[#9B51E0] h-full rounded-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-100 bg-gray-50/70 px-6">
          <button
            onClick={() => setActiveTab('evidence')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'evidence'
                ? 'border-[#8C3F96] text-[#2D1B4E]'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <FileCheck size={14} /> AI Evidence & Citations
          </button>
          <button
            onClick={() => setActiveTab('market')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'market'
                ? 'border-[#8C3F96] text-[#2D1B4E]'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <TrendingUp size={14} /> 2026 Market Value
          </button>
          <button
            onClick={() => setActiveTab('practice')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'practice'
                ? 'border-[#8C3F96] text-[#2D1B4E]'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Target size={14} /> Learning Modules
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[380px] overflow-y-auto space-y-4 text-gray-700">
          {activeTab === 'evidence' && (
            <div className="space-y-3">
              <div className="bg-purple-50/70 rounded-2xl p-4 border border-purple-100 flex items-start gap-3">
                <Lightbulb size={18} className="text-[#8C3F96] shrink-0 mt-0.5" />
                <div className="text-xs text-purple-950">
                  <strong className="block font-bold mb-0.5">HerNext Extraction Proof:</strong>
                  Our neural parser identified this competency by analyzing syntax patterns, case study deliverables, and technical artifacts across your uploaded profile.
                </div>
              </div>

              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Detected Artifact Citations</h4>
              {skill.evidence.map((ev, i) => (
                <div key={i} className="bg-gray-50 rounded-2xl p-4 border border-gray-200/70 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-[#2D1B4E] flex items-center gap-1.5">
                      <CheckCircle2 size={14} className="text-emerald-500" /> {ev.sourceTitle}
                    </span>
                    <span className="text-[10px] text-gray-400">{ev.extractedDate}</span>
                  </div>
                  <p className="text-xs text-gray-600">{ev.details}</p>
                  <blockquote className="text-[11px] italic text-purple-900/80 bg-white p-2.5 rounded-xl border-l-2 border-[#8C3F96]">
                    "{ev.snippet}"
                  </blockquote>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'market' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">Target Compensation Bump</span>
                  <span className="text-2xl font-black text-emerald-700">{skill.marketImpact.salaryBoost}</span>
                  <span className="text-[10px] text-emerald-600 block mt-1">When paired with AI workflows</span>
                </div>
                <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4">
                  <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider block mb-1">Industry Demand Trend</span>
                  <span className="text-base font-black text-[#2D1B4E]">{skill.marketImpact.demandTrend}</span>
                  <span className="text-[10px] text-purple-600 block mt-1">High recruiter outreach</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Matching Career Pathways</h4>
                <div className="space-y-2">
                  {skill.marketImpact.targetRoles.map((role, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs">
                      <span className="font-semibold text-gray-800 flex items-center gap-2">
                        <Briefcase size={14} className="text-[#8C3F96]" /> {role}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100/60 px-2 py-0.5 rounded-full">High Match</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'practice' && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500">
                Sharpen this competency with curated 15-minute HerNext micro-projects:
              </p>
              {skill.learningModules.map((mod, i) => (
                <div key={i} className="flex items-center justify-between p-3.5 bg-gray-50 hover:bg-purple-50/50 rounded-2xl border border-gray-100 transition-colors">
                  <div>
                    <h5 className="text-xs font-bold text-[#2D1B4E]">{mod.title}</h5>
                    <span className="text-[10px] text-gray-400">{mod.duration} • {mod.difficulty}</span>
                  </div>
                  <button 
                    onClick={() => onAddToRoadmap(skill)}
                    className="text-xs font-bold text-[#8C3F96] hover:text-[#5B2975] flex items-center gap-1 cursor-pointer"
                  >
                    Add <ChevronRight size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3">
          <button 
            onClick={handleBookmark}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              localSaved 
                ? 'bg-purple-100 border-purple-300 text-[#8C3F96]' 
                : 'bg-white border-gray-200 text-gray-600 hover:border-purple-200'
            }`}
          >
            {localSaved ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
            <span>{localSaved ? 'Saved to Profile' : 'Bookmark'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button 
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-200/60 transition-colors cursor-pointer"
            >
              Close
            </button>
            <button 
              onClick={() => {
                onAddToRoadmap(skill);
                onClose();
              }}
              className="bg-[#2D1B4E] hover:bg-[#431F69] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md hover:shadow-purple-900/20 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles size={13} />
              Add to My Roadmap
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SkillDetailModal;
