import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, LogOut, Menu as MenuIcon, Moon, Search, Sun, UserCog } from 'lucide-react';
import { Avatar, IconButton, Menu } from '@/components/ui';
import { useTheme } from '@/app/ThemeProvider';
import { CommandPalette } from './CommandPalette';
import { useKey } from '@/lib/hooks';

interface TopbarProps {
  onOpenMobileNav: () => void;
  unreadNotifications: number;
}

export function Topbar({ onOpenMobileNav, unreadNotifications }: TopbarProps) {
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [paletteOpen, setPaletteOpen] = useState(false);

  useKey('k', (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      setPaletteOpen(true);
    }
  });

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-surface/85 px-4 backdrop-blur-md">
        <IconButton
          label="Open navigation"
          icon={<MenuIcon />}
          className="lg:hidden"
          onClick={onOpenMobileNav}
        />

        {/* A button that *looks* like a field: search here opens the command
            palette rather than filtering in place. Never a real <input> — one
            nested inside a <button> is invalid markup and swallows clicks. */}
        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          aria-label="Search the console"
          className="hidden h-9 w-full max-w-sm items-center gap-2.5 rounded-field border border-border bg-surface px-3 text-left shadow-xs transition-colors hover:border-border-strong hover:bg-surface-2 md:flex"
        >
          <Search className="size-4 shrink-0 text-subtle" aria-hidden />
          <span className="min-w-0 flex-1 truncate text-[13px] text-subtle">
            Search vendors, customers, pages…
          </span>
          <kbd className="shrink-0 rounded border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-muted">
            Ctrl K
          </kbd>
        </button>

        <div className="ml-auto flex items-center gap-1">
          <IconButton
            label="Search"
            icon={<Search />}
            className="md:hidden"
            onClick={() => setPaletteOpen(true)}
          />

          <IconButton
            label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            icon={theme === 'dark' ? <Sun /> : <Moon />}
            onClick={toggle}
          />

          <span className="relative">
            <IconButton
              label="Notifications"
              icon={<Bell />}
              onClick={() => navigate('/notifications')}
            />
            {unreadNotifications > 0 && (
              <span className="tnum pointer-events-none absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-danger px-1 text-[10px] font-bold leading-4 text-white ring-2 ring-surface">
                {unreadNotifications}
              </span>
            )}
          </span>

          <div className="mx-1.5 hidden h-6 w-px bg-border sm:block" />

          <Menu
            items={[
              { label: 'Account settings', icon: <UserCog />, onSelect: () => navigate('/settings') },
              { label: 'Sign out', icon: <LogOut />, tone: 'danger', separated: true, onSelect: () => navigate('/login') },
            ]}
            trigger={({ toggle: openMenu }) => (
              <button
                onClick={openMenu}
                className="flex items-center gap-2.5 rounded-[10px] py-1 pl-1 pr-2 transition-colors hover:bg-surface-3"
              >
                <Avatar name="Teatap Admin" size="sm" status="online" />
                <span className="hidden text-left leading-tight sm:block">
                  <span className="block text-[13px] font-bold text-fg">Teatap Admin</span>
                  <span className="block text-[11px] text-muted">Platform admin</span>
                </span>
              </button>
            )}
          />
        </div>
      </header>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  );
}
