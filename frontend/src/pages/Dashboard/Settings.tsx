import React, { useCallback, useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  User,
  ShieldCheck,
  Lock,
  Bell,
  Eye,
  Sparkles,
  Trash2,
  Check,
  AlertTriangle,
  LogOut,
  X,
  Edit2
} from 'lucide-react';
import { LocationSelects } from '../../components/LocationSelects';
import { useUserContext } from '../../context/UserContext';
import { clearSession } from '../../lib/session';
import {
  ApiError,
  deleteCurrentAccount,
  getCurrentUser,
  getProfile,
  updateProfile,
  type CareerProfile,
} from '../../lib/api';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useUserContext();

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Modals state
  const [showEditAccountModal, setShowEditAccountModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Form states for account editing
  const [editFullName, setEditFullName] = useState(user.fullName || '');
  const [editEmail, setEditEmail] = useState(user.email || '');
  const [editCountry, setEditCountry] = useState(user.country || '');
  const [editState, setEditState] = useState(user.state || '');

  // Server-side source of truth for the location. The career profile is needed
  // because PUT /profile requires those fields alongside the location.
  const [careerProfile, setCareerProfile] = useState<CareerProfile | null>(null);
  const [isLoadingAccount, setIsLoadingAccount] = useState(true);
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const [accountError, setAccountError] = useState('');

  // The persisted location and identity come from the API, never from
  // localStorage, so a refresh or a new device shows the real values.
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const me = await getCurrentUser();
        if (cancelled) return;

        const fullName = `${me.firstName} ${me.lastName}`.trim();
        setEditFullName(fullName || me.email);
        setEditEmail(me.email);
        setEditCountry(me.country);
        setEditState(me.state ?? '');
        updateUser({ fullName, email: me.email, country: me.country, state: me.state ?? '' });

        try {
          const profile = await getProfile();
          if (!cancelled) setCareerProfile(profile);
        } catch (err) {
          // A 404 just means onboarding has not been completed yet; the
          // location is still readable and editable once it is.
          if (!(err instanceof ApiError && err.status === 404) && !cancelled) {
            setAccountError('We could not load your career profile. Some settings may be unavailable.');
          }
        }
      } catch {
        if (!cancelled) {
          setAccountError('We could not load your account details. Please refresh and try again.');
        }
      } finally {
        if (!cancelled) setIsLoadingAccount(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [updateUser]);

  const openEditAccountModal = useCallback(() => {
    setAccountError('');
    setShowEditAccountModal(true);
  }, []);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Toggle states
  const [notifications, setNotifications] = useState({
    learningReminders: true,
    roadmapUpdates: true,
    careerProgress: true,
    accountUpdates: true,
  });

  const [privacy, setPrivacy] = useState({
    passportVisibility: true,
    organizationAccess: true,
    aiAnalysis: true,
  });

  const [aiPreferences, setAiPreferences] = useState({
    careerInsights: true,
    learningFeedback: true,
    personalizedRecommendations: true,
  });

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccountError('');

    if (isSavingAccount) return;

    if (careerProfile === null) {
      setAccountError('Finish your onboarding first so your location can be saved.');
      return;
    }

    setIsSavingAccount(true);

    try {
      // PUT /profile is the single write path for the user's location, and it
      // requires the career profile fields, so they are sent back unchanged.
      const saved = await updateProfile({
        currentOccupation: careerProfile.currentOccupation,
        industry: careerProfile.industry,
        yearsOfExperience: careerProfile.yearsOfExperience,
        employmentType: careerProfile.employmentType,
        education: careerProfile.education,
        country: editCountry,
        state: editState || null,
      });

      // Reflect exactly what the backend stored.
      setEditCountry(saved.country);
      setEditState(saved.state ?? '');
      setCareerProfile(saved);
      updateUser({ country: saved.country, state: saved.state ?? '' });

      setShowEditAccountModal(false);
      showToast('Account details updated successfully!');
    } catch (err) {
      setAccountError(
        err instanceof ApiError ? err.message : 'We could not save your details. Please try again.',
      );
    } finally {
      setIsSavingAccount(false);
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword !== confirmPassword) {
      showToast('Passwords do not match. Please try again.');
      return;
    }
    setShowPasswordModal(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    showToast('Password updated successfully!');
  };

  const handleSignOut = () => {
    setShowSignOutModal(false);
    // Drop the token and the cached user/onboarding data before leaving, so a
    // second person signing in on this browser cannot inherit this account's
    // name, profile answers or onboarding answers. clearSession() notifies
    // UserContext to reset its in-memory copy too, which is what stops the save
    // effect from writing it all straight back.
    clearSession();
    showToast('You have been signed out.');
    navigate('/sign-in', { replace: true });
  };

  const handleDeleteAccount = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    setDeleteError('');
    try {
      // The account is removed server-side first. Only once the backend confirms
      // it do we drop the local session, so a failed request cannot leave the
      // user signed out of an account that still exists.
      await deleteCurrentAccount();
      setShowDeleteAccountModal(false);
      clearSession();
      // Extra cleanup for this specific email in case of any race
      try {
        localStorage.removeItem(`hernext_onboarding_draft:${user.email.trim().toLowerCase()}`);
      } catch {}
      showToast('Your account has been deleted.');
      navigate('/sign-in', { replace: true });
    } catch (err) {
      // The account was NOT deleted. Keep the user signed in and say why.
      setDeleteError(
        err instanceof ApiError
          ? err.message
          : 'We could not delete your account. Please try again.',
      );
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16 font-sans">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-8 bg-[#2D1B4E] text-white px-5 py-3 rounded-2xl shadow-2xl z-50 flex items-center gap-3 border border-purple-400/30 text-xs font-semibold"
          >
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Check size={14} />
            </div>
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-purple-100/60 pb-6">
        <div>
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs text-gray-500 mb-2 font-medium">
            <NavLink to="/dashboard/insights" className="hover:text-[#2D1B4E] transition-colors">
              Dashboard
            </NavLink>
            <span>/</span>
            <span className="text-[#8C3F96] font-semibold">Settings</span>
          </nav>
          
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#9E4733] bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
              • SETTINGS
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-black text-[#2D1B4E]">Settings</h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage your account, security, notifications, privacy, and AI preferences.
          </p>
        </div>

        {/* User Badge */}
        <div className="flex items-center gap-3 bg-white p-2.5 px-4 rounded-2xl shadow-xs border border-purple-100/80">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            <ShieldCheck size={13} className="text-emerald-600" /> Account Verified
          </span>
          <div className="flex items-center gap-2.5 pl-2 border-l border-gray-200">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#9E4733] to-[#8C3F96] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {user.fullName ? user.fullName.split(' ').map(n => n[0]).join('') : '?'}
            </div>
            <span className="text-xs font-bold text-[#2D1B4E]">{user.fullName || 'HerNext User'}</span>
          </div>
        </div>
      </div>

      {/* Main Settings Grid (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* 1. Account Section */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-white rounded-3xl p-6 shadow-sm border border-purple-100/80 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 text-[#8C3F96] flex items-center justify-center">
                  <User size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#2D1B4E]">Account</h3>
                  <p className="text-xs text-gray-500">Manage your basic account information.</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSignOutModal(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-[#2D1B4E] bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                >
                  <LogOut size={13} /> Log out
                </button>

                <button
                  onClick={openEditAccountModal}
                  disabled={isLoadingAccount}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8C3F96] hover:text-[#73317c] bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-xl transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Edit2 size={13} /> Edit Account
                </button>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#FAF8FC] p-3.5 rounded-2xl border border-purple-50">
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block mb-1">
                    EMAIL ADDRESS
                  </span>
                  <p className="text-xs font-bold text-[#2D1B4E] truncate">{user.email || '—'}</p>
                </div>

                <div className="bg-[#FAF8FC] p-3.5 rounded-2xl border border-purple-50">
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block mb-1">
                    LOCATION
                  </span>
                  <p className="text-xs font-bold text-[#2D1B4E]">
                    {isLoadingAccount
                      ? 'Loading...'
                      : [editState, editCountry].filter(Boolean).join(', ') || '—'}
                  </p>
                </div>
              </div>

              <div className="bg-[#FAF8FC] p-3.5 rounded-2xl border border-purple-50 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block mb-0.5">
                    ACCOUNT TYPE
                  </span>
                  <p className="text-xs font-bold text-[#2D1B4E]">Participant</p>
                </div>
                <span className="bg-[#9E4733] text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-xs">
                  Active Career Track
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 2. Password & Security Section */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-white rounded-3xl p-6 shadow-sm border border-purple-100/80 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Lock size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#2D1B4E]">Password & Security</h3>
                <p className="text-xs text-gray-500">Keep your account secure.</p>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div className="bg-[#FAF8FC] p-3.5 rounded-2xl border border-purple-50 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block mb-1">
                    PASSWORD
                  </span>
                  <p className="text-xs font-bold text-[#2D1B4E] font-mono">••••••••••••</p>
                </div>
                <button 
                  onClick={() => setShowPasswordModal(true)}
                  className="bg-[#8C3F96] hover:bg-[#73317c] text-white text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Change Password
                </button>
              </div>

              <div className="bg-[#FAF8FC] p-3.5 rounded-2xl border border-purple-50 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#2D1B4E] block mb-0.5">
                    Active Sessions
                  </span>
                  <p className="text-[11px] text-gray-500">
                    Sign out of HerNext across active devices.
                  </p>
                </div>
                <button 
                  onClick={() => setShowSignOutModal(true)}
                  className="inline-flex items-center gap-1.5 border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs font-bold px-3.5 py-1.5 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
                >
                  <LogOut size={13} /> Log out
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 3. Notifications Section */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-white rounded-3xl p-6 shadow-sm border border-purple-100/80"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Bell size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#2D1B4E]">Notifications</h3>
              <p className="text-xs text-gray-500">Choose which email updates you receive.</p>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            {[
              { id: 'learningReminders', title: 'Learning reminders', desc: 'Updates about scheduled learning activities.' },
              { id: 'roadmapUpdates', title: 'Roadmap updates', desc: 'Updates about your career roadmap.' },
              { id: 'careerProgress', title: 'Career progress', desc: 'Updates about your career development.' },
              { id: 'accountUpdates', title: 'Important account updates', desc: 'Security, subscription, and account updates.' },
            ].map((item) => {
              const checked = notifications[item.id as keyof typeof notifications];
              return (
                <div key={item.id} className="flex items-center justify-between p-2 hover:bg-purple-50/40 rounded-xl transition-colors">
                  <div>
                    <h4 className="text-xs font-bold text-[#2D1B4E]">{item.title}</h4>
                    <p className="text-[11px] text-gray-500">{item.desc}</p>
                  </div>
                  <button
                    onClick={() => {
                      setNotifications(prev => ({ ...prev, [item.id]: !checked }));
                      showToast(`Updated ${item.title} preference`);
                    }}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      checked ? 'bg-[#8C3F96]' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        checked ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* 4. Privacy Section */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-white rounded-3xl p-6 shadow-sm border border-purple-100/80"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Eye size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#2D1B4E]">Privacy</h3>
              <p className="text-xs text-gray-500">Control how your career information is shared.</p>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            {[
              { id: 'passportVisibility', title: 'Career Passport visibility', desc: 'Control whether your Career Passport profile is public.' },
              { id: 'organizationAccess', title: 'Organization program access', desc: 'Share progress with organization program sponsors you participate in.' },
              { id: 'aiAnalysis', title: 'AI analysis', desc: 'Control whether HerNext uses your data to improve AI-driven career analysis.' },
            ].map((item) => {
              const checked = privacy[item.id as keyof typeof privacy];
              return (
                <div key={item.id} className="flex items-center justify-between p-2 hover:bg-purple-50/40 rounded-xl transition-colors">
                  <div>
                    <h4 className="text-xs font-bold text-[#2D1B4E]">{item.title}</h4>
                    <p className="text-[11px] text-gray-500">{item.desc}</p>
                  </div>
                  <button
                    onClick={() => {
                      setPrivacy(prev => ({ ...prev, [item.id]: !checked }));
                      showToast(`Updated ${item.title} settings`);
                    }}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      checked ? 'bg-[#8C3F96]' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        checked ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* 5. AI Preferences Section */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-white rounded-3xl p-6 shadow-sm border border-purple-100/80"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#2D1B4E]">AI Preferences</h3>
              <p className="text-xs text-gray-500">Choose how HerNext AI supports your career development.</p>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            {[
              { id: 'careerInsights', title: 'AI Career Insights', desc: 'Receive AI-powered career insight updates.' },
              { id: 'learningFeedback', title: 'AI Learning Feedback', desc: 'Allow HerNext to review learning activities and provide recommendations.' },
              { id: 'personalizedRecommendations', title: 'Personalized Recommendations', desc: 'Tailored recommendations based on past learning and career goals.' },
            ].map((item) => {
              const checked = aiPreferences[item.id as keyof typeof aiPreferences];
              return (
                <div key={item.id} className="flex items-center justify-between p-2 hover:bg-purple-50/40 rounded-xl transition-colors">
                  <div>
                    <h4 className="text-xs font-bold text-[#2D1B4E]">{item.title}</h4>
                    <p className="text-[11px] text-gray-500">{item.desc}</p>
                  </div>
                  <button
                    onClick={() => {
                      setAiPreferences(prev => ({ ...prev, [item.id]: !checked }));
                      showToast(`Updated ${item.title}`);
                    }}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      checked ? 'bg-[#8C3F96]' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        checked ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* 6. Delete Account Section */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-white rounded-3xl p-6 shadow-sm border border-red-100 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#2D1B4E]">Delete Account</h3>
                <p className="text-xs text-gray-500">Permanently delete your HerNext account and associated data.</p>
              </div>
            </div>

            {/* Red Warning Banner */}
            <div className="bg-red-50/80 p-4 rounded-2xl border border-red-200 mb-4 flex items-start gap-3">
              <AlertTriangle size={18} className="text-red-600 shrink-0 mt-0.5" />
              <p className="text-xs text-red-900 leading-relaxed font-medium">
                <strong>Warning:</strong> Deleting your account will permanently remove your profile, course progress, evidence, verified progress, and saved data. This action cannot be undone.
              </p>
            </div>

            <div className="bg-[#FAF8FC] p-3.5 rounded-2xl border border-purple-50 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#2D1B4E] block mb-0.5">
                  Permanently remove account
                </span>
                <p className="text-[11px] text-gray-500">
                  Remove account access and all saved data.
                </p>
              </div>
              <button 
                onClick={() => setShowDeleteAccountModal(true)}
                className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-xs transition-colors cursor-pointer whitespace-nowrap"
              >
                Delete Account
              </button>
            </div>
          </div>
        </motion.div>

      </div>

      {/* --- MODALS --- */}

      {/* 1. Edit Account Modal */}
      <AnimatePresence>
        {showEditAccountModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-purple-100"
            >
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
                <h3 className="font-bold text-base text-[#2D1B4E]">Edit Account Details</h3>
                <button onClick={() => setShowEditAccountModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={18} />
                </button>
              </div>

              {accountError && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-start gap-2">
                  <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                  <span>{accountError}</span>
                </div>
              )}

              <form onSubmit={handleSaveAccount} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    required
                    disabled
                    title="Name changes are not supported yet"
                    className="w-full text-xs p-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Updating your name is not available yet.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    required
                    disabled
                    title="Email changes are not supported yet"
                    className="w-full text-xs p-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Updating your email is not available yet.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Country & State / Province</label>
                  <LocationSelects
                    country={editCountry}
                    onCountryChange={setEditCountry}
                    state={editState}
                    onStateChange={setEditState}
                    idPrefix="settings"
                    countryRequired
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button 
                    type="button" 
                    onClick={() => setShowEditAccountModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingAccount}
                    className="px-4 py-2.5 rounded-xl bg-[#8C3F96] hover:bg-[#73317c] text-white text-xs font-bold shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSavingAccount ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Change Password Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-purple-100"
            >
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
                <h3 className="font-bold text-base text-[#2D1B4E]">Change Password</h3>
                <button onClick={() => setShowPasswordModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Current Password</label>
                  <input 
                    type="password" 
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    placeholder="Enter current password"
                    className="w-full text-xs p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#8C3F96]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">New Password</label>
                  <input 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="Enter new password"
                    className="w-full text-xs p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#8C3F96]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Confirm New Password</label>
                  <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Re-enter new password"
                    className="w-full text-xs p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#8C3F96]"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button 
                    type="button" 
                    onClick={() => setShowPasswordModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-[#8C3F96] hover:bg-[#73317c] text-white text-xs font-bold shadow-md"
                  >
                    Update Password
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Sign Out Modal */}
      <AnimatePresence>
        {showSignOutModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-purple-100 text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
                <LogOut size={24} />
              </div>
              <h3 className="font-bold text-base text-[#2D1B4E] mb-1">Sign Out of HerNext?</h3>
              <p className="text-xs text-gray-500 mb-6">
                Are you sure you want to sign out of your HerNext account on this device?
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowSignOutModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSignOut}
                  className="flex-1 py-2.5 rounded-xl bg-[#2D1B4E] hover:bg-[#431F69] text-white text-xs font-bold shadow-md"
                >
                  Sign Out
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. Delete Account Modal */}
      <AnimatePresence>
        {showDeleteAccountModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-red-100 text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
                <AlertTriangle size={24} />
              </div>
              <h3 className="font-bold text-lg text-red-900 mb-1">Delete Account Permanently</h3>
              <p className="text-xs text-gray-600 mb-6 leading-relaxed">
                This operation is non-reversible. Your account and all of its data
                &mdash; profile, experiences, skills, roadmap progress and evidence
                &mdash; will be permanently removed from our database.
              </p>
              {deleteError && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  {deleteError}
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteAccountModal(false);
                    setDeleteError('');
                  }}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                >
                  Keep Account
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default SettingsPage;
