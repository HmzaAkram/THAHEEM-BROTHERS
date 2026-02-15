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
import { Plus, Download, Filter, Search, DollarSign, TrendingUp, CreditCard } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useData } from '@/context/data-context';
import { formatDate, formatCurrency } from '@/lib/utils';

export default function PaymentsPage() {
  const { payments, companies, addPayment, bills } = useData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form State
  const [companyId, setCompanyId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');
  const [adjustment, setAdjustment] = useState('');
  const [method, setMethod] = useState('Bank Transfer');
  const [billId, setBillId] = useState(''); // Essential now

  // Table Filters State
  const [timeFilter, setTimeFilter] = useState<'overall' | 'monthly' | '3months' | '6months' | 'yearly'>('overall');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Method specific state
  const [trackingId, setTrackingId] = useState('');
  const [chequeNo, setChequeNo] = useState('');
  const [payOrderNo, setPayOrderNo] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async () => {
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

    setLoading(true);
    try {
      const result = await addPayment({
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

      if (result.ok) {
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
      } else {
        alert("Failed to record payment: " + result.message);
      }
    } catch (error) {
      console.error("Failed to record payment:", error);
      alert("An unexpected error occurred while recording the payment.");
    } finally {
      setLoading(false);
    }
  };

  // Filter bills for selected company
  const companyBills = useMemo(() => {
    if (!companyId) return [];
    return bills.filter(b => b.companyId === companyId && b.status !== 'Paid');
  }, [companyId, bills]);

  // Filtered Payments Logic
  const filteredPayments = useMemo(() => {
    let filtered = [...payments];

    // Time Filter
    if (timeFilter !== 'overall') {
      const now = new Date();
      let startDate = new Date();

      if (timeFilter === 'monthly') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      } else if (timeFilter === '3months') {
        startDate.setDate(now.getDate() - 90);
      } else if (timeFilter === '6months') {
        startDate.setDate(now.getDate() - 180);
      } else if (timeFilter === 'yearly') {
        startDate = new Date(now.getFullYear(), 0, 1);
      }

      filtered = filtered.filter(p => new Date(p.date) >= startDate);
    }

    // Company Filter
    if (companyFilter !== 'all') {
      filtered = filtered.filter(p => p.companyId === companyFilter);
    }

    // Search Query (Reference or specific notes)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.reference.toLowerCase().includes(q) ||
        p.companyName.toLowerCase().includes(q) ||
        p.method.toLowerCase().includes(q)
      );
    }

    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [payments, timeFilter, companyFilter, searchQuery]);

  // Dynamic Totals for Payments
  const tableTotals = useMemo(() => {
    return filteredPayments.reduce((acc, p) => {
      acc.collected += p.amount;
      acc.adjustment += (p.adjustment || 0);
      return acc;
    }, { collected: 0, adjustment: 0 });
  }, [filteredPayments]);

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
                            {b.billNo} - {b.jobNumber} (Due: {formatCurrency(b.totalAmount - b.paidAmount)})
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
                  <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={handleSubmit} disabled={loading}>
                    {loading ? "Recording..." : "Save Payment"}
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
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
            <CardTitle>Transaction History</CardTitle>
            <div className="flex flex-wrap gap-3">
              {/* Search Bar */}
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by Ref, Company, Method..."
                  className="pl-9 bg-muted/20 border-border/50 h-9 text-xs"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Company Select */}
              <Select value={companyFilter} onValueChange={setCompanyFilter}>
                <SelectTrigger className="w-[180px] h-9 bg-muted/20 border-border/50 text-xs">
                  <SelectValue placeholder="All Companies" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Companies</SelectItem>
                  {companies.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Time Filter Select */}
              <Select value={timeFilter} onValueChange={(v: any) => setTimeFilter(v)}>
                <SelectTrigger className="w-[140px] h-9 bg-muted/20 border-border/50 text-xs">
                  <div className="flex items-center gap-2">
                    <Filter className="h-3 w-3" />
                    <SelectValue placeholder="Overall" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overall">Overall</SelectItem>
                  <SelectItem value="monthly">This Month</SelectItem>
                  <SelectItem value="3months">Last 3 Months</SelectItem>
                  <SelectItem value="6months">Last 6 Months</SelectItem>
                  <SelectItem value="yearly">This Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {filteredPayments.length === 0 ? (
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
                    {filteredPayments.map((payment) => (
                      <TableRow key={payment.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(payment.date)}
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
                          + {formatCurrency(payment.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Filtering Summary / Totals */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-8">
              <div className="bg-muted/30 p-4 rounded-2xl border border-border/50 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Filtered Collections</p>
                  <p className="text-xl font-black text-green-600 dark:text-green-400 font-mono">{formatCurrency(tableTotals.collected)}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div className="bg-muted/30 p-4 rounded-2xl border border-border/50 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Filtered Adjustments</p>
                  <p className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono">{formatCurrency(tableTotals.adjustment)}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </div>

          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
