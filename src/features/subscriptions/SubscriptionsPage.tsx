import { useMemo, useState } from 'react';
import { CreditCard, RefreshCw, SearchX, Settings2, TrendingUp, Wallet } from 'lucide-react';
import { PageHeader } from '@/components/layout';
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  Select,
  SegmentedControl,
  Tabs,
} from '@/components/ui';
import {
  AnimatedNumber,
  Column,
  DataTable,
  Pagination,
  StatTile,
  Toolbar,
  useDataTable,
} from '@/components/data';
import { AreaChart, BarChart, DonutChart } from '@/components/charts';
import { useStore } from '@/store';
import {
  bucketByPeriod,
  endOfYear,
  PERIOD_OPTIONS,
  yearsIn,
  type Period,
} from '@/lib/period';
import { date, money, moneyCompact, num } from '@/lib/format';
import type { PlanTier, Subscription } from '@/types/domain';
import { PlanBadge, SubscriptionStatusBadge } from '@/features/shared/status';
import { SubscriptionModal } from '@/features/vendors/SubscriptionModal';
import { PlansPanel } from './PlansPanel';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'Active', label: 'Active' },
  { value: 'Trialing', label: 'Trialing' },
  { value: 'Past due', label: 'Past due' },
  { value: 'Cancelled', label: 'Cancelled' },
];

const PAGE_SIZE = 10;
const DAY = 86_400_000;
const PLANS: PlanTier[] = ['Trial', 'Starter', 'Pro', 'Enterprise'];

