import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, Lock, X } from 'lucide-react'
import AuthLayout from '../../components/auth/AuthLayout'
import Button from '../../components/Button'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Live password requirement validation checks
  const reqLength = password.length >= 8
  const reqUpper = /[A-Z]/.test(password)
  const reqNumber = /[0-9]/.test(password)
  const reqSpecial = /[^A-Za-z0-9]/.test(password)

  const isFormValid = reqLength && reqUpper && reqNumber && reqSpecial && password === confirmPassword

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!password || !confirmPassword) {
      setError('Please fill in both password fields.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (!reqLength || !reqUpper || !reqNumber || !reqSpecial) {
      setError('Please make sure your password satisfies all requirements.')
      return
    }

    setIsLoading(true)

    // Simulate password update, then redirect to Sign In
    setTimeout(() => {
      setIsLoading(false)
      setIsSuccess(true)
      setTimeout(() => {
        navigate('/sign-in')
      }, 1500)
    }, 600)
  }

  return (
    <AuthLayout
      kicker="SECURE ACCOUNT RECOVERY"
      headline="Create a new password. Keep moving forward."
      subtext="Set a new secure password and continue your HerNext career journey."
      badgeText="Protected & Encrypted"
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
            Secure Account Recovery
          </span>
          <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Create a new password
          </h2>
          <p className="mt-1.5 text-sm text-body">
            Choose a strong password you haven&apos;t used before.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            {error}
          </div>
        )}

        {isSuccess ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center shadow-xs space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <Check size={24} />
            </div>
            <h3 className="font-display text-lg font-bold text-emerald-950">
              Password Updated!
            </h3>
            <p className="text-xs text-emerald-800">
              Your password has been reset successfully. Redirecting you to the login page...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink/80">
                New Password
              </label>
              <div className="relative mt-1.5">
                <Lock
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-body/50"
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full rounded-xl border border-hairline bg-slate-50/50 py-2.5 pl-10 pr-10 text-sm text-ink outline-none transition-all focus:border-plum-600 focus:bg-white focus:ring-2 focus:ring-plum-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-body/50 transition-colors hover:text-ink"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Figma Requirements Checklist Card */}
            <div className="rounded-xl border border-peach-200 bg-peach-50/60 p-4 text-xs space-y-2">
              <span className="font-semibold uppercase tracking-wider text-plum-950 text-[11px]">
                Password Requirements
              </span>
              <ul className="space-y-1.5 pt-1 text-ink/80">
                <li className="flex items-center gap-2">
                  {reqLength ? (
                    <Check size={14} className="text-emerald-600 shrink-0" />
                  ) : (
                    <X size={14} className="text-rose-400 shrink-0" />
                  )}
                  <span className={reqLength ? 'text-emerald-800 font-medium' : ''}>
                    At least 8 characters
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  {reqUpper ? (
                    <Check size={14} className="text-emerald-600 shrink-0" />
                  ) : (
                    <X size={14} className="text-rose-400 shrink-0" />
                  )}
                  <span className={reqUpper ? 'text-emerald-800 font-medium' : ''}>
                    One uppercase letter
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  {reqNumber ? (
                    <Check size={14} className="text-emerald-600 shrink-0" />
                  ) : (
                    <X size={14} className="text-rose-400 shrink-0" />
                  )}
                  <span className={reqNumber ? 'text-emerald-800 font-medium' : ''}>
                    One number
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  {reqSpecial ? (
                    <Check size={14} className="text-emerald-600 shrink-0" />
                  ) : (
                    <X size={14} className="text-rose-400 shrink-0" />
                  )}
                  <span className={reqSpecial ? 'text-emerald-800 font-medium' : ''}>
                    One special character
                  </span>
                </li>
              </ul>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink/80">
                Confirm New Password
              </label>
              <div className="relative mt-1.5">
                <Lock
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-body/50"
                />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full rounded-xl border border-hairline bg-slate-50/50 py-2.5 pl-10 pr-10 text-sm text-ink outline-none transition-all focus:border-plum-600 focus:bg-white focus:ring-2 focus:ring-plum-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-body/50 transition-colors hover:text-ink"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="mt-4 w-full py-3 text-sm font-semibold shadow-md transition-transform active:scale-[0.99]"
              disabled={isLoading || !isFormValid}
            >
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Updating Password...
                </span>
              ) : (
                <span className="inline-flex items-center justify-center gap-2">
                  Update password
                  <ArrowRight size={16} />
                </span>
              )}
            </Button>
          </form>
        )}
      </div>
    </AuthLayout>
  )
}
