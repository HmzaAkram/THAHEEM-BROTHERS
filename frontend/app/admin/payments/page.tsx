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
import { Plus, Download, Filter, Search, DollarSign, TrendingUp, CreditCard, Pencil, FileText, Scale } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useData, Payment } from '@/context/data-context';
import { formatDate, formatCurrency } from '@/lib/utils';
import { CompanySelect } from '@/components/company-select';
import { GenericSearchSelect } from '@/components/search-select';
import { MultiSearchSelect } from '@/components/multi-search-select';
import { PinDialog } from '@/components/pin-dialog';
import { Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function PaymentsPage() {
  const { payments, companies, addPayment, updatePayment, deletePayment, bills } = useData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);

  // PIN Dialog State for Deletion
  const [isPinDialogOpen, setIsPinDialogOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);

  // PIN Dialog State for Editing
  const [isEditPinDialogOpen, setIsEditPinDialogOpen] = useState(false);
  const [paymentToEdit, setPaymentToEdit] = useState<Payment | null>(null);

  const handleDeletePayment = async () => {
    if (paymentToDelete) {
      try {
        await deletePayment(paymentToDelete.id);
        Swal.fire({
          title: 'Deleted!',
          text: 'The payment has been deleted successfully.',
          icon: 'success',
          confirmButtonColor: '#10b981',
          timer: 2000,
          showConfirmButton: false
        });
      } catch (err) {
        console.error("Failed to delete payment:", err);
        Swal.fire({
          title: 'Error',
          text: 'Failed to delete the payment.',
          icon: 'error',
          confirmButtonColor: '#3b82f6'
        });
      } finally {
        setIsPinDialogOpen(false);
        setPaymentToDelete(null);
      }
    }
  };

  // Form State
  const [companyId, setCompanyId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [method, setMethod] = useState('Bank Transfer');
  const [paymentMode, setPaymentMode] = useState<'specific' | 'lumpsum'>('specific');
  const [lumpsumAmount, setLumpsumAmount] = useState('');
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

  const handleEditClick = (payment: Payment) => {
    setEditingPayment(payment);
    setCompanyId(payment.companyId);
    setDate(payment.date);
    setMethod(payment.method);

    if (payment.billId) {
      setPaymentMode('specific');
      setSelectedBillIds([payment.billId]);
      setBillPayments({
        [payment.billId]: {
          amount: String(payment.amount),
          adjustment: String(payment.adjustment || 0)
        }
      });
    } else {
      setPaymentMode('lumpsum');
      setLumpsumAmount(String(payment.amount));
    }

    setTrackingId(payment.trackingId || '');
    setChequeNo(payment.chequeNo || '');
    setPayOrderNo(payment.payOrderNo || '');
    setDescription(payment.description || '');
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!companyId || !date) {
      Swal.fire({
        title: 'Missing Information',
        text: 'Please select a company and date.',
        icon: 'warning',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }

    if (paymentMode === 'specific' && selectedBillIds.length === 0) {
      Swal.fire({
        title: 'Missing Bills',
        text: 'Please select at least one bill to pay.',
        icon: 'warning',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }

    if (paymentMode === 'lumpsum' && (!lumpsumAmount || Number(lumpsumAmount) <= 0)) {
      Swal.fire({
        title: 'Invalid Amount',
        text: 'Please enter a valid lumpsum amount.',
        icon: 'warning',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }

    // Validate that each selected bill has a valid amount
    if (paymentMode === 'specific') {
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
    }

    setLoading(true);
    try {
      let successCount = 0;
      let errorCount = 0;

      // Construct reference based on method
      let finalReference = '';
      if (method === 'Bank Transfer') finalReference = `TRF: ${trackingId}`;
      else if (method === 'Cheque') finalReference = `CHQ: ${chequeNo}`;
      else if (method === 'Pay Order') finalReference = `PO: ${payOrderNo}`;
      else if (method === 'Advance') finalReference = `ADV: ${description}`;
      else finalReference = 'Cash';

      const companyName = companies.find(c => String(c.id) === String(companyId))?.name || 'Unknown';

      if (editingPayment) {
        const finalReference =
          method === 'Bank Transfer' ? `TRF: ${trackingId}` :
            method === 'Cheque' ? `CHQ: ${chequeNo}` :
              method === 'Pay Order' ? `PO: ${payOrderNo}` :
                method === 'Advance' ? `ADV: ${description}` : 'Cash';

        const paymentData: Partial<Payment> = {
          companyId,
          companyName,
          date,
          amount: paymentMode === 'specific' ? Number(billPayments[selectedBillIds[0]]?.amount || 0) : Number(lumpsumAmount),
          adjustment: paymentMode === 'specific' ? Number(billPayments[selectedBillIds[0]]?.adjustment || 0) : 0,
          method,
          billId: paymentMode === 'specific' ? selectedBillIds[0] : undefined,
          trackingId: method === 'Bank Transfer' ? trackingId : undefined,
          chequeNo: method === 'Cheque' ? chequeNo : undefined,
          payOrderNo: method === 'Pay Order' ? payOrderNo : undefined,
          description: description,
          reference: finalReference
        };

        const result = await updatePayment(editingPayment.id, paymentData);
        if (result.ok) successCount = 1;
        else errorCount = 1;

      } else if (paymentMode === 'specific') {
        for (const id of selectedBillIds) {
          const p = billPayments[id];

          const paymentData: Omit<Payment, 'id' | 'createdAt'> = {
            companyId,
            companyName,
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
      } else {
        // Lumpsum Auto-allocation logic
        let remainingLumpsum = Number(lumpsumAmount);

        // Filter and sort unpaid bills by date (oldest first)
        const unpaidBills = bills.filter(b =>
          String(b.companyId) === String(companyId) &&
          (b.status !== 'Paid' && b.calculatedStatus !== 'Paid')
        ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        for (const bill of unpaidBills) {
          if (remainingLumpsum <= 0) break;

          const dueAmount = (bill.grandTotal || bill.totalAmount || 0) - (bill.paidAmount || 0);
          if (dueAmount <= 0) continue;

          const amountToPay = Math.min(dueAmount, remainingLumpsum);

          const paymentData: Omit<Payment, 'id' | 'createdAt'> = {
            companyId,
            companyName,
            date,
            amount: amountToPay,
            adjustment: 0, // In lumpsum mode, no manual adjustments for speed
            method,
            billId: bill.id,
            trackingId: method === 'Bank Transfer' ? trackingId : undefined,
            chequeNo: method === 'Cheque' ? chequeNo : undefined,
            payOrderNo: method === 'Pay Order' ? payOrderNo : undefined,
            description: description || 'Auto-allocated Lumpsum Payment',
            reference: finalReference
          };

          const result = await addPayment(paymentData);
          if (result.ok) {
            successCount++;
            remainingLumpsum -= amountToPay;
          } else {
            errorCount++;
            console.error(`Failed to record auto-payment for bill ${bill.id}:`, result.message);
          }
        }

        // Apply remaining surplus as an Advance
        if (remainingLumpsum > 0) {
          const genericPaymentData: Omit<Payment, 'id' | 'createdAt'> = {
            companyId,
            companyName,
            date,
            amount: remainingLumpsum,
            adjustment: 0,
            method,
            // Intentionally omitting billId to act as advance
            trackingId: method === 'Bank Transfer' ? trackingId : undefined,
            chequeNo: method === 'Cheque' ? chequeNo : undefined,
            payOrderNo: method === 'Pay Order' ? payOrderNo : undefined,
            description: description || 'Remaining Lumpsum Advance',
            reference: finalReference
          };

          const genericResult = await addPayment(genericPaymentData);
          if (genericResult.ok) {
            successCount++;
          } else {
            errorCount++;
            console.error(`Failed to record surplus advance payment:`, genericResult.message);
          }
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
        setLumpsumAmount('');
        setSelectedBillIds([]);
        setBillPayments({});
        setPaymentMode('specific');
        setTrackingId('');
        setChequeNo('');
        setPayOrderNo('');
        setDescription('');
        setEditingPayment(null);
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

  const handleExportPDF = async () => {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();

      // Add Logo
      const img = new Image();
      img.src = '/logo.jpeg';

      await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });

      if (img.width > 0) {
        const maxLogoHeight = 16;
        const maxLogoWidth = 16;
        let logoWidth = img.width;
        let logoHeight = img.height;
        const ratio = Math.min(maxLogoWidth / logoWidth, maxLogoHeight / logoHeight);
        logoWidth *= ratio;
        logoHeight *= ratio;

        pdf.addImage(img, 'PNG', 14, 10, logoWidth, logoHeight);
      }

      // Company Info (Thaheem Brothers)
      pdf.setTextColor(15, 23, 42); // slate-900
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("THAHEEM BROTHERS", 34, 12);

      pdf.setTextColor(100, 116, 139); // slate-500
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
      pdf.text("Suite 23, 2nd Floor, R.K. Square Ext, Shahrah-e-Liaquat, Karachi", 34, 16);
      pdf.text("+92 21 32421347 | +92 300 2791780 | import.khi@hotmail.com", 34, 20);

      // Line Separator
      pdf.setDrawColor(226, 232, 240); // slate-200
      pdf.setLineWidth(0.5);
      pdf.line(14, 29, pageWidth - 14, 29);

      // Add Title
      pdf.setTextColor(15, 23, 42); // slate-900
      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.text("PAYMENT HISTORY", pageWidth - 14, 27, { align: "right" });

      // Add Filter Info Below Line
      let yPos = 36;
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(15, 23, 42);

      if (companyFilter !== 'all') {
        const companyNameStr = companies.find(c => String(c.id) === companyFilter)?.name || 'Unknown';
        pdf.text(`Client: ${companyNameStr}`, 14, yPos);
        yPos += 5;
      }

      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(100, 116, 139);
      const timeframeLabel = timeFilter === 'overall' ? 'Overall' :
        timeFilter === 'monthly' ? 'This Month' :
          timeFilter === '3months' ? 'Last 3 Months' :
            timeFilter === '6months' ? 'Last 6 Months' : 'This Year';
      pdf.text(`Period: ${timeframeLabel}`, 14, yPos);
      pdf.text(`Date Printed: ${formatDate(new Date().toISOString())}`, pageWidth - 14, yPos, { align: "right" });

      yPos += 10;

      const head = [['Date', 'Company', 'Job No', 'Method', 'Ref/Adv', 'Adj.', 'Cash Paid', 'Total Paid', 'Bill Total']];
      const body = filteredPayments.map(p => {
        const linkedBill = bills.find(b => String(b.id) === String(p.billId));
        const cashPaid = Number(p.amount) || 0;
        const adjustment = Number(p.adjustment) || 0;
        const totalPaid = cashPaid + adjustment;
        const billTotal = linkedBill ? Number(linkedBill.grandTotal) : 0;

        return [
          formatDate(p.date),
          p.companyName,
          linkedBill?.jobNumber || 'N/A',
          p.method,
          p.reference || (linkedBill ? 'Payment' : 'Advance'),
          adjustment > 0 ? Math.round(adjustment).toLocaleString() : '-',
          cashPaid > 0 ? Math.round(cashPaid).toLocaleString() : '-',
          Math.round(totalPaid).toLocaleString(),
          billTotal > 0 ? Math.round(billTotal).toLocaleString() : '-'
        ];
      });

      autoTable(pdf, {
        startY: yPos,
        head: head,
        body: body,
        theme: 'grid',
        headStyles: { fillColor: [44, 62, 80], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 7, cellPadding: 1.5 },
        columnStyles: {
          5: { halign: 'right' },
          6: { halign: 'right' },
          7: { halign: 'right', fontStyle: 'bold', textColor: [0, 128, 0] },
          8: { halign: 'right', fontStyle: 'bold', textColor: [220, 38, 38] }
        }
      });

      const finalY = (pdf as any).lastAutoTable.finalY + 10;

      // Totals Summary
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(15, 23, 42);
      pdf.text("Summary Totals", 14, finalY);

      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(100, 116, 139);
      pdf.text(`Filtered Collections: ${formatCurrency(tableTotals.collected)}`, 14, finalY + 6);
      pdf.text(`Filtered Adjustments: ${formatCurrency(tableTotals.adjustment)}`, 14, finalY + 11);
      pdf.text(`Filtered Balance: ${formatCurrency(tableTotals.totalBalance)}`, 14, finalY + 16);

      pdf.save(`Payment_History_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('Failed to export PDF', err);
      Swal.fire({
        title: 'Error',
        text: 'Failed to generate PDF. Please try again.',
        icon: 'error',
        confirmButtonColor: '#3b82f6'
      });
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
      label: `JOB: ${b.jobNumber || 'N/A'} (Due: ${formatCurrency((b.grandTotal || b.totalAmount) - b.paidAmount)})`
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

    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [payments, timeFilter, companyFilter, searchQuery]);

  // Dynamic Totals for Payments and associated Bills
  const tableTotals = useMemo(() => {
    let collected = 0;
    let adjustment = 0;

    filteredPayments.forEach(p => {
      collected += Number(p.amount) || 0;
      adjustment += Number(p.adjustment) || 0;
    });

    let relevantBills = [...bills];
    let relevantPayments = [...payments];

    // Company Filter
    if (companyFilter !== 'all') {
      relevantBills = relevantBills.filter(b => String(b.companyId) === companyFilter);
      relevantPayments = relevantPayments.filter(p => String(p.companyId) === companyFilter);
    }

    // Time Filter
    if (timeFilter !== 'overall') {
      const now = new Date();
      let startDate = new Date();
      if (timeFilter === 'monthly') startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      else if (timeFilter === '3months') startDate.setDate(now.getDate() - 90);
      else if (timeFilter === '6months') startDate.setDate(now.getDate() - 180);
      else if (timeFilter === 'yearly') startDate = new Date(now.getFullYear(), 0, 1);

      relevantBills = relevantBills.filter(b => new Date(b.date) >= startDate);
      relevantPayments = relevantPayments.filter(p => new Date(p.date) >= startDate);
    }

    const totalOpeningBalance = relevantBills.length > 0 || relevantPayments.length > 0
      ? companies
        .filter(c => companyFilter === 'all' || String(c.id) === companyFilter)
        .reduce((sum, c) => sum + (Number(c.openingBalance) || 0), 0)
      : 0;

    const totalBill = relevantBills.reduce((sum, b) => sum + (Number(b.grandTotal) || 0), 0) + totalOpeningBalance;
    const totalAdvances = relevantBills.reduce((sum, b) => sum + (Number(b.advancePayment) || 0), 0);
    const overallReceived = totalAdvances + relevantPayments.reduce((sum, p) => sum + (Number(p.amount) || 0) + (Number(p.adjustment) || 0), 0);
    const totalBalance = totalBill - overallReceived;

    return { collected: overallReceived, adjustment, totalBill, totalBalance };
  }, [filteredPayments, bills, payments, companies, companyFilter, timeFilter]);

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="w-full md:w-auto">
            <h1 className="text-3xl font-bold text-foreground">Payments</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Record and track received payments.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <Button
              variant="outline"
              className="gap-2 border-slate-200 h-10 px-4 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-50 w-full sm:w-auto"
              onClick={handleExportPDF}
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download History (PDF)</span>
              <span className="sm:hidden">Download PDF</span>
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  className="gap-2 shadow-md bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                  onClick={() => {
                    setEditingPayment(null);
                    setCompanyId('');
                    setLumpsumAmount('');
                    setSelectedBillIds([]);
                    setBillPayments({});
                    setTrackingId('');
                    setChequeNo('');
                    setPayOrderNo('');
                    setDescription('');
                    setMethod('Bank Transfer');
                    setPaymentMode('specific');
                    setIsDialogOpen(true);
                  }}
                >
                  <Plus className="w-4 h-4" />
                  Record Payment
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingPayment ? 'Edit Payment' : 'Record New Payment'}</DialogTitle>
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
                    <Label>Payment Strategy</Label>
                    <Select value={paymentMode} onValueChange={(val: any) => setPaymentMode(val)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="specific">Pay Specific Bills</SelectItem>
                        <SelectItem value="lumpsum">Lumpsum Auto-Allocate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {paymentMode === 'specific' ? (
                    <>
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
                                    {bill?.jobNumber || 'N/A'}
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
                    </>
                  ) : (
                    <div>
                      <Label>Lumpsum Amount</Label>
                      <Input
                        type="number"
                        placeholder="Example: 5000000"
                        className="mt-1 h-10 font-mono text-lg font-bold text-green-600"
                        value={lumpsumAmount}
                        onChange={(e) => setLumpsumAmount(e.target.value)}
                      />
                      <p className="text-[11px] text-muted-foreground mt-2 bg-muted/30 p-2 rounded-lg leading-relaxed">
                        This amount will be automatically distributed to the oldest unpaid invoices first. Any surplus will be kept as an advance payment toward the company.
                      </p>
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
                      {loading ? (editingPayment ? "Updating..." : "Recording...") : (editingPayment ? "Update Payment" : "Save Payment")}
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setIsDialogOpen(false);
                        setEditingPayment(null);
                        // Reset states
                        setCompanyId('');
                        setLumpsumAmount('');
                        setSelectedBillIds([]);
                        setBillPayments({});
                        setTrackingId('');
                        setChequeNo('');
                        setPayOrderNo('');
                        setDescription('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card className="shadow-md border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
            <CardTitle>Transaction History</CardTitle>
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 w-full">
              {/* Search Bar */}
              <div className="relative w-full lg:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by Ref, Company, Method..."
                  className="pl-9 bg-muted/20 border-border/50 h-9 text-xs w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                {/* Company Select */}
                <CompanySelect
                  companies={companies}
                  value={companyFilter}
                  onValueChange={setCompanyFilter}
                  showAllOption
                  placeholder="All Companies"
                  className="w-full sm:w-[200px] h-9 bg-muted/20 border-border/50 text-xs"
                />

                {/* Time Filter Select */}
                <Select value={timeFilter} onValueChange={(v: any) => setTimeFilter(v)}>
                  <SelectTrigger className="w-full sm:w-[140px] h-9 bg-muted/20 border-border/50 text-xs text-left">
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
            </div>
          </CardHeader>
          <CardContent>
            {filteredPayments.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                No payments recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto custom-scrollbar">
                <div className="min-w-[1200px]">
                  <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/50">
                      <TableHead>Date</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Job No</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead className="text-right font-medium text-[10px] text-muted-foreground uppercase">Adv. Paid</TableHead>
                      <TableHead className="text-right font-medium text-[10px] text-muted-foreground uppercase">Adj.</TableHead>
                      <TableHead className="text-right font-medium text-[10px] text-muted-foreground uppercase">Current Paid</TableHead>
                      <TableHead className="text-right font-black">TOTAL Bill</TableHead>
                      <TableHead className="text-right font-black text-primary">Total Paid</TableHead>
                      <TableHead className="text-right font-black text-rose-600">Remaining Balance</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.map((payment) => {
                      const linkedBill = bills.find(b => String(b.id) === String(payment.billId));
                      const totalBill = linkedBill?.grandTotal || 0;
                      const totalPaid = Number(linkedBill?.advancePayment || 0) + Number(linkedBill?.paidAmount || 0);
                      const remainingBalance = totalBill - totalPaid;

                      return (
                        <TableRow key={payment.id} className="hover:bg-muted/50 transition-colors">
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(payment.date)}
                          </TableCell>
                          <TableCell className="font-medium">
                            {payment.companyName}
                          </TableCell>
                          <TableCell className="text-sm font-mono text-muted-foreground">
                            {linkedBill?.jobNumber || '-'}
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
                          <TableCell className="text-right font-black text-slate-900 dark:text-slate-100 bg-muted/20 whitespace-nowrap">
                            {linkedBill ? formatCurrency(totalBill) : '-'}
                          </TableCell>
                          <TableCell className="text-right font-black text-green-700 bg-green-50/50 dark:bg-green-900/10 whitespace-nowrap">
                            {linkedBill ? formatCurrency(totalPaid) : '-'}
                          </TableCell>
                          <TableCell className={`text-right font-black whitespace-nowrap ${remainingBalance > 0 ? 'text-rose-600 bg-rose-50/50 dark:bg-rose-900/10' : 'text-slate-500'}`}>
                            {linkedBill ? formatCurrency(remainingBalance) : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-primary hover:bg-primary/10 hover:text-primary transition-colors"
                                onClick={() => {
                                  setPaymentToEdit(payment);
                                  setIsEditPinDialogOpen(true);
                                }}
                                title="Edit Payment"
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors"
                                onClick={() => {
                                  setPaymentToDelete(payment);
                                  setIsPinDialogOpen(true);
                                }}
                                title="Delete Payment"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

            {/* Filtering Summary / Totals */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 border-t pt-8">
              <div className="bg-muted/30 p-4 rounded-2xl border border-border/50 flex items-center justify-between hover:bg-muted/50 transition-colors">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Overall Bill Amount</p>
                  <p className="text-xl font-black text-blue-600 dark:text-blue-400 font-mono">{formatCurrency(tableTotals.totalBill)}</p>
                  <p className="text-[9px] text-muted-foreground opacity-70">Incl. Opening Balance</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div className="bg-muted/30 p-4 rounded-2xl border border-border/50 flex items-center justify-between hover:bg-muted/50 transition-colors">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Filtered Adjustments</p>
                  <p className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono">{formatCurrency(tableTotals.adjustment)}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
              <div className="bg-muted/30 p-4 rounded-2xl border border-border/50 flex items-center justify-between hover:bg-muted/50 transition-colors">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total Received Amount</p>
                  <p className="text-xl font-black text-green-600 dark:text-green-400 font-mono">{formatCurrency(tableTotals.collected)}</p>
                  <p className="text-[9px] text-muted-foreground opacity-70">Incl. Advance & Adjustments</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div className="bg-muted/30 p-4 rounded-2xl border border-border/50 flex items-center justify-between hover:bg-muted/50 transition-colors">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Remaining Balance</p>
                  <p className={`text-xl font-black font-mono ${tableTotals.totalBalance > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-400'}`}>
                    {formatCurrency(tableTotals.totalBalance)}
                  </p>
                  <p className="text-[9px] text-muted-foreground opacity-70">Overall Balance to Date</p>
                </div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tableTotals.totalBalance > 0 ? 'bg-rose-500/10' : 'bg-slate-500/10'}`}>
                  <Scale className={`w-5 h-5 ${tableTotals.totalBalance > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-400'}`} />
                </div>
              </div>
            </div>

          </CardContent>
        </Card>
      </div>

      <PinDialog
        isOpen={isPinDialogOpen}
        onClose={() => {
          setIsPinDialogOpen(false);
          setPaymentToDelete(null);
        }}
        onConfirm={handleDeletePayment}
        title="Delete Payment"
        description={`This will permanently delete the payment of ${formatCurrency(paymentToDelete?.amount || 0)}.`}
      />

      <PinDialog
        isOpen={isEditPinDialogOpen}
        onClose={() => {
          setIsEditPinDialogOpen(false);
          setPaymentToEdit(null);
        }}
        onConfirm={() => {
          if (paymentToEdit) {
            handleEditClick(paymentToEdit);
          }
          setIsEditPinDialogOpen(false);
          setPaymentToEdit(null);
        }}
        title="Edit Payment"
        description={`Authorize edit action for payment.`}
      />
    </DashboardLayout >
  );
}
