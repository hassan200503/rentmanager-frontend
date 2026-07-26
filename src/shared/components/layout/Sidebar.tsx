"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  LayoutDashboard,
  Building2,
  Receipt,
  ClipboardList,
  Users,
  Smartphone,
  UserCog,
  Settings,
  Archive,
  Menu,
  X,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useCurrentUser } from "@/features/user/hooks/use-current-user";
import { BrandBadge } from "@/shared/components/brand";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Portfolio", icon: LayoutDashboard },
  { href: "/dashboard/properties", label: "Properties", icon: Building2 },
  { href: "/dashboard/payments", label: "Payments", icon: Receipt },
  { href: "/dashboard/rent-ledger", label: "Rent Ledger", icon: ClipboardList },
  { href: "/dashboard/leases", label: "Tenants", icon: Users },
  { href: "/daraja/config", label: "M-Pesa", icon: Smartphone },
  { href: "/dashboard/team", label: "Team", icon: UserCog },
];

const secondaryNavItems: NavItem[] = [
  { href: "/dashboard/archive", label: "Archived", icon: Archive },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

function isItemActive(pathname: string | null, href: string) {
  if (href === "/dashboard") return pathname === href;
  return pathname?.startsWith(href) ?? false;
}

function NavLink({
  item,
  active,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      title={collapsed ? item.label : undefined}
      className={`group relative flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-150 ${
        collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2"
      } ${
        active
          ? "text-brand-800 dark:text-brand-300"
          : "text-fg-muted hover:text-fg dark:text-fg-muted-dark dark:hover:text-fg-dark"
      }`}
    >
      {/* Active pill background */}
      {active && (
        <span className="absolute inset-0 rounded-xl bg-brand-50 dark:bg-brand-900/30 shadow-sm" />
      )}

      {/* Icon */}
      <span
        className={`relative shrink-0 transition-all duration-150 ${
          active
            ? "text-brand dark:text-brand-400"
            : "text-fg-subtle dark:text-fg-subtle-dark group-hover:text-fg-muted dark:group-hover:text-fg-muted-dark"
        }`}
      >
        <Icon className="h-[1.125rem] w-[1.125rem]" strokeWidth={active ? 2.5 : 2} />
      </span>

      {/* Label */}
      {!collapsed && <span className="relative">{item.label}</span>}
    </Link>
  );
}

function SidebarBody({
  collapsed,
  onToggle,
  onNavigate,
}: {
  collapsed: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { user } = useCurrentUser();
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ");

  const initials =
    [user?.firstName, user?.lastName]
      .filter((part): part is string => Boolean(part))
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "?";

  return (
    <>
      {/* Logo / brand */}
      <div
        className={`h-14 flex items-center shrink-0 border-b border-border dark:border-border-dark ${
          collapsed ? "justify-center px-2" : "gap-3 px-4"
        }`}
      >
        {!collapsed && <BrandBadge size="md" />}
        {collapsed && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-900/30">
            <BrandBadge size="sm" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-0.5 custom-scrollbar">
        {!collapsed && (
          <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-widest text-fg-subtle dark:text-fg-subtle-dark">
            Main
          </p>
        )}
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            active={isItemActive(pathname, item.href)}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
        ))}

        <div className={`my-3 h-px bg-border dark:bg-border-dark ${collapsed ? "mx-2" : ""}`} aria-hidden />

        {!collapsed && (
          <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-widest text-fg-subtle dark:text-fg-subtle-dark">
            Workspace
          </p>
        )}
        {secondaryNavItems.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            active={isItemActive(pathname, item.href)}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      {/* Collapse toggle (desktop only) */}
      <div className="hidden md:flex px-2 pb-2 shrink-0">
        <button
          type="button"
          onClick={onToggle}
          className="flex w-full items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-fg-subtle dark:text-fg-subtle-dark hover:text-fg-muted dark:hover:text-fg-muted-dark hover:bg-border-subtle dark:hover:bg-border-subtle-dark transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
          ) : (
            <>
              <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2} />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>

      {/* User section */}
      <div
        className={`border-t border-border dark:border-border-dark shrink-0 p-3 ${
          collapsed ? "space-y-2" : "space-y-3"
        }`}
      >
        <div
          className={`flex items-center rounded-xl bg-brand-50/50 dark:bg-brand-900/15 border border-brand-100/50 dark:border-brand-800/30 ${
            collapsed ? "justify-center p-2" : "gap-3 px-2 py-2"
          }`}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-800 text-[13px] font-semibold text-brand-700 dark:text-brand-300 ring-2 ring-brand-50 dark:ring-brand-900/20">
            {initials}
          </div>
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-fg dark:text-fg-dark">{fullName || "Account"}</p>
                <p className="truncate text-[11px] text-fg-muted dark:text-fg-muted-dark">{user?.email ?? ""}</p>
              </div>
              <button
                type="button"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                aria-label="Toggle theme"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-fg-subtle dark:text-fg-subtle-dark hover:text-fg dark:hover:text-fg-dark hover:bg-border-subtle dark:hover:bg-border-subtle-dark transition-colors"
              >
                {mounted && theme === "dark" ? (
                  <Sun className="h-3.5 w-3.5" strokeWidth={2} />
                ) : (
                  <Moon className="h-3.5 w-3.5" strokeWidth={2} />
                )}
              </button>
            </>
          )}
          {collapsed && (
            <button
              type="button"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-fg-subtle dark:text-fg-subtle-dark hover:text-fg dark:hover:text-fg-dark hover:bg-border-subtle dark:hover:bg-border-subtle-dark transition-colors"
            >
              {mounted && theme === "dark" ? (
                <Sun className="h-3.5 w-3.5" strokeWidth={2} />
              ) : (
                <Moon className="h-3.5 w-3.5" strokeWidth={2} />
              )}
            </button>
          )}
        </div>
      </div>
    </>
  );
}

