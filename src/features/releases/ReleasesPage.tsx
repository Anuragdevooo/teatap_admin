import { useMemo, useState } from 'react';
import {
  Check,
  CheckCircle2,
  Monitor,
  Plus,
  Rocket,
  ShieldAlert,
  Smartphone,
  Tag,
} from 'lucide-react';
import { PageHeader } from '@/components/layout';
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  ConfirmDialog,
  Field,
  Input,
  Modal,
  Progress,
  SegmentedControl,
  Select,
  Textarea,
  useToast,
} from '@/components/ui';
import { AnimatedNumber, StatTile } from '@/components/data';
import { actions, useStore } from '@/store';
import { cn } from '@/lib/cn';
import { date, num, percent, relativeTime } from '@/lib/format';
import type { Platform, Release } from '@/types/domain';

const PLATFORMS = [
  { value: 'all', label: 'All' },
  { value: 'Android', label: 'Android' },
  { value: 'iOS', label: 'iOS' },
  { value: 'Web', label: 'Web' },
] as const;

const STATUS_TONE = {
  Live: 'success',
  'Rolling out': 'info',
  Draft: 'neutral',
  Deprecated: 'warning',
} as const;


/**
 * App version control.
 *
 * The two decisions that matter here are *what is live* and *what is the
 * oldest build still allowed to sign in*. The second is the lever that gets a
 * stuck vendor off a broken version without anyone phoning support, so it is
 * surfaced as a first-class action rather than buried in an edit form.
 */
