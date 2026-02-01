import { Link } from 'react-router-dom';

export default function ForgotPasswordPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Match login vibe (no asset) */}
      <div className="absolute inset-0 bg-zinc-950" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(24,24,27,0.70)_0%,rgba(9,9,11,0.45)_40%,rgba(0,0,0,0.70)_80%,rgba(0,0,0,1)_100%)]" />
      <div className="absolute inset-0 backdrop-blur-[1px]" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
        <div className="relative w-full max-w-[620px]">
          {/* Grey spotlight behind card */}
          <div className="pointer-events-none absolute -inset-x-24 -inset-y-20 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.22)_0%,rgba(255,255,255,0.10)_28%,transparent_65%)] blur-2xl" />

          <div className="relative rounded-sm border border-white/15 bg-white/7 px-12 py-11 shadow-2xl backdrop-blur-md">
          <h1 className="text-xl font-semibold text-white">Forgot Password</h1>
          <p className="mt-4 text-base leading-7 text-white/60">
            Password reset isn’t wired up yet (Block M will connect real auth + email). For now, go back to login and use
            the demo credentials.
          </p>

          <div className="mt-7 flex items-center gap-4">
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-sm bg-white/15 px-5 py-3 text-base font-medium text-white/90 hover:bg-white/20"
            >
              Back to Login
            </Link>
          </div>

          <div className="mt-8 rounded border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/55">
            Demo: <span className="text-white/80">admin@ey.com</span> / <span className="text-white/80">password</span>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}

