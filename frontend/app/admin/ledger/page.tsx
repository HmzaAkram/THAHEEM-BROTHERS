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
import { Download, Printer } from 'lucide-react';
import { useState } from 'react';

const dummyLedger = [
  {
    id: 1,
    date: '2026-01-01',
    description: 'Opening Balance',
    debit: 0,
    credit: 0,
    balance: 0,
    company: 'THAHEEM BROTHERS',
  },
  {
    id: 2,
    date: '2026-01-15',
    description: 'Invoice #001 - Customs Clearance',
    debit: 100000,
    credit: 0,
    balance: 100000,
    company: 'THAHEEM BROTHERS',
  },
  {
    id: 3,
    date: '2026-01-20',
    description: 'Payment Received - TRF-001',
    debit: 0,
    credit: 40000,
    balance: 60000,
    company: 'THAHEEM BROTHERS',
  },
  {
    id: 4,
    date: '2026-01-25',
    description: 'Invoice #002 - Documentation',
    debit: 75000,
    credit: 0,
    balance: 135000,
    company: 'THAHEEM BROTHERS',
  },
  {
    id: 5,
    date: '2026-02-01',
    description: 'Payment Received - CHK-001',
    debit: 0,
    credit: 50000,
    balance: 85000,
    company: 'THAHEEM BROTHERS',
  },
  {
    id: 6,
    date: '2026-02-05',
    description: 'Invoice #003 - Handling',
    debit: 165000,
    credit: 0,
    balance: 250000,
    company: 'THAHEEM BROTHERS',
  },
  {
    id: 7,
    date: '2026-02-10',
    description: 'Payment Received - TRF-002',
    debit: 0,
    credit: 250000,
    balance: 0,
    company: 'THAHEEM BROTHERS',
  },
];

export default function LedgerPage() {
  const [selectedCompany, setSelectedCompany] = useState('all');

  const filteredLedger =
    selectedCompany === 'all'
      ? dummyLedger
      : dummyLedger.filter((item) =>
          item.company.toLowerCase().includes(selectedCompany.toLowerCase())
        );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Ledger</h1>
          <p className="text-muted-foreground mt-1">
            View transaction history and balances
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Ledger Entries</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                  <Download className="w-4 h-4" />
                  Export
                </Button>
                <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                  <Printer className="w-4 h-4" />
                  Print
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-end gap-4">
              <div className="w-full max-w-xs">
                <Label htmlFor="company-filter" className="text-sm">
                  Filter by Company
                </Label>
                <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Companies</SelectItem>
                    <SelectItem value="thaheem">THAHEEM BROTHERS</SelectItem>
                    <SelectItem value="import">Import Traders</SelectItem>
                    <SelectItem value="global">Global Freight Co</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLedger.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="text-sm">
                        {new Date(entry.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-medium text-sm">
                        {entry.description}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {entry.debit > 0 ? (
                          <span className="text-red-600 font-semibold">
                            PKR {entry.debit.toLocaleString()}
                          </span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {entry.credit > 0 ? (
                          <span className="text-green-600 font-semibold">
                            PKR {entry.credit.toLocaleString()}
                          </span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-sm">
                        PKR {entry.balance.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 mt-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-muted-foreground">Total Debit</p>
                  <p className="text-lg font-bold text-foreground mt-1">
                    PKR{' '}
                    {filteredLedger
                      .reduce((sum, item) => sum + item.debit, 0)
                      .toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Credit</p>
                  <p className="text-lg font-bold text-foreground mt-1">
                    PKR{' '}
                    {filteredLedger
                      .reduce((sum, item) => sum + item.credit, 0)
                      .toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Closing Balance</p>
                  <p className="text-lg font-bold text-primary mt-1">
                    PKR{' '}
                    {filteredLedger[filteredLedger.length - 1]?.balance.toLocaleString()}
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
