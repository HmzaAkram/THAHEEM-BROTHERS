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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Download, Filter, Check, ChevronsUpDown, Search, DollarSign, ArrowUpCircle, ArrowDownCircle, Scale, ChevronDown, ChevronUp } from 'lucide-react';
import { useRef, useState, useMemo } from 'react';
import React from 'react';
import { useData, LedgerEntry } from '@/context/data-context';
import { Input } from '@/components/ui/input';
import { formatDate, cn, formatCurrency } from '@/lib/utils';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DashboardCard } from '@/components/dashboard-card';
import { CompanySelect } from '@/components/company-select';

export default function LedgerPage() {
  const { companies, bills, payments } = useData();
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const tableRef = useRef<HTMLDivElement>(null);

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const { ledgerData, openingBalance } = useMemo(() => {
    let consolidatedEntries: any[] = [];

    // Process Bills
    const companyBills = selectedCompanyId === 'all' ? bills : bills.filter(b => String(b.companyId) === selectedCompanyId);

    companyBills.forEach(bill => {
      // Find all payments linked to this bill
      const linkedPayments = payments.filter(p => String(p.billId) === String(bill.id));
      const totalPaid = linkedPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
      const totalAdjustment = linkedPayments.reduce((sum, p) => sum + Number(p.adjustment || 0), 0);

      const debitAmount = bill.grandTotal || bill.totalAmount || 0;
      const advanceAmount = bill.advancePayment || 0;
      const outstanding = debitAmount - advanceAmount - totalPaid - totalAdjustment;

      consolidatedEntries.push({
        id: `bill_${bill.id}`,
        date: bill.date,
        type: 'BILL',
        description: (bill as any).description || `Job #${bill.jobNumber || 'N/A'}`,
        companyName: bill.companyName,
        jobNumber: bill.jobNumber,
        debit: debitAmount,
        advance: advanceAmount,
        paid: totalPaid,
        adjustment: totalAdjustment,
        credit: advanceAmount + totalPaid + totalAdjustment,
        outstanding: outstanding,
        via: bill.via,
        weight: bill.weight,
        packages: bill.packages,
        igm: bill.igm,
        gdNumber: bill.gdNumber,
      });
    });

    // Process Unlinked Payments (Payments with no billId, advance generic payments)
    const companyPayments = selectedCompanyId === 'all' ? payments : payments.filter(p => String(p.companyId) === selectedCompanyId);
    companyPayments.forEach(p => {
      if (!p.billId) {
        consolidatedEntries.push({
          id: `pay_${p.id}`,
          date: p.date,
          type: 'PAYMENT',
          description: p.description ? `Payment: ${p.description}` : 'Payment Received',
          companyName: p.companyName,
          jobNumber: null,
          debit: 0,
          advance: 0,
          paid: Number(p.amount || 0),
          adjustment: Number(p.adjustment || 0),
          credit: Number(p.amount || 0) + Number(p.adjustment || 0),
          outstanding: 0,
          method: p.method,
          paymentRef: p.reference,
        });
      }
    });

    // Sort chronologically
    consolidatedEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate exact inherent opening balance for "ALL" time
    let baseOpeningBal = 0;
    if (selectedCompanyId === 'all') {
      companies.forEach(c => baseOpeningBal += (Number(c.openingBalance) || 0));
    } else {
      const comp = companies.find(c => String(c.id) === selectedCompanyId);
      if (comp) baseOpeningBal = (Number(comp.openingBalance) || 0);
    }

    let openingBal = baseOpeningBal;
    let filteredEntries = consolidatedEntries;

    // Filter by Starting Date & Calculate Opening Balance
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);

      const previousEntries = consolidatedEntries.filter(e => new Date(e.date) < start);
      previousEntries.forEach(e => {
        openingBal += (e.debit - e.credit);
      });

      filteredEntries = consolidatedEntries.filter(e => new Date(e.date) >= start);
    }

    // Filter by End Date
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filteredEntries = filteredEntries.filter(e => new Date(e.date) <= end);
    }

    // Recalculate running balance for the view
    let running = openingBal;
    const dataWithBalance = filteredEntries.map(entry => {
      running += (entry.debit - entry.credit);
      return { ...entry, balance: running };
    });

    // Calculate Remaining Opening Balance (Lifecycle total)
    const clearedOpeningBal = companyPayments
      .filter(p => !p.billId)
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const remainingOpeningBalance = Math.max(0, baseOpeningBal - clearedOpeningBal);

    // Attach remainingOpeningBalance to the array so we can access it in the UI easily
    const result: any = [...dataWithBalance];
    result.remainingOpeningBalance = remainingOpeningBalance;

    return { ledgerData: result, openingBalance: openingBal, remainingOpeningBalance };
  }, [selectedCompanyId, companies, bills, payments, startDate, endDate]);

  const totals = useMemo(() => {
    return ledgerData.reduce((acc: any, item: any) => {
      // Do not sum the explicit "Opening Balance" injected entry into "Total Billed" (debit), 
      // as it's already represented in the "Opening Balance" card.
      if (item.description === 'Opening Balance') return acc;

      return {
        debit: acc.debit + item.debit,
        credit: acc.credit + item.credit
      };
    }, { debit: 0, credit: 0 });
  }, [ledgerData]);

  const handleExportPDF = async () => {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();

      const img = new Image();
      img.src = '/logo.jpeg'; // Ensure this matches the correct path

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

        // Left aligned logo
        pdf.addImage(img, 'PNG', 14, 10, logoWidth, logoHeight);
      }

      // Company Info (Thaheem Brothers)
      pdf.setTextColor(15, 23, 42); // slate-900
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("THAHEEM BROTHERS", 34, 14);

      pdf.setTextColor(100, 116, 139); // slate-500
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
      pdf.text("Suite 23, 2nd Floor, R.K. Square Ext, Shahrah-e-Liaquat, Karachi", 34, 19);
      pdf.text("+92 21 32421347 | +92 300 2791780 | import.khi@hotmail.com", 34, 23);

      // Line Separator
      pdf.setDrawColor(226, 232, 240); // slate-200
      pdf.setLineWidth(0.5);
      pdf.line(14, 28, pageWidth - 14, 28);

      // Add Title
      pdf.setTextColor(15, 23, 42); // slate-900
      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      const title = "SUMMARY";
      pdf.text(title, pageWidth - 14, 18, { align: "right" });

      // Add Client Info Below Line
      let yPos = 36;
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(15, 23, 42);
      const companyNameStr = selectedCompanyId !== 'all' ? companies.find(c => c.id === selectedCompanyId)?.name || 'All Companies' : 'All Companies';
      pdf.text(`Client: ${companyNameStr}`, 14, yPos);

      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(100, 116, 139);
      if (startDate || endDate) {
        pdf.text(`Period: ${startDate ? formatDate(startDate) : 'Beginning'} to ${endDate ? formatDate(endDate) : 'Present'}`, 14, yPos + 5);
      } else {
        pdf.text(`Period: All Time`, 14, yPos + 5);
      }

      pdf.text(`Date Printed: ${formatDate(new Date().toISOString())}`, pageWidth - 14, yPos, { align: "right" });
      
      const { remainingOpeningBalance } = ledgerData.length > 0 ? (ledgerData[0] as any)._meta || { remainingOpeningBalance: 0 } : { remainingOpeningBalance: 0 }; 
      // Note: I need to make sure remainingOpeningBalance is accessible here. 
      // Actually, I'll just use the calculated one from the scope if possible, but handleExportPDF is outside useMemo.
      // I'll calculate it again inside handleExportPDF for simplicity or pass it.
      
      // Better approach: Calculate it right here.
      const companyPaymentsForPDF = selectedCompanyId === 'all' ? payments : payments.filter(p => String(p.companyId) === selectedCompanyId);
      let baseOpeningBalPDF = 0;
      if (selectedCompanyId === 'all') {
        companies.forEach(c => baseOpeningBalPDF += (Number(c.openingBalance) || 0));
      } else {
        const comp = companies.find(c => String(c.id) === selectedCompanyId);
        if (comp) baseOpeningBalPDF = (Number(comp.openingBalance) || 0);
      }
      const clearedOpeningBalPDF = companyPaymentsForPDF.filter(p => !p.billId).reduce((sum, p) => sum + Number(p.amount || 0), 0);
      const remainingOpeningBalPDF = Math.max(0, baseOpeningBalPDF - clearedOpeningBalPDF);

      pdf.text(`Opening Balance: ${formatCurrency(remainingOpeningBalPDF)}`, pageWidth - 14, yPos + 5, { align: "right" });
      
      yPos += 12;

      // Prepare Table Data
      let tableRows = [];

      // Opening Balance Row
      if (startDate && selectedCompanyId !== 'all') {
        tableRows.push([
          formatDate(startDate),
          'Opening Balance b/f',
          '-',
          '-',
          '-',
          '-',
          '-',
          '-',
          formatCurrency(openingBalance)
        ]);
      }

      // Map Ledger Data
      const exportData = ledgerData.map((entry: any) => {
        let desc = entry.description;
        if (entry.type === 'PAYMENT') {
          desc = entry.method ? `Payment Received (${entry.method})` : 'Advance Received';
          if (entry.paymentRef) desc += ` - Ref: ${entry.paymentRef}`;
        }

        return [
          new Date(entry.date).toLocaleDateString(),
          selectedCompanyId === 'all' ? `${entry.companyName}\n${desc}` : desc,
          entry.jobNumber || '-',
          entry.debit > 0 ? formatCurrency(entry.debit) : '-',
          entry.advance > 0 ? formatCurrency(entry.advance) : '-',
          entry.paid > 0 ? formatCurrency(entry.paid) : '-',
          entry.adjustment > 0 ? formatCurrency(entry.adjustment) : '-',
          entry.outstanding > 0 ? formatCurrency(entry.outstanding) : '-',
          formatCurrency(entry.balance)
        ];
      });

      tableRows = [...tableRows, ...exportData];

      if (tableRows.length === 0) {
        tableRows.push(['-', 'No transactions found', '-', '-', '-', '-', '-', '-', '-']);
      }

      autoTable(pdf, {
        startY: yPos + 4,
        head: [['Date', 'Description', 'Job No', 'Bill Total', 'Advance', 'Paid', 'Adj.', 'Outst.', 'Balance']],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [44, 62, 80], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 7, cellPadding: 1.5 },
        columnStyles: {
          0: { cellWidth: 18 },
          3: { halign: 'right' },
          4: { halign: 'right' },
          5: { halign: 'right' },
          6: { halign: 'right' },
          7: { halign: 'right' },
          8: { halign: 'right', fontStyle: 'bold' }
        },
        didParseCell: function (data) {
          if (data.section === 'body') {
            if (data.row.index === 0 && startDate && selectedCompanyId !== 'all') {
              data.cell.styles.fontStyle = 'italic';
              data.cell.styles.textColor = [100, 100, 100];
            }

            if (data.column.index === 8) {
              const valStr = data.cell.text[0] || '';
              const numStr = valStr.replace(/[^0-9.-]/g, '');
              const numVal = parseFloat(numStr);
              if (!isNaN(numVal)) {
                if (numVal > 0) {
                  data.cell.styles.textColor = [220, 38, 38]; // Red for outstanding balance
                } else if (numVal <= 0) {
                  data.cell.styles.textColor = [0, 128, 0]; // Green for zero or credit balance
                }
              }
            }
          }
        }
      });

      const dateStr = new Date().toISOString().split('T')[0];
      const safeCompanyName = companyNameStr.replace(/[/\\?%*:|"<>\s]/g, '_');
      pdf.save(`General_Ledger_${safeCompanyName}_${dateStr}.pdf`);
    } catch (err) {
      console.error('Failed to export PDF', err);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="w-full md:w-auto">
            <h1 className="text-3xl font-bold text-foreground bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
              Company Ledger
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              View transaction history and running balances.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Button
              variant="outline"
              onClick={handleExportPDF}
              className="w-full sm:w-auto gap-2 border-primary/20 hover:bg-primary/5 hover:border-primary/40 transition-all rounded-xl shadow-sm"
            >
              <Download className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-primary">Export PDF</span>
            </Button>
          </div>
        </div>

        {/* Report Style Filter Card */}
        <Card className="shadow-md border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Ledger Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col lg:flex-row items-center gap-4 bg-background/50 p-4 rounded-xl border border-border/50">
              <div className="w-full lg:w-64">
                <CompanySelect
                  companies={companies}
                  value={selectedCompanyId}
                  onValueChange={setSelectedCompanyId}
                  showAllOption
                  allOptionLabel="-- All Transactions --"
                  className="w-full justify-between bg-white border-border/40 rounded-xl"
                />
              </div>
              <div className="flex flex-col sm:flex-row flex-wrap gap-3 w-full lg:w-auto">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground hidden lg:block">From</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-10 flex-1 sm:w-40 bg-white"
                  />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground hidden lg:block">To</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-10 flex-1 sm:w-40 bg-white"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ledger Table */}
        <Card className="shadow-md border-border/50">
          <CardContent ref={tableRef} className="pt-6">
            <div className="rounded-md border bg-card overflow-hidden">
              <div className="overflow-x-auto custom-scrollbar">
                <div className="min-w-[1100px]">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-[100px] text-xs">Date</TableHead>
                        <TableHead className="w-[30px]"></TableHead>
                        <TableHead className="min-w-[200px] text-xs">Description</TableHead>
                        <TableHead className="w-[100px] text-xs">Job No</TableHead>
                        <TableHead className="text-right text-destructive w-[100px] text-xs">Bill Total</TableHead>
                        <TableHead className="text-right text-muted-foreground w-[90px] text-xs">Advance</TableHead>
                        <TableHead className="text-right text-green-600 w-[90px] text-xs">Paid</TableHead>
                        <TableHead className="text-right text-amber-600 w-[80px] text-xs">Adj.</TableHead>
                        <TableHead className="text-right text-blue-600 w-[100px] text-xs">Outst.</TableHead>
                        {selectedCompanyId !== 'all' && (
                          <TableHead className="text-right font-bold bg-muted/30 w-[120px] text-xs">Balance</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                  {/* Opening Balance Row if filtered by date */}
                  {startDate && selectedCompanyId !== 'all' && (
                    <TableRow className="bg-muted/20">
                      <TableCell className="text-sm font-medium text-muted-foreground">
                        {formatDate(startDate)}
                      </TableCell>
                      <TableCell colSpan={7} className="font-medium italic text-muted-foreground">
                        Opening Balance b/f
                      </TableCell>
                      <TableCell className="text-right font-bold font-mono text-sm">
                        {formatCurrency(openingBalance)}
                      </TableCell>
                    </TableRow>
                  )}

                  {ledgerData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={selectedCompanyId !== 'all' ? 10 : 9} className="h-24 text-center text-muted-foreground">
                        No transactions found for the selected period.
                      </TableCell>
                    </TableRow>
                  ) : (
                    ledgerData.map((entry: any) => (
                      <React.Fragment key={entry.id}>
                        <TableRow className="hover:bg-muted/30 group">
                          {/* 1. Date */}
                          <TableCell className="text-sm font-medium align-top pt-3">
                            {new Date(entry.date).toLocaleDateString()}
                          </TableCell>

                          {/* Expand Button */}
                          <TableCell className="align-top pt-3 px-0">
                            {entry.type === 'BILL' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 rounded-full hover:bg-primary/10 text-muted-foreground"
                                onClick={() => toggleRow(entry.id)}
                              >
                                {expandedRows.has(entry.id) ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                          </TableCell>

                          {/* 2. Description (Company Name First -> Method/Details) */}
                          <TableCell className="align-top pt-3">
                            <div className="flex flex-col gap-1">
                              {/* Company Name First - Bold */}
                              {selectedCompanyId === 'all' && (
                                <span className="font-bold text-base text-foreground">
                                  {entry.companyName}
                                </span>
                              )}

                              {/* Transaction Details */}
                              <div className="text-sm text-muted-foreground">
                                {entry.type === 'BILL' ? (
                                  <div className="flex flex-col">
                                    <span className="font-medium text-foreground/80">{entry.description}</span>
                                  </div>
                                ) : (
                                  <div className="flex flex-col gap-0.5">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-foreground/80">
                                        {/* ADVANCE PAYMENT: If no method, it's an advance */}
                                        {(entry as any).method ? `Payment Received (${(entry as any).method})` : 'Advance Received'}
                                      </span>
                                      {(entry as any).paymentRef && (
                                        <span className="text-xs bg-secondary px-1.5 py-0.5 rounded font-mono text-foreground">
                                          {(entry as any).paymentRef}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>

                          {/* 3. Job # */}
                          <TableCell className="align-top pt-3">
                            {entry.jobNumber ? (
                              <div className="flex flex-col gap-0.5">
                                <span className="font-mono text-xs font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded w-fit">
                                  {entry.jobNumber}
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground/30 text-xs">-</span>
                            )}
                          </TableCell>

                          {/* 4. Bill Total */}
                          <TableCell className="text-right text-sm align-top pt-3">
                            {entry.debit > 0 ? (
                              <span className="text-destructive font-bold" title="Total Bill Amount">
                                {formatCurrency(entry.debit)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground/30">-</span>
                            )}
                          </TableCell>

                          {/* 5. Advance */}
                          <TableCell className="text-right text-sm align-top pt-3">
                            {entry.advance > 0 ? (
                              <span className="text-muted-foreground font-medium" title="Advance Received">
                                {formatCurrency(entry.advance)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground/30">-</span>
                            )}
                          </TableCell>

                          {/* 6. Paid */}
                          <TableCell className="text-right text-sm align-top pt-3">
                            {entry.paid > 0 ? (
                              <span className="text-green-600 font-bold" title="Payment Received">
                                {formatCurrency(entry.paid)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground/30">-</span>
                            )}
                          </TableCell>

                          {/* 7. Adjustment */}
                          <TableCell className="text-right text-sm align-top pt-3">
                            {entry.adjustment > 0 ? (
                              <span className="text-amber-600 font-medium" title="Adjustment Made">
                                {formatCurrency(entry.adjustment)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground/30">-</span>
                            )}
                          </TableCell>

                          {/* 8. Outstanding */}
                          <TableCell className="text-right text-sm align-top pt-3 bg-blue-50/30 dark:bg-blue-900/10">
                            {entry.outstanding > 0 ? (
                              <span className="text-blue-600 font-bold" title="Outstanding Bill Balance">
                                {formatCurrency(entry.outstanding)}
                              </span>
                            ) : entry.type === 'BILL' ? (
                              <span className="text-muted-foreground/50 text-xs italic">Clear</span>
                            ) : (
                              <span className="text-muted-foreground/30">-</span>
                            )}
                          </TableCell>

                          {/* 9. Balance */}
                          {selectedCompanyId !== 'all' && (
                            <TableCell className="text-right font-mono text-sm align-top pt-3 bg-muted/10 font-bold">
                              {formatCurrency(entry.balance)}
                            </TableCell>
                          )}
                        </TableRow>

                        {/* Expandable Sub-Row */}
                        {entry.type === 'BILL' && expandedRows.has(entry.id) && (
                          <TableRow className="bg-muted/5">
                            <TableCell colSpan={selectedCompanyId !== 'all' ? 10 : 9} className="p-0 border-b">
                              <div className="p-4 animate-in slide-in-from-top-2 fade-in duration-200">
                                <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-xs">
                                  <div>
                                    <p className="text-muted-foreground font-semibold mb-1 uppercase tracking-wider">Via</p>
                                    <p className="font-medium">{entry.via || '-'}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground font-semibold mb-1 uppercase tracking-wider">Weight</p>
                                    <p className="font-medium">{entry.weight ? `${entry.weight} KG` : '-'}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground font-semibold mb-1 uppercase tracking-wider">Packages</p>
                                    <p className="font-medium">{entry.packages || '-'}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground font-semibold mb-1 uppercase tracking-wider">IGM</p>
                                    <p className="font-medium">{entry.igm || '-'}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground font-semibold mb-1 uppercase tracking-wider">GD Number</p>
                                    <p className="font-medium">{entry.gdNumber || '-'}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground font-semibold mb-1 uppercase tracking-wider">Total Bill</p>
                                    <p className="font-medium text-primary font-bold">{formatCurrency(entry.debit)}</p>
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))
                  )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>

            {/* Bottom Summary Totals */}
            {ledgerData.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-8 pt-8 border-t">
                <DashboardCard
                  title="Opening Balance"
                  value={formatCurrency(openingBalance)}
                  icon={Scale}
                  change={startDate ? "Balance b/f" : "Total Opening"}
                  changeType="neutral"
                />
                <DashboardCard
                  title="Opening Balance"
                  value={formatCurrency((ledgerData as any).remainingOpeningBalance || 0)}
                  icon={ArrowDownCircle}
                  change="Total Opening Balance"
                  changeType={((ledgerData as any).remainingOpeningBalance || 0) > 0 ? "negative" : "positive"}
                />
                <DashboardCard
                  title="Total Billed"
                  value={formatCurrency(totals.debit)}
                  icon={ArrowUpCircle}
                  change="In selected period"
                  changeType="negative"
                />
                <DashboardCard
                  title="Total Paid"
                  value={formatCurrency(totals.credit)}
                  icon={ArrowDownCircle}
                  change="In selected period"
                  changeType="positive"
                />
                <DashboardCard
                  title="Closing Balance"
                  value={formatCurrency(ledgerData[ledgerData.length - 1].balance)}
                  icon={DollarSign}
                  change="Current Standing"
                  changeType={ledgerData[ledgerData.length - 1].balance > 0 ? "negative" : "positive"}
                />
              </div>
            )}

          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
