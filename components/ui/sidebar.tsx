"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import React, { useState, createContext, useContext } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, Shield, LayoutDashboard, ClipboardList, BookOpen, FileCheck2, BarChart2, Settings, User } from "lucide-react";

interface Links {
  label: string;
  href: string;
  icon: React.JSX.Element | React.ReactNode;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(
  undefined
);

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
        "h-full px-4 py-4 hidden lg:flex lg:flex-col bg-navy-900 border-r border-navy-700 w-[280px] flex-shrink-0",
        className
      )}
      animate={{
        width: animate ? (open ? "280px" : "72px") : "280px",
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
          "h-16 px-4 py-4 flex flex-row lg:hidden items-center justify-between bg-navy-900 border-b border-navy-700 w-full"
        )}
        {...props}
      >
        <div className="flex justify-end z-20 w-full">
          <Menu
            className="text-navy-300 cursor-pointer hover:text-white"
            onClick={() => setOpen(!open)}
          />
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: "-100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-100%", opacity: 0 }}
            transition={{
              duration: 0.3,
              ease: "easeInOut",
            }}
            className={cn(
              "fixed h-full w-full inset-0 bg-navy-900 p-10 z-[100] flex flex-col justify-between lg:hidden",
              className
            )}
          >
            <div
              className="absolute right-6 top-6 z-50 text-navy-300 cursor-pointer hover:text-white"
              onClick={() => setOpen(!open)}
            >
              <X className="w-6 h-6" />
            </div>
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export const SidebarLink = ({
  link,
  className,
  onClick,
  ...props
}: {
  link: Links;
  className?: string;
  onClick?: () => void;
} & Omit<React.ComponentProps<typeof Link>, "href">) => {
  const { open, animate } = useSidebar();
  return (
    <Link
      href={link.href}
      onClick={onClick}
      className={cn(
        "flex items-center justify-start gap-3 group/sidebar px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 text-navy-300 hover:text-white hover:bg-navy-800/50",
        className
      )}
      {...props}
    >
      {link.icon}
      <motion.span
        animate={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className="text-navy-300 group-hover/sidebar:text-white transition-colors duration-150 whitespace-pre inline-block !p-0 !m-0"
      >
        {link.label}
      </motion.span>
    </Link>
  );
};

export const NAV_LINKS: Links[] = [
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
      <div className="flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0 bg-gradient-to-br from-accent to-amber-700 shadow-lg shadow-accent/30">
        <Shield className="w-5 h-5 text-white" />
      </div>
      <motion.span
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: open ? 1 : 0, x: open ? 0 : -10 }}
        transition={{ duration: 0.15, ease: "easeInOut" }}
        className="font-bold text-base tracking-tight text-white whitespace-pre overflow-hidden"
      >
        BrandVault AI
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
      <div className="flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0 bg-gradient-to-br from-accent to-amber-700 shadow-lg shadow-accent/30">
        <Shield className="w-5 h-5 text-white" />
      </div>
    </Link>
  );
};

export const UserSection = ({
  workspaceName = "NexaTech",
  userName = "Demo Reviewer",
  userRole = "Reviewer",
}: {
  workspaceName?: string;
  userName?: string;
  userRole?: string;
}) => {
  const { open, animate } = useSidebar();
  
  return (
    <div className="mt-auto pt-4 border-t border-navy-700">
      <div className="flex items-center gap-3 px-3 py-2">
        <div className="flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0 bg-navy-800 border border-navy-700">
          <User className="w-4 h-4 text-navy-400" />
        </div>
        <motion.div
          animate={{
            display: animate ? (open ? "block" : "none") : "block",
            opacity: animate ? (open ? 1 : 0) : 1,
          }}
          className="min-w-0 overflow-hidden"
        >
          <div className="text-sm font-semibold text-white leading-tight truncate">
            {workspaceName}
          </div>
          <div className="text-xs text-navy-400 leading-tight truncate">
            {userName} · {userRole}
          </div>
        </motion.div>
      </div>
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
        <span className="w-2 h-2 rounded-full bg-success flex-shrink-0" />
        <span className="text-xs font-medium text-navy-300">Workspace Active</span>
      </div>
    </motion.div>
  );
};
