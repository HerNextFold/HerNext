import { ArrowRight, Sparkles } from 'lucide-react'
import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import Button from './Button'

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-blush-50">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-16 lg:grid-cols-2 lg:gap-10 lg:px-10 lg:py-24">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-plum-700/20 bg-white px-4 py-1.5 text-xs font-medium text-plum-800">
            <Sparkles size={14} className="text-plum-700" />
            Your next career starts with what you already know
          </span>

          <h1 className="mt-6 font-display text-4xl leading-[1.1] font-medium text-ink sm:text-5xl lg:text-[3.25rem]">
            Your experience got you here. Let&apos;s prepare you for
            what&apos;s next.
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-body">
            The landscape is shifting, but your foundational skills remain
            powerful. HerNext uses intelligent AI to map your existing
            expertise to high-growth opportunities, designing a personalized
            roadmap for your career evolution.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/sign-up">
              <Button variant="primary" className="w-full sm:w-auto">
                Start Your Career Journey
                <ArrowRight size={16} />
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button variant="outline" className="w-full sm:w-auto">
                See How It Works
              </Button>
            </a>
          </div>

          <p className="mt-5 text-xs text-body/80">
            Built for women navigating the changing world of work.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="relative mx-auto w-full max-w-md"
        >
          <div className="aspect-[4/5] overflow-hidden rounded-3xl bg-peach-100 shadow-lg">
            {/* Replace with the HerNext hero photograph (professional
                Black woman in business attire) from the Figma design. */}
            <img
              src="/professional woman picture..jpeg"
              alt="A professional preparing for her next career step"
              className="h-full w-full object-cover"
            />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="absolute -bottom-6 -left-6 w-56 rounded-2xl border border-hairline bg-white p-4 shadow-xl sm:w-64"
          >
            <div className="flex items-center gap-2 text-xs font-medium text-plum-700">
              <Sparkles size={14} />
              Career Insight
            </div>
            <p className="mt-2 text-sm font-medium text-ink">
              Career Readiness
            </p>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-blush-100">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '72%' }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="h-full rounded-full bg-plum-700"
              />
            </div>
            <p className="mt-2 text-xs text-body">
              72% Optimized for Tech PM
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
