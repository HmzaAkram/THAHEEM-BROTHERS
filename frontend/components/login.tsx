'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/auth-context';
import { useData } from '@/context/data-context';
import { Building2, Lock } from 'lucide-react';

export function Login() {
  const { setRole } = useAuth();
  const { getDashboardStats } = useData();
  const stats = getDashboardStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-lg">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center">
                <Building2 className="w-8 h-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">
              Billing & Accounts
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Clearing & Forwarding Management System
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => setRole('admin')}
              className="w-full h-12 text-base"
            >
              <Lock className="w-4 h-4 mr-2" />
              Admin Access
            </Button>
            <Button
              onClick={() => setRole('company')}
              variant="outline"
              className="w-full h-12 text-base"
            >
              <Building2 className="w-4 h-4 mr-2" />
              Company Access
            </Button>

            <div className="pt-4 text-center">
              <p className="text-xs text-muted-foreground">
                Demo credentials available for both roles
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 grid grid-cols-2 gap-4">
          <Card className="bg-white/80 backdrop-blur border-0 shadow-sm">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{stats.activeCompanies}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Companies
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur border-0 shadow-sm">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">PKR {(stats.outstanding / 1000000).toFixed(1)}M</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Outstanding
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
