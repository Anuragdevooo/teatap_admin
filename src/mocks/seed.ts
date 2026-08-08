import type {
  ActivityEvent,
  AdminUser,
  Bill,
  ChatMessage,
  ChatThread,
  Customer,
  DashboardStats,
  DeviceSeat,
  LeaderboardEntry,
  NotificationItem,
  Owner,
  Payment,
  Plan,
  PlanTier,
  Release,
  Subscription,
  SupportRequest,
} from '@/types/domain';

/**
 * Deterministic fixture set.
 *
 * A seeded PRNG (not Math.random) keeps every reload identical, so the console
 * can be screenshotted, reviewed and demoed without numbers shifting under the
 * reviewer. Swap this module for an HTTP client and nothing above it changes.
 */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(20260808);
const pick = <T>(list: readonly T[]): T => list[Math.floor(rng() * list.length)];
const between = (min: number, max: number) => Math.floor(rng() * (max - min + 1)) + min;

/** Fixed "now" so relative timestamps stay stable across renders. */
export const NOW = new Date('2026-08-08T10:30:00+05:30').getTime();
const DAY = 86_400_000;

const FIRST = [
  'Ravi', 'Anita', 'Suresh', 'Priya', 'Vikram', 'Meena', 'Arjun', 'Kavita',
  'Rahul', 'Deepa', 'Nikhil', 'Sunita', 'Manoj', 'Pooja', 'Sanjay', 'Rekha',
  'Amit', 'Neha', 'Farhan', 'Ishita', 'Gopal', 'Lakshmi', 'Imran', 'Divya',
];
const LAST = [
  'Sharma', 'Patel', 'Reddy', 'Iyer', 'Nair', 'Gupta', 'Joshi', 'Desai',
  'Kulkarni', 'Chauhan', 'Banerjee', 'Menon', 'Rao', 'Shetty', 'Khan', 'Mehta',
];
const CITIES = ['Pune', 'Mumbai', 'Nagpur', 'Nashik', 'Surat', 'Indore', 'Hyderabad'];
const SHOP_PREFIX = ['Amrut', 'Sunrise', 'Gokul', 'Chai Adda', 'Tapri', 'Kadak', 'Shivneri', 'Yari'];
const SHOP_SUFFIX = ['Tea Stall', 'Chai Corner', 'Tea House', 'Cutting Co.', 'Tea Point'];
/** Delivery areas are real localities, not abstract route letters. */
const AREAS = [
  'Kothrud',
  'Baner',
  'Hadapsar',
  'Viman Nagar',
  'Shivaji Nagar',
  'Camp',
  'Wakad',
  'Kharadi',
  'Deccan',
  'Aundh',
];
const PLANS: PlanTier[] = ['Trial', 'Starter', 'Pro', 'Enterprise'];
const PLAN_FEE: Record<PlanTier, number> = { Trial: 0, Starter: 299, Pro: 499, Enterprise: 1499 };
const PLAN_SEATS: Record<PlanTier, number> = { Trial: 1, Starter: 2, Pro: 5, Enterprise: 15 };

const fullName = () => `${pick(FIRST)} ${pick(LAST)}`;
const phone = () => `9${between(100000000, 899999999)}`;

/**
 * Customer-count history ending at `final`. Built backwards from today so the
 * sparkline always terminates on the number shown in the row beside it.
 */
function growthSeries(final: number, growthPct: number): number[] {
  const start = Math.max(1, Math.round(final / (1 + growthPct / 100)));
  return Array.from({ length: 14 }, (_, i) =>
    Math.round(start + ((final - start) * i) / 13 + between(-1, 1)),
  ).map((v) => Math.max(0, v));
}

