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
import { Download, Printer } from 'lucide-react';

const companyLedger = [
  {
    id: 1,
    date: '2026-01-01',
    description: 'Opening Balance',
    debit: 0,
    credit: 0,
    balance: 0,
  },
  {
    id: 2,
    date: '2026-01-15',
    description: 'Invoice #001 - Customs Clearance',
    debit: 100000,
    credit: 0,
    balance: 100000,
  },
  {
    id: 3,
    date: '2026-01-20',
    description: 'Payment - Bank Transfer TRF-001',
    debit: 0,
    credit: 40000,
    balance: 60000,
  },
  {
    id: 4,
    date: '2026-01-25',
    description: 'Invoice #002 - Documentation & Handling',
    debit: 75000,
    credit: 0,
    balance: 135000,
  },
  {
    id: 5,
    date: '2026-02-01',
    description: 'Payment - Check CHK-001',
    debit: 0,
    credit: 50000,
    balance: 85000,
  },
  {
    id: 6,
    date: '2026-02-05',
    description: 'Invoice #003 - Air Freight',
    debit: 165000,
    credit: 0,
    balance: 250000,
  },
  {
    id: 7,
    date: '2026-02-10',
    description: 'Payment - Bank Transfer TRF-002',
    debit: 0,
    credit: 250000,
    balance: 0,
  },
];

export default function CompanyLedgerPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Ledger</h1>
          <p className="text-muted-foreground mt-1">
            Your transaction history
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Transaction History</CardTitle>
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
          <CardContent>
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
                  {companyLedger.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="text-sm font-medium">
                        {new Date(entry.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm">
                        {entry.description}
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
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 mt-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-muted-foreground">Total Charged</p>
                  <p className="text-lg font-bold text-foreground mt-1">
                    PKR{' '}
                    {companyLedger
                      .reduce((sum, item) => sum + item.debit, 0)
                      .toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Paid</p>
                  <p className="text-lg font-bold text-foreground mt-1">
                    PKR{' '}
                    {companyLedger
                      .reduce((sum, item) => sum + item.credit, 0)
                      .toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Current Balance
                  </p>
                  <p className="text-lg font-bold text-primary mt-1">
                    PKR{' '}
                    {companyLedger[companyLedger.length - 1]?.balance.toLocaleString()}
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
