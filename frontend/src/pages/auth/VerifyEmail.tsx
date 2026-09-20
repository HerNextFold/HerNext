import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, MailCheck } from 'lucide-react'
import AuthLayout from '../../components/auth/AuthLayout'
import Button from '../../components/Button'
import { ApiError, resendEmailVerification, verifyEmailOtp } from '../../lib/api'

export default function VerifyEmail() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email') ?? ''
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [resendMessage, setResendMessage] = useState('')
  const [isResending, setIsResending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setResendMessage('')

    if (!email) {
      setError('Missing email address. Please sign up again.')
      return
    }

    if (!/^\d{6}$/.test(code)) {
      setError('Enter the 6-digit code sent to your email.')
      return
    }

    setIsLoading(true)
    try {
      const { accessToken } = await verifyEmailOtp({ email, code })
      localStorage.setItem('accessToken', accessToken)
      navigate('/sign-in')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    if (!email || isResending) return
    setError('')
    setResendMessage('')
    setIsResending(true)
    try {
      await resendEmailVerification(email)
      setResendMessage('If your account is still unverified, a new code has been sent.')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <AuthLayout
      kicker="ONE LAST STEP"
      headline="Verify your email to activate your account."
      subtext="We've sent a 6-digit code to your inbox. Enter it below to confirm your email address."
      badgeText="Secure Email Verification"
    >
      <div className="space-y-6">
        <div>
          <Link
            to="/sign-up"
            className="inline-flex items-center gap-2 text-xs font-semibold text-body transition-colors hover:text-ink"
          >
            <ArrowLeft size={14} />
            Back to Sign Up
          </Link>
        </div>

        <div>
          <span className="inline-flex items-center gap-1.5 rounded-md bg-plum-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-plum-900">
            Email Verification
          </span>
          <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Check your inbox
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-body">
            {email ? (
              <>
                Enter the 6-digit code we sent to{' '}
                <strong className="font-semibold text-ink">{email}</strong>.
              </>
            ) : (
              'Enter the 6-digit code we emailed you.'
            )}
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            {error}
          </div>
        )}

        {resendMessage && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
            {resendMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink/80">
              Verification Code
            </label>
            <div className="relative mt-1.5">
              <MailCheck
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-body/50"
              />
              <input
                type="text"
                inputMode="numeric"
                required
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                className="w-full rounded-xl border border-hairline bg-slate-50/50 py-2.5 pl-10 pr-3.5 text-sm tracking-[0.3em] text-ink outline-none transition-all focus:border-plum-600 focus:bg-white focus:ring-2 focus:ring-plum-500/20"
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
                Verifying...
              </span>
            ) : (
              <span className="inline-flex items-center justify-center gap-2">
                Verify email
                <ArrowRight size={16} />
              </span>
            )}
          </Button>
        </form>

        <p className="pt-2 text-center text-sm text-body">
          Didn&apos;t get a code?{' '}
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className="font-semibold text-plum-900 underline transition-colors hover:text-plum-700 disabled:opacity-60"
          >
            {isResending ? 'Sending...' : 'Resend code'}
          </button>
        </p>
      </div>
    </AuthLayout>
  )
}
