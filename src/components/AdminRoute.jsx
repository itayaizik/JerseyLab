import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAdmin } from '@/hooks/useAdmin';

export default function AdminRoute() {
  const { isAdmin, loading, user } = useAdmin();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-pitch">
        <div className="w-8 h-8 border-4 border-varnish border-t-turf rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  return <Outlet />;
}