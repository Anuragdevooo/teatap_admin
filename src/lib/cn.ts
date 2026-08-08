import clsx, { type ClassValue } from 'clsx';

/**
 * Class name joiner.
 *
 * We deliberately do NOT pull in tailwind-merge: every component in `ui/`
 * exposes its variants as props and appends `className` last, so the caller's
 * class already wins on specificity-equal utilities. Keeping this dependency
 * free makes the primitive layer cheap to reuse.
 */
export const cn = (...inputs: ClassValue[]) => clsx(inputs);
