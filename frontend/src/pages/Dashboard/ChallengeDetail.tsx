import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Plus,
  Trash2,
  XCircle,
  Loader2,
  Info,
  FileCheck2,
} from 'lucide-react';
import PurpleBackgroundDots from '../../components/dashboard/PurpleBackgroundDots';
import {
  describeApiError,
  getChallenge,
  submitChallenge,
  type ChallengeDifficulty,
  type ChallengeListItem,
  type SubmitChallengeResult,
} from '../../lib/api';

const RECONCILIATION_TITLE = 'Financial Reconciliation Challenge';
const PAYMENT_RESOLUTION_TITLE = 'Customer Payment Resolution Challenge';

const DIFFICULTY_STYLES: Record<ChallengeDifficulty, string> = {
  BEGINNER: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  INTERMEDIATE: 'bg-amber-50 text-amber-700 border-amber-200',
  ADVANCED: 'bg-rose-50 text-[#9E4733] border-rose-200',
};

const inputClass =
  'w-full rounded-xl border border-hairline border-purple-100 bg-purple-50/40 px-3.5 py-2.5 text-sm text-[#2D1B4E] outline-none transition-all focus:border-[#8C3F96] focus:bg-white focus:ring-2 focus:ring-purple-500/20';

function ReconciliationForm({
  onSubmit,
  isSubmitting,
}: {
  onSubmit: (answer: Record<string, unknown>) => void;
  isSubmitting: boolean;
}) {
  const [totalCredits, setTotalCredits] = useState('');
  const [totalDebits, setTotalDebits] = useState('');
  const [difference, setDifference] = useState('');
  const [discrepancyFound, setDiscrepancyFound] = useState<boolean | null>(null);
  const [explanation, setExplanation] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      totalCredits: Number(totalCredits),
      totalDebits: Number(totalDebits),
      difference: Number(difference),
      discrepancyFound: discrepancyFound === true,
      ...(explanation.trim() ? { explanation: explanation.trim() } : {}),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-xs text-gray-500 leading-relaxed bg-purple-50/50 border border-purple-100 rounded-xl p-3">
        Scenario: a daily ledger shows a batch of customer transactions. Review the totals and determine whether they reconcile.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-[#2D1B4E] mb-1">Total Credits</label>
          <input
            type="number"
            required
            value={totalCredits}
            onChange={(e) => setTotalCredits(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#2D1B4E] mb-1">Total Debits</label>
          <input
            type="number"
            required
            value={totalDebits}
            onChange={(e) => setTotalDebits(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-[#2D1B4E] mb-1">Difference</label>
        <input
          type="number"
          required
          value={difference}
          onChange={(e) => setDifference(e.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-[#2D1B4E] mb-1.5">Did you find a discrepancy?</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setDiscrepancyFound(true)}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
              discrepancyFound === true ? 'bg-[#2D1B4E] text-white border-[#2D1B4E]' : 'bg-white border-purple-100 text-gray-600'
            }`}
          >
            Yes
          </button>
          <button
            type="button"
            onClick={() => setDiscrepancyFound(false)}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
              discrepancyFound === false ? 'bg-[#2D1B4E] text-white border-[#2D1B4E]' : 'bg-white border-purple-100 text-gray-600'
            }`}
          >
            No
          </button>
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-[#2D1B4E] mb-1">Explanation (optional)</label>
        <textarea
          rows={4}
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          placeholder="Explain where the discrepancy came from..."
          className={inputClass}
        />
      </div>
      <button
        type="submit"
        disabled={isSubmitting || discrepancyFound === null}
        className="w-full bg-[#2D1B4E] hover:bg-[#431F69] text-white text-sm font-bold py-3 rounded-xl transition-all disabled:opacity-60 cursor-pointer"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Answer'}
      </button>
    </form>
  );
}

function PaymentResolutionForm({
  onSubmit,
  isSubmitting,
}: {
  onSubmit: (answer: Record<string, unknown>) => void;
  isSubmitting: boolean;
}) {
  const [steps, setSteps] = useState<string[]>(['']);
  const [explanation, setExplanation] = useState('');

  const updateStep = (index: number, value: string) => {
    setSteps((prev) => prev.map((s, i) => (i === index ? value : s)));
  };
  const addStep = () => setSteps((prev) => [...prev, '']);
  const removeStep = (index: number) => setSteps((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSteps = steps.map((s) => s.trim()).filter(Boolean);
    onSubmit({
      steps: cleanSteps,
      ...(explanation.trim() ? { explanation: explanation.trim() } : {}),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-xs text-gray-500 leading-relaxed bg-purple-50/50 border border-purple-100 rounded-xl p-3">
        Scenario: a customer reports a failed payment. List the steps you would take to resolve it, in order.
      </p>
      <div className="space-y-2">
        {steps.map((step, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-purple-50 text-[#8C3F96] text-xs font-bold flex items-center justify-center shrink-0">
              {idx + 1}
            </span>
            <input
              type="text"
              required
              value={step}
              onChange={(e) => updateStep(idx, e.target.value)}
              placeholder={`Step ${idx + 1}`}
              className={inputClass}
            />
            {steps.length > 1 && (
              <button
                type="button"
                onClick={() => removeStep(idx)}
                className="text-gray-400 hover:text-rose-600 shrink-0"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addStep}
        disabled={steps.length >= 20}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8C3F96] hover:text-[#5B2975] disabled:opacity-50"
      >
        <Plus size={14} /> Add step
      </button>
      <div>
        <label className="block text-xs font-semibold text-[#2D1B4E] mb-1">Explanation (optional)</label>
        <textarea
          rows={3}
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          className={inputClass}
        />
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-[#2D1B4E] hover:bg-[#431F69] text-white text-sm font-bold py-3 rounded-xl transition-all disabled:opacity-60 cursor-pointer"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Answer'}
      </button>
    </form>
  );
}

const ChallengeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [challenge, setChallenge] = useState<ChallengeListItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [result, setResult] = useState<SubmitChallengeResult | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!id) return;
      setIsLoading(true);
      setLoadError('');
      try {
        const { challenge: data } = await getChallenge(id);
        if (!cancelled) setChallenge(data);
      } catch (err) {
        if (cancelled) return;
        setLoadError(describeApiError(err, 'We could not load this challenge. Please try again.'));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleSubmit = async (answer: Record<string, unknown>) => {
    if (!id || isSubmitting) return;
    setSubmitError('');
    setIsSubmitting(true);
    try {
      const outcome = await submitChallenge(id, answer);
      setResult(outcome);
    } catch (err) {
      setSubmitError(describeApiError(err, 'We could not submit your answer. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

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
        className="max-w-3xl mx-auto space-y-6 pb-24 pt-2 font-sans text-gray-800 relative z-10"
      >
        <motion.div variants={item}>
          <button
            onClick={() => navigate('/dashboard/challenges')}
            className="text-[#8C3F96] hover:text-[#5B2975] font-bold text-xs flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Back to Challenges</span>
          </button>
        </motion.div>

        {isLoading && (
          <motion.div variants={item} className="flex items-center gap-2.5 text-xs text-gray-500 font-medium">
            <Loader2 size={16} className="animate-spin" />
            Loading challenge…
          </motion.div>
        )}

        {loadError && (
          <motion.div variants={item} className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            {loadError}
          </motion.div>
        )}

        {challenge && (
          <>
            <motion.div variants={item} className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100/80 shadow-xs space-y-4">
              <div className="flex items-start justify-between gap-3">
                <h1 className="text-xl sm:text-2xl font-extrabold text-[#2D1B4E] leading-snug">{challenge.title}</h1>
                <span
                  className={`shrink-0 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${DIFFICULTY_STYLES[challenge.difficulty]}`}
                >
                  {challenge.difficulty}
                </span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{challenge.description}</p>
              {challenge.skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {challenge.skills.map((skill) => (
                    <span
                      key={skill.skillId}
                      className="bg-purple-50/60 text-[#2D1B4E] text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-purple-100"
                    >
                      {skill.skillName}
                    </span>
                  ))}
                </div>
              )}
              {challenge.relevance !== 'EXPLORING' ? (
                <p className="text-[11px] text-gray-500 leading-relaxed flex items-start gap-1.5">
                  <Info size={12} className="shrink-0 mt-0.5 text-gray-400" />
                  <span>{challenge.relevanceReason}</span>
                </p>
              ) : null}

              {challenge.skills.length > 0 ? (
                <div className="bg-[#FAF8FC] border border-purple-100/70 rounded-xl px-3 py-2.5 flex items-start gap-2">
                  <FileCheck2 size={14} className="text-[#8C3F96] shrink-0 mt-0.5" />
                  <p className="text-[11px] text-gray-600 leading-relaxed font-medium">
                    Pass this and HerNext records{' '}
                    <strong className="text-[#2D1B4E]">
                      {challenge.skills.length} piece{challenge.skills.length === 1 ? '' : 's'} of
                      evidence
                    </strong>{' '}
                    for{' '}
                    {challenge.skills.length === 1
                      ? challenge.skills[0].skillName
                      : challenge.skills.map((s) => s.skillName).join(', ')}{' '}
                    on your Career Passport.
                  </p>
                </div>
              ) : null}

              {challenge.latestAttempt && !result && (
                <div className="text-xs text-gray-500 font-medium pt-2 border-t border-purple-100/60">
                  Last attempt: <strong className="text-[#2D1B4E]">{challenge.latestAttempt.status}</strong>
                  {challenge.latestAttempt.score !== null ? ` (${challenge.latestAttempt.score}/100)` : ''}
                </div>
              )}
            </motion.div>

            {result && (
              <motion.div
                variants={item}
                className={`rounded-3xl p-6 border shadow-xs space-y-2 ${
                  result.status === 'PASSED'
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-rose-50 border-rose-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  {result.status === 'PASSED' ? (
                    <CheckCircle2 size={20} className="text-emerald-700" />
                  ) : (
                    <XCircle size={20} className="text-[#9E4733]" />
                  )}
                  <h3 className="text-sm font-black text-[#2D1B4E]">
                    {result.status === 'PASSED' ? 'Passed' : 'Not Passed'} — {result.score}/100
                  </h3>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed">{result.feedback}</p>
                {result.evidenceCreated > 0 && (
                  <p className="text-xs font-bold text-[#8C3F96]">
                    {result.evidenceCreated} piece{result.evidenceCreated === 1 ? '' : 's'} of evidence added to your Career Passport.
                  </p>
                )}
              </motion.div>
            )}

            <motion.div variants={item} className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100/80 shadow-xs">
              {submitError && (
                <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{submitError}</div>
              )}

              {challenge.title === RECONCILIATION_TITLE && (
                <ReconciliationForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
              )}
              {challenge.title === PAYMENT_RESOLUTION_TITLE && (
                <PaymentResolutionForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
              )}
              {challenge.title !== RECONCILIATION_TITLE && challenge.title !== PAYMENT_RESOLUTION_TITLE && (
                <p className="text-xs text-gray-500">This challenge doesn't support submissions yet.</p>
              )}
            </motion.div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default ChallengeDetail;
