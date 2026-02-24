'use client';

import { DashboardLayout } from '@/components/dashboard-layout';
import { DashboardCard } from '@/components/dashboard-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useData } from '@/context/data-context';
import { useAuth } from '@/context/auth-context';
import { formatDate } from '@/lib/utils';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Download, DollarSign, FileText, TrendingUp, Phone, Mail, MapPin, Loader2 } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { Label } from '@/components/ui/label';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const statusStyles = {
  Paid: 'bg-green-100 text-green-800 border-green-200',
  Partial: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  Unpaid: 'bg-red-100 text-red-800 border-red-200',
};

import { CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function CompanyDashboard() {
  const { user, isHydrated: authHydrated } = useAuth();
  const { companies, bills, payments, getCompanyBalance, getCompanyLedger, isLoaded } = useData();
  const ledgerRef = useRef<HTMLDivElement>(null);
  const [downloadLoading, setDownloadLoading] = useState(false);

  // SIMULATE LOGGED IN USER (Get current user company or first one)
  const currentCompany = useMemo(() => {
    if (user?.role === 'company' && user.id) {
      return companies.find(c => String(c.id) === String(user.id)) || companies[0];
    }
    return companies[0];
  }, [user, companies]);

  const companyBills = useMemo(() => {
    if (!currentCompany) return [];
    return bills.filter(b => String(b.companyId) === String(currentCompany.id)).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [bills, currentCompany]);

  const companyPayments = useMemo(() => {
    if (!currentCompany) return [];
    return payments.filter(p => String(p.companyId) === String(currentCompany.id));
  }, [payments, currentCompany]);

  const stats = useMemo(() => {
    if (!currentCompany) return { billed: 0, paid: 0, outstanding: 0 };
    const billed = companyBills.reduce((sum, b) => sum + (Number(b.grandTotal) || 0), 0);
    const paid =
      companyBills.reduce((sum, b) => sum + (Number(b.advancePayment) || 0), 0) +
      companyPayments.reduce((sum, p) => sum + (Number(p.amount) || 0) + (Number(p.adjustment) || 0), 0);
    return { billed, paid, outstanding: billed - paid };
  }, [companyBills, companyPayments, currentCompany]);

  const last6Months = useMemo(() => {
    if (!currentCompany) return [];
    const monthsData: { month: string; amount: number; year: number; monthIndex: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      monthsData.push({
        month: d.toLocaleString('default', { month: 'short' }),
        amount: 0,
        year: d.getFullYear(),
        monthIndex: d.getMonth()
      });
    }

    companyBills.forEach(bill => {
      const d = new Date(bill.date);
      const m = monthsData.find(mo => mo.monthIndex === d.getMonth() && mo.year === d.getFullYear());
      if (m) {
        m.amount += (Number(bill.grandTotal) || 0);
      }
    });

    return monthsData;
  }, [companyBills, currentCompany]);

  const recentActivity = useMemo(() => {
    const combined = [
      ...companyBills.map(b => ({
        id: b.id,
        type: 'BILL' as const,
        title: `Job #${b.jobNumber || 'N/A'}`,
        subtitle: `Date: ${formatDate(b.date)}`,
        date: b.createdAt,
        amount: b.grandTotal,
        status: b.calculatedStatus,
        isNew: (new Date().getTime() - new Date(b.createdAt).getTime()) < 48 * 60 * 60 * 1000
      })),
      ...companyPayments.map(p => ({
        id: p.id,
        type: 'PAYMENT' as const,
        title: `Payment Confirmed`,
        subtitle: `Received: ${formatDate(p.date)}`,
        date: p.createdAt,
        amount: Number(p.amount) + (Number(p.adjustment) || 0),
        status: 'Paid' as const,
        isNew: false
      }))
    ];

    return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);
    return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);
  }, [companyBills, companyPayments]);

  const ledger = useMemo(() => {
    if (!currentCompany) return [];
    return getCompanyLedger(currentCompany.id);
  }, [currentCompany, getCompanyLedger]);

  const summary = useMemo(() => {
    const totalDebit = ledger.reduce((sum, entry) => sum + entry.debit, 0);
    const totalCredit = ledger.reduce((sum, entry) => sum + entry.credit, 0);
    return {
      totalDebit,
      totalCredit,
      balance: totalDebit - totalCredit
    };
  }, [ledger]);

  const handleDownloadStatement = async () => {
    setDownloadLoading(true);

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();

      // Add Logo
      const img = new Image();
      img.src = '/logo.PNG'; // Ensure this matches the correct path

      await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve; // Continue even if logo fails
      });

      if (img.width > 0) {
        const maxLogoHeight = 20;
        const maxLogoWidth = 60;
        let logoWidth = img.width;
        let logoHeight = img.height;

        const ratio = Math.min(maxLogoWidth / logoWidth, maxLogoHeight / logoHeight);
        logoWidth *= ratio;
        logoHeight *= ratio;

        pdf.addImage(img, 'PNG', (pageWidth - logoWidth) / 2, 10, logoWidth, logoHeight);
      }

      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.text("Account Statement", pageWidth / 2, 38, { align: "center" });

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");

      pdf.text(`Company: ${currentCompany.name}`, 14, 48);
      pdf.text(`Email: ${currentCompany.email || 'N/A'}`, 14, 54);
      pdf.text(`Phone: ${currentCompany.phone || 'N/A'}`, 14, 60);
      pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 66);

      let body = ledger.map((entry) => [
        formatDate(entry.date),
        entry.description,
        entry.debit > 0 ? entry.debit.toLocaleString() : '-',
        entry.credit > 0 ? entry.credit.toLocaleString() : '-',
        entry.balance.toLocaleString()
      ]);

      if (body.length === 0) {
        body.push(['-', 'No records found', '-', '-', '-']);
      }

      autoTable(pdf, {
        startY: 74,
        head: [['Date', 'Description', 'Debit', 'Credit', 'Balance']],
        body: body,
        theme: 'grid',
        headStyles: { fillColor: [44, 62, 80], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 20 },
          2: { halign: 'right' },
          3: { halign: 'right' },
          4: { halign: 'right', fontStyle: 'bold' }
        },
        didParseCell: function (data) {
          if (data.section === 'body') {
            if (data.column.index === 4) {
              const valStr = data.cell.text[0] || '';
              const numStr = valStr.replace(/[^0-9.-]/g, '');
              const numVal = parseFloat(numStr);
              if (!isNaN(numVal)) {
                if (numVal > 0) {
                  data.cell.styles.textColor = [220, 38, 38];
                } else if (numVal <= 0) {
                  data.cell.styles.textColor = [0, 128, 0];
                }
              }
            }
          }
        }
      });

      // Add Summary Totals at the bottom
      const finalY = (pdf as any).lastAutoTable.finalY || 74;

      pdf.setFontSize(11);
      pdf.setFont("helvetica", "bold");
      pdf.text("Summary Totals", 14, finalY + 10);

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");

      pdf.text(`Total Debit:   PKR ${summary.totalDebit.toLocaleString()}`, 14, finalY + 18);
      pdf.text(`Total Credit:  PKR ${summary.totalCredit.toLocaleString()}`, 14, finalY + 24);

      pdf.setFont("helvetica", "bold");
      pdf.text(`Balance:       PKR ${summary.balance.toLocaleString()}`, 14, finalY + 30);

      pdf.save(`Account_Statement_${currentCompany.name.replace(/[/\\?%*:|"<>\s]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('Statement downloaded successfully');
    } catch (err) {
      console.error('Failed to export PDF', err);
      toast.error('Failed to generate statement. Please try again.');
    } finally {
      setDownloadLoading(false);
    }
  };

  if (!authHydrated || !isLoaded) {
    return (
      <DashboardLayout>
        <div className="flex h-full items-center justify-center p-10 animate-in fade-in">
          <div className="flex flex-col items-center gap-4 text-muted-foreground">
            <Loader2 className="w-10 h-10 animate-spin text-primary opacity-50" />
            <p className="font-medium animate-pulse">Loading dashboard data...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!currentCompany) {
    return (
      <DashboardLayout>
        <div className="flex h-full items-center justify-center p-10 text-muted-foreground animate-in fade-in">
          No company data available. Please contact the administrator to set up your profile.
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-8 rounded-2xl shadow-2xl text-white relative overflow-hidden border border-slate-700/50">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
          <div className="relative z-10">
            <h1 className="text-3xl font-bold mb-2">Client Portal</h1>
            <p className="text-slate-300">
              Welcome back, <span className="font-semibold text-blue-300">{currentCompany.name}</span>
            </p>
            <div className="flex flex-wrap gap-2 sm:gap-4 mt-6">
              <div className="flex items-center gap-2 text-xs sm:text-sm bg-black/20 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full border border-white/10 shrink-0">
                <Mail className="w-3 h-3 text-blue-400" />
                <span className="truncate max-w-[200px] sm:max-w-none">{currentCompany.email}</span>
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm bg-black/20 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full border border-white/10 shrink-0">
                <Phone className="w-3 h-3 text-green-400" />
                {currentCompany.phone}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {recentActivity.find(a => a.type === 'PAYMENT') && (
            <DashboardCard
              title="Last Payment Success"
              value={`PKR ${recentActivity.find(a => a.type === 'PAYMENT')?.amount.toLocaleString()}`}
              icon={CheckCircle2}
              change={new Date(recentActivity.find(a => a.type === 'PAYMENT')?.date || '').toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
              changeType="positive"
              changeLabel=""
            />
          )}
          <DashboardCard
            title="Total Billed"
            value={`PKR ${(stats.billed / 1000).toFixed(1)}K`}
            icon={FileText}
            change="All time total"
            changeType="neutral"
          />
          <DashboardCard
            title="Total Paid"
            value={`PKR ${(stats.paid / 1000).toFixed(1)}K`}
            icon={DollarSign}
            change="Total payments"
            changeType="positive"
          />
          <DashboardCard
            title="Outstanding Balance"
            value={`PKR ${stats.outstanding.toLocaleString()}`}
            icon={TrendingUp}
            change="Amount due"
            changeType={stats.outstanding > 0 ? "negative" : "positive"}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 shadow-xl border-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md ring-1 ring-black/5 dark:ring-white/10">
            <CardHeader>
              <CardTitle className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500 font-bold text-xl">
                Billing History (Last 6 Months)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={last6Months} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
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
                      contentStyle={{
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: '12px',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke="hsl(var(--primary))"
                      strokeWidth={4}
                      dot={{ fill: 'hsl(var(--primary))', r: 6, strokeWidth: 3, stroke: 'var(--background)' }}
                      activeDot={{ r: 8 }}
                      fill="url(#colorAmount)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-xl border-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md ring-1 ring-black/5 dark:ring-white/10 flex flex-col">
            <CardHeader>
              <CardTitle className="text-base font-semibold uppercase tracking-wider text-muted-foreground">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto pr-2">
              <div className="space-y-3">
                {recentActivity.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground italic text-sm">
                    No recent activity found.
                  </div>
                ) : (
                  recentActivity.map((activity, idx) => (
                    <div
                      key={`${activity.type}-${activity.id}`}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all duration-200 border border-transparent hover:border-primary/20 hover:scale-[1.01] group"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">{activity.title}</p>
                          {activity.isNew && (
                            <span className="bg-primary text-white text-[8px] font-black px-1.5 py-0.5 rounded animate-pulse">NEW</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold text-sm ${activity.type === 'BILL' ? 'text-foreground' : 'text-green-600'}`}>
                          {activity.type === 'BILL' ? '-' : '+'} PKR {activity.amount.toLocaleString()}
                        </p>
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full inline-block mt-1 ${activity.status === 'Paid' ? 'bg-green-100 text-green-700' :
                            activity.status === 'Partial' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}
                        >
                          {activity.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
            <div className="p-6 pt-0 mt-auto">
              <Button
                className="w-full gap-2 group shadow-md bg-white text-foreground hover:bg-slate-50 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 border border-border/50"
                variant="secondary"
                onClick={handleDownloadStatement}
                disabled={downloadLoading}
              >
                {downloadLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 group-hover:text-primary transition-colors" />}
                Download Statement
              </Button>
            </div>
          </Card>
        </div>


        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-600 to-blue-800 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-blue-100 text-sm font-medium mb-1">Account Status</p>
                  <h3 className="text-2xl font-bold flex items-center gap-2">
                    Active <span className="flex h-3 w-3 rounded-full bg-green-400 animate-pulse" />
                  </h3>
                </div>
                <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="bg-white/10 rounded-lg p-3 text-sm border border-white/10">
                Payment Terms: <span className="font-bold">Net 30</span>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
            <CardContent className="p-6 flex items-center justify-between h-full">
              <div>
                <p className="text-sm text-muted-foreground font-medium mb-1">Registered Address</p>
                <div className="flex items-start gap-2">
                  <MapPin className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <span className="font-medium text-lg leading-snug">{currentCompany.address}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

    </DashboardLayout >
  );
}
