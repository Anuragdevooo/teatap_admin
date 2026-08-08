import { getState, nextId, pushActivity, setState } from './store';
import type {
  AdminUser,
  ChatMessage,
  Customer,
  NotificationItem,
  Owner,
  Plan,
  PlanTier,
  Release,
  Subscription,
} from '@/types/domain';

/**
 * Every mutation the console can perform.
 *
 * Actions are plain functions, not hooks, so they can be called from a menu
 * item, a modal footer or a confirm dialog without ceremony. Each one keeps
 * the *derived* slices consistent — locking a vendor also moves its
 * subscription to "Past due" and blocks its operator login, because that is
 * what the platform would really do.
 */

const DAY = 86_400_000;

export const PLAN_FEE: Record<PlanTier, number> = {
  Trial: 0,
  Starter: 299,
  Pro: 499,
  Enterprise: 1499,
};

export const PLAN_SEATS: Record<PlanTier, number> = {
  Trial: 1,
  Starter: 2,
  Pro: 5,
  Enterprise: 15,
};

// ── Vendors (tea shop owners) ─────────────────────────────────────────────

/**
 * Locking a vendor is the platform's hard stop: the shop cannot bill, its
 * operator cannot sign in, and the subscription is marked past due. Unlocking
 * reverses all three, so the action is symmetric and safe to toggle.
 */
export function setVendorLocked(vendorId: string, locked: boolean) {
  const { owners } = getState();
  const vendor = owners.find((o) => o.id === vendorId);
  if (!vendor) return;

  setState((current) => ({
    owners: current.owners.map((o) => (o.id === vendorId ? { ...o, locked } : o)),
    subscriptions: current.subscriptions.map((s) =>
      s.ownerId === vendorId
        ? { ...s, status: locked ? 'Past due' : s.plan === 'Trial' ? 'Trialing' : 'Active' }
        : s,
    ),
    users: current.users.map((u) =>
      u.role === 'operator' && u.name === vendor.ownerName
        ? { ...u, status: locked ? 'Blocked' : 'Active' }
        : u,
    ),
  }));

  pushActivity({
    kind: 'lock',
    title: `${vendor.businessName} ${locked ? 'locked' : 'unlocked'}`,
    detail: locked
      ? 'Billing suspended and operator sign-in blocked.'
      : 'Access restored — billing resumes on the next cycle.',
  });
}

export function createVendor(input: {
  businessName: string;
  ownerName: string;
  phone: string;
  email: string | null;
  city: string;
  area: string;
  plan: PlanTier;
}) {
  const now = Date.now();
  const id = nextId('own');

  const vendor: Owner = {
    id,
    businessName: input.businessName,
    ownerName: input.ownerName,
    phone: input.phone,
    email: input.email,
    city: input.city,
    area: input.area,
    plan: input.plan,
    locked: false,
    joinedAt: now,
    planStartedAt: now,
    planRenewsAt: now + 30 * DAY,
    monthlyFee: PLAN_FEE[input.plan],
    customers: 0,
    customersAdded: 0,
    growthPct: 0,
    platformRevenue: 0,
    renewals: 0,
    ageDays: 0,
    outstanding: 0,
    devicesUsed: 0,
    deviceLimit: PLAN_SEATS[input.plan],
    lastLoginAt: now,
    customersTrend: Array(14).fill(0),
  };

  const subscription: Subscription = {
    id: nextId('sub'),
    ownerId: id,
    operatorName: input.businessName,
    plan: input.plan,
    startedAt: now,
    renewsAt: now + 30 * DAY,
    amount: PLAN_FEE[input.plan],
    status: input.plan === 'Trial' ? 'Trialing' : 'Active',
    autoRenew: true,
  };

  const operator: AdminUser = {
    id: nextId('usr'),
    name: input.ownerName,
    email: input.email,
    phone: input.phone,
    role: 'operator',
    joinedAt: now,
    lastActiveAt: now,
    status: 'Active',
    city: input.city,
  };

  setState((current) => ({
    owners: [vendor, ...current.owners],
    subscriptions: [subscription, ...current.subscriptions],
    users: [operator, ...current.users],
    devices: [
      {
        ownerId: id,
        operatorName: input.businessName,
        plan: input.plan,
        used: 0,
        limit: PLAN_SEATS[input.plan],
        lastLoginAt: now,
        platform: 'Android',
      },
      ...current.devices,
    ],
  }));

  pushActivity({
    kind: 'signup',
    title: `${input.businessName} joined`,
    detail: `${input.city} · ${input.plan} plan · operator invited`,
  });

  return vendor;
}

