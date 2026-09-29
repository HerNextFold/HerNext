import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  X,
  Send,
  Bot,
  AlertTriangle
} from 'lucide-react';
import {
  ApiError,
  getCareerRecommendations,
  getCurrentUser,
  getNextAction,
  getProfile,
  getProgressSummary,
  getTransferableSkills,
  type CareerProfile,
  type CareerRecommendation,
  type NextAction,
  type ProgressSummary,
  type PublicUser,
  type TransferableSkill
} from '../../lib/api';

/**
 * Career Concierge.
 *
 * Every personal fact this panel states is read from the authenticated
 * participant's own HerNext records at the time the question is asked. The
 * panel deliberately answers only from stored data: it never infers, guesses
 * or fills in occupation, location, years of experience, skills or scores.
 * When a value has not been stored yet it says so and points at the step that
 * would create it, rather than inventing a plausible one.
 *
 * It is not a general-purpose conversational model. Anything outside the
 * participant's own HerNext data is declined and the answerable topics are
 * listed instead.
 */

interface ConciergeData {
  me: PublicUser | null;
  profile: CareerProfile | null;
  summary: ProgressSummary | null;
  recommendations: CareerRecommendation[];
  nextAction: NextAction | null;
  transferableSkills: TransferableSkill[];
  /** A career profile exists but could not be read for a reason other than 404. */
  profileError: string;
}

type LoadState = 'loading' | 'ready' | 'error';

const EMPTY_DATA: ConciergeData = {
  me: null,
  profile: null,
  summary: null,
  recommendations: [],
  nextAction: null,
  transferableSkills: [],
  profileError: '',
};

interface Message {
  sender: 'ai' | 'user';
  text: string;
}

function percent(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return 'not available';
  return `${Math.round(value)}%`;
}

function joinLocation(profile: CareerProfile | null): string | null {
  if (profile === null) return null;
  const parts = [profile.state, profile.country].filter(
    (part): part is string => typeof part === 'string' && part.trim() !== '',
  );
  return parts.length > 0 ? parts.join(', ') : null;
}

/** Descriptive line for the participant's stored work background, or null when incomplete. */
function describeBackground(profile: CareerProfile | null): string | null {
  if (profile === null) return null;
  const parts: string[] = [];
  if (profile.currentOccupation.trim() !== '') parts.push(profile.currentOccupation);
  if (profile.industry.trim() !== '') parts.push(`in ${profile.industry}`);
  if (typeof profile.yearsOfExperience === 'number') {
    parts.push(`${profile.yearsOfExperience} year${profile.yearsOfExperience === 1 ? '' : 's'} of experience`);
  }
  return parts.length > 0 ? parts.join(', ') : null;
}

const ANSWERABLE_TOPICS = [
  'my career readiness',
  'my top career recommendation',
  'my transferable skills',
  'my next recommended action',
  'my AI impact assessment',
  'my stored profile details',
];

const NOT_LOADED =
  'I could not load your HerNext data, so I have nothing reliable to answer from. Please reopen this panel or refresh the page and try again.';

function buildGreeting(data: ConciergeData): string {
  const firstName = data.me?.firstName?.trim();
  const background = describeBackground(data.profile);
  const greeting = firstName ? `Hi ${firstName}.` : 'Hi.';

  if (background === null) {
    return `${greeting} I'm your HerNext Career Concierge. I answer strictly from your own HerNext records — I never guess your background. You have not completed your career profile yet, so complete onboarding and I can show your real readiness, skills and career matches.`;
  }

  return `${greeting} I'm your HerNext Career Concierge. Everything I tell you is read from your own HerNext records — your readiness, your skills and your career matches are calculated by the HerNext backend from your saved data. I will tell you when something has not been stored yet instead of guessing. Ask me about ${ANSWERABLE_TOPICS.join(', ')}.`;
}

/** True when the participant has not yet created a career profile. */
function profileMissing(data: ConciergeData): boolean {
  return data.profile === null && data.profileError === '';
}

