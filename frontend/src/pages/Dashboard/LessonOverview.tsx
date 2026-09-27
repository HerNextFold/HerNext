import React from 'react';
import { motion } from 'motion/react';
import { 
  ArrowRight, 
  ArrowLeft, 
  Clock, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  Layers
} from 'lucide-react';
import PurpleBackgroundDots from '../../components/dashboard/PurpleBackgroundDots';
import { useNavigate } from 'react-router-dom';

export const LessonOverview: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen">
      {/* Background Particles */}
      <PurpleBackgroundDots dotCount={35} />

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-5xl mx-auto space-y-6 pb-24 pt-2 font-sans text-gray-800 relative z-10"
      >
        {/* Top Breadcrumb & Metadata Navigation Strip matching Screenshot 1 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-gray-500 font-medium">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => navigate('/dashboard/roadmap')}
              className="text-[#8C3F96] hover:text-[#5B2975] font-bold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <ArrowLeft size={14} />
              <span>Back to Career Roadmap</span>
            </button>
            <span className="text-gray-300">|</span>
            <span className="text-gray-400">Career Path</span>
            <span className="text-gray-300">›</span>
            <span className="text-gray-400">Career Roadmap</span>
            <span className="text-gray-300">›</span>
            <span className="text-[#2D1B4E] font-bold">Learning</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 font-medium">Lesson Progress: <strong className="text-[#2D1B4E]">0% complete</strong></span>
            <span className="inline-flex items-center gap-1 bg-purple-50 text-[#8C3F96] text-[11px] font-bold px-2.5 py-1 rounded-full border border-purple-100">
              <Clock size={12} /> 15 min
            </span>
          </div>
        </div>

        {/* Module Subtitle Pill matching Screenshot 1 */}
        <div className="space-y-3 pt-2">
          <div className="inline-flex items-center gap-1.5 bg-[#FDF2F5] text-[#F05A7E] px-3.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
            <span>HERNEXT FOUNDATION MODULE · DAY 12 OF 30</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-[#2D1B4E] tracking-tight leading-tight">
            AI Fundamentals for Product Designers
          </h1>

          <p className="text-xs sm:text-sm text-gray-600 max-w-3xl leading-relaxed">
            Build the AI knowledge you need to make smarter product decisions and stay valuable as AI changes the way designers work.
          </p>
        </div>

        {/* Main Hero Overview Card matching Screenshot 1 */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-purple-100/80 shadow-xs space-y-7">
          
          {/* Content & Image Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-7 items-start">
            
            {/* Left Image Box */}
            <div className="md:col-span-5 relative group overflow-hidden rounded-2xl border border-purple-100/80 shadow-xs">
              <img 
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800" 
                alt="AI Product Designer" 
                className="w-full h-72 object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-4">
                <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl text-[11px] font-bold text-[#2D1B4E] flex items-center gap-1.5">
                  <Sparkles size={13} className="text-[#8C3F96]" /> Core Foundation Module
                </div>
              </div>
            </div>

            {/* Right Text Content */}
            <div className="md:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-1 text-[10px] font-extrabold text-[#9E4733] uppercase tracking-wider">
                <span>YOUR NEXT SKILL</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-extrabold text-[#2D1B4E]">
                AI Fundamentals for Product Designers
              </h2>

              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Understand how AI is changing product design, where designers create the most human value, and how to use AI responsibly in your day-to-day workflow.
              </p>

              {/* Bullet Points Section matching Screenshot 1 */}
              <div className="space-y-2.5 pt-2">
                <h4 className="text-xs font-extrabold text-[#2D1B4E] uppercase tracking-wider">
                  WHAT YOU'LL LEARN IN THIS LESSON
                </h4>

                <div className="space-y-2">
                  {[
                    "Understand the fundamentals of AI and modern machine learning concepts without reading code.",
                    "See how AI is changing product design across user research, prototyping, and feature architecture.",
                    "Identify where human designers add value through empathy, ethical framing, and strategic intuition.",
                    "Apply AI responsibly in product decisions while avoiding bias, hallucination, and dark patterns."
                  ].map((bullet, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-gray-700">
                      <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                      <span className="leading-relaxed font-medium">{bullet}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* Stats Bar matching Screenshot 1 */}
          <div className="grid grid-cols-3 gap-4 bg-[#FAF8FC] border border-purple-100/70 rounded-2xl p-4 text-center">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">EST. TIME</span>
              <span className="text-xs sm:text-sm font-extrabold text-[#2D1B4E] flex items-center justify-center gap-1">
                <Clock size={14} className="text-[#8C3F96]" /> 15 min
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">DIFFICULTY</span>
              <span className="text-xs sm:text-sm font-extrabold text-[#2D1B4E] flex items-center justify-center gap-1">
                <Zap size={14} className="text-[#9E4733]" /> Beginner
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">STRUCTURE</span>
              <span className="text-xs sm:text-sm font-extrabold text-[#2D1B4E] flex items-center justify-center gap-1">
                <Layers size={14} className="text-[#F05A7E]" /> 4 Lessons
              </span>
            </div>
          </div>

          {/* Why this matters Quote Box matching Screenshot 1 */}
          <div className="bg-[#FAF8FC] border border-purple-100/80 rounded-2xl p-4 text-xs text-gray-600 leading-relaxed">
            <strong className="text-[#2D1B4E] font-bold block mb-1">Why this matters:</strong>
            AI is changing how product teams research, design, test, and build. Understanding where AI helps vs where human judgment matters will help you become a stronger, more adaptable product designer.
          </div>

          {/* Verified Competency Badge Box matching Screenshot 1 */}
          <div className="bg-[#FDF2F5]/80 border border-[#FDF2F5] rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#F05A7E]/15 text-[#F05A7E] flex items-center justify-center">
                <ShieldCheck size={20} />
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-[#F05A7E] uppercase tracking-wider block">VERIFIED COMPETENCY</span>
                <span className="text-xs font-bold text-[#2D1B4E]">AI Product Thinking</span>
              </div>
            </div>

            <span className="text-[11px] text-gray-500 font-medium">
              Added to Career Passport upon completion
            </span>
          </div>

          {/* Bottom Action Footer Strip matching Screenshot 1 */}
          <div className="pt-4 border-t border-purple-100/60 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <span className="text-xs font-bold text-[#2D1B4E] block">Ready to begin?</span>
              <span className="text-[11px] text-gray-500 font-medium">You can complete this lesson in about 15 minutes.</span>
            </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/dashboard/roadmap')}
                className="text-xs font-bold text-gray-500 hover:text-[#2D1B4E] transition-colors cursor-pointer"
              >
                ‹ Back to Career Roadmap
              </button>

              <motion.button 
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/dashboard/roadmap/learn')}
                className="bg-[#2D1B4E] hover:bg-[#431F69] text-white font-bold text-xs px-7 py-3.5 rounded-2xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Start Lesson</span>
                <ArrowRight size={15} />
              </motion.button>
            </div>
          </div>

        </div>
      </motion.div>
    </div>
  );
};

export default LessonOverview;
