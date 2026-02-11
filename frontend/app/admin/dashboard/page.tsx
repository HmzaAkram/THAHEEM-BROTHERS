'use client';

import { DashboardLayout } from '@/components/dashboard-layout';
import { DashboardCard } from '@/components/dashboard-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useData } from '@/context/data-context';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import {
  TrendingUp,
  DollarSign,
  FileText,
  CreditCard,
  Download,
  Printer,
  Users
} from 'lucide-react';
import { useMemo } from 'react';

export default function AdminDashboard() {
  const { getDashboardStats, bills, payments, companies } = useData();
  const stats = getDashboardStats();

  // Compute Monthly Data for the last 6 months
  const monthlyData = useMemo(() => {
    const months: { month: string; bills: number; payments: number; year: number; monthIndex: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push({
        month: d.toLocaleString('default', { month: 'short' }),
        bills: 0,
        payments: 0,
        year: d.getFullYear(),
        monthIndex: d.getMonth()
      });
    }

    bills.forEach(bill => {
      const billDate = new Date(bill.date);
      const monthData = months.find(m => m.monthIndex === billDate.getMonth() && m.year === billDate.getFullYear());
      if (monthData) {
        monthData.bills += bill.totalAmount;
      }
    });

    payments.forEach(payment => {
      const paymentDate = new Date(payment.date);
      const monthData = months.find(m => m.monthIndex === paymentDate.getMonth() && m.year === paymentDate.getFullYear());
      if (monthData) {
        monthData.payments += payment.amount;
      }
    });

    return months;
  }, [bills, payments]);

  // Recent Actions (merged and sorted)
  const recentActions = useMemo(() => {
    const recentBills = bills.map(b => ({
      type: 'BILL',
      title: `Invoice #${b.billNo} Created`,
      subtitle: `${b.companyName} • ${new Date(b.createdAt).toLocaleDateString()}`,
      amount: b.totalAmount,
      date: new Date(b.createdAt),
      id: b.id
    }));

    const recentPayments = payments.map(p => ({
      type: 'PAYMENT',
      title: `Payment Received`,
      subtitle: `${p.companyName} • ${new Date(p.createdAt).toLocaleDateString()}`,
      amount: p.amount,
      date: new Date(p.createdAt),
      id: p.id
    }));

    const newCompanies = companies.map(c => ({
      type: 'COMPANY',
      title: `New Company Added`,
      subtitle: `${c.name} • ${new Date(c.createdAt).toLocaleDateString()}`,
      amount: 0,
      date: new Date(c.createdAt),
      id: c.id
    }));

    return [...recentBills, ...recentPayments, ...newCompanies]
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 5);
  }, [bills, payments, companies]);

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent drop-shadow-sm">
              Dashboard
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Overview of your clearing & forwarding business.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="gap-2 shadow-sm hover:bg-muted/80 transition-colors">
              <Printer className="w-4 h-4" />
              Print
            </Button>
            <Button className="gap-2 shadow-md bg-primary hover:bg-blue-600 transition-all hover:scale-105 active:scale-95">
              <Download className="w-4 h-4" />
              Export Report
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <DashboardCard
            title="Total Companies"
            value={stats.activeCompanies.toString()}
            icon={Users}
            change="Active Clients"
            changeType="neutral"
          />
          <DashboardCard
            title="Total Billed"
            value={`PKR ${(stats.totalBilled / 1000).toFixed(1)}K`}
            icon={FileText}
            change="All time"
            changeType="neutral"
          />
          <DashboardCard
            title="Total Collected"
            value={`PKR ${(stats.totalCollected / 1000).toFixed(1)}K`}
            icon={CreditCard}
            change="All time"
            changeType="positive"
          />
          <DashboardCard
            title="Outstanding Balance"
            value={`PKR ${(stats.outstanding / 1000).toFixed(1)}K`}
            icon={DollarSign}
            change="To be collected"
            changeType={stats.outstanding > 0 ? "negative" : "positive"}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 shadow-xl border-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md ring-1 ring-black/5 dark:ring-white/10">
            <CardHeader>
              <CardTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500">
                Financial Overview
              </CardTitle>
              <p className="text-xs text-muted-foreground">Revenue vs Collections over the last 6 months</p>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorBills" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.2} />
                      </linearGradient>
                      <linearGradient id="colorPayments" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.2} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                    <XAxis
                      dataKey="month"
                      stroke="var(--muted-foreground)"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="var(--muted-foreground)"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `PKR ${value / 1000}k`}
                    />
                    <Tooltip
                      cursor={{ fill: 'var(--muted)', opacity: 0.2 }}
                      contentStyle={{
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: '12px',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                    <Bar
                      dataKey="bills"
                      fill="url(#colorBills)"
                      name="Billed"
                      radius={[6, 6, 0, 0]}
                      barSize={24}
                    />
                    <Bar
                      dataKey="payments"
                      fill="url(#colorPayments)"
                      name="Collected"
                      radius={[6, 6, 0, 0]}
                      barSize={24}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-xl border-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md ring-1 ring-black/5 dark:ring-white/10 flex flex-col">
            <CardHeader>
              <CardTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-500">
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto pr-2">
              <div className="space-y-4">
                {recentActions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-muted-foreground opacity-50">
                    <FileText className="w-10 h-10 mb-2" />
                    <p>No recent activity.</p>
                  </div>
                ) : (
                  recentActions.map((action, i) => (
                    <div key={action.id} className="flex items-start justify-between group p-3 rounded-lg hover:bg-white/50 dark:hover:bg-slate-800/50 transition-all duration-200 border border-transparent hover:border-border/50 shadow-sm hover:shadow-md">
                      <div className="flex gap-4 items-center">
                        <div className={`p-2 rounded-full ring-2 ring-opacity-20 ${action.type === 'BILL' ? 'bg-blue-100 text-blue-600 ring-blue-500' :
                            action.type === 'PAYMENT' ? 'bg-green-100 text-green-600 ring-green-500' :
                              'bg-orange-100 text-orange-600 ring-orange-500'
                          }`}>
                          {action.type === 'BILL' && <FileText className="w-4 h-4" />}
                          {action.type === 'PAYMENT' && <DollarSign className="w-4 h-4" />}
                          {action.type === 'COMPANY' && <Users className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                            {action.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {action.subtitle}
                          </p>
                        </div>
                      </div>
                      {action.amount > 0 && (
                        <span className={`text-sm font-bold font-mono ${action.type === 'PAYMENT' ? 'text-green-600' : 'text-foreground'
                          }`}>
                          {action.type === 'PAYMENT' ? '+' : ''}
                          {action.amount.toLocaleString()}
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
            <div className="p-6 pt-0 mt-auto">
              <Button variant="ghost" className="w-full text-muted-foreground hover:text-primary hover:bg-primary/5 group" size="sm">
                View All Activity
                <span className="inline-block transition-transform group-hover:translate-x-1 ml-1">→</span>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
