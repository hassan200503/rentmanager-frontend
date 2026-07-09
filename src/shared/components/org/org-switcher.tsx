"use client";

import { useOrgStore } from "@/stores/org-store";

// NOTE: this component is currently non-functional — the <select> is `disabled` and
// only ever renders a single static option (the current org). That may be entirely
// intentional as a placeholder ahead of real multi-tenant switching, but it's worth
// flagging: should a non-functional control still look like an interactive dropdown,
// or would plain static text communicate its current (non-switchable) state more
// honestly to the user? Left the dropdown markup as-is and only applied minimal,
// disabled-appropriate styling — not making that product call here.
//
// Sizing here (text-sm, compact padding) is a guess at fitting a topbar context —
// haven't seen Topbar.tsx's surrounding layout in this session to confirm against.
export default function OrgSwitcher() {
    const tenantId = useOrgStore((state) => state.tenantId);
    const tenantName = useOrgStore((state) => state.tenantName);

    return (
        <select
            value={tenantId ?? ""}
            disabled
            aria-label="Active organization"
            className="form-input w-auto text-sm py-1.5 disabled:opacity-70 disabled:cursor-not-allowed"
        >
            <option value={tenantId ?? ""}>
                {tenantName ?? "No organization selected"}
            </option>
        </select>
    );
}