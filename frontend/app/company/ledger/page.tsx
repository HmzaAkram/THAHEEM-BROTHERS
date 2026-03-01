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

  const stats = useMemo(() => {
    const totalCharged = ledgerEntries.reduce((sum, item) => sum + item.debit, 0);
    const totalPaid = ledgerEntries.reduce((sum, item) => sum + item.credit, 0);
    const currentBalance = ledgerEntries.length > 0 ? ledgerEntries[ledgerEntries.length - 1].balance : 0;
    return { totalCharged, totalPaid, currentBalance };
  }, [ledgerEntries]);

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

      let body = ledgerEntries.map(entry => {
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
                <Button variant="outline" size="sm" className="gap-2 bg-transparent" onClick={handleExportPDF}>
                  <Download className="w-4 h-4" />
                  Export
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
                    ledgerEntries.map((entry) => (
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