// ── Owners (tenants) ──────────────────────────────────────────────────────
export const owners: Owner[] = Array.from({ length: 48 }, (_, i) => {
  const plan = i < 3 ? 'Enterprise' : pick(PLANS);
  const ownerName = fullName();
  const customers = plan === 'Enterprise' ? between(90, 240) : plan === 'Pro' ? between(35, 95) : between(6, 40);
  const locked = rng() < 0.12;
  const ageDays = between(30, 900);
  const joinedAt = NOW - ageDays * DAY;
  const planStartedAt = NOW - between(1, 330) * DAY;
  const growthPct = Math.round((rng() * 46 - 10) * 10) / 10;
  const renewals = Math.max(0, Math.floor(ageDays / 30) - between(0, 2));

  return {
    id: `own_${String(i + 1).padStart(3, '0')}`,
    businessName: `${pick(SHOP_PREFIX)} ${pick(SHOP_SUFFIX)}`,
    ownerName,
    phone: phone(),
    email: rng() < 0.7 ? `${ownerName.split(' ')[0].toLowerCase()}@teatap.app` : null,
    city: pick(CITIES),
    area: pick(AREAS),
    plan,
    locked,
    joinedAt,
    planStartedAt,
    planRenewsAt: planStartedAt + 30 * DAY,
    monthlyFee: PLAN_FEE[plan],
    customers,
    customersAdded: Math.max(0, Math.round((customers * growthPct) / 100)),
    growthPct,
    platformRevenue: PLAN_FEE[plan] * renewals,
    renewals,
    ageDays,
    outstanding: rng() < 0.3 ? between(299, 2999) : 0,
    devicesUsed: Math.min(PLAN_SEATS[plan] + between(0, 1), between(1, PLAN_SEATS[plan] + 1)),
    deviceLimit: PLAN_SEATS[plan],
    lastLoginAt: NOW - between(0, 96) * 3_600_000,
    customersTrend: growthSeries(customers, growthPct),
  };
});

// ── Platform users ────────────────────────────────────────────────────────
export const users: AdminUser[] = owners.slice(0, 30).flatMap((o, i) => {
  const operator: AdminUser = {
    id: `usr_op_${i}`,
    name: o.ownerName,
    email: o.email,
    phone: o.phone,
    role: 'operator',
    joinedAt: o.joinedAt,
    lastActiveAt: o.lastLoginAt,
    status: o.locked ? 'Blocked' : rng() < 0.08 ? 'Flagged' : 'Active',
    city: o.city,
  };
  const customerName = fullName();
  const customer: AdminUser = {
    id: `usr_cu_${i}`,
    name: customerName,
    email: null,
    phone: phone(),
    role: 'customer',
    joinedAt: o.joinedAt + between(1, 90) * DAY,
    lastActiveAt: NOW - between(0, 240) * 3_600_000,
    status: rng() < 0.05 ? 'Flagged' : 'Active',
    city: o.city,
  };
  return [operator, customer];
});

users.unshift({
  id: 'usr_admin_1',
  name: 'Teatap Admin',
  email: 'admin.teatap@gmail.com',
  phone: '9876543210',
  role: 'admin',
  joinedAt: NOW - 900 * DAY,
  lastActiveAt: NOW - 60_000,
  status: 'Active',
  city: 'Pune',
});

// ── Customers across all tenants ──────────────────────────────────────────
export const customers: Customer[] = Array.from({ length: 140 }, (_, i) => {
  const owner = owners[between(0, owners.length - 1)];
  const dailyCups = between(1, 6);
  const rate = pick([10, 12, 14, 15, 18]);
  const cupsThisMonth = dailyCups * between(18, 30);
  const outstanding = rng() < 0.45 ? Math.round(cupsThisMonth * rate * (0.3 + rng() * 0.7)) : 0;

  return {
    id: `cus_${String(i + 1).padStart(3, '0')}`,
    name: fullName(),
    phone: phone(),
    address: `${between(1, 220)}, ${pick(['MG Road', 'FC Road', 'Station Road', 'Market Lane', 'Ring Road'])}`,
    area: pick(AREAS),
    vendorId: owner.id,
    vendorName: owner.businessName,
    dailyCups,
    ratePerCup: rate,
    outstanding,
    cupsThisMonth,
    monthsActive: between(1, 26),
    status: outstanding === 0 ? 'paid' : outstanding > 600 ? 'overdue' : 'pending',
    joinedAt: NOW - between(20, 700) * DAY,
    blocked: rng() < 0.06,
  };
});

// ── Plans ─────────────────────────────────────────────────────────────────
export const plans: Plan[] = [
  {
    id: 'plan_trial',
    tier: 'Trial',
    name: 'Trial',
    price: 0,
    deviceSeats: 1,
    trialDays: 14,
    features: ['One device', 'Up to 25 customers', 'Email support'],
    isActive: true,
    popular: false,
  },
  {
    id: 'plan_starter',
    tier: 'Starter',
    name: 'Starter',
    price: 299,
    deviceSeats: 2,
    trialDays: 0,
    features: ['2 devices', 'Single area', 'Daily billing', 'Email support'],
    isActive: true,
    popular: false,
  },
  {
    id: 'plan_pro',
    tier: 'Pro',
    name: 'Pro',
    price: 499,
    deviceSeats: 5,
    trialDays: 0,
    features: [
      '5 devices',
      'Multiple areas',
      'Automatic invoices',
      'UPI collection',
      'Priority support',
    ],
    isActive: true,
    popular: true,
  },
  {
    id: 'plan_enterprise',
    tier: 'Enterprise',
    name: 'Enterprise',
    price: 1499,
    deviceSeats: 15,
    trialDays: 0,
    features: [
      '15 devices',
      'Unlimited areas',
      'Dedicated account manager',
      'Custom reports',
      'Phone support',
    ],
    isActive: true,
    popular: false,
  },
];

