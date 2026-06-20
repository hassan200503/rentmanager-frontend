"use client";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

interface AppShellProps {
    children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
    return (
        <div className="h-screen flex bg-gray-50">
            {/* Sidebar (fixed system navigation layer) */}
            <Sidebar />

            {/* Main vertical stack */}
            <div className="flex flex-col flex-1 overflow-hidden">
                <Topbar />

                {/* Page content layer */}
                <main className="flex-1 overflow-y-auto p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}