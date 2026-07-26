import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
import type { TenantPaymentReceiptResponse } from "@/features/tenant-portal/api/tenant-portal-api";

Font.register({
    family: "Helvetica",
    fonts: [
        { src: "https://fonts.cdnfonts.com/s/29107/Helvetica.woff", fontWeight: "normal" },
        { src: "https://fonts.cdnfonts.com/s/29107/Helvetica-Bold.woff", fontWeight: "bold" },
    ],
});

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
        width: 120,
        color: "#666",
        fontSize: 10,
    },
    value: {
        flex: 1,
        fontSize: 10,
        fontFamily: "Helvetica",
    },
    divider: {
        borderBottomWidth: 1,
        borderBottomColor: "#e5e7eb",
        marginVertical: 12,
    },
    amountRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 4,
    },
    amountLabel: {
        fontSize: 12,
        fontWeight: "bold",
        color: "#1a1a1a",
    },
    amountValue: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#1F6D4C",
    },
    balanceRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 4,
    },
    balanceLabel: {
        fontSize: 10,
        color: "#666",
    },
    balanceValue: {
        fontSize: 10,
        fontFamily: "Helvetica",
    },
    kraBox: {
        marginTop: 16,
        padding: 12,
        backgroundColor: "#f0f7f2",
        borderWidth: 1,
        borderColor: "#d1e4d8",
        borderRadius: 4,
    },
    kraTitle: {
        fontSize: 9,
        fontWeight: "bold",
        color: "#1F6D4C",
        marginBottom: 4,
    },
    kraText: {
        fontSize: 9,
        color: "#666",
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

export function ReceiptPdfDocument({ receipt }: { receipt: TenantPaymentReceiptResponse }) {
    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.brandName}>RENTMANAGER</Text>
                        <Text style={styles.title}>Payment Receipt</Text>
                    </View>
                    <Text style={{ fontSize: 8, color: "#999" }}>
                        {new Date().toLocaleDateString("en-KE", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                        })}
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Reference</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Receipt Number</Text>
                        <Text style={[styles.value, { fontFamily: "Helvetica" }]}>{receipt.receiptNumber}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Transaction ID</Text>
                        <Text style={[styles.value, { fontFamily: "Helvetica" }]}>{receipt.transactionId}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Payment Date</Text>
                        <Text style={styles.value}>{new Date(receipt.paymentDate).toLocaleDateString("en-KE", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Tenant Details</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Name</Text>
                        <Text style={styles.value}>{receipt.tenantName}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Phone</Text>
                        <Text style={[styles.value, { fontFamily: "Helvetica" }]}>{receipt.tenantPhone}</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Unit Details</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Unit Number</Text>
                        <Text style={styles.value}>{receipt.unitNumber}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Property</Text>
                        <Text style={styles.value}>{receipt.propertyName}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Billing Period</Text>
                        <Text style={styles.value}>
                            {new Date(receipt.billingPeriodStart).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                            {" – "}
                            {new Date(receipt.billingPeriodEnd).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                        </Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Payment Details</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>M-Pesa Reference</Text>
                        <Text style={[styles.value, { fontFamily: "Helvetica", color: "#1F6D4C" }]}>
                            {receipt.mpesaTransactionId ?? "—"}
                        </Text>
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.amountRow}>
                    <Text style={styles.amountLabel}>Amount Paid</Text>
                    <Text style={styles.amountValue}>
                        KES {receipt.amount.toLocaleString("en-KE")}
                    </Text>
                </View>
                <View style={styles.balanceRow}>
                    <Text style={styles.balanceLabel}>Balance after payment</Text>
                    <Text style={styles.balanceValue}>
                        KES {receipt.balanceAfterPayment.toLocaleString("en-KE")}
                    </Text>
                </View>

                <View style={styles.kraBox}>
                    <Text style={styles.kraTitle}>eTIMS (Pending KRA Integration)</Text>
                    <Text style={styles.kraText}>
                        Invoice: {receipt.eTimsInvoiceNumber ?? "—"}
                        {"\n"}
                        QR Code: {receipt.eTimsQrCodeUrl ?? "Pending KRA integration"}
                    </Text>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        RentManager — {new Date().getFullYear()}
                    </Text>
                </View>
            </Page>
        </Document>
    );
}
