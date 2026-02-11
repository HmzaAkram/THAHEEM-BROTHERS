'use client';

import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Download, Mail } from 'lucide-react';

export default function AccountSummaryPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Account Summary
          </h1>
          <p className="text-muted-foreground mt-1">
            Your complete account overview
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Company Name</p>
                    <p className="font-semibold text-foreground mt-1">
                      THAHEEM BROTHERS
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="font-semibold text-green-600 mt-1">Active</p>
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Contact Person
                    </p>
                    <p className="font-semibold text-foreground mt-1">
                      Hamza Khan
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-semibold text-foreground mt-1">
                      Import.khi@hotmail.com
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-semibold text-foreground mt-1">
                      +92(021)32421347
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Address</p>
                    <p className="font-semibold text-foreground mt-1">
                      R.K Ext, Shahrah-e-Liaquat, Karachi
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account Terms</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Payment Terms
                    </p>
                    <p className="font-semibold text-foreground mt-1">
                      30 Days
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Credit Limit
                    </p>
                    <p className="font-semibold text-foreground mt-1">
                      PKR 500,000
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Account Manager
                    </p>
                    <p className="font-semibold text-foreground mt-1">
                      Ahmed Hassan
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Since
                    </p>
                    <p className="font-semibold text-foreground mt-1">
                      January 2024
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Financial Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Debit</p>
                  <p className="text-2xl font-bold text-foreground mt-2">
                    PKR 2.15L
                  </p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground">Total Credit</p>
                  <p className="text-2xl font-bold text-green-600 mt-2">
                    PKR 1.90L
                  </p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground">
                    Outstanding Balance
                  </p>
                  <p className="text-2xl font-bold text-primary mt-2">
                    PKR 250K
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full justify-start gap-2">
                  <Download className="w-4 h-4" />
                  Download Statement
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2 bg-transparent">
                  <Mail className="w-4 h-4" />
                  Email Statement
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
