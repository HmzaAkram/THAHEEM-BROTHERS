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
import { Plus, Download, Filter } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useData } from '@/context/data-context';

export default function PaymentsPage() {
  const { payments, companies, addPayment, bills } = useData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form State
  const [companyId, setCompanyId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [method, setMethod] = useState('Bank Transfer');
  const [billId, setBillId] = useState('none');

  const handleSubmit = () => {
    if (!companyId || !amount || !date) {
      alert("Please fill all required fields");
      return;
    }

    const selectedCompany = companies.find(c => c.id === companyId);
    if (!selectedCompany) return;

    addPayment({
      companyId: selectedCompany.id,
      companyName: selectedCompany.name,
      date,
      amount: Number(amount),
      reference: reference || 'N/A',
      method,
      billId: billId === 'none' ? undefined : billId
    });

    setIsDialogOpen(false);
    // Reset Form
    setCompanyId('');
    setAmount('');
    setReference('');
    setBillId('none');
  };

  // Filter bills for selected company
  const companyBills = useMemo(() => {
    if (!companyId) return [];
    return bills.filter(b => b.companyId === companyId && b.status !== 'Paid');
  }, [companyId, bills]);

  // Sort payments by date desc
  const sortedPayments = useMemo(() => {
    return [...payments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [payments]);

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Payments</h1>
            <p className="text-muted-foreground mt-1">
              Record and track received payments.
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 shadow-md bg-green-600 hover:bg-green-700">
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
                  <Label>Select Company</Label>
                  <Select onValueChange={setCompanyId} value={companyId}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Choose client..." />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Date</Label>
                  <Input
                    type="date"
                    className="mt-1"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>

                <div>
                  <Label>Amount (PKR)</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    className="mt-1 font-mono"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Payment Method</Label>
                    <Select onValueChange={setMethod} value={method}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                        <SelectItem value="Check">Check</SelectItem>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="Online">Online</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Reference No.</Label>
                    <Input
                      placeholder="TRF-12345"
                      className="mt-1"
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                    />
                  </div>
                </div>

                {companyId && companyBills.length > 0 && (
                  <div className="bg-secondary/30 p-3 rounded-md border">
                    <Label className="text-xs font-semibold uppercase text-muted-foreground mb-1 block">
                      Link to Invoice (Optional)
                    </Label>
                    <Select onValueChange={setBillId} value={billId}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Select unpaid bill..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-- General Payment --</SelectItem>
                        {companyBills.map(b => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.billNo} (Due: {b.totalAmount - b.paidAmount})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={handleSubmit}>
                    Save Payment
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="shadow-md border-border/50">
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            {sortedPayments.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                No payments recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/50">
                      <TableHead>Date</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedPayments.map((payment) => (
                      <TableRow key={payment.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(payment.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="font-medium">
                          {payment.companyName}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {payment.reference}
                        </TableCell>
                        <TableCell className="text-sm">
                          {payment.method}
                        </TableCell>
                        <TableCell className="text-right font-bold text-green-600">
                          + PKR {payment.amount.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
