import type React from 'react'
import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import PurpleBackgroundDots from '../dashboard/PurpleBackgroundDots'
import { ArrowLeft, Sparkles } from 'lucide-react'

interface AuthLayoutProps {
  children: React.ReactNode
  kicker?: string
  headline: string
  subtext: string
  badgeText?: string
  backgroundImage?: string
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  kicker = 'YOUR NEXT CHAPTER',
  headline,
  subtext,
  badgeText,
  backgroundImage = '/figma-hero-woman.jpg',
}) => {
  return (
    <div className="relative flex min-h-screen w-full bg-slate-50 font-sans text-ink">
      {/* LEFT SIDE: Brand Experience (45% on desktop, hidden on mobile) */}
      <div className="relative hidden w-[45%] flex-col justify-between overflow-hidden bg-plum-950 p-10 text-white lg:flex xl:p-14">
        {/* Background Image with Dark Plum Gradient Overlay (CLEAN IMAGE - NO DOTS ON FACE) */}
        <div className="absolute inset-0 z-0">
          <img
            src={backgroundImage}
            alt="HerNext Professional"
            className="h-full w-full object-cover object-top opacity-80 transition-opacity duration-300"
          />
          {/* Signature Figma Gradient: #200922 70% to 0% */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#200922] via-[#200922]/70 to-[#200922]/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#200922]/80 via-transparent to-transparent" />
        </div>

        {/* Top Left: Logo */}
        <div className="relative z-20 flex items-center justify-between">
          <Link
            to="/"
            className="group flex items-center gap-2.5 font-display text-2xl font-bold tracking-tight text-white transition-opacity hover:opacity-90"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-peach-300 text-plum-950 font-bold shadow-md">
              H
            </span>
            <span>HerNext</span>
          </Link>
        </div>

        {/* Lower Left: Hero Copy Container with subtle background animation scoped to text area */}
        <div className="relative z-20 overflow-hidden rounded-3xl border border-white/10 bg-plum-950/40 p-6 backdrop-blur-md">
          {/* Background dots ONLY inside text content box */}
          <PurpleBackgroundDots dotCount={15} className="z-0 opacity-50" />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="relative z-10 max-w-lg space-y-4"
          >
            {kicker && (
              <span className="inline-flex items-center gap-2 rounded-full border border-peach-300/30 bg-plum-900/60 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-peach-200 shadow-xs">
                <Sparkles size={13} className="text-peach-300" />
                {kicker}
              </span>
            )}

            <h1 className="font-display text-2xl font-semibold leading-tight text-white lg:text-3xl xl:text-4xl">
              {headline}
            </h1>

            <p className="text-xs leading-relaxed text-white/80 sm:text-sm xl:text-base">
              {subtext}
            </p>

            {badgeText && (
              <div className="pt-2">
                <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3.5 py-1.5 text-xs font-medium text-white backdrop-blur-md">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  {badgeText}
                </span>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* RIGHT SIDE: Auth Form Canvas (55% desktop, 100% mobile) */}
      <div className="relative flex min-h-screen w-full flex-1 flex-col justify-between overflow-y-auto bg-white p-6 sm:p-10 lg:w-[55%] lg:p-12">
        {/* Ambient Background Dots on Form Text Area */}
        <PurpleBackgroundDots dotCount={25} className="z-0 opacity-35" />

        {/* Header Navigation with Prominent "Back to Landing Page" Link */}
        <div className="relative z-20 flex items-center justify-between pb-4 border-b border-hairline/60">
          <Link
            to="/"
            className="flex items-center gap-2 font-display text-xl font-bold text-ink lg:hidden"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-plum-800 text-white font-bold">
              H
            </span>
            <span>HerNext</span>
          </Link>

          <div className="ml-auto">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full border border-hairline bg-slate-50/80 px-4 py-2 text-xs font-semibold text-ink shadow-2xs transition-all hover:border-plum-300 hover:bg-white hover:text-plum-900 hover:shadow-xs active:scale-[0.98]"
            >
              <ArrowLeft size={14} className="text-plum-700" />
              <span>Back to Landing Page</span>
            </Link>
          </div>
        </div>

        {/* Centered Form Content Wrapper */}
        <div className="relative z-10 mx-auto my-auto w-full max-w-md py-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {children}
          </motion.div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 pt-4 text-center text-xs text-body/70 border-t border-hairline/40">
          Your information is secure & private. &copy; {new Date().getFullYear()} HerNext Inc.
        </div>
      </div>
    </div>
  )
}

export default AuthLayout
