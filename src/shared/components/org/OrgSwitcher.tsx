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
      className="border border-gray-300 rounded-md py-1 px-2 text-sm bg-white text-gray-800"
    >
      <option value={tenantId ?? ""}>
        {tenantName ?? "No organization selected"}
      </option>
    </select>
  );
}
