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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
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
  Users,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Shield,
  Eye,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { useMemo, useState, useRef } from 'react';
import { formatDate } from '@/lib/utils';
import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image';

export default function AdminDashboard() {
  const { bills, payments, companies, securities } = useData();
  const [filterType, setFilterType] = useState('overall');
  const reportRef = useRef<HTMLDivElement>(null);
  const [securityFilter, setSecurityFilter] = useState<'all' | 'pending' | 'received'>('all');
  const [selectedSecurity, setSelectedSecurity] = useState<any>(null);
  const [isSecurityDialogOpen, setIsSecurityDialogOpen] = useState(false);

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

    const totalBilled = filteredBills.reduce((sum, bill) => sum + (Number(bill.totalAmount) || 0), 0);
    const totalCollected = filteredPayments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
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
        monthData.bills += (Number(bill.totalAmount) || 0);
      }
    });

    payments.forEach(payment => {
      const paymentDate = new Date(payment.date);
      const monthData = months.find(m => m.monthIndex === paymentDate.getMonth() && m.year === paymentDate.getFullYear());
      if (monthData) {
        monthData.payments += (Number(payment.amount) || 0);
      }
    });

    return months;
  }, [bills, payments]);

  // Recent Actions (merged and sorted)
  const recentBills = useMemo(() => {
    return bills.map(b => ({
      type: 'BILL',
      title: `Invoice #${b.billNo} Created`,
      subtitle: `${b.companyName} • ${formatDate(b.createdAt)}`,
      amount: Number(b.totalAmount) || 0,
      date: new Date(b.createdAt),
      id: b.id
    }))
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 10);
  }, [bills]);

  const recentPayments = useMemo(() => {
    return payments.map(p => ({
      type: 'PAYMENT',
      title: `Payment Received`,
      subtitle: `${p.companyName} • ${formatDate(p.createdAt)}`,
      amount: Number(p.amount) || 0,
      date: new Date(p.createdAt),
      id: p.id
    }))
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 10);
  }, [payments]);

  const recentActions = useMemo(() => {
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
  }, [recentBills, recentPayments, companies]);

  // Company Overview Search and Stats
  const [companySearch, setCompanySearch] = useState('');

  const companyFinancials = useMemo(() => {
    return companies.map(company => {
      const companyBills = bills.filter(b => String(b.companyId) === String(company.id));
      const companyPayments = payments.filter(p => String(p.companyId) === String(company.id));

      const debit = companyBills.reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);
      const credit = companyPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const balance = debit - credit;

      return {
        id: company.id,
        name: company.name,
        identifier: company.identifier,
        debit,
        credit,
        balance
      };
    });
  }, [companies, bills, payments]);

  const filteredCompanies = useMemo(() => {
    return companyFinancials.filter(c =>
      c.name.toLowerCase().includes(companySearch.toLowerCase()) ||
      (c.identifier && c.identifier.toLowerCase().includes(companySearch.toLowerCase()))
    );
  }, [companyFinancials, companySearch]);

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
          {/* Companies Overview Section */}
          <Card className="lg:col-span-2 shadow-xl border-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md ring-1 ring-black/5 dark:ring-white/10 overflow-hidden flex flex-col">
            <CardHeader className="pb-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <CardTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
                    Companies Overview
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">Financial health across your client base</p>
                </div>
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search companies..."
                    value={companySearch}
                    onChange={(e) => setCompanySearch(e.target.value)}
                    className="pl-9 bg-white/50 dark:bg-slate-950/50 border-border/50 h-9 rounded-lg"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-auto">
              <div className="min-w-[600px]">
                <Table>
                  <TableHeader className="bg-muted/30 sticky top-0 z-10">
                    <TableRow className="hover:bg-transparent border-b-0">
                      <TableHead className="py-3 px-6 font-bold text-xs uppercase tracking-wider">Company Name</TableHead>
                      <TableHead className="py-3 px-4 font-bold text-xs uppercase tracking-wider">Total Debit</TableHead>
                      <TableHead className="py-3 px-4 font-bold text-xs uppercase tracking-wider">Total Credit</TableHead>
                      <TableHead className="py-3 px-6 font-bold text-xs uppercase tracking-wider text-right">Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCompanies.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-64 text-center">
                          <div className="flex flex-col items-center justify-center text-muted-foreground/50">
                            <Users className="w-12 h-12 mb-3 opacity-20" />
                            <p className="font-semibold">No companies found</p>
                            <p className="text-xs">Try adjusting your search</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCompanies
                        .slice(0, companySearch ? undefined : 5)
                        .map((c) => (
                          <TableRow key={c.id} className="hover:bg-primary/5 transition-colors border-b border-border/40 group">
                            <TableCell className="py-4 px-6">
                              <div>
                                <p className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">{c.name}</p>
                                {c.identifier && <p className="text-[10px] text-muted-foreground uppercase font-black opacity-60">{c.identifier}</p>}
                              </div>
                            </TableCell>
                            <TableCell className="py-4 px-4 font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                              PKR {c.debit.toLocaleString()}
                            </TableCell>
                            <TableCell className="py-4 px-4 font-mono text-xs font-bold text-emerald-600">
                              PKR {c.credit.toLocaleString()}
                            </TableCell>
                            <TableCell className="py-4 px-6 text-right">
                              <div className="flex flex-col items-end">
                                <span className={`text-sm font-black font-mono tracking-tighter ${c.balance > 0 ? 'text-rose-600' : 'text-emerald-600'
                                  }`}>
                                  PKR {c.balance.toLocaleString()}
                                </span>
                                <div className={`mt-0.5 flex items-center gap-1 text-[10px] font-bold uppercase ${c.balance > 0 ? 'text-rose-500/70' : 'text-emerald-500/70'
                                  }`}>
                                  {c.balance > 0 ? (
                                    <>Receivable <ArrowUpRight className="w-2.5 h-2.5" /></>
                                  ) : (
                                    <>Cleared <ArrowDownRight className="w-2.5 h-2.5" /></>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-xl border-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md ring-1 ring-black/5 dark:ring-white/10 flex flex-col h-[600px]">
            <CardHeader className="pb-2 border-b border-border/50">
              <CardTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-500">
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto p-4">
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6 h-10 bg-muted/50 p-1">
                  <TabsTrigger value="all" className="text-[10px] font-black py-1.5 uppercase">General</TabsTrigger>
                  <TabsTrigger value="bills" className="text-[10px] font-black py-1.5 uppercase">Bills</TabsTrigger>
                  <TabsTrigger value="payments" className="text-[10px] font-black py-1.5 uppercase">Payments</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-0 focus-visible:ring-0">
                  <div className="space-y-3">
                    {recentActions.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-muted-foreground opacity-50">
                        <FileText className="w-10 h-10 mb-2" />
                        <p>No recent activity.</p>
                      </div>
                    ) : (
                      recentActions.map((action) => (
                        <div key={action.id} className="flex items-start justify-between group p-3 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-all duration-200 border border-transparent hover:border-border/50 shadow-sm hover:shadow-md">
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
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="bills" className="mt-0 focus-visible:ring-0">
                  <div className="space-y-3">
                    {recentBills.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-muted-foreground opacity-50">
                        <FileText className="w-10 h-10 mb-2" />
                        <p>No recent bills.</p>
                      </div>
                    ) : (
                      recentBills.map((action) => (
                        <div key={action.id} className="flex items-start justify-between group p-3 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-all duration-200 border border-transparent hover:border-border/50 shadow-sm hover:shadow-md">
                          <div className="flex gap-4 items-center">
                            <div className="p-2 rounded-full ring-2 ring-opacity-20 bg-blue-100 text-blue-600 ring-blue-500">
                              <FileText className="w-4 h-4" />
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
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="payments" className="mt-0 focus-visible:ring-0">
                  <div className="space-y-3">
                    {recentPayments.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-muted-foreground opacity-50">
                        <DollarSign className="w-10 h-10 mb-2" />
                        <p>No recent payments.</p>
                      </div>
                    ) : (
                      recentPayments.map((action) => (
                        <div key={action.id} className="flex items-start justify-between group p-3 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-all duration-200 border border-transparent hover:border-border/50 shadow-sm hover:shadow-md">
                          <div className="flex gap-4 items-center">
                            <div className="p-2 rounded-full ring-2 ring-opacity-20 bg-green-100 text-green-600 ring-green-500">
                              <DollarSign className="w-4 h-4" />
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
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
            <div className="p-6 pt-0 mt-auto border-t border-border/10">
              <Button variant="ghost" className="w-full text-muted-foreground hover:text-primary hover:bg-primary/5 group" size="sm">
                View All Activity
                <span className="inline-block transition-transform group-hover:translate-x-1 ml-1">→</span>
              </Button>
            </div>
          </Card>
        </div>

        {/* Securities Section */}
        <Card className="shadow-xl border-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md ring-1 ring-black/5 dark:ring-white/10 overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-primary" />
                <div>
                  <CardTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500">
                    Securities Tracking
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">Monitor security deposits and refunds</p>
                </div>
              </div>
              <Tabs value={securityFilter} onValueChange={(v) => setSecurityFilter(v as any)} className="w-full md:w-auto">
                <TabsList className="grid w-full grid-cols-3 h-9 bg-muted/50">
                  <TabsTrigger value="all" className="text-xs font-bold uppercase">All</TabsTrigger>
                  <TabsTrigger value="pending" className="text-xs font-bold uppercase">Pending</TabsTrigger>
                  <TabsTrigger value="received" className="text-xs font-bold uppercase">Received</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent border-b-0">
                    <TableHead className="py-3 px-6 font-bold text-xs uppercase tracking-wider">GD Number</TableHead>
                    <TableHead className="py-3 px-4 font-bold text-xs uppercase tracking-wider">Company</TableHead>
                    <TableHead className="py-3 px-4 font-bold text-xs uppercase tracking-wider">Port</TableHead>
                    <TableHead className="py-3 px-4 font-bold text-xs uppercase tracking-wider text-center">Containers</TableHead>
                    <TableHead className="py-3 px-4 font-bold text-xs uppercase tracking-wider text-right">Total Amount</TableHead>
                    <TableHead className="py-3 px-4 font-bold text-xs uppercase tracking-wider text-center">Status</TableHead>
                    <TableHead className="py-3 px-6 font-bold text-xs uppercase tracking-wider text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {securities
                    .filter(s => {
                      if (securityFilter === 'pending') return !s.isRefundReceived;
                      if (securityFilter === 'received') return s.isRefundReceived;
                      return true;
                    })
                    .map((security) => {
                      const totalAmount = security.noOfContainers * security.amountPerContainer;
                      return (
                        <TableRow key={security.id} className="hover:bg-primary/5 transition-colors border-b border-border/40 group">
                          <TableCell className="py-4 px-6">
                            <p className="font-mono font-bold text-sm text-foreground">{security.gdNumber}</p>
                          </TableCell>
                          <TableCell className="py-4 px-4">
                            <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">{security.companyName}</p>
                          </TableCell>
                          <TableCell className="py-4 px-4">
                            <p className="text-sm text-muted-foreground uppercase font-medium">{security.port}</p>
                          </TableCell>
                          <TableCell className="py-4 px-4 text-center">
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary font-bold text-xs">
                              {security.noOfContainers} × PKR {security.amountPerContainer.toLocaleString()}
                            </span>
                          </TableCell>
                          <TableCell className="py-4 px-4 text-right">
                            <p className="font-mono font-bold text-sm text-foreground">PKR {totalAmount.toLocaleString()}</p>
                          </TableCell>
                          <TableCell className="py-4 px-4 text-center">
                            {security.isRefundReceived ? (
                              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span className="text-xs font-bold uppercase tracking-wide">Received</span>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                                <Clock className="w-3.5 h-3.5" />
                                <span className="text-xs font-bold uppercase tracking-wide">Pending</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="py-4 px-6 text-center">
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2 hover:bg-primary/5 hover:border-primary/40 transition-all"
                              onClick={() => {
                                setSelectedSecurity(security);
                                setIsSecurityDialogOpen(true);
                              }}
                            >
                              <Eye className="w-3.5 h-3.5" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  {securities.filter(s => {
                    if (securityFilter === 'pending') return !s.isRefundReceived;
                    if (securityFilter === 'received') return s.isRefundReceived;
                    return true;
                  }).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="h-32 text-center">
                          <div className="flex flex-col items-center justify-center text-muted-foreground/50">
                            <Shield className="w-12 h-12 mb-3 opacity-20" />
                            <p className="font-semibold">No securities found</p>
                            <p className="text-xs">Try adjusting your filter</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                </TableBody>
              </Table>
            </div>

            {/* Totaling Section */}
            {securities.length > 0 && (
              <div className="bg-muted/20 px-6 py-4 border-t-2 border-border/50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-slate-900 border border-border/30">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Total Pending</p>
                      <p className="text-lg font-black text-amber-600 font-mono">PKR {securities.filter(s => !s.isRefundReceived).reduce((sum, s) => sum + (s.noOfContainers * s.amountPerContainer), 0).toLocaleString()}</p>
                    </div>
                    <Clock className="w-8 h-8 text-amber-500/30" />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-slate-900 border border-border/30">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Total Received</p>
                      <p className="text-lg font-black text-emerald-600 font-mono">PKR {securities.filter(s => s.isRefundReceived).reduce((sum, s) => sum + (s.noOfContainers * s.amountPerContainer), 0).toLocaleString()}</p>
                    </div>
                    <CheckCircle2 className="w-8 h-8 text-emerald-500/30" />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border-2 border-primary/20">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-primary/70 mb-1">Grand Total</p>
                      <p className="text-lg font-black text-primary font-mono">PKR {securities.reduce((sum, s) => sum + (s.noOfContainers * s.amountPerContainer), 0).toLocaleString()}</p>
                    </div>
                    <Shield className="w-8 h-8 text-primary/30" />
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-border/30 flex justify-between items-center text-xs">
                  <span className="text-muted-foreground font-medium">
                    Showing {securities.filter(s => {
                      if (securityFilter === 'pending') return !s.isRefundReceived;
                      if (securityFilter === 'received') return s.isRefundReceived;
                      return true;
                    }).length} of {securities.length} securities
                  </span>
                  <span className="text-muted-foreground font-medium">
                    {securities.filter(s => !s.isRefundReceived).length} Pending • {securities.filter(s => s.isRefundReceived).length} Received
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security Details Dialog */}
        <Dialog open={isSecurityDialogOpen} onOpenChange={setIsSecurityDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-2xl">
                <Shield className="w-6 h-6 text-primary" />
                Security Details - {selectedSecurity?.gdNumber}
              </DialogTitle>
            </DialogHeader>
            {selectedSecurity && (
              <div className="space-y-6 pt-4">
                {/* Company & Basic Info */}
                <div className="bg-muted/30 p-5 rounded-xl border border-border/50">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                    <Users className="w-4 h-4" /> Company Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold mb-1">Company Name</p>
                      <p className="font-bold text-foreground">{selectedSecurity.companyName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold mb-1">GD Number</p>
                      <p className="font-mono font-bold text-foreground">{selectedSecurity.gdNumber}</p>
                    </div>
                  </div>
                </div>

                {/* Container Details */}
                <div className="bg-muted/30 p-5 rounded-xl border border-border/50">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Container & Amount Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold mb-1">Number of Containers</p>
                      <p className="font-bold text-foreground">{selectedSecurity.noOfContainers}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold mb-1">Container Number</p>
                      <p className="font-mono font-bold text-foreground">{selectedSecurity.containerNo}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold mb-1">Amount Per Container</p>
                      <p className="font-mono font-bold text-foreground">PKR {selectedSecurity.amountPerContainer.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold mb-1">Total Amount</p>
                      <p className="font-mono font-black text-primary text-lg">
                        PKR {(selectedSecurity.noOfContainers * selectedSecurity.amountPerContainer).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Port & Refund Details */}
                <div className="bg-muted/30 p-5 rounded-xl border border-border/50">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Port & Refund Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold mb-1">Port</p>
                      <p className="font-bold text-foreground uppercase">{selectedSecurity.port}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold mb-1">Refund Days</p>
                      <p className="font-bold text-foreground">{selectedSecurity.refundDays} days</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold mb-1">Refund Due Date</p>
                      <p className="font-mono font-bold text-foreground">{formatDate(selectedSecurity.refundDueDate)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold mb-1">Pay Order Number</p>
                      <p className="font-mono font-bold text-foreground">{selectedSecurity.payOrderNo}</p>
                    </div>
                  </div>
                </div>

                {/* Status Information */}
                <div className="bg-muted/30 p-5 rounded-xl border border-border/50">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Status & Tracking
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold mb-1">Receiver Name</p>
                      <p className="font-bold text-foreground">{selectedSecurity.receiverName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold mb-1">Document Submitted</p>
                      <div className="inline-flex items-center gap-1.5">
                        {selectedSecurity.isDocumentSubmitted ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span className="font-bold text-emerald-600">Yes</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-4 h-4 text-amber-600" />
                            <span className="font-bold text-amber-600">No</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold mb-1">Refund Received</p>
                      <div className="inline-flex items-center gap-1.5">
                        {selectedSecurity.isRefundReceived ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span className="font-bold text-emerald-600">Yes</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-4 h-4 text-amber-600" />
                            <span className="font-bold text-amber-600">Pending</span>
                          </>
                        )}
                      </div>
                    </div>
                    {selectedSecurity.receivedAmountDate && (
                      <div>
                        <p className="text-xs text-muted-foreground font-semibold mb-1">Received Date</p>
                        <p className="font-mono font-bold text-foreground">{formatDate(selectedSecurity.receivedAmountDate)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Financial Overview moved down */}
        <Card className="shadow-xl border-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md ring-1 ring-black/5 dark:ring-white/10">
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
