import { useEffect, useState } from 'react';
import { Building2, Eye, EyeOff, KeyRound, MapPin, Phone, Shuffle, User } from 'lucide-react';
import { Button, Field, IconButton, Input, Modal, Select, useToast } from '@/components/ui';
import { actions } from '@/store';
import { PLAN_FEE, PLAN_SEATS } from '@/store';
import { generatePassword } from '@/lib/password';
import type { Owner, PlanTier } from '@/types/domain';
import { money } from '@/lib/format';

interface VendorFormModalProps {
  open: boolean;
  onClose: () => void;
  /** Present when editing; omit to create. */
  vendor?: Owner | null;
}

const CITIES = ['Pune', 'Mumbai', 'Nagpur', 'Nashik', 'Surat', 'Indore', 'Hyderabad'];
/** Suggestions only — any locality can be typed in. */
const AREA_SUGGESTIONS = [
  'Kothrud',
  'Baner',
  'Hadapsar',
  'Viman Nagar',
  'Shivaji Nagar',
  'Camp',
  'Wakad',
  'Kharadi',
  'Deccan',
  'Aundh',
];
const PLANS: PlanTier[] = ['Trial', 'Starter', 'Pro', 'Enterprise'];

const EMPTY = {
  businessName: '',
  ownerName: '',
  phone: '',
  email: '',
  city: 'Pune',
  area: '',
  password: '',
  plan: 'Starter' as PlanTier,
};

type Errors = Partial<Record<keyof typeof EMPTY, string>>;

/**
 * Create/edit form for a tenant.
 *
 * One component for both modes: the fields, the validation and the plan
 * preview are identical, and only the submit action differs. Splitting them
 * would guarantee the two drift apart on the next field added.
 */
