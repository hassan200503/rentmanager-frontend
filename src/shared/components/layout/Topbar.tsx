"use client";

import { Search, Bell, HelpCircle, Settings, Command, Keyboard } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { useOrgStore } from "@/stores/org-store";
import { useState, useEffect } from "react";
import NotificationPanel from "@/shared/components/dashboard/NotificationPanel";
import { useNotificationStore } from "@/stores/notification-store";

export default function Topbar() {
  const tenantName = useOrgStore((state) => state.tenantName);
  const [currentTime, setCurrentTime] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  const { unreadCount, isOpen, toggleOpen, setOpen } = useNotificationStore();

  useEffect(() => {
    setCurrentTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-14 bg-surface/80 dark:bg-surface-dark/80 backdrop-blur-md border-b border-border dark:border-border-dark flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-fg-muted dark:text-fg-muted-dark pointer-events-none" strokeWidth={2} />
          <input
            type="text"
            placeholder="Search anything..."
            className="form-input !pl-9 !text-xs !py-1.5 !rounded-xl !bg-border-subtle/60 dark:!bg-border-subtle-dark/60 !border-transparent focus:!border-brand/50 !max-w-xs !h-9"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          {!searchFocused && (
            <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-surface dark:bg-surface-dark border border-border dark:border-border-dark text-[10px] font-medium text-fg-subtle dark:text-fg-subtle-dark shadow-sm">
              <Command className="h-2.5 w-2.5" strokeWidth={2} />
              K
            </kbd>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-2 text-xs text-fg-muted dark:text-fg-muted-dark mr-1">
          <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-border-subtle/50 dark:bg-border-subtle-dark/50">
            <span className="status-dot-success status-dot-live" />
            <span className="font-medium text-fg dark:text-fg-dark">{tenantName ?? "RentManager"}</span>
          </span>
          <span className="text-fg-subtle dark:text-fg-subtle-dark text-[11px]">{currentTime}</span>
        </div>

        <div className="h-4 w-px bg-border dark:bg-border-dark hidden sm:block" />

        {/* Notification Bell */}
        <div className="relative">
          <button
            type="button"
            onClick={toggleOpen}
            className="relative flex h-8 w-8 items-center justify-center rounded-lg hover:bg-border-subtle dark:hover:bg-border-subtle-dark transition-colors"
            aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
          >
            <Bell className="h-4 w-4 text-fg-muted dark:text-fg-muted-dark" strokeWidth={1.75} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center h-4 min-w-[1rem] px-1 rounded-full bg-danger text-[9px] font-bold text-white ring-2 ring-surface dark:ring-surface-dark animate-scale-in">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
          <NotificationPanel />
        </div>

        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-border-subtle dark:hover:bg-border-subtle-dark transition-colors"
          aria-label="Help"
        >
          <HelpCircle className="h-4 w-4 text-fg-muted dark:text-fg-muted-dark" strokeWidth={1.75} />
        </button>

        <button
          type="button"
          className="hidden sm:flex h-8 w-8 items-center justify-center rounded-lg hover:bg-border-subtle dark:hover:bg-border-subtle-dark transition-colors"
          aria-label="Settings"
        >
          <Settings className="h-4 w-4 text-fg-muted dark:text-fg-muted-dark" strokeWidth={1.75} />
        </button>

        <div className="h-4 w-px bg-border dark:bg-border-dark" />

        <UserButton
          appearance={{
            elements: {
              avatarBox: "w-7 h-7",
              userButtonPopoverCard: "shadow-dropdown border border-border dark:border-border-dark rounded-xl",
            },
          }}
        />
      </div>
    </header>
  );
}