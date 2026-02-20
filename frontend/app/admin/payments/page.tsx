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
import { useData, Payment } from '@/context/data-context';
import { formatDate, formatCurrency } from '@/lib/utils';
import { CompanySelect } from '@/components/company-select';
import { GenericSearchSelect } from '@/components/search-select';
import { MultiSearchSelect } from '@/components/multi-search-select';
import Swal from 'sweetalert2';

export default function PaymentsPage() {
  const { payments, companies, addPayment, bills } = useData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form State
  const [companyId, setCompanyId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState(''); // Global amount or single
  const [adjustment, setAdjustment] = useState(''); // Global adjustment or single
  const [method, setMethod] = useState('Bank Transfer');
  const [selectedBillIds, setSelectedBillIds] = useState<string[]>([]);
  const [billPayments, setBillPayments] = useState<Record<string, { amount: string, adjustment: string }>>({});

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
    if (!companyId || !date || selectedBillIds.length === 0) {
      Swal.fire({
        title: 'Missing Information',
        text: 'Please select a company, date, and at least one bill.',
        icon: 'warning',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }

    // Validate that each selected bill has a valid amount
    for (const id of selectedBillIds) {
      const p = billPayments[id];
      if (!p || !p.amount || Number(p.amount) <= 0) {
        Swal.fire({
          title: 'Invalid Amount',
          text: 'Please enter a valid amount for all selected bills.',
          icon: 'warning',
          confirmButtonColor: '#3b82f6'
        });
        return;
      }
    }

    setLoading(true);
    try {
      let successCount = 0;
      let errorCount = 0;

      for (const id of selectedBillIds) {
        const p = billPayments[id];

        // Construct reference based on method
        let finalReference = '';
        if (method === 'Bank Transfer') finalReference = `TRF: ${trackingId}`;
        else if (method === 'Cheque') finalReference = `CHQ: ${chequeNo}`;
        else if (method === 'Pay Order') finalReference = `PO: ${payOrderNo}`;
        else if (method === 'Advance') finalReference = `ADV: ${description}`;
        else finalReference = 'Cash';

        const paymentData: Omit<Payment, 'id' | 'createdAt'> = {
          companyId,
          companyName: companies.find(c => String(c.id) === String(companyId))?.name || 'Unknown',
          date,
          amount: Number(p.amount),
          adjustment: Number(p.adjustment || 0),
          method,
          billId: id,
          trackingId: method === 'Bank Transfer' ? trackingId : undefined,
          chequeNo: method === 'Cheque' ? chequeNo : undefined,
          payOrderNo: method === 'Pay Order' ? payOrderNo : undefined,
          description: description,
          reference: finalReference
        };

        const result = await addPayment(paymentData);
        if (result.ok) {
          successCount++;
        } else {
          errorCount++;
          console.error(`Failed to record payment for bill ${id}:`, result.message);
        }
      }

      if (successCount > 0) {
        Swal.fire({
          title: errorCount === 0 ? 'Success' : 'Partial Success',
          text: errorCount === 0
            ? `Successfully recorded ${successCount} payment(s).`
            : `Recorded ${successCount} payments. ${errorCount} failed.`,
          icon: errorCount === 0 ? 'success' : 'warning',
          confirmButtonColor: '#3b82f6'
        });

        setIsDialogOpen(false);
        // Reset state
        setCompanyId('');
        setAmount('');
        setAdjustment('');
        setSelectedBillIds([]);
        setBillPayments({});
        setTrackingId('');
        setChequeNo('');
        setPayOrderNo('');
        setDescription('');
      } else {
        Swal.fire({
          title: 'Error',
          text: 'Failed to record any payments. Please check console for details.',
          icon: 'error',
          confirmButtonColor: '#3b82f6'
        });
      }
    } catch (error) {
      console.error("Failed to record payments:", error);
      Swal.fire({
        title: 'Error',
        text: 'An unexpected error occurred while recording payments.',
        icon: 'error',
        confirmButtonColor: '#3b82f6'
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter bills for selected company
  const companyBills = useMemo(() => {
    if (!companyId) return [];
    // Handle both number and string ID types and ensure we filter for non-paid bills
    return bills.filter(b =>
      (String(b.companyId) === String(companyId)) &&
      (b.status !== 'Paid' && b.calculatedStatus !== 'Paid')
    );
  }, [companyId, bills]);

  const billOptions = useMemo(() => {
    return companyBills.map(b => ({
      id: b.id,
      label: `JOB: ${b.jobNumber || b.billNo} (Due: ${formatCurrency((b.grandTotal || b.totalAmount) - b.paidAmount)})`
    }));
  }, [companyBills]);

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
      acc.collected += Number(p.amount) || 0;
      acc.adjustment += Number(p.adjustment) || 0;
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
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Record New Payment</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label>Select Company</Label>
                  <CompanySelect
                    companies={companies}
                    value={companyId}
                    onValueChange={(val) => {
                      setCompanyId(val);
                      setSelectedBillIds([]); // Reset selection when company changes
                      setBillPayments({});
                    }}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Link to Invoice(s) / Job(s) (Required)</Label>
                  <MultiSearchSelect
                    options={billOptions}
                    selectedIds={selectedBillIds}
                    onValueChange={(ids) => {
                      setSelectedBillIds(ids);
                      // Initialize payment data for new IDs
                      const newBillPayments = { ...billPayments };
                      ids.forEach(id => {
                        if (!newBillPayments[id]) {
                          const bill = bills.find(b => b.id === id);
                          const due = ((bill?.grandTotal || bill?.totalAmount) || 0) - (bill?.paidAmount || 0);
                          newBillPayments[id] = { amount: String(due), adjustment: '0' };
                        }
                      });
                      setBillPayments(newBillPayments);
                    }}
                    placeholder={companyId ? "Select Invoice(s) to pay..." : "Select company first"}
                    emptyText={companyId ? "No pending bills found" : "Select company first"}
                    className="mt-1"
                  />
                </div>

                {/* Per-Bill Payment Inputs */}
                {selectedBillIds.length > 0 && (
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-lg border border-dashed border-green-200 dark:border-green-900/50">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-green-600 dark:text-green-500">Payment Allocation</p>
                    {selectedBillIds.map(id => {
                      const bill = bills.find(b => b.id === id);
                      return (
                        <div key={id} className="space-y-2 pb-3 border-b border-muted last:border-0 last:pb-0">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-foreground truncate max-w-[150px]">
                              {bill?.jobNumber || bill?.billNo}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              Due: {formatCurrency(((bill?.grandTotal || bill?.totalAmount) || 0) - (bill?.paidAmount || 0))}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-[10px]">Amount Paid</Label>
                              <Input
                                type="number"
                                size={2}
                                className="h-8 text-xs font-mono font-bold"
                                value={billPayments[id]?.amount || ''}
                                onChange={(e) => setBillPayments(prev => ({
                                  ...prev,
                                  [id]: { ...prev[id], amount: e.target.value }
                                }))}
                              />
                            </div>
                            <div>
                              <Label className="text-[10px]">Adjustment</Label>
                              <Input
                                type="number"
                                className="h-8 text-xs font-mono"
                                value={billPayments[id]?.adjustment || ''}
                                onChange={(e) => setBillPayments(prev => ({
                                  ...prev,
                                  [id]: { ...prev[id], adjustment: e.target.value }
                                }))}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

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

                {selectedBillIds.length === 0 && (
                  <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded border border-amber-200 dark:border-amber-900 flex items-center gap-3">
                    <p className="text-xs text-amber-700 dark:text-amber-400">Please select at least one bill to record a payment.</p>
                  </div>
                )}

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
              <CompanySelect
                companies={companies}
                value={companyFilter}
                onValueChange={setCompanyFilter}
                showAllOption
                placeholder="All Companies"
                className="w-[200px] h-9 bg-muted/20 border-border/50 text-xs"
              />

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
                      <TableHead>Job No</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead className="text-right">Advance Paid</TableHead>
                      <TableHead className="text-right">Adjustment</TableHead>
                      <TableHead className="text-right">Cash Paid</TableHead>
                      <TableHead className="text-right font-black text-primary">Total Paid</TableHead>
                      <TableHead className="text-right font-black">Bill Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.map((payment) => {
                      const linkedBill = bills.find(b => String(b.id) === String(payment.billId));

                      return (
                        <TableRow key={payment.id} className="hover:bg-muted/50 transition-colors">
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(payment.date)}
                          </TableCell>
                          <TableCell className="font-medium">
                            {payment.companyName}
                          </TableCell>
                          <TableCell className="text-sm font-mono text-muted-foreground">
                            {linkedBill?.jobNumber || linkedBill?.billNo || '-'}
                          </TableCell>
                          <TableCell className="text-sm">
                            {payment.method}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {payment.reference}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground whitespace-nowrap">
                            {linkedBill ? Math.round(linkedBill.advancePayment || 0).toLocaleString() : '-'}
                          </TableCell>
                          <TableCell className="text-right font-medium text-amber-600 whitespace-nowrap">
                            {payment.adjustment ? Math.round(payment.adjustment || 0).toLocaleString() : '-'}
                          </TableCell>
                          <TableCell className="text-right font-bold text-green-600 whitespace-nowrap">
                            {Math.round(payment.amount).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right font-black text-green-700 bg-green-50/50 dark:bg-green-900/10 whitespace-nowrap">
                            {formatCurrency(
                              Number(linkedBill?.advancePayment || 0) +
                              Number(payment.amount || 0) +
                              Number(payment.adjustment || 0)
                            )}
                          </TableCell>
                          <TableCell className="text-right font-black text-primary bg-muted/20 whitespace-nowrap">
                            {linkedBill ? formatCurrency(linkedBill.grandTotal || 0) : '-'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
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
