/**
 * Premium UI Components for Tenant Portal
 * 
 * Reusable, production-ready components with modern SaaS-grade styling.
 * All components follow accessibility best practices and support dark mode.
 */

import { type LucideIcon } from "lucide-react";
import { type ReactNode, useId } from "react";

/* ══════════════════════════════════════════════════════════════
   MetricCard - Premium KPI Display Card
   ══════════════════════════════════════════════════════════════ */

export interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
  tone?: "brand" | "success" | "warning" | "danger" | "neutral";
  className?: string;
  animationDelay?: number;
}

export const MetricCard = ({
  icon: Icon,
  label,
  value,
  hint,
  tone = "neutral",
  className = "",
  animationDelay = 0,
}: MetricCardProps) => {
  return (
    <div
      className={`tenant-kpi-card tenant-kpi-${tone} tenant-kpi-premium ${className}`}
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <div className="tenant-kpi-icon tenant-kpi-icon-premium">
        <Icon className="h-[1.05rem] w-[1.05rem]" strokeWidth={1.9} aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="tenant-kpi-label">{label}</p>
        <p className="tenant-kpi-value" aria-live="polite">
          {value}
        </p>
        {hint && <p className="tenant-kpi-hint">{hint}</p>}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   PremiumButton - Enhanced Button with Gradient and Animations
   ══════════════════════════════════════════════════════════════ */

export interface PremiumButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "blue" | "danger";
  size?: "sm" | "md" | "lg";
  icon?: LucideIcon;
  iconPosition?: "left" | "right";
  loading?: boolean;
  children: ReactNode;
}

export const PremiumButton = ({
  variant = "primary",
  size = "md",
  icon: Icon,
  iconPosition = "left",
  loading = false,
  children,
  className = "",
  disabled,
  ...props
}: PremiumButtonProps) => {
  const baseClasses = "inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all";
  
  const variantClasses = {
    primary: "tenant-btn-premium-primary text-white",
    blue: "tenant-btn-premium-blue text-white",
    secondary: "tenant-btn-premium-secondary",
    danger: "bg-gradient-to-br from-danger-700 to-danger-500 text-white shadow-premium-md hover:shadow-premium-lg",
  };
  
  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2.5 text-sm",
    lg: "px-6 py-3 text-base",
  };

  const isDisabled = disabled || loading;

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={isDisabled}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {!loading && Icon && iconPosition === "left" && (
        <Icon className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
      )}
      <span>{children}</span>
      {!loading && Icon && iconPosition === "right" && (
        <Icon className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
      )}
    </button>
  );
};

/* ══════════════════════════════════════════════════════════════
   PremiumInput - Enhanced Input Field with Focus Effects
   ══════════════════════════════════════════════════════════════ */

export interface PremiumInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: LucideIcon;
  iconPosition?: "left" | "right";
}

