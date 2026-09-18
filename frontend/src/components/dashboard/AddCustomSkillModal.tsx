import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  X, 
  Sparkles, 
  Link as LinkIcon, 
  Loader2 
} from 'lucide-react';
import type { SkillItem } from './SkillDetailModal';

interface AddCustomSkillModalProps {
  onClose: () => void;
  onAddSkill: (newSkill: SkillItem) => void;
}

export const AddCustomSkillModal: React.FC<AddCustomSkillModalProps> = ({
  onClose,
  onAddSkill
}) => {
  const [skillName, setSkillName] = useState('');
  const [sourceType, setSourceType] = useState('Portfolio');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [analyzing, setAnalyzing] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillName.trim()) return;

    setAnalyzing(true);
    setTimeout(() => {
      setAnalyzing(false);
      const newSkill: SkillItem = {
        id: `custom-${Date.now()}`,
        name: skillName,
        category: 'core',
        source: sourceType,
        description: notes || `Custom validated competency in ${skillName} backed by recent project experience.`,
        proficiencyLevel: 'Advanced',
        proficiencyPercent: 85,
        icon: Sparkles,
        color: '#8C3F96',
        evidence: [
          {
            sourceTitle: `${sourceType} Submission`,
            details: evidenceUrl ? `Extracted and parsed from ${evidenceUrl}` : 'Direct user submission with project proof',
            extractedDate: 'Just now',
            snippet: notes || `Demonstrated practical mastery of ${skillName}.`
          }
        ],
        marketImpact: {
          salaryBoost: '+25%',
          targetRoles: ['AI UX Architect', 'Product Specialist'],
          demandTrend: 'Rapidly Rising'
        },
        learningModules: [
          { title: `Advanced Mastery: ${skillName}`, duration: '35 mins', difficulty: 'Advanced' }
        ]
      };
      onAddSkill(newSkill);
      onClose();
    }, 1200);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50"
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-purple-100 overflow-hidden"
      >
        <div className="bg-[#261338] text-white p-6 relative">
          <button 
            onClick={onClose}
            className="absolute top-5 right-5 text-white/70 hover:text-white bg-white/10 p-1.5 rounded-full cursor-pointer"
          >
            <X size={18} />
          </button>
          <div className="flex items-center gap-2 text-[#F05A7E] text-[10px] font-bold uppercase tracking-wider mb-1">
            <Sparkles size={12} />
            AI Competency Extractor
          </div>
          <h3 className="text-xl font-bold text-white">Add New Skill for AI Validation</h3>
          <p className="text-xs text-purple-200/80 mt-1">
            Submit a skill or evidence link to map it into your career discovery profile.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Skill or Competency Name</label>
            <input 
              type="text" 
              placeholder="e.g. Design Systems Architecture, LLM Prompt UX"
              value={skillName}
              onChange={(e) => setSkillName(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:border-[#8C3F96] focus:ring-2 focus:ring-purple-100 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Evidence Source</label>
            <div className="grid grid-cols-3 gap-2">
              {['Portfolio', 'GitHub', 'Resume', 'Figma', 'Cert'].map((src) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setSourceType(src)}
                  className={`py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                    sourceType === src 
                      ? 'bg-[#2D1B4E] text-white border-[#2D1B4E]' 
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {src}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Link or Artifact URL (Optional)</label>
            <div className="relative">
              <LinkIcon size={14} className="absolute left-3.5 top-3 text-gray-400" />
              <input 
                type="url" 
                placeholder="https://github.com/... or https://figma.com/..."
                value={evidenceUrl}
                onChange={(e) => setEvidenceUrl(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:border-[#8C3F96] outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Notes / Context (Optional)</label>
            <textarea 
              placeholder="Briefly describe your project role or how you applied this skill..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:border-[#8C3F96] outline-none transition-all resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button 
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={analyzing}
              className="bg-[#2D1B4E] hover:bg-[#431F69] disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {analyzing ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Analyzing with AI...</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  <span>Extract & Validate</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default AddCustomSkillModal;
