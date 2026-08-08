import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Ban,
  BadgeCheck,
  CircleCheck,
  KeyRound,
  MoreHorizontal,
  Pencil,
  SearchX,
  Trash2,
  TrendingUp,
  UserRoundPlus,
  Users,
} from 'lucide-react';
import { PageHeader } from '@/components/layout';
import {
  Avatar,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  IconButton,
  Menu,
  SearchableSelect,
  Tabs,
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
import { actions, useStore } from '@/store';
import { money, num, phone as fmtPhone } from '@/lib/format';
import type { Customer } from '@/types/domain';
import { PaymentStatusBadge } from '@/features/shared/status';
import { ResetPasswordModal, type ResetTarget } from '@/features/shared/ResetPasswordModal';
import { CustomerFormModal } from './CustomerFormModal';

const PAGE_SIZE = 12;

export function CustomersPage() {
  const { customers, owners, loading } = useStore();
  const toast = useToast();
  const [params, setParams] = useSearchParams();

  const [dateRange, setDateRange] = useState<DateRange>(ALL_TIME);
  const [tab, setTab] = useState<'all' | 'dues' | 'blocked'>('all');
  const [vendorId, setVendorId] = useState(params.get('vendor') ?? '');
  const [editing, setEditing] = useState<Customer | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState<Customer | null>(null);
  const [resetting, setResetting] = useState<ResetTarget | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Customer | null>(null);

  const sorters = useMemo(
    () => ({
      name: (c: Customer) => c.name,
      vendor: (c: Customer) => c.vendorName,
      outstanding: (c: Customer) => c.outstanding,
      months: (c: Customer) => c.monthsActive,
    }),
    [],
  );

  const table = useDataTable<Customer>({
    rows: customers,
    searchFields: (c) => [c.name, c.phone, c.vendorName, c.area, c.address],
    sorters,
    initialSort: { columnId: 'outstanding', direction: 'desc' },
    pageSize: PAGE_SIZE,
  });

  // Date filtering runs through the same predicate registry as every other
  // filter, so it composes with search and the tabs for free.
  useEffect(() => {
    table.setFilter(
      'date',
      dateRange.from === null && dateRange.to === null
        ? null
        : (c) => inRange(c.joinedAt, dateRange),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  const { setFilter } = table;

  // Deep-link support: /customers?vendor=own_003 arrives pre-filtered from the
  // vendor drawer, so "show me this vendor's customers" is one click.
  useEffect(() => {
    setFilter('vendor', vendorId ? (c) => c.vendorId === vendorId : null);
    if (vendorId) params.set('vendor', vendorId);
    else params.delete('vendor');
    setParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorId]);

  useEffect(() => {
    setFilter(
      'tab',
      tab === 'dues'
        ? (c) => c.outstanding > 0
        : tab === 'blocked'
          ? (c) => c.blocked
          : null,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const scoped = useMemo(
    () => (vendorId ? customers.filter((c) => c.vendorId === vendorId) : customers),
    [customers, vendorId],
  );

  const summary = useMemo(
    () => ({
      total: scoped.length,
      blocked: scoped.filter((c) => c.blocked).length,
      outstanding: scoped.reduce((s, c) => s + c.outstanding, 0),
      overdue: scoped.filter((c) => c.status === 'overdue').length,
      newThisMonth: scoped.filter((c) => c.monthsActive <= 1).length,
    }),
    [scoped],
  );

  const activeVendor = owners.find((o) => o.id === vendorId) ?? null;

  const openEdit = (customer: Customer) => {
    setEditing(customer);
    setFormOpen(true);
  };

  const columns: Column<Customer>[] = [
    {
      id: 'name',
      header: 'Customer',
      sortable: true,
      cell: (c) => (
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={c.name} size="sm" status={c.blocked ? 'offline' : 'online'} />
          <div className="min-w-0">
            <p className={`truncate font-semibold ${c.blocked ? 'text-muted line-through' : 'text-fg'}`}>
              {c.name}
            </p>
            <p className="truncate text-[11px] text-muted">{fmtPhone(c.phone)}</p>
          </div>
        </div>
      ),
    },
    {
      id: 'vendor',
      header: 'Vendor',
      sortable: true,
      hideBelow: 'md',
      cell: (c) => <span className="text-[13px] text-muted">{c.vendorName}</span>,
    },
    {
      id: 'area',
      header: 'Area',
      hideBelow: 'lg',
      width: '120px',
      cell: (c) => <span className="text-[13px] text-muted">{c.area}</span>,
    },
    {
      id: 'months',
      header: 'Tenure',
      align: 'right',
      sortable: true,
      width: '90px',
      hideBelow: 'xl',
      cell: (c) => <span className="tnum text-[13px] text-muted">{c.monthsActive} mo</span>,
    },
    {
      id: 'outstanding',
      header: 'Outstanding',
      align: 'right',
      sortable: true,
      width: '120px',
      cell: (c) => (
        <span className={`tnum font-semibold ${c.outstanding > 0 ? 'text-fg' : 'text-subtle'}`}>
          {c.outstanding > 0 ? money(c.outstanding) : '—'}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      width: '110px',
      cell: (c) =>
        c.blocked ? (
          <Badge tone="danger" dot size="sm">
            Blocked
          </Badge>
        ) : (
          <PaymentStatusBadge status={c.status} />
        ),
    },
    {
      id: 'actions',
      header: '',
      align: 'right',
      width: '52px',
      cell: (c) => (
        <Menu
          items={[
            { label: 'Edit customer', icon: <Pencil />, onSelect: () => openEdit(c) },
            {
              label: 'Mark dues settled',
              icon: <CircleCheck />,
              disabled: c.outstanding === 0,
              onSelect: () => {
                actions.settleCustomerDues(c.id);
                toast.success('Dues settled', `${money(c.outstanding)} recorded as cash.`);
              },
            },
            {
              label: 'Reset password',
              icon: <KeyRound />,
              onSelect: () =>
                setResetting({
                  id: c.id,
                  name: c.name,
                  contact: fmtPhone(c.phone),
                  kind: 'customer',
                }),
            },
            {
              label: c.blocked ? 'Unblock customer' : 'Block customer',
              icon: c.blocked ? <BadgeCheck /> : <Ban />,
              tone: c.blocked ? 'default' : 'danger',
              separated: true,
              onSelect: () => setConfirmBlock(c),
            },
            {
              label: 'Delete customer',
              icon: <Trash2 />,
              tone: 'danger',
              onSelect: () => setConfirmDelete(c),
            },
          ]}
          trigger={({ toggle }) => (
            <IconButton
              label={`Actions for ${c.name}`}
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
        title="Customers"
        description={
          activeVendor
            ? `People served by ${activeVendor.businessName}.`
            : 'Every person our vendors serve, across all tea shops.'
        }
        actions={
          <Button
            variant="primary"
            leadingIcon={<UserRoundPlus className="size-4" />}
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            Add customer
          </Button>
        }
        below={
          <Tabs
            items={[
              { value: 'all', label: 'All', count: scoped.length },
              { value: 'dues', label: 'Has dues', count: scoped.filter((c) => c.outstanding > 0).length },
              { value: 'blocked', label: 'Blocked', count: summary.blocked },
            ]}
            value={tab}
            onChange={(value) => setTab(value as typeof tab)}
          />
        }
      />

      {activeVendor && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-primary/30 bg-primary-soft px-4 py-3 animate-pop-in">
          <Avatar name={activeVendor.businessName} size="sm" />
          <p className="min-w-0 flex-1 text-[13px] font-semibold text-primary-soft-fg">
            Filtered to {activeVendor.businessName} · {activeVendor.city}
          </p>
          <Button size="xs" variant="secondary" onClick={() => setVendorId('')}>
            Show all vendors
          </Button>
        </div>
      )}

      <section className="mb-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile
          index={0}
          label="Customers"
          value={<AnimatedNumber value={summary.total} format={num} />}
          icon={<Users />}
          loading={loading}
          footer={activeVendor ? activeVendor.businessName : 'Across all vendors'}
        />
        <StatTile
          index={1}
          label="New this month"
          value={<AnimatedNumber value={summary.newThisMonth} format={num} />}
          icon={<TrendingUp />}
          delta={11.6}
          loading={loading}
        />
        <StatTile
          index={2}
          label="Total outstanding"
          value={<AnimatedNumber value={summary.outstanding} format={money} />}
          loading={loading}
          footer={`${summary.overdue} accounts overdue`}
        />
        <StatTile
          index={3}
          label="Blocked"
          value={<AnimatedNumber value={summary.blocked} format={num} />}
          icon={<Ban />}
          loading={loading}
          footer="Deliveries paused"
        />
      </section>

      <Card className="overflow-hidden">
        <Toolbar
          query={table.query}
          onQueryChange={table.setQuery}
          matched={table.matched}
          total={customers.length}
          noun="customers"
          placeholder="Search name, phone, vendor or area…"
          filters={
            <>
              <DateRangeFilter value={dateRange} onChange={setDateRange} placeholder="Joined any time" />
              <SearchableSelect
                value={vendorId}
                onChange={setVendorId}
                options={owners.map((o) => ({
                  value: o.id,
                  label: o.businessName,
                  hint: `${o.ownerName} · ${o.city}`,
                }))}
                placeholder="All vendors"
                clearLabel="All vendors"
                ariaLabel="Filter by vendor"
                className="w-56"
              />
            </>
          }
        />

        <DataTable
          columns={columns}
          rows={table.rows}
          rowKey={(c) => c.id}
          sort={table.sort}
          onSortChange={table.toggleSort}
          onRowClick={openEdit}
          loading={loading}
          skeletonRows={8}
          empty={
            <EmptyState
              variant="search"
              icon={<SearchX />}
              title="No customers found"
              description="Nothing matches that search, vendor and tab combination."
              action={
                <Button
                  variant="secondary"
                  onClick={() => {
                    table.setQuery('');
                    setVendorId('');
                    setTab('all');
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
              noun: 'customers',
            }}
          />
        </div>
      </Card>

      <CustomerFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        customer={editing}
        defaultVendorId={vendorId || undefined}
      />

      <ResetPasswordModal target={resetting} onClose={() => setResetting(null)} />

      <ConfirmDialog
        open={!!confirmBlock}
        onClose={() => setConfirmBlock(null)}
        tone={confirmBlock?.blocked ? 'primary' : 'danger'}
        title={confirmBlock?.blocked ? 'Unblock this customer?' : 'Block this customer?'}
        confirmLabel={confirmBlock?.blocked ? 'Unblock customer' : 'Block customer'}
        description={
          confirmBlock?.blocked ? (
            <>
              Deliveries and billing resume for{' '}
              <strong className="text-fg">{confirmBlock.name}</strong>.
            </>
          ) : (
            <>
              <strong className="text-fg">{confirmBlock?.name}</strong> stops receiving deliveries
              and will not be billed. Their history and{' '}
              {money(confirmBlock?.outstanding ?? 0)} of outstanding dues are kept.
            </>
          )
        }
        onConfirm={() => {
          if (!confirmBlock) return;
          actions.setCustomerBlocked(confirmBlock.id, !confirmBlock.blocked);
          toast[confirmBlock.blocked ? 'success' : 'error'](
            confirmBlock.blocked ? 'Customer unblocked' : 'Customer blocked',
            confirmBlock.name,
          );
        }}
      />

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete this customer?"
        confirmLabel="Delete customer"
        description={
          <>
            <strong className="text-fg">{confirmDelete?.name}</strong> and their billing history
            will be removed. This cannot be undone — block them instead if you may need the record.
          </>
        }
        onConfirm={() => {
          if (!confirmDelete) return;
          actions.deleteCustomer(confirmDelete.id);
          toast.error('Customer deleted', confirmDelete.name);
        }}
      />
    </>
  );
}
