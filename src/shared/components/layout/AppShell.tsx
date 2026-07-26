"use client";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

interface AppShellProps {
    children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
    return (
        <div className="h-screen flex">
            <Sidebar />
            <div className="flex flex-col flex-1 min-w-0">
                <Topbar />
                <main className="flex-1 overflow-y-auto pb-16 md:pb-0">{children}</main>
            </div>
        </div>
    );
}