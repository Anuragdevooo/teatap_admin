import { useMemo, useState } from 'react';
import {
  Bell,
  CircleAlert,
  IndianRupee,
  MessageSquare,
  Megaphone,
  Send,
  ShoppingBag,
  Settings2,
} from 'lucide-react';
import { PageHeader } from '@/components/layout';
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  Field,
  Input,
  Modal,
  Select,
  Tabs,
  Textarea,
  useToast,
} from '@/components/ui';
import { actions, useStore } from '@/store';
import { cn } from '@/lib/cn';
import { relativeTime } from '@/lib/format';
import type { NotificationItem, NotificationKind } from '@/types/domain';

const KIND_ICON: Record<NotificationKind, typeof Bell> = {
  system: Settings2,
  payment: IndianRupee,
  order: ShoppingBag,
  chat: MessageSquare,
  alert: CircleAlert,
};

const KIND_TONE: Record<NotificationKind, string> = {
  system: 'bg-surface-3 text-muted',
  payment: 'bg-success-soft text-success',
  order: 'bg-accent-soft text-accent-soft-fg',
  chat: 'bg-info-soft text-info',
  alert: 'bg-danger-soft text-danger',
};

const AUDIENCE_LABEL = {
  all: 'Everyone',
  admin: 'Admins',
  operator: 'Operators',
  customer: 'Customers',
} as const;

