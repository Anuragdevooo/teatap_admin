import { useEffect, useState } from 'react';
import { CalendarPlus, Check, RotateCcw, XCircle } from 'lucide-react';
import { Badge, Button, Field, Modal, Select, Switch, useToast } from '@/components/ui';
import { actions, PLAN_FEE, PLAN_SEATS, useStore } from '@/store';
import { cn } from '@/lib/cn';
import { date, money } from '@/lib/format';
import type { PlanTier } from '@/types/domain';

interface SubscriptionModalProps {
  open: boolean;
  onClose: () => void;
  /** Vendor whose subscription is being managed. */
  ownerId: string | null;
}

const PLANS: PlanTier[] = ['Trial', 'Starter', 'Pro', 'Enterprise'];

const PLAN_BLURB: Record<PlanTier, string> = {
  Trial: '14 days, one device, no card required',
  Starter: 'Single route, 2 devices',
  Pro: 'Multi-route, 5 devices, priority support',
  Enterprise: 'Unlimited routes, 15 devices, dedicated manager',
};

/**
 * Subscription control for one vendor.
 *
 * Plan, cycle and lifecycle live in a single surface because they are one
 * decision in practice: an admin upgrading a shop almost always extends or
 * reactivates in the same breath. Splitting them across three menus is what
 * makes billing admin feel like paperwork.
 */
export function SubscriptionModal({ open, onClose, ownerId }: SubscriptionModalProps) {
  const { subscriptions, owners } = useStore();
  const toast = useToast();

  const subscription = subscriptions.find((s) => s.ownerId === ownerId) ?? null;
  const vendor = owners.find((o) => o.id === ownerId) ?? null;

  const [plan, setPlan] = useState<PlanTier>('Starter');
  const [months, setMonths] = useState('1');

  useEffect(() => {
    if (open && subscription) setPlan(subscription.plan);
  }, [open, subscription]);

  if (!subscription || !vendor) return null;

  const planChanged = plan !== subscription.plan;
  const cancelled = subscription.status === 'Cancelled';

  const applyPlan = () => {
    actions.changePlan(subscription.ownerId, plan);
    toast.success(
      'Plan updated',
      `${vendor.businessName} is now on ${plan} — ${PLAN_SEATS[plan]} device seats.`,
    );
  };

  const extend = () => {
    actions.extendSubscription(subscription.ownerId, Number(months));
    toast.success('Cycle extended', `Renewal moved out by ${months} month(s).`);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Manage subscription"
      description={vendor.businessName}
      size="lg"
      footer={
        <Button variant="secondary" onClick={onClose}>
          Done
        </Button>
      }
    >
      <div className="space-y-5">
        {/* Current state, so the admin never acts on a stale memory of it. */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface-2 p-4">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[15px] font-extrabold text-fg">{subscription.plan}</p>
              <Badge
                tone={
                  subscription.status === 'Active'
                    ? 'success'
                    : subscription.status === 'Trialing'
                      ? 'info'
                      : subscription.status === 'Past due'
                        ? 'danger'
                        : 'neutral'
                }
                dot
                size="sm"
              >
                {subscription.status}
              </Badge>
            </div>
            <p className="mt-1 text-[12px] text-muted">
              Started {date(subscription.startedAt)} · renews {date(subscription.renewsAt)}
            </p>
          </div>
          <p className="tnum text-xl font-extrabold text-fg">
            {subscription.amount ? `${money(subscription.amount)}/mo` : 'Free'}
          </p>
        </div>

        <section>
          <h3 className="mb-2.5 text-[13px] font-bold text-fg">Plan</h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {PLANS.map((tier) => {
              const active = tier === plan;
              return (
                <button
                  key={tier}
                  onClick={() => setPlan(tier)}
                  className={cn(
                    'flex items-start gap-3 rounded-xl border p-3 text-left transition-all duration-200',
                    active
                      ? 'border-primary bg-primary-soft ring-4 ring-primary/12'
                      : 'border-border bg-surface hover:border-border-strong hover:-translate-y-0.5',
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="text-[13px] font-bold text-fg">{tier}</span>
                      {tier === subscription.plan && (
                        <Badge tone="neutral" size="sm">
                          Current
                        </Badge>
                      )}
                    </span>
                    <span className="mt-0.5 block text-[11px] leading-relaxed text-muted">
                      {PLAN_BLURB[tier]}
                    </span>
                    <span className="tnum mt-1.5 block text-[13px] font-bold text-fg">
                      {PLAN_FEE[tier] ? `${money(PLAN_FEE[tier])}/mo` : 'Free'}
                    </span>
                  </span>
                  {active && <Check className="size-4 shrink-0 text-primary" />}
                </button>
              );
            })}
          </div>

          {planChanged && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary-soft px-4 py-3 animate-pop-in">
              <p className="text-[12px] font-semibold text-primary-soft-fg">
                {subscription.plan} → {plan}. Device allowance becomes{' '}
                {PLAN_SEATS[plan]} seat{PLAN_SEATS[plan] > 1 ? 's' : ''}.
              </p>
              <Button size="sm" variant="primary" onClick={applyPlan}>
                Apply plan change
              </Button>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-border p-4">
          <h3 className="mb-3 text-[13px] font-bold text-fg">Billing cycle</h3>
          <div className="flex flex-wrap items-end gap-3">
            <Field label="Extend by" htmlFor="s-months" className="w-40">
              <Select
                id="s-months"
                size="sm"
                value={months}
                onChange={(e) => setMonths(e.target.value)}
                options={[
                  { value: '1', label: '1 month' },
                  { value: '3', label: '3 months' },
                  { value: '6', label: '6 months' },
                  { value: '12', label: '12 months' },
                ]}
              />
            </Field>
            <Button
              variant="secondary"
              leadingIcon={<CalendarPlus className="size-4" />}
              onClick={extend}
            >
              Extend cycle
            </Button>
          </div>

          <div className="mt-4 border-t border-border pt-4">
            <Switch
              checked={subscription.autoRenew}
              onChange={(next) => {
                actions.setAutoRenew(subscription.ownerId, next);
                toast.info(next ? 'Auto-renew on' : 'Auto-renew off', vendor.businessName);
              }}
              label="Auto-renew"
              description="Charge the card on file at the end of each cycle."
            />
          </div>
        </section>

        <section className="rounded-xl border border-danger/25 bg-danger-soft/40 p-4">
          <h3 className="text-[13px] font-bold text-fg">
            {cancelled ? 'Reactivate' : 'Cancel subscription'}
          </h3>
          <p className="mt-1 text-[12px] leading-relaxed text-muted">
            {cancelled
              ? 'Billing resumes on the next cycle and the shop keeps its current plan.'
              : 'The shop keeps access until the end of the paid period, then stops billing.'}
          </p>
          <Button
            className="mt-3"
            size="sm"
            variant={cancelled ? 'primary' : 'outline-danger'}
            leadingIcon={cancelled ? <RotateCcw className="size-4" /> : <XCircle className="size-4" />}
            onClick={() => {
              actions.setSubscriptionStatus(
                subscription.ownerId,
                cancelled ? (subscription.plan === 'Trial' ? 'Trialing' : 'Active') : 'Cancelled',
              );
              toast[cancelled ? 'success' : 'error'](
                cancelled ? 'Subscription reactivated' : 'Subscription cancelled',
                vendor.businessName,
              );
            }}
          >
            {cancelled ? 'Reactivate subscription' : 'Cancel subscription'}
          </Button>
        </section>
      </div>
    </Modal>
  );
}