// ── Subscriptions & seats ─────────────────────────────────────────────────
export const subscriptions: Subscription[] = owners.map((o, i) => ({
  id: `sub_${String(i + 1).padStart(3, '0')}`,
  ownerId: o.id,
  operatorName: o.businessName,
  plan: o.plan,
  startedAt: o.planStartedAt,
  renewsAt: o.planRenewsAt,
  amount: o.monthlyFee,
  status: o.plan === 'Trial' ? 'Trialing' : o.locked ? 'Past due' : rng() < 0.06 ? 'Cancelled' : 'Active',
  autoRenew: !o.locked && rng() < 0.85,
}));

export const devices: DeviceSeat[] = owners.map((o) => ({
  ownerId: o.id,
  operatorName: o.businessName,
  plan: o.plan,
  used: o.devicesUsed,
  limit: o.deviceLimit,
  lastLoginAt: o.lastLoginAt,
  platform: pick(['Android', 'iOS', 'Web'] as const),
}));

/** Ranked by the customer base a vendor has built — the platform's metric. */
export const leaderboard: LeaderboardEntry[] = [...owners]
  .sort((a, b) => b.customers - a.customers)
  .slice(0, 15)
  .map((o, i) => ({
    rank: i + 1,
    ownerId: o.id,
    name: o.businessName,
    city: o.city,
    customers: o.customers,
    customersAdded: o.customersAdded,
    platformRevenue: o.platformRevenue,
    growth: o.growthPct,
  }));

/**
 * Platform invoices: what each vendor owes *us* for their subscription.
 *
 * The admin console bills vendors; vendors bill their own customers. Those
 * are different ledgers and only the first one belongs here.
 */
export const bills: Bill[] = subscriptions
  .filter((s) => s.amount > 0)
  .flatMap((subscription, i) => {
    const owner = owners.find((o) => o.id === subscription.ownerId)!;
    const cycles = Math.min(3, Math.max(1, subscription.status === 'Trialing' ? 1 : 3));

    return Array.from({ length: cycles }, (_, cycle) => {
      const issuedAt = subscription.renewsAt - (cycle + 1) * 30 * DAY;
      const overdue = subscription.status === 'Past due' && cycle === 0;
      const paid = !overdue && (cycle > 0 || rng() < 0.72);

      return {
        id: `bil_${i}_${cycle}`,
        invoiceNo: `TT-${String(4200 + i * 3 + cycle)}`,
        vendorId: owner.id,
        vendorName: owner.businessName,
        plan: subscription.plan,
        issuedAt,
        dueDate: issuedAt + 7 * DAY,
        paidOn: paid ? issuedAt + between(0, 6) * DAY : null,
        amount: subscription.amount,
        status: paid ? 'paid' : overdue ? 'overdue' : 'pending',
      } satisfies Bill;
    });
  });

export const payments: Payment[] = bills
  .filter((b) => b.paidOn !== null)
  .map((bill, i) => ({
    id: `pay_${String(i + 1).padStart(3, '0')}`,
    vendorName: bill.vendorName,
    invoiceNo: bill.invoiceNo,
    amount: bill.amount,
    method: pick(['upi', 'card', 'netbanking'] as const),
    paidAt: bill.paidOn!,
  }));

// ── Releases ──────────────────────────────────────────────────────────────
const RELEASE_SEED: Array<
  [Release['platforms'], string, number, number, Release['status'], number, boolean, string[]]
> = [
  [['Android', 'iOS'], '2.6.0', 260, 2, 'Rolling out', 35, false, ['Chat with the platform admin', 'Faster customer search', 'Fixes for offline tea entry']],
  [['Android', 'iOS'], '2.5.2', 252, 21, 'Live', 100, false, ['Fixed duplicate entries on 4 Aug', 'Invoice PDF layout']],
  [['Android', 'iOS'], '2.4.0', 240, 74, 'Live', 100, true, ['Areas replace route letters', 'UPI collection']],
  [['Android'], '2.1.0', 210, 190, 'Deprecated', 100, false, ['Legacy billing engine']],
  [['Web'], '1.9.0', 190, 5, 'Live', 100, true, ['Admin console redesign', 'Plan management']],
  [['Web'], '1.8.2', 182, 40, 'Deprecated', 100, false, ['Old dashboard layout']],
];

