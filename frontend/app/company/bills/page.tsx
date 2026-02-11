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
import { Download, Eye } from 'lucide-react';

const companyBills = [
  {
    id: 1,
    billNo: 'BILL-001',
    date: '2026-02-10',
    dueDate: '2026-02-25',
    amount: 'PKR 250,000',
    status: 'Paid',
    description: 'Customs Clearance & Documentation',
  },
  {
    id: 2,
    billNo: 'BILL-005',
    date: '2026-02-01',
    dueDate: '2026-02-16',
    amount: 'PKR 320,000',
    status: 'Unpaid',
    description: 'Cargo Handling & Storage',
  },
  {
    id: 3,
    billNo: 'BILL-009',
    date: '2026-01-15',
    dueDate: '2026-01-30',
    amount: 'PKR 175,000',
    status: 'Paid',
    description: 'Air Freight Forwarding',
  },
];

export default function CompanyBillsPage() {
  const [selectedBill, setSelectedBill] = useState<
    (typeof companyBills)[0] | null
  >(null);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Bills</h1>
          <p className="text-muted-foreground mt-1">
            View and download your invoices
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice No</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companyBills.map((bill) => (
                    <TableRow key={bill.id}>
                      <TableCell className="font-mono text-sm font-medium">
                        {bill.billNo}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(bill.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(bill.dueDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm">
                        {bill.description}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {bill.amount}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            bill.status === 'Paid'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {bill.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setSelectedBill(bill)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Invoice Details</DialogTitle>
                              </DialogHeader>
                              <div className="mt-4 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-sm text-muted-foreground">
                                      Invoice Number
                                    </p>
                                    <p className="font-mono font-semibold">
                                      {selectedBill?.billNo}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">
                                      Date
                                    </p>
                                    <p className="font-semibold">
                                      {selectedBill?.date}
                                    </p>
                                  </div>
                                </div>

                                <div className="bg-gray-50 rounded-lg p-4">
                                  <h3 className="font-semibold mb-3">
                                    Invoice Items
                                  </h3>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span>Customs Clearance</span>
                                      <span>PKR 100,000</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Documentation</span>
                                      <span>PKR 25,000</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Handling</span>
                                      <span>PKR 10,000</span>
                                    </div>
                                    <div className="border-t pt-2 font-bold flex justify-between">
                                      <span>Total</span>
                                      <span>{selectedBill?.amount}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex gap-2 pt-4">
                                  <Button className="flex-1 gap-2">
                                    <Download className="w-4 h-4" />
                                    Download PDF
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button variant="ghost" size="icon" className="gap-2">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-muted-foreground text-sm">Total Invoiced</p>
                <p className="text-2xl font-bold text-foreground mt-2">
                  PKR 745K
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-muted-foreground text-sm">Paid</p>
                <p className="text-2xl font-bold text-green-600 mt-2">
                  PKR 425K
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-muted-foreground text-sm">Outstanding</p>
                <p className="text-2xl font-bold text-orange-600 mt-2">
                  PKR 320K
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

import { useState } from 'react';
