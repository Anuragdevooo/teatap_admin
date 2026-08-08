import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { useDisclosure, useLocalStorage, useMediaQuery } from '@/lib/hooks';
import { hydrate, useStore } from '@/store';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

/**
 * The frame every screen renders inside.
 *
 * Layout state (rail collapsed, mobile drawer) lives here rather than in a
 * global store — nothing outside the chrome needs to read it, and keeping it
 * local means a page can never accidentally depend on the shell.
 */
export function AppShell() {
  const location = useLocation();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [collapsed, setCollapsed] = useLocalStorage('teatap.sidebar.collapsed', false);
  const mobileNav = useDisclosure(false);
  const { notifications, support, chatThreads } = useStore();

  useEffect(hydrate, []);

  // A route change should never leave the drawer covering the new page.
  useEffect(() => {
    mobileNav.close();
    window.scrollTo({ top: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const unread = notifications.filter((n) => n.unread).length;
  const openTickets = support.filter((t) => t.status === 'Open').length;
  const unreadChats = chatThreads.reduce((sum, t) => sum + t.unread, 0);

  return (
    <div className="min-h-full bg-bg">
      <Sidebar
        collapsed={collapsed && isDesktop}
        onToggleCollapse={() => setCollapsed((v) => !v)}
        mobileOpen={mobileNav.isOpen}
        onCloseMobile={mobileNav.close}
        badges={{ notifications: unread, support: openTickets, chat: unreadChats }}
      />

      <div
        className={cn(
          'flex min-h-full flex-col transition-[padding] duration-250 ease-[var(--ease-out-quint)]',
          collapsed ? 'lg:pl-[72px]' : 'lg:pl-64',
        )}
      >
        <Topbar onOpenMobileNav={mobileNav.open} unreadNotifications={unread} />

        {/* Keying on the path replays the entrance on every navigation, which
            gives the route change a direction instead of a hard cut. */}
        <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div key={location.pathname} className="animate-rise">
            <Outlet />
          </div>
        </main>

        <footer className="border-t border-border px-4 py-4 sm:px-6 lg:px-8">
          <p className="text-[11px] text-subtle">
            Teatap Admin Console · UI preview build · data is illustrative
          </p>
        </footer>
      </div>
    </div>
  );
}
