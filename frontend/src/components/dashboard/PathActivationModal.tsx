import React from 'react';
import { motion } from 'motion/react';
import { 
  X, 
  Sparkles, 
  ArrowRight, 
  Rocket, 
  BookOpen
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PathActivationModalProps {
  roleTitle: string;
  matchScore: string;
  onClose: () => void;
}

export const PathActivationModal: React.FC<PathActivationModalProps> = ({
  roleTitle,
  matchScore,
  onClose
}) => {
  const navigate = useNavigate();

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
        className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-purple-100 overflow-hidden my-6"
      >
        {/* Header with celebratory gradient */}
        <div className="bg-gradient-to-r from-[#2D1B4E] via-[#431F69] to-[#2D1B4E] p-6 text-white text-center relative">
          <button 
            onClick={onClose}
            className="absolute top-5 right-5 text-white/70 hover:text-white bg-white/10 p-2 rounded-full cursor-pointer"
          >
            <X size={18} />
          </button>

          <div className="w-16 h-16 bg-gradient-to-tr from-[#F05A7E] to-[#9B51E0] rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-pink-500/30">
            <Rocket size={32} className="text-white" />
          </div>

          <div className="inline-flex items-center gap-1.5 bg-[#F05A7E]/20 text-[#F05A7E] border border-[#F05A7E]/30 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2">
            <Sparkles size={11} />
            Career Pathway Activated
          </div>

          <h3 className="text-2xl font-black tracking-tight text-white mb-1">
            {roleTitle} Path Selected!
          </h3>

          <p className="text-xs text-purple-200/80 max-w-xs mx-auto">
            Your background gives you a strong <strong>{matchScore} Match Score</strong> foundation.
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-[#2D1B4E]">
              <span>Estimated Transition Timeframe:</span>
              <span className="text-[#8C3F96] bg-white px-2.5 py-0.5 rounded-full border border-purple-200">
                90-Day Trajectory
              </span>
            </div>
            <p className="text-[11px] text-gray-600 leading-relaxed">
              We have generated your customized learning timeline based on your 4 years of UI/UX experience and identified skill gaps.
            </p>
          </div>

          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Your 3-Phase Acceleration Plan
          </h4>

          <div className="space-y-2.5">
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs">
              <span className="w-6 h-6 rounded-full bg-purple-100 text-[#8C3F96] font-bold flex items-center justify-center shrink-0">1</span>
              <div>
                <span className="font-bold text-[#2D1B4E] block">Phase 1: Core AI Foundations (Month 1)</span>
                <span className="text-[11px] text-gray-500">LLM mental models, prompt engineering, and probability UX.</span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs">
              <span className="w-6 h-6 rounded-full bg-purple-100 text-[#8C3F96] font-bold flex items-center justify-center shrink-0">2</span>
              <div>
                <span className="font-bold text-[#2D1B4E] block">Phase 2: Live AI Case Study (Month 2)</span>
                <span className="text-[11px] text-gray-500">Build an interactive agentic interface case study for your portfolio.</span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs">
              <span className="w-6 h-6 rounded-full bg-purple-100 text-[#8C3F96] font-bold flex items-center justify-center shrink-0">3</span>
              <div>
                <span className="font-bold text-[#2D1B4E] block">Phase 3: Executive Mentorship & Portfolio Badge (Month 3)</span>
                <span className="text-[11px] text-gray-500">Review deliverables with senior female AI design directors.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-end gap-2">
          <button 
            onClick={() => {
              onClose();
              navigate('/dashboard/skills');
            }}
            className="w-full sm:w-auto px-4 py-2.5 bg-white border border-gray-200 hover:border-purple-300 text-gray-700 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <BookOpen size={14} className="text-[#8C3F96]" />
            <span>Explore Skills Needed</span>
          </button>

          <button 
            onClick={() => {
              onClose();
              navigate('/dashboard/insights');
            }}
            className="w-full sm:w-auto px-5 py-2.5 bg-[#2D1B4E] hover:bg-[#431F69] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>View Career Insights</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PathActivationModal;
