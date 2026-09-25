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

          {/* Unified Role Dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <AppShell>
                  <CoordinatorDashboardPage />
                </AppShell>
              </ProtectedRoute>
            }
          />

          {/* Dedicated Admin-Only Portal Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute permission="admin:view-dashboard">
                <AppShell>
                  <CoordinatorDashboardPage />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/teachers"
            element={
              <ProtectedRoute permission="admin:view-dashboard">
                <AppShell>
                  <CoordinatorDashboardPage defaultTab="TEACHER" />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/students"
            element={
              <ProtectedRoute permission="admin:view-dashboard">
                <AppShell>
                  <CoordinatorDashboardPage defaultTab="STUDENT" />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/access"
            element={
              <ProtectedRoute permission="admin:view-dashboard">
                <AppShell>
                  <CoordinatorDashboardPage />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute permission="admin:view-dashboard">
                <AppShell>
                  <CoordinatorDashboardPage />
                </AppShell>
              </ProtectedRoute>
            }
          />

          {/* Projects / Teams list */}
          <Route
            path="/teams"
            element={
              <ProtectedRoute>
                <AppShell>
                  <TeamsListPage />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <AppShell>
                  <TeamsListPage />
                </AppShell>
              </ProtectedRoute>
            }
          />

          {/* Teacher Create Project */}
          <Route
            path="/teams/new"
            element={
              <ProtectedRoute permission="teacher:create-project">
                <AppShell>
                  <TeamCreationWizardPage />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/new"
            element={
              <ProtectedRoute permission="teacher:create-project">
                <AppShell>
                  <TeamCreationWizardPage />
                </AppShell>
              </ProtectedRoute>
            }
          />

          {/* Project Workspace */}
          <Route
            path="/teams/:id"
            element={
              <ProtectedRoute>
                <AppShell>
                  <TeamDetailPage />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:id"
            element={
              <ProtectedRoute>
                <AppShell>
                  <TeamDetailPage />
                </AppShell>
              </ProtectedRoute>
            }
          />

          {/* Convenience Workspace tab aliases */}
          <Route
            path="/contributions"
            element={
              <ProtectedRoute>
                <AppShell>
                  <TeamDetailPage />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/documents"
            element={
              <ProtectedRoute>
                <AppShell>
                  <TeamDetailPage />
                </AppShell>
              </ProtectedRoute>
            }
          />

          {/* Student Profile */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <AppShell>
                  <StudentProfilePage />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/students"
            element={
              <ProtectedRoute>
                <AppShell>
                  <StudentProfilePage />
                </AppShell>
              </ProtectedRoute>
            }
          />

          {/* Collaborator Discovery */}
          <Route
            path="/find-teammates"
            element={
              <ProtectedRoute>
                <AppShell>
                  <FindTeammatesPage />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/find-students"
            element={
              <ProtectedRoute>
                <AppShell>
                  <FindTeammatesPage />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/find-collaborators"
            element={
              <ProtectedRoute>
                <AppShell>
                  <FindTeammatesPage />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/collaboration-requests"
            element={
              <ProtectedRoute>
                <AppShell>
                  <CollaborationRequestsPage />
                </AppShell>
              </ProtectedRoute>
            }
          />

          {/* Project Chat */}
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <AppShell>
                  <PrivateChatPage />
                </AppShell>
              </ProtectedRoute>
            }
          />

          {/* Notifications */}
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <AppShell>
                  <NotificationsPage />
                </AppShell>
              </ProtectedRoute>
            }
          />

          {/* Audit Logs */}
          <Route
            path="/audit"
            element={
              <ProtectedRoute permission="audit:view">
                <AppShell>
                  <AuditLogPage />
                </AppShell>
              </ProtectedRoute>
            }
          />

          {/* Platform Settings */}
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <AppShell>
                  <SettingsPage />
                </AppShell>
              </ProtectedRoute>
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
