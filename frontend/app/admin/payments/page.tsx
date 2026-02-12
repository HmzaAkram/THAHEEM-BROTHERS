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
  const [adjustment, setAdjustment] = useState('');
  const [method, setMethod] = useState('Bank Transfer');
  const [billId, setBillId] = useState(''); // Essential now

  // Method specific state
  const [trackingId, setTrackingId] = useState('');
  const [chequeNo, setChequeNo] = useState('');
  const [payOrderNo, setPayOrderNo] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    if (!companyId || !amount || !date || !billId) {
      alert("Please fill all required fields (Company, Bill, Amount, Date)");
      return;
    }

    const selectedCompany = companies.find(c => c.id === companyId);
    if (!selectedCompany) return;

    // Construct reference based on method
    let finalReference = '';
    if (method === 'Bank Transfer') finalReference = `TRF: ${trackingId}`;
    else if (method === 'Cheque') finalReference = `CHQ: ${chequeNo}`;
    else if (method === 'Pay Order') finalReference = `PO: ${payOrderNo}`;
    else if (method === 'Advance') finalReference = `ADV: ${description}`;
    else finalReference = 'Cash';

    addPayment({
      companyId: selectedCompany.id,
      companyName: selectedCompany.name,
      date,
      amount: Number(amount),
      adjustment: Number(adjustment) || 0,
      reference: finalReference,
      method,
      billId,
      trackingId,
      chequeNo,
      payOrderNo,
      description
    });

    setIsDialogOpen(false);
    // Reset Form
    setCompanyId('');
    setAmount('');
    setAdjustment('');
    setBillId('');
    setTrackingId('');
    setChequeNo('');
    setPayOrderNo('');
    setDescription('');
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
                  <Label>Link to Invoice / Job (Required)</Label>
                  <Select onValueChange={setBillId} value={billId}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select Invoice to pay..." />
                    </SelectTrigger>
                    <SelectContent>
                      {companyBills.length === 0 ? (
                        <SelectItem value="none" disabled>No pending bills found</SelectItem>
                      ) : (
                        companyBills.map(b => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.billNo} - {b.jobNumber} (Due: {(b.totalAmount - b.paidAmount).toLocaleString()})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                    <Label>Payment Method</Label>
                    <Select onValueChange={setMethod} value={method}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                        <SelectItem value="Cheque">Cheque</SelectItem>
                        <SelectItem value="Pay Order">Pay Order</SelectItem>
                        <SelectItem value="Advance">Advance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Dynamic Fields based on Method */}
                <div className="bg-secondary/20 p-3 rounded-md border space-y-3">
                  {method === 'Bank Transfer' && (
                    <div>
                      <Label className="text-xs">Tracking ID</Label>
                      <Input
                        placeholder="e.g. TRF-123456789"
                        className="mt-1"
                        value={trackingId}
                        onChange={(e) => setTrackingId(e.target.value)}
                      />
                    </div>
                  )}
                  {method === 'Cheque' && (
                    <div>
                      <Label className="text-xs">Cheque No</Label>
                      <Input
                        placeholder="e.g. CHQ-987654"
                        className="mt-1"
                        value={chequeNo}
                        onChange={(e) => setChequeNo(e.target.value)}
                      />
                    </div>
                  )}
                  {method === 'Pay Order' && (
                    <div>
                      <Label className="text-xs">Pay Order No</Label>
                      <Input
                        placeholder="e.g. PO-554433"
                        className="mt-1"
                        value={payOrderNo}
                        onChange={(e) => setPayOrderNo(e.target.value)}
                      />
                    </div>
                  )}
                  {/* Always show description as optional note, or mandatory for Advance */}
                  <div>
                    <Label className="text-xs">{method === 'Advance' ? 'Description (Required)' : 'Description / Notes'}</Label>
                    <Input
                      placeholder="Add details..."
                      className="mt-1"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Amount Paid (PKR)</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      className="mt-1 font-mono font-bold"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Adjustment (PKR)</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      className="mt-1 font-mono text-muted-foreground"
                      title="Amount waived off or adjusted"
                      value={adjustment}
                      onChange={(e) => setAdjustment(e.target.value)}
                    />
                  </div>
                </div>

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
