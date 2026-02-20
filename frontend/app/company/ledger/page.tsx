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
import { Download, Search, Calendar } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image';

import { Badge } from '@/components/ui/badge';
import { useMemo, useState, useRef } from 'react';
import { useData } from '@/context/data-context';
import { useAuth } from '@/context/auth-context';
import { formatDate } from '@/lib/utils';

export default function CompanyLedgerPage() {
  const { user, isHydrated: authHydrated } = useAuth();
  const { companies, getCompanyLedger } = useData();
  const tableRef = useRef<HTMLDivElement>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

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
    if (!tableRef.current) return;

    try {
      const dataUrl = await toPng(tableRef.current, { cacheBust: true, style: { background: 'white', padding: '20px' } });
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Ledger_${currentCompany?.name || 'Report'}_${new Date().toISOString().split('T')[0]}.pdf`);
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
                      <TableRow key={entry.id}>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(entry.date)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {entry.description}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {entry.jobNumber || entry.billNo || '-'}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {entry.debit > 0 ? (
                            <span className="text-red-600 font-semibold">
                              PKR {entry.debit.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {entry.credit > 0 ? (
                            <span className="text-green-600 font-semibold">
                              PKR {entry.credit.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-sm">
                          PKR {entry.balance.toLocaleString()}
                        </TableCell>
                      </TableRow>
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
                    PKR {stats.totalCharged.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Total Paid</p>
                  <p className="text-lg font-black text-foreground mt-1">
                    PKR {stats.totalPaid.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Current Balance</p>
                  <p className="text-lg font-black text-primary mt-1">
                    PKR {stats.currentBalance.toLocaleString()}
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
