'use client';

import { DashboardLayout } from '@/components/dashboard-layout';
import { DashboardCard } from '@/components/dashboard-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Download, DollarSign, FileText, TrendingUp } from 'lucide-react';

const last6Months = [
  { month: 'Aug', amount: 250000 },
  { month: 'Sep', amount: 320000 },
  { month: 'Oct', amount: 275000 },
  { month: 'Nov', amount: 410000 },
  { month: 'Dec', amount: 380000 },
  { month: 'Jan', amount: 450000 },
];

export default function CompanyDashboard() {
  const totalBilled = 2150000;
  const totalPaid = 1900000;
  const outstandingBalance = totalBilled - totalPaid;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            THAHEEM BROTHERS - Welcome to your account portal
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <DashboardCard
            title="Total Billed"
            value={`PKR ${(totalBilled / 100000).toFixed(1)}L`}
            icon={FileText}
            change="All time total"
            changeType="neutral"
          />
          <DashboardCard
            title="Total Paid"
            value={`PKR ${(totalPaid / 100000).toFixed(1)}L`}
            icon={DollarSign}
            change="Payment received"
            changeType="positive"
          />
          <DashboardCard
            title="Outstanding Balance"
            value={`PKR ${outstandingBalance.toLocaleString()}`}
            icon={TrendingUp}
            change="Amount due"
            changeType="neutral"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Activity (Last 6 Months)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={last6Months}>
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
                    dataKey="amount"
                    stroke="var(--primary)"
                    dot={{ fill: 'var(--primary)', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Account Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Account Status</p>
                <p className="text-lg font-bold text-green-600 mt-1">Active</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Payment Terms
                </p>
                <p className="text-lg font-bold text-foreground mt-1">30 Days</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Account Manager
                </p>
                <p className="text-lg font-bold text-foreground mt-1">
                  Ahmed Hassan
                </p>
              </div>
              <div className="pt-2">
                <Button className="w-full bg-transparent" variant="outline" size="sm">
                  Contact Support
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                {
                  bill: 'BILL-001',
                  date: '2026-02-10',
                  amount: 'PKR 250,000',
                  status: 'Paid',
                },
                {
                  bill: 'BILL-005',
                  date: '2026-02-01',
                  amount: 'PKR 320,000',
                  status: 'Unpaid',
                },
                {
                  bill: 'BILL-009',
                  date: '2026-01-15',
                  amount: 'PKR 175,000',
                  status: 'Paid',
                },
              ].map((invoice, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-secondary rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">{invoice.bill}</p>
                    <p className="text-xs text-muted-foreground">
                      {invoice.date}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">{invoice.amount}</p>
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded ${
                        invoice.status === 'Paid'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {invoice.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Button className="gap-2">
          <Download className="w-4 h-4" />
          Download Statement
        </Button>
      </div>
    </DashboardLayout>
  );
}
