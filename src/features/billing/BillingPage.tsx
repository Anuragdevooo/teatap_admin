import { useMemo, useState } from 'react';
import {
  Banknote,
  CreditCard,
  Download,
  IndianRupee,
  Landmark,
  Receipt,
  SearchX,
  Smartphone,
  TriangleAlert,
} from 'lucide-react';
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
  Tabs,
  SegmentedControl,
  useToast,
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
import { AreaChart, DonutChart } from '@/components/charts';
import { actions, useStore } from '@/store';
import {
  bucketByPeriod,
  endOfYear,
  PERIOD_NOUN,
  PERIOD_OPTIONS,
  yearsIn,
  type Period,
} from '@/lib/period';
import { date, money, moneyCompact, num } from '@/lib/format';
import type { Bill, Payment } from '@/types/domain';
import { PaymentStatusBadge, PlanBadge } from '@/features/shared/status';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'paid', label: 'Paid' },
  { value: 'pending', label: 'Pending' },
  { value: 'overdue', label: 'Overdue' },
];

const METHOD_ICON = { upi: Smartphone, card: CreditCard, netbanking: Landmark } as const;
const METHOD_LABEL = { upi: 'UPI', card: 'Card', netbanking: 'Net banking' } as const;
const PAGE_SIZE = 10;

/**
 * The platform's own ledger: subscription invoices raised against vendors and
 * the money that came back. What a vendor bills its customers is the vendor's
 * business and deliberately absent from this console.
 */
