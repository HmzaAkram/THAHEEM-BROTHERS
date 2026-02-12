import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'; // Assuming Tabs component exists, if not I'll need to use state. But standard shadcn has it. I'll gamble on it or check. Wait, I saw imports in other files.
// better to allow for missing tabs by using state if I'm not sure. But let's assume standard shadcn setup.
// Actually, to be 100% safe and avoid build errors if Tabs is missing, I will build a custom tab switcher using buttons.
import { useAuth } from '@/context/auth-context';
import { useData } from '@/context/data-context';
import { Building2, Lock, User, Key, Mail, ArrowRight } from 'lucide-react';

export function Login() {
  const { login } = useAuth();
  const { companies, getDashboardStats } = useData();
  const stats = getDashboardStats();

  const [activeTab, setActiveTab] = useState<'admin' | 'company'>('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    setError('');

    if (activeTab === 'admin') {
      if (password === 'admin123') {
        login({
          id: 'admin',
          name: 'Administrator',
          email: 'admin@thaheem.com',
          role: 'admin'
        });
      } else {
        setError('Invalid admin password');
      }
    } else {
      const company = companies.find(c => c.email === email && c.password === password);
      if (company) {
        login({
          id: company.id,
          name: company.name,
          email: company.email,
          role: 'company'
        });
      } else {
        setError('Invalid email or password');
      }
    }
  };

  const handleDemoFill = (type: 'admin' | 'company', idx?: number) => {
    if (type === 'admin') {
      setActiveTab('admin');
      setPassword('admin123');
    } else {
      setActiveTab('company');
      const company = companies[idx || 0];
      if (company) {
        setEmail(company.email);
        setPassword(company.password || 'password123');
      }
    }
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-8">

        {/* Header Section */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg mb-4">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Thaheem Brothers</h1>
          <p className="text-muted-foreground">Logistics & Freight Management System</p>
        </div>

        <Card className="border-0 shadow-2xl overflow-hidden backdrop-blur-sm bg-white/90 dark:bg-slate-950/90">
          <CardHeader className="pb-0">
            <div className="grid grid-cols-2 w-full bg-muted/50 p-1 rounded-lg">
              <Button
                variant={activeTab === 'admin' ? 'default' : 'ghost'}
                className="rounded-md shadow-none"
                onClick={() => setActiveTab('admin')}
              >
                <Lock className="w-4 h-4 mr-2" />
                Admin
              </Button>
              <Button
                variant={activeTab === 'company' ? 'default' : 'ghost'}
                className="rounded-md shadow-none"
                onClick={() => setActiveTab('company')}
              >
                <Building2 className="w-4 h-4 mr-2" />
                Company
              </Button>
            </div>
          </CardHeader>

          <CardContent className="pt-8 space-y-6">
            {activeTab === 'admin' ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-2">
                  <Label>Admin Password</Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="password"
                      placeholder="Enter admin password"
                      className="pl-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
                <div className="space-y-2">
                  <Label>Company Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="company@example.com"
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="password"
                      placeholder="Enter password"
                      className="pl-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    />
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="text-sm text-red-500 font-medium text-center bg-red-50 dark:bg-red-900/20 p-2 rounded">
                {error}
              </div>
            )}

            <Button className="w-full h-11 text-base shadow-lg hover:shadow-xl transition-all" onClick={handleLogin}>
              Sign In <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </CardContent>

          <CardFooter className="bg-muted/30 pt-6 pb-6 flex flex-col items-start gap-4 border-t">
            <div className="w-full">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Quick Login (Demo)</p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" className="h-8 text-xs justify-start" onClick={() => handleDemoFill('admin')}>
                  <Lock className="w-3 h-3 mr-2 text-primary" /> Admin (Pass: admin123)
                </Button>
                {companies.slice(0, 3).map((c, i) => (
                  <Button key={c.id} variant="outline" size="sm" className="h-8 text-xs justify-start truncate" onClick={() => handleDemoFill('company', i)}>
                    <User className="w-3 h-3 mr-2 text-blue-500" /> {c.name.split(' ')[0]}
                  </Button>
                ))}
              </div>
            </div>
          </CardFooter>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur rounded-lg p-4 text-center border shadow-sm">
            <div className="text-2xl font-bold text-primary">{stats.activeCompanies}</div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Companies</div>
          </div>
          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur rounded-lg p-4 text-center border shadow-sm">
            <div className="text-2xl font-bold text-blue-600">{stats.outstanding > 1000000 ? (stats.outstanding / 1000000).toFixed(1) + 'M' : (stats.outstanding / 1000).toFixed(0) + 'K'}</div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Outstanding</div>
          </div>
          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur rounded-lg p-4 text-center border shadow-sm">
            <div className="text-2xl font-bold text-green-600">{(stats.totalCollected / 1000000).toFixed(1)}M</div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Collected</div>
          </div>
        </div>
      </div>
    </div>
  );
}
