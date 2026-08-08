import { cn } from '@/lib/cn';

interface SkeletonProps {
  className?: string;
  /** `text` gets a slightly rounded bar; `circle` for avatars. */
  shape?: 'text' | 'block' | 'circle';
}

/**
 * Loading placeholder. Always render skeletons in the *shape of the real
 * content* — same heights, same column count — so nothing jumps on resolve.
 */
export function Skeleton({ className, shape = 'block' }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={cn(
        'shimmer bg-surface-3',
        shape === 'text' && 'h-3.5 rounded',
        shape === 'block' && 'rounded-lg',
        shape === 'circle' && 'rounded-full',
        className,
      )}
    />
  );
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} shape="text" className={i === lines - 1 ? 'w-2/3' : 'w-full'} />
      ))}
    </div>
  );
}
