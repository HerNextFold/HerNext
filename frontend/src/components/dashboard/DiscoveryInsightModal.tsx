import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  X,
  Sparkles,
  CheckCircle2,
  Cpu,
  Database,
  Target,
  GitBranch,
  Layers,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import {
  ApiError,
  getCareerRecommendations,
  listExperiences,
  getProfile,
  getProgressSummary,
  getTransferableSkills,
  type CareerProfile,
  type CareerRecommendation,
  type ExperienceRecord,
  type ProgressSummary,
  type TransferableSkill
} from '../../lib/api';

/**
 * Discovery transparency panel.
 *
 * Every number and claim shown here is read from the authenticated
 * participant's own HerNext records. The panel does not claim data sources,
 * model behaviour, benchmark datasets, market years or scores that the
 * backend did not actually produce. Where a value has not been stored yet the
 * panel says "not stored yet" instead of substituting a placeholder.
 */

interface DiscoveryInsightModalProps {
  initialStepIndex?: number;
  onClose: () => void;
}

interface DiscoveryData {
  profile: CareerProfile | null;
  experiences: ExperienceRecord[];
  transferableSkills: TransferableSkill[];
  topRecommendation: CareerRecommendation | null;
  summary: ProgressSummary | null;
}

const NOT_AVAILABLE = 'not available';

function percent(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return NOT_AVAILABLE;
  return `${Math.round(value)}%`;
}

function background(profile: CareerProfile | null): string {
  if (profile === null) return 'no career profile stored yet';
  const parts = [profile.currentOccupation, profile.industry].filter(
    (part) => typeof part === 'string' && part.trim() !== '',
  );
  return parts.length > 0 ? parts.join(' in ') : 'profile saved without occupation or industry';
}

function derivedSkillNames(skills: TransferableSkill[]): string[] {
  return skills.map((s) => s.skillName).filter((n): n is string => typeof n === 'string' && n !== '');
}

