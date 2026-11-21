'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  User,
  Mail,
  Lock,
  Building,
  ArrowRight,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  Check,
  CheckCircle2,
  FileCheck2,
  Sparkles,
  Award,
  ExternalLink,
  HelpCircle,
  Upload,
  X,
  ChevronRight,
  ShoppingBag,
  Landmark,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { AuthHeader } from '@/components/auth/auth-header';
import { AuthAmbientBg } from '@/components/auth/auth-ambient-bg';
import { VaultTimelineShowpiece } from '@/components/auth/vault-timeline-showpiece';
import { AuthHeroHeadline } from '@/components/auth/auth-hero-headline';
import { AuthStatsRow } from '@/components/auth/auth-stats-row';
import { AuthTrustMarquee } from '@/components/auth/auth-trust-marquee';

const INDUSTRIES = [
  { value: 'Consumer Tech & Hardware', label: 'Consumer Tech & Hardware', icon: Sparkles },
  { value: 'B2B SaaS & Enterprise Software', label: 'B2B SaaS & Enterprise Software', icon: FileCheck2 },
  { value: 'Health & Wellness', label: 'Health & Wellness', icon: Award },
  { value: 'E-commerce & Retail', label: 'E-commerce & Retail', icon: ShoppingBag },
  { value: 'Fintech & Financial Services', label: 'Fintech & Financial Services', icon: Landmark },
  { value: 'Media & Creative Agency', label: 'Media & Creative Agency', icon: ExternalLink },
  { value: 'Other', label: 'Other', icon: HelpCircle },
];

