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
  AlertCircle
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { useData, BillItem } from '@/context/data-context';

const statusStyles = {
  Paid: 'bg-green-100 text-green-800 border-green-200',
  Partial: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  Unpaid: 'bg-red-100 text-red-800 border-red-200',
};

export default function BillsPage() {
  const { bills, companies, addBill } = useData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const BILL_ITEMS = [
    "DUTY TAXES & ETO",
    "CIVIL AVIATION AUTHORITY",
    "GERRYS' DANATA PVT LTD",
    "SHAHEEN CARGO AFU",
    "MENZIES - RAS PVT LTD",
    "DHL PAKISTAN PVT LTD",
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
    "EXCISE",
    "Others"
  ];

  // Form State
  const [companyId, setCompanyId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [exporter, setExporter] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [beNumber, setBeNumber] = useState('');
  const [hawb, setHawb] = useState('');
  const [igm, setIgm] = useState('');
  const [index, setIndex] = useState('');
  const [gdNumber, setGdNumber] = useState('');
  const [noOfContainers, setNoOfContainers] = useState('');
  const [containerNo, setContainerNo] = useState('');
  const [packages, setPackages] = useState('');
  const [jobNumber, setJobNumber] = useState('');
  const [via, setVia] = useState('');
  const [weight, setWeight] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [items, setItems] = useState<Omit<BillItem, 'id'>[]>([
    { description: 'DUTY TAXES & ETO', notes: '', amount: 0, invoiceNo: '' },
    { description: 'CIVIL AVIATION AUTHORITY', notes: '', amount: 0, invoiceNo: '' },
    { description: "GERRYS' DANATA PVT LTD", notes: '', amount: 0, invoiceNo: '' },
  ]);
  const [serviceCharges, setServiceCharges] = useState<string>('');
  const [salesTax, setSalesTax] = useState<string>('');
  const [advancePayment, setAdvancePayment] = useState<string>('');

  const totalAmount = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const grandTotal = totalAmount + (Number(serviceCharges) || 0) + (Number(salesTax) || 0) - (Number(advancePayment) || 0);

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

  const handleSubmit = () => {
    if (!companyId || !date || !jobNumber) {
      alert("Please fill all required fields");
      return;
    }

    const selectedCompany = companies.find(c => c.id === companyId);
    if (!selectedCompany) return;

    // Generate valid bill items with IDs
    const finalItems: BillItem[] = items.map((item, idx) => ({
      ...item,
      id: `item-${Date.now()}-${idx}`,
      amount: Number(item.amount)
    })).filter(i => i.description && i.amount > 0);

    if (finalItems.length === 0) {
      alert("Please add at least one valid item");
      return;
    }

    addBill({
      billNo: `BILL-${String(bills.length + 1).padStart(3, '0')}`,
      companyId: selectedCompany.id,
      companyName: selectedCompany.name,
      date,
      invoiceNo,
      invoiceDate,
      beNumber,
      hawb,
      igm,
      index,
      gdNumber,
      noOfContainers,
      containerNo,
      packages,
      jobNumber,
      via,
      weight,
      attachment: attachment ? URL.createObjectURL(attachment) : undefined,
      items: finalItems,
      totalAmount: totalAmount,
      serviceCharges: Number(serviceCharges) || 0,
      salesTax: Number(salesTax) || 0,
      advancePayment: Number(advancePayment) || 0,
      grandTotal: grandTotal,
    });

    setIsDialogOpen(false);
    // Reset Form
    setCompanyId('');
    setJobNumber('');
    setVia('');
    setWeight('');
    setExporter('');
    setInvoiceNo('');
    setInvoiceDate(new Date().toISOString().split('T')[0]);
    setBeNumber('');
    setHawb('');
    setIgm('');
    setIndex('');
    setGdNumber('');
    setServiceCharges('');
    setSalesTax('');
    setAdvancePayment('');
    setNoOfContainers('');
    setContainerNo('');
    setPackages('');
    setAttachment(null);
    setItems([
      { description: 'DUTY TAXES & ETO', notes: '', amount: 0, invoiceNo: '' },
      { description: 'CIVIL AVIATION AUTHORITY', notes: '', amount: 0, invoiceNo: '' },
      { description: "GERRYS' DANATA PVT LTD", notes: '', amount: 0, invoiceNo: '' },
    ]);
  };

  // Sort bills by date desc
  const sortedBills = useMemo(() => {
    return [...bills].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [bills]);

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Bills & Invoices</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage invoices for your clients.
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 shadow-md hover:bg-primary/90">
                <Plus className="w-4 h-4" />
                Create New Bill
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Bill</DialogTitle>
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
                        <Select onValueChange={setCompanyId} value={companyId}>
                          <SelectTrigger className="bg-white dark:bg-slate-950 border-border/50 focus:ring-primary/20 transition-all h-10">
                            <SelectValue placeholder="Select Client" />
                          </SelectTrigger>
                          <SelectContent>
                            {companies.map(c => (
                              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                              <SelectItem value="LAND">
                                <div className="flex items-center gap-2"><Truck className="w-3.5 h-3.5" /> LAND</div>
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
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">IGM (Inside)</Label>
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
                            value={index}
                            onChange={(e) => setIndex(e.target.value)}
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
                        <div>
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Arrival Date</Label>
                          <Input
                            type="date"
                            className="bg-white dark:bg-slate-950 border-border/50 h-10"
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
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">BE No# (Customs Reference)</Label>
                          <Input
                            placeholder="Example: KPAF-HC-123"
                            className="bg-white dark:bg-slate-950 border-border/50 h-10 font-mono text-xs"
                            value={beNumber}
                            onChange={(e) => setBeNumber(e.target.value)}
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
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleAddItem}
                        className="gap-2 border-primary/20 hover:bg-primary/5 hover:border-primary/40 transition-all rounded-full px-4"
                      >
                        <Plus className="w-3.5 h-3.5 text-primary" />
                        <span className="text-xs font-bold text-primary">Add Service</span>
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {items.map((item, idx) => (
                        <div key={idx} className="group relative space-y-4 p-5 border rounded-2xl bg-white dark:bg-slate-950 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300">
                          <div className="flex flex-col md:flex-row gap-4 items-end">
                            {/* Service Selection */}
                            <div className="flex-1 min-w-[200px] space-y-2">
                              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Service / Item</Label>
                              <Select
                                value={BILL_ITEMS.includes(item.description) ? item.description : 'Others'}
                                onValueChange={(value) => handleItemChange(idx, 'description', value)}
                              >
                                <SelectTrigger className="h-10 bg-muted/20 border-border/30">
                                  <SelectValue placeholder="Select Item" />
                                </SelectTrigger>
                                <SelectContent>
                                  {BILL_ITEMS.map((option) => (
                                    <SelectItem key={option} value={option}>{option}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>

                              {(item.description === 'Others' || !BILL_ITEMS.includes(item.description)) && (
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
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-950 rounded-2xl p-6 border border-border/50 shadow-lg relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110" />
                      <div className="space-y-3 relative">
                        <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                          <span>Subtotal Items</span>
                          <span className="font-mono">PKR {totalAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                          <span>Service Charges</span>
                          <span className="font-mono">PKR {(Number(serviceCharges) || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs font-semibold text-primary uppercase tracking-widest">
                          <span>SBR Sales Tax (15%)</span>
                          <span className="font-mono">PKR {(Number(salesTax) || 0).toLocaleString()}</span>
                        </div>
                        {Number(advancePayment) > 0 && (
                          <div className="flex justify-between items-center text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-widest">
                            <span>Advance Payment</span>
                            <span className="font-mono">- PKR {(Number(advancePayment) || 0).toLocaleString()}</span>
                          </div>
                        )}
                        <div className="h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
                        <div className="flex justify-between items-end">
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Grand Total Payable</p>
                            <p className="text-2xl font-black text-primary font-mono tracking-tighter">
                              <span className="text-xs font-bold mr-1 tracking-normal">PKR</span>
                              {grandTotal.toLocaleString()}
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
                        <p className="text-xs text-muted-foreground mt-1">Upload PDF or high-resolution images</p>
                      </div>
                      <div className="relative w-full max-w-xs mt-2">
                        <Input
                          type="file"
                          className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                          accept=".pdf,image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) setAttachment(file);
                          }}
                        />
                        <div className="flex items-center justify-center gap-2 px-6 py-2.5 border-2 rounded-xl bg-white dark:bg-slate-950 text-sm font-medium text-foreground/80 shadow-sm border-border/50">
                          {attachment ? (
                            <span className="truncate flex items-center gap-2">
                              <FileText className="w-4 h-4 text-primary" />
                              {attachment.name}
                            </span>
                          ) : (
                            "Select Files"
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-6">
                    <Button
                      className="flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20 rounded-xl transition-all active:scale-[0.98]"
                      onClick={handleSubmit}
                    >
                      Generate Invoice
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

        <Card className="shadow-md border-border/50">
          <CardHeader>
            <CardTitle>All Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            {sortedBills.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                No bills found. Create one to get started.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/50">
                      <TableHead>Bill No</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Job No</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedBills.map((bill) => (
                      <TableRow key={bill.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="font-mono text-sm font-medium">
                          {bill.billNo}
                        </TableCell>
                        <TableCell>
                          {bill.companyName}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(bill.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground font-mono">
                          {bill.jobNumber}
                        </TableCell>
                        <TableCell className="font-semibold">
                          PKR {bill.totalAmount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          PKR {bill.paidAmount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusStyles[bill.status]
                              }`}
                          >
                            {bill.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon" title="View Details">
                              <Eye className="w-4 h-4 text-muted-foreground hover:text-primary" />
                            </Button>
                            <Button variant="ghost" size="icon" title="Download PDF">
                              <Download className="w-4 h-4 text-muted-foreground hover:text-primary" />
                            </Button>
                          </div>
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
    </DashboardLayout >
  );
}