export const DiscoveryInsightModal: React.FC<DiscoveryInsightModalProps> = ({
  initialStepIndex = 0,
  onClose
}) => {
  const [selectedStep, setSelectedStep] = useState<number>(initialStepIndex);
  const [data, setData] = useState<DiscoveryData | null>(null);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoadState('loading');
      try {
        const [profile, experiencesData, transferable, recommendations, summary] = await Promise.all([
          getProfile().catch((err: unknown) => {
            if (err instanceof ApiError && err.status === 404) return null;
            throw err;
          }),
          listExperiences().catch(() => ({ experiences: [] as ExperienceRecord[] })),
          getTransferableSkills().catch(() => ({ skills: [] as TransferableSkill[] })),
          getCareerRecommendations(1).catch(() => ({ recommendations: [] as CareerRecommendation[] })),
          getProgressSummary().catch(() => null),
        ]);

        if (cancelled) return;
        setData({
          profile: profile as CareerProfile | null,
          experiences: experiencesData.experiences,
          transferableSkills: transferable.skills,
          topRecommendation: recommendations.recommendations[0] ?? null,
          summary,
        });
        setLoadState('ready');
      } catch {
        if (!cancelled) {
          setData(null);
          setLoadState('error');
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const derivedNames = data === null ? [] : derivedSkillNames(data.transferableSkills);
  const profileSkills = data?.profile?.existingSkills ?? [];
  const hasProfile = data !== null && data.profile !== null;

  const steps = [
    {
      id: 'data-gathered',
      title: '1. Data Gathered',
      shortDesc: 'Your stored profile, experience and skills records.',
      icon: Database,
      details: hasProfile
        ? `HerNext read your saved career profile (${background(data?.profile ?? null)}) and ${
            (data?.experiences.length ?? 0) === 0
              ? 'no experience records yet'
              : `${data?.experiences.length} stored experience record${data?.experiences.length === 1 ? '' : 's'}`
          }. Every value below is taken from those records.`
        : 'You have not created a career profile yet, so there is no stored data for HerNext to analyse. Complete your onboarding to populate this panel with your real records.',
      items: [
        {
          label: 'Career profile',
          count: hasProfile ? 'stored' : 'not created yet',
          icon: Layers,
        },
        {
          label: 'Experience records',
          count:
            data === null
              ? NOT_AVAILABLE
              : data.experiences.length === 0
                ? 'none stored yet'
                : `${data.experiences.length} stored`,
          icon: Database,
        },
        {
          label: 'Self-reported skills',
          count: hasProfile ? `${profileSkills.length} on your profile` : 'not available',
          icon: CheckCircle2,
        },
        {
          label: 'Source of analysis',
          count: 'your own HerNext records only',
          icon: ShieldCheck,
        },
      ],
    },
    {
      id: 'ai-analysis',
      title: '2. AI Analysis',
      shortDesc: 'Skills the HerNext backend derived from your experience.',
      icon: Cpu,
      details:
        derivedNames.length > 0
          ? `The HerNext backend derived ${derivedNames.length} transferable skill${derivedNames.length === 1 ? '' : 's'} from your stored experience. These are AI-inferred, not verified, and each one carries the confidence the backend recorded.`
          : 'No transferable skills have been derived for you yet. They are generated by the HerNext backend from your stored experience records, so add experience and run the discovery step. Nothing is inferred or shown here before that happens.',
      items: [
        {
          label: 'Derived transferable skills',
          count: derivedNames.length === 0 ? 'none derived yet' : derivedNames.slice(0, 4).join(', '),
          icon: Sparkles,
        },
        {
          label: 'Verification status',
          count: derivedNames.length === 0 ? NOT_AVAILABLE : 'AI-derived, not verified',
          icon: ShieldCheck,
        },
        {
          label: 'Confidence',
          count:
            data === null || data.transferableSkills.length === 0
              ? NOT_AVAILABLE
              : `${percent(
                  data.transferableSkills.reduce((total, s) => total + s.confidence, 0) /
                    data.transferableSkills.length,
                )} average (backend recorded)`,
          icon: GitBranch,
        },
        {
          label: 'Catalogue',
          count: 'approved HerNext skills only',
          icon: Database,
        },
      ],
    },
    {
      id: 'match-found',
      title: '3. Match Found',
      shortDesc: 'Your career match and readiness, calculated by the backend.',
      icon: Target,
      details:
        data?.topRecommendation != null
          ? `The HerNext backend matched your skills against the approved careers catalogue. Your top match is ${data.topRecommendation.careerName} with a ${percent(data.topRecommendation.matchScore)} match score. Match scores reflect skill alignment only.`
          : 'No career match has been calculated for you yet. Matches are computed by the HerNext backend from your skills and the approved catalogue, so complete your profile and add experience first.',
      items: [
        {
          label: 'Top career match',
          count: data?.topRecommendation?.careerName ?? 'not calculated yet',
          icon: Target,
        },
        {
          label: 'Match score',
          count: data?.topRecommendation != null ? percent(data.topRecommendation.matchScore) : NOT_AVAILABLE,
          icon: Sparkles,
        },
        {
          label: 'Career readiness',
          count: data?.summary != null ? percent(data.summary.careerReadiness) : NOT_AVAILABLE,
          icon: CheckCircle2,
        },
        {
          label: 'Score basis',
          count: 'calculated by the HerNext backend',
          icon: ShieldCheck,
        },
      ],
    },
  ];

  const active = steps[selectedStep] ?? steps[0];

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
        className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-purple-100 overflow-hidden my-6"
      >
        <div className="bg-[#261338] text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors cursor-pointer"
            aria-label="Close discovery panel"
          >
            <X size={18} />
          </button>
          <div className="inline-flex items-center gap-2 bg-[#F05A7E]/20 text-[#F05A7E] border border-[#F05A7E]/30 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2">
            <Sparkles size={12} />
            HerNext Discovery Engine
          </div>
          <h3 className="text-2xl font-black text-white">How HerNext Discovered Your Skills</h3>
          <p className="text-xs text-purple-200/80 max-w-lg mt-1">
            The pipeline below runs on your own stored HerNext records. Anything that has not been
            stored is shown as unavailable rather than filled in.
          </p>
        </div>

        <div className="grid grid-cols-3 border-b border-gray-100 bg-gray-50/80 p-2 gap-2">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isSelected = selectedStep === idx;
            return (
              <button
                key={step.id}
                onClick={() => setSelectedStep(idx)}
                className={`p-3 rounded-2xl text-left transition-all cursor-pointer flex flex-col gap-1 border ${
                  isSelected
                    ? 'bg-white text-[#2D1B4E] border-purple-200 shadow-sm ring-1 ring-[#8C3F96]/20'
                    : 'bg-transparent text-gray-500 border-transparent hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Icon size={14} className={isSelected ? 'text-[#8C3F96]' : 'text-gray-400'} />
                  <span>{step.title}</span>
                </div>
                <span className="text-[10px] text-gray-400 line-clamp-1">{step.shortDesc}</span>
              </button>
            );
          })}
        </div>

        <div className="p-6 space-y-4">
          {loadState === 'loading' ? (
            <div className="flex items-center gap-2 p-4 rounded-2xl bg-gray-50 text-xs text-gray-500">
              <AlertTriangle size={14} /> Loading your stored records…
            </div>
          ) : loadState === 'error' ? (
            <div className="flex items-start gap-2 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <span>
                We could not load your HerNext records, so there is nothing to show. Refresh the page
                and try again. No values have been substituted.
              </span>
            </div>
          ) : (
            <>
              <div className="bg-purple-50/70 p-4 rounded-2xl border border-purple-100">
                <h4 className="text-sm font-bold text-[#2D1B4E] mb-1">{active.title}: Deep Inspection</h4>
                <p className="text-xs text-gray-600 leading-relaxed">{active.details}</p>
              </div>

              <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Signals From Your Records
              </h5>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {active.items.map((it) => {
                  const ItemIcon = it.icon;
                  return (
                    <div
                      key={it.label}
                      className="p-3.5 bg-gray-50 rounded-xl border border-gray-100 flex items-start gap-3"
                    >
                      <div className="w-8 h-8 rounded-lg bg-purple-100 text-[#8C3F96] flex items-center justify-center shrink-0">
                        <ItemIcon size={16} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-[#2D1B4E] block">{it.label}</span>
                        <span className="text-[11px] text-gray-500">{it.count}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <span className="text-[10px] text-gray-400">
            Derived from your own HerNext records by the HerNext backend
          </span>
          <button
            onClick={onClose}
            className="bg-[#2D1B4E] hover:bg-[#431F69] text-white px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Got It
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DiscoveryInsightModal;