const INDUSTRY_ICON_MAP: Record<string, React.ReactNode> = {
  'Consumer Tech & Hardware': <Sparkles className="w-4 h-4" />,
  'B2B SaaS & Enterprise Software': <FileCheck2 className="w-4 h-4" />,
  'Health & Wellness': <Award className="w-4 h-4" />,
  'E-commerce & Retail': <ShoppingBag className="w-4 h-4" />,
  'Fintech & Financial Services': <Landmark className="w-4 h-4" />,
  'Media & Creative Agency': <ExternalLink className="w-4 h-4" />,
  Other: <HelpCircle className="w-4 h-4" />,
};

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get('next') || '/overview';

  const [step, setStep] = useState(1);
  const [companyName, setCompanyName] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [industry, setIndustry] = useState(INDUSTRIES[0].value);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [shakeCard, setShakeCard] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [sourceDocuments, setSourceDocuments] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const step2FirstInputRef = useRef<HTMLInputElement>(null);

  const [fullNameFocused, setFullNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [companyFocused, setCompanyFocused] = useState(false);

  const isFullNameValid = fullName.trim().length >= 2;
  const isEmailValid = email.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isPasswordValid = password.length >= 8;
  const isCompanyValid = companyName.trim().length >= 2;

  const prefersReducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const slugPreview = companyName
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[-\s]+/g, '-')
    .slice(0, 30);

  const passwordStrength = () => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return Math.min(strength, 4);
  };

  const validateField = (name: string, value: string) => {
    switch (name) {
      case 'fullName':
        if (value && value.trim().length < 2) return 'Name must be at least 2 characters';
        break;
      case 'email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
          return 'Enter a valid work email address';
        break;
      case 'password':
        if (value && value.length < 8) return 'Password must be at least 8 characters';
        break;
      case 'companyName':
        if (value && value.trim().length < 2) return 'Company name must be at least 2 characters';
        break;
      case 'agreeTerms':
        if (!value || value === 'false') return 'You must agree to the terms';
        break;
    }
    return '';
  };

  const handleBlur = (name: string, value: string) => {
    const err = validateField(name, value);
    setFormErrors((prev) => ({ ...prev, [name]: err }));
  };

  const handleFileSelect = (files: File[]) => {
    const validFiles = Array.from(files).filter((f) => {
      if (f.size > 10 * 1024 * 1024) {
        alert(`File ${f.name} exceeds 10MB limit`);
        return false;
      }
      return true;
    });
    if (sourceDocuments.length + validFiles.length > 10) {
      alert('Maximum 10 files allowed');
      return;
    }
    validFiles.forEach((f) => setUploadProgress((p) => ({ ...p, [f.name]: 0 })));
    setSourceDocuments((prev) => [...prev, ...validFiles]);
    setUploadingFiles(true);
    validFiles.forEach((file) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 20;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          setUploadingFiles(false);
        }
        setUploadProgress((p) => ({ ...p, [file.name]: progress }));
      }, 180);
    });
  };

  const removeFile = (fileName: string) => {
    setSourceDocuments((prev) => prev.filter((f) => f.name !== fileName));
    setUploadProgress((p) => {
      const np = { ...p };
      delete np[fileName];
      return np;
    });
  };

  const filteredIndustries = INDUSTRIES.filter((i) =>
    i.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDropdownSelect = (value: string) => {
    setIndustry(value);
    setSearchQuery('');
    setDropdownOpen(false);
    setHighlightedIndex(-1);
    handleBlur('industry', value);
  };

  const handleDropdownKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.min(prev + 1, filteredIndustries.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      handleDropdownSelect(filteredIndustries[highlightedIndex].value);
    } else if (e.key === 'Escape') {
      setDropdownOpen(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    const fieldsToValidate =
      step === 1 ? ['fullName', 'email', 'password'] : ['companyName', 'agreeTerms'];

    const newErrors: Record<string, string> = {};
    fieldsToValidate.forEach((name) => {
      const value =
        name === 'fullName'
          ? fullName
          : name === 'email'
          ? email
          : name === 'password'
          ? password
          : name === 'companyName'
          ? companyName
          : agreeTerms.toString();
      const err = validateField(name, value);
      if (err) newErrors[name] = err;
    });

    if (Object.keys(newErrors).length > 0) {
      setFormErrors((prev) => ({ ...prev, ...newErrors }));
      setShakeCard(true);
      setTimeout(() => setShakeCard(false), 400);
      return;
    }

    if (step === 1) {
      setStep(2);
      setTimeout(() => {
        setFormErrors({});
        step2FirstInputRef.current?.focus({ preventScroll: true });
      }, 150);
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('companyName', companyName.trim());
      formData.append('fullName', fullName.trim());
      formData.append('email', email.trim());
      formData.append('password', password);
      formData.append('industry', industry);
      formData.append('agreeTerms', 'true');
      sourceDocuments.forEach((file) => formData.append('sourceDocuments', file));

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setIsSuccess(true);
      setTimeout(() => router.push(nextParam), 1200);
    } catch (err: any) {
      setError(err.message);
      setShakeCard(true);
      setTimeout(() => setShakeCard(false), 400);
    } finally {
      setLoading(false);
    }
  }

  const handleBack = () => {
    setStep(1);
    setFormErrors({});
  };

  return (
    <div className="auth-page min-h-screen relative font-sans">
      {/* Ambient background with drifting colour orbs */}
      <AuthAmbientBg />

      {/* Unified Full-Width Header */}
      <AuthHeader currentPage="register" />

      {/* Main Two-Column Viewport-Locked Split */}
      <div className="auth-split">
        {/* STORY SIDE (Left Column) */}
        <section className="auth-story" aria-label="Product introduction">
          <div className="flex flex-col gap-4">
            <AuthHeroHeadline />
            <VaultTimelineShowpiece
              currentFormStep={step}
              hasUploadedFiles={sourceDocuments.length > 0}
            />
          </div>

          <div className="flex flex-col gap-2 mt-auto">
            <AuthStatsRow />
            <AuthTrustMarquee />
          </div>
        </section>

        {/* FORM SIDE (Right Column - Independent Scroll) */}
        <section className="auth-form-side" aria-label="Registration form">
          <div className="auth-form-wrapper">
            <AnimatePresence mode="wait">
              {!isSuccess ? (
                <motion.div
                  key={`step-${step}`}
                  className={`auth-form-card ${shakeCard ? 'shake-error' : ''}`}
                  initial={prefersReducedMotion ? {} : { opacity: 0, x: step === 1 ? -16 : 16 }}
                  animate={prefersReducedMotion ? {} : { opacity: 1, x: 0 }}
                  exit={prefersReducedMotion ? {} : { opacity: 0, x: step === 1 ? 16 : -16 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                >
                  {/* Step Progress Bar */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#5B6477] mb-2">
                      <span className="text-[#3B4BC8] font-mono">Step {step} of 2</span>
                      <span>{step === 1 ? 'About You' : 'Your Company'}</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#E6DFD2] rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-[#3B4BC8] to-[#3F8F6B] rounded-full"
                        animate={{ width: step === 1 ? '50%' : '100%' }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </div>
                  </div>

                  <div>
                    <h2 className="font-serif text-[28px] sm:text-[32px] font-bold text-[#16203A] tracking-tight leading-tight">
                      {step === 1 ? 'Create account' : 'Set up your vault'}
                    </h2>
                    <p className="text-[14px] text-[#5B6477] mt-1 mb-6">
                      {step === 1
                        ? 'Get started with evidence-backed brand compliance.'
                        : 'Configure your isolated company workspace.'}
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

                      {step === 1 ? (
                        <>
                          {/* Full Name */}
                          <div className="mb-4">
                            <label
                              htmlFor="fullName"
                              className="block text-xs font-semibold uppercase tracking-wider text-[#16203A] mb-1.5"
                            >
                              Full Name
                            </label>
                            <div className="relative">
                              <div
                                className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200 pointer-events-none ${
                                  fullNameFocused ? 'text-[#3B4BC8]' : 'text-[#5B6477]'
                                }`}
                              >
                                <User className="w-4 h-4" />
                              </div>
                              <input
                                id="fullName"
                                type="text"
                                autoComplete="name"
                                className={`w-full h-12 pl-10 pr-10 rounded-xl text-sm font-medium text-[#16203A] bg-white border transition-all duration-200 focus:outline-none ${
                                  formErrors.fullName
                                    ? 'border-[#D4553F] focus:ring-4 focus:ring-[#D4553F]/15'
                                    : fullNameFocused
                                    ? 'border-[#3B4BC8] ring-4 ring-[#3B4BC8]/15 shadow-sm shadow-[#3B4BC8]/10'
                                    : 'border-[#E6DFD2] hover:border-[#16203A]/30'
                                }`}
                                placeholder="Jane Doe"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                onFocus={() => setFullNameFocused(true)}
                                onBlur={(e) => {
                                  setFullNameFocused(false);
                                  handleBlur('fullName', e.target.value);
                                }}
                                aria-invalid={!!formErrors.fullName}
                                aria-describedby={formErrors.fullName ? 'fullName-error' : undefined}
                                disabled={loading}
                              />
                              {isFullNameValid && !formErrors.fullName && (
                                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#3F8F6B]">
                                  <CheckCircle2 className="w-4 h-4" />
                                </div>
                              )}
                            </div>
                            <div className="auth-error-slot">
                              {formErrors.fullName && (
                                <p id="fullName-error" className="flex items-center gap-1.5 text-xs text-[#D4553F]" role="alert">
                                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                  <span>{formErrors.fullName}</span>
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Work Email */}
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
                              {isEmailValid && !formErrors.email && (
                                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#3F8F6B]">
                                  <CheckCircle2 className="w-4 h-4" />
                                </div>
                              )}
                            </div>
                            <div className="auth-error-slot">
                              {formErrors.email && (
                                <p id="email-error" className="flex items-center gap-1.5 text-xs text-[#D4553F]" role="alert">
                                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                  <span>{formErrors.email}</span>
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Password */}
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
                                autoComplete="new-password"
                                className={`w-full h-12 pl-10 pr-12 rounded-xl text-sm font-medium text-[#16203A] bg-white border transition-all duration-200 focus:outline-none ${
                                  formErrors.password
                                    ? 'border-[#D4553F] focus:ring-4 focus:ring-[#D4553F]/15'
                                    : passwordFocused
                                    ? 'border-[#3B4BC8] ring-4 ring-[#3B4BC8]/15 shadow-sm shadow-[#3B4BC8]/10'
                                    : 'border-[#E6DFD2] hover:border-[#16203A]/30'
                                }`}
                                placeholder="Create a strong password"
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
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5B6477] hover:text-[#16203A] transition-colors p-1"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                              >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>

                            {/* 4-Segment Spring Password Strength Meter */}
                            <div
                              className="flex gap-1.5 mt-2.5"
                              role="progressbar"
                              aria-valuenow={passwordStrength()}
                              aria-valuemin={0}
                              aria-valuemax={4}
                            >
                              {[1, 2, 3, 4].map((s) => {
                                const active = passwordStrength() >= s;
                                const barColor =
                                  passwordStrength() === 1
                                    ? 'bg-[#D4553F]'
                                    : passwordStrength() === 2
                                    ? 'bg-[#D9922B]'
                                    : 'bg-[#3F8F6B]';

                                return (
                                  <div
                                    key={s}
                                    className="flex-1 h-1.5 rounded-full bg-[#E6DFD2] overflow-hidden"
                                  >
                                    <motion.div
                                      className={`h-full rounded-full ${barColor}`}
                                      initial={{ width: 0 }}
                                      animate={{ width: active ? '100%' : '0%' }}
                                      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                                    />
                                  </div>
                                );
                              })}
                            </div>
                            <div className="auth-hint-slot">
                              <p className="text-[11px] text-[#5B6477]">
                                {password.length === 0
                                  ? 'Minimum 8 characters'
                                  : passwordStrength() === 1
                                  ? 'Weak — add numbers or symbols'
                                  : passwordStrength() === 2
                                  ? 'Moderate — add uppercase letters'
                                  : passwordStrength() === 3
                                  ? 'Strong password'
                                  : 'Excellent security'}
                              </p>
                            </div>
                            <div className="auth-error-slot">
                              {formErrors.password && (
                                <p id="password-error" className="flex items-center gap-1.5 text-xs text-[#D4553F]" role="alert">
                                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                  <span>{formErrors.password}</span>
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Continue Button */}
                          <button
                            type="submit"
                            disabled={loading}
                            className="relative w-full h-12 rounded-xl bg-gradient-to-r from-[#16203A] to-[#1E2540] hover:from-[#111A30] hover:to-[#171D33] active:scale-[0.98] text-white text-sm font-semibold tracking-tight shadow-md shadow-[#16203A]/20 flex items-center justify-center gap-2 overflow-hidden transition-all duration-200 group mt-2"
                          >
                            <div className="btn-shine-overlay" aria-hidden="true" />
                            <span>Continue to Company Setup</span>
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                          </button>
                        </>
                      ) : (
                        <>
                          {/* Company Name */}
                          <div className="mb-4">
                            <label
                              htmlFor="companyName"
                              className="block text-xs font-semibold uppercase tracking-wider text-[#16203A] mb-1.5"
                            >
                              Company Name
                            </label>
                            <div className="relative">
                              <div
                                className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200 pointer-events-none ${
                                  companyFocused ? 'text-[#3B4BC8]' : 'text-[#5B6477]'
                                }`}
                              >
                                <Building className="w-4 h-4" />
                              </div>
                              <input
                                ref={step2FirstInputRef}
                                id="companyName"
                                type="text"
                                autoComplete="organization"
                                className={`w-full h-12 pl-10 pr-10 rounded-xl text-sm font-medium text-[#16203A] bg-white border transition-all duration-200 focus:outline-none ${
                                  formErrors.companyName
                                    ? 'border-[#D4553F] focus:ring-4 focus:ring-[#D4553F]/15'
                                    : companyFocused
                                    ? 'border-[#3B4BC8] ring-4 ring-[#3B4BC8]/15 shadow-sm shadow-[#3B4BC8]/10'
                                    : 'border-[#E6DFD2] hover:border-[#16203A]/30'
                                }`}
                                placeholder="Acme Inc."
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                onFocus={() => setCompanyFocused(true)}
                                onBlur={(e) => {
                                  setCompanyFocused(false);
                                  handleBlur('companyName', e.target.value);
                                }}
                                aria-invalid={!!formErrors.companyName}
                                aria-describedby={formErrors.companyName ? 'companyName-error' : undefined}
                                disabled={loading}
                              />
                              {isCompanyValid && !formErrors.companyName && (
                                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#3F8F6B]">
                                  <CheckCircle2 className="w-4 h-4" />
                                </div>
                              )}
                            </div>
                            <div className="auth-hint-slot">
                              {companyName && (
                                <p className="text-[11px] text-[#5B6477]">
                                  Workspace slug:{' '}
                                  <code className="font-mono text-[#3B4BC8] font-semibold">
                                    {slugPreview || 'acme-inc'}
                                  </code>
                                  .brandvault.ai
                                </p>
                              )}
                            </div>
                            <div className="auth-error-slot">
                              {formErrors.companyName && (
                                <p id="companyName-error" className="flex items-center gap-1.5 text-xs text-[#D4553F]" role="alert">
                                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                  <span>{formErrors.companyName}</span>
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Industry Dropdown */}
                          <div className="mb-4">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-[#16203A] mb-1.5">
                              Industry
                            </label>
                            <div className="relative" ref={dropdownRef}>
                              <button
                                type="button"
                                className="w-full h-12 px-3.5 rounded-xl text-sm font-medium text-[#16203A] bg-white border border-[#E6DFD2] hover:border-[#16203A]/30 flex items-center justify-between transition-all focus:outline-none focus:border-[#3B4BC8] focus:ring-4 focus:ring-[#3B4BC8]/15"
                                aria-expanded={dropdownOpen}
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                onKeyDown={handleDropdownKeyDown}
                                disabled={loading}
                              >
                                <span className="flex items-center gap-2 truncate">
                                  <span className="text-[#3B4BC8]">
                                    {INDUSTRY_ICON_MAP[industry]}
                                  </span>
                                  <span>
                                    {INDUSTRIES.find((i) => i.value === industry)?.label ||
                                      'Select industry'}
                                  </span>
                                </span>
                                <ChevronRight
                                  className={`w-4 h-4 text-[#5B6477] transition-transform duration-200 ${
                                    dropdownOpen ? 'rotate-90' : ''
                                  }`}
                                />
                              </button>

                              {dropdownOpen && (
                                <motion.div
                                  className="absolute top-[calc(100%+6px)] left-0 right-0 bg-white border border-[#E6DFD2] rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto p-1.5"
                                  initial={{ opacity: 0, y: -6 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -6 }}
                                >
                                  <div className="p-1 mb-1">
                                    <input
                                      type="text"
                                      className="w-full h-8 px-2.5 text-xs bg-[#FAF6EF] rounded-lg border border-[#E6DFD2] focus:outline-none focus:border-[#3B4BC8]"
                                      placeholder="Search industries…"
                                      value={searchQuery}
                                      onChange={(e) => setSearchQuery(e.target.value)}
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  </div>
                                  {filteredIndustries.map((ind, idx) => (
                                    <button
                                      key={ind.value}
                                      type="button"
                                      className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
                                        ind.value === industry
                                          ? 'bg-[#3B4BC8]/10 text-[#3B4BC8]'
                                          : idx === highlightedIndex
                                          ? 'bg-[#FAF6EF] text-[#16203A]'
                                          : 'text-[#5B6477] hover:bg-[#FAF6EF]'
                                      }`}
                                      onClick={() => handleDropdownSelect(ind.value)}
                                    >
                                      <span>{INDUSTRY_ICON_MAP[ind.value]}</span>
                                      <span className="truncate">{ind.label}</span>
                                      {ind.value === industry && (
                                        <Check className="w-3.5 h-3.5 ml-auto text-[#3B4BC8]" />
                                      )}
                                    </button>
                                  ))}
                                </motion.div>
                              )}
                            </div>
                          </div>

                          {/* Source Documents Dropzone */}
                          <div className="mb-4">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-[#16203A] mb-1.5">
                              Source Documents <span className="text-[#5B6477] normal-case">(optional)</span>
                            </label>
                            <div
                              className="border-2 border-dashed border-[#E6DFD2] hover:border-[#3B4BC8] rounded-xl p-4 text-center cursor-pointer transition-colors bg-white/60 hover:bg-[#3B4BC8]/5"
                              onClick={() => document.getElementById('file-upload-signup')?.click()}
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={(e) => {
                                e.preventDefault();
                                if (e.dataTransfer.files) handleFileSelect(Array.from(e.dataTransfer.files));
                              }}
                            >
                              <Upload className="w-6 h-6 text-[#3B4BC8] mx-auto mb-1.5" />
                              <p className="text-xs font-semibold text-[#16203A]">
                                Drop brand guidelines or specs (PDF)
                              </p>
                              <p className="text-[11px] text-[#5B6477] mt-0.5">
                                Up to 10 files · 10MB each
                              </p>
                              <input
                                id="file-upload-signup"
                                type="file"
                                accept=".pdf"
                                multiple
                                onChange={(e) =>
                                  e.target.files && handleFileSelect(Array.from(e.target.files))
                                }
                                className="hidden"
                                disabled={loading}
                              />
                            </div>

                            {/* Uploaded File Chips */}
                            {sourceDocuments.length > 0 && (
                              <div className="flex flex-col gap-1.5 mt-2.5">
                                {sourceDocuments.map((file) => (
                                  <div
                                    key={file.name}
                                    className="flex items-center justify-between p-2 rounded-lg bg-white border border-[#E6DFD2] text-xs"
                                  >
                                    <div className="flex items-center gap-2 truncate pr-2">
                                      <FileCheck2 className="w-4 h-4 text-[#3F8F6B] shrink-0" />
                                      <span className="truncate font-medium text-[#16203A]">
                                        {file.name}
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => removeFile(file.name)}
                                      className="p-1 text-[#5B6477] hover:text-[#D4553F]"
                                      aria-label={`Remove ${file.name}`}
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Terms Checkbox */}
                          <div className="mb-5">
                            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-[#5B6477]">
                              <input
                                type="checkbox"
                                checked={agreeTerms}
                                onChange={(e) => setAgreeTerms(e.target.checked)}
                                className="w-4 h-4 rounded border-[#E6DFD2] text-[#3B4BC8] focus:ring-[#3B4BC8] mt-0.5"
                              />
                              <span>
                                I agree to BrandVault AI&apos;s Terms of Service and Privacy Policy.
                              </span>
                            </label>
                            <div className="auth-error-slot">
                              {formErrors.agreeTerms && (
                                <p className="text-xs text-[#D4553F]">
                                  {formErrors.agreeTerms}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons: Back + Submit */}
                          <div className="flex gap-2.5">
                            <button
                              type="button"
                              onClick={handleBack}
                              disabled={loading}
                              className="px-4 h-12 rounded-xl border border-[#E6DFD2] bg-white hover:bg-[#FAF6EF] text-xs font-semibold text-[#5B6477] transition-colors"
                            >
                              Back
                            </button>
                            <button
                              type="submit"
                              disabled={loading}
                              className="relative flex-1 h-12 rounded-xl bg-gradient-to-r from-[#16203A] to-[#1E2540] hover:from-[#111A30] hover:to-[#171D33] active:scale-[0.98] text-white text-sm font-semibold tracking-tight shadow-md shadow-[#16203A]/20 flex items-center justify-center gap-2 overflow-hidden transition-all duration-200 group disabled:opacity-60"
                            >
                              <div className="btn-shine-overlay" aria-hidden="true" />
                              {loading ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                                  <span>Creating vault…</span>
                                </>
                              ) : (
                                <>
                                  <span>Create my vault</span>
                                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                                </>
                              )}
                            </button>
                          </div>
                        </>
                      )}

                      {/* Bottom Link to Login */}
                      <p className="text-center text-xs text-[#5B6477] mt-5">
                        Already have an account?{' '}
                        <Link
                          href="/login"
                          className="font-semibold text-[#3B4BC8] hover:underline ml-0.5"
                        >
                          Sign in &rarr;
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
                  <h3 className="font-serif text-2xl font-bold text-[#16203A]">Your vault is ready</h3>
                  <p className="text-sm text-[#5B6477] mt-1">
                    Setting up workspace and redirecting…
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Live sandbox status pill */}
          <div className="w-full max-w-[440px] flex justify-end mt-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/70 backdrop-blur-xs border border-[#16203A]/8 text-[11px] font-mono text-[#5B6477] shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-[#3F8F6B] animate-pulse" />
              <span>Live demo environment · NexTech sandbox</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAF6EF]" />}>
      <SignupContent />
    </Suspense>
  );
}
