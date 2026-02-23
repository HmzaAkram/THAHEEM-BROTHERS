'use client';

import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Download,
    Upload,
    Database,
    AlertTriangle,
    CheckCircle2,
    Loader2,
    History,
    FileText
} from 'lucide-react';
import { useState, useRef } from 'react';
import { useAuth } from '@/context/auth-context';
import { useData } from '@/context/data-context';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Company, Bill, Payment } from '@/context/data-context';
import Swal from 'sweetalert2';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { toJpeg } from 'html-to-image';
import { InvoiceTemplate } from '@/components/invoice-template';
import { FileArchive } from 'lucide-react';

export default function BackupPage() {
    const { user } = useAuth();
    const { companies, bills, payments, securities, getCompanyLedger } = useData();
    const [exportLoading, setExportLoading] = useState(false);
    const [importLoading, setImportLoading] = useState(false);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [zipLoading, setZipLoading] = useState(false);
    const [zipProgressText, setZipProgressText] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // State to mount the invoice template dynamically for capturing
    const [renderingBill, setRenderingBill] = useState<Bill | null>(null);
    const invoiceRef = useRef<HTMLDivElement>(null);

    const handleExport = async () => {
        setExportLoading(true);
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/backup/export`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                const contentDisposition = response.headers.get('Content-Disposition');
                let filename = `thaheem_backup_${new Date().toISOString().split('T')[0]}.sql`;
                if (contentDisposition && contentDisposition.indexOf('filename=') !== -1) {
                    filename = contentDisposition.split('filename=')[1].replace(/"/g, '');
                }
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
            } else {
                const result = await response.json();
                Swal.fire({ title: 'Export Failed', text: `Failed to export database: ${result.error || 'Unknown error'}`, icon: 'error', confirmButtonColor: '#3b82f6' });
            }
        } catch (error) {
            console.error('Export error:', error);
            Swal.fire({ title: 'Export Error', text: 'An error occurred during export.', icon: 'error', confirmButtonColor: '#3b82f6' });
        } finally {
            setExportLoading(false);
        }
    };

    const handleImport = async () => {
        if (!selectedFile) {
            Swal.fire({ title: 'No File Selected', text: 'Please select a backup file first.', icon: 'warning', confirmButtonColor: '#3b82f6' });
            return;
        }

        const confirmResult = await Swal.fire({
            title: 'WARNING',
            text: 'This will overwrite your current database. This action CANNOT be undone. Are you sure you want to proceed?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#3b82f6',
            confirmButtonText: 'Yes, proceed!'
        });

        if (!confirmResult.isConfirmed) {
            return;
        }

        setImportLoading(true);
        try {
            const token = localStorage.getItem('auth_token');
            const formData = new FormData();
            formData.append('backup_file', selectedFile);

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/backup/import`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (response.ok) {
                await Swal.fire({ title: 'Success!', text: 'Database restored successfully! The application will now reload.', icon: 'success', confirmButtonColor: '#10b981' });
                window.location.reload();
            } else {
                const data = await response.json();
                Swal.fire({ title: 'Restore Failed', text: `Restore failed: ${data.error || 'Unknown error'}`, icon: 'error', confirmButtonColor: '#3b82f6' });
            }
        } catch (error) {
            console.error('Import error:', error);
            Swal.fire({ title: 'Restore Error', text: 'An error occurred during the restore process.', icon: 'error', confirmButtonColor: '#3b82f6' });
        } finally {
            setImportLoading(false);
        }
    };

    const handlePDFExport = () => {
        setPdfLoading(true);
        try {
            const doc = new jsPDF();
            const today = formatDate(new Date());

            // --- Cover Page ---
            doc.setFontSize(28);
            doc.text('THAHEEM BROTHERS', 105, 80, { align: 'center' });

            doc.setFontSize(16);
            doc.text('FULL SYSTEM BACKUP REPORT', 105, 100, { align: 'center' });

            doc.setFontSize(12);
            doc.text(`Generated On: ${today}`, 105, 120, { align: 'center' });
            doc.text(`Generated By: ${user?.name || 'Admin'}`, 105, 130, { align: 'center' });

            doc.addPage();

            // --- Chapter 1: Financial Summary ---
            doc.setFontSize(18);
            doc.text('1. Financial Executive Summary', 14, 20);

            const totalBilled = bills.reduce((sum, b) => sum + (Number(b.grandTotal) || 0), 0);
            const totalCollected =
                bills.reduce((sum, b) => sum + (Number(b.advancePayment) || 0), 0) +
                payments.reduce((sum, p) => sum + (Number(p.amount) || 0) + (Number(p.adjustment) || 0), 0);

            const summaryData = [
                ['Total Companies', companies.length],
                ['Total Invoices Generated', bills.length],
                ['Total Payments Recorded', payments.length],
                ['Total Billed Amount', formatCurrency(totalBilled)],
                ['Total Collected Amount', formatCurrency(totalCollected)],
                ['Outstanding Balance', formatCurrency(totalBilled - totalCollected)],
            ];

            autoTable(doc, {
                startY: 30,
                head: [['Metric', 'Value']],
                body: summaryData,
                theme: 'grid',
                headStyles: { fillColor: [41, 128, 185] },
            });

            // --- Chapter 2: Company Balances ---
            doc.addPage();
            doc.setFontSize(18);
            doc.text('2. Company Balances Overview', 14, 20);

            const companyRows = companies.map(c => {
                const cBills = bills.filter(b => b.companyId === c.id);
                const cPayments = payments.filter(p => p.companyId === c.id);

                const billed = cBills.reduce((sum, b) => sum + (Number(b.grandTotal) || 0), 0);
                const paid = cBills.reduce((s, b) => s + (Number(b.advancePayment) || 0), 0) +
                    cPayments.reduce((s, p) => s + (Number(p.amount) || 0) + (Number(p.adjustment) || 0), 0);

                return [c.name, c.email, formatCurrency(billed), formatCurrency(paid), formatCurrency(billed - paid)];
            });

            autoTable(doc, {
                startY: 30,
                head: [['Company', 'Email', 'Total Billed', 'Total Paid', 'Balance']],
                body: companyRows,
                theme: 'striped',
                headStyles: { fillColor: [44, 62, 80] },
                styles: { fontSize: 8 }
            });

            // --- Chapter 3: Securities ---
            doc.addPage();
            doc.setFontSize(18);
            doc.text('3. Security Deposits', 14, 20);

            const secRows = securities.map(s => [
                s.companyName,
                s.amount ? formatCurrency(s.amount) : '-',
                s.chequeNo || '-',
                s.bank || '-',
                formatDate(s.receiveDate),
                s.status
            ]);

            autoTable(doc, {
                startY: 30,
                head: [['Company', 'Amount', 'Cheque No', 'Bank', 'Date', 'Status']],
                body: secRows,
                theme: 'grid',
                headStyles: { fillColor: [22, 160, 133] },
            });

            // --- Chapter 4: Detailed Legders ---
            doc.addPage();
            doc.setFontSize(18);
            doc.text('4. Detailed Ledgers', 14, 20);
            let currentY = 30;

            companies.forEach((company, index) => {
                // Check if we need a new page for the next header
                if (currentY > 250) {
                    doc.addPage();
                    currentY = 20;
                }

                doc.setFontSize(14);
                doc.setTextColor(44, 62, 80);
                doc.text(`${index + 1}. ${company.name}`, 14, currentY);
                currentY += 10;

                const ledger = getCompanyLedger(company.id);
                const ledgerRows = ledger.map(l => [
                    formatDate(l.date),
                    l.description,
                    l.jobNumber || l.billNo || '-',
                    l.debit > 0 ? formatCurrency(l.debit) : '-',
                    l.credit > 0 ? formatCurrency(l.credit) : '-',
                    formatCurrency(l.balance)
                ]);

                if (ledgerRows.length > 0) {
                    autoTable(doc, {
                        startY: currentY,
                        head: [['Date', 'Description', 'Job No', 'Debit', 'Credit', 'Balance']],
                        body: ledgerRows,
                        theme: 'plain',
                        headStyles: { fillColor: [200, 200, 200], textColor: 0, fontSize: 8 },
                        styles: { fontSize: 8 },
                        margin: { left: 14 }
                    });

                    // @ts-ignore
                    currentY = doc.lastAutoTable.finalY + 15;
                } else {
                    doc.setFontSize(10);
                    doc.setTextColor(150);
                    doc.text('(No transactions found)', 14, currentY);
                    currentY += 15;
                }
            });

            doc.save(`Full_System_Backup_${new Date().toISOString().split('T')[0]}.pdf`);
            Swal.fire({ title: 'Success!', text: 'PDF Backup generated successfully!', icon: 'success', confirmButtonColor: '#10b981' });

        } catch (error) {
            console.error(error);
            Swal.fire({ title: 'Error', text: 'Failed to generate PDF backup.', icon: 'error', confirmButtonColor: '#3b82f6' });
        } finally {
            setPdfLoading(false);
        }
    };

    const handleZipExport = async () => {
        setZipLoading(true);
        setZipProgressText('Initializing Backup...');

        try {
            const zip = new JSZip();

            // Iterate over companies
            for (let i = 0; i < companies.length; i++) {
                const company = companies[i];
                setZipProgressText(`Processing Company: ${company.name} (${i + 1}/${companies.length})`);

                const companyFolder = zip.folder(`${company.name}_${company.identifier}`);
                if (!companyFolder) continue;

                // 1. GENERATE LEDGER PDF
                const ledgerDoc = new jsPDF();
                ledgerDoc.setFontSize(18);
                ledgerDoc.text(`General Ledger: ${company.name}`, 14, 20);

                const companyLedger = getCompanyLedger(company.id);
                const ledgerRows = companyLedger.map(l => [
                    formatDate(l.date),
                    l.description,
                    l.jobNumber || l.billNo || '-',
                    l.debit > 0 ? formatCurrency(l.debit) : '-',
                    l.credit > 0 ? formatCurrency(l.credit) : '-',
                    formatCurrency(l.balance)
                ]);

                autoTable(ledgerDoc, {
                    startY: 30,
                    head: [['Date', 'Description', 'Job/Bill No', 'Debit', 'Credit', 'Balance']],
                    body: ledgerRows.length > 0 ? ledgerRows : [['-', 'No transactions', '-', '-', '-', '-']],
                    theme: 'grid',
                    headStyles: { fillColor: [44, 62, 80] },
                    styles: { fontSize: 8 }
                });

                companyFolder.file('Ledger.pdf', ledgerDoc.output('blob'));

                // 2. GENERATE PAYMENT HISTORY PDF
                const paymentDoc = new jsPDF();
                paymentDoc.setFontSize(18);
                paymentDoc.text(`Payment History: ${company.name}`, 14, 20);

                const companyPayments = payments.filter(p => p.companyId === company.id);
                // Sort by date desc
                companyPayments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                const paymentRows = companyPayments.map(p => {
                    const linkedBill = p.billId ? bills.find(b => b.id.toString() === p.billId.toString()) : null;
                    return [
                        formatDate(p.date),
                        formatCurrency(p.amount),
                        p.paymentMethod,
                        p.reference || linkedBill?.jobNumber || 'Advance Payment',
                        p.notes || '-'
                    ];
                });

                autoTable(paymentDoc, {
                    startY: 30,
                    head: [['Date', 'Amount', 'Method', 'Reference/Job', 'Notes']],
                    body: paymentRows.length > 0 ? paymentRows : [['-', 'No payments', '-', '-', '-']],
                    theme: 'grid',
                    headStyles: { fillColor: [46, 204, 113] },
                    styles: { fontSize: 10 }
                });

                companyFolder.file('Payment_History.pdf', paymentDoc.output('blob'));

                // 3. GENERATE BILLS INVOICES & ATTACHMENTS
                const billsFolder = companyFolder.folder('Bills');
                const companyBills = bills.filter(b => b.companyId === company.id);

                if (billsFolder && companyBills.length > 0) {
                    for (let j = 0; j < companyBills.length; j++) {
                        const bill = companyBills[j];
                        setZipProgressText(`Processing Company: ${company.name} (${i + 1}/${companies.length}) - Job ${j + 1}/${companyBills.length}`);

                        // Create a sub-folder for each Job Number
                        const jobFolderName = bill.jobNumber
                            ? bill.jobNumber.replace(/[/\\?%*:|"<>\s]/g, '_')
                            : `Invoice_${bill.id}`;
                        const jobFolder = billsFolder.folder(jobFolderName);
                        if (!jobFolder) continue;

                        // Set current bill to render the InvoiceTemplate
                        setRenderingBill(bill);
                        // Wait for template to render + images/fonts to fully load
                        await new Promise(r => setTimeout(r, 1200));

                        if (invoiceRef.current) {
                            try {
                                const dataUrl = await toJpeg(invoiceRef.current, {
                                    cacheBust: true,
                                    quality: 0.95,
                                    pixelRatio: 1.5,
                                    backgroundColor: '#ffffff',
                                });

                                const invoiceDoc = new jsPDF('p', 'mm', 'a4');
                                const pdfWidth = 210;
                                const imgProps = invoiceDoc.getImageProperties(dataUrl);
                                const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

                                invoiceDoc.addImage(dataUrl, 'JPEG', 0, 0, pdfWidth, imgHeight);
                                // Save the invoice PDF inside the job-number folder
                                jobFolder.file(`Invoice_${jobFolderName}.pdf`, invoiceDoc.output('blob'));

                                // Process attachments — also inside the same job-number folder
                                if (bill.items && Array.isArray(bill.items)) {
                                    let attIndex = 1;
                                    for (const item of bill.items) {
                                        if (item.attachmentUrl) {
                                            try {
                                                const token = localStorage.getItem('auth_token');
                                                const attachUrl = item.attachmentUrl.startsWith('http')
                                                    ? item.attachmentUrl
                                                    : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/storage/${item.attachmentUrl}`;

                                                const attRes = await fetch(attachUrl, {
                                                    headers: { 'Authorization': `Bearer ${token}` }
                                                });
                                                if (attRes.ok) {
                                                    const attBlob = await attRes.blob();
                                                    const ext = item.attachmentUrl.split('.').pop() || 'jpg';
                                                    const descClean = (item.description || `Attachment_${attIndex}`).replace(/[/\\?%*:|"<>\s]/g, '_');
                                                    jobFolder.file(`${descClean}.${ext}`, attBlob);
                                                    attIndex++;
                                                }
                                            } catch (attErr) {
                                                console.error('Failed to fetch attachment', attErr);
                                            }
                                        }
                                    }
                                }

                            } catch (renderErr) {
                                console.error('Failed to render invoice for bill', bill.id, renderErr);
                            }
                        }
                    }
                    setRenderingBill(null);
                }
            }

            setZipProgressText('Packaging ZIP file... This may take a minute.');

            const zipBlob = await zip.generateAsync({ type: 'blob' });
            saveAs(zipBlob, `Thaheem_Brothers_Backup_${new Date().toISOString().split('T')[0]}.zip`);

            Swal.fire({ title: 'Success!', text: 'ZIP Backup generated successfully!', icon: 'success', confirmButtonColor: '#10b981' });

        } catch (error) {
            console.error(error);
            Swal.fire({ title: 'Error', text: 'Failed to generate ZIP backup.', icon: 'error', confirmButtonColor: '#3b82f6' });
            setRenderingBill(null);
        } finally {
            setZipLoading(false);
            setZipProgressText('');
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Database Management</h1>
                        <p className="text-muted-foreground mt-1">
                            Backup and restore your system data to ensure business continuity.
                        </p>
                    </div>
                    <div className="bg-primary/10 px-4 py-2 rounded-full border border-primary/20 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                        <span className="text-sm font-bold text-primary italic uppercase tracking-wider">System Secure</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* SQL Export */}
                    <Card className="shadow-xl border-primary/5 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm ring-1 ring-black/5">
                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl text-blue-600 shadow-sm transition-transform hover:scale-110">
                                    <Database className="w-6 h-6" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-bold">SQL Backup</CardTitle>
                                    <CardDescription>Full database structure & data.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="rounded-2xl border-2 border-dashed border-blue-200 dark:border-blue-800 p-6 flex flex-col items-center justify-center text-center space-y-4 bg-blue-50/20 dark:bg-blue-900/5 hover:bg-blue-50/40 transition-colors group h-48">
                                <Button
                                    onClick={handleExport}
                                    disabled={exportLoading}
                                    className="w-full h-12 gap-2 font-black shadow-lg shadow-blue-500/20 bg-blue-600 hover:bg-blue-700 text-white border-0"
                                >
                                    {exportLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                                    Download SQL
                                </Button>
                                <p className="text-xs text-muted-foreground">For import/restore purposes.</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* PDF Export */}
                    <Card className="shadow-xl border-primary/5 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm ring-1 ring-black/5">
                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-2xl text-purple-600 shadow-sm transition-transform hover:scale-110">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-bold">PDF Report</CardTitle>
                                    <CardDescription>Printable system overview.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="rounded-2xl border-2 border-dashed border-purple-200 dark:border-purple-800 p-6 flex flex-col items-center justify-center text-center space-y-4 bg-purple-50/20 dark:bg-purple-900/5 hover:bg-purple-50/40 transition-colors group h-48">
                                <Button
                                    onClick={handlePDFExport}
                                    disabled={pdfLoading}
                                    className="w-full h-12 gap-2 font-black shadow-lg shadow-purple-500/20 bg-purple-600 hover:bg-purple-700 text-white border-0"
                                >
                                    {pdfLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                                    Download PDF
                                </Button>
                                <p className="text-xs text-muted-foreground">Includes Ledgers & Stats.</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* ZIP Export */}
                    <Card className="shadow-xl border-primary/5 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm ring-1 ring-black/5">
                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-2xl text-amber-600 shadow-sm transition-transform hover:scale-110">
                                    <FileArchive className="w-6 h-6" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-bold">ZIP Backup</CardTitle>
                                    <CardDescription>All Companies & Invoices.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="rounded-2xl border-2 border-dashed border-amber-200 dark:border-amber-800 p-6 flex flex-col items-center justify-center text-center space-y-4 bg-amber-50/20 dark:bg-amber-900/5 hover:bg-amber-50/40 transition-colors group h-48">
                                <Button
                                    onClick={handleZipExport}
                                    disabled={zipLoading || exportLoading || pdfLoading}
                                    className="w-full h-12 gap-2 font-black shadow-lg shadow-amber-500/20 bg-amber-600 hover:bg-amber-700 text-white border-0"
                                >
                                    {zipLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                                    Download ZIP
                                </Button>
                                <p className="text-xs text-muted-foreground">
                                    {zipLoading ? zipProgressText || 'Compressing...' : 'Includes individual PDF files.'}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Import */}
                    <Card className="shadow-xl border-red-500/10 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm ring-1 ring-black/5">
                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-2xl text-red-600 shadow-sm transition-transform hover:scale-110">
                                    <Upload className="w-6 h-6" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-bold">Restore Data</CardTitle>
                                    <CardDescription>Import SQL backup file.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <div className="relative group">
                                        <Input
                                            id="backup"
                                            type="file"
                                            accept=".sqlite,.sql"
                                            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                            className="cursor-pointer file:cursor-pointer hover:border-primary/50 transition-all h-14 pt-3.5 pb-2.5 px-4 rounded-xl border-2 border-dashed bg-white dark:bg-slate-950 font-mono text-xs"
                                        />
                                    </div>
                                </div>

                                <Button
                                    onClick={handleImport}
                                    disabled={importLoading || !selectedFile}
                                    variant="destructive"
                                    className="w-full h-12 gap-3 font-black shadow-xl shadow-red-500/20 rounded-xl uppercase tracking-wider relative overflow-hidden group"
                                >
                                    {importLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                                    Restore
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="shadow-2xl border-0 bg-slate-900 text-white overflow-hidden relative rounded-3xl group">
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px] -mr-48 -mt-48 pointer-events-none group-hover:bg-primary/20 transition-all duration-1000" />
                    <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[80px] -ml-24 -mb-24 pointer-events-none group-hover:bg-blue-500/20 transition-all duration-1000" />

                    <CardContent className="p-10 relative z-10">
                        <div className="flex flex-col md:flex-row items-center gap-10">
                            <div className="p-6 bg-white/5 rounded-[2.5rem] border border-white/10 shadow-inner group-hover:scale-105 transition-transform duration-500">
                                <div className="p-4 bg-gradient-to-br from-blue-500 to-primary rounded-3xl shadow-lg">
                                    <History className="w-10 h-10 text-white" />
                                </div>
                            </div>
                            <div className="flex-1 text-center md:text-left space-y-4">
                                <h3 className="text-2xl font-black tracking-tight flex items-center gap-3 justify-center md:justify-start">
                                    Automatic Safety Checkpoint
                                    <span className="bg-green-500/20 text-green-400 text-[10px] px-2 py-0.5 rounded border border-green-500/30 uppercase font-black">Active</span>
                                </h3>
                                <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-2xl">
                                    Before any restoration begins, the system creates an internal snapshot of your current database. This <span className="text-blue-400 font-bold">"Pre-Restore"</span> backup ensures that you can always revert to your previous state if the imported data is incorrect or corrupted.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Hidden container to render invoices to PDF */}
                {renderingBill && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: '-9999px',
                        opacity: 0,
                        pointerEvents: 'none',
                        zIndex: -9999,
                    }}>
                        <div ref={invoiceRef} className="bg-white" style={{ width: '800px', padding: '24px' }}>
                            <InvoiceTemplate bill={renderingBill} />
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
