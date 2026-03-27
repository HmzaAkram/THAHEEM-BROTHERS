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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  Calculator
} from 'lucide-react';
import { useState, useMemo, useRef, useEffect } from 'react';
import { useData, BillItem, Bill, BillStatus } from '@/context/data-context';
import { cn, formatDate, formatCurrency } from '@/lib/utils';
import JSZip from 'jszip';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toJpeg } from 'html-to-image';
import { InvoiceTemplate } from '@/components/invoice-template';
import { CompanySelect } from '@/components/company-select';
import { ExporterSelect } from '@/components/exporter-select';
import html2canvas from 'html2canvas';
import { toast } from '@/components/ui/use-toast';
import { PinDialog } from '@/components/pin-dialog';
import Swal from 'sweetalert2';

const statusStyles = {
  Paid: 'bg-green-100 text-green-800 border-green-200',
  Partial: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  Unpaid: 'bg-red-100 text-red-800 border-red-200',
  Draft: 'bg-slate-100 text-slate-800 border-slate-200',
};

import { PDFDocument } from 'pdf-lib';

export default function BillsPage() {
  const { bills, companies, addBill, updateBill, updateBillStatus, deleteBill, payments, getCompanyBalance, exporters, addExporter } = useData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(false);
  const [availableCredit, setAvailableCredit] = useState<number>(0);
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

  // Robust number parsing to handle commas etc.
  const parseNumber = (val: any) => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    const cleaned = String(val).replace(/[^0-9.-]/g, '');
    return parseFloat(cleaned) || 0;
  };

  // PIN Dialog State for Deletion
  const [isPinDialogOpen, setIsPinDialogOpen] = useState(false);
  const [billToDelete, setBillToDelete] = useState<Bill | null>(null);

  // PIN Dialog State for Editing
  const [isEditPinDialogOpen, setIsEditPinDialogOpen] = useState(false);
  const [billToEdit, setBillToEdit] = useState<Bill | null>(null);

  // PIN Dialog State for Status Update
  const [isStatusPinDialogOpen, setIsStatusPinDialogOpen] = useState(false);
  const [billToUpdateStatus, setBillToUpdateStatus] = useState<{ bill: Bill, newStatus: string } | null>(null);

  // Form Validation State
  const [formErrors, setFormErrors] = useState<Record<string, boolean>>({});
  const companySelectRef = useRef<HTMLButtonElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const itemsSectionRef = useRef<HTMLDivElement>(null);

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

  const handleUpdateStatus = async () => {
    if (billToUpdateStatus) {
      try {
        setLoading(true);
        const { bill, newStatus } = billToUpdateStatus;
        await updateBillStatus(bill.id, newStatus);

        toast({
          title: 'Status Updated',
          description: `Bill status changed to ${newStatus}.`,
        });
      } catch (err) {
        console.error("Failed to update status:", err);
        toast({
          title: 'Error',
          description: 'Failed to update the status.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
        setIsStatusPinDialogOpen(false);
        setBillToUpdateStatus(null);
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
    setViewDataUrl(null); // Keep state reset just in case
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
      "PIA",
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

  useEffect(() => {
    if (companyId && !isEditing) {
      const balance = getCompanyBalance(companyId);
      if (balance < 0) {
        setAvailableCredit(Math.abs(balance));
      } else {
        setAvailableCredit(0);
      }
    } else {
      setAvailableCredit(0);
    }
  }, [companyId, getCompanyBalance, isEditing]);

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
  const [attachments, setAttachments] = useState<(File | string)[]>([]);
  const [noteType, setNoteType] = useState<string>('All Necessary documents enclosed.');
  const [customNote, setCustomNote] = useState<string>('');
  const [taxRate, setTaxRate] = useState<number>(15);

  const currentItemsList = via && BILL_ITEMS_MAP[via] ? BILL_ITEMS_MAP[via] : DEFAULT_ITEMS;
  const ALL_BILL_ITEMS = [...currentItemsList, 'Others'];

  // Table Filters State
  const [timeFilter, setTimeFilter] = useState<'overall' | 'monthly' | '3months' | '6months' | 'yearly'>('overall');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [items, setItems] = useState<Omit<BillItem, 'id'>[]>([
    { description: 'DUTY TAXES & ETO', notes: '', amount: 0, invoiceNo: '' },
  ]);
  const [serviceCharges, setServiceCharges] = useState<string>('');
  const [salesTax, setSalesTax] = useState<string>('');
  const [advancePayment, setAdvancePayment] = useState<string>('');

  const totalAmount = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const calculatedSalesTax = (Number(salesTax) * (taxRate / 100)) || 0;
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
    setAdvancePayment(String(bill.advancePayment || ''));

    // Handle Note logic
    const predefinedNotes = [
      'All Necessary documents enclosed.',
      'The consignee has not made any advance payment.',
      'All Necessary documents enclosed. The consignee has not made any advance payment.',
      'No notes have been provided by the admin.'
    ];

    let cleanNote = bill.note || '';
    let extractedTaxRate = 15;

    const trMatch = cleanNote.match(/\[TR:(\d+)\]/);
    if (trMatch) {
      extractedTaxRate = parseInt(trMatch[1]);
      cleanNote = cleanNote.replace(/\[TR:\d+\]/, '').trim();
    }
    setTaxRate(extractedTaxRate);

    // Reconstruct SBR Sales Tax Input Amount
    const inputSalesTax = bill.salesTax ? (Number(bill.salesTax) / (extractedTaxRate / 100)) : 0;
    setSalesTax(String(inputSalesTax > 0 ? Math.round(inputSalesTax) : ''));

    if (cleanNote && predefinedNotes.includes(cleanNote)) {
      setNoteType(cleanNote);
      setCustomNote('');
    } else if (!cleanNote || cleanNote === ' ' || cleanNote === 'None') {
      setNoteType('No notes have been provided by the admin.');
      setCustomNote('');
    } else {
      setNoteType('Others');
      setCustomNote(cleanNote);
    }

    // Set attachments from bill data
    if (bill.attachments && bill.attachments.length > 0) {
      setAttachments(bill.attachments);
    } else if (bill.attachment) {
      setAttachments([bill.attachment]);
    } else {
      setAttachments([]);
    }

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
    setFormErrors({});
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

  const handleSubmit = async (statusArg: BillStatus = 'Unpaid') => {
    const errors: Record<string, boolean> = {};
    if (!companyId) errors.companyId = true;
    if (!date) errors.date = true;

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      // Scroll to the first error
      if (errors.companyId && companySelectRef.current) {
        companySelectRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        companySelectRef.current.focus();
      } else if (errors.date && dateInputRef.current) {
        dateInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        dateInputRef.current.focus();
      }
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
      setFormErrors(prev => ({ ...prev, items: true }));
      if (itemsSectionRef.current) {
        itemsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    const fileToBase64 = (file: File | string): Promise<string> => {
      // If it's already a string (URL), return it directly
      if (typeof file === 'string') {
        return Promise.resolve(file);
      }
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
      });
    };

    setLoading(true);
    try {
      const attachmentsBase64 = await Promise.all(attachments.map(fileToBase64));

      let finalStatus = statusArg;
      if (statusArg !== 'Draft') {
        const adv = Number(advancePayment) || 0;
        if (adv >= grandTotal && grandTotal > 0) {
          finalStatus = 'Paid';
        } else if (adv > 0) {
          finalStatus = 'Partial';
        } else {
          finalStatus = 'Unpaid';
        }
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
        attachments: attachmentsBase64,
        items: finalItems,
        totalAmount: totalAmount,
        serviceCharges: Number(serviceCharges) || 0,
        salesTax: calculatedSalesTax,
        advancePayment: Number(advancePayment) || 0,
        grandTotal: grandTotal,
        status: finalStatus,
        note: (noteType === 'Others' ? customNote : noteType) + (availableCredit > 0 && Number(advancePayment) === availableCredit ? ` [Surplus Applied: ${availableCredit}]` : '') + ` [TR:${taxRate}]`,
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
        setAttachments([]);
        setNoteType('All Necessary documents enclosed.');
        setCustomNote('');
        setTaxRate(15);
        setItems([
          { description: 'DUTY TAXES & ETO', notes: '', amount: 0, invoiceNo: '' },
        ]);
        setIsEditing(false);
        setEditingId(null);
        setFormErrors({});
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

    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [bills, timeFilter, companyFilter, searchQuery]);

  // Pagination State & Logic
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  useEffect(() => {
    setCurrentPage(1);
  }, [timeFilter, companyFilter, searchQuery]);

  const paginatedBills = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredBills.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredBills, currentPage]);

  const totalPages = Math.ceil(filteredBills.length / itemsPerPage);

  // Dynamic Totals
  const tableTotals = useMemo(() => {
    const uniqueCompanyIds = new Set(filteredBills.map(b => String(b.companyId)));
    let totalOpeningBalance = 0;

    uniqueCompanyIds.forEach(id => {
      const comp = companies.find(c => String(c.id) === id);
      if (comp) {
        totalOpeningBalance += parseNumber(comp.openingBalance);
      }
    });

    return filteredBills.reduce((acc, bill) => {
      // Exclude draft amounts from totals as per user requirement
      if (bill.status === 'Draft' || bill.calculatedStatus === 'Draft') {
        return acc;
      }
      acc.billed += parseNumber(bill.grandTotal);
      acc.paid += parseNumber(bill.paidAmount);
      acc.balance += (parseNumber(bill.grandTotal) - parseNumber(bill.paidAmount));
      return acc;
    }, { billed: 0, paid: 0, balance: totalOpeningBalance });
  }, [filteredBills, companies]);

  const handleExportPDF = async () => {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();

      // Add Logo
      const img = new Image();
      img.src = '/logo.jpeg'; // Ensure this matches the correct path

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
        formatCurrency(parseNumber(bill.grandTotal)),
        formatCurrency(parseNumber(bill.paidAmount)),
        formatCurrency(parseNumber(bill.grandTotal) - parseNumber(bill.paidAmount)),
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
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Bills & Invoices</h1>
              <p className="text-muted-foreground mt-1">
                Create and manage invoices for your clients.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <Button variant="outline" onClick={handleExportPDF} className="w-full sm:w-auto">
                <Download className="mr-2 h-4 w-4" />
                Download List (PDF)
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) {
                  setIsEditing(false);
                  setEditingId(null);
                  setCompanyId('');
                  setItems([{ description: 'DUTY TAXES & ETO', notes: '', amount: 0, invoiceNo: '' }]);
                  setJobNumber(''); setVia(''); setWeight(''); setExporter(''); setInvoiceNo(''); setInvoiceDate(new Date().toISOString().split('T')[0]); setHawb(''); setIgm(''); setIndexNo(''); setGdNumber(''); setServiceCharges(''); setSalesTax(''); setAdvancePayment(''); setNoOfContainers(''); setContainerNo(''); setPackages(''); setAttachments([]);
                  setNoteType('All Necessary documents enclosed.');
                  setCustomNote('');
                  setTaxRate(15);
                  setFormErrors({});
                }
              }}>
                <DialogTrigger asChild>
                  <Button className="gap-2 shadow-md hover:bg-primary/90 w-full sm:w-auto">
                    <Plus className="w-4 h-4" />
                    Create New Bill
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto w-[95vw] sm:w-auto p-4 sm:p-6">
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
                              onValueChange={(val) => {
                                setCompanyId(val);
                                setFormErrors(prev => ({ ...prev, companyId: false }));
                              }}
                              className={cn("h-10", formErrors.companyId && "border-destructive ring-destructive/20")}
                              ref={companySelectRef}
                            />
                          </div>
                          <div>
                            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Date</Label>
                            <div className="relative">
                              <Input
                                type="date"
                                className={cn(
                                  "bg-white dark:bg-slate-950 border-border/50 focus:ring-primary/20 transition-all pl-10 h-10",
                                  formErrors.date && "border-destructive ring-destructive/20"
                                )}
                                value={date}
                                onChange={(e) => {
                                  setDate(e.target.value);
                                  setFormErrors(prev => ({ ...prev, date: false }));
                                }}
                                ref={dateInputRef}
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
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
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
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                            <div className="col-span-2">
                              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Exporter Name</Label>
                              <ExporterSelect
                                exporters={exporters}
                                value={exporter}
                                onValueChange={setExporter}
                                onCreateNew={async (newName) => {
                                  try {
                                    setLoading(true);
                                    await addExporter({ name: newName });
                                    setExporter(newName);
                                    toast({ title: 'Success', description: `Exporter "${newName}" added successfully.` });
                                  } catch (error) {
                                    toast({ title: 'Error', description: 'Failed to add exporter.', variant: 'destructive' });
                                  } finally {
                                    setLoading(false);
                                  }
                                }}
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

                      {/* Section 4: Billing Items */}
                      <div className="space-y-6" ref={itemsSectionRef}>
                        <div className="flex justify-between items-center pb-2 border-b border-border/50">
                          <div className="flex items-center gap-3">
                            <Package className="w-5 h-5 text-primary" />
                            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/80">Billing Items</h3>
                          </div>
                          {formErrors.items && (
                            <span className="text-[10px] font-bold text-destructive uppercase animate-pulse">Please add at least one valid item</span>
                          )}
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
                                  <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 block">Amount</Label>
                                  <Input
                                    type="number"
                                    placeholder="0"
                                    min="0"
                                    className="h-10 text-right font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none bg-muted/20 border-border/30"
                                    value={item.amount || ''}
                                    onChange={(e) => {
                                      handleItemChange(idx, 'amount', e.target.value);
                                      if (formErrors.items) setFormErrors(prev => ({ ...prev, items: false }));
                                    }}
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
                              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">SBR Sales Tax Input Amount</Label>
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
                              <div className="flex justify-between items-center">
                                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Advance Payment Received</Label>
                                {availableCredit > 0 && !isEditing && (
                                  <Badge variant="outline" className="text-[9px] bg-green-50 text-green-700 border-green-200 animate-pulse">
                                    Credit Available: {formatCurrency(availableCredit)}
                                  </Badge>
                                )}
                              </div>
                              <div className="relative group">
                                <Input
                                  type="number"
                                  placeholder="Example: 10000"
                                  className="h-10 font-mono bg-white dark:bg-slate-950 border-border/50 text-green-600 dark:text-green-400 font-bold pr-20"
                                  value={advancePayment}
                                  onChange={(e) => setAdvancePayment(e.target.value)}
                                  onWheel={(e) => e.currentTarget.blur()}
                                />
                                {availableCredit > 0 && !isEditing && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="absolute right-1 top-1 h-8 text-[10px] font-bold text-green-700 hover:bg-green-100 px-2 rounded-md"
                                    onClick={() => setAdvancePayment(String(Math.min(availableCredit, grandTotal)))}
                                  >
                                    Use Credit
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white dark:bg-slate-950 rounded-2xl p-6 border border-border/50 shadow-lg relative overflow-hidden group">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110" />
                          <div className="space-y-3 relative">
                            <div className="flex justify-between items-center pb-2 border-b border-border/50">
                              <div className="flex items-center gap-3">
                                <Calculator className="w-5 h-5 text-primary" />
                                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80">Totals & Tax</h3>
                              </div>
                              <div className="flex items-center gap-2 bg-white dark:bg-slate-950 p-1 rounded-lg border border-border/50 shadow-sm">
                                <span className="text-[9px] font-bold text-muted-foreground uppercase px-1">Tax Rate:</span>
                                <Select value={String(taxRate)} onValueChange={(v) => setTaxRate(Number(v))}>
                                  <SelectTrigger className="h-7 w-[80px] text-xs font-bold border-none bg-secondary/50 focus:ring-0">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="5">5%</SelectItem>
                                    <SelectItem value="10">10%</SelectItem>
                                    <SelectItem value="15">15%</SelectItem>
                                    <SelectItem value="20">20%</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                              <span>Subtotal Items</span>
                              <span className="font-mono">{formatCurrency(totalAmount)}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                              <span>Service Charges</span>
                              <span className="font-mono">{formatCurrency(Number(serviceCharges) || 0)}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs font-semibold text-primary uppercase tracking-widest">
                              <span>SBR Sales Tax ({taxRate}% of Input)</span>
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

                      {/* Section 5: Document Attachment */}
                      <div className="bg-primary/[0.02] p-6 rounded-2xl border-2 border-dashed border-primary/20 hover:border-primary/40 transition-colors group mt-8">
                        <div className="flex flex-col items-center justify-center space-y-3">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Download className="w-6 h-6 text-primary" />
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-semibold text-foreground">Attach Shipment Documents</p>
                            <p className="text-xs text-muted-foreground mt-1">Upload PDF Documents</p>
                          </div>
                          <div className="relative w-full max-w-lg mt-4">
                            <div className="flex justify-center mb-4">
                              <label className="cursor-pointer">
                                <div className="flex items-center gap-2 px-6 py-2.5 border-2 rounded-xl bg-white dark:bg-slate-950 text-sm font-medium text-foreground/80 shadow-sm border-border/50 hover:bg-muted/50 transition-colors">
                                  <Plus className="w-4 h-4 text-primary" />
                                  Select PDFs
                                </div>
                                <Input
                                  type="file"
                                  multiple
                                  className="hidden"
                                  accept="application/pdf"
                                  onChange={(e) => {
                                    const files = Array.from(e.target.files || []);
                                    setAttachments(prev => [...prev, ...files]);
                                  }}
                                />
                              </label>
                            </div>

                            <div className="flex flex-col gap-2">
                              {attachments.map((file, idx) => (
                                <div key={idx} className="flex items-center gap-2 w-full justify-between">
                                  <div className="flex-1 flex items-center gap-2 px-4 py-2.5 border-2 rounded-xl bg-white dark:bg-slate-950 text-sm font-medium text-foreground/80 shadow-sm border-border/50 relative">
                                    <FileText className="w-4 h-4 text-primary shrink-0" />
                                    <span className="truncate max-w-[200px] sm:max-w-xs block overflow-hidden">
                                      {typeof file === 'string' ? file.split('/').pop() : file.name}
                                    </span>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="h-[42px] w-[42px] shrink-0 bg-white dark:bg-slate-950 border-2 rounded-xl border-destructive/20 text-destructive hover:bg-destructive/10 hover:border-destructive/40 shadow-sm z-50 relative pointer-events-auto"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setAttachments(prev => prev.filter((_, i) => i !== idx));
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              ))}
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
                          <Select value={noteType} onValueChange={setNoteType}>
                            <SelectTrigger className="h-10 bg-white dark:bg-slate-950 border-border/50">
                              <SelectValue placeholder="Select a note" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="All Necessary documents enclosed.">All Necessary documents enclosed.</SelectItem>
                              <SelectItem value="The consignee has not made any advance payment.">The consignee has not made any advance payment.</SelectItem>
                              <SelectItem value="All Necessary documents enclosed. The consignee has not made any advance payment.">All Necessary documents enclosed. & No advance payment.</SelectItem>
                              <SelectItem value="No notes have been provided by the admin.">No Notes</SelectItem>
                              <SelectItem value="Others">Others</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {noteType === 'Others' && (
                          <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Custom Note</Label>
                            <Input
                              placeholder="Enter your custom note here..."
                              className="bg-white dark:bg-slate-950 border-border/50 h-10"
                              value={customNote}
                              onChange={(e) => setCustomNote(e.target.value)}
                            />
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6">
                        <Button
                          className="h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest shadow-lg shadow-primary/20 rounded-xl transition-all active:scale-[0.98]"
                          onClick={() => handleSubmit('Unpaid')}
                          disabled={loading}
                        >
                          {loading ? (isEditing ? "Updating..." : "Generating...") : (isEditing ? "Generate Invoice" : "Generate Invoice")}
                        </Button>
                        <Button
                          variant="outline"
                          className="h-12 border-primary/20 text-primary font-black uppercase tracking-widest hover:bg-primary/5 rounded-xl border-2 transition-all"
                          onClick={() => handleSubmit('Draft')}
                          disabled={loading}
                        >
                          {loading ? "Saving..." : (isEditing && editingId ? "Update Draft" : "Save as Draft")}
                        </Button>
                        <Button
                          variant="ghost"
                          className="sm:col-span-2 h-10 font-bold text-muted-foreground hover:bg-muted/50 rounded-xl uppercase text-[10px] tracking-widest"
                          onClick={() => setIsDialogOpen(false)}
                        >
                          Cancel & Close
                        </Button>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div >
          </div >

          <Card className="shadow-md border-border/50">
            <CardHeader className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-7">
              <CardTitle>All Invoices</CardTitle>
              <div className="flex flex-col sm:flex-row flex-wrap gap-3 w-full lg:w-auto">
                {/* Search Bar */}
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by Bill, Company, Job..."
                    className="pl-9 bg-muted/20 border-border/50 h-9 text-xs w-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
 
                {/* Company Select */}
                <Select value={companyFilter} onValueChange={setCompanyFilter}>
                  <SelectTrigger className="w-full sm:w-[180px] h-9 bg-muted/20 border-border/50 text-xs">
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
                  <SelectTrigger className="w-full sm:w-[140px] h-9 bg-muted/20 border-border/50 text-xs">
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
                <div className="overflow-x-auto custom-scrollbar">
                  <div className="min-w-[900px]">
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
                      {paginatedBills.map((item) => (
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
                            {item.grandTotal?.toLocaleString() || '0'}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {item.paidAmount?.toLocaleString() || '0'}
                          </TableCell>
                          <TableCell className="font-semibold text-primary">
                            {((item.grandTotal || 0) - (item.paidAmount || 0)).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger className="focus:outline-none">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border cursor-pointer hover:opacity-80 transition-opacity ${statusStyles[(item.calculatedStatus || 'Unpaid') as keyof typeof statusStyles]
                                    }`}
                                >
                                  {item.calculatedStatus || 'Unpaid'}
                                </span>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => {
                                  if (item.calculatedStatus !== 'Paid') {
                                    setBillToUpdateStatus({ bill: item, newStatus: 'Paid' });
                                    setIsStatusPinDialogOpen(true);
                                  }
                                }}>
                                  Override to Paid
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  if (item.calculatedStatus !== 'Partial') {
                                    setBillToUpdateStatus({ bill: item, newStatus: 'Partial' });
                                    setIsStatusPinDialogOpen(true);
                                  }
                                }}>
                                  Override to Partial
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  if (item.calculatedStatus !== 'Unpaid') {
                                    setBillToUpdateStatus({ bill: item, newStatus: 'Unpaid' });
                                    setIsStatusPinDialogOpen(true);
                                  }
                                }}>
                                  Override to Unpaid
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
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
                               onClick={() => {
                                  if (item.status === 'Draft' || item.calculatedStatus === 'Draft') {
                                    handleEditClick(item);
                                  } else {
                                    setBillToEdit(item);
                                    setIsEditPinDialogOpen(true);
                                  }
                                }}
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
                                  if (item.status === 'Draft' || item.calculatedStatus === 'Draft') {
                                    setBillToDelete(item);
                                    handleDeleteBill();
                                  } else {
                                    setBillToDelete(item);
                                    setIsPinDialogOpen(true);
                                  }
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
                </div>
              )}

              {/* Pagination Controls */}
              {totalPages > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
                  <p className="text-sm text-muted-foreground w-full text-center sm:text-left">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredBills.length)} of {filteredBills.length} entries
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

              {/* Filtering Summary / Totals */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-8">
                <div className="bg-muted/30 p-4 rounded-2xl border border-border/50 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Filtered Billed</p>
                    <p className="text-xl font-black text-foreground font-mono">{tableTotals.billed.toLocaleString()}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-primary" />
                  </div>
                </div>
                <div className="bg-muted/30 p-4 rounded-2xl border border-border/50 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Filtered Collected</p>
                    <p className="text-xl font-black text-green-600 dark:text-green-400 font-mono">{tableTotals.paid.toLocaleString()}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <div className="bg-muted/30 p-4 rounded-2xl border border-border/50 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Pending Balance</p>
                    <p className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono">{tableTotals.balance.toLocaleString()}</p>
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

                  {/* Attachment Links Section */}
                  {selectedBill && (
                    <div className="bg-muted/30 p-6 rounded-2xl border border-border/50">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Attached Documents
                      </h3>
                      <div className="flex flex-wrap gap-3">
                        {selectedBill.attachments && selectedBill.attachments.length > 0 ? (
                          selectedBill.attachments.map((url, idx) => (
                            <Button
                              key={idx}
                              variant="outline"
                              className="font-mono text-xs gap-2 bg-white dark:bg-slate-950 border-primary/20 hover:border-primary/40 text-primary hover:bg-primary/5"
                              onClick={() => window.open(url, '_blank')}
                            >
                              <FileText className="w-3.5 h-3.5" />
                              Attachment Number {idx + 1}
                            </Button>
                          ))
                        ) : selectedBill.attachment ? (
                          <Button
                            variant="outline"
                            className="font-mono text-xs gap-2 bg-white dark:bg-slate-950 border-primary/20 hover:border-primary/40 text-primary hover:bg-primary/5"
                            onClick={() => window.open(selectedBill.attachment!, '_blank')}
                          >
                            <FileText className="w-3.5 h-3.5" />
                            Attachment Number 1
                          </Button>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">No documents attached.</p>
                        )}
                      </div>
                    </div>
                  )}

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
        </div >
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
        )
        }
      </div >

      <PinDialog
        isOpen={isPinDialogOpen}
        onClose={() => {
          setIsPinDialogOpen(false);
          setBillToDelete(null);
        }}
        onConfirm={handleDeleteBill}
        title="Delete Bill"
        description={`This will permanently delete Job No. ${billToDelete?.jobNumber || 'Unknown'}.`}
      />

      <PinDialog
        isOpen={isEditPinDialogOpen}
        onClose={() => {
          setIsEditPinDialogOpen(false);
          setBillToEdit(null);
        }}
        onConfirm={() => {
          if (billToEdit) {
            handleEditClick(billToEdit);
          }
          setIsEditPinDialogOpen(false);
          setBillToEdit(null);
        }}
        title="Edit Bill"
        description={`Authorize edit action for Job No. ${billToEdit?.jobNumber || 'Unknown'}.`}
      />

      <PinDialog
        isOpen={isStatusPinDialogOpen}
        onClose={() => {
          setIsStatusPinDialogOpen(false);
          setBillToUpdateStatus(null);
        }}
        onConfirm={handleUpdateStatus}
        title="Update Bill Status"
        description={`Authorize manual status change to '${billToUpdateStatus?.newStatus}' for Job No. ${billToUpdateStatus?.bill.jobNumber || 'Unknown'}.`}
      />
    </>
  );
}