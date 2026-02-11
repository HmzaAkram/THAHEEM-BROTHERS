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
import { Plus, Download, Eye } from 'lucide-react';
import { useState } from 'react';

const dummyBills = [
  {
    id: 1,
    billNo: 'BILL-001',
    company: 'THAHEEM BROTHERS',
    date: '2026-02-10',
    dueDate: '2026-02-25',
    amount: 'PKR 250,000',
    status: 'Paid',
  },
  {
    id: 2,
    billNo: 'BILL-002',
    company: 'Import Traders',
    date: '2026-02-08',
    dueDate: '2026-02-23',
    amount: 'PKR 125,500',
    status: 'Partial',
  },
  {
    id: 3,
    billNo: 'BILL-003',
    company: 'Global Freight Co',
    date: '2026-02-05',
    dueDate: '2026-02-20',
    amount: 'PKR 450,000',
    status: 'Unpaid',
  },
  {
    id: 4,
    billNo: 'BILL-004',
    company: 'Karachi Logistics',
    date: '2026-02-03',
    dueDate: '2026-02-18',
    amount: 'PKR 180,000',
    status: 'Paid',
  },
  {
    id: 5,
    billNo: 'BILL-005',
    company: 'Orient Shipping',
    date: '2026-02-01',
    dueDate: '2026-02-16',
    amount: 'PKR 320,000',
    status: 'Unpaid',
  },
  {
    id: 6,
    billNo: 'BILL-006',
    company: 'Metro Cargo Services',
    date: '2026-01-28',
    dueDate: '2026-02-12',
    amount: 'PKR 95,000',
    status: 'Paid',
  },
  {
    id: 7,
    billNo: 'BILL-007',
    company: 'Express Imports Ltd',
    date: '2026-01-25',
    dueDate: '2026-02-09',
    amount: 'PKR 210,000',
    status: 'Partial',
  },
  {
    id: 8,
    billNo: 'BILL-008',
    company: 'Trade Hub International',
    date: '2026-01-20',
    dueDate: '2026-02-04',
    amount: 'PKR 435,000',
    status: 'Unpaid',
  },
  {
    id: 9,
    billNo: 'BILL-009',
    company: 'THAHEEM BROTHERS',
    date: '2026-01-15',
    dueDate: '2026-01-30',
    amount: 'PKR 175,000',
    status: 'Paid',
  },
  {
    id: 10,
    billNo: 'BILL-010',
    company: 'Import Traders',
    date: '2026-01-12',
    dueDate: '2026-01-27',
    amount: 'PKR 95,500',
    status: 'Paid',
  },
];

const statusStyles = {
  Paid: 'bg-green-100 text-green-800',
  Partial: 'bg-yellow-100 text-yellow-800',
  Unpaid: 'bg-red-100 text-red-800',
};

export default function BillsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<(typeof dummyBills)[0] | null>(
    null
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Bills</h1>
            <p className="text-muted-foreground mt-1">
              Manage and track all customer invoices
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Create Bill
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Bill</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="company-select">Select Company</Label>
                    <Select>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Choose company" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="thaheem">
                          THAHEEM BROTHERS
                        </SelectItem>
                        <SelectItem value="import">Import Traders</SelectItem>
                        <SelectItem value="global">Global Freight Co</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="bill-date">Bill Date</Label>
                    <Input
                      id="bill-date"
                      type="date"
                      className="mt-1"
                      defaultValue="2026-02-12"
                    />
                  </div>
                </div>

                <div>
                  <Label>Bill Items</Label>
                  <div className="space-y-3 mt-2">
                    {[
                      {
                        name: 'Customs Clearance',
                        qty: 1,
                        rate: 50000,
                      },
                      {
                        name: 'Documentation',
                        qty: 1,
                        rate: 10000,
                      },
                      {
                        name: 'Handling Charges',
                        qty: 1,
                        rate: 5000,
                      },
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-2 bg-secondary rounded"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium">{item.name}</p>
                        </div>
                        <div className="text-sm">
                          {item.qty} × PKR {item.rate.toLocaleString()}
                        </div>
                        <div className="font-semibold">
                          PKR {(item.qty * item.rate).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <div className="flex justify-between text-sm font-semibold">
                    <span>Total Amount:</span>
                    <span className="text-primary">PKR 65,000</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button className="flex-1">Create Bill</Button>
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
            <CardTitle className="text-base">All Bills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bill No</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dummyBills.map((bill) => (
                    <TableRow key={bill.id}>
                      <TableCell className="font-mono text-sm">
                        {bill.billNo}
                      </TableCell>
                      <TableCell className="font-medium">
                        {bill.company}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(bill.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(bill.dueDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {bill.amount}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            statusStyles[
                              bill.status as keyof typeof statusStyles
                            ]
                          }`}
                        >
                          {bill.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-between mt-4 text-sm">
              <p className="text-muted-foreground">
                Showing 1-10 of {dummyBills.length} bills
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
