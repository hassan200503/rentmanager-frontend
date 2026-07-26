import AppShell from "@/shared/components/layout/AppShell";
import NotificationSync from "@/shared/components/dashboard/NotificationSync";
import CommandPalette from "@/shared/components/command-palette/CommandPalette";

export default function DashboardLayout({
                                            children,
                                        }: {
    children: React.ReactNode;
}) {
    return (
        <>
            <NotificationSync />
            <CommandPalette />
            <AppShell>{children}</AppShell>
        </>
    );
}