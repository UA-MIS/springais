import { useMemo, useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const isSubmitDisabled = useMemo(() => {
    if (loading) return true;
    return email.trim().length === 0 || password.trim().length === 0;
  }, [email, password, loading]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background (no image asset; match vibe) */}
      <div className="absolute inset-0 bg-zinc-950" />
      {/* Slower blend gradient */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(24,24,27,0.70)_0%,rgba(9,9,11,0.45)_40%,rgba(0,0,0,0.70)_80%,rgba(0,0,0,1)_100%)]" />
      <div className="absolute inset-0 backdrop-blur-[1px]" />

      {/* Content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
        <div className="relative w-full max-w-[440px]">
          {/* Grey spotlight behind card */}
          <div className="pointer-events-none absolute -inset-x-20 -inset-y-16 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.22)_0%,rgba(255,255,255,0.10)_28%,transparent_65%)] blur-2xl" />

          <div className="relative rounded-sm border border-white/15 bg-white/7 px-10 py-11 shadow-2xl backdrop-blur-md">
            {/* Tabs (Login only; no register) */}
            <div className="mb-10 flex items-center justify-center">
              <div className="relative pb-2 text-base font-semibold text-white">
                Login
                <div className="absolute bottom-0 left-1/2 h-0.5 w-10 -translate-x-1/2 bg-[#FFE600]" />
              </div>
            </div>

            <form className="space-y-7" onSubmit={handleSubmit}>
              {error && (
                <div className="rounded border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-xs font-medium tracking-wide text-white/60">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@ey.com"
                    className="auth-input mt-2 block w-full appearance-none border-0 border-b border-[#FFE600]/30 bg-transparent px-0 py-2.5 text-base text-white placeholder:text-white/25 focus:border-[#FFE600] focus:outline-none focus:ring-0"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-xs font-medium tracking-wide text-white/60">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="password"
                    className="auth-input mt-2 block w-full appearance-none border-0 border-b border-[#FFE600]/30 bg-transparent px-0 py-2.5 text-base text-white placeholder:text-white/25 focus:border-[#FFE600] focus:outline-none focus:ring-0"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitDisabled}
                className="mt-2 flex w-full items-center justify-center rounded-sm bg-white/15 px-4 py-3 text-base font-medium text-white/90 transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg
                      className="-ml-1 mr-3 h-5 w-5 animate-spin"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  'Login'
                )}
              </button>

              <div className="pt-2 text-center space-y-2">
                <Link to="/forgot-password" className="text-sm text-white/45 hover:text-white/70">
                  Forgot Password?
                </Link>
                <div className="text-sm text-white/45">
                  New here?{' '}
                  <Link to="/register" className="text-white/70 hover:text-white">
                    Create an account
                  </Link>
                </div>
                <div className="text-sm text-white/45">
                  <a
                    href="/deck/"
                    target="_blank"
                    rel="noopener"
                    className="hover:text-white/70 transition-colors"
                    aria-label="View the SkillBridge pitch deck (opens in new tab)"
                  >
                    View the SkillBridge pitch deck →
                  </a>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