export function updateVendor(vendorId: string, patch: Partial<Owner>) {
  setState((current) => ({
    owners: current.owners.map((o) => (o.id === vendorId ? { ...o, ...patch } : o)),
  }));
}

export function deleteVendor(vendorId: string) {
  const vendor = getState().owners.find((o) => o.id === vendorId);
  setState((current) => ({
    owners: current.owners.filter((o) => o.id !== vendorId),
    subscriptions: current.subscriptions.filter((s) => s.ownerId !== vendorId),
    devices: current.devices.filter((d) => d.ownerId !== vendorId),
  }));
  if (vendor) {
    pushActivity({
      kind: 'lock',
      title: `${vendor.businessName} removed`,
      detail: 'Tenant deleted along with its subscription and device seats.',
    });
  }
}

// ── Plans ─────────────────────────────────────────────────────────────────

/** Live price for a tier, falling back to the constant if a plan was removed. */
const planFor = (tier: PlanTier) => getState().plans.find((p) => p.tier === tier);
export const priceOf = (tier: PlanTier) => planFor(tier)?.price ?? PLAN_FEE[tier];
export const seatsOf = (tier: PlanTier) => planFor(tier)?.deviceSeats ?? PLAN_SEATS[tier];

/**
 * Editing a plan re-prices every vendor already on that tier, and re-issues
 * their device allowance. Anything less would leave the plan card and the
 * subscription table telling two different stories.
 */
export function updatePlan(planId: string, patch: Partial<Plan>) {
  const plan = getState().plans.find((p) => p.id === planId);
  if (!plan) return;
  const next = { ...plan, ...patch };

  setState((current) => ({
    plans: current.plans.map((p) => (p.id === planId ? next : p)),
    subscriptions: current.subscriptions.map((s) =>
      s.plan === next.tier ? { ...s, amount: next.price } : s,
    ),
    owners: current.owners.map((o) =>
      o.plan === next.tier
        ? { ...o, monthlyFee: next.price, deviceLimit: next.deviceSeats }
        : o,
    ),
    devices: current.devices.map((d) =>
      d.plan === next.tier ? { ...d, limit: next.deviceSeats } : d,
    ),
  }));

  pushActivity({
    kind: 'plan',
    title: `${next.name} plan updated`,
    detail: `₹${next.price}/mo · ${next.deviceSeats} device seats · applied to every vendor on this tier`,
  });
}

export function createPlan(input: {
  tier: PlanTier;
  name: string;
  price: number;
  deviceSeats: number;
  trialDays: number;
  features: string[];
}) {
  setState((current) => ({
    plans: [...current.plans, { ...input, id: nextId('plan'), isActive: true, popular: false }],
  }));

  pushActivity({
    kind: 'plan',
    title: `${input.name} plan created`,
    detail: `₹${input.price}/mo · ${input.deviceSeats} device seats`,
  });
}

/** Refuses to remove a plan that vendors are still subscribed to. */
export function deletePlan(planId: string): { ok: boolean; inUse: number } {
  const plan = getState().plans.find((p) => p.id === planId);
  if (!plan) return { ok: false, inUse: 0 };

  const inUse = getState().subscriptions.filter((s) => s.plan === plan.tier).length;
  if (inUse > 0) return { ok: false, inUse };

  setState((current) => ({ plans: current.plans.filter((p) => p.id !== planId) }));
  pushActivity({ kind: 'plan', title: `${plan.name} plan removed`, detail: 'No vendors were on it.' });
  return { ok: true, inUse: 0 };
}

export function setPlanActive(planId: string, isActive: boolean) {
  setState((current) => ({
    plans: current.plans.map((p) => (p.id === planId ? { ...p, isActive } : p)),
  }));
}

/** Only one plan can wear the "popular" badge at a time. */
export function setPopularPlan(planId: string) {
  setState((current) => ({
    plans: current.plans.map((p) => ({ ...p, popular: p.id === planId })),
  }));
}

// ── Subscriptions ─────────────────────────────────────────────────────────

/**
 * Plan changes touch three records at once — the subscription, the vendor's
 * billed fee, and its device allowance. Keeping that in one action is what
 * stops the seats table from disagreeing with the plan badge.
 */
