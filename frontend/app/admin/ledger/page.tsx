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

export default function LedgerPage() {
  const { companies, getCompanyLedger } = useData();
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('all');

  const ledgerData = useMemo(() => {
    if (selectedCompanyId === 'all') {
      // Aggregate all (tricky for running balance across mixed companies, usually ledgers are per company)
      // For 'all', we might just list transactions or show a summary? 
      // Requirement says: "Each company should have a running ledger"
      // So 'All' might just be a flat list, but running balance only makes sense per company.
      // Let's default to the first company if 'all' is selected, or just show list without running balance?
      // Better: Show all transactions but hide running balance column if 'all' is selected.

      const all: LedgerEntry[] = [];
      companies.forEach(c => {
        all.push(...getCompanyLedger(c.id));
      });
      return all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } else {
      return getCompanyLedger(selectedCompanyId).reverse(); // Show newest first for UI
    }
  }, [selectedCompanyId, companies, getCompanyLedger]);

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

        <Card className="shadow-md border-border/50">
          <CardHeader>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-end gap-3 w-full md:w-auto">
                <div className="w-full md:w-72">
                  <Label htmlFor="company-filter" className="text-sm font-medium mb-1.5 block">
                    Select Client Company
                  </Label>
                  <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                    <SelectTrigger className="w-full">
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
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-2 bg-transparent hover:bg-muted">
                  <Download className="w-4 h-4" />
                  Export
                </Button>
                <Button variant="outline" size="sm" className="gap-2 bg-transparent hover:bg-muted">
                  <Printer className="w-4 h-4" />
                  Print
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">

            <div className="rounded-md border bg-card">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[120px]">Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right text-destructive">Debit (Bill)</TableHead>
                    <TableHead className="text-right text-green-600">Credit (Pay)</TableHead>
                    {selectedCompanyId !== 'all' && (
                      <TableHead className="text-right font-bold">Balance</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledgerData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        No transactions found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    ledgerData.map((entry) => (
                      <TableRow key={entry.id} className="hover:bg-muted/30">
                        <TableCell className="text-sm font-medium">
                          {new Date(entry.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="font-medium text-foreground">{entry.description}</div>
                          {selectedCompanyId === 'all' && (
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {companies.find(c => c.id === entry.companyId)?.name}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {entry.debit > 0 ? (
                            <span className="text-destructive font-medium">
                              PKR {entry.debit.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/30">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {entry.credit > 0 ? (
                            <span className="text-green-600 font-medium">
                              PKR {entry.credit.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/30">-</span>
                          )}
                        </TableCell>
                        {selectedCompanyId !== 'all' && (
                          <TableCell className="text-right font-bold text-sm bg-muted/20">
                            PKR {entry.balance.toLocaleString()}
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {selectedCompanyId !== 'all' && ledgerData.length > 0 && (
              <div className="bg-primary/5 rounded-lg p-5 border border-primary/10 mt-6 animate-in slide-in-from-bottom-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center divide-x divide-primary/10">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Billed</p>
                    <p className="text-2xl font-bold text-foreground mt-2">
                      PKR {totals.debit.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Paid</p>
                    <p className="text-2xl font-bold text-green-600 mt-2">
                      PKR {totals.credit.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Outstanding Balance</p>
                    <p className={`text-2xl font-bold mt-2 ${ledgerData[0]?.balance > 0 ? 'text-destructive' : 'text-primary'
                      }`}>
                      PKR {ledgerData[0]?.balance.toLocaleString()}
                    </p>
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
