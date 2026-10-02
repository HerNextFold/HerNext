import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  RotateCw,
  Cpu,
  Info,
  Plus,
  Check,
  Brain
} from 'lucide-react';
import PurpleBackgroundDots from '../../components/dashboard/PurpleBackgroundDots';
import SkillDetailModal from '../../components/dashboard/SkillDetailModal';
import type { SkillItem } from '../../components/dashboard/SkillDetailModal';
import RoadmapConfirmationModal from '../../components/dashboard/RoadmapConfirmationModal';
import DiscoveryInsightModal from '../../components/dashboard/DiscoveryInsightModal';
import AddCustomSkillModal from '../../components/dashboard/AddCustomSkillModal';
import {
  ApiError,
  getCareerRecommendations,
  getProfile,
  getSkillGaps,
  getTransferableSkills,
  updateProfile,
  type CareerProfile,
  type SkillGapsResponse,
  type TransferableSkill,
} from '../../lib/api';

function proficiencyFromConfidence(confidence: number): 'Expert' | 'Advanced' | 'Intermediate' | 'Foundational' {
  if (confidence >= 0.85) return 'Expert';
  if (confidence >= 0.65) return 'Advanced';
  if (confidence >= 0.4) return 'Intermediate';
  return 'Foundational';
}

function humanizeSkillSource(source: string): string {
  switch (source) {
    case 'SELF_REPORTED':
      return 'Self Reported';
    case 'AI_DERIVED':
      return 'AI Analysis';
    case 'CHALLENGE':
      return 'Challenge';
    case 'VERIFIED':
      return 'Verified';
    default:
      return source;
  }
}

/**
 * Merges the three real skill sources into one list for the "Skills HerNext
 * Discovered" grid. Skills the user already has (profile + AI-derived) are
 * 'career-relevant'; skills missing for their top recommended career (from
 * skill-gaps) are 'develop'. No proficiency/market/learning data is invented
 * for fields the backend doesn't provide - those stay empty/omitted.
 */
function buildRealSkills(
  profile: CareerProfile | null,
  transferable: TransferableSkill[],
  gaps: SkillGapsResponse | null,
): SkillItem[] {
  const items = new Map<string, SkillItem>();

  for (const t of transferable) {
    if (!t.skillName) continue;
    items.set(t.skillId, {
      id: t.skillId,
      name: t.skillName,
      category: 'career-relevant',
      source: 'AI Analysis',
      description: t.reason,
      proficiencyLevel: proficiencyFromConfidence(t.confidence),
      proficiencyPercent: Math.round(t.confidence * 100),
      icon: Sparkles,
      color: '#8C3F96',
      evidence: [],
      learningModules: [],
    });
  }

  if (profile) {
    for (const s of profile.existingSkills) {
      if (items.has(s.skillId)) continue;
      items.set(s.skillId, {
        id: s.skillId,
        name: s.skillName,
        category: 'career-relevant',
        source: humanizeSkillSource(s.source),
        description: `Recorded on your profile${s.category ? ` (${s.category})` : ''}.`,
        icon: CheckCircle2,
        color: '#8C3F96',
        evidence: [],
        learningModules: [],
      });
    }
  }

  if (gaps) {
    for (const g of gaps.skills) {
      if (g.status !== 'NEEDS_DEVELOPMENT' || items.has(g.skillId)) continue;
      items.set(g.skillId, {
        id: g.skillId,
        name: g.skillName,
        category: 'develop',
        source: 'Skill Gap Analysis',
        description: `Needed for ${gaps.career.name} (priority: ${g.priority}).`,
        icon: Brain,
        color: '#D47B5A',
        evidence: [],
        learningModules: [],
      });
    }
  }

  return Array.from(items.values());
}