function buildReply(question: string, data: ConciergeData): string {
  const q = question.toLowerCase().trim();

  if (q === '' ) return 'Please type a question.';

  // Profile completeness gates every personal fact below.
  if (profileMissing(data)) {
    return 'You have not created a career profile yet, so I have no stored details about your occupation, experience or skills to work from. Complete your onboarding first, then reopen this panel and every answer will come from your real saved data.';
  }

  if (/(mentor|coach|session|book|human|advisor|adviser)/.test(q)) {
    return 'HerNext does not offer mentor booking or 1-on-1 sessions, so I cannot connect you with anyone. What I can do is show you your real readiness score, your transferable skills and the next action the HerNext backend recommends for you.';
  }

  if (/(readiness|how am i doing|how do i look|progress|how far)/.test(q)) {
    const summary = data.summary;
    if (summary === null) return NOT_LOADED;
    const breakdown = summary.readinessBreakdown;
    return [
      `Your stored career readiness is ${percent(summary.careerReadiness)} (${summary.readinessLabel}).`,
      `That score is calculated by the HerNext backend as: experience ${percent(breakdown?.experience)}, skills ${percent(breakdown?.skills)}, AI readiness ${percent(breakdown?.aiReadiness)}, evidence ${percent(breakdown?.evidence)}.`,
      `You have developed ${summary.skillsDeveloped} skill${summary.skillsDeveloped === 1 ? '' : 's'} with ${summary.skillsRemaining} still to develop, completed ${summary.challengesCompleted} challenge${summary.challengesCompleted === 1 ? '' : 's'} and created ${summary.evidenceCreated} piece${summary.evidenceCreated === 1 ? '' : 's'} of evidence.`,
    ].join(' ');
  }

  if (/(recommend|career path|which career|what career|suitable|transition into|target career)/.test(q)) {
    const top = data.recommendations[0];
    if (top === undefined) {
      return 'No career recommendations are stored for you yet. Career matches are computed by the HerNext backend from your skills and the approved careers catalogue, so add or confirm your experience first, then check Career Insights.';
    }
    const extra =
      data.recommendations.length > 1
        ? ` You have ${data.recommendations.length} ranked matches stored; this is your top one.`
        : '';
    return `Your top stored career match is ${top.careerName} with a ${percent(top.matchScore)} match score (rank ${top.rank}). HerNext calculated this from your skills and the approved catalogue.${extra} Open Career Insights for the full list.`;
  }

  if (/(skill|competenc|strength)/.test(q)) {
    const profileSkills = data.profile?.existingSkills ?? [];
    const derived = data.transferableSkills.filter((s) => typeof s.skillName === 'string' && s.skillName !== '');
    if (derived.length === 0 && profileSkills.length === 0) {
      return 'No skills are stored for you yet. Nothing has been inferred or invented on my side. Add experience in your profile and run the HerNext transferable-skills discovery, and the backend will store the skills it derives from your real history.';
    }
    const names = (derived.length > 0 ? derived : profileSkills).map((s) => s.skillName).filter((n): n is string => typeof n === 'string');
    const shown = names.slice(0, 8).join(', ');
    const remaining = names.length - Math.min(names.length, 8);
    return `HerNext has ${names.length} skill${names.length === 1 ? '' : 's'} stored for you: ${shown}${remaining > 0 ? `, and ${remaining} more` : ''}. These come from your saved profile and the backend's analysis of your real experience — I have not added anything myself.`;
  }

  if (/(next|what should i do|action|where do i start|stuck)/.test(q)) {
    const action = data.nextAction;
    if (action === null) return NOT_LOADED;
    return `The HerNext backend's next recommended action is: ${action.action}. It gives this because ${action.reason.charAt(0).toLowerCase()}${action.reason.slice(1)} This is calculated deterministically from your own records.`;
  }

  if (/(assessment|ai impact|automation|impact)/.test(q)) {
    const impact = data.summary?.aiImpact;
    if (impact === null || impact === undefined) {
      return 'You have no AI impact assessment stored yet. It is generated per experience by the HerNext backend, so add an experience record and run the AI Career Impact Assessment. Until then there is no impact score to report, and I will not estimate one.';
    }
    return `Your stored AI impact score is ${percent(impact.score)} (${impact.level} task impact). HerNext calculates this from your saved experience. It is an assessment of automation exposure and AI augmentation, not a prediction of job loss. Open the full assessment for the task-level breakdown.`;
  }

  if (/(profile|about me|my details|who am i|occupation|experience|education|industry|location|where am i)/.test(q)) {
    const profile = data.profile;
    if (profile === null) return NOT_LOADED;
    const lines: string[] = ['Here is what is currently stored on your HerNext profile:'];
    lines.push(`- Current occupation: ${profile.currentOccupation || 'not recorded'}`);
    lines.push(`- Industry: ${profile.industry || 'not recorded'}`);
    lines.push(`- Years of experience: ${typeof profile.yearsOfExperience === 'number' ? profile.yearsOfExperience : 'not recorded'}`);
    lines.push(`- Education: ${profile.education || 'not recorded'}`);
    lines.push(`- Employment type: ${profile.employmentType || 'not recorded'}`);
    lines.push(`- Location: ${joinLocation(profile) ?? 'not recorded'}`);
    if (profile.targetCareer) lines.push(`- Target career: ${profile.targetCareer.name}`);
    lines.push(`- Email: ${data.me?.email ?? 'not recorded'}`);
    return `${lines.join(' ')} Anything listed as "not recorded" simply has not been saved yet.`;
  }

  return `I can only answer from your own stored HerNext data, and I do not have a stored answer for that. I can help with: ${ANSWERABLE_TOPICS.join(', ')}. I will not invent details about you.`;
}

