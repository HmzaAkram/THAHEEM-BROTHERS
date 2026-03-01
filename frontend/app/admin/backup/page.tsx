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
    History
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
    const [zipLoading, setZipLoading] = useState(false);
    const [zipProgressText, setZipProgressText] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // State to mount the invoice template dynamically for capturing
    const [renderingBill, setRenderingBill] = useState<Bill | null>(null);
    const invoiceRef = useRef<HTMLDivElement>(null);

    const handleExport = async () => {
        setExportLoading(true);
        try {
            const token = localStorage.getItem('authToken');
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
            const token = localStorage.getItem('authToken');
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

    const handleZipExport = async () => {
        setZipLoading(true);
        setZipProgressText('Initializing Backup...');

        try {
            const zip = new JSZip();

            // Load logo once for PDFs
            const img = new Image();
            img.src = '/logo.jpeg';
            await new Promise((resolve) => {
                img.onload = resolve;
                img.onerror = resolve;
            });
            let logoWidth = 0, logoHeight = 0;
            if (img.width > 0) {
                const maxLogoHeight = 20, maxLogoWidth = 60;
                logoWidth = img.width;
                logoHeight = img.height;
                const ratio = Math.min(maxLogoWidth / logoWidth, maxLogoHeight / logoHeight);
                logoWidth *= ratio;
                logoHeight *= ratio;
            }

            // Iterate over companies
            for (let i = 0; i < companies.length; i++) {
                const company = companies[i];
                setZipProgressText(`Processing Company: ${company.name} (${i + 1}/${companies.length})`);

                const companyFolder = zip.folder(`${company.name}_${company.identifier}`);
                if (!companyFolder) continue;

                // Pre-filter company specific data
                const companyBills = bills.filter(b => String(b.companyId) === String(company.id));
                const companyPayments = payments.filter(p => String(p.companyId) === String(company.id));

                // 1. GENERATE LEDGER PDF
                const ledgerDoc = new jsPDF('p', 'mm', 'a4');
                const pageWidth = ledgerDoc.internal.pageSize.getWidth();

                if (logoWidth > 0) {
                    const maxLogoHeight = 16;
                    const maxLogoWidth = 16;
                    let newLogoWidth = logoWidth;
                    let newLogoHeight = logoHeight;
                    const ratio = Math.min(maxLogoWidth / newLogoWidth, maxLogoHeight / newLogoHeight);
                    newLogoWidth *= ratio;
                    newLogoHeight *= ratio;

                    ledgerDoc.addImage(img, 'PNG', 14, 10, newLogoWidth, newLogoHeight);
                }

                // Company Info (Thaheem Brothers)
                ledgerDoc.setTextColor(15, 23, 42); // slate-900
                ledgerDoc.setFontSize(14);
                ledgerDoc.setFont("helvetica", "bold");
                ledgerDoc.text("THAHEEM BROTHERS", 34, 12);

                ledgerDoc.setTextColor(100, 116, 139); // slate-500
                ledgerDoc.setFontSize(8);
                ledgerDoc.setFont("helvetica", "normal");
                ledgerDoc.text("Suite 23, 2nd Floor, R.K. Square Ext, Shahrah-e-Liaquat, Karachi", 34, 16);
                ledgerDoc.text("+92 21 32421347 | +92 300 2791780 | import.khi@hotmail.com", 34, 20);

                // Line Separator
                ledgerDoc.setDrawColor(226, 232, 240); // slate-200
                ledgerDoc.setLineWidth(0.5);
                ledgerDoc.line(14, 29, pageWidth - 14, 29);

                // Add Title
                ledgerDoc.setTextColor(15, 23, 42); // slate-900
                ledgerDoc.setFontSize(16);
                ledgerDoc.setFont("helvetica", "bold");
                ledgerDoc.text("LEDGER REPORT", pageWidth - 14, 27, { align: "right" });

                // Add Filter Info Below Line
                let yPos = 36;
                ledgerDoc.setFontSize(10);
                ledgerDoc.setFont("helvetica", "bold");
                ledgerDoc.setTextColor(15, 23, 42);
                ledgerDoc.text(`Client: ${company.name}`, 14, yPos);

                ledgerDoc.setFontSize(9);
                ledgerDoc.setFont("helvetica", "normal");
                ledgerDoc.setTextColor(100, 116, 139);
                ledgerDoc.text(`Period: All Time`, 14, yPos + 5);
                ledgerDoc.text(`Date Printed: ${formatDate(new Date().toISOString())}`, pageWidth - 14, yPos, { align: "right" });
                yPos += 12;

                // DETAILED LEDGER CONSOLIDATION LOGIC
                let consolidatedEntries: any[] = [];

                companyBills.forEach(bill => {
                    const linkedPayments = payments.filter(p => String(p.billId) === String(bill.id));
                    const totalPaid = linkedPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
                    const totalAdjustment = linkedPayments.reduce((sum, p) => sum + Number(p.adjustment || 0), 0);
                    const debitAmount = bill.grandTotal || bill.totalAmount || 0;
                    const advanceAmount = bill.advancePayment || 0;

                    consolidatedEntries.push({
                        date: bill.date,
                        type: 'BILL',
                        description: (bill as any).description || `Job #${bill.jobNumber || 'N/A'}`,
                        jobNumber: bill.jobNumber,
                        debit: debitAmount,
                        advance: advanceAmount,
                        paid: totalPaid,
                        adjustment: totalAdjustment,
                        credit: advanceAmount + totalPaid + totalAdjustment,
                        outstanding: debitAmount - advanceAmount - totalPaid - totalAdjustment,
                    });
                });

                companyPayments.forEach(p => {
                    if (!p.billId) {
                        consolidatedEntries.push({
                            date: p.date,
                            type: 'PAYMENT',
                            description: p.description ? `Payment: ${p.description}` : 'Payment Received',
                            jobNumber: null,
                            debit: 0,
                            advance: 0,
                            paid: Number(p.amount || 0),
                            adjustment: Number(p.adjustment || 0),
                            credit: Number(p.amount || 0) + Number(p.adjustment || 0),
                            outstanding: 0,
                            method: p.method,
                            paymentRef: p.reference,
                        });
                    }
                });

                consolidatedEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

                let openingBal = Number(company.openingBalance) || 0;
                let running = openingBal;

                const tableRows = consolidatedEntries.map(entry => {
                    let desc = entry.description;
                    if (entry.type === 'PAYMENT') {
                        desc = entry.method ? `Payment Received (${entry.method})` : 'Advance Received';
                        if (entry.paymentRef) desc += ` - Ref: ${entry.paymentRef}`;
                    }
                    running += (entry.debit - entry.credit);

                    return [
                        formatDate(entry.date),
                        desc,
                        entry.jobNumber || '-',
                        entry.debit > 0 ? formatCurrency(entry.debit) : '-',
                        entry.advance > 0 ? formatCurrency(entry.advance) : '-',
                        entry.paid > 0 ? formatCurrency(entry.paid) : '-',
                        entry.adjustment > 0 ? formatCurrency(entry.adjustment) : '-',
                        entry.outstanding > 0 ? formatCurrency(entry.outstanding) : '-',
                        formatCurrency(running)
                    ];
                });

                // Add Opening Balance as first row
                tableRows.unshift([
                    '-',
                    'Opening Balance b/f',
                    '-',
                    '-',
                    '-',
                    '-',
                    '-',
                    '-',
                    formatCurrency(openingBal)
                ]);

                autoTable(ledgerDoc, {
                    startY: yPos,
                    head: [['Date', 'Description', 'Job No', 'Bill Total', 'Advance', 'Paid', 'Adj.', 'Outst.', 'Balance']],
                    body: tableRows,
                    theme: 'grid',
                    headStyles: { fillColor: [44, 62, 80], textColor: [255, 255, 255], fontStyle: 'bold' },
                    styles: { fontSize: 7, cellPadding: 1.5 },
                    columnStyles: {
                        3: { halign: 'right' },
                        4: { halign: 'right' },
                        5: { halign: 'right' },
                        6: { halign: 'right' },
                        7: { halign: 'right' },
                        8: { halign: 'right', fontStyle: 'bold' }
                    },
                    didParseCell: function (data) {
                        if (data.section === 'body') {
                            if (data.column.index === 8) {
                                const valStr = data.cell.text[0] || '';
                                const numStr = valStr.replace(/[^0-9.-]/g, '');
                                const numVal = parseFloat(numStr);
                                if (!isNaN(numVal)) {
                                    if (numVal > 0) {
                                        data.cell.styles.textColor = [220, 38, 38];
                                    } else if (numVal <= 0) {
                                        data.cell.styles.textColor = [0, 128, 0];
                                    }
                                }
                            }
                        }
                    }
                });

                companyFolder.file('Ledger.pdf', ledgerDoc.output('blob'));

                // 2. GENERATE PAYMENT HISTORY PDF
                const paymentDoc = new jsPDF('p', 'mm', 'a4');
                const pPageWidth = paymentDoc.internal.pageSize.getWidth();

                if (logoWidth > 0) {
                    const maxLogoHeight = 16;
                    const maxLogoWidth = 16;
                    let newLogoWidth = logoWidth;
                    let newLogoHeight = logoHeight;
                    const ratio = Math.min(maxLogoWidth / newLogoWidth, maxLogoHeight / newLogoHeight);
                    newLogoWidth *= ratio;
                    newLogoHeight *= ratio;
                    paymentDoc.addImage(img, 'PNG', 14, 10, newLogoWidth, newLogoHeight);
                }

                paymentDoc.setTextColor(15, 23, 42);
                paymentDoc.setFontSize(14);
                paymentDoc.setFont("helvetica", "bold");
                paymentDoc.text("THAHEEM BROTHERS", 34, 12);

                paymentDoc.setTextColor(100, 116, 139);
                paymentDoc.setFontSize(8);
                paymentDoc.setFont("helvetica", "normal");
                paymentDoc.text("Suite 23, 2nd Floor, R.K. Square Ext, Shahrah-e-Liaquat, Karachi", 34, 16);
                paymentDoc.text("+92 21 32421347 | +92 300 2791780 | import.khi@hotmail.com", 34, 20);

                paymentDoc.setDrawColor(226, 232, 240);
                paymentDoc.setLineWidth(0.5);
                paymentDoc.line(14, 29, pPageWidth - 14, 29);

                paymentDoc.setTextColor(15, 23, 42);
                paymentDoc.setFontSize(16);
                paymentDoc.setFont("helvetica", "bold");
                paymentDoc.text("PAYMENT HISTORY", pPageWidth - 14, 27, { align: "right" });

                let yPosPayment = 36;
                paymentDoc.setFontSize(10);
                paymentDoc.setFont("helvetica", "bold");
                paymentDoc.text(`Client: ${company.name}`, 14, yPosPayment);

                paymentDoc.setFontSize(9);
                paymentDoc.setFont("helvetica", "normal");
                paymentDoc.setTextColor(100, 116, 139);
                paymentDoc.text(`Period: All Time`, 14, yPosPayment + 5);
                paymentDoc.text(`Date Printed: ${formatDate(new Date().toISOString())}`, pPageWidth - 14, yPosPayment, { align: "right" });
                yPosPayment += 12;

                // Sort by date desc for history
                const sortedPayments = [...companyPayments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                const paymentRows = sortedPayments.map(p => {
                    const linkedBill = p.billId ? bills.find(b => b.id.toString() === p.billId.toString()) : null;
                    const cashPaid = Number(p.amount) || 0;
                    const adjustment = Number(p.adjustment) || 0;
                    const totalPaid = cashPaid + adjustment;
                    const billTotal = linkedBill ? Number(linkedBill.grandTotal) : 0;

                    return [
                        formatDate(p.date),
                        company.name,
                        linkedBill?.jobNumber || 'N/A',
                        (p as any).paymentMethod || '-',
                        p.reference || (linkedBill ? 'Payment' : 'Advance'),
                        adjustment > 0 ? formatCurrency(adjustment) : '-',
                        cashPaid > 0 ? formatCurrency(cashPaid) : '-',
                        formatCurrency(totalPaid),
                        billTotal > 0 ? formatCurrency(billTotal) : '-'
                    ];
                });

                autoTable(paymentDoc, {
                    startY: yPosPayment,
                    head: [['Date', 'Company', 'Job No', 'Method', 'Ref/Adv', 'Adj.', 'Cash Paid', 'Total Paid', 'Bill Total']],
                    body: paymentRows.length > 0 ? paymentRows : [['-', 'No payments', '-', '-', '-', '-', '-', '-', '-']],
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

                companyFolder.file('Payment_History.pdf', paymentDoc.output('blob'));

                // 2.5 GENERATE REPORT PDF
                const reportDoc = new jsPDF('p', 'mm', 'a4');
                const rPageWidth = reportDoc.internal.pageSize.getWidth();

                if (logoWidth > 0) {
                    const maxLogoHeight = 16;
                    const maxLogoWidth = 16;
                    let newLogoWidth = logoWidth;
                    let newLogoHeight = logoHeight;
                    const ratio = Math.min(maxLogoWidth / newLogoWidth, maxLogoHeight / newLogoHeight);
                    newLogoWidth *= ratio;
                    newLogoHeight *= ratio;
                    reportDoc.addImage(img, 'PNG', 14, 10, newLogoWidth, newLogoHeight);
                }

                reportDoc.setTextColor(15, 23, 42);
                reportDoc.setFontSize(14);
                reportDoc.setFont("helvetica", "bold");
                reportDoc.text("THAHEEM BROTHERS", 34, 12);

                reportDoc.setTextColor(100, 116, 139);
                reportDoc.setFontSize(8);
                reportDoc.setFont("helvetica", "normal");
                reportDoc.text("Suite 23, 2nd Floor, R.K. Square Ext, Shahrah-e-Liaquat, Karachi", 34, 16);
                reportDoc.text("+92 21 32421347 | +92 300 2791780 | import.khi@hotmail.com", 34, 20);

                reportDoc.setDrawColor(226, 232, 240);
                reportDoc.setLineWidth(0.5);
                reportDoc.line(14, 29, rPageWidth - 14, 29);

                reportDoc.setTextColor(15, 23, 42);
                reportDoc.setFontSize(16);
                reportDoc.setFont("helvetica", "bold");
                reportDoc.text("BALANCE REPORT", rPageWidth - 14, 27, { align: "right" });

                let yPosReport = 36;
                reportDoc.setFontSize(10);
                reportDoc.setFont("helvetica", "bold");
                reportDoc.text(`Client: ${company.name}`, 14, yPosReport);

                reportDoc.setFontSize(9);
                reportDoc.setFont("helvetica", "normal");
                reportDoc.setTextColor(100, 116, 139);
                reportDoc.text(`Period: All Time`, 14, yPosReport + 5);
                reportDoc.text(`Date Printed: ${formatDate(new Date().toISOString())}`, rPageWidth - 14, yPosReport, { align: "right" });
                yPosReport += 12;

                const cBilled = companyBills.reduce((sum, b) => sum + (Number(b.grandTotal) || 0), 0);
                const cPaid = companyBills.reduce((sum, b) => sum + (Number((b as any).advancePayment) || 0), 0) + companyPayments.reduce((sum, p) => sum + (Number(p.amount) || 0) + (Number(p.adjustment) || 0), 0);
                const cOutstanding = cBilled - cPaid;

                const cUnpaidBills = companyBills.filter(b => b.status !== 'Paid').sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                let cDaysOverdue = 0;
                let cLastDue = '-';
                if (cUnpaidBills.length > 0) {
                    const today = new Date();
                    const dueDate = new Date(cUnpaidBills[0].date);
                    dueDate.setDate(dueDate.getDate() + 30);
                    if (today > dueDate) {
                        cDaysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 3600 * 24));
                    }
                    cLastDue = formatDate(cUnpaidBills[0].date);
                }

                const reportRows = [[
                    company.name,
                    companyBills.length.toString(),
                    cLastDue,
                    cDaysOverdue > 0 ? `${cDaysOverdue} days` : 'Current',
                    formatCurrency(cBilled),
                    formatCurrency(cPaid),
                    formatCurrency(cOutstanding),
                    cOutstanding > 300000 ? 'High Risk' : cOutstanding > 100000 ? 'Medium' : 'Low Risk'
                ]];

                autoTable(reportDoc, {
                    startY: yPosReport,
                    head: [['Company Name', 'No Of Bills', 'Last Due', 'Days Overdue', 'Total Debit', 'Received', 'Outstanding Amount', 'Status']],
                    body: reportRows,
                    theme: 'grid',
                    headStyles: { fillColor: [44, 62, 80], textColor: [255, 255, 255], fontStyle: 'bold' },
                    styles: { fontSize: 8, cellPadding: 2 },
                    columnStyles: {
                        1: { halign: 'center' },
                        2: { halign: 'right' },
                        3: { halign: 'right' },
                        4: { halign: 'right', textColor: [220, 38, 38] },
                        5: { halign: 'right', textColor: [0, 128, 0] },
                        6: { halign: 'right', fontStyle: 'bold' },
                        7: { halign: 'right' }
                    }
                });

                companyFolder.file('Report.pdf', reportDoc.output('blob'));

                // 3. GENERATE BILLS INVOICES & ATTACHMENTS
                const billsFolder = companyFolder.folder('Bills');

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

                                // Process attachments — organized into an "attachments" sub-folder
                                const allAttachments: string[] = [];
                                if (bill.attachment) allAttachments.push(bill.attachment);
                                if (bill.attachments && Array.isArray(bill.attachments)) {
                                    bill.attachments.forEach(a => {
                                        if (a && !allAttachments.includes(a)) allAttachments.push(a);
                                    });
                                }

                                if (allAttachments.length > 0) {
                                    const attachmentsFolder = jobFolder.folder('attachments');
                                    if (attachmentsFolder) {
                                        for (let k = 0; k < allAttachments.length; k++) {
                                            const attachmentUrl = allAttachments[k];
                                            try {
                                                const filename = attachmentUrl.split('/').pop();
                                                if (filename) {
                                                    const token = localStorage.getItem('authToken');
                                                    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
                                                    const attachUrl = `${apiUrl}/bills/attachment/${filename}`;

                                                    const attRes = await fetch(attachUrl, {
                                                        headers: { 'Authorization': `Bearer ${token}` }
                                                    });

                                                    if (attRes.ok) {
                                                        const attBlob = await attRes.blob();
                                                        // Use original filename or a descriptive name if missing
                                                        const fileNameToSave = filename || `attachment_${k + 1}.pdf`;
                                                        attachmentsFolder.file(fileNameToSave, attBlob);
                                                    } else {
                                                        console.warn(`Failed to fetch attachment from ${attachUrl}: ${attRes.status}`);
                                                    }
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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                                    disabled={zipLoading || exportLoading}
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