export function changePlan(ownerId: string, plan: PlanTier) {
  const previous = getState().subscriptions.find((s) => s.ownerId === ownerId);
  const price = priceOf(plan);
  const seats = seatsOf(plan);

  setState((current) => ({
    subscriptions: current.subscriptions.map((s) =>
      s.ownerId === ownerId
        ? {
            ...s,
            plan,
            amount: price,
            status: plan === 'Trial' ? 'Trialing' : s.status === 'Cancelled' ? 'Active' : s.status,
          }
        : s,
    ),
    owners: current.owners.map((o) =>
      o.id === ownerId ? { ...o, plan, monthlyFee: price, deviceLimit: seats } : o,
    ),
    devices: current.devices.map((d) =>
      d.ownerId === ownerId ? { ...d, plan, limit: seats } : d,
    ),
  }));

  if (previous && previous.plan !== plan) {
    pushActivity({
      kind: 'plan',
      title: `${previous.operatorName} moved to ${plan}`,
      detail: `${previous.plan} → ${plan} · ${seats} device seats`,
    });
  }
}

export function setAutoRenew(ownerId: string, autoRenew: boolean) {
  setState((current) => ({
    subscriptions: current.subscriptions.map((s) =>
      s.ownerId === ownerId ? { ...s, autoRenew } : s,
    ),
  }));
}

/** Pushes the renewal date out by whole billing cycles. */
export function extendSubscription(ownerId: string, months: number) {
  setState((current) => ({
    subscriptions: current.subscriptions.map((s) =>
      s.ownerId === ownerId
        ? {
            ...s,
            renewsAt: Math.max(s.renewsAt, Date.now()) + months * 30 * DAY,
            status: s.status === 'Past due' ? 'Active' : s.status,
          }
        : s,
    ),
  }));

  const sub = getState().subscriptions.find((s) => s.ownerId === ownerId);
  if (sub) {
    pushActivity({
      kind: 'payment',
      title: `${sub.operatorName} renewed`,
      detail: `${months} month${months > 1 ? 's' : ''} added to the billing cycle.`,
    });
  }
}

export function setSubscriptionStatus(ownerId: string, status: Subscription['status']) {
  setState((current) => ({
    subscriptions: current.subscriptions.map((s) =>
      s.ownerId === ownerId ? { ...s, status, autoRenew: status === 'Cancelled' ? false : s.autoRenew } : s,
    ),
  }));

  const sub = getState().subscriptions.find((s) => s.ownerId === ownerId);
  if (sub) {
    pushActivity({
      kind: 'plan',
      title: `${sub.operatorName} subscription ${status.toLowerCase()}`,
      detail:
        status === 'Cancelled'
          ? 'Access continues until the end of the paid period.'
          : 'Billing state updated by an admin.',
    });
  }
}

// ── Platform users ────────────────────────────────────────────────────────

export function setUserStatus(userId: string, status: AdminUser['status']) {
  const user = getState().users.find((u) => u.id === userId);

  setState((current) => ({
    users: current.users.map((u) => (u.id === userId ? { ...u, status } : u)),
  }));

  if (user) {
    pushActivity({
      kind: status === 'Blocked' ? 'lock' : 'signup',
      title: `${user.name} ${status.toLowerCase()}`,
      detail: `${user.role[0].toUpperCase() + user.role.slice(1)} account · ${user.city}`,
    });
  }
}

export function updateUser(userId: string, patch: Partial<AdminUser>) {
  setState((current) => ({
    users: current.users.map((u) => (u.id === userId ? { ...u, ...patch } : u)),
  }));
}

export function setUserRole(userId: string, role: AdminUser['role']) {
  setState((current) => ({
    users: current.users.map((u) => (u.id === userId ? { ...u, role } : u)),
  }));
}

// ── Customers ─────────────────────────────────────────────────────────────

const customerStatus = (outstanding: number): Customer['status'] =>
  outstanding === 0 ? 'paid' : outstanding > 600 ? 'overdue' : 'pending';

/**
 * The admin registers *who* a customer is and which vendor serves them. How
 * many cups they take and at what rate is set by the vendor in their own app,
 * so those start at zero here rather than being guessed at.
 */
export function createCustomer(input: {
  name: string;
  phone: string;
  address: string;
  area: string;
  vendorId: string;
}) {
  const vendor = getState().owners.find((o) => o.id === input.vendorId);

  const customer: Customer = {
    id: nextId('cus'),
    name: input.name,
    phone: input.phone,
    address: input.address,
    area: input.area,
    vendorId: input.vendorId,
    vendorName: vendor?.businessName ?? 'Unassigned',
    dailyCups: 0,
    ratePerCup: 0,
    outstanding: 0,
    cupsThisMonth: 0,
    monthsActive: 0,
    status: 'paid',
    joinedAt: Date.now(),
    blocked: false,
  };

  setState((current) => ({
    customers: [customer, ...current.customers],
    owners: current.owners.map((o) =>
      o.id === input.vendorId ? { ...o, customers: o.customers + 1 } : o,
    ),
  }));

  pushActivity({
    kind: 'signup',
    title: `${input.name} added`,
    detail: `${vendor?.businessName ?? 'Unassigned'} · ${input.area}`,
  });

  return customer;
}

