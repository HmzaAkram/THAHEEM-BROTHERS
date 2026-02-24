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
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Download,
  Eye,
  Trash2,
  Ship,
  Truck,
  Plane,
  FileText,
  User,
  Calendar,
  Package,
  Anchor,
  Briefcase,
  AlertCircle,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  CreditCard,
  Pencil,
} from 'lucide-react';
import { useState, useMemo, useRef, useEffect } from 'react';
import { useData, BillItem, Bill } from '@/context/data-context';
import { formatDate, formatCurrency } from '@/lib/utils';
import JSZip from 'jszip';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toJpeg } from 'html-to-image';
import { InvoiceTemplate } from '@/components/invoice-template';
import { CompanySelect } from '@/components/company-select';
import html2canvas from 'html2canvas';
import { toast } from '@/components/ui/use-toast';
import { PinDialog } from '@/components/pin-dialog';
import Swal from 'sweetalert2';

const statusStyles = {
  Paid: 'bg-green-100 text-green-800 border-green-200',
  Partial: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  Unpaid: 'bg-red-100 text-red-800 border-red-200',
};

import { PDFDocument } from 'pdf-lib';

export default function BillsPage() {
  const { bills, companies, addBill, updateBill, deleteBill, payments } = useData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);
  // Consolidated PDF generation state
  const [downloadState, setDownloadState] = useState<{
    bill: Bill | null;
    dataUrl: string | null;
  }>({
    bill: null,
    dataUrl: null,
  });

  const [viewDataUrl, setViewDataUrl] = useState<string | null>(null);

  // PIN Dialog State for Deletion
  const [isPinDialogOpen, setIsPinDialogOpen] = useState(false);
  const [billToDelete, setBillToDelete] = useState<Bill | null>(null);

  const handleDeleteBill = async () => {
    if (billToDelete) {
      try {
        await deleteBill(billToDelete.id);
        Swal.fire({
          title: 'Deleted!',
          text: 'The bill has been deleted successfully.',
          icon: 'success',
          confirmButtonColor: '#10b981',
          timer: 2000,
          showConfirmButton: false
        });
      } catch (err) {
        console.error("Failed to delete bill:", err);
        Swal.fire({
          title: 'Error',
          text: 'Failed to delete the bill.',
          icon: 'error',
          confirmButtonColor: '#3b82f6'
        });
      } finally {
        setIsPinDialogOpen(false);
        setBillToDelete(null);
      }
    }
  };

  const handleDownloadInvoice = async (bill: Bill) => {
    try {
      setLoading(true);
      // 1. Set the bill to be viewed (renders the hidden template)
      setDownloadState({ bill, dataUrl: null });

      // 2. Wait for render - slightly longer to ensure layout stability
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (!invoiceRef.current) {
        console.error('Invoice template ref not found');
        setLoading(false);
        return;
      }

      // 3. Capture with html-to-image (toJpeg) for better compression
      const dataUrl = await toJpeg(invoiceRef.current, {
        cacheBust: true,
        quality: 0.95,
        pixelRatio: 2, // High resolution but compressed
        backgroundColor: '#ffffff',
        style: {
          transform: 'scale(1)', // Ensure no unintended scaling
        }
      });

      // 4. Create A4 PDF (210mm x 297mm)
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = 210;
      const pdfHeight = 297;

      const imgProps = pdf.getImageProperties(dataUrl);
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

      // 5. Add Image to PDF
      // If content is slightly larger, we scale it to fit width. 
      // Pagination is not expected for single page invoices, but if needed logic can be added.
      pdf.addImage(dataUrl, 'JPEG', 0, 0, pdfWidth, imgHeight);

      // 6. Download the Generated PDF
      const filename = bill.jobNumber ? `Invoice_${bill.jobNumber}.pdf` : `Invoice_${bill.billNo}.pdf`;
      pdf.save(filename);

      // Cleanup
      setDownloadState({ bill: null, dataUrl: null });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate PDF. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getPaidDate = (billId: string) => {
    // Find all payments for this bill
    const billPayments = payments.filter(p =>
      String(p.billId) === String(billId) ||
      (p.reference && p.reference === billId) // Legacy check
    );

    if (billPayments.length === 0) return undefined;

    // Sort by date descending to get the latest payment
    const sortedPayments = billPayments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return sortedPayments[0].date;
  }

  const handleViewBill = async (bill: Bill) => {
    setSelectedBill(bill);
    setIsViewOpen(true);
    setViewDataUrl(null); // Reset while loading

    if (bill.attachment) {
      try {
        // Extract filename safely
        const filename = bill.attachment.split('/').pop();
        if (!filename) throw new Error("Invalid attachment path");

        const token = localStorage.getItem('auth_token');
        console.log('[handleViewBill] Fetching attachment:', filename);

        const response = await fetch(`http://localhost:8000/api/v1/bills/attachment/${filename}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          console.warn(`[handleViewBill] Fetch failed with status: ${response.status}`);
          // If direct API fetch fails, it might be a public URL or different format
          // We'll leave viewDataUrl as null, and let the template try its fallback
          return;
        }

        const blob = await response.blob();
        console.log('[handleViewBill] Blob received:', blob.size, 'bytes');

        // Use Blob URL - more efficient and reliable for PDFs
        const objectUrl = window.URL.createObjectURL(blob);
        setViewDataUrl(objectUrl);

      } catch (error) {
        console.error('Error fetching attachment for view:', error);
        // Toast optional here, as the modal will still open
      }
    }
  };



  // 1153: The hidden wrapper div no longer has p-8 padding
  // 199-249: Removed redundant useEffect hook

  const BILL_ITEMS_MAP: Record<string, string[]> = {
    AIR: [
      "DUTY TAXES & ETO",
      "CIVIL AVIATION AUTHORITY",
      "GERRY'S DANA PVT LTD",
      "SHAHEEN CARGO AFU",
      "MENZIES - RAS PVT LTD",
      "DH PAKISTAN PVT LTD",
      "WEBOC TOKEN",
      "CARPENTER CHARGES",
      "CARTAGE",
      "DELIVERY ORDER CHARGES",
      "GENERAL ADMINISTRATION (MISC)",
      "EXAMINATION CHARGES",
      "MISC CHARGES",
      "INVOICE NOT FOUND / FOUND SETTING",
      "PSW CHARGES",
      "SPEED MONEY",
      "COURIER CHARGES",
    ],
    SEA: [
      "DUTY TAXES & ETO",
      "WEBOC TOKEN",
      "CARTAGE",
      "DELIVERY ORDER CHARGES",
      "SECURITY DEPOSIT",
      "LOLO CHARGES",
      "GENERAL ADMINISTRATION (MISC)",
      "EXAMINATION CHARGES",
      "MISC CHARGES",
      "INVOICE NOT FOUND / FOUND SETTING",
      "PSW CHARGES",
      "SPEED MONEY",
      "CH LAB FEES",
      "TERMINAL CHARGES",
      "KICT CHARGES",
      "SAPT CHARGES",
      "KGTL CHARGES",
      "QICT CHARGES",
      "KARACHI PORT TRUST",
      "BURMA OILS MILLS LTD (BOML)",
      "BAYWEST PVT LTD",
      "ALHAMD INT CONT TERMINAL PVT LTD (AICT)",
      "NATIONAL LOGESTIC CELL (NLC)",
      "SEA BOARD LOGESTIC SMC PVT LTD",
      "PAK SHAHEEN",
      "DETENTION CHARGES",
      "LABOUR CHARGES",
      "COURIER CHARGES",
    ],
    EPZ: [
      "DUTY TAXES & ETO",
      "WEBOC TOKEN",
      "WEIGHT SLIP",
      "CARTAGE",
      "GENERAL ADMINISTRATION (MISC)",
      "MISC CHARGES",
      "COURIER CHARGES",
    ]
  };

  // We have a default flattened list for filtering if VIA is not selected, or we fallback.
  const DEFAULT_ITEMS = Array.from(new Set(Object.values(BILL_ITEMS_MAP).flat()));

  // Form State
  const [companyId, setCompanyId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [exporter, setExporter] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [hawb, setHawb] = useState('');
  const [igm, setIgm] = useState('');
  const [indexNo, setIndexNo] = useState('');
  const [gdNumber, setGdNumber] = useState('');
  const [noOfContainers, setNoOfContainers] = useState('');
  const [containerNo, setContainerNo] = useState('');
  const [packages, setPackages] = useState('');
  const [jobNumber, setJobNumber] = useState('');
  const [via, setVia] = useState('');
  const [weight, setWeight] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [note, setNote] = useState<string>('All Necessary documents enclosed.');

  const currentItemsList = via && BILL_ITEMS_MAP[via] ? BILL_ITEMS_MAP[via] : DEFAULT_ITEMS;
  const ALL_BILL_ITEMS = [...currentItemsList, 'Others'];

  // Table Filters State
  const [timeFilter, setTimeFilter] = useState<'overall' | 'monthly' | '3months' | '6months' | 'yearly'>('overall');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [items, setItems] = useState<Omit<BillItem, 'id'>[]>([
    { description: 'DUTY TAXES & ETO', notes: '', amount: 0, invoiceNo: '' },
    { description: 'CIVIL AVIATION AUTHORITY', notes: '', amount: 0, invoiceNo: '' },
    { description: "GERRYS' DANATA PVT LTD", notes: '', amount: 0, invoiceNo: '' },
  ]);
  const [serviceCharges, setServiceCharges] = useState<string>('');
  const [salesTax, setSalesTax] = useState<string>('');
  const [advancePayment, setAdvancePayment] = useState<string>('');

  const totalAmount = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const calculatedSalesTax = (Number(salesTax) * 0.15) || 0;
  const grandTotal = totalAmount + (Number(serviceCharges) || 0) + calculatedSalesTax; // Gross Total (Advance not deducted)


  const handleEditClick = (bill: Bill) => {
    setCompanyId(bill.companyId);
    setDate(bill.date ? bill.date.split('T')[0] : '');
    setExporter(bill.exporter || '');
    setInvoiceNo(bill.invoiceNo || '');
    setInvoiceDate(bill.invoiceDate ? bill.invoiceDate.split('T')[0] : '');
    setHawb(bill.hawb || '');
    setIgm(bill.igm || '');
    setIndexNo(String(bill.indexNo || ''));
    setGdNumber(bill.gdNumber || '');
    setNoOfContainers(String(bill.noOfContainers || ''));
    setContainerNo(bill.containerNo || '');
    setPackages(String(bill.packages || ''));
    setJobNumber(bill.jobNumber || '');
    setVia(bill.via || '');
    setWeight(String(bill.weight || ''));
    setServiceCharges(String(bill.serviceCharges || ''));
    setSalesTax(String(bill.salesTax || ''));
    setAdvancePayment(String(bill.advancePayment || ''));
    setNote(bill.note || 'All Necessary documents enclosed.');
    setAttachment(null); // Reset attachment as file input can't be pre-filled with URL

    // Map existing items
    const existingItems = bill.items.map(item => ({
      description: item.description,
      notes: item.notes || '',
      amount: item.amount,
      invoiceNo: item.invoiceNo || ''
    }));

    setItems(existingItems.length > 0 ? existingItems : [{ description: 'DUTY TAXES & ETO', notes: '', amount: 0, invoiceNo: '' }]);

    setEditingId(bill.id);
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleAddItem = () => {
    setItems([...items, { description: 'DUTY TAXES & ETO', notes: '', amount: 0, invoiceNo: '' }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof typeof items[0], value: string | number) => {
    const newItems = [...items];
    const item = { ...newItems[index], [field]: value };

    newItems[index] = item as any;
    setItems(newItems);
  };

  const handleSubmit = async () => {
    if (!companyId || !date) {
      Swal.fire({ title: 'Missing Information', text: "Please fill all required fields", icon: 'warning', confirmButtonColor: '#3b82f6' });
      return;
    }

    const selectedCompany = companies.find(c => String(c.id) === String(companyId));
    if (!selectedCompany) {
      Swal.fire({ title: 'Error', text: "Selected company not found. Please try re-selecting the company.", icon: 'error', confirmButtonColor: '#3b82f6' });
      return;
    }

    // Generate valid bill items with IDs
    const finalItems: BillItem[] = items.map((item, idx) => ({
      ...item,
      id: `item-${Date.now()}-${idx}`,
      amount: Number(item.amount)
    })).filter(i => i.description && i.amount > 0);

    if (finalItems.length === 0) {
      Swal.fire({ title: 'Invalid Items', text: "Please add at least one valid item", icon: 'warning', confirmButtonColor: '#3b82f6' });
      return;
    }

    const fileToBase64 = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
      });
    };

    setLoading(true);
    try {
      let attachmentBase64;
      if (attachment) {
        attachmentBase64 = await fileToBase64(attachment);
      }

      const billData = {
        companyId: selectedCompany.id,
        companyName: selectedCompany.name,
        date,
        exporter,
        invoiceNo,
        invoiceDate,
        hawb,
        igm,
        indexNo,
        gdNumber,
        noOfContainers,
        containerNo,
        packages,
        jobNumber,
        via,
        weight,
        attachment: attachmentBase64,
        items: finalItems,
        totalAmount: totalAmount,
        serviceCharges: Number(serviceCharges) || 0,
        salesTax: calculatedSalesTax,
        advancePayment: Number(advancePayment) || 0,
        grandTotal: grandTotal,
        note: note,
      };

      let result;
      if (isEditing && editingId) {
        result = await updateBill(editingId, billData);
      } else {
        result = await addBill({
          ...billData,
        });
      }

      if (result && result.ok) {
        setIsDialogOpen(false);
        // Reset Form
        setCompanyId('');
        setJobNumber('');
        setVia('');
        setWeight('');
        setExporter('');
        setInvoiceNo('');
        setInvoiceDate(new Date().toISOString().split('T')[0]);
        setHawb('');
        setIgm('');
        setIndexNo('');
        setGdNumber('');
        setServiceCharges('');
        setSalesTax('');
        setAdvancePayment('');
        setNoOfContainers('');
        setContainerNo('');
        setPackages('');
        setAttachment(null);
        setNote('All Necessary documents enclosed.');
        setItems([
          { description: 'DUTY TAXES & ETO', notes: '', amount: 0, invoiceNo: '' },
          { description: 'CIVIL AVIATION AUTHORITY', notes: '', amount: 0, invoiceNo: '' },
          { description: "GERRYS' DANATA PVT LTD", notes: '', amount: 0, invoiceNo: '' },
        ]);
        setIsEditing(false);
        setEditingId(null);
      } else {
        Swal.fire({ title: 'Error', text: `Failed to ${isEditing ? 'update' : 'generate'} bill: ${result?.message || 'Unknown error'}`, icon: 'error', confirmButtonColor: '#3b82f6' });
      }
    } catch (error) {
      console.error(`Failed to ${isEditing ? 'update' : 'add'} bill:`, error);
      Swal.fire({ title: 'Error', text: `An unexpected error occurred while ${isEditing ? 'updating' : 'generating'} the bill.`, icon: 'error', confirmButtonColor: '#3b82f6' });
    } finally {
      setLoading(false);
    }
  };

  // Filtered Bills Logic
  const filteredBills = useMemo(() => {
    let filtered = [...bills];

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

      filtered = filtered.filter(bill => new Date(bill.date) >= startDate);
    }

    // Company Filter
    if (companyFilter !== 'all') {
      filtered = filtered.filter(bill => bill.companyId === companyFilter);
    }

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(bill =>
        bill.companyName.toLowerCase().includes(q) ||
        (bill.jobNumber?.toLowerCase().includes(q) || false) ||
        (bill.gdNumber?.toLowerCase().includes(q) || false)
      );
    }

    return filtered.sort((a, b) => {
      const jobA = a.jobNumber || '';
      const jobB = b.jobNumber || '';
      return jobA.localeCompare(jobB, undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [bills, timeFilter, companyFilter, searchQuery]);

  // Dynamic Totals
  const tableTotals = useMemo(() => {
    return filteredBills.reduce((acc, bill) => {
      acc.billed += bill.grandTotal;
      acc.paid += bill.paidAmount;
      acc.balance += (bill.grandTotal - bill.paidAmount);
      return acc;
    }, { billed: 0, paid: 0, balance: 0 });
  }, [filteredBills]);

  const handleExportPDF = async () => {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();

      // Add Logo
      const img = new Image();
      img.src = '/logo.PNG'; // Ensure this matches the correct path

      await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve; // Continue even if logo fails
      });

      if (img.width > 0) {
        // Calculate dimensions to maintain aspect ratio
        const maxLogoHeight = 20;
        const maxLogoWidth = 60;
        let logoWidth = img.width;
        let logoHeight = img.height;

        const ratio = Math.min(maxLogoWidth / logoWidth, maxLogoHeight / logoHeight);
        logoWidth *= ratio;
        logoHeight *= ratio;

        // Center the logo
        pdf.addImage(img, 'PNG', (pageWidth - logoWidth) / 2, 10, logoWidth, logoHeight);
      }

      // Add Title
      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.text("Bills List Report", pageWidth / 2, 38, { align: "center" });

      // Add Filter Info
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");

      let filterText = 'All Companies';
      if (companyFilter !== 'all') {
        const comp = companies.find(c => String(c.id) === companyFilter);
        if (comp) filterText = comp.name;
      }
      pdf.text(`Company: ${filterText}`, 14, 48);

      let timeFilterText = "All Time";
      switch (timeFilter) {
        case 'monthly': timeFilterText = "This Month"; break;
        case '3months': timeFilterText = "Last 3 Months"; break;
        case '6months': timeFilterText = "Last 6 Months"; break;
        case 'yearly': timeFilterText = "This Year"; break;
      }
      pdf.text(`Period: ${timeFilterText}`, 14, 54);

      let body = filteredBills.map(bill => [
        formatDate(bill.date),
        bill.jobNumber || 'N/A',
        bill.companyName,
        formatCurrency(bill.grandTotal),
        formatCurrency(bill.paidAmount),
        formatCurrency(bill.grandTotal - bill.paidAmount),
        bill.calculatedStatus
      ]);

      if (body.length === 0) {
        body.push(['-', 'No records found', '-', '-', '-', '-', '-']);
      }

      autoTable(pdf, {
        startY: 62,
        head: [['Date', 'Job No', 'Company', 'Billed', 'Paid', 'Balance', 'Status']],
        body: body,
        theme: 'grid',
        headStyles: { fillColor: [44, 62, 80], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: {
          3: { halign: 'right' },
          4: { halign: 'right' },
          5: { halign: 'right' },
          6: { halign: 'right', fontStyle: 'bold' }
        },
        didParseCell: function (data) {
          if (data.section === 'body') {
            // Color coding based on status text natively on column index 6
            if (data.column.index === 6) {
              const text = data.cell.text[0] || '';
              if (text === 'Paid') {
                data.cell.styles.textColor = [0, 128, 0]; // Green
              } else if (text === 'Unpaid') {
                data.cell.styles.textColor = [220, 38, 38]; // Red
              } else if (text === 'Partial') {
                data.cell.styles.textColor = [202, 138, 4]; // Yellow
              }
            }
          }
        }
      });

      // Add Summary Totals at the bottom
      const finalY = (pdf as any).lastAutoTable.finalY || 62;

      pdf.setFontSize(11);
      pdf.setFont("helvetica", "bold");
      pdf.text("Summary Totals", 14, finalY + 10);

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");

      pdf.text(`Total Billed: ${formatCurrency(tableTotals.billed)}`, 14, finalY + 18);
      pdf.text(`Total Paid: ${formatCurrency(tableTotals.paid)}`, 14, finalY + 24);

      pdf.setFont("helvetica", "bold");
      pdf.text(`Total Balance: ${formatCurrency(tableTotals.balance)}`, 14, finalY + 30);

      pdf.save(`Bills_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('Failed to export PDF', err);
    }
  };


  return (
    <>
      <DashboardLayout>
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Bills & Invoices</h1>
              <p className="text-muted-foreground mt-1">
                Create and manage invoices for your clients.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExportPDF}>
                <Download className="mr-2 h-4 w-4" />
                Download List (PDF)
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) {
                  setIsEditing(false);
                  setEditingId(null);
                  // Optional: Reset form fields here if desired, otherwise they persist until next open/new click
                  // For better UX, usually better to reset on 'Create New' click or reset here.
                  // Let's reset here to avoid stale data when clicking "Create New" after closing "Edit"
                  setCompanyId('');
                  setItems([{ description: 'DUTY TAXES & ETO', notes: '', amount: 0, invoiceNo: '' }]);
                  // Reset other fields... (Doing full reset might be verbose here, maybe extract reset logic)
                  setJobNumber(''); setVia(''); setWeight(''); setExporter(''); setInvoiceNo(''); setInvoiceDate(new Date().toISOString().split('T')[0]); setHawb(''); setIgm(''); setIndexNo(''); setGdNumber(''); setServiceCharges(''); setSalesTax(''); setAdvancePayment(''); setNoOfContainers(''); setContainerNo(''); setPackages(''); setAttachment(null); setNote('All Necessary documents enclosed.');
                }
              }}>
                <DialogTrigger asChild>
                  <Button className="gap-2 shadow-md hover:bg-primary/90">
                    <Plus className="w-4 h-4" />
                    Create New Bill
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{isEditing ? 'Edit Bill' : 'Create New Bill'}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6 pt-4">
                    {/* Bill Details Section */}
                    <div className="space-y-8 pt-4 pb-8">
                      {/* Section 1: Client & General Info */}
                      <div className="bg-muted/30 p-6 rounded-2xl border border-border/50 shadow-sm transition-all hover:bg-muted/40 group">
                        <div className="flex items-center gap-3 mb-6 pb-2 border-b border-border/50">
                          <User className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/80">Company & Arrival</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="md:col-span-1">
                            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Client Company</Label>
                            <CompanySelect
                              companies={companies}
                              value={companyId}
                              onValueChange={setCompanyId}
                              className="h-10"
                            />
                          </div>
                          <div>
                            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Date</Label>
                            <div className="relative">
                              <Input
                                type="date"
                                className="bg-white dark:bg-slate-950 border-border/50 focus:ring-primary/20 transition-all pl-10 h-10"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                              />
                              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 pointer-events-none" />
                            </div>
                          </div>
                          <div>
                            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Job Number</Label>
                            <div className="relative">
                              <Input
                                placeholder="Example: JOB-1234"
                                className="bg-white dark:bg-slate-950 border-border/50 focus:ring-primary/20 transition-all pl-10 h-10"
                                value={jobNumber}
                                onChange={(e) => setJobNumber(e.target.value)}
                              />
                              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 pointer-events-none" />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Section 2: Shipping Details */}
                        <div className="bg-muted/30 p-6 rounded-2xl border border-border/50 shadow-sm transition-all hover:bg-muted/40 group">
                          <div className="flex items-center gap-3 mb-6 pb-2 border-b border-border/50">
                            <Ship className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80">Shipping Logistics</h3>
                          </div>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                            <div className="col-span-2">
                              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">VIA (Transport Mode)</Label>
                              <Select onValueChange={setVia} value={via}>
                                <SelectTrigger className="bg-white dark:bg-slate-950 border-border/50 h-10">
                                  <SelectValue placeholder="Select Method" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="AIR">
                                    <div className="flex items-center gap-2"><Plane className="w-3.5 h-3.5" /> AIR</div>
                                  </SelectItem>
                                  <SelectItem value="SEA">
                                    <div className="flex items-center gap-2"><Anchor className="w-3.5 h-3.5" /> SEA</div>
                                  </SelectItem>
                                  <SelectItem value="EPZ">
                                    <div className="flex items-center gap-2"><Package className="w-3.5 h-3.5" /> EPZ</div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Weight</Label>
                              <div className="relative">
                                <Input
                                  placeholder="01"
                                  className="bg-white dark:bg-slate-950 border-border/50 h-10 pr-10"
                                  value={weight}
                                  onChange={(e) => setWeight(e.target.value)}
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground/50 pointer-events-none uppercase">KG</span>
                              </div>
                            </div>
                            <div>
                              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">PKGS / CTN #</Label>
                              <Input
                                placeholder="01"
                                className="bg-white dark:bg-slate-950 border-border/50 h-10"
                                value={packages}
                                onChange={(e) => setPackages(e.target.value)}
                              />
                            </div>
                            <div>
                              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">IGM</Label>
                              <Input
                                placeholder="01"
                                className="bg-white dark:bg-slate-950 border-border/50 h-10"
                                value={igm}
                                onChange={(e) => setIgm(e.target.value)}
                              />
                            </div>
                            <div>
                              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">INDEX</Label>
                              <Input
                                placeholder="01"
                                className="bg-white dark:bg-slate-950 border-border/50 h-10"
                                value={indexNo}
                                onChange={(e) => setIndexNo(e.target.value)}
                              />
                            </div>
                          </div>
                          {via === 'SEA' && (
                            <div className="grid grid-cols-2 gap-x-6 gap-y-5 mt-5 pt-5 border-t border-border/50 animate-in fade-in slide-in-from-top-2">
                              <div>
                                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">No of Containers</Label>
                                <Input
                                  placeholder="Example: 2"
                                  className="bg-white dark:bg-slate-950 border-border/50 h-10"
                                  value={noOfContainers}
                                  onChange={(e) => setNoOfContainers(e.target.value)}
                                  onWheel={(e) => e.currentTarget.blur()}
                                  type="number"
                                />
                              </div>
                              <div>
                                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Container No</Label>
                                <Input
                                  placeholder="Example: MSCU1234567"
                                  className="bg-white dark:bg-slate-950 border-border/50 h-10"
                                  value={containerNo}
                                  onChange={(e) => setContainerNo(e.target.value)}
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Section 3: Invoice Details */}
                        <div className="bg-muted/30 p-6 rounded-2xl border border-border/50 shadow-sm transition-all hover:bg-muted/40 group">
                          <div className="flex items-center gap-3 mb-6 pb-2 border-b border-border/50">
                            <FileText className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80">Invoice & Customs</h3>
                          </div>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                            <div className="col-span-2">
                              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Exporter Name</Label>
                              <Input
                                placeholder="Example: Exporter Name"
                                className="bg-white dark:bg-slate-950 border-border/50 h-10"
                                value={exporter}
                                onChange={(e) => setExporter(e.target.value)}
                              />
                            </div>
                            <div className="col-span-2">
                              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Arrival Date</Label>
                              <Input
                                type="date"
                                className="bg-white dark:bg-slate-950 border-border/50 h-10 w-full"
                                value={invoiceDate}
                                onChange={(e) => setInvoiceDate(e.target.value)}
                              />
                            </div>
                            <div className="col-span-2">
                              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">GD No</Label>
                              <Input
                                placeholder="Example: ABC-123"
                                className="bg-white dark:bg-slate-950 border-border/50 h-10"
                                value={gdNumber}
                                onChange={(e) => setGdNumber(e.target.value)}
                              />
                            </div>
                            <div className="col-span-2">
                              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">HAWB No#</Label>
                              <Input
                                placeholder="Example: 123"
                                className="bg-white dark:bg-slate-950 border-border/50 h-10 font-mono text-xs"
                                value={hawb}
                                onChange={(e) => setHawb(e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      </div>


                      <div className="space-y-6">
                        <div className="flex justify-between items-center pb-2 border-b border-border/50">
                          <div className="flex items-center gap-3">
                            <Package className="w-5 h-5 text-primary" />
                            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/80">Billing Items</h3>
                          </div>
                        </div>

                        <div className="space-y-4">
                          {items.map((item, idx) => (
                            <div key={idx} className="group relative space-y-4 p-5 border rounded-2xl bg-white dark:bg-slate-950 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300">
                              <div className="flex flex-col md:flex-row gap-4 items-end">
                                {/* Service Selection */}
                                <div className="flex-1 min-w-[200px] space-y-2">
                                  <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Service / Item</Label>
                                  <Select
                                    value={ALL_BILL_ITEMS.includes(item.description) ? item.description : 'Others'}
                                    onValueChange={(value) => handleItemChange(idx, 'description', value)}
                                  >
                                    <SelectTrigger className="h-10 bg-muted/20 border-border/30">
                                      <SelectValue placeholder="Select Item" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {ALL_BILL_ITEMS.map((option) => (
                                        <SelectItem key={option} value={option}>{option}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>

                                  {(item.description === 'Others' || !ALL_BILL_ITEMS.includes(item.description)) && (
                                    <div className="animate-in fade-in slide-in-from-top-1">
                                      <Input
                                        placeholder="Specify Service Name"
                                        className="h-9 text-sm bg-primary/5 border-primary/10 focus:border-primary/30"
                                        value={item.description === 'Others' ? '' : item.description}
                                        onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                                        autoFocus
                                      />
                                    </div>
                                  )}
                                </div>

                                {/* Invoice No# Input */}
                                <div className="w-full md:w-32 space-y-2 text-right">
                                  <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 block">Invoice Number</Label>
                                  <Input
                                    placeholder="Example: 123"
                                    className="h-10 text-right font-mono bg-muted/20 border-border/30"
                                    value={item.invoiceNo || ''}
                                    onChange={(e) => handleItemChange(idx, 'invoiceNo', e.target.value)}
                                  />
                                </div>

                                {/* Amount Input */}
                                <div className="w-full md:w-32 space-y-2 text-right">
                                  <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 block">Amount (PKR)</Label>
                                  <Input
                                    type="number"
                                    placeholder="0"
                                    min="0"
                                    className="h-10 text-right font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none bg-muted/20 border-border/30"
                                    value={item.amount || ''}
                                    onChange={(e) => handleItemChange(idx, 'amount', e.target.value)}
                                    onWheel={(e) => e.currentTarget.blur()}
                                  />
                                </div>

                                {/* Remove Button */}
                                <div className="flex items-center justify-center pb-0.5">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 h-9 w-9 rounded-xl transition-colors"
                                    onClick={() => handleRemoveItem(idx)}
                                    disabled={items.length === 1}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>

                              {/* Description/Notes */}
                              <div className="pt-3 border-t border-border/30">
                                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-1.5 block">Internal Notes / details</Label>
                                <Input
                                  placeholder="Example: Container number, specific charges..."
                                  className="h-9 text-sm bg-transparent border-dashed border-border/50 focus:border-solid focus:bg-white dark:focus:bg-slate-950 transition-all"
                                  value={item.notes || ''}
                                  onChange={(e) => handleItemChange(idx, 'notes', e.target.value)}
                                />
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Add Service Button - Moved to Bottom */}
                        <div className="flex justify-start pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleAddItem}
                            className="gap-2 border-primary/20 hover:bg-primary/5 hover:border-primary/40 transition-all rounded-lg px-4 h-10 w-full sm:w-auto shadow-sm"
                          >
                            <Plus className="w-4 h-4 text-primary" />
                            <span className="text-sm font-bold text-primary">Add Another Service</span>
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-2">
                              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Company Service Charges</Label>
                              <Input
                                type="number"
                                placeholder="Example: 5000"
                                className="h-10 font-mono bg-white dark:bg-slate-950 border-border/50"
                                value={serviceCharges}
                                onChange={(e) => setServiceCharges(e.target.value)}
                                onWheel={(e) => e.currentTarget.blur()}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">SBR Sales Tax (15%)</Label>
                              <Input
                                type="number"
                                placeholder="Example: 750"
                                className="h-10 font-mono bg-white dark:bg-slate-950 border-border/50 text-primary font-bold"
                                value={salesTax}
                                onChange={(e) => setSalesTax(e.target.value)}
                                onWheel={(e) => e.currentTarget.blur()}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Advance Payment Received</Label>
                              <Input
                                type="number"
                                placeholder="Example: 10000"
                                className="h-10 font-mono bg-white dark:bg-slate-950 border-border/50 text-green-600 dark:text-green-400 font-bold"
                                value={advancePayment}
                                onChange={(e) => setAdvancePayment(e.target.value)}
                                onWheel={(e) => e.currentTarget.blur()}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="bg-white dark:bg-slate-950 rounded-2xl p-6 border border-border/50 shadow-lg relative overflow-hidden group">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110" />
                          <div className="space-y-3 relative">
                            <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                              <span>Subtotal Items</span>
                              <span className="font-mono">{formatCurrency(totalAmount)}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                              <span>Service Charges</span>
                              <span className="font-mono">{formatCurrency(Number(serviceCharges) || 0)}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs font-semibold text-primary uppercase tracking-widest">
                              <span>SBR Sales Tax (15% of Input)</span>
                              <span className="font-mono">{formatCurrency(calculatedSalesTax)}</span>
                            </div>
                            {Number(advancePayment) > 0 && (
                              <div className="flex justify-between items-center text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-widest">
                                <span>Advance Payment</span>
                                <span className="font-mono">- {formatCurrency(Number(advancePayment) || 0)}</span>
                              </div>
                            )}
                            <div className="h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
                            <div className="flex justify-between items-end">
                              <div className="space-y-1">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Grand Total Payable</p>
                                <p className="text-2xl font-black text-primary font-mono tracking-tighter">
                                  {formatCurrency(grandTotal)}
                                </p>
                              </div>
                              <AlertCircle className="w-5 h-5 text-primary/20 mb-1" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Section 4: Document Attachment - RELOCATED ABOVE BUTTONS */}
                      <div className="bg-primary/[0.02] p-6 rounded-2xl border-2 border-dashed border-primary/20 hover:border-primary/40 transition-colors group mt-8">
                        <div className="flex flex-col items-center justify-center space-y-3">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Download className="w-6 h-6 text-primary" />
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-semibold text-foreground">Attach Shipment Documents</p>
                            <p className="text-xs text-muted-foreground mt-1">Upload PDF Document</p>
                          </div>
                          <div className="relative w-full max-w-xs mt-2">
                            {/* File Input is ONLY active when no attachment is selected, OR keeps hidden to allow change if needed (but UI request implies separating actions) */}
                            {/* Better approach: If attachment exists, hide the input completely or move it, so it doesn't block the delete button */}

                            {!attachment && (
                              <Input
                                type="file"
                                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                                accept="application/pdf"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) setAttachment(file);
                                }}
                              />
                            )}

                            <div className="flex items-center gap-2">
                              {attachment ? (
                                <>
                                  <div className="flex-1 flex items-center gap-2 px-4 py-2.5 border-2 rounded-xl bg-white dark:bg-slate-950 text-sm font-medium text-foreground/80 shadow-sm border-border/50 relative">
                                    <FileText className="w-4 h-4 text-primary shrink-0" />
                                    <span className="truncate">{attachment.name}</span>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="h-[42px] w-[42px] shrink-0 bg-white dark:bg-slate-950 border-2 rounded-xl border-destructive/20 text-destructive hover:bg-destructive/10 hover:border-destructive/40 shadow-sm z-50 relative pointer-events-auto"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      console.log("Deleting attachment...");
                                      setAttachment(null);
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </>
                              ) : (
                                <div className="w-full flex items-center justify-center gap-2 px-6 py-2.5 border-2 rounded-xl bg-white dark:bg-slate-950 text-sm font-medium text-foreground/80 shadow-sm border-border/50">
                                  Select PDF
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Note Dropdown Section */}
                      <div className="bg-muted/30 p-6 rounded-2xl border border-border/50 shadow-sm transition-all hover:bg-muted/40 group mt-4">
                        <div className="flex items-center gap-3 mb-4 pb-2 border-b border-border/50">
                          <FileText className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80">Invoice Note</h3>
                        </div>
                        <div>
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Select Note</Label>
                          <Select value={note} onValueChange={setNote}>
                            <SelectTrigger className="h-10 bg-white dark:bg-slate-950 border-border/50">
                              <SelectValue placeholder="Select a note" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="All Necessary documents enclosed.">All Necessary documents enclosed.</SelectItem>
                              <SelectItem value="The consignee has not made any advance payment.">The consignee has not made any advance payment.</SelectItem>
                              <SelectItem value="All Necessary documents enclosed. The consignee has not made any advance payment.">All Necessary documents enclosed. & No advance payment.</SelectItem>
                              <SelectItem value=" ">None</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex gap-4 pt-6">
                        <Button
                          className="flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20 rounded-xl transition-all active:scale-[0.98]"
                          onClick={handleSubmit}
                          disabled={loading}
                        >
                          {loading ? (isEditing ? "Updating..." : "Generating...") : (isEditing ? "Update Invoice" : "Generate Invoice")}
                        </Button>
                        <Button
                          variant="ghost"
                          className="flex-1 h-12 font-semibold text-muted-foreground hover:bg-muted/50 rounded-xl"
                          onClick={() => setIsDialogOpen(false)}
                        >
                          Close Window
                        </Button>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <Card className="shadow-md border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
              <CardTitle>All Invoices</CardTitle>
              <div className="flex flex-wrap gap-3">
                {/* Search Bar */}
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by Bill, Company, Job..."
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
            <CardContent ref={tableRef} className="bg-white p-4">
              <div className="hidden print:block mb-4">
                <h2 className="text-xl font-bold">Bills Report</h2>
                <p className="text-sm text-gray-500">Generated on {new Date().toLocaleDateString()}</p>
              </div>
              {filteredBills.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  No bills found. Create one to get started.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-secondary/50">
                        <TableHead>Job No</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Paid</TableHead>
                        <TableHead>Balance</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBills.map((item) => (
                        <TableRow key={item.id} className="hover:bg-muted/50 transition-colors">
                          <TableCell className="font-mono text-sm font-medium">
                            {item.jobNumber || 'N/A'}
                          </TableCell>
                          <TableCell>
                            {item.companyName}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(item.date)}
                          </TableCell>
                          <TableCell className="font-semibold">
                            PKR {item.grandTotal?.toLocaleString() || '0'}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            PKR {item.paidAmount?.toLocaleString() || '0'}
                          </TableCell>
                          <TableCell className="font-semibold text-primary">
                            PKR {((item.grandTotal || 0) - (item.paidAmount || 0)).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusStyles[item.calculatedStatus || 'Unpaid']
                                }`}
                            >
                              {item.calculatedStatus || 'Unpaid'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="hover:text-primary hover:bg-primary/5 transition-colors"
                                onClick={() => handleViewBill(item)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="hover:text-primary hover:bg-primary/5 transition-colors"
                                onClick={() => handleEditClick(item)}
                                title="Edit Bill"
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="hover:text-primary hover:bg-primary/5 transition-colors"
                                onClick={() => handleDownloadInvoice(item)}
                                title="Download PDF"
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors"
                                onClick={() => {
                                  setBillToDelete(item);
                                  setIsPinDialogOpen(true);
                                }}
                                title="Delete Bill"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Filtering Summary / Totals */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-8">
                <div className="bg-muted/30 p-4 rounded-2xl border border-border/50 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Filtered Billed</p>
                    <p className="text-xl font-black text-foreground font-mono">PKR {tableTotals.billed.toLocaleString()}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-primary" />
                  </div>
                </div>
                <div className="bg-muted/30 p-4 rounded-2xl border border-border/50 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Filtered Collected</p>
                    <p className="text-xl font-black text-green-600 dark:text-green-400 font-mono">PKR {tableTotals.paid.toLocaleString()}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <div className="bg-muted/30 p-4 rounded-2xl border border-border/50 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Pending Balance</p>
                    <p className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono">PKR {tableTotals.balance.toLocaleString()}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>

          {/* View Bill Modal */}
          <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                  <FileText className="w-6 h-6 text-primary" />
                  Invoice Details
                </DialogTitle>
              </DialogHeader>

              {selectedBill && (
                <div className="space-y-8 py-4">
                  <InvoiceTemplate
                    bill={selectedBill}
                    attachmentDataUrl={viewDataUrl}
                    paidDate={getPaidDate(selectedBill.id)}
                  />
                  <div className="flex gap-4 pt-6 border-t">
                    <Button className="flex-1 gap-2 rounded-xl" onClick={() => handleDownloadInvoice(selectedBill)}>
                      <Download className="w-4 h-4" />
                      Download PDF
                    </Button>
                    <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setIsViewOpen(false)}>
                      Close
                    </Button>
                  </div>
                </div>
              )}

            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout >
      {/* Hidden Capture Area for PDF Generation  */}
      <div style={{ position: 'fixed', top: '200vh', left: 0 }} suppressHydrationWarning>
        {downloadState.bill && (
          <div ref={invoiceRef} className="w-[210mm] bg-white">
            <InvoiceTemplate
              bill={downloadState.bill}
              attachmentDataUrl={downloadState.dataUrl}
              paidDate={getPaidDate(downloadState.bill.id)}
            />
          </div>
        )}
      </div>

      <PinDialog
        isOpen={isPinDialogOpen}
        onClose={() => {
          setIsPinDialogOpen(false);
          setBillToDelete(null);
        }}
        onConfirm={handleDeleteBill}
        actionTitle="Delete Bill"
        description={`This will permanently delete Job No. ${billToDelete?.jobNumber || 'Unknown'}.`}
      />
    </>
  );
}
