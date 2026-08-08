import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import {
  ArrowLeft,
  Check,
  CheckCheck,
  Clock,
  MessageSquarePlus,
  Paperclip,
  Search,
  Send,
  Smile,
  Store,
  UserRound,
  X,
} from 'lucide-react';
import { PageHeader } from '@/components/layout';
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmojiPicker,
  EmptyState,
  IconButton,
  Input,
  Modal,
  SegmentedControl,
  Tooltip,
} from '@/components/ui';
import { actions, useStore } from '@/store';
import { cn } from '@/lib/cn';
import { useClickOutside } from '@/lib/hooks';
import { dateTime, relativeTime } from '@/lib/format';
import type { ChatMessage } from '@/types/domain';

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'operator', label: 'Vendors' },
  { value: 'customer', label: 'Customers' },
] as const;

const STATUS_ICON: Record<ChatMessage['status'], typeof Check> = {
  sending: Clock,
  sent: Check,
  delivered: CheckCheck,
  read: CheckCheck,
};

/**
 * Admin ↔ vendor/customer messaging.
 *
 * Two panes on desktop, one at a time on mobile — the list is a navigation
 * surface, so on a small screen it gets out of the way entirely once a
 * conversation is open rather than squeezing both into a split.
 */
export function ChatPage() {
  const { chatThreads, chatMessages, loading } = useStore();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['value']>('all');
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState('');
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [composing, setComposing] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const emojiRef = useClickOutside<HTMLDivElement>(() => setEmojiOpen(false));

  const threads = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return chatThreads
      .filter((t) => (filter === 'all' ? true : t.peerRole === filter))
      .filter(
        (t) =>
          !needle ||
          t.peerName.toLowerCase().includes(needle) ||
          t.lastMessage.toLowerCase().includes(needle),
      )
      .sort((a, b) => b.lastAt - a.lastAt);
  }, [chatThreads, filter, query]);

  // Open the newest conversation once data lands, so the pane is never blank
  // on a desktop layout that has room for it.
  useEffect(() => {
    if (!activeId && threads.length > 0 && window.innerWidth >= 1024) {
      setActiveId(threads[0].id);
    }
  }, [threads, activeId]);

  const active = chatThreads.find((t) => t.id === activeId) ?? null;

  const messages = useMemo(
    () => chatMessages.filter((m) => m.threadId === activeId).sort((a, b) => a.at - b.at),
    [chatMessages, activeId],
  );

  useEffect(() => {
    if (activeId) actions.markThreadRead(activeId);
  }, [activeId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, activeId]);

  const send = (e: FormEvent) => {
    e.preventDefault();
    if (!activeId || !draft.trim()) return;
    actions.sendChatMessage(activeId, draft);
    setDraft('');
    setEmojiOpen(false);
  };

  const totalUnread = chatThreads.reduce((sum, t) => sum + t.unread, 0);

  return (
    <>
      <PageHeader
        title="Chat"
        description="Talk to vendors and customers directly, without leaving the console."
        actions={
          <>
            {totalUnread > 0 && (
              <Badge tone="danger" dot pulse>
                {totalUnread} unread
              </Badge>
            )}
            <Button
              variant="secondary"
              leadingIcon={<MessageSquarePlus className="size-4" />}
              onClick={() => setComposing(true)}
            >
              New conversation
            </Button>
          </>
        }
      />

      <Card className="overflow-hidden">
        <div className="grid h-[min(70vh,640px)] grid-cols-1 lg:grid-cols-[320px_1fr]">
          {/* ── Thread list ───────────────────────────────────────────── */}
          <aside
            className={cn(
              'flex min-h-0 flex-col border-border lg:border-r',
              active && 'hidden lg:flex',
            )}
          >
            <div className="space-y-2.5 border-b border-border p-3">
              <Input
                size="sm"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search conversations…"
                leadingIcon={<Search />}
                aria-label="Search conversations"
              />
              <SegmentedControl
                options={FILTERS}
                value={filter}
                onChange={setFilter}
                ariaLabel="Filter conversations"
                className="w-full [&>button]:flex-1"
              />
            </div>

            <ul className="min-h-0 flex-1 overflow-y-auto">
              {loading && <li className="p-6 text-center text-[13px] text-muted">Loading…</li>}

              {!loading && threads.length === 0 && (
                <li className="p-6 text-center text-[13px] text-muted">
                  No conversations match that search.
                </li>
              )}

              {threads.map((thread, i) => {
                const isActive = thread.id === activeId;
                return (
                  <li key={thread.id} style={{ '--i': i } as React.CSSProperties} className="stagger-item">
                    <button
                      onClick={() => setActiveId(thread.id)}
                      className={cn(
                        'flex w-full items-start gap-3 border-l-2 px-3.5 py-3 text-left transition-colors',
                        isActive
                          ? 'border-primary bg-primary-soft'
                          : 'border-transparent hover:bg-surface-2',
                      )}
                    >
                      <Avatar
                        name={thread.peerName}
                        size="md"
                        status={thread.online ? 'online' : 'offline'}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className="truncate text-[13px] font-bold text-fg">
                            {thread.peerName}
                          </span>
                          <span className="shrink-0 text-[10px] text-subtle">
                            {relativeTime(thread.lastAt)}
                          </span>
                        </span>
                        <span className="mt-0.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-subtle">
                          {thread.peerRole === 'operator' ? (
                            <Store className="size-3" />
                          ) : (
                            <UserRound className="size-3" />
                          )}
                          {thread.context}
                        </span>
                        <span className="mt-1 flex items-center gap-2">
                          <span
                            className={cn(
                              'min-w-0 flex-1 truncate text-[12px]',
                              thread.unread > 0 ? 'font-semibold text-fg' : 'text-muted',
                            )}
                          >
                            {thread.lastMessage}
                          </span>
                          {thread.unread > 0 && (
                            <span className="tnum grid size-4.5 shrink-0 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-fg">
                              {thread.unread}
                            </span>
                          )}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>

          {/* ── Conversation ──────────────────────────────────────────── */}
          {active ? (
            <section className="flex min-h-0 flex-col">
              <header className="flex items-center gap-3 border-b border-border px-4 py-3">
                <IconButton
                  label="Back to conversations"
                  icon={<ArrowLeft />}
                  size="sm"
                  className="lg:hidden"
                  onClick={() => setActiveId(null)}
                />
                <Avatar
                  name={active.peerName}
                  size="sm"
                  status={active.online ? 'online' : 'offline'}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-bold text-fg">{active.peerName}</p>
                  <p className="truncate text-[11px] text-muted">
                    {active.online ? 'Online now' : `Last seen ${relativeTime(active.lastAt)}`} ·{' '}
                    {active.context}
                  </p>
                </div>
                <Badge tone={active.peerRole === 'operator' ? 'brand' : 'neutral'} size="sm">
                  {active.peerRole === 'operator' ? 'Vendor' : 'Customer'}
                </Badge>
              </header>

              <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto bg-surface-2/60 p-4">
                {messages.map((message) => {
                  const mine = message.sender === 'me';
                  const StatusIcon = STATUS_ICON[message.status];
                  return (
                    <div
                      key={message.id}
                      className={cn('flex animate-pop-in', mine ? 'justify-end' : 'justify-start')}
                    >
                      <div
                        className={cn(
                          'max-w-[78%] rounded-2xl px-3.5 py-2 shadow-xs',
                          mine
                            ? 'rounded-br-sm bg-primary text-primary-fg'
                            : 'rounded-bl-sm border border-border bg-surface text-fg',
                        )}
                      >
                        <p className="text-[13px] leading-relaxed">{message.text}</p>
                        <Tooltip label={dateTime(message.at)}>
                          <span
                            className={cn(
                              'mt-0.5 flex items-center justify-end gap-1 text-[10px]',
                              mine ? 'text-primary-fg/70' : 'text-subtle',
                            )}
                          >
                            {relativeTime(message.at)}
                            {mine && (
                              <StatusIcon
                                className={cn(
                                  'size-3',
                                  message.status === 'read' && 'text-info',
                                  message.status === 'sending' && 'animate-pulse',
                                )}
                              />
                            )}
                          </span>
                        </Tooltip>
                      </div>
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>

              <form onSubmit={send} className="border-t border-border p-3">
                {/* In normal flow, not a popover: the conversation card clips
                    its overflow, which cut an absolutely-positioned panel in
                    half. Expanding the composer can't be clipped. */}
                {emojiOpen && (
                  <div ref={emojiRef} className="mb-2.5 animate-pop-in">
                    <EmojiPicker
                      onClose={() => setEmojiOpen(false)}
                      onPick={(emoji) => {
                        setDraft((d) => d + emoji);
                        inputRef.current?.focus();
                      }}
                    />
                  </div>
                )}

                <div className="flex items-end gap-2">
                  {/* Hidden input, visible button — a bare file input can't be
                      styled to match the rest of the composer. */}
                  <input
                    ref={fileRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file || !activeId) return;
                      actions.sendChatMessage(
                        activeId,
                        `📎 ${file.name} · ${(file.size / 1024).toFixed(0)} KB`,
                      );
                      e.target.value = '';
                    }}
                  />
                  <IconButton
                    label="Attach a file"
                    icon={<Paperclip />}
                    variant="surface"
                    onClick={() => fileRef.current?.click()}
                  />
                  <IconButton
                    label="Insert an emoji"
                    icon={<Smile />}
                    variant={emojiOpen ? 'soft' : 'surface'}
                    onClick={() => setEmojiOpen((v) => !v)}
                  />

                  {/* min-w-0 flex-1 is what stops the field collapsing to its
                      intrinsic width and squeezing against the Send button. */}
                  <div className="min-w-0 flex-1">
                    <Input
                      ref={inputRef}
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder={`Message ${active.peerName}…`}
                      aria-label="Message"
                      autoComplete="off"
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    disabled={!draft.trim()}
                    leadingIcon={<Send className="size-4" />}
                  >
                    <span className="hidden sm:inline">Send</span>
                  </Button>
                </div>
              </form>
            </section>
          ) : (
            <section className="hidden place-content-center lg:grid">
              <EmptyState
                icon={<MessageSquarePlus />}
                title="Pick a conversation"
                description="Choose a vendor or customer on the left, or start a new conversation."
                action={
                  <Button variant="primary" onClick={() => setComposing(true)}>
                    New conversation
                  </Button>
                }
              />
            </section>
          )}
        </div>
      </Card>

      <NewConversationModal
        open={composing}
        onClose={() => setComposing(false)}
        onStarted={(threadId) => {
          setActiveId(threadId);
          setComposing(false);
        }}
      />
    </>
  );
}

/** Picks a vendor or customer and opens (or reuses) a thread with them. */
function NewConversationModal({
  open,
  onClose,
  onStarted,
}: {
  open: boolean;
  onClose: () => void;
  onStarted: (threadId: string) => void;
}) {
  const { owners, customers } = useStore();
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<'operator' | 'customer'>('operator');

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const pool =
      scope === 'operator'
        ? owners.map((o) => ({
            id: o.id,
            name: o.businessName,
            role: 'operator' as const,
            context: `${o.city} · ${o.plan}`,
          }))
        : customers.map((c) => ({
            id: c.id,
            name: c.name,
            role: 'customer' as const,
            context: `Customer · ${c.vendorName}`,
          }));

    return pool
      .filter((p) => !needle || p.name.toLowerCase().includes(needle) || p.context.toLowerCase().includes(needle))
      .slice(0, 40);
  }, [owners, customers, query, scope]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New conversation"
      description="Pick who you want to message."
      footer={
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
      }
    >
      <div className="space-y-3">
        <SegmentedControl
          options={[
            { value: 'operator', label: 'Vendors' },
            { value: 'customer', label: 'Customers' },
          ]}
          value={scope}
          onChange={setScope}
          size="md"
          ariaLabel="Who to message"
          className="w-full [&>button]:flex-1"
        />

        <Input
          data-autofocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={scope === 'operator' ? 'Search vendors…' : 'Search customers…'}
          leadingIcon={<Search />}
          aria-label="Search people"
        />

        <ul className="max-h-72 space-y-1 overflow-y-auto">
          {results.length === 0 && (
            <li className="py-8 text-center text-[13px] text-muted">Nobody matches “{query}”.</li>
          )}
          {results.map((person) => (
            <li key={person.id}>
              <button
                onClick={() => onStarted(actions.startChatThread(person))}
                className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-surface-3"
              >
                <Avatar name={person.name} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold text-fg">
                    {person.name}
                  </span>
                  <span className="block truncate text-[11px] text-muted">{person.context}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  );
}
