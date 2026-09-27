import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ShieldCheck, Sparkles } from 'lucide-react'
import { ApiError, getPublicPassport, type PublicPassport as PublicPassportData } from '../lib/api'

export default function PublicPassport() {
  const { slug } = useParams<{ slug: string }>()
  const [passport, setPassport] = useState<PublicPassportData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!slug) return
      setIsLoading(true)
      setError('')
      try {
        const { passport: data } = await getPublicPassport(slug)
        if (!cancelled) setPassport(data)
      } catch (err) {
        if (cancelled) return
        setError(
          err instanceof ApiError && err.status === 404
            ? 'This Career Passport is private or does not exist.'
            : err instanceof ApiError
              ? err.message
              : 'Something went wrong. Please try again.',
        )
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [slug])

  return (
    <div className="min-h-screen bg-[#FAF8FC] font-sans text-gray-800">
      <header className="border-b border-purple-100/70 bg-white px-4 py-4 sm:px-8">
        <Link to="/" className="font-display text-lg font-black text-[#2D1B4E]">
          HerNext
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        {isLoading && <p className="text-sm text-gray-500">Loading Career Passport...</p>}

        {!isLoading && error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>
        )}

        {!isLoading && !error && passport && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-purple-100/80 bg-white p-6 shadow-xs sm:p-8">
              <span className="mb-1 block text-[10px] font-extrabold uppercase tracking-wider text-[#9E4733]">
                • CAREER PASSPORT
              </span>
              <h1 className="text-2xl font-extrabold tracking-tight text-[#2D1B4E] sm:text-3xl">{passport.name}</h1>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-xs font-semibold text-gray-500">
                {passport.headline && <span>{passport.headline}</span>}
                {passport.headline && passport.country && <span>•</span>}
                {passport.country && <span>{passport.country}</span>}
              </p>
              {passport.careerGoal && (
                <div className="mt-3 inline-block rounded-xl border border-purple-100/80 bg-purple-50/70 px-3 py-1 text-[11px] font-bold text-[#8C3F96]">
                  Target: {passport.careerGoal}
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-purple-100/80 bg-white p-6 shadow-xs sm:p-8">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-extrabold text-[#2D1B4E]">Career Readiness</h2>
                <span className="rounded-full border border-rose-100 bg-rose-50 px-3 py-1 text-[10px] font-extrabold text-[#9E4733]">
                  {passport.readinessLabel}
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-[#2D1B4E]">{Math.round(passport.readiness)}%</span>
                <span className="text-xs font-semibold text-gray-500">overall readiness</span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-lg font-black text-[#2D1B4E]">{Math.round(passport.roadmapProgress)}%</span>
                <span className="text-xs font-semibold text-gray-500">roadmap progress</span>
              </div>
            </div>

            {passport.experience.length > 0 && (
              <div className="rounded-3xl border border-purple-100/80 bg-white p-6 shadow-xs sm:p-8">
                <h2 className="mb-3 text-base font-extrabold text-[#2D1B4E]">Experience</h2>
                <div className="space-y-3">
                  {passport.experience.map((exp, idx) => (
                    <div key={idx} className="rounded-2xl border border-purple-100/70 bg-purple-50/30 p-4">
                      <h3 className="text-sm font-black text-[#2D1B4E]">{exp.title}</h3>
                      <p className="text-[11px] font-medium text-gray-500">
                        {[exp.organization, exp.years ? `${exp.years} years` : null].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {passport.skills.length > 0 && (
              <div className="rounded-3xl border border-purple-100/80 bg-white p-6 shadow-xs sm:p-8">
                <h2 className="mb-3 text-base font-extrabold text-[#2D1B4E]">Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {passport.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="flex items-center gap-1.5 rounded-xl border border-purple-100 bg-purple-50/60 px-3 py-1.5 text-xs font-semibold text-[#2D1B4E]"
                    >
                      <Sparkles size={12} className="text-[#8C3F96]" />
                      {skill.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {passport.evidence.length > 0 && (
              <div className="rounded-3xl border border-purple-100/80 bg-white p-6 shadow-xs sm:p-8">
                <h2 className="mb-3 text-base font-extrabold text-[#2D1B4E]">Evidence</h2>
                <div className="space-y-3">
                  {passport.evidence.map((item, idx) => (
                    <div key={idx} className="rounded-2xl border border-[#F5E1EC] bg-[#FAF4F7] p-4">
                      <h3 className="text-sm font-black text-[#2D1B4E]">{item.title}</h3>
                      <p className="mt-1 text-xs font-medium leading-relaxed text-gray-600">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {passport.achievements.length > 0 && (
              <div className="rounded-3xl border border-purple-100/80 bg-white p-6 shadow-xs sm:p-8">
                <h2 className="mb-3 text-base font-extrabold text-[#2D1B4E]">Achievements</h2>
                <div className="flex flex-wrap gap-2">
                  {passport.achievements.map((ach, idx) => (
                    <span
                      key={idx}
                      className="flex items-center gap-1.5 rounded-xl border border-purple-100 bg-purple-50/50 px-3 py-1.5 text-xs font-semibold text-[#2D1B4E]"
                    >
                      <ShieldCheck size={12} className="text-[#8C3F96]" />
                      {ach.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
