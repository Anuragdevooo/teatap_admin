import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, LifeBuoy, MessageSquare, SearchX } from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { Avatar, Badge, Button, Card, EmptyState, Tabs, useToast } from '@/components/ui';
import {
  ALL_TIME,
  Column,
  DataTable,
  DateRangeFilter,
  inRange,
  Pagination,
  StatTile,
  Toolbar,
  useDataTable,
  type DateRange,
} from '@/components/data';
import { actions, useStore } from '@/store';
import { num, relativeTime } from '@/lib/format';
import type { SupportRequest } from '@/types/domain';
import { PriorityBadge } from '@/features/shared/status';

const PAGE_SIZE = 10;
const PRIORITY_RANK = { Urgent: 3, High: 2, Normal: 1, Low: 0 } as const;

export function SupportPage() {
  const { support: tickets, loading } = useStore();
  const toast = useToast();
  const [dateRange, setDateRange] = useState<DateRange>(ALL_TIME);
  const [status, setStatus] = useState<'all' | SupportRequest['status']>('all');
  

  const table = useDataTable<SupportRequest>({
    rows: tickets,
    searchFields: (t) => [t.subject, t.ownerName, t.city],
    sorters: {
      subject: (t) => t.subject,
      priority: (t) => PRIORITY_RANK[t.priority],
      opened: (t) => t.openedAt,
    },
    initialSort: { columnId: 'priority', direction: 'desc' },
    pageSize: PAGE_SIZE,
  });

  // Date filtering runs through the same predicate registry as every other
  // filter, so it composes with search and the tabs for free.
  useEffect(() => {
    table.setFilter(
      'date',
      dateRange.from === null && dateRange.to === null
        ? null
        : (t) => inRange(t.openedAt, dateRange),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  const counts = useMemo(
    () => ({
      all: tickets.length,
      Open: tickets.filter((t) => t.status === 'Open').length,
      Pending: tickets.filter((t) => t.status === 'Pending').length,
      Resolved: tickets.filter((t) => t.status === 'Resolved').length,
      urgent: tickets.filter((t) => t.priority === 'Urgent').length,
    }),
    [tickets],
  );

  const columns: Column<SupportRequest>[] = [
    {
      id: 'subject',
      header: 'Ticket',
      sortable: true,
      cell: (t) => (
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={t.ownerName} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-semibold text-fg">{t.subject}</p>
            <p className="truncate text-[11px] text-muted">
              {t.ownerName} · {t.city}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'priority',
      header: 'Priority',
      sortable: true,
      width: '110px',
      cell: (t) => <PriorityBadge priority={t.priority} />,
    },
    {
      id: 'messages',
      header: 'Replies',
      align: 'right',
      width: '90px',
      hideBelow: 'md',
      cell: (t) => (
        <span className="tnum inline-flex items-center gap-1 text-[13px] text-muted">
          <MessageSquare className="size-3.5" />
          {t.messages}
        </span>
      ),
    },
    {
      id: 'opened',
      header: 'Opened',
      sortable: true,
      hideBelow: 'sm',
      width: '150px',
      cell: (t) => <span className="text-[13px] text-muted">{relativeTime(t.openedAt)}</span>,
    },
    {
      id: 'status',
      header: 'Status',
      width: '110px',
      cell: (t) => (
        <Badge
          tone={t.status === 'Open' ? 'danger' : t.status === 'Pending' ? 'warning' : 'success'}
          dot
          size="sm"
        >
          {t.status}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: '',
      align: 'right',
      width: '110px',
      hideBelow: 'lg',
      cell: (t) => (
        <Button
          size="xs"
          variant={t.status === 'Resolved' ? 'ghost' : 'secondary'}
          disabled={t.status === 'Resolved'}
          onClick={() => {
            actions.setTicketStatus(t.id, 'Resolved');
            toast.success('Ticket resolved', t.subject);
          }}
        >
          {t.status === 'Resolved' ? 'Closed' : 'Resolve'}
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Support"
        description="Requests raised by tea shop owners, newest and most urgent first."
        below={
          <Tabs
            items={[
              { value: 'all', label: 'All', count: counts.all },
              { value: 'Open', label: 'Open', count: counts.Open },
              { value: 'Pending', label: 'Pending', count: counts.Pending },
              { value: 'Resolved', label: 'Resolved', count: counts.Resolved },
            ]}
            value={status}
            onChange={(value) => {
              setStatus(value as typeof status);
              table.setFilter('status', value === 'all' ? null : (t) => t.status === value);
            }}
          />
        }
      />

      <section className="mb-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        <StatTile label="Open tickets" value={num(counts.Open)} icon={<LifeBuoy />} loading={loading} footer="Awaiting first response" />
        <StatTile label="Urgent" value={num(counts.urgent)} loading={loading} footer="Escalate within 4 hours" />
        <StatTile
          label="Resolved"
          value={num(counts.Resolved)}
          icon={<CheckCircle2 />}
          loading={loading}
          footer="Closed this month"
        />
      </section>

      <Card className="overflow-hidden">
        <Toolbar
          query={table.query}
          onQueryChange={table.setQuery}
          matched={table.matched}
          total={tickets.length}
          noun="tickets"
          placeholder="Search subject, shop or city…"
          filters={<DateRangeFilter value={dateRange} onChange={setDateRange} placeholder="Opened any time" />}
        />

        <DataTable
          columns={columns}
          rows={table.rows}
          rowKey={(t) => t.id}
          sort={table.sort}
          onSortChange={table.toggleSort}
          loading={loading}
          empty={
            <EmptyState
              variant="search"
              icon={<SearchX />}
              title="No tickets here"
              description="Nothing matches this status and search."
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
              noun: 'tickets',
            }}
          />
        </div>
      </Card>
    </>
  );
}
