"use client";

import { useTenantMaintenanceRequestsQuery } from "../hooks/use-tenant-portal-queries";
import { useTenantDashboardQuery } from "../hooks/use-tenant-portal-queries";
import { useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { tenantPortalApi, type CreateMaintenanceRequest } from "../api/tenant-portal-api";
import { tenantPortalKeys } from "../hooks/tenant-portal-keys";
import { formatDate } from "./tenant-dashboard";
import {
    Wrench,
    Plus,
    Loader2,
    ChevronRight,
    X,
    AlertTriangle,
    Clock,
    CheckCircle2,
    Search,
    Building2,
    MessageSquare,
} from "lucide-react";
import { toast } from "sonner";

type ViewState = "list" | "form" | "detail";

const STATUS_META: Record<string, { label: string; icon: React.ElementType; className: string }> = {
    SUBMITTED: { label: "Submitted", icon: Clock, className: "badge-info" },
    IN_REVIEW: { label: "In Review", icon: Search, className: "badge-warning" },
    SCHEDULED: { label: "Scheduled", icon: Clock, className: "badge-emerald" },
    IN_PROGRESS: { label: "In Progress", icon: Loader2, className: "badge-warning" },
    COMPLETED: { label: "Completed", icon: CheckCircle2, className: "badge-success" },
    CANCELLED: { label: "Cancelled", icon: X, className: "badge-neutral" },
};

const PRIORITY_META: Record<string, { label: string; className: string }> = {
    LOW: { label: "Low", className: "badge-neutral" },
    MEDIUM: { label: "Medium", className: "badge-info" },
    HIGH: { label: "High", className: "badge-warning" },
    URGENT: { label: "Urgent", className: "badge-danger" },
};

const CATEGORY_ICONS: Record<string, React.ElementType> = {
    PLUMBING: Wrench,
    ELECTRICAL: AlertTriangle,
    STRUCTURAL: Building2,
    APPLIANCE: Wrench,
    PEST_CONTROL: AlertTriangle,
    GENERAL: MessageSquare,
};

function ListSkeleton() {
    return (
        <div className="page-container py-6 sm:py-8 space-y-4">
            <div className="flex items-center justify-between">
                <div className="skeleton h-8 w-48 rounded-lg" />
                <div className="skeleton h-9 w-32 rounded-lg" />
            </div>
            {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="card-elevated p-4 flex items-center gap-4">
                    <div className="skeleton h-10 w-10 rounded-lg shrink-0" />
                    <div className="flex-1 space-y-2">
                        <div className="skeleton h-4 w-48 rounded" />
                        <div className="skeleton h-3 w-32 rounded" />
                    </div>
                    <div className="skeleton h-6 w-20 rounded-full" />
                </div>
            ))}
        </div>
    );
}

export default function TenantMaintenance() {
    const [view, setView] = useState<ViewState>("list");
    const [selectedId, setSelectedId] = useState<string | null>(null);

    if (view === "form") return <MaintenanceForm onBack={() => setView("list")} />;
    if (view === "detail" && selectedId) return <MaintenanceDetail id={selectedId} onBack={() => { setView("list"); setSelectedId(null); }} />;

    return <MaintenanceList onNew={() => setView("form")} onSelect={(id) => { setSelectedId(id); setView("detail"); }} />;
}

