import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

/** Debounce a fast-changing value (search boxes, range sliders). */
export function useDebounced<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

/** localStorage-backed state that survives reloads and syncs across tabs. */
export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* quota or private mode — non-fatal for a preference */
    }
  }, [key, value]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        try {
          setValue(JSON.parse(e.newValue) as T);
        } catch {
          /* ignore malformed cross-tab payloads */
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [key]);

  return [value, setValue] as const;
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  );
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

/** Close-on-outside-click for popovers and dropdowns. */
export function useClickOutside<T extends HTMLElement>(onOutside: () => void) {
  const ref = useRef<T>(null);
  const handler = useRef(onOutside);
  useLayoutEffect(() => {
    handler.current = onOutside;
  });
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      const el = ref.current;
      if (!el || el.contains(event.target as Node)) return;
      handler.current();
    };
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, []);
  return ref;
}

export function useKey(key: string, handler: (e: KeyboardEvent) => void, enabled = true) {
  const cb = useRef(handler);
  useLayoutEffect(() => {
    cb.current = handler;
  });
  useEffect(() => {
    if (!enabled) return;
    const listener = (e: KeyboardEvent) => {
      if (e.key === key) cb.current(e);
    };
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [key, enabled]);
}

export function useDisclosure(initial = false) {
  const [isOpen, setOpen] = useState(initial);
  const open = useCallback(() => setOpen(true), []);
  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((v) => !v), []);
  return useMemo(() => ({ isOpen, open, close, toggle, setOpen }), [isOpen, open, close, toggle]);
}

/** Locks body scroll while a modal/drawer owns the screen. */
export function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [active]);
}

/**
 * Observed element width. Charts draw in real pixels rather than a stretched
 * viewBox, so corner radii, stroke widths and point markers stay circular
 * instead of being scaled into ellipses.
 */
export function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setWidth(entry.contentRect.width);
    });
    observer.observe(el);
    setWidth(el.getBoundingClientRect().width);
    return () => observer.disconnect();
  }, []);

  return [ref, width] as const;
}

/** Stable ids for label/aria wiring without pulling in a polyfill. */
let seq = 0;
export const useId = (prefix = 'tt') => useMemo(() => `${prefix}-${++seq}`, [prefix]);