export function updateCustomer(customerId: string, patch: Partial<Customer>) {
  setState((current) => ({
    customers: current.customers.map((c) => {
      if (c.id !== customerId) return c;
      const next = { ...c, ...patch };
      // Status is derived, never set by hand — otherwise the badge and the
      // amount can drift apart after an edit.
      return { ...next, status: customerStatus(next.outstanding) };
    }),
  }));
}

/** Clears a customer's dues, as an operator would after a cash collection. */
export function settleCustomerDues(customerId: string) {
  const customer = getState().customers.find((c) => c.id === customerId);
  if (!customer || customer.outstanding === 0) return;

  // No platform payment is recorded: this money is owed to the vendor, not
  // to us. The console tracks it only so an admin can answer "why is this
  // customer marked overdue".
  setState((current) => ({
    customers: current.customers.map((c) =>
      c.id === customerId ? { ...c, outstanding: 0, status: 'paid' } : c,
    ),
  }));

  pushActivity({
    kind: 'payment',
    title: `₹${customer.outstanding} collected`,
    detail: `${customer.name} · ${customer.vendorName}`,
  });
}

/**
 * Blocking a customer stops delivery and billing but keeps the record — an
 * admin needs the history to settle whatever is still owed.
 */
export function setCustomerBlocked(customerId: string, blocked: boolean) {
  const customer = getState().customers.find((c) => c.id === customerId);

  setState((current) => ({
    customers: current.customers.map((c) => (c.id === customerId ? { ...c, blocked } : c)),
  }));

  if (customer) {
    pushActivity({
      kind: 'lock',
      title: `${customer.name} ${blocked ? 'blocked' : 'unblocked'}`,
      detail: blocked
        ? `Deliveries paused · ${customer.vendorName}`
        : `Deliveries resumed · ${customer.vendorName}`,
    });
  }
}

export function deleteCustomer(customerId: string) {
  const customer = getState().customers.find((c) => c.id === customerId);
  setState((current) => ({
    customers: current.customers.filter((c) => c.id !== customerId),
    owners: current.owners.map((o) =>
      o.id === customer?.vendorId ? { ...o, customers: Math.max(0, o.customers - 1) } : o,
    ),
  }));
}

// ── Billing ───────────────────────────────────────────────────────────────

/**
 * Settles a platform invoice. Recording the matching payment here is what
 * keeps the two tabs of the billing ledger — invoices and receipts — from
 * ever disagreeing about how much came in.
 */
export function markBillPaid(billId: string) {
  const bill = getState().bills.find((b) => b.id === billId);
  if (!bill || bill.status === 'paid') return;

  const paidOn = Date.now();

  setState((current) => ({
    bills: current.bills.map((b) => (b.id === billId ? { ...b, status: 'paid', paidOn } : b)),
    payments: [
      {
        id: nextId('pay'),
        vendorName: bill.vendorName,
        invoiceNo: bill.invoiceNo,
        amount: bill.amount,
        method: 'upi' as const,
        paidAt: paidOn,
      },
      ...current.payments,
    ],
    // A vendor that pays up is no longer past due.
    subscriptions: current.subscriptions.map((s) =>
      s.ownerId === bill.vendorId && s.status === 'Past due' ? { ...s, status: 'Active' } : s,
    ),
  }));

  pushActivity({
    kind: 'payment',
    title: `${bill.invoiceNo} settled`,
    detail: `${bill.vendorName} · ₹${bill.amount}`,
  });
}

// ── Comms ─────────────────────────────────────────────────────────────────

export function publishNotification(input: Omit<NotificationItem, 'id' | 'at' | 'unread'>) {
  setState((current) => ({
    notifications: [
      { ...input, id: nextId('ntf'), at: Date.now(), unread: true },
      ...current.notifications,
    ],
  }));
}

export function markNotificationRead(id: string) {
  setState((current) => ({
    notifications: current.notifications.map((n) => (n.id === id ? { ...n, unread: false } : n)),
  }));
}

export function markAllNotificationsRead() {
  setState((current) => ({
    notifications: current.notifications.map((n) => ({ ...n, unread: false })),
  }));
}

