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
import { Download, Search, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { useData as useFullData } from '@/context/data-context';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toPng } from 'html-to-image';

import { Badge } from '@/components/ui/badge';
import React, { useMemo, useState, useRef } from 'react';
import { useData } from '@/context/data-context';
import { useAuth } from '@/context/auth-context';
import { formatDate, formatCurrency } from '@/lib/utils';

export default function CompanyLedgerPage() {
  const { user, isHydrated: authHydrated } = useAuth();
  const { companies, getCompanyLedger } = useData();
  const { bills: allBills, payments: allPayments } = useFullData();
  const tableRef = useRef<HTMLDivElement>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const currentCompany = useMemo(() => {
    if (user?.role === 'company' && user.id) {
      return companies.find(c => String(c.id) === String(user.id)) || companies[0];
    }
    return companies[0];
  }, [user, companies]);

  const ledgerEntries = useMemo(() => {
    if (!currentCompany) return [];
    let entries = getCompanyLedger(currentCompany.id);

    // Apply Filters - NOTE: Balance is pre-calculated from the FULL list, so we just hide rows here.
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      entries = entries.filter(e =>
        e.description.toLowerCase().includes(lowerSearch) ||
        (e.debit > 0 && String(e.debit).includes(lowerSearch)) ||
        (e.credit > 0 && String(e.credit).includes(lowerSearch))
      );
    }

    if (startDate) {
      entries = entries.filter(e => e.date >= startDate);
    }

    if (endDate) {
      entries = entries.filter(e => e.date <= endDate);
    }

    return entries;
  }, [currentCompany, getCompanyLedger, searchTerm, startDate, endDate]);

  // Reverse for display: newest dates first
  const displayEntries = useMemo(() => {
    return [...ledgerEntries].reverse();
  }, [ledgerEntries]);

  const stats = useMemo(() => {
    const totalCharged = ledgerEntries.reduce((sum, item) => sum + item.debit, 0);
    const totalPaid = ledgerEntries.reduce((sum, item) => sum + item.credit, 0);
    const currentBalance = ledgerEntries.length > 0 ? ledgerEntries[ledgerEntries.length - 1].balance : 0;
    return { totalCharged, totalPaid, currentBalance };
  }, [ledgerEntries]);

  const handleExportBillStatusPDF = async () => {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();

      const img = new Image();
      img.src = '/logo.jpeg';
      await new Promise((resolve) => { img.onload = resolve; img.onerror = resolve; });
      if (img.width > 0) {
        const ratio = Math.min(16 / img.width, 16 / img.height);
        pdf.addImage(img, 'PNG', 14, 10, img.width * ratio, img.height * ratio);
      }

      pdf.setTextColor(15, 23, 42); pdf.setFontSize(14); pdf.setFont('helvetica', 'bold');
      pdf.text('THAHEEM BROTHERS', 34, 14);
      pdf.setTextColor(100, 116, 139); pdf.setFontSize(8); pdf.setFont('helvetica', 'normal');
      pdf.text('Suite 23, 2nd Floor, R.K. Square Ext, Shahrah-e-Liaquat, Karachi', 34, 19);
      pdf.text('+92 21 32421347 | +92 300 2791780 | import.khi@hotmail.com', 34, 23);
      pdf.setDrawColor(226, 232, 240); pdf.setLineWidth(0.5);
      pdf.line(14, 28, pageWidth - 14, 28);

      pdf.setTextColor(15, 23, 42); pdf.setFontSize(14); pdf.setFont('helvetica', 'bold');
      pdf.text('BILL PAYMENT STATUS REPORT', pageWidth - 14, 18, { align: 'right' });

      let yPos = 36;
      pdf.setFontSize(10); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(15, 23, 42);
      pdf.text(`Client: ${currentCompany?.name || '-'}`, 14, yPos);
      pdf.setFontSize(9); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(100, 116, 139);
      const periodLabel = (startDate || endDate)
        ? `Period: ${startDate ? formatDate(startDate) : 'Beginning'} to ${endDate ? formatDate(endDate) : 'Present'}`
        : 'Period: All Time';
      pdf.text(periodLabel, 14, yPos + 5);
      pdf.text(`Date Printed: ${formatDate(new Date().toISOString())}`, pageWidth - 14, yPos, { align: 'right' });
      yPos += 14;

      // Get bills for this company
      const compBills = allBills.filter(b => String(b.companyId) === String(currentCompany?.id) && b.status !== 'Draft');
      const compPayments = allPayments.filter(p => String(p.companyId) === String(currentCompany?.id));

      // Apply date filter
      const filteredBills = compBills.filter(b => {
        if (startDate && b.date < startDate) return false;
        if (endDate && b.date > endDate) return false;
        return true;
      });

      // Section 1 heading
      pdf.setFontSize(11); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(15, 23, 42);
      pdf.text('Bill Summary', 14, yPos); yPos += 4;

      let totalBillAmt = 0, totalAdvAmt = 0, totalPaidAmt = 0, totalAdjAmt = 0, totalOutstAmt = 0;

      const billRows = filteredBills.map(bill => {
        const linkedPayments = compPayments.filter(p => String(p.billId) === String(bill.id));
        const paid = linkedPayments.reduce((s, p) => s + Number(p.amount || 0), 0);
        const adj  = linkedPayments.reduce((s, p) => s + Number(p.adjustment || 0), 0);
        const adv  = Number(bill.advancePayment || 0);
        const total = Number(bill.grandTotal || bill.totalAmount || 0);
        const outstanding = Math.max(0, total - adv - paid - adj);
        const status = outstanding <= 0 ? 'PAID' : paid > 0 || adv > 0 ? 'PARTIAL' : 'UNPAID';

        totalBillAmt  += total;
        totalAdvAmt   += adv;
        totalPaidAmt  += paid;
        totalAdjAmt   += adj;
        totalOutstAmt += outstanding;

        return [
          formatDate(bill.date),
          bill.jobNumber || '-',
          formatCurrency(total),
          adv > 0 ? formatCurrency(adv) : '-',
          paid > 0 ? formatCurrency(paid) : '-',
          adj > 0 ? formatCurrency(adj) : '-',
          outstanding > 0 ? formatCurrency(outstanding) : '-',
          status,
          linkedPayments // keep for section 2
        ];
      });

      const displayRows = billRows.map(r => r.slice(0, 8)); // without linkedPayments
      displayRows.push(['', 'TOTALS', formatCurrency(totalBillAmt), formatCurrency(totalAdvAmt), formatCurrency(totalPaidAmt), formatCurrency(totalAdjAmt), formatCurrency(totalOutstAmt), '']);

      autoTable(pdf, {
        startY: yPos,
        head: [['Date', 'Job No', 'Bill Total', 'Advance', 'Paid', 'Adj.', 'Outstanding', 'Status']],
        body: displayRows,
        theme: 'grid',
        headStyles: { fillColor: [44, 62, 80], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 7.5, cellPadding: 1.5 },
        columnStyles: {
          2: { halign: 'right' }, 3: { halign: 'right' },
          4: { halign: 'right' }, 5: { halign: 'right' },
          6: { halign: 'right' }, 7: { halign: 'center', cellWidth: 18 },
        },
        didParseCell: function (data) {
          if (data.section === 'body') {
            if (data.column.index === 7) {
              const v = String((data.row.raw as any)[7] || '');
              if (v === 'PAID') { data.cell.styles.textColor = [22, 163, 74]; data.cell.styles.fontStyle = 'bold'; }
              else if (v === 'PARTIAL') { data.cell.styles.textColor = [217, 119, 6]; data.cell.styles.fontStyle = 'bold'; }
              else if (v === 'UNPAID') { data.cell.styles.textColor = [220, 38, 38]; data.cell.styles.fontStyle = 'bold'; }
            }
            if ((data.row.raw as any)[1] === 'TOTALS') {
              data.cell.styles.fontStyle = 'bold';
              data.cell.styles.fillColor = [241, 245, 249];
            }
          }
        }
      });

      // Section 2: Payment details per bill
      const finalY1 = (pdf as any).lastAutoTable.finalY || yPos + 20;
      let yPos2 = finalY1 + 10;
      if (yPos2 > 240) { pdf.addPage(); yPos2 = 20; }

      pdf.setFontSize(11); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(15, 23, 42);
      pdf.text('Payment Details Per Bill', 14, yPos2); yPos2 += 4;

      const detailRows: any[] = [];
      filteredBills.forEach((bill, idx) => {
        const linkedPayments = billRows[idx][8] as any[];
        const adv  = Number(bill.advancePayment || 0);
        const total = Number(bill.grandTotal || bill.totalAmount || 0);
        const paid = linkedPayments.reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
        const adj  = linkedPayments.reduce((s: number, p: any) => s + Number(p.adjustment || 0), 0);
        const outstanding = Math.max(0, total - adv - paid - adj);
        const status = outstanding <= 0 ? 'PAID' : paid > 0 || adv > 0 ? 'PARTIAL' : 'UNPAID';

        detailRows.push([{
          content: `${formatDate(bill.date)}  |  Job: ${bill.jobNumber || '-'}  |  Total: ${formatCurrency(total)}  |  Outstanding: ${outstanding > 0 ? formatCurrency(outstanding) : 'NIL'}  |  Status: ${status}`,
          colSpan: 4,
          styles: { fontStyle: 'bold', fillColor: [236, 242, 255], textColor: [15, 23, 42], fontSize: 7.5 }
        }]);

        if (adv > 0) {
          detailRows.push(['Advance', '-', formatCurrency(adv), 'Advance Received']);
        }
        if (linkedPayments.length > 0) {
          linkedPayments.forEach((p: any) => {
            const ref = [p.reference, p.trackingId, p.chequeNo, p.payOrderNo].filter(Boolean).join(' | ');
            detailRows.push([p.method || 'Payment', ref || '-', p.amount > 0 ? formatCurrency(Number(p.amount)) : '-', p.adjustment > 0 ? formatCurrency(Number(p.adjustment)) : '-']);
          });
        }
        if (linkedPayments.length === 0 && adv <= 0) {
          detailRows.push([{ content: 'No payments recorded', colSpan: 4, styles: { textColor: [150, 150, 150], fontStyle: 'italic', fontSize: 7 } }]);
        }
      });

      if (detailRows.length === 0) {
        detailRows.push([{ content: 'No bills found.', colSpan: 4, styles: { textColor: [150, 150, 150] } }]);
      }

      autoTable(pdf, {
        startY: yPos2,
        head: [['Method', 'Reference / Tracking', 'Amount Paid', 'Adjustment']],
        body: detailRows,
        theme: 'grid',
        headStyles: { fillColor: [22, 163, 74], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 7.5, cellPadding: 1.5 },
        columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' } }
      });

      // Grand Summary
      const finalY2 = (pdf as any).lastAutoTable.finalY || yPos2 + 10;
      const paidCnt   = filteredBills.filter((_, i) => { const r = billRows[i]; return (r[6] === '-' || r[6] === undefined); }).length;
      const paidCount = filteredBills.filter((bill) => {
        const lp = compPayments.filter(p => String(p.billId) === String(bill.id));
        const paid2 = lp.reduce((s, p) => s + Number(p.amount || 0), 0);
        const adj2  = lp.reduce((s, p) => s + Number(p.adjustment || 0), 0);
        const adv2  = Number(bill.advancePayment || 0);
        const tot2  = Number(bill.grandTotal || bill.totalAmount || 0);
        return tot2 - adv2 - paid2 - adj2 <= 0;
      }).length;
      const unpaidCount = filteredBills.filter((bill) => {
        const lp = compPayments.filter(p => String(p.billId) === String(bill.id));
        const paid2 = lp.reduce((s, p) => s + Number(p.amount || 0), 0);
        const adv2  = Number(bill.advancePayment || 0);
        return paid2 <= 0 && adv2 <= 0;
      }).length;
      const partCount = filteredBills.length - paidCount - unpaidCount;

      let fY = finalY2 + 10;
      if (fY > 260) { pdf.addPage(); fY = 20; }

      pdf.setFontSize(11); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(15, 23, 42);
      pdf.text('Grand Summary', 14, fY); fY += 6;
      pdf.setFontSize(9); pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(22, 163, 74);  pdf.text(`✓  Fully Paid Bills:     ${paidCount}`, 14, fY); fY += 5;
      pdf.setTextColor(217, 119, 6); pdf.text(`⊘  Partially Paid Bills: ${partCount}`, 14, fY); fY += 5;
      pdf.setTextColor(220, 38, 38);  pdf.text(`✗  Unpaid Bills:         ${unpaidCount}`, 14, fY); fY += 7;
      pdf.setTextColor(15, 23, 42); pdf.setFont('helvetica', 'bold');
      pdf.text(`Total Bill Amount:    ${formatCurrency(totalBillAmt)}`, 14, fY); fY += 5;
      pdf.text(`Total Collected:      ${formatCurrency(totalPaidAmt + totalAdvAmt + totalAdjAmt)}`, 14, fY); fY += 5;
      pdf.text(`Total Outstanding:    ${formatCurrency(totalOutstAmt)}`, 14, fY);

      pdf.save(`Bill_Payment_Status_${(currentCompany?.name || 'Company').replace(/[/\\?%*:|"<>\s]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('Failed to export Bill Status PDF', err);
    }
  };

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
      const title = currentCompany?.name || 'Company Ledger';
      pdf.text(title, pageWidth - 14, 18, { align: "right" });

      let yPos = 36;
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(100, 116, 139);
      if (startDate || endDate) {
        pdf.text(`Period: ${startDate ? formatDate(startDate) : 'Beginning'} to ${endDate ? formatDate(endDate) : 'Present'}`, 14, yPos);
      } else {
        pdf.text(`Period: All Time`, 14, yPos);
      }

      pdf.text(`Date Printed: ${formatDate(new Date().toISOString())}`, pageWidth - 14, yPos, { align: "right" });
      yPos += 8;

      // Reverse for PDF export (newest first)
      const reversedForPDF = [...ledgerEntries].reverse();
      let body = reversedForPDF.map(entry => {
        let desc = entry.description;
        if (entry.type === 'PAYMENT') {
          desc = (entry as any).method ? `Payment Received (${(entry as any).method})` : 'Advance Received';
          if ((entry as any).paymentRef) desc += ` - Ref: ${(entry as any).paymentRef}`;
        }
        return [
          formatDate(entry.date),
          desc,
          entry.jobNumber || '-',
          entry.weight ? `${entry.weight} KG` : '-',
          entry.debit > 0 ? formatCurrency(entry.debit) : '-',
          entry.credit > 0 ? formatCurrency(entry.credit) : '-',
          formatCurrency(entry.balance)
        ];
      });

      if (body.length === 0) {
        body.push(['-', 'No records found', '-', '-', '-', '-', '-']);
      }

      autoTable(pdf, {
        startY: yPos,
        head: [['Date', 'Description', 'Job No', 'Weight', 'Debit', 'Credit', 'Balance']],
        body: body,
        theme: 'grid',
        headStyles: { fillColor: [44, 62, 80], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 20 },
          4: { halign: 'right' },
          5: { halign: 'right' },
          6: { halign: 'right', fontStyle: 'bold' }
        },
        didParseCell: function (data) {
          if (data.section === 'body') {
            if (data.column.index === 6) {
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

      // Add Summary Totals at the bottom
      const finalY = (pdf as any).lastAutoTable.finalY || 62;

      pdf.setFontSize(11);
      pdf.setFont("helvetica", "bold");
      pdf.text("Account Summary", 14, finalY + 10);

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");

      pdf.text(`Total Charged:  ${formatCurrency(stats.totalCharged)}`, 14, finalY + 18);
      pdf.text(`Total Paid:     ${formatCurrency(stats.totalPaid)}`, 14, finalY + 24);

      pdf.setFont("helvetica", "bold");
      pdf.text(`Final Balance:  ${formatCurrency(stats.currentBalance)}`, 14, finalY + 30);

      pdf.save(`Ledger_${currentCompany?.name.replace(/[/\\?%*:|"<>\s]/g, '_') || 'Report'}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('Failed to export PDF', err);
    }
  };

  if (!authHydrated || !currentCompany) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center text-muted-foreground">Loading your ledger...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Ledger</h1>
          <p className="text-muted-foreground mt-1">
            Transaction history for <span className="text-primary font-semibold">{currentCompany.name}</span>
          </p>
        </div>

        <Card className="shadow-md border-border/50">
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <Label className="text-xs font-semibold uppercase text-muted-foreground mb-1 block">Search Ledger</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search description, amount..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs font-semibold uppercase text-muted-foreground mb-1 block">From Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs font-semibold uppercase text-muted-foreground mb-1 block">To Date</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Transaction History</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-2 bg-transparent border-green-500/30 hover:bg-green-50 text-green-700" onClick={handleExportBillStatusPDF}>
                  <Download className="w-4 h-4 text-green-600" />
                  Bill Status
                </Button>
                <Button variant="outline" size="sm" className="gap-2 bg-transparent" onClick={handleExportPDF}>
                  <Download className="w-4 h-4" />
                  Ledger
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent ref={tableRef}>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-[40px]"></TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Job No</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledgerEntries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No transactions found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    displayEntries.map((entry) => (
                      <React.Fragment key={entry.id}>
                        <TableRow className="hover:bg-muted/30 group">
                          <TableCell className="text-sm text-muted-foreground align-top pt-3">
                            {formatDate(entry.date)}
                          </TableCell>
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
                          <TableCell className="text-sm align-top pt-3">
                            {entry.description}
                          </TableCell>
                          <TableCell className="font-mono text-sm align-top pt-3">
                            {entry.jobNumber || '-'}
                          </TableCell>
                          <TableCell className="text-right text-sm align-top pt-3">
                            {entry.debit > 0 ? (
                              <span className="text-red-600 font-semibold">
                                {entry.debit.toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right text-sm align-top pt-3">
                            {entry.credit > 0 ? (
                              <span className="text-green-600 font-semibold">
                                {entry.credit.toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-sm align-top pt-3 bg-muted/10 font-bold">
                            {entry.balance.toLocaleString()}
                          </TableCell>
                        </TableRow>

                        {/* Expandable Sub-Row */}
                        {entry.type === 'BILL' && expandedRows.has(entry.id) && (
                          <TableRow className="bg-muted/5">
                            <TableCell colSpan={7} className="p-0 border-b">
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
                                    <p className="font-medium text-primary font-bold">{entry.debit.toLocaleString()}</p>
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

            <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-4 border border-blue-200 dark:border-blue-800 mt-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Total Charged</p>
                  <p className="text-lg font-black text-foreground mt-1">
                    {stats.totalCharged.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Total Paid</p>
                  <p className="text-lg font-black text-foreground mt-1">
                    {stats.totalPaid.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Current Balance</p>
                  <p className="text-lg font-black text-primary mt-1">
                    {stats.currentBalance.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
