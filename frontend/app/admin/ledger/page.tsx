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
import { Download, Filter, Check, ChevronsUpDown, Search, DollarSign, ArrowUpCircle, ArrowDownCircle, Scale } from 'lucide-react';
import { useRef, useState, useMemo } from 'react';
import { useData, LedgerEntry } from '@/context/data-context';
import { Input } from '@/components/ui/input';
import { formatDate, cn, formatCurrency } from '@/lib/utils';
import { jsPDF } from 'jspdf';
import { toJpeg } from 'html-to-image';
import { DashboardCard } from '@/components/dashboard-card';
import { CompanySelect } from '@/components/company-select';

export default function LedgerPage() {
  const { companies, getCompanyLedger } = useData();
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const tableRef = useRef<HTMLDivElement>(null);

  const { ledgerData, openingBalance } = useMemo(() => {
    let allEntries: LedgerEntry[] = [];

    if (selectedCompanyId === 'all') {
      companies.forEach(c => {
        allEntries.push(...getCompanyLedger(c.id));
      });
    } else {
      allEntries = getCompanyLedger(selectedCompanyId);
    }

    // Sort chronologically for calculation
    allEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let openingBal = 0;
    let filteredEntries = allEntries;

    // Filter by Starting Date & Calculate Opening Balance
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0); // Set to beginning of the day

      const previousEntries = allEntries.filter(e => new Date(e.date) < start);

      // Calculate opening balance from previous entries
      previousEntries.forEach(e => {
        openingBal += (e.debit - e.credit);
      });

      filteredEntries = allEntries.filter(e => new Date(e.date) >= start);
    }

    // Filter by End Date
    if (endDate) {
      const end = new Date(endDate);
      // Include the end date fully
      end.setHours(23, 59, 59, 999);
      filteredEntries = filteredEntries.filter(e => new Date(e.date) <= end);
    }

    // Recalculate running balance for the view
    let running = openingBal;
    const dataWithBalance = filteredEntries.map(entry => {
      running += (entry.debit - entry.credit);
      return { ...entry, balance: running };
    });

    return { ledgerData: dataWithBalance, openingBalance: openingBal };
  }, [selectedCompanyId, companies, getCompanyLedger, startDate, endDate]);

  const totals = useMemo(() => {
    return ledgerData.reduce((acc, item) => ({
      debit: acc.debit + item.debit,
      credit: acc.credit + item.credit
    }), { debit: 0, credit: 0 });
  }, [ledgerData]);

  const handleExportPDF = async () => {
    if (!tableRef.current) return;

    try {
      const dataUrl = await toJpeg(tableRef.current, { cacheBust: true, quality: 0.95, style: { background: 'white', padding: '20px' } });
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(dataUrl, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`General_Ledger_${selectedCompanyId !== 'all' ? companies.find(c => c.id === selectedCompanyId)?.name : 'All'}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('Failed to export PDF', err);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <h1 className="text-3xl font-bold text-foreground">General Ledger</h1>
          <p className="text-muted-foreground mt-1">
            View transaction history and running balances.
          </p>
        </div>

        {/* Report Style Filter Card */}
        <Card className="shadow-md border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Ledger Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <Label className="text-sm font-medium mb-1.5 block">Select Client Company</Label>
                <CompanySelect
                  companies={companies}
                  value={selectedCompanyId}
                  onValueChange={setSelectedCompanyId}
                  showAllOption
                  allOptionLabel="-- All Transactions --"
                  className="w-full justify-between bg-white border-border/40 rounded-xl"
                />
              </div>

              <div>
                <Label className="text-sm font-medium mb-1.5 block">From Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div>
                <Label className="text-sm font-medium mb-1.5 block">To Date</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 gap-2 bg-transparent hover:bg-muted" onClick={handleExportPDF}>
                  <Download className="w-4 h-4" />
                  Export
                </Button>

              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ledger Table */}
        <Card className="shadow-md border-border/50">
          <CardContent ref={tableRef} className="pt-6">
            <div className="rounded-md border bg-card overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[120px]">Date</TableHead>
                    <TableHead className="min-w-[250px]">Description</TableHead>
                    <TableHead className="w-[150px]">Job No</TableHead>
                    <TableHead className="text-right text-destructive w-[120px]">Debit</TableHead>
                    <TableHead className="text-right text-green-600 w-[120px]">Credit</TableHead>
                    {selectedCompanyId !== 'all' && (
                      <TableHead className="text-right font-bold bg-muted/30 w-[140px]">Balance</TableHead>
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
                      <TableCell colSpan={4} className="font-medium italic text-muted-foreground">
                        Opening Balance b/f
                      </TableCell>
                      <TableCell className="text-right font-bold font-mono text-sm">
                        {formatCurrency(openingBalance)}
                      </TableCell>
                    </TableRow>
                  )}

                  {ledgerData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        No transactions found for the selected period.
                      </TableCell>
                    </TableRow>
                  ) : (
                    ledgerData.map((entry) => (
                      <TableRow key={entry.id} className="hover:bg-muted/30 group">
                        {/* 1. Date */}
                        <TableCell className="text-sm font-medium align-top pt-3">
                          {new Date(entry.date).toLocaleDateString()}
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

                        {/* 3. Job / Invoice # */}
                        <TableCell className="align-top pt-3">
                          {(entry.jobNumber || entry.billNo) ? (
                            <div className="flex flex-col gap-0.5">
                              {entry.jobNumber && (
                                <span className="font-mono text-xs font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded w-fit">
                                  {entry.jobNumber}
                                </span>
                              )}
                              {entry.billNo && (
                                <span className="text-xs text-muted-foreground">
                                  Invoice: {entry.billNo}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground/30 text-xs">-</span>
                          )}
                        </TableCell>

                        {/* 4. Debit */}
                        <TableCell className="text-right text-sm align-top pt-3">
                          {entry.debit > 0 ? (
                            <span className="text-destructive font-bold">
                              {formatCurrency(entry.debit)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/30">-</span>
                          )}
                        </TableCell>

                        {/* 5. Credit */}
                        <TableCell className="text-right text-sm align-top pt-3">
                          {entry.credit > 0 ? (
                            <span className="text-green-600 font-bold">
                              {formatCurrency(entry.credit)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/30">-</span>
                          )}
                        </TableCell>

                        {/* 6. Balance */}
                        {selectedCompanyId !== 'all' && (
                          <TableCell className="text-right font-mono text-sm align-top pt-3 bg-muted/10 font-bold">
                            {formatCurrency(entry.balance)}
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Bottom Summary Totals */}
            {ledgerData.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-8 border-t">
                <DashboardCard
                  title="Opening Balance"
                  value={formatCurrency(openingBalance)}
                  icon={Scale}
                  change="Balance b/f"
                  changeType="neutral"
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
