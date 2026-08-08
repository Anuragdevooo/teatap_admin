/**
 * Domain model for the TeaTap admin console.
 *
 * These mirror the TeaTap REST contract (`API_SPEC.md`) 1:1 — money is whole
 * rupees, timestamps are epoch milliseconds. Keeping the shapes identical
 * means swapping the mock repository for a real HTTP client is a one-file
 * change with no ripple into components.
 */

export type Role = 'customer' | 'operator' | 'admin';
export type PaymentStatus = 'paid' | 'pending' | 'overdue';
export type PlanTier = 'Trial' | 'Starter' | 'Pro' | 'Enterprise';

export interface AdminUser {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  role: Role;
  joinedAt: number;
  lastActiveAt: number;
  status: 'Active' | 'Flagged' | 'Blocked';
  city: string;
}

/** A tea-shop owner = one tenant of the platform. */
export interface Owner {
  id: string;
  businessName: string;
  ownerName: string;
  phone: string;
  email: string | null;
  city: string;
  area: string;
  plan: PlanTier;
  locked: boolean;
  joinedAt: number;
  planStartedAt: number;
  planRenewsAt: number;
  monthlyFee: number;
  /**
   * Vendor health is measured the way a platform measures a tenant: how many
   * people it brings, how fast that is growing, and what it pays us. What the
   * shop sells is its own business, not the console's.
   */
  customers: number;
  /** Customers added in the last 30 days. */
  customersAdded: number;
  /** Month-over-month customer growth, as a percentage. */
  growthPct: number;
  /** Subscription fees this vendor has paid the platform, lifetime. */
  platformRevenue: number;
  /** Consecutive billing cycles paid without a lapse. */
  renewals: number;
  /** Days since the account was created. */
  ageDays: number;
  outstanding: number;
  devicesUsed: number;
  deviceLimit: number;
  lastLoginAt: number;
  /** 14-point customer-count history — feeds the row sparkline. */
  customersTrend: number[];
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  area: string;
  vendorId: string;
  vendorName: string;
  dailyCups: number;
  ratePerCup: number;
  outstanding: number;
  cupsThisMonth: number;
  monthsActive: number;
  status: PaymentStatus;
  joinedAt: number;
  /** Blocked customers keep their history but cannot be billed or served. */
  blocked: boolean;
}

export interface Product {
  id: string;
  name: string;
  category: 'Hot' | 'Cold' | 'Snack';
  ratePerCup: number;
  description: string;
  isActive: boolean;
  cupsSold: number;
  isBestseller: boolean;
  isPremium: boolean;
  vendorName: string;
}

/**
 * A subscription invoice raised by the platform against a vendor.
 *
 * Vendor→customer billing lives in the vendor's own app; this console only
 * tracks what vendors owe the platform.
 */
export interface Bill {
  id: string;
  invoiceNo: string;
  vendorId: string;
  vendorName: string;
  plan: PlanTier;
  issuedAt: number;
  dueDate: number;
  paidOn: number | null;
  amount: number;
  status: PaymentStatus;
}

/** Money the platform actually received. */
export interface Payment {
  id: string;
  vendorName: string;
  invoiceNo: string;
  amount: number;
  method: 'upi' | 'card' | 'netbanking';
  paidAt: number;
}

/**
 * A sellable plan tier. Pricing lives in data, not in a constant, so an admin
 * can change what Pro costs without a deploy — and every vendor on that tier
 * picks the new price up on their next cycle.
 */
export interface Plan {
  id: string;
  tier: PlanTier;
  /** Customer-facing name; may differ from the internal tier. */
  name: string;
  price: number;
  deviceSeats: number;
  /** Trial length in days; 0 for paid plans. */
  trialDays: number;
  features: string[];
  isActive: boolean;
  /** Highlighted on the pricing page. */
  popular: boolean;
}

