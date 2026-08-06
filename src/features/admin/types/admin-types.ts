export type TenantStatus = "PENDING" | "ACTIVE" | "SUSPENDED" | "DEACTIVATED";
export type BillingMode = "COMMISSION" | "PREMIUM_MONTHLY";
export type DisbursementStatus = "INITIATED" | "PENDING" | "SUCCESS" | "FAILED";
export type RentPaymentRequestStatus = "PENDING" | "PAID" | "FAILED";
export type RentTransactionSource = "MPESA" | "CASH" | "ADMIN_ADJUSTMENT" | "SYSTEM";
export type LeaseStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "AWAITING_DEPOSIT"
  | "ACTIVE"
  | "EXPIRED"
  | "PENDING_ACTIVATION"
  | "RENEWED"
  | "CANCELLED"
  | "TERMINATED"
  | "SUSPENDED";
export type PropertyStatus = "DRAFT" | "ACTIVE" | "INACTIVE" | "UNDER_MAINTENANCE";
export type PropertyType =
  | "APARTMENT" | "BEDSITTER" | "STUDIO" | "MAISONETTE" | "VILLA"
  | "COMMERCIAL" | "OFFICE" | "WAREHOUSE" | "HOSTEL";
export type PremisesType = "RESIDENTIAL" | "COMMERCIAL" | "MIXED_USE";
export type CommissionSource = "OVERRIDE" | "DEFAULT";

export interface PlatformAdminInfo {
  platformRole: "OWNER" | "ADMIN";
}

export interface AdminOverviewPlatformStats {
  totalTenants: number;
  activeTenants: number;
  suspendedTenants: number;
  pendingOnboardingTenants: number;
  deactivatedTenants: number;
  totalProperties: number;
  totalUnits: number;
  activeLeases: number;
  totalRenters: number;
  platformDefaultCommissionRate: number | null;
}

export interface AdminOverviewPaymentStats {
  gmvCurrentMonth: number;
  gmvPreviousMonth: number;
  commissionCurrentMonth: number;
  commissionPreviousMonth: number;
  paymentRequestsPending: number;
  paymentRequestsPaid: number;
  paymentRequestsFailed: number;
}

export interface AdminOverviewDisbursementStats {
  initiated: number;
  pending: number;
  success: number;
  failed: number;
  requiresManualAttention: number;
}

export interface AdminOverviewEnvironment {
  environment: "SANDBOX" | "PRODUCTION";
  sandbox: boolean;
}

export interface AdminOverviewResponse {
  platform: AdminOverviewPlatformStats;
  payments: AdminOverviewPaymentStats;
  disbursements: AdminOverviewDisbursementStats;
  environment: AdminOverviewEnvironment;
}

export interface LandlordSummary {
  id: string;
  name: string;
  slug: string;
  email: string;
  billingMode: BillingMode;
  status: TenantStatus;
  createdAt: string;
  propertiesCount: number;
  unitsCount: number;
  activeLeasesCount: number;
  rentersCount: number;
  gmvAmount: number;
  commissionAmount: number;
  lastActivityAt: string | null;
  effectiveCommissionRate: number | null;
}

export interface SpringPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface LandlordDetailProperty {
  id: string;
  referenceCode: string;
  name: string;
  status: PropertyStatus;
  propertyType: PropertyType;
  premisesType: PremisesType;
  unitsCount: number;
  occupiedUnitsCount: number;
}

export interface LandlordDetailRenter {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  nationalId: string | null;
}

export interface LandlordDetailLease {
  id: string;
  leaseNumber: string;
  status: LeaseStatus;
  propertyId: string;
  unitId: string;
  startDate: string;
  endDate: string;
  rentAmount: number;
}

export interface LandlordDetailPaymentRequest {
  id: string;
  amount: number;
  status: RentPaymentRequestStatus;
  mpesaReceiptNumber: string | null;
  createdAt: string;
}

export interface LandlordDetailDisbursement {
  id: string;
  amount: number;
  recipientName: string | null;
  status: DisbursementStatus;
  requiresManualAttention: boolean;
  createdAt: string;
}

export interface LandlordDetailTransaction {
  id: string;
  amount: number;
  commissionAmount: number | null;
  source: RentTransactionSource;
  occurredAt: string;
}

export interface LandlordDetailResponse {
  id: string;
  name: string;
  slug: string;
  email: string;
  phoneNumber: string | null;
  status: TenantStatus;
  billingMode: BillingMode;
  createdAt: string;
  lastActivityAt: string | null;
  gmvAmount: number;
  commissionAmount: number;
  effectiveCommissionRate: number | null;
  commissionSource: CommissionSource;
  properties: LandlordDetailProperty[];
  renters: LandlordDetailRenter[];
  leases: LandlordDetailLease[];
  paymentRequests: LandlordDetailPaymentRequest[];
  disbursements: LandlordDetailDisbursement[];
  recentTransactions: LandlordDetailTransaction[];
}

export interface LandlordCommission {
  landlordOrgId: string;
  ratePercent: number | null;
  source: CommissionSource;
  effectiveFrom: string | null;
  updatedAt: string | null;
}

export interface SetLandlordCommissionRequest {
  ratePercent: number;
}

export interface DisbursementItem {
  id: string;
  tenantId: string;
  amount: number;
  recipientPhone: string;
  recipientName: string | null;
  status: DisbursementStatus;
  commandId: string;
  originatorConversationId: string | null;
  conversationId: string | null;
  transactionId: string | null;
  retryCount: number;
  requiresManualAttention: boolean;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PropertySummary {
  id: string;
  referenceCode: string;
  name: string;
  status: PropertyStatus;
  propertyType: PropertyType;
  premisesType: PremisesType;
  unitsCount: number;
  occupiedUnitsCount: number;
  createdAt: string;
  landlordId: string;
  landlordName: string;
  landlordSlug: string;
}

export interface RenterSummary {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  nationalId: string | null;
  landlordId: string;
  landlordName: string;
  landlordSlug: string;
  activeLeaseId: string | null;
  activeLeaseStatus: LeaseStatus | null;
}