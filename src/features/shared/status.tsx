import { Badge, type BadgeTone } from '@/components/ui';
import type { PaymentStatus, PlanTier } from '@/types/domain';

/**
 * One mapping from domain state → colour, used by every screen.
 *
 * Statuses are the one place colour carries meaning on its own, so they get a
 * single definition: if "overdue" is ever recoloured, it changes everywhere at
 * once and the tables can never disagree with the dashboard.
 */

const PAYMENT_TONE: Record<PaymentStatus, BadgeTone> = {
  paid: 'success',
  pending: 'warning',
  overdue: 'danger',
};

const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  paid: 'Paid',
  pending: 'Pending',
  overdue: 'Overdue',
};

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <Badge tone={PAYMENT_TONE[status]} dot size="sm">
      {PAYMENT_LABEL[status]}
    </Badge>
  );
}

const PLAN_TONE: Record<PlanTier, BadgeTone> = {
  Trial: 'neutral',
  Starter: 'info',
  Pro: 'brand',
  Enterprise: 'accent',
};

export function PlanBadge({ plan }: { plan: PlanTier }) {
  return (
    <Badge tone={PLAN_TONE[plan]} size="sm">
      {plan}
    </Badge>
  );
}

const ACCOUNT_TONE = {
  Active: 'success',
  Flagged: 'warning',
  Blocked: 'danger',
} as const;

export function AccountStatusBadge({ status }: { status: keyof typeof ACCOUNT_TONE }) {
  return (
    <Badge tone={ACCOUNT_TONE[status]} dot size="sm">
      {status}
    </Badge>
  );
}

const SUBSCRIPTION_TONE = {
  Active: 'success',
  Trialing: 'info',
  'Past due': 'danger',
  Cancelled: 'neutral',
} as const;

export function SubscriptionStatusBadge({ status }: { status: keyof typeof SUBSCRIPTION_TONE }) {
  return (
    <Badge tone={SUBSCRIPTION_TONE[status]} dot size="sm">
      {status}
    </Badge>
  );
}

const PRIORITY_TONE = {
  Low: 'neutral',
  Normal: 'info',
  High: 'warning',
  Urgent: 'danger',
} as const;

export function PriorityBadge({ priority }: { priority: keyof typeof PRIORITY_TONE }) {
  return (
    <Badge tone={PRIORITY_TONE[priority]} size="sm">
      {priority}
    </Badge>
  );
}