export const MySkills: React.FC = () => {
  const [skillsList, setSkillsList] = useState<SkillItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [skillGaps, setSkillGaps] = useState<SkillGapsResponse | null>(null);
  const [topCareer, setTopCareer] = useState<{ careerName: string; matchScore: number; reason: string } | null>(null);
  // Kept so adding a skill can read-modify-write the profile fields that
  // PUT /profile requires, and so the list can be rebuilt from the server
  // response after a successful save.
  const [profileForWrite, setProfileForWrite] = useState<CareerProfile | null>(null);
  const [transferableSkills, setTransferableSkills] = useState<TransferableSkill[]>([]);
  const [isSavingSkill, setIsSavingSkill] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setLoadError('');
      try {
        const [profile, transferable] = await Promise.all([
          getProfile().catch((err) => {
            if (err instanceof ApiError && err.code === 'RESOURCE_NOT_FOUND') return null;
            throw err;
          }),
          getTransferableSkills(),
        ]);
        if (cancelled) return;

        let gaps: SkillGapsResponse | null = null;
        let top: { careerName: string; matchScore: number; reason: string } | null = null;
        try {
          const { recommendations } = await getCareerRecommendations(1);
          const topRec = recommendations[0];
          if (topRec) {
            top = { careerName: topRec.careerName, matchScore: topRec.matchScore, reason: topRec.reason };
            gaps = await getSkillGaps(topRec.careerId);
          }
        } catch {
          // No career context yet (or the call failed) - Have vs Develop shows its empty state instead.
        }
        if (cancelled) return;

        setSkillGaps(gaps);
        setTopCareer(top);
        setProfileForWrite(profile);
        setTransferableSkills(transferable.skills);
        setSkillsList(buildRealSkills(profile, transferable.skills, gaps));
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
  }, []);

  const [filterCategory, setFilterCategory] = useState<'all' | 'career-relevant' | 'develop'>('all');
  const [selectedSkill, setSelectedSkill] = useState<SkillItem | null>(null);
  const [roadmapModalSkill, setRoadmapModalSkill] = useState<string | null>(null);
  const [discoveryStepIndex, setDiscoveryStepIndex] = useState<number | null>(null);
  const [showAddCustomModal, setShowAddCustomModal] = useState(false);
  const [insightStageModal, setInsightStageModal] = useState<{ title: string; desc: string } | null>(null);
  const [haveDevelopDetail, setHaveDevelopDetail] = useState<{ title: string; type: 'have' | 'develop'; desc: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [savedSkillIds, setSavedSkillIds] = useState<string[]>([]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSaveToggle = (id: string) => {
    if (savedSkillIds.includes(id)) {
      setSavedSkillIds(savedSkillIds.filter((s) => s !== id));
      showToast('Skill removed from your saved competencies');
    } else {
      setSavedSkillIds([...savedSkillIds, id]);
      showToast('Skill saved to your personal profile!');
    }
  };

  /**
   * Persists a participant-typed skill.
   *
   * `PUT /profile` is additive for skills: the backend upserts each named
   * skill and never clears the existing ones, so only the new name is sent.
   * The backend trims, rejects blanks, de-duplicates case-insensitively and
   * reuses an approved catalogue skill only on an exact (case-insensitive)
   * name match, so it is never silently mapped to a different skill.
   */
  const handleAddCustomSkill = async (newSkill: SkillItem) => {
    const name = newSkill.name.trim();
    if (!name) {
      showToast('Enter a skill name first.');
      return;
    }
    if (skillsList.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
      showToast(`"${name}" is already in your skills.`);
      return;
    }
    if (!profileForWrite) {
      showToast('Complete your profile before adding a skill.');
      return;
    }

    setIsSavingSkill(true);
    try {
      await updateProfile({
        currentOccupation: profileForWrite.currentOccupation,
        industry: profileForWrite.industry,
        yearsOfExperience: profileForWrite.yearsOfExperience,
        employmentType: profileForWrite.employmentType,
        education: profileForWrite.education,
        country: profileForWrite.country,
        state: profileForWrite.state,
        customSkills: [name],
      });

      // Re-read the profile so the new skill arrives from the same source the
      // page renders every other skill from, instead of a hand-built object.
      const updated = await getProfile();
      setProfileForWrite(updated);
      setSkillsList(buildRealSkills(updated, transferableSkills, skillGaps));
      showToast(`"${name}" added to your skills.`);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Could not add that skill. Please try again.');
    } finally {
      setIsSavingSkill(false);
    }
  };

  const filteredSkills = skillsList.filter((s) => {
    if (filterCategory === 'all') return true;
    if (filterCategory === 'career-relevant') return s.category === 'career-relevant';
    if (filterCategory === 'develop') return s.category === 'develop';
    return true;
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.45 } }
  };

  return (
    <div className="relative min-h-screen">
      {/* Background Animated Floating Purple Dots */}
      <PurpleBackgroundDots dotCount={50} />

      {/* Main Content Container */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="max-w-5xl mx-auto space-y-8 pb-24 pt-2 font-sans text-gray-800 relative z-10"
      >
        {/* Toast Notification */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="fixed top-20 right-8 z-50 bg-[#261338] text-white text-xs px-4 py-3 rounded-2xl shadow-2xl border border-purple-400/30 flex items-center gap-2.5 backdrop-blur-md"
            >
              <div className="w-6 h-6 rounded-full bg-[#F05A7E]/20 text-[#F05A7E] flex items-center justify-center">
                <Sparkles size={13} />
              </div>
              <span className="font-medium">{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 1. Header Section */}
        <motion.div variants={itemVariants} className="space-y-3">
          <div className="inline-flex items-center gap-1.5 bg-[#F4ECF8] text-[#8C3F96] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
            <Sparkles size={12} className="text-[#8C3F96]" />
            <span>HERNEXT SKILLS DISCOVERY</span>
          </div>
          
          <h1 className="text-2xl sm:text-4xl md:text-[40px] font-bold text-[#2D1B4E] leading-tight tracking-tight">
            You already have more skills than you think
          </h1>
          
          <p className="text-gray-600 text-xs sm:text-sm max-w-3xl leading-relaxed">
            We've analyzed your experience to uncover the powerful, transferable abilities that map to high-value roles.
          </p>

          {isLoading && (
            <div className="rounded-xl border border-purple-100 bg-purple-50/60 p-3 text-xs text-[#8C3F96]">
              Loading your skills...
            </div>
          )}

          {loadError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              {loadError}
            </div>
          )}

          {/* 2. HerNext Skills Discovery Summary Card */}
          <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-xs border border-purple-100/80 mt-6 relative overflow-hidden">
            {/* Subtle card glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-100/30 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
              <h2 className="text-lg font-bold text-[#2D1B4E]">HerNext Skills Discovery Summary</h2>
              <span className="text-[10px] font-bold text-[#8C3F96] bg-purple-50 px-2.5 py-1 rounded-full self-start sm:self-auto">
                Live AI Assessment
              </span>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-3 gap-2 sm:gap-6 mb-6 py-4 border-y border-gray-100/90 text-left sm:text-left">
              <div 
                onClick={() => setFilterCategory('all')}
                className="cursor-pointer group transition-all"
              >
                <span className="block text-3xl sm:text-5xl font-black text-[#2D1B4E] mb-1 group-hover:text-[#8C3F96] transition-colors">
                  {skillsList.length}
                </span>
                <span className="text-[9px] sm:text-[10px] text-gray-500 uppercase tracking-wider font-bold block">
                  SKILLS DISCOVERED
                </span>
              </div>

              <div 
                onClick={() => setFilterCategory('career-relevant')}
                className="cursor-pointer group transition-all border-l border-gray-100 pl-4 sm:pl-8"
              >
                <span className="block text-3xl sm:text-5xl font-black text-[#D47B5A] mb-1 group-hover:text-[#b85f3f] transition-colors">
                  {skillsList.filter(s => s.category === 'career-relevant').length}
                </span>
                <span className="text-[9px] sm:text-[10px] text-gray-500 uppercase tracking-wider font-bold block">
                  CAREER-RELEVANT
                </span>
              </div>

              <div 
                onClick={() => setFilterCategory('develop')}
                className="cursor-pointer group transition-all border-l border-gray-100 pl-4 sm:pl-8"
              >
                <span className="block text-3xl sm:text-5xl font-black text-[#8C3F96] mb-1 group-hover:text-[#6a2973] transition-colors">
                  {skillsList.filter(s => s.category === 'develop').length}
                </span>
                <span className="text-[9px] sm:text-[10px] text-gray-500 uppercase tracking-wider font-bold block">
                  TO STRENGTHEN
                </span>
              </div>
            </div>

            {/* Button + Filter Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={skillsList.length === 0}
                onClick={() => {
                  if (skillsList.length === 0) return;
                  setSelectedSkill(skillsList[0]);
                  showToast('Opened skill detail breakdown');
                }}
                className="bg-[#2D1B4E] hover:bg-[#3D1E68] text-white font-bold text-xs px-6 py-3 rounded-xl flex items-center justify-center sm:justify-start gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Explore My Skills</span>
                <ArrowRight size={14} />
              </motion.button>

              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                <button
                  onClick={() => setFilterCategory('all')}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                    filterCategory === 'all'
                      ? 'bg-purple-100 text-[#8C3F96]'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  All ({skillsList.length})
                </button>
                <button
                  onClick={() => setFilterCategory('career-relevant')}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                    filterCategory === 'career-relevant'
                      ? 'bg-orange-100 text-[#D47B5A]'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  Relevant ({skillsList.filter(s => s.category === 'career-relevant').length})
                </button>
                <button
                  onClick={() => setFilterCategory('develop')}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                    filterCategory === 'develop'
                      ? 'bg-purple-100 text-[#8C3F96]'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  To Strengthen ({skillsList.filter(s => s.category === 'develop').length})
                </button>
                <button
                  onClick={() => setShowAddCustomModal(true)}
                  className="px-3 py-1.5 rounded-xl text-[11px] font-bold text-[#8C3F96] hover:bg-purple-50 flex items-center gap-1 border border-dashed border-purple-200 cursor-pointer"
                >
                  <Plus size={12} />
                  <span>Add Skill</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 3. Skills HerNext Discovered Grid */}
        <motion.div variants={itemVariants} className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#2D1B4E]">Skills HerNext Discovered</h2>
            <span className="text-xs text-gray-500 font-medium">
              Click any card to inspect AI evidence & career value
            </span>
          </div>

          {!isLoading && !loadError && filteredSkills.length === 0 && (
            <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 border border-purple-100/80 shadow-xs text-center">
              <p className="text-sm text-gray-500">
                No skills discovered yet. Complete Onboarding or your Career Assessment to get started.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {filteredSkills.map((skill) => {
              const SkillIcon = skill.icon;
              return (
                <motion.div 
                  key={skill.id}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  onClick={() => setSelectedSkill(skill)}
                  className="bg-white/95 backdrop-blur-md rounded-3xl p-6 border border-purple-100/80 shadow-xs hover:shadow-xl hover:border-purple-200 transition-all flex flex-col justify-between cursor-pointer group"
                >
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 bg-[#F4ECF8] rounded-2xl flex items-center justify-center text-[#8C3F96] shrink-0 group-hover:scale-110 transition-transform">
                        <SkillIcon size={18} />
                      </div>
                      <span className="bg-[#FAF0E6] text-[#8C3F96] text-[10px] font-bold px-3 py-1 rounded-full">
                        Source: {skill.source}
                      </span>
                    </div>

                    <h3 className="font-bold text-[#2D1B4E] text-base mb-1.5 group-hover:text-[#8C3F96] transition-colors">
                      {skill.name}
                    </h3>
                    
                    <p className="text-xs text-gray-500 leading-relaxed mb-6">
                      {skill.description}
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between items-center text-[10px] font-bold mb-1.5">
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden mr-3">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${skill.proficiencyPercent ?? 0}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className="h-full rounded-full bg-[#3B1B54]"
                        />
                      </div>
                      <span className="text-gray-500 font-medium whitespace-nowrap">
                        {skill.proficiencyLevel ?? 'Not yet scored'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* 4. How HerNext Discovered This Section */}
        <motion.div variants={itemVariants} className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#2D1B4E]">How HerNext Discovered This</h2>
            <button 
              onClick={() => setDiscoveryStepIndex(0)}
              className="text-xs font-bold text-[#8C3F96] hover:underline cursor-pointer"
            >
              Learn how AI parses your data
            </button>
          </div>

          <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-purple-100/80 shadow-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
              {/* Step 1 */}
              <motion.div 
                whileHover={{ scale: 1.02 }}
                onClick={() => setDiscoveryStepIndex(0)}
                className="flex flex-col items-center text-center p-3 rounded-2xl hover:bg-purple-50/50 transition-colors cursor-pointer"
              >
                <div className="w-11 h-11 rounded-2xl bg-purple-50 text-[#8C3F96] flex items-center justify-center mb-3 border border-purple-100">
                  <RotateCw size={19} />
                </div>
                <h4 className="font-bold text-[#2D1B4E] text-sm mb-1">Data Gathered</h4>
                <p className="text-xs text-gray-500 max-w-xs leading-relaxed">
                  Analyzed your profile and experience records.
                </p>
              </motion.div>

              {/* Arrow 1 */}
              <div className="hidden md:flex absolute left-[31%] top-8 transform -translate-y-1/2 text-gray-300">
                <ArrowRight size={20} />
              </div>

              {/* Step 2 */}
              <motion.div 
                whileHover={{ scale: 1.02 }}
                onClick={() => setDiscoveryStepIndex(1)}
                className="flex flex-col items-center text-center p-3 rounded-2xl hover:bg-purple-50/50 transition-colors cursor-pointer"
              >
                <div className="w-11 h-11 rounded-2xl bg-purple-50 text-[#8C3F96] flex items-center justify-center mb-3 border border-purple-100">
                  <Cpu size={19} />
                </div>
                <h4 className="font-bold text-[#2D1B4E] text-sm mb-1">AI Analysis</h4>
                <p className="text-xs text-gray-500 max-w-xs leading-relaxed">
                  Mapped against the approved HerNext skill catalogue.
                </p>
              </motion.div>

              {/* Arrow 2 */}
              <div className="hidden md:flex absolute left-[65%] top-8 transform -translate-y-1/2 text-gray-300">
                <ArrowRight size={20} />
              </div>

              {/* Step 3 */}
              <motion.div 
                whileHover={{ scale: 1.02 }}
                onClick={() => setDiscoveryStepIndex(2)}
                className="flex flex-col items-center text-center p-3 rounded-2xl hover:bg-purple-50/50 transition-colors cursor-pointer"
              >
                <div className="w-11 h-11 rounded-2xl bg-purple-50 text-[#8C3F96] flex items-center justify-center mb-3 border border-purple-100">
                  <CheckCircle2 size={19} />
                </div>
                <h4 className="font-bold text-[#2D1B4E] text-sm mb-1">Match Found</h4>
                <p className="text-xs text-gray-500 max-w-xs leading-relaxed">
                  Identified high-value transferable skills.
                </p>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* 5. Have vs. Develop Section */}
        <motion.div variants={itemVariants} className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-[#2D1B4E]">Have vs. Develop</h2>
            {skillGaps && (
              <p className="text-xs text-gray-500 mt-1">Based on your fit for {skillGaps.career.name}</p>
            )}
          </div>

          {!skillGaps ? (
            <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 border border-purple-100/80 shadow-xs text-center">
              <p className="text-sm text-gray-500">
                We don't have a personalized skill comparison yet. Get a career recommendation from your Dashboard Overview first.
              </p>
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* What You Have Card */}
            <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-purple-100/80 shadow-xs">
              <h3 className="font-bold text-[#2D1B4E] text-base flex items-center gap-2 mb-5">
                <CheckCircle2 size={18} className="text-[#8C3F96]" />
                <span>What You Have</span>
              </h3>

              <div className="space-y-3">
                {skillGaps.skills.filter((s) => s.status === 'HAS_SKILL').length === 0 && (
                  <p className="text-xs text-gray-400">No matching skills found yet.</p>
                )}
                {skillGaps.skills.filter((s) => s.status === 'HAS_SKILL').map((item) => (
                  <div
                    key={item.skillId}
                    onClick={() => setHaveDevelopDetail({
                      title: item.skillName,
                      type: 'have',
                      desc: `Confirmed skill for ${skillGaps.career.name}.`,
                    })}
                    className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-purple-50/60 transition-colors cursor-pointer group"
                  >
                    <Check size={16} className="text-[#8C3F96] shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-semibold text-gray-800 group-hover:text-[#8C3F96] transition-colors block">
                        {item.skillName}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* What to Develop Card */}
            <div className="bg-[#FFF4EE] rounded-3xl p-6 sm:p-8 border border-[#FBE3D6] shadow-xs">
              <h3 className="font-bold text-[#9E4733] text-base flex items-center gap-2 mb-5">
                <TrendingUp size={18} />
                <span>What to Develop</span>
              </h3>

              <div className="space-y-3">
                {skillGaps.skills.filter((s) => s.status === 'NEEDS_DEVELOPMENT').length === 0 && (
                  <p className="text-xs text-gray-400">No skill gaps found - you're covered!</p>
                )}
                {skillGaps.skills.filter((s) => s.status === 'NEEDS_DEVELOPMENT').map((item) => (
                  <div
                    key={item.skillId}
                    onClick={() => setHaveDevelopDetail({
                      title: item.skillName,
                      type: 'develop',
                      desc: `Priority: ${item.priority} for ${skillGaps.career.name}.`,
                    })}
                    className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-white/60 transition-colors cursor-pointer group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#9E4733] shrink-0 mt-1.5" />
                    <div>
                      <span className="text-xs font-semibold text-gray-800 group-hover:text-[#9E4733] transition-colors block">
                        {item.skillName}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          )}
        </motion.div>

        {/* 6. HerNext Insight Card */}
        {skillGaps && topCareer && (
        <motion.div variants={itemVariants}>
          <div className="bg-[#331842] text-white rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden">
            {/* Ambient purple orb */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

            <div className="inline-flex items-center gap-1.5 bg-white/10 text-purple-200 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-4 border border-white/10">
              <span className="text-sm">📍</span> HERNEXT INSIGHT
            </div>

            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-8">
              You don't need to start over to move forward.
            </h3>

            {/* 3 Steps Progression */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
              {/* Node 1 */}
              <motion.div
                whileHover={{ y: -2 }}
                onClick={() => setInsightStageModal({
                  title: 'Skills you already have',
                  desc: skillGaps.skills.filter(s => s.status === 'HAS_SKILL').length > 0
                    ? `These confirmed skills map directly to ${skillGaps.career.name}: ${skillGaps.skills.filter(s => s.status === 'HAS_SKILL').map(s => s.skillName).join(', ')}.`
                    : `No confirmed skills matched ${skillGaps.career.name} yet.`,
                })}
                className="flex flex-col items-center text-center p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer border border-white/5"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/10 text-white flex items-center justify-center mb-3">
                  <CheckCircle2 size={20} />
                </div>
                <span className="text-[10px] text-purple-200/60 font-bold uppercase tracking-wider block mb-1">
                  WHAT YOU HAVE
                </span>
                <h4 className="font-bold text-white text-sm">
                  {skillGaps.skills.filter(s => s.status === 'HAS_SKILL').length} established skills
                </h4>
              </motion.div>

              {/* Arrow 1 */}
              <div className="hidden md:flex absolute left-[31%] top-1/2 transform -translate-y-1/2 text-purple-400/60">
                <ArrowRight size={20} />
              </div>

              {/* Node 2 */}
              <motion.div
                whileHover={{ y: -2 }}
                onClick={() => setInsightStageModal({
                  title: 'Skills to develop',
                  desc: skillGaps.skills.filter(s => s.status === 'NEEDS_DEVELOPMENT').length > 0
                    ? `Close these gaps to strengthen your fit for ${skillGaps.career.name}: ${skillGaps.skills.filter(s => s.status === 'NEEDS_DEVELOPMENT').map(s => s.skillName).join(', ')}.`
                    : `No skill gaps found for ${skillGaps.career.name}.`,
                })}
                className="flex flex-col items-center text-center p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer border border-white/5"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/10 text-white flex items-center justify-center mb-3">
                  <TrendingUp size={20} />
                </div>
                <span className="text-[10px] text-purple-200/60 font-bold uppercase tracking-wider block mb-1">
                  WHAT YOU CAN BUILD
                </span>
                <h4 className="font-bold text-white text-sm">
                  {skillGaps.skills.filter(s => s.status === 'NEEDS_DEVELOPMENT').length} skills to strengthen
                </h4>
              </motion.div>

              {/* Arrow 2 */}
              <div className="hidden md:flex absolute left-[65%] top-1/2 transform -translate-y-1/2 text-purple-400/60">
                <ArrowRight size={20} />
              </div>

              {/* Node 3 */}
              <motion.div
                whileHover={{ y: -2 }}
                onClick={() => setInsightStageModal({
                  title: topCareer.careerName,
                  desc: topCareer.reason,
                })}
                className="flex flex-col items-center text-center p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer border border-white/5"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/10 text-white flex items-center justify-center mb-3">
                  <Sparkles size={20} />
                </div>
                <span className="text-[10px] text-purple-200/60 font-bold uppercase tracking-wider block mb-1">
                  WHERE YOU CAN GO
                </span>
                <h4 className="font-bold text-white text-sm">{topCareer.careerName} · {topCareer.matchScore}%</h4>
              </motion.div>
            </div>
          </div>
        </motion.div>
        )}

        {/* 7. Recommended by HerNext Banner */}
        {skillGaps && topCareer && (() => {
          const topGap = skillGaps.skills.filter(s => s.status === 'NEEDS_DEVELOPMENT')[0];
          return (
        <motion.div variants={itemVariants}>
          <div className="bg-[#FAF0E6] rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-l-4 border-[#9E4733] shadow-xs">
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-[#9E4733] font-bold text-[10px] uppercase tracking-wider">
                <Sparkles size={12} />
                <span>RECOMMENDED BY HERNEXT</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-[#2D1B4E]">
                {topGap ? `Strengthen your ${topGap.skillName} skills` : `Keep building toward ${topCareer.careerName}`}
              </h3>
              <p className="text-xs text-gray-600 max-w-2xl leading-relaxed">
                {topGap
                  ? `Closing this high-priority gap improves your match for ${skillGaps.career.name}.`
                  : `Your skills already cover the requirements for ${skillGaps.career.name}.`}
              </p>
            </div>

            {topGap && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setRoadmapModalSkill(topGap.skillName)}
              className="bg-[#9E4733] hover:bg-[#863b2a] text-white font-bold text-xs px-6 py-3 rounded-xl whitespace-nowrap transition-all shadow-md cursor-pointer shrink-0"
            >
              Add to My Roadmap
            </motion.button>
            )}
          </div>
        </motion.div>
          );
        })()}

        {/* 8. Footer Disclaimer */}
        <motion.div variants={itemVariants} className="pt-2">
          <div className="flex items-start gap-2 text-[11px] text-gray-500 leading-relaxed max-w-4xl border-t border-gray-200/80 pt-4">
            <Info size={14} className="text-gray-400 shrink-0 mt-0.5" />
            <p>
              HerNext AI Skill Analysis interprets the experience data you provide to surface transferable skills and career-relevant gaps. Results are designed to guide your career exploration and should be considered alongside your personal goals.
            </p>
          </div>
        </motion.div>
      </motion.div>

      {/* MODALS */}

      {/* Skill Detail Modal */}
      <AnimatePresence>
        {selectedSkill && (
          <SkillDetailModal 
            skill={selectedSkill}
            onClose={() => setSelectedSkill(null)}
            onAddToRoadmap={(s) => {
              setRoadmapModalSkill(s.name);
            }}
            onSaveToggle={handleSaveToggle}
            isSaved={savedSkillIds.includes(selectedSkill.id)}
          />
        )}
      </AnimatePresence>

      {/* Roadmap Confirmation Modal */}
      <AnimatePresence>
        {roadmapModalSkill && (
          <RoadmapConfirmationModal 
            skillName={roadmapModalSkill}
            onClose={() => setRoadmapModalSkill(null)}
            onConfirm={({ weeklyHours, targetWeeks }) => {
              showToast(`🎯 Added ${roadmapModalSkill} (${weeklyHours} hrs/wk • ${targetWeeks} wks) to your 90-day trajectory!`);
            }}
          />
        )}
      </AnimatePresence>

      {/* Discovery Insight Modal */}
      <AnimatePresence>
        {discoveryStepIndex !== null && (
          <DiscoveryInsightModal 
            initialStepIndex={discoveryStepIndex}
            onClose={() => setDiscoveryStepIndex(null)}
          />
        )}
      </AnimatePresence>

      {/* Add Custom Skill Modal */}
      <AnimatePresence>
        {showAddCustomModal && (
          <AddCustomSkillModal
            onClose={() => setShowAddCustomModal(false)}
            onAddSkill={handleAddCustomSkill}
            isSaving={isSavingSkill}
          />
        )}
      </AnimatePresence>

      {/* HerNext Insight Stage Modal */}
      <AnimatePresence>
        {insightStageModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setInsightStageModal(null)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-purple-100 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C3F96] bg-purple-50 px-2.5 py-1 rounded-full">
                  Career Trajectory Milestone
                </span>
                <button 
                  onClick={() => setInsightStageModal(null)}
                  className="text-gray-400 hover:text-gray-700 text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              <h3 className="text-xl font-black text-[#2D1B4E]">
                {insightStageModal.title}
              </h3>

              <p className="text-xs text-gray-600 leading-relaxed">
                {insightStageModal.desc}
              </p>

              <button
                onClick={() => {
                  setRoadmapModalSkill(insightStageModal.title);
                  setInsightStageModal(null);
                }}
                className="w-full bg-[#2D1B4E] hover:bg-[#431F69] text-white py-3 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                Plan Transition in Roadmap
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Have vs Develop Item Detail Modal */}
      <AnimatePresence>
        {haveDevelopDetail && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setHaveDevelopDetail(null)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-purple-100 space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                  haveDevelopDetail.type === 'have' ? 'bg-purple-100 text-[#8C3F96]' : 'bg-orange-100 text-[#9E4733]'
                }`}>
                  {haveDevelopDetail.type === 'have' ? 'Validated Strength' : 'Priority Growth Area'}
                </span>
                <button 
                  onClick={() => setHaveDevelopDetail(null)}
                  className="text-gray-400 hover:text-gray-700 text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              <h3 className="text-lg font-bold text-[#2D1B4E]">
                {haveDevelopDetail.title}
              </h3>

              <p className="text-xs text-gray-600 leading-relaxed">
                {haveDevelopDetail.desc}
              </p>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  onClick={() => setHaveDevelopDetail(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Close
                </button>
                {haveDevelopDetail.type === 'develop' && (
                  <button
                    onClick={() => {
                      setRoadmapModalSkill(haveDevelopDetail.title);
                      setHaveDevelopDetail(null);
                    }}
                    className="px-4 py-2 bg-[#9E4733] hover:bg-[#863b2a] text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Add to Roadmap
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MySkills;
