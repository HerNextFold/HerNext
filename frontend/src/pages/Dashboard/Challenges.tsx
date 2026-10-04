import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  Trophy,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowRight,
  BookOpen,
  PencilLine,
  FileCheck2,
  Compass,
  Info,
  Loader2,
} from 'lucide-react';
import PurpleBackgroundDots from '../../components/dashboard/PurpleBackgroundDots';
import {
  describeApiError,
  listChallenges,
  type ChallengeDifficulty,
  type ChallengeListItem,
  type ChallengeRelevance,
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

const DIFFICULTY_LABEL: Record<ChallengeDifficulty, string> = {
  BEGINNER: 'Beginner',
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced',
};

/**
 * `relevance` is computed by the backend from real records, so the wording here
 * only relabels it. Nothing on this page infers a match of its own.
 */
const RELEVANCE_COPY: Record<ChallengeRelevance, { label: string; style: string }> = {
  RECOMMENDED: {
    label: 'For your goal career',
    style: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  BUILDING: {
    label: 'Uses a skill you have',
    style: 'bg-sky-50 text-sky-700 border-sky-200',
  },
  EXPLORING: {
    label: 'Exploring',
    style: 'bg-purple-50 text-gray-600 border-purple-200',
  },
};

/** The three steps the participant is actually doing, stated plainly. */
const STEPS = [
  {
    icon: BookOpen,
    title: 'Learn',
    body: 'Read the short lesson on your roadmap to understand what good work looks like.',
  },
  {
    icon: PencilLine,
    title: 'Practice',
    body: 'Work the scenario here and submit your answer. It is scored against a fixed brief, not a guess.',
  },
  {
    icon: FileCheck2,
    title: 'Produce evidence',
    body: 'Passing adds verified evidence to your Career Passport and credits the skill.',
  },
];

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
        <XCircle size={11} /> Not passed{attempt.score !== null ? ` (${attempt.score}/100)` : ''}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-purple-100 bg-purple-50 px-2.5 py-0.5 text-[10px] font-extrabold text-[#8C3F96]">
      <Clock size={11} /> Submitted, awaiting review
    </span>
  );
}

/**
 * CTA label follows the real attempt record, so a participant is never invited
 * to "start" something they have already submitted.
 */
function ctaLabel(challenge: ChallengeListItem): string {
  const attempt = challenge.latestAttempt;
  if (!attempt) return 'Start Challenge';
  if (attempt.status === 'PASSED') return 'View result';
  if (attempt.status === 'FAILED') return 'Try again';
  return 'View submission';
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
        setLoadError(describeApiError(err, 'We could not load challenges. Please try again.'));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [difficulty]);

  /**
   * Counts come straight from the participant's own attempt records. No score,
   * badge or progress figure on this page is estimated.
   */
  const summary = useMemo(() => {
    const passed = challenges.filter((c) => c.latestAttempt?.status === 'PASSED').length;
    const attempted = challenges.filter((c) => c.latestAttempt !== null).length;
    return { passed, attempted, total: challenges.length };
  }, [challenges]);

  /**
   * The backend always returns the whole catalogue, so "nothing relevant" is not
   * an empty list — it is a list where every item is EXPLORING. Both cases need
   * different wording, and neither may claim the participant has no challenges.
   */
  const nothingRelevant =
    !isLoading && challenges.length > 0 && challenges.every((c) => c.relevance === 'EXPLORING');

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };
  const item = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  const renderLoading = () => (
    <div className="space-y-5">
      <div className="flex items-center gap-2.5 text-xs text-gray-500 font-medium">
        <Loader2 size={16} className="animate-spin" />
        Loading your challenges…
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5" aria-hidden="true">
        {[0, 1].map((i) => (
          <div key={i} className="bg-white rounded-3xl p-6 border border-purple-100/80 space-y-3">
            <div className="h-3 w-1/3 rounded-full bg-purple-100 animate-pulse" />
            <div className="h-2.5 w-full rounded-full bg-purple-50 animate-pulse" />
            <div className="h-2.5 w-4/5 rounded-full bg-purple-50 animate-pulse" />
            <div className="h-9 w-full rounded-xl bg-purple-50 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );

  const renderEmpty = () => {
    const filterLabel =
      difficulty !== null ? DIFFICULTY_LABEL[difficulty].toLowerCase() : null;
    return (
      <div className="bg-white rounded-3xl p-8 border border-purple-100/80 shadow-xs text-center space-y-3">
        <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#8C3F96] flex items-center justify-center mx-auto">
          <Compass size={20} />
        </div>
        <h2 className="text-sm font-extrabold text-[#2D1B4E]">
          {filterLabel
            ? `No ${filterLabel} challenges in the catalogue yet`
            : 'No challenges in the catalogue yet'}
        </h2>
        <p className="text-xs text-gray-600 leading-relaxed max-w-md mx-auto">
          {filterLabel
            ? `Nothing is currently tagged ${filterLabel}. Try another level, or check back when more are added.`
            : 'HerNext has not published any challenges yet. There is nothing to attempt right now.'}
        </p>
        {difficulty !== null ? (
          <button
            onClick={() => setDifficulty(null)}
            className="mt-1 inline-flex items-center gap-1.5 bg-[#2D1B4E] hover:bg-[#431F69] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
          >
            Show all levels
            <ArrowRight size={13} />
          </button>
        ) : null}
      </div>
    );
  };

  const renderChallengeCard = (challenge: ChallengeListItem) => {
    const relevance = RELEVANCE_COPY[challenge.relevance];
    // Evidence count is not a stored field: the backend creates one evidence
    // record per linked skill when a challenge passes. Stating that here is
    // factual, and it is shown as an outcome rather than a promise.
    const evidenceCount = challenge.skills.length;

    return (
      <div
        key={challenge.id}
        className="bg-white rounded-3xl p-6 border border-purple-100/80 shadow-xs space-y-4 flex flex-col justify-between"
      >
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-black text-[#2D1B4E] leading-snug">{challenge.title}</h3>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span
                className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${DIFFICULTY_STYLES[challenge.difficulty]}`}
              >
                {DIFFICULTY_LABEL[challenge.difficulty]}
              </span>
              {challenge.relevance !== 'EXPLORING' ? (
                <span
                  className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${relevance.style}`}
                >
                  {relevance.label}
                </span>
              ) : null}
            </div>
          </div>

          <p className="text-xs text-gray-600 leading-relaxed">{challenge.description}</p>

          <p className="text-[11px] text-gray-500 leading-relaxed flex items-start gap-1.5">
            <Info size={12} className="shrink-0 mt-0.5 text-gray-400" />
            <span>{challenge.relevanceReason}</span>
          </p>

          {challenge.skills.length > 0 ? (
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
          ) : null}

          <div className="bg-[#FAF8FC] border border-purple-100/70 rounded-xl px-3 py-2.5 flex items-start gap-2">
            <FileCheck2 size={14} className="text-[#8C3F96] shrink-0 mt-0.5" />
            <p className="text-[11px] text-gray-600 leading-relaxed font-medium">
              Pass this and you produce{' '}
              <strong className="text-[#2D1B4E]">
                {evidenceCount} piece{evidenceCount === 1 ? '' : 's'} of evidence
              </strong>{' '}
              for your Career Passport.
            </p>
          </div>

          <AttemptBadge attempt={challenge.latestAttempt} />
        </div>

        <button
          onClick={() => navigate(`/dashboard/challenges/${challenge.id}`)}
          className="w-full bg-[#2D1B4E] hover:bg-[#431F69] text-white text-xs font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>{ctaLabel(challenge)}</span>
          <ArrowRight size={14} />
        </button>
      </div>
    );
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
        <motion.div
          variants={item}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <div className="inline-flex items-center gap-2 bg-purple-100 text-[#8C3F96] px-3.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2">
              <Trophy size={12} className="text-[#F05A7E]" /> Practical Challenges
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2D1B4E] tracking-tight">
              Practice, then produce evidence
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 font-medium max-w-xl">
              Each challenge is a real scenario from the role you are working towards. Pass it and
              the result becomes evidence on your Career Passport.
            </p>
          </div>

          {!isLoading && challenges.length > 0 ? (
            <div className="bg-white border border-purple-100/80 rounded-2xl px-4 py-3 text-center shrink-0">
              <span className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">
                Your record
              </span>
              <span className="text-sm font-extrabold text-[#2D1B4E]">
                {summary.passed} of {summary.total} passed
              </span>
              <span className="block text-[10px] text-gray-500 font-medium mt-0.5">
                {summary.attempted} attempted
              </span>
            </div>
          ) : null}
        </motion.div>

        {/* LEARN -> PRACTICE -> PRODUCE EVIDENCE */}
        <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={step.title}
                className="bg-white/95 backdrop-blur-md rounded-2xl p-4 border border-purple-100/80 shadow-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-[#8C3F96] flex items-center justify-center shrink-0">
                    <Icon size={16} />
                  </div>
                  <span className="text-xs font-extrabold text-[#2D1B4E] uppercase tracking-wider">
                    {idx + 1}. {step.title}
                  </span>
                </div>
                <p className="text-[11px] text-gray-600 leading-relaxed font-medium mt-2">
                  {step.body}
                </p>
              </div>
            );
          })}
        </motion.div>

        {loadError ? (
          <motion.div
            variants={item}
            className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700"
          >
            {loadError}
          </motion.div>
        ) : null}

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

        {nothingRelevant ? (
          <motion.div
            variants={item}
            className="rounded-2xl border border-purple-100 bg-purple-50/60 p-4 flex items-start gap-3"
          >
            <div className="w-8 h-8 rounded-xl bg-white text-[#8C3F96] flex items-center justify-center shrink-0">
              <Compass size={16} />
            </div>
            <p className="text-[11px] text-gray-600 leading-relaxed font-medium">
              None of these match a target career yet — either you have not set one, or none of them
              build a skill it requires. You are seeing the full catalogue, so anything here is worth
              a try for its own sake.
            </p>
          </motion.div>
        ) : null}

        {isLoading ? (
          <motion.div variants={item}>{renderLoading()}</motion.div>
        ) : challenges.length === 0 ? (
          <motion.div variants={item}>{renderEmpty()}</motion.div>
        ) : (
          <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {challenges.map(renderChallengeCard)}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default Challenges;