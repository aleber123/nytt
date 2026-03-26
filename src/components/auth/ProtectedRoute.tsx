import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import type { Permission } from '@/firebase/userService';
import dynamic from 'next/dynamic';

const ReminderBell = dynamic(() => import('@/components/admin/ReminderBell'), { ssr: false });

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: Permission;
}

export default function ProtectedRoute({ children, requiredPermission }: ProtectedRouteProps) {
  const { currentUser, adminUser, loading, hasPermission } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [adminCheckDone, setAdminCheckDone] = useState(false);

  // Fix hydration mismatch - only render after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Delay the "not admin" check to avoid race condition during MFA login
  useEffect(() => {
    if (!loading && currentUser && adminUser === null) {
      const timer = setTimeout(() => setAdminCheckDone(true), 1500);
      return () => clearTimeout(timer);
    }
    if (adminUser) {
      setAdminCheckDone(false);
    }
  }, [loading, currentUser, adminUser]);

  useEffect(() => {
    if (mounted && !loading && !currentUser) {
      router.push('/admin/login');
    } else if (mounted && !loading && currentUser && adminUser === null && adminCheckDone) {
      // User is authenticated but not an admin – redirect away
      router.push('/');
    } else if (mounted && !loading && adminUser && requiredPermission && !hasPermission(requiredPermission)) {
      // User lacks required permission – redirect to admin dashboard
      router.push('/admin');
    }
  }, [currentUser, adminUser, loading, router, mounted, requiredPermission, hasPermission, adminCheckDone]);

  // Always render the same loading state on server and initial client render
  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  if (!currentUser || !adminUser) {
    return null;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return null;
  }

  return (
    <>
      <ReminderBell />
      {children}
    </>
  );
}
