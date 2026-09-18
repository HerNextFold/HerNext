import { useState } from 'react'

import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, Lock, Mail, User } from 'lucide-react'
import AuthLayout from '../components/auth/AuthLayout'
import GoogleButton from '../components/auth/GoogleButton'
import Button from '../components/Button'
import { useUserContext } from '../context/UserContext'

export default function SignUp() {
  const navigate = useNavigate()
  const { updateUser } = useUserContext()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [agreeTerms, setAgreeTerms] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleGoogleAuth = () => {
    const finalEmail = email.trim() || 'aisha.halima@hernext.com';
    const finalName = fullName.trim() || 'Aisha Halima';
    updateUser({ fullName: finalName, email: finalEmail });
    navigate('/onboarding');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName || !email || !password || !confirmPassword) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!agreeTerms) {
      setError('Please accept the Terms of Service and Privacy Policy.');
      return;
    }

    setIsLoading(true);

    // Save actual user credentials to context
    updateUser({ fullName: fullName.trim(), email: email.trim() });

    // Simulate signup process, then navigate to Onboarding page
    setTimeout(() => {
      setIsLoading(false);
      navigate('/onboarding');
    }, 600);
  };

import type { ChangeEvent, FormEvent } from 'react'
import { Loader2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import { ApiError, registerUser } from '../lib/api'

interface SignUpForm {
  firstName: string
  lastName: string
  email: string
  password: string
  country: string
}

const initialForm: SignUpForm = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  country: '',
}

export default function SignUp() {
  const navigate = useNavigate()
  const [form, setForm] = useState<SignUpForm>(initialForm)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleChange(field: keyof SignUpForm) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }))
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSubmitting) return

    setError(null)
    setIsSubmitting(true)
    try {
      const { accessToken } = await registerUser(form)
      localStorage.setItem('accessToken', accessToken)
      navigate('/')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }


  return (
    <AuthLayout
      kicker="YOUR NEXT CHAPTER"
      headline="Your experience has value. Your next step starts here."
      subtext="Join ambitious women translating their lived experience into high-impact career opportunities."
      badgeText="Over 84% Onboarded Career Match"
    >
      <div className="space-y-6">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Create your account
          </h2>
          <p className="mt-1.5 text-sm text-body">
            Take the first step towards your next career move.
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

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink/80">
              Full Name
            </label>
            <div className="relative mt-1.5">
              <User
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-body/50"
              />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full rounded-xl border border-hairline bg-slate-50/50 py-2.5 pl-10 pr-3.5 text-sm text-ink outline-none transition-all focus:border-plum-600 focus:bg-white focus:ring-2 focus:ring-plum-500/20"
              />
            </div>
          </div>

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
                placeholder="Create a password"
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

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink/80">
              Confirm Password
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
                placeholder="Re-enter your password"
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

          <div className="flex items-center gap-2.5 pt-1">
            <input
              type="checkbox"
              id="agreeTerms"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="h-4 w-4 rounded border-hairline text-plum-800 focus:ring-plum-600"
            />
            <label htmlFor="agreeTerms" className="text-xs text-body">
              I agree to the{' '}
              <a href="#terms" className="font-medium text-plum-900 underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#privacy" className="font-medium text-plum-900 underline">
                Privacy Policy
              </a>
            </label>
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
                Creating Account...
              </span>
            ) : (
              <span className="inline-flex items-center justify-center gap-2">
                Create my HerNext account
                <ArrowRight size={16} />
              </span>

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm text-ink">
              First name
              <input
                type="text"
                required
                placeholder="Jane"
                value={form.firstName}
                onChange={handleChange('firstName')}
                disabled={isSubmitting}
                className="mt-1 w-full rounded-lg border border-hairline px-3 py-2 text-sm text-ink outline-none focus:border-plum-700 disabled:opacity-60"
              />
            </label>
            <label className="text-sm text-ink">
              Last name
              <input
                type="text"
                required
                placeholder="Doe"
                value={form.lastName}
                onChange={handleChange('lastName')}
                disabled={isSubmitting}
                className="mt-1 w-full rounded-lg border border-hairline px-3 py-2 text-sm text-ink outline-none focus:border-plum-700 disabled:opacity-60"
              />
            </label>
          </div>
          <label className="text-sm text-ink">
            Email
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange('email')}
              disabled={isSubmitting}
              className="mt-1 w-full rounded-lg border border-hairline px-3 py-2 text-sm text-ink outline-none focus:border-plum-700 disabled:opacity-60"
            />
          </label>
          <label className="text-sm text-ink">
            Password
            <input
              type="password"
              required
              minLength={8}
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange('password')}
              disabled={isSubmitting}
              className="mt-1 w-full rounded-lg border border-hairline px-3 py-2 text-sm text-ink outline-none focus:border-plum-700 disabled:opacity-60"
            />
          </label>
          <label className="text-sm text-ink">
            Country
            <input
              type="text"
              required
              placeholder="Nigeria"
              value={form.country}
              onChange={handleChange('country')}
              disabled={isSubmitting}
              className="mt-1 w-full rounded-lg border border-hairline px-3 py-2 text-sm text-ink outline-none focus:border-plum-700 disabled:opacity-60"
            />
          </label>
          <Button type="submit" variant="primary" className="mt-2 w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Creating account...
              </>
            ) : (
              'Create account'

            )}
          </Button>
        </form>

        <p className="pt-2 text-center text-sm text-body">
          Already have a HerNext account?{' '}
          <Link
            to="/sign-in"
            className="font-semibold text-plum-900 transition-colors hover:text-plum-700 underline"
          >
            Log in
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
