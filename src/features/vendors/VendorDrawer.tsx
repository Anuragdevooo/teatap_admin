import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  Lock,
  LockOpen,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Smartphone,
  Trash2,
  UsersRound,
} from 'lucide-react';
import {
  Avatar,
  Badge,
  Button,
  ConfirmDialog,
  Drawer,
  Progress,
  useToast,
} from '@/components/ui';
import { Sparkline } from '@/components/charts';
import { actions, useStore } from '@/store';
import { cn } from '@/lib/cn';
import { date, money, num, phone as fmtPhone, relativeTime, signed } from '@/lib/format';
import type { Owner } from '@/types/domain';
import { PlanBadge, SubscriptionStatusBadge } from '@/features/shared/status';

interface VendorDrawerProps {
  vendorId: string | null;
  onClose: () => void;
  onEdit: (vendor: Owner) => void;
  onManageSubscription: (vendorId: string) => void;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <span className="text-[12px] font-medium text-muted">{label}</span>
      <span className="tnum text-[13px] font-semibold text-fg">{value}</span>
    </div>
  );
}

/**
 * Vendor detail. A drawer rather than a route because the admin's task is
 * comparative — check one shop, close, check the next — and a full navigation
 * would throw away the list's filters and scroll position each time.
 *
 * It reads the vendor from the store by id (not from a passed object) so it
 * re-renders the moment a lock or plan change lands.
 */
