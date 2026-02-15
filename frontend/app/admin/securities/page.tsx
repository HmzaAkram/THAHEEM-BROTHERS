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
import { Checkbox } from '@/components/ui/checkbox';
import {
    Plus,
    ShieldCheck,
    Ship,
    Anchor,
    Calendar,
    CreditCard,
    User,
    Search,
    CheckCircle2,
    Clock,
    ArrowRight,
    ClipboardList
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { useData, SecurityTracking } from '@/context/data-context';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

export default function SecuritiesPage() {
    const { securities, companies, addSecurity, updateSecurity } = useData();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Form State
    const [companyId, setCompanyId] = useState('');
    const [gdNumber, setGdNumber] = useState('');
    const [noOfContainers, setNoOfContainers] = useState('1');
    const [containerNo, setContainerNo] = useState('');
    const [amountPerContainer, setAmountPerContainer] = useState('');
    const [refundDays, setRefundDays] = useState('7');
    const [port, setPort] = useState('');
    const [isDocumentSubmitted, setIsDocumentSubmitted] = useState(false);
    const [refundDueDate, setRefundDueDate] = useState(new Date().toISOString().split('T')[0]);
    const [isRefundReceived, setIsRefundReceived] = useState(false);
    const [receivedAmountDate, setReceivedAmountDate] = useState('');
    const [payOrderNo, setPayOrderNo] = useState('');
    const [receiverName, setReceiverName] = useState('');

    const filteredSecurities = securities.filter(s =>
        s.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.gdNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.containerNo.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSubmit = async () => {
        if (!companyId || !gdNumber || !noOfContainers || !amountPerContainer) {
            alert("Please fill required fields");
            return;
        }

        const selectedCompany = companies.find(c => c.id === companyId);
        if (!selectedCompany) return;

        setLoading(true);
        try {
            const result = await addSecurity({
                companyId,
                companyName: selectedCompany.name,
                gdNumber,
                noOfContainers: Number(noOfContainers),
                containerNo,
                amountPerContainer: Number(amountPerContainer),
                refundDays: Number(refundDays),
                port,
                isDocumentSubmitted,
                refundDueDate,
                isRefundReceived,
                receivedAmountDate: receivedAmountDate || undefined,
                payOrderNo,
                receiverName,
            });

            if (result.ok) {
                setIsDialogOpen(false);
                // Reset Form
                setCompanyId('');
                setGdNumber('');
                setNoOfContainers('1');
                setContainerNo('');
                setAmountPerContainer('');
                setRefundDays('7');
                setPort('');
                setIsDocumentSubmitted(false);
                setRefundDueDate(new Date().toISOString().split('T')[0]);
                setIsRefundReceived(false);
                setReceivedAmountDate('');
                setPayOrderNo('');
                setReceiverName('');
            } else {
                alert("Failed to add security record: " + result.message);
            }
        } catch (error) {
            console.error("Failed to add security:", error);
            alert("An unexpected error occurred while saving the security record.");
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

                    <div className="flex items-center gap-3 w-full md:w-auto">
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
                                                <Select value={companyId} onValueChange={setCompanyId}>
                                                    <SelectTrigger className="h-11 bg-white dark:bg-slate-950 border-border/40 rounded-xl">
                                                        <SelectValue placeholder="Search Company" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {companies.map((company) => (
                                                            <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">GD Number</Label>
                                                <Input
                                                    placeholder="Example: KPAF-HC-123"
                                                    className="h-11 bg-white dark:bg-slate-950 border-border/40 rounded-xl font-mono"
                                                    value={gdNumber}
                                                    onChange={(e) => setGdNumber(e.target.value)}
                                                />
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
                                            <div className="md:col-span-2 flex items-center justify-end px-6 rounded-xl bg-primary/5 border border-primary/10">
                                                <div className="text-right">
                                                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Total Security Amount</p>
                                                    <p className="text-xl font-black text-primary font-mono leading-none">PKR {totalAmountCalculated.toLocaleString()}</p>
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
                                                <Label htmlFor="docSubmitted" className="text-sm font-bold cursor-pointer">Document Submitted or Not</Label>
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
                                            disabled={loading}
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
                                                        <p className="font-mono font-black text-slate-900 dark:text-white">{(security.noOfContainers * security.amountPerContainer).toLocaleString()}</p>
                                                        <p className="text-[10px] font-bold text-muted-foreground opacity-60">
                                                            {security.amountPerContainer.toLocaleString()} / container
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
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-9 w-9 rounded-xl text-muted-foreground hover:bg-white hover:text-primary hover:shadow-md transition-all active:scale-95"
                                                        onClick={async () => {
                                                            if (window.confirm("Mark as refund received?")) {
                                                                try {
                                                                    const result = await updateSecurity(security.id, { isRefundReceived: true, status: 'Completed' });
                                                                    // add check if result.ok here if updateSecurity is updated to return result
                                                                } catch (err) {
                                                                    console.error("Failed to update security:", err);
                                                                    alert("Failed to update security record.");
                                                                }
                                                            }
                                                        }}
                                                        disabled={security.isRefundReceived}
                                                    >
                                                        <CheckCircle2 className="w-4 h-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
