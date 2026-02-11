'use client';

import { useAuth } from '@/context/auth-context';
import { Login } from '@/components/login';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { role, isHydrated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isHydrated) return;
    
    if (role === 'admin') {
      router.push('/admin/dashboard');
    } else if (role === 'company') {
      router.push('/company/dashboard');
    }
  }, [role, isHydrated, router]);

  // Show nothing while hydrating
  if (!isHydrated) {
    return null;
  }

  if (role) {
    return null;
  }

  return <Login />;
}
