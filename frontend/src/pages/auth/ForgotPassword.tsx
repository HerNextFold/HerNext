import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CheckCircle2, Mail, ShieldAlert } from 'lucide-react'
import AuthLayout from '../../components/auth/AuthLayout'
import Button from '../../components/Button'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [isSent, setIsSent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email) {
      setError('Please enter your email address.')
      return
    }

    setIsLoading(true)

    // Simulate sending email reset link
    setTimeout(() => {
      setIsLoading(false)
      setIsSent(true)
    }, 600)
  }

  return (
    <AuthLayout
      kicker="ACCOUNT RECOVERY"
      headline="Let's get you back to your journey."
      subtext="Enter the email address connected to your account and we'll send you a secure link to reset your password."
      badgeText="Secure Password Recovery"
    >
      <div className="space-y-6">
        {/* Back Link */}
        <div>
          <Link
            to="/sign-in"
            className="inline-flex items-center gap-2 text-xs font-semibold text-body transition-colors hover:text-ink"
          >
            <ArrowLeft size={14} />
            Back to Login
          </Link>
        </div>

        <div>
          <span className="inline-flex items-center gap-1.5 rounded-md bg-plum-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-plum-900">
            Account Recovery
          </span>
          <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Forgot your password?
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-body">
            No worries. Enter your email and we&apos;ll send you a secure link to create a new password.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            {error}
          </div>
        )}

        {!isSent ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink/80">
                Email Address
              </label>
              <div className="relative mt-1.5">
                <Mail
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-body/50"
                />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-xl border border-hairline bg-slate-50/50 py-2.5 pl-10 pr-3.5 text-sm text-ink outline-none transition-all focus:border-plum-600 focus:bg-white focus:ring-2 focus:ring-plum-500/20"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="mt-2 w-full py-3 text-sm font-semibold shadow-md transition-transform active:scale-[0.99]"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Sending Link...
                </span>
              ) : (
                <span>Send reset link</span>
              )}
            </Button>

            <div className="rounded-xl border border-hairline bg-slate-50/80 p-4 text-xs text-body space-y-2">
              <div className="flex items-center gap-2 font-semibold text-ink">
                <ShieldAlert size={14} className="text-plum-700" />
                <span>Your Information is Secure</span>
              </div>
              <p>
                For your security, we only send password reset instructions to the email address associated with your account.
              </p>
            </div>
          </form>
        ) : (
          <div className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6 text-center shadow-xs">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 size={24} />
            </div>
            <h3 className="font-display text-lg font-bold text-emerald-950">
              Reset Link Sent!
            </h3>
            <p className="text-xs leading-relaxed text-emerald-800">
              We&apos;ve sent an email to <strong className="font-semibold">{email}</strong> with instructions to reset your password.
            </p>

            <div className="pt-2">
              <Button
                variant="primary"
                onClick={() => navigate('/reset-password')}
                className="w-full py-2.5 text-xs font-semibold shadow-sm"
              >
                <span className="inline-flex items-center gap-2">
                  Proceed to Create New Password
                  <ArrowRight size={14} />
                </span>
              </Button>
            </div>

            <p className="text-[11px] text-emerald-700 pt-2">
              Didn&apos;t receive the email?{' '}
              <button
                type="button"
                onClick={() => setIsSent(false)}
                className="font-bold underline hover:text-emerald-900"
              >
                Click to try again
              </button>
            </p>
          </div>
        )}
      </div>
    </AuthLayout>
  )
}
