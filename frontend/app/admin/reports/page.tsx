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
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Download, Printer } from 'lucide-react';
import { useState } from 'react';

const outstandingData = [
  { company: 'THAHEEM BROTHERS', outstanding: 0, bills: 7, daysOverdue: 0 },
  { company: 'Import Traders', outstanding: 65500, bills: 3, daysOverdue: 10 },
  { company: 'Global Freight Co', outstanding: 450000, bills: 1, daysOverdue: 38 },
  { company: 'Karachi Logistics', outstanding: 0, bills: 1, daysOverdue: 0 },
  { company: 'Orient Shipping', outstanding: 320000, bills: 2, daysOverdue: 28 },
  {
    company: 'Metro Cargo Services',
    outstanding: 0,
    bills: 1,
    daysOverdue: 0,
  },
  { company: 'Express Imports Ltd', outstanding: 100000, bills: 2, daysOverdue: 18 },
  {
    company: 'Trade Hub International',
    outstanding: 435000,
    bills: 1,
    daysOverdue: 45,
  },
];

const timeSeriesData = [
  { month: 'Jan', outstanding: 850000 },
  { month: 'Feb', outstanding: 935000 },
  { month: 'Mar', outstanding: 780000 },
  { month: 'Apr', outstanding: 1050000 },
  { month: 'May', outstanding: 1200000 },
  { month: 'Jun', outstanding: 945000 },
];

export default function ReportsPage() {
  const [dateFrom, setDateFrom] = useState('2026-01-01');
  const [dateTo, setDateTo] = useState('2026-02-12');
  const [reportType, setReportType] = useState('outstanding');

  const totalOutstanding = outstandingData.reduce(
    (sum, item) => sum + item.outstanding,
    0
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports</h1>
          <p className="text-muted-foreground mt-1">
            Generate and view system reports
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Report Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="report-type" className="text-sm">
                  Report Type
                </Label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="outstanding">
                      Outstanding Balance
                    </SelectItem>
                    <SelectItem value="bills">Bills by Date</SelectItem>
                    <SelectItem value="payments">Payments by Date</SelectItem>
                    <SelectItem value="company">Company Ledger</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="date-from" className="text-sm">
                  From
                </Label>
                <Input
                  id="date-from"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="date-to" className="text-sm">
                  To
                </Label>
                <Input
                  id="date-to"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="flex items-end gap-2">
                <Button className="flex-1">Generate</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Outstanding Balance Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" stroke="var(--muted-foreground)" />
                  <YAxis stroke="var(--muted-foreground)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--border)',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="outstanding"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Summary Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground">
                  Total Outstanding
                </p>
                <p className="text-2xl font-bold text-primary mt-1">
                  PKR {totalOutstanding.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  Overdue Invoices
                </p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {outstandingData.filter((item) => item.daysOverdue > 0).length}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  Avg Days Overdue
                </p>
                <p className="text-2xl font-bold text-orange-600 mt-1">
                  {(
                    outstandingData.reduce((sum, item) => sum + item.daysOverdue, 0) /
                    outstandingData.length
                  ).toFixed(0)}{' '}
                  days
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Outstanding by Company</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                  <Download className="w-4 h-4" />
                  Export
                </Button>
                <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                  <Printer className="w-4 h-4" />
                  Print
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead className="text-right">Outstanding</TableHead>
                    <TableHead className="text-right"># Bills</TableHead>
                    <TableHead className="text-right">Days Overdue</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {outstandingData.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{item.company}</TableCell>
                      <TableCell className="text-right font-semibold">
                        PKR {item.outstanding.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">{item.bills}</TableCell>
                      <TableCell className="text-right">
                        {item.daysOverdue > 0 ? (
                          <span className="text-red-600 font-semibold">
                            {item.daysOverdue} days
                          </span>
                        ) : (
                          <span className="text-green-600">Current</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.outstanding > 300000
                              ? 'bg-red-100 text-red-800'
                              : item.outstanding > 100000
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                        >
                          {item.outstanding > 300000
                            ? 'High Risk'
                            : item.outstanding > 100000
                              ? 'Medium'
                              : 'Low Risk'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
