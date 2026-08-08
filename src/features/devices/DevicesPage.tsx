import { useMemo, useState } from 'react';
import { Monitor, SearchX, Smartphone, TriangleAlert } from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { Avatar, Badge, Card, EmptyState, Progress, SegmentedControl } from '@/components/ui';
import { Column, DataTable, Pagination, StatTile, Toolbar, useDataTable } from '@/components/data';
import { useStore } from '@/store';
import { num, relativeTime } from '@/lib/format';
import type { DeviceSeat } from '@/types/domain';
import { PlanBadge } from '@/features/shared/status';

const VIEWS = [
  { value: 'all', label: 'All' },
  { value: 'full', label: 'At limit' },
  { value: 'over', label: 'Over limit' },
] as const;

const PAGE_SIZE = 12;

const seatState = (d: DeviceSeat) =>
  d.used > d.limit ? 'over' : d.used === d.limit ? 'full' : 'ok';

export function DevicesPage() {
  const { devices, loading } = useStore();
  const [view, setView] = useState<(typeof VIEWS)[number]['value']>('all');
  

  const sorters = useMemo(
    () => ({
      operator: (d: DeviceSeat) => d.operatorName,
      used: (d: DeviceSeat) => d.used / d.limit,
      lastLogin: (d: DeviceSeat) => d.lastLoginAt,
    }),
    [],
  );

  const table = useDataTable<DeviceSeat>({
    rows: devices,
    searchFields: (d) => [d.operatorName, d.plan, d.platform],
    sorters,
    initialSort: { columnId: 'used', direction: 'desc' },
    pageSize: PAGE_SIZE,
  });

  const summary = useMemo(
    () => ({
      seats: devices.reduce((s, d) => s + d.limit, 0),
      used: devices.reduce((s, d) => s + d.used, 0),
      atLimit: devices.filter((d) => seatState(d) === 'full').length,
      over: devices.filter((d) => seatState(d) === 'over').length,
    }),
    [devices],
  );

  const columns: Column<DeviceSeat>[] = [
    {
      id: 'operator',
      header: 'Tea shop',
      sortable: true,
      cell: (d) => (
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={d.operatorName} size="sm" />
          <p className="truncate font-semibold text-fg">{d.operatorName}</p>
        </div>
      ),
    },
    { id: 'plan', header: 'Plan', width: '110px', hideBelow: 'md', cell: (d) => <PlanBadge plan={d.plan} /> },
    {
      id: 'platform',
      header: 'Platform',
      width: '120px',
      hideBelow: 'lg',
      cell: (d) => (
        <span className="inline-flex items-center gap-1.5 text-[13px] text-muted">
          {d.platform === 'Web' ? (
            <Monitor className="size-3.5" />
          ) : (
            <Smartphone className="size-3.5" />
          )}
          {d.platform}
        </span>
      ),
    },
    {
      id: 'used',
      header: 'Seats in use',
      sortable: true,
      width: '190px',
      cell: (d) => (
        <div className="flex items-center gap-2.5">
          <Progress value={d.used} max={d.limit} tone="auto" className="w-24" label="Seats in use" />
          <span className="tnum shrink-0 text-[13px] font-semibold text-fg">
            {d.used}/{d.limit}
          </span>
        </div>
      ),
    },
    {
      id: 'lastLogin',
      header: 'Last login',
      sortable: true,
      hideBelow: 'sm',
      width: '140px',
      cell: (d) => <span className="text-[13px] text-muted">{relativeTime(d.lastLoginAt)}</span>,
    },
    {
      id: 'state',
      header: 'State',
      width: '110px',
      cell: (d) => {
        const state = seatState(d);
        return (
          <Badge
            tone={state === 'over' ? 'danger' : state === 'full' ? 'warning' : 'success'}
            dot
            size="sm"
          >
            {state === 'over' ? 'Over limit' : state === 'full' ? 'At limit' : 'Healthy'}
          </Badge>
        );
      },
    },
  ];

  return (
    <>
      <PageHeader
        title="Device seats"
        description="How many devices each tea shop has signed in, against its plan allowance."
        actions={
          <SegmentedControl
            options={VIEWS}
            value={view}
            onChange={(value) => {
              setView(value);
              table.setFilter('view', value === 'all' ? null : (d) => seatState(d) === value);
            }}
            ariaLabel="Filter seats"
          />
        }
      />

      <section className="mb-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile label="Seats allocated" value={num(summary.seats)} loading={loading} footer="Across all plans" />
        <StatTile
          label="Seats in use"
          value={num(summary.used)}
          loading={loading}
          footer={`${Math.round((summary.used / Math.max(1, summary.seats)) * 100)}% utilisation`}
        />
        <StatTile label="At limit" value={num(summary.atLimit)} loading={loading} footer="Upgrade candidates" />
        <StatTile
          label="Over limit"
          value={num(summary.over)}
          icon={<TriangleAlert />}
          loading={loading}
          footer="Blocked from new sign-ins"
        />
      </section>

      <Card className="overflow-hidden">
        <Toolbar
          query={table.query}
          onQueryChange={table.setQuery}
          matched={table.matched}
          total={devices.length}
          noun="vendors"
          placeholder="Search tea shop, plan or platform…"
        />

        <DataTable
          columns={columns}
          rows={table.rows}
          rowKey={(d) => d.ownerId}
          sort={table.sort}
          onSortChange={table.toggleSort}
          loading={loading}
          skeletonRows={8}
          empty={
            <EmptyState
              variant="search"
              icon={<SearchX />}
              title="Nothing in this view"
              description="No tea shop currently matches that seat state."
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
              noun: 'tea shops',
            }}
          />
        </div>
      </Card>
    </>
  );
}
