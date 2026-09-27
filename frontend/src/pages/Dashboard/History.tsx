import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Clock, Building2, Sparkles, ArrowRight, TrendingUp } from 'lucide-react';
import { useDashboardContext } from '../../context/DashboardContext';

const History: React.FC = () => {
  const navigate = useNavigate();
  const { setCareerData } = useDashboardContext();

  const mockHistory = [
    { 
      role: 'AI Product Designer', 
      company: 'Google', 
      date: 'Oct 12, 2026', 
      score: 78,
      delta: '+12% from previous',
      tags: ['Multimodal UI', 'Prompt Engineering', 'Design Systems'],
      salary: '$165,000/yr',
      status: 'Targeting Now'
    },
    { 
      role: 'Lead UX Strategist', 
      company: 'Spotify', 
      date: 'Sep 05, 2026', 
      score: 92,
      delta: '+5% from previous',
      tags: ['Algorithmic UX', 'Strategy', 'Personalization'],
      salary: '$180,000/yr',
      status: 'Benchmark High'
    },
    { 
      role: 'AI Interface Architect', 
      company: 'Anthropic', 
      date: 'Jul 20, 2026', 
      score: 84,
      delta: 'New Entry',
      tags: ['Conversational Flow', 'AI Safety', 'Ethics'],
      salary: '$175,000/yr',
      status: 'Archived'
    }
  ];

  const handleInspect = (item: typeof mockHistory[0]) => {
    setCareerData({
      targetRole: item.role,
      company: item.company,
      jobDescription: `Targeting the ${item.role} opportunity at ${item.company}. Focus on ${item.tags.join(', ')}.`,
      currentRole: 'UX Designer',
      yearsExperience: '5 years',
      topSkills: item.tags.join(', ')
    });
    navigate('/dashboard/overview');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16 pt-2 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-purple-100 text-[#8C3F96] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2">
            <Clock size={12} className="text-[#F05A7E]" /> Assessment Log & Progression
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-[#2D1B4E]">Historical Assessments</h1>
          <p className="text-xs text-gray-500 mt-1">Review past role evaluations, score trajectory, and skill benchmarks over time.</p>
        </div>

        <button 
          onClick={() => navigate('/dashboard/insights')}
          className="bg-[#2D1B4E] hover:bg-[#431D54] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Sparkles size={14} className="text-[#F05A7E]" /> Run New Assessment
        </button>
      </div>

      {/* Trajectory Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-purple-100 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total Assessments</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-[#2D1B4E]">3</span>
            <span className="text-xs text-purple-700 font-semibold">Active Targets</span>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-purple-100 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Average Readiness</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-[#8C3F96]">84.6%</span>
            <span className="text-xs text-emerald-600 font-bold flex items-center gap-0.5">
              <TrendingUp size={12} /> +18% YTD
            </span>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-purple-100 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Estimated Market Value</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-[#F05A7E]">$173,000</span>
            <span className="text-[10px] text-gray-500 font-medium">Avg Base</span>
          </div>
        </div>
      </div>

      {/* History List */}
      <div className="space-y-4">
        {mockHistory.map((historyItem, index) => (
          <motion.div 
            key={index}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
            className="bg-white/95 backdrop-blur-md border border-purple-100/90 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs hover:shadow-lg transition-all"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase bg-purple-50 text-[#8C3F96] border border-purple-100">
                  {historyItem.status}
                </span>
                <span className="text-[11px] text-gray-400 font-medium flex items-center gap-1">
                  <Clock size={12} /> {historyItem.date}
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-[#2D1B4E]">{historyItem.role}</h3>
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                  <span className="font-semibold text-purple-900 flex items-center gap-1">
                    <Building2 size={13} /> {historyItem.company}
                  </span>
                  <span>•</span>
                  <span className="text-gray-600 font-medium">{historyItem.salary}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {historyItem.tags.map(tag => (
                  <span key={tag} className="text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between md:justify-end gap-6 pt-4 md:pt-0 border-t md:border-t-0 border-gray-100">
              <div className="text-left md:text-right">
                <span className="block text-3xl font-black text-[#8C3F96] leading-none">{historyItem.score}%</span>
                <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Readiness</span>
                <span className="text-[10px] text-emerald-600 block font-semibold">{historyItem.delta}</span>
              </div>

              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleInspect(historyItem)}
                className="bg-[#2D1B4E] hover:bg-[#431D54] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <span>Load Snapshot</span>
                <ArrowRight size={14} />
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default History;