export function VendorFormModal({ open, onClose, vendor }: VendorFormModalProps) {
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [showPassword, setShowPassword] = useState(false);

  const editing = !!vendor;

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(
      vendor
        ? {
            businessName: vendor.businessName,
            ownerName: vendor.ownerName,
            phone: vendor.phone,
            email: vendor.email ?? '',
            city: vendor.city,
            area: vendor.area,
            // Never surfaced when editing — an admin resets, never reads.
            password: '',
            plan: vendor.plan,
          }
        : EMPTY,
    );
  }, [open, vendor]);

  const field = <K extends keyof typeof EMPTY>(key: K, value: (typeof EMPTY)[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = (): boolean => {
    const next: Errors = {};
    if (form.businessName.trim().length < 3) next.businessName = 'Give the shop a name of at least 3 characters.';
    if (form.ownerName.trim().length < 3) next.ownerName = "Enter the owner's full name.";
    if (!/^\d{10}$/.test(form.phone.replace(/\D/g, '')))
      next.phone = 'A 10-digit Indian mobile number is required.';
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'That does not look like an email address.';
    if (form.area.trim().length < 2) next.area = 'Enter the area or locality the shop serves.';
    // A password is only set at creation; editing never reveals or resets it.
    if (!editing && form.password.length < 8)
      next.password = 'Use at least 8 characters for the operator login.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = () => {
    if (!validate()) return;

    const payload = {
      businessName: form.businessName.trim(),
      ownerName: form.ownerName.trim(),
      phone: form.phone.replace(/\D/g, ''),
      email: form.email.trim() || null,
      city: form.city,
      area: form.area.trim(),
      plan: form.plan,
    };

    if (editing && vendor) {
      actions.updateVendor(vendor.id, payload);
      if (vendor.plan !== form.plan) actions.changePlan(vendor.id, form.plan);
      toast.success('Vendor updated', `${payload.businessName} saved.`);
    } else {
      actions.createVendor(payload);
      toast.success(
        'Vendor added',
        `${payload.businessName} is live on ${form.plan}. Share the login with ${payload.ownerName}.`,
      );
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Edit vendor' : 'Add a tea shop'}
      description={
        editing
          ? 'Changes apply immediately across the console.'
          : 'Creates the tenant, its subscription and an operator login.'
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit}>
            {editing ? 'Save changes' : 'Create vendor'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Shop name" required htmlFor="v-shop" error={errors.businessName}>
          <Input
            id="v-shop"
            data-autofocus
            value={form.businessName}
            onChange={(e) => field('businessName', e.target.value)}
            placeholder="e.g. Amrut Tea Stall"
            leadingIcon={<Building2 />}
            invalid={!!errors.businessName}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Owner name" required htmlFor="v-owner" error={errors.ownerName}>
            <Input
              id="v-owner"
              value={form.ownerName}
              onChange={(e) => field('ownerName', e.target.value)}
              placeholder="e.g. Ravi Sharma"
              leadingIcon={<User />}
              invalid={!!errors.ownerName}
            />
          </Field>
          <Field label="Phone" required htmlFor="v-phone" error={errors.phone}>
            <Input
              id="v-phone"
              inputMode="numeric"
              value={form.phone}
              onChange={(e) => field('phone', e.target.value)}
              placeholder="9876543210"
              leadingIcon={<Phone />}
              invalid={!!errors.phone}
            />
          </Field>
        </div>

        <Field label="Email" htmlFor="v-email" error={errors.email} hint="Optional — used for invoices and receipts.">
          <Input
            id="v-email"
            type="email"
            value={form.email}
            onChange={(e) => field('email', e.target.value)}
            placeholder="owner@teatap.app"
            invalid={!!errors.email}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="City" htmlFor="v-city">
            <Select
              id="v-city"
              value={form.city}
              onChange={(e) => field('city', e.target.value)}
              options={CITIES.map((c) => ({ value: c, label: c }))}
            />
          </Field>
          <Field label="Area" htmlFor="v-area" error={errors.area}>
            <Input
              id="v-area"
              list="vendor-area-suggestions"
              value={form.area}
              onChange={(e) => field('area', e.target.value)}
              placeholder="e.g. Kothrud"
              leadingIcon={<MapPin />}
              invalid={!!errors.area}
            />
            <datalist id="vendor-area-suggestions">
              {AREA_SUGGESTIONS.map((a) => (
                <option key={a} value={a} />
              ))}
            </datalist>
          </Field>
        </div>

        {!editing && (
          <Field
            label="Operator password"
            required
            htmlFor="v-password"
            error={errors.password}
            hint="The vendor signs into the Teatap app with their phone and this password."
          >
            <Input
              id="v-password"
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => field('password', e.target.value)}
              placeholder="At least 8 characters"
              leadingIcon={<KeyRound />}
              invalid={!!errors.password}
              trailing={
                <span className="flex items-center gap-0.5">
                  <IconButton
                    label={showPassword ? 'Hide password' : 'Show password'}
                    icon={showPassword ? <EyeOff /> : <Eye />}
                    size="sm"
                    onClick={() => setShowPassword((v) => !v)}
                  />
                  <IconButton
                    label="Generate a password"
                    icon={<Shuffle />}
                    size="sm"
                    onClick={() => {
                      const generated = generatePassword();
                      field('password', generated);
                      setShowPassword(true);
                    }}
                  />
                </span>
              }
            />
          </Field>
        )}

        <Field label="Plan" htmlFor="v-plan">
          <Select
            id="v-plan"
            value={form.plan}
            onChange={(e) => field('plan', e.target.value as PlanTier)}
            options={PLANS.map((p) => ({ value: p, label: p }))}
          />
        </Field>

        {/* Consequences of the plan choice, stated before the button is pressed. */}
        <div className="flex items-center justify-between rounded-xl border border-border bg-surface-2 px-4 py-3">
          <div>
            <p className="text-[13px] font-bold text-fg">{form.plan}</p>
            <p className="mt-0.5 text-[11px] text-muted">
              {PLAN_SEATS[form.plan]} device seat{PLAN_SEATS[form.plan] > 1 ? 's' : ''} ·{' '}
              {form.plan === 'Trial' ? '14-day trial' : 'billed monthly'}
            </p>
          </div>
          <p className="tnum text-lg font-extrabold text-fg">
            {PLAN_FEE[form.plan] ? `${money(PLAN_FEE[form.plan])}/mo` : 'Free'}
          </p>
        </div>
      </div>
    </Modal>
  );
}
