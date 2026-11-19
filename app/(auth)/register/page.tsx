'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

const INDUSTRIES = [
  'Consumer Tech & Hardware',
  'B2B SaaS & Enterprise Software',
  'Health & Wellness',
  'E-commerce & Retail',
  'Fintech & Financial Services',
  'Media & Creative Agency',
  'Other',
];

export default function RegisterPage() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [industry, setIndustry] = useState(INDUSTRIES[0]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Compute workspace slug preview
  const slugPreview = companyName
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[-\s]+/g, '-')
    .slice(0, 30);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: companyName,
          workspace_slug: slugPreview || undefined,
          full_name: fullName,
          email,
          password,
          industry,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create workspace');
      }

      window.location.href = '/overview';
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-[#FFFDF9] border border-[#E6DCC8] rounded-2xl shadow-sm p-6 sm:p-8">
      <div className="text-center mb-6">
        <h1 className="font-serif text-2xl font-bold text-[#1E2540]">Create your BrandVault</h1>
        <p className="text-xs text-[#4C5470] mt-1.5">
          Establish an evidence-first review gate for your brand.
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
            Company Name
          </label>
          <input
            type="text"
            required
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Acme Corporation"
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6DCC8] bg-[#FBF7EF]/50 text-sm text-[#1E2540] placeholder-[#4C5470]/50 focus:outline-none focus:ring-2 focus:ring-[#2F4FB3]/20 focus:border-[#2F4FB3] transition-all"
          />
          {slugPreview && (
            <p className="text-[11px] text-[#4C5470] mt-1 font-mono">
              Workspace URL: <span className="text-[#2F4FB3]">brandvault.ai/{slugPreview}</span>
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#1E2540] uppercase tracking-wider mb-1.5">
            Industry / Domain
          </label>
          <select
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6DCC8] bg-[#FBF7EF]/50 text-sm text-[#1E2540] focus:outline-none focus:ring-2 focus:ring-[#2F4FB3]/20 focus:border-[#2F4FB3] transition-all"
          >
            {INDUSTRIES.map((ind) => (
              <option key={ind} value={ind}>
                {ind}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#1E2540] uppercase tracking-wider mb-1.5">
            Your Full Name
          </label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Sarah Chen"
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6DCC8] bg-[#FBF7EF]/50 text-sm text-[#1E2540] placeholder-[#4C5470]/50 focus:outline-none focus:ring-2 focus:ring-[#2F4FB3]/20 focus:border-[#2F4FB3] transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#1E2540] uppercase tracking-wider mb-1.5">
            Work Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="sarah@acme.com"
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6DCC8] bg-[#FBF7EF]/50 text-sm text-[#1E2540] placeholder-[#4C5470]/50 focus:outline-none focus:ring-2 focus:ring-[#2F4FB3]/20 focus:border-[#2F4FB3] transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#1E2540] uppercase tracking-wider mb-1.5">
            Password (min 8 characters)
          </label>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6DCC8] bg-[#FBF7EF]/50 text-sm text-[#1E2540] placeholder-[#4C5470]/50 focus:outline-none focus:ring-2 focus:ring-[#2F4FB3]/20 focus:border-[#2F4FB3] transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 rounded-xl bg-[#2F4FB3] hover:bg-[#253f93] text-white text-sm font-medium shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60 mt-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Creating your vault...</span>
            </>
          ) : (
            <>
              <span>Create workspace</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-[#E6DCC8]/60 space-y-3 text-center">
        <p className="text-xs text-[#4C5470]">
          Already registered?{' '}
          <Link href="/login" className="font-semibold text-[#2F4FB3] hover:underline">
            Sign in to existing vault
          </Link>
        </p>

        <Link
          href="/demo"
          className="inline-flex items-center gap-1.5 text-xs text-[#4C5470] hover:text-[#1E2540] transition-colors"
        >
          <span>Just browsing?</span>
          <span className="font-medium text-[#2F4FB3] underline">Try the NexaTech demo</span>
        </Link>
      </div>
    </div>
  );
}
