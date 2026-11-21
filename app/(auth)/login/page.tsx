'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  Check,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { AuthHeader } from '@/components/auth/auth-header';
import { AuthAmbientBg } from '@/components/auth/auth-ambient-bg';
import { ClaimDemoShowpiece } from '@/components/auth/claim-demo-showpiece';
import { AuthHeroHeadline } from '@/components/auth/auth-hero-headline';
import { AuthStatsRow } from '@/components/auth/auth-stats-row';
import { AuthTrustMarquee } from '@/components/auth/auth-trust-marquee';

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
  const [shakeCard, setShakeCard] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const isEmailValid = email.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isPasswordValid = password.length >= 8;

  const forgotOpen = useRef(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const typingRef = useRef(false);
  const submitBtnRef = useRef<HTMLButtonElement>(null);

  const prefersReducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Auto-fill judge credentials if ?judge=true
  useEffect(() => {
    if (searchParams.get('judge') === 'true') {
      setEmail('demo@nexatech.example');
      setPassword('demo12345');
    }
  }, [searchParams]);

  const validateField = (name: string, value: string) => {
    if (name === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'Enter a valid work email address';
    }
    if (name === 'password' && value && value.length < 8) {
      return 'Password must be at least 8 characters';
    }
    return '';
  };

  const handleBlur = (name: string, value: string) => {
    const err = validateField(name, value);
    setFormErrors((prev) => ({ ...prev, [name]: err }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    const emailErr = validateField('email', email);
    const passwordErr = validateField('password', password);
    if (emailErr || passwordErr) {
      setFormErrors({ email: emailErr, password: passwordErr });
      setShakeCard(true);
      setTimeout(() => setShakeCard(false), 400);
      return;
    }

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
        throw new Error(data.error || 'Email or password is incorrect');
      }

      setIsSuccess(true);
      setTimeout(() => router.push(nextParam), 800);
    } catch (err: any) {
      setError(err.message);
      setShakeCard(true);
      setTimeout(() => setShakeCard(false), 400);
    } finally {
      setLoading(false);
    }
  }

  // Smooth character-by-character typing of demo credentials
  const handleDemoFill = () => {
    if (typingRef.current) return;
    const targetEmail = 'demo@nexatech.example';
    const targetPass = 'demo12345';
    setEmail('');
    setPassword('');
    typingRef.current = true;
    setError(null);
    setFormErrors({});

    let i = 0;
    const emailInterval = setInterval(() => {
      i++;
      setEmail(targetEmail.slice(0, i));
      if (i >= targetEmail.length) {
        clearInterval(emailInterval);
        let j = 0;
        const passInterval = setInterval(() => {
          j++;
          setPassword(targetPass.slice(0, j));
          if (j >= targetPass.length) {
            clearInterval(passInterval);
            typingRef.current = false;
            submitBtnRef.current?.focus({ preventScroll: true });
          }
        }, 28);
      }
    }, 22);
  };

  return (
    <div className="auth-page min-h-screen relative font-sans">
      {/* Ambient background with color orbs & spotlight */}
      <AuthAmbientBg />

      {/* Unified Full-Width Header */}
      <AuthHeader currentPage="login" />

      {/* Main Two-Column Viewport-Locked Split */}
      <div className="auth-split">
        {/* STORY SIDE (Left Column) */}
        <section className="auth-story" aria-label="Product introduction">
          <div className="flex flex-col gap-4">
            <AuthHeroHeadline />
            <ClaimDemoShowpiece />
          </div>

          <div className="flex flex-col gap-2 mt-auto">
            <AuthStatsRow />
            <AuthTrustMarquee />
          </div>
        </section>

        {/* FORM SIDE (Right Column - Independent Scroll) */}
        <section className="auth-form-side" aria-label="Sign in form">
          <div className="auth-form-wrapper">
            <AnimatePresence mode="wait">
              {!isSuccess ? (
                <motion.div
                  key="form"
                  className={`auth-form-card ${shakeCard ? 'shake-error' : ''}`}
                  initial={prefersReducedMotion ? {} : { opacity: 0, y: 16 }}
                  animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                  exit={prefersReducedMotion ? {} : { opacity: 0, y: -16 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div>
                    <h2 className="font-serif text-[28px] sm:text-[32px] font-bold text-[#16203A] tracking-tight leading-tight">
                      Welcome back
                    </h2>
                    <p className="text-[14px] text-[#5B6477] mt-1 mb-6">
                      Sign in to your brand compliance workspace.
                    </p>

                    <form onSubmit={handleSubmit} noValidate>
                      {/* Reserved Slot for Global Error Banner */}
                      <div className="min-h-[28px] mb-4">
                        <AnimatePresence>
                          {error && (
                            <motion.div
                              className="p-2.5 rounded-xl bg-[#FCEBE8] border border-[#D4553F]/30 flex items-center gap-2 text-[#D4553F] text-xs font-medium"
                              initial={{ opacity: 0, y: -6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -6 }}
                            >
                              <AlertCircle className="w-4 h-4 shrink-0" />
                              <span>{error}</span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Work Email Field */}
                      <div className="mb-4">
                        <label
                          htmlFor="email"
                          className="block text-xs font-semibold uppercase tracking-wider text-[#16203A] mb-1.5"
                        >
                          Work Email
                        </label>
                        <div className="relative">
                          <div
                            className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200 pointer-events-none ${
                              emailFocused ? 'text-[#3B4BC8]' : 'text-[#5B6477]'
                            }`}
                          >
                            <Mail className="w-4 h-4" />
                          </div>
                          <input
                            id="email"
                            type="email"
                            autoComplete="email"
                            className={`w-full h-12 pl-10 pr-10 rounded-xl text-sm font-medium text-[#16203A] bg-white border transition-all duration-200 focus:outline-none ${
                              formErrors.email
                                ? 'border-[#D4553F] focus:ring-4 focus:ring-[#D4553F]/15'
                                : emailFocused
                                ? 'border-[#3B4BC8] ring-4 ring-[#3B4BC8]/15 shadow-sm shadow-[#3B4BC8]/10'
                                : 'border-[#E6DFD2] hover:border-[#16203A]/30'
                            }`}
                            placeholder="you@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onFocus={() => setEmailFocused(true)}
                            onBlur={(e) => {
                              setEmailFocused(false);
                              handleBlur('email', e.target.value);
                            }}
                            aria-invalid={!!formErrors.email}
                            aria-describedby={formErrors.email ? 'email-error' : undefined}
                            disabled={loading}
                          />
                          {/* Valid check indicator */}
                          {isEmailValid && !formErrors.email && (
                            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#3F8F6B] animate-in zoom-in-75 duration-150">
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        {/* Reserved Error Slot */}
                        <div className="auth-error-slot">
                          {formErrors.email && (
                            <p id="email-error" className="flex items-center gap-1.5 text-xs text-[#D4553F]" role="alert">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              <span>{formErrors.email}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Password Field */}
                      <div className="mb-4">
                        <label
                          htmlFor="password"
                          className="block text-xs font-semibold uppercase tracking-wider text-[#16203A] mb-1.5"
                        >
                          Password
                        </label>
                        <div className="relative">
                          <div
                            className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200 pointer-events-none ${
                              passwordFocused ? 'text-[#3B4BC8]' : 'text-[#5B6477]'
                            }`}
                          >
                            <Lock className="w-4 h-4" />
                          </div>
                          <input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="current-password"
                            className={`w-full h-12 pl-10 pr-12 rounded-xl text-sm font-medium text-[#16203A] bg-white border transition-all duration-200 focus:outline-none ${
                              formErrors.password
                                ? 'border-[#D4553F] focus:ring-4 focus:ring-[#D4553F]/15'
                                : passwordFocused
                                ? 'border-[#3B4BC8] ring-4 ring-[#3B4BC8]/15 shadow-sm shadow-[#3B4BC8]/10'
                                : 'border-[#E6DFD2] hover:border-[#16203A]/30'
                            }`}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onFocus={() => setPasswordFocused(true)}
                            onBlur={(e) => {
                              setPasswordFocused(false);
                              handleBlur('password', e.target.value);
                            }}
                            aria-invalid={!!formErrors.password}
                            aria-describedby={formErrors.password ? 'password-error' : undefined}
                            disabled={loading}
                          />
                          <button
                            type="button"
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5B6477] hover:text-[#16203A] transition-colors p-1 rounded-md"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {/* Reserved Error Slot */}
                        <div className="auth-error-slot">
                          {formErrors.password && (
                            <p id="password-error" className="flex items-center gap-1.5 text-xs text-[#D4553F]" role="alert">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              <span>{formErrors.password}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Remember me & Forgot Password */}
                      <div className="flex items-center justify-between text-xs mb-6">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="w-4 h-4 rounded border-[#E6DFD2] text-[#3B4BC8] focus:ring-[#3B4BC8]"
                          />
                          <span className="text-[#5B6477] font-medium">Remember me</span>
                        </label>
                        <button
                          type="button"
                          className="font-medium text-[#3B4BC8] hover:underline focus:outline-none"
                          onClick={() => {
                            forgotOpen.current = true;
                            setForgotSent(false);
                          }}
                        >
                          Forgot password?
                        </button>
                      </div>

                      {/* Primary Sign In Button with 6s Shine Sweep & Scale Haptic */}
                      <button
                        ref={submitBtnRef}
                        type="submit"
                        disabled={loading}
                        className="relative w-full h-12 rounded-xl bg-gradient-to-r from-[#16203A] to-[#1E2540] hover:from-[#111A30] hover:to-[#171D33] active:scale-[0.98] text-white text-sm font-semibold tracking-tight shadow-md shadow-[#16203A]/20 flex items-center justify-center gap-2 overflow-hidden transition-all duration-200 group disabled:opacity-60"
                      >
                        {/* 6s Shine Sweep */}
                        <div className="btn-shine-overlay" aria-hidden="true" />

                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-white" />
                            <span>Signing in…</span>
                          </>
                        ) : (
                          <>
                            <span>Sign in</span>
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                          </>
                        )}
                      </button>

                      {/* Judge Demo Access Box */}
                      <div className="mt-6 p-3.5 rounded-xl bg-[#FAF6EF] border border-dashed border-[#E6DFD2] relative">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#16203A]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#3F8F6B]" />
                            <span>Judging this hackathon?</span>
                          </div>
                          <span className="text-[10px] font-mono text-[#5B6477] uppercase bg-white px-1.5 py-0.5 rounded border border-[#E6DFD2]">
                            Demo Sandbox
                          </span>
                        </div>
                        <p className="font-mono text-xs text-[#5B6477] mb-2.5">
                          demo@nexatech.example
                        </p>
                        <button
                          type="button"
                          onClick={handleDemoFill}
                          disabled={loading}
                          className="w-full h-9 rounded-lg border border-[#3B4BC8] bg-white hover:bg-[#E8E9FC]/60 text-[#3B4BC8] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-150 active:scale-[0.98]"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Use demo credentials (auto-type)</span>
                        </button>
                      </div>

                      {/* Bottom link */}
                      <p className="text-center text-xs text-[#5B6477] mt-5">
                        New to BrandVault?{' '}
                        <Link
                          href="/signup"
                          className="font-semibold text-[#3B4BC8] hover:underline ml-0.5"
                        >
                          Create an account &rarr;
                        </Link>
                      </p>
                    </form>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="success"
                  className="auth-form-card text-center py-10"
                  initial={prefersReducedMotion ? {} : { opacity: 0, scale: 0.95 }}
                  animate={prefersReducedMotion ? {} : { opacity: 1, scale: 1 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="w-14 h-14 rounded-full bg-[#E6F4EB] text-[#3F8F6B] flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <Check className="w-7 h-7 stroke-[2.5]" />
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-[#16203A]">Welcome back</h3>
                  <p className="text-sm text-[#5B6477] mt-1">Redirecting you to your workspace…</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Live sandbox status pill in bottom right corner */}
          <div className="w-full max-w-[440px] flex justify-end mt-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/70 backdrop-blur-xs border border-[#16203A]/8 text-[11px] font-mono text-[#5B6477] shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-[#3F8F6B] animate-pulse" />
              <span>Live demo environment · NexTech sandbox</span>
            </div>
          </div>
        </section>
      </div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {forgotOpen.current && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-xs"
              onClick={() => {
                forgotOpen.current = false;
                setForgotSent(false);
              }}
            />
            <motion.div
              className="relative w-full max-w-sm rounded-2xl bg-white border border-[#E6DFD2] shadow-2xl p-6 text-[#16203A] z-10"
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
            >
              <h3 className="text-lg font-bold text-[#16203A] mb-1 font-serif">Reset Password</h3>
              {forgotSent ? (
                <div>
                  <p className="text-sm text-[#5B6477] mb-4">
                    If an account exists for {forgotEmail}, we have sent instructions to reset your password.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      forgotOpen.current = false;
                      setForgotSent(false);
                    }}
                    className="w-full py-2.5 rounded-xl bg-[#16203A] text-white text-xs font-semibold"
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
                  <p className="text-xs text-[#5B6477]">
                    Enter your work email address and we’ll send you a recovery link.
                  </p>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full px-3 py-2 rounded-xl border border-[#E6DFD2] text-xs bg-[#FAF6EF] focus:outline-none focus:border-[#3B4BC8]"
                  />
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        forgotOpen.current = false;
                        setForgotSent(false);
                      }}
                      className="flex-1 py-2 rounded-xl border border-[#E6DFD2] text-xs font-medium text-[#5B6477]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2 rounded-xl bg-[#3B4BC8] text-white text-xs font-semibold"
                    >
                      Send link
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAF6EF]" />}>
      <LoginContent />
    </Suspense>
  );
}
