import AppShell from "@/shared/components/layout/AppShell";
import NotificationSync from "@/shared/components/dashboard/NotificationSync";

export default function DashboardLayout({
                                            children,
                                        }: {
    children: React.ReactNode;
}) {
    return (
        <>
            <NotificationSync />
            <AppShell>{children}</AppShell>
        </>
    );
}