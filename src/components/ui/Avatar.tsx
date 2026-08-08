import { useMemo } from 'react';
import { cn } from '@/lib/cn';
import { initials as toInitials } from '@/lib/format';

const SIZES = {
  xs: 'size-6 text-[10px]',
  sm: 'size-8 text-[11px]',
  md: 'size-10 text-[13px]',
  lg: 'size-12 text-sm',
  xl: 'size-16 text-lg',
} as const;

/** Deterministic hue per name so the same person keeps the same colour. */
const PALETTES = [
  'bg-[#d3f5ec] text-[#0f695f] dark:bg-[#0d2b28] dark:text-[#71dac5]',
  'bg-[#fdeed3] text-[#a9611c] dark:bg-[#3a2a10] dark:text-[#f6c877]',
  'bg-[#dbeafe] text-[#1d4ed8] dark:bg-[#12233f] dark:text-[#93c5fd]',
  'bg-[#fce7f3] text-[#be185d] dark:bg-[#3a1327] dark:text-[#f9a8d4]',
  'bg-[#ede9fe] text-[#6d28d9] dark:bg-[#241a3f] dark:text-[#c4b5fd]',
  'bg-[#dcfce7] text-[#15803d] dark:bg-[#102b1b] dark:text-[#86efac]',
];

function hashHue(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return Math.abs(h) % PALETTES.length;
}

interface AvatarProps {
  name: string;
  /** Overrides the derived initials (the API sometimes supplies its own). */
  initials?: string | null;
  src?: string | null;
  size?: keyof typeof SIZES;
  /** Presence ring — omit entirely when presence is unknown. */
  status?: 'online' | 'idle' | 'offline';
  className?: string;
}

export function Avatar({ name, initials, src, size = 'md', status, className }: AvatarProps) {
  const palette = useMemo(() => PALETTES[hashHue(name)], [name]);
  const label = initials?.trim() || toInitials(name);

  return (
    <span className={cn('relative inline-flex shrink-0', className)}>
      {src ? (
        <img
          src={src}
          alt={name}
          className={cn('rounded-full object-cover ring-1 ring-border', SIZES[size])}
        />
      ) : (
        <span
          role="img"
          aria-label={name}
          className={cn(
            'grid place-items-center rounded-full font-bold tracking-tight ring-1 ring-black/5 dark:ring-white/10',
            SIZES[size],
            palette,
          )}
        >
          {label}
        </span>
      )}
      {status && (
        <span
          aria-hidden
          className={cn(
            'absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full ring-2 ring-surface',
            status === 'online' && 'bg-success',
            status === 'idle' && 'bg-warning',
            status === 'offline' && 'bg-subtle',
          )}
        />
      )}
    </span>
  );
}
