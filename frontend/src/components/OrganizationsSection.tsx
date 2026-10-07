import { Sparkles } from 'lucide-react'
import { motion } from 'motion/react'

export default function OrganizationsSection() {
  return (
    <section id="organizations" className="scroll-mt-24 mx-auto max-w-7xl px-6 py-16 lg:px-10 lg:py-20">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.4 }}
        className="rounded-3xl border border-peach-300/60 bg-peach-50 px-6 py-10 text-center sm:px-10 sm:py-14"
      >
        <span className="mx-auto inline-flex items-center gap-2 rounded-full border border-plum-700/15 bg-white px-3.5 py-1.5 text-xs font-semibold text-plum-800">
          <Sparkles size={14} className="text-plum-700" />
          Coming Soon
        </span>
        <h2 className="mx-auto mt-5 max-w-2xl font-display text-2xl font-medium leading-tight text-ink sm:text-3xl">
          Career support for organizations is on its way.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-body sm:text-base">
          We are preparing ways for organizations to support women as they
          discover their strengths and plan what comes next.
        </p>
      </motion.div>
    </section>
  )
}
