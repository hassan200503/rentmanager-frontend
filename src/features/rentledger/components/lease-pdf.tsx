import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { formatCurrency } from "@/features/tenant-portal/components/tenant-dashboard";
import type { TenantLeaseResponse } from "@/features/tenant-portal/api/tenant-portal-api";

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontFamily: "Helvetica",
        fontSize: 10,
        color: "#1a1a1a",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 24,
        paddingBottom: 16,
        borderBottomWidth: 2,
        borderBottomColor: "#1F6D4C",
    },
    brandName: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#1F6D4C",
        letterSpacing: 3,
    },
    title: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#1a1a1a",
    },
    section: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 9,
        fontWeight: "bold",
        color: "#666",
        textTransform: "uppercase",
        letterSpacing: 1.5,
        marginBottom: 8,
    },
    row: {
        flexDirection: "row",
        marginBottom: 4,
    },
    label: {
        width: 140,
        color: "#666",
        fontSize: 10,
    },
    value: {
        flex: 1,
        fontSize: 10,
    },
    divider: {
        borderBottomWidth: 1,
        borderBottomColor: "#e5e7eb",
        marginVertical: 12,
    },
    termsBox: {
        marginTop: 8,
        padding: 12,
        backgroundColor: "#f9fafb",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 4,
    },
    termsText: {
        fontSize: 9,
        color: "#666",
        lineHeight: 1.5,
    },
    footer: {
        position: "absolute",
        bottom: 30,
        left: 40,
        right: 40,
        borderTopWidth: 1,
        borderTopColor: "#e5e7eb",
        paddingTop: 12,
        flexDirection: "row",
        justifyContent: "center",
    },
    footerText: {
        fontSize: 8,
        color: "#999",
    },
});

export function LeasePdfDocument({ lease, tenantName, tenantPhone }: {
    lease: TenantLeaseResponse;
    tenantName: string;
    tenantPhone: string;
}) {
    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.brandName}>RENTMANAGER</Text>
                        <Text style={styles.title}>Lease Agreement</Text>
                    </View>
                    <Text style={{ fontSize: 8, color: "#999" }}>
                        {new Date().toLocaleDateString("en-KE", {
                            year: "numeric", month: "long", day: "numeric",
                        })}
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Property & Unit</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Property</Text>
                        <Text style={styles.value}>{lease.propertyName}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Unit Number</Text>
                        <Text style={styles.value}>{lease.unitNumber}{lease.unitLabel ? ` · ${lease.unitLabel}` : ""}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Address</Text>
                        <Text style={styles.value}>{lease.propertyAddress || "—"}</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Lease Period</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Lease Number</Text>
                        <Text style={styles.value}>{lease.leaseNumber}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Start Date</Text>
                        <Text style={styles.value}>{new Date(lease.startDate).toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" })}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>End Date</Text>
                        <Text style={styles.value}>{lease.endDate ? new Date(lease.endDate).toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" }) : "Ongoing"}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Status</Text>
                        <Text style={[styles.value, { color: "#1F6D4C" }]}>{lease.status?.toLowerCase()}</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Financial Terms</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Monthly Rent</Text>
                        <Text style={[styles.value, { fontWeight: "bold" }]}>KES {lease.monthlyRent.toLocaleString("en-KE")}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Security Deposit</Text>
                        <Text style={styles.value}>KES {lease.depositAmount.toLocaleString("en-KE")}</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Tenant</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Name</Text>
                        <Text style={styles.value}>{tenantName}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Phone</Text>
                        <Text style={styles.value}>{tenantPhone || "—"}</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Landlord</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Name</Text>
                        <Text style={styles.value}>{lease.landlordName || "—"}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Phone</Text>
                        <Text style={styles.value}>{lease.landlordPhone || "—"}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Email</Text>
                        <Text style={styles.value}>{lease.landlordEmail || "—"}</Text>
                    </View>
                </View>

                {lease.terms && (
                    <>
                        <View style={styles.divider} />
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Terms & Conditions</Text>
                            <View style={styles.termsBox}>
                                <Text style={styles.termsText}>{lease.terms}</Text>
                            </View>
                        </View>
                    </>
                )}

                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        RentManager — Generated {new Date().toLocaleDateString("en-KE", { year: "numeric", month: "long", day: "numeric" })}
                    </Text>
                </View>
            </Page>
        </Document>
    );
}
