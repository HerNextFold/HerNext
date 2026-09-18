import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  X, 
  Sparkles, 
  CheckCircle2, 
  Calendar, 
  Clock, 
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RoadmapConfirmationModalProps {
  skillName: string;
  onClose: () => void;
  onConfirm: (config: { weeklyHours: number; targetWeeks: number }) => void;
}

export const RoadmapConfirmationModal: React.FC<RoadmapConfirmationModalProps> = ({
  skillName,
  onClose,
  onConfirm
}) => {
  const navigate = useNavigate();
  const [weeklyHours, setWeeklyHours] = useState(3);
  const [targetWeeks, setTargetWeeks] = useState(4);
  const [isAdded, setIsAdded] = useState(false);

  const handleAdd = () => {
    setIsAdded(true);
    onConfirm({ weeklyHours, targetWeeks });
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
        className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-purple-100 overflow-hidden"
      >
        {!isAdded ? (
          <>
            {/* Header */}
            <div className="bg-gradient-to-br from-[#FAF0E6] via-[#FFF5ED] to-[#FAF0E6] p-6 border-b border-[#FBE3D6] relative">
              <button 
                onClick={onClose}
                className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 bg-white/60 p-1.5 rounded-full cursor-pointer"
              >
                <X size={18} />
              </button>
              <div className="flex items-center gap-2 text-[#9E4733] font-bold text-[10px] uppercase tracking-wider mb-2">
                <Sparkles size={13} />
                Add Competency to Roadmap
              </div>
              <h3 className="text-xl font-black text-[#2D1B4E]">
                {skillName}
              </h3>
              <p className="text-xs text-gray-600 mt-1">
                Configure your personalized learning pace to master this high-impact skill.
              </p>
            </div>

            {/* Form */}
            <div className="p-6 space-y-5">
              {/* Weekly Time Commitment */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <Clock size={14} className="text-[#8C3F96]" /> Weekly Commitment
                  </label>
                  <span className="text-xs font-black text-[#8C3F96] bg-purple-50 px-2.5 py-0.5 rounded-full">
                    {weeklyHours} hrs / week
                  </span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="8" 
                  value={weeklyHours}
                  onChange={(e) => setWeeklyHours(Number(e.target.value))}
                  className="w-full accent-[#8C3F96] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                  <span>1 hr (Micro-habit)</span>
                  <span>4 hrs (Balanced)</span>
                  <span>8 hrs (Accelerated)</span>
                </div>
              </div>

              {/* Target Weeks */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <Calendar size={14} className="text-[#8C3F96]" /> Target Completion
                  </label>
                  <span className="text-xs font-black text-[#2D1B4E] bg-gray-100 px-2.5 py-0.5 rounded-full">
                    {targetWeeks} Weeks
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[2, 4, 8].map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setTargetWeeks(w)}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        targetWeeks === w 
                          ? 'bg-[#2D1B4E] text-white border-[#2D1B4E] shadow-sm' 
                          : 'bg-white text-gray-700 border-gray-200 hover:border-purple-200'
                      }`}
                    >
                      {w} Weeks
                    </button>
                  ))}
                </div>
              </div>

              {/* Roadmap Milestones Preview */}
              <div className="bg-purple-50/50 rounded-2xl p-4 border border-purple-100 space-y-2.5">
                <span className="text-[10px] font-bold text-purple-900 uppercase tracking-wider block">
                  Automated Curriculum Milestones
                </span>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-gray-700">
                    <span className="w-5 h-5 rounded-full bg-purple-200/80 text-purple-900 font-bold text-[10px] flex items-center justify-center">1</span>
                    <span>Core Foundations & AI Mental Models (Week 1-2)</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <span className="w-5 h-5 rounded-full bg-purple-200/80 text-purple-900 font-bold text-[10px] flex items-center justify-center">2</span>
                    <span>Hands-on Case Study Simulation (Week 3)</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <span className="w-5 h-5 rounded-full bg-purple-200/80 text-purple-900 font-bold text-[10px] flex items-center justify-center">3</span>
                    <span>Portfolio AI Badge Assessment (Week 4)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2.5">
              <button 
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-200/60 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleAdd}
                className="bg-[#9E4733] hover:bg-[#863b2a] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles size={14} />
                Confirm & Add to Roadmap
              </button>
            </div>
          </>
        ) : (
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-xl font-black text-[#2D1B4E]">
              Added to Your Learning Roadmap!
            </h3>
            <p className="text-xs text-gray-600 max-w-sm mx-auto leading-relaxed">
              <strong>{skillName}</strong> has been scheduled into your 90-day trajectory. Your estimated role match score will increase to <strong>94%</strong> upon completion.
            </p>

            <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100 text-left max-w-sm mx-auto space-y-1.5 text-xs text-purple-950">
              <div className="flex justify-between font-semibold">
                <span>Pace:</span>
                <span className="text-[#8C3F96] font-bold">{weeklyHours} hrs / week</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Target Completion:</span>
                <span className="text-[#8C3F96] font-bold">{targetWeeks} Weeks</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Continue Exploring Skills
              </button>
              <button
                onClick={() => {
                  onClose();
                  navigate('/dashboard/insights');
                }}
                className="w-full sm:w-auto px-5 py-2.5 bg-[#2D1B4E] hover:bg-[#431F69] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>View My Trajectory</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default RoadmapConfirmationModal;
