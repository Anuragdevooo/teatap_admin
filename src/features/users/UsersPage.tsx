import { useEffect, useMemo, useState } from 'react';
import {
  Ban,
  BadgeCheck,
  Flag,
  KeyRound,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  SearchX,
  ShieldCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/layout';
import {
  Avatar,
  Badge,
  Card,
  CardBody,
  CardHeader,
  ConfirmDialog,
  EmptyState,
  IconButton,
  Menu,
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
import { AreaChart, DonutChart } from '@/components/charts';
import { actions, useStore } from '@/store';
import { dashboardStats } from '@/mocks/seed';
import { date, num, numCompact, phone as fmtPhone, relativeTime } from '@/lib/format';
import type { AdminUser, Role } from '@/types/domain';
import { AccountStatusBadge } from '@/features/shared/status';
import { ResetPasswordModal, type ResetTarget } from '@/features/shared/ResetPasswordModal';
import { UserFormModal } from './UserFormModal';

const ROLE_TONE = { admin: 'accent', operator: 'brand', customer: 'neutral' } as const;
const ROLE_LABEL = { admin: 'Admin', operator: 'Vendor', customer: 'Customer' } as const;
const PAGE_SIZE = 12;

export function UsersPage() {
  const { users, loading } = useStore();
  const toast = useToast();
  const navigate = useNavigate();

  const [dateRange, setDateRange] = useState<DateRange>(ALL_TIME);
  const [role, setRole] = useState<Role | 'all'>('all');
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [confirmBlock, setConfirmBlock] = useState<AdminUser | null>(null);
  const [resetting, setResetting] = useState<ResetTarget | null>(null);

  const sorters = useMemo(
    () => ({
      name: (u: AdminUser) => u.name,
      joined: (u: AdminUser) => u.joinedAt,
      active: (u: AdminUser) => u.lastActiveAt,
    }),
    [],
  );

  const table = useDataTable<AdminUser>({
    rows: users,
    searchFields: (u) => [u.name, u.email, u.phone, u.city],
    sorters,
    initialSort: { columnId: 'active', direction: 'desc' },
    pageSize: PAGE_SIZE,
  });

  // Date filtering runs through the same predicate registry as every other
  // filter, so it composes with search and the tabs for free.
  useEffect(() => {
    table.setFilter(
      'date',
      dateRange.from === null && dateRange.to === null
        ? null
        : (u) => inRange(u.joinedAt, dateRange),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  const counts = useMemo(
    () => ({
      all: users.length,
      admin: users.filter((u) => u.role === 'admin').length,
      operator: users.filter((u) => u.role === 'operator').length,
      customer: users.filter((u) => u.role === 'customer').length,
      blocked: users.filter((u) => u.status === 'Blocked').length,
      flagged: users.filter((u) => u.status === 'Flagged').length,
    }),
    [users],
  );

  const columns: Column<AdminUser>[] = [
    {
      id: 'name',
      header: 'User',
      sortable: true,
      cell: (u) => (
        <div className="flex min-w-0 items-center gap-3">
          <Avatar
            name={u.name}
            size="sm"
            status={u.status === 'Blocked' ? 'offline' : 'online'}
          />
          <div className="min-w-0">
            <p
              className={`truncate font-semibold ${
                u.status === 'Blocked' ? 'text-muted line-through' : 'text-fg'
              }`}
            >
              {u.name}
            </p>
            <p className="truncate text-[11px] text-muted">{u.email ?? fmtPhone(u.phone)}</p>
          </div>
        </div>
      ),
    },
    {
      id: 'role',
      header: 'Role',
      width: '110px',
      cell: (u) => (
        <Badge tone={ROLE_TONE[u.role]} size="sm">
          {ROLE_LABEL[u.role]}
        </Badge>
      ),
    },
    {
      id: 'city',
      header: 'City',
      hideBelow: 'md',
      width: '110px',
      cell: (u) => <span className="text-[13px] text-muted">{u.city}</span>,
    },
    {
      id: 'joined',
      header: 'Joined',
      sortable: true,
      hideBelow: 'lg',
      width: '130px',
      cell: (u) => <span className="text-[13px] text-muted">{date(u.joinedAt)}</span>,
    },
    {
      id: 'active',
      header: 'Last active',
      sortable: true,
      hideBelow: 'sm',
      width: '140px',
      cell: (u) => <span className="text-[13px] text-muted">{relativeTime(u.lastActiveAt)}</span>,
    },
    {
      id: 'status',
      header: 'Status',
      width: '110px',
      cell: (u) => <AccountStatusBadge status={u.status} />,
    },
    {
      id: 'actions',
      header: '',
      align: 'right',
      width: '52px',
      cell: (u) => (
        <Menu
          items={[
            { label: 'Edit user', icon: <Pencil />, onSelect: () => setEditing(u) },
            {
              label: 'Message user',
              icon: <MessageSquare />,
              onSelect: () => navigate('/chat'),
            },
            {
              label: 'Reset password',
              icon: <KeyRound />,
              onSelect: () =>
                setResetting({
                  id: u.id,
                  name: u.name,
                  contact: u.email ?? fmtPhone(u.phone),
                  kind: 'user',
                }),
            },
            {
              label: 'Make admin',
              icon: <ShieldCheck />,
              disabled: u.role === 'admin',
              separated: true,
              onSelect: () => {
                actions.setUserRole(u.id, 'admin');
                toast.success('Role changed', `${u.name} is now an admin.`);
              },
            },
            {
              label: u.status === 'Flagged' ? 'Clear flag' : 'Flag account',
              icon: <Flag />,
              onSelect: () => {
                actions.setUserStatus(u.id, u.status === 'Flagged' ? 'Active' : 'Flagged');
                toast.info(u.status === 'Flagged' ? 'Flag cleared' : 'Account flagged', u.name);
              },
            },
            {
              label: u.status === 'Blocked' ? 'Unblock account' : 'Block account',
              icon: u.status === 'Blocked' ? <BadgeCheck /> : <Ban />,
              tone: u.status === 'Blocked' ? 'default' : 'danger',
              onSelect: () => setConfirmBlock(u),
            },
          ]}
          trigger={({ toggle }) => (
            <IconButton
              label={`Actions for ${u.name}`}
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
        title="All users"
        description="Everyone with a Teatap login — admins, vendors and customers."
        below={
          <Tabs
            items={[
              { value: 'all', label: 'Everyone', count: counts.all },
              { value: 'admin', label: 'Admins', count: counts.admin },
              { value: 'operator', label: 'Vendors', count: counts.operator },
              { value: 'customer', label: 'Customers', count: counts.customer },
            ]}
            value={role}
            onChange={(value) => {
              setRole(value as Role | 'all');
              table.setFilter('role', value === 'all' ? null : (u) => u.role === value);
            }}
          />
        }
      />

      <section className="mb-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile
          index={0}
          label="Accounts"
          value={<AnimatedNumber value={counts.all} format={num} />}
          icon={<Users />}
          delta={12.1}
          loading={loading}
        />
        <StatTile
          index={1}
          label="Vendors"
          value={<AnimatedNumber value={counts.operator} format={num} />}
          icon={<UserPlus />}
          loading={loading}
          footer="Operator logins"
        />
        <StatTile
          index={2}
          label="Flagged"
          value={<AnimatedNumber value={counts.flagged} format={num} />}
          icon={<Flag />}
          loading={loading}
          footer="Watch list"
        />
        <StatTile
          index={3}
          label="Blocked"
          value={<AnimatedNumber value={counts.blocked} format={num} />}
          icon={<Ban />}
          loading={loading}
          footer="Cannot sign in"
        />
      </section>

      <section className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="User growth"
            description="How the platform's user base has built up."
          />
          <CardBody>
            {/* Separate scales: customers are in the thousands, vendors in the
                tens. One shared axis would flatten the vendor line onto zero. */}
            {!loading && (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <p className="mb-1 text-[12px] font-bold text-fg">Customers</p>
                  <AreaChart
                    height={190}
                    labels={dashboardStats.userGrowth.labels}
                    format={numCompact}
                    caption="Customers on the platform, by month"
                    series={[{ label: 'Customers', values: dashboardStats.userGrowth.customers }]}
                  />
                </div>
                <div>
                  <p className="mb-1 text-[12px] font-bold text-fg">Vendors</p>
                  <AreaChart
                    height={190}
                    labels={dashboardStats.userGrowth.labels}
                    format={num}
                    caption="Vendors on the platform, by month"
                    series={[{ label: 'Vendors', values: dashboardStats.userGrowth.vendors }]}
                  />
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Accounts by role" description="Split of every login." />
          <CardBody>
            {!loading && (
              <DonutChart
                slices={[
                  { label: 'Customers', value: counts.customer },
                  { label: 'Vendors', value: counts.operator },
                  { label: 'Admins', value: counts.admin },
                ]}
                format={num}
                centerLabel="Accounts"
                centerValue={num(counts.all)}
                caption="Platform accounts by role"
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
          total={users.length}
          noun="users"
          placeholder="Search name, email, phone or city…"
          filters={<DateRangeFilter value={dateRange} onChange={setDateRange} placeholder="Joined any time" />}
        />

        <DataTable
          columns={columns}
          rows={table.rows}
          rowKey={(u) => u.id}
          sort={table.sort}
          onSortChange={table.toggleSort}
          onRowClick={setEditing}
          loading={loading}
          skeletonRows={8}
          empty={
            <EmptyState
              variant="search"
              icon={<SearchX />}
              title="No users match"
              description="Try a different role tab or clear the search."
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
              noun: 'users',
            }}
          />
        </div>
      </Card>

      <UserFormModal open={!!editing} onClose={() => setEditing(null)} user={editing} />

      <ResetPasswordModal target={resetting} onClose={() => setResetting(null)} />

      <ConfirmDialog
        open={!!confirmBlock}
        onClose={() => setConfirmBlock(null)}
        tone={confirmBlock?.status === 'Blocked' ? 'primary' : 'danger'}
        title={confirmBlock?.status === 'Blocked' ? 'Unblock this account?' : 'Block this account?'}
        confirmLabel={confirmBlock?.status === 'Blocked' ? 'Unblock account' : 'Block account'}
        description={
          confirmBlock?.status === 'Blocked' ? (
            <>
              <strong className="text-fg">{confirmBlock.name}</strong> will be able to sign in
              again on all their devices.
            </>
          ) : (
            <>
              <strong className="text-fg">{confirmBlock?.name}</strong> will be signed out
              everywhere and cannot log back in until an admin unblocks them.
            </>
          )
        }
        onConfirm={() => {
          if (!confirmBlock) return;
          const blocking = confirmBlock.status !== 'Blocked';
          actions.setUserStatus(confirmBlock.id, blocking ? 'Blocked' : 'Active');
          toast[blocking ? 'error' : 'success'](
            blocking ? 'Account blocked' : 'Account unblocked',
            confirmBlock.name,
          );
        }}
      />
    </>
  );
}
