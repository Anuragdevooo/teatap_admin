import { useEffect, useState } from 'react';
import { Check, Copy, Eye, EyeOff, KeyRound, Mail, Shuffle } from 'lucide-react';
import {
  Button,
  Field,
  IconButton,
  Input,
  Modal,
  Tabs,
  useToast,
} from '@/components/ui';
import { cn } from '@/lib/cn';
import { generatePassword, passwordStrength, STRENGTH_LABEL } from '@/lib/password';

export interface ResetTarget {
  id: string;
  name: string;
  /** Where a reset link would be sent — email if present, else phone. */
  contact: string;
  kind: 'vendor' | 'customer' | 'user';
}

interface ResetPasswordModalProps {
  target: ResetTarget | null;
  onClose: () => void;
}

const STRENGTH_TONE = {
  weak: 'bg-danger',
  fair: 'bg-warning',
  strong: 'bg-success',
} as const;

const STRENGTH_WIDTH = { weak: '33%', fair: '66%', strong: '100%' } as const;

/**
 * Two ways to reset, in one place.
 *
 * Sending a link is the safe default — the admin never learns the password.
 * But a vendor standing at a counter with no working email needs one set for
 * them right now, and pretending that case doesn't exist just pushes it into a
 * support call. Both are offered explicitly, so the choice is deliberate.
 */
export function ResetPasswordModal({ target, onClose }: ResetPasswordModalProps) {
  const toast = useToast();
  const [mode, setMode] = useState<'link' | 'set'>('link');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [reveal, setReveal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!target) return;
    setMode('link');
    setPassword('');
    setConfirm('');
    setReveal(false);
    setCopied(false);
    setError(null);
  }, [target]);

  if (!target) return null;

  const strength = passwordStrength(password);

  const sendLink = () => {
    toast.success('Reset link sent', `${target.contact} will receive a one-time link.`);
    onClose();
  };

  const setNow = () => {
    if (password.length < 8) {
      setError('Use at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('The two passwords do not match.');
      return;
    }
    toast.success(
      'Password reset',
      `${target.name} can sign in with the new password. Share it securely.`,
    );
    onClose();
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error('Could not copy', 'Select the field and copy manually.');
    }
  };

  return (
    <Modal
      open={!!target}
      onClose={onClose}
      title="Reset password"
      description={`${target.name} · ${target.contact}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          {mode === 'link' ? (
            <Button variant="primary" leadingIcon={<Mail className="size-4" />} onClick={sendLink}>
              Send reset link
            </Button>
          ) : (
            <Button variant="primary" leadingIcon={<KeyRound className="size-4" />} onClick={setNow}>
              Set password
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-4">
        <Tabs
          variant="pill"
          items={[
            { value: 'link', label: 'Send a link' },
            { value: 'set', label: 'Set it myself' },
          ]}
          value={mode}
          onChange={(value) => {
            setMode(value as typeof mode);
            setError(null);
          }}
        />

        {mode === 'link' ? (
          <div className="rounded-xl border border-border bg-surface-2 p-4">
            <p className="flex items-start gap-2.5 text-[13px] leading-relaxed text-muted">
              <Mail className="mt-0.5 size-4 shrink-0 text-primary" />
              <span>
                A one-time link goes to <strong className="text-fg">{target.contact}</strong>. It
                expires in 30 minutes and can only be used once. You will never see the password —
                which is the point.
              </span>
            </p>
          </div>
        ) : (
          <>
            <Field label="New password" required htmlFor="rp-new" error={error ?? undefined}>
              <Input
                id="rp-new"
                data-autofocus
                type={reveal ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                placeholder="At least 8 characters"
                leadingIcon={<KeyRound />}
                invalid={!!error}
                trailing={
                  <span className="flex items-center gap-0.5">
                    <IconButton
                      label={reveal ? 'Hide password' : 'Show password'}
                      icon={reveal ? <EyeOff /> : <Eye />}
                      size="sm"
                      onClick={() => setReveal((v) => !v)}
                    />
                    <IconButton
                      label="Generate a password"
                      icon={<Shuffle />}
                      size="sm"
                      onClick={() => {
                        const next = generatePassword();
                        setPassword(next);
                        setConfirm(next);
                        setReveal(true);
                        setError(null);
                      }}
                    />
                    <IconButton
                      label="Copy password"
                      icon={copied ? <Check /> : <Copy />}
                      size="sm"
                      disabled={!password}
                      onClick={copy}
                    />
                  </span>
                }
              />
            </Field>

            {password && (
              <div className="flex items-center gap-2.5">
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3">
                  <span
                    className={cn('block h-full rounded-full transition-all duration-300', STRENGTH_TONE[strength])}
                    style={{ width: STRENGTH_WIDTH[strength] }}
                  />
                </span>
                <span
                  className={cn(
                    'shrink-0 text-[11px] font-bold',
                    strength === 'weak'
                      ? 'text-danger'
                      : strength === 'fair'
                        ? 'text-warning'
                        : 'text-success',
                  )}
                >
                  {STRENGTH_LABEL[strength]}
                </span>
              </div>
            )}

            <Field label="Confirm password" required htmlFor="rp-confirm">
              <Input
                id="rp-confirm"
                type={reveal ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => {
                  setConfirm(e.target.value);
                  setError(null);
                }}
                placeholder="Type it again"
                leadingIcon={<KeyRound />}
                invalid={!!error && password !== confirm}
              />
            </Field>

            <p className="rounded-xl border border-warning/30 bg-warning-soft px-4 py-3 text-[12px] leading-relaxed text-fg">
              Setting a password directly signs {target.name} out of every device. Share it over a
              channel you trust, and ask them to change it after signing in.
            </p>
          </>
        )}
      </div>
    </Modal>
  );
}
