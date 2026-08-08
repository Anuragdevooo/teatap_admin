import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  CircleAlert,
  CreditCard,
  Ban,
  LifeBuoy,
  Lock,
  MessageSquare,
  Store,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
} from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { Avatar, Badge, Button, Card, CardBody, CardHeader, SegmentedControl } from '@/components/ui';
import { AnimatedNumber, StatTile } from '@/components/data';
import { AreaChart, BarChart, CompositionBar, Sparkline } from '@/components/charts';
import { useStore } from '@/store';
import {
  bucketByPeriod,
  cumulativeByPeriod,
  PERIOD_OPTIONS,
  type Period,
} from '@/lib/period';
import { dashboardStats } from '@/mocks/seed';
import { cn } from '@/lib/cn';
import { money, moneyCompact, num, numCompact, relativeTime, signed } from '@/lib/format';
import type { ActivityEvent } from '@/types/domain';

const RANGES = [
  { value: 'growth', label: 'User growth' },
  { value: 'revenue', label: 'Platform revenue' },
] as const;

const ACTIVITY_ICON: Record<ActivityEvent['kind'], typeof UserPlus> = {
  signup: UserPlus,
  payment: Wallet,
  lock: Lock,
  support: LifeBuoy,
  plan: CreditCard,
};

const ACTIVITY_TONE: Record<ActivityEvent['kind'], string> = {
  signup: 'bg-primary-soft text-primary-soft-fg',
  payment: 'bg-success-soft text-success',
  lock: 'bg-danger-soft text-danger',
  support: 'bg-info-soft text-info',
  plan: 'bg-accent-soft text-accent-soft-fg',
};

/**
 * The platform's own scoreboard.
 *
 * Deliberately *not* about tea: what a vendor sells is the vendor's business.
 * What this console tracks is how many people are on the platform, how fast
 * that is growing, and what the platform earns for hosting them.
 */
