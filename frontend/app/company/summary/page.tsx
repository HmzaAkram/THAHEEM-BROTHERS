'use client';

import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useData } from '@/context/data-context';
import { useAuth } from '@/context/auth-context';
import { useMemo } from 'react';
import { formatDate } from '@/lib/utils';
import { Download, Mail, Building, Phone as PhoneIcon, MapPin, Hash, User as UserIcon, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import ApiService from '@/lib/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function AccountSummaryPage() {
  const { user, isHydrated: authHydrated } = useAuth();
  const { companies, getCompanyLedger } = useData();
  const ledgerRef = useRef<HTMLDivElement>(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);

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

  const handleDownloadStatement = async () => {
    if (!ledgerRef.current) return;
    setDownloadLoading(true);

    try {
      // Ensure the hidden element is visible for capture (it's off-screen but needs to be rendered)
      const dataUrl = await toPng(ledgerRef.current, { cacheBust: true, style: { background: 'white', padding: '20px' } });
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Account_Statement_${currentCompany.name}_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('Statement downloaded successfully');
    } catch (err) {
      console.error('Failed to export PDF', err);
      toast.error('Failed to generate statement. Please try again.');
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleRequestEmail = async () => {
    if (!currentCompany.email) {
      toast.error("No email address found for this company.");
      return;
    }

    setEmailLoading(true);
    try {
      const response = await ApiService.post('/company/request-ledger-email', {});
      if (response.message) {
        toast.success(response.message);
      } else {
        toast.success("Ledger has been emailed to your registered address.");
      }
    } catch (error) {
      console.error("Email request failed:", error);
      toast.error("Failed to make request. Please contact admin.");
    } finally {
      setEmailLoading(false);
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
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                  <div className="flex items-center gap-2 mt-1">
                    <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                    <p className="font-semibold text-foreground">{currentCompany.email}</p>
                  </div>
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
            <Card className="shadow-2xl border-0 bg-primary text-primary-foreground overflow-hidden group">
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
                  className="w-full h-11 justify-start gap-4 font-bold shadow-md hover:scale-[1.02] transition-transform"
                  onClick={handleDownloadStatement}
                  disabled={downloadLoading}
                >
                  {downloadLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  Download Statement
                </Button>
                <Button
                  variant="outline"
                  className="w-full h-11 justify-start gap-4 font-bold border-primary/20 hover:bg-primary/5 hover:text-primary transition-all"
                  onClick={handleRequestEmail}
                  disabled={emailLoading}
                >
                  {emailLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                  Request Ledger Email
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Hidden Ledger Table for PDF Generation */}
      <div style={{ position: 'fixed', left: '-9999px', top: 0, width: '210mm', height: 'auto', overflow: 'hidden', visibility: 'hidden' }}>
        <div ref={ledgerRef} className="bg-white p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">{currentCompany.name} - Account Statement</h1>
            <p className="text-sm text-gray-500">Generated on {new Date().toLocaleDateString()}</p>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6 border p-4 rounded-lg bg-gray-50">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Total Debit</p>
              <p className="text-lg font-bold">PKR {summary.totalDebit.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Total Credit</p>
              <p className="text-lg font-bold">PKR {summary.totalCredit.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Outstanding Balance</p>
              <p className="text-lg font-bold text-primary">PKR {summary.balance.toLocaleString()}</p>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Debit</TableHead>
                <TableHead className="text-right">Credit</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ledger.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>{formatDate(entry.date)}</TableCell>
                  <TableCell>{entry.description}</TableCell>
                  <TableCell className="text-right">{entry.debit > 0 ? entry.debit.toLocaleString() : '-'}</TableCell>
                  <TableCell className="text-right">{entry.credit > 0 ? entry.credit.toLocaleString() : '-'}</TableCell>
                  <TableCell className="text-right font-bold">{entry.balance.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
}
