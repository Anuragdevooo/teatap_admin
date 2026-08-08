import { useEffect, useState } from 'react';
import { Eye, EyeOff, KeyRound, MapPin, Phone, Shuffle, User } from 'lucide-react';
import {
  Button,
  Field,
  IconButton,
  Input,
  Modal,
  SearchableSelect,
  useToast,
} from '@/components/ui';
import { actions, useStore } from '@/store';
import { generatePassword } from '@/lib/password';
import type { Customer } from '@/types/domain';

interface CustomerFormModalProps {
  open: boolean;
  onClose: () => void;
  /** Present when editing; omit to create. */
  customer?: Customer | null;
  /** Pre-selects the vendor when opened from a vendor's own screen. */
  defaultVendorId?: string;
}

/** Suggestions only — the field accepts any locality the operator types. */
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

const EMPTY = {
  name: '',
  phone: '',
  address: '',
  area: '',
  vendorId: '',
  password: '',
};

type Errors = Partial<Record<keyof typeof EMPTY, string>>;

export function CustomerFormModal({
  open,
  onClose,
  customer,
  defaultVendorId,
}: CustomerFormModalProps) {
  const { owners } = useStore();
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [showPassword, setShowPassword] = useState(false);

  const editing = !!customer;

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(
      customer
        ? {
            name: customer.name,
            phone: customer.phone,
            address: customer.address,
            area: customer.area,
            vendorId: customer.vendorId,
            // Never surfaced when editing — an admin resets, never reads.
            password: '',
          }
        : { ...EMPTY, vendorId: defaultVendorId ?? owners[0]?.id ?? '' },
    );
  }, [open, customer, defaultVendorId, owners]);

  const field = <K extends keyof typeof EMPTY>(key: K, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = () => {
    const next: Errors = {};
    if (form.name.trim().length < 3) next.name = 'Enter the full name.';
    if (!/^\d{10}$/.test(form.phone.replace(/\D/g, '')))
      next.phone = 'A 10-digit mobile number is required.';
    if (!form.vendorId) next.vendorId = 'Assign the customer to a vendor.';
    if (form.area.trim().length < 2) next.area = 'Enter the delivery area or locality.';
    // Only set at creation; editing keeps whatever the customer already has.
    if (!editing && form.password.length < 8)
      next.password = 'Use at least 8 characters for the customer login.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = () => {
    if (!validate()) return;

    const payload = {
      name: form.name.trim(),
      phone: form.phone.replace(/\D/g, ''),
      address: form.address.trim(),
      area: form.area.trim(),
      vendorId: form.vendorId,
    };

    if (editing && customer) {
      const vendor = owners.find((o) => o.id === payload.vendorId);
      actions.updateCustomer(customer.id, {
        ...payload,
        vendorName: vendor?.businessName ?? customer.vendorName,
      });
      toast.success('Customer updated', payload.name);
    } else {
      actions.createCustomer(payload);
      toast.success('Customer added', `${payload.name} added in ${payload.area}.`);
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Edit customer' : 'Add customer'}
      description={
        editing ? 'Changes apply immediately.' : 'Assign the customer to a vendor and an area.'
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit}>
            {editing ? 'Save changes' : 'Add customer'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Name" required htmlFor="c-name" error={errors.name}>
            <Input
              id="c-name"
              data-autofocus
              value={form.name}
              onChange={(e) => field('name', e.target.value)}
              placeholder="e.g. Anita Patel"
              leadingIcon={<User />}
              invalid={!!errors.name}
            />
          </Field>
          <Field label="Phone" required htmlFor="c-phone" error={errors.phone}>
            <Input
              id="c-phone"
              inputMode="numeric"
              value={form.phone}
              onChange={(e) => field('phone', e.target.value)}
              placeholder="9876543210"
              leadingIcon={<Phone />}
              invalid={!!errors.phone}
            />
          </Field>
        </div>

        <Field label="Address" htmlFor="c-addr">
          <Input
            id="c-addr"
            value={form.address}
            onChange={(e) => field('address', e.target.value)}
            placeholder="12, MG Road"
            leadingIcon={<MapPin />}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Vendor" required error={errors.vendorId}>
            <SearchableSelect
              size="md"
              value={form.vendorId}
              onChange={(value) => field('vendorId', value)}
              options={owners.map((o) => ({
                value: o.id,
                label: o.businessName,
                hint: `${o.ownerName} · ${o.city}`,
              }))}
              placeholder="Choose a vendor"
              ariaLabel="Vendor"
              invalid={!!errors.vendorId}
            />
          </Field>
          <Field label="Area" htmlFor="c-area" error={errors.area}>
            <Input
              id="c-area"
              list="area-suggestions"
              value={form.area}
              onChange={(e) => field('area', e.target.value)}
              placeholder="e.g. Kothrud"
              leadingIcon={<MapPin />}
              invalid={!!errors.area}
            />
            <datalist id="area-suggestions">
              {AREA_SUGGESTIONS.map((a) => (
                <option key={a} value={a} />
              ))}
            </datalist>
          </Field>
        </div>

        {!editing && (
          <Field
            label="App password"
            required
            htmlFor="c-password"
            error={errors.password}
            hint="The customer signs into the Teatap app with their phone and this password."
          >
            <Input
              id="c-password"
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
                      field('password', generatePassword());
                      setShowPassword(true);
                    }}
                  />
                </span>
              }
            />
          </Field>
        )}

      </div>
    </Modal>
  );
}
