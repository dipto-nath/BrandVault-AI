'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to sign in');
      }

      window.location.href = '/overview';
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-[#FFFDF9] border border-[#E6DCC8] rounded-2xl shadow-sm p-6 sm:p-8">
      <div className="text-center mb-6">
        <h1 className="font-serif text-2xl font-bold text-[#1E2540]">Sign in to your vault</h1>
        <p className="text-xs text-[#4C5470] mt-1.5">
          Access your company brand guidelines, approved facts and review desk.
        </p>
      </div>

      {error && (
        <div className="mb-5 p-3 rounded-xl bg-[#B24A4A]/10 border border-[#B24A4A]/20 text-[#B24A4A] text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-[#1E2540] uppercase tracking-wider mb-1.5">
            Work Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6DCC8] bg-[#FBF7EF]/50 text-sm text-[#1E2540] placeholder-[#4C5470]/50 focus:outline-none focus:ring-2 focus:ring-[#2F4FB3]/20 focus:border-[#2F4FB3] transition-all"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-[#1E2540] uppercase tracking-wider">
              Password
            </label>
          </div>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6DCC8] bg-[#FBF7EF]/50 text-sm text-[#1E2540] placeholder-[#4C5470]/50 focus:outline-none focus:ring-2 focus:ring-[#2F4FB3]/20 focus:border-[#2F4FB3] transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 rounded-xl bg-[#2F4FB3] hover:bg-[#253f93] text-white text-sm font-medium shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Signing in...</span>
            </>
          ) : (
            <>
              <span>Sign in</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-[#E6DCC8]/60 space-y-3 text-center">
        <p className="text-xs text-[#4C5470]">
          Don&apos;t have a workspace yet?{' '}
          <Link href="/register" className="font-semibold text-[#2F4FB3] hover:underline">
            Register your company
          </Link>
        </p>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-[#E6DCC8]/60"></div>
          <span className="flex-shrink mx-3 text-[11px] text-[#4C5470]/70 uppercase tracking-widest font-mono">or</span>
          <div className="flex-grow border-t border-[#E6DCC8]/60"></div>
        </div>

        <Link
          href="/demo"
          className="w-full py-2 px-3 rounded-xl border border-[#E6DCC8] bg-[#F4EEE1]/60 hover:bg-[#E6DCC8]/50 text-xs font-medium text-[#1E2540] transition-colors flex items-center justify-center gap-2"
        >
          <ShieldCheck className="w-4 h-4 text-[#2F4FB3]" />
          <span>Explore with NexaTech Demo Workspace</span>
        </Link>
      </div>
    </div>
  );
}
