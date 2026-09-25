import React from 'react';
import { useApp } from '../context/AppContext';
import { can } from './authorization';
import { PermissionKey, ResourceObject } from './auth.types';
import { ShieldAlert, ArrowLeft, LayoutDashboard, Lock } from 'lucide-react';
import { Button } from '../components/common/Button';
import { useNavigate } from 'react-router-dom';

export const AccessRestrictedPage: React.FC<{ reason?: string }> = ({ reason }) => {
  const navigate = useNavigate();
  const { currentUser } = useApp();

  const getDashboardPath = () => {
    if (currentUser.role === 'STAFF_COORDINATOR' || currentUser.role === 'DEPARTMENT_HEAD') {
      return '/dashboard';
    }
    return '/teams/team-alpha';
  };

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-8 animate-in fade-in duration-200">
      <div className="p-4 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 mb-4 border border-rose-200 dark:border-rose-800 shadow-lg">
        <ShieldAlert className="w-12 h-12" />
      </div>

      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs font-bold mb-2">
        <Lock className="w-3.5 h-3.5" /> 403 Access Restricted
      </div>

      <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
        Unauthorized Operation / Scope Constraint
      </h1>

      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mt-2 leading-relaxed">
        {reason || `Your current role (${currentUser.role.replace('_', ' ')}) or object scope does not possess authorization to view this resource.`}
      </p>

      <div className="flex items-center gap-3 mt-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(-1)}
          icon={<ArrowLeft className="w-3.5 h-3.5" />}
        >
          Go Back
        </Button>

        <Button
          variant="primary"
          size="sm"
          onClick={() => navigate(getDashboardPath())}
          icon={<LayoutDashboard className="w-3.5 h-3.5" />}
        >
          Return to My Dashboard
        </Button>
      </div>
    </div>
  );
};

interface CanProps {
  permission: PermissionKey;
  resource?: ResourceObject;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const Can: React.FC<CanProps> = ({
  permission,
  resource,
  children,
  fallback = null
}) => {
  const { currentUser } = useApp();
  const allowed = can(currentUser, permission, resource);

  if (!allowed) return <>{fallback}</>;
  return <>{children}</>;
};

interface ProtectedRouteProps {
  permission: PermissionKey;
  resource?: ResourceObject;
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  permission,
  resource,
  children
}) => {
  const { currentUser } = useApp();
  const allowed = can(currentUser, permission, resource);

  if (!allowed) {
    return <AccessRestrictedPage />;
  }

  return <>{children}</>;
};

interface ProtectedActionProps {
  permission: PermissionKey;
  resource?: ResourceObject;
  children: React.ReactNode;
}

export const ProtectedAction: React.FC<ProtectedActionProps> = ({
  permission,
  resource,
  children
}) => {
  const { currentUser } = useApp();
  const allowed = can(currentUser, permission, resource);

  if (!allowed) return null;
  return <>{children}</>;
};