export function BillingPage() {
  const { bills, payments, loading } = useStore();
  const toast = useToast();
  const [tab, setTab] = useState<'invoices' | 'payments'>('invoices');
  const [period, setPeriod] = useState<Period>('month');
  const [year, setYear] = useState<string>('all');
  const [status, setStatus] = useState('');

  const billTable = useDataTable<Bill>({
    rows: bills,
    searchFields: (b) => [b.invoiceNo, b.vendorName, b.plan],
    sorters: {
      invoice: (b) => b.invoiceNo,
      vendor: (b) => b.vendorName,
      due: (b) => b.dueDate,
      amount: (b) => b.amount,
    },
    initialSort: { columnId: 'due', direction: 'desc' },
    pageSize: PAGE_SIZE,
  });

  const paymentTable = useDataTable<Payment>({
    rows: payments,
    searchFields: (p) => [p.vendorName, p.invoiceNo, p.method],
    sorters: { vendor: (p) => p.vendorName, amount: (p) => p.amount, paidAt: (p) => p.paidAt },
    initialSort: { columnId: 'paidAt', direction: 'desc' },
    pageSize: PAGE_SIZE,
  });

  const summary = useMemo(() => {
    const outstanding = bills.filter((b) => b.status !== 'paid');
    const byMethod = (['upi', 'card', 'netbanking'] as const).map((method) => ({
      label: METHOD_LABEL[method],
      value: payments.filter((p) => p.method === method).reduce((sum, p) => sum + p.amount, 0),
    }));

    return {
      invoiced: bills.reduce((sum, b) => sum + b.amount, 0),
      received: payments.reduce((sum, p) => sum + p.amount, 0),
      outstanding: outstanding.reduce((sum, b) => sum + b.amount, 0),
      overdue: bills.filter((b) => b.status === 'overdue').length,
      byMethod,
    };
  }, [bills, payments]);

  const years = useMemo(() => yearsIn(payments, (p) => p.paidAt), [payments]);

  /** Receipts bucketed into calendar weeks, months or years. */
  const trend = useMemo(() => {
    // Pinning a year re-anchors the buckets to that year's end, so "last 6
    // months" of 2025 means Jul–Dec 2025 rather than six months from today.
    const scoped =
      year === 'all'
        ? payments
        : payments.filter((p) => new Date(p.paidAt).getFullYear() === Number(year));
    const anchor = year === 'all' ? Date.now() : endOfYear(Number(year));
    return bucketByPeriod(scoped, (p) => p.paidAt, (p) => p.amount, period, undefined, anchor);
  }, [payments, period, year]);

  const billColumns: Column<Bill>[] = [
    {
      id: 'invoice',
      header: 'Invoice',
      sortable: true,
      width: '120px',
      cell: (b) => <span className="font-mono text-[12px] font-semibold text-fg">{b.invoiceNo}</span>,
    },
    {
      id: 'vendor',
      header: 'Vendor',
      sortable: true,
      cell: (b) => (
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={b.vendorName} size="sm" />
          <p className="truncate font-semibold text-fg">{b.vendorName}</p>
        </div>
      ),
    },
    { id: 'plan', header: 'Plan', width: '110px', hideBelow: 'md', cell: (b) => <PlanBadge plan={b.plan} /> },
    {
      id: 'issued',
      header: 'Issued',
      hideBelow: 'xl',
      width: '130px',
      cell: (b) => <span className="text-[13px] text-muted">{date(b.issuedAt)}</span>,
    },
    {
      id: 'due',
      header: 'Due',
      sortable: true,
      hideBelow: 'sm',
      width: '130px',
      cell: (b) => (
        <span
          className={`text-[13px] ${b.status === 'overdue' ? 'font-semibold text-danger' : 'text-muted'}`}
        >
          {date(b.dueDate)}
        </span>
      ),
    },
    {
      id: 'amount',
      header: 'Amount',
      align: 'right',
      sortable: true,
      width: '110px',
      cell: (b) => <span className="tnum font-semibold">{money(b.amount)}</span>,
    },
    {
      id: 'status',
      header: 'Status',
      width: '110px',
      cell: (b) => <PaymentStatusBadge status={b.status} />,
    },
    {
      id: 'settle',
      header: '',
      align: 'right',
      width: '110px',
      hideBelow: 'lg',
      cell: (b) => (
        <Button
          size="xs"
          variant={b.status === 'paid' ? 'ghost' : 'secondary'}
          disabled={b.status === 'paid'}
          onClick={(e) => {
            e.stopPropagation();
            actions.markBillPaid(b.id);
            toast.success('Invoice settled', `${b.invoiceNo} · ${money(b.amount)} received.`);
          }}
        >
          {b.status === 'paid' ? 'Settled' : 'Mark paid'}
        </Button>
      ),
    },
  ];

  const paymentColumns: Column<Payment>[] = [
    {
      id: 'vendor',
      header: 'Vendor',
      sortable: true,
      cell: (p) => (
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={p.vendorName} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-semibold text-fg">{p.vendorName}</p>
            <p className="truncate font-mono text-[11px] text-muted">{p.invoiceNo}</p>
          </div>
        </div>
      ),
    },
    {
      id: 'method',
      header: 'Method',
      width: '140px',
      cell: (p) => {
        const Icon = METHOD_ICON[p.method];
        return (
          <Badge tone={p.method === 'upi' ? 'brand' : p.method === 'card' ? 'info' : 'neutral'} size="sm">
            <Icon className="size-3" />
            {METHOD_LABEL[p.method]}
          </Badge>
        );
      },
    },
    {
      id: 'paidAt',
      header: 'Received',
      sortable: true,
      hideBelow: 'sm',
      width: '150px',
      cell: (p) => <span className="text-[13px] text-muted">{date(p.paidAt)}</span>,
    },
    {
      id: 'amount',
      header: 'Amount',
      align: 'right',
      sortable: true,
      width: '120px',
      cell: (p) => <span className="tnum font-semibold text-success">{money(p.amount)}</span>,
    },
  ];

  return (
    <>
      <PageHeader
        title="Platform billing"
        description="Subscription invoices raised against vendors, and what has been collected."
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
                ...years.map((y) => ({ value: String(y), label: String(y) })),
              ]}
              aria-label="Filter by year"
              className="w-32"
            />
            <Button variant="secondary" leadingIcon={<Download className="size-4" />}>
              Export ledger
            </Button>
          </>
        }
      />

      <section className="mb-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile
          index={0}
          label="Invoiced"
          value={<AnimatedNumber value={summary.invoiced} format={moneyCompact} />}
          icon={<Receipt />}
          loading={loading}
          footer={`${num(bills.length)} invoices`}
        />
        <StatTile
          index={1}
          label={`Received ${PERIOD_NOUN[period]}`}
          value={<AnimatedNumber value={trend.current} format={moneyCompact} />}
          icon={<IndianRupee />}
          delta={trend.deltaPct}
          deltaLabel={`vs previous ${period}`}
          loading={loading}
        />
        <StatTile
          index={2}
          label="Outstanding"
          value={<AnimatedNumber value={summary.outstanding} format={moneyCompact} />}
          icon={<Banknote />}
          loading={loading}
          footer="Unpaid and overdue"
        />
        <StatTile
          index={3}
          label="Overdue invoices"
          value={<AnimatedNumber value={summary.overdue} format={num} />}
          icon={<TriangleAlert />}
          delta={-2.4}
          invertDelta
          loading={loading}
          footer="Vendors risk being blocked"
        />
      </section>

      <section className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title={`Collections · ${period === 'week' ? 'by week' : period === 'month' ? 'by month' : 'by year'}`}
            description={`Subscription payments received from vendors. ${moneyCompact(
              trend.total,
            )} across the period shown.`}
          />
          <CardBody>
            {!loading && (
              <AreaChart
                height={220}
                labels={trend.labels}
                format={moneyCompact}
                caption={`Subscription payments received per ${period}`}
                series={[{ label: 'Received', values: trend.values }]}
              />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="How vendors pay" description="Share by payment method." />
          <CardBody>
            {!loading && (
              <DonutChart
                slices={summary.byMethod}
                format={moneyCompact}
                centerLabel="Collected"
                centerValue={moneyCompact(summary.received)}
                caption="Payments received by method"
              />
            )}
          </CardBody>
        </Card>
      </section>

      <Card className="overflow-hidden">
        <div className="px-4 pt-2">
          <Tabs
            items={[
              { value: 'invoices', label: 'Invoices', count: bills.length },
              { value: 'payments', label: 'Payments', count: payments.length },
            ]}
            value={tab}
            onChange={(value) => setTab(value as typeof tab)}
          />
        </div>

        {tab === 'invoices' ? (
          <>
            <Toolbar
              query={billTable.query}
              onQueryChange={billTable.setQuery}
              matched={billTable.matched}
              total={bills.length}
              noun="invoices"
              placeholder="Search invoice, vendor or plan…"
              filters={
                <Select
                  size="sm"
                  options={STATUS_OPTIONS}
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value);
                    billTable.setFilter(
                      'status',
                      e.target.value ? (b) => b.status === e.target.value : null,
                    );
                  }}
                  aria-label="Filter invoices by status"
                  className="w-40"
                />
              }
            />
            <DataTable
              columns={billColumns}
              rows={billTable.rows}
              rowKey={(b) => b.id}
              sort={billTable.sort}
              onSortChange={billTable.toggleSort}
              loading={loading}
              empty={
                <EmptyState
                  variant="search"
                  icon={<SearchX />}
                  title="No invoices match"
                  description="Adjust the status filter or clear the search."
                />
              }
            />
            <div className="border-t border-border px-4 py-3">
              <Pagination
                page={billTable.page}
                pageCount={billTable.pageCount}
                onPageChange={billTable.setPage}
                showing={{
                  from: (billTable.page - 1) * PAGE_SIZE + 1,
                  to: Math.min(billTable.page * PAGE_SIZE, billTable.matched),
                  total: billTable.matched,
                  noun: 'invoices',
                }}
              />
            </div>
          </>
        ) : (
          <>
            <Toolbar
              query={paymentTable.query}
              onQueryChange={paymentTable.setQuery}
              matched={paymentTable.matched}
              total={payments.length}
              noun="payments"
              placeholder="Search vendor, invoice or method…"
            />
            <DataTable
              columns={paymentColumns}
              rows={paymentTable.rows}
              rowKey={(p) => p.id}
              sort={paymentTable.sort}
              onSortChange={paymentTable.toggleSort}
              loading={loading}
              empty={
                <EmptyState
                  variant="search"
                  icon={<SearchX />}
                  title="No payments match"
                  description="Nothing was received matching that search."
                />
              }
            />
            <div className="border-t border-border px-4 py-3">
              <Pagination
                page={paymentTable.page}
                pageCount={paymentTable.pageCount}
                onPageChange={paymentTable.setPage}
                showing={{
                  from: (paymentTable.page - 1) * PAGE_SIZE + 1,
                  to: Math.min(paymentTable.page * PAGE_SIZE, paymentTable.matched),
                  total: paymentTable.matched,
                  noun: 'payments',
                }}
              />
            </div>
          </>
        )}
      </Card>
    </>
  );
}
