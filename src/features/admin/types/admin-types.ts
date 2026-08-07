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
  leaseId: string | null;
  ledgerEntryId: string | null;
  amount: number;
  recipientPhone: string;
  recipientName: string | null;
  commandId: string;
  status: DisbursementStatus;
  mpesaTransactionId: string | null;
  mpesaConversationId: string | null;
  mpesaOriginatorConversationId: string | null;
  failureReason: string | null;
  retryCount: number;
  requiresManualAttention: boolean;
  createdAt: string;
  updatedAt: string;
  version: number | null;
}

export interface DisbursementQueryParams {
  landlordId?: string;
  status?: string;
  requiresManualAttention?: boolean;
  page?: number;
  size?: number;
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

export type UnitStatus = "ACTIVE" | "INACTIVE" | "MAINTENANCE" | "ARCHIVED" | "VACANT" | "OCCUPIED";
export type UnitOccupancyStatus = "VACANT" | "PENDING_PAYMENT" | "RESERVED" | "OCCUPIED";
export type OccupancyStatus = "VACANT" | "PARTIALLY_OCCUPIED" | "FULLY_OCCUPIED";

export interface PropertyDetailAddress {
  street: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
}

export interface PropertyDetailLandlord {
  id: string;
  name: string;
  slug: string;
  email: string;
  status: TenantStatus;
  billingMode: BillingMode;
}

export interface PropertyDetailUnit {
  id: string;
  unitNumber: string;
  label: string;
  status: UnitStatus;
  occupancyStatus: UnitOccupancyStatus;
  rentAmount: number;
  depositAmount: number;
  floor: string | null;
}

export interface PropertyDetailLease {
  id: string;
  leaseNumber: string;
  status: LeaseStatus;
  unitId: string;
  unitNumber: string;
  tenantProfileId: string;
  renterName: string;
  renterEmail: string;
  startDate: string;
  endDate: string;
  rentAmount: number;
  createdAt: string;
}

export interface PropertyDetailResponse {
  id: string;
  referenceCode: string;
  name: string;
  description: string | null;
  status: PropertyStatus;
  propertyType: PropertyType;
  premisesType: PremisesType;
  premisesTypeOverrideReason: string | null;
  occupancyStatus: OccupancyStatus;
  createdAt: string;
  updatedAt: string;
  address: PropertyDetailAddress;
  landlord: PropertyDetailLandlord;
  totalUnits: number;
  occupiedUnits: number;
  units: PropertyDetailUnit[];
  activeLeases: PropertyDetailLease[];
  pastLeases: PropertyDetailLease[];
}

// ---------- Platform settings ----------

export type PlatformEnvironment = "SANDBOX" | "PRODUCTION";

export interface PlatformSettingsBilling {
  premiumGraceDays: number;
  subscriptionPaymentExpiryMinutes: number;
}

export interface PlatformSettingsDisbursement {
  maxRetryAttempts: number;
}

export interface PlatformSettingsRevenue {
  businessShortcode: string | null;
  paybill: string | null;
  till: string | null;
  b2cShortcode: string | null;
  mpesaPhone: string | null;
}

export interface PlatformSettingsInfo {
  environment: PlatformEnvironment;
  sandbox: boolean;
  supportEmail: string | null;
  supportPhone: string | null;
  updatedBy: string | null;
  updatedAt: string | null;
}

export interface PlatformSettingsResponse {
  billing: PlatformSettingsBilling;
  disbursement: PlatformSettingsDisbursement;
  revenue: PlatformSettingsRevenue;
  platform: PlatformSettingsInfo;
}

export interface UpdatePlatformSettingsRequest {
  premiumGraceDays: number;
  subscriptionPaymentExpiryMinutes: number;
  disbursementMaxRetryAttempts: number;
  revenueBusinessShortcode?: string | null;
  revenuePaybill?: string | null;
  revenueTill?: string | null;
  revenueB2CShortcode?: string | null;
  revenueMpesaPhone?: string | null;
  supportEmail?: string | null;
  supportPhone?: string | null;
}