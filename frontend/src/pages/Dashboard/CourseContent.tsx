import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Check, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  XCircle,
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  Award, 
  X,
  Menu,
  Lightbulb,
  RotateCcw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PRESET_PRODUCTS = [
  {
    name: 'Jumia (E-commerce App)',
    opportunities: [
      {
        what: 'Smart search that understands natural local language queries and misspelled brand names instead of strict keyword matching.',
        why: 'Shoppers often abandon search when zero results appear for colloquial terms; AI can interpret user intent while allowing human filters for exact brands.'
      },
      {
        what: 'Summarizing customer product reviews into concise pros and cons tags on product detail pages.',
        why: 'Saves users time scrolling through hundreds of repetitive reviews while highlighting frequent sizing and quality themes.'
      },
      {
        what: 'Instant order delivery estimation that accounts for local traffic patterns and dispatch center delays.',
        why: 'Reduces post-purchase anxiety and buyer support tickets with realistic dynamic arrival dates.'
      }
    ]
  },
  {
    name: 'Spotify (Music Streaming)',
    opportunities: [
      {
        what: 'AI DJ transition generator that mixes tracks based on real-time listener activity and ambient telemetry.',
        why: 'Creates continuous audio flow states for workouts and focus sessions without manual playlist creation.'
      },
      {
        what: 'Natural language search for hyper-specific contextual vibes ("Lofi beats for late night coding").',
        why: 'Replaces tedious multi-keyword searching with instant intent-based music discovery.'
      },
      {
        what: 'Real-time lyrics translation and cultural context overlays for international tracks.',
        why: 'Helps listeners understand foreign language nuance while keeping original vocal performances intact.'
      }
    ]
  },
  {
    name: 'Figma (Design Tool)',
    opportunities: [
      {
        what: 'Automated accessibility audit and contrast auto-fix suggestions on canvas during component wiring.',
        why: 'Prevents expensive late-stage redesigns by enforcing WCAG compliance directly inside the design phase.'
      },
      {
        what: 'Generative responsive layout variations based on established design system tokens.',
        why: 'Eliminates repetitive auto-layout configuration so product designers focus on user flows.'
      },
      {
        what: 'AI microcopy generator tailored to brand voice guidelines and target user demographics.',
        why: 'Ensures tone consistency across global surfaces while speeding up localized copy iterations.'
      }
    ]
  }
];

interface LessonItem {
  id: string;
  numberStr: string;
  title: string;
  duration: string;
  videoUrl: string;
  subtitle: string;
  articleContent: string[];
  keyTakeaway: string;
}

const LESSONS: LessonItem[] = [
  {
    id: 'lesson-1',
    numberStr: '01',
    title: 'What is AI?',
    duration: '4 min',
    videoUrl: 'https://www.youtube.com/embed/aircAruvnKk',
    subtitle: 'Understand the fundamentals of AI and why they matter for modern product designers.',
    articleContent: [
      'Artificial intelligence allows computer systems to perform tasks that typically require human intelligence, such as recognizing patterns, generating content, making predictions, and supporting decisions.',
      'In modern digital products, AI is shifting interfaces from static UI templates to adaptive, conversational, and predictive experiences. Designers no longer just draw static layouts—they design system behaviors, confidence intervals, and fallback states.'
    ],
    keyTakeaway: 'AI can extend what you can do as a designer—but human judgment, context, empathy, and creativity still matter.'
  },
  {
    id: 'lesson-2',
    numberStr: '02',
    title: 'How AI is changing product design',
    duration: '4 min',
    videoUrl: 'https://www.youtube.com/embed/G2fqAlgmoPo',
    subtitle: 'Explore how generative AI and neural models transform discovery, wireframing, and UI patterns.',
    articleContent: [
      'AI is fundamentally altering the product development lifecycle. During discovery, researchers use synthetic personas and automated telemetry synthesis to uncover user friction points instantly.',
      'In interface design, static forms are giving way to dynamic prompt bars, multi-modal canvases, and ambient intelligent suggestions. Designers now manage output probability rather than fixed screen paths.'
    ],
    keyTakeaway: 'Instead of designing rigid page flows, AI designers create adaptive systems that respond intelligently to diverse user inputs.'
  },
  {
    id: 'lesson-3',
    numberStr: '03',
    title: 'Where designers add human value',
    duration: '3 min',
    videoUrl: 'https://www.youtube.com/embed/JMUxmLyrhSk',
    subtitle: 'Identify the irreplaceable human elements in AI product development.',
    articleContent: [
      'While AI can generate code and interface mockups at scale, it lacks genuine human empathy, moral intuition, and deep domain context.',
      'Designers add high-leverage value by framing the right problems, setting ethical guardrails, evaluating output alignment, and advocating for user safety and clarity.'
    ],
    keyTakeaway: 'The value of a designer shifts from execution artifact creation to high-level system framing, ethical alignment, and human empathy.'
  },
  {
    id: 'lesson-4',
    numberStr: '04',
    title: 'Using AI responsibly',
    duration: '4 min',
    videoUrl: 'https://www.youtube.com/embed/f3j_V-LgE7Q',
    subtitle: 'Master safety guardrails, avoiding hallucination traps, bias, and deceptive UX patterns.',
    articleContent: [
      'Responsible AI design requires active vigilance against model hallucination, privacy breaches, and opaque algorithm decisions.',
      'Always provide users with transparent confidence scores, visible edit controls, and clear disclaimers when interacting with generated intelligence.'
    ],
    keyTakeaway: 'Trust is the core currency of AI products. Responsible UX design ensures users stay empowered, informed, and in control.'
  }
];

interface QuizQuestion {
  id: number;
  question: string;
  subtitle: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: "What is one primary way AI supports a product designer in their workflow?",
    subtitle: "Select the best response based on Lesson 01: What is AI?",
    options: [
      "Replace the designer's judgment completely",
      "Help analyze research, uncover patterns, and automate repetitive tasks",
      "Decide which problems users should have without user testing",
      "Remove the need to understand user empathy"
    ],
    correctIndex: 1,
    explanation: "AI acts as a force multiplier for designers by analyzing telemetry data and pattern synthesis, but human context and judgment remain critical."
  },
  {
    id: 2,
    question: "How do probabilistic AI interfaces differ from traditional UI?",
    subtitle: "Select the best response based on Lesson 02: Interface Patterns.",
    options: [
      "They only work on desktop screens",
      "They adapt dynamically to inputs and handle variable confidence levels",
      "They require zero input from human users",
      "They use rigid, fixed templates for all interactions"
    ],
    correctIndex: 1,
    explanation: "Traditional UI is deterministic (fixed templates), whereas AI UI handles probability, dynamic generative canvases, and confidence thresholds."
  },
  {
    id: 3,
    question: "Where do human designers provide the highest strategic value in AI products?",
    subtitle: "Select the key area where human judgment matters most (Lesson 03).",
    options: [
      "Problem framing, human empathy, and setting ethical guardrails",
      "Writing raw low-level C++ machine learning code",
      "Manually creating thousands of static image variants",
      "Ignoring user accessibility guidelines"
    ],
    correctIndex: 0,
    explanation: "While AI handles rapid generation, human designers excel at high-level problem framing, moral intuition, and user empathy."
  },
  {
    id: 4,
    question: "What is the responsible UX pattern for handling AI model hallucination in UI design?",
    subtitle: "Choose the responsible AI interface pattern (Lesson 04).",
    options: [
      "Hide all model uncertainty from users",
      "Display transparent confidence indicators, disclaimers, and clear edit controls",
      "Prevent users from providing feedback or correcting outputs",
      "Assume model outputs are always 100% accurate"
    ],
    correctIndex: 1,
    explanation: "Responsible AI design maintains user trust by showing transparent model confidence and allowing users to edit generated content."
  },
  {
    id: 5,
    question: "Why is human empathy essential when building AI products?",
    subtitle: "Select the foundational reason why empathy drives AI product design.",
    options: [
      "AI models process data but lack genuine emotional understanding and moral context",
      "AI models already possess complete human emotional intelligence",
      "Empathy is no longer relevant in software product design",
      "Empathy only applies to physical product manufacturing"
    ],
    correctIndex: 0,
    explanation: "Neural networks process telemetry patterns but cannot experience empathy or moral responsibility; that remains uniquely human."
  }
];

