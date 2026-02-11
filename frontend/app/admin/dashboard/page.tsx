'use client';

import { DashboardLayout } from '@/components/dashboard-layout';
import { DashboardCard } from '@/components/dashboard-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import {
  TrendingUp,
  DollarSign,
  FileText,
  CreditCard,
  Download,
  Printer,
} from 'lucide-react';

const monthlyData = [
  { month: 'Jan', bills: 450000, payments: 320000 },
  { month: 'Feb', bills: 520000, payments: 380000 },
  { month: 'Mar', bills: 380000, payments: 290000 },
  { month: 'Apr', bills: 690000, payments: 500000 },
  { month: 'May', bills: 850000, payments: 600000 },
  { month: 'Jun', bills: 720000, payments: 580000 },
];

export default function AdminDashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here's an overview of your system.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <DashboardCard
            title="Total Companies"
            value="25"
            icon={TrendingUp}
            change="+3 this month"
            changeType="positive"
          />
          <DashboardCard
            title="Outstanding Balance"
            value="PKR 2.45M"
            icon={DollarSign}
            change="+PKR 150K from last month"
            changeType="neutral"
          />
          <DashboardCard
            title="Bills This Month"
            value="PKR 850K"
            icon={FileText}
            change="12 bills created"
            changeType="neutral"
          />
          <DashboardCard
            title="Payments This Month"
            value="PKR 600K"
            icon={CreditCard}
            change="+15% vs last month"
            changeType="positive"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Monthly Bills vs Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" stroke="var(--muted-foreground)" />
                  <YAxis stroke="var(--muted-foreground)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--border)',
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="bills"
                    fill="var(--primary)"
                    name="Bills"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="payments"
                    fill="var(--chart-2)"
                    name="Payments"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Avg Payment Value</p>
                <p className="text-xl font-bold text-foreground">PKR 40K</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Paid Bills %</p>
                <div className="w-full bg-secondary rounded-full h-2 mt-1">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{ width: '72%' }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">72%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Companies</p>
                <p className="text-xl font-bold text-foreground">23/25</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Outstanding Collections</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={monthlyData}>
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
                    dataKey="bills"
                    stroke="var(--primary)"
                    name="Outstanding"
                    dot={{ fill: 'var(--primary)', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-foreground">
                    Invoice #4544 Created
                  </p>
                  <p className="text-xs text-muted-foreground">
                    THAHEEM BROTHERS • 2 hours ago
                  </p>
                </div>
              </div>
              <div className="h-px bg-border" />
              <div className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-foreground">
                    Payment Received
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PKR 500,000 • 5 hours ago
                  </p>
                </div>
              </div>
              <div className="h-px bg-border" />
              <div className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-foreground">
                    New Company Added
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Import Traders • 1 day ago
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-2">
          <Button className="gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </Button>
          <Button variant="outline" className="gap-2 bg-transparent">
            <Printer className="w-4 h-4" />
            Print Dashboard
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
