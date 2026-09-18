import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  FileText, 
  Search, 
  Settings2, 
  Image, 
  Users, 
  Lightbulb, 
  Compass, 
  ArrowRight, 
  TrendingUp, 
  Sparkles
} from 'lucide-react';
import { useUserContext } from '../../context/UserContext';

const CareerAssessment: React.FC = () => {
  const navigate = useNavigate();
  const { user, onboarding } = useUserContext();

  const container: any = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item: any = {
    hidden: { opacity: 0, y: 25 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="max-w-5xl mx-auto space-y-10 pb-20 pt-2 font-sans text-gray-800"
    >
      {/* Header Section */}
      <motion.div variants={item} className="space-y-4">
        <div className="inline-flex items-center gap-2 bg-purple-100 text-[#8C3F96] px-3.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
          <Sparkles size={12} className="text-[#F05A7E]" /> HerNext AI Career Assessment
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-[#2D1B4E] leading-tight tracking-tight">
          Your career,<br/>understood differently.
        </h1>
        <p className="text-gray-600 text-xs md:text-sm max-w-2xl leading-relaxed">
          We've analyzed your experience through the lens of emerging AI trends. This isn't just about what you've done—it's about where your unique human perspective is most valuable next.
        </p>
        <div className="inline-flex items-center gap-3.5 bg-white/90 backdrop-blur-md border border-purple-100 rounded-2xl p-2.5 px-4 shadow-xs">
          <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-purple-200">
            <img src={user.avatar} alt={user.fullName} className="w-full h-full object-cover" />
          </div>
          <div>
            <h3 className="font-bold text-[#2D1B4E] text-xs md:text-sm">{user.fullName}</h3>
            <p className="text-[10px] text-gray-500">{onboarding.currentRole} • {onboarding.yearsOfExperience}</p>
          </div>
        </div>
      </motion.div>

      {/* AI Evolution Index & Insights */}
      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 md:p-8 shadow-xs border border-purple-100 flex flex-col sm:flex-row items-center gap-6">
           <div className="relative w-32 h-32 flex-shrink-0">
             <svg className="w-full h-full transform -rotate-90">
               <circle cx="64" cy="64" r="54" fill="transparent" stroke="#F4EFF7" strokeWidth="12" />
               <motion.circle 
                 initial={{ strokeDashoffset: 339.29 }}
                 animate={{ strokeDashoffset: 339.29 - (339.29 * 42) / 100 }}
                 transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
                 cx="64" cy="64" r="54" fill="transparent" stroke="#8C3F96" strokeWidth="12" strokeDasharray="339.29" 
                 strokeLinecap="round"
               />
             </svg>
             <div className="absolute inset-0 flex items-center justify-center">
               <span className="text-3xl font-black text-[#2D1B4E]">42%</span>
             </div>
           </div>
           <div>
             <div className="inline-block bg-purple-50 text-[#8C3F96] px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2">
               Moderate Task Impact
             </div>
             <h3 className="text-lg font-bold text-[#2D1B4E] mb-1.5">AI Evolution Index</h3>
             <p className="text-xs text-gray-500 leading-relaxed">
               Approximately 42% of routine tasks in your current role as a UI/UX Designer are likely to be automated or heavily augmented by AI in the next 3-5 years. This creates significant space to elevate your strategic value.
             </p>
           </div>
        </div>

        <div className="bg-gradient-to-br from-[#FFF4EE] to-[#FFF9F5] rounded-3xl p-6 md:p-8 border border-[#FBE3D6] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-[#D47B5A] mb-3">
               <TrendingUp size={16} />
               <span className="text-[10px] font-bold uppercase tracking-widest">HerNext Strategic Insight</span>
            </div>
            <p className="text-xs md:text-sm text-gray-700 leading-relaxed font-medium">
               Your deep experience in user empathy and complex problem framing positions you perfectly for the transition from hands-on asset creation to AI-augmented strategic product design.
            </p>
          </div>

          <div className="pt-4 mt-4 border-t border-[#F5D8C7] flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-500">Human Value Multiplier</span>
            <span className="text-xs font-black text-[#D47B5A]">+3.2x vs Baseline</span>
          </div>
        </div>
      </motion.div>

      {/* Breakdown Grid */}
      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-4">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-[#2D1B4E]">What AI may automate</h2>
            <p className="text-xs text-gray-500">Tasks shifting rapidly towards AI assistance.</p>
          </div>
          
          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 md:p-5 border border-purple-100/70 shadow-xs flex gap-4 items-start">
             <div className="bg-purple-50 p-2.5 rounded-xl text-[#8C3F96] shrink-0"><Settings2 size={18} /></div>
             <div>
               <h4 className="text-xs md:text-sm font-bold text-gray-800 mb-0.5">Routine Design Variations</h4>
               <p className="text-[11px] text-gray-500 leading-relaxed">Generating multiple layout options for standard UI patterns.</p>
             </div>
          </div>
          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 md:p-5 border border-purple-100/70 shadow-xs flex gap-4 items-start">
             <div className="bg-purple-50 p-2.5 rounded-xl text-[#8C3F96] shrink-0"><FileText size={18} /></div>
             <div>
               <h4 className="text-xs md:text-sm font-bold text-gray-800 mb-0.5">Basic Documentation</h4>
               <p className="text-[11px] text-gray-500 leading-relaxed">Automated handoff specs and standard component documentation.</p>
             </div>
          </div>
          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 md:p-5 border border-purple-100/70 shadow-xs flex gap-4 items-start">
             <div className="bg-purple-50 p-2.5 rounded-xl text-[#8C3F96] shrink-0"><Image size={18} /></div>
             <div>
               <h4 className="text-xs md:text-sm font-bold text-gray-800 mb-0.5">Simple Asset Production</h4>
               <p className="text-[11px] text-gray-500 leading-relaxed">Resizing, basic icon generation, and standard image processing.</p>
             </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-[#2D1B4E]">Where AI can make you stronger</h2>
            <p className="text-xs text-gray-500">High-leverage areas where AI acts as a multiplier.</p>
          </div>

          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 md:p-5 border border-purple-100/70 shadow-xs flex gap-4 items-start">
             <div className="bg-purple-50 p-2.5 rounded-xl text-[#8C3F96] shrink-0"><Search size={18} /></div>
             <div>
               <h4 className="text-xs md:text-sm font-bold text-gray-800 mb-0.5">User Research Synthesis</h4>
               <p className="text-[11px] text-gray-500 leading-relaxed">Rapidly identifying patterns across large qualitative datasets.</p>
             </div>
          </div>
          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 md:p-5 border border-purple-100/70 shadow-xs flex gap-4 items-start">
             <div className="bg-purple-50 p-2.5 rounded-xl text-[#8C3F96] shrink-0"><Compass size={18} /></div>
             <div>
               <h4 className="text-xs md:text-sm font-bold text-gray-800 mb-0.5">Design Exploration</h4>
               <p className="text-[11px] text-gray-500 leading-relaxed">Exploring divergent concepts faster before converging on solutions.</p>
             </div>
          </div>
          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 md:p-5 border border-purple-100/70 shadow-xs flex gap-4 items-start">
             <div className="bg-purple-50 p-2.5 rounded-xl text-[#8C3F96] shrink-0"><Settings2 size={18} /></div>
             <div>
               <h4 className="text-xs md:text-sm font-bold text-gray-800 mb-0.5">Prototyping Fidelity</h4>
               <p className="text-[11px] text-gray-500 leading-relaxed">Moving from low to high-fidelity interactions with greater speed.</p>
             </div>
          </div>
        </div>
      </motion.div>

      {/* What remains distinctly human */}
      <motion.div variants={item} className="pt-6 text-center">
        <h2 className="text-2xl font-black text-[#2D1B4E] mb-2">What remains distinctly human</h2>
        <p className="text-xs text-gray-500 max-w-2xl mx-auto mb-8">
          These are your enduring anchors. As technical tasks automate, these uniquely human capabilities become your primary differentiator and most valuable asset.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {[
            { label: 'Empathy', icon: Users },
            { label: 'Problem Framing', icon: Lightbulb },
            { label: 'Design Judgment', icon: Compass },
            { label: 'Communication', icon: FileText },
            { label: 'Collaboration', icon: Users },
            { label: 'Strategic Sense', icon: Search }
          ].map((cap) => {
            const Icon = cap.icon;
            return (
              <motion.div 
                key={cap.label}
                whileHover={{ y: -4 }}
                className="bg-white rounded-2xl py-6 px-3 shadow-xs border border-purple-50 flex flex-col items-center justify-center transition-all"
              >
                <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-[#8C3F96] mb-2">
                  <Icon size={18} />
                </div>
                <span className="text-xs font-bold text-gray-800">{cap.label}</span>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Career Paths */}
      <motion.div variants={item} className="pt-4">
        <h2 className="text-2xl font-black text-[#2D1B4E] mb-6">Where could these skills take you?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#FFF4EE] border-2 border-[#D47B5A] rounded-3xl p-6 relative flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-1 bg-[#D47B5A] text-white text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider mb-4">
                <Search size={10} /> Recommended Fit
              </div>
              <div className="flex justify-between items-start mb-2">
                 <h3 className="text-lg font-bold text-[#2D1B4E] leading-tight">AI Product Designer</h3>
                 <span className="text-2xl font-black text-[#D47B5A]">91%</span>
              </div>
              <p className="text-xs text-gray-700 leading-relaxed mb-6">
                 Blends core UX principles with an understanding of AI models to design conversational, generative, or predictive features.
              </p>
            </div>
            <button 
              onClick={() => navigate('/dashboard/skills')}
              className="w-full bg-[#D47B5A] hover:bg-[#c26d4d] text-white font-bold text-xs py-2.5 rounded-xl transition-colors shadow-sm cursor-pointer"
            >
               Explore Required Skills →
            </button>
          </div>

          <div className="bg-white/90 backdrop-blur-md border border-purple-100 shadow-xs rounded-3xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-2">
                 <h3 className="text-lg font-bold text-[#2D1B4E] leading-tight">Lead UX Strategist</h3>
                 <span className="text-2xl font-bold text-[#2D1B4E]">88%</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed mb-6">
                 A natural evolution of your current role, moving further up the strategic ladder with AI acting as a supporting tool.
              </p>
            </div>
            <button 
              onClick={() => navigate('/dashboard/skills')}
              className="w-full bg-purple-50 hover:bg-purple-100 text-[#2D1B4E] font-bold text-xs py-2.5 rounded-xl transition-colors cursor-pointer"
            >
               View Skill Matrix
            </button>
          </div>

          <div className="bg-white/90 backdrop-blur-md border border-purple-100 shadow-xs rounded-3xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-2">
                 <h3 className="text-lg font-bold text-[#2D1B4E] leading-tight">AI UX Researcher</h3>
                 <span className="text-2xl font-bold text-[#2D1B4E]">81%</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed mb-6">
                 Focuses heavily on human-AI interaction, understanding mental models around trust, bias, and automation.
              </p>
            </div>
            <button 
              onClick={() => navigate('/dashboard/skills')}
              className="w-full bg-purple-50 hover:bg-purple-100 text-[#2D1B4E] font-bold text-xs py-2.5 rounded-xl transition-colors cursor-pointer"
            >
               View Skill Matrix
            </button>
          </div>
        </div>
      </motion.div>

      {/* Personalized Roadmap Callout */}
      <motion.div variants={item} className="bg-gradient-to-r from-[#261338] via-[#431D54] to-[#612A76] rounded-3xl p-8 md:p-10 text-white flex flex-col md:flex-row items-center justify-between shadow-xl gap-8">
         <div className="md:w-1/2 space-y-3">
           <span className="text-[10px] font-bold tracking-widest uppercase bg-white/10 text-purple-200 px-3 py-1 rounded-full border border-white/10">
             Personalized 90-Day Execution
           </span>
           <h2 className="text-2xl md:text-3xl font-black leading-tight">Start your tailored AI development roadmap</h2>
           <p className="text-xs text-purple-200/80 leading-relaxed">
             We've structured a milestone path focusing on AI Product Thinking, prompt systems, and generative UI patterns specifically for your background.
           </p>
           <motion.button 
             whileHover={{ scale: 1.05 }}
             whileTap={{ scale: 0.95 }}
             onClick={() => navigate('/dashboard/skills')}
             className="bg-[#D47B5A] hover:bg-[#c26d4d] text-white font-bold px-6 py-3 rounded-xl transition-all flex items-center gap-2 text-xs shadow-lg cursor-pointer pt-2"
           >
             <span>View My Skill Gaps</span>
             <ArrowRight size={15} />
           </motion.button>
         </div>
         
         <div className="md:w-5/12 w-full bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/15 shadow-inner">
           <div className="flex justify-between items-center mb-5">
              <span className="text-[10px] font-bold text-purple-200 uppercase tracking-wider">Milestone Progress</span>
              <Settings2 size={16} className="text-purple-300" />
           </div>
           <div className="space-y-4">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-xl bg-[#D47B5A] text-white flex items-center justify-center text-xs font-bold shrink-0">M1</div>
                 <div className="flex-1">
                   <div className="flex justify-between text-[11px] mb-1">
                     <span className="font-semibold text-white">Foundations</span>
                     <span className="font-bold text-[#FF9E79]">85%</span>
                   </div>
                   <div className="h-2 bg-black/30 w-full rounded-full overflow-hidden">
                     <div className="h-full bg-[#D47B5A] w-[85%] rounded-full"></div>
                   </div>
                 </div>
              </div>
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-xl bg-white/10 text-white/70 flex items-center justify-center text-xs font-bold shrink-0">M2</div>
                 <div className="flex-1">
                   <div className="flex justify-between text-[11px] mb-1">
                     <span className="font-semibold text-white">Applied Prototyping</span>
                     <span className="font-bold text-white/60">30%</span>
                   </div>
                   <div className="h-2 bg-black/30 w-full rounded-full overflow-hidden">
                     <div className="h-full bg-white/40 w-[30%] rounded-full"></div>
                   </div>
                 </div>
              </div>
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-xl bg-white/10 text-white/50 flex items-center justify-center text-xs font-bold shrink-0">M3</div>
                 <div className="flex-1">
                   <div className="flex justify-between text-[11px] mb-1">
                     <span className="font-semibold text-white/60">Executive Polish</span>
                     <span className="font-bold text-white/40">0%</span>
                   </div>
                   <div className="h-2 bg-black/30 w-full rounded-full overflow-hidden">
                     <div className="h-full bg-white/20 w-[0%] rounded-full"></div>
                   </div>
                 </div>
              </div>
           </div>
         </div>
      </motion.div>
    </motion.div>
  );
};

export default CareerAssessment;
