import {
  Bell,
  CreditCard,
  LayoutDashboard,
  Layers,
  LifeBuoy,
  MessageSquare,
  ReceiptIndianRupee,
  Rocket,
  Settings,
  Smartphone,
  Store,
  Trophy,
  Users,
  UsersRound,
} from 'lucide-react';
import type { ComponentType } from 'react';

export interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  /** Rendered as a count chip; omit for items that never carry a count. */
  badge?: 'support' | 'notifications' | 'chat';
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

/**
 * Navigation is data, not markup.
 *
 * Sections group by *who the admin is thinking about* — the tenant, the
 * tenant's day-to-day operation, then the people. Adding a screen means adding
 * a row here and a route; the sidebar, mobile drawer and command palette all
 * read from this one list.
 */
export const NAVIGATION: NavSection[] = [
  {
    title: 'Overview',
    items: [{ to: '/', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    title: 'People',
    items: [
      { to: '/vendors', label: 'Vendors', icon: Store },
      { to: '/customers', label: 'Customers', icon: UsersRound },
      { to: '/users', label: 'All users', icon: Users },
      { to: '/leaderboard', label: 'Vendor growth', icon: Trophy },
    ],
  },
  {
    title: 'Revenue',
    items: [
      { to: '/subscriptions', label: 'Subscriptions', icon: CreditCard },
      { to: '/plans', label: 'Plans', icon: Layers },
      { to: '/devices', label: 'Device seats', icon: Smartphone },
      { to: '/billing', label: 'Billing', icon: ReceiptIndianRupee },
    ],
  },
  {
    title: 'Conversations',
    items: [
      { to: '/chat', label: 'Chat', icon: MessageSquare, badge: 'chat' },
      { to: '/notifications', label: 'Notifications', icon: Bell, badge: 'notifications' },
      { to: '/support', label: 'Support', icon: LifeBuoy, badge: 'support' },
    ],
  },
  {
    title: 'Console',
    items: [
      { to: '/releases', label: 'Releases', icon: Rocket },
      { to: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];
