'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';
import { Moon, Sun, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/context/auth-context';

export function PublicNavbar() {
    const pathname = usePathname();
    const { theme, setTheme } = useTheme();
    const { user, isHydrated } = useAuth();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { name: 'About Us', href: '/about' },
        { name: 'Services', href: '/services' },
        { name: 'Contact', href: '/contact' },
    ];

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
                ? 'bg-background/80 backdrop-blur-md border-b shadow-sm'
                : 'bg-transparent'
                }`}
        >
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2">
                    <div className="bg-primary text-primary-foreground font-bold text-xl px-3 py-1 rounded-md">
                        TB
                    </div>
                    <span className="font-bold text-lg hidden sm:block">
                        THAHEEM BROTHERS
                    </span>
                </Link>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-8 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            href={link.href}
                            className={`text-sm font-medium transition-colors hover:text-primary ${pathname === link.href
                                ? 'text-primary'
                                : 'text-muted-foreground'
                                }`}
                        >
                            {link.name}
                        </Link>
                    ))}
                </div>

                {/* Actions */}
                <div className="hidden md:flex items-center gap-4">
                    {isHydrated && user ? (
                        <Link href={user.role === 'admin' ? '/admin/dashboard' : '/company/dashboard'}>
                            <Button>Dashboard</Button>
                        </Link>
                    ) : (
                        <Link href="/login">
                            <Button>Login</Button>
                        </Link>
                    )}
                </div>

                {/* Mobile Menu Toggle */}
                <div className="md:hidden flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? (
                            <X className="h-6 w-6" />
                        ) : (
                            <Menu className="h-6 w-6" />
                        )}
                    </Button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-background border-b p-4 absolute w-full flex flex-col gap-4 shadow-lg animate-in slide-in-from-top-5">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            href={link.href}
                            className={`text-sm font-medium p-2 rounded-md hover:bg-muted transition-colors ${pathname === link.href
                                ? 'text-primary bg-muted/50'
                                : 'text-muted-foreground'
                                }`}
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            {link.name}
                        </Link>
                    ))}
                    <div className="pt-2 border-t">
                        {isHydrated && user ? (
                            <Link href={user.role === 'admin' ? '/admin/dashboard' : '/company/dashboard'} onClick={() => setIsMobileMenuOpen(false)}>
                                <Button className="w-full">Dashboard</Button>
                            </Link>
                        ) : (
                            <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                                <Button className="w-full">Login</Button>
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}