export function setTicketStatus(ticketId: string, status: 'Open' | 'Pending' | 'Resolved') {
  setState((current) => ({
    support: current.support.map((t) => (t.id === ticketId ? { ...t, status } : t)),
  }));
}

// ── Releases ──────────────────────────────────────────────────────────────

export function createRelease(input: {
  platforms: Release['platforms'];
  version: string;
  build: number;
  notes: string[];
  status: Release['status'];
  rollout: number;
}) {
  setState((current) => ({
    releases: [
      {
        ...input,
        id: nextId('rel'),
        releasedAt: Date.now(),
        isMinimumSupported: false,
        adoption: 0,
      },
      ...current.releases,
    ],
  }));

  pushActivity({
    kind: 'plan',
    title: `${input.version} published to ${input.platforms.join(' + ')}`,
    detail:
      input.status === 'Rolling out'
        ? `Rolling out to ${input.rollout}% of users`
        : input.status,
  });
}

export function updateRelease(releaseId: string, patch: Partial<Release>) {
  setState((current) => ({
    releases: current.releases.map((r) => (r.id === releaseId ? { ...r, ...patch } : r)),
  }));
}

/**
 * Sets the minimum supported build for a platform.
 *
 * Exactly one release per platform can be the floor — two floors is not a
 * state the app could act on, so selecting a new one clears the old.
 */
export function setMinimumSupported(releaseId: string) {
  const release = getState().releases.find((r) => r.id === releaseId);
  if (!release) return;

  setState((current) => ({
    releases: current.releases.map((r) => {
      if (r.id === releaseId) return { ...r, isMinimumSupported: true };
      // Clear the flag from any release that shares a platform with the new
      // floor — two minimums on one platform is not a state the app can act on.
      const overlaps = r.platforms.some((p) => release.platforms.includes(p));
      return overlaps ? { ...r, isMinimumSupported: false } : r;
    }),
  }));

  pushActivity({
    kind: 'lock',
    title: `${release.platforms.join(' + ')} minimum set to ${release.version}`,
    detail: 'Older builds will be forced to update before they can sign in.',
  });
}

// ── Chat ──────────────────────────────────────────────────────────────────

/**
 * Sends an admin message.
 *
 * The message lands optimistically as `sending`, then walks to `sent` and
 * `delivered` on a timer. That is not decoration: without it the composer
 * gives no feedback that anything left the machine, which is the single most
 * common complaint about in-app chat.
 */
export function sendChatMessage(threadId: string, text: string) {
  const trimmed = text.trim();
  if (!trimmed) return;

  const id = nextId('msg');
  const at = Date.now();

  setState((current) => ({
    chatMessages: [
      ...current.chatMessages,
      { id, threadId, text: trimmed, sender: 'me', at, status: 'sending' },
    ],
    chatThreads: current.chatThreads.map((t) =>
      t.id === threadId ? { ...t, lastMessage: trimmed, lastAt: at, unread: 0 } : t,
    ),
  }));

  const advance = (status: ChatMessage['status'], delay: number) =>
    window.setTimeout(() => {
      setState((current) => ({
        chatMessages: current.chatMessages.map((m) => (m.id === id ? { ...m, status } : m)),
      }));
    }, delay);

  advance('sent', 450);
  advance('delivered', 1100);
}

/**
 * Opens a conversation with a vendor or customer, or returns the existing one.
 *
 * Starting a second thread with the same person is never what the admin means
 * — they want the history — so this is idempotent by peer.
 */
export function startChatThread(peer: {
  id: string;
  name: string;
  role: 'operator' | 'customer';
  context: string;
}): string {
  const existing = getState().chatThreads.find((t) => t.peerId === peer.id);
  if (existing) return existing.id;

  const id = nextId('thr');
  setState((current) => ({
    chatThreads: [
      {
        id,
        peerId: peer.id,
        peerName: peer.name,
        peerRole: peer.role,
        context: peer.context,
        lastMessage: 'No messages yet',
        lastAt: Date.now(),
        unread: 0,
        online: false,
      },
      ...current.chatThreads,
    ],
  }));
  return id;
}

export function markThreadRead(threadId: string) {
  setState((current) => ({
    chatThreads: current.chatThreads.map((t) => (t.id === threadId ? { ...t, unread: 0 } : t)),
    chatMessages: current.chatMessages.map((m) =>
      m.threadId === threadId && m.sender === 'them' ? { ...m, status: 'read' } : m,
    ),
  }));
}
