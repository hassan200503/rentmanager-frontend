import AppShell from "@/shared/components/layout/AppShell";

export default function DashboardLayout({
                                            children,
                                        }: {
    children: React.ReactNode;
}) {
    return <AppShell>{children}</AppShell>;
}