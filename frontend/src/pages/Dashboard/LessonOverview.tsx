import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  ArrowLeft,
  Clock,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Zap,
  Layers,
  ExternalLink,
  FileText,
  GraduationCap,
  PlayCircle,
  Loader2,
  Info,
  BookOpen,
  PencilLine,
  WifiOff,
} from 'lucide-react';
import PurpleBackgroundDots from '../../components/dashboard/PurpleBackgroundDots';
import { useNavigate, useParams } from 'react-router-dom';

import {
  describeApiError,
  getCareerRecommendations,
  getCurrentRoadmap,
  getSkillGaps,
  updateRoadmapTaskStatus,
  type RoadmapTask,
} from '../../lib/api';
import {
  getLearningResources,
  getPrimaryVideo,
  videoEmbedUrl,
  type LearningResource,
  type LearningResourceProvider,
  type LearningResourceType,
} from '../../lib/learningResources';
import { getSkillLesson } from '../../lib/skillLessons';

const PROVIDER_ICON: Record<LearningResourceProvider, typeof PlayCircle> = {
  YouTube: PlayCircle,
  Article: FileText,
  Course: GraduationCap,
};

const TYPE_LABEL: Record<LearningResourceType, string> = {
  video: 'Video',
  article: 'Further reading',
  course: 'Course',
};

/**
 * Learning page for a single roadmap task.
 *
 * The page is deliberately honest: it shows curated resources for the exact
 * skill on the task, and when there are none it says so rather than falling
 * back to something unrelated. Nothing here is personalised or generated —
 * the resource list is a hand-curated static catalogue keyed by skill name.
 */
