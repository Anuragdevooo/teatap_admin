import { useEffect, useState } from 'react';
import { Check, Pencil, Plus, Sparkles, Star, X } from 'lucide-react';
import {
  Badge,
  Button,
  Field,
  Input,
  Modal,
  Select,
  Switch,
  Textarea,
  useToast,
} from '@/components/ui';
import { actions, useStore } from '@/store';
import { cn } from '@/lib/cn';
import { money, num } from '@/lib/format';
import type { Plan, PlanTier } from '@/types/domain';

/**
 * Plan catalogue management.
 *
 * Prices live in the store rather than in a constant, so editing one here
 * re-prices every vendor already on that tier and re-issues their device
 * allowance in the same action — the plan card and the subscription table can
 * never disagree.
 */
export function PlansPanel() {
  const { plans, subscriptions } = useStore();
  const [editing, setEditing] = useState<Plan | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <p className="text-[13px] text-muted">
          Editing a plan re-prices every vendor already on that tier.
        </p>
        <Button
          size="sm"
          variant="primary"
          leadingIcon={<Plus className="size-4" />}
          onClick={() => setCreating(true)}
        >
          Add plan
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 xl:grid-cols-4">
        {plans.map((plan, i) => {
          const vendorsOnPlan = subscriptions.filter((s) => s.plan === plan.tier).length;
          const revenue = subscriptions
            .filter((s) => s.plan === plan.tier && s.status === 'Active')
            .reduce((sum, s) => sum + s.amount, 0);

          return (
            <article
              key={plan.id}
              style={{ '--i': i } as React.CSSProperties}
              className={cn(
                'stagger-item lift relative flex flex-col rounded-xl border bg-surface-2 p-4',
                plan.popular ? 'border-primary ring-4 ring-primary/12' : 'border-border',
                !plan.isActive && 'opacity-60',
              )}
            >
              {plan.popular && (
                <Badge tone="brand" size="sm" className="absolute -top-2.5 left-4">
                  <Sparkles className="size-3" /> Most popular
                </Badge>
              )}

              <div className="flex items-start justify-between gap-2">
                <h3 className="text-[15px] font-extrabold tracking-tight text-fg">{plan.name}</h3>
                <Badge tone={plan.isActive ? 'success' : 'neutral'} size="sm">
                  {plan.isActive ? 'Sellable' : 'Hidden'}
                </Badge>
              </div>

              <p className="tnum mt-2 text-2xl font-extrabold tracking-tight text-fg">
                {plan.price ? money(plan.price) : 'Free'}
                {plan.price > 0 && (
                  <span className="ml-1 text-[12px] font-semibold text-muted">/month</span>
                )}
              </p>
              <p className="mt-0.5 text-[11px] text-muted">
                {plan.deviceSeats} device seat{plan.deviceSeats > 1 ? 's' : ''}
                {plan.trialDays > 0 && ` · ${plan.trialDays}-day trial`}
              </p>

              <ul className="mt-3 flex-1 space-y-1.5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-1.5 text-[12px] text-muted">
                    <Check className="mt-0.5 size-3 shrink-0 text-success" />
                    {feature}
                  </li>
                ))}
              </ul>

              <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-3">
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-wide text-subtle">
                    Vendors
                  </dt>
                  <dd className="tnum text-[15px] font-bold text-fg">{num(vendorsOnPlan)}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-wide text-subtle">
                    MRR
                  </dt>
                  <dd className="tnum text-[15px] font-bold text-fg">{money(revenue)}</dd>
                </div>
              </dl>

              <Button
                className="mt-3"
                size="sm"
                variant="secondary"
                fullWidth
                leadingIcon={<Pencil className="size-3.5" />}
                onClick={() => setEditing(plan)}
              >
                Edit plan
              </Button>
            </article>
          );
        })}
      </div>

      <PlanEditModal plan={editing} onClose={() => setEditing(null)} />
      <PlanCreateModal open={creating} onClose={() => setCreating(false)} />
    </>
  );
}

const TIERS: PlanTier[] = ['Trial', 'Starter', 'Pro', 'Enterprise'];

function PlanCreateModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const toast = useToast();
  const [form, setForm] = useState({
    tier: 'Pro' as PlanTier,
    name: '',
    price: '499',
    deviceSeats: '5',
    trialDays: '0',
    features: '',
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm({ tier: 'Pro', name: '', price: '499', deviceSeats: '5', trialDays: '0', features: '' });
  }, [open]);

  const save = () => {
    if (form.name.trim().length < 2) {
      setError('Give the plan a name.');
      return;
    }
    actions.createPlan({
      tier: form.tier,
      name: form.name.trim(),
      price: Math.max(0, Number(form.price) || 0),
      deviceSeats: Math.max(1, Number(form.deviceSeats) || 1),
      trialDays: Math.max(0, Number(form.trialDays) || 0),
      features: form.features.split('\n').map((f) => f.trim()).filter(Boolean),
    });
    toast.success('Plan created', `${form.name.trim()} is now sellable.`);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add a plan"
      description="New vendors will be able to sign up on this tier."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save}>
            Create plan
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Plan name" required htmlFor="np-name" error={error ?? undefined}>
            <Input
              id="np-name"
              data-autofocus
              value={form.name}
              onChange={(e) => {
                setForm({ ...form, name: e.target.value });
                setError(null);
              }}
              placeholder="e.g. Pro Plus"
              invalid={!!error}
            />
          </Field>
          <Field
            label="Billing tier"
            htmlFor="np-tier"
            hint="Which internal tier this plan bills as."
          >
            <Select
              id="np-tier"
              value={form.tier}
              onChange={(e) => setForm({ ...form, tier: e.target.value as PlanTier })}
              options={TIERS.map((t) => ({ value: t, label: t }))}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Price / month" htmlFor="np-price">
            <Input
              id="np-price"
              type="number"
              min={0}
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
          </Field>
          <Field label="Device seats" htmlFor="np-seats">
            <Input
              id="np-seats"
              type="number"
              min={1}
              value={form.deviceSeats}
              onChange={(e) => setForm({ ...form, deviceSeats: e.target.value })}
            />
          </Field>
          <Field label="Trial days" htmlFor="np-trial">
            <Input
              id="np-trial"
              type="number"
              min={0}
              value={form.trialDays}
              onChange={(e) => setForm({ ...form, trialDays: e.target.value })}
            />
          </Field>
        </div>

        <Field label="Features" htmlFor="np-features" hint="One per line.">
          <Textarea
            id="np-features"
            rows={5}
            value={form.features}
            onChange={(e) => setForm({ ...form, features: e.target.value })}
            placeholder={'5 devices\nMultiple areas\nPriority support'}
          />
        </Field>
      </div>
    </Modal>
  );
}

