'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Building2,
  FileText,
  CreditCard,
  BookOpen,
  FileBarChart,
  Menu,
  X,
  LogOut,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  role: 'admin' | 'company';
  onLogout: () => void;
}

export function Sidebar({ role, onLogout }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(true);
  const pathname = usePathname();

  const adminLinks = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: BarChart3 },
    { href: '/admin/companies', label: 'Companies', icon: Building2 },
    { href: '/admin/bills', label: 'Bills', icon: FileText },
    { href: '/admin/payments', label: 'Payments', icon: CreditCard },
    { href: '/admin/ledger', label: 'Ledger', icon: BookOpen },
    { href: '/admin/reports', label: 'Reports', icon: FileBarChart },
  ];

  const companyLinks = [
    { href: '/company/dashboard', label: 'Dashboard', icon: BarChart3 },
    { href: '/company/bills', label: 'My Bills', icon: FileText },
    { href: '/company/ledger', label: 'Ledger', icon: BookOpen },
    { href: '/company/summary', label: 'Account Summary', icon: CreditCard },
  ];

  const links = role === 'admin' ? adminLinks : companyLinks;

  return (
    <>
      <div className="lg:hidden fixed top-0 left-0 z-50 p-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      <aside
        className={`${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform lg:translate-x-0 fixed lg:static left-0 top-0 pt-16 lg:pt-0 h-screen w-64 bg-sidebar-background border-r border-sidebar-border flex flex-col z-40`}
      >
        <div className="px-6 py-8">
          <h1 className="text-xl font-bold text-sidebar-primary">
            {role === 'admin' ? 'Admin Panel' : 'Company Portal'}
          </h1>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <Button
            onClick={onLogout}
            variant="outline"
            className="w-full justify-start gap-2 bg-transparent"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </Button>
        </div>
      </aside>

      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/20 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
