"use client";

import OrgSwitcher from "@/shared/components/org/OrgSwitcher";

export default function Topbar() {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm">
      <div className="text-lg font-semibold text-gray-800">Dashboard</div>

      <div className="flex items-center gap-4">
        <OrgSwitcher />
        <span className="text-sm text-gray-600">Admin</span>
        <div className="w-8 h-8 rounded-full bg-gray-300" />
      </div>
    </header>
  );
}
