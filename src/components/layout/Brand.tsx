import { cn } from '@/lib/cn';

/**
 * The Teatap mark. The wordmark is set in type rather than baked into the
 * image so it stays crisp at every size and inherits the theme's ink.
 */
export function Brand({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <img
        src="/brand/teatap-icon.png"
        alt=""
        width={36}
        height={36}
        className="size-9 shrink-0 rounded-[10px] object-cover ring-1 ring-border"
      />
      {!compact && (
        <span className="flex min-w-0 flex-col leading-none">
          <span className="truncate text-[15px] font-extrabold tracking-tight text-fg">Teatap</span>
          <span className="mt-1 truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
            Admin console
          </span>
        </span>
      )}
    </span>
  );
}
