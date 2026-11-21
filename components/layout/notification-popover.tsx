'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell, AlertTriangle, ShieldCheck, Sparkles, Check,
  Clock, ArrowRight, ExternalLink, X, CheckCheck, ShieldAlert
} from 'lucide-react';
import { safeStorage } from '@/lib/utils';

export interface NotificationItem {
  id: string;
  type: 'critical' | 'info' | 'suggestion' | 'success';
  title: string;
  description: string;
  time: string;
  href: string;
  read: boolean;
}

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    type: 'critical',
    title: 'Critical finding requires review',
    description: 'Battery specification in "NexaTech Nova Launch Announcement" contradicts certified test specs.',
    time: '15m ago',
    href: '/reviews',
    read: false,
  },
  {
    id: 'notif-2',
    type: 'suggestion',
    title: 'New guideline suggested',
    description: 'AI noticed recurrent superlative flags ("world\'s best"). Review the suggested rule in Governance Insights.',
    time: '2h ago',
    href: '/insights',
    read: false,
  },
  {
    id: 'notif-3',
    type: 'success',
    title: 'Evidence Passport issued',
    description: 'BVP-2026-0001 has been cryptographically signed and stored in the immutable registry.',
    time: '5h ago',
    href: '/passports',
    read: false,
  },
  {
    id: 'notif-4',
    type: 'info',
    title: 'New submission queued',
    description: 'Draft "Clean product page — Specifications" submitted for brand verification.',
    time: '1d ago',
    href: '/reviews',
    read: true,
  },
];

const STORAGE_KEY = 'notifications_state';

export function NotificationPopover() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(DEFAULT_NOTIFICATIONS);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Load saved state from safeStorage if available
  useEffect(() => {
    try {
      const saved = safeStorage.getItem(STORAGE_KEY);
      if (saved) {
        setNotifications(JSON.parse(saved));
      }
    } catch {
      // Ignore parse errors
    }

    // Cross-tab storage synchronization
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `bv:${STORAGE_KEY}` && e.newValue) {
        try {
          setNotifications(JSON.parse(e.newValue));
        } catch {
          // Ignore
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Fetch active re-verification tasks
    fetch('/api/review-tasks')
      .then((res) => (res.ok ? res.json() : { tasks: [] }))
      .then((data) => {
        if (data?.tasks && data.tasks.length > 0) {
          const taskNotifs: NotificationItem[] = data.tasks.map((t: any) => ({
            id: `task-${t.id}`,
            type: 'critical',
            title: `Re-review required: ${t.dependency_name} changed`,
            description: `Underlying specification changed from "${t.before_value}" to "${t.after_value}". Post "${t.submission_title || 'Nova Launch Campaign'}" requires human re-approval.`,
            time: 'Just now',
            href: `/reviews/${t.submission_id}`,
            read: t.status === 'RESOLVED',
          }));
          setNotifications((prev) => {
            const filtered = prev.filter((p) => !p.id.startsWith('task-'));
            return [...taskNotifs, ...filtered];
          });
        }
      })
      .catch(() => {});

    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const saveNotifications = (items: NotificationItem[]) => {
    setNotifications(items);
    try {
      safeStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignore errors
    }
  };

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    saveNotifications(updated);
  };

  const handleNotificationClick = (item: NotificationItem) => {
    const updated = notifications.map(n => n.id === item.id ? { ...n, read: true } : n);
    saveNotifications(updated);
    setIsOpen(false);
    router.push(item.href);
  };

  const deleteNotification = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = notifications.filter(n => n.id !== id);
    saveNotifications(updated);
  };

  return (
    <div className="relative" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className={`p-2 rounded-lg text-secondary-ink hover:text-ink hover:bg-surface-2 relative transition-all ${
          isOpen ? 'bg-surface-2 text-ink ring-2 ring-brand/20' : ''
        }`}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-terracotta opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-terracotta" />
          </span>
        )}
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-surface border border-line shadow-xl z-50 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150"
        >
          {/* Header */}
          <div className="p-3.5 px-4 border-b border-line flex items-center justify-between bg-surface-2/40">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-ink">Notifications</span>
              {unreadCount > 0 ? (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-accent-terracotta/15 text-accent-terracotta">
                  {unreadCount} new
                </span>
              ) : (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-surface-2 text-ink-3">
                  All read
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-[11px] text-brand hover:underline font-medium flex items-center gap-1 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-line/30">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-ink-3">
                <ShieldCheck className="w-8 h-8 text-evidence-supported mx-auto mb-2 opacity-80" />
                <p className="font-semibold text-ink">You're all caught up</p>
                <p className="text-[11px] mt-0.5">No notifications at this time.</p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`p-3.5 px-4 flex items-start gap-3 hover:bg-surface-2/60 cursor-pointer transition-colors relative group ${
                    !item.read ? 'bg-surface-2/30' : ''
                  }`}
                >
                  {/* Icon */}
                  <div className="mt-0.5 shrink-0">
                    {item.type === 'critical' && (
                      <span className="w-6 h-6 rounded-full bg-evidence-contradicted/15 text-evidence-contradicted flex items-center justify-center">
                        <AlertTriangle className="w-3.5 h-3.5" />
                      </span>
                    )}
                    {item.type === 'suggestion' && (
                      <span className="w-6 h-6 rounded-full bg-brand/15 text-brand flex items-center justify-center">
                        <Sparkles className="w-3.5 h-3.5" />
                      </span>
                    )}
                    {item.type === 'success' && (
                      <span className="w-6 h-6 rounded-full bg-evidence-supported/15 text-evidence-supported flex items-center justify-center">
                        <ShieldCheck className="w-3.5 h-3.5" />
                      </span>
                    )}
                    {item.type === 'info' && (
                      <span className="w-6 h-6 rounded-full bg-surface-2 text-secondary-ink flex items-center justify-center">
                        <Clock className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center justify-between gap-1">
                      <p className={`text-xs truncate ${!item.read ? 'font-bold text-ink' : 'font-medium text-secondary-ink'}`}>
                        {item.title}
                      </p>
                      <span className="text-[10px] text-ink-3 whitespace-nowrap">{item.time}</span>
                    </div>
                    <p className="text-[11px] text-secondary-ink line-clamp-2 mt-0.5 leading-snug">
                      {item.description}
                    </p>
                  </div>

                  {/* Actions on hover */}
                  <div className="absolute right-2 top-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={(e) => deleteNotification(e, item.id)}
                      className="p-1 rounded hover:bg-surface-2 text-ink-3 hover:text-ink"
                      title="Dismiss"
                      aria-label="Dismiss notification"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>

                  {!item.read && (
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-brand group-hover:hidden" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 px-4 border-t border-line bg-surface-2/40 flex items-center justify-between text-[11px]">
            <Link
              href="/reviews"
              onClick={() => setIsOpen(false)}
              className="text-secondary-ink hover:text-brand font-medium flex items-center gap-1 transition-colors"
            >
              View all reviews <ArrowRight className="w-3 h-3" />
            </Link>
            <span className="text-ink-3 text-[10px]">BrandVault AI Monitor</span>
          </div>
        </div>
      )}
    </div>
  );
}