export function ReleasesPage() {
  const { releases, loading } = useStore();
  const toast = useToast();
  const [platform, setPlatform] = useState<(typeof PLATFORMS)[number]['value']>('all');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Release | null>(null);
  const [confirmMinimum, setConfirmMinimum] = useState<Release | null>(null);

  const visible = useMemo(
    () =>
      [...releases]
        .filter((r) => platform === 'all' || r.platforms.includes(platform))
        .sort((a, b) => b.build - a.build),
    [releases, platform],
  );

  const summary = useMemo(
    () => ({
      live: releases.filter((r) => r.status === 'Live').length,
      rolling: releases.filter((r) => r.status === 'Rolling out').length,
      deprecated: releases.filter((r) => r.status === 'Deprecated').length,
      onLatest: Math.round(
        releases
          .filter((r) => r.status === 'Live' || r.status === 'Rolling out')
          .reduce((sum, r) => sum + r.adoption, 0) /
          Math.max(1, releases.filter((r) => r.status === 'Live' || r.status === 'Rolling out').length),
      ),
    }),
    [releases],
  );

  return (
    <>
      <PageHeader
        title="Releases"
        description="Which build of the Teatap apps is live, and the oldest one still allowed to sign in."
        actions={
          <>
            <SegmentedControl
              options={PLATFORMS}
              value={platform}
              onChange={setPlatform}
              ariaLabel="Filter by platform"
            />
            <Button
              variant="primary"
              leadingIcon={<Plus className="size-4" />}
              onClick={() => setCreating(true)}
            >
              New release
            </Button>
          </>
        }
      />

      <section className="mb-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile
          index={0}
          label="Live builds"
          value={<AnimatedNumber value={summary.live} format={num} />}
          icon={<CheckCircle2 />}
          loading={loading}
          footer="Across all platforms"
        />
        <StatTile
          index={1}
          label="Rolling out"
          value={<AnimatedNumber value={summary.rolling} format={num} />}
          icon={<Rocket />}
          loading={loading}
          footer="Staged releases in flight"
        />
        <StatTile
          index={2}
          label="Average adoption"
          value={percent(summary.onLatest)}
          icon={<Tag />}
          loading={loading}
          footer="Users on a current build"
        />
        <StatTile
          index={3}
          label="Deprecated"
          value={<AnimatedNumber value={summary.deprecated} format={num} />}
          icon={<ShieldAlert />}
          loading={loading}
          footer="Blocked from signing in"
        />
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {visible.map((release, i) => {
          const Icon = release.platforms.includes('Web') ? Monitor : Smartphone;
          return (
            <Card
              key={release.id}
              style={{ '--i': i } as React.CSSProperties}
              className={cn(
                'stagger-item lift flex flex-col',
                release.isMinimumSupported && 'border-primary/50 ring-4 ring-primary/10',
              )}
            >
              <CardHeader
                icon={<Icon />}
                title={
                  <span className="flex flex-wrap items-center gap-2">
                    v{release.version}
                    <span className="tnum text-[11px] font-semibold text-subtle">
                      build {release.build}
                    </span>
                    {release.platforms.map((p) => (
                      <Badge key={p} tone="neutral" size="sm">
                        {p}
                      </Badge>
                    ))}
                  </span>
                }
                description={
                  release.status === 'Draft'
                    ? 'Not published yet'
                    : `Released ${date(release.releasedAt)} · ${relativeTime(release.releasedAt)}`
                }
                action={
                  <Badge tone={STATUS_TONE[release.status]} dot size="sm">
                    {release.status}
                  </Badge>
                }
              />

              <CardBody className="flex flex-1 flex-col gap-3.5">
                {release.status === 'Rolling out' && (
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-subtle">
                        Rollout
                      </span>
                      <span className="tnum text-[12px] font-bold text-fg">{release.rollout}%</span>
                    </div>
                    <Progress value={release.rollout} tone="primary" size="md" label="Rollout" />
                  </div>
                )}

                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-subtle">
                      Adoption
                    </span>
                    <span className="tnum text-[12px] font-bold text-fg">{release.adoption}%</span>
                  </div>
                  <Progress value={release.adoption} tone="success" size="md" label="Adoption" />
                </div>

                <ul className="flex-1 space-y-1">
                  {release.notes.map((note) => (
                    <li key={note} className="flex items-start gap-1.5 text-[12px] text-muted">
                      <span className="mt-1.5 size-1 shrink-0 rounded-full bg-subtle" />
                      {note}
                    </li>
                  ))}
                </ul>

                {release.isMinimumSupported && (
                  <p className="flex items-center gap-2 rounded-lg bg-primary-soft px-2.5 py-1.5 text-[11px] font-semibold text-primary-soft-fg">
                    <ShieldAlert className="size-3.5 shrink-0" />
                    Minimum supported build on {release.platforms.join(' and ')}
                  </p>
                )}

                <div className="flex gap-2 border-t border-border pt-3">
                  <Button size="sm" variant="secondary" onClick={() => setEditing(release)}>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={release.isMinimumSupported || release.status === 'Draft'}
                    onClick={() => setConfirmMinimum(release)}
                  >
                    Set as minimum
                  </Button>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      <ReleaseModal
        open={creating || !!editing}
        release={editing}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
      />

      <ConfirmDialog
        open={!!confirmMinimum}
        onClose={() => setConfirmMinimum(null)}
        tone="danger"
        title="Force an update below this build?"
        confirmLabel="Set as minimum"
        description={
          <>
            Anyone on {confirmMinimum?.platforms.join(' or ')} running older than{' '}
            <strong className="text-fg">{confirmMinimum?.version}</strong> will be blocked from
            signing in until they update. Use this only when the older build is genuinely broken.
          </>
        }
        onConfirm={() => {
          if (!confirmMinimum) return;
          actions.setMinimumSupported(confirmMinimum.id);
          toast.success(
            'Minimum build set',
            `${confirmMinimum.platforms.join(' + ')} · ${confirmMinimum.version}`,
          );
        }}
      />
    </>
  );
}

function ReleaseModal({
  open,
  release,
  onClose,
}: {
  open: boolean;
  release: Release | null;
  onClose: () => void;
}) {
  const toast = useToast();
  const editing = !!release;

  const [form, setForm] = useState({
    platforms: ['Android', 'iOS'] as Platform[],
    version: '',
    build: '',
    status: 'Draft' as Release['status'],
    rollout: '0',
    notes: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [platformError, setPlatformError] = useState<string | null>(null);

  // Seed the form whenever the modal opens, so edit and create share it.
  const seedKey = `${open}-${release?.id ?? 'new'}`;
  const [seeded, setSeeded] = useState('');
  if (open && seeded !== seedKey) {
    setSeeded(seedKey);
    setError(null);
    setPlatformError(null);
    setForm(
      release
        ? {
            platforms: release.platforms,
            version: release.version,
            build: String(release.build),
            status: release.status,
            rollout: String(release.rollout),
            notes: release.notes.join('\n'),
          }
        : {
            platforms: ['Android', 'iOS'],
            version: '',
            build: '',
            status: 'Draft',
            rollout: '0',
            notes: '',
          },
    );
  }

  const save = () => {
    if (!/^\d+\.\d+\.\d+$/.test(form.version.trim())) {
      setError('Use a semantic version like 2.6.0.');
      return;
    }
    const payload = {
      platforms: form.platforms,
      version: form.version.trim(),
      build: Number(form.build) || 0,
      status: form.status,
      rollout: Math.min(100, Math.max(0, Number(form.rollout) || 0)),
      notes: form.notes.split('\n').map((n) => n.trim()).filter(Boolean),
    };

    if (editing && release) {
      actions.updateRelease(release.id, payload);
      toast.success('Release updated', `${payload.version} · ${payload.platforms.join(' + ')}`);
    } else {
      actions.createRelease(payload);
      toast.success('Release published', `${payload.version} · ${payload.platforms.join(' + ')}`);
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Edit release' : 'New release'}
      description={
        editing ? 'Changes apply to what the apps report immediately.' : 'Publish a new app build.'
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save}>
            {editing ? 'Save release' : 'Publish release'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Multi-select, not a dropdown: one version normally ships to Android
            and iOS together, and forcing two entries makes them drift. */}
        <Field label="Platforms" required error={platformError ?? undefined}>
          <div className="flex flex-wrap gap-2">
            {(['Android', 'iOS', 'Web'] as Platform[]).map((p) => {
              const on = form.platforms.includes(p);
              const PIcon = p === 'Web' ? Monitor : Smartphone;
              return (
                <button
                  key={p}
                  type="button"
                  aria-pressed={on}
                  onClick={() =>
                    setForm({
                      ...form,
                      platforms: on
                        ? form.platforms.filter((x) => x !== p)
                        : [...form.platforms, p],
                    })
                  }
                  className={cn(
                    'inline-flex items-center gap-2 rounded-field border px-3 py-2 text-[13px] font-semibold transition-all',
                    on
                      ? 'border-primary bg-primary-soft text-primary-soft-fg ring-4 ring-primary/12'
                      : 'border-border bg-surface text-muted hover:border-border-strong hover:text-fg',
                  )}
                >
                  <PIcon className="size-4" />
                  {p}
                  {on && <Check className="size-3.5" />}
                </button>
              );
            })}
          </div>
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Version" required htmlFor="r-version" error={error ?? undefined}>
            <Input
              id="r-version"
              data-autofocus
              value={form.version}
              onChange={(e) => {
                setForm({ ...form, version: e.target.value });
                setError(null);
              }}
              placeholder="2.6.0"
              invalid={!!error}
            />
          </Field>
          <Field label="Build" htmlFor="r-build">
            <Input
              id="r-build"
              type="number"
              min={0}
              value={form.build}
              onChange={(e) => setForm({ ...form, build: e.target.value })}
              placeholder="260"
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Status" htmlFor="r-status">
            <Select
              id="r-status"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as Release['status'] })}
              options={[
                { value: 'Draft', label: 'Draft' },
                { value: 'Rolling out', label: 'Rolling out' },
                { value: 'Live', label: 'Live' },
                { value: 'Deprecated', label: 'Deprecated' },
              ]}
            />
          </Field>
          <Field
            label="Rollout %"
            htmlFor="r-rollout"
            hint="Only meaningful while rolling out."
          >
            <Input
              id="r-rollout"
              type="number"
              min={0}
              max={100}
              value={form.rollout}
              onChange={(e) => setForm({ ...form, rollout: e.target.value })}
            />
          </Field>
        </div>

        <Field label="Release notes" htmlFor="r-notes" hint="One line per change.">
          <Textarea
            id="r-notes"
            rows={5}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder={'Chat with the platform admin\nFaster customer search'}
          />
        </Field>
      </div>
    </Modal>
  );
}