/* ── Mobile Bottom Tab Bar ───────────────────────────────────── */
function MobileTabBar() {
  const pathname = usePathname();
  const primaryTabs = navItems.slice(0, 5);

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-surface/90 dark:bg-surface-dark/90 backdrop-blur-lg border-t border-border dark:border-border-dark safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {primaryTabs.map((item) => {
          const active = isItemActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-colors min-w-[3.5rem] ${
                active
                  ? "text-brand dark:text-brand-400"
                  : "text-fg-subtle dark:text-fg-subtle-dark"
              }`}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 1.75} />
              <span className={`text-[10px] leading-tight ${active ? "font-semibold" : "font-medium"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/* ── Desktop Sidebar ─────────────────────────────────────────── */
export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex flex-col bg-surface dark:bg-surface-dark border-r border-border dark:border-border-dark shrink-0 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{ width: collapsed ? "4.5rem" : "15rem" }}
      >
        <SidebarBody collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      </aside>

      {/* Mobile hamburger */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation"
        className="md:hidden fixed top-3 left-3 z-40 flex h-9 w-9 items-center justify-center rounded-xl bg-surface dark:bg-surface-dark border border-border dark:border-border-dark text-fg-muted dark:text-fg-muted-dark shadow-card"
      >
        <Menu className="h-4.5 w-4.5" strokeWidth={2} />
      </button>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <aside className="relative w-60 flex flex-col bg-surface dark:bg-surface-dark border-r border-border dark:border-border-dark shadow-dropdown">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation"
              className="absolute top-4 right-3 flex h-8 w-8 items-center justify-center rounded-lg text-fg-muted dark:text-fg-muted-dark hover:bg-border-subtle dark:hover:bg-border-subtle-dark"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </button>
            <SidebarBody collapsed={false} onToggle={() => setMobileOpen(false)} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Mobile bottom tab bar */}
      <MobileTabBar />
    </>
  );
}
