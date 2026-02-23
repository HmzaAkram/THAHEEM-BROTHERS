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
import { Plus, Edit2, Eye, Trash2, Search, ArrowRight, Calendar, DollarSign, Users, CreditCard, TrendingUp, Filter } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useData } from '@/context/data-context';
import { useRouter } from 'next/navigation';
import { DashboardCard } from '@/components/dashboard-card';
import { formatDate, formatCurrency } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PinDialog } from '@/components/pin-dialog';
import Swal from 'sweetalert2';

export default function CompaniesPage() {
  const { companies, bills, payments, addCompany, deleteCompany, getCompanyBalance } = useData();
  const router = useRouter();

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [timeShortcut, setTimeShortcut] = useState('overall');

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // New Company Form State
  const [formData, setFormData] = useState({
    name: '',
    ntn: '',
    email: '',
    phone: '',
    address: '',
    username: '',
    password: '',
  });

  // PIN Dialog State
  const [isPinDialogOpen, setIsPinDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const confirmDelete = () => {
    if (deleteTargetId) {
      deleteCompany(deleteTargetId);
      setDeleteTargetId(null);
      setIsPinDialogOpen(false);
    }
  };

  const filteredCompanies = useMemo(() => {
    let filtered = [...companies];

    // Date Filtering (by createdAt)
    if (dateFrom || dateTo) {
      filtered = filtered.filter(c => {
        const createdDate = new Date(c.createdAt).toISOString().split('T')[0];
        if (dateFrom && createdDate < dateFrom) return false;
        if (dateTo && createdDate > dateTo) return false;
        return true;
      });
    }

    // Search Filtering
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (company) =>
          company.name.toLowerCase().includes(q) ||
          company.email.toLowerCase().includes(q) ||
          (company.identifier && company.identifier.toLowerCase().includes(q))
      );
    }

    return filtered;
  }, [companies, searchTerm, dateFrom, dateTo]);

  // Context Totals for Filtered Companies
  const companyTotals = useMemo(() => {
    return filteredCompanies.reduce((acc, company) => {
      // Find all bills for this company
      let companyBills = bills.filter(b => b.companyId === company.id);
      // Find all payments for this company
      let companyPayments = payments.filter(p => p.companyId === company.id);

      // Apply date filters to the activity if set
      if (dateFrom || dateTo) {
        companyBills = companyBills.filter(b => {
          const d = new Date(b.date).toISOString().split('T')[0];
          if (dateFrom && d < dateFrom) return false;
          if (dateTo && d > dateTo) return false;
          return true;
        });
        companyPayments = companyPayments.filter(p => {
          const d = new Date(p.date).toISOString().split('T')[0];
          if (dateFrom && d < dateFrom) return false;
          if (dateTo && d > dateTo) return false;
          return true;
        });
      }

      // Sum totals
      const billed = companyBills.reduce((s, b) => s + (Number(b.grandTotal) || 0), 0);
      const advances = companyBills.reduce((s, b) => s + (Number(b.advancePayment) || 0), 0);
      const paymentReceived = companyPayments.reduce((s, p) => s + (Number(p.amount) || 0) + (Number(p.adjustment) || 0), 0);

      const totalCollected = advances + paymentReceived;

      acc.billed += billed;
      acc.collected += totalCollected;
      acc.outstanding += (billed - totalCollected);
      return acc;
    }, { billed: 0, collected: 0, outstanding: 0, count: filteredCompanies.length });
  }, [filteredCompanies, bills, payments, dateFrom, dateTo]);

  const handleTimeShortcut = (val: string) => {
    setTimeShortcut(val);
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    if (val === 'today') {
      setDateFrom(today);
      setDateTo(today);
    } else if (val === 'monthly') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      setDateFrom(startOfMonth);
      setDateTo(today);
    } else if (val === 'overall') {
      setDateFrom('');
      setDateTo('');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.email) return; // Basic validation
    setLoading(true);
    try {
      const result = await addCompany({
        name: formData.name,
        ntn: formData.ntn,
        email: formData.email,
        phone: formData.phone || '',
        address: formData.address || '',
        username: formData.username,
        password: formData.password,
        status: 'Active',
      }) as any;

      if (result.ok) {
        setFormData({ name: '', ntn: '', email: '', phone: '', address: '', username: '', password: '' });
        setIsDialogOpen(false);
      } else {
        Swal.fire({
          title: 'Error',
          text: result.message || "Failed to create company",
          icon: 'error',
          confirmButtonColor: '#3b82f6'
        });
      }
    } catch (error) {
      console.error("Critical failure adding company:", error);
      Swal.fire({
        title: 'Error',
        text: 'A critical error occurred while adding the company.',
        icon: 'error',
        confirmButtonColor: '#3b82f6'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
              Companies
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage all client companies and their credentials
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 shadow-md hover:scale-105 transition-transform">
                <Plus className="w-4 h-4" />
                Add Company
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Company</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Company Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter company name"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ntn">Company NTN</Label>
                    <Input
                      id="ntn"
                      value={formData.ntn}
                      onChange={handleInputChange}
                      placeholder="Enter NTN number"
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Company Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="email@company.com"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Company Phone No</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+92..."
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="address">Company Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Registered address"
                    className="mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      placeholder="Login username"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="text"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Enter password"
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button className="flex-1" onClick={handleSubmit} disabled={loading}>
                    {loading ? "Creating..." : "Create Company"}
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 bg-transparent"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="border-0 shadow-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
          <CardHeader className="pb-2">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 bg-background/50 p-4 rounded-xl border border-border/50">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground mr-2" />
                <Input
                  placeholder="Search companies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-white/50 border-border/40 focus:bg-white transition-all rounded-xl"
                />
              </div>
              <div className="flex flex-wrap gap-3 w-full md:w-auto">
                <div className="flex items-center gap-2">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground hidden lg:block">From</Label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => {
                      setDateFrom(e.target.value);
                      setTimeShortcut('overall');
                    }}
                    className="h-10 w-[140px] bg-white border-border/40 rounded-xl px-3"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground hidden lg:block">To</Label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => {
                      setDateTo(e.target.value);
                      setTimeShortcut('overall');
                    }}
                    className="h-10 w-[140px] bg-white border-border/40 rounded-xl px-3"
                  />
                </div>
                <Select value={timeShortcut} onValueChange={handleTimeShortcut}>
                  <SelectTrigger className="w-[140px] h-10 bg-white border-border/40 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                      <SelectValue placeholder="Period" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="overall">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="monthly">This Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-border/50 overflow-hidden shadow-inner bg-slate-50/50">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[80px]">ID</TableHead>
                      <TableHead>Company Name</TableHead>
                      <TableHead>Email / Login</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCompanies.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No companies found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCompanies.map((company) => {
                        const balance = getCompanyBalance(company.id);
                        return (
                          <TableRow key={company.id} className="group hover:bg-muted/30 transition-colors">
                            <TableCell className="font-mono text-xs text-primary font-bold">
                              {company.identifier || `C${company.id}`}
                            </TableCell>
                            <TableCell className="font-medium text-foreground">
                              {company.name}
                            </TableCell>
                            <TableCell className="text-muted-foreground font-mono text-xs">
                              {company.email}
                            </TableCell>
                            <TableCell>{company.phone}</TableCell>
                            <TableCell className="font-semibold">
                              {formatCurrency((bills.filter(b => b.companyId === company.id).reduce((s, b) => s + (Number(b.grandTotal) || 0), 0)))}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {formatCurrency(
                                bills.filter(b => b.companyId === company.id).reduce((s, b) => s + (Number(b.advancePayment) || 0), 0) +
                                payments.filter(p => p.companyId === company.id).reduce((s, p) => s + (Number(p.amount) || 0) + (Number(p.adjustment) || 0), 0)
                              )}
                            </TableCell>
                            <TableCell className={`font-bold ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {formatCurrency(balance)}
                            </TableCell>
                            <TableCell>
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${company.status === 'Active'
                                  ? 'bg-green-100 text-green-700 border-green-200'
                                  : 'bg-gray-100 text-gray-700 border-gray-200'
                                  }`}
                              >
                                {company.status}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 hover:bg-blue-100"
                                  onClick={() => router.push(`/admin/companies/${company.id}`)}
                                  title="View Details"
                                >
                                  <Eye className="w-4 h-4 text-blue-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 hover:bg-orange-100"
                                  onClick={() => router.push(`/admin/companies/${company.id}`)}
                                  title="Edit Company"
                                >
                                  <Edit2 className="w-4 h-4 text-orange-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 hover:bg-red-100"
                                  onClick={async () => {
                                    const result = await Swal.fire({
                                      title: 'Are you sure?',
                                      text: `Are you sure you want to delete ${company.name}?`,
                                      icon: 'warning',
                                      showCancelButton: true,
                                      confirmButtonColor: '#ef4444',
                                      cancelButtonColor: '#6b7280',
                                      confirmButtonText: 'Yes, delete it!'
                                    });
                                    if (result.isConfirmed) {
                                      setDeleteTargetId(company.id);
                                      setIsPinDialogOpen(true);
                                    }
                                  }}
                                  title="Delete Company"
                                >
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
            <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
              <p>
                Showing {filteredCompanies.length} company records
              </p>
            </div>

            {/* Bottom Summary Totals */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10 border-t pt-10">
              <DashboardCard
                title="Filtered Companies"
                value={companyTotals.count.toString()}
                icon={Users}
                change="Selected Records"
                changeType="neutral"
              />
              <DashboardCard
                title="Total Outstanding"
                value={formatCurrency(companyTotals.outstanding)}
                icon={DollarSign}
                change="Filtered Context"
                changeType="negative"
              />
              <DashboardCard
                title="Total Collected"
                value={formatCurrency(companyTotals.collected)}
                icon={CreditCard}
                change="In selected period"
                changeType="positive"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <PinDialog
        isOpen={isPinDialogOpen}
        onClose={() => {
          setIsPinDialogOpen(false);
          setDeleteTargetId(null);
        }}
        onConfirm={confirmDelete}
        actionTitle="Delete Company"
        description="Are you sure you want to delete this company? This will also remove associated bills and payments permanently."
      />
    </DashboardLayout>
  );
}
