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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Eye } from 'lucide-react';
import { useState } from 'react';

const dummyPayments = [
  {
    id: 1,
    paymentId: 'PAY-001',
    company: 'THAHEEM BROTHERS',
    paymentDate: '2026-02-10',
    amount: 'PKR 250,000',
    method: 'Bank Transfer',
    referenceNo: 'TRF-2026-0001',
  },
  {
    id: 2,
    paymentId: 'PAY-002',
    company: 'Import Traders',
    paymentDate: '2026-02-08',
    amount: 'PKR 60,000',
    method: 'Check',
    referenceNo: 'CHK-2026-0001',
  },
  {
    id: 3,
    paymentId: 'PAY-003',
    company: 'Karachi Logistics',
    paymentDate: '2026-02-05',
    amount: 'PKR 180,000',
    method: 'Bank Transfer',
    referenceNo: 'TRF-2026-0002',
  },
  {
    id: 4,
    paymentId: 'PAY-004',
    company: 'Metro Cargo Services',
    paymentDate: '2026-02-03',
    amount: 'PKR 95,000',
    method: 'Online Transfer',
    referenceNo: 'ONL-2026-0001',
  },
  {
    id: 5,
    paymentId: 'PAY-005',
    company: 'Express Imports Ltd',
    paymentDate: '2026-02-01',
    amount: 'PKR 110,000',
    method: 'Check',
    referenceNo: 'CHK-2026-0002',
  },
  {
    id: 6,
    paymentId: 'PAY-006',
    company: 'THAHEEM BROTHERS',
    paymentDate: '2026-01-28',
    amount: 'PKR 175,000',
    method: 'Bank Transfer',
    referenceNo: 'TRF-2026-0003',
  },
  {
    id: 7,
    paymentId: 'PAY-007',
    company: 'Import Traders',
    paymentDate: '2026-01-25',
    amount: 'PKR 95,500',
    method: 'Online Transfer',
    referenceNo: 'ONL-2026-0002',
  },
  {
    id: 8,
    paymentId: 'PAY-008',
    company: 'Global Freight Co',
    paymentDate: '2026-01-22',
    amount: 'PKR 300,000',
    method: 'Bank Transfer',
    referenceNo: 'TRF-2026-0004',
  },
  {
    id: 9,
    paymentId: 'PAY-009',
    company: 'Orient Shipping',
    paymentDate: '2026-01-20',
    amount: 'PKR 200,000',
    method: 'Check',
    referenceNo: 'CHK-2026-0003',
  },
  {
    id: 10,
    paymentId: 'PAY-010',
    company: 'Trade Hub International',
    paymentDate: '2026-01-18',
    amount: 'PKR 250,000',
    method: 'Bank Transfer',
    referenceNo: 'TRF-2026-0005',
  },
];

export default function PaymentsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Payments</h1>
            <p className="text-muted-foreground mt-1">
              Track and manage customer payments
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Record Payment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Record New Payment</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="payment-company">Select Company</Label>
                  <Select>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Choose company" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="thaheem">THAHEEM BROTHERS</SelectItem>
                      <SelectItem value="import">Import Traders</SelectItem>
                      <SelectItem value="global">Global Freight Co</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="payment-date">Payment Date</Label>
                    <Input
                      id="payment-date"
                      type="date"
                      className="mt-1"
                      defaultValue="2026-02-12"
                    />
                  </div>
                  <div>
                    <Label htmlFor="payment-amount">Amount</Label>
                    <Input
                      id="payment-amount"
                      placeholder="PKR"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="payment-method">Payment Method</Label>
                  <Select>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank">Bank Transfer</SelectItem>
                      <SelectItem value="check">Check</SelectItem>
                      <SelectItem value="online">Online Transfer</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="payment-ref">Reference Number</Label>
                  <Input
                    id="payment-ref"
                    placeholder="e.g., TRF-2026-0001"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="payment-notes">Notes</Label>
                  <Input
                    id="payment-notes"
                    placeholder="Optional notes"
                    className="mt-1"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button className="flex-1">Record Payment</Button>
                  <Button
                    variant="outline"
                    className="flex-1 bg-transparent"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payment ID</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Payment Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Reference No</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dummyPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-mono text-sm">
                        {payment.paymentId}
                      </TableCell>
                      <TableCell className="font-medium">
                        {payment.company}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(payment.paymentDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {payment.amount}
                      </TableCell>
                      <TableCell className="text-sm">
                        <span className="bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full text-xs">
                          {payment.method}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm font-mono">
                        {payment.referenceNo}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-between mt-4 text-sm">
              <p className="text-muted-foreground">
                Showing 1-10 of {dummyPayments.length} payments
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  Previous
                </Button>
                <Button variant="outline" size="sm">
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