export interface Subscription {
  id: string;
  ownerId: string;
  operatorName: string;
  plan: PlanTier;
  startedAt: number;
  renewsAt: number;
  amount: number;
  status: 'Active' | 'Past due' | 'Cancelled' | 'Trialing';
  autoRenew: boolean;
}

export interface DeviceSeat {
  ownerId: string;
  operatorName: string;
  plan: PlanTier;
  used: number;
  limit: number;
  lastLoginAt: number;
  platform: 'Android' | 'iOS' | 'Web';
}

export interface LeaderboardEntry {
  rank: number;
  ownerId: string;
  name: string;
  city: string;
  customers: number;
  customersAdded: number;
  platformRevenue: number;
  growth: number;
}

/**
 * A shipped build of the Teatap apps.
 *
 * The platform admin owns which version is live and which is the oldest one
 * still allowed to sign in — that floor is what forces a stuck vendor to
 * update rather than filing a support ticket.
 */
export type Platform = 'Android' | 'iOS' | 'Web';

export interface Release {
  id: string;
  /**
   * One version usually ships to several platforms at once. Modelling it as a
   * list keeps 2.6.0 a single release rather than near-duplicate Android and
   * iOS rows that then drift apart.
   */
  platforms: Platform[];
  /** Semantic version, e.g. 2.4.1. */
  version: string;
  build: number;
  releasedAt: number;
  status: 'Live' | 'Rolling out' | 'Draft' | 'Deprecated';
  /** Percentage of users the build has been rolled out to. */
  rollout: number;
  /** Below this version the app refuses to run and prompts an update. */
  isMinimumSupported: boolean;
  notes: string[];
  adoption: number;
}

export type NotificationKind = 'system' | 'payment' | 'order' | 'chat' | 'alert';

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  at: number;
  kind: NotificationKind;
  audience: Role | 'all';
  unread: boolean;
}

export interface SupportRequest {
  id: string;
  subject: string;
  ownerName: string;
  city: string;
  openedAt: number;
  priority: 'Low' | 'Normal' | 'High' | 'Urgent';
  status: 'Open' | 'Pending' | 'Resolved';
  messages: number;
}

/** One conversation between the admin and a vendor or customer. */
export interface ChatThread {
  id: string;
  peerId: string;
  peerName: string;
  peerRole: 'operator' | 'customer';
  /** Shop the peer belongs to — context the admin needs before replying. */
  context: string;
  lastMessage: string;
  lastAt: number;
  unread: number;
  online: boolean;
}

export interface ChatMessage {
  id: string;
  threadId: string;
  text: string;
  /** `me` is the signed-in admin. */
  sender: 'me' | 'them';
  at: number;
  status: 'sending' | 'sent' | 'delivered' | 'read';
}

/**
 * What the admin console actually tracks: people on the platform and what the
 * platform earns from them. Vendors' own sales are their business.
 */
export interface DashboardStats {
  totalUsers: number;
  totalVendors: number;
  activeVendors: number;
  blockedAccounts: number;
  totalCustomers: number;
  newUsersThisMonth: number;
  /** Monthly recurring revenue from vendor subscriptions. */
  mrr: number;
  /** Average revenue per vendor. */
  arpv: number;
  deltas: {
    users: number;
    vendors: number;
    customers: number;
    mrr: number;
  };
  /** Platform growth: how the user base has built up, month by month. */
  userGrowth: { labels: string[]; vendors: number[]; customers: number[] };
  /** Subscription revenue by month — what the platform earns. */
  mrrByMonth: { labels: string[]; values: number[] };
  signupsLast14Days: number[];
  planMix: Array<{ label: PlanTier; value: number }>;
  cityMix: Array<{ label: string; value: number }>;
  roleMix: Array<{ label: string; value: number }>;
}

export interface ActivityEvent {
  id: string;
  title: string;
  detail: string;
  at: number;
  kind: 'signup' | 'payment' | 'lock' | 'support' | 'plan';
}
