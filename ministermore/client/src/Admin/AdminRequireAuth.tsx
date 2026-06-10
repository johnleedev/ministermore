import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { getAdminSession } from './adminSession';

export default function AdminRequireAuth({ children }: { children: ReactNode }) {
  if (!getAdminSession()) {
    return <Navigate to="/admin" replace />;
  }
  return <>{children}</>;
}