function PlanEditModal({ plan, onClose }: { plan: Plan | null; onClose: () => void }) {
  const { subscriptions } = useStore();
  const toast = useToast();
  const [form, setForm] = useState({ name: '', price: '0', deviceSeats: '1', trialDays: '0', features: '' });

  useEffect(() => {
    if (!plan) return;
    setForm({
      name: plan.name,
      price: String(plan.price),
      deviceSeats: String(plan.deviceSeats),
      trialDays: String(plan.trialDays),
      features: plan.features.join('\n'),
    });
  }, [plan]);

  if (!plan) return null;

  const affected = subscriptions.filter((s) => s.plan === plan.tier).length;
  const priceChanged = Number(form.price) !== plan.price;
  const seatsChanged = Number(form.deviceSeats) !== plan.deviceSeats;

  const save = () => {
    actions.updatePlan(plan.id, {
      name: form.name.trim() || plan.name,
      price: Math.max(0, Number(form.price) || 0),
      deviceSeats: Math.max(1, Number(form.deviceSeats) || 1),
      trialDays: Math.max(0, Number(form.trialDays) || 0),
      features: form.features
        .split('\n')
        .map((f) => f.trim())
        .filter(Boolean),
    });
    toast.success('Plan updated', `${affected} vendor(s) on ${plan.tier} were re-priced.`);
    onClose();
  };

  return (
    <Modal
      open={!!plan}
      onClose={onClose}
      title={`Edit ${plan.name} plan`}
      description={`Tier: ${plan.tier}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save}>
            Save plan
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Display name" htmlFor="p-plan-name">
          <Input
            id="p-plan-name"
            data-autofocus
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          <Field label="Price / month" htmlFor="p-plan-price" hint="Whole rupees.">
            <Input
              id="p-plan-price"
              type="number"
              min={0}
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
          </Field>
          <Field label="Device seats" htmlFor="p-plan-seats">
            <Input
              id="p-plan-seats"
              type="number"
              min={1}
              value={form.deviceSeats}
              onChange={(e) => setForm({ ...form, deviceSeats: e.target.value })}
            />
          </Field>
          <Field label="Trial days" htmlFor="p-plan-trial" hint="0 for paid plans.">
            <Input
              id="p-plan-trial"
              type="number"
              min={0}
              value={form.trialDays}
              onChange={(e) => setForm({ ...form, trialDays: e.target.value })}
            />
          </Field>
        </div>

        <Field
          label="Features"
          htmlFor="p-plan-features"
          hint="One per line — shown on the plan card and the pricing page."
        >
          <Textarea
            id="p-plan-features"
            rows={5}
            value={form.features}
            onChange={(e) => setForm({ ...form, features: e.target.value })}
          />
        </Field>

        <div className="space-y-3 rounded-xl border border-border bg-surface-2 p-4">
          <Switch
            checked={plan.isActive}
            onChange={(next) => {
              actions.setPlanActive(plan.id, next);
              toast.info(next ? 'Plan is sellable' : 'Plan hidden', plan.name);
            }}
            label="Available to new vendors"
            description="Hidden plans keep their existing subscribers."
          />
          <Switch
            checked={plan.popular}
            onChange={() => {
              actions.setPopularPlan(plan.id);
              toast.info('Highlighted plan', `${plan.name} is now the featured tier.`);
            }}
            label="Highlight as most popular"
            description="Only one plan can carry the badge."
          />
        </div>

        {/* The blast radius, stated before the save button is pressed. */}
        {(priceChanged || seatsChanged) && affected > 0 && (
          <p className="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning-soft px-4 py-3 text-[12px] leading-relaxed text-fg animate-pop-in">
            <Star className="mt-0.5 size-4 shrink-0 text-warning" />
            <span>
              <strong>{affected} vendor(s)</strong> are on {plan.tier}.{' '}
              {priceChanged && `Their fee becomes ${money(Number(form.price) || 0)}/month. `}
              {seatsChanged && `Their device allowance becomes ${form.deviceSeats} seats.`}
            </span>
          </p>
        )}

        {plan.tier === 'Trial' && (
          <p className="flex items-center gap-2 text-[12px] text-muted">
            <X className="size-3.5 shrink-0" />
            Trial plans are never billed, whatever price is set here.
          </p>
        )}
      </div>
    </Modal>
  );
}
