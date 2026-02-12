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
import { Download, Printer, Filter } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useData, LedgerEntry } from '@/context/data-context';
import { Input } from '@/components/ui/input'; // Added Input component

export default function LedgerPage() {
  const { companies, getCompanyLedger } = useData();
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

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

    // Ledger usually oldest first (chronological). Let's stick to chronological for "Ledger" view.
    // User audio mentioned specific order? "Company Name -> Payment Method". 
    // Let's keep chronological as standard for ledger.

    return { ledgerData: dataWithBalance, openingBalance: openingBal };
  }, [selectedCompanyId, companies, getCompanyLedger, startDate, endDate]);

  const totals = useMemo(() => {
    return ledgerData.reduce((acc, item) => ({
      debit: acc.debit + item.debit,
      credit: acc.credit + item.credit
    }), { debit: 0, credit: 0 });
  }, [ledgerData]);

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
                <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Company" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">-- All Transactions --</SelectItem>
                    {companies.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <Button variant="outline" className="flex-1 gap-2 bg-transparent hover:bg-muted">
                  <Download className="w-4 h-4" />
                  Export
                </Button>
                <Button variant="outline" className="flex-1 gap-2 bg-transparent hover:bg-muted">
                  <Printer className="w-4 h-4" />
                  Print
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ledger Table */}
        <Card className="shadow-md border-border/50">
          <CardContent className="pt-6">
            <div className="rounded-md border bg-card">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[120px]">Date</TableHead>
                    <TableHead className="min-w-[250px]">Description</TableHead>
                    <TableHead className="w-[150px]">Job / Invoice #</TableHead>
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
                        {new Date(startDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell colSpan={4} className="font-medium italic text-muted-foreground">
                        Opening Balance b/f
                      </TableCell>
                      <TableCell className="text-right font-bold font-mono text-sm">
                        {openingBalance.toLocaleString()}
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
                                      Payment Received ({entry.method})
                                    </span>
                                    {entry.paymentRef && (
                                      <span className="text-xs bg-secondary px-1.5 py-0.5 rounded font-mono text-foreground">
                                        {entry.paymentRef}
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
                              {entry.debit.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/30">-</span>
                          )}
                        </TableCell>

                        {/* 5. Credit */}
                        <TableCell className="text-right text-sm align-top pt-3">
                          {entry.credit > 0 ? (
                            <span className="text-green-600 font-bold">
                              {entry.credit.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/30">-</span>
                          )}
                        </TableCell>

                        {/* 6. Balance */}
                        {selectedCompanyId !== 'all' && (
                          <TableCell className="text-right font-mono text-sm align-top pt-3 bg-muted/10 font-bold">
                            {entry.balance.toLocaleString()}
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Totals Section */}
            {selectedCompanyId !== 'all' && ledgerData.length > 0 && (
              <div className="flex justify-end mt-6">
                <div className="bg-muted/40 p-4 rounded-lg min-w-[300px] space-y-2 border">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Opening Balance:</span>
                    <span className="font-mono font-medium">{openingBalance.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Billed (Selected):</span>
                    <span className="font-mono font-medium text-destructive">+{totals.debit.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Paid (Selected):</span>
                    <span className="font-mono font-medium text-green-600">-{totals.credit.toLocaleString()}</span>
                  </div>
                  <div className="border-t pt-2 mt-2 flex justify-between font-bold text-base">
                    <span>Closing Balance:</span>
                    <span className={ledgerData[ledgerData.length - 1].balance > 0 ? "text-destructive" : "text-green-600"}>
                      PKR {ledgerData[ledgerData.length - 1].balance.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}

          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
