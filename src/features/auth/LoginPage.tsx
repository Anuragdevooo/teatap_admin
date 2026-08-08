import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, KeyRound, Moon, ShieldCheck, Sun } from 'lucide-react';
import { Brand } from '@/components/layout';
import { Button, Field, IconButton, Input } from '@/components/ui';
import { useTheme } from '@/app/ThemeProvider';

/**
 * Sign-in is a route outside the shell — there is no sidebar to show and no
 * data to load, so it owns the whole viewport.
 *
 * This is a UI preview: no credentials are checked and nothing is sent.
 */
export function LoginPage() {
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const [submitting, setSubmitting] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    window.setTimeout(() => navigate('/'), 550);
  };

  return (
    <div className="grid min-h-full lg:grid-cols-2">
      {/* Form column — first in the DOM so keyboard and mobile hit it first. */}
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <div className="flex items-center justify-between">
          <Brand />
          <IconButton
            label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            icon={theme === 'dark' ? <Sun /> : <Moon />}
            onClick={toggle}
          />
        </div>

        <div className="flex flex-1 items-center">
          <form onSubmit={submit} className="mx-auto w-full max-w-sm py-10">
            <h1 className="text-2xl font-extrabold tracking-tight text-fg">Sign in</h1>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
              Admin access to every tea shop on Teatap.
            </p>

            <div className="mt-7 space-y-4">
              <Field label="Admin email" htmlFor="l-key" required>
                <Input
                  id="l-key"
                  size="lg"
                  placeholder="admin.teatap@gmail.com"
                  leadingIcon={<KeyRound />}
                  autoComplete="username"
                  defaultValue="admin.teatap@gmail.com"
                  data-autofocus
                />
              </Field>

              <Field
                label="One-time code"
                htmlFor="l-otp"
                required
                hint="Sent to the phone registered against this key."
              >
                <Input
                  id="l-otp"
                  size="lg"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="6-digit code"
                  className="tnum tracking-[0.35em]"
                  defaultValue="123456"
                  autoComplete="one-time-code"
                />
              </Field>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              className="mt-6"
              loading={submitting}
              trailingIcon={<ArrowRight className="size-4" />}
            >
              Continue to console
            </Button>

            <p className="mt-5 flex items-start gap-2 rounded-xl border border-border bg-surface-2 p-3 text-[12px] leading-relaxed text-muted">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
              UI preview build — the form is pre-filled and no credentials are verified or sent
              anywhere.
            </p>
          </form>
        </div>

        <p className="text-[11px] text-subtle">© 2026 Teatap · Tea management system</p>
      </div>

      {/* Brand column — decorative, so it is hidden from assistive tech. */}
      <div
        aria-hidden
        className="relative hidden overflow-hidden border-l border-border bg-surface-2 lg:block"
      >
        <div className="surface-grid absolute inset-0 opacity-60" />
        <div className="absolute -right-24 -top-24 size-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 size-96 rounded-full bg-accent/10 blur-3xl" />

        <div className="relative flex h-full flex-col justify-center px-14">
          <img
            src="/brand/teatap-logo.png"
            alt=""
            className="w-40 rounded-2xl shadow-lg ring-1 ring-border"
          />
          <h2 className="mt-8 max-w-md text-3xl font-extrabold leading-tight tracking-tight text-fg">
            Every cutting chai on the route, accounted for.
          </h2>
          <p className="mt-3 max-w-md text-[15px] leading-relaxed text-muted">
            Tenants, subscriptions, device seats and daily collection — one console for the whole
            Teatap network.
          </p>

          <dl className="mt-10 grid max-w-md grid-cols-3 gap-6">
            {[
              ['48', 'Tea shops'],
              ['5.2k', 'Customers'],
              ['₹6L', 'Monthly volume'],
            ].map(([value, label]) => (
              <div key={label}>
                <dt className="tnum text-2xl font-extrabold tracking-tight text-fg">{value}</dt>
                <dd className="mt-0.5 text-[12px] font-medium text-muted">{label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