export function VendorDrawer({
  vendorId,
  onClose,
  onEdit,
  onManageSubscription,
}: VendorDrawerProps) {
  const { owners, subscriptions, customers } = useStore();
  const navigate = useNavigate();
  const toast = useToast();
  const [confirmLock, setConfirmLock] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const vendor = owners.find((o) => o.id === vendorId) ?? null;
  const subscription = subscriptions.find((s) => s.ownerId === vendorId) ?? null;
  const vendorCustomers = customers.filter((c) => c.vendorId === vendorId);

  if (!vendor) return null;

  const seatsLeft = vendor.deviceLimit - vendor.devicesUsed;

  return (
    <>
      <Drawer
        open={!!vendor}
        onClose={onClose}
        width="lg"
        title={vendor.businessName}
        subtitle={`${vendor.ownerName} · ${vendor.city}`}
        footer={
          <>
            <Button
              variant={vendor.locked ? 'primary' : 'outline-danger'}
              leadingIcon={vendor.locked ? <LockOpen className="size-4" /> : <Lock className="size-4" />}
              onClick={() => setConfirmLock(true)}
            >
              {vendor.locked ? 'Unblock vendor' : 'Block vendor'}
            </Button>
            <Button
              variant="secondary"
              leadingIcon={<Pencil className="size-4" />}
              onClick={() => onEdit(vendor)}
            >
              Edit
            </Button>
            <Button
              variant="ghost"
              className="ml-auto text-danger"
              leadingIcon={<Trash2 className="size-4" />}
              onClick={() => setConfirmDelete(true)}
            >
              Delete
            </Button>
          </>
        }
      >
        <div className="space-y-5 p-5">
          <div className="flex items-center gap-3.5">
            <Avatar name={vendor.businessName} size="xl" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <PlanBadge plan={vendor.plan} />
                {vendor.locked ? (
                  <Badge tone="danger" dot size="sm">
                    Blocked
                  </Badge>
                ) : (
                  <Badge tone="success" dot pulse size="sm">
                    Active
                  </Badge>
                )}
              </div>
              <p className="mt-1.5 text-[12px] text-muted">
                Joined {date(vendor.joinedAt)} · last seen {relativeTime(vendor.lastLoginAt)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              ['Customers', num(vendor.customers)],
              ['New this month', `+${num(vendor.customersAdded)}`],
              ['Pays us', vendor.monthlyFee ? `${money(vendor.monthlyFee)}/mo` : 'Free'],
            ].map(([label, value], i) => (
              <div
                key={label}
                style={{ '--i': i } as React.CSSProperties}
                className="stagger-item rounded-xl border border-border bg-surface-2 p-3"
              >
                <p className="text-[10px] font-semibold uppercase tracking-wide text-subtle">
                  {label}
                </p>
                <p className="tnum mt-1 text-base font-extrabold text-fg">{value}</p>
              </div>
            ))}
          </div>

          <section>
            <h3 className="mb-2 text-[13px] font-bold text-fg">Customer base · recent trend</h3>
            <Sparkline
              values={vendor.customersTrend}
              tone={vendor.growthPct >= 0 ? 'primary' : 'danger'}
              height={56}
              ariaLabel={`${vendor.businessName} customer count trend`}
            />
          </section>

          <section className="rounded-xl border border-border">
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
              <h3 className="text-[13px] font-bold text-fg">Subscription</h3>
              {subscription && <SubscriptionStatusBadge status={subscription.status} />}
            </div>
            <div className="divide-y divide-border px-4 py-1">
              <Row label="Plan" value={vendor.plan} />
              <Row label="Monthly fee" value={vendor.monthlyFee ? money(vendor.monthlyFee) : 'Free'} />
              <Row label="Renews" value={subscription ? date(subscription.renewsAt) : '—'} />
              <Row label="Auto-renew" value={subscription?.autoRenew ? 'On' : 'Off'} />
              <Row label="Outstanding dues" value={money(vendor.outstanding)} />
            </div>
            <div className="border-t border-border p-3">
              <Button
                fullWidth
                variant="soft"
                leadingIcon={<CreditCard className="size-4" />}
                onClick={() => onManageSubscription(vendor.id)}
              >
                Manage subscription
              </Button>
            </div>
          </section>

          <section className="rounded-xl border border-border p-4">
            <div className="mb-2.5 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-[13px] font-bold text-fg">
                <Smartphone className="size-4 text-subtle" />
                Device seats
              </h3>
              <span className="tnum text-[13px] font-bold text-fg">
                {vendor.devicesUsed} / {vendor.deviceLimit}
              </span>
            </div>
            <Progress
              value={vendor.devicesUsed}
              max={vendor.deviceLimit}
              tone="auto"
              size="md"
              label="Device seats in use"
            />
            <p className="mt-2 text-[11px] text-muted">
              {seatsLeft <= 0
                ? 'All seats are in use — a new device needs a plan upgrade.'
                : `${seatsLeft} seat${seatsLeft > 1 ? 's' : ''} still available on ${vendor.plan}.`}
            </p>
          </section>

          <section className="rounded-xl border border-border">
            <h3 className="border-b border-border px-4 py-2.5 text-[13px] font-bold text-fg">
              Contact
            </h3>
            <div className="space-y-2.5 p-4">
              <p className="flex items-center gap-2.5 text-[13px] text-fg">
                <Phone className="size-4 shrink-0 text-subtle" />
                {fmtPhone(vendor.phone)}
              </p>
              <p className="flex items-center gap-2.5 text-[13px] text-fg">
                <Mail className="size-4 shrink-0 text-subtle" />
                {vendor.email ?? <span className="text-subtle">No email on file</span>}
              </p>
              <p className="flex items-center gap-2.5 text-[13px] text-fg">
                <MapPin className="size-4 shrink-0 text-subtle" />
                {vendor.city} · {vendor.area}
              </p>
            </div>
          </section>

          {/* The vendor's own customer base — the number the platform cares
              about — listed rather than merely counted. */}
          <section className="rounded-xl border border-border">
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
              <h3 className="flex items-center gap-2 text-[13px] font-bold text-fg">
                <UsersRound className="size-4 text-subtle" />
                Customers ({vendorCustomers.length})
              </h3>
              <span
                className={cn(
                  'tnum rounded-full px-2 py-0.5 text-[11px] font-bold',
                  vendor.growthPct >= 0
                    ? 'bg-success-soft text-success'
                    : 'bg-danger-soft text-danger',
                )}
              >
                {signed(vendor.growthPct)} this month
              </span>
            </div>

            {vendorCustomers.length === 0 ? (
              <p className="px-4 py-6 text-center text-[12px] text-muted">
                No customers on record for this shop yet.
              </p>
            ) : (
              <ul className="max-h-64 divide-y divide-border overflow-y-auto">
                {vendorCustomers.map((customer) => (
                  <li key={customer.id} className="flex items-center gap-3 px-4 py-2.5">
                    <Avatar name={customer.name} size="xs" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-fg">
                        {customer.name}
                      </span>
                      <span className="block truncate text-[11px] text-muted">
                        {customer.area} · {customer.dailyCups} cups/day
                      </span>
                    </span>
                    {customer.blocked ? (
                      <Badge tone="danger" size="sm">
                        Blocked
                      </Badge>
                    ) : (
                      <span className="tnum shrink-0 text-[12px] text-muted">
                        {customer.outstanding > 0 ? money(customer.outstanding) : 'Settled'}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}

            <div className="border-t border-border p-3">
              <Button
                fullWidth
                variant="secondary"
                leadingIcon={<UsersRound className="size-4" />}
                onClick={() => navigate(`/customers?vendor=${vendor.id}`)}
              >
                Manage these customers
              </Button>
            </div>
          </section>
        </div>
      </Drawer>

      <ConfirmDialog
        open={confirmLock}
        onClose={() => setConfirmLock(false)}
        tone={vendor.locked ? 'primary' : 'danger'}
        title={vendor.locked ? 'Unblock this vendor?' : 'Block this vendor?'}
        confirmLabel={vendor.locked ? 'Unblock vendor' : 'Block vendor'}
        description={
          vendor.locked ? (
            <>
              <strong className="text-fg">{vendor.businessName}</strong> will be able to bill again,
              its operator can sign in, and the subscription returns to active.
            </>
          ) : (
            <>
              <strong className="text-fg">{vendor.businessName}</strong> will stop billing
              immediately, its operator login is blocked, and the subscription is marked past due.{' '}
              {num(vendor.customers)} customers are attached to this shop.
            </>
          )
        }
        onConfirm={() => {
          actions.setVendorLocked(vendor.id, !vendor.locked);
          toast[vendor.locked ? 'success' : 'error'](
            vendor.locked ? 'Vendor unblocked' : 'Vendor blocked',
            vendor.businessName,
          );
        }}
      />

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete this vendor?"
        confirmLabel="Delete vendor"
        description={
          <>
            This removes <strong className="text-fg">{vendor.businessName}</strong> along with its
            subscription and device seats. This cannot be undone.
          </>
        }
        onConfirm={() => {
          actions.deleteVendor(vendor.id);
          toast.error('Vendor deleted', vendor.businessName);
          onClose();
        }}
      />
    </>
  );
}