function MaintenanceList({ onNew, onSelect }: { onNew: () => void; onSelect: (id: string) => void }) {
    const { data: requests, isLoading, error } = useTenantMaintenanceRequestsQuery();

    if (isLoading) return <ListSkeleton />;

    if (error) {
        return (
            <div className="page-container py-6 sm:py-8">
                <div className="card-elevated p-8 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-danger-bg dark:bg-danger-bg mx-auto mb-4">
                        <AlertTriangle className="h-6 w-6 text-danger" strokeWidth={1.5} />
                    </div>
                    <p className="text-sm font-medium text-fg dark:text-fg-dark">Failed to load maintenance requests</p>
                    <p className="text-xs text-fg-muted dark:text-fg-muted-dark mt-1">Please try again later</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container animate-fade-in-up py-6 sm:py-8 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl sm:text-2xl font-display font-bold text-fg dark:text-fg-dark">Maintenance</h1>
                    <p className="text-sm text-fg-muted dark:text-fg-muted-dark mt-1">Submit and track repair requests</p>
                </div>
                <button type="button" onClick={onNew} className="btn-primary">
                    <Plus className="h-4 w-4" strokeWidth={2} />
                    New Request
                </button>
            </div>

            {!requests || requests.length === 0 ? (
                <div className="card-elevated p-8 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-900/30 mx-auto mb-4">
                        <Wrench className="h-7 w-7 text-brand dark:text-brand-400" strokeWidth={1.5} />
                    </div>
                    <p className="text-base font-semibold text-fg dark:text-fg-dark">No maintenance requests</p>
                    <p className="text-sm text-fg-muted dark:text-fg-muted-dark mt-1 max-w-sm mx-auto">
                        Submit a repair request and track its progress here
                    </p>
                    <button type="button" onClick={onNew} className="btn-primary mt-5">
                        <Plus className="h-4 w-4" strokeWidth={2} />
                        Submit Request
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {requests.map((req) => {
                        const CatIcon = CATEGORY_ICONS[req.category] ?? Wrench;
                        const statusMeta = STATUS_META[req.status] ?? STATUS_META.SUBMITTED;
                        const priorityMeta = PRIORITY_META[req.priority] ?? PRIORITY_META.MEDIUM;
                        const StatusIcon = statusMeta.icon;

                        return (
                            <button
                                key={req.id}
                                type="button"
                                onClick={() => onSelect(req.id)}
                                className="card-elevated w-full text-left p-4 flex items-center gap-4 hover:-translate-y-0.5 transition-all duration-200 group"
                            >
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand dark:text-brand-400">
                                    {/* @ts-expect-error - React 19 ElementType inference issue */}
                                    <CatIcon className="h-5 w-5" strokeWidth={1.75} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-fg dark:text-fg-dark truncate">{req.title}</p>
                                    <p className="text-xs text-fg-muted dark:text-fg-muted-dark mt-0.5">
                                        {formatDate(req.createdAt)}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <span className={priorityMeta.className}>{priorityMeta.label}</span>
                                    <span className={`inline-flex items-center gap-1 ${statusMeta.className}`}>
                                        {/* @ts-expect-error - React 19 ElementType inference issue */}
                                        <StatusIcon className="h-3 w-3" strokeWidth={2} />
                                        {statusMeta.label}
                                    </span>
                                    <ChevronRight className="h-4 w-4 text-fg-subtle dark:text-fg-subtle-dark group-hover:text-brand dark:group-hover:text-brand-400 transition-colors" strokeWidth={2} />
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function MaintenanceForm({ onBack }: { onBack: () => void }) {
    const queryClient = useQueryClient();
    const { data: dashboard } = useTenantDashboardQuery();

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState<CreateMaintenanceRequest["category"]>("GENERAL");
    const [priority, setPriority] = useState<CreateMaintenanceRequest["priority"]>("MEDIUM");

    const mutation = useMutation({
        mutationFn: (payload: CreateMaintenanceRequest) => tenantPortalApi.submitMaintenanceRequest(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: tenantPortalKeys.maintenance() });
            toast.success("Maintenance request submitted");
            onBack();
        },
        onError: () => {
            toast.error("Failed to submit maintenance request");
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;
        if (!dashboard) return;

        mutation.mutate({
            title: title.trim(),
            description: description.trim() || undefined,
            category,
            priority,
        });
    };

    const CATEGORIES: { value: CreateMaintenanceRequest["category"]; label: string }[] = [
        { value: "PLUMBING", label: "Plumbing" },
        { value: "ELECTRICAL", label: "Electrical" },
        { value: "STRUCTURAL", label: "Structural" },
        { value: "APPLIANCE", label: "Appliance" },
        { value: "PEST_CONTROL", label: "Pest Control" },
        { value: "GENERAL", label: "General" },
    ];

    const PRIORITIES: { value: CreateMaintenanceRequest["priority"]; label: string }[] = [
        { value: "LOW", label: "Low" },
        { value: "MEDIUM", label: "Medium" },
        { value: "HIGH", label: "High" },
        { value: "URGENT", label: "Urgent – immediate attention needed" },
    ];

    return (
        <div className="page-container max-w-2xl mx-auto animate-fade-in-up py-6 sm:py-8">
            <div className="flex items-center gap-3 mb-6">
                <button type="button" onClick={onBack} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-border-subtle dark:hover:bg-border-subtle-dark transition-colors">
                    <ChevronRight className="h-4 w-4 rotate-180 text-fg-muted dark:text-fg-muted-dark" strokeWidth={2} />
                </button>
                <div>
                    <h1 className="text-xl sm:text-2xl font-display font-bold text-fg dark:text-fg-dark">New Request</h1>
                    <p className="text-sm text-fg-muted dark:text-fg-muted-dark mt-0.5">Describe the issue you&apos;re experiencing</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="card-elevated p-6 space-y-5">
                <div className="space-y-1.5">
                    <label className="form-label">Title *</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Leaking kitchen faucet"
                        className="form-input"
                        required
                        maxLength={200}
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="form-label">Description</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe the issue in detail, including location and how long it has been happening"
                        className="form-input min-h-[100px] resize-y"
                        rows={4}
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="form-label">Category *</label>
                        <select value={category} onChange={(e) => setCategory(e.target.value as CreateMaintenanceRequest["category"])} className="form-input">
                            {CATEGORIES.map((c) => (
                                <option key={c.value} value={c.value}>{c.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="form-label">Priority *</label>
                        <select value={priority} onChange={(e) => setPriority(e.target.value as CreateMaintenanceRequest["priority"])} className="form-input">
                            {PRIORITIES.map((p) => (
                                <option key={p.value} value={p.value}>{p.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                    <button type="button" onClick={onBack} className="btn-ghost">Cancel</button>
                    <button type="submit" disabled={!title.trim() || mutation.isPending} className="btn-primary">
                        {mutation.isPending ? (
                            <><Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} /> Submitting...</>
                        ) : (
                            <><Plus className="h-4 w-4" strokeWidth={2} /> Submit Request</>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}

function MaintenanceDetail({ id, onBack }: { id: string; onBack: () => void }) {
    const { data: requests } = useTenantMaintenanceRequestsQuery();
    const request = requests?.find((r) => r.id === id);

    if (!request) {
        return (
            <div className="page-container py-6 sm:py-8">
                <div className="card-elevated p-8 text-center">
                    <p className="text-sm text-fg-muted dark:text-fg-muted-dark">Request not found</p>
                    <button type="button" onClick={onBack} className="btn-ghost mt-3">Go back</button>
                </div>
            </div>
        );
    }

    const CatIcon = CATEGORY_ICONS[request.category] ?? Wrench;
    const statusMeta = STATUS_META[request.status] ?? STATUS_META.SUBMITTED;
    const priorityMeta = PRIORITY_META[request.priority] ?? PRIORITY_META.MEDIUM;
    const StatusIcon = statusMeta.icon;

    return (
        <div className="page-container max-w-2xl mx-auto animate-fade-in-up py-6 sm:py-8 space-y-6">
            <div className="flex items-center gap-3">
                <button type="button" onClick={onBack} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-border-subtle dark:hover:bg-border-subtle-dark transition-colors">
                    <ChevronRight className="h-4 w-4 rotate-180 text-fg-muted dark:text-fg-muted-dark" strokeWidth={2} />
                </button>
                <div className="flex-1 min-w-0">
                    <h1 className="text-xl sm:text-2xl font-display font-bold text-fg dark:text-fg-dark truncate">{request.title}</h1>
                    <p className="text-sm text-fg-muted dark:text-fg-muted-dark mt-0.5">Submitted {formatDate(request.createdAt)}</p>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 ${statusMeta.className}`}>
                    {/* @ts-expect-error - React 19 ElementType inference issue */}
                    <StatusIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
                    {statusMeta.label}
                </span>
                <span className={priorityMeta.className}>{priorityMeta.label} Priority</span>
                <span className="badge-info">{request.category.replace("_", " ").toLowerCase()}</span>
            </div>

            <div className="card-elevated p-6 space-y-5">
                {request.description && (
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-fg-subtle dark:text-fg-subtle-dark mb-2">Description</p>
                        <p className="text-sm text-fg dark:text-fg-dark leading-relaxed whitespace-pre-wrap">{request.description}</p>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-fg-subtle dark:text-fg-subtle-dark mb-1">Category</p>
                        <div className="flex items-center gap-2 text-sm text-fg dark:text-fg-dark">
                            {/* @ts-expect-error - React 19 ElementType inference issue */}
                            <CatIcon className="h-4 w-4 text-fg-muted dark:text-fg-muted-dark" strokeWidth={1.75} />
                            {request.category.replace("_", " ").toLowerCase()}
                        </div>
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-fg-subtle dark:text-fg-subtle-dark mb-1">Priority</p>
                        <span className={priorityMeta.className}>{priorityMeta.label}</span>
                    </div>
                    {request.scheduledDate && (
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-fg-subtle dark:text-fg-subtle-dark mb-1">Scheduled Date</p>
                            <p className="text-sm text-fg dark:text-fg-dark">{formatDate(request.scheduledDate)}</p>
                        </div>
                    )}
                    {request.assignedTo && (
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-fg-subtle dark:text-fg-subtle-dark mb-1">Assigned To</p>
                            <p className="text-sm text-fg dark:text-fg-dark">{request.assignedTo}</p>
                        </div>
                    )}
                    {request.completedAt && (
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-fg-subtle dark:text-fg-subtle-dark mb-1">Completed At</p>
                            <p className="text-sm text-fg dark:text-fg-dark">{formatDate(request.completedAt)}</p>
                        </div>
                    )}
                </div>

                {request.notes && (
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-fg-subtle dark:text-fg-subtle-dark mb-2">Notes</p>
                        <p className="text-sm text-fg dark:text-fg-dark leading-relaxed">{request.notes}</p>
                    </div>
                )}
            </div>

            <div className="card-elevated p-5 bg-brand-50/50 dark:bg-brand-900/15 border border-brand-100/50 dark:border-brand-800/30">
                <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-100 dark:bg-brand-800 text-brand-700 dark:text-brand-300">
                        <Clock className="h-4 w-4" strokeWidth={1.75} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-fg dark:text-fg-dark">Timeline</p>
                        <p className="text-xs text-fg-muted dark:text-fg-muted-dark mt-1">
                            Status: <span className="font-semibold">{statusMeta.label}</span>
                            {request.scheduledDate ? ` · Scheduled: ${formatDate(request.scheduledDate)}` : ""}
                            {request.completedAt ? ` · Completed: ${formatDate(request.completedAt)}` : ""}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