export const releases: Release[] = RELEASE_SEED.map(
  ([platforms, version, build, daysAgo, status, rollout, isMinimumSupported, notes], i) => ({
    id: `rel_${i + 1}`,
    platforms,
    version,
    build,
    releasedAt: NOW - daysAgo * DAY,
    status,
    rollout,
    isMinimumSupported,
    notes,
    adoption: status === 'Draft' ? 0 : status === 'Rolling out' ? between(18, 40) : between(45, 96),
  }),
);

// ── Comms ─────────────────────────────────────────────────────────────────
const NOTIF_SEED: Array<[string, string, NotificationItem['kind'], NotificationItem['audience']]> = [
  ['August billing cycle opened', 'Invoices for 1,240 customers were generated automatically.', 'system', 'all'],
  ['Payout settled', '₹2,84,600 transferred to 38 operator accounts.', 'payment', 'operator'],
  ['3 accounts auto-locked', 'Subscription past due for more than 7 days.', 'alert', 'admin'],
  ['New plan live', 'Enterprise now includes 15 device seats.', 'system', 'operator'],
  ['Monsoon offer', 'Free cutting chai on orders above ₹100 this week.', 'order', 'customer'],
  ['Device limit reached', 'Gokul Tea House is using 5 of 5 seats.', 'alert', 'admin'],
  ['Support backlog', '6 tickets have been open for over 48 hours.', 'chat', 'admin'],
  ['Rate revision approved', 'Masala Chai moves from ₹12 to ₹14 from 15 Aug.', 'system', 'all'],
];

export const notifications: NotificationItem[] = NOTIF_SEED.map(([title, body, kind, audience], i) => ({
  id: `ntf_${i + 1}`,
  title,
  body,
  kind,
  audience,
  at: NOW - between(1, 300) * 3_600_000,
  unread: i < 3,
}));

export const supportRequests: SupportRequest[] = Array.from({ length: 18 }, (_, i) => {
  const owner = owners[between(0, owners.length - 1)];
  return {
    id: `sup_${String(i + 1).padStart(3, '0')}`,
    subject: pick([
      'Cannot mark bill as paid',
      'Device seat stuck after reinstall',
      'Customer list not syncing',
      'UPI payment shows pending',
      'Need invoice for GST filing',
      'Route change not saving',
      'Duplicate tea entry for 04 Aug',
    ]),
    ownerName: owner.businessName,
    city: owner.city,
    openedAt: NOW - between(1, 200) * 3_600_000,
    priority: pick(['Low', 'Normal', 'High', 'Urgent'] as const),
    status: i < 6 ? 'Open' : i < 11 ? 'Pending' : 'Resolved',
    messages: between(1, 14),
  };
});

// ── Chat ──────────────────────────────────────────────────────────────────
const THREAD_SEED: Array<[string, string, number]> = [
  ['Device seat stuck after reinstall — can you free one?', 'them', 12],
  ['Bhai, subscription renew ho gaya kya?', 'them', 40],
  ['Invoice ke liye GST number update karna hai.', 'them', 95],
  ['Thanks, sab theek ho gaya 🙏', 'them', 180],
  ['Aaj ka collection dashboard pe nahi dikh raha.', 'them', 6],
  ['New route add karna hai, plan upgrade karna padega?', 'them', 22],
  ['Payment reminder customers ko bhej diya?', 'them', 300],
  ['App update ke baad login nahi ho raha.', 'them', 3],
];

export const chatThreads: ChatThread[] = THREAD_SEED.map(([text, , hoursAgo], i) => {
  const owner = owners[i * 3];
  const asCustomer = i % 3 === 2;
  const customer = customers[i * 7];

  return {
    id: `thr_${i + 1}`,
    peerId: asCustomer ? customer.id : owner.id,
    peerName: asCustomer ? customer.name : owner.businessName,
    peerRole: asCustomer ? ('customer' as const) : ('operator' as const),
    context: asCustomer ? `Customer · ${customer.vendorName}` : `${owner.city} · ${owner.plan}`,
    lastMessage: text,
    lastAt: NOW - hoursAgo * 3_600_000,
    unread: i < 3 ? between(1, 4) : 0,
    online: i % 2 === 0,
  };
});

