'use client';

import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Download } from 'lucide-react';
import { useData } from '@/context/data-context';
import { useMemo, useState, useRef } from 'react';
import { formatDate, formatCurrency } from '@/lib/utils';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function ReportsPage() {
  const { companies, bills, payments } = useData();
  const [dateFrom, setDateFrom] = useState('2026-01-01');
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [reportType, setReportType] = useState('overall');
  const [selectedCompanyId, setSelectedCompanyId] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [timeFilter, setTimeFilter] = useState<'custom' | 'overall' | '6months' | '3months'>('overall');
  const reportRef = useRef<HTMLDivElement>(null);

  // Helper to set timeframe
  const handleTimeframeChange = (filter: 'overall' | '6months' | '3months') => {
    setTimeFilter(filter);
    const end = new Date().toISOString().split('T')[0];
    let start = '2026-01-01';

    if (filter === '6months') {
      const d = new Date();
      d.setMonth(d.getMonth() - 6);
      start = d.toISOString().split('T')[0];
    } else if (filter === '3months') {
      const d = new Date();
      d.setMonth(d.getMonth() - 3);
      start = d.toISOString().split('T')[0];
    }

    setDateFrom(start);
    setDateTo(end);
  };

  const { outstandingData, overallData, overallTotals, totalOutstanding, totalOverdue, timeSeriesData, filteredBills, filteredPayments, companyLedger, ledgerOpeningBalance } = useMemo(() => {
    // 1. Filter raw data based on dates
    const start = new Date(dateFrom);
    const end = new Date(dateTo);
    end.setHours(23, 59, 59, 999);

    const fBills = bills.filter(b => {
      const d = new Date(b.date);
      const dateMatch = d >= start && d <= end;
      const searchMatch = searchTerm === '' || b.companyName.toLowerCase().includes(searchTerm.toLowerCase());
      return dateMatch && searchMatch && b.status !== 'Draft';
    });

    const fPayments = payments.filter(p => {
      const d = new Date(p.date);
      const dateMatch = d >= start && d <= end;
      const searchMatch = searchTerm === '' || p.companyName.toLowerCase().includes(searchTerm.toLowerCase());
      return dateMatch && searchMatch;
    });

    // 2. Company Ledger Data (Detailed format for export)
    let companyLedger: any[] = [];
    let ledgerOpeningBalance = 0;

    if (reportType === 'company' && selectedCompanyId !== 'all') {
      const selectedCompany = companies.find(c => String(c.id) === selectedCompanyId);
      const baseOpeningBal = Number(selectedCompany?.openingBalance) || 0;

      let consolidatedEntries: any[] = [];
      const companyBills = bills.filter(b => String(b.companyId) === selectedCompanyId && b.status !== 'Draft');
      const companyPayments = payments.filter(p => String(p.companyId) === selectedCompanyId);

      companyBills.forEach(bill => {
        const linkedPayments = payments.filter(p => String(p.billId) === String(bill.id));
        const totalPaid = linkedPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
        const totalAdjustment = linkedPayments.reduce((sum, p) => sum + Number(p.adjustment || 0), 0);
        const debitAmount = bill.grandTotal || bill.totalAmount || 0;
        const advanceAmount = bill.advancePayment || 0;

        consolidatedEntries.push({
          date: bill.date,
          type: 'BILL',
          description: (bill as any).description || `Job #${bill.jobNumber || 'N/A'}`,
          jobNumber: bill.jobNumber,
          debit: debitAmount,
          advance: advanceAmount,
          paid: totalPaid,
          adjustment: totalAdjustment,
          credit: advanceAmount + totalPaid + totalAdjustment,
          outstanding: debitAmount - advanceAmount - totalPaid - totalAdjustment,
        });
      });

      companyPayments.forEach(p => {
        if (!p.billId) {
          consolidatedEntries.push({
            date: p.date,
            type: 'PAYMENT',
            description: p.description ? `Payment: ${p.description}` : 'Payment Received',
            jobNumber: null,
            debit: 0,
            advance: 0,
            paid: Number(p.amount || 0),
            adjustment: Number(p.adjustment || 0),
            credit: Number(p.amount || 0) + Number(p.adjustment || 0),
            outstanding: 0,
            method: (p as any).method,
            paymentRef: p.reference,
          });
        }
      });

      consolidatedEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Filter by period and calculate opening balance for THAT period
      let runningOpening = baseOpeningBal;
      const startOfPeriod = new Date(dateFrom);
      startOfPeriod.setHours(0, 0, 0, 0);

      const previousEntries = consolidatedEntries.filter(e => new Date(e.date) < startOfPeriod);
      previousEntries.forEach(e => {
        runningOpening += (e.debit - e.credit);
      });

      const periodEntries = consolidatedEntries.filter(e => {
        const d = new Date(e.date);
        return d >= startOfPeriod && d <= end;
      });

      let running = runningOpening;
      companyLedger = periodEntries.map(e => {
        running += (e.debit - e.credit);
        return { ...e, balance: running };
      });
      ledgerOpeningBalance = runningOpening;
    }

    // 3. Calculate Outstanding
    const companyStats = companies
      .filter(c => searchTerm === '' || c.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .map(c => {
        const companyBills = bills.filter(b => b.companyId === c.id);
        const companyPayments = payments.filter(p => p.companyId === c.id);

        const billed = companyBills.reduce((sum, b) => sum + (Number(b.grandTotal) || 0), 0) + (Number(c.openingBalance) || 0);
        const paid =
          companyBills.reduce((sum, b) => sum + (Number(b.advancePayment) || 0), 0) +
          companyPayments.reduce((sum, p) => sum + (Number(p.amount) || 0) + (Number(p.adjustment) || 0), 0);
        const outstanding = billed - paid;

        const unpaidBills = companyBills.filter(b => b.status !== 'Paid');
        unpaidBills.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        let daysOverdue = 0;
        let lastDueDate = '-';
        let overdueCount = 0;

        if (unpaidBills.length > 0) {
          const today = new Date();
          unpaidBills.forEach(bill => {
            const d = new Date(bill.date);
            d.setDate(d.getDate() + 30);
            if (today > d) overdueCount++;
          });

          const oldestUnpaid = unpaidBills[0];
          const dueDate = new Date(oldestUnpaid.date);
          dueDate.setDate(dueDate.getDate() + 30);

          if (today > dueDate) {
            daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 3600 * 24));
          }
          lastDueDate = oldestUnpaid.date;
        }

        return {
          company: c.name,
          totalDebit: billed,
          received: paid,
          outstanding,
          billsCount: companyBills.length,
          daysOverdue,
          lastDueDate,
          overdueCount
        };
      });

    const total = companyStats.reduce((sum, item) => sum + item.outstanding, 0);
    const totalOverdue = companyStats.reduce((sum, item) => sum + item.overdueCount, 0);

    // 4. Time Series
    const monthsData: { month: string; outstanding: number; year: number; monthIdx: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthsData.push({
        month: d.toLocaleString('default', { month: 'short' }),
        outstanding: 0,
        year: d.getFullYear(),
        monthIdx: d.getMonth()
      });
    }

    bills.forEach(b => {
      if (b.status === 'Draft') return;
      const d = new Date(b.date);
      const m = monthsData.find(mo => mo.monthIdx === d.getMonth() && mo.year === d.getFullYear());
      if (m) m.outstanding += (Number(b.grandTotal) || 0);
    });

    // 5. Overall Report Data
    const overallData = companies
      .filter(c => searchTerm === '' || c.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .map(c => {
        const companyBills = bills.filter(b => b.companyId === c.id && b.status !== 'Draft');
        const companyPayments = payments.filter(p => p.companyId === c.id);
        const billed = companyBills.reduce((sum, b) => sum + (Number(b.grandTotal) || 0), 0) + (Number(c.openingBalance) || 0);
        const paid =
          companyBills.reduce((sum, b) => sum + (Number(b.advancePayment) || 0), 0) +
          companyPayments.reduce((sum, p) => sum + (Number(p.amount) || 0) + (Number(p.adjustment) || 0), 0);
        return {
          company: c.name,
          billsCount: companyBills.length,
          totalBilled: billed,
          paidAmount: paid,
          balance: billed - paid
        };
      }).sort((a, b) => b.balance - a.balance);

    const overallTotals = overallData.reduce((acc, item) => {
      acc.totalBills += item.billsCount;
      acc.totalBilled += item.totalBilled;
      acc.totalPaid += item.paidAmount;
      acc.totalBalance += item.balance;
      return acc;
    }, { totalBills: 0, totalBilled: 0, totalPaid: 0, totalBalance: 0 });

    return {
      outstandingData: companyStats,
      overallData,
      overallTotals,
      totalOutstanding: total,
      totalOverdue: totalOverdue,
      timeSeriesData: monthsData,
      filteredBills: fBills,
      filteredPayments: fPayments,
      companyLedger,
      ledgerOpeningBalance
    };
  }, [companies, bills, payments, dateFrom, dateTo, reportType, selectedCompanyId, searchTerm]);

  const handleExport = async () => {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();

      // Add Logo
      const img = new Image();
      img.src = '/logo.jpeg';

      await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve; // Continue even if logo fails
      });

      if (img.width > 0) {
        const maxLogoHeight = 16;
        const maxLogoWidth = 16;
        let logoWidth = img.width;
        let logoHeight = img.height;
        const ratio = Math.min(maxLogoWidth / logoWidth, maxLogoHeight / logoHeight);
        logoWidth *= ratio;
        logoHeight *= ratio;

        pdf.addImage(img, 'PNG', 14, 10, logoWidth, logoHeight);
      }

      // Company Info (Thaheem Brothers)
      pdf.setTextColor(15, 23, 42); // slate-900
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("THAHEEM BROTHERS", 34, 12);

      pdf.setTextColor(100, 116, 139); // slate-500
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
      pdf.text("Suite 23, 2nd Floor, R.K. Square Ext, Shahrah-e-Liaquat, Karachi", 34, 16);
      pdf.text("+92 21 32421347 | +92 300 2791780 | import.khi@hotmail.com", 34, 20);

      // Line Separator
      pdf.setDrawColor(226, 232, 240); // slate-200
      pdf.setLineWidth(0.5);
      pdf.line(14, 29, pageWidth - 14, 29);

      // Add Title
      pdf.setTextColor(15, 23, 42); // slate-900
      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");

      let reportTitle = "Report";
      if (reportType === 'overall') reportTitle = 'OVERALL SUMMARY REPORT';
      if (reportType === 'outstanding') reportTitle = 'REMAINING BALANCE REPORT';
      if (reportType === 'bills') reportTitle = 'BILLS REPORT';
      if (reportType === 'payments') reportTitle = 'PAYMENTS REPORT';
      if (reportType === 'company') reportTitle = 'LEDGER REPORT';

      pdf.text(reportTitle, pageWidth - 14, 27, { align: "right" });

      // Add Filter Info Below Line
      let yPos = 36;
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(15, 23, 42);

      if (reportType === 'company') {
        const companyNameStr = selectedCompanyId !== 'all' ? companies.find(c => c.id === selectedCompanyId)?.name || 'All Companies' : 'All Companies';
        pdf.text(`Client: ${companyNameStr}`, 14, yPos);
      }

      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(100, 116, 139);

      const periodYPos = reportType === 'company' ? yPos + 5 : yPos;
      pdf.text(`Period: ${formatDate(dateFrom)} to ${formatDate(dateTo)}`, 14, periodYPos);
      pdf.text(`Date Printed: ${formatDate(new Date().toISOString())}`, pageWidth - 14, yPos, { align: "right" });

      yPos = reportType === 'company' ? periodYPos + 10 : periodYPos + 10;
      let head: any[][] = [];
      let body = [];
      let customStyles = {};

      if (reportType === 'overall') {
        head = [['Company Name', 'No Of Bills', 'Bill Total (Incl. OB)', 'Paid Amount', 'Balance']];
        body = overallData.map((item: any) => [
          item.company,
          item.billsCount.toString(),
          formatCurrency(item.totalBilled),
          formatCurrency(item.paidAmount),
          formatCurrency(item.balance)
        ]);
        customStyles = {
          1: { halign: 'center' },
          2: { halign: 'right' },
          3: { halign: 'right' },
          4: { halign: 'right', fontStyle: 'bold' }
        };

        // Add Summary Totals Row
        body.push([
          'TOTAL',
          overallTotals.totalBills.toString(),
          formatCurrency(overallTotals.totalBilled),
          formatCurrency(overallTotals.totalPaid),
          formatCurrency(overallTotals.totalBalance)
        ]);
      } else if (reportType === 'outstanding') {
        head = [['Company Name', 'No Of Bills', 'Last Due', 'Days Overdue', 'Total Debit', 'Received', 'Rem. Balance', 'Status']];
        body = outstandingData.map(item => [
          item.company,
          item.billsCount.toString(),
          formatDate(item.lastDueDate),
          item.daysOverdue > 0 ? `${item.daysOverdue} days` : 'Current',
          formatCurrency(item.totalDebit),
          formatCurrency(item.received),
          formatCurrency(item.outstanding),
          item.outstanding > 300000 ? 'High Risk' : item.outstanding > 100000 ? 'Medium' : 'Low Risk'
        ]);
        customStyles = {
          1: { halign: 'center' },
          2: { halign: 'right' },
          3: { halign: 'right' },
          4: { halign: 'right', textColor: [220, 38, 38] },
          5: { halign: 'right', textColor: [0, 128, 0] },
          6: { halign: 'right', fontStyle: 'bold' },
          7: { halign: 'right' }
        };
      } else if (reportType === 'bills') {
        head = [['Date', 'Job No', 'Company', 'Amount', 'Status']];
        body = filteredBills.map(bill => [
          formatDate(bill.date),
          bill.jobNumber || 'N/A',
          bill.companyName,
          formatCurrency(bill.grandTotal),
          bill.calculatedStatus
        ]);
        customStyles = {
          3: { halign: 'right', fontStyle: 'bold' },
          4: { halign: 'right', fontStyle: 'bold' }
        };
      } else if (reportType === 'payments') {
        head = [['Date', 'Reference', 'Company', 'Method', 'Amount']];
        body = filteredPayments.map(payment => [
          formatDate(payment.date),
          payment.reference || 'N/A',
          payment.companyName,
          payment.method,
          formatCurrency(Number(payment.amount) + (Number(payment.adjustment) || 0))
        ]);
        customStyles = {
          4: { halign: 'right', fontStyle: 'bold', textColor: [0, 128, 0] }
        };
      } else if (reportType === 'company') {
        head = [['Date', 'Description', 'Job No', 'Bill Total', 'Advance', 'Paid', 'Adj.', 'Outst.', 'Balance']];

        // Opening Balance Row
        body.push([
          formatDate(dateFrom),
          'Opening Balance b/f',
          '-',
          '-',
          '-',
          '-',
          '-',
          '-',
          formatCurrency(ledgerOpeningBalance)
        ]);

        companyLedger.forEach((entry: any) => {
          let desc = entry.description;
          if (entry.type === 'PAYMENT') {
            desc = entry.method ? `Payment Received (${entry.method})` : 'Advance Received';
            if (entry.paymentRef) desc += ` - Ref: ${entry.paymentRef}`;
          }
          body.push([
            formatDate(entry.date),
            desc,
            entry.jobNumber || '-',
            entry.debit > 0 ? formatCurrency(entry.debit) : '-',
            entry.advance > 0 ? formatCurrency(entry.advance) : '-',
            entry.paid > 0 ? formatCurrency(entry.paid) : '-',
            entry.adjustment > 0 ? formatCurrency(entry.adjustment) : '-',
            entry.outstanding > 0 ? formatCurrency(entry.outstanding) : '-',
            formatCurrency(entry.balance)
          ]);
        });

        customStyles = {
          3: { halign: 'right' },
          4: { halign: 'right' },
          5: { halign: 'right' },
          6: { halign: 'right' },
          7: { halign: 'right' },
          8: { halign: 'right', fontStyle: 'bold' }
        };
      }

      if (body.length === 0) {
        body.push(head[0].map(() => '-'));
        body[0][1] = 'No records found';
      }

      autoTable(pdf, {
        startY: yPos,
        head: head as any[][],
        body: body,
        theme: 'grid',
        headStyles: { fillColor: [44, 62, 80], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: customStyles,
        didParseCell: function (data) {
          if (data.section === 'body') {
            // Color coding based on status text
            const text = data.cell.text[0] || '';
            if (text === 'Paid' || text === 'Current' || text === 'Low Risk') {
              data.cell.styles.textColor = [0, 128, 0]; // Green
            } else if (text === 'Unpaid' || text === 'High Risk' || text.includes('days')) {
              data.cell.styles.textColor = [220, 38, 38]; // Red
            } else if (text === 'Partial' || text === 'Medium') {
              data.cell.styles.textColor = [202, 138, 4]; // Yellow
            }

            // Color coding for Balance column in Company Ledger
            if (reportType === 'company' && data.column.index === 8) {
              const numStr = text.replace(/[^0-9.-]/g, '');
              const numVal = parseFloat(numStr);
              if (!isNaN(numVal)) {
                if (numVal > 0) {
                  data.cell.styles.textColor = [220, 38, 38]; // Red
                } else if (numVal <= 0) {
                  data.cell.styles.textColor = [0, 128, 0]; // Green
                }
              }
            }
          }
        }
      });

      const reportName = reportType.charAt(0).toUpperCase() + reportType.slice(1);
      const dateStr = new Date().toISOString().split('T')[0];
      pdf.save(`${reportName}_Report_${dateStr}.pdf`);
    } catch (err) {
      console.error('Failed to export PDF', err);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
      </div>

      <Card className="border-none shadow-xl shadow-slate-200/40 rounded-3xl overflow-hidden bg-white">
        <div className="h-1.5 bg-gradient-to-r from-primary via-indigo-500 to-primary" />
        <CardHeader className="pb-2 pt-6">
          <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary" />
            Advanced Filter Engine
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 sm:gap-6">
            <div className="sm:col-span-2 lg:col-span-2">
              <Label htmlFor="search-company" className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">
                Search Company
              </Label>
              <Input
                id="search-company"
                type="text"
                placeholder="Type name to filter..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-11 bg-slate-50 border-slate-100 rounded-xl font-bold focus:ring-primary/20"
              />
            </div>

            <div className="sm:col-span-1">
              <Label htmlFor="report-type" className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">
                Report Type
              </Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="h-11 bg-slate-50 border-slate-100 rounded-xl font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overall">Overall Summary Report</SelectItem>
                  <SelectItem value="outstanding">Remaining Balance Report</SelectItem>
                  <SelectItem value="bills">Bills by Date</SelectItem>
                  <SelectItem value="payments">Payments by Date</SelectItem>
                  <SelectItem value="company">Company Ledger</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="sm:col-span-1">
              <Label htmlFor="date-from" className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">
                From
              </Label>
              <Input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setTimeFilter('custom');
                }}
                className="h-11 bg-slate-50 border-slate-100 rounded-xl font-bold"
              />
            </div>

            <div className="sm:col-span-1">
              <Label htmlFor="date-to" className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">
                To
              </Label>
              <Input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setTimeFilter('custom');
                }}
                className="h-11 bg-slate-50 border-slate-100 rounded-xl font-bold"
              />
            </div>

            {reportType === 'company' && (
              <div className="sm:col-span-1">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Select Company</Label>
                <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                  <SelectTrigger className="h-11 bg-slate-50 border-slate-100 rounded-xl font-bold">
                    <SelectValue placeholder="All Companies" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Companies</SelectItem>
                    {companies.map(c => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest mr-2">Quick Timeframe:</span>
              <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl">
                {(['overall', '6months', '3months'] as const).map((filter) => (
                  <Button
                    key={filter}
                    variant={timeFilter === filter ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => handleTimeframeChange(filter)}
                    className={`h-8 px-4 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${timeFilter === filter
                      ? 'bg-primary text-white shadow-lg shadow-primary/20'
                      : 'text-slate-500 hover:bg-white hover:text-slate-800'
                      }`}
                  >
                    {filter === 'overall' ? 'Overall' : filter === '6months' ? '6 Months' : '3 Months'}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-slate-300 uppercase italic">Powering Business Logic</span>
              <Button onClick={() => handleTimeframeChange('overall')} variant="outline" className="h-10 rounded-xl border-slate-200 text-xs font-black uppercase tracking-widest px-6 hover:bg-slate-50">
                Reset All
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Swapped: Table First */}
      <Card className="no-scrollbar">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              {reportType === 'outstanding' && 'Remaining Balance by Company'}
              {reportType === 'bills' && 'Bills Report'}
              {reportType === 'payments' && 'Payments Report'}
              {reportType === 'company' && 'Company Ledger'}
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2 bg-transparent" onClick={handleExport}>
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent ref={reportRef} className="p-0 sm:p-6">
          <div className="overflow-x-auto custom-scrollbar">
            <div className="min-w-[1000px]">
              <Table>
              {reportType === 'overall' && (
                <>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company Name</TableHead>
                      <TableHead className="text-center">No Of Bills</TableHead>
                      <TableHead className="text-right">Total Billed (Incl. OB)</TableHead>
                      <TableHead className="text-right">Paid Amount</TableHead>
                      <TableHead className="text-right text-primary">Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overallData.map((item: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{item.company}</TableCell>
                        <TableCell className="text-center font-medium">{item.billsCount}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(item.totalBilled)}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-green-600">
                          {formatCurrency(item.paidAmount)}
                        </TableCell>
                        <TableCell className="text-right font-bold text-primary">
                          {formatCurrency(item.balance)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableHeader>
                    <TableRow className="bg-muted/50 border-t-2">
                      <TableCell className="font-black">TOTAL</TableCell>
                      <TableCell className="text-center font-black">{overallTotals.totalBills}</TableCell>
                      <TableCell className="text-right font-black">{formatCurrency(overallTotals.totalBilled)}</TableCell>
                      <TableCell className="text-right font-black text-green-700">{formatCurrency(overallTotals.totalPaid)}</TableCell>
                      <TableCell className="text-right font-black text-primary border-l-2 bg-primary/5">{formatCurrency(overallTotals.totalBalance)}</TableCell>
                    </TableRow>
                  </TableHeader>
                </>
              )}
              {reportType === 'outstanding' && (
                <>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company Name</TableHead>
                      <TableHead className="text-center">No Of Bills</TableHead>
                      <TableHead className="text-right">Last Due</TableHead>
                      <TableHead className="text-right">Days Overdue</TableHead>
                      <TableHead className="text-right">Total Debit</TableHead>
                      <TableHead className="text-right">Received</TableHead>
                      <TableHead className="text-right">Remaining Balance</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {outstandingData.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{item.company}</TableCell>
                        <TableCell className="text-center font-medium">{item.billsCount}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{formatDate(item.lastDueDate)}</TableCell>
                        <TableCell className="text-right">
                          {item.daysOverdue > 0 ? (
                            <span className="text-red-600 font-semibold">
                              {item.daysOverdue} days
                            </span>
                          ) : (
                            <span className="text-green-600">Current</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-destructive">
                          {formatCurrency(item.totalDebit)}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-green-600">
                          {formatCurrency(item.received)}
                        </TableCell>
                        <TableCell className="text-right font-bold text-primary">
                          {formatCurrency(item.outstanding)}
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.outstanding > 300000
                              ? 'bg-red-100 text-red-800'
                              : item.outstanding > 100000
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                              }`}
                          >
                            {item.outstanding > 300000 ? 'High Risk' : item.outstanding > 100000 ? 'Medium' : 'Low Risk'}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </>
              )}

              {reportType === 'bills' && (
                <>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Job No</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBills.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No bills in this range</TableCell></TableRow>
                    ) : (
                      filteredBills.map((bill) => (
                        <TableRow key={bill.id}>
                          <TableCell>{formatDate(bill.date)}</TableCell>
                          <TableCell className="font-mono font-bold">{bill.jobNumber || 'N/A'}</TableCell>
                          <TableCell>{bill.companyName}</TableCell>
                          <TableCell className="text-right font-bold">{formatCurrency(bill.grandTotal)}</TableCell>
                          <TableCell className="text-right">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-black border ${bill.calculatedStatus === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {bill.calculatedStatus}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </>
              )}

              {reportType === 'payments' && (
                <>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No payments in this range</TableCell></TableRow>
                    ) : (
                      filteredPayments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>{formatDate(payment.date)}</TableCell>
                          <TableCell className="font-mono font-bold text-xs">{payment.reference || 'N/A'}</TableCell>
                          <TableCell>{payment.companyName}</TableCell>
                          <TableCell className="text-xs uppercase font-bold">{payment.method}</TableCell>
                          <TableCell className="text-right font-bold text-green-600">{formatCurrency(Number(payment.amount) + (Number(payment.adjustment) || 0))}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </>
              )}
              {reportType === 'company' && (
                <>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Job No</TableHead>
                      <TableHead className="text-right">Bill Total</TableHead>
                      <TableHead className="text-right">Advance</TableHead>
                      <TableHead className="text-right">Paid</TableHead>
                      <TableHead className="text-right">Adj.</TableHead>
                      <TableHead className="text-right">Outst.</TableHead>
                      <TableHead className="text-right text-primary">Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companyLedger.length === 0 && ledgerOpeningBalance === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No entries for this company in range</TableCell></TableRow>
                    ) : (
                      <>
                        {/* Opening Balance Row */}
                        <TableRow className="bg-muted/30 border-b-2 font-bold">
                          <TableCell>{formatDate(dateFrom)}</TableCell>
                          <TableCell colSpan={2}>Opening Balance b/f</TableCell>
                          <TableCell className="text-right">-</TableCell>
                          <TableCell className="text-right">-</TableCell>
                          <TableCell className="text-right">-</TableCell>
                          <TableCell className="text-right">-</TableCell>
                          <TableCell className="text-right">-</TableCell>
                          <TableCell className="text-right font-black text-primary bg-primary/5">{formatCurrency(ledgerOpeningBalance)}</TableCell>
                        </TableRow>
                        {companyLedger.map((entry: any, idx: number) => {
                          let desc = entry.description;
                          if (entry.type === 'PAYMENT') {
                            desc = entry.method ? `Payment Received (${entry.method})` : 'Advance Received';
                            if (entry.paymentRef) desc += ` - Ref: ${entry.paymentRef}`;
                          }
                          return (
                            <TableRow key={idx} className="hover:bg-muted/5">
                              <TableCell className="text-xs">{formatDate(entry.date)}</TableCell>
                              <TableCell className="text-[10px] font-medium max-w-[150px] truncate">{desc}</TableCell>
                              <TableCell className="font-mono text-[10px]">{entry.jobNumber || entry.reference || '-'}</TableCell>
                              <TableCell className="text-right font-bold text-red-600">
                                {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                              </TableCell>
                              <TableCell className="text-right font-bold text-blue-600">
                                {entry.advance > 0 ? formatCurrency(entry.advance) : '-'}
                              </TableCell>
                              <TableCell className="text-right font-bold text-green-600">
                                {entry.paid > 0 ? formatCurrency(entry.paid) : '-'}
                              </TableCell>
                              <TableCell className="text-right font-bold text-orange-600">
                                {entry.adjustment > 0 ? formatCurrency(entry.adjustment) : '-'}
                              </TableCell>
                              <TableCell className="text-right font-bold text-destructive">
                                {entry.outstanding > 0 ? formatCurrency(entry.outstanding) : '-'}
                              </TableCell>
                              <TableCell className="text-right font-black border-l-2 bg-slate-50 dark:bg-slate-900 shadow-inner">
                                {formatCurrency(entry.balance)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </>
                    )}
                  </TableBody>
                </>
              )}
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>

      {/* Swapped: Charts Next */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Remaining Balance Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" />
                <YAxis stroke="var(--muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="outstanding"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Summary Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {reportType === 'outstanding' || reportType === 'company' ? (
              <>
                <div>
                  <p className="text-xs text-muted-foreground">Total Remaining Balance</p>
                  <p className="text-2xl font-bold text-primary mt-1">
                    {totalOutstanding.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Overdue Invoices</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">
                    {(outstandingData as any).reduce ? (outstandingData as any).reduce((sum: number, item: any) => sum + (item.overdueCount || 0), 0) : 0}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="text-xs text-muted-foreground">
                    {reportType === 'bills' ? 'Total Billed (in range)' : 'Total Collected (in range)'}
                  </p>
                  <p className={`text-2xl font-bold mt-1 ${reportType === 'payments' ? 'text-green-600' : 'text-primary'}`}>
                    {reportType === 'bills'
                      ? formatCurrency(filteredBills.reduce((s: number, b: any) => s + (Number(b.grandTotal) || 0), 0))
                      : formatCurrency(filteredPayments.reduce((s: number, p: any) => s + (Number(p.amount) || 0) + (Number(p.adjustment) || 0), 0))}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    {reportType === 'bills' ? 'Bill Count' : 'Payment Count'}
                  </p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {reportType === 'bills' ? filteredBills.length : filteredPayments.length}
                  </p>
                </div>
              </>
            )}
            <div>
              <p className="text-xs text-muted-foreground">Report Range</p>
              <p className="text-sm font-bold text-slate-700 mt-1">
                {formatDate(dateFrom)} to {formatDate(dateTo)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
