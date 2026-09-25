import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AppShell } from './components/layout/AppShell';
import { ProtectedRoute } from './auth/accessControl';

import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { CoordinatorDashboardPage } from './pages/CoordinatorDashboardPage';
import { TeamsListPage } from './pages/TeamsListPage';
import { TeamCreationWizardPage } from './pages/TeamCreationWizardPage';
import { TeamDetailPage } from './pages/TeamDetailPage';
import { StudentProfilePage } from './pages/StudentProfilePage';
import { FindTeammatesPage } from './pages/FindTeammatesPage';
import { CollaborationRequestsPage } from './pages/CollaborationRequestsPage';
import { PrivateChatPage } from './pages/PrivateChatPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { AuditLogPage } from './pages/AuditLogPage';
import { SettingsPage } from './pages/SettingsPage';

export const App: React.FC = () => {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Unauthenticated Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Protected Application Routes with Role & Scope Guards */}
          <Route
            path="/dashboard"
            element={
              <AppShell>
                <CoordinatorDashboardPage />
              </AppShell>
            }
          />
          <Route
            path="/teams"
            element={
              <AppShell>
                <TeamsListPage />
              </AppShell>
            }
          />
          <Route
            path="/teams/new"
            element={
              <AppShell>
                <ProtectedRoute permission="team:create">
                  <TeamCreationWizardPage />
                </ProtectedRoute>
              </AppShell>
            }
          />
          <Route
            path="/teams/:id"
            element={
              <AppShell>
                <TeamDetailPage />
              </AppShell>
            }
          />

          {/* Convenience tab routes */}
          <Route
            path="/contributions"
            element={
              <AppShell>
                <TeamDetailPage />
              </AppShell>
            }
          />
          <Route
            path="/discussions"
            element={
              <AppShell>
                <TeamDetailPage />
              </AppShell>
            }
          />
          <Route
            path="/tasks"
            element={
              <AppShell>
                <TeamDetailPage />
              </AppShell>
            }
          />
          <Route
            path="/documents"
            element={
              <AppShell>
                <TeamDetailPage />
              </AppShell>
            }
          />
          <Route
            path="/knowledge-exchange"
            element={
              <AppShell>
                <TeamDetailPage />
              </AppShell>
            }
          />
          <Route
            path="/insights"
            element={
              <AppShell>
                <TeamDetailPage />
              </AppShell>
            }
          />
          <Route
            path="/gaps"
            element={
              <AppShell>
                <TeamDetailPage />
              </AppShell>
            }
          />
          <Route
            path="/students"
            element={
              <AppShell>
                <StudentProfilePage />
              </AppShell>
            }
          />
          <Route
            path="/profile"
            element={
              <AppShell>
                <StudentProfilePage />
              </AppShell>
            }
          />
          <Route
            path="/find-teammates"
            element={
              <AppShell>
                <FindTeammatesPage />
              </AppShell>
            }
          />
          <Route
            path="/collaboration-requests"
            element={
              <AppShell>
                <CollaborationRequestsPage />
              </AppShell>
            }
          />
          <Route
            path="/chat"
            element={
              <AppShell>
                <ProtectedRoute permission="chat:access-own-team">
                  <PrivateChatPage />
                </ProtectedRoute>
              </AppShell>
            }
          />
          <Route
            path="/notifications"
            element={
              <AppShell>
                <NotificationsPage />
              </AppShell>
            }
          />
          <Route
            path="/audit"
            element={
              <AppShell>
                <ProtectedRoute permission="audit:view">
                  <AuditLogPage />
                </ProtectedRoute>
              </AppShell>
            }
          />
          <Route
            path="/settings"
            element={
              <AppShell>
                <SettingsPage />
              </AppShell>
            }
          />

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
};

export default App;