export function DashboardPage() {
  const { owners, customers, users, subscriptions, payments, activity, chatThreads, loading } =
    useStore();
  const [range, setRange] = useState<(typeof RANGES)[number]['value']>('growth');
  const [period, setPeriod] = useState<Period>('month');

  const stats = useMemo(() => {
    const blockedVendors = owners.filter((o) => o.locked).length;
    const blockedCustomers = customers.filter((c) => c.blocked).length;
    const activeSubs = subscriptions.filter((s) => s.status === 'Active');
    const mrr = activeSubs.reduce((sum, s) => sum + s.amount, 0);
    const totalCustomers = owners.reduce((sum, o) => sum + o.customers, 0);
    const newCustomers = owners.reduce((sum, o) => sum + o.customersAdded, 0);

    return {
      totalUsers: totalCustomers + owners.length,
      totalVendors: owners.length,
      activeVendors: owners.length - blockedVendors,
      blocked: blockedVendors + blockedCustomers,
      totalCustomers,
      newUsers: newCustomers,
      mrr,
      arpv: Math.round(mrr / Math.max(1, activeSubs.length)),
      pastDue: subscriptions.filter((s) => s.status === 'Past due').length,
      growing: owners.filter((o) => o.growthPct > 0).length,
      shrinking: owners.filter((o) => o.growthPct < 0).length,
      roleMix: [
        { label: 'Customers', value: totalCustomers },
        { label: 'Vendors', value: owners.length },
        { label: 'Admins', value: users.filter((u) => u.role === 'admin').length },
      ],
      cityMix: dashboardStats.cityMix,
    };
  }, [owners, customers, users, subscriptions]);

  /**
   * Growth and revenue derived per period from the actual records, so the
   * Weekly/Monthly/Yearly control changes the data — not just the axis labels.
   */
  const series = useMemo(() => {
    const vendorGrowth = cumulativeByPeriod(owners, (o) => o.joinedAt, period);
    const customerGrowth = cumulativeByPeriod(customers, (c) => c.joinedAt, period);
    const revenue = bucketByPeriod(payments, (p) => p.paidAt, (p) => p.amount, period);
    return { vendorGrowth, customerGrowth, revenue };
  }, [owners, customers, payments, period]);

  /** Vendors gaining customers fastest — the ones worth keeping happy. */
  const risers = useMemo(
    () => [...owners].sort((a, b) => b.growthPct - a.growthPct).slice(0, 5),
    [owners],
  );

  /** Vendors losing customers — the churn risk list. */
  const atRisk = useMemo(
    () =>
      [...owners]
        .filter((o) => o.growthPct < 0 || o.locked)
        .sort((a, b) => a.growthPct - b.growthPct)
        .slice(0, 3),
    [owners],
  );

  const unreadChats = chatThreads.reduce((sum, t) => sum + t.unread, 0);

  return (
    <>
      <PageHeader
        title="Platform overview"
        description="Who is on Teatap, how fast that is growing, and what the platform earns."
        actions={
          <>
            <SegmentedControl
              options={RANGES}
              value={range}
              onChange={setRange}
              ariaLabel="Chart series"
            />
            <SegmentedControl
              options={PERIOD_OPTIONS}
              value={period}
              onChange={setPeriod}
              ariaLabel="Chart period"
            />
          </>
        }
      />

      <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile
          index={0}
          label="Total users"
          value={<AnimatedNumber value={stats.totalUsers} format={num} />}
          icon={<Users />}
          delta={12.1}
          loading={loading}
          footer={`${num(stats.newUsers)} joined this month`}
        />
        <StatTile
          index={1}
          label="Vendors on platform"
          value={<AnimatedNumber value={stats.totalVendors} format={num} />}
          icon={<Store />}
          delta={8.4}
          loading={loading}
          footer={`${stats.activeVendors} active`}
        />
        <StatTile
          index={2}
          label="Monthly recurring revenue"
          value={<AnimatedNumber value={stats.mrr} format={money} />}
          icon={<Wallet />}
          delta={9.3}
          loading={loading}
          footer={`${money(stats.arpv)} average per vendor`}
        />
        <StatTile
          index={3}
          label="Blocked accounts"
          value={<AnimatedNumber value={stats.blocked} format={num} />}
          icon={<Ban />}
          delta={-4.2}
          invertDelta
          loading={loading}
          footer={`${stats.pastDue} subscriptions past due`}
        />
      </section>

      <section className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title={range === 'growth' ? 'User growth' : 'Platform revenue'}
            description={
              range === 'growth'
                ? 'Vendors and their customers, month by month.'
                : 'Subscription revenue earned from vendors.'
            }
            action={
              <Link
                to={range === 'growth' ? '/users' : '/subscriptions'}
                className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary hover:underline"
              >
                Details <ArrowUpRight className="size-3.5" />
              </Link>
            }
          />
          <CardBody>
            {/* Small multiples, not one chart with two series: customers run in
                the thousands and vendors in the tens, so a shared axis would
                flatten the vendor line onto zero and say nothing. Each gets its
                own scale; the shared x-axis is what makes them comparable. */}
            {!loading && range === 'growth' && (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <p className="mb-1 flex items-center gap-2 text-[12px] font-bold text-fg">
                    <span className="size-2 rounded-[3px] bg-chart-1" aria-hidden />
                    Customers
                    <span className="tnum ml-auto text-[11px] font-semibold text-muted">
                      {num(series.customerGrowth.values.at(-1) ?? 0)}
                    </span>
                  </p>
                  <AreaChart
                    height={200}
                    labels={series.customerGrowth.labels}
                    format={numCompact}
                    caption={`Customers on the platform, by ${period}`}
                    series={[{ label: 'Customers', values: series.customerGrowth.values }]}
                  />
                </div>
                <div>
                  <p className="mb-1 flex items-center gap-2 text-[12px] font-bold text-fg">
                    <span className="size-2 rounded-[3px] bg-chart-1" aria-hidden />
                    Vendors
                    <span className="tnum ml-auto text-[11px] font-semibold text-muted">
                      {num(series.vendorGrowth.values.at(-1) ?? 0)}
                    </span>
                  </p>
                  <AreaChart
                    height={200}
                    labels={series.vendorGrowth.labels}
                    format={num}
                    caption={`Vendors on the platform, by ${period}`}
                    series={[{ label: 'Vendors', values: series.vendorGrowth.values }]}
                  />
                </div>
              </div>
            )}
            {!loading && range === 'revenue' && (
              <BarChart
                height={252}
                labels={series.revenue.labels}
                format={moneyCompact}
                caption={`Subscription revenue by ${period}`}
                series={[{ label: 'Subscription revenue', values: series.revenue.values }]}
              />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Who is on the platform"
            description="Every account, by role."
            icon={<Users />}
          />
          <CardBody>
            {!loading && (
              <>
                <CompositionBar
                  slices={stats.roleMix}
                  format={num}
                  totalLabel="Total users"
                  caption="Platform accounts by role"
                />
                {/* The ratio is the real insight here — the raw split is so
                    lopsided that "99% customers" tells the admin nothing. */}
                <p className="mt-4 border-t border-border pt-3 text-[12px] leading-relaxed text-muted">
                  Each vendor brings{' '}
                  <span className="tnum font-bold text-fg">
                    {Math.round(stats.totalCustomers / Math.max(1, stats.totalVendors))}
                  </span>{' '}
                  customers onto the platform on average.
                </p>
              </>
            )}
          </CardBody>
        </Card>
      </section>

      <section className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader
            title="Vendor health"
            description="Are our tenants growing their own customer base?"
            icon={<TrendingUp />}
          />
          <CardBody className="space-y-4">
            <div className="flex items-baseline justify-between">
              <span className="text-[13px] font-semibold text-muted">Growing</span>
              <span className="tnum text-lg font-extrabold text-success">
                {num(stats.growing)}
              </span>
            </div>
            <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-surface-3">
              <span
                className="h-full bg-chart-1 transition-[width] duration-700"
                style={{ width: `${(stats.growing / Math.max(1, stats.totalVendors)) * 100}%` }}
              />
              <span className="w-0.5 bg-surface" />
              <span
                className="h-full bg-chart-3 transition-[width] duration-700"
                style={{ width: `${(stats.shrinking / Math.max(1, stats.totalVendors)) * 100}%` }}
              />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="flex items-center gap-1.5 text-[13px] font-semibold text-muted">
                <CircleAlert className="size-3.5 text-warning" /> Shrinking
              </span>
              <span className="tnum text-[15px] font-bold text-fg">{num(stats.shrinking)}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-border pt-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-subtle">
                  Customers served
                </p>
                <p className="tnum mt-1 text-lg font-extrabold text-fg">
                  {num(stats.totalCustomers)}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-subtle">
                  New this month
                </p>
                <p className="tnum mt-1 text-lg font-extrabold text-success">
                  +{num(stats.newUsers)}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Fastest growing vendors"
            description="By customer growth this month."
            action={
              <Link to="/leaderboard" className="text-[13px] font-semibold text-primary hover:underline">
                All
              </Link>
            }
          />
          <CardBody className="space-y-3">
            {risers.map((vendor, i) => (
              <div
                key={vendor.id}
                style={{ '--i': i } as React.CSSProperties}
                className="stagger-item flex items-center gap-3"
              >
                <Avatar name={vendor.businessName} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-fg">
                    {vendor.businessName}
                  </p>
                  <p className="truncate text-[11px] text-muted">
                    {num(vendor.customers)} customers · {vendor.city}
                  </p>
                </div>
                <span
                  className={cn(
                    'tnum shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold',
                    vendor.growthPct >= 0
                      ? 'bg-success-soft text-success'
                      : 'bg-danger-soft text-danger',
                  )}
                >
                  {signed(vendor.growthPct)}
                </span>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Recent activity" description="Across the platform, newest first." />
          <CardBody className="space-y-4">
            {activity.slice(0, 5).map((event, i) => {
              const Icon = ACTIVITY_ICON[event.kind];
              return (
                <div
                  key={event.id}
                  style={{ '--i': i } as React.CSSProperties}
                  className="stagger-item flex gap-3"
                >
                  <span
                    className={cn(
                      'grid size-8 shrink-0 place-items-center rounded-[10px]',
                      ACTIVITY_TONE[event.kind],
                    )}
                  >
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold leading-snug text-fg">{event.title}</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-muted">{event.detail}</p>
                    <p className="mt-1 text-[11px] text-subtle">{relativeTime(event.at)}</p>
                  </div>
                </div>
              );
            })}
          </CardBody>
        </Card>
      </section>

      <section className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="New sign-ups"
            description="People joining the platform each day."
            icon={<UserPlus />}
          />
          <CardBody>
            <p className="tnum text-2xl font-extrabold tracking-tight text-fg">
              <AnimatedNumber value={dashboardStats.signupsLast14Days.at(-1) ?? 0} format={num} />
              <span className="ml-1.5 text-[13px] font-semibold text-muted">joined yesterday</span>
            </p>
            <Sparkline
              values={dashboardStats.signupsLast14Days}
              tone="success"
              height={64}
              className="mt-3"
              ariaLabel="New sign-ups per day over the last 14 days"
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Vendors by city" description="Where Teatap has taken hold." />
          <CardBody>
            <div className="space-y-2.5">
              {stats.cityMix.map((city, i) => {
                const share = (city.value / Math.max(1, stats.totalVendors)) * 100;
                return (
                  <div
                    key={city.label}
                    style={{ '--i': i } as React.CSSProperties}
                    className="stagger-item flex items-center gap-3"
                  >
                    <span className="w-20 shrink-0 text-[13px] font-semibold text-fg">
                      {city.label}
                    </span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-surface-3">
                      <span
                        className="block h-full rounded-full bg-chart-2 transition-[width] duration-700"
                        style={{ width: `${Math.max(4, share)}%` }}
                      />
                    </span>
                    <span className="tnum w-8 shrink-0 text-right text-[13px] font-bold text-muted">
                      {city.value}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>
      </section>

      <section className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Needs attention"
            description="Vendors losing customers or blocked from billing."
            icon={<CircleAlert />}
            action={
              <Link to="/vendors" className="text-[13px] font-semibold text-primary hover:underline">
                Open vendors
              </Link>
            }
          />
          <CardBody className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {atRisk.map((vendor, i) => (
              <Link
                key={vendor.id}
                to="/vendors"
                style={{ '--i': i } as React.CSSProperties}
                className="stagger-item lift flex items-center gap-3 rounded-xl border border-border bg-surface-2 p-3"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-warning-soft text-warning">
                  {vendor.locked ? <Lock className="size-4" /> : <TrendingUp className="size-4 rotate-180" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-bold text-fg">
                    {vendor.businessName}
                  </span>
                  <span className="block truncate text-[11px] text-muted">
                    {vendor.locked ? 'Blocked' : `${signed(vendor.growthPct)} customers`} ·{' '}
                    {vendor.city}
                  </span>
                </span>
              </Link>
            ))}
            {atRisk.length === 0 && (
              <p className="col-span-full py-6 text-center text-[13px] text-muted">
                Every vendor is growing. Nothing needs attention right now.
              </p>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Unread messages" description="Vendors and customers waiting on you." icon={<MessageSquare />} />
          <CardBody>
            <p className="tnum text-3xl font-extrabold tracking-tight text-fg">
              <AnimatedNumber value={unreadChats} format={num} />
            </p>
            <p className="mt-1 text-[13px] text-muted">
              across {chatThreads.filter((t) => t.unread > 0).length} conversation(s)
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {chatThreads
                .filter((t) => t.unread > 0)
                .slice(0, 3)
                .map((thread) => (
                  <Badge key={thread.id} tone="brand" size="sm">
                    {thread.peerName}
                  </Badge>
                ))}
            </div>
            <Link to="/chat" className="mt-4 block">
              <Button fullWidth variant="soft" leadingIcon={<MessageSquare className="size-4" />}>
                Open chat
              </Button>
            </Link>
          </CardBody>
        </Card>
      </section>
    </>
  );
}
