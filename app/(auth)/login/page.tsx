'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  ArrowRight,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Search,
  CheckCircle2,
  FileCheck2,
  Sparkles,
  Award,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SLIDES = [
  {
    number: '01',
    title: 'Submit Content',
    subtitle: 'Campaign copy, ad variations, or specifications enter the review queue.',
    bg: 'from-[#1A2333]/90 via-[#101726]/95 to-[#0B0F19]',
  },
  {
    number: '02',
    title: 'Verify Claims',
    subtitle: 'Every claim is checked against approved specifications and facts.',
    bg: 'from-[#1B2936]/90 via-[#0F1D2B]/95 to-[#09121B]',
  },
  {
    number: '03',
    title: 'Explain with Evidence',
    subtitle: 'Traceable citations, confidence ratings, and clear reasoning for every finding.',
    bg: 'from-[#231E33]/90 via-[#161224]/95 to-[#0D0A17]',
  },
  {
    number: '04',
    title: 'Human Review',
    subtitle: 'Human reviewers accept, edit, or override findings with recorded rationale.',
    bg: 'from-[#2D211A]/90 via-[#1C1410]/95 to-[#120D0A]',
  },
  {
    number: '05',
    title: 'Evidence Passport',
    subtitle: 'Cryptographic SHA-256 seal and complete immutable audit history.',
    bg: 'from-[#17252A]/90 via-[#0E1A1E]/95 to-[#081013]',
  },
];

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get('next') || '/overview';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Forgot password modal state
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  // Slider state
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHoveringSlider, setIsHoveringSlider] = useState(false);

  // Auto-fill judge credentials if ?judge=true
  useEffect(() => {
    if (searchParams.get('judge') === 'true') {
      setEmail('demo@nexatech.example');
      setPassword('demo12345');
    }
  }, [searchParams]);

  // Auto-advance slider every 6 seconds
  useEffect(() => {
    if (isHoveringSlider) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [isHoveringSlider]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Email or password is incorrect.');
      }

      // Play stamp animation before navigation
      setIsSuccess(true);
      setTimeout(() => {
        // Sanitize redirect target
        const target = nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/overview';
        window.location.href = target;
      }, 700);
    } catch (err: any) {
      setError(err.message || 'Email or password is incorrect.');
      setLoading(false);
    }
  }

  function fillJudgeCredentials() {
    setEmail('demo@nexatech.example');
    setPassword('demo12345');
    setError(null);
  }

  return (
    <div className="min-h-screen py-4 sm:py-8 px-3 sm:px-6 lg:px-8 flex items-center justify-center">
      {/* Outer Large Rounded Container */}
      <div className="w-full max-w-7xl rounded-[28px] border border-[#E8E2D5] bg-[#FFFDF9] shadow-sm p-4 sm:p-7 lg:p-9 flex flex-col gap-6 lg:gap-8">
        
        {/* Top Floating Pill Navigation */}
        <header className="w-full rounded-full bg-[#FAF8F5] border border-[#E8E2D5] px-4 sm:px-6 py-2.5 flex items-center justify-between shadow-xs">
          {/* Brand Wordmark */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-lg bg-[#2F4FB3] text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <span className="font-serif font-bold text-base tracking-tight text-[#1E2540]">
              BrandVault <span className="text-[#2F4FB3] font-sans font-medium text-xs">AI</span>
            </span>
          </Link>

          {/* Center Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-[#5A627A]">
            <Link href="/" className="hover:text-[#1E2540] transition-colors">Home</Link>
            <Link href="/#how-it-works" className="hover:text-[#1E2540] transition-colors">How it works</Link>
            <span className="text-[#9CA3AF] cursor-default">About</span>
            <span className="text-[#9CA3AF] cursor-default">Docs</span>
          </nav>

          {/* Decorative Search Pill & Auth Switcher */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#E8E2D5] text-xs text-[#9CA3AF]">
              <Search className="w-3.5 h-3.5 text-[#9CA3AF]" />
              <span className="italic">Try &ldquo;battery life claim&rdquo;</span>
            </div>

            <Link
              href={`/signup?next=${encodeURIComponent(nextParam)}`}
              className="px-3.5 py-1.5 rounded-full bg-[#EDE8DE] hover:bg-[#E2DDD0] text-[#1E2540] text-xs font-medium tracking-tight border border-[#DCD5C5] transition-all"
            >
              Create account
            </Link>
          </div>
        </header>

        {/* Main Two-Column Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
          
          {/* Left Column: Editorial Headline & Real About Card */}
          <div className="lg:col-span-5 flex flex-col justify-between py-2">
            <div>
              {/* Small Caps Label */}
              <div className="mb-3">
                <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#2F4FB3] font-semibold">
                  Evidence-First Brand Governance
                </span>
              </div>

              {/* Large Headline in Fraunces */}
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#1E2540] leading-[1.12]">
                EVERY CLAIM, <br />
                <span className="relative inline-block">
                  <span className="relative z-10">CHECKED BEFORE</span>
                  <span
                    className="absolute inset-x-0 bottom-1 h-3.5 -z-0 rounded-xs bg-[#2F4FB3]/15 transform -rotate-0.5"
                    aria-hidden="true"
                  />
                </span>{' '}
                <br />
                <span className="inline-flex items-center gap-2.5">
                  <span>IT GOES LIVE.</span>
                  {/* Three Status Circles */}
                  <span className="inline-flex items-center -space-x-1.5 ml-1">
                    <span className="w-3.5 h-3.5 rounded-full bg-[#22C55E] ring-2 ring-[#FFFDF9]" title="Supported" />
                    <span className="w-3.5 h-3.5 rounded-full bg-[#F59E0B] ring-2 ring-[#FFFDF9]" title="Unverified" />
                    <span className="w-3.5 h-3.5 rounded-full bg-[#EF4444] ring-2 ring-[#FFFDF9]" title="Contradicted" />
                  </span>
                </span>
              </h1>

              {/* Sublink to create account */}
              <div className="mt-5 text-sm text-[#5A627A]">
                Don&apos;t have an account?{' '}
                <Link
                  href={`/signup?next=${encodeURIComponent(nextParam)}`}
                  className="font-semibold text-[#2F4FB3] hover:underline inline-flex items-center gap-1 group"
                >
                  <span>Create account</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Bottom-Left About Card with Real Verified Facts */}
            <div className="mt-8 lg:mt-12 rounded-2xl bg-[#1E2540] text-white p-5 sm:p-6 shadow-md border border-[#2B3454]">
              <div className="flex items-center gap-2 mb-2 text-[#8EA8F5] text-xs font-mono uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Accountability Engine</span>
              </div>
              <p className="text-xs sm:text-sm text-[#EDEAE2]/85 leading-relaxed mb-4">
                Verify claims against approved sources, explain every finding with citations, and keep a person in charge.
              </p>
              
              {/* Row of 3 True Real Stats */}
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/10 text-center">
                <div>
                  <div className="font-serif text-lg sm:text-xl font-bold text-white">4</div>
                  <div className="text-[10px] text-[#A6AFC9] uppercase tracking-wider mt-0.5">Evidence States</div>
                </div>
                <div>
                  <div className="font-serif text-lg sm:text-xl font-bold text-white">5</div>
                  <div className="text-[10px] text-[#A6AFC9] uppercase tracking-wider mt-0.5">Resolution Actions</div>
                </div>
                <div>
                  <div className="font-serif text-lg sm:text-xl font-bold text-white">1</div>
                  <div className="text-[10px] text-[#A6AFC9] uppercase tracking-wider mt-0.5">Passport / Review</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Image Panel with Floating Glass Card */}
          <div
            className="lg:col-span-7 relative min-h-[560px] sm:min-h-[620px] rounded-[24px] overflow-hidden flex flex-col justify-between p-4 sm:p-7 transition-colors duration-700"
            onMouseEnter={() => setIsHoveringSlider(true)}
            onMouseLeave={() => setIsHoveringSlider(false)}
          >
            {/* Background gradient corresponding to active slide */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${SLIDES[currentSlide].bg} transition-colors duration-700`}
            />

            {/* Noise texture overlay */}
            <div
              className="pointer-events-none absolute inset-0 opacity-40 mix-blend-overlay"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.12'/%3E%3C/svg%3E")`,
              }}
            />

            {/* Top Slide Caption */}
            <div className="relative z-10 flex items-start justify-between text-white/90">
              <div className="max-w-md">
                <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#8EA8F5]">
                  Step {SLIDES[currentSlide].number} &middot; {SLIDES[currentSlide].title}
                </div>
                <div className="text-xs text-[#EDEAE2]/70 mt-0.5 line-clamp-1">
                  {SLIDES[currentSlide].subtitle}
                </div>
              </div>
            </div>

            {/* Floating Glass Login Card */}
            <div className="relative z-20 my-auto py-4 flex justify-center">
              <div className="w-full max-w-[430px] rounded-[20px] bg-white/95 backdrop-blur-md border border-white/60 shadow-2xl p-6 sm:p-7 text-[#1E2540]">
                
                {/* Card Title & Subtitle */}
                <div className="mb-5">
                  <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#1E2540] tracking-tight">
                    Log in to your account
                  </h2>
                  <p className="text-xs text-[#5A627A] mt-1">
                    Sign in to access your company vault and reviews.
                  </p>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="mb-4 p-3 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#B24A4A] text-xs flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Success Stamp Overlay if verified */}
                {isSuccess ? (
                  <div className="py-10 flex flex-col items-center justify-center text-center">
                    <div className="relative w-16 h-16 flex items-center justify-center mb-3">
                      <motion.circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="#22C55E"
                        strokeWidth="3"
                        strokeDasharray="176"
                        initial={{ strokeDashoffset: 176 }}
                        animate={{ strokeDashoffset: 0 }}
                        transition={{ duration: 0.5 }}
                        className="fill-none"
                      />
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring' }}
                      >
                        <CheckCircle2 className="w-8 h-8 text-[#22C55E]" />
                      </motion.div>
                    </div>
                    <span className="font-serif text-lg font-bold text-[#1E2540]">Verified & Signed In</span>
                    <span className="text-xs text-[#5A627A] mt-0.5">Redirecting to workspace...</span>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Email Field */}
                    <div>
                      <label className="block text-xs font-semibold text-[#1E2540] uppercase tracking-wider mb-1">
                        Work Email
                      </label>
                      <input
                        type="email"
                        required
                        autoComplete="username"
                        autoFocus
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@company.com"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCD5C5] bg-[#FAF8F5] text-sm text-[#1E2540] placeholder-[#8C93A8] focus:outline-none focus:ring-2 focus:ring-[#2F4FB3]/20 focus:border-[#2F4FB3] transition-all"
                      />
                    </div>

                    {/* Password Field with Show/Hide */}
                    <div>
                      <label className="block text-xs font-semibold text-[#1E2540] uppercase tracking-wider mb-1">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          autoComplete="current-password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                          className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-[#DCD5C5] bg-[#FAF8F5] text-sm text-[#1E2540] placeholder-[#8C93A8] focus:outline-none focus:ring-2 focus:ring-[#2F4FB3]/20 focus:border-[#2F4FB3] transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C93A8] hover:text-[#1E2540] focus:outline-none"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Remember me & Forgot Password */}
                    <div className="flex items-center justify-between text-xs">
                      <label className="flex items-center gap-2 cursor-pointer select-none text-[#5A627A]">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="w-4 h-4 rounded text-[#2F4FB3] border-[#DCD5C5] focus:ring-[#2F4FB3]"
                        />
                        <span>Remember me</span>
                      </label>

                      <button
                        type="button"
                        onClick={() => {
                          setForgotEmail(email);
                          setForgotOpen(true);
                        }}
                        className="text-[#2F4FB3] hover:underline"
                      >
                        Forgot your password?
                      </button>
                    </div>

                    {/* Login Submit Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 px-4 rounded-xl bg-[#1E2540] hover:bg-[#121728] text-white text-sm font-medium shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#2F4FB3] focus:ring-offset-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Signing in...</span>
                        </>
                      ) : (
                        <>
                          <span>Login</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>

                    {/* Mini Evidence-Passport Preview Strip */}
                    <div className="pt-2">
                      <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#E8E2D5] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileCheck2 className="w-4 h-4 text-[#2F4FB3]" />
                          <div>
                            <div className="text-[11px] font-mono font-medium text-[#1E2540] leading-none">
                              BVP-2026-0001
                            </div>
                            <div className="text-[9px] text-[#8C93A8] leading-tight mt-0.5">
                              Sample Evidence Passport
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[#22C55E]/10 text-[#16A34A] border border-[#22C55E]/20">
                          APPROVED
                        </span>
                      </div>
                    </div>

                    {/* Judge & Evaluator Access Helper Card */}
                    <div className="mt-3 p-3 rounded-xl bg-[#2F4FB3]/5 border border-[#2F4FB3]/15">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-semibold text-[#2F4FB3] flex items-center gap-1">
                          <Award className="w-3.5 h-3.5" />
                          <span>Judges & Evaluators</span>
                        </span>
                        <span className="text-[10px] font-mono text-[#5A627A]">NexaTech Sandbox</span>
                      </div>
                      <p className="text-[11px] text-[#5A627A] leading-tight mb-2">
                        Pre-loaded with sample specs, approved facts, and active review submissions.
                      </p>
                      <button
                        type="button"
                        onClick={fillJudgeCredentials}
                        className="w-full py-1.5 px-3 rounded-lg bg-[#2F4FB3]/10 hover:bg-[#2F4FB3]/20 text-[#2F4FB3] text-xs font-medium transition-colors text-center"
                      >
                        Fill demo credentials (demo@nexatech.example)
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>

            {/* Slider Bottom Controls: 01/05 and Arrows */}
            <div className="relative z-10 flex items-center justify-between text-white/90 pt-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm tracking-wider font-semibold">
                  {SLIDES[currentSlide].number}
                </span>
                <span className="text-xs text-white/40">/ 05</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white transition-colors"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentSlide((prev) => (prev + 1) % SLIDES.length)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white transition-colors"
                  aria-label="Next slide"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {forgotOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setForgotOpen(false)}
            />
            <div className="relative w-full max-w-sm rounded-2xl bg-[#FFFDF9] border border-[#E8E2D5] shadow-2xl p-6 text-[#1E2540] z-10">
              <h3 className="font-serif text-lg font-bold text-[#1E2540] mb-2">Reset Password</h3>
              {forgotSent ? (
                <div>
                  <p className="text-xs text-[#5A627A] mb-4">
                    If an account exists for {forgotEmail}, we have sent instructions to reset your password.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotOpen(false);
                      setForgotSent(false);
                    }}
                    className="w-full py-2 rounded-xl bg-[#1E2540] text-white text-xs font-medium"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setForgotSent(true);
                  }}
                  className="space-y-3"
                >
                  <p className="text-xs text-[#5A627A]">
                    Enter your work email address and we&apos;ll send you a recovery link.
                  </p>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full px-3 py-2 rounded-xl border border-[#DCD5C5] text-xs"
                  />
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setForgotOpen(false)}
                      className="flex-1 py-2 rounded-xl border border-[#DCD5C5] text-xs text-[#5A627A]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2 rounded-xl bg-[#2F4FB3] text-white text-xs font-medium"
                    >
                      Send link
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAF8F5]" />}>
      <LoginContent />
    </Suspense>
  );
}
