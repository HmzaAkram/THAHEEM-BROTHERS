'use client';

import { Suspense, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useData } from '@/context/data-context';
import { useSearchParams, useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Building2,
    Mail,
    Phone,
    MapPin,
    Lock,
    TrendingUp,
    FileText,
    DollarSign,
    Edit,
    Save,
    X,
    Loader2
} from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { formatDate } from '@/lib/utils';

export default function CompanyDetailsPage() {
    return (
        <Suspense fallback={
            <DashboardLayout>
                <div className="flex h-[60vh] items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        }>
            <CompanyDetailsContent />
        </Suspense>
    );
}

function CompanyDetailsContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { companies, getCompanyLedger, updateCompany } = useData();
    const companyId = searchParams.get('id') as string;

    const company = companies.find((c) => String(c.id) === companyId);
    const ledger = useMemo(() => getCompanyLedger(companyId), [companyId, getCompanyLedger]);

    const [isEditing, setIsEditing] = useState(false);
    const [editedCompany, setEditedCompany] = useState<any>(null);

    const stats = useMemo(() => {
        const totalBilled = ledger.filter(l => l.type === 'BILL').reduce((sum, l) => sum + l.debit, 0);
        const totalPaid = ledger.filter(l => l.type === 'PAYMENT').reduce((sum, l) => sum + l.credit, 0);
        const outstanding = totalBilled - totalPaid;
        return { totalBilled, totalPaid, outstanding };
    }, [ledger]);

    // Chart Data preparation (cumulative balance over time)
    const chartData = useMemo(() => {
        return ledger.map(entry => ({
            date: formatDate(entry.date),
            balance: entry.balance
        }));
    }, [ledger]);

    if (!company) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                    <h2 className="text-2xl font-bold mb-2">Company Not Found</h2>
                    <Button onClick={() => router.back()} variant="outline">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Companies
                    </Button>
                </div>
            </DashboardLayout>
        );
    }

    const handleEditClick = () => {
        setEditedCompany({ ...company });
        setIsEditing(true);
    }

    const handleSaveClick = () => {
        updateCompany(company.id, editedCompany);
        setIsEditing(false);
    }

    return (
        <DashboardLayout>
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" className="h-10 w-10 p-0 rounded-full hover:bg-muted" onClick={() => router.back()}>
                        <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
                            Company Profile
                        </h1>
                        <p className="text-muted-foreground">Detailed view of {company.name}</p>
                    </div>
                    <Badge variant="outline" className="text-xl px-4 py-1 font-mono border-primary/20 text-primary bg-primary/5">
                        {company.identifier || `C${company.id}`}
                    </Badge>
                    <div className="ml-auto flex gap-2">
                        {!isEditing ? (
                            <Button variant="outline" className="gap-2" onClick={handleEditClick}>
                                <Edit className="w-4 h-4" /> Edit Details
                            </Button>
                        ) : (
                            <>
                                <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                                <Button className="gap-2" onClick={handleSaveClick}>
                                    <Save className="w-4 h-4" /> Save Company
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Company Info */}
                    <div className="space-y-6">
                        <Card className="shadow-lg border-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                    <Building2 className="w-5 h-5 text-primary" />
                                    Company Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {isEditing ? (
                                    <div className="space-y-3">
                                        <div>
                                            <Label>Company Name</Label>
                                            <Input
                                                value={editedCompany.name}
                                                onChange={(e) => setEditedCompany({ ...editedCompany, name: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <Label>Company NTN</Label>
                                            <Input
                                                value={editedCompany.ntn || ''}
                                                onChange={(e) => setEditedCompany({ ...editedCompany, ntn: e.target.value })}
                                                placeholder="Enter NTN number"
                                            />
                                        </div>
                                        <div>
                                            <Label>Company Email</Label>
                                            <Input
                                                value={editedCompany.email}
                                                onChange={(e) => setEditedCompany({ ...editedCompany, email: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <Label>Company Phone</Label>
                                            <Input
                                                value={editedCompany.phone}
                                                onChange={(e) => setEditedCompany({ ...editedCompany, phone: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <Label>Company Address</Label>
                                            <Input
                                                value={editedCompany.address}
                                                onChange={(e) => setEditedCompany({ ...editedCompany, address: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <Label>Username</Label>
                                            <Input
                                                value={editedCompany.username || ''}
                                                onChange={(e) => setEditedCompany({ ...editedCompany, username: e.target.value })}
                                                placeholder="Login username"
                                            />
                                        </div>
                                        <div>
                                            <Label>Password</Label>
                                            <Input
                                                value={editedCompany.password || ''}
                                                onChange={(e) => setEditedCompany({ ...editedCompany, password: e.target.value })}
                                                placeholder="Leave blank to keep current"
                                            />
                                        </div>
                                        <div>
                                            <Label>Opening Balance</Label>
                                            <Input
                                                type="number"
                                                value={editedCompany.openingBalance || ''}
                                                onChange={(e) => setEditedCompany({ ...editedCompany, openingBalance: Number(e.target.value) })}
                                                placeholder="Enter opening balance"
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Label>Status</Label>
                                            <select
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                value={editedCompany.status}
                                                onChange={(e) => setEditedCompany({ ...editedCompany, status: e.target.value })}
                                            >
                                                <option value="Active">Active</option>
                                                <option value="Inactive">Inactive</option>
                                            </select>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="space-y-1">
                                            <p className="text-xs text-muted-foreground uppercase tracking-wider">Company Name</p>
                                            <p className="font-medium text-lg">{company.name}</p>
                                        </div>
                                        {company.ntn && (
                                            <>
                                                <Separator />
                                                <div className="space-y-1">
                                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Company NTN</p>
                                                    <p className="font-medium">{company.ntn}</p>
                                                </div>
                                            </>
                                        )}
                                        <Separator />
                                        <div className="space-y-1">
                                            <p className="text-xs text-muted-foreground uppercase tracking-wider">Company Email</p>
                                            <p className="font-medium break-all">{company.email}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                                <Phone className="w-3 h-3" /> Company Phone
                                            </p>
                                            <p className="font-medium break-all">{company.phone}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                                <MapPin className="w-3 h-3" /> Company Address
                                            </p>
                                            <p className="font-medium break-words">{company.address}</p>
                                        </div>
                                        <Separator />
                                        <div className="space-y-1">
                                            <p className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                                <DollarSign className="w-3 h-3" /> Opening Balance
                                            </p>
                                            <p className="font-medium">{(company.openingBalance || 0).toLocaleString()}</p>
                                        </div>
                                        <Separator />
                                        <div className="space-y-1">
                                            <p className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                                <Mail className="w-3 h-3" /> Login Credentials
                                            </p>
                                            <div className="bg-muted/50 p-3 rounded-md border border-border/50 space-y-2">
                                                {company.username && (
                                                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1">
                                                        <span className="text-sm text-muted-foreground">Username:</span>
                                                        <span className="font-mono text-sm break-all">{company.username}</span>
                                                    </div>
                                                )}
                                                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1">
                                                    <span className="text-sm text-muted-foreground">Email:</span>
                                                    <span className="font-mono text-sm break-all">{company.email}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-muted-foreground">Password:</span>
                                                    <span className="font-mono text-sm flex items-center gap-1 text-orange-600 bg-orange-50 px-2 rounded">
                                                        <Lock className="w-3 h-3" />
                                                        {company.password || '••••••'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <Separator />
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-muted-foreground uppercase tracking-wider">Status:</span>
                                            <Badge variant={company.status === 'Active' ? 'default' : 'secondary'} className={company.status === 'Active' ? 'bg-green-600 hover:bg-green-700' : ''}>
                                                {company.status}
                                            </Badge>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="shadow-lg border-0 bg-gradient-to-br from-primary/90 to-blue-800 text-white">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold text-white/90">Financial Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-blue-200 text-sm">Outstanding Balance</p>
                                        <h3 className="text-3xl font-bold mt-1">{stats.outstanding.toLocaleString()}</h3>
                                    </div>
                                    <TrendingUp className="w-8 h-8 text-blue-300 opacity-50" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                                        <p className="text-blue-200 text-xs">Total Billed</p>
                                        <p className="font-semibold text-lg">{stats.totalBilled.toLocaleString()}</p>
                                    </div>
                                    <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                                        <p className="text-blue-200 text-xs">Total Paid</p>
                                        <p className="font-semibold text-lg">{stats.totalPaid.toLocaleString()}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Ledger and History */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Chart */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Balance Trend</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[250px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                                            <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                                            <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000}k`} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                                            />
                                            <Line type="monotone" dataKey="balance" stroke="hsl(var(--primary))" strokeWidth={3} dot={false} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Ledger Table */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>Recent Transactions</CardTitle>
                                    <Button variant="outline" size="sm" onClick={() => router.push('/admin/ledger')}>View Full Ledger</Button>
                                </div>
                            </CardHeader>
                            <CardContent>
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
                                        {ledger.slice().reverse().slice(0, 5).map((entry) => (
                                            <TableRow key={entry.id}>
                                                <TableCell className="font-medium text-xs">{formatDate(entry.date)}</TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{entry.description}</span>
                                                        <span className="text-[10px] text-muted-foreground uppercase">{entry.type}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right text-red-600 font-medium">
                                                    {entry.debit > 0 ? entry.debit.toLocaleString() : '-'}
                                                </TableCell>
                                                <TableCell className="text-right text-green-600 font-medium">
                                                    {entry.credit > 0 ? entry.credit.toLocaleString() : '-'}
                                                </TableCell>
                                                <TableCell className="text-right font-bold">
                                                    {entry.balance.toLocaleString()}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
