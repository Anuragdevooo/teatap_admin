import { useMemo, useState } from 'react';
import { Crown, Medal, Store, TrendingDown, TrendingUp, UsersRound, Wallet } from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { Avatar, Card, CardBody, CardHeader, SegmentedControl } from '@/components/ui';
import {
  ALL_TIME,
  AnimatedNumber,
  DateRangeFilter,
  StatTile,
  Toolbar,
  inRange,
  type DateRange,
} from '@/components/data';
import { BarChart, Sparkline } from '@/components/charts';
import { useStore } from '@/store';
import { cn } from '@/lib/cn';
import { money, num, signed } from '@/lib/format';
import type { Owner } from '@/types/domain';

const RANK_BY = [
  { value: 'customers', label: 'Customer base' },
  { value: 'growth', label: 'Growth rate' },
  { value: 'revenue', label: 'Pays platform' },
] as const;

const PODIUM_STYLE = [
  'bg-accent-soft text-accent-soft-fg ring-accent/30',
  'bg-surface-3 text-muted ring-border-strong',
  'bg-primary-soft text-primary-soft-fg ring-primary/25',
];

/**
 * Vendors ranked the way a platform ranks tenants — by the customer base they
 * have built and what they contribute — not by what they sell.
 */
export function LeaderboardPage() {
  const { owners, loading } = useStore();
  const [rankBy, setRankBy] = useState<(typeof RANK_BY)[number]['value']>('customers');
  const [query, setQuery] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>(ALL_TIME);

  /**
   * Rank the whole field first, *then* filter — so a searched vendor keeps its
   * true position (#12 of 48) instead of being renumbered to #1 of whatever
   * happened to match.
   */
  const ranked = useMemo(() => {
    const score = (o: Owner) =>
      rankBy === 'customers' ? o.customers : rankBy === 'growth' ? o.growthPct : o.platformRevenue;
    return [...owners]
      .sort((a, b) => score(b) - score(a))
      .map((vendor, i) => ({ vendor, rank: i + 1 }));
  }, [owners, rankBy]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const scoped = ranked.filter(({ vendor }) => inRange(vendor.joinedAt, dateRange));
    if (!needle) return scoped;
    return scoped.filter(
      ({ vendor }) =>
        vendor.businessName.toLowerCase().includes(needle) ||
        vendor.ownerName.toLowerCase().includes(needle) ||
        vendor.city.toLowerCase().includes(needle),
    );
  }, [ranked, query, dateRange]);

  const searching = query.trim().length > 0 || dateRange.from !== null;

  // The podium is only meaningful on the unfiltered ranking; once the admin is
  // searching they want the list, not a top-three of their own query.
  const podium = searching ? [] : filtered.slice(0, 3);
  const rest = searching ? filtered : filtered.slice(3);

  /** Totals over the filtered set, so they always match the list on screen. */
  const totals = useMemo(() => {
    const vendors = filtered.map(({ vendor }) => vendor);
    return {
      vendors: vendors.length,
      customers: vendors.reduce((sum, v) => sum + v.customers, 0),
      added: vendors.reduce((sum, v) => sum + v.customersAdded, 0),
      revenue: vendors.reduce((sum, v) => sum + v.platformRevenue, 0),
      growing: vendors.filter((v) => v.growthPct > 0).length,
      shrinking: vendors.filter((v) => v.growthPct < 0).length,
      avgGrowth:
        vendors.length > 0
          ? vendors.reduce((sum, v) => sum + v.growthPct, 0) / vendors.length
          : 0,
    };
  }, [filtered]);

  const metricLabel =
    rankBy === 'customers' ? 'customers' : rankBy === 'growth' ? 'growth' : 'paid to platform';

  const metricValue = (o: Owner) =>
    rankBy === 'customers'
      ? num(o.customers)
      : rankBy === 'growth'
        ? signed(o.growthPct)
        : money(o.platformRevenue);

  return (
    <>
      <PageHeader
        title="Vendor growth"
        description="Which tea shops are building the biggest customer base on Teatap."
        actions={
          <SegmentedControl
            options={RANK_BY}
            value={rankBy}
            onChange={setRankBy}
            ariaLabel="Rank vendors by"
          />
        }
      />

      {/* Totals first: the ranking answers "who", these answer "how much". */}
      <section className="mb-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile
          index={0}
          label="Vendors ranked"
          value={<AnimatedNumber value={totals.vendors} format={num} />}
          icon={<Store />}
          loading={loading}
          footer={`${totals.growing} growing · ${totals.shrinking} shrinking`}
        />
        <StatTile
          index={1}
          label="Customers reached"
          value={<AnimatedNumber value={totals.customers} format={num} />}
          icon={<UsersRound />}
          loading={loading}
          footer="Across every vendor"
        />
        <StatTile
          index={2}
          label="New customers"
          value={<AnimatedNumber value={totals.added} format={num} />}
          icon={<TrendingUp />}
          delta={totals.avgGrowth}
          deltaLabel="average vendor growth"
          loading={loading}
        />
        <StatTile
          index={3}
          label="Paid to platform"
          value={<AnimatedNumber value={totals.revenue} format={money} />}
          icon={<Wallet />}
          loading={loading}
          footer="Lifetime subscription fees"
        />
      </section>

      {/* The top three are the story; the list below is the detail. */}
      <section className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        {podium.map(({ vendor }, i) => (
          <Card
            key={vendor.id}
            style={{ '--i': i } as React.CSSProperties}
            className={cn('stagger-item lift relative overflow-hidden', i === 0 && 'md:order-2')}
          >
            <div className="absolute right-4 top-4 opacity-10">
              {i === 0 ? <Crown className="size-16" /> : <Medal className="size-14" />}
            </div>
            <CardBody className="relative">
              <span
                className={cn(
                  'tnum inline-flex size-8 items-center justify-center rounded-full text-[13px] font-extrabold ring-1',
                  PODIUM_STYLE[i],
                )}
              >
                {i + 1}
              </span>
              <div className="mt-3.5 flex items-center gap-3">
                <Avatar name={vendor.businessName} size="lg" />
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-bold text-fg">{vendor.businessName}</p>
                  <p className="truncate text-[12px] text-muted">
                    {vendor.city} · {vendor.plan}
                  </p>
                </div>
              </div>

              <p className="tnum mt-4 text-2xl font-extrabold tracking-tight text-fg">
                {metricValue(vendor)}
                <span className="ml-1.5 text-[12px] font-semibold text-muted">{metricLabel}</span>
              </p>

              <Sparkline
                values={vendor.customersTrend}
                tone={vendor.growthPct >= 0 ? 'primary' : 'danger'}
                height={38}
                className="mt-3"
                ariaLabel={`${vendor.businessName} customer count trend`}
              />

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    'tnum inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold',
                    vendor.growthPct >= 0
                      ? 'bg-success-soft text-success'
                      : 'bg-danger-soft text-danger',
                  )}
                >
                  {vendor.growthPct >= 0 ? (
                    <TrendingUp className="size-3" />
                  ) : (
                    <TrendingDown className="size-3" />
                  )}
                  {signed(vendor.growthPct)}
                </span>
                <span className="tnum text-[11px] text-muted">
                  +{num(vendor.customersAdded)} this month
                </span>
              </div>
            </CardBody>
          </Card>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="overflow-hidden xl:col-span-2">
          <CardHeader
            title={searching ? 'Matching vendors' : 'Full ranking'}
            description={
              searching
                ? 'Positions are from the full ranking, not renumbered.'
                : 'Positions 4 and below.'
            }
          />
          <Toolbar
            query={query}
            onQueryChange={setQuery}
            matched={filtered.length}
            total={owners.length}
            noun="vendors"
            placeholder="Search shop, owner or city…"
            filters={
              <DateRangeFilter
                value={dateRange}
                onChange={setDateRange}
                placeholder="Joined any time"
              />
            }
          />
          <ul className="divide-y divide-border">
            {loading && (
              <li className="px-5 py-10 text-center text-[13px] text-muted">Loading ranking…</li>
            )}
            {rest.map(({ vendor, rank }, i) => (
              <li
                key={vendor.id}
                style={{ '--i': i } as React.CSSProperties}
                className="stagger-item flex items-center gap-3 px-5 py-3 transition-colors hover:bg-surface-2"
              >
                <span className="tnum w-6 shrink-0 text-center text-[13px] font-bold text-subtle">
                  {rank}
                </span>
                <Avatar name={vendor.businessName} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-fg">
                    {vendor.businessName}
                  </p>
                  <p className="truncate text-[11px] text-muted">
                    {vendor.city} · {num(vendor.customers)} customers · {vendor.plan}
                  </p>
                </div>
                <span className="hidden w-24 shrink-0 sm:block">
                  <Sparkline
                    values={vendor.customersTrend}
                    height={22}
                    tone="muted"
                    ariaLabel={`${vendor.businessName} trend`}
                  />
                </span>
                <span
                  className={cn(
                    'tnum w-16 shrink-0 text-right text-[12px] font-bold',
                    vendor.growthPct >= 0 ? 'text-success' : 'text-danger',
                  )}
                >
                  {signed(vendor.growthPct)}
                </span>
                <span className="tnum w-20 shrink-0 text-right text-[13px] font-bold text-fg">
                  {metricValue(vendor)}
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader title="Top 8" description="Same ranking, as magnitude." />
          <CardBody>
            {filtered.length > 0 && (
              <BarChart
                height={280}
                labels={filtered.slice(0, 8).map(({ rank }) => `#${rank}`)}
                format={rankBy === 'revenue' ? money : num}
                caption={`Top eight vendors by ${metricLabel}`}
                series={[
                  {
                    label: rankBy === 'revenue' ? 'Paid to platform' : 'Customers',
                    values: filtered
                      .slice(0, 8)
                      .map(({ vendor: o }) =>
                        rankBy === 'revenue'
                          ? o.platformRevenue
                          : rankBy === 'growth'
                            ? Math.max(0, o.customersAdded)
                            : o.customers,
                      ),
                  },
                ]}
              />
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
