'use client';

import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { ReactNode } from 'react';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { role, logout } = useAuth();
  const router = useRouter();

  if (!role) {
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar role={role} onLogout={handleLogout} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto px-4 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