const REPLY_SEED: Record<string, Array<[string, 'me' | 'them', number]>> = {
  thr_1: [
    ['Namaste! Ek problem hai.', 'them', 14],
    ['Boliye, main dekhta hoon.', 'me', 13.6],
    ['Phone reinstall kiya to seat free nahi hui, ab 5/5 dikha raha hai.', 'them', 13.2],
    ['Samajh gaya — purana device abhi bhi count ho raha hai. Main release kar deta hoon.', 'me', 12.6],
    ['Device seat stuck after reinstall — can you free one?', 'them', 12],
  ],
  thr_2: [
    ['Bhai, subscription renew ho gaya kya?', 'them', 40],
    ['Haan, 12 Aug tak active hai. Auto-renew bhi on hai.', 'me', 39],
  ],
  thr_5: [
    ['Aaj ka collection dashboard pe nahi dikh raha.', 'them', 6],
    ['Check kar raha hoon, 5 minute dijiye.', 'me', 5.8],
  ],
};

export const chatMessages: ChatMessage[] = chatThreads.flatMap((thread) => {
  const scripted = REPLY_SEED[thread.id];
  if (scripted) {
    return scripted.map(([text, sender, hoursAgo], i) => ({
      id: `${thread.id}_m${i}`,
      threadId: thread.id,
      text,
      sender,
      at: NOW - hoursAgo * 3_600_000,
      status: 'read' as const,
    }));
  }
  return [
    {
      id: `${thread.id}_m0`,
      threadId: thread.id,
      text: thread.lastMessage,
      sender: 'them' as const,
      at: thread.lastAt,
      status: 'read' as const,
    },
  ];
});

export const activity: ActivityEvent[] = [
  { id: 'a1', kind: 'signup', title: 'Tapri Chai Corner joined', detail: 'Pune · Starter plan · 12 customers imported', at: NOW - 42 * 60_000 },
  { id: 'a2', kind: 'payment', title: '₹18,400 collected', detail: 'Amrut Tea Stall · 34 bills settled today', at: NOW - 2 * 3_600_000 },
  { id: 'a3', kind: 'plan', title: 'Kadak Tea Point upgraded', detail: 'Starter → Pro · 5 device seats unlocked', at: NOW - 5 * 3_600_000 },
  { id: 'a4', kind: 'lock', title: 'Yari Cutting Co. locked', detail: 'Subscription past due for 9 days', at: NOW - 9 * 3_600_000 },
  { id: 'a5', kind: 'support', title: 'Ticket escalated to urgent', detail: 'Device seat stuck after reinstall · Nashik', at: NOW - 26 * 3_600_000 },
  { id: 'a6', kind: 'signup', title: 'Shivneri Tea House joined', detail: 'Nagpur · Trial · onboarding in progress', at: NOW - 34 * 3_600_000 },
];

// ── Aggregates ────────────────────────────────────────────────────────────
const MONTHS = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];

const totalCustomers = owners.reduce((s, o) => s + o.customers, 0);
const activeSubscriptions = subscriptions.filter((s) => s.status === 'Active');
const mrr = activeSubscriptions.reduce((sum, s) => sum + s.amount, 0);

export const dashboardStats: DashboardStats = {
  totalUsers: totalCustomers + owners.length,
  totalVendors: owners.length,
  activeVendors: owners.filter((o) => !o.locked).length,
  blockedAccounts:
    owners.filter((o) => o.locked).length + customers.filter((c) => c.blocked).length,
  totalCustomers,
  newUsersThisMonth: owners.reduce((s, o) => s + o.customersAdded, 0) + 6,
  mrr,
  arpv: Math.round(mrr / Math.max(1, activeSubscriptions.length)),
  deltas: { users: 12.1, vendors: 8.4, customers: 11.6, mrr: 9.3 },
  userGrowth: {
    labels: MONTHS,
    vendors: [21, 26, 31, 36, 42, owners.length],
    customers: [2180, 2740, 3260, 3910, 4520, totalCustomers],
  },
  mrrByMonth: {
    labels: MONTHS,
    values: [12_400, 15_100, 18_300, 21_600, 24_900, mrr],
  },
  signupsLast14Days: [4, 6, 3, 8, 11, 7, 2, 5, 9, 12, 10, 6, 8, 14],
  planMix: PLANS.map((plan) => ({
    label: plan,
    value: owners.filter((o) => o.plan === plan).length,
  })),
  cityMix: CITIES.map((city) => ({
    label: city,
    value: owners.filter((o) => o.city === city).length,
  })).sort((a, b) => b.value - a.value),
  roleMix: [
    { label: 'Customers', value: totalCustomers },
    { label: 'Vendors', value: owners.length },
    { label: 'Admins', value: users.filter((u) => u.role === 'admin').length },
  ],
};
