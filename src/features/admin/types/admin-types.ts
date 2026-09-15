export type TenantStatus = "PENDING" | "ACTIVE" | "SUSPENDED" | "DEACTIVATED";
export type BillingMode = "COMMISSION" | "PREMIUM_MONTHLY";
export type SubscriptionStatus = "TRIAL" | "ACTIVE" | "LAPSED" | "CANCELLED" | "PAST_DUE" | "GRACE_PERIOD";
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
// Mirrors the backend PropertyStatus enum. ARCHIVED was missing, so a
// response carrying it was typed as something it is not.
export type PropertyStatus = "DRAFT" | "ACTIVE" | "INACTIVE" | "UNDER_MAINTENANCE" | "ARCHIVED";
// Mirrors the backend PropertyType enum; AIRBNB was missing.
export type PropertyType =
  | "APARTMENT" | "BEDSITTER" | "STUDIO" | "MAISONETTE" | "VILLA"
  | "COMMERCIAL" | "OFFICE" | "WAREHOUSE" | "HOSTEL" | "AIRBNB";
export type PremisesType = "RESIDENTIAL" | "COMMERCIAL" | "MIXED_USE";

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
  // Subscription funnel
  trialLandlords: number;
  premiumLandlords: number;
  lapsedLandlords: number;
  mrrAmount: string; // BigDecimal -> JSON string
}

export interface AdminOverviewPaymentStats {
  gmvCurrentMonth: string;
  gmvPreviousMonth: string;
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
  subscriptionStatus: SubscriptionStatus | null;
  status: TenantStatus;
  createdAt: string;
  propertiesCount: number;
  unitsCount: number;
  activeLeasesCount: number;
  rentersCount: number;
  gmvAmount: string; // BigDecimal -> JSON string
  lastActivityAt: string | null;
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
  rentAmount: string; // BigDecimal -> JSON string
}

export interface LandlordDetailPaymentRequest {
  id: string;
  amount: string;
  status: RentPaymentRequestStatus;
  mpesaReceiptNumber: string | null;
  createdAt: string;
}

export interface LandlordDetailDisbursement {
  id: string;
  amount: string;
  recipientName: string | null;
  status: DisbursementStatus;
  requiresManualAttention: boolean;
  createdAt: string;
}

export interface LandlordDetailTransaction {
  id: string;
  amount: string;
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
  gmvAmount: string; // BigDecimal -> JSON string
  subscriptionStatus: SubscriptionStatus | null;
  subscriptionPlanId: string | null;
  planStartDate: string | null;
  planEndDate: string | null;
  freeTrialEndsAt: string | null;
  properties: LandlordDetailProperty[];
  renters: LandlordDetailRenter[];
  leases: LandlordDetailLease[];
  paymentRequests: LandlordDetailPaymentRequest[];
  disbursements: LandlordDetailDisbursement[];
  recentTransactions: LandlordDetailTransaction[];
}

export interface AdminActivateSubscriptionRequest {
  planCode: string;
  periodMonths: number;
}

export interface DisbursementItem {
  id: string;
  tenantId: string;
  leaseId: string | null;
  ledgerEntryId: string | null;
  amount: string; // BigDecimal -> JSON string
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
  rentAmount: string; // BigDecimal -> JSON string
  depositAmount: string;
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
  rentAmount: string; // BigDecimal -> JSON string
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
  trialDurationDays: number;
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
  logoUrl: string | null;
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
  trialDurationDays: number;
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

export type PlatformReviewType = "LANDLORD" | "RENTER" | "PLATFORM";

/**
 * Minimal, unauthenticated platform identity — served to the landing page,
 * auth surfaces, favicon resolver and any chrome that renders before login.
 * Deliberately contains NO operational configuration.
 */
export interface PlatformBrandingResponse {
  platformName: string;
  logoUrl: string | null;
  environment: PlatformEnvironment;
  supportEmail: string | null;
  supportPhone: string | null;
  updatedAt: string | null;
}

export interface PlatformReviewResponse {
  type: PlatformReviewType;
  reviewId: string;
  reviewerName: string | null;
  reviewerType: "LANDLORD" | "RENTER" | null;
  rating: number;
  comment: string | null;
  status: "PENDING" | "APPROVED" | "HIDDEN";
  createdAt: string;
}

export interface PlatformReviewStats {
  landlordApproved: number;
  landlordPending: number;
  landlordHidden: number;
  landlordAverageRating: number;
  renterApproved: number;
  renterPending: number;
  renterHidden: number;
  renterAverageRating: number;
  platformApproved: number;
  platformPending: number;
  platformHidden: number;
  platformAverageRating: number;
}

// ── Rent payment queue ──────────────────────────────────────────────────────
//
// The rows behind the overview's pending/failed payment counters. The alert
// panel linked to these long before anything could list them.

// RentPaymentRequestStatus is already declared at the top of this file.

export interface PaymentRequestItem {
  id: string;
  tenantId: string;
  leaseId: string | null;
  rentLedgerEntryId: string | null;
  amount: string; // BigDecimal -> JSON string
  phoneNumber: string | null;
  status: RentPaymentRequestStatus;
  mpesaCheckoutRequestId: string | null;
  mpesaReceiptNumber: string | null;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface PaymentRequestQueryParams {
  landlordId?: string;
  status?: RentPaymentRequestStatus;
  page?: number;
  size?: number;
}

export interface SubscriptionPlanAdminRequest {
  code: string;
  name: string;
  description?: string | null;
  billingCycle: "MONTHLY" | "YEARLY" | "QUARTERLY";
  maxUnits?: number | null;
  monthlyPrice?: number | null;
  yearlyPrice?: number | null;
}
