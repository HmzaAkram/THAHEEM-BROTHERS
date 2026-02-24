'use client';

import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useData } from '@/context/data-context';
import { useAuth } from '@/context/auth-context';
import { useMemo, useRef, useState } from 'react';
import { formatDate } from '@/lib/utils';
import { Building, Phone as PhoneIcon, MapPin, Hash, User as UserIcon, Loader2, Download } from 'lucide-react';
import { toast } from 'sonner';
import ApiService from '@/lib/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function AccountSummaryPage() {
  const { user, isHydrated: authHydrated } = useAuth();
  const { companies, getCompanyLedger } = useData();
  const [downloadLoading, setDownloadLoading] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);

  const currentCompany = useMemo(() => {
    if (user?.role === 'company' && user.id) {
      return companies.find(c => String(c.id) === String(user.id)) || companies[0];
    }
    return companies[0];
  }, [user, companies]);

  const ledger = useMemo(() => {
    if (!currentCompany) return [];
    return getCompanyLedger(currentCompany.id);
  }, [currentCompany, getCompanyLedger]);

  const summary = useMemo(() => {
    const totalDebit = ledger.reduce((sum, entry) => sum + entry.debit, 0);
    const totalCredit = ledger.reduce((sum, entry) => sum + entry.credit, 0);
    return {
      totalDebit,
      totalCredit,
      balance: totalDebit - totalCredit
    };
  }, [ledger]);


  const handleDownload = async () => {
    setDownloadLoading(true);
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
        const maxLogoHeight = 20;
        const maxLogoWidth = 60;
        let logoWidth = img.width;
        let logoHeight = img.height;

        const ratio = Math.min(maxLogoWidth / logoWidth, maxLogoHeight / logoHeight);
        logoWidth *= ratio;
        logoHeight *= ratio;

        pdf.addImage(img, 'PNG', (pageWidth - logoWidth) / 2, 10, logoWidth, logoHeight);
      }

      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.text("Account Statement", pageWidth / 2, 38, { align: "center" });

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");

      pdf.text(`Company: ${currentCompany.name}`, 14, 48);
      pdf.text(`Email: ${currentCompany.email || 'N/A'}`, 14, 54);
      pdf.text(`Phone: ${currentCompany.phone || 'N/A'}`, 14, 60);
      pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 66);

      let body = ledger.map((entry) => [
        formatDate(entry.date),
        entry.description,
        entry.debit > 0 ? entry.debit.toLocaleString() : '-',
        entry.credit > 0 ? entry.credit.toLocaleString() : '-',
        entry.balance.toLocaleString()
      ]);

      if (body.length === 0) {
        body.push(['-', 'No records found', '-', '-', '-']);
      }

      autoTable(pdf, {
        startY: 74,
        head: [['Date', 'Description', 'Debit', 'Credit', 'Balance']],
        body: body,
        theme: 'grid',
        headStyles: { fillColor: [44, 62, 80], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 20 },
          2: { halign: 'right' },
          3: { halign: 'right' },
          4: { halign: 'right', fontStyle: 'bold' }
        },
        didParseCell: function (data) {
          if (data.section === 'body') {
            if (data.column.index === 4) {
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

      // Add Summary Totals at the bottom
      const finalY = (pdf as any).lastAutoTable.finalY || 74;

      pdf.setFontSize(11);
      pdf.setFont("helvetica", "bold");
      pdf.text("Summary Totals", 14, finalY + 10);

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");

      pdf.text(`Total Debit:   PKR ${summary.totalDebit.toLocaleString()}`, 14, finalY + 18);
      pdf.text(`Total Credit:  PKR ${summary.totalCredit.toLocaleString()}`, 14, finalY + 24);

      pdf.setFont("helvetica", "bold");
      pdf.text(`Balance:       PKR ${summary.balance.toLocaleString()}`, 14, finalY + 30);

      pdf.save(`Account_Statement_${currentCompany.name.replace(/[/\\?%*:|"<>\s]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success("Statement downloaded successfully");
    } catch (err) {
      console.error('Failed to export PDF', err);
      toast.error("Failed to generate PDF.");
    } finally {
      setDownloadLoading(false);
    }
  };
  if (!authHydrated || !currentCompany) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center text-muted-foreground">Loading summary...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div ref={summaryRef} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 bg-background/50 relative">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-display">Account Summary</h1>
          <p className="text-muted-foreground mt-1">
            Complete account overview for <span className="text-primary font-bold">{currentCompany.name}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-lg border-primary/5">
              <CardHeader className="border-b bg-muted/20">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building className="w-5 h-5 text-primary" />
                  Company Registration Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Registered Name</p>
                    <p className="font-bold text-xl text-foreground">{currentCompany.name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Account Status</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="flex h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse" />
                      <p className="font-bold text-green-600">{currentCompany.status || 'Active'}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-dashed">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Company ID / Identifier</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Hash className="w-3.5 h-3.5 text-muted-foreground" />
                      <p className="font-mono font-bold text-primary">{currentCompany.identifier || `C${currentCompany.id}`}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">NTN Number</p>
                    <p className="font-bold text-foreground">{currentCompany.ntn || 'N/A'}</p>
                  </div>
                </div>

                <div className="space-y-1 pt-2 border-t border-dashed">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Business Email</p>
                  <p className="font-semibold text-foreground mt-1">{currentCompany.email}</p>
                </div>

                <div className="space-y-1 pt-2 border-t border-dashed">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Contact Phone</p>
                  <div className="flex items-center gap-2 mt-1">
                    <PhoneIcon className="w-3.5 h-3.5 text-muted-foreground" />
                    <p className="font-semibold text-foreground">{currentCompany.phone}</p>
                  </div>
                </div>

                <div className="space-y-1 pt-2 border-t border-dashed">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Registered Address</p>
                  <div className="flex items-start gap-2 mt-1">
                    <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <p className="font-semibold text-foreground leading-snug">{currentCompany.address || 'Address not provided'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-primary/5 overflow-hidden">
              <CardHeader className="border-b bg-muted/20">
                <CardTitle className="text-lg flex items-center gap-2">
                  <UserIcon className="w-5 h-5 text-primary" />
                  Access Credentials
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Client Portal Username</p>
                  <p className="font-mono font-bold text-primary text-lg">{currentCompany.username}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Account Created</p>
                  <p className="font-semibold">{formatDate(currentCompany.createdAt)}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="shadow-2xl border-0 bg-primary text-primary-foreground overflow-hidden group relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16 group-hover:scale-120 transition-transform duration-700" />
              <CardHeader>
                <CardTitle className="text-base font-bold uppercase tracking-[0.2em] opacity-80">Financial Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <p className="text-xs font-medium text-white/70 mb-1 leading-none uppercase tracking-widest">Total Debit (Billed)</p>
                  <p className="text-3xl font-black font-mono tracking-tighter">
                    PKR {summary.totalDebit.toLocaleString()}
                  </p>
                </div>
                <div className="h-px bg-white/20" />
                <div>
                  <p className="text-xs font-medium text-white/70 mb-1 leading-none uppercase tracking-widest">Total Credit (Paid)</p>
                  <p className="text-3xl font-black font-mono tracking-tighter">
                    PKR {summary.totalCredit.toLocaleString()}
                  </p>
                </div>
                <div className="h-px bg-white/20" />
                <div className="bg-white/10 p-4 rounded-xl border border-white/20">
                  <p className="text-xs font-black text-white/90 mb-2 leading-none uppercase tracking-widest">Current Outstanding</p>
                  <p className="text-4xl font-black font-mono tracking-tighter text-yellow-300 drop-shadow-md">
                    PKR {summary.balance.toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-primary/5">
              <CardHeader>
                <CardTitle className="text-base">Quick Reports</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="default"
                  className="w-full h-11 justify-start gap-4 font-bold transition-all"
                  onClick={handleDownload}
                  disabled={downloadLoading}
                >
                  {downloadLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  Download Report (PDF)
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
