// components/tenant-lease.tsx
"use client";

import { useTenantLeaseQuery } from "../hooks/use-tenant-portal-queries";
import { AlertTriangle, Home, Mail, Phone, Calendar, CreditCard, Shield, FileText, MapPin, User, Clock } from "lucide-react";
import { formatCurrency, formatDate } from "./tenant-dashboard";

export const TenantLeasePage = () => {
    const { data: lease, isLoading, isError, refetch } = useTenantLeaseQuery();

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="card-elevated p-6"><div className="skeleton h-8 w-1/4 mb-4" /><div className="skeleton h-32 w-full" /></div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="card-elevated p-6"><div className="skeleton h-48 w-full" /></div>
                    <div className="card-elevated p-6"><div className="skeleton h-48 w-full" /></div>
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="card p-6 text-center">
                <AlertTriangle className="h-10 w-10 mx-auto text-danger mb-3" strokeWidth={1.5} />
                <p className="text-sm font-medium text-fg dark:text-fg-dark mb-1">Failed to load lease</p>
                <button onClick={() => refetch()} className="mt-2 btn-outline btn-sm">Retry</button>
            </div>
        );
    }

    if (!lease) {
        return (
            <div className="card p-8 text-center">
                <Home className="h-12 w-12 mx-auto text-fg-muted dark:text-fg-muted-dark mb-3" strokeWidth={1.5} />
                <p className="text-sm font-medium text-fg dark:text-fg-dark mb-1">No active lease</p>
                <p className="text-xs text-fg-muted dark:text-fg-muted-dark mb-4">Your lease will appear here once your reservation is confirmed and the landlord creates the lease agreement.</p>
            </div>
        );
    }

    const {
        leaseNumber,
        startDate,
        endDate,
        monthlyRent,
        depositAmount,
        status,
        unitNumber,
        unitLabel,
        propertyName,
        propertyAddress,
        landlordName,
        landlordPhone,
        landlordEmail,
        terms,
    } = lease;

    const statusMap: Record<string, string> = {
        ACTIVE: "badge-emerald",
        EXPIRED: "badge-neutral",
        TERMINATED: "badge-danger",
        PENDING: "badge-warning",
    };
    const statusClass = statusMap[status?.toUpperCase?.()] ?? "badge-neutral";

    return (
        <div className="space-y-6">
            {/* Lease Header */}
            <div className="card-elevated p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <p className="text-xs uppercase tracking-widest text-fg-muted dark:text-fg-muted-dark">Lease</p>
                            <span className={`${statusClass} !text-[10px]`}>{status?.toLowerCase()}</span>
                        </div>
                        <h1 className="page-title !text-[1.5rem] mb-1">{propertyName}</h1>
                        <p className="page-subtitle !text-sm">{unitLabel ? `${unitNumber} · ${unitLabel}` : `Unit ${unitNumber}`}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                            <p className="kpi-label">Monthly Rent</p>
                            <p className="kpi-value font-data">{formatCurrency(monthlyRent)}</p>
                        </div>
                    </div>
                </div>

                {/* Key Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-border dark:border-border-dark">
                    <LeaseDetailItem icon={Calendar} label="Start Date" value={formatDate(startDate)} />
                    <LeaseDetailItem icon={Calendar} label="End Date" value={endDate ? formatDate(endDate) : "Ongoing"} />
                    <LeaseDetailItem icon={CreditCard} label="Deposit Paid" value={formatCurrency(depositAmount)} />
                    <LeaseDetailItem icon={Shield} label="Lease #" value={leaseNumber} />
                </div>
            </div>

            {/* Lease Terms & Landlord Contact */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Lease Terms */}
                <div className="card-elevated p-6">
                    <h3 className="section-header !text-sm !mb-4 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-brand" strokeWidth={2} />
                        Lease Terms
                    </h3>
                    <div className="prose prose-sm dark:prose-invert max-w-none text-sm text-fg-muted dark:text-fg-muted-dark">
                        {terms ? (
                            terms.split("\n").map((paragraph, i) => (
                                <p key={i} className="mb-3">{paragraph}</p>
                            ))
                        ) : (
                            <p className="text-fg-muted dark:text-fg-muted-dark">No terms provided by landlord.</p>
                        )}
                    </div>
                </div>

                {/* Landlord Contact */}
                <div className="card-elevated p-6">
                    <h3 className="section-header !text-sm !mb-4 flex items-center gap-2">
                        <User className="h-4 w-4 text-brand" strokeWidth={2} />
                        Landlord Contact
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-surface border border-border/60">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-800">
                                <User className="h-5 w-5 text-brand dark:text-brand-300" strokeWidth={2} />
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-widest text-fg-muted dark:text-fg-muted-dark">Name</p>
                                <p className="font-medium text-fg dark:text-fg-dark">{landlordName}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-surface border border-border/60">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-50 dark:bg-green-900/20">
                                <Phone className="h-5 w-5 text-green-600 dark:text-green-400" strokeWidth={2} />
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-widest text-fg-muted dark:text-fg-muted-dark">Phone</p>
                                <a href={`tel:${landlordPhone}`} className="font-medium text-fg dark:text-fg-dark hover:text-brand transition-colors">{landlordPhone}</a>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-surface border border-border/60">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20">
                                <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" strokeWidth={2} />
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-widest text-fg-muted dark:text-fg-muted-dark">Email</p>
                                <a href={`mailto:${landlordEmail}`} className="font-medium text-fg dark:text-fg-dark hover:text-brand transition-colors">{landlordEmail}</a>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-surface border border-border/60">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-900/20">
                                <MapPin className="h-5 w-5 text-amber-600 dark:text-amber-400" strokeWidth={2} />
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-widest text-fg-muted dark:text-fg-muted-dark">Property Address</p>
                                <p className="font-medium text-fg dark:text-fg-dark">{propertyAddress}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Important Dates */}
            <div className="card-elevated p-6">
                <h3 className="section-header !text-sm !mb-4 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-brand" strokeWidth={2} />
                    Important Dates
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <DateCard icon={Calendar} label="Lease Start" date={startDate} />
                    <DateCard icon={Calendar} label="Lease End" date={endDate ?? null} />
                    <DateCard icon={CreditCard} label="Rent Due" date={null} custom="1st of each month" />
                </div>
            </div>
        </div>
    );
};

const LeaseDetailItem = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) => (
    <div className="text-center">
        <div className="flex h-10 w-10 mx-auto items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-800 mb-2">
            <Icon className="h-5 w-5 text-brand dark:text-brand-300" strokeWidth={2} />
        </div>
        <p className="text-[10px] uppercase tracking-widest text-fg-muted dark:text-fg-muted-dark mb-0.5">{label}</p>
        <p className="font-medium text-fg dark:text-fg-dark text-sm">{value}</p>
    </div>
);

const DateCard = ({ icon: Icon, label, date, custom }: { icon: React.ElementType; label: string; date: string | null; custom?: string }) => (
    <div className="text-center p-4 rounded-xl bg-surface border border-border/60">
        <div className="flex h-10 w-10 mx-auto items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-800 mb-2">
            <Icon className="h-5 w-5 text-brand dark:text-brand-300" strokeWidth={2} />
        </div>
        <p className="text-[10px] uppercase tracking-widest text-fg-muted dark:text-fg-muted-dark mb-1">{label}</p>
        <p className="font-medium text-fg dark:text-fg-dark">{custom ?? (date ? formatDate(date) : "—")}</p>
    </div>
);