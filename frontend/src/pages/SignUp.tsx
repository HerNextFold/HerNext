import { Link } from 'react-router-dom'
import Button from '../components/Button'

export default function SignUp() {
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

        <form className="mt-6 flex flex-col gap-4">
          <label className="text-sm text-ink">
            Full name
            <input
              type="text"
              placeholder="Jane Doe"
              className="mt-1 w-full rounded-lg border border-hairline px-3 py-2 text-sm text-ink outline-none focus:border-plum-700"
            />
          </label>
          <label className="text-sm text-ink">
            Email
            <input
              type="email"
              placeholder="you@example.com"
              className="mt-1 w-full rounded-lg border border-hairline px-3 py-2 text-sm text-ink outline-none focus:border-plum-700"
            />
          </label>
          <label className="text-sm text-ink">
            Password
            <input
              type="password"
              placeholder="••••••••"
              className="mt-1 w-full rounded-lg border border-hairline px-3 py-2 text-sm text-ink outline-none focus:border-plum-700"
            />
          </label>
          <Button type="submit" variant="primary" className="mt-2 w-full">
            Create account
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