export function NotificationsPage() {
  const { notifications: items, loading } = useStore();
  const toast = useToast();
  const [audience, setAudience] = useState<keyof typeof AUDIENCE_LABEL | 'inbox'>('inbox');
  const [composing, setComposing] = useState(false);
  const [compose, setCompose] = useState<{
    title: string;
    body: string;
    kind: NotificationKind;
    audience: keyof typeof AUDIENCE_LABEL;
  }>({ title: '', body: '', kind: 'system', audience: 'all' });

  

  const filtered = useMemo(() => {
    if (audience === 'inbox') return items;
    return items.filter((n) => n.audience === audience);
  }, [items, audience]);

  const counts = useMemo(
    () => ({
      inbox: items.length,
      all: items.filter((n) => n.audience === 'all').length,
      operator: items.filter((n) => n.audience === 'operator').length,
      customer: items.filter((n) => n.audience === 'customer').length,
      admin: items.filter((n) => n.audience === 'admin').length,
    }),
    [items],
  );

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Everything the platform has broadcast, and what is queued to go out."
        actions={
          <Button
            variant="primary"
            leadingIcon={<Megaphone className="size-4" />}
            onClick={() => setComposing(true)}
          >
            New broadcast
          </Button>
        }
        below={
          <Tabs
            items={[
              { value: 'inbox', label: 'All', count: counts.inbox },
              { value: 'all', label: 'Broadcasts', count: counts.all },
              { value: 'operator', label: 'Operators', count: counts.operator },
              { value: 'customer', label: 'Customers', count: counts.customer },
              { value: 'admin', label: 'Admins', count: counts.admin },
            ]}
            value={audience}
            onChange={(value) => setAudience(value as typeof audience)}
          />
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="overflow-hidden lg:col-span-2">
          {loading && <p className="px-5 py-10 text-center text-[13px] text-muted">Loading…</p>}

          {!loading && filtered.length === 0 && (
            <EmptyState
              icon={<Bell />}
              title="Nothing sent to this audience yet"
              description="Broadcasts you publish will appear here with their delivery audience."
              action={
                <Button variant="secondary" onClick={() => setComposing(true)}>
                  Compose a broadcast
                </Button>
              }
            />
          )}

          <ul className="divide-y divide-border">
            {filtered.map((n: NotificationItem) => {
              const Icon = KIND_ICON[n.kind];
              return (
                <li
                  key={n.id}
                  className={cn(
                    'flex gap-3.5 px-5 py-4 transition-colors hover:bg-surface-2',
                    n.unread && 'bg-primary-soft/35',
                  )}
                >
                  <span className={cn('grid size-9 shrink-0 place-items-center rounded-[10px]', KIND_TONE[n.kind])}>
                    <Icon className="size-[18px]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-[13px] font-bold text-fg">{n.title}</h3>
                      {n.unread && (
                        <Badge tone="brand" size="sm">
                          New
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-[13px] leading-relaxed text-muted">{n.body}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-subtle">
                      <span>{relativeTime(n.at)}</span>
                      <span aria-hidden>·</span>
                      <span>To {AUDIENCE_LABEL[n.audience]}</span>
                      {n.unread && (
                        <button
                          onClick={() => actions.markNotificationRead(n.id)}
                          className="font-semibold text-primary hover:underline"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card className="h-fit">
          <CardHeader
            title="Delivery guidance"
            description="How these reach people."
            icon={<Send />}
          />
          <CardBody className="space-y-3.5 text-[13px] leading-relaxed text-muted">
            <p>
              <span className="font-semibold text-fg">Broadcasts</span> go to every signed-in device
              of the chosen audience, plus the in-app inbox.
            </p>
            <p>
              <span className="font-semibold text-fg">Alerts</span> are admin-only and are never
              pushed to customers — use them for operational states like locked accounts.
            </p>
            <p>
              Customers see notifications in the Teatap app; operators also see them on the
              dashboard header.
            </p>
          </CardBody>
        </Card>
      </div>

      <Modal
        open={composing}
        onClose={() => setComposing(false)}
        title="New broadcast"
        description="This will be delivered immediately to the selected audience."
        footer={
          <>
            <Button variant="ghost" onClick={() => setComposing(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              leadingIcon={<Send className="size-4" />}
              onClick={() => {
                if (!compose.title.trim() || !compose.body.trim()) {
                  toast.error('Missing details', 'A title and a message are both required.');
                  return;
                }
                actions.publishNotification({
                  title: compose.title.trim(),
                  body: compose.body.trim(),
                  kind: compose.kind,
                  audience: compose.audience,
                });
                setCompose({ title: '', body: '', kind: 'system', audience: 'all' });
                setComposing(false);
                toast.success('Broadcast sent', `Delivered to ${AUDIENCE_LABEL[compose.audience]}.`);
              }}
            >
              Send now
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Title" required htmlFor="n-title">
            <Input
              id="n-title"
              data-autofocus
              value={compose.title}
              onChange={(e) => setCompose({ ...compose, title: e.target.value })}
              placeholder="e.g. August billing cycle opened"
            />
          </Field>
          <Field
            label="Message"
            required
            htmlFor="n-body"
            hint="Keep it under two lines — it appears in a push notification."
          >
            <Textarea
              id="n-body"
              rows={3}
              value={compose.body}
              onChange={(e) => setCompose({ ...compose, body: e.target.value })}
              placeholder="Invoices for all customers were generated automatically."
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Audience" htmlFor="n-aud">
              <Select
                id="n-aud"
                value={compose.audience}
                onChange={(e) =>
                  setCompose({ ...compose, audience: e.target.value as typeof compose.audience })
                }
                options={[
                  { value: 'all', label: 'Everyone' },
                  { value: 'operator', label: 'Vendors' },
                  { value: 'customer', label: 'Customers' },
                  { value: 'admin', label: 'Admins' },
                ]}
              />
            </Field>
            <Field label="Type" htmlFor="n-kind">
              <Select
                id="n-kind"
                value={compose.kind}
                onChange={(e) =>
                  setCompose({ ...compose, kind: e.target.value as NotificationKind })
                }
                options={[
                  { value: 'system', label: 'System' },
                  { value: 'payment', label: 'Payment' },
                  { value: 'order', label: 'Order' },
                  { value: 'alert', label: 'Alert' },
                ]}
              />
            </Field>
          </div>

          {/* Live preview of the card the recipient will actually see. */}
          <div className="rounded-xl border border-border bg-surface-2 p-3.5">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-subtle">
              Preview
            </p>
            <div className="flex gap-3">
              <span className={cn('grid size-9 shrink-0 place-items-center rounded-[10px]', KIND_TONE[compose.kind])}>
                {(() => {
                  const Icon = KIND_ICON[compose.kind];
                  return <Icon className="size-[18px]" />;
                })()}
              </span>
              <div className="min-w-0">
                <p className="text-[13px] font-bold text-fg">
                  {compose.title || 'Notification title'}
                </p>
                <p className="mt-0.5 text-[12px] leading-relaxed text-muted">
                  {compose.body || 'Your message will appear here.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
