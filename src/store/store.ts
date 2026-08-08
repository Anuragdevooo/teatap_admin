import { useSyncExternalStore } from 'react';
import * as seed from '@/mocks/seed';
import type {
  ActivityEvent,
  AdminUser,
  Bill,
  ChatMessage,
  ChatThread,
  Customer,
  DeviceSeat,
  NotificationItem,
  Owner,
  Payment,
  Plan,
  Release,
  Subscription,
  SupportRequest,
} from '@/types/domain';

/**
 * The console's single source of truth.
 *
 * Every mutating action in the UI writes here, and every screen reads from
 * here — so blocking a vendor on one page is visible in the dashboard counts,
 * the subscription table and the device list without any refetch or prop
 * threading. That is the whole reason this is a store and not per-page state.
 *
 * It is a hand-rolled observable rather than Redux/Zustand for the same reason
 * the charts are hand-rolled: the surface needed is one object and a notify
 * loop, and `useSyncExternalStore` already gives us tearing-free reads.
 */

export interface State {
  /** True until the initial (simulated) load resolves. */
  loading: boolean;
  owners: Owner[];
  users: AdminUser[];
  customers: Customer[];
  plans: Plan[];
  subscriptions: Subscription[];
  bills: Bill[];
  payments: Payment[];
  devices: DeviceSeat[];
  notifications: NotificationItem[];
  releases: Release[];
  support: SupportRequest[];
  activity: ActivityEvent[];
  chatThreads: ChatThread[];
  chatMessages: ChatMessage[];
}

const EMPTY: State = {
  loading: true,
  owners: [],
  users: [],
  customers: [],
  plans: [],
  subscriptions: [],
  bills: [],
  payments: [],
  devices: [],
  notifications: [],
  releases: [],
  support: [],
  activity: [],
  chatThreads: [],
  chatMessages: [],
};

let state: State = EMPTY;
const listeners = new Set<() => void>();

export const getState = () => state;

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Applies a patch and notifies. Always produces a new top-level object so
 * `useSyncExternalStore` sees a changed snapshot; slices that did not change
 * keep their identity, so memoised derivations downstream stay stable.
 */
export function setState(patch: Partial<State> | ((current: State) => Partial<State>)) {
  const next = typeof patch === 'function' ? patch(state) : patch;
  state = { ...state, ...next };
  for (const listener of listeners) listener();
}

/** Read the whole store. Components memoise their own derivations from it. */
export const useStore = () => useSyncExternalStore(subscribe, getState);

let hydrated = false;

/**
 * One-time hydration from the fixtures, behind a short delay so skeleton and
 * empty states stay exercised during development instead of rotting behind
 * synchronous data.
 */
export function hydrate() {
  if (hydrated) return;
  hydrated = true;

  window.setTimeout(() => {
    setState({
      loading: false,
      owners: seed.owners,
      users: seed.users,
      customers: seed.customers,
      plans: seed.plans,
      subscriptions: seed.subscriptions,
      bills: seed.bills,
      payments: seed.payments,
      devices: seed.devices,
      notifications: seed.notifications,
      releases: seed.releases,
      support: seed.supportRequests,
      activity: seed.activity,
      chatThreads: seed.chatThreads,
      chatMessages: seed.chatMessages,
    });
  }, 380);
}

/** Monotonic ids for records created in-session. */
let sequence = 0;
export const nextId = (prefix: string) => `${prefix}_new_${++sequence}`;

/** Records an entry at the top of the activity feed. */
export function pushActivity(event: Omit<ActivityEvent, 'id' | 'at'>) {
  setState((current) => ({
    activity: [
      { ...event, id: nextId('act'), at: Date.now() },
      ...current.activity,
    ].slice(0, 40),
  }));
}
