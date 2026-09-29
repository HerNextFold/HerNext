import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  X, 
  Sparkles, 
  ArrowRight, 
  Lightbulb,
  Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getTransferableSkills, type TransferableSkill } from '../../lib/api';

interface SkillTransferModalProps {
  skillName: string;
  onClose: () => void;
}

export const SkillTransferModal: React.FC<SkillTransferModalProps> = ({
  skillName,
  onClose
}) => {
  const navigate = useNavigate();
  const [skills, setSkills] = useState<TransferableSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  // Transferability is derived by the backend (/ai/transferable-skills) from the
  // participant's own stored experience. No per-skill mapping dictionary and no
  // transferability percentages are hardcoded here.
  useEffect(() => {
    let active = true;

    getTransferableSkills()
      .then((data) => {
        if (active) setSkills(data.skills ?? []);
      })
      .catch(() => {
        if (active) setLoadError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const match =
    skills.find(
      (s) => s.skillName && s.skillName.toLowerCase() === skillName.trim().toLowerCase()
    ) ?? null;

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
          <div className="inline-flex items-center gap-1.5 bg-[#F05A7E]/20 text-[#F05A7E] border border-[#F05A7E]/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2">
            <Sparkles size={11} />
            Transferable Skill Analysis
          </div>
          <h3 className="text-xl font-bold text-white mb-1">
            {skillName}
          </h3>
          <p className="text-[10px] text-purple-200/70">
            Derived by the HerNext backend from your stored experience records.
          </p>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {loading && (
            <div className="flex items-center gap-2 text-gray-400">
              <Loader2 size={14} className="animate-spin" /> Loading transferability...
            </div>
          )}

          {!loading && loadError && (
            <p className="text-gray-400">
              We could not load your transferable skills. Try again once your profile is synced.
            </p>
          )}

          {!loading && !loadError && skills.length === 0 && (
            <p className="text-gray-400">
              No transferable skills have been derived for your profile yet. Add experience records to generate them.
            </p>
          )}

          {!loading && !loadError && skills.length > 0 && !match && (
            <div className="space-y-2">
              <p className="text-gray-500">
                The backend did not flag &quot;{skillName}&quot; as transferable. Your derived transferable skills are listed below.
              </p>
              <ul className="space-y-1.5">
                {skills.map((s, i) => (
                  <li key={s.skillId || i} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="font-semibold text-[#2D1B4E]">{s.skillName ?? 'Unnamed skill'}</span>
                    <p className="text-[10px] text-gray-500 mt-0.5">{s.reason}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!loading && !loadError && match && (
            <div className="space-y-2">
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 space-y-1">
                <span className="text-[10px] font-bold text-[#8C3F96] uppercase block">
                  Why the backend flagged this as transferable:
                </span>
                <p className="text-purple-950 font-medium">{match.reason}</p>
                <span className="text-[10px] text-purple-600 block">
                  Model confidence: {match.confidence}
                </span>
              </div>

              <div className="p-3.5 bg-amber-50/80 rounded-2xl border border-amber-200/80 flex items-start gap-2.5 text-amber-900">
                <Lightbulb size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  <strong>Note:</strong> This is an AI-inferred assessment, not a verified certification or employer record.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-200 rounded-xl cursor-pointer"
          >
            Close
          </button>
          <button 
            onClick={() => {
              onClose();
              navigate('/dashboard/skills');
            }}
            className="bg-[#2D1B4E] hover:bg-[#431F69] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>View in My Skills</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SkillTransferModal;
