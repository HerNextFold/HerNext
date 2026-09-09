import { RefreshCw, Search, TrendingUp } from 'lucide-react'
import { motion } from 'motion/react'
import type { LucideIcon } from 'lucide-react'

interface ValueProp {
  icon: LucideIcon
  title: string
  description: string
  highlighted?: boolean
}

const VALUE_PROPS: ValueProp[] = [
  {
    icon: Search,
    title: 'Discover',
    description:
      "Understand your existing skills deeply. We map your current trajectory to uncover hidden strengths you didn't realize were highly transferable.",
  },
  {
    icon: RefreshCw,
    title: 'Adapt',
    description:
      'See how AI affects your specific career path. Receive intelligent, real-time insights on market shifts and emerging skill requirements.',
    highlighted: true,
  },
  {
    icon: TrendingUp,
    title: 'Grow',
    description:
      'Build your next career move with confidence. Access curated developmental paths, coaching, and a verified career passport.',
  },
]

export default function ValueProps() {
  return (
    <section id="how-it-works" className="mx-auto max-w-7xl px-6 py-16 lg:px-10 lg:py-20">
      <div className="grid gap-6 md:grid-cols-3">
        {VALUE_PROPS.map((prop, index) => (
          <motion.div
            key={prop.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.4, delay: index * 0.08 }}
            className={`rounded-2xl border p-6 ${
              prop.highlighted
                ? 'border-peach-300/60 bg-peach-50'
                : 'border-hairline bg-white'
            }`}
          >
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                prop.highlighted
                  ? 'bg-peach-300/40 text-plum-800'
                  : 'bg-blush-100 text-plum-700'
              }`}
            >
              <prop.icon size={18} />
            </div>
            <h3 className="mt-4 font-display text-lg font-medium text-ink">
              {prop.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-body">
              {prop.description}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
