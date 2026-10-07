export default function AboutSection() {
  return (
    <section id="about" className="scroll-mt-24 border-y border-hairline bg-blush-50">
      <div className="mx-auto grid max-w-7xl gap-6 px-6 py-16 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16 lg:px-10 lg:py-20">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-plum-700">
            About HerNext
          </span>
          <h2 className="mt-3 max-w-xl font-display text-2xl font-medium leading-tight text-ink sm:text-3xl">
            Your experience is a strong place to begin.
          </h2>
        </div>
        <div className="max-w-2xl">
          <p className="text-base leading-relaxed text-body">
            HerNext helps women understand the skills they already have, explore
            career directions, and plan their next steps as the world of work
            changes.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-body">
            The goal is a clearer path forward, built around your experience,
            strengths, and ambitions.
          </p>
        </div>
      </div>
    </section>
  )
}
