"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState, createContext, useContext } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, LayoutDashboard, ClipboardList, BookOpen, FileCheck2, BarChart2, Settings, Shield, ChevronRight } from "lucide-react";

interface NavLink {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody = (props: React.ComponentProps<typeof motion.div>) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...(props as React.ComponentProps<"div">)} />
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof motion.div>) => {
  const { open, setOpen, animate } = useSidebar();
  return (
    <motion.div
      className={cn(
        "h-full px-4 py-4 hidden lg:flex lg:flex-col bg-surface-2 border-r border-line w-[248px] flex-shrink-0",
        className
      )}
      animate={{
        width: animate ? (open ? "248px" : "72px") : "248px",
      }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const MobileSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) => {
  const { open, setOpen } = useSidebar();
  return (
    <>
      <div
        className={cn(
          "h-16 px-4 py-4 flex flex-row lg:hidden items-center justify-between bg-surface-2 border-b border-line w-full"
        )}
        {...props}
      >
        <div className="flex justify-end z-20 w-full">
          <Menu
            className="text-ink-2 cursor-pointer hover:text-ink"
            onClick={() => setOpen(!open)}
          />
        </div>
      </div>
    </>
  );
};

export const SidebarLink = ({
  link,
  onClick,
}: {
  link: NavLink;
  onClick?: () => void;
}) => {
  const { open, animate } = useSidebar();
  const pathname = usePathname();
  const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href + "/"));

  return (
    <Link
      href={link.href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors focus-ring sidebar-nav-item",
        isActive && "sidebar-nav-item-active"
      )}
    >
      <span className="w-5 h-5 flex-shrink-0 text-current">{link.icon}</span>
      <motion.span
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: open ? 1 : 0, x: open ? 0 : -10 }}
        transition={{ duration: 0.15, ease: "easeInOut" }}
        className="font-medium text-sm whitespace-pre overflow-hidden"
      >
        {link.label}
      </motion.span>
    </Link>
  );
};

export const NAV_LINKS: NavLink[] = [
  { href: "/overview", label: "Overview", icon: <LayoutDashboard className="w-5 h-5 flex-shrink-0" /> },
  { href: "/reviews", label: "Content Reviews", icon: <ClipboardList className="w-5 h-5 flex-shrink-0" /> },
  { href: "/guidelines", label: "Brand Guidelines", icon: <Shield className="w-5 h-5 flex-shrink-0" /> },
  { href: "/knowledge", label: "Approved Knowledge", icon: <BookOpen className="w-5 h-5 flex-shrink-0" /> },
  { href: "/passports", label: "Evidence Passports", icon: <FileCheck2 className="w-5 h-5 flex-shrink-0" /> },
  { href: "/insights", label: "Governance Insights", icon: <BarChart2 className="w-5 h-5 flex-shrink-0" /> },
  { href: "/settings", label: "Settings", icon: <Settings className="w-5 h-5 flex-shrink-0" /> },
];

export const Logo = () => {
  const { open, animate } = useSidebar();
  return (
    <Link
      href="/overview"
      className="flex items-center gap-3 px-3 py-2 mb-2 relative z-20"
    >
      <div className="flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0 bg-brand shadow-lg shadow-brand/30">
        <Shield className="w-5 h-5 text-white" />
      </div>
      <motion.span
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: open ? 1 : 0, x: open ? 0 : -10 }}
        transition={{ duration: 0.15, ease: "easeInOut" }}
        className="font-bold text-base tracking-tight text-ink whitespace-pre overflow-hidden font-serif"
      >
        BrandVault <span className="text-xs font-semibold bg-brand-soft text-brand px-1.5 py-0.5 rounded-full ml-1">AI</span>
      </motion.span>
    </Link>
  );
};

export const LogoIcon = () => {
  return (
    <Link
      href="/overview"
      className="flex items-center justify-center px-3 py-2 mb-2 relative z-20"
    >
      <div className="flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0 bg-brand shadow-lg shadow-brand/30">
        <Shield className="w-5 h-5 text-white" />
      </div>
    </Link>
  );
};

export const UserSection = ({
  workspaceName = "NexTech",
  userName = "Demo Reviewer",
  userRole = "Reviewer",
}: {
  workspaceName?: string;
  userName?: string;
  userRole?: string;
}) => {
  const { open, animate } = useSidebar();

  return (
    <div className="mt-auto pt-4 border-t border-line">
      <div className="flex items-center gap-3 px-3 py-2">
        <div className="flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0 bg-surface border border-line">
          <Shield className="w-4 h-4 text-brand" />
        </div>
        <motion.div
          animate={{
            display: animate ? (open ? "block" : "none") : "block",
            opacity: animate ? (open ? 1 : 0) : 1,
          }}
          className="min-w-0 overflow-hidden"
        >
          <div className="text-sm font-semibold text-ink leading-tight truncate">
            {workspaceName}
          </div>
          <div className="text-xs text-ink-3 leading-tight truncate">
            {userName} · {userRole}
          </div>
        </motion.div>
      </div>
      <motion.div
        animate={{
          display: animate ? (open ? "flex" : "none") : "flex",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className="px-3 py-3 mt-4"
      >
        <p className="workspace-card-note text-center">
          "Verify. Validate. Build trust."
        </p>
      </motion.div>
    </div>
  );
};

export const WorkspaceStatus = () => {
  const { open, animate } = useSidebar();

  return (
    <motion.div
      animate={{
        display: animate ? (open ? "flex" : "none") : "flex",
        opacity: animate ? (open ? 1 : 0) : 1,
      }}
      className="px-3 py-2 mb-4"
    >
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-supported flex-shrink-0" />
        <span className="text-xs font-medium text-ink-2">Workspace Active</span>
      </div>
    </motion.div>
  );
};
