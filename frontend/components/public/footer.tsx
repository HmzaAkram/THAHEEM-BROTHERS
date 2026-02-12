import Link from 'next/link';
import { Mail, Phone, MapPin, Facebook, Linkedin, Twitter } from 'lucide-react';

export function PublicFooter() {
    return (
        <footer className="bg-muted/30 border-t pt-16 pb-8">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
                    {/* Company Info */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="bg-primary text-primary-foreground font-bold text-lg px-2 py-0.5 rounded-md">
                                TB
                            </div>
                            <span className="font-bold text-lg">THAHEEM BROTHERS</span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Your trusted partner in global logistics, freight forwarding, and
                            customs clearance solutions. Delivering excellence since 1995.
                        </p>
                        <div className="flex gap-4">
                            <Link
                                href="#"
                                className="text-muted-foreground hover:text-primary transition-colors"
                            >
                                <Facebook className="h-5 w-5" />
                            </Link>
                            <Link
                                href="#"
                                className="text-muted-foreground hover:text-primary transition-colors"
                            >
                                <Linkedin className="h-5 w-5" />
                            </Link>
                            <Link
                                href="#"
                                className="text-muted-foreground hover:text-primary transition-colors"
                            >
                                <Twitter className="h-5 w-5" />
                            </Link>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="font-semibold mb-4">Quick Links</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link
                                    href="/"
                                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                                >
                                    Home
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/about"
                                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                                >
                                    About Us
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/services"
                                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                                >
                                    Services
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/contact"
                                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                                >
                                    Contact
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/login"
                                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                                >
                                    Client Portal
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Services */}
                    <div>
                        <h3 className="font-semibold mb-4">Our Services</h3>
                        <ul className="space-y-2">
                            <li className="text-sm text-muted-foreground">Customs Clearance</li>
                            <li className="text-sm text-muted-foreground">Freight Forwarding</li>
                            <li className="text-sm text-muted-foreground">Import & Export</li>
                            <li className="text-sm text-muted-foreground">Warehousing</li>
                            <li className="text-sm text-muted-foreground">Licensed Brokerage</li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h3 className="font-semibold mb-4">Contact Us</h3>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3 text-sm text-muted-foreground">
                                <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                <span>R.K Ext Suit# 2/23 2nd Floor, Shahrah-e-Liaquat, Karachi</span>
                            </li>
                            <li className="flex items-center gap-3 text-sm text-muted-foreground">
                                <Phone className="h-5 w-5 text-primary shrink-0" />
                                <span>+92 (021) 32421347</span>
                            </li>
                            <li className="flex items-center gap-3 text-sm text-muted-foreground">
                                <Mail className="h-5 w-5 text-primary shrink-0" />
                                <span>Import.khi@hotmail.com</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t pt-8 text-center text-sm text-muted-foreground">
                    <p>
                        &copy; {new Date().getFullYear()} THAHEEM BROTHERS. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}
