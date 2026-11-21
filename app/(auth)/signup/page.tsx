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
  FileCheck2,
  Upload,
  X,
  ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { AuthHeader } from '@/components/auth/auth-header';
import { AuthAmbientBg } from '@/components/auth/auth-ambient-bg';
import { ProofSheetRegister } from '@/components/auth/proof-sheet-register';
import { AuthHeroHeadline } from '@/components/auth/auth-hero-headline';
import { AuthStatsRow } from '@/components/auth/auth-stats-row';

const INDUSTRIES = [
  { value: 'Consumer Tech & Hardware', label: 'Consumer Tech & Hardware' },
  { value: 'B2B SaaS & Enterprise Software', label: 'B2B SaaS & Enterprise Software' },
  { value: 'Health & Wellness', label: 'Health & Wellness' },
  { value: 'E-commerce & Retail', label: 'E-commerce & Retail' },
  { value: 'Fintech & Financial Services', label: 'Fintech & Financial Services' },
  { value: 'Media & Creative Agency', label: 'Media & Creative Agency' },
  { value: 'Other', label: 'Other' },
];

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get('next') || '/overview';

  const [step, setStep] = useState(searchParams.get('step') === '2' ? 2 : 1);
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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const step2FirstInputRef = useRef<HTMLInputElement>(null);

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
    setSourceDocuments((prev) => [...prev, ...validFiles]);
  };

  const removeFile = (fileName: string) => {
    setSourceDocuments((prev) => prev.filter((f) => f.name !== fileName));
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
      {/* 1 continuous background: warm paper #F8F4EC with 2% film grain */}
      <AuthAmbientBg />

      {/* Fixed 72px Unified Header */}
      <AuthHeader currentPage="register" />

      {/* Main Two-Column Split inside 1280px Container */}
      <div className="auth-container">
        <div className="auth-split">
          {/* STORY SIDE (Left Column) */}
          <section className="auth-story" aria-label="Product introduction">
            <div className="flex flex-col gap-4">
              <AuthHeroHeadline />
              <ProofSheetRegister
                currentFormStep={step}
                hasUploadedFiles={sourceDocuments.length > 0}
                isRegistered={isSuccess}
              />
            </div>

            <AuthStatsRow />
          </section>

          {/* FORM SIDE (Right Column - Independent Scroll) */}
          <section className="auth-form-side" aria-label="Registration form">
            <div className="auth-form-wrapper">
              <AnimatePresence mode="wait">
                {!isSuccess ? (
                  <motion.div
                    key={`step-${step}`}
                    className={`auth-form-card min-h-[520px] flex flex-col justify-between ${shakeCard ? 'shake-error' : ''}`}
                    initial={prefersReducedMotion ? {} : { opacity: 0, y: 12 }}
                    animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                    exit={prefersReducedMotion ? {} : { opacity: 0, y: -12 }}
                    transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <div>
                      {/* Step Progress Bar */}
                      <div className="mb-5">
                        <div className="flex items-center justify-between text-xs font-semibold text-[#5B6477] mb-2">
                          <span className="text-[#3B4BC8] font-mono">Step {step} of 2</span>
                          <span>{step === 1 ? 'About you' : 'Your company'}</span>
                        </div>
                        <div className="w-full h-1 bg-[#E4DCCB] rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-[#3B4BC8] rounded-full"
                            animate={{ width: step === 1 ? '50%' : '100%' }}
                            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                          />
                        </div>
                      </div>

                      <h2 className="form-title font-serif text-[28px] sm:text-[30px] font-bold text-[#16203A] tracking-tight leading-tight">
                        {step === 1 ? 'Create account' : 'Set up your vault'}
                      </h2>
                      <p className="form-subtitle text-[14px] text-[#5B6477] mt-1 mb-5">
                        {step === 1
                          ? 'Get started with evidence-backed brand compliance.'
                          : 'Configure your company workspace.'}
                      </p>

                      <form onSubmit={handleSubmit} noValidate>
                        {/* Reserved Slot for Global Error Banner */}
                        <div className="min-h-[24px] mb-3">
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

                        {step === 1 ? (
                          <>
                            {/* Full Name */}
                            <div className="mb-3.5">
                              <label
                                htmlFor="fullName"
                                className="block text-[14px] font-medium text-[#16203A] mb-1.5"
                              >
                                Full name
                              </label>
                              <input
                                id="fullName"
                                type="text"
                                autoComplete="name"
                                className={`auth-input ${formErrors.fullName ? 'auth-input-error' : ''}`}
                                placeholder="Jane Doe"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                onBlur={(e) => handleBlur('fullName', e.target.value)}
                                aria-invalid={!!formErrors.fullName}
                                aria-describedby={formErrors.fullName ? 'fullName-error' : undefined}
                                disabled={loading}
                              />
                              <div className="auth-error-slot">
                                {formErrors.fullName && (
                                  <p id="fullName-error" className="flex items-center gap-1.5 text-xs text-[#C2402E]" role="alert">
                                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                    <span>{formErrors.fullName}</span>
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Work Email */}
                            <div className="mb-3.5">
                              <label
                                htmlFor="email"
                                className="block text-[14px] font-medium text-[#16203A] mb-1.5"
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
                              <div className="auth-error-slot">
                                {formErrors.email && (
                                  <p id="email-error" className="flex items-center gap-1.5 text-xs text-[#C2402E]" role="alert">
                                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                    <span>{formErrors.email}</span>
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Password */}
                            <div className="mb-3.5">
                              <label
                                htmlFor="password"
                                className="block text-[14px] font-medium text-[#16203A] mb-1.5"
                              >
                                Password
                              </label>
                              <div className="relative">
                                <input
                                  id="password"
                                  type={showPassword ? 'text' : 'password'}
                                  autoComplete="new-password"
                                  className={`auth-input pr-10 ${formErrors.password ? 'auth-input-error' : ''}`}
                                  placeholder="Create a strong password"
                                  value={password}
                                  onChange={(e) => setPassword(e.target.value)}
                                  onBlur={(e) => handleBlur('password', e.target.value)}
                                  aria-invalid={!!formErrors.password}
                                  aria-describedby={formErrors.password ? 'password-error' : undefined}
                                  disabled={loading}
                                />
                                <button
                                  type="button"
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5B6477] hover:text-[#16203A] transition-colors p-1"
                                  onClick={() => setShowPassword(!showPassword)}
                                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                              </div>

                              {/* 4-Segment Password Strength Meter */}
                              <div
                                className="flex gap-1.5 mt-2"
                                role="progressbar"
                                aria-valuenow={passwordStrength()}
                                aria-valuemin={0}
                                aria-valuemax={4}
                              >
                                {[1, 2, 3, 4].map((s) => {
                                  const active = passwordStrength() >= s;
                                  const barColor =
                                    passwordStrength() === 1
                                      ? 'bg-[#C2402E]'
                                      : passwordStrength() === 2
                                        ? 'bg-[#D9922B]'
                                        : 'bg-[#3F8F6B]';

                                  return (
                                    <div
                                      key={s}
                                      className="flex-1 h-1 rounded-full bg-[#E4DCCB] overflow-hidden"
                                    >
                                      <div
                                        className={`h-full rounded-full ${barColor}`}
                                        style={{ width: active ? '100%' : '0%' }}
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
                                        : 'Strong password'}
                                </p>
                              </div>
                              <div className="auth-error-slot">
                                {formErrors.password && (
                                  <p id="password-error" className="flex items-center gap-1.5 text-xs text-[#C2402E]" role="alert">
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
                              className="auth-primary-btn mt-2"
                            >
                              <span>Continue to company setup</span>
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            {/* Company Name */}
                            <div className="mb-3.5">
                              <label
                                htmlFor="companyName"
                                className="block text-[14px] font-medium text-[#16203A] mb-1.5"
                              >
                                Company name
                              </label>
                              <input
                                ref={step2FirstInputRef}
                                id="companyName"
                                type="text"
                                autoComplete="organization"
                                className={`auth-input ${formErrors.companyName ? 'auth-input-error' : ''}`}
                                placeholder="Acme Inc."
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                onBlur={(e) => handleBlur('companyName', e.target.value)}
                                aria-invalid={!!formErrors.companyName}
                                aria-describedby={formErrors.companyName ? 'companyName-error' : undefined}
                                disabled={loading}
                              />
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
                                  <p id="companyName-error" className="flex items-center gap-1.5 text-xs text-[#C2402E]" role="alert">
                                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                    <span>{formErrors.companyName}</span>
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Industry Dropdown */}
                            <div className="mb-3.5">
                              <label className="block text-[14px] font-medium text-[#16203A] mb-1.5">
                                Industry
                              </label>
                              <div className="relative" ref={dropdownRef}>
                                <button
                                  type="button"
                                  className="auth-input flex items-center justify-between text-left"
                                  aria-expanded={dropdownOpen}
                                  onClick={() => setDropdownOpen(!dropdownOpen)}
                                  onKeyDown={handleDropdownKeyDown}
                                  disabled={loading}
                                >
                                  <span className="truncate">
                                    {INDUSTRIES.find((i) => i.value === industry)?.label ||
                                      'Select industry'}
                                  </span>
                                  <ChevronRight
                                    className={`w-4 h-4 text-[#5B6477] transition-transform duration-200 ${dropdownOpen ? 'rotate-90' : ''}`}
                                  />
                                </button>

                                {dropdownOpen && (
                                  <motion.div
                                    className="absolute top-[calc(100%+6px)] left-0 right-0 bg-[#FFFDF8] border border-[#E4DCCB] rounded-[10px] shadow-lg z-50 max-h-56 overflow-y-auto p-1.5"
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -4 }}
                                  >
                                    <div className="p-1 mb-1">
                                      <input
                                        type="text"
                                        className="w-full h-8 px-2.5 text-xs bg-[#F8F4EC] rounded-[6px] border border-[#E4DCCB] focus:outline-none focus:border-[#3B4BC8]"
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
                                        className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-[6px] text-xs font-medium transition-colors text-left ${ind.value === industry
                                          ? 'bg-[#3B4BC8]/10 text-[#3B4BC8]'
                                          : idx === highlightedIndex
                                            ? 'bg-[#F8F4EC] text-[#16203A]'
                                            : 'text-[#5B6477] hover:bg-[#F8F4EC]'
                                          }`}
                                        onClick={() => handleDropdownSelect(ind.value)}
                                      >
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
                            <div className="mb-3.5">
                              <label className="block text-[14px] font-medium text-[#16203A] mb-1.5">
                                Source documents <span className="text-[#5B6477] text-xs font-normal">(optional)</span>
                              </label>
                              <div
                                className="border border-dashed border-[#E4DCCB] hover:border-[#3B4BC8] rounded-[10px] p-3 text-center cursor-pointer transition-colors bg-[#F8F4EC]/60 hover:bg-[#3B4BC8]/5"
                                onClick={() => document.getElementById('file-upload-signup')?.click()}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  if (e.dataTransfer.files) handleFileSelect(Array.from(e.dataTransfer.files));
                                }}
                              >
                                <Upload className="w-5 h-5 text-[#3B4BC8] mx-auto mb-1" />
                                <p className="text-xs font-medium text-[#16203A]">
                                  Drop guidelines or spec sheets (PDF)
                                </p>
                                <p className="text-[11px] text-[#5B6477]">
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
                                <div className="flex flex-col gap-1 mt-2">
                                  {sourceDocuments.map((file) => (
                                    <div
                                      key={file.name}
                                      className="flex items-center justify-between p-1.5 px-2.5 rounded-[6px] bg-white border border-[#E4DCCB] text-xs"
                                    >
                                      <div className="flex items-center gap-2 truncate pr-2">
                                        <FileCheck2 className="w-3.5 h-3.5 text-[#3F8F6B] shrink-0" />
                                        <span className="truncate font-medium text-[#16203A]">
                                          {file.name}
                                        </span>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => removeFile(file.name)}
                                        className="p-1 text-[#5B6477] hover:text-[#C2402E]"
                                        aria-label={`Remove ${file.name}`}
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Terms Checkbox */}
                            <div className="mb-4">
                              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-[#5B6477]">
                                <input
                                  type="checkbox"
                                  checked={agreeTerms}
                                  onChange={(e) => setAgreeTerms(e.target.checked)}
                                  className="auth-checkbox mt-0.5"
                                />
                                <span>
                                  I agree to BrandVault AI&apos;s Terms of Service and Privacy Policy.
                                </span>
                              </label>
                              <div className="auth-error-slot">
                                {formErrors.agreeTerms && (
                                  <p className="text-xs text-[#C2402E]">
                                    {formErrors.agreeTerms}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Action Buttons: Back + Submit */}
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={handleBack}
                                disabled={loading}
                                className="px-4 h-12 rounded-[10px] border border-[#E4DCCB] bg-white hover:bg-[#F8F4EC] text-xs font-semibold text-[#5B6477] transition-colors"
                              >
                                Back
                              </button>
                              <button
                                type="submit"
                                disabled={loading}
                                className="auth-primary-btn flex-1"
                              >
                                {loading ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                                    <span>Creating vault…</span>
                                  </>
                                ) : (
                                  <>
                                    <span>Create my vault</span>
                                    <ArrowRight className="w-4 h-4" />
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
                    <div className="w-12 h-12 rounded-full bg-[#E6F4EB] text-[#3F8F6B] flex items-center justify-center mx-auto mb-3 shadow-2xs">
                      <Check className="w-6 h-6 stroke-[2.5]" />
                    </div>
                    <h3 className="font-serif text-2xl font-bold text-[#16203A]">Vault created</h3>
                    <p className="text-sm text-[#5B6477] mt-1">Redirecting to your new workspace…</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8F4EC]" />}>
      <SignupContent />
    </Suspense>
  );
}
