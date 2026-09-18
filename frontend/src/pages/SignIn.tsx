import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react'
import AuthLayout from '../components/auth/AuthLayout'
import GoogleButton from '../components/auth/GoogleButton'
import Button from '../components/Button'
import { useUserContext, formatNameFromEmail } from '../context/UserContext'

export default function SignIn() {
  const navigate = useNavigate()
  const { updateUser } = useUserContext()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleGoogleAuth = () => {
    const userEmail = email.trim() || 'aisha.halima@gmail.com';
    updateUser({ email: userEmail, fullName: formatNameFromEmail(userEmail) });
    navigate('/dashboard');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Please enter your email and password.')
      return
    }

    setIsLoading(true)

    // Save actual user login info to context
    const cleanEmail = email.trim();
    updateUser({ email: cleanEmail, fullName: formatNameFromEmail(cleanEmail) });

    // Existing user logging in: navigate DIRECTLY to dashboard
    setTimeout(() => {
      setIsLoading(false)
      navigate('/dashboard')
    }, 600)
  }

  return (
    <AuthLayout
      kicker="WELCOME BACK"
      headline="Your next chapter is waiting."
      subtext="Pick up where you left off and keep moving toward your next career move."
      badgeText="24/7 AI-Powered Growth"
    >
      <div className="space-y-6">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Welcome back
          </h2>
          <p className="mt-1.5 text-sm text-body">
            Log in to continue building your career path with HerNext.
          </p>
        </div>

        {/* Social Auth */}
        <GoogleButton
          label="Continue with Google"
          onClick={handleGoogleAuth}
        />

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="w-full border-t border-hairline" />
          <span className="relative bg-white px-3 text-xs font-medium uppercase tracking-wider text-body/70">
            or continue with email
          </span>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            {error}
          </div>
        )}

        {/* Login Form */}
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
                placeholder="you@example.com"
                className="w-full rounded-xl border border-hairline bg-slate-50/50 py-2.5 pl-10 pr-3.5 text-sm text-ink outline-none transition-all focus:border-plum-600 focus:bg-white focus:ring-2 focus:ring-plum-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink/80">
              Password
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
                placeholder="••••••••"
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

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 text-xs text-body cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-hairline text-plum-800 focus:ring-plum-600"
              />
              Remember me
            </label>

            <Link
              to="/forgot-password"
              className="text-xs font-semibold text-plum-900 transition-colors hover:text-plum-700 hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="mt-4 w-full py-3 text-sm font-semibold shadow-md transition-transform active:scale-[0.99]"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Logging in...
              </span>
            ) : (
              <span className="inline-flex items-center justify-center gap-2">
                Log in
                <ArrowRight size={16} />
              </span>
            )}
          </Button>
        </form>

        <p className="pt-2 text-center text-sm text-body">
          Don&apos;t have a HerNext account?{' '}
          <Link
            to="/sign-up"
            className="font-semibold text-plum-900 transition-colors hover:text-plum-700 underline"
          >
            Create an account
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
