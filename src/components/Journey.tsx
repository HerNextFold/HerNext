import {
  Briefcase,
  Compass,
  Target,
  UploadCloud,
  Wand2,
} from 'lucide-react'
import { motion } from 'motion/react'
import type { LucideIcon } from 'lucide-react'

interface Step {
  icon: LucideIcon
  title: string
  description: string
  variant: 'default' | 'active' | 'final'
}

const STEPS: Step[] = [
  {
    icon: UploadCloud,
    title: 'Your Experience',
    description: 'Upload your history.',
    variant: 'default',
  },
  {
    icon: Target,
    title: 'AI Analysis',
    description: 'Skills mapped instantly.',
    variant: 'active',
  },
  {
    icon: Compass,
    title: 'Career Direction',
    description: 'Explore tailored paths.',
    variant: 'default',
  },
  {
    icon: Wand2,
    title: 'Skill Development',
    description: 'Close the gaps.',
    variant: 'default',
  },
  {
    icon: Briefcase,
    title: 'Career Passport',
    description: "Ready for what's next.",
    variant: 'final',
  },
]

function circleClasses(variant: Step['variant']) {
  switch (variant) {
    case 'active':
      return 'bg-peach-100 text-plum-800 ring-2 ring-peach-300'
    case 'final':
      return 'bg-plum-900 text-white'
    default:
      return 'bg-white text-plum-700 ring-1 ring-hairline'
  }
}

export default function Journey() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-16 lg:px-10 lg:pb-24">
      <div className="rounded-3xl bg-blush-100 px-6 py-14 sm:px-10 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.4 }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="font-display text-2xl font-medium text-ink sm:text-3xl">
            From where you are to what&apos;s next.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-body sm:text-base">
            HerNext turns your experience into a clear, personalized path
            forward. Watch how we bridge the gap between today&apos;s skills
            and tomorrow&apos;s opportunities.
          </p>
        </motion.div>

        {/* Desktop / tablet: horizontal timeline */}
        <div className="mt-12 hidden lg:block">
          <div className="relative flex items-start justify-between">
            <div className="absolute top-6 right-0 left-0 -z-0 h-px bg-hairline" />
            {STEPS.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.35, delay: index * 0.08 }}
                className="relative z-10 flex w-1/5 flex-col items-center text-center"
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full ${circleClasses(step.variant)}`}
                >
                  <step.icon size={18} />
                </div>
                <p className="mt-3 text-sm font-medium text-ink">
                  {step.title}
                </p>
                <p className="mt-1 text-xs text-body">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Mobile / small tablet: vertical stepper */}
        <ol className="mt-10 flex flex-col gap-3 lg:hidden">
          {STEPS.map((step, index) => (
            <motion.li
              key={step.title}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.3, delay: index * 0.06 }}
              className={`flex items-start gap-4 rounded-xl p-4 ${
                step.variant === 'active' ? 'bg-peach-50' : ''
              }`}
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${circleClasses(step.variant)}`}
              >
                <step.icon size={16} />
              </div>
              <div>
                <p className="text-sm font-medium text-ink">
                  {index + 1}. {step.title}
                </p>
                <p className="mt-0.5 text-xs text-body">
                  {step.description}
                </p>
              </div>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  )
}
