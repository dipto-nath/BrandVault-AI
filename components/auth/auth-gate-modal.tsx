'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { X, LogIn, ArrowRight } from 'lucide-react';

interface AuthGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  destinationPath?: string;
  triggerElement?: HTMLElement | null;
}

const DESTINATION_NAMES: Record<string, string> = {
  '/overview': 'Workspace Overview',
  '/reviews': 'Review Studio',
  '/knowledge': 'Approved Knowledge',
  '/guidelines': 'Brand Guidelines',
  '/passports': 'Evidence Passports',
  '/insights': 'Governance Insights',
  '/settings': 'Workspace Settings',
};

function getDestinationName(path?: string): string | null {
  if (!path) return null;
  const cleanPath = path.split('?')[0];
  for (const [route, name] of Object.entries(DESTINATION_NAMES)) {
    if (cleanPath === route || cleanPath.startsWith(route + '/')) {
      return name;
    }
  }
  return null;
}

export function AuthGateModal({
  isOpen,
  onClose,
  destinationPath,
  triggerElement,
}: AuthGateModalProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const modalRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);

  const effectivePath = destinationPath || searchParams.get('next') || '/overview';
  const destinationName = getDestinationName(effectivePath);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Focus trapping and Esc key handler
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusables = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    // Focus first button
    setTimeout(() => {
      firstFocusableRef.current?.focus();
    }, 50);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      triggerElement?.focus();
    };
  }, [isOpen, onClose, triggerElement]);

  const loginHref = `/login?next=${encodeURIComponent(effectivePath)}`;
  const signupHref = `/signup?next=${encodeURIComponent(effectivePath)}`;

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-gate-title"
        >
          {/* Backdrop with 10px blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-[#0F141A]/70 backdrop-blur-[10px]"
            onClick={onClose}
          />

          {/* Modal Container: 440px wide, 20px radius */}
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="relative w-full max-w-[440px] rounded-[20px] bg-[#FAF8F5] border border-[#E8E2D5] shadow-2xl p-7 sm:p-8 text-[#1E2540] z-10 overflow-hidden"
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full text-[#6B7280] hover:text-[#1E2540] hover:bg-[#EDE8DE] transition-colors focus:outline-none focus:ring-2 focus:ring-[#2F4FB3]"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Passport Stamp Shield Animation */}
            <div className="flex justify-center mb-5">
              <div className="relative w-16 h-16 flex items-center justify-center">
                <svg
                  className="w-16 h-16"
                  viewBox="0 0 64 64"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Outer Stamp Circle Draw Animation */}
                  <motion.circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="#2F4FB3"
                    strokeWidth="2"
                    strokeDasharray="176"
                    initial={{ strokeDashoffset: 176, rotate: -90 }}
                    animate={{ strokeDashoffset: 0, rotate: 0 }}
                    transition={{ duration: 0.65, ease: 'easeOut' }}
                    style={{ transformOrigin: 'center' }}
                  />
                  {/* Stamp inner dashed ring */}
                  <motion.circle
                    cx="32"
                    cy="32"
                    r="23"
                    stroke="#2F4FB3"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.4 }}
                    transition={{ delay: 0.3, duration: 0.3 }}
                  />
                  {/* Shield check icon */}
                  <motion.path
                    d="M32 18L42 22V30C42 37 37.5 43 32 45C26.5 43 22 37 22 30V22L32 18Z"
                    fill="#2F4FB3"
                    fillOpacity="0.12"
                    stroke="#2F4FB3"
                    strokeWidth="2"
                    strokeLinejoin="round"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.4, type: 'spring' }}
                    style={{ transformOrigin: 'center' }}
                  />
                  {/* Check mark inside shield */}
                  <motion.path
                    d="M28 31.5L31 34.5L36.5 28.5"
                    stroke="#2F4FB3"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 0.4, duration: 0.3 }}
                  />
                </svg>
              </div>
            </div>

            {/* Title (Fraunces serif) */}
            <h2
              id="auth-gate-title"
              className="font-serif text-[22px] sm:text-[24px] font-bold text-center text-[#1E2540] tracking-tight leading-tight mb-2.5"
            >
              Sign in to explore BrandVault
            </h2>

            {/* Destination notice if opened by a protected link */}
            {destinationName && (
              <div className="mb-3 px-3 py-1.5 rounded-lg bg-[#2F4FB3]/8 border border-[#2F4FB3]/15 text-center text-xs text-[#2F4FB3]">
                You tried to open <strong className="font-semibold">{destinationName}</strong>. We will take you there after you sign in.
              </div>
            )}

            {/* Body copy */}
            <p className="text-center text-[13.5px] leading-relaxed text-[#5A627A] mb-6">
              Reviews, evidence and passports are available to signed-in team members. Sign in or create a workspace to continue.
            </p>

            {/* Buttons */}
            <div className="space-y-2.5">
              <Link
                href={loginHref}
                ref={firstFocusableRef as any}
                className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-full bg-[#1E2540] hover:bg-[#121728] text-white text-[14.5px] font-medium tracking-tight shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#2F4FB3] focus:ring-offset-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Login</span>
              </Link>

              <Link
                href={signupHref}
                className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-full bg-[#EDE8DE] hover:bg-[#E2DDD0] text-[#1E2540] text-[14.5px] font-medium tracking-tight border border-[#DCD5C5] transition-all focus:outline-none focus:ring-2 focus:ring-[#2F4FB3]"
              >
                <span>Create account</span>
                <ArrowRight className="w-4 h-4 text-[#5A627A]" />
              </Link>
            </div>

            {/* "Maybe later" quiet link */}
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={onClose}
                className="text-xs text-[#7A8299] hover:text-[#1E2540] transition-colors underline-offset-4 hover:underline"
              >
                Maybe later
              </button>
            </div>

            {/* Caveat handwritten footer */}
            <div className="mt-5 pt-4 border-t border-[#E8E2D5]/80 text-center">
              <span className="font-hand text-[15px] text-[#8C93A8] select-none tracking-wide">
                Verify. Validate. Build trust.
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
