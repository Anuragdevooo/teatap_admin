import { useState } from 'react';
import { Bell, Check, Moon, Palette, Save, ShieldCheck, Sun, UserCog } from 'lucide-react';
import { PageHeader } from '@/components/layout';
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Field,
  Input,
  Select,
  Switch,
  Tabs,
  useToast,
} from '@/components/ui';
import { useTheme } from '@/app/ThemeProvider';
import { cn } from '@/lib/cn';

type Section = 'profile' | 'appearance' | 'notifications' | 'security';

export function SettingsPage() {
  const [section, setSection] = useState<Section>('profile');
  const { theme, set } = useTheme();
  const toast = useToast();

  const [prefs, setPrefs] = useState({
    weeklyDigest: true,
    lockAlerts: true,
    supportEscalations: true,
    productUpdates: false,
    twoFactor: true,
    sessionTimeout: '30',
  });

  const save = () => toast.success('Settings saved', 'Preview only — nothing was persisted.');

  return (
    <>
      <PageHeader
        title="Settings"
        description="Your admin profile, console appearance and alerting preferences."
        below={
          <Tabs
            items={[
              { value: 'profile', label: 'Profile', icon: <UserCog className="size-4" /> },
              { value: 'appearance', label: 'Appearance', icon: <Palette className="size-4" /> },
              { value: 'notifications', label: 'Alerts', icon: <Bell className="size-4" /> },
              { value: 'security', label: 'Security', icon: <ShieldCheck className="size-4" /> },
            ]}
            value={section}
            onChange={setSection}
          />
        }
      />

      {section === 'profile' && (
        <Card className="max-w-3xl">
          <CardHeader title="Admin profile" description="How you appear across the console." />
          <CardBody className="space-y-5">
            <div className="flex items-center gap-4">
              <Avatar name="Teatap Admin" size="xl" />
              <div>
                <Button variant="secondary" size="sm">
                  Change photo
                </Button>
                <p className="mt-1.5 text-[11px] text-muted">PNG or JPG, at least 200×200.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Full name" htmlFor="s-name">
                <Input id="s-name" defaultValue="Teatap Admin" />
              </Field>
              <Field label="Email" htmlFor="s-email">
                <Input id="s-email" type="email" defaultValue="admin.teatap@gmail.com" />
              </Field>
              <Field label="Phone" htmlFor="s-phone">
                <Input id="s-phone" defaultValue="9876543210" />
              </Field>
              <Field label="Timezone" htmlFor="s-tz">
                <Select
                  id="s-tz"
                  defaultValue="IST"
                  options={[
                    { value: 'IST', label: 'India Standard Time (GMT+5:30)' },
                    { value: 'UTC', label: 'Coordinated Universal Time' },
                  ]}
                />
              </Field>
            </div>
          </CardBody>
          <CardFooter>
            <p className="text-[12px] text-muted">Changes apply to this console only.</p>
            <Button variant="primary" leadingIcon={<Save className="size-4" />} onClick={save}>
              Save changes
            </Button>
          </CardFooter>
        </Card>
      )}

      {section === 'appearance' && (
        <Card className="max-w-3xl">
          <CardHeader title="Appearance" description="Theme applies instantly and is remembered on this device." />
          <CardBody>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {(
                [
                  { value: 'light', label: 'Light', hint: 'Best in bright rooms', Icon: Sun },
                  { value: 'dark', label: 'Dark', hint: 'Easier at night', Icon: Moon },
                ] as const
              ).map(({ value, label, hint, Icon }) => (
                <button
                  key={value}
                  onClick={() => set(value)}
                  className={cn(
                    'flex items-center gap-3 rounded-xl border p-4 text-left transition-all',
                    theme === value
                      ? 'border-primary bg-primary-soft ring-4 ring-primary/12'
                      : 'border-border bg-surface-2 hover:border-border-strong',
                  )}
                >
                  <span
                    className={cn(
                      'grid size-10 shrink-0 place-items-center rounded-[10px]',
                      theme === value ? 'bg-primary text-primary-fg' : 'bg-surface-3 text-muted',
                    )}
                  >
                    <Icon className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-bold text-fg">{label}</span>
                    <span className="block text-[11px] text-muted">{hint}</span>
                  </span>
                  {theme === value && <Check className="size-4 shrink-0 text-primary" />}
                </button>
              ))}
            </div>

            <div className="mt-5 rounded-xl border border-border bg-surface-2 p-4">
              <p className="text-[13px] font-semibold text-fg">Chart palette</p>
              <p className="mt-1 text-[12px] leading-relaxed text-muted">
                The categorical series colours below are validated for colour-vision deficiency and
                for contrast against both surfaces. They re-step automatically with the theme.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <span key={n} className="flex items-center gap-2 rounded-lg border border-border bg-surface px-2.5 py-1.5">
                    <span
                      className="size-3.5 rounded"
                      style={{ background: `var(--chart-${n})` }}
                      aria-hidden
                    />
                    <span className="text-[11px] font-semibold text-muted">Series {n}</span>
                  </span>
                ))}
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {section === 'notifications' && (
        <Card className="max-w-3xl">
          <CardHeader title="What you get alerted about" description="Applies to email and in-console alerts." />
          <CardBody className="space-y-5">
            <Switch
              checked={prefs.lockAlerts}
              onChange={(v) => setPrefs({ ...prefs, lockAlerts: v })}
              label="Account locks"
              description="A tea shop is auto-locked for non-payment."
            />
            <Switch
              checked={prefs.supportEscalations}
              onChange={(v) => setPrefs({ ...prefs, supportEscalations: v })}
              label="Support escalations"
              description="A ticket is marked urgent or breaches its SLA."
            />
            <Switch
              checked={prefs.weeklyDigest}
              onChange={(v) => setPrefs({ ...prefs, weeklyDigest: v })}
              label="Weekly digest"
              description="Monday summary of revenue, churn and new tenants."
            />
            <Switch
              checked={prefs.productUpdates}
              onChange={(v) => setPrefs({ ...prefs, productUpdates: v })}
              label="Product updates"
              description="New Teatap features and release notes."
            />
          </CardBody>
          <CardFooter>
            <p className="text-[12px] text-muted">Critical security alerts cannot be disabled.</p>
            <Button variant="primary" onClick={save}>
              Save preferences
            </Button>
          </CardFooter>
        </Card>
      )}

      {section === 'security' && (
        <Card className="max-w-3xl">
          <CardHeader title="Security" description="Protect the account that can lock every tenant." />
          <CardBody className="space-y-5">
            <div className="flex items-start justify-between gap-4 rounded-xl border border-border bg-surface-2 p-4">
              <div>
                <p className="flex items-center gap-2 text-[13px] font-bold text-fg">
                  Two-factor authentication
                  {prefs.twoFactor && (
                    <Badge tone="success" size="sm">
                      On
                    </Badge>
                  )}
                </p>
                <p className="mt-1 text-[12px] leading-relaxed text-muted">
                  A one-time code is required in addition to your password at every sign-in.
                </p>
              </div>
              <Switch
                checked={prefs.twoFactor}
                onChange={(v) => setPrefs({ ...prefs, twoFactor: v })}
                label="Two-factor authentication"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Current password" htmlFor="s-pw">
                <Input id="s-pw" type="password" placeholder="••••••••" />
              </Field>
              <Field label="New password" htmlFor="s-pw2" hint="At least 12 characters.">
                <Input id="s-pw2" type="password" placeholder="••••••••" />
              </Field>
              <Field label="Auto sign-out" htmlFor="s-timeout" hint="Idle minutes before the session ends.">
                <Select
                  id="s-timeout"
                  value={prefs.sessionTimeout}
                  onChange={(e) => setPrefs({ ...prefs, sessionTimeout: e.target.value })}
                  options={[
                    { value: '15', label: '15 minutes' },
                    { value: '30', label: '30 minutes' },
                    { value: '60', label: '1 hour' },
                    { value: '480', label: '8 hours' },
                  ]}
                />
              </Field>
            </div>
          </CardBody>
          <CardFooter>
            <p className="text-[12px] text-muted">You will be signed out of other devices.</p>
            <Button variant="primary" onClick={save}>
              Update security
            </Button>
          </CardFooter>
        </Card>
      )}
    </>
  );
}
