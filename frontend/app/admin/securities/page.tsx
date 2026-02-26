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
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import {
    CheckCircle2,
    Clock,
    ArrowRight,
    ClipboardList,
    Shield,
    Users,
    FileText,
    Eye,
    ShieldCheck,
    Search,
    Plus,
    Ship,
    Anchor,
    Calendar,
    User
} from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { useData, SecurityTracking } from '@/context/data-context';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatCurrency } from '@/lib/utils';
import { CompanySelect } from '@/components/company-select';
import { PinDialog } from '@/components/pin-dialog';
import Swal from 'sweetalert2';


const calculateRefundDueDate = (startDate: string, days: number) => {
    if (!startDate) return '';
    const date = new Date(startDate);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
};

export default function SecuritiesPage() {
    const { securities, companies, bills, addSecurity, updateSecurity } = useData();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [selectedSecurity, setSelectedSecurity] = useState<SecurityTracking | null>(null);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'received'>('all');

    // PIN Dialog State
    const [isPinDialogOpen, setIsPinDialogOpen] = useState(false);
    const [pinActionSecurity, setPinActionSecurity] = useState<SecurityTracking | null>(null);

    const handleConfirmPinAction = async () => {
        if (pinActionSecurity) {
            try {
                const result = await updateSecurity(pinActionSecurity.id, { isRefundReceived: true, status: 'Completed' });
                Swal.fire({
                    title: 'Success!',
                    text: 'Security refund marked as received.',
                    icon: 'success',
                    confirmButtonColor: '#10b981',
                    timer: 2000,
                    showConfirmButton: false
                });
            } catch (err) {
                console.error("Failed to update security:", err);
                Swal.fire({
                    title: 'Error',
                    text: 'Failed to update security record.',
                    icon: 'error',
                    confirmButtonColor: '#3b82f6'
                });
            } finally {
                setIsPinDialogOpen(false);
                setPinActionSecurity(null);
            }
        }
    };

    // Form State
    const [companyId, setCompanyId] = useState('');
    const [gdNumber, setGdNumber] = useState('');
    const [noOfContainers, setNoOfContainers] = useState('1');
    const [containerNo, setContainerNo] = useState('');
    const [amountPerContainer, setAmountPerContainer] = useState('');
    const [refundDays, setRefundDays] = useState('7');
    const [port, setPort] = useState('');
    const [isDocumentSubmitted, setIsDocumentSubmitted] = useState(false);
    const [refundDueDate, setRefundDueDate] = useState('');
    const [isRefundReceived, setIsRefundReceived] = useState(false);
    const [receivedAmountDate, setReceivedAmountDate] = useState('');
    const [payOrderNo, setPayOrderNo] = useState('');
    const [receiverName, setReceiverName] = useState('');
    const [receiverContact, setReceiverContact] = useState('');

    // Fix Hydration Error: Set default dates on client-side only
    useEffect(() => {
        setRefundDueDate(new Date().toISOString().split('T')[0]);
    }, []);

    const filteredSecurities = securities.filter(s => {
        const matchesSearch = s.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.gdNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.containerNo.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' ? true :
            statusFilter === 'pending' ? !s.isRefundReceived :
                s.isRefundReceived;

        return matchesSearch && matchesStatus;
    });

    const handleSubmit = async () => {
        setLoading(true);
        try {
            if (!companyId || !gdNumber || !noOfContainers || !amountPerContainer || !refundDays) {
                Swal.fire({
                    title: 'Missing Fields',
                    text: 'Please fill in all required fields',
                    icon: 'warning',
                    confirmButtonColor: '#3b82f6'
                });
                return;
            }

            const totalAmount = Number(noOfContainers) * Number(amountPerContainer);
            // Fix: Convert IDs to strings for comparison to avoid type mismatches
            const companyName = companies.find((c) => String(c.id) === String(companyId))?.name || 'Unknown';

            // Ensure empty strings are converted to null/undefined or proper format for backend
            const payload = {
                companyId,
                companyName,
                gdNumber,
                noOfContainers: Number(noOfContainers),
                containerNo,
                amountPerContainer: Number(amountPerContainer),
                totalAmount,
                refundDays: Number(refundDays),
                port,
                isDocumentSubmitted: false,
                // Use the state value for refundDueDate, or calculate it if needed. 
                // Any calculation using new Date() inside render/submit is fine, just not in initial state.
                refundDueDate: refundDueDate || calculateRefundDueDate(new Date().toISOString(), Number(refundDays)),
                isRefundReceived: false,
                payOrderNo: payOrderNo || null,
                receiverName: receiverName || null,
                receiverContact: receiverContact || null,
                status: 'Pending',
                receivedAmountDate: null,
            };

            console.log('Submitting Security Payload:', payload);

            const result = await addSecurity(payload);

            if (result && result.ok) {
                setIsDialogOpen(false);
                // Reset form
                setCompanyId('');
                setGdNumber('');
                setNoOfContainers('1'); // Reset to default '1'
                setContainerNo('');
                setAmountPerContainer('');
                setRefundDays('7'); // Reset to default '7'
                setPort('');
                setIsDocumentSubmitted(false);
                setRefundDueDate(new Date().toISOString().split('T')[0]);
                setIsRefundReceived(false);
                setReceivedAmountDate('');
                setPayOrderNo('');
                setReceiverName('');
                setReceiverContact('');
            } else {
                console.error('Security Save Failed:', result);
                Swal.fire({
                    title: 'Error',
                    text: `Failed to save security record: ${result?.message || 'Unknown error'}`,
                    icon: 'error',
                    confirmButtonColor: '#3b82f6'
                });
            }
        } catch (error) {
            console.error('Security Save Exception:', error);
            Swal.fire({
                title: 'Error',
                text: 'An unexpected error occurred while saving.',
                icon: 'error',
                confirmButtonColor: '#3b82f6'
            });
        } finally {
            setLoading(false);
        }
    };

    const totalAmountCalculated = Number(noOfContainers) * Number(amountPerContainer);

    return (
        <DashboardLayout role="admin">
            <div className="space-y-6 max-w-[1600px] mx-auto">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                            <ShieldCheck className="w-8 h-8 text-primary" />
                            Securities Tracking
                        </h1>
                        <p className="text-muted-foreground mt-1 font-medium">Manage and track container refund securities</p>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
                        <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)} className="w-full md:w-auto">
                            <TabsList className="grid w-full grid-cols-3 h-10 bg-muted/50">
                                <TabsTrigger value="all" className="text-xs font-bold uppercase">All</TabsTrigger>
                                <TabsTrigger value="pending" className="text-xs font-bold uppercase">Pending</TabsTrigger>
                                <TabsTrigger value="received" className="text-xs font-bold uppercase">Received</TabsTrigger>
                            </TabsList>
                        </Tabs>

                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search GD, Company..."
                                className="pl-9 bg-white/50 border-border/40 focus:bg-white transition-all rounded-xl"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="rounded-xl px-6 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95 flex gap-2">
                                    <Plus className="w-4 h-4" />
                                    Record New Security
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border-none shadow-2xl p-0">
                                <DialogHeader className="p-8 pb-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
                                    <DialogTitle className="text-2xl font-black flex items-center gap-3 text-primary">
                                        <ShieldCheck className="w-7 h-7" />
                                        Record Security Tracking
                                    </DialogTitle>
                                </DialogHeader>

                                <div className="p-8 pt-4 space-y-8">
                                    {/* Section 1: Company & Logistics */}
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-primary/60 flex items-center gap-2">
                                            <Ship className="w-4 h-4" />
                                            Company & Logistics
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-white/5 p-6 rounded-2xl border border-border/50">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Select Company</Label>
                                                <CompanySelect
                                                    companies={companies}
                                                    value={companyId}
                                                    onValueChange={setCompanyId}
                                                    className="h-11"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">GD Number</Label>
                                                <Input
                                                    placeholder="Example: KPAF-HC-123"
                                                    className="h-11 bg-white dark:bg-slate-950 border-border/40 rounded-xl font-mono"
                                                    value={gdNumber}
                                                    onChange={(e) => setGdNumber(e.target.value)}
                                                    list="gd-numbers"
                                                />
                                                <datalist id="gd-numbers">
                                                    {Array.from(new Set(bills.filter(b => b.companyId === companyId && b.gdNumber).map(b => b.gdNumber))).map((gd, idx) => (
                                                        <option key={idx} value={gd} />
                                                    ))}
                                                </datalist>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section 2: Container Details */}
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-primary/60 flex items-center gap-2">
                                            <Anchor className="w-4 h-4" />
                                            Container Details
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 dark:bg-white/5 p-6 rounded-2xl border border-border/50">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">No of Containers</Label>
                                                <Input
                                                    type="number"
                                                    placeholder="Example: 1"
                                                    className="h-11 bg-white dark:bg-slate-950 border-border/40 rounded-xl font-mono"
                                                    value={noOfContainers}
                                                    onChange={(e) => setNoOfContainers(e.target.value)}
                                                    onWheel={(e) => e.currentTarget.blur()}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Container NO(s)</Label>
                                                <Input
                                                    placeholder="Example: MSCU1234567..."
                                                    className="h-11 bg-white dark:bg-slate-950 border-border/40 rounded-xl font-mono"
                                                    value={containerNo}
                                                    onChange={(e) => setContainerNo(e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Amount per Container</Label>
                                                <Input
                                                    type="number"
                                                    placeholder="Example: 50000"
                                                    className="h-11 bg-white dark:bg-slate-950 border-border/40 rounded-xl font-mono"
                                                    value={amountPerContainer}
                                                    onChange={(e) => setAmountPerContainer(e.target.value)}
                                                    onWheel={(e) => e.currentTarget.blur()}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Port</Label>
                                                <Input
                                                    placeholder="Example: KIQT, SAPT, etc."
                                                    className="h-11 bg-white dark:bg-slate-950 border-border/40 rounded-xl font-mono"
                                                    value={port}
                                                    onChange={(e) => setPort(e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Receiver Person Name</Label>
                                                <Input
                                                    placeholder="Example: Hamza Akram"
                                                    className="h-11 bg-white dark:bg-slate-950 border-border/40 rounded-xl font-mono"
                                                    value={receiverName}
                                                    onChange={(e) => setReceiverName(e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Receiver Person Contact</Label>
                                                <Input
                                                    placeholder="Example: 0300-1234567"
                                                    className="h-11 bg-white dark:bg-slate-950 border-border/40 rounded-xl font-mono"
                                                    value={receiverContact}
                                                    onChange={(e) => setReceiverContact(e.target.value)}
                                                />
                                            </div>
                                            <div className="md:col-span-3 flex items-center justify-end px-6 rounded-xl bg-primary/5 border border-primary/10">
                                                <div className="text-right">
                                                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Total Security Amount</p>
                                                    <p className="text-xl font-black text-primary font-mono leading-none">{formatCurrency(totalAmountCalculated)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section 3: Refund Timeline */}
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-primary/60 flex items-center gap-2">
                                            <Clock className="w-4 h-4" />
                                            Refund Timeline
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-white/5 p-6 rounded-2xl border border-border/50">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Refund Days (Standard 7)</Label>
                                                <Input
                                                    type="number"
                                                    placeholder="Example: 7"
                                                    className="h-11 bg-white dark:bg-slate-950 border-border/40 rounded-xl font-mono"
                                                    value={refundDays}
                                                    onChange={(e) => setRefundDays(e.target.value)}
                                                    onWheel={(e) => e.currentTarget.blur()}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Date of Refund Security (Due Date)</Label>
                                                <Input
                                                    type="date"
                                                    className="h-11 bg-white dark:bg-slate-950 border-border/40 rounded-xl font-mono"
                                                    value={refundDueDate}
                                                    onChange={(e) => setRefundDueDate(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section 4: Status & Receipts */}
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-primary/60 flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4" />
                                            Status & Receipts
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-white/5 p-6 rounded-2xl border border-border/50">
                                            <div className="flex items-center space-x-3 p-3 rounded-xl bg-white dark:bg-slate-950 border border-border/40">
                                                <Checkbox
                                                    id="docSubmitted"
                                                    checked={isDocumentSubmitted}
                                                    onCheckedChange={(checked) => setIsDocumentSubmitted(!!checked)}
                                                />
                                                <Label htmlFor="docSubmitted" className="text-sm font-bold cursor-pointer">Document Submitted</Label>
                                            </div>
                                            <div className="flex items-center space-x-3 p-3 rounded-xl bg-white dark:bg-slate-950 border border-border/40">
                                                <Checkbox
                                                    id="refundReceived"
                                                    checked={isRefundReceived}
                                                    onCheckedChange={(checked) => setIsRefundReceived(!!checked)}
                                                />
                                                <Label htmlFor="refundReceived" className="text-sm font-bold cursor-pointer">Refund Received</Label>
                                            </div>

                                            {isRefundReceived && (
                                                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-2">
                                                    <div className="space-y-2">
                                                        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Date of received Amount</Label>
                                                        <Input
                                                            type="date"
                                                            className="h-11 bg-white dark:bg-slate-950 border-border/40 rounded-xl font-mono"
                                                            value={receivedAmountDate}
                                                            onChange={(e) => setReceivedAmountDate(e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">PayOrder / Cheque No</Label>
                                                        <Input
                                                            placeholder="Example: 12345678"
                                                            className="h-11 bg-white dark:bg-slate-950 border-border/40 rounded-xl font-mono"
                                                            value={payOrderNo}
                                                            onChange={(e) => setPayOrderNo(e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
                                        <Button
                                            variant="ghost"
                                            className="px-8 h-12 rounded-2xl font-bold text-muted-foreground hover:bg-muted/50 transition-all"
                                            onClick={() => setIsDialogOpen(false)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            className="px-10 h-12 rounded-2xl font-black bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all active:scale-95 text-base"
                                            onClick={handleSubmit}
                                            disabled={loading || !companyId || !gdNumber || !noOfContainers || !amountPerContainer || !refundDays}
                                        >
                                            {loading ? "Saving..." : "Save Security Record"}
                                        </Button>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* Main Table Section */}
                <Card className="rounded-[2rem] border-none shadow-2xl shadow-slate-200/50 dark:shadow-none bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl overflow-hidden leading-relaxed">
                    <CardHeader className="px-8 pt-8 pb-4">
                        <CardTitle className="text-xl font-black flex items-center gap-3">
                            Active Security Records
                            <Badge variant="outline" className="rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-widest bg-primary/5 text-primary border-primary/20">
                                {filteredSecurities.length} Records
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent border-border/40 bg-slate-50/50 dark:bg-white/5">
                                        <TableHead className="w-[200px] pl-8 font-black uppercase tracking-widest text-[10px] text-muted-foreground/70">Company</TableHead>
                                        <TableHead className="font-black uppercase tracking-widest text-[10px] text-muted-foreground/70">GD No & Port</TableHead>
                                        <TableHead className="font-black uppercase tracking-widest text-[10px] text-muted-foreground/70 text-center">Containers</TableHead>
                                        <TableHead className="font-black uppercase tracking-widest text-[10px] text-muted-foreground/70 text-right">Amount (PKR)</TableHead>
                                        <TableHead className="font-black uppercase tracking-widest text-[10px] text-muted-foreground/70">Refund Due</TableHead>
                                        <TableHead className="font-black uppercase tracking-widest text-[10px] text-muted-foreground/70">Receiver</TableHead>
                                        <TableHead className="font-black uppercase tracking-widest text-[10px] text-muted-foreground/70">Status</TableHead>
                                        <TableHead className="w-[100px] pr-8 text-right font-black uppercase tracking-widest text-[10px] text-muted-foreground/70">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredSecurities.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="h-40 text-center text-muted-foreground pr-8 pl-8">
                                                <div className="flex flex-col items-center gap-2 opacity-50">
                                                    <ShieldCheck className="w-12 h-12" />
                                                    <p className="font-medium">No security records found</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredSecurities.map((security) => (
                                            <TableRow key={security.id} className="group hover:bg-slate-50/80 dark:hover:bg-white/5 border-border/30 transition-colors">
                                                <TableCell className="pl-8 font-bold text-slate-900 dark:text-slate-100">{security.companyName}</TableCell>
                                                <TableCell>
                                                    <div className="space-y-1">
                                                        <p className="font-mono text-xs font-black text-slate-700 dark:text-slate-300">{security.gdNumber}</p>
                                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                                            <Anchor className="w-3 h-3" />
                                                            {security.port}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div className="space-y-1">
                                                        <Badge variant="secondary" className="rounded-md font-mono font-black text-primary bg-primary/5 border-primary/10">
                                                            {security.noOfContainers} X
                                                        </Badge>
                                                        <p className="text-[10px] font-medium text-muted-foreground truncate max-w-[120px] mx-auto opacity-60 group-hover:opacity-100 transition-opacity">
                                                            {security.containerNo}
                                                        </p>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="space-y-0.5">
                                                        <p className="font-mono font-black text-slate-900 dark:text-white">{formatCurrency(security.noOfContainers * security.amountPerContainer)}</p>
                                                        <p className="text-[10px] font-bold text-muted-foreground opacity-60">
                                                            {formatCurrency(security.amountPerContainer)} / container
                                                        </p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
                                                        <Calendar className="w-3.5 h-3.5 opacity-60" />
                                                        {formatDate(security.refundDueDate)}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
                                                        <User className="w-3.5 h-3.5 opacity-60 text-primary" />
                                                        {security.receiverName || 'N/A'}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={`rounded-lg px-3 py-1 font-black uppercase tracking-widest text-[9px] border shadow-sm ${security.isRefundReceived
                                                        ? 'bg-green-100 text-green-800 border-green-200'
                                                        : 'bg-orange-100 text-orange-800 border-orange-200'
                                                        }`}>
                                                        {security.isRefundReceived ? 'Received' : 'Pending Refund'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="pr-8 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-9 w-9 rounded-xl text-muted-foreground hover:bg-white hover:text-primary hover:shadow-md transition-all active:scale-95"
                                                            onClick={async () => {
                                                                const confirmResult = await Swal.fire({
                                                                    title: 'Mark as Received?',
                                                                    text: "Are you sure you want to mark this refund as received?",
                                                                    icon: 'warning',
                                                                    showCancelButton: true,
                                                                    confirmButtonColor: '#10b981',
                                                                    cancelButtonColor: '#ef4444',
                                                                    confirmButtonText: 'Yes, mark it!'
                                                                });

                                                                if (confirmResult.isConfirmed) {
                                                                    setPinActionSecurity(security);
                                                                    setIsPinDialogOpen(true);
                                                                }
                                                            }}
                                                            disabled={security.isRefundReceived}
                                                            title="Mark as Received"
                                                        >
                                                            <CheckCircle2 className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-9 w-9 rounded-xl text-muted-foreground hover:bg-white hover:text-primary hover:shadow-md transition-all active:scale-95"
                                                            onClick={() => {
                                                                setSelectedSecurity(security);
                                                                setIsViewDialogOpen(true);
                                                            }}
                                                            title="View Details"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Totaling Section */}
                {securities.length > 0 && (
                    <Card className="rounded-[2rem] border-none shadow-2xl shadow-slate-200/50 dark:shadow-none bg-gradient-to-br from-white/90 to-primary/5 dark:from-slate-900/90 dark:to-primary/10 backdrop-blur-xl overflow-hidden">
                        <CardHeader className="px-8 pt-6 pb-4">
                            <CardTitle className="text-lg font-black flex items-center gap-2 text-primary">
                                <ClipboardList className="w-5 h-5" />
                                Financial Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-8 pb-8">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="flex items-center justify-between p-5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-border/30 shadow-md hover:shadow-lg transition-all">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Total Pending</p>
                                        <p className="text-2xl font-black text-amber-600 font-mono">
                                            {formatCurrency(securities.filter(s => !s.isRefundReceived).reduce((sum, s) => sum + (s.noOfContainers * s.amountPerContainer), 0))}
                                        </p>
                                        <p className="text-xs font-bold text-amber-600/60 mt-1">
                                            {securities.filter(s => !s.isRefundReceived).length} pending records
                                        </p>
                                    </div>
                                    <Clock className="w-10 h-10 text-amber-500/30" />
                                </div>
                                <div className="flex items-center justify-between p-5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-border/30 shadow-md hover:shadow-lg transition-all">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Total Received</p>
                                        <p className="text-2xl font-black text-emerald-600 font-mono">
                                            {formatCurrency(securities.filter(s => s.isRefundReceived).reduce((sum, s) => sum + (s.noOfContainers * s.amountPerContainer), 0))}
                                        </p>
                                        <p className="text-xs font-bold text-emerald-600/60 mt-1">
                                            {securities.filter(s => s.isRefundReceived).length} received records
                                        </p>
                                    </div>
                                    <CheckCircle2 className="w-10 h-10 text-emerald-500/30" />
                                </div>
                                <div className="flex items-center justify-between p-5 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/30 shadow-md hover:shadow-xl transition-all">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-wider text-primary/70 mb-2">Grand Total</p>
                                        <p className="text-2xl font-black text-primary font-mono">
                                            {formatCurrency(securities.reduce((sum, s) => sum + (s.noOfContainers * s.amountPerContainer), 0))}
                                        </p>
                                        <p className="text-xs font-bold text-primary/60 mt-1">
                                            {securities.length} total records
                                        </p>
                                    </div>
                                    <Shield className="w-10 h-10 text-primary/30" />
                                </div>
                            </div>
                            <div className="mt-6 pt-4 border-t border-border/30 flex justify-between items-center text-sm">
                                <span className="text-muted-foreground font-semibold">
                                    Displaying {filteredSecurities.length} of {securities.length} securities
                                </span>
                                <span className="text-muted-foreground font-semibold">
                                    {securities.filter(s => !s.isRefundReceived).length} Pending • {securities.filter(s => s.isRefundReceived).length} Received
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Security View Dialog */}
            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3 text-2xl">
                            <Shield className="w-6 h-6 text-primary" />
                            Security Details - {selectedSecurity?.gdNumber}
                        </DialogTitle>
                    </DialogHeader>
                    {selectedSecurity && (
                        <div className="space-y-6 pt-4">
                            {/* Company & Basic Info */}
                            <div className="bg-muted/30 p-5 rounded-xl border border-border/50">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                                    <Users className="w-4 h-4" /> Company Information
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-muted-foreground font-semibold mb-1">Company Name</p>
                                        <p className="font-bold text-foreground">{selectedSecurity.companyName}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground font-semibold mb-1">GD Number</p>
                                        <p className="font-mono font-bold text-foreground">{selectedSecurity.gdNumber}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Container Details */}
                            <div className="bg-muted/30 p-5 rounded-xl border border-border/50">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                                    <FileText className="w-4 h-4" /> Container & Amount Details
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-muted-foreground font-semibold mb-1">Number of Containers</p>
                                        <p className="font-bold text-foreground">{selectedSecurity.noOfContainers}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground font-semibold mb-1">Container Number</p>
                                        <p className="font-mono font-bold text-foreground">{selectedSecurity.containerNo}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground font-semibold mb-1">Amount Per Container</p>
                                        <p className="font-mono font-bold text-foreground">{formatCurrency(selectedSecurity.amountPerContainer)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground font-semibold mb-1">Total Amount</p>
                                        <p className="font-mono font-black text-primary text-lg">
                                            {formatCurrency(selectedSecurity.noOfContainers * selectedSecurity.amountPerContainer)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Port & Refund Details */}
                            <div className="bg-muted/30 p-5 rounded-xl border border-border/50">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                                    <Clock className="w-4 h-4" /> Port & Refund Information
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-muted-foreground font-semibold mb-1">Port</p>
                                        <p className="font-bold text-foreground uppercase">{selectedSecurity.port}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground font-semibold mb-1">Refund Days</p>
                                        <p className="font-bold text-foreground">{selectedSecurity.refundDays} days</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground font-semibold mb-1">Refund Due Date</p>
                                        <p className="font-mono font-bold text-foreground">{formatDate(selectedSecurity.refundDueDate)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground font-semibold mb-1">Pay Order Number</p>
                                        <p className="font-mono font-bold text-foreground">{selectedSecurity.payOrderNo}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Status Information */}
                            <div className="bg-muted/30 p-5 rounded-xl border border-border/50">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4" /> Status & Tracking
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-muted-foreground font-semibold mb-1">Receiver Name</p>
                                        <p className="font-bold text-foreground">{selectedSecurity.receiverName || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground font-semibold mb-1">Receiver Contact</p>
                                        <p className="font-bold text-foreground">{selectedSecurity.receiverContact || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground font-semibold mb-1">Document Submitted</p>
                                        <div className="inline-flex items-center gap-1.5">
                                            {selectedSecurity.isDocumentSubmitted ? (
                                                <>
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                                    <span className="font-bold text-emerald-600">Received</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Clock className="w-4 h-4 text-amber-600" />
                                                    <span className="font-bold text-amber-600">Not Received</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground font-semibold mb-1">Refund Received</p>
                                        <div className="inline-flex items-center gap-1.5">
                                            {selectedSecurity.isRefundReceived ? (
                                                <>
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                                    <span className="font-bold text-emerald-600">Yes</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Clock className="w-4 h-4 text-amber-600" />
                                                    <span className="font-bold text-amber-600">Pending</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    {selectedSecurity.receivedAmountDate && (
                                        <div>
                                            <p className="text-xs text-muted-foreground font-semibold mb-1">Received Date</p>
                                            <p className="font-mono font-bold text-foreground">{formatDate(selectedSecurity.receivedAmountDate)}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <PinDialog
                isOpen={isPinDialogOpen}
                onClose={() => {
                    setIsPinDialogOpen(false);
                    setPinActionSecurity(null);
                }}
                onConfirm={handleConfirmPinAction}
                actionTitle="Mark Security as Received"
                description={`This will mark the security refund for GD No. ${pinActionSecurity?.gdNumber} as received.`}
            />
        </DashboardLayout>
    );
}
