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
  const [reportType, setReportType] = useState('outstanding');
  const [selectedCompanyId, setSelectedCompanyId] = useState('all');
  const reportRef = useRef<HTMLDivElement>(null);

  const { outstandingData, totalOutstanding, timeSeriesData, filteredBills, filteredPayments, companyLedger } = useMemo(() => {
    // 1. Filter raw data based on dates
    const start = new Date(dateFrom);
    const end = new Date(dateTo);
    end.setHours(23, 59, 59, 999);

    const fBills = bills.filter(b => {
      const d = new Date(b.date);
      return d >= start && d <= end;
    });

    const fPayments = payments.filter(p => {
      const d = new Date(p.date);
      return d >= start && d <= end;
    });

    // 2. Company Ledger Data (if type is company)
    const companyLedger = reportType === 'company' && selectedCompanyId !== 'all'
      ? [...fBills.filter(b => String(b.companyId) === selectedCompanyId).map(b => ({ ...b, type: 'BILL' })),
      ...fPayments.filter(p => String(p.companyId) === selectedCompanyId).map(p => ({ ...p, type: 'PAYMENT' }))]
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      : [];

    // 3. Calculate Outstanding
    // Note: For "Outstanding Report", usually we show ALL outstanding, 
    // but we can filter the "Last Due" or "Bills Count" within range.
    const companyStats = companies.map(c => {
      const companyBills = bills.filter(b => b.companyId === c.id);
      const companyPayments = payments.filter(p => p.companyId === c.id);

      const billed = companyBills.reduce((sum, b) => sum + (Number(b.grandTotal) || 0), 0);
      const paid =
        companyBills.reduce((sum, b) => sum + (Number(b.advancePayment) || 0), 0) +
        companyPayments.reduce((sum, p) => sum + (Number(p.amount) || 0) + (Number(p.adjustment) || 0), 0);
      const outstanding = billed - paid;

      // Unpaid bills within range for report clarity
      const unpaidBills = companyBills.filter(b => b.status !== 'Paid');
      unpaidBills.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      let daysOverdue = 0;
      let lastDueDate = '-';
      let overdueCount = 0;

      if (unpaidBills.length > 0) {
        const today = new Date();
        unpaidBills.forEach(bill => {
          const d = new Date(bill.date);
          d.setDate(d.getDate() + 30); // 30 days credit period
          if (today > d) {
            overdueCount++;
          }
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
        outstanding,
        billsCount: companyBills.length,
        daysOverdue,
        lastDueDate,
        overdueCount
      };
    }).filter(s => s.outstanding > 0 || s.billsCount > 0);

    const total = companyStats.reduce((sum, item) => sum + item.outstanding, 0);
    const totalOverdueInvoices = companyStats.reduce((sum, item) => sum + item.overdueCount, 0);

    // 3. Time Series (Monthly Billing Trend)
    const monthsData: { month: string; outstanding: number; year: number; monthIdx: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      monthsData.push({
        month: d.toLocaleString('default', { month: 'short' }),
        outstanding: 0,
        year: d.getFullYear(),
        monthIdx: d.getMonth()
      });
    }

    bills.forEach(b => {
      const d = new Date(b.date);
      const m = monthsData.find(mo => mo.monthIdx === d.getMonth() && mo.year === d.getFullYear());
      if (m) m.outstanding += (Number(b.grandTotal) || 0);
    });

    return {
      outstandingData: companyStats,
      totalOutstanding: total,
      totalOverdueInvoices,
      timeSeriesData: monthsData,
      filteredBills: fBills,
      filteredPayments: fPayments,
      companyLedger
    };
  }, [companies, bills, payments, dateFrom, dateTo, reportType, selectedCompanyId]);

  const handleExport = async () => {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();

      // Add Logo
      const img = new Image();
      img.src = '/logo.PNG';

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

      // Add Title
      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");

      let reportTitle = "Report";
      if (reportType === 'outstanding') reportTitle = 'Outstanding Balance Report';
      if (reportType === 'bills') reportTitle = 'Bills Report';
      if (reportType === 'payments') reportTitle = 'Payments Report';
      if (reportType === 'company') reportTitle = 'Company Ledger Report';

      pdf.text(reportTitle, pageWidth / 2, 38, { align: "center" });

      // Add Filter Info
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");

      if (reportType === 'company') {
        const companyNameStr = selectedCompanyId !== 'all' ? companies.find(c => c.id === selectedCompanyId)?.name || 'All Companies' : 'All Companies';
        pdf.text(`Company: ${companyNameStr}`, 14, 48);
      }

      pdf.text(`Period: ${formatDate(dateFrom)} to ${formatDate(dateTo)}`, 14, reportType === 'company' ? 54 : 48);

      let yPos = reportType === 'company' ? 62 : 56;
      let head = [];
      let body = [];
      let customStyles = {};

      if (reportType === 'outstanding') {
        head = [['Company', 'Outstanding', '# Bills', 'Last Due', 'Days Overdue', 'Status']];
        body = outstandingData.map(item => [
          item.company,
          formatCurrency(item.outstanding),
          item.billsCount.toString(),
          formatDate(item.lastDueDate),
          item.daysOverdue > 0 ? `${item.daysOverdue} days` : 'Current',
          item.outstanding > 300000 ? 'High Risk' : item.outstanding > 100000 ? 'Medium' : 'Low Risk'
        ]);
        customStyles = {
          1: { halign: 'right' },
          2: { halign: 'right' },
          3: { halign: 'right' },
          4: { halign: 'right' },
          5: { halign: 'right', fontStyle: 'bold' }
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
        head = [['Date', 'Type', 'Ref/Job No', 'Debit', 'Credit']];
        body = companyLedger.map((entry: any) => [
          formatDate(entry.date),
          entry.type,
          entry.jobNumber || entry.reference || '-',
          entry.type === 'BILL' ? formatCurrency(entry.grandTotal) : '-',
          entry.type === 'PAYMENT' ? formatCurrency(Number(entry.amount) + (Number(entry.adjustment) || 0)) : '-'
        ]);
        customStyles = {
          3: { halign: 'right', fontStyle: 'bold', textColor: [220, 38, 38] },
          4: { halign: 'right', fontStyle: 'bold', textColor: [0, 128, 0] }
        };
      }

      if (body.length === 0) {
        body.push(head[0].map(() => '-'));
        body[0][1] = 'No records found';
      }

      autoTable(pdf, {
        startY: yPos,
        head: head,
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Report Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="report-type" className="text-sm">
                Report Type
              </Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="outstanding">
                    Outstanding Balance
                  </SelectItem>
                  <SelectItem value="bills">Bills by Date</SelectItem>
                  <SelectItem value="payments">Payments by Date</SelectItem>
                  <SelectItem value="company">Company Ledger</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="date-from" className="text-sm">
                From
              </Label>
              <Input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="date-to" className="text-sm">
                To
              </Label>
              <Input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="mt-1"
              />
            </div>

            {reportType === 'company' && (
              <div>
                <Label className="text-sm">Select Company</Label>
                <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                  <SelectTrigger className="mt-1">
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

            <div className="flex items-end gap-2">
              <Button className="flex-1">Generate</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Swapped: Table First */}
      <Card className="no-scrollbar">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              {reportType === 'outstanding' && 'Outstanding by Company'}
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
        <CardContent ref={reportRef}>
          <div className="overflow-x-auto">
            <Table>
              {reportType === 'outstanding' && (
                <>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead className="text-right">Outstanding</TableHead>
                      <TableHead className="text-right"># Bills</TableHead>
                      <TableHead className="text-right">Last Due</TableHead>
                      <TableHead className="text-right">Days Overdue</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {outstandingData.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{item.company}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(item.outstanding)}
                        </TableCell>
                        <TableCell className="text-right">{item.billsCount}</TableCell>
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
                      <TableHead>Type</TableHead>
                      <TableHead>Reference / Job No</TableHead>
                      <TableHead className="text-right">Debit</TableHead>
                      <TableHead className="text-right">Credit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companyLedger.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No entries for this company in range</TableCell></TableRow>
                    ) : (
                      companyLedger.map((entry: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell>{formatDate(entry.date)}</TableCell>
                          <TableCell className="text-[10px] uppercase font-black">{entry.type}</TableCell>
                          <TableCell className="font-mono text-xs">{entry.jobNumber || entry.reference || '-'}</TableCell>
                          <TableCell className="text-right font-bold text-red-600">
                            {entry.type === 'BILL' ? formatCurrency(entry.grandTotal) : '-'}
                          </TableCell>
                          <TableCell className="text-right font-bold text-green-600">
                            {entry.type === 'PAYMENT' ? formatCurrency(Number(entry.amount) + (Number(entry.adjustment) || 0)) : '-'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </>
              )}
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Swapped: Charts Next */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Outstanding Balance Trend
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
                  <p className="text-xs text-muted-foreground">Total Outstanding</p>
                  <p className="text-2xl font-bold text-primary mt-1">
                    PKR {totalOutstanding.toLocaleString()}
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
