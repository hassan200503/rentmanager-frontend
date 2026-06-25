"use client";

import Link from "next/link";

export default function Sidebar() {
    return (
        <aside className="w-64 hidden md:flex flex-col bg-white border-r border-gray-200 shadow-sm">
            <div className="h-16 flex items-center px-4 font-bold border-b border-gray-200">
                RentManager
            </div>

            <nav className="flex-1 p-4 space-y-2">
                <Link
                    className="block px-3 py-2 rounded-md text-gray-600 hover:text-primary hover:bg-primary-light transition"
                    href="/dashboard"
                >
                    Dashboard
                </Link>

                <Link
                    className="block px-3 py-2 rounded-md text-gray-600 hover:text-primary hover:bg-primary-light transition"
                    href="/dashboard/properties"
                >
                    Properties
                </Link>

                <Link
                    className="block px-3 py-2 rounded-md text-gray-600 hover:text-primary hover:bg-primary-light transition"
                    href="/leases"
                >
                    Leases
                </Link>
            </nav>
        </aside>
    );
}