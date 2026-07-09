"use client";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

interface AppShellProps {
    children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
    return (
        <div className="h-screen flex bg-canvas">
            <Sidebar />
            <div className="flex flex-col flex-1 overflow-hidden">
                <Topbar />
                <main className="flex-1 overflow-y-auto">{children}</main>
            </div>
        </div>
    );
}
