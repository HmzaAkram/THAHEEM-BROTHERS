'use client';

import { Sidebar } from '@/components/sidebar';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';

interface DashboardLayoutProps {
  children: ReactNode;
  role?: 'admin' | 'company';
}

export function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const { isAuthenticated, user, logout, isHydrated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isHydrated, router]);

  if (!isHydrated || !isAuthenticated) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950" suppressHydrationWarning>
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden" suppressHydrationWarning>
      <Sidebar user={user} onLogout={handleLogout} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="w-full px-2 sm:px-4 py-6 sm:py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
