import { useEffect, useMemo, useState } from 'react';
import {
  CreditCard,
  Eye,
  IndianRupee,
  KeyRound,
  Lock,
  LockOpen,
  MoreHorizontal,
  Pencil,
  Plus,
  SearchX,
  Store,
  Trash2,
  TrendingUp,
  UsersRound,
} from 'lucide-react';
import { PageHeader } from '@/components/layout';
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  ConfirmDialog,
  EmptyState,
  IconButton,
  Menu,
  Select,
  useToast,
} from '@/components/ui';
import {
  AnimatedNumber,
  ALL_TIME,
  Column,
  DateRangeFilter,
  inRange,
  type DateRange,
  DataTable,
  Pagination,
  StatTile,
  Toolbar,
  useDataTable,
} from '@/components/data';
import { BarChart, DonutChart, Sparkline } from '@/components/charts';
import { actions, useStore } from '@/store';
import { money, num, relativeTime, signed } from '@/lib/format';
import type { Owner, PlanTier } from '@/types/domain';
import { PlanBadge } from '@/features/shared/status';
import { ResetPasswordModal, type ResetTarget } from '@/features/shared/ResetPasswordModal';
import { VendorDrawer } from './VendorDrawer';
import { VendorFormModal } from './VendorFormModal';
import { SubscriptionModal } from './SubscriptionModal';

const PLAN_OPTIONS = [
  { value: '', label: 'All plans' },
  { value: 'Trial', label: 'Trial' },
  { value: 'Starter', label: 'Starter' },
  { value: 'Pro', label: 'Pro' },
  { value: 'Enterprise', label: 'Enterprise' },
];

const STATE_OPTIONS = [
  { value: '', label: 'All accounts' },
  { value: 'active', label: 'Active only' },
  { value: 'locked', label: 'Blocked only' },
  { value: 'dues', label: 'Has outstanding' },
];

const PAGE_SIZE = 10;

