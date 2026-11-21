"use client";

import { useState, useEffect } from "react";
import {
  Sidebar,
  SidebarBody,
  SidebarLink,
  SidebarGroup,
  Logo,
  UserSection,
  NAV_GROUPS,
  useSidebar,
} from "@/components/ui/sidebar";
import { Header } from "@/components/layout/header";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { RequestContext } from "@/lib/auth";

interface DashboardClientLayoutProps {
  children: React.ReactNode;
  initialSession?: RequestContext | null;
}

export function DashboardClientLayout({
  children,
  initialSession,
}: DashboardClientLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [workspaceName, setWorkspaceName] = useState(
    initialSession?.workspaceSlug === 'nexatech' ? 'NexaTech' : (initialSession?.workspaceSlug || 'Workspace')
  );
  const [userName, setUserName] = useState(initialSession?.userName || "Team Member");
  const [userRole, setUserRole] = useState(
    initialSession?.role === 'ADMIN' ? 'Admin' : 'Reviewer'
  );

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.authenticated) {
          if (data.organization?.name) setWorkspaceName(data.organization.name);
          if (data.user?.full_name) setUserName(data.user.full_name);
          if (data.user?.role) setUserRole(data.user.role === 'ADMIN' ? 'Admin' : 'Reviewer');
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      {/* Desktop Sticky Sidebar with sliding expansion */}
      <div className="hidden lg:block lg:sticky lg:top-0 lg:h-screen lg:shrink-0 z-30 print:hidden">
        <Sidebar animate={true}>
          <SidebarBody className="justify-between h-full">
            <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden scrollbar-none">
              <Logo />
              <nav aria-label="Main navigation" className="flex flex-col gap-3 mt-2">
                {NAV_GROUPS.map((group, gIdx) => (
                  <SidebarGroup key={gIdx} group={group} isFirst={gIdx === 0} />
                ))}
              </nav>
            </div>
            <UserSection
              workspaceName={workspaceName}
              userName={userName}
              userRole={userRole}
            />
          </SidebarBody>
        </Sidebar>
      </div>

      {/* Mobile Drawer with smooth slide animation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-ink/40 backdrop-blur-xs"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Sliding Drawer */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="relative z-10 w-[270px] max-w-[80vw] h-full bg-surface-2 border-r border-line p-4 flex flex-col justify-between shadow-xl"
            >
              <div className="flex flex-col flex-1 overflow-y-auto scrollbar-none">
                <div className="flex items-center justify-between mb-4">
                  <Logo />
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1.5 rounded-lg text-ink-3 hover:text-ink hover:bg-surface border border-line focus-ring"
                    aria-label="Close navigation"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <nav aria-label="Mobile navigation" className="flex flex-col gap-4 mt-1">
                  {NAV_GROUPS.map((group, gIdx) => (
                    <div key={gIdx} className="space-y-1">
                      <div className="px-2 text-[11px] font-medium text-ink-3 tracking-normal">
                        {group.title}
                      </div>
                      <div className="space-y-0.5">
                        {group.links.map((link, idx) => (
                          <SidebarLink
                            key={idx}
                            link={link}
                            onClick={() => setMobileMenuOpen(false)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </nav>
              </div>
              <UserSection
                workspaceName={workspaceName}
                userName={userName}
                userRole={userRole}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Dashboard Canvas */}
      <div className="flex-1 flex flex-col min-w-0 relative print:p-0 print:m-0">
        {/* Header with mobile menu button */}
        <div className="print:hidden">
          <Header onMenuClick={() => setMobileMenuOpen(true)} />
        </div>

        {/* Central Content Workspace */}
        <main className="flex-1 w-full print:p-0 print:m-0 print:w-full">
          <div className="layout-content print:p-0 print:m-0 print:max-w-none">
            <ErrorBoundary name="DashboardContent">
              {children}
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
}
