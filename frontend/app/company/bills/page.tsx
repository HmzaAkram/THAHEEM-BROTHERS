'use client';

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { toPng } from 'html-to-image';
import JSZip from 'jszip';
import { useRef, useMemo, useState, useEffect } from 'react';
import { InvoiceTemplate } from '@/components/invoice-template';
import { Bill } from '@/context/data-context';
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
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Download, Eye, FileText, Calendar, Briefcase, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useData } from '@/context/data-context';
import { useAuth } from '@/context/auth-context';
import { formatDate } from '@/lib/utils';

export default function CompanyBillsPage() {
  const { user, isHydrated: authHydrated } = useAuth();
  const { bills, companies } = useData();
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [pdfBill, setPdfBill] = useState<Bill | null>(null);

  const statusStyles: Record<string, string> = {
    Paid: 'bg-green-100 text-green-800 border-green-200',
    Partial: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    Unpaid: 'bg-red-100 text-red-800 border-red-200',
  };

  const handleDownloadInvoice = async (bill: Bill) => {
    try {
      // 1. Set the bill to be viewed (renders the hidden template)
      setPdfBill(bill);

      // 2. Wait for render
      await new Promise((resolve) => setTimeout(resolve, 500));

      // 2. Wait for render
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (!invoiceRef.current) {
        console.error('Invoice template ref not found');
        return;
      }

      // 3. Capture with html2canvas (high scale for quality)
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/jpeg', 1.0);

      // 4. Create A4 PDF (210mm x 297mm)
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = 210;
      const pdfHeight = 297;

      // 5. Calculate Scale to FIT Single Page
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      // If content is taller than A4, scale it down to fit
      let finalWidth = imgWidth;
      let finalHeight = imgHeight;

      if (imgHeight > pdfHeight) {
        const scaleFactor = pdfHeight / imgHeight;
        finalWidth = imgWidth * scaleFactor;
        finalHeight = pdfHeight; // Fits exactly vertically
      }

      // Center horizontally if scaled down (though usually we just match width)
      const xOffset = (pdfWidth - finalWidth) / 2;
      const yOffset = 0; // Top align

      pdf.addImage(imgData, 'JPEG', xOffset, yOffset, finalWidth, finalHeight);

      // 6. Download the Generated PDF
      const filename = bill.jobNumber ? `Invoice_${bill.jobNumber}.pdf` : `Invoice_${bill.billNo}.pdf`;
      pdf.save(filename);

      // Cleanup
      setPdfBill(null);

    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate PDF. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const currentCompany = useMemo(() => {
    if (user?.role === 'company' && user.id) {
      return companies.find(c => String(c.id) === String(user.id)) || companies[0];
    }
    return companies[0];
  }, [user, companies]);

  const companyBills = useMemo(() => {
    if (!currentCompany) return [];
    return bills.filter(b => String(b.companyId) === String(currentCompany.id))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [bills, currentCompany]);

  const stats = useMemo(() => {
    const total = companyBills.reduce((sum, b) => sum + b.grandTotal, 0);
    const paid = companyBills.reduce((sum, b) => sum + b.paidAmount, 0);
    return {
      total,
      paid,
      outstanding: total - paid
    };
  }, [companyBills]);

  const handleExportPDF = async () => {
    if (!tableRef.current) return;

    try {
      // Wait for images
      const images = tableRef.current.querySelectorAll('img');
      await Promise.all(
        Array.from(images).map(img => {
          if (img.complete) return Promise.resolve();
          return new Promise(resolve => { img.onload = resolve; img.onerror = resolve; });
        })
      );
      await new Promise(resolve => setTimeout(resolve, 300));

      const dataUrl = await toPng(tableRef.current, { cacheBust: true, style: { background: 'white', padding: '20px' } });
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`My_Bills_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('Failed to export PDF', err);
    }
  };

  if (!authHydrated || !currentCompany) {
    return (
      <DashboardLayout>
        <div className="flex h-64 items-center justify-center text-muted-foreground animate-in fade-in">
          {!authHydrated ? (
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          ) : (
            "No company data available. Please contact support."
          )}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <DashboardLayout>
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">My Bills</h1>
              <p className="text-muted-foreground mt-1">
                View and download your invoices for <span className="text-primary font-semibold">{currentCompany?.name}</span>
              </p>
            </div>
            <Button variant="outline" className="gap-2" onClick={handleExportPDF}>
              <Download className="w-4 h-4" />
              Download List (PDF)
            </Button>
          </div>

          <Card className="shadow-md border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Invoices</CardTitle>
            </CardHeader>
            <CardContent ref={tableRef} className="bg-white p-4">
              <div className="hidden print:block mb-4">
                <h2 className="text-xl font-bold">{currentCompany?.name} - Bills Report</h2>
                <p className="text-sm text-gray-500">Generated on {new Date().toLocaleDateString()}</p>
              </div>
              {companyBills.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>No invoices found for your account.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-secondary/50">
                        <TableHead>Invoice No</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Job No</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {companyBills.map((bill) => (
                        <TableRow key={bill.id} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="font-mono text-sm font-bold text-primary">
                            {bill.billNo}
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatDate(bill.date)}
                          </TableCell>
                          <TableCell className="text-sm font-mono text-muted-foreground">
                            {bill.jobNumber}
                          </TableCell>
                          <TableCell className="font-bold">
                            PKR {bill.grandTotal.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${statusStyles[bill.calculatedStatus || 'Unpaid']
                                }`}
                            >
                              {bill.calculatedStatus || 'Unpaid'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="hover:text-primary hover:bg-primary/5 transition-colors"
                                onClick={() => {
                                  setSelectedBill(bill);
                                  setIsViewOpen(true);
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="hover:text-primary hover:bg-primary/5 transition-colors"
                                onClick={() => handleDownloadInvoice(bill)}
                              >
                                <Download className="w-4 h-4" />
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="shadow-lg border-primary/10 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950">
              <CardContent className="pt-6">
                <div className="text-center space-y-1">
                  <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">Total Invoiced</p>
                  <p className="text-2xl font-black text-foreground">
                    PKR {stats.total.toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-lg border-green-500/10 bg-gradient-to-br from-white to-green-50/30 dark:from-slate-900 dark:to-green-900/10">
              <CardContent className="pt-6">
                <div className="text-center space-y-1">
                  <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">Paid Amount</p>
                  <p className="text-2xl font-black text-green-600">
                    PKR {stats.paid.toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-lg border-red-500/10 bg-gradient-to-br from-white to-red-50/30 dark:from-slate-900 dark:to-red-900/10">
              <CardContent className="pt-6">
                <div className="text-center space-y-1">
                  <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">Outstanding</p>
                  <p className="text-2xl font-black text-red-600">
                    PKR {stats.outstanding.toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* View Bill Modal */}
          <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                  <FileText className="w-6 h-6 text-primary" />
                  Invoice Breakdown
                </DialogTitle>
              </DialogHeader>

              {selectedBill && (
                <div className="space-y-8 py-4">
                  <InvoiceTemplate bill={selectedBill} />
                  <div className="flex gap-4 pt-6 border-t">
                    <Button className="flex-1 gap-2 rounded-xl h-12 font-bold shadow-lg" onClick={() => handleDownloadInvoice(selectedBill)}>
                      <Download className="w-4 h-4" />
                      Download PDF
                    </Button>
                    <Button variant="outline" className="flex-1 rounded-xl h-12 font-semibold" onClick={() => setIsViewOpen(false)}>
                      Close
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>
      {/* Hidden Capture Area for PDF Generation */}
      <div style={{ position: 'fixed', top: '200vh', left: 0 }} suppressHydrationWarning>
        {pdfBill && (
          <div ref={invoiceRef} className="w-[210mm] bg-white p-8">
            <InvoiceTemplate bill={pdfBill} hideAttachments={true} />
          </div>
        )}
      </div>
    </>
  );
}
