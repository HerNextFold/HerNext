import { useState } from 'react'
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-blush-50 px-6 py-16">
      <div className="w-full max-w-sm rounded-2xl border border-hairline bg-white p-8 shadow-sm">
        <Link to="/" className="font-display text-lg font-medium text-ink">
          HerNext
        </Link>
        <h1 className="mt-6 font-display text-2xl font-medium text-ink">
          Start your career journey
        </h1>
        <p className="mt-2 text-sm text-body">
          Create your account to get your personalized career roadmap.
        </p>

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

        <p className="mt-6 text-center text-sm text-body">
          Already have an account?{' '}
          <Link to="/sign-in" className="font-medium text-plum-800">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
