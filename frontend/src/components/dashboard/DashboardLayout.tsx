import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  FileText, 
  Star, 
  Route, 
  Compass,
  Trophy, 
  BookOpen, 
  Settings, 
  HelpCircle, 
  Bell, 
  Menu, 
  X, 
  Sparkles, 
  Crown,
  CheckCircle2,
  User
} from 'lucide-react';
import PurpleBackgroundDots from './PurpleBackgroundDots';
import SavedSkillsModal from './SavedSkillsModal';
import SupportModal from './SupportModal';
import NewCareerPathModal from './NewCareerPathModal';
import type { SkillItem } from './SkillDetailModal';
import { useUserContext } from '../../context/UserContext';

const SAMPLE_SAVED_SKILLS: SkillItem[] = [
  {
    id: 'user-research',
    name: 'User Research',
    category: 'career-relevant',
    source: 'Portfolio',
    description: 'Demonstrated ability to synthesize user needs into actionable insights.',
    proficiencyLevel: 'Advanced',
    proficiencyPercent: 80,
    icon: Star,
    color: '#8C3F96',
    evidence: [],
    marketImpact: { salaryBoost: '+28%', targetRoles: ['AI Product Designer'], demandTrend: '+42% growth' },
    learningModules: []
  },
  {
    id: 'prototyping',
    name: 'Prototyping',
    category: 'career-relevant',
    source: 'GitHub',
    description: 'Rapid translation of concepts into interactive models.',
    proficiencyLevel: 'Expert',
    proficiencyPercent: 95,
    icon: Star,
    color: '#F05A7E',
    evidence: [],
    marketImpact: { salaryBoost: '+35%', targetRoles: ['AI Prototyping Lead'], demandTrend: '+58% demand surge' },
    learningModules: []
  }
];

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useUserContext();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showSavedModal, setShowSavedModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showNewPathModal, setShowNewPathModal] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [savedSkills, setSavedSkills] = useState<SkillItem[]>(SAMPLE_SAVED_SKILLS);

  const isAssessmentRoute = location.pathname.includes('/assessment');
  const isSkillsRoute = location.pathname.includes('/skills');
  const isPathRoute = location.pathname.includes('/path') && !location.pathname.includes('/career-paths/new');
  const isNewPathRoute = location.pathname.includes('/career-paths/new') || location.pathname.includes('/path/new');
  const isRoadmapRoute = location.pathname.includes('/roadmap') && !location.pathname.includes('/roadmap/learn');
  const isLearnRoute = location.pathname.includes('/roadmap/learn');
  const isProfileRoute = location.pathname.includes('/profile');
  const isPassportRoute = location.pathname.includes('/passport');
  const isSettingsRoute = location.pathname.includes('/settings');
  const isDashboardRoute = location.pathname.startsWith('/dashboard/insights') || 
                           location.pathname.startsWith('/dashboard/overview') || 
                           location.pathname.startsWith('/dashboard/history') ||
                           location.pathname === '/dashboard';

  // Full-screen course experience: remove main sidebar on learn view
  if (isLearnRoute) {
    return (
      <div className="min-h-screen bg-[#FAF8FC] text-gray-800 font-sans relative overflow-x-hidden">
        {children}
      </div>
    );
  }

  const navItems = [
    {
      name: 'Dashboard',
      to: '/dashboard/insights',
      icon: LayoutDashboard,
      isActive: isDashboardRoute
    },
    {
      name: 'Career Assessment',
      to: '/dashboard/assessment',
      icon: FileText,
      isActive: isAssessmentRoute
    },
    {
      name: 'My Skills',
      to: '/dashboard/skills',
      icon: Star,
      isActive: isSkillsRoute
    },
    {
      name: 'Career Path',
      to: '/dashboard/path',
      icon: Compass,
      isActive: isPathRoute
    },
    {
      name: 'Career Roadmap',
      to: '/dashboard/roadmap',
      icon: Route,
      isActive: isRoadmapRoute
    }
  ];

  const notifications = [
    { id: 1, title: '✨ AI Career Assessment Ready', desc: 'Your 2026 AI Readiness report is fully compiled.', time: '2m ago' },
    { id: 2, title: '🎯 Skill Benchmark Updated', desc: 'Strategic AI Product Thinking demand surged +58% this week.', time: '1h ago' },
    { id: 3, title: '👩‍💻 Mentor Connection', desc: 'Sarah Lin viewed your HerNext career profile.', time: '1d ago' }
  ];

  const handleRemoveSavedSkill = (id: string) => {
    setSavedSkills(savedSkills.filter((s) => s.id !== id));
  };

  return (
    <div className="flex h-screen bg-[#FAF8FC] text-gray-800 overflow-hidden relative font-sans">
      {/* Background Animated Purple Particles & Ambient Blobs */}
      <PurpleBackgroundDots dotCount={35} />

      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div 
          animate={{
            x: [0, 40, -20, 0],
            y: [0, -30, 20, 0],
            scale: [1, 1.1, 0.95, 1],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-32 -left-32 w-96 h-96 bg-purple-200/25 rounded-full blur-3xl"
        />
        <motion.div 
          animate={{
            x: [0, -50, 30, 0],
            y: [0, 40, -30, 0],
            scale: [1, 1.15, 0.9, 1],
          }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/3 -right-32 w-96 h-96 bg-pink-200/20 rounded-full blur-3xl"
        />
        <motion.div 
          animate={{
            x: [0, 30, -30, 0],
            y: [0, -20, 30, 0],
          }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-32 left-1/3 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl"
        />
      </div>

      {/* Mobile Drawer Backdrop */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar (Desktop & Mobile Drawer) */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50 w-64 md:w-64 bg-[#261338] shadow-2xl flex-shrink-0 flex flex-col transition-transform duration-300 ease-in-out
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Brand Header matching screenshot */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <NavLink 
            to="/dashboard/insights" 
            onClick={() => setMobileMenuOpen(false)}
            className="group cursor-pointer block"
          >
            <h1 className="text-2xl font-bold tracking-tight text-white font-sans">
              HerNext
            </h1>
            <span className="text-[11px] text-purple-200/60 font-medium block">
              Professional Concierge
            </span>
          </NavLink>

          <button 
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden text-white/70 hover:text-white p-1 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 flex-1 overflow-y-auto space-y-1">
          {/* Primary Nav List */}
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.name}>
                  <NavLink 
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 text-xs font-medium ${
                      item.isActive 
                        ? 'bg-[#9E4733] text-white shadow-md' 
                        : 'text-white/75 hover:bg-white/8 hover:text-white'
                    }`}
                  >
                    <Icon size={16} className={item.isActive ? 'text-white' : 'text-white/60'} />
                    <span>{item.name}</span>
                  </NavLink>
                </li>
              );
            })}

            {/* Secondary Nav Items */}
            <li>
              <button
                onClick={() => {
                  setActiveModal('Challenges');
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 text-white/75 hover:bg-white/8 hover:text-white rounded-xl transition-all duration-200 text-xs cursor-pointer"
              >
                <Trophy size={16} className="text-white/60" />
                <span>Challenges</span>
              </button>
            </li>
            <li>
              <NavLink
                to="/dashboard/passport"
                onClick={() => setMobileMenuOpen(false)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 text-xs font-medium cursor-pointer ${
                  isPassportRoute 
                    ? 'bg-[#9E4733] text-white shadow-md' 
                    : 'text-white/75 hover:bg-white/8 hover:text-white'
                }`}
              >
                <BookOpen size={16} className={isPassportRoute ? 'text-white' : 'text-white/60'} />
                <span>Career Passport</span>
              </NavLink>
            </li>
          </ul>

          {/* + Create a New Career Path Sidebar Button */}
          <div className="pt-3 pb-1">
            <NavLink
              to="/dashboard/career-paths/new"
              onClick={() => setMobileMenuOpen(false)}
              className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer ${
                isNewPathRoute 
                  ? 'bg-[#9E4733] text-white ring-2 ring-orange-300' 
                  : 'bg-[#9E4733] hover:bg-[#863b2a] text-white'
              }`}
            >
              <span className="text-sm font-black">+</span>
              <span>Create a New Career Path</span>
            </NavLink>
          </div>

          {/* Upgrade to Pro Sidebar Mini Card Button */}
          <div className="pt-3 pb-2">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setShowPremiumModal(true);
                setMobileMenuOpen(false);
              }}
              className="bg-gradient-to-r from-[#9E4733] to-[#F05A7E] p-3.5 rounded-2xl shadow-lg border border-pink-400/30 text-white cursor-pointer relative overflow-hidden group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-pink-100 flex items-center gap-1">
                  <Crown size={12} className="text-amber-300" /> HerNext Pro
                </span>
                <span className="bg-white/20 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                  PRO
                </span>
              </div>
              <h4 className="text-xs font-bold leading-tight group-hover:text-amber-200 transition-colors">
                Upgrade to Pro
              </h4>
              <p className="text-[10px] text-white/80 mt-0.5 leading-snug">
                Unlock Development & Career Proof phases
              </p>
            </motion.div>
          </div>
        </nav>

        {/* Footer Settings matching screenshot */}
        <div className="p-3 border-t border-white/10 mt-auto bg-black/10">
          <ul className="space-y-0.5">
            <li>
              <NavLink 
                to="/dashboard/profile"
                onClick={() => setMobileMenuOpen(false)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-colors text-xs font-medium cursor-pointer ${
                  isProfileRoute ? 'bg-[#9E4733] text-white shadow-md' : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <User size={15} className={isProfileRoute ? 'text-white' : 'text-white/50'} /> Profile
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/dashboard/settings"
                onClick={() => setMobileMenuOpen(false)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-colors text-xs font-medium cursor-pointer ${
                  isSettingsRoute ? 'bg-[#9E4733] text-white shadow-md' : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <Settings size={15} className={isSettingsRoute ? 'text-white' : 'text-white/50'} /> Settings
              </NavLink>
            </li>
            <li>
              <button 
                onClick={() => setShowSupportModal(true)}
                className="w-full flex items-center gap-3 px-3 py-2 text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-colors text-xs font-medium cursor-pointer"
              >
                <HelpCircle size={15} className="text-white/50" /> Help & Support
              </button>
            </li>
          </ul>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex flex-col flex-1 overflow-hidden relative z-10">
        {/* Top Header */}
        <header className="h-16 bg-white/85 backdrop-blur-md flex justify-between items-center px-4 md:px-8 border-b border-purple-100/60 shrink-0 shadow-xs z-20">
          {/* Left section: Title or Tabs */}
          <div className="flex items-center gap-3 md:gap-8 h-full">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>

            {isSettingsRoute ? (
              <h2 className="text-lg md:text-xl font-bold text-[#2D1B4E]">Settings</h2>
            ) : isPassportRoute ? (
              <h2 className="text-lg md:text-xl font-bold text-[#2D1B4E]">Career Passport</h2>
            ) : isNewPathRoute ? (
              <h2 className="text-lg md:text-xl font-bold text-[#2D1B4E]">Create a New Career Path</h2>
            ) : isProfileRoute ? (
              <h2 className="text-lg md:text-xl font-bold text-[#2D1B4E]">Profile & Preferences</h2>
            ) : isRoadmapRoute ? (
              <h2 className="text-lg md:text-xl font-bold text-[#2D1B4E]">Career Roadmap</h2>
            ) : isPathRoute ? (
              <h2 className="text-lg md:text-xl font-bold text-[#2D1B4E]">Career Path</h2>
            ) : isSkillsRoute ? (
              <h2 className="text-lg md:text-xl font-bold text-[#2D1B4E]">My Skills</h2>
            ) : isAssessmentRoute ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-purple-900/60 font-medium">Assessment /</span>
                <h2 className="text-base md:text-lg font-bold text-[#2D1B4E]">AI Readiness Report</h2>
              </div>
            ) : (
              <nav className="flex space-x-2 md:space-x-8 h-full overflow-x-auto no-scrollbar">
                <NavLink 
                  to="/dashboard/insights" 
                  className={({isActive}) => `flex items-center font-bold text-xs md:text-sm border-b-2 transition-all px-2 whitespace-nowrap ${
                    isActive 
                      ? 'border-[#8C3F96] text-[#2D1B4E]' 
                      : 'border-transparent text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Career Insights
                </NavLink>
                <NavLink 
                  to="/dashboard/overview" 
                  className={({isActive}) => `flex items-center font-bold text-xs md:text-sm border-b-2 transition-all px-2 whitespace-nowrap ${
                    isActive 
                      ? 'border-[#8C3F96] text-[#2D1B4E]' 
                      : 'border-transparent text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Overview
                </NavLink>
                <NavLink 
                  to="/dashboard/history" 
                  className={({isActive}) => `flex items-center font-bold text-xs md:text-sm border-b-2 transition-all px-2 whitespace-nowrap ${
                    isActive 
                      ? 'border-[#8C3F96] text-[#2D1B4E]' 
                      : 'border-transparent text-gray-500 hover:text-gray-900'
                  }`}
                >
                  History
                </NavLink>
              </nav>
            )}
          </div>

          {/* Right section: Icons matching screenshot */}
          <div className="flex items-center gap-3 md:gap-5">
            {/* Support Link */}
            <button 
              onClick={() => setShowSupportModal(true)}
              className="text-xs font-semibold text-gray-600 hover:text-[#2D1B4E] transition-colors cursor-pointer"
            >
              Support
            </button>

            {/* Notifications Button */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-xl text-gray-500 hover:text-[#2D1B4E] hover:bg-purple-50 transition-colors relative cursor-pointer"
                title="Notifications"
              >
                <Bell size={17} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#F05A7E] ring-2 ring-white" />
              </button>

              {/* Notifications Dropdown Popover */}
              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-purple-100/80 p-4 z-50 space-y-3 font-sans"
                  >
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                      <h4 className="text-xs font-black text-[#2D1B4E]">Notifications</h4>
                      <span className="text-[10px] font-bold text-[#8C3F96] bg-purple-50 px-2 py-0.5 rounded-full">
                        {notifications.length} New
                      </span>
                    </div>

                    <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                      {notifications.map((n) => (
                        <div key={n.id} className="p-2.5 rounded-xl bg-[#FAF8FC] border border-purple-50 space-y-1 hover:bg-purple-50/50 transition-colors">
                          <div className="flex items-center justify-between text-[11px] font-bold text-[#2D1B4E]">
                            <span>{n.title}</span>
                            <span className="text-[9px] text-gray-400 font-normal">{n.time}</span>
                          </div>
                          <p className="text-[10px] text-gray-500 leading-snug">{n.desc}</p>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => setShowNotifications(false)}
                      className="w-full text-center text-[11px] font-bold text-[#8C3F96] hover:underline pt-1 block"
                    >
                      Close
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Profile Avatar & Name */}
            <NavLink 
              to="/dashboard/profile" 
              className="flex items-center gap-2.5 pl-1 hover:opacity-90 transition-opacity cursor-pointer group"
              title="View Profile"
            >
              <div className="relative">
                <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-purple-200 group-hover:ring-purple-400 shadow-xs bg-purple-100 transition-all">
                  <img 
                    src={user.avatar} 
                    alt={user.fullName} 
                    className="w-full h-full object-cover" 
                  />
                </div>
              </div>
              <span className="text-xs font-bold text-[#2D1B4E] group-hover:text-[#8C3F96] hidden sm:block transition-colors">
                {user.fullName}
              </span>
            </NavLink>
          </div>
        </header>

        {/* Main Content scrollable area */}
        <main className="flex-1 overflow-y-auto px-4 md:px-8 py-6 bg-gradient-to-b from-[#FAF8FC] via-[#F6F2F8] to-[#FAF8FC] relative">
          {children}
        </main>
      </div>

      {/* Global Modals */}
      <AnimatePresence>
        {showSavedModal && (
          <SavedSkillsModal 
            savedSkills={savedSkills}
            onClose={() => setShowSavedModal(false)}
            onSelectSkill={() => {
              navigate('/dashboard/skills');
            }}
            onRemoveSkill={handleRemoveSavedSkill}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSupportModal && (
          <SupportModal onClose={() => setShowSupportModal(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showNewPathModal && (
          <NewCareerPathModal 
            onClose={() => setShowNewPathModal(false)}
            onSelectNewPath={() => {
              navigate('/dashboard/roadmap');
            }}
          />
        )}
      </AnimatePresence>

      {/* Premium Upgrade Modal */}
      <AnimatePresence>
        {showPremiumModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50"
            onClick={() => setShowPremiumModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-purple-100 text-center"
            >
              <div className="w-14 h-14 bg-gradient-to-tr from-[#9E4733] to-[#F05A7E] rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-pink-500/20">
                <Crown size={28} />
              </div>
              <h3 className="text-xl font-extrabold text-[#2D1B4E] mb-2">HerNext Pro Membership</h3>
              <p className="text-xs text-gray-500 mb-6 leading-relaxed">
                Accelerate your career transition into high-paying AI tech leadership roles with 1-on-1 executive mentorship and priority hiring access.
              </p>
              <div className="text-left space-y-2.5 bg-purple-50/70 p-4 rounded-2xl mb-6">
                <div className="flex items-center gap-2 text-xs font-medium text-[#2D1B4E]">
                  <CheckCircle2 size={16} className="text-[#9E4733]" /> Unlimited AI Roadmap & Competency Evaluations
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-[#2D1B4E]">
                  <CheckCircle2 size={16} className="text-[#9E4733]" /> Verified AI Portfolio Certification Badges
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-[#2D1B4E]">
                  <CheckCircle2 size={16} className="text-[#9E4733]" /> Private Women Tech Leadership Circle Access
                </div>
              </div>
              <button 
                onClick={() => setShowPremiumModal(false)}
                className="w-full bg-[#9E4733] hover:bg-[#863b2a] text-white py-3 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                Start 14-Day Free Pro Trial
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generic Active Modal for sidebar links */}
      <AnimatePresence>
        {activeModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50"
            onClick={() => setActiveModal(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-purple-100 text-center"
            >
              <div className="w-12 h-12 bg-purple-100 text-[#8C3F96] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sparkles size={24} />
              </div>
              <h3 className="text-lg font-bold text-[#2D1B4E] mb-2">{activeModal}</h3>
              <p className="text-xs text-gray-500 mb-6 leading-relaxed">
                Welcome to the <strong>{activeModal}</strong> workspace. Your personalized career trajectory data is synced across your HerNext account.
              </p>
              <button 
                onClick={() => setActiveModal(null)}
                className="w-full bg-[#2D1B4E] hover:bg-[#431F69] text-white py-2.5 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DashboardLayout;
