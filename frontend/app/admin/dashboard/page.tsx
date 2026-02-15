'use client';

import { DashboardLayout } from '@/components/dashboard-layout';
import { DashboardCard } from '@/components/dashboard-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useData } from '@/context/data-context';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { useMemo, useState, useRef } from 'react';
import { formatDate } from '@/lib/utils';
import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image';

export default function AdminDashboard() {
  const { bills, payments, companies } = useData();
  const [filterType, setFilterType] = useState('overall');
  const reportRef = useRef<HTMLDivElement>(null);

  // Compute Filtered Stats
  const filteredStats = useMemo(() => {
    const now = new Date();
    let startDate: Date | null = null;

    if (filterType === 'monthly') {
      startDate = new Date();
      startDate.setMonth(now.getMonth() - 1); // Last 30 days roughly
    } else if (filterType === '3_months') {
      startDate = new Date();
      startDate.setMonth(now.getMonth() - 3); // Last 90 days
    } else if (filterType === '6_months') {
      startDate = new Date();
      startDate.setMonth(now.getMonth() - 6); // Last 180 days
    } else if (filterType === 'yearly') {
      startDate = new Date();
      startDate.setFullYear(now.getFullYear() - 1); // Last 365 days
    }

    const filteredBills = startDate
      ? bills.filter(b => new Date(b.createdAt) >= startDate!)
      : bills;

    const filteredPayments = startDate
      ? payments.filter(p => new Date(p.createdAt) >= startDate!)
      : payments;

    const filteredCompanies = startDate
      ? companies.filter(c => new Date(c.createdAt) >= startDate!)
      : companies;

    const totalBilled = filteredBills.reduce((sum, bill) => sum + bill.totalAmount, 0);
    const totalCollected = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);
    // Outstanding logic: 
    // If we want "Outstanding created in this period", it is (BilledInPeriod - CollectedInPeriod).
    // If we want "Total Outstanding", it stays same.
    // User context implies "Monthly Stats" -> Performance of this month. So flow metric is better.
    const outstanding = totalBilled - totalCollected;

    // For "Total Companies", if filtered, we show "New Companies". If overall, "Total".
    // We can change the label dynamically.
    const activeCompanies = filteredCompanies.length;

    return { totalBilled, totalCollected, outstanding, activeCompanies };
  }, [bills, payments, companies, filterType]);

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
      subtitle: `${b.companyName} • ${formatDate(b.createdAt)}`,
      amount: b.totalAmount,
      date: new Date(b.createdAt),
      id: b.id
    }));

    const recentPayments = payments.map(p => ({
      type: 'PAYMENT',
      title: `Payment Received`,
      subtitle: `${p.companyName} • ${formatDate(p.createdAt)}`,
      amount: p.amount,
      date: new Date(p.createdAt),
      id: p.id
    }));

    const newCompanies = companies.map(c => ({
      type: 'COMPANY',
      title: `New Company Added`,
      subtitle: `${c.name} • ${formatDate(c.createdAt)}`,
      amount: 0,
      date: new Date(c.createdAt),
      id: c.id
    }));

    return [...recentBills, ...recentPayments, ...newCompanies]
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 5);
  }, [bills, payments, companies]);

  const filterLabel = useMemo(() => {
    switch (filterType) {
      case 'monthly': return "Last Month";
      case '3_months': return "Last 3 Months";
      case '6_months': return "Last 6 Months";
      case 'yearly': return "Last Year";
      default: return "All Time";
    }
  }, [filterType]);

  const handlePrint = () => {
    window.print();
  };

  const handleExport = async () => {
    if (!reportRef.current) return;

    try {
      // 1. Show the print header temporarily for the capture
      const header = reportRef.current.querySelector('.print-header');
      const footer = reportRef.current.querySelector('.print-only'); // if any
      if (header) header.classList.remove('hidden');
      if (footer) footer.classList.remove('hidden');

      // 2. Capture the element as PNG
      // We use a slight delay or specify quality for better results
      const dataUrl = await toPng(reportRef.current, {
        backgroundColor: '#f8fafc',
        style: {
          padding: '20px',
        }
      });

      // 3. Reset visibility
      if (header) header.classList.add('hidden');
      if (footer) footer.classList.add('hidden');

      // 4. Create jsPDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);

      const dateStr = new Date().toISOString().split('T')[0];
      pdf.save(`Business_Report_${dateStr}.pdf`);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <DashboardLayout>
      <div ref={reportRef} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 bg-slate-50 p-4 rounded-xl">
        {/* Print Only Header */}
        <div className="hidden print:block print-header mb-8 pb-4 border-b-2 border-slate-900">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">THAHEEM BROTHERS</h1>
              <p className="text-sm font-bold text-slate-600">Business Performance Report</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-slate-900">Date: {formatDate(new Date())}</p>
              <p className="text-xs text-slate-600 uppercase tracking-widest font-black">{filterLabel}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent drop-shadow-sm">
              Dashboard
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Overview of your clearing & forwarding business.
            </p>
          </div>
          <div className="flex gap-3 items-center">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px] shadow-sm">
                <SelectValue placeholder="Select Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overall">Overall Stats</SelectItem>
                <SelectItem value="monthly">Monthly Stats</SelectItem>
                <SelectItem value="3_months">3 Months Stats</SelectItem>
                <SelectItem value="6_months">6 Months Stats</SelectItem>
                <SelectItem value="yearly">Yearly Stats</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              className="gap-2 shadow-sm hover:bg-muted/80 transition-colors"
              onClick={handlePrint}
            >
              <Printer className="w-4 h-4" />
              Print
            </Button>
            <Button
              className="gap-2 shadow-md bg-primary hover:bg-blue-600 transition-all hover:scale-105 active:scale-95"
              onClick={handleExport}
            >
              <Download className="w-4 h-4" />
              Export Report
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <DashboardCard
            title={filterType === 'overall' ? "Total Companies" : "New Companies"}
            value={filteredStats.activeCompanies.toString()}
            icon={Users}
            change={filterLabel}
            changeType="neutral"
          />
          <DashboardCard
            title={filterType === 'overall' ? "Total Billed" : "Billed"}
            value={`PKR ${(filteredStats.totalBilled / 1000).toFixed(1)}K`}
            icon={FileText}
            change={filterLabel}
            changeType="neutral"
          />
          <DashboardCard
            title={filterType === 'overall' ? "Total Collected" : "Collected"}
            value={`PKR ${(filteredStats.totalCollected / 1000).toFixed(1)}K`}
            icon={CreditCard}
            change={filterLabel}
            changeType="positive"
          />
          <DashboardCard
            title={filterType === 'overall' ? "Outstanding Balance" : "Outstanding"}
            value={`PKR ${(filteredStats.outstanding / 1000).toFixed(1)}K`}
            icon={DollarSign}
            change={filterLabel}
            changeType={filteredStats.outstanding > 0 ? "negative" : "positive"}
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
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
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
                      tickFormatter={(value: number) => `PKR ${value / 1000}k`}
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

        {/* Print Only: Detailed Pending Bills */}
        <div className="hidden print:block mt-8">
          <h2 className="text-xl font-bold mb-4 border-b pb-2">Detail of Pending Bills (Unpaid)</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Bill No</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Job No</TableHead>
                <TableHead className="text-right">Balance Due</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bills.filter(b => b.status !== 'Paid').length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">No pending bills</TableCell>
                </TableRow>
              ) : (
                bills.filter(b => b.status !== 'Paid').map((bill) => (
                  <TableRow key={bill.id}>
                    <TableCell className="text-xs">{formatDate(bill.date)}</TableCell>
                    <TableCell className="text-xs font-bold">{bill.billNo}</TableCell>
                    <TableCell className="text-xs">{bill.companyName}</TableCell>
                    <TableCell className="text-xs font-mono">{bill.jobNumber}</TableCell>
                    <TableCell className="text-xs text-right font-bold">
                      PKR {(bill.totalAmount - (bill.paidAmount || 0)).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <div className="mt-4 text-right">
            <p className="text-sm font-black">
              Total Outstanding: PKR {bills.reduce((s, b) => s + (b.totalAmount - (b.paidAmount || 0)), 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
