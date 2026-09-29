import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  X, 
  Sparkles, 
  Target, 
  Loader2,
  Info
} from 'lucide-react';
import { getCareerRecommendations, type CareerRecommendation } from '../../lib/api';

interface NewCareerPathModalProps {
  onClose: () => void;
  onSelectNewPath: (pathTitle: string, matchScore: string) => void;
}

export const NewCareerPathModal: React.FC<NewCareerPathModalProps> = ({
  onClose,
  onSelectNewPath
}) => {
  const [customRole, setCustomRole] = useState('');
  const [recommendations, setRecommendations] = useState<CareerRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Preset trajectories come from the participant's own backend recommendations
  // (/careers/recommendations), never from a hardcoded list with invented scores.
  useEffect(() => {
    let active = true;

    getCareerRecommendations(6)
      .then((data) => {
        if (active) setRecommendations(data.recommendations ?? []);
      })
      .catch(() => {
        if (active) setLoadError('We could not load your career matches.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const title = customRole.trim();
    if (!title) return;

    // No match score is claimed: HerNext has no endpoint to score a custom title.
    onSelectNewPath(title, 'Not scored');
    onClose();
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
        className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-purple-100 overflow-hidden my-6 text-gray-800"
      >
        <div className="bg-[#261338] text-white p-6 relative">
          <button 
            onClick={onClose}
            className="absolute top-5 right-5 text-white/70 hover:text-white bg-white/10 p-1.5 rounded-full cursor-pointer"
          >
            <X size={18} />
          </button>
          <div className="inline-flex items-center gap-1.5 bg-[#F05A7E]/20 text-[#F05A7E] border border-[#F05A7E]/30 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2">
            <Sparkles size={11} />
            HerNext Path Explorer
          </div>
          <h3 className="text-xl font-bold text-white mb-1">
            Explore a New Career Direction
          </h3>
          <p className="text-xs text-purple-200/80">
            Pick one of your scored matches, or enter a custom title to start a path without a match score.
          </p>
        </div>

        <div className="p-6 space-y-4">
          <form onSubmit={handleCustomSubmit} className="space-y-2">
            <label className="block text-xs font-bold text-gray-700">Enter Custom Target Role</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="e.g. AI Prompt UX Architect, Head of AI Product"
                value={customRole}
                onChange={(e) => setCustomRole(e.target.value)}
                className="flex-1 px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:border-[#8C3F96] outline-none"
              />
              <button 
                type="submit"
                disabled={!customRole.trim()}
                className="bg-[#2D1B4E] hover:bg-[#431F69] disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Target size={14} />
                <span>Use this title</span>
              </button>
            </div>
          </form>

          <div className="relative border-t border-gray-100 my-2 pt-2">
            <div className="flex items-start gap-1.5 mb-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Your Career Matches
              </span>
              <Info size={12} className="text-gray-400 shrink-0 mt-px" aria-label="Calculated by the HerNext backend from your profile" />
            </div>
            <p className="text-[10px] text-gray-400 mb-2">
              Calculated by the HerNext backend from your profile. Custom titles entered above are not scored.
            </p>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {loading && (
                <div className="flex items-center gap-2 p-3 text-xs text-gray-400">
                  <Loader2 size={14} className="animate-spin" /> Loading your matches...
                </div>
              )}

              {!loading && loadError && (
                <p className="p-3 text-xs text-gray-400">{loadError}</p>
              )}

              {!loading && !loadError && recommendations.length === 0 && (
                <p className="p-3 text-xs text-gray-400">
                  No career matches yet. Complete onboarding so the backend can score careers against your profile.
                </p>
              )}

              {!loading && !loadError && recommendations.map((rec) => (
                <div 
                  key={rec.careerId}
                  onClick={() => {
                    onSelectNewPath(rec.careerName, `${rec.matchScore}% match`);
                    onClose();
                  }}
                  className="p-3 bg-gray-50 hover:bg-purple-50/70 rounded-xl border border-gray-100 transition-colors cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex-1 mr-2">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-[#2D1B4E] group-hover:text-[#8C3F96] transition-colors">{rec.careerName}</h4>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100/60 px-2 py-0.2 rounded-full">
                        {rec.matchScore}% Match
                      </span>
                    </div>
                    {rec.reason && (
                      <p className="text-[10px] text-gray-500 line-clamp-2 mt-0.5">{rec.reason}</p>
                    )}
                  </div>
                  <Target size={15} className="text-gray-400 group-hover:text-[#8C3F96] shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-100 text-right">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-semibold rounded-xl cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default NewCareerPathModal;
