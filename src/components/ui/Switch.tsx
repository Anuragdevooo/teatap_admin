import { cn } from '@/lib/cn';
import { useId } from '@/lib/hooks';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * A switch commits immediately — no Save button. If the change needs
 * confirmation, use a Checkbox inside a form instead.
 */
export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled,
  size = 'md',
  className,
}: SwitchProps) {
  const id = useId('switch');
  const track = size === 'sm' ? 'h-5 w-9' : 'h-6 w-11';
  const knob = size === 'sm' ? 'size-3.5' : 'size-4.5';
  const shift = size === 'sm' ? 'translate-x-4' : 'translate-x-5';

  return (
    <div className={cn('flex items-start gap-3', className)}>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative shrink-0 rounded-full p-0.5 transition-colors duration-200',
          'disabled:cursor-not-allowed disabled:opacity-50',
          track,
          checked ? 'bg-primary' : 'bg-border-strong',
        )}
      >
        <span
          className={cn(
            'block rounded-full bg-white shadow-sm transition-transform duration-200 ease-[var(--ease-out-quint)]',
            knob,
            checked ? shift : 'translate-x-0',
          )}
        />
      </button>
      {(label || description) && (
        <label htmlFor={id} className="cursor-pointer select-none">
          {label && <span className="block text-[13px] font-semibold text-fg">{label}</span>}
          {description && <span className="mt-0.5 block text-xs text-muted">{description}</span>}
        </label>
      )}
    </div>
  );
}
