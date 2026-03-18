import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Award, Target, Users, History, Globe, Mail, Phone, MapPin,
    Shield, Ship, Headphones, DollarSign, Activity, CheckCircle
} from 'lucide-react';

export default function AboutPage() {
    return (
        <div className="container px-4 py-16">


            <div className="max-w-4xl mx-auto space-y-20">
                {/* Header */}
                <div className="text-center space-y-6">
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
                        About Thaheem Brothers
                    </h1>
                    <p className="text-lg md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                        A decade of excellence, innovation, and client trust in customs brokerage and freight forwarding.
                    </p>
                </div>

                {/* Company Overview */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div className="prose prose-lg dark:prose-invert">
                        <p className="text-lg md:text-xl leading-relaxed font-semibold text-foreground">
                            Thaheem Brothers is one of Pakistan's leading licensed customs brokerage and freight forwarding companies, built on a decade of excellence, innovation, and client trust.
                        </p>
                        <p className="text-muted-foreground">
                            Established to redefine industry standards, we offer comprehensive, tailor-made logistics solutions that combine reliability, cost-effectiveness, and compliance under one roof. With over 10 years of experience and an expanding international footprint, Thaheem Brothers proudly serves a diverse portfolio of national and multinational clients across various industries including textiles, IT, engineering, and more.
                        </p>
                    </div>
                    <div className="relative h-[300px] md:h-[450px] rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-primary/5 group">
                        <div className="absolute inset-0 bg-[url('/logo.jpeg')] bg-cover bg-center transition-transform duration-700 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    </div>
                </div>

                {/* Mission & Vision */}
                <div className="bg-slate-50 -mx-4 px-4 py-16 rounded-3xl">
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-3xl font-bold text-center mb-12">Our Guiding Principles</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
                            <Card className="bg-white border-0 shadow-md">
                                <CardHeader>
                                    <Target className="h-10 w-10 text-primary mb-2" />
                                    <CardTitle>Our Mission</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    To deliver seamless, efficient, and intelligent supply chain services by blending industry knowledge with cutting-edge logistics and a human-centric approach.
                                </CardContent>
                            </Card>
                            <Card className="bg-white border-0 shadow-md">
                                <CardHeader>
                                    <Award className="h-10 w-10 text-primary mb-2" />
                                    <CardTitle>Our Vision</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    To be a global leader in innovative and integrated freight forwarding, customs clearance, and logistics solutions.
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>

                {/* CEO Message */}
                <div>
                    <h2 className="text-3xl font-bold mb-12 text-center">Message From The CEO</h2>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
                        <div className="md:col-span-5">
                            <div className="relative h-[500px] bg-muted rounded-2xl overflow-hidden shadow-xl">
                                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('/ceo.jpeg')` }} />
                            </div>
                        </div>
                        <div className="md:col-span-7 space-y-6">
                            <h3 className="text-3xl font-bold">Rana Irfan Ali</h3>
                            <p className="text-primary font-bold text-xl uppercase tracking-wider">Chief Executive Officer</p>
                            <div className="prose prose-lg dark:prose-invert">
                                <blockquote className="border-l-4 border-primary pl-6 italic text-muted-foreground text-lg leading-relaxed">
                                    "When we founded Thaheem Brothers, we set out not just to provide freight services—but to make a difference. Our purpose was clear: to go beyond the conventional and offer customized, client-centric solutions. Over the past decade, our relentless focus on quality, trust, and efficiency has enabled us to become a recognized force in the freight and logistics industry."
                                </blockquote>
                                <p className="text-foreground leading-relaxed">
                                    "As we move into the global market, we remain committed to innovation, collaboration, and customer satisfaction. I extend my heartfelt thanks to our clients, partners, and team—whose continued loyalty and trust have brought us this far."
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Our Team */}
                <div className="space-y-16">
                    <div className="text-center space-y-4">
                        <h2 className="text-3xl font-bold">Our Professional Team</h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            Meet the dedicated professionals who ensure your logistics operations run smoothly across all touchpoints.
                        </p>
                    </div>

                    {[
                        {
                            title: "Office Team",
                            members: [
                                { name: "Rana Irfan Ali", role: "CEO", image: "/Office Staff/Irfan.jpg" },
                                { name: "Nadeem Ahmed", role: "COO", image: "/Office Staff/Nadeem.jpg" },
                                { name: "Munwar Ali", role: "GM", image: "/Office Staff/Munwar.png" },
                                { name: "Zakria Owais", role: "IT" },
                                { name: "Imran Ali", role: "Operations", image: "/Office Staff/Imran.jpeg" },
                                { name: "Arbab Ahmed", role: "Operations", image: "/Office Staff/Arbab.jpg" },
                                { name: "Zaeem Ahmed", role: "Operations", image: "/Office Staff/Zaeem.jpg" },
                                { name: "Sohail", role: "Outdoor Incharge", image: "/Office Staff/Sohail.jpg" },
                                { name: "Bilal", role: "Office Boy", image: "/Office Staff/Bilal.jpeg" },
                            ]
                        },
                        {
                            title: "Airport Team",
                            members: [
                                { name: "Khalid Hussain", role: "Airport Incharge", image: "/Office Staff/Khalid.jpg" },
                                { name: "Imran Khan", role: "Airport Clerk" },
                                { name: "Husnain", role: "Airport Clerk", image: "/Office Staff/Husnain.jpg" },
                            ]
                        },
                        {
                            title: "SEA PORT Team",
                            members: [
                                { name: "Rashid", role: "Operations", image: "/Office Staff/Rashid.jpg" },
                                { name: "Abdul Rehman", role: "Sea Port Clerk", image: "/Office Staff/Rehman.jpg" },
                                { name: "Rana Safdar", role: "Sea Port Incharge", image: "/Office Staff/Safdar.jpeg" },
                            ]
                        },
                        {
                            title: "EPZ Team",
                            members: [
                                { name: "Rana Murtaza", role: "EPZ Incharge", image: "/Office Staff/Murtaza.jpg" },
                                { name: "Rizwan", role: "EPZ Clerk", image: "/Office Staff/Rizwan.jpg" },
                            ]
                        }
                    ].map((group, idx) => (
                        <div key={idx} className="space-y-8">
                            <h3 className="text-2xl font-bold border-l-4 border-primary pl-4">{group.title}</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {group.members.map((member, mIdx) => (
                                    <Card key={mIdx} className="overflow-hidden group hover:shadow-lg transition-all duration-300 border-none bg-slate-50/50">
                                        <div className="aspect-[4/5] relative bg-slate-200 overflow-hidden">
                                            {member.image ? (
                                                <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110" style={{ backgroundImage: `url('${member.image}')` }} />
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center text-slate-400 group-hover:scale-110 transition-transform duration-500">
                                                    <Users size={64} strokeWidth={1} />
                                                </div>
                                            )}
                                            {/* Gradient overlay */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                        </div>
                                        <CardContent className="p-5 space-y-2">
                                            <div>
                                                <h4 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">{member.name}</h4>
                                                <p className="text-sm font-medium text-primary/80 uppercase tracking-wider">{member.role}</p>
                                            </div>
                                            {member.phone && (
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t border-slate-100">
                                                    <Phone size={14} className="text-primary" />
                                                    <span>{member.phone}</span>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Why Thaheem Brothers */}
                <div className="bg-slate-50 -mx-4 px-4 py-16 rounded-3xl">
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-3xl font-bold text-center mb-12">Why Thaheem Brothers?</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[
                                { icon: Shield, title: "In-depth Knowledge of Customs & Global Trade" },
                                { icon: Ship, title: "Seamless Integration of Forwarding & Clearance" },
                                { icon: Users, title: "Experienced Multinational Team" },
                                { icon: Headphones, title: "24/7 Client Support Availability" },
                                { icon: DollarSign, title: "Competitive Pricing with Global Reach" },
                                { icon: Activity, title: "Technology-Driven Shipment Monitoring" }
                            ].map((item, i) => (
                                <div key={i} className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm">
                                    <item.icon className="h-6 w-6 text-primary shrink-0 mt-1" />
                                    <span className="font-medium">{item.title}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Trusted Clients */}
                <div>
                    <h2 className="text-3xl font-bold mb-8 text-center">Our Trusted Clients</h2>
                    <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
                        We are proud to serve a diverse portfolio of national and multinational clients across various industries.
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {['Textiles', 'IT & Technology', 'Engineering', 'Pharmaceuticals', 'Automotive', 'Consumer Goods', 'Heavy Equipment', 'Export Processing'].map((industry, i) => (
                            <Card key={i} className="bg-slate-50 border-0 shadow-sm hover:shadow-md transition">
                                <CardContent className="p-6 text-center">
                                    <Users className="h-8 w-8 mx-auto mb-3 text-primary" />
                                    <p className="font-semibold">{industry}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Total Information Services */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div className="prose prose-lg dark:prose-invert">
                        <h2 className="text-3xl font-bold mb-4">Total Information Services</h2>
                        <p>
                            Our integrated logistics system provides real-time access to shipment movement and information, optimizing delivery and reducing cost. From generation to final delivery, we ensure full visibility and control of your freight.
                        </p>
                    </div>
                    <div className="relative h-[300px] rounded-2xl overflow-hidden shadow-xl">
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80')] bg-cover bg-center" />
                    </div>
                </div>

                {/* Contact Info */}
                <div className="bg-slate-900 text-white -mx-4 px-6 py-20 rounded-[3rem] shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[100px] -mr-48 -mt-48" />
                    <div className="max-w-5xl mx-auto text-center relative z-10">
                        <h2 className="text-3xl md:text-4xl font-black mb-16 tracking-tight">Our Presence</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
                            <div className="flex flex-col items-center gap-4 group">
                                <div className="p-4 bg-white/10 rounded-2xl border border-white/20 group-hover:bg-primary/20 transition-colors">
                                    <MapPin className="h-8 w-8 text-primary" />
                                </div>
                                <h4 className="text-xl font-bold">Head Office</h4>
                                <address className="not-italic text-slate-300 leading-relaxed">
                                    Suite 23, 2nd Floor, R.K. Square Extension,<br />
                                    Shahrah-e-Liaquat, New Challi,<br />
                                    Karachi, Pakistan
                                </address>
                            </div>
                            <div className="flex flex-col items-center gap-4 group">
                                <div className="p-4 bg-white/10 rounded-2xl border border-white/20 group-hover:bg-primary/20 transition-colors">
                                    <Phone className="h-8 w-8 text-primary" />
                                </div>
                                <h4 className="text-xl font-bold">Call Us</h4>
                                <div className="text-slate-300 space-y-1">
                                    <p className="font-mono">+92 21 32421347</p>
                                    <p className="font-mono">+92 300 2791780</p>
                                    <p className="font-mono text-xs text-slate-500 pt-2 uppercase font-black">Fax: +92 21 32421347</p>
                                </div>
                            </div>
                            <div className="flex flex-col items-center gap-4 group">
                                <div className="p-4 bg-white/10 rounded-2xl border border-white/20 group-hover:bg-primary/20 transition-colors">
                                    <Mail className="h-8 w-8 text-primary" />
                                </div>
                                <h4 className="text-xl font-bold">Email Us</h4>
                                <a href="mailto:import.khi@hotmail.com" className="text-slate-300 hover:text-primary transition-colors font-medium">
                                    import.khi@hotmail.com
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}