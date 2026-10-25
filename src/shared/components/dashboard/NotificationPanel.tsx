"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  BellOff,
  CheckCheck,
  X,
  Search,
  Building2,
  Home,
  FileText,
  Receipt,
  Users,
  Wrench,
  Activity,
  Settings,
  ChevronRight,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useNotificationStore, type AppNotification } from "@/stores/notification-store";
import { timeAgo } from "@/features/activity/utils/activity-display";

const ENTITY_FILTERS = [
  { value: "", label: "All" },
  { value: "Property", label: "Properties" },
  { value: "Unit", label: "Units" },
  { value: "Lease", label: "Leases" },
  { value: "MaintenanceRequest", label: "Maintenance" },
] as const;

type EntityFilter = "" | "Property" | "Unit" | "Lease" | "MaintenanceRequest";

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

function groupByTime(notifications: AppNotification[]): Record<string, AppNotification[]> {
  const groups: Record<string, AppNotification[]> = {};
  const now = new Date();
  const today = now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  for (const n of notifications) {
    const date = new Date(n.createdAt);
    let key: string;
    if (date.toDateString() === today) {
      key = "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      key = "Yesterday";
    } else if (date >= startOfWeek) {
      key = "Earlier this week";
    } else {
      key = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
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
    isConnected,
    markAsRead,
    markAllAsRead,
    setOpen,
  } = useNotificationStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [entityFilter, setEntityFilter] = useState<EntityFilter>("");
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const panelRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Track newly-arrived notifications for the flash animation
  const prevNotificationIds = useRef<Set<string>>(new Set(notifications.map((n) => n.id)));
  useEffect(() => {
    const currentIds = new Set(notifications.map((n) => n.id));
    const arrived = new Set<string>();
    for (const id of currentIds) {
      if (!prevNotificationIds.current.has(id)) arrived.add(id);
    }
    prevNotificationIds.current = currentIds;
    if (arrived.size === 0) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNewIds(arrived);
    const t = setTimeout(() => setNewIds(new Set()), 2000);
    return () => clearTimeout(t);
  }, [notifications]);

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
    if (entityFilter && n.entityType !== entityFilter) return false;
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

  const handleNotificationClick = useCallback(
    (notification: AppNotification) => {
      markAsRead(notification.id);
      if (notification.href) {
        setOpen(false);
        router.push(notification.href);
      }
    },
    [markAsRead, setOpen, router]
  );

  const activeEntityFilterCount = entityFilter ? 1 : 0;
  const activeFilterCount = activeEntityFilterCount + (filter === "unread" ? 1 : 0);

  if (!isOpen) return null;

  const hasNoNotificationsAtAll = notifications.length === 0;
  const hasNoResultsForFilter = filtered.length === 0 && !hasNoNotificationsAtAll;

  return (
    <div
      ref={panelRef}
      className="absolute top-full right-0 mt-2 w-[28rem] max-h-[36rem] flex flex-col bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-2xl shadow-dropdown z-50 animate-scale-in origin-top-right"
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
          {/* SSE connection indicator */}
          <div className="flex items-center gap-1 ml-1">
            {isConnected ? (
              <span className="flex items-center gap-1 text-[10px] text-success-dark dark:text-success font-medium">
                <Wifi className="h-3 w-3" strokeWidth={2} />
                Live
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] text-fg-subtle dark:text-fg-subtle-dark">
                <WifiOff className="h-3 w-3" strokeWidth={2} />
                Connecting
              </span>
            )}
          </div>
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

        {/* Read filter */}
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
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={() => { setFilter("all"); setEntityFilter(""); setSearchQuery(""); }}
                className="text-[10px] text-danger hover:underline"
              >
                Clear filters
              </button>
            )}
            <span className="text-[10px] text-fg-subtle dark:text-fg-subtle-dark">
              {notifications.length} total
            </span>
          </div>
        </div>

        {/* Entity type filter */}
        <div className="flex items-center gap-1 flex-wrap">
          {ENTITY_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setEntityFilter(f.value as EntityFilter)}
              className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-all ${
                entityFilter === f.value
                  ? "bg-brand text-white"
                  : "bg-border-subtle/70 dark:bg-border-subtle-dark/70 text-fg-muted hover:text-fg hover:bg-border-subtle dark:hover:bg-border-subtle-dark"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-border-subtle dark:bg-border-subtle-dark mb-3">
              {searchQuery || hasNoResultsForFilter ? (
                <Search className="h-5 w-5 text-fg-muted dark:text-fg-muted-dark" strokeWidth={1.5} />
              ) : (
                <BellOff className="h-5 w-5 text-fg-muted dark:text-fg-muted-dark" strokeWidth={1.5} />
              )}
            </div>
            <p className="text-sm font-semibold text-fg dark:text-fg-dark mb-1">
              {hasNoNotificationsAtAll
                ? "No notifications yet"
                : searchQuery
                ? "No results found"
                : filter === "unread"
                ? "All caught up"
                : "No notifications match"}
            </p>
            <p className="text-xs text-fg-muted dark:text-fg-muted-dark max-w-[16rem]">
              {hasNoNotificationsAtAll
                ? "Activity will appear here as you manage your properties, units, and leases."
                : searchQuery
                ? "Try a different search term or clear the filters."
                : filter === "unread"
                ? "You have no unread notifications."
                : "Try adjusting your filters."}
            </p>
          </div>
        ) : (
          <div className="py-1">
            {Object.entries(grouped).map(([group, items]) => (
              <div key={group}>
                <p className="px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-fg-subtle dark:text-fg-subtle-dark">
                  {group}
                </p>
                {items.map((notification) => {
                  const isNew = newIds.has(notification.id);
                  const label = timeAgo(notification.createdAt);

                  return (
                    <div
                      key={notification.id}
                      className={`relative flex items-start gap-3 px-4 py-3 transition-all duration-150 cursor-pointer group ${
                        isNew
                          ? "animate-pulse-once bg-brand-50/60 dark:bg-brand-900/20"
                          : !notification.read
                          ? "bg-brand-50/30 dark:bg-brand-900/10"
                          : "hover:bg-border-subtle/50 dark:hover:bg-border-subtle-dark/50"
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleNotificationClick(notification);
                        }
                      }}
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
                          {label && (
                            <span className="text-[10px] text-fg-subtle dark:text-fg-subtle-dark">
                              {label}
                            </span>
                          )}
                          {notification.href && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-brand">
                              View
                              <ChevronRight className="h-2.5 w-2.5" strokeWidth={2.5} />
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center gap-1">
                        {!notification.read && (
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
                        )}
                      </div>
                    </div>
                  );
                })}
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
