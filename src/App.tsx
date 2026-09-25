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

          {/* Projects / Teams list */}
          <Route
            path="/teams"
            element={
              <AppShell>
                <TeamsListPage />
              </AppShell>
            }
          />
          <Route
            path="/projects"
            element={
              <AppShell>
                <TeamsListPage />
              </AppShell>
            }
          />

          {/* Teacher Create Project */}
          <Route
            path="/teams/new"
            element={
              <AppShell>
                <ProtectedRoute permission="teacher:create-project">
                  <TeamCreationWizardPage />
                </ProtectedRoute>
              </AppShell>
            }
          />
          <Route
            path="/projects/new"
            element={
              <AppShell>
                <ProtectedRoute permission="teacher:create-project">
                  <TeamCreationWizardPage />
                </ProtectedRoute>
              </AppShell>
            }
          />

          {/* Project Workspace */}
          <Route
            path="/teams/:id"
            element={
              <AppShell>
                <TeamDetailPage />
              </AppShell>
            }
          />
          <Route
            path="/projects/:id"
            element={
              <AppShell>
                <TeamDetailPage />
              </AppShell>
            }
          />

          {/* Convenience Workspace tab aliases */}
          <Route
            path="/contributions"
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

          {/* Student Profile */}
          <Route
            path="/profile"
            element={
              <AppShell>
                <StudentProfilePage />
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

          {/* Collaborator Discovery */}
          <Route
            path="/find-teammates"
            element={
              <AppShell>
                <FindTeammatesPage />
              </AppShell>
            }
          />
          <Route
            path="/find-students"
            element={
              <AppShell>
                <FindTeammatesPage />
              </AppShell>
            }
          />
          <Route
            path="/find-collaborators"
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

          {/* Project Chat */}
          <Route
            path="/chat"
            element={
              <AppShell>
                <PrivateChatPage />
              </AppShell>
            }
          />

          {/* Notifications */}
          <Route
            path="/notifications"
            element={
              <AppShell>
                <NotificationsPage />
              </AppShell>
            }
          />

          {/* Audit Logs */}
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

          {/* Platform Settings */}
          <Route
            path="/settings"
            element={
              <AppShell>
                <SettingsPage />
              </AppShell>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
};

export default App;
