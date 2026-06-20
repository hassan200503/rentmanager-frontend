"use client";

export default function Topbar() {
    return (
        <header className="h-16 bg-white border-b flex items-center justify-between px-6">
            <div className="text-sm text-gray-600">
                Dashboard
            </div>

            <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">Admin</span>
                <div className="w-8 h-8 rounded-full bg-gray-300" />
            </div>
        </header>
    );
}