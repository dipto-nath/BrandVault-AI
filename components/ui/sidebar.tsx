"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState, createContext, useContext } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Menu,
  X,
  LayoutDashboard,
  ClipboardList,
  BookOpen,
  FileCheck2,
  BarChart2,
  Settings,
  Shield,
  FileText,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";

export interface NavLink {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
  isHovered: boolean;
  setIsHovered: React.Dispatch<React.SetStateAction<boolean>>;
  pinned: boolean;
  setPinned: React.Dispatch<React.SetStateAction<boolean>>;
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
  const [isHovered, setIsHovered] = useState(false);
  const [pinned, setPinned] = useState(false);

  // If pinned, open is true. If not pinned, open reflects hover state or openProp
  const effectiveOpen = pinned ? true : (isHovered || (openProp !== undefined ? openProp : openState));
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider
      value={{
        open: effectiveOpen,
        setOpen,
        animate,
        isHovered,
        setIsHovered,
        pinned,
        setPinned,
      }}
    >
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

export const SidebarBody = (props: Omit<React.ComponentProps<typeof motion.div>, "children"> & { children?: React.ReactNode }) => {
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
}: Omit<React.ComponentProps<typeof motion.div>, "children"> & { children?: React.ReactNode }) => {
  const { open, setIsHovered, pinned, setPinned } = useSidebar();

  return (
    <motion.aside
      className={cn(
        "h-full px-3 py-4 hidden lg:flex lg:flex-col bg-surface-2 border-r border-line flex-shrink-0 relative select-none shadow-sm",
        className
      )}
      initial={false}
      animate={{
        width: open ? 250 : 68,
      }}
      transition={{
        duration: 0.28,
        ease: [0.22, 1, 0.36, 1], // fluid cubic-bezier slide
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    >
      {children}

      {/* Pin / Toggle tab on edge */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setPinned(!pinned);
        }}
        className={cn(
          "absolute -right-3 top-7 w-6 h-6 rounded-full bg-surface border border-line flex items-center justify-center text-ink-3 hover:text-brand hover:border-brand shadow-xs transition-all z-40 focus-ring cursor-pointer",
          !open && "opacity-0 pointer-events-none hover:opacity-100 group-hover:opacity-100"
        )}
        title={pinned ? "Unpin sidebar (slide on hover)" : "Pin sidebar open"}
        aria-label={pinned ? "Unpin sidebar" : "Pin sidebar open"}
        aria-expanded={pinned}
      >
        <motion.div
          animate={{ rotate: pinned ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </motion.div>
      </button>
    </motion.aside>
  );
};

export const MobileSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) => {
  const { open, setOpen } = useSidebar();
  return (
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
  );
};

export const SidebarLink = ({
  link,
  onClick,
}: {
  link: NavLink;
  onClick?: () => void;
}) => {
  const { open } = useSidebar();
  const pathname = usePathname();
  const isActive =
    pathname === link.href ||
    (link.href !== "/overview" && pathname.startsWith(link.href + "/"));

  return (
    <Link
      href={link.href}
      onClick={onClick}
      className={cn(
        "group relative flex items-center h-10 rounded-lg transition-all duration-200 focus-ring overflow-hidden",
        open ? "px-3 gap-3" : "px-0 justify-center",
        isActive
          ? "bg-brand text-white shadow-sm shadow-brand/20 font-semibold"
          : "text-ink-2 hover:text-ink hover:bg-surface/80"
      )}
      title={!open ? link.label : undefined}
    >
      {/* Icon with smooth scale / transition */}
      <span className={cn(
        "w-5 h-5 flex items-center justify-center shrink-0 transition-transform duration-200",
        isActive ? "text-white" : "text-ink-3 group-hover:text-ink group-hover:scale-105"
      )}>
        {link.icon}
      </span>

      {/* Sliding text label */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="text-sm font-medium whitespace-nowrap overflow-hidden leading-none tracking-normal truncate"
          >
            {link.label}
          </motion.span>
        )}
      </AnimatePresence>

      {/* Active pill indicator when collapsed */}
      {isActive && !open && (
        <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-brand rounded-r" />
      )}
    </Link>
  );
};

export const NAV_LINKS: NavLink[] = [
  { href: "/overview", label: "Overview", icon: <LayoutDashboard className="w-5 h-5 shrink-0" /> },
  { href: "/reviews", label: "Content Reviews", icon: <ClipboardList className="w-5 h-5 shrink-0" /> },
  { href: "/findings", label: "Findings", icon: <FileText className="w-5 h-5 shrink-0" /> },
  { href: "/guidelines", label: "Brand Guidelines", icon: <Shield className="w-5 h-5 shrink-0" /> },
  { href: "/knowledge", label: "Approved Knowledge", icon: <BookOpen className="w-5 h-5 shrink-0" /> },
  { href: "/passports", label: "Evidence Passports", icon: <FileCheck2 className="w-5 h-5 shrink-0" /> },
  { href: "/insights", label: "Governance Insights", icon: <BarChart2 className="w-5 h-5 shrink-0" /> },
  { href: "/settings", label: "Settings", icon: <Settings className="w-5 h-5 shrink-0" /> },
];

export const Logo = () => {
  const { open } = useSidebar();
  return (
    <Link
      href="/overview"
      className={cn(
        "flex items-center h-11 rounded-lg transition-all duration-200 mb-4 relative z-20 overflow-hidden",
        open ? "px-2 gap-3" : "px-0 justify-center"
      )}
    >
      <div className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0 bg-brand text-white shadow-md shadow-brand/25 transition-transform duration-200 hover:scale-105">
        <Shield className="w-5 h-5 text-white" />
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex items-center gap-1.5 truncate"
          >
            <span className="font-bold text-base tracking-tight text-ink font-serif">
              BrandVault
            </span>
            <span className="text-[10px] font-bold bg-brand-soft text-brand px-1.5 py-0.5 rounded-full uppercase tracking-wider font-sans">
              AI
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </Link>
  );
};

export const LogoIcon = () => {
  return (
    <Link
      href="/overview"
      className="flex items-center justify-center h-11 mb-4 relative z-20"
    >
      <div className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0 bg-brand text-white shadow-md shadow-brand/25">
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
  const { open } = useSidebar();

  return (
    <div className="mt-auto pt-3 border-t border-line">
      <div className={cn(
        "flex items-center transition-all duration-200 rounded-lg p-1.5",
        open ? "gap-2.5" : "justify-center"
      )}>
        <div className="flex items-center justify-center w-8 h-8 rounded-full shrink-0 bg-surface border border-line text-brand font-bold text-xs shadow-2xs">
          <Shield className="w-4 h-4 text-brand" />
        </div>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="min-w-0 overflow-hidden leading-tight flex-1"
            >
              <div className="text-xs font-bold text-ink truncate">
                {workspaceName}
              </div>
              <div className="text-[11px] text-ink-3 truncate mt-0.5">
                {userName} · {userRole}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="font-handwritten text-[11px] text-ink-3 italic mt-2 text-center">
              "Verify. Validate. Build trust."
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
