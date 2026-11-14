"use client";

import { useState } from "react";
import {
  Sidebar,
  SidebarBody,
  SidebarLink,
  Logo,
  LogoIcon,
  UserSection,
  WorkspaceStatus,
  NAV_LINKS,
} from "@/components/ui/sidebar";
import { Header } from "@/components/layout/header";

const workspaceName = "NexaTech";
const userName = "Demo Reviewer";
const userRole = "Reviewer";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      {/* Desktop Sticky Sidebar */}
      <div className="hidden lg:block lg:sticky lg:top-0 lg:h-screen lg:shrink-0 z-30">
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} animate={true}>
          <SidebarBody className="justify-between">
            <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
              {sidebarOpen ? <Logo /> : <LogoIcon />}
              <WorkspaceStatus />
              <div className="mt-6 flex flex-col gap-1">
                {NAV_LINKS.map((link, idx) => (
                  <SidebarLink key={idx} link={link} />
                ))}
              </div>
            </div>
            <UserSection
              workspaceName={workspaceName}
              userName={userName}
              userRole={userRole}
            />
          </SidebarBody>
        </Sidebar>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <Sidebar open={true} setOpen={setMobileMenuOpen} animate={true}>
            <SidebarBody className="justify-between h-full">
              <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
                <Logo />
                <WorkspaceStatus />
                <div className="mt-6 flex flex-col gap-1">
                  {NAV_LINKS.map((link, idx) => (
                    <SidebarLink
                      key={idx}
                      link={link}
                      onClick={() => setMobileMenuOpen(false)}
                    />
                  ))}
                </div>
              </div>
              <UserSection
                workspaceName={workspaceName}
                userName={userName}
                userRole={userRole}
              />
            </SidebarBody>
          </Sidebar>
        </div>
      )}

      {/* Main Dashboard Canvas */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Clean Header */}
        <Header onMenuClick={() => setMobileMenuOpen(true)} />

        {/* Central Content Workspace */}
        <main className="flex-1 w-full">
          <div className="layout-content">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
