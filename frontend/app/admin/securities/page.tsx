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
    User,
    Trash2
} from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { useData, SecurityTracking } from '@/context/data-context';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatCurrency } from '@/lib/utils';
import { CompanySelect } from '@/components/company-select';
import Swal from 'sweetalert2';


const calculateRefundDueDate = (startDate: string, days: number) => {
    if (!startDate) return '';
    const date = new Date(startDate);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
};

export default function SecuritiesPage() {
    const { securities, companies, bills, addSecurity, updateSecurity, deleteSecurity } = useData();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [selectedSecurity, setSelectedSecurity] = useState<SecurityTracking | null>(null);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'received'>('all');

    // Action States
    const [actionSecurity, setActionSecurity] = useState<SecurityTracking | null>(null);
    const [isRefundDetailsOpen, setIsRefundDetailsOpen] = useState(false);
    const [refundDetails, setRefundDetails] = useState({
        payOrderNo: '',
        date: new Date().toISOString().split('T')[0],
        depositBank: '',
        attachment: null as File | null
    });

    const handleConfirmActionDirectly = async (securityToUpdate: SecurityTracking, type: 'documents' | 'refund') => {
        if (type === 'refund') {
            setActionSecurity(securityToUpdate);
            setRefundDetails({
                payOrderNo: securityToUpdate.payOrderNo || '',
                date: new Date().toISOString().split('T')[0],
                depositBank: securityToUpdate.depositBank || '',
                attachment: null
            });
            setIsRefundDetailsOpen(true);
            return;
        }

        try {
            const updateData = { isDocumentSubmitted: true };
            const result = await updateSecurity(securityToUpdate.id, updateData);

            if (result.ok) {
                Swal.fire({
                    title: 'Success!',
                    text: 'Documents marked as Submitted successfully.',
                    icon: 'success',
                    confirmButtonColor: '#10b981',
                    timer: 2000,
                    showConfirmButton: false
                });
            } else {
                throw new Error(result.message || 'Failed to update');
            }
        } catch (err) {
            console.error("Failed to update security:", err);
            Swal.fire({
                title: 'Error',
                text: 'Failed to update security record.',
                icon: 'error',
                confirmButtonColor: '#3b82f6'
            });
        }
    };

    const handleRefundSubmit = async () => {
        if (!actionSecurity) return;

        setLoading(true);
        try {
            const updateObject = {
                isRefundReceived: 1, // Use 1 for boolean in FormData/JSON consistency
                status: 'Completed',
                payOrderNo: refundDetails.payOrderNo,
                receivedAmountDate: refundDetails.date,
                depositBank: refundDetails.depositBank,
                attachment: refundDetails.attachment
            };

            const result = await updateSecurity(actionSecurity.id, updateObject);

            if (result.ok) {
                Swal.fire({
                    title: 'Refund Received!',
                    text: 'Security refund details saved successfully.',
                    icon: 'success',
                    confirmButtonColor: '#10b981',
                    timer: 2000,
                    showConfirmButton: false
                });
                setIsRefundDetailsOpen(false);
                setActionSecurity(null);
            } else {
                throw new Error(result.message || 'Failed to save refund details');
            }
        } catch (err) {
            console.error("Failed to update refund:", err);
            Swal.fire({
                title: 'Error',
                text: 'Failed to save refund details.',
                icon: 'error',
                confirmButtonColor: '#3b82f6'
            });
        } finally {
            setLoading(false);
        }
    };
    
    const handleDeleteSecurity = async (id: string) => {
        const { value: pin } = await Swal.fire({
            title: 'Enter PIN to Delete',
            input: 'password',
            inputLabel: 'Permanent Deletion requires authorization',
            inputPlaceholder: 'Enter PIN code',
            inputAttributes: {
                autocapitalize: 'off',
                autocorrect: 'off'
            },
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Verify & Delete'
        });

        if (pin === '036409') {
            const confirm = await Swal.fire({
                title: 'Are you sure?',
                text: "This security record will be permanently deleted from the database!",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#ef4444',
                cancelButtonColor: '#64748b',
                confirmButtonText: 'Yes, delete it!'
            });

            if (confirm.isConfirmed) {
                try {
                    await deleteSecurity(id);
                    Swal.fire({
                        title: 'Deleted!',
                        text: 'Security record has been removed.',
                        icon: 'success',
                        timer: 2000,
                        showConfirmButton: false
                    });
                } catch (err) {
                    Swal.fire('Error', 'Failed to delete record', 'error');
                }
            }
        } else if (pin) {
            Swal.fire('Invalid PIN', 'The authorization code is incorrect.', 'error');
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
    const [paidBy, setPaidBy] = useState('');
    const [chequeName, setChequeName] = useState('');

    // Fix Hydration Error: Set default dates on client-side only
    useEffect(() => {
        setRefundDueDate(new Date().toISOString().split('T')[0]);
    }, []);

    const filteredSecurities = useMemo(() => {
        return securities
            .filter(s => {
                const matchesSearch = s.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    s.gdNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    s.containerNo.toLowerCase().includes(searchTerm.toLowerCase());

                const matchesStatus = statusFilter === 'all' ? true :
                    statusFilter === 'pending' ? !s.isRefundReceived :
                        s.isRefundReceived;

                return matchesSearch && matchesStatus;
            })
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [securities, searchTerm, statusFilter]);

    // Pagination State & Logic
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter]);

    const paginatedSecurities = useMemo(() => {
        const startIdx = (currentPage - 1) * itemsPerPage;
        return filteredSecurities.slice(startIdx, startIdx + itemsPerPage);
    }, [filteredSecurities, currentPage]);

    const totalPages = Math.ceil(filteredSecurities.length / itemsPerPage);

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
                paidBy: paidBy || null,
                chequeName: chequeName || null,
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
                setPaidBy('');
                setChequeName('');
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
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="w-full lg:w-auto">
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                            <ShieldCheck className="w-8 h-8 text-primary" />
                            Securities Tracking
                        </h1>
                        <p className="text-muted-foreground mt-1 font-medium">Manage and track container refund securities</p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                        <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)} className="w-full sm:w-auto">
                            <TabsList className="grid w-full grid-cols-3 h-10 bg-muted/50">
                                <TabsTrigger value="all" className="text-xs font-bold uppercase">All</TabsTrigger>
                                <TabsTrigger value="pending" className="text-xs font-bold uppercase">Pending</TabsTrigger>
                                <TabsTrigger value="received" className="text-xs font-bold uppercase">Refund Received</TabsTrigger>
                            </TabsList>
                        </Tabs>

                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search GD, Company..."
                                className="pl-9 bg-white/50 border-border/40 focus:bg-white transition-all rounded-xl w-full"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="rounded-xl px-6 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95 flex gap-2 w-full sm:w-auto justify-center">
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
                                                <Label htmlFor="docSubmitted" className="text-sm font-bold cursor-pointer">Documents Submitted</Label>
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
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Section 5: Payment Source Details */}
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-primary/60 flex items-center gap-2">
                                            <FileText className="w-4 h-4" />
                                            Payment Source Details
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-white/5 p-6 rounded-2xl border border-border/50">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Payment Made By</Label>
                                                <div className="relative">
                                                    <Input
                                                        placeholder="Example: Thaheem Brothers, Company, Transporter"
                                                        className="h-11 bg-white dark:bg-slate-950 border-border/40 rounded-xl font-mono"
                                                        value={paidBy}
                                                        onChange={(e) => setPaidBy(e.target.value)}
                                                        list="paid-by-options"
                                                    />
                                                    <datalist id="paid-by-options">
                                                        <option value="Thaheem Brothers" />
                                                        <option value="Company" />
                                                        <option value="Transporter" />
                                                    </datalist>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Cheque Issued To (Name)</Label>
                                                <div className="relative">
                                                    <Input
                                                        placeholder="Example: Company, Admin, Transporter"
                                                        className="h-11 bg-white dark:bg-slate-950 border-border/40 rounded-xl font-mono"
                                                        value={chequeName}
                                                        onChange={(e) => setChequeName(e.target.value)}
                                                        list="cheque-name-options"
                                                    />
                                                    <datalist id="cheque-name-options">
                                                        <option value="Company" />
                                                        <option value="Admin" />
                                                        <option value="Transporter" />
                                                    </datalist>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Pay Order Number</Label>
                                                <Input
                                                    placeholder="Example: PO-12345678"
                                                    className="h-11 bg-white dark:bg-slate-950 border-border/40 rounded-xl font-mono"
                                                    value={payOrderNo}
                                                    onChange={(e) => setPayOrderNo(e.target.value)}
                                                />
                                            </div>
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
                        <div className="overflow-x-auto custom-scrollbar">
                            <div className="min-w-[1000px]">
                                <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent border-border/40 bg-slate-50/50 dark:bg-white/5">
                                        <TableHead className="w-[200px] pl-8 font-black uppercase tracking-widest text-[10px] text-muted-foreground/70">Company</TableHead>
                                        <TableHead className="font-black uppercase tracking-widest text-[10px] text-muted-foreground/70">GD No & Port</TableHead>
                                        <TableHead className="font-black uppercase tracking-widest text-[10px] text-muted-foreground/70 text-center">Containers</TableHead>
                                        <TableHead className="font-black uppercase tracking-widest text-[10px] text-muted-foreground/70 text-right">Amount</TableHead>
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
                                        paginatedSecurities.map((security) => (
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
                                                        : security.isDocumentSubmitted
                                                            ? 'bg-blue-100 text-blue-800 border-blue-200'
                                                            : 'bg-orange-100 text-orange-800 border-orange-200'
                                                        }`}>
                                                        {security.isRefundReceived ? 'Refund Received' : security.isDocumentSubmitted ? 'Documents Submitted' : 'Pending Refund'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="pr-8 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-9 w-9 rounded-xl text-muted-foreground hover:bg-white hover:text-primary hover:shadow-md transition-all active:scale-95"
                                                            onClick={async () => {
                                                                const { value: action } = await Swal.fire({
                                                                    title: 'Update Security Status',
                                                                    text: 'Select the action you want to perform:',
                                                                    icon: 'question',
                                                                    showDenyButton: true,
                                                                    showCancelButton: true,
                                                                    confirmButtonText: 'Documents Submitted',
                                                                    denyButtonText: 'Refund Received',
                                                                    confirmButtonColor: '#3b82f6',
                                                                    denyButtonColor: '#10b981',
                                                                    cancelButtonColor: '#64748b',
                                                                });

                                                                if (action === true) { // Documents Submitted
                                                                    handleConfirmActionDirectly(security, 'documents');
                                                                } else if (action === false) { // Refund Received (Swal Deny returns false)
                                                                    handleConfirmActionDirectly(security, 'refund');
                                                                }
                                                            }}
                                                            disabled={security.isRefundReceived && security.isDocumentSubmitted}
                                                            title="Update Status"
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
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-9 w-9 rounded-xl text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-all active:scale-95"
                                                            onClick={() => handleDeleteSecurity(security.id)}
                                                            title="Delete Security"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                                </Table>
                            </div>
                        </div>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 px-8 mb-4">
                                <p className="text-sm text-muted-foreground w-full text-center sm:text-left">
                                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredSecurities.length)} of {filteredSecurities.length} entries
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
                                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Total Refund Received</p>
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
                                    {securities.filter(s => !s.isRefundReceived).length} Pending • {securities.filter(s => s.isRefundReceived).length} Refund Received
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
                                        <p className="text-xs text-muted-foreground font-semibold mb-1">Check/Payorder No</p>
                                        <p className="font-mono font-bold text-foreground text-primary">{selectedSecurity.payOrderNo || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground font-semibold mb-1">Deposit Bank</p>
                                        <p className="font-bold text-foreground">{selectedSecurity.depositBank || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground font-semibold mb-1">Payment Made By</p>
                                        <p className="font-bold text-foreground">{selectedSecurity.paidBy || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground font-semibold mb-1">Cheque Issued To</p>
                                        <p className="font-bold text-foreground">{selectedSecurity.chequeName || 'N/A'}</p>
                                    </div>
                                    {selectedSecurity.attachment && (
                                        <div className="col-span-2 mt-4 pt-4 border-t border-border/50">
                                            <p className="text-xs text-muted-foreground font-semibold mb-3 flex items-center gap-2">
                                                <ClipboardList className="w-4 h-4" /> Evidence Picture
                                            </p>
                                            <div className="space-y-4">
                                                <div className="relative aspect-video w-full max-w-sm rounded-2xl overflow-hidden border border-border/50 shadow-inner bg-slate-100 group">
                                                    <img 
                                                        src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/storage/${selectedSecurity.attachment}`}
                                                        alt="Refund Evidence"
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                    />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <a 
                                                            href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/storage/${selectedSecurity.attachment}`} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="px-4 py-2 bg-white text-black rounded-lg font-bold flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 transition-transform"
                                                        >
                                                            <Eye className="w-4 h-4" /> Full View
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
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
                                        <p className="text-xs text-muted-foreground font-semibold mb-1">Documents Submitted</p>
                                        <div className="inline-flex items-center gap-1.5">
                                            {selectedSecurity.isDocumentSubmitted ? (
                                                <>
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                                    <span className="font-bold text-emerald-600">Submitted</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Clock className="w-4 h-4 text-amber-600" />
                                                    <span className="font-bold text-amber-600">Pending</span>
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
                                                    <span className="font-bold text-amber-600">No</span>
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


            <Dialog open={isRefundDetailsOpen} onOpenChange={setIsRefundDetailsOpen}>
                <DialogContent className="max-w-md rounded-3xl overflow-hidden p-0 border-none shadow-2xl">
                    <DialogHeader className="p-6 bg-gradient-to-r from-emerald-500/10 to-transparent">
                        <DialogTitle className="text-xl font-black flex items-center gap-3 text-emerald-600">
                            <CheckCircle2 className="w-6 h-6" />
                            Refund Receipt Details
                        </DialogTitle>
                    </DialogHeader>
                    <div className="p-6 space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Check/Payorder No</Label>
                                <Input
                                    placeholder="Enter No..."
                                    className="h-11 rounded-xl bg-slate-50 border-border/40 font-mono"
                                    value={refundDetails.payOrderNo}
                                    onChange={(e) => setRefundDetails(prev => ({ ...prev, payOrderNo: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Date of Receipt</Label>
                                <Input
                                    type="date"
                                    className="h-11 rounded-xl bg-slate-50 border-border/40 font-mono"
                                    value={refundDetails.date}
                                    onChange={(e) => setRefundDetails(prev => ({ ...prev, date: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Deposit Bank</Label>
                                <Input
                                    placeholder="Which bank deposited?"
                                    className="h-11 rounded-xl bg-slate-50 border-border/40"
                                    value={refundDetails.depositBank}
                                    onChange={(e) => setRefundDetails(prev => ({ ...prev, depositBank: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Evidence Attachment</Label>
                                <div className="relative group">
                                    <Input
                                        type="file"
                                        accept="image/*,application/pdf"
                                        className="h-11 rounded-xl bg-slate-50 border-border/40 file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0] || null;
                                            setRefundDetails(prev => ({ ...prev, attachment: file }));
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4 border-t">
                            <Button 
                                variant="ghost" 
                                className="flex-1 rounded-xl font-bold h-11"
                                onClick={() => setIsRefundDetailsOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button 
                                className="flex-2 px-8 rounded-xl font-black bg-emerald-600 hover:bg-emerald-700 h-11 shadow-lg shadow-emerald-200"
                                onClick={handleRefundSubmit}
                                disabled={loading}
                            >
                                {loading ? "Saving..." : "Submit Refund"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}
