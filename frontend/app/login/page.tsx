'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import ApiService from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldCheck, Lock, Mail, Loader2 } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [redirecting, setRedirecting] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const { login: authLogin, user, isHydrated } = useAuth();

    useEffect(() => {
        if (isHydrated && user) {
            setRedirecting(true);
            if (user.role === 'admin') {
                router.push('/admin/dashboard');
            } else {
                router.push('/company/dashboard');
            }
        }
    }, [isHydrated, user, router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const result = await ApiService.post('/login', { email, password });

        if (result.ok) {
            const { user, accessToken } = result.data as any;
            authLogin({
                id: user.id.toString(),
                name: user.name,
                email: user.email,
                role: user.role
            }, accessToken);

            // Role-based redirection
            if (user.role === 'admin') {
                router.push('/admin/dashboard');
            } else {
                router.push('/company/dashboard');
            }
        } else {
            setError(result.message);
        }
        setLoading(false);
    };

    if (!isHydrated || redirecting) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4" suppressHydrationWarning>
            <Card className="max-w-md w-full rounded-3xl border-none shadow-2xl p-4">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                        <ShieldCheck className="w-10 h-10 text-primary" />
                    </div>
                    <CardTitle className="text-3xl font-black tracking-tight">Login</CardTitle>
                    <p className="text-muted-foreground text-sm font-medium">THAHEEM BROTHERS Shipping & Logistics</p>
                </CardHeader >
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-6 pt-4">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Email Address</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        type="email"
                                        placeholder="admin@thaheem.com"
                                        className="pl-10 h-12 bg-slate-50 border-none rounded-xl focus-visible:ring-primary/20"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        type="password"
                                        placeholder="••••••••"
                                        className="pl-10 h-12 bg-slate-50 border-none rounded-xl focus-visible:ring-primary/20"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-destructive/10 text-destructive text-xs font-bold p-3 rounded-xl border border-destructive/20 animate-in fade-in slide-in-from-top-1">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full h-12 rounded-xl font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all active:scale-[0.98]"
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Log In to Dashboard'}
                        </Button>

                        <p className="text-center text-[10px] text-muted-foreground uppercase font-black tracking-widest pt-4">
                            Access restricted to authorized personnel only
                        </p>
                    </form>
                </CardContent>
            </Card >
        </div >
    );
}