export function SubscriptionsPage() {
  const { subscriptions, plans, payments, loading } = useStore();
  const [tab, setTab] = useState<'list' | 'plans'>('list');
  const [status, setStatus] = useState('');
  const [period, setPeriod] = useState<Period>('month');
  const [year, setYear] = useState('all');
  const [managing, setManaging] = useState<string | null>(null);

  const sorters = useMemo(
    () => ({
      operator: (s: Subscription) => s.operatorName,
      amount: (s: Subscription) => s.amount,
      renews: (s: Subscription) => s.renewsAt,
    }),
    [],
  );

  const table = useDataTable<Subscription>({
    rows: subscriptions,
    searchFields: (s) => [s.operatorName, s.plan, s.status],
    sorters,
    initialSort: { columnId: 'renews', direction: 'asc' },
    pageSize: PAGE_SIZE,
  });

  const summary = useMemo(() => {
    const active = subscriptions.filter((s) => s.status === 'Active');
    const now = Date.now();

    return {
      mrr: active.reduce((sum, s) => sum + s.amount, 0),
      arpv: Math.round(active.reduce((sum, s) => sum + s.amount, 0) / Math.max(1, active.length)),
      active: active.length,
      pastDue: subscriptions.filter((s) => s.status === 'Past due').length,
      cancelled: subscriptions.filter((s) => s.status === 'Cancelled').length,
      trialing: subscriptions.filter((s) => s.status === 'Trialing').length,
      renewingSoon: subscriptions.filter((s) => s.renewsAt - now < 7 * DAY && s.renewsAt > now)
        .length,
      planMix: PLANS.map((plan) => ({
        label: plan,
        value: subscriptions.filter((s) => s.plan === plan).length,
      })),
      // Revenue contribution per tier — where the MRR actually comes from.
      revenueByPlan: PLANS.map((plan) =>
        active.filter((s) => s.plan === plan).reduce((sum, s) => sum + s.amount, 0),
      ),
    };
  }, [subscriptions]);

  const revenueYears = useMemo(() => yearsIn(payments, (p) => p.paidAt), [payments]);

  /** Subscription revenue actually received, bucketed by the chosen period. */
  const revenue = useMemo(() => {
    const scoped =
      year === 'all'
        ? payments
        : payments.filter((p) => new Date(p.paidAt).getFullYear() === Number(year));
    const anchor = year === 'all' ? Date.now() : endOfYear(Number(year));
    return bucketByPeriod(scoped, (p) => p.paidAt, (p) => p.amount, period, undefined, anchor);
  }, [payments, period, year]);

  const columns: Column<Subscription>[] = [
    {
      id: 'operator',
      header: 'Vendor',
      sortable: true,
      cell: (s) => (
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={s.operatorName} size="sm" />
          <p className="truncate font-semibold text-fg">{s.operatorName}</p>
        </div>
      ),
    },
    { id: 'plan', header: 'Plan', width: '120px', cell: (s) => <PlanBadge plan={s.plan} /> },
    {
      id: 'started',
      header: 'Started',
      hideBelow: 'xl',
      width: '130px',
      cell: (s) => <span className="text-[13px] text-muted">{date(s.startedAt)}</span>,
    },
    {
      id: 'renews',
      header: 'Renews',
      sortable: true,
      hideBelow: 'sm',
      width: '140px',
      cell: (s) => {
        const soon = s.renewsAt - Date.now() < 7 * DAY && s.renewsAt > Date.now();
        return (
          <span className={`text-[13px] ${soon ? 'font-semibold text-warning' : 'text-muted'}`}>
            {date(s.renewsAt)}
          </span>
        );
      },
    },
    {
      id: 'autoRenew',
      header: 'Auto-renew',
      hideBelow: 'lg',
      width: '110px',
      cell: (s) => (
        <Badge tone={s.autoRenew ? 'success' : 'neutral'} size="sm">
          {s.autoRenew ? 'On' : 'Off'}
        </Badge>
      ),
    },
    {
      id: 'amount',
      header: 'Amount',
      align: 'right',
      sortable: true,
      width: '110px',
      cell: (s) => <span className="tnum font-semibold">{s.amount ? money(s.amount) : 'Free'}</span>,
    },
    {
      id: 'status',
      header: 'Status',
      width: '120px',
      cell: (s) => <SubscriptionStatusBadge status={s.status} />,
    },
    {
      id: 'manage',
      header: '',
      align: 'right',
      width: '110px',
      cell: (s) => (
        <Button
          size="xs"
          variant="secondary"
          leadingIcon={<Settings2 className="size-3.5" />}
          onClick={(e) => {
            e.stopPropagation();
            setManaging(s.ownerId);
          }}
        >
          Manage
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Subscriptions"
        description="What each vendor pays the platform, and the state of their billing cycle."
        actions={
          <>
            <SegmentedControl
              options={PERIOD_OPTIONS}
              value={period}
              onChange={setPeriod}
              ariaLabel="Revenue period"
            />
            <Select
              size="sm"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              options={[
                { value: 'all', label: 'All years' },
                ...revenueYears.map((y) => ({ value: String(y), label: String(y) })),
              ]}
              aria-label="Filter by year"
              className="w-32"
            />
          </>
        }
      />

      <section className="mb-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile
          index={0}
          label="MRR"
          value={<AnimatedNumber value={summary.mrr} format={money} />}
          icon={<Wallet />}
          delta={9.3}
          loading={loading}
          footer={`${money(summary.arpv)} average per vendor`}
        />
        <StatTile
          index={1}
          label="Active subscriptions"
          value={<AnimatedNumber value={summary.active} format={num} />}
          icon={<CreditCard />}
          loading={loading}
          footer={`${summary.trialing} on trial`}
        />
        <StatTile
          index={2}
          label="Renewing in 7 days"
          value={<AnimatedNumber value={summary.renewingSoon} format={num} />}
          icon={<RefreshCw />}
          loading={loading}
          footer="Watch for card failures"
        />
        <StatTile
          index={3}
          label="Past due"
          value={<AnimatedNumber value={summary.pastDue} format={num} />}
          icon={<TrendingUp />}
          delta={-3.1}
          invertDelta
          loading={loading}
          footer={`${summary.cancelled} cancelled`}
        />
      </section>

      {/* Revenue is the story on this page, so it leads with two views of it. */}
      <section className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Subscription revenue"
            description="Monthly recurring revenue earned from vendors."
          />
          <CardBody>
            {!loading && (
              <AreaChart
                height={240}
                labels={revenue.labels}
                format={moneyCompact}
                caption={`Subscription revenue by ${period}`}
                series={[{ label: 'Revenue', values: revenue.values }]}
              />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Plans" description="Subscriptions per tier." />
          <CardBody>
            {!loading && (
              <DonutChart
                slices={summary.planMix}
                format={(v) => `${v} vendors`}
                centerLabel="Subscriptions"
                centerValue={num(subscriptions.length)}
                caption="Subscriptions by plan tier"
              />
            )}
          </CardBody>
        </Card>
      </section>

      <section className="mb-4">
        <Card>
          <CardHeader
            title="Revenue by plan"
            description="Which tier actually carries the platform."
          />
          <CardBody>
            {!loading && (
              <BarChart
                height={200}
                labels={PLANS}
                format={money}
                caption="Monthly recurring revenue contributed by each plan tier"
                series={[{ label: 'MRR', values: summary.revenueByPlan }]}
              />
            )}
          </CardBody>
        </Card>
      </section>

      <Card className="overflow-hidden">
        <div className="px-4 pt-2">
          <Tabs
            items={[
              { value: 'list', label: 'Subscriptions', count: subscriptions.length },
              { value: 'plans', label: 'Plans', count: plans.length },
            ]}
            value={tab}
            onChange={(value) => setTab(value as typeof tab)}
          />
        </div>

        {tab === 'plans' ? (
          <PlansPanel />
        ) : (
          <>
        <Toolbar
          query={table.query}
          onQueryChange={table.setQuery}
          matched={table.matched}
          total={subscriptions.length}
          noun="subscriptions"
          placeholder="Search vendor or plan…"
          filters={
            <Select
              size="sm"
              options={STATUS_OPTIONS}
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                table.setFilter(
                  'status',
                  e.target.value ? (s) => s.status === e.target.value : null,
                );
              }}
              aria-label="Filter by subscription status"
              className="w-40"
            />
          }
        />

        <DataTable
          columns={columns}
          rows={table.rows}
          rowKey={(s) => s.id}
          sort={table.sort}
          onSortChange={table.toggleSort}
          onRowClick={(s) => setManaging(s.ownerId)}
          loading={loading}
          empty={
            <EmptyState
              variant="search"
              icon={<SearchX />}
              title="No subscriptions match"
              description="Try a different status filter."
            />
          }
        />

        <div className="border-t border-border px-4 py-3">
          <Pagination
            page={table.page}
            pageCount={table.pageCount}
            onPageChange={table.setPage}
            showing={{
              from: (table.page - 1) * PAGE_SIZE + 1,
              to: Math.min(table.page * PAGE_SIZE, table.matched),
              total: table.matched,
              noun: 'subscriptions',
            }}
          />
        </div>
          </>
        )}
      </Card>

      <SubscriptionModal
        open={!!managing}
        ownerId={managing}
        onClose={() => setManaging(null)}
      />
    </>
  );
}
