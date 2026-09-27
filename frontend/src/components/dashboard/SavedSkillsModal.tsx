import React from 'react';
import { motion } from 'motion/react';
import { 
  X, 
  Bookmark, 
  Trash2, 
  ArrowRight
} from 'lucide-react';
import type { SkillItem } from './SkillDetailModal';

interface SavedSkillsModalProps {
  savedSkills: SkillItem[];
  onClose: () => void;
  onSelectSkill: (skill: SkillItem) => void;
  onRemoveSkill: (skillId: string) => void;
}

export const SavedSkillsModal: React.FC<SavedSkillsModalProps> = ({
  savedSkills,
  onClose,
  onSelectSkill,
  onRemoveSkill
}) => {
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
        <div className="bg-[#261338] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-[#F05A7E] flex items-center justify-center">
              <Bookmark size={16} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Saved Competencies</h3>
              <p className="text-[10px] text-purple-200/70">{savedSkills.length} bookmarked for review</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-white/60 hover:text-white p-1.5 rounded-full hover:bg-white/10"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 max-h-96 overflow-y-auto space-y-2.5">
          {savedSkills.length === 0 ? (
            <div className="py-8 text-center text-gray-400 space-y-2">
              <Bookmark size={28} className="mx-auto text-gray-300" />
              <p className="text-xs">No saved skills yet.</p>
              <p className="text-[10px] text-gray-400">Click the bookmark icon on any skill card to save it here.</p>
            </div>
          ) : (
            savedSkills.map((skill) => (
              <div 
                key={skill.id}
                className="flex items-center justify-between p-3.5 bg-gray-50 hover:bg-purple-50/60 rounded-2xl border border-gray-100 transition-colors"
              >
                <div 
                  onClick={() => {
                    onSelectSkill(skill);
                    onClose();
                  }}
                  className="cursor-pointer flex-1 mr-2"
                >
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-[#2D1B4E] hover:text-[#8C3F96] transition-colors">{skill.name}</h4>
                    <span className="text-[9px] font-semibold bg-purple-100 text-[#8C3F96] px-1.5 py-0.2 rounded-full">
                      {skill.proficiencyLevel}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 line-clamp-1 mt-0.5">{skill.description}</p>
                </div>

                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => {
                      onSelectSkill(skill);
                      onClose();
                    }}
                    className="p-1.5 text-[#8C3F96] hover:bg-purple-100 rounded-lg transition-colors cursor-pointer"
                    title="View details"
                  >
                    <ArrowRight size={14} />
                  </button>
                  <button 
                    onClick={() => onRemoveSkill(skill.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Remove from saved"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-100 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-semibold rounded-xl cursor-pointer"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SavedSkillsModal;
