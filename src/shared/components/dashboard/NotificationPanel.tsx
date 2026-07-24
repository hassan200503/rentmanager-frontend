"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Bell,
  BellOff,
  CheckCheck,
  Archive,
  X,
  Search,
  Building2,
  Home,
  FileText,
  Receipt,
  Users,
  Wrench,
  Activity,
  AlertTriangle,
  Info,
  CheckCircle2,
  Settings,
  ExternalLink,
  ChevronRight,
  Filter,
  Clock,
} from "lucide-react";
import { useNotificationStore, type AppNotification } from "@/stores/notification-store";

function NotificationIcon({ type, color }: { type: string; color: string }) {
  const iconMap: Record<string, typeof Bell> = {
    Building2,
    Home,
    FileText,
    Receipt,
    Users,
    Wrench,
    Activity,
  };
  const Icon = iconMap[type] ?? Activity;
  return (
    <div
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
      style={{ backgroundColor: `${color}15` }}
    >
      <Icon className="h-4 w-4" strokeWidth={1.75} style={{ color }} />
    </div>
  );
}

function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.round(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.round(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  const diffMonths = Math.round(diffDays / 30);
  return `${diffMonths}mo ago`;
}

function groupByTime(notifications: AppNotification[]): Record<string, AppNotification[]> {
  const groups: Record<string, AppNotification[]> = {};
  const now = new Date();
  const today = now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  for (const n of notifications) {
    const date = new Date(n.createdAt);
    let key: string;
    if (date.toDateString() === today) key = "Today";
    else if (date.toDateString() === yesterday.toDateString()) key = "Yesterday";
    else {
      const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays < 7) key = "Earlier this week";
      else key = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
    if (!groups[key]) groups[key] = [];
    groups[key].push(n);
  }
  return groups;
}

export default function NotificationPanel() {
  const {
    notifications,
    unreadCount,
    isOpen,
    markAsRead,
    markAllAsRead,
    setOpen,
  } = useNotificationStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const panelRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, setOpen]);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const filtered = notifications.filter((n) => {
    if (filter === "unread" && n.read) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        n.title.toLowerCase().includes(q) ||
        n.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const grouped = groupByTime(filtered);

  const handleMarkAllRead = useCallback(() => {
    markAllAsRead();
  }, [markAllAsRead]);

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className="absolute top-full right-0 mt-2 w-[28rem] max-h-[32rem] flex flex-col bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-2xl shadow-dropdown z-50 animate-scale-in origin-top-right"
      role="dialog"
      aria-label="Notifications"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border dark:border-border-dark">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-fg dark:text-fg-dark">Notifications</h2>
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center h-5 min-w-[1.25rem] px-1.5 rounded-full bg-danger text-[10px] font-bold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-fg-muted hover:text-fg hover:bg-border-subtle dark:hover:bg-border-subtle-dark transition-colors"
              aria-label="Mark all as read"
            >
              <CheckCheck className="h-3 w-3" strokeWidth={2} />
              Mark read
            </button>
          )}
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-fg-muted hover:text-fg hover:bg-border-subtle dark:hover:bg-border-subtle-dark transition-colors"
            aria-label="Close notifications"
          >
            <X className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="px-4 pt-3 pb-2 space-y-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-fg-muted dark:text-fg-muted-dark pointer-events-none" strokeWidth={2} />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-border-subtle/60 dark:bg-border-subtle-dark/60 border border-transparent focus:border-brand/50 outline-none text-fg dark:text-fg-dark placeholder:text-fg-subtle dark:placeholder:text-fg-subtle-dark transition-colors"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
              filter === "all"
                ? "bg-surface dark:bg-surface-dark text-fg shadow-sm border border-border dark:border-border-dark"
                : "text-fg-muted hover:text-fg"
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setFilter("unread")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
              filter === "unread"
                ? "bg-surface dark:bg-surface-dark text-fg shadow-sm border border-border dark:border-border-dark"
                : "text-fg-muted hover:text-fg"
            }`}
          >
            Unread {unreadCount > 0 && `(${unreadCount})`}
          </button>
          <div className="ml-auto flex items-center gap-1">
            <span className="text-[10px] text-fg-subtle dark:text-fg-subtle-dark">
              {notifications.length} total
            </span>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-border-subtle dark:bg-border-subtle-dark mb-3">
              {searchQuery ? (
                <Search className="h-5 w-5 text-fg-muted dark:text-fg-muted-dark" strokeWidth={1.5} />
              ) : (
                <BellOff className="h-5 w-5 text-fg-muted dark:text-fg-muted-dark" strokeWidth={1.5} />
              )}
            </div>
            <p className="text-sm font-semibold text-fg dark:text-fg-dark mb-1">
              {searchQuery ? "No results found" : "All caught up"}
            </p>
            <p className="text-xs text-fg-muted dark:text-fg-muted-dark max-w-[16rem]">
              {searchQuery
                ? "Try a different search term or filter."
                : "You have no unread notifications. We'll notify you when something happens."}
            </p>
          </div>
        ) : (
          <div className="py-1">
            {Object.entries(grouped).map(([group, items]) => (
              <div key={group}>
                <p className="px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-fg-subtle dark:text-fg-subtle-dark">
                  {group}
                </p>
                {items.map((notification) => (
                  <div
                    key={notification.id}
                    className={`relative flex items-start gap-3 px-4 py-3 transition-all duration-150 cursor-pointer group ${
                      !notification.read
                        ? "bg-brand-50/30 dark:bg-brand-900/10"
                        : "hover:bg-border-subtle/50 dark:hover:bg-border-subtle-dark/50"
                    }`}
                    onClick={() => markAsRead(notification.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === "Enter") markAsRead(notification.id); }}
                  >
                    {!notification.read && (
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-brand" />
                    )}
                    <NotificationIcon type={notification.icon} color={notification.color} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs ${!notification.read ? "font-semibold text-fg dark:text-fg-dark" : "font-medium text-fg-muted dark:text-fg-muted-dark"}`}>
                        {notification.title}
                      </p>
                      <p className="text-[11px] text-fg-subtle dark:text-fg-subtle-dark mt-0.5">
                        {notification.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-fg-subtle dark:text-fg-subtle-dark">
                          {timeAgo(notification.createdAt)}
                        </span>
                        {notification.href && (
                          <Link
                            href={notification.href}
                            className="inline-flex items-center gap-0.5 text-[10px] font-medium text-brand hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            View
                            <ExternalLink className="h-2.5 w-2.5" strokeWidth={2.5} />
                          </Link>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 flex h-6 w-6 items-center justify-center rounded-lg text-fg-subtle hover:text-fg hover:bg-border-subtle dark:hover:bg-border-subtle-dark transition-all"
                        aria-label="Mark as read"
                      >
                        <CheckCheck className="h-3 w-3" strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border dark:border-border-dark flex items-center justify-between">
        <Link
          href="/dashboard/activity"
          onClick={() => setOpen(false)}
          className="text-[11px] font-medium text-fg-muted hover:text-fg transition-colors inline-flex items-center gap-1"
        >
          View all activity
          <ChevronRight className="h-3 w-3" strokeWidth={2} />
        </Link>
        <Link
          href="/dashboard/settings"
          onClick={() => setOpen(false)}
          className="text-[11px] font-medium text-fg-muted hover:text-fg transition-colors inline-flex items-center gap-1"
        >
          <Settings className="h-3 w-3" strokeWidth={1.75} />
          Settings
        </Link>
      </div>
    </div>
  );
}