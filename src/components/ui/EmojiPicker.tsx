import { useMemo, useRef, useState } from 'react';
import { Clock, Search, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useLocalStorage } from '@/lib/hooks';
import { ALL_EMOJI, EMOJI_GROUPS } from './emoji-data';
import { IconButton } from './IconButton';
import { Input } from './Input';

interface EmojiPickerProps {
  onPick: (emoji: string) => void;
  onClose: () => void;
  className?: string;
}

const RECENTS_KEY = 'teatap.emoji.recents';
const MAX_RECENTS = 16;

/**
 * The emoji picker you expect from a chat app: categories, search, and a
 * recents row that learns what this admin actually uses.
 *
 * Categories are jump targets, not filters — clicking one scrolls the single
 * continuous list rather than swapping its contents. That is what makes a
 * picker feel like one surface you can browse instead of six separate tabs.
 */
export function EmojiPicker({ onPick, onClose, className }: EmojiPickerProps) {
  const [query, setQuery] = useState('');
  const [recents, setRecents] = useLocalStorage<string[]>(RECENTS_KEY, []);
  const [activeGroup, setActiveGroup] = useState(EMOJI_GROUPS[0].id);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const needle = query.trim().toLowerCase();

  const results = useMemo(() => {
    if (!needle) return null;
    return ALL_EMOJI.filter(
      (item) => item.keywords.includes(needle) || item.char === needle,
    ).slice(0, 64);
  }, [needle]);

  const pick = (char: string) => {
    setRecents((current) => [char, ...current.filter((c) => c !== char)].slice(0, MAX_RECENTS));
    onPick(char);
  };

  const jumpTo = (groupId: string) => {
    setActiveGroup(groupId);
    setQuery('');
    // Wait a frame so the section exists again after a search is cleared.
    requestAnimationFrame(() => {
      sectionRefs.current[groupId]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  /** Marks whichever section is currently under the top of the viewport. */
  const onScroll = () => {
    const container = scrollRef.current;
    if (!container) return;
    const top = container.getBoundingClientRect().top;
    let current = EMOJI_GROUPS[0].id;
    for (const group of EMOJI_GROUPS) {
      const el = sectionRefs.current[group.id];
      if (el && el.getBoundingClientRect().top - top <= 8) current = group.id;
    }
    setActiveGroup(current);
  };

  return (
    <div
      className={cn(
        'flex h-80 w-full flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-lg',
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-border p-2">
        <div className="min-w-0 flex-1">
          <Input
            size="sm"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search emoji…"
            leadingIcon={<Search />}
            aria-label="Search emoji"
            autoComplete="off"
          />
        </div>
        <IconButton label="Close emoji picker" icon={<X />} size="sm" onClick={onClose} />
      </div>

      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-2"
      >
        {results ? (
          results.length === 0 ? (
            <p className="px-2 py-10 text-center text-[12px] text-muted">
              No emoji matches “{query}”.
            </p>
          ) : (
            <Section title={`${results.length} result${results.length === 1 ? '' : 's'}`}>
              {results.map((item) => (
                <EmojiButton key={item.char} entry={item} onPick={pick} />
              ))}
            </Section>
          )
        ) : (
          <>
            {recents.length > 0 && (
              <Section
                title="Recently used"
                icon={<Clock className="size-3" />}
                action={
                  <button
                    onClick={() => setRecents([])}
                    className="text-[10px] font-semibold text-muted hover:text-fg"
                  >
                    Clear
                  </button>
                }
              >
                {recents.map((char) => (
                  <EmojiButton key={`recent-${char}`} entry={{ char, keywords: '' }} onPick={pick} />
                ))}
              </Section>
            )}

            {EMOJI_GROUPS.map((group) => (
              <div
                key={group.id}
                ref={(el) => {
                  sectionRefs.current[group.id] = el;
                }}
              >
                <Section title={group.label}>
                  {group.emojis.map((item) => (
                    <EmojiButton key={item.char} entry={item} onPick={pick} />
                  ))}
                </Section>
              </div>
            ))}
          </>
        )}
      </div>

      <div className="flex items-center gap-0.5 border-t border-border p-1.5">
        {EMOJI_GROUPS.map((group) => (
          <button
            key={group.id}
            type="button"
            onClick={() => jumpTo(group.id)}
            aria-label={group.label}
            title={group.label}
            className={cn(
              'relative grid flex-1 place-items-center rounded-lg py-1.5 text-[17px] leading-none transition-colors',
              activeGroup === group.id && !needle ? 'bg-surface-3' : 'hover:bg-surface-2',
            )}
          >
            {group.icon}
            {activeGroup === group.id && !needle && (
              <span className="absolute inset-x-2.5 bottom-0.5 h-0.5 rounded-full bg-primary" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function Section({
  title,
  icon,
  action,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="pt-2">
      <header className="sticky top-0 z-10 flex items-center justify-between gap-2 bg-surface/95 px-1 py-1 backdrop-blur">
        <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-subtle">
          {icon}
          {title}
        </p>
        {action}
      </header>
      <div className="grid grid-cols-8 gap-0.5 sm:grid-cols-9">{children}</div>
    </section>
  );
}

function EmojiButton({
  entry,
  onPick,
}: {
  entry: { char: string; keywords: string };
  onPick: (char: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onPick(entry.char)}
      title={entry.keywords.split(' ')[0] || entry.char}
      aria-label={`Insert ${entry.keywords.split(' ')[0] || entry.char}`}
      className="grid aspect-square place-items-center rounded-lg text-[20px] leading-none transition-transform duration-150 hover:scale-125 hover:bg-surface-3 active:scale-105"
    >
      {entry.char}
    </button>
  );
}