const QUICK_SUGGESTIONS = [
  'How is my career readiness?',
  'What is my top career match?',
  'What are my skills?',
  'What should I do next?',
  'Show my profile',
];

interface SupportModalProps {
  onClose: () => void;
}

export const SupportModal: React.FC<SupportModalProps> = ({ onClose }) => {
  const [data, setData] = useState<ConciergeData>(EMPTY_DATA);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [messages, setMessages] = useState<Message[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoadState('loading');
      try {
        const [me, summary, recommendationsData, nextAction, transferable, profile] = await Promise.all([
          getCurrentUser().catch(() => null),
          getProgressSummary().catch(() => null),
          getCareerRecommendations(3).catch(() => ({ recommendations: [] as CareerRecommendation[] })),
          getNextAction().catch(() => null),
          getTransferableSkills().catch(() => ({ skills: [] as TransferableSkill[] })),
          getProfile().catch((err: unknown) => {
            // 404 simply means onboarding is not finished; anything else is a
            // real read failure and must not be presented as "no profile".
            if (err instanceof ApiError && err.status === 404) return null;
            throw err;
          }),
        ]);

        if (cancelled) return;

        const next: ConciergeData = {
          me,
          profile: profile as CareerProfile | null,
          summary,
          recommendations: recommendationsData.recommendations,
          nextAction,
          transferableSkills: transferable.skills,
          profileError: '',
        };
        setData(next);
        setMessages([{ sender: 'ai', text: buildGreeting(next) }]);
        setLoadState('ready');
      } catch {
        if (cancelled) return;
        const failed: ConciergeData = { ...EMPTY_DATA, profileError: 'load-failed' };
        setData(failed);
        setMessages([{ sender: 'ai', text: NOT_LOADED }]);
        setLoadState('error');
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSend = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const userText = query.trim();
      if (userText === '') return;

      setMessages((prev) => [...prev, { sender: 'user', text: userText }]);
      setQuery('');

      // Answers are composed from the currently loaded snapshot, so they can
      // never assert a fact that the API did not return for this user.
      setMessages((prev) => [...prev, { sender: 'ai', text: buildReply(userText, data) }]);
    },
    [data, query],
  );

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
        className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-purple-100 overflow-hidden flex flex-col h-[520px]"
      >
        <div className="bg-[#261338] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#F05A7E] to-[#9B51E0] flex items-center justify-center text-white shadow-md">
              <Bot size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">HerNext Career Concierge</h3>
              </div>
              <p className="text-[10px] text-purple-200/70">Answers grounded only in your own HerNext data</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white p-1.5 rounded-full hover:bg-white/10 cursor-pointer"
            aria-label="Close support panel"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gradient-to-b from-gray-50/60 to-white">
          {loadState === 'loading' ? (
            <div className="flex items-start gap-2 p-3.5 rounded-2xl bg-purple-50 text-purple-950 border border-purple-100/80 text-xs">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <span>Loading your HerNext data…</span>
            </div>
          ) : (
            messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[82%] p-3.5 rounded-2xl text-xs leading-relaxed whitespace-pre-line ${
                    m.sender === 'user'
                      ? 'bg-[#2D1B4E] text-white rounded-tr-none'
                      : 'bg-purple-50 text-purple-950 border border-purple-100/80 rounded-tl-none'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="px-4 py-2 bg-gray-50/80 border-t border-gray-100 flex gap-1.5 overflow-x-auto no-scrollbar">
          {QUICK_SUGGESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => setQuery(q)}
              className="text-[10px] bg-white border border-purple-100 hover:border-purple-300 text-purple-900 px-2.5 py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>

        <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-100 flex items-center gap-2">
          <input
            type="text"
            placeholder="Ask about your own skills, readiness or career path..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:border-[#8C3F96] outline-none"
          />
          <button
            type="submit"
            aria-label="Send question"
            className="bg-[#8C3F96] hover:bg-[#722e7b] text-white p-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <Send size={15} />
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default SupportModal;