export function VendorsPage() {
  const { owners, loading } = useStore();
  const toast = useToast();

  const [dateRange, setDateRange] = useState<DateRange>(ALL_TIME);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Owner | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [subscriptionFor, setSubscriptionFor] = useState<string | null>(null);
  const [confirmBlock, setConfirmBlock] = useState<Owner | null>(null);
  const [resetting, setResetting] = useState<ResetTarget | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Owner | null>(null);
  const [plan, setPlan] = useState('');
  const [state, setState] = useState('');

  const sorters = useMemo(
    () => ({
      business: (o: Owner) => o.businessName,
      customers: (o: Owner) => o.customers,
      growth: (o: Owner) => o.growthPct,
      revenue: (o: Owner) => o.platformRevenue,
      lastLogin: (o: Owner) => o.lastLoginAt,
    }),
    [],
  );

  const table = useDataTable<Owner>({
    rows: owners,
    searchFields: (o) => [o.businessName, o.ownerName, o.phone, o.city, o.area],
    sorters,
    initialSort: { columnId: 'customers', direction: 'desc' },
    pageSize: PAGE_SIZE,
  });

  // Date filtering runs through the same predicate registry as every other
  // filter, so it composes with search and the tabs for free.
  useEffect(() => {
    table.setFilter(
      'date',
      dateRange.from === null && dateRange.to === null
        ? null
        : (o) => inRange(o.joinedAt, dateRange),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  const summary = useMemo(() => {
    const blocked = owners.filter((o) => o.locked);
    const planMix = (['Trial', 'Starter', 'Pro', 'Enterprise'] as PlanTier[]).map((tier) => ({
      label: tier,
      value: owners.filter((o) => o.plan === tier).length,
    }));
    // Vendors per city — where the platform has tenants, not what they sell.
    const byCity = Object.entries(
      owners.reduce<Record<string, number>>((acc, o) => {
        acc[o.city] = (acc[o.city] ?? 0) + o.customers;
        return acc;
      }, {}),
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    return {
      total: owners.length,
      active: owners.length - blocked.length,
      blocked: blocked.length,
      customers: owners.reduce((s, o) => s + o.customers, 0),
      newCustomers: owners.reduce((s, o) => s + o.customersAdded, 0),
      platformRevenue: owners.reduce((s, o) => s + o.monthlyFee, 0),
      planMix,
      cityLabels: byCity.map(([city]) => city),
      cityValues: byCity.map(([, value]) => value),
    };
  }, [owners]);

  const openEdit = (vendor: Owner) => {
    setEditing(vendor);
    setFormOpen(true);
  };

  const columns: Column<Owner>[] = [
    {
      id: 'business',
      header: 'Tea shop',
      sortable: true,
      cell: (o) => (
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={o.businessName} size="sm" status={o.locked ? 'offline' : 'online'} />
          <div className="min-w-0">
            <p className="truncate font-semibold text-fg">{o.businessName}</p>
            <p className="truncate text-[11px] text-muted">
              {o.ownerName} · {o.city}
            </p>
          </div>
        </div>
      ),
    },
    { id: 'plan', header: 'Plan', hideBelow: 'md', width: '110px', cell: (o) => <PlanBadge plan={o.plan} /> },
    {
      id: 'customers',
      header: 'Customers',
      align: 'right',
      sortable: true,
      width: '110px',
      hideBelow: 'sm',
      cell: (o) => <span className="tnum font-semibold">{num(o.customers)}</span>,
    },
    {
      id: 'trend',
      header: 'Customer trend',
      width: '120px',
      hideBelow: 'lg',
      cell: (o) => (
        <Sparkline
          values={o.customersTrend}
          height={26}
          tone={o.growthPct >= 0 ? 'primary' : 'danger'}
          ariaLabel={`${o.businessName} customer count over 14 periods`}
        />
      ),
    },
    {
      id: 'growth',
      header: 'Growth',
      align: 'right',
      sortable: true,
      width: '110px',
      cell: (o) => (
        <span
          className={`tnum inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
            o.growthPct >= 0 ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'
          }`}
        >
          {signed(o.growthPct)}
        </span>
      ),
    },
    {
      id: 'revenue',
      header: 'Pays us',
      align: 'right',
      sortable: true,
      width: '110px',
      hideBelow: 'xl',
      cell: (o) => (
        <span className="tnum font-semibold">
          {o.monthlyFee ? `${money(o.monthlyFee)}/mo` : 'Free'}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      width: '110px',
      cell: (o) =>
        o.locked ? (
          <Badge tone="danger" dot size="sm">
            Blocked
          </Badge>
        ) : (
          <Badge tone="success" dot size="sm">
            Active
          </Badge>
        ),
    },
    {
      id: 'lastLogin',
      header: 'Last login',
      sortable: true,
      hideBelow: 'xl',
      width: '130px',
      cell: (o) => <span className="text-[12px] text-muted">{relativeTime(o.lastLoginAt)}</span>,
    },
    {
      id: 'actions',
      header: '',
      align: 'right',
      width: '52px',
      cell: (o) => (
        <Menu
          items={[
            { label: 'View details', icon: <Eye />, onSelect: () => setDetailId(o.id) },
            { label: 'Edit vendor', icon: <Pencil />, onSelect: () => openEdit(o) },
            {
              label: 'Manage subscription',
              icon: <CreditCard />,
              onSelect: () => setSubscriptionFor(o.id),
            },
            {
              label: 'Reset password',
              icon: <KeyRound />,
              onSelect: () =>
                setResetting({
                  id: o.id,
                  name: o.businessName,
                  contact: o.email ?? o.phone,
                  kind: 'vendor',
                }),
            },
            {
              label: o.locked ? 'Unblock vendor' : 'Block vendor',
              icon: o.locked ? <LockOpen /> : <Lock />,
              tone: o.locked ? 'default' : 'danger',
              separated: true,
              onSelect: () => setConfirmBlock(o),
            },
            {
              label: 'Delete vendor',
              icon: <Trash2 />,
              tone: 'danger',
              onSelect: () => setConfirmDelete(o),
            },
          ]}
          trigger={({ toggle }) => (
            <IconButton
              label={`Actions for ${o.businessName}`}
              icon={<MoreHorizontal />}
              size="sm"
              onClick={toggle}
            />
          )}
        />
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Vendors"
        description="Every tea shop on the platform — plan, volume, dues and account state."
        actions={
          <Button
            variant="primary"
            leadingIcon={<Plus className="size-4" />}
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            Add vendor
          </Button>
        }
      />

      <section className="mb-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile
          index={0}
          label="Vendors"
          value={<AnimatedNumber value={summary.total} format={num} />}
          icon={<Store />}
          loading={loading}
          footer={`${summary.active} active · ${summary.blocked} blocked`}
        />
        <StatTile
          index={1}
          label="Customers served"
          value={<AnimatedNumber value={summary.customers} format={num} />}
          icon={<UsersRound />}
          loading={loading}
          footer="Across all vendors"
        />
        <StatTile
          index={2}
          label="New customers this month"
          value={<AnimatedNumber value={summary.newCustomers} format={num} />}
          icon={<TrendingUp />}
          delta={11.6}
          loading={loading}
          footer="Brought in by our vendors"
        />
        <StatTile
          index={3}
          label="Subscription revenue"
          value={<AnimatedNumber value={summary.platformRevenue} format={money} />}
          icon={<IndianRupee />}
          loading={loading}
          footer="What vendors pay the platform"
        />
      </section>

      <section className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Customer reach by city"
            description="How many people our vendors serve, per city."
          />
          <CardBody>
            {!loading && summary.cityLabels.length > 0 && (
              <BarChart
                height={230}
                labels={summary.cityLabels}
                format={num}
                caption="Customers served by city"
                series={[{ label: 'Customers', values: summary.cityValues }]}
              />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Plan mix" description="How vendors are distributed." />
          <CardBody>
            {!loading && (
              <DonutChart
                slices={summary.planMix}
                format={(v) => `${v} vendors`}
                centerLabel="Vendors"
                centerValue={num(summary.total)}
                caption="Vendors by subscription plan"
              />
            )}
          </CardBody>
        </Card>
      </section>

      <Card className="overflow-hidden">
        <Toolbar
          query={table.query}
          onQueryChange={table.setQuery}
          matched={table.matched}
          total={owners.length}
          noun="vendors"
          placeholder="Search shop, owner, phone or city…"
          filters={
            <>
              <DateRangeFilter value={dateRange} onChange={setDateRange} placeholder="Joined any time" />
              <Select
                size="sm"
                options={PLAN_OPTIONS}
                value={plan}
                onChange={(e) => {
                  setPlan(e.target.value);
                  table.setFilter('plan', e.target.value ? (o) => o.plan === e.target.value : null);
                }}
                aria-label="Filter by plan"
                className="w-36"
              />
              <Select
                size="sm"
                options={STATE_OPTIONS}
                value={state}
                onChange={(e) => {
                  const value = e.target.value;
                  setState(value);
                  table.setFilter(
                    'state',
                    value === 'active'
                      ? (o) => !o.locked
                      : value === 'locked'
                        ? (o) => o.locked
                        : value === 'dues'
                          ? (o) => o.outstanding > 0
                          : null,
                  );
                }}
                aria-label="Filter by account state"
                className="w-40"
              />
            </>
          }
        />

        <DataTable
          columns={columns}
          rows={table.rows}
          rowKey={(o) => o.id}
          sort={table.sort}
          onSortChange={table.toggleSort}
          onRowClick={(o) => setDetailId(o.id)}
          loading={loading}
          empty={
            <EmptyState
              variant="search"
              icon={<SearchX />}
              title="No vendors match those filters"
              description="Try a different plan, or clear the search to see every tea shop."
              action={
                <Button
                  variant="secondary"
                  onClick={() => {
                    table.setQuery('');
                    setPlan('');
                    setState('');
                    table.setFilter('plan', null);
                    table.setFilter('state', null);
                  }}
                >
                  Clear filters
                </Button>
              }
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
              noun: 'vendors',
            }}
          />
        </div>
      </Card>

      <VendorDrawer
        vendorId={detailId}
        onClose={() => setDetailId(null)}
        onEdit={openEdit}
        onManageSubscription={setSubscriptionFor}
      />

      <VendorFormModal open={formOpen} onClose={() => setFormOpen(false)} vendor={editing} />

      <SubscriptionModal
        open={!!subscriptionFor}
        ownerId={subscriptionFor}
        onClose={() => setSubscriptionFor(null)}
      />

      <ResetPasswordModal target={resetting} onClose={() => setResetting(null)} />

      <ConfirmDialog
        open={!!confirmBlock}
        onClose={() => setConfirmBlock(null)}
        tone={confirmBlock?.locked ? 'primary' : 'danger'}
        title={confirmBlock?.locked ? 'Unblock this vendor?' : 'Block this vendor?'}
        confirmLabel={confirmBlock?.locked ? 'Unblock vendor' : 'Block vendor'}
        description={
          confirmBlock?.locked ? (
            <>
              <strong className="text-fg">{confirmBlock.businessName}</strong> will resume billing
              and its operator will be able to sign in again.
            </>
          ) : (
            <>
              <strong className="text-fg">{confirmBlock?.businessName}</strong> stops billing
              immediately and its operator is locked out. The subscription moves to past due.
            </>
          )
        }
        onConfirm={() => {
          if (!confirmBlock) return;
          actions.setVendorLocked(confirmBlock.id, !confirmBlock.locked);
          toast[confirmBlock.locked ? 'success' : 'error'](
            confirmBlock.locked ? 'Vendor unblocked' : 'Vendor blocked',
            confirmBlock.businessName,
          );
        }}
      />

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete this vendor?"
        confirmLabel="Delete vendor"
        description={
          <>
            <strong className="text-fg">{confirmDelete?.businessName}</strong> will be removed along
            with its subscription and device seats. This cannot be undone.
          </>
        }
        onConfirm={() => {
          if (!confirmDelete) return;
          actions.deleteVendor(confirmDelete.id);
          toast.error('Vendor deleted', confirmDelete.businessName);
        }}
      />
    </>
  );
}
