'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { AuthHeader } from '@/components/auth/auth-header';
import { AuthAmbientBg } from '@/components/auth/auth-ambient-bg';
import { ProofSheetLogin } from '@/components/auth/proof-sheet-login';
import { AuthHeroHeadline } from '@/components/auth/auth-hero-headline';
import { AuthStatsRow } from '@/components/auth/auth-stats-row';

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
      setTimeout(() => {
        window.location.href = nextParam;
      }, 500);
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
      {/* 1 continuous background: warm paper #F8F4EC with 2% film grain */}
      <AuthAmbientBg />

      {/* Fixed 72px Unified Header */}
      <AuthHeader currentPage="login" />

      {/* Main Two-Column Split inside 1280px Container */}
      <div className="auth-container">
        <div className="auth-split">
          {/* STORY SIDE (Left Column) */}
          <section className="auth-story" aria-label="Product introduction">
            <div className="flex flex-col gap-4">
              <AuthHeroHeadline />
              <ProofSheetLogin />
            </div>

            <AuthStatsRow />
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
                      <h2 className="form-title font-serif text-[28px] sm:text-[30px] font-bold text-[#16203A] tracking-tight leading-tight">
                        Welcome back
                      </h2>
                      <p className="form-subtitle text-[14px] text-[#5B6477] mt-1 mb-6">
                        Sign in to your brand compliance workspace.
                      </p>

                      <form onSubmit={handleSubmit} noValidate>
                        {/* Reserved Slot for Global Error Banner */}
                        <div className="min-h-[28px] mb-4">
                          <AnimatePresence>
                            {error && (
                              <motion.div
                                className="p-2.5 rounded-[10px] bg-[#FDF2F0] border border-[#C2402E]/30 flex items-center gap-2 text-[#C2402E] text-xs font-medium"
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

                        {/* Work Email Field: 48px, no leading icon, 10px radius */}
                        <div className="mb-4">
                          <label
                            htmlFor="email"
                            className="block text-[14px] font-medium text-[#16203A] mb-2"
                          >
                            Work email
                          </label>
                          <input
                            id="email"
                            type="email"
                            autoComplete="email"
                            className={`auth-input ${formErrors.email ? 'auth-input-error' : ''}`}
                            placeholder="you@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onBlur={(e) => handleBlur('email', e.target.value)}
                            aria-invalid={!!formErrors.email}
                            aria-describedby={formErrors.email ? 'email-error' : undefined}
                            disabled={loading}
                          />
                          {/* Reserved Error Slot */}
                          <div className="auth-error-slot">
                            {formErrors.email && (
                              <p id="email-error" className="flex items-center gap-1.5 text-xs text-[#C2402E]" role="alert">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                <span>{formErrors.email}</span>
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Password Field: 48px, eye toggle, 10px radius */}
                        <div className="mb-4">
                          <label
                            htmlFor="password"
                            className="block text-[14px] font-medium text-[#16203A] mb-2"
                          >
                            Password
                          </label>
                          <div className="relative">
                            <input
                              id="password"
                              type={showPassword ? 'text' : 'password'}
                              autoComplete="current-password"
                              className={`auth-input pr-10 ${formErrors.password ? 'auth-input-error' : ''}`}
                              placeholder="••••••••"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              onBlur={(e) => handleBlur('password', e.target.value)}
                              aria-invalid={!!formErrors.password}
                              aria-describedby={formErrors.password ? 'password-error' : undefined}
                              disabled={loading}
                            />
                            <button
                              type="button"
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5B6477] hover:text-[#16203A] transition-colors p-1 rounded-md"
                              onClick={() => setShowPassword(!showPassword)}
                              aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          {/* Reserved Error Slot */}
                          <div className="auth-error-slot">
                            {formErrors.password && (
                              <p id="password-error" className="flex items-center gap-1.5 text-xs text-[#C2402E]" role="alert">
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
                              className="auth-checkbox"
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

                        {/* Primary Sign In Button: solid ink #16203A, 10px radius, inner highlight */}
                        <button
                          ref={submitBtnRef}
                          type="submit"
                          disabled={loading}
                          className="auth-primary-btn"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin text-white" />
                              <span>Signing in…</span>
                            </>
                          ) : (
                            <>
                              <span>Sign in</span>
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </button>

                        {/* Judge Demo Access Box: single tinted row with green dot */}
                        <div className="auth-demo-box mt-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-[13px] font-semibold text-[#16203A]">
                              <span className="w-2 h-2 rounded-full bg-[#3F8F6B]" />
                              <span>Judging this project?</span>
                            </div>
                            <button
                              type="button"
                              onClick={handleDemoFill}
                              disabled={loading}
                              className="text-xs font-semibold text-[#3B4BC8] hover:underline transition-colors"
                            >
                              Use demo credentials
                            </button>
                          </div>
                          <p className="font-mono text-xs text-[#5B6477] mt-1.5">
                            demo@nexatech.example
                          </p>
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
                    <div className="w-12 h-12 rounded-full bg-[#E6F4EB] text-[#3F8F6B] flex items-center justify-center mx-auto mb-3 shadow-2xs">
                      <Check className="w-6 h-6 stroke-[2.5]" />
                    </div>
                    <h3 className="font-serif text-2xl font-bold text-[#16203A]">Welcome back</h3>
                    <p className="text-sm text-[#5B6477] mt-1">Redirecting you to your workspace…</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {forgotOpen.current && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-xs"
              onClick={() => {
                forgotOpen.current = false;
                setForgotSent(false);
              }}
            />
            <motion.div
              className="relative w-full max-w-sm rounded-[20px] bg-[#FFFDF8] border border-[#E4DCCB] p-6 shadow-xl z-10"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <h3 className="font-serif text-xl font-bold text-[#16203A]">Reset password</h3>
              <p className="text-xs text-[#5B6477] mt-1 mb-4">
                Enter your work email and we will send you a reset link.
              </p>
              {forgotSent ? (
                <div className="p-3 rounded-[10px] bg-[#E6F4EB] text-[#3F8F6B] text-xs font-medium text-center">
                  Password reset link sent to {forgotEmail}.
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (forgotEmail) setForgotSent(true);
                  }}
                >
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="auth-input mb-3"
                  />
                  <button type="submit" className="auth-primary-btn mb-2">
                    Send reset link
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      forgotOpen.current = false;
                      setForgotSent(false);
                    }}
                    className="w-full text-xs text-[#5B6477] hover:text-[#16203A] py-1 text-center"
                  >
                    Cancel
                  </button>
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
    <Suspense fallback={<div className="min-h-screen bg-[#F8F4EC]" />}>
      <LoginContent />
    </Suspense>
  );
}
