import { useEffect, useState } from 'react';
import { Mail, MapPin, Phone, User } from 'lucide-react';
import { Button, Field, Input, Modal, Select, useToast } from '@/components/ui';
import { actions } from '@/store';
import type { AdminUser, Role } from '@/types/domain';

interface UserFormModalProps {
  open: boolean;
  onClose: () => void;
  user: AdminUser | null;
}

const CITIES = ['Pune', 'Mumbai', 'Nagpur', 'Nashik', 'Surat', 'Indore', 'Hyderabad'];

/**
 * Edit form for a platform account.
 *
 * Role sits here rather than behind a separate menu item because changing what
 * someone *is* and changing their details are the same task in practice — and
 * a role change deserves the same deliberate save as everything else.
 */
export function UserFormModal({ open, onClose, user }: UserFormModalProps) {
  const toast = useToast();
  const [form, setForm] = useState({ name: '', email: '', phone: '', city: 'Pune', role: 'customer' as Role });
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  useEffect(() => {
    if (!open || !user) return;
    setErrors({});
    setForm({
      name: user.name,
      email: user.email ?? '',
      phone: user.phone,
      city: user.city,
      role: user.role,
    });
  }, [open, user]);

  if (!user) return null;

  const submit = () => {
    const next: Record<string, string | undefined> = {};
    if (form.name.trim().length < 3) next.name = 'Enter the full name.';
    if (!/^\d{10}$/.test(form.phone.replace(/\D/g, ''))) next.phone = 'A 10-digit mobile number is required.';
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'That does not look like an email address.';
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;

    actions.updateUser(user.id, {
      name: form.name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.replace(/\D/g, ''),
      city: form.city,
    });
    if (form.role !== user.role) actions.setUserRole(user.id, form.role);

    toast.success('User updated', form.name.trim());
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit user"
      description={`${user.role[0].toUpperCase() + user.role.slice(1)} account`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit}>
            Save changes
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Full name" required htmlFor="u-name" error={errors.name}>
          <Input
            id="u-name"
            data-autofocus
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            leadingIcon={<User />}
            invalid={!!errors.name}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Phone" required htmlFor="u-phone" error={errors.phone}>
            <Input
              id="u-phone"
              inputMode="numeric"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              leadingIcon={<Phone />}
              invalid={!!errors.phone}
            />
          </Field>
          <Field label="Email" htmlFor="u-email" error={errors.email}>
            <Input
              id="u-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Optional"
              leadingIcon={<Mail />}
              invalid={!!errors.email}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="City" htmlFor="u-city">
            <Select
              id="u-city"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              options={CITIES.map((c) => ({ value: c, label: c }))}
            />
          </Field>
          <Field
            label="Role"
            htmlFor="u-role"
            hint={form.role === 'admin' ? 'Admins can block any account on the platform.' : undefined}
          >
            <Select
              id="u-role"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
              options={[
                { value: 'customer', label: 'Customer' },
                { value: 'operator', label: 'Vendor / operator' },
                { value: 'admin', label: 'Admin' },
              ]}
            />
          </Field>
        </div>

        <p className="flex items-center gap-2 rounded-xl border border-border bg-surface-2 px-4 py-3 text-[12px] text-muted">
          <MapPin className="size-4 shrink-0 text-subtle" />
          Account created {new Date(user.joinedAt).toLocaleDateString('en-IN')} · id{' '}
          <code className="font-mono text-[11px]">{user.id}</code>
        </p>
      </div>
    </Modal>
  );
}