export const LessonOverview: React.FC = () => {
  const navigate = useNavigate();
  const { taskId } = useParams<{ taskId?: string }>();

  const [isLoading, setIsLoading] = useState(Boolean(taskId));
  const [loadError, setLoadError] = useState('');
  const [task, setTask] = useState<RoadmapTask | null>(null);
  const [skillName, setSkillName] = useState<string | null>(null);
  const [resources, setResources] = useState<LearningResource[]>([]);
  const [roadmapProgress, setRoadmapProgress] = useState<number | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [completeError, setCompleteError] = useState('');

  // Static, name-keyed content, so it is derived rather than fetched. A custom
  // or unknown skill resolves to null and renders an honest "not yet" state.
  const lesson = useMemo(() => getSkillLesson(skillName), [skillName]);
  const videos = useMemo(
    () => resources.filter((r) => r.type === 'video' && r.videoId),
    [resources],
  );
  const furtherReading = useMemo(() => resources.filter((r) => r.type !== 'video'), [resources]);
  const primaryVideo = useMemo(
    () => videos[0] ?? getPrimaryVideo(skillName),
    [videos, skillName],
  );
  const extraVideos = useMemo(() => videos.slice(1), [videos]);

  useEffect(() => {
    if (!taskId) return;
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setLoadError('');

      try {
        const roadmap = await getCurrentRoadmap();
        if (cancelled) return;

        const allTasks = [
          ...roadmap.phases.DAY_30,
          ...roadmap.phases.DAY_60,
          ...roadmap.phases.DAY_90,
        ];
        const found = allTasks.find((t) => t.id === taskId) ?? null;
        setTask(found);

        // No task, or a task with no skill link: stop here and let the honest
        // empty state render rather than guessing at a subject.
        if (!found?.skillId) return;

        // Resolve skillId -> skillName using the existing deterministic
        // skill-gaps endpoint. The roadmap API returns the id but not the name.
        try {
          const { recommendations } = await getCareerRecommendations(1);
          const careerId = recommendations[0]?.careerId;
          if (!careerId) return;

          const gaps = await getSkillGaps(careerId);
          if (cancelled) return;

          const gap = gaps.skills.find((g) => g.skillId === found.skillId);
          setSkillName(gap?.skillName ?? null);
          setResources(getLearningResources(gap?.skillName));
        } catch {
          // Unresolved skill: show the honest no-resources state.
        }
      } catch (err) {
        if (cancelled) return;
        setLoadError(
          describeApiError(err, 'We could not load this roadmap task. Please try again.'),
        );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [taskId]);

  /**
   * Marks the task complete through the existing authoritative endpoint. The
   * response carries the server-recomputed progress, so the UI reflects the
   * backend rather than keeping a competing local flag.
   */
  const handleMarkComplete = async () => {
    if (!task || isCompleting || task.status === 'COMPLETED') return;
    setIsCompleting(true);
    setCompleteError('');
    try {
      const updated = await updateRoadmapTaskStatus(task.id, 'COMPLETED');
      setRoadmapProgress(updated.roadmapProgress);
      setTask((prev) =>
        prev
          ? { ...prev, status: updated.status, completedAt: updated.completedAt }
          : prev,
      );
    } catch (err) {
      setCompleteError(describeApiError(err, 'We could not update this task. Please try again.'));
    } finally {
      setIsCompleting(false);
    }
  };

  const isCompleted = task?.status === 'COMPLETED';
  const progressPercent = roadmapProgress ?? null;

  const renderNoResources = () => (
    <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-purple-100/80 shadow-xs">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#F05A7E]/15 text-[#F05A7E] flex items-center justify-center shrink-0">
          <Info size={20} />
        </div>
        <div>
          <h3 className="text-sm font-extrabold text-[#2D1B4E]">
            This roadmap task doesn&apos;t have learning resources yet.
          </h3>
          <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">
            {skillName
              ? `We don't have curated resources for ${skillName} yet.`
              : task
                ? 'We could not work out which skill this task builds, so we are not showing resources for it.'
                : 'We could not find this task on your current roadmap.'}
          </p>
        </div>
      </div>
    </div>
  );

  /**
   * HerNext's own lesson for the skill. This is the part the participant can
   * complete without leaving the page, so it comes before any external link.
   */
  const renderLesson = () => {
    if (!lesson) return null;
    return (
      <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-purple-100/80 shadow-xs space-y-5">
        <div className="space-y-1">
          <h2 className="text-base sm:text-lg font-extrabold text-[#2D1B4E]">
            What {skillName} actually involves
          </h2>
          <p className="text-xs text-gray-500 font-medium">
            A short lesson from HerNext. The resources below add to it, they are not a substitute
            for it.
          </p>
        </div>

        <div className="bg-[#FAF8FC] border border-purple-100/70 rounded-2xl p-4">
          <span className="text-[10px] font-extrabold text-[#9E4733] uppercase tracking-wider block mb-1">
            Why this matters
          </span>
          <p className="text-xs sm:text-sm text-gray-700 leading-relaxed font-medium">
            {lesson.whyItMatters}
          </p>
        </div>

        <div className="space-y-2.5">
          <h3 className="text-xs font-extrabold text-[#2D1B4E] uppercase tracking-wider">
            What you&apos;ll learn
          </h3>
          <div className="space-y-2">
            {lesson.whatYouWillLearn.map((point, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs text-gray-700">
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed font-medium">{point}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2.5">
          <h3 className="text-xs font-extrabold text-[#2D1B4E] uppercase tracking-wider">
            Key takeaways
          </h3>
          <ul className="space-y-1.5">
            {lesson.keyTakeaways.map((point, idx) => (
              <li
                key={idx}
                className="text-xs text-gray-700 leading-relaxed font-medium flex gap-2"
              >
                <span className="text-[#8C3F96] font-extrabold shrink-0">—</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-[#FDF2F5]/80 border border-[#FDF2F5] rounded-2xl p-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#F05A7E]/15 text-[#F05A7E] flex items-center justify-center shrink-0">
            <PencilLine size={16} />
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-[#F05A7E] uppercase tracking-wider block">
              Try this while you learn
            </span>
            <p className="text-xs text-gray-700 leading-relaxed font-medium mt-0.5">
              {lesson.practicePrompt}
            </p>
          </div>
        </div>
      </div>
    );
  };

  /**
   * The primary video plays here, so watching the lesson does not require
   * leaving HerNext. The provider link stays visible for attribution and for
   * anyone who prefers YouTube's own player.
   */
  const renderVideo = () => {
    if (!primaryVideo?.videoId) return null;
    return (
      <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-purple-100/80 shadow-xs space-y-4">
        <div className="space-y-1">
          <h2 className="text-base sm:text-lg font-extrabold text-[#2D1B4E]">
            Watch: {primaryVideo.title}
          </h2>
          <p className="text-xs text-gray-500 font-medium">
            {primaryVideo.provider}
            {primaryVideo.durationMinutes ? ` · ${primaryVideo.durationMinutes} min` : ''}
          </p>
        </div>

        <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-purple-100/80 bg-black">
          <iframe
            src={videoEmbedUrl(primaryVideo.videoId)}
            title={primaryVideo.title}
            loading="lazy"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="absolute inset-0 w-full h-full"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-xs text-gray-600 leading-relaxed font-medium">
            {primaryVideo.summary}
          </p>
          <a
            href={primaryVideo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center justify-center gap-1.5 text-[11px] font-bold text-[#8C3F96] hover:text-[#5B2975] border border-purple-100 bg-purple-50 px-3.5 py-2 rounded-xl transition-colors"
          >
            Open on {primaryVideo.provider}
            <ExternalLink size={12} />
          </a>
        </div>

        {extraVideos.length > 0 ? (
          <div className="space-y-2 pt-1 border-t border-purple-100/60">
            <h3 className="text-[10px] font-extrabold text-[#2D1B4E] uppercase tracking-wider pt-2">
              More videos
            </h3>
            {extraVideos.map((video) => (
              <a
                key={video.url}
                href={video.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 text-xs text-gray-700 hover:text-[#5B2975] transition-colors"
              >
                <PlayCircle size={15} className="text-[#8C3F96] shrink-0" />
                <span className="font-semibold">{video.title}</span>
                <ExternalLink size={11} className="text-gray-400 shrink-0" />
              </a>
            ))}
          </div>
        ) : null}
      </div>
    );
  };

  /**
   * Articles and courses. These are never embedded or copied — HerNext has
   * already taught the skill above, and these are the provider's own material
   * for going deeper.
   */
  const renderFurtherReading = () => {
    if (furtherReading.length === 0) return null;
    return (
      <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-purple-100/80 shadow-xs space-y-4">
        <div className="space-y-1">
          <h2 className="text-base sm:text-lg font-extrabold text-[#2D1B4E]">Go deeper</h2>
          <p className="text-xs text-gray-500 font-medium">
            Reference material from {skillName} providers, on their own sites.
          </p>
        </div>

        <ul className="space-y-3">
          {furtherReading.map((resource) => {
            const Icon = PROVIDER_ICON[resource.provider];
            return (
              <li
                key={resource.url}
                className="bg-[#FAF8FC] border border-purple-100/70 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-white border border-purple-100 text-[#8C3F96] flex items-center justify-center shrink-0">
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs sm:text-sm font-bold text-[#2D1B4E]">
                        {resource.title}
                      </span>
                      <span className="inline-flex items-center gap-1 bg-purple-50 text-[#8C3F96] text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-100">
                        {TYPE_LABEL[resource.type]}
                      </span>
                      <span className="inline-flex items-center gap-1 bg-white text-gray-500 text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-100">
                        {resource.provider}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-600 mt-1 leading-relaxed">
                      {resource.summary}
                    </p>
                  </div>
                </div>

                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 inline-flex items-center justify-center gap-1.5 bg-[#2D1B4E] hover:bg-[#431F69] text-white font-bold text-[11px] px-4 py-2.5 rounded-xl transition-colors"
                >
                  {resource.type === 'course' ? 'Course details' : 'Read more'}
                  <ExternalLink size={13} />
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  const renderTaskPanel = () => {
    if (isLoading) {
      return (
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 border border-purple-100/80 shadow-xs flex items-center justify-center gap-2.5 text-xs text-gray-500 font-medium">
          <Loader2 size={16} className="animate-spin" />
          Loading your roadmap task…
        </div>
      );
    }

    if (loadError) {
      return (
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 border border-purple-100/80 shadow-xs space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#F05A7E]/15 text-[#F05A7E] flex items-center justify-center shrink-0">
              <WifiOff size={18} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-[#2D1B4E]">
                We could not load this task
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed mt-1">{loadError}</p>
            </div>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="text-[11px] font-bold text-[#8C3F96] hover:text-[#5B2975] cursor-pointer"
          >
            Try again
          </button>
        </div>
      );
    }

    if (!task) {
      return renderNoResources();
    }

    return (
      <div className="space-y-4">
        {/* The skill this task builds */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-purple-100/80 shadow-xs space-y-4">
          <div className="inline-flex items-center gap-1.5 bg-[#FDF2F5] text-[#F05A7E] px-3.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
            <span>ROADMAP TASK</span>
          </div>

          <div className="space-y-1.5">
            <h1 className="text-xl sm:text-3xl font-extrabold text-[#2D1B4E] tracking-tight leading-tight">
              {skillName ? `Learn: ${skillName}` : task.title}
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed max-w-3xl">
              {skillName
                ? 'Build this skill as part of your roadmap.'
                : 'This roadmap task is not linked to a skill yet, so HerNext cannot show skill-specific resources for it.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium text-gray-500">
            {task.estimatedMinutes ? (
              <span className="inline-flex items-center gap-1 bg-purple-50 text-[#8C3F96] font-bold px-2.5 py-1 rounded-full border border-purple-100">
                <Clock size={12} /> {task.estimatedMinutes} min
              </span>
            ) : null}
            {progressPercent !== null ? (
              <span className="inline-flex items-center gap-1 bg-[#FAF8FC] text-[#2D1B4E] font-bold px-2.5 py-1 rounded-full border border-purple-100">
                <Layers size={12} /> Roadmap {Math.round(progressPercent)}% complete
              </span>
            ) : null}
            {isCompleted ? (
              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-full border border-emerald-100">
                <CheckCircle2 size={12} /> Task complete
              </span>
            ) : null}
          </div>

          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed border-l-2 border-purple-200 pl-3">
            {task.description}
          </p>
        </div>

        {/* HerNext's own lesson first, then the video, then supporting links. */}
        {lesson ? renderLesson() : null}
        {renderVideo()}
        {renderFurtherReading()}

        {/* Only when the skill is known but genuinely has nothing attached. */}
        {!lesson && resources.length === 0 ? renderNoResources() : null}

        {/* Task completion: the existing backend endpoint, nothing local. */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 border border-purple-100/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-extrabold text-[#2D1B4E] block">
              {isCompleted ? 'You completed this task' : 'Finished learning?'}
            </span>
            <span className="text-[11px] text-gray-500 font-medium">
              {isCompleted
                ? 'Your roadmap progress has been updated.'
                : 'Mark this roadmap task complete to update your progress.'}
            </span>
            {completeError ? (
              <span className="text-[11px] text-[#F05A7E] font-semibold block mt-1">
                {completeError}
              </span>
            ) : null}
          </div>

          {isCompleted ? (
            <button
              onClick={() => navigate('/dashboard/roadmap')}
              className="bg-[#2D1B4E] hover:bg-[#431F69] text-white font-bold text-xs px-6 py-3 rounded-2xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Back to My Roadmap</span>
              <ArrowRight size={15} />
            </button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleMarkComplete}
              disabled={isCompleting}
              className="bg-[#2D1B4E] hover:bg-[#431F69] disabled:opacity-50 text-white font-bold text-xs px-6 py-3 rounded-2xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              {isCompleting ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <CheckCircle2 size={15} />
              )}
              <span>{isCompleting ? 'Saving…' : 'Mark Task Complete'}</span>
            </motion.button>
          )}
        </div>
      </div>
    );
  };

  const renderGeneralCourse = () => (
    <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-purple-100/80 shadow-xs space-y-6">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-1.5 bg-[#FDF2F5] text-[#F05A7E] px-3.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
          <span>GENERAL COURSE</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold text-[#2D1B4E] tracking-tight leading-tight">
          AI Fundamentals for Working Roles
        </h1>

        <p className="text-xs sm:text-sm text-gray-600 max-w-3xl leading-relaxed">
          Build the AI knowledge you need to make better decisions and stay valuable as AI changes
          the way your field works.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-7 items-start">
        <div className="md:col-span-5 relative group overflow-hidden rounded-2xl border border-purple-100/80 shadow-xs">
          <img
            src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800"
            alt="Learner studying AI fundamentals"
            className="w-full h-72 object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-4">
            <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl text-[11px] font-bold text-[#2D1B4E] flex items-center gap-1.5">
              <Sparkles size={13} className="text-[#8C3F96]" /> Core Foundation Module
            </div>
          </div>
        </div>

        <div className="md:col-span-7 space-y-4">
          <div className="inline-flex items-center gap-1 text-[10px] font-extrabold text-[#9E4733] uppercase tracking-wider">
            <span>YOUR NEXT STEP</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-[#2D1B4E]">
            AI Fundamentals for Working Roles
          </h2>

          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
            Understand how AI is changing everyday work, where people create the most human value,
            and how to use AI responsibly in your day-to-day workflow.
          </p>

          <div className="space-y-2.5 pt-2">
            <h4 className="text-xs font-extrabold text-[#2D1B4E] uppercase tracking-wider">
              WHAT YOU&apos;LL LEARN IN THIS LESSON
            </h4>
            <div className="space-y-2">
              {[
                'Understand the fundamentals of AI and modern machine learning concepts without reading code.',
                'See how AI is changing day-to-day workflows and the tools people rely on.',
                'Identify where people add value through empathy, ethical framing, and strategic intuition.',
                'Apply AI responsibly while avoiding bias, hallucination, and dark patterns.',
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

      <div className="grid grid-cols-3 gap-4 bg-[#FAF8FC] border border-purple-100/70 rounded-2xl p-4 text-center">
        <div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">
            EST. TIME
          </span>
          <span className="text-xs sm:text-sm font-extrabold text-[#2D1B4E] flex items-center justify-center gap-1">
            <Clock size={14} className="text-[#8C3F96]" /> 15 min
          </span>
        </div>
        <div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">
            DIFFICULTY
          </span>
          <span className="text-xs sm:text-sm font-extrabold text-[#2D1B4E] flex items-center justify-center gap-1">
            <Zap size={14} className="text-[#9E4733]" /> Beginner
          </span>
        </div>
        <div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">
            STRUCTURE
          </span>
          <span className="text-xs sm:text-sm font-extrabold text-[#2D1B4E] flex items-center justify-center gap-1">
            <Layers size={14} className="text-[#F05A7E]" /> 4 Lessons
          </span>
        </div>
      </div>

      <div className="bg-[#FAF8FC] border border-purple-100/80 rounded-2xl p-4 text-xs text-gray-600 leading-relaxed">
        <strong className="text-[#2D1B4E] font-bold block mb-1">Why this matters:</strong>
        AI is changing how teams of every kind work. Understanding where AI helps versus where human
        judgment matters will help you become a stronger, more adaptable professional.
      </div>

      <div className="bg-[#FDF2F5]/80 border border-[#FDF2F5] rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#F05A7E]/15 text-[#F05A7E] flex items-center justify-center">
            <ShieldCheck size={20} />
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-[#F05A7E] uppercase tracking-wider block">
              VERIFIED COMPETENCY
            </span>
            <span className="text-xs font-bold text-[#2D1B4E]">AI Awareness</span>
          </div>
        </div>
        <span className="text-[11px] text-gray-500 font-medium">
          Added to Career Passport upon completion
        </span>
      </div>

      <div className="pt-4 border-t border-purple-100/60 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-center sm:text-left">
          <span className="text-xs font-bold text-[#2D1B4E] block">Ready to begin?</span>
          <span className="text-[11px] text-gray-500 font-medium">
            You can complete this lesson in about 15 minutes.
          </span>
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
  );

  return (
    <div className="relative min-h-screen">
      <PurpleBackgroundDots dotCount={35} />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-5xl mx-auto space-y-6 pb-24 pt-2 font-sans text-gray-800 relative z-10"
      >
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
            {taskId ? (
              <span className="inline-flex items-center gap-1 bg-purple-50 text-[#8C3F96] text-[11px] font-bold px-2.5 py-1 rounded-full border border-purple-100">
                <BookOpen size={12} /> Skill learning
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 bg-purple-50 text-[#8C3F96] text-[11px] font-bold px-2.5 py-1 rounded-full border border-purple-100">
                <Clock size={12} /> 15 min
              </span>
            )}
          </div>
        </div>

        {taskId ? renderTaskPanel() : renderGeneralCourse()}
      </motion.div>
    </div>
  );
};

export default LessonOverview;