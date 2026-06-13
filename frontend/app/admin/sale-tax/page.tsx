'use client';

import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Plus, Download, Trash2, Search, Filter, Receipt, Calculator, Eye, Pencil, Loader2,
} from 'lucide-react';
import { useState, useMemo, useRef, useEffect } from 'react';
import { useData, SaleTax } from '@/context/data-context';
import { cn, formatDate, formatCurrency, numberToWords } from '@/lib/utils';
import { CompanySelect } from '@/components/company-select';
import { JobNumberSelect } from '@/components/job-number-select';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toJpeg } from 'html-to-image';
import { toast } from '@/components/ui/use-toast';
import { PinDialog } from '@/components/pin-dialog';
import Swal from 'sweetalert2';
import { SaleTaxTemplate } from '@/components/sale-tax-template';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const statusStyles: Record<string, string> = {
  Pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  Completed: 'bg-green-100 text-green-800 border-green-200',
};

export default function SaleTaxPage() {
  const { saleTaxes, companies, bills, addSaleTax, updateSaleTax, deleteSaleTax } = useData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // View State
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<SaleTax | null>(null);

  // PIN Dialog State for Deletion
  const [isPinDialogOpen, setIsPinDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<SaleTax | null>(null);

  // PIN Dialog State for Editing
  const [isEditPinDialogOpen, setIsEditPinDialogOpen] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState<SaleTax | null>(null);

  // Table Filters
  const [timeFilter, setTimeFilter] = useState<'overall' | 'monthly' | '3months' | '6months' | 'yearly' | 'custom'>('overall');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // ZIP Export State
  const [zipLoading, setZipLoading] = useState(false);
  const [zipProgressText, setZipProgressText] = useState('');

  // Form State
  const [companyId, setCompanyId] = useState('');
  const [companyNameDisplay, setCompanyNameDisplay] = useState('');
  const [selectedBillId, setSelectedBillId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [refBillNo, setRefBillNo] = useState('');
  const [clearingForwardingOf, setClearingForwardingOf] = useState('');
  const [packages, setPackages] = useState('');
  const [igmEgm, setIgmEgm] = useState('');
  const [igmEgmDate, setIgmEgmDate] = useState('');
  const [indexNo, setIndexNo] = useState('');
  const [gdNo, setGdNo] = useState('');
  const [gdDate, setGdDate] = useState('');
  const [serviceCharges, setServiceCharges] = useState('');
  const [salesTaxPercentage, setSalesTaxPercentage] = useState('15');
  const [words, setWords] = useState('');

  const companySelectRef = useRef<HTMLButtonElement>(null);

  // PDF Template ref
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [downloadRecord, setDownloadRecord] = useState<SaleTax | null>(null);

  // Calculations
  const taxAmount = ((Number(serviceCharges) || 0) * (Number(salesTaxPercentage) || 0)) / 100;
  const totalChargesAndTax = (Number(serviceCharges) || 0) + taxAmount;

  const resetForm = () => {
    setCompanyId('');
    setCompanyNameDisplay('');
    setSelectedBillId('');
    setDate(new Date().toISOString().split('T')[0]);
    setRefBillNo('');
    setClearingForwardingOf('');
    setPackages('');
    setIgmEgm('');
    setIgmEgmDate('');
    setIndexNo('');
    setGdNo('');
    setGdDate('');
    setServiceCharges('');
    setSalesTaxPercentage('15');
    setWords('');
    setIsEditing(false);
    setEditingId(null);
  };

  const handleEditClick = (record: SaleTax) => {
    setCompanyId(record.companyId);
    setCompanyNameDisplay(record.companyName);
    
    // Find if there's a matching bill for this ref
    const matchingBill = bills.find(b => b.jobNumber === record.refBillNo);
    if (matchingBill) {
        setSelectedBillId(matchingBill.id);
    } else {
        setSelectedBillId('');
    }

    setDate(record.date ? record.date.split('T')[0] : '');
    setRefBillNo(record.refBillNo || '');
    setClearingForwardingOf(record.clearingForwardingOf || '');
    setPackages(record.packages || '');
    setIgmEgm(record.igmEgm || '');
    setIgmEgmDate(record.igmEgmDate ? record.igmEgmDate.split('T')[0] : '');
    setIndexNo(record.indexNo || '');
    setGdNo(record.gdNo || '');
    setGdDate(record.gdDate ? record.gdDate.split('T')[0] : '');
    setServiceCharges(String(record.serviceCharges || ''));
    setSalesTaxPercentage(String(record.salesTaxPercentage || '15'));
    setWords(record.words || '');
    setEditingId(record.id);
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleJobSelect = (billId: string) => {
    setSelectedBillId(billId);
    const selectedBill = bills.find(b => b.id === billId);
    if (selectedBill) {
      setCompanyId(selectedBill.companyId);
      setCompanyNameDisplay(selectedBill.companyName);
      setRefBillNo(selectedBill.jobNumber || '');
      setPackages(String(selectedBill.packages || ''));
      setIgmEgm(selectedBill.igm || '');
      setIndexNo(String(selectedBill.indexNo || ''));
      setGdNo(selectedBill.gdNumber || '');
      setServiceCharges(String(selectedBill.serviceCharges || ''));
      
      // Auto calc words
      const calcTaxModeAmount = ((Number(selectedBill.serviceCharges) || 0) * (Number(salesTaxPercentage) || 0)) / 100;
      const calcTotal = (Number(selectedBill.serviceCharges) || 0) + calcTaxModeAmount;
      setWords(numberToWords(calcTotal));
    } else {
        setCompanyId('');
        setCompanyNameDisplay('');
    }
  };

  const handleSubmit = async () => {
    if (!companyId || !date) {
      Swal.fire({ title: 'Missing Fields', text: 'Please select a Job Number and date.', icon: 'warning', confirmButtonColor: '#3b82f6' });
      return;
    }

    const selectedCompany = companies.find(c => String(c.id) === String(companyId));
    if (!selectedCompany) return;

    setLoading(true);
    try {
      const data = {
        companyId: selectedCompany.id,
        companyName: selectedCompany.name,
        date,
        refBillNo,
        clearingForwardingOf,
        packages,
        igmEgm,
        igmEgmDate: igmEgmDate || null,
        indexNo,
        gdNo,
        gdDate: gdDate || null,
        value: 0, // Hardcoded to 0 as it's removed from UI
        serviceCharges: Number(serviceCharges) || 0,
        salesTaxPercentage: Number(salesTaxPercentage) || 15,
        words,
        status: 'Pending',
      };

      let result;
      if (isEditing && editingId) {
        result = await updateSaleTax(editingId, data);
      } else {
        result = await addSaleTax(data);
      }

      if (result && result.ok) {
        setIsDialogOpen(false);
        resetForm();
        Swal.fire({
          title: isEditing ? 'Updated!' : 'Created!',
          text: `Sale Tax (SRB) invoice has been ${isEditing ? 'updated' : 'created'} successfully.`,
          icon: 'success',
          confirmButtonColor: '#10b981',
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        Swal.fire({ title: 'Error', text: `Failed to ${isEditing ? 'update' : 'create'} Sale Tax (SRB).`, icon: 'error', confirmButtonColor: '#3b82f6' });
      }
    } catch (error) {
      console.error('Error:', error);
      Swal.fire({ title: 'Error', text: 'An unexpected error occurred.', icon: 'error', confirmButtonColor: '#3b82f6' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (recordToDelete) {
      try {
        await deleteSaleTax(recordToDelete.id);
        Swal.fire({ title: 'Deleted!', text: 'Sale Tax (SRB) record deleted.', icon: 'success', confirmButtonColor: '#10b981', timer: 2000, showConfirmButton: false });
      } catch (err) {
        Swal.fire({ title: 'Error', text: 'Failed to delete.', icon: 'error', confirmButtonColor: '#3b82f6' });
      } finally {
        setIsPinDialogOpen(false);
        setRecordToDelete(null);
      }
    }
  };

  const handleDownloadInvoice = async (record: SaleTax) => {
    try {
      setLoading(true);
      setDownloadRecord(record);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (!invoiceRef.current) {
        setLoading(false);
        return;
      }

      const dataUrl = await toJpeg(invoiceRef.current, {
        cacheBust: true,
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });

      
      // Use standard A4 size paper (210mm x 297mm)
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = 210;
      const pdfHeight = 297;
      
      pdf.addImage(dataUrl, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`SaleTax_${record.refBillNo || record.id}.pdf`);
      setDownloadRecord(null);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({ title: 'Error', description: 'Failed to generate PDF.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleZipDownload = async () => {
    if (filteredRecords.length === 0) {
        Swal.fire({ title: 'No Records', text: 'There are no records to export.', icon: 'info', confirmButtonColor: '#3b82f6' });
        return;
    }

    setZipLoading(true);
    setZipProgressText('Starting ZIP export...');

    try {
        const zip = new JSZip();
        
        for (let i = 0; i < filteredRecords.length; i++) {
            const record = filteredRecords[i];
            setZipProgressText(`Generating PDF: ${record.refBillNo || record.id} (${i + 1}/${filteredRecords.length})`);
            
            setDownloadRecord(record);
            // Wait for template to render
            await new Promise((resolve) => setTimeout(resolve, 800));

            if (invoiceRef.current) {
                const dataUrl = await toJpeg(invoiceRef.current, {
                    cacheBust: true,
                    quality: 0.9,
                    pixelRatio: 1.5,
                    backgroundColor: '#ffffff',
                });

                const pdf = new jsPDF('p', 'mm', 'a4');
                pdf.addImage(dataUrl, 'JPEG', 0, 0, 210, 297);
                const pdfBlob = pdf.output('blob');
                
                const fileName = `SaleTax_${record.refBillNo || record.id}.pdf`.replace(/[/\\?%*:|"<>\s]/g, '_');
                zip.file(fileName, pdfBlob);
            }
        }

        setZipProgressText('Finalizing ZIP file...');
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        saveAs(zipBlob, `SaleTax_Invoices_${new Date().toISOString().split('T')[0]}.zip`);
        
        Swal.fire({ title: 'Success!', text: 'ZIP export completed successfully.', icon: 'success', confirmButtonColor: '#10b981' });
    } catch (error) {
        console.error('ZIP Error:', error);
        Swal.fire({ title: 'Error', text: 'Failed to generate ZIP export.', icon: 'error', confirmButtonColor: '#3b82f6' });
    } finally {
        setZipLoading(false);
        setZipProgressText('');
        setDownloadRecord(null);
    }
  };

  // Filtered records
  const filteredRecords = useMemo(() => {
    let filtered = [...saleTaxes];

    if (timeFilter !== 'overall') {
      const now = new Date();
      let startDateVal = new Date();
      if (timeFilter === 'monthly') startDateVal = new Date(now.getFullYear(), now.getMonth(), 1);
      else if (timeFilter === '3months') startDateVal.setDate(now.getDate() - 90);
      else if (timeFilter === '6months') startDateVal.setDate(now.getDate() - 180);
      else if (timeFilter === 'yearly') startDateVal = new Date(now.getFullYear(), 0, 1);
      else if (timeFilter === 'custom') {
          if (startDate && endDate) {
            const s = new Date(startDate);
            const e = new Date(endDate);
            e.setHours(23, 59, 59, 999);
            filtered = filtered.filter(r => {
                const d = new Date(r.date);
                return d >= s && d <= e;
            });
          }
      }
      
      if (timeFilter !== 'custom') {
        filtered = filtered.filter(r => new Date(r.date) >= startDateVal);
      }
    }

    if (companyFilter !== 'all') {
      filtered = filtered.filter(r => String(r.companyId) === String(companyFilter));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        r.companyName.toLowerCase().includes(q) ||
        (r.refBillNo?.toLowerCase().includes(q) || false) ||
        (r.gdNo?.toLowerCase().includes(q) || false)
      );
    }

    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [saleTaxes, timeFilter, companyFilter, searchQuery, startDate, endDate]);

  // Pagination State & Logic
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  useEffect(() => {
    setCurrentPage(1);
  }, [timeFilter, companyFilter, searchQuery, startDate, endDate]);

  const paginatedRecords = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredRecords.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredRecords, currentPage]);

  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);

  const tableTotals = useMemo(() => {
    return filteredRecords.reduce((acc, r) => {
      acc.value += (Number(r.value) || 0);
      acc.serviceCharges += (Number(r.serviceCharges) || 0);
      acc.grandTotal += (Number(r.grandTotal) || 0);
      return acc;
    }, { value: 0, serviceCharges: 0, grandTotal: 0 });
  }, [filteredRecords]);

  return (
    <>
      <DashboardLayout>
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Sale Tax (SRB) Invoices</h1>
              <p className="text-muted-foreground mt-1">
                Create and manage sales tax (SRB) invoices for your clients.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              {filteredRecords.length > 0 && (
                <Button 
                    variant="outline" 
                    className="gap-2 shadow-sm border-primary/20 hover:border-primary/50 text-primary w-full sm:w-auto"
                    onClick={handleZipDownload}
                    disabled={zipLoading}
                >
                    {zipLoading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-[10px] animate-pulse">{zipProgressText}</span>
                        </>
                    ) : (
                        <>
                            <Download className="w-4 h-4" />
                            Download Filtered ({filteredRecords.length}) as ZIP
                        </>
                    )}
                </Button>
              )}
              <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button className="gap-2 shadow-md hover:bg-primary/90 w-full sm:w-auto">
                    <Plus className="w-4 h-4" />
                    Create New Sale Tax (SRB)
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto w-[95vw] sm:w-auto p-4 sm:p-6">
                  <DialogHeader>
                    <DialogTitle>{isEditing ? 'Edit Sale Tax (SRB)' : 'Create New Sale Tax (SRB)'}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6 pt-4">
                    {/* Section 1: Company & Date */}
                    <div className="bg-muted/30 p-6 rounded-2xl border border-border/50 shadow-sm">
                      <div className="flex items-center gap-3 mb-6 pb-2 border-b border-border/50">
                        <Receipt className="w-5 h-5 text-primary" />
                        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/80">Job Selection & Date</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-1">
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Job Number</Label>
                          <JobNumberSelect
                            bills={bills}
                            value={selectedBillId}
                            onValueChange={handleJobSelect}
                            className="h-10"
                            ref={companySelectRef}
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Date</Label>
                          <Input type="date" className="bg-white dark:bg-slate-950 h-10" value={date} onChange={(e) => setDate(e.target.value)} />
                        </div>
                        <div>
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Client Company</Label>
                          <Input className="bg-muted text-muted-foreground h-10 font-medium" value={companyNameDisplay} readOnly disabled placeholder="Auto-filled from Job" />
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Shipping & Customs */}
                    <div className="bg-muted/30 p-6 rounded-2xl border border-border/50 shadow-sm">
                      <div className="flex items-center gap-3 mb-6 pb-2 border-b border-border/50">
                        <Calculator className="w-5 h-5 text-primary" />
                        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/80">Invoice Details</h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="sm:col-span-2">
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">S.T. Invoice Clearing / Forwarding Of</Label>
                          <Input placeholder="e.g. Rawana Dist" className="bg-white dark:bg-slate-950 h-10" value={clearingForwardingOf} onChange={(e) => setClearingForwardingOf(e.target.value)} />
                        </div>
                        <div>
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Packages</Label>
                          <Input placeholder="e.g. 8" className="bg-white dark:bg-slate-950 h-10" value={packages} onChange={(e) => setPackages(e.target.value)} />
                        </div>
                        <div>
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Index No</Label>
                          <Input placeholder="e.g. 3" className="bg-white dark:bg-slate-950 h-10" value={indexNo} onChange={(e) => setIndexNo(e.target.value)} />
                        </div>
                        <div>
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">IGM / EGM</Label>
                          <Input placeholder="e.g. 2728" className="bg-white dark:bg-slate-950 h-10" value={igmEgm} onChange={(e) => setIgmEgm(e.target.value)} />
                        </div>
                        <div>
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">IGM/EGM Dated</Label>
                          <Input type="date" className="bg-white dark:bg-slate-950 h-10" value={igmEgmDate} onChange={(e) => setIgmEgmDate(e.target.value)} />
                        </div>
                        <div>
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">GD No</Label>
                          <Input placeholder="e.g. C1823" className="bg-white dark:bg-slate-950 h-10" value={gdNo} onChange={(e) => setGdNo(e.target.value)} />
                        </div>
                        <div>
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">GD Dated</Label>
                          <Input type="date" className="bg-white dark:bg-slate-950 h-10" value={gdDate} onChange={(e) => setGdDate(e.target.value)} />
                        </div>
                      </div>
                    </div>

                    {/* Section 3: Financial */}
                    <div className="bg-muted/30 p-6 rounded-2xl border border-border/50 shadow-sm">
                      <div className="flex items-center gap-3 mb-6 pb-2 border-b border-border/50">
                        <Calculator className="w-5 h-5 text-primary" />
                        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/80">Financial Details</h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Service Charges & Misc Expenses</Label>
                          <Input
                            type="number"
                            placeholder="e.g. 2000"
                            className="bg-white dark:bg-slate-950 h-10"
                            value={serviceCharges}
                            onChange={(e) => {
                                setServiceCharges(e.target.value);
                                const newAmount = Number(e.target.value) || 0;
                                const newTax = newAmount * ((Number(salesTaxPercentage) || 0) / 100);
                                setWords(numberToWords(newAmount + newTax));
                            }}
                            onWheel={(e) => e.currentTarget.blur()}
                          />
                          <p className="text-[9px] text-muted-foreground mt-1">Rs. {formatCurrency(Number(serviceCharges) || 0)}</p>
                        </div>
                        <div>
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Sales Tax %</Label>
                          <Input
                            type="number"
                            placeholder="e.g. 15"
                            className="bg-white dark:bg-slate-950 h-10"
                            value={salesTaxPercentage}
                            onChange={(e) => {
                                setSalesTaxPercentage(e.target.value);
                                const currentAmount = Number(serviceCharges) || 0;
                                const newTax = currentAmount * ((Number(e.target.value) || 0) / 100);
                                setWords(numberToWords(currentAmount + newTax));
                            }}
                            onWheel={(e) => e.currentTarget.blur()}
                          />
                          <p className="text-[9px] text-muted-foreground mt-1">Tax: Rs. {formatCurrency(taxAmount)}</p>
                        </div>
                        <div className="sm:col-span-2">
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Amount in Words</Label>
                          <Input
                            placeholder="Auto-calculated..."
                            className="bg-muted text-muted-foreground h-10 italic"
                            value={words}
                            readOnly
                            disabled
                          />
                        </div>
                      </div>

                      {/* Summary */}
                      <div className="mt-6 pt-4 border-t border-border/50 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Service Charges</span>
                          <span className="font-semibold">{formatCurrency(Number(serviceCharges) || 0)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Sales Tax @ {salesTaxPercentage}%</span>
                          <span className="font-semibold">{formatCurrency(taxAmount)}</span>
                        </div>
                        <div className="flex justify-between text-base font-bold pt-2 border-t border-border/50">
                          <span>Total (Charges + Tax)</span>
                          <span className="text-primary">{formatCurrency(totalChargesAndTax)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border/50">
                      <Button onClick={handleSubmit} disabled={loading} className="flex-1 gap-2">
                        {loading ? 'Saving...' : (isEditing ? 'Update Sale Tax (SRB)' : 'Generate Sale Tax (SRB) Invoice')}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Filters */}
          <Card className="shadow-xl border-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md ring-1 ring-black/5 dark:ring-white/10">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by company, ref bill, GD no..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Select value={timeFilter} onValueChange={(v) => setTimeFilter(v as any)}>
                    <SelectTrigger className="w-[140px]">
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="overall">All Time</SelectItem>
                      <SelectItem value="monthly">This Month</SelectItem>
                      <SelectItem value="3months">3 Months</SelectItem>
                      <SelectItem value="6months">6 Months</SelectItem>
                      <SelectItem value="yearly">This Year</SelectItem>
                      <SelectItem value="custom" className="text-primary font-bold italic">Custom Range...</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="w-[180px]">
                    <CompanySelect
                      companies={companies}
                      value={companyFilter}
                      onValueChange={setCompanyFilter}
                      showAllOption={true}
                      allOptionLabel="All Companies"
                      placeholder="Filter by company"
                    />
                  </div>
                </div>
              </div>
              
              {/* Date Range Selector (Prominent when custom is selected) */}
              {timeFilter === 'custom' && (
                <div className="mt-4 pt-4 border-t border-border/50 flex flex-wrap items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center gap-2">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground">From Date</Label>
                    <Input
                      type="date"
                      className="w-[160px] h-9 shadow-inner"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground">To Date</Label>
                    <Input
                      type="date"
                      className="w-[160px] h-9 shadow-inner"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs h-8 text-muted-foreground"
                    onClick={() => { setStartDate(''); setEndDate(''); }}
                  >
                    Clear Dates
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Table */}
          <Card className="shadow-xl border-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md ring-1 ring-black/5 dark:ring-white/10">
            <CardHeader className="pb-2 border-b border-border/50">
              <CardTitle className="text-base flex items-center gap-2">
                <Receipt className="w-4 h-4 text-primary" />
                Sale Tax (SRB) Records ({filteredRecords.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-[10px] font-bold uppercase">Date</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase">Job Number</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase">Company</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase">NTN Number</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase text-right">Service Charges</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase text-right">Total</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-16 text-muted-foreground">
                        No sale tax (SRB) records found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedRecords.map((record) => (
                      <TableRow key={record.id} className="group hover:bg-muted/30 transition-colors">
                        <TableCell className="text-xs">{formatDate(record.date)}</TableCell>
                        <TableCell className="text-xs font-mono">{record.refBillNo || '-'}</TableCell>
                        <TableCell className="text-xs font-semibold">{record.companyName}</TableCell>
                        <TableCell className="text-xs font-mono">{companies.find(c => String(c.id) === String(record.companyId))?.ntn || '-'}</TableCell>
                        <TableCell className="text-xs text-right font-mono">{formatCurrency(record.serviceCharges)}</TableCell>
                        <TableCell className="text-xs text-right font-mono font-bold">{formatCurrency(record.grandTotal)}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                              setSelectedRecord(record);
                              setIsViewOpen(true);
                            }} title="View">
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDownloadInvoice(record)} title="Download PDF">
                              <Download className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                              setRecordToEdit(record);
                              setIsEditPinDialogOpen(true);
                            }} title="Edit">
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => {
                              setRecordToDelete(record);
                              setIsPinDialogOpen(true);
                            }} title="Delete">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                  {/* Totals Row */}
                  {filteredRecords.length > 0 && (
                    <TableRow className="bg-muted/50 font-bold border-t-2 border-border">
                      <TableCell colSpan={3} className="text-xs font-bold uppercase">Totals</TableCell>
                      <TableCell className="text-xs text-right font-mono">{formatCurrency(tableTotals.serviceCharges)}</TableCell>
                      <TableCell className="text-xs text-right font-mono">{formatCurrency(tableTotals.grandTotal)}</TableCell>
                      <TableCell colSpan={1}></TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {/* Pagination Controls */}
              {totalPages > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
                  <p className="text-sm text-muted-foreground w-full text-center sm:text-left">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredRecords.length)} of {filteredRecords.length} entries
                  </p>
                  <div className="flex items-center gap-1.5 w-full justify-center sm:justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="h-8 shadow-sm rounded-lg"
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-1 hidden md:flex">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                        .map((p, i, arr) => {
                          if (i > 0 && p - arr[i - 1] > 1) {
                            return (
                              <div key={`ellipsis-${p}`} className="flex items-center gap-1">
                                <span className="px-2 text-muted-foreground">...</span>
                                <Button
                                  variant={currentPage === p ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => setCurrentPage(p)}
                                  className={`h-8 w-8 p-0 rounded-lg shadow-sm ${currentPage === p ? 'bg-primary text-primary-foreground font-bold hover:bg-primary/90' : 'text-slate-600 hover:text-slate-900 border-border/50 bg-slate-50'}`}
                                >
                                  {p}
                                </Button>
                              </div>
                            );
                          }
                          return (
                            <Button
                              key={p}
                              variant={currentPage === p ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setCurrentPage(p)}
                              className={`h-8 w-8 p-0 rounded-lg shadow-sm ${currentPage === p ? 'bg-primary text-primary-foreground font-bold hover:bg-primary/90' : 'text-slate-600 hover:text-slate-900 border-border/50 bg-white'}`}
                            >
                              {p}
                            </Button>
                          );
                        })}
                    </div>
                    <span className="md:hidden text-sm px-2 font-medium">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="h-8 shadow-sm rounded-lg"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>

      {/* View Preview Dialog - Shows actual PDF template */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-[900px] max-h-[95vh] overflow-y-auto w-[95vw] p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              Sale Tax (SRB) Invoice Preview
            </DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4 pt-2">
              {/* Render the actual PDF template inline */}
              <div className="border rounded-lg overflow-hidden shadow-md" style={{ transform: 'scale(0.75)', transformOrigin: 'top center', marginBottom: '-180px' }}>
                <SaleTaxTemplate ref={invoiceRef} record={selectedRecord} />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2 border-t border-border/50">
                <Button
                  onClick={() => handleDownloadInvoice(selectedRecord)}
                  disabled={loading}
                  className="flex-1 gap-2"
                >
                  <Download className="w-4 h-4" />
                  {loading ? 'Generating...' : 'Download PDF'}
                </Button>
                <Button variant="outline" onClick={() => setIsViewOpen(false)} className="flex-1">
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Hidden PDF Template */}
      <div style={{ position: 'fixed', top: '-9999px', left: '-9999px' }}>
        {downloadRecord && (
          <SaleTaxTemplate ref={invoiceRef} record={downloadRecord} />
        )}
      </div>

      {/* PIN Dialogs */}
      <PinDialog
        isOpen={isPinDialogOpen}
        onClose={() => { setIsPinDialogOpen(false); setRecordToDelete(null); }}
        onConfirm={handleDelete}
        title="Confirm Deletion"
        description="Enter admin PIN to delete this sale tax (SRB) record."
      />
      <PinDialog
        isOpen={isEditPinDialogOpen}
        onClose={() => { setIsEditPinDialogOpen(false); setRecordToEdit(null); }}
        onConfirm={() => {
          if (recordToEdit) {
            handleEditClick(recordToEdit);
          }
          setIsEditPinDialogOpen(false);
          setRecordToEdit(null);
        }}
        title="Edit Record"
        description="Enter admin PIN to edit this sale tax (SRB) record."
      />
    </>
  );
}
