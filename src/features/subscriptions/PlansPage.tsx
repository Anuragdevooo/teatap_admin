import { useMemo } from 'react';
import { CreditCard, Layers, Users, Wallet } from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { Card } from '@/components/ui';
import { AnimatedNumber, StatTile } from '@/components/data';
import { BarChart } from '@/components/charts';
import { useStore } from '@/store';
import { money, num } from '@/lib/format';
import { PlansPanel } from './PlansPanel';

/**
 * Plan catalogue as its own destination.
 *
 * It is also reachable as a tab inside Subscriptions — the same panel, mounted
 * twice — because "manage this vendor's plan" and "change what Pro costs" are
 * different jobs that happen to touch the same data. Giving the second one a
 * route means it can be linked to and found in the sidebar.
 */
export function PlansPage() {
  const { plans, subscriptions, loading } = useStore();

  const summary = useMemo(() => {
    const active = subscriptions.filter((s) => s.status === 'Active');
    return {
      plans: plans.length,
      sellable: plans.filter((p) => p.isActive).length,
      subscribers: active.length,
      mrr: active.reduce((sum, s) => sum + s.amount, 0),
      byPlan: plans.map((p) => ({
        label: p.name,
        value: active.filter((s) => s.plan === p.tier).reduce((sum, s) => sum + s.amount, 0),
      })),
    };
  }, [plans, subscriptions]);

  return (
    <>
      <PageHeader
        title="Subscription plans"
        description="What the platform sells: price, device seats and features per tier."
      />

      <section className="mb-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile
          index={0}
          label="Plans"
          value={<AnimatedNumber value={summary.plans} format={num} />}
          icon={<Layers />}
          loading={loading}
          footer={`${summary.sellable} sellable to new vendors`}
        />
        <StatTile
          index={1}
          label="Paying vendors"
          value={<AnimatedNumber value={summary.subscribers} format={num} />}
          icon={<Users />}
          loading={loading}
          footer="Active subscriptions"
        />
        <StatTile
          index={2}
          label="MRR"
          value={<AnimatedNumber value={summary.mrr} format={money} />}
          icon={<Wallet />}
          delta={9.3}
          loading={loading}
        />
        <StatTile
          index={3}
          label="Average per vendor"
          value={
            <AnimatedNumber
              value={Math.round(summary.mrr / Math.max(1, summary.subscribers))}
              format={money}
            />
          }
          icon={<CreditCard />}
          loading={loading}
          footer="Across active plans"
        />
      </section>

      <Card className="mb-4">
        <div className="border-b border-border px-5 py-4">
          <h3 className="text-[15px] font-bold tracking-tight text-fg">Revenue by plan</h3>
          <p className="mt-0.5 text-[13px] text-muted">Which tier actually carries the platform.</p>
        </div>
        <div className="p-5">
          {!loading && summary.byPlan.length > 0 && (
            <BarChart
              height={200}
              labels={summary.byPlan.map((p) => p.label)}
              format={money}
              caption="Monthly recurring revenue contributed by each plan"
              series={[{ label: 'MRR', values: summary.byPlan.map((p) => p.value) }]}
            />
          )}
        </div>
      </Card>

      <Card className="overflow-hidden">
        <PlansPanel />
      </Card>
    </>
  );
}
