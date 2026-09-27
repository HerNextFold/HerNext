import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Trophy, CheckCircle2, Clock, XCircle, ArrowRight } from 'lucide-react';
import PurpleBackgroundDots from '../../components/dashboard/PurpleBackgroundDots';
import {
  ApiError,
  listChallenges,
  type ChallengeDifficulty,
  type ChallengeListItem,
} from '../../lib/api';

const DIFFICULTY_FILTERS: Array<{ label: string; value: ChallengeDifficulty | null }> = [
  { label: 'All', value: null },
  { label: 'Beginner', value: 'BEGINNER' },
  { label: 'Intermediate', value: 'INTERMEDIATE' },
  { label: 'Advanced', value: 'ADVANCED' },
];

const DIFFICULTY_STYLES: Record<ChallengeDifficulty, string> = {
  BEGINNER: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  INTERMEDIATE: 'bg-amber-50 text-amber-700 border-amber-200',
  ADVANCED: 'bg-rose-50 text-[#9E4733] border-rose-200',
};

function AttemptBadge({ attempt }: { attempt: ChallengeListItem['latestAttempt'] }) {
  if (!attempt) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-purple-100 bg-purple-50/60 px-2.5 py-0.5 text-[10px] font-bold text-gray-500">
        Not attempted yet
      </span>
    );
  }
  if (attempt.status === 'PASSED') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-100 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-800">
        <CheckCircle2 size={11} /> Passed{attempt.score !== null ? ` (${attempt.score}/100)` : ''}
      </span>
    );
  }
  if (attempt.status === 'FAILED') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[10px] font-extrabold text-[#9E4733]">
        <XCircle size={11} /> Failed{attempt.score !== null ? ` (${attempt.score}/100)` : ''}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-purple-100 bg-purple-50 px-2.5 py-0.5 text-[10px] font-extrabold text-[#8C3F96]">
      <Clock size={11} /> Pending
    </span>
  );
}

const Challenges: React.FC = () => {
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState<ChallengeListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [difficulty, setDifficulty] = useState<ChallengeDifficulty | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setLoadError('');
      try {
        const { challenges: data } = await listChallenges(difficulty ? { difficulty } : {});
        if (!cancelled) setChallenges(data);
      } catch (err) {
        if (cancelled) return;
        setLoadError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [difficulty]);

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };
  const item = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <div className="relative min-h-screen">
      <PurpleBackgroundDots dotCount={35} />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="max-w-6xl mx-auto space-y-6 pb-24 pt-2 font-sans text-gray-800 relative z-10"
      >
        <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-purple-100 text-[#8C3F96] px-3.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2">
              <Trophy size={12} className="text-[#F05A7E]" /> Practical Challenges
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2D1B4E] tracking-tight">Challenges</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 font-medium max-w-xl">
              Prove your skills with real-world scenarios. Passing a challenge adds verified evidence to your Career Passport.
            </p>
          </div>
        </motion.div>

        {loadError && (
          <motion.div variants={item} className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            {loadError}
          </motion.div>
        )}

        <motion.div variants={item} className="flex flex-wrap gap-2">
          {DIFFICULTY_FILTERS.map((f) => (
            <button
              key={f.label}
              onClick={() => setDifficulty(f.value)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                difficulty === f.value
                  ? 'bg-[#2D1B4E] text-white border-[#2D1B4E]'
                  : 'bg-white text-gray-600 border-purple-100 hover:border-purple-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </motion.div>

        {isLoading ? (
          <motion.div variants={item} className="text-xs text-gray-500">
            Loading challenges...
          </motion.div>
        ) : challenges.length === 0 ? (
          <motion.div variants={item} className="bg-white rounded-3xl p-8 border border-purple-100/80 shadow-xs text-center">
            <p className="text-sm text-gray-500">No challenges available yet.</p>
          </motion.div>
        ) : (
          <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {challenges.map((challenge) => (
              <div
                key={challenge.id}
                className="bg-white rounded-3xl p-6 border border-purple-100/80 shadow-xs space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-black text-[#2D1B4E] leading-snug">{challenge.title}</h3>
                    <span
                      className={`shrink-0 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${DIFFICULTY_STYLES[challenge.difficulty]}`}
                    >
                      {challenge.difficulty}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">{challenge.description}</p>
                  {challenge.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {challenge.skills.map((skill) => (
                        <span
                          key={skill.skillId}
                          className="bg-purple-50/60 text-[#2D1B4E] text-[10px] font-semibold px-2 py-0.5 rounded-md border border-purple-100"
                        >
                          {skill.skillName}
                        </span>
                      ))}
                    </div>
                  )}
                  <AttemptBadge attempt={challenge.latestAttempt} />
                </div>

                <button
                  onClick={() => navigate(`/dashboard/challenges/${challenge.id}`)}
                  className="w-full bg-[#2D1B4E] hover:bg-[#431F69] text-white text-xs font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{challenge.latestAttempt ? 'View Challenge' : 'Start Challenge'}</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default Challenges;