export const CourseContent: React.FC = () => {
  const navigate = useNavigate();

  // Active View Section: 'lesson' | 'quick-check' | 'practice' | 'challenge' | 'evidence'
  const [activeSection, setActiveSection] = useState<'lesson' | 'quick-check' | 'practice' | 'challenge' | 'evidence'>('lesson');
  const [activeLessonIndex, setActiveLessonIndex] = useState(0);
  const [completedLessons, setCompletedLessons] = useState<number[]>([]);
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);

  // Quick Check State & Grading
  const [currentQuizQuestionIndex, setCurrentQuizQuestionIndex] = useState(0);
  const [quizSelectedAnswers, setQuizSelectedAnswers] = useState<Record<number, number>>({});
  const [, setQuizCompleted] = useState(false);
  const [quizPassed, setQuizPassed] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [showQuizResults, setShowQuizResults] = useState(false);

  // Practice & Challenge state
  const [practiceCompleted, setPracticeCompleted] = useState(false);
  const [challengeCompleted, setChallengeCompleted] = useState(false);

  // Challenge / Prove It Interactive Form State
  const [challengeProblem, setChallengeProblem] = useState(
    'Users encounter cryptic error codes (e.g. ERR_702) with zero actionable guidance, leading to anxiety, panic-tapping retry, and support call volume.'
  );
  const [challengeSolution, setChallengeSolution] = useState(
    'A contextual failure translator that parses backend error codes, account state, and transaction intent into plain-language diagnosis (e.g. "Your daily card limit was reached") paired with an immediate, one-tap resolution pathway.'
  );
  const [challengeReasoning, setChallengeReasoning] = useState(
    'AI handles dynamic multi-factor error conditions across partner banking rails without rigid static copy templates, while keeping the user fully in control by requiring explicit biometric approval before re-routing or re-attempting.'
  );
  const [isSubmittingChallenge, setIsSubmittingChallenge] = useState(false);

  const handleSubmitChallenge = () => {
    if (!challengeProblem.trim() || !challengeSolution.trim() || !challengeReasoning.trim()) {
      showToast('⚠️ Please complete all 3 design workspace fields before submitting your challenge!');
      return;
    }

    setIsSubmittingChallenge(true);
    showToast('⚡ HerNext AI Concierge reviewing your AI UX Evaluation...');

    setTimeout(() => {
      setIsSubmittingChallenge(false);
      setChallengeCompleted(true);
      setActiveSection('evidence');
      showToast('🏆 CONGRATULATIONS! Verified Competency Evidence added to your Career Passport!');
    }, 1000);
  };

  // Practice Interactive State
  const [selectedProduct, setSelectedProduct] = useState('Jumia (E-commerce App)');
  const [isCustomProduct, setIsCustomProduct] = useState(false);
  const [customProductName, setCustomProductName] = useState('');
  const [opportunities, setOpportunities] = useState(PRESET_PRODUCTS[0].opportunities);
  const [showPracticeEvalModal, setShowPracticeEvalModal] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);

  const handleProductChange = (val: string) => {
    if (val === 'custom') {
      setIsCustomProduct(true);
      setSelectedProduct('Custom Product');
      setCustomProductName('');
      setOpportunities([
        { what: '', why: '' },
        { what: '', why: '' },
        { what: '', why: '' }
      ]);
    } else {
      setIsCustomProduct(false);
      setSelectedProduct(val);
      const preset = PRESET_PRODUCTS.find(p => p.name === val);
      if (preset) {
        setOpportunities([...preset.opportunities]);
      }
    }
  };

  const handleOpportunityChange = (index: number, field: 'what' | 'why', value: string) => {
    const updated = [...opportunities];
    updated[index] = { ...updated[index], [field]: value };
    setOpportunities(updated);
  };

  const handleResetPreset = () => {
    setIsCustomProduct(false);
    setSelectedProduct('Jumia (E-commerce App)');
    setCustomProductName('');
    setOpportunities([...PRESET_PRODUCTS[0].opportunities]);
    showToast('🔄 Reset opportunities to Jumia (E-commerce App) default example.');
  };

  const handleRefineWithAI = (index: number) => {
    const current = opportunities[index];
    if (!current.what.trim()) {
      showToast('💡 Please enter a brief idea first before asking AI Concierge to refine!');
      return;
    }
    const refinedWhat = `${current.what.trim()} (Enhanced with multi-modal intent parsing)`;
    const refinedWhy = current.why.trim() 
      ? `${current.why.trim()} Neural feedback loop ensures human control.`
      : 'Significantly improves user engagement while maintaining designer intent oversight.';

    const updated = [...opportunities];
    updated[index] = { what: refinedWhat, why: refinedWhy };
    setOpportunities(updated);
    showToast(`✨ Opportunity ${index + 1} refined by HerNext AI Concierge!`);
  };

  const handleSubmitPractice = () => {
    const missing = opportunities.some(o => !o.what.trim() || !o.why.trim());
    if (missing) {
      showToast('⚠️ Please complete all 3 opportunities and rationale fields before submitting!');
      return;
    }

    setIsEvaluating(true);
    showToast('🤖 HerNext AI Concierge is evaluating your 3 AI opportunities...');

    setTimeout(() => {
      setIsEvaluating(false);
      setPracticeCompleted(true);
      setShowPracticeEvalModal(true);
    }, 1200);
  };

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const activeLesson = LESSONS[activeLessonIndex];
  const currentQuizQuestion = QUIZ_QUESTIONS[currentQuizQuestionIndex];

  // Dynamic percentage calculation matching Figma
  let progressPercent = 8;
  if (activeSection === 'evidence' || challengeCompleted) progressPercent = 100;
  else if (activeSection === 'challenge') progressPercent = 95;
  else if (practiceCompleted) progressPercent = 88;
  else if (quizPassed) progressPercent = 75;
  else if (completedLessons.length === 4) progressPercent = 65;
  else if (completedLessons.length === 3) progressPercent = 50;
  else if (completedLessons.length === 2) progressPercent = 35;
  else if (completedLessons.length === 1) progressPercent = 20;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3800);
  };

  // Lesson selection with strict lock rule
  const handleSelectLesson = (index: number) => {
    if (index === 0 || completedLessons.includes(index - 1) || completedLessons.includes(index)) {
      setActiveLessonIndex(index);
      setActiveSection('lesson');
      setSidebarMobileOpen(false);
    } else {
      showToast(`🔒 Please complete Lesson 0${index} first to unlock Lesson 0${index + 1}!`);
    }
  };

  // Complete Active Lesson & Unlock Next
  const handleCompleteCurrentLesson = () => {
    if (!completedLessons.includes(activeLessonIndex)) {
      const updated = [...completedLessons, activeLessonIndex];
      setCompletedLessons(updated);
      showToast(`🎉 Lesson 0${activeLessonIndex + 1} Completed!`);

      if (activeLessonIndex < LESSONS.length - 1) {
        setActiveLessonIndex(activeLessonIndex + 1);
      } else {
        showToast(`✨ All 4 lessons complete! Quick Check is now active.`);
        setActiveSection('quick-check');
      }
    } else if (activeLessonIndex < LESSONS.length - 1) {
      setActiveLessonIndex(activeLessonIndex + 1);
    } else {
      setActiveSection('quick-check');
    }
  };

  const handlePreviousLesson = () => {
    if (activeLessonIndex > 0) {
      setActiveLessonIndex(activeLessonIndex - 1);
    }
  };

  // Quick Check Navigation & Real Grading
  const handleQuickCheckNext = () => {
    if (quizSelectedAnswers[currentQuizQuestionIndex] === undefined) {
      showToast("⚠️ Please select an answer before continuing!");
      return;
    }

    if (currentQuizQuestionIndex < QUIZ_QUESTIONS.length - 1) {
      setCurrentQuizQuestionIndex(currentQuizQuestionIndex + 1);
    } else {
      // Calculate Grade
      let correct = 0;
      QUIZ_QUESTIONS.forEach((q, idx) => {
        if (quizSelectedAnswers[idx] === q.correctIndex) {
          correct += 1;
        }
      });
      const score = Math.round((correct / QUIZ_QUESTIONS.length) * 100);
      setCorrectCount(correct);
      setQuizScore(score);

      const isPass = score >= 80; // 80% minimum passing threshold (4 out of 5)
      setQuizPassed(isPass);

      if (isPass) {
        setQuizCompleted(true);
        showToast(`🎉 Quick Check Passed with ${score}%! Practice Activity is now unlocked.`);
      } else {
        showToast(`⚠️ Score: ${score}% (${correct}/5 correct). 80% required to pass. Please retake the check.`);
      }

      setShowQuizResults(true);
    }
  };

  const handleRetakeQuiz = () => {
    setQuizSelectedAnswers({});
    setCurrentQuizQuestionIndex(0);
    setShowQuizResults(false);
    showToast("🔄 Quick Check reset. Select your answers carefully!");
  };

  const handleSkipQuestion = () => {
    if (currentQuizQuestionIndex < QUIZ_QUESTIONS.length - 1) {
      setCurrentQuizQuestionIndex(currentQuizQuestionIndex + 1);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8FC] font-sans text-gray-800 flex flex-col relative overflow-x-hidden">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-20 right-4 sm:right-8 z-50 bg-[#261338] text-white text-xs px-4 py-3 rounded-2xl shadow-2xl border border-purple-400/30 flex items-center gap-2.5 backdrop-blur-md max-w-sm sm:max-w-md"
          >
            <div className="w-6 h-6 rounded-full bg-[#F05A7E]/20 text-[#F05A7E] flex items-center justify-center shrink-0">
              <Sparkles size={13} />
            </div>
            <span className="font-semibold leading-relaxed">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header Bar matching Figma design */}
      <header className="h-16 bg-white border-b border-purple-100/80 px-4 md:px-8 flex items-center justify-between shrink-0 shadow-2xs z-20">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setSidebarMobileOpen(!sidebarMobileOpen)}
            className="md:hidden p-2 text-gray-600 hover:text-[#2D1B4E] rounded-lg hover:bg-purple-50"
            aria-label="Toggle course menu"
          >
            <Menu size={20} />
          </button>

          <button 
            onClick={() => navigate('/dashboard/roadmap')}
            className="text-xs font-bold text-gray-600 hover:text-[#2D1B4E] flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Back to Career Roadmap</span>
            <span className="sm:hidden">Roadmap</span>
          </button>
        </div>

        <div className="text-center hidden md:flex items-center gap-2">
          <h2 className="text-sm font-extrabold text-[#2D1B4E]">
            AI Fundamentals for Product Designers
          </h2>
          {activeSection === 'quick-check' ? (
            <span className="text-[11px] font-extrabold text-[#F05A7E] bg-[#FDF2F5] px-2.5 py-0.5 rounded-full inline-block">
              Quick Check
            </span>
          ) : activeSection === 'practice' ? (
            <span className="text-[11px] font-extrabold text-[#F05A7E] bg-[#FDF2F5] px-2.5 py-0.5 rounded-full inline-block">
              Practice · 20 min
            </span>
          ) : activeSection === 'challenge' ? (
            <span className="text-[11px] font-extrabold text-[#F05A7E] bg-[#FDF2F5] px-2.5 py-0.5 rounded-full inline-block">
              Challenge · 30 min
            </span>
          ) : activeSection === 'evidence' ? (
            <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full inline-block">
              Evidence · Complete
            </span>
          ) : (
            <span className="text-[11px] font-bold text-[#F05A7E] bg-[#FDF2F5] px-2.5 py-0.5 rounded-full inline-block">
              Lesson {activeLessonIndex + 1} of 4
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-extrabold text-[#2D1B4E]">{progressPercent}% Complete</span>
          <div className="w-20 sm:w-36 bg-purple-50 rounded-full h-2 overflow-hidden border border-purple-100/80">
            <motion.div 
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5 }}
              className="bg-gradient-to-r from-[#9E4733] to-[#F05A7E] h-full rounded-full"
            />
          </div>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {sidebarMobileOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarMobileOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Main Split Layout: Left Sidebar + Right In-Line Content View */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        
        {/* LEFT SIDEBAR: Course Content Navigation matching Figma Screenshot */}
        <aside className={`
          fixed md:static inset-y-0 left-0 z-40 w-80 bg-white border-r border-purple-100/80 p-5 overflow-y-auto shrink-0 space-y-6 transition-transform duration-300 ease-in-out
          ${sidebarMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-[#2D1B4E]">Course Content</h3>
              <span className="text-[11px] text-gray-400 font-medium">4 lessons · 15 min</span>
            </div>
            <button 
              onClick={() => setSidebarMobileOpen(false)}
              className="md:hidden text-gray-400 hover:text-gray-700"
            >
              <X size={18} />
            </button>
          </div>

          {/* Section 1: LEARN */}
          <div className="space-y-2">
            <span className="text-[10px] font-extrabold text-[#8C3F96] tracking-wider uppercase block">
              LEARN
            </span>

            <div className="space-y-1.5">
              {LESSONS.map((les, idx) => {
                const isActive = activeSection === 'lesson' && activeLessonIndex === idx;
                const isDone = completedLessons.includes(idx);
                const isUnlocked = idx === 0 || completedLessons.includes(idx - 1) || isDone;

                return (
                  <button 
                    key={les.id}
                    onClick={() => handleSelectLesson(idx)}
                    className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                      isActive 
                        ? 'bg-[#FDF2F5] border-[#F05A7E]/50 shadow-2xs' 
                        : isDone 
                        ? 'bg-purple-50/40 border-purple-100/60 hover:bg-purple-50' 
                        : isUnlocked
                        ? 'bg-white border-gray-100 hover:bg-gray-50'
                        : 'bg-gray-50/60 border-gray-100 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5 ${
                      isActive 
                        ? 'bg-[#F05A7E] text-white' 
                        : isDone 
                        ? 'bg-emerald-500 text-white' 
                        : isUnlocked
                        ? 'bg-purple-100 text-[#8C3F96]'
                        : 'bg-gray-200 text-gray-400'
                    }`}>
                      {isDone ? <Check size={14} /> : !isUnlocked ? <Lock size={12} /> : les.numberStr}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className={`text-xs font-bold truncate ${isActive ? 'text-[#2D1B4E]' : 'text-gray-700'}`}>
                          {les.numberStr} — {les.title}
                        </h4>
                        {!isUnlocked && <Lock size={12} className="text-gray-400 shrink-0 ml-1" />}
                      </div>

                      <div className="flex items-center gap-2 text-[10px] text-gray-400 font-medium mt-0.5">
                        <span>{les.duration}</span>
                        {isActive && <span className="text-[#F05A7E] font-bold">· In Progress</span>}
                        {isDone && !isActive && <span className="text-emerald-600 font-bold">· Completed</span>}
                        {!isUnlocked && <span className="text-gray-400">· Locked</span>}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: CHECK YOUR UNDERSTANDING (Quick Check) */}
          <div className="space-y-2 pt-2 border-t border-purple-100/60">
            <span className="text-[10px] font-extrabold text-gray-400 tracking-wider uppercase block">
              CHECK YOUR UNDERSTANDING
            </span>

            <button 
              onClick={() => {
                if (completedLessons.length >= 4) {
                  setActiveSection('quick-check');
                  setSidebarMobileOpen(false);
                } else {
                  showToast('🔒 Complete all 4 lessons to unlock Quick Check!');
                }
              }}
              className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between text-xs ${
                activeSection === 'quick-check'
                  ? 'bg-[#FDF2F5] border-[#F05A7E]/50 shadow-2xs font-bold text-[#2D1B4E]'
                  : quizPassed 
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800 font-bold'
                  : completedLessons.length >= 4 
                  ? 'bg-purple-50 border-purple-200 text-[#8C3F96] hover:bg-purple-100 font-bold'
                  : 'bg-gray-50 border-gray-100 text-gray-400 opacity-60 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`w-2 h-2 rounded-full ${activeSection === 'quick-check' ? 'bg-[#F05A7E]' : quizPassed ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                <div>
                  <span className="font-extrabold block">Quick Check</span>
                  <span className="text-[10px] font-medium opacity-75">5 min · {quizPassed ? 'Passed (80%+)' : activeSection === 'quick-check' ? 'In Progress' : 'Locked'}</span>
                </div>
              </div>

              {quizPassed ? (
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
              ) : completedLessons.length >= 4 ? (
                <Unlock size={14} className="text-[#8C3F96] shrink-0" />
              ) : (
                <Lock size={13} className="text-gray-400 shrink-0" />
              )}
            </button>
          </div>

          {/* Section 3: APPLY (Practice - Unlocks ONLY if quizPassed is TRUE) */}
          <div className="space-y-2 pt-2 border-t border-purple-100/60">
            <span className="text-[10px] font-extrabold text-gray-400 tracking-wider uppercase block">
              APPLY
            </span>

            <button 
              onClick={() => {
                if (quizPassed) {
                  setActiveSection('practice');
                  setSidebarMobileOpen(false);
                } else {
                  showToast('🔒 Pass Quick Check with at least 80% to unlock Practice!');
                }
              }}
              className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between text-xs ${
                activeSection === 'practice'
                  ? 'bg-[#FAF0E6] border-[#9E4733] font-bold text-[#9E4733]'
                  : practiceCompleted
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800 font-bold'
                  : quizPassed
                  ? 'bg-[#FAF0E6]/70 border-[#FBE3D6] text-[#9E4733] hover:bg-[#FAF0E6]'
                  : 'bg-gray-50 border-gray-100 text-gray-400 opacity-60 cursor-not-allowed'
              }`}
            >
              <div>
                <span className="font-extrabold block">Practice: Identify AI Opportunities</span>
                <span className="text-[10px] opacity-80 font-medium">20 min · Interactive Workspace</span>
              </div>

              {practiceCompleted ? (
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
              ) : quizPassed ? (
                <Unlock size={14} className="text-[#9E4733] shrink-0" />
              ) : (
                <Lock size={13} className="text-gray-400 shrink-0" />
              )}
            </button>
          </div>

          {/* Section 4: PROVE IT (Challenge: AI UX Evaluation) */}
          <div className="space-y-2 pt-2 border-t border-purple-100/60">
            <span className="text-[10px] font-extrabold text-gray-400 tracking-wider uppercase block">
              PROVE IT
            </span>

            <button 
              onClick={() => {
                if (practiceCompleted) {
                  setActiveSection('challenge');
                  setSidebarMobileOpen(false);
                } else {
                  showToast('🔒 Complete Practice Activity first to unlock Challenge!');
                }
              }}
              className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between text-xs ${
                activeSection === 'challenge'
                  ? 'bg-[#FDF2F5] border-[#F05A7E]/60 shadow-2xs font-bold text-[#2D1B4E]'
                  : challengeCompleted
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800 font-bold'
                  : practiceCompleted
                  ? 'bg-purple-50 border-purple-200 text-[#8C3F96] hover:bg-purple-100 font-bold'
                  : 'bg-gray-50 border-gray-100 text-gray-400 opacity-60 cursor-not-allowed'
              }`}
            >
              <div>
                <span className="font-extrabold block">Challenge: AI UX Evaluation</span>
                <span className="text-[10px] opacity-80 font-medium">30 min · Interactive Workspace</span>
              </div>

              {challengeCompleted ? (
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
              ) : practiceCompleted ? (
                <Unlock size={14} className="text-[#8C3F96] shrink-0" />
              ) : (
                <Lock size={13} className="text-gray-400 shrink-0" />
              )}
            </button>
          </div>

          {/* Section 5: EVIDENCE (Career Evidence) */}
          <div className="space-y-2 pt-2 border-t border-purple-100/60">
            <span className="text-[10px] font-extrabold text-gray-400 tracking-wider uppercase block">
              EVIDENCE
            </span>

            <button 
              onClick={() => {
                if (challengeCompleted) {
                  setActiveSection('evidence');
                  setSidebarMobileOpen(false);
                } else {
                  showToast('🔒 Complete Challenge: AI UX Evaluation to unlock Career Evidence!');
                }
              }}
              className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between text-xs ${
                activeSection === 'evidence'
                  ? 'bg-[#FDF2F5] border-[#F05A7E] shadow-2xs font-bold text-[#2D1B4E]'
                  : challengeCompleted
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-bold'
                  : 'bg-gray-50 border-gray-100 text-gray-400 opacity-60 cursor-not-allowed'
              }`}
            >
              <div>
                <span className="font-extrabold block">Career Evidence</span>
                <span className="text-[10px] opacity-80 font-medium">Portfolio Ready · Verified</span>
              </div>

              {challengeCompleted ? (
                <Award size={16} className="text-emerald-600 shrink-0" />
              ) : (
                <Lock size={13} className="text-gray-400 shrink-0" />
              )}
            </button>
          </div>
        </aside>

        {/* RIGHT MAIN AREA: Dynamic View */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 max-w-4xl mx-auto w-full">
          
          {/* VIEW 1: LESSON VIEW */}
          {activeSection === 'lesson' && (
            <div className="space-y-6">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-[#F05A7E] uppercase tracking-wider block">
                    LESSON {activeLesson.numberStr}
                  </span>

                  {completedLessons.includes(activeLessonIndex) ? (
                    <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 size={12} /> Completed
                    </span>
                  ) : (
                    <span className="bg-purple-50 text-[#8C3F96] text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-purple-100">
                      In Progress
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2D1B4E]">
                  {activeLesson.title}
                </h1>
                <p className="text-xs sm:text-sm text-gray-500">
                  {activeLesson.subtitle}
                </p>
              </div>

              {/* Video Player */}
              <div className="bg-black rounded-3xl overflow-hidden shadow-xl border border-gray-800 relative group aspect-video flex items-center justify-center">
                <iframe 
                  src={`${activeLesson.videoUrl}?rel=0&modestbranding=1`} 
                  title={activeLesson.title}
                  className="w-full h-full object-cover"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>

              {/* Mark Video Watched Button */}
              <div className="bg-purple-50/70 border border-purple-100 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-center sm:text-left">
                  <span className="text-xs font-bold text-[#2D1B4E] block">Finished watching this video lesson?</span>
                  <span className="text-[11px] text-gray-500 font-medium">Click below to complete and unlock the next lesson.</span>
                </div>

                <motion.button 
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleCompleteCurrentLesson}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                    completedLessons.includes(activeLessonIndex)
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-[#9E4733] hover:bg-[#863b2a] text-white'
                  }`}
                >
                  <CheckCircle2 size={16} />
                  <span>{completedLessons.includes(activeLessonIndex) ? 'Completed (Next Lesson ›)' : 'Mark Watched & Complete'}</span>
                </motion.button>
              </div>

              {/* Article Content */}
              <div className="space-y-5 pt-2">
                <h3 className="text-xl font-extrabold text-[#2D1B4E]">
                  {activeLesson.title}
                </h3>

                <div className="space-y-3 text-xs sm:text-sm text-gray-600 leading-relaxed">
                  {activeLesson.articleContent.map((paragraph, i) => (
                    <p key={i}>{paragraph}</p>
                  ))}
                </div>

                <div className="bg-[#FAF0E6] border-l-4 border-[#9E4733] rounded-r-2xl p-4 sm:p-5 space-y-1">
                  <span className="text-[10px] font-extrabold text-[#9E4733] uppercase tracking-wider block">
                    KEY TAKEAWAY
                  </span>
                  <p className="text-xs sm:text-sm font-semibold text-[#2D1B4E] leading-relaxed">
                    "{activeLesson.keyTakeaway}"
                  </p>
                </div>
              </div>

              {/* Bottom Nav */}
              <div className="pt-6 border-t border-purple-100/80 flex items-center justify-between gap-4 pb-12">
                <button 
                  onClick={handlePreviousLesson}
                  disabled={activeLessonIndex === 0}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeLessonIndex === 0 
                      ? 'text-gray-300 bg-gray-100 cursor-not-allowed' 
                      : 'text-gray-700 bg-gray-100 hover:bg-gray-200 cursor-pointer'
                  }`}
                >
                  <ChevronLeft size={16} />
                  <span>Previous</span>
                </button>

                <span className="text-xs font-bold text-gray-400">
                  Lesson {activeLessonIndex + 1} of {LESSONS.length}
                </span>

                <motion.button 
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleCompleteCurrentLesson}
                  className="bg-[#2D1B4E] hover:bg-[#431F69] text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{activeLessonIndex < LESSONS.length - 1 ? `Continue` : `Take Quick Check`}</span>
                  <ChevronRight size={16} />
                </motion.button>
              </div>
            </div>
          )}

          {/* VIEW 2: IN-LINE QUICK CHECK VIEW WITH REAL GRADING & CORRECTION REVIEW */}
          {activeSection === 'quick-check' && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Header Title Section */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-extrabold text-[#8C3F96] tracking-wider uppercase block">
                    CHECK YOUR UNDERSTANDING
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2D1B4E] mt-0.5">
                    Quick Check
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    Let's make sure the key ideas are clear before you apply them. Minimum 80% score required to pass.
                  </p>
                </div>

                <div className="flex items-center gap-3 self-start sm:self-center">
                  <span className="text-[11px] font-semibold text-gray-500 bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-100">
                    Threshold: <strong className="text-[#2D1B4E]">80% (4/5 Correct)</strong>
                  </span>
                </div>
              </div>

              {/* IF SHOWING QUIZ RESULTS & ANSWER CORRECTION BREAKDOWN */}
              {showQuizResults ? (
                <div className="space-y-6">
                  {/* Results Summary Banner */}
                  <div className={`rounded-3xl p-6 sm:p-8 border shadow-xs text-center space-y-4 ${
                    quizPassed 
                      ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950' 
                      : 'bg-rose-50/90 border-rose-200 text-rose-950'
                  }`}>
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${
                      quizPassed ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                    }`}>
                      {quizPassed ? <CheckCircle2 size={32} /> : <XCircle size={32} />}
                    </div>

                    <div>
                      <span className={`text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full ${
                        quizPassed ? 'bg-emerald-200 text-emerald-900' : 'bg-rose-200 text-rose-900'
                      }`}>
                        {quizPassed ? 'PASSED · 80%+ ACHIEVED' : 'RETAKE REQUIRED · MIN 80% NEEDED'}
                      </span>
                      <h2 className="text-2xl sm:text-3xl font-black mt-2">
                        Your Score: {quizScore}% ({correctCount}/5 Correct)
                      </h2>
                      <p className="text-xs sm:text-sm mt-1 max-w-lg mx-auto leading-relaxed text-gray-600">
                        {quizPassed 
                          ? "Great job! You have demonstrated strong competency in AI product design fundamentals. Practice Activity is now unlocked."
                          : "You scored under 80%. You need at least 80% (4 out of 5 correct) to unlock Practice. Please review the corrections below and retake the check."}
                      </p>
                    </div>

                    {/* Action buttons on results card */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                      {quizPassed ? (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setActiveSection('practice')}
                          className="bg-[#9E4733] hover:bg-[#863b2a] text-white font-bold text-xs px-7 py-3 rounded-2xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                        >
                          <span>Continue to Practice: Identify AI Opportunities</span>
                          <ChevronRight size={16} />
                        </motion.button>
                      ) : (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleRetakeQuiz}
                          className="bg-[#2D1B4E] hover:bg-[#431F69] text-white font-bold text-xs px-7 py-3 rounded-2xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                        >
                          <RotateCcw size={15} />
                          <span>Retake Quick Check Now</span>
                        </motion.button>
                      )}
                    </div>
                  </div>

                  {/* Corrections Breakdown Section for All 5 Questions */}
                  <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100/80 shadow-xs space-y-6">
                    <h3 className="text-base font-extrabold text-[#2D1B4E] border-b pb-3 border-gray-100">
                      Answer Corrections & Explanations ({QUIZ_QUESTIONS.length} Questions)
                    </h3>

                    <div className="space-y-5">
                      {QUIZ_QUESTIONS.map((q, idx) => {
                        const userChoice = quizSelectedAnswers[idx];
                        const isCorrect = userChoice === q.correctIndex;

                        return (
                          <div 
                            key={q.id} 
                            className={`p-5 rounded-2xl border space-y-3 ${
                              isCorrect ? 'bg-emerald-50/40 border-emerald-200/80' : 'bg-rose-50/40 border-rose-200/80'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <span className="text-xs font-bold text-[#2D1B4E]">
                                Q{idx + 1}: {q.question}
                              </span>
                              {isCorrect ? (
                                <span className="bg-emerald-100 text-emerald-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                                  <CheckCircle2 size={12} /> Correct (+20%)
                                </span>
                              ) : (
                                <span className="bg-rose-100 text-rose-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                                  <XCircle size={12} /> Incorrect (0%)
                                </span>
                              )}
                            </div>

                            <div className="space-y-1.5 text-xs">
                              <div className={`p-2.5 rounded-xl border font-semibold ${
                                isCorrect 
                                  ? 'bg-emerald-100/70 border-emerald-300 text-emerald-900' 
                                  : 'bg-rose-100/70 border-rose-300 text-rose-900'
                              }`}>
                                <span>Your Answer: </span>
                                <strong>{userChoice !== undefined ? q.options[userChoice] : 'Skipped / Unanswered'}</strong>
                              </div>

                              {!isCorrect && (
                                <div className="p-2.5 rounded-xl border bg-emerald-100/70 border-emerald-300 text-emerald-900 font-semibold">
                                  <span>Correct Answer: </span>
                                  <strong>{q.options[q.correctIndex]}</strong>
                                </div>
                              )}
                            </div>

                            <div className="bg-white/80 p-3 rounded-xl border border-gray-200 text-[11px] text-gray-600 leading-relaxed">
                              <strong className="text-[#2D1B4E]">Explanation:</strong> {q.explanation}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {!quizPassed && (
                      <div className="text-center pt-2">
                        <button 
                          onClick={handleRetakeQuiz}
                          className="bg-[#2D1B4E] hover:bg-[#431F69] text-white font-bold text-xs px-8 py-3 rounded-2xl shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
                        >
                          <RotateCcw size={15} />
                          <span>Retake Quick Check (Try for 80%+)</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* MAIN QUESTION CARD (1 of 5 to 5 of 5) matching Figma Screenshot */
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100/80 shadow-xs space-y-6">
                  
                  {/* Top Question Row + 5 Step Progress Segment Bars matching Figma Screenshot */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">
                      QUESTION {currentQuizQuestionIndex + 1} OF {QUIZ_QUESTIONS.length} · Single choice
                    </span>

                    {/* 5 Progress Bars matching screenshot */}
                    <div className="flex items-center gap-1.5">
                      {QUIZ_QUESTIONS.map((_, idx) => (
                        <div 
                          key={idx}
                          className={`h-1.5 w-6 rounded-full transition-colors ${
                            idx === currentQuizQuestionIndex 
                              ? 'bg-[#8C3F96]' 
                              : idx < currentQuizQuestionIndex 
                              ? 'bg-purple-300' 
                              : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Question Title & Subtitle */}
                  <div className="space-y-1 pt-1">
                    <h2 className="text-lg sm:text-xl font-extrabold text-[#2D1B4E] leading-snug">
                      {currentQuizQuestion.question}
                    </h2>
                    <p className="text-xs text-gray-500 font-medium">
                      {currentQuizQuestion.subtitle}
                    </p>
                  </div>

                  {/* 4 Radio Option Cards matching Figma Screenshot */}
                  <div className="space-y-3 pt-2">
                    {currentQuizQuestion.options.map((opt, optionIdx) => {
                      const isSelected = quizSelectedAnswers[currentQuizQuestionIndex] === optionIdx;

                      return (
                        <div
                          key={optionIdx}
                          onClick={() => setQuizSelectedAnswers({ ...quizSelectedAnswers, [currentQuizQuestionIndex]: optionIdx })}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-3.5 group ${
                            isSelected 
                              ? 'bg-[#FDF7FA] border-[#8C3F96] ring-2 ring-[#8C3F96]/20 shadow-2xs' 
                              : 'bg-white border-gray-200 hover:border-purple-300 hover:bg-purple-50/20'
                          }`}
                        >
                          {/* Radio Dot indicator */}
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                            isSelected ? 'border-[#8C3F96] bg-[#8C3F96]' : 'border-gray-300 group-hover:border-purple-400'
                          }`}>
                            {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>

                          <span className={`text-xs sm:text-sm font-semibold ${isSelected ? 'text-[#2D1B4E]' : 'text-gray-700'}`}>
                            {opt}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Bottom Card Control Bar matching Figma Screenshot */}
                  <div className="pt-4 border-t border-purple-100/60 flex items-center justify-between gap-4">
                    <span className="text-xs text-gray-400 font-medium">
                      {quizSelectedAnswers[currentQuizQuestionIndex] !== undefined ? '1 answer selected' : 'Select an option to proceed'}
                    </span>

                    <div className="flex items-center gap-4">
                      <button 
                        onClick={handleSkipQuestion}
                        className="text-xs font-bold text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
                      >
                        Skip question
                      </button>

                      <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleQuickCheckNext}
                        className="bg-[#2D1B4E] hover:bg-[#431F69] text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>{currentQuizQuestionIndex < QUIZ_QUESTIONS.length - 1 ? 'Continue' : 'Submit Quick Check'}</span>
                        <ChevronRight size={16} />
                      </motion.button>
                    </div>
                  </div>

                </div>
              )}

              {/* Bottom Refresher Banner matching Figma Screenshot */}
              {!showQuizResults && (
                <div className="bg-purple-50/70 border border-purple-100 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-purple-100 text-[#8C3F96] flex items-center justify-center shrink-0">
                      <Lightbulb size={16} />
                    </div>
                    <div>
                      <strong className="text-[#2D1B4E] font-bold block">Need a refresher before answering?</strong>
                      <span className="text-[11px] text-gray-500">You can revisit any completed lesson from the left syllabus without losing progress.</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleSelectLesson(1)}
                    className="text-xs font-bold text-[#8C3F96] hover:text-[#5B2975] whitespace-nowrap cursor-pointer hover:underline"
                  >
                    Review Lesson 02 ›
                  </button>
                </div>
              )}

            </motion.div>
          )}

          {/* VIEW 3: PRACTICE VIEW (Matching Figma Screenshots 1 & 2) */}
          {activeSection === 'practice' && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 max-w-4xl mx-auto pb-12"
            >
              {/* Header Title & Format Badge */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-purple-100/60 pb-4">
                <div>
                  <span className="text-[10px] font-extrabold text-[#8C3F96] uppercase tracking-wider block mb-1">
                    PRACTICE
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2D1B4E] tracking-tight">
                    Identify AI Opportunities
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1 font-medium max-w-2xl leading-relaxed">
                    Apply what you learned by finding three opportunities where AI could improve a product experience.
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
                  <div className="bg-purple-50/80 border border-purple-100 rounded-2xl px-4 py-2 text-right">
                    <div className="text-xs font-black text-[#2D1B4E]">20 min</div>
                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Format: Interactive Practice</div>
                  </div>
                </div>
              </div>

              {/* "Your task" Container Card matching Figma Screenshot 1 */}
              <div className="bg-[#FAF4F7] border border-[#F5E1EC] rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#F05A7E]/10 text-[#F05A7E] flex items-center justify-center shrink-0">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-[#2D1B4E]">Your task</h3>
                    <p className="text-xs text-gray-600 font-medium mt-0.5">
                      Choose a digital product you know and identify three areas where AI could improve the user experience.
                    </p>
                  </div>
                </div>

                {/* 3 Step Guidance Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
                  <div className="bg-white rounded-2xl p-4 border border-purple-100/70 shadow-2xs space-y-1">
                    <span className="text-[11px] font-black text-[#8C3F96] block">01</span>
                    <h4 className="text-xs font-bold text-[#2D1B4E]">What is the user problem?</h4>
                    <p className="text-[11px] text-gray-500 leading-snug">Pinpoint a friction, pain point, or delay.</p>
                  </div>

                  <div className="bg-white rounded-2xl p-4 border border-purple-100/70 shadow-2xs space-y-1">
                    <span className="text-[11px] font-black text-[#8C3F96] block">02</span>
                    <h4 className="text-xs font-bold text-[#2D1B4E]">Where could AI help?</h4>
                    <p className="text-[11px] text-gray-500 leading-snug">Identify specific pattern matching or triage.</p>
                  </div>

                  <div className="bg-white rounded-2xl p-4 border border-purple-100/70 shadow-2xs space-y-1">
                    <span className="text-[11px] font-black text-[#8C3F96] block">03</span>
                    <h4 className="text-xs font-bold text-[#2D1B4E]">Why would AI improve it?</h4>
                    <p className="text-[11px] text-gray-500 leading-snug">Keep human oversight & clarify value.</p>
                  </div>
                </div>
              </div>

              {/* PRODUCT YOU ARE ANALYZING Form Container matching Figma Screenshots 1 & 2 */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100/80 shadow-xs space-y-7">
                
                {/* Product Selector / Input */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-black text-[#8C3F96] uppercase tracking-wider block">
                      PRODUCT YOU ARE ANALYZING
                    </label>
                    <span className="text-[11px] font-semibold text-gray-400">
                      Select preset or type custom
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="relative flex-1">
                      <select
                        value={isCustomProduct ? 'custom' : selectedProduct}
                        onChange={(e) => handleProductChange(e.target.value)}
                        className="w-full bg-purple-50/50 border border-purple-100 rounded-2xl px-4 py-3 text-xs font-bold text-[#2D1B4E] focus:outline-none focus:ring-2 focus:ring-[#8C3F96] cursor-pointer appearance-none pr-8"
                      >
                        {PRESET_PRODUCTS.map((p) => (
                          <option key={p.name} value={p.name}>
                            {p.name}
                          </option>
                        ))}
                        <option value="custom">✏️ Custom Digital Product...</option>
                      </select>
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        <ChevronRight size={14} className="rotate-90" />
                      </div>
                    </div>

                    {isCustomProduct && (
                      <input
                        type="text"
                        placeholder="e.g. Uber Eats, Canva, Notion"
                        value={customProductName}
                        onChange={(e) => setCustomProductName(e.target.value)}
                        className="flex-1 bg-white border border-purple-200 rounded-2xl px-4 py-3 text-xs font-bold text-[#2D1B4E] focus:outline-none focus:ring-2 focus:ring-[#8C3F96]"
                      />
                    )}

                    <button
                      type="button"
                      onClick={handleResetPreset}
                      className="px-4 py-3 rounded-2xl border border-purple-100 text-xs font-bold text-[#8C3F96] bg-purple-50/60 hover:bg-purple-100 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <RotateCcw size={13} />
                      <span>Reset Example</span>
                    </button>
                  </div>
                </div>

                {/* 3 OPPORTUNITIES FORM CARDS */}
                <div className="space-y-6 pt-2">
                  {opportunities.map((opp, idx) => (
                    <div 
                      key={idx}
                      className="p-5 sm:p-6 rounded-2xl bg-purple-50/20 border border-purple-100/70 space-y-4 hover:border-purple-200 transition-all"
                    >
                      {/* Header with Dark Purple Number Circle */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[#2D1B4E] text-white text-xs font-black flex items-center justify-center shadow-xs">
                            {idx + 1}
                          </div>
                          <h3 className="text-sm font-extrabold text-[#2D1B4E]">
                            Opportunity {idx + 1}
                          </h3>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRefineWithAI(idx)}
                          className="text-[11px] font-bold text-[#8C3F96] hover:text-[#5B2975] bg-purple-100/60 hover:bg-purple-100 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Sparkles size={12} className="text-[#F05A7E]" />
                          <span>AI Concierge Refine</span>
                        </button>
                      </div>

                      {/* Field 1: What could AI improve? */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#2D1B4E] block">
                          AI Opportunity {idx + 1}: What could AI improve?
                        </label>
                        <textarea
                          rows={2}
                          value={opp.what}
                          onChange={(e) => handleOpportunityChange(idx, 'what', e.target.value)}
                          placeholder="Smart search that understands natural local language queries and misspelled brand names..."
                          className="w-full bg-white border border-purple-100 rounded-xl p-3.5 text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#8C3F96]/30 focus:border-[#8C3F96] leading-relaxed transition-all shadow-2xs"
                        />
                      </div>

                      {/* Field 2: Why would AI help? */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#2D1B4E] block">
                          Why would AI help?
                        </label>
                        <textarea
                          rows={2}
                          value={opp.why}
                          onChange={(e) => handleOpportunityChange(idx, 'why', e.target.value)}
                          placeholder="Explain how AI solves user frustration while keeping human controls..."
                          className="w-full bg-white border border-purple-100 rounded-xl p-3.5 text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#8C3F96]/30 focus:border-[#8C3F96] leading-relaxed transition-all shadow-2xs"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Helpful Tip Box matching Figma Screenshot 2 */}
                <div className="bg-purple-50/70 border border-purple-100 rounded-2xl p-4 flex items-start gap-3 text-xs text-gray-600">
                  <div className="w-7 h-7 rounded-xl bg-purple-100 text-[#8C3F96] flex items-center justify-center shrink-0 mt-0.5">
                    <Lightbulb size={16} />
                  </div>
                  <p className="leading-relaxed font-medium">
                    <strong className="text-[#2D1B4E] font-bold">Helpful tip:</strong> Think about repetitive tasks, personalization, user support, recommendations, or research triage where human designers remain in the loop.
                  </p>
                </div>

                {/* Bottom Action Control Strip matching Figma Screenshot 2 */}
                <div className="pt-4 border-t border-purple-100/60 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <button
                    onClick={() => setActiveSection('quick-check')}
                    className="text-xs font-bold text-gray-500 hover:text-[#2D1B4E] flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ArrowLeft size={14} />
                    <span>Back to Quick Check</span>
                    <span className="text-gray-400 font-normal ml-1">· 20 min · Your work will be reviewed by HerNext AI</span>
                  </button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSubmitPractice}
                    disabled={isEvaluating}
                    className="w-full sm:w-auto bg-[#2D1B4E] hover:bg-[#431F69] text-white font-bold text-xs px-8 py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isEvaluating ? (
                      <>
                        <RotateCcw size={14} className="animate-spin" />
                        <span>Evaluating Rationale...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit Practice</span>
                        <ChevronRight size={16} />
                      </>
                    )}
                  </motion.button>
                </div>

              </div>
            </motion.div>
          )}

          {/* VIEW 4: PROVE IT - AI UX EVALUATION VIEW (Matching Figma Screenshot 1) */}
          {activeSection === 'challenge' && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 max-w-4xl mx-auto pb-12"
            >
              {/* Header Title & Pill */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-purple-100/60 pb-4">
                <div>
                  <span className="text-[10px] font-extrabold text-[#8C3F96] uppercase tracking-wider block mb-1">
                    PROVE IT
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2D1B4E] tracking-tight">
                    AI UX Evaluation
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1 font-medium max-w-2xl leading-relaxed">
                    Show how you would use AI thoughtfully to improve a real product experience.
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
                  <div className="bg-purple-50/80 border border-purple-100 rounded-2xl px-4 py-2 text-right">
                    <div className="text-xs font-black text-[#2D1B4E]">30 min</div>
                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Format: Competency Challenge</div>
                  </div>
                </div>
              </div>

              {/* Scenario Container Card matching Figma Screenshot 1 */}
              <div className="bg-[#FAF4F7] border border-[#F5E1EC] rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#F05A7E]/10 text-[#F05A7E] flex items-center justify-center shrink-0">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">SCENARIO</span>
                    <h3 className="text-sm font-extrabold text-[#2D1B4E]">
                      Your Challenge: Resolving Transaction Failures with AI
                    </h3>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-purple-100/70 text-xs text-gray-700 leading-relaxed font-medium shadow-2xs">
                  A banking app receives frequent complaints from users who struggle to understand why a transaction has failed. As a product designer, evaluate how AI could improve this experience without removing human control.
                </div>

                {/* WHAT YOU NEED TO DO 3 Guidance Cards */}
                <div className="space-y-2 pt-1">
                  <span className="text-[10px] font-extrabold text-gray-400 tracking-wider uppercase block">
                    WHAT YOU NEED TO DO
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                    <div className="bg-white rounded-2xl p-4 border border-purple-100/70 shadow-2xs space-y-1">
                      <span className="text-[11px] font-black text-[#8C3F96] block">01</span>
                      <p className="text-xs font-bold text-[#2D1B4E]">Identify the user's main problem.</p>
                    </div>

                    <div className="bg-white rounded-2xl p-4 border border-purple-100/70 shadow-2xs space-y-1">
                      <span className="text-[11px] font-black text-[#8C3F96] block">02</span>
                      <p className="text-xs font-bold text-[#2D1B4E]">Propose one AI-powered improvement.</p>
                    </div>

                    <div className="bg-white rounded-2xl p-4 border border-purple-100/70 shadow-2xs space-y-1">
                      <span className="text-[11px] font-black text-[#8C3F96] block">03</span>
                      <p className="text-xs font-bold text-[#2D1B4E]">Explain how it improves user experience.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Design Workspace Form Container matching Figma Screenshot 1 */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100/80 shadow-xs space-y-7">
                <div className="flex items-center justify-between border-b border-purple-100/60 pb-4">
                  <div>
                    <h2 className="text-base font-extrabold text-[#2D1B4E]">Design Workspace</h2>
                    <p className="text-xs text-gray-400 font-medium">Formulate and document your structured AI design recommendation.</p>
                  </div>
                  <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Auto-saving
                  </span>
                </div>

                {/* 01 USER PROBLEM */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-extrabold text-[#2D1B4E] block">
                      01 · USER PROBLEM
                    </label>
                    <span className="text-[11px] text-gray-400 font-medium">Specific pain points and context</span>
                  </div>
                  <textarea
                    rows={3}
                    value={challengeProblem}
                    onChange={(e) => setChallengeProblem(e.target.value)}
                    placeholder="Describe the user's core problem and context..."
                    className="w-full bg-purple-50/20 border border-purple-100 rounded-2xl p-4 text-xs font-medium text-gray-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#8C3F96]/30 focus:border-[#8C3F96] transition-all shadow-2xs"
                  />
                </div>

                {/* 02 AI-POWERED SOLUTION */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-extrabold text-[#2D1B4E] block">
                      02 · AI-POWERED SOLUTION
                    </label>
                    <span className="text-[11px] text-gray-400 font-medium">Feature functionality & interaction</span>
                  </div>
                  <textarea
                    rows={3}
                    value={challengeSolution}
                    onChange={(e) => setChallengeSolution(e.target.value)}
                    placeholder="Propose your AI feature and interaction design..."
                    className="w-full bg-purple-50/20 border border-purple-100 rounded-2xl p-4 text-xs font-medium text-gray-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#8C3F96]/30 focus:border-[#8C3F96] transition-all shadow-2xs"
                  />
                </div>

                {/* 03 YOUR REASONING & HUMAN AGENCY */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-extrabold text-[#2D1B4E] block">
                      03 · YOUR REASONING & HUMAN AGENCY
                    </label>
                    <span className="text-[11px] text-gray-400 font-medium">Why AI fits & how users keep control</span>
                  </div>
                  <textarea
                    rows={3}
                    value={challengeReasoning}
                    onChange={(e) => setChallengeReasoning(e.target.value)}
                    placeholder="Explain your rationale and human-in-the-loop control..."
                    className="w-full bg-purple-50/20 border border-purple-100 rounded-2xl p-4 text-xs font-medium text-gray-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#8C3F96]/30 focus:border-[#8C3F96] transition-all shadow-2xs"
                  />
                </div>

                {/* Hint Box matching Figma Screenshot 1 */}
                <div className="bg-purple-50/70 border border-purple-100 rounded-2xl p-4 flex items-start gap-3 text-xs text-gray-600">
                  <div className="w-7 h-7 rounded-xl bg-purple-100 text-[#8C3F96] flex items-center justify-center shrink-0 mt-0.5">
                    <Lightbulb size={16} />
                  </div>
                  <p className="leading-relaxed font-medium">
                    <strong className="text-[#2D1B4E] font-bold">Need a hint?</strong> Think about how AI could help users understand transaction failures while keeping important decisions transparent and under the user's control.
                  </p>
                </div>

                {/* Bottom Action Bar matching Figma Screenshot 1 */}
                <div className="pt-4 border-t border-purple-100/60 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <button
                    onClick={() => setActiveSection('practice')}
                    className="text-xs font-bold text-gray-500 hover:text-[#2D1B4E] flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ArrowLeft size={14} />
                    <span>Back to Practice</span>
                    <span className="text-gray-400 font-normal ml-1">· Your response will be reviewed by HerNext AI and logged toward your Career Passport.</span>
                  </button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSubmitChallenge}
                    disabled={isSubmittingChallenge}
                    className="w-full sm:w-auto bg-[#2D1B4E] hover:bg-[#431F69] text-white font-bold text-xs px-8 py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingChallenge ? (
                      <>
                        <RotateCcw size={14} className="animate-spin" />
                        <span>Submitting Challenge...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit Challenge</span>
                        <ChevronRight size={16} />
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {/* VIEW 5: EVIDENCE - CAREER EVIDENCE VIEW (Matching Figma Screenshot 2) */}
          {activeSection === 'evidence' && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 max-w-4xl mx-auto pb-12"
            >
              {/* Header Title */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-purple-100/60 pb-4">
                <div>
                  <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider block mb-1">
                    CAREER EVIDENCE
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-black text-[#2D1B4E] tracking-tight">
                    You proved what you can do.
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1 font-medium max-w-2xl leading-relaxed">
                    Your completed challenge demonstrates practical skills that can now become part of your HerNext career evidence.
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-2 text-right">
                    <div className="text-xs font-black text-emerald-900">100% Complete</div>
                    <div className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">Status: Verified Evidence</div>
                  </div>
                </div>
              </div>

              {/* Main Evidence Card matching Figma Screenshot 2 */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100/80 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
                  <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">EVIDENCE CREATED</span>
                    <h3 className="text-lg font-black text-[#2D1B4E] mt-0.5">
                      Challenge: AI UX Evaluation
                    </h3>
                  </div>

                  <span className="bg-emerald-100 text-emerald-800 text-xs font-extrabold px-3.5 py-1.5 rounded-full flex items-center gap-1.5 self-start sm:self-center">
                    <CheckCircle2 size={15} /> Completed & Verified
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-medium">
                  Evaluated a real product problem and proposed an AI-powered improvement while considering the user experience. This represents demonstrated ability, not just a completed lesson.
                </p>

                <div className="space-y-2 pt-1">
                  <span className="text-[10px] font-extrabold text-gray-400 tracking-wider uppercase block">
                    Skills demonstrated:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-purple-50 text-[#8C3F96] text-xs font-extrabold px-3 py-1.5 rounded-xl border border-purple-100">
                      AI Product Thinking
                    </span>
                    <span className="bg-purple-50 text-[#8C3F96] text-xs font-extrabold px-3 py-1.5 rounded-xl border border-purple-100">
                      Problem Identification
                    </span>
                    <span className="bg-purple-50 text-[#8C3F96] text-xs font-extrabold px-3 py-1.5 rounded-xl border border-purple-100">
                      UX Analysis
                    </span>
                  </div>
                </div>
              </div>

              {/* Added to Career Profile Card matching Figma Screenshot 2 */}
              <div className="bg-[#FAF4F7] border border-[#F5E1EC] rounded-3xl p-6 sm:p-7 space-y-4 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-100 text-[#8C3F96] flex items-center justify-center shrink-0">
                    <Award size={22} />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-[#2D1B4E]">Added to your career profile</h3>
                    <p className="text-xs text-gray-600 font-medium mt-0.5">
                      This evidence has been added to your HerNext career profile and can contribute to your Career Passport.
                    </p>
                  </div>
                </div>

                {/* Completed Milestone Stepper Track */}
                <div className="pt-2 border-t border-purple-100/60 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 font-bold text-emerald-700 text-xs">
                    <span>✓ Learn</span>
                    <span className="text-gray-300">·</span>
                    <span>✓ Check</span>
                    <span className="text-gray-300">·</span>
                    <span>✓ Apply</span>
                    <span className="text-gray-300">·</span>
                    <span>✓ Challenge</span>
                    <span className="text-gray-300">·</span>
                    <span>✓ Evidence</span>
                  </div>

                  <span className="text-[11px] font-semibold text-gray-500">
                    Course complete · AI Fundamentals for Product Designers · 100% complete
                  </span>
                </div>
              </div>

              {/* Bottom Action Control Strip matching Figma Screenshot 2 */}
              <div className="pt-4 border-t border-purple-100/60 flex flex-col sm:flex-row items-center justify-between gap-4">
                <button
                  onClick={() => setActiveSection('challenge')}
                  className="text-xs font-bold text-gray-500 hover:text-[#2D1B4E] flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowLeft size={14} />
                  <span>Back to Challenge</span>
                  <span className="text-gray-400 font-normal ml-1">· This proof is permanently attached to your verified Career Passport.</span>
                </button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/dashboard/roadmap')}
                  className="w-full sm:w-auto bg-[#2D1B4E] hover:bg-[#431F69] text-white font-bold text-xs px-8 py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Return to Career Roadmap</span>
                  <ChevronRight size={16} />
                </motion.button>
              </div>

            </motion.div>
          )}

        </main>
      </div>

      {/* MODAL: Practice Evaluation Modal */}
      <AnimatePresence>
        {showPracticeEvalModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto"
            onClick={() => setShowPracticeEvalModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-purple-100 my-8 space-y-6 text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center shrink-0">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider block">
                    PRACTICE REVIEW COMPLETE · 96/100
                  </span>
                  <h3 className="text-lg font-black text-[#2D1B4E]">
                    AI Opportunity Framework Verified
                  </h3>
                </div>
              </div>

              <div className="bg-purple-50/60 p-4 rounded-2xl border border-purple-100 space-y-2 text-xs">
                <span className="font-extrabold text-[#2D1B4E] block">
                  Product Analyzed: {isCustomProduct ? customProductName || 'Custom App' : selectedProduct}
                </span>
                <p className="text-gray-600 leading-relaxed">
                  HerNext AI Concierge audited your 3 opportunity rationales. You demonstrated excellent human-centered AI framing by maintaining human oversight while targeting high-friction user pain points.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-[#2D1B4E] uppercase tracking-wider">
                  Opportunity Evaluation Breakdown:
                </h4>

                {opportunities.map((opp, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-gray-50 border border-gray-200/70 text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold text-[#2D1B4E]">
                      <span>Opportunity 0{idx + 1}</span>
                      <span className="text-emerald-600 flex items-center gap-1 text-[11px]">
                        <CheckCircle2 size={13} /> Verified Rationale
                      </span>
                    </div>
                    <p className="text-gray-600 text-[11px] truncate">
                      <strong>AI Feature:</strong> {opp.what}
                    </p>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <button
                  onClick={() => setShowPracticeEvalModal(false)}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Edit Rationales
                </button>

                <button 
                  onClick={() => {
                    setShowPracticeEvalModal(false);
                    setActiveSection('challenge');
                  }}
                  className="w-full sm:flex-1 bg-[#2D1B4E] hover:bg-[#431F69] text-white py-3 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Proceed to Final Challenge</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>



    </div>
  );
};

export default CourseContent;
