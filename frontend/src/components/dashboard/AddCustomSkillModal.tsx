import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  X, 
  Sparkles, 
  Link as LinkIcon 
} from 'lucide-react';
import type { SkillItem } from './SkillDetailModal';

interface AddCustomSkillModalProps {
  onClose: () => void;
  /**
   * Persists the skill and resolves once the save has been accepted.
   *
   * Only the trimmed name is persisted. Evidence and notes are recorded on the
   * participant's claim, but HerNext has no store for them, so they are not
   * sent or pretended to be saved.
   */
  onAddSkill: (newSkill: SkillItem) => Promise<void> | void;
  /** Disables the submit button while a save is in flight. */
  isSaving?: boolean;
}

export const AddCustomSkillModal: React.FC<AddCustomSkillModalProps> = ({
  onClose,
  onAddSkill,
  isSaving = false
}) => {
  const [skillName, setSkillName] = useState('');
  const [sourceType, setSourceType] = useState('Portfolio');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [notes, setNotes] = useState('');

  // Only participant-supplied fields are recorded. HerNext has no scoring
  // endpoint for a self-declared skill, so proficiency, market impact and
  // learning modules stay unset instead of being invented here.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = skillName.trim();
    if (!name || isSaving) return;

    const newSkill: SkillItem = {
      id: `custom-${Date.now()}`,
      name,
      category: 'core',
      source: sourceType,
      description: notes.trim() || `Self-declared by the participant.`,
      icon: Sparkles,
      color: '#8C3F96',
      evidence: evidenceUrl.trim()
        ? [
            {
              sourceTitle: `${sourceType} link provided by participant`,
              details: 'Submitted by the participant. Not verified by HerNext.',
              extractedDate: 'Submitted just now',
              snippet: evidenceUrl.trim()
            }
          ]
        : [],
      learningModules: []
    };

    // Awaited so the modal stays open on a failed save instead of reporting
    // success for a skill that was never stored.
    await onAddSkill(newSkill);
    onClose();
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={isSaving ? undefined : onClose}
      className={`fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 ${isSaving ? '' : 'cursor-pointer'}`}
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
            Self-Reported Skill
          </div>
          <h3 className="text-xl font-bold text-white">Add a Skill to Your Profile</h3>
          <p className="text-xs text-purple-200/80 mt-1">
            Record a skill you already have, even if HerNext does not suggest it. It is saved to your profile as your own claim.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Skill or Competency Name</label>
            <input
              type="text"
              placeholder="e.g. Kubernetes, Technical Writing, CRM Administration"
              value={skillName}
              onChange={(e) => setSkillName(e.target.value)}
              required
              maxLength={120}
              disabled={isSaving}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:border-[#8C3F96] focus:ring-2 focus:ring-purple-100 outline-none transition-all disabled:opacity-60"
            />
            <p className="text-[10px] text-gray-400 font-medium mt-1">
              Anything you have that HerNext does not suggest yet. It is stored exactly as you type it.
            </p>
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
            <label className="block text-xs font-bold text-gray-700 mb-1">Link or Artifact URL (Optional, saved as provided)</label>
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
              disabled={isSaving}
              className="px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-100 disabled:opacity-50 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!skillName.trim() || isSaving}
              className="bg-[#2D1B4E] hover:bg-[#431F69] disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles size={14} />
              <span>{isSaving ? 'Saving...' : 'Save Skill'}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default AddCustomSkillModal;
