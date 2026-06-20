"use client";

import { useOrgStore } from "@/stores/org-store";

export default function OrgSwitcher() {
    const tenantId = useOrgStore((state) => state.tenantId);
    const tenantName = useOrgStore((state) => state.tenantName);

    return (
        <select
            value={tenantId ?? ""}
            disabled
            aria-label="Active organization"
        >
            <option value={tenantId ?? ""}>
                {tenantName ?? "No organization selected"}
            </option>
        </select>
    );
}
