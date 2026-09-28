import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Clock, Sparkles, ArrowRight, TrendingUp, BookOpen, Target } from 'lucide-react';
import { useDashboardContext } from '../../context/DashboardContext';
import { getCareerRecommendations, getProgressSummary, type CareerRecommendation, type ProgressSummary } from '../../lib/api';

const History: React.FC = () => {
  const navigate = useNavigate();
  const { setCareerData } = useDashboardContext();

  const [recommendations, setRecommendations] = useState<CareerRecommendation[]>([]);
  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [recs, prog] = await Promise.all([
          getCareerRecommendations(),
          getProgressSummary(),
        ]);
        if (cancelled) return;
        setRecommendations(recs.recommendations ?? []);
        setSummary(prog);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Something went wrong.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleInspect = (item: CareerRecommendation) => {
    setCareerData({
      targetRole: item.careerName,
      company: '',
      jobDescription: item.reason,
      currentRole: '',
      yearsExperience: '',
      topSkills: ''
    });
    navigate('/dashboard/overview');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16 pt-2 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-purple-100 text-[#8C3F96] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2">
            <Clock size={12} className="text-[#F05A7E]" /> Career Recommendations
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-[#2D1B4E]">Recommended Career Paths</h1>
          <p className="text-xs text-gray-500 mt-1">
            Career matches calculated by HerNext from your profile, experience, and skills.
          </p>
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
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Recommended Careers</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-[#2D1B4E]">
              {loading ? '—' : recommendations.length}
            </span>
            <span className="text-xs text-purple-700 font-semibold">From catalogue</span>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-purple-100 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Career Readiness</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-[#8C3F96]">
              {loading ? '—' : `${summary?.careerReadiness ?? 0}%`}
            </span>
            <span className="text-xs text-emerald-600 font-bold flex items-center gap-0.5">
              <TrendingUp size={12} /> {summary?.readinessLabel ?? 'Not scored yet'}
            </span>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-purple-100 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Skills Developed</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-[#F05A7E]">
              {loading ? '—' : summary?.skillsDeveloped ?? 0}
            </span>
            <span className="text-[10px] text-gray-500 font-medium flex items-center gap-1">
              <BookOpen size={11} /> {summary?.skillsRemaining ?? 0} to develop
            </span>
          </div>
        </div>
      </div>

      {/* Loading / Error / Empty states */}
      {loading && (
        <div className="bg-white/95 border border-purple-100/90 rounded-3xl p-10 text-center text-sm text-gray-500">
          Loading your recommendations...
        </div>
      )}

      {!loading && error && (
        <div className="bg-white/95 border border-purple-100/90 rounded-3xl p-10 text-center">
          <p className="text-sm text-gray-600">{error}</p>
          <p className="text-xs text-gray-400 mt-2">
            Complete your profile and AI assessment first, then re-check this page.
          </p>
        </div>
      )}

      {!loading && !error && recommendations.length === 0 && (
        <div className="bg-white/95 border border-purple-100/90 rounded-3xl p-10 text-center">
          <Target size={24} className="mx-auto text-purple-300 mb-3" />
          <p className="text-sm text-gray-600">No career recommendations yet.</p>
          <p className="text-xs text-gray-400 mt-1">
            Add your experience and run the AI assessment to unlock your matches.
          </p>
        </div>
      )}

      {/* History List */}
      <div className="space-y-4">
        {!loading && !error && recommendations.map((item, index) => (
          <motion.div
            key={item.careerId}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
            className="bg-white/95 backdrop-blur-md border border-purple-100/90 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs hover:shadow-lg transition-all"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase bg-purple-50 text-[#8C3F96] border border-purple-100">
                  Match #{item.rank}
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-[#2D1B4E]">{item.careerName}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{item.reason}</p>
              </div>
            </div>

            <div className="flex items-center justify-between md:justify-end gap-6 pt-4 md:pt-0 border-t md:border-t-0 border-gray-100">
              <div className="text-left md:text-right">
                <span className="block text-3xl font-black text-[#8C3F96] leading-none">{item.matchScore}%</span>
                <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Match score</span>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleInspect(item)}
                className="bg-[#2D1B4E] hover:bg-[#431D54] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <span>View Details</span>
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