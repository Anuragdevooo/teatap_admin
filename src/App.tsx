import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from '@/app/ThemeProvider';
import { ToastProvider } from '@/components/ui';
import { AppShell } from '@/components/layout';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { VendorsPage } from '@/features/vendors/VendorsPage';
import { SubscriptionsPage } from '@/features/subscriptions/SubscriptionsPage';
import { PlansPage } from '@/features/subscriptions/PlansPage';
import { DevicesPage } from '@/features/devices/DevicesPage';
import { LeaderboardPage } from '@/features/leaderboard/LeaderboardPage';
import { CustomersPage } from '@/features/customers/CustomersPage';
import { BillingPage } from '@/features/billing/BillingPage';
import { UsersPage } from '@/features/users/UsersPage';
import { ChatPage } from '@/features/chat/ChatPage';
import { NotificationsPage } from '@/features/notifications/NotificationsPage';
import { SupportPage } from '@/features/support/SupportPage';
import { ReleasesPage } from '@/features/releases/ReleasesPage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { LoginPage } from '@/features/auth/LoginPage';
import { NotFoundPage } from '@/features/misc/NotFoundPage';

/**
 * Routes are flat and declarative on purpose: this console has no nested
 * layouts beyond the shell, and a flat table is the fastest thing to read
 * when you are looking for "where does /devices live".
 */
export function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route element={<AppShell />}>
              <Route index element={<DashboardPage />} />
              <Route path="vendors" element={<VendorsPage />} />
              {/* Tenants were called "owners" before the rename. */}
              <Route path="owners" element={<Navigate to="/vendors" replace />} />
              <Route path="subscriptions" element={<SubscriptionsPage />} />
              <Route path="plans" element={<PlansPage />} />
              <Route path="devices" element={<DevicesPage />} />
              <Route path="leaderboard" element={<LeaderboardPage />} />
              <Route path="customers" element={<CustomersPage />} />
              <Route path="billing" element={<BillingPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="chat" element={<ChatPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="support" element={<SupportPage />} />
              <Route path="releases" element={<ReleasesPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="404" element={<NotFoundPage />} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  );
}
