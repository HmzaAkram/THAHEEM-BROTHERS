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
  ShieldCheck,
  Database,
  MessageSquare,
  Receipt,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  user: {
    name: string;
    role: 'admin' | 'company' | string;
  } | null;
  onLogout: () => void;
}

export function Sidebar({ user, onLogout }: SidebarProps) {
  const role = user?.role.toLowerCase() || 'user';
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const adminLinks = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: BarChart3 },
    { href: '/admin/companies', label: 'Companies', icon: Building2 },
    { href: '/admin/bills', label: 'Bills', icon: FileText },
    { href: '/admin/sale-tax', label: 'Sale Tax (SRB)', icon: Receipt },
    { href: '/admin/payments', label: 'Payments', icon: CreditCard },
    { href: '/admin/ledger', label: 'Ledger', icon: BookOpen },
    { href: '/admin/reports', label: 'Reports', icon: FileBarChart },
    { href: '/admin/securities', label: 'Securities', icon: ShieldCheck },
    { href: '/admin/backup', label: 'Backup', icon: Database },
    { href: '/admin/queries', label: 'Queries', icon: MessageSquare },
  ];

  const companyLinks = [
    { href: '/company/dashboard', label: 'Dashboard', icon: BarChart3 },
    { href: '/company/bills', label: 'My Bills', icon: FileText },
    { href: '/company/ledger', label: 'Ledger', icon: BookOpen },
    { href: '/company/summary', label: 'Account Summary', icon: CreditCard },
    { href: '/company/queries', label: 'My Queries', icon: MessageSquare },
  ];

  const links = role === 'admin' ? adminLinks : companyLinks;

  return (
    <>
      {/* Mobile Menu Toggle - Improved positioning and visibility */}
      <div className="lg:hidden fixed top-0 left-0 z-[60] p-4">
        <Button
          variant="secondary"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="shadow-lg bg-slate-900 border-slate-700 text-white hover:bg-slate-800 transition-all rounded-xl w-10 h-10 ring-2 ring-primary/20"
        >
          {isOpen ? <X className="w-5 h-5 shadow-sm" /> : <Menu className="w-5 h-5 shadow-sm" />}
        </Button>
      </div>

      <aside
        className={`${isOpen ? 'translate-x-0' : '-translate-x-full'
          } transition-transform duration-300 lg:translate-x-0 fixed lg:static left-0 top-0 pt-16 lg:pt-0 h-screen w-64 bg-sidebar-background border-r border-sidebar-border flex flex-col z-40 bg-gradient-to-b from-slate-900 to-slate-800 text-white shadow-2xl`}
      >
        <div className="px-6 py-8">
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
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
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group relative overflow-hidden ${isActive
                  ? 'bg-primary text-white shadow-lg shadow-primary/25 translate-x-1'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white hover:translate-x-1'
                  }`}
              >
                <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-300'}`} />
                <span className="font-medium relative z-10">{link.label}</span>
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-transparent pointer-events-none" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-700/50 bg-slate-900/50">
          <Button
            onClick={onLogout}
            variant="ghost"
            className="w-full justify-start gap-2 text-slate-300 hover:text-red-400 hover:bg-red-900/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </Button>
        </div>
      </aside>

      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