export const PremiumInput = ({
  label,
  error,
  hint,
  icon: Icon,
  iconPosition = "left",
  className = "",
  id,
  ...props
}: PremiumInputProps) => {
  const generatedId = useId();
  const inputId = id || generatedId;

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="tenant-field-label">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && iconPosition === "left" && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted dark:text-fg-muted-dark">
            <Icon className="h-4 w-4" strokeWidth={1.9} aria-hidden="true" />
          </div>
        )}
        <input
          id={inputId}
          className={`tenant-input tenant-input-premium w-full ${
            Icon && iconPosition === "left" ? "pl-10" : ""
          } ${Icon && iconPosition === "right" ? "pr-10" : ""} ${
            error ? "border-danger focus:border-danger focus:shadow-danger/12" : ""
          } ${className}`}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        />
        {Icon && iconPosition === "right" && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-muted dark:text-fg-muted-dark">
            <Icon className="h-4 w-4" strokeWidth={1.9} aria-hidden="true" />
          </div>
        )}
      </div>
      {error && (
        <p id={`${inputId}-error`} className="text-xs text-danger" role="alert">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${inputId}-hint`} className="text-xs text-fg-muted dark:text-fg-muted-dark">
          {hint}
        </p>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   StatusBadge - Premium Status Indicator with Animations
   ══════════════════════════════════════════════════════════════ */

export interface StatusBadgeProps {
  status: string;
  showDot?: boolean;
  className?: string;
}

export const StatusBadge = ({ status, showDot = false, className = "" }: StatusBadgeProps) => {
  const normalized = status?.toUpperCase?.() ?? "";
  
  let tone = "neutral";
  if (["ACTIVE", "PAID", "COMPLETED", "OVERPAID", "APPROVED"].includes(normalized)) {
    tone = "success";
  } else if (["OVERDUE", "TERMINATED", "FAILED", "REJECTED"].includes(normalized)) {
    tone = "danger";
  } else if (["PENDING", "DUE", "PARTIALLY_PAID", "PARTIAL"].includes(normalized)) {
    tone = "warning";
  }

  const titleCaseStatus = status
    ?.toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ") || "Unknown";

  return (
    <span className={`tenant-status-chip tenant-status-chip-${tone} inline-flex ${className}`}>
      {showDot && (
        <span className={`tenant-status-dot status-${tone === "success" ? "active" : tone}`} aria-hidden="true" />
      )}
      {titleCaseStatus}
    </span>
  );
};

/* ══════════════════════════════════════════════════════════════
   PremiumPanel - Enhanced Container with Glass Effect
   ══════════════════════════════════════════════════════════════ */

export interface PremiumPanelProps {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  glass?: boolean;
}

export const PremiumPanel = ({
  title,
  subtitle,
  action,
  children,
  className = "",
  glass = false,
}: PremiumPanelProps) => {
  return (
    <section
      className={`tenant-panel tenant-panel-premium ${glass ? "tenant-glass-card" : ""} ${className}`}
    >
      {(title || subtitle || action) && (
        <div className="tenant-panel-header">
          <div>
            {subtitle && <p className="tenant-panel-kicker">{subtitle}</p>}
            {title && <h2 className="tenant-panel-title">{title}</h2>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
};

/* ══════════════════════════════════════════════════════════════
   EmptyState - Premium Empty State with Illustration
   ══════════════════════════════════════════════════════════════ */

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) => {
  return (
    <div className={`tenant-empty-state tenant-empty-state-premium ${className}`}>
      <div className="tenant-ledger-empty-icon">
        <Icon className="h-5 w-5" strokeWidth={1.7} aria-hidden="true" />
      </div>
      <div>
        <p className="tenant-empty-title">{title}</p>
        <span className="tenant-empty-copy">{description}</span>
      </div>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   LoadingSkeleton - Premium Shimmer Loading State
   ══════════════════════════════════════════════════════════════ */

export interface LoadingSkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  rounded?: boolean;
}

export const LoadingSkeleton = ({
  width,
  height = "1rem",
  className = "",
  rounded = true,
}: LoadingSkeletonProps) => {
  const style: React.CSSProperties = {
    width: typeof width === "number" ? `${width}px` : width,
    height: typeof height === "number" ? `${height}px` : height,
    borderRadius: rounded ? "0.5rem" : "0",
  };

  return <div className={`tenant-skeleton-premium ${className}`} style={style} aria-hidden="true" />;
};

/* ══════════════════════════════════════════════════════════════
   PremiumCard - Versatile Card Component with Hover Effects
   ══════════════════════════════════════════════════════════════ */

export interface PremiumCardProps {
  children: ReactNode;
  onClick?: () => void;
  hoverable?: boolean;
  className?: string;
  glass?: boolean;
}

export const PremiumCard = ({
  children,
  onClick,
  hoverable = false,
  className = "",
  glass = false,
}: PremiumCardProps) => {
  const Component = onClick ? "button" : "div";
  
  return (
    <Component
      onClick={onClick}
      className={`
        ${glass ? "tenant-glass-card" : "tenant-panel"}
        ${hoverable ? "cursor-pointer hover:border-brand/20 dark:hover:border-brand/30" : ""}
        ${className}
      `}
      type={onClick ? "button" : undefined}
    >
      {children}
    </Component>
  );
};

/* ══════════════════════════════════════════════════════════════
   PaymentStateCard - Specialized Card for Payment Flow States
   ══════════════════════════════════════════════════════════════ */

export interface PaymentStateCardProps {
  icon: LucideIcon;
  title: string;
  description: string | ReactNode;
  action?: ReactNode;
  isError?: boolean;
  isLoading?: boolean;
  className?: string;
}

export const PaymentStateCard = ({
  icon: Icon,
  title,
  description,
  action,
  isError = false,
  isLoading = false,
  className = "",
}: PaymentStateCardProps) => {
  return (
    <div
      className={`tenant-payment-state tenant-payment-state-premium ${
        isError ? "is-error" : ""
      } ${className}`}
    >
      <Icon
        className={`h-5 w-5 ${isLoading ? "animate-spin text-brand" : ""} ${
          isError ? "text-danger" : ""
        }`}
        strokeWidth={2}
        aria-hidden="true"
      />
      <div className="min-w-0">
        <p className="font-semibold text-fg dark:text-fg-dark">{title}</p>
        {typeof description === "string" ? (
          <span className="text-sm text-fg-muted dark:text-fg-muted-dark">{description}</span>
        ) : (
          description
        )}
        {action && <div className="mt-3">{action}</div>}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   BalanceCard - Premium Balance Display with Animations
   ══════════════════════════════════════════════════════════════ */

export interface BalanceCardProps {
  label: string;
  amount: number;
  currency?: string;
  tone?: "clear" | "due" | "overdue";
  description?: string;
  stats?: Array<{ label: string; value: string }>;
  icon?: LucideIcon;
  className?: string;
}

export const BalanceCard = ({
  label,
  amount,
  currency = "KES",
  tone = "clear",
  description,
  stats = [],
  icon: Icon,
  className = "",
}: BalanceCardProps) => {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency,
      maximumFractionDigits: Math.abs(value) < 1 ? 2 : 0,
    }).format(value);

  return (
    <div className={`tenant-balance-card tenant-balance-card-premium is-${tone} ${className}`}>
      <div className="tenant-balance-gradient-overlay" />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="tenant-balance-label">{label}</p>
          <p className="tenant-balance-value">{formatCurrency(amount)}</p>
        </div>
        {Icon && (
          <div className="tenant-balance-icon">
            <Icon className="h-5 w-5" strokeWidth={1.9} aria-hidden="true" />
          </div>
        )}
      </div>
      {description && <p className="tenant-balance-copy">{description}</p>}
      {stats.length > 0 && (
        <div className="tenant-balance-strip">
          {stats.map((stat, index) => (
            <span key={index}>
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
