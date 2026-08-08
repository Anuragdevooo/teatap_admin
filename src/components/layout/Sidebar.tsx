import { NavLink } from 'react-router-dom';
import { ChevronsLeft, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { IconButton, Tooltip } from '@/components/ui';
import { NAVIGATION } from '@/app/navigation';
import { Brand } from './Brand';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  /** Mobile drawer visibility — desktop ignores this. */
  mobileOpen: boolean;
  onCloseMobile: () => void;
  badges: Record<string, number>;
}

export function Sidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  badges,
}: SidebarProps) {
  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-overlay animate-fade-in lg:hidden"
          onClick={onCloseMobile}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-sidebar transition-[width,transform] duration-250 ease-[var(--ease-out-quint)]',
          collapsed ? 'lg:w-[72px]' : 'lg:w-64',
          'w-72 lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div
          className={cn(
            'flex h-16 shrink-0 items-center gap-2 border-b border-border px-4',
            collapsed && 'lg:justify-center lg:px-0',
          )}
        >
          <Brand compact={collapsed} />
          <IconButton
            label="Close navigation"
            icon={<X />}
            size="sm"
            className="ml-auto lg:hidden"
            onClick={onCloseMobile}
          />
        </div>

        <nav className="min-h-0 flex-1 space-y-5 overflow-y-auto px-3 py-4">
          {NAVIGATION.map((section) => (
            <div key={section.title}>
              <p
                className={cn(
                  'mb-1.5 px-2.5 text-[10px] font-bold uppercase tracking-[0.08em] text-subtle',
                  collapsed && 'lg:sr-only',
                )}
              >
                {section.title}
              </p>
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const count = item.badge ? badges[item.badge] : undefined;

                  const link = (
                    <NavLink
                      to={item.to}
                      end={item.to === '/'}
                      onClick={onCloseMobile}
                      className={({ isActive }) =>
                        cn(
                          'group relative flex items-center gap-3 rounded-[10px] px-2.5 py-2 text-[13px] font-semibold transition-colors',
                          collapsed && 'lg:justify-center lg:px-0',
                          isActive
                            ? 'bg-primary-soft text-primary-soft-fg'
                            : 'text-muted hover:bg-surface-3 hover:text-fg',
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <span className="absolute -left-3 h-5 w-1 rounded-r-full bg-primary" />
                          )}
                          <Icon className="size-[18px] shrink-0" />
                          <span className={cn('truncate', collapsed && 'lg:hidden')}>
                            {item.label}
                          </span>
                          {count ? (
                            <span
                              className={cn(
                                'tnum ml-auto rounded-full bg-accent-soft px-1.5 py-0.5 text-[10px] font-bold text-accent-soft-fg',
                                collapsed && 'lg:hidden',
                              )}
                            >
                              {count}
                            </span>
                          ) : null}
                        </>
                      )}
                    </NavLink>
                  );

                  // Collapsed rails hide the label, so the tooltip becomes the
                  // only way to read a destination — it is not decoration here.
                  return (
                    <li key={item.to} className="[&>*]:w-full">
                      {collapsed ? (
                        <Tooltip label={item.label} side="bottom">
                          {link}
                        </Tooltip>
                      ) : (
                        link
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="hidden shrink-0 border-t border-border p-3 lg:block">
          <button
            onClick={onToggleCollapse}
            className={cn(
              'flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-[13px] font-semibold text-muted transition-colors hover:bg-surface-3 hover:text-fg',
              collapsed && 'justify-center px-0',
            )}
          >
            <ChevronsLeft
              className={cn('size-[18px] transition-transform duration-250', collapsed && 'rotate-180')}
            />
            {!collapsed && 'Collapse'}
          </button>
        </div>
      </aside>
    </>
  );
}
