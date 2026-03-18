import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Plane, Ship, Truck, PackageCheck, Globe as Global, Monitor } from 'lucide-react';

export default function HomePage() {
    return (
        <div className="flex flex-col">
            {/* Hero Section */}
            <section className="relative h-[85vh] flex items-center justify-center overflow-hidden bg-slate-900">
                {/* Background Image/Gradient */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/40 z-10" />
                    {/* Placeholder for actual image - using a dark gradient pattern for now */}
                    <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')] bg-cover bg-center" />
                </div>

                <div className="container relative z-20 px-4 text-center">
                    <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tighter text-white mb-6 animate-in slide-in-from-bottom-5 duration-700">
                        Global Logistics <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">Partner</span>
                    </h1>
                    <p className="text-base sm:text-lg md:text-xl text-slate-300 mb-10 max-w-3xl mx-auto animate-in slide-in-from-bottom-5 duration-1000 delay-200 leading-relaxed">
                        Pakistan's leading licensed customs brokerage and freight forwarding company, built on a decade of excellence and client trust.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in zoom-in duration-1000 delay-300">
                        <Link href="/contact">
                            <Button size="lg" className="text-lg px-8 py-6 h-auto">
                                Get a Quote <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                        <Link href="/services">
                            <Button variant="outline" size="lg" className="text-lg px-8 py-6 h-auto bg-transparent text-white border-white hover:bg-white hover:text-slate-900">
                                Our Services
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Feature Section */}
            <section className="py-20 md:py-32 bg-background relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -mr-64 -mt-64" />
                <div className="container px-4 relative z-10">
                    <div className="text-center max-w-3xl mx-auto mb-16 md:mb-24">
                        <h2 className="text-3xl md:text-5xl font-extrabold mb-6 tracking-tight">Why Choose Thaheem Brothers?</h2>
                        <p className="text-lg text-muted-foreground leading-relaxed">
                            We leverage decades of experience and a global network to ensure your cargo reaches its destination safely and on time.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            {
                                icon: <PackageCheck className="h-10 w-10 text-primary" />,
                                title: "In-depth Knowledge",
                                desc: "Extensive expertise in Customs & Global Trade regulations."
                            },
                            {
                                icon: <Ship className="h-10 w-10 text-primary" />,
                                title: "Seamless Integration",
                                desc: "Perfect harmony between Forwarding & Clearance operations."
                            },
                            {
                                icon: <Plane className="h-10 w-10 text-primary" />,
                                title: "Multinational Team",
                                desc: "Highly experienced professionals dedicated to your success."
                            },
                            {
                                icon: <Truck className="h-10 w-10 text-primary" />,
                                title: "24/7 Support",
                                desc: "Round-the-clock client support availability for peace of mind."
                            },
                            {
                                icon: <Global className="h-10 w-10 text-primary" />,
                                title: "Global Reach",
                                desc: "Competitive pricing tailored with expansive international reach."
                            },
                            {
                                icon: <Monitor className="h-10 w-10 text-primary" />,
                                title: "Advanced Tech",
                                desc: "Technology-Driven Shipment Monitoring for full visibility."
                            }
                        ].map((feature, idx) => (
                            <div key={idx} className="bg-card border rounded-xl p-6 hover:shadow-lg transition-shadow hover:-translate-y-1 duration-300">
                                <div className="bg-primary/10 w-16 h-16 rounded-lg flex items-center justify-center mb-6">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                                <p className="text-muted-foreground">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-20 bg-slate-50 dark:bg-slate-900/50 border-y border-border/50">
                <div className="container px-4">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 text-center">
                        {[
                            { label: "Years Experience", value: "10+" },
                            { label: "Global Partners", value: "50+" },
                            { label: "Happy Clients", value: "2000+" },
                            { label: "Customs Clearances", value: "15k+" }
                        ].map((stat, idx) => (
                            <div key={idx} className="space-y-2">
                                <p className="text-4xl sm:text-5xl md:text-6xl font-black text-primary tracking-tighter">{stat.value}</p>
                                <p className="text-xs sm:text-sm md:text-base text-muted-foreground font-black uppercase tracking-widest">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Trusted Partners / CTA */}
            <section className="py-24 bg-slate-900 text-white">
                <div className="container px-4 text-center">
                    <h2 className="text-3xl font-bold mb-8">Ready to Optimize Your Logistics?</h2>
                    <p className="text-slate-300 max-w-2xl mx-auto mb-10 text-lg">
                        Join hundreds of businesses that trust Thaheem Brothers for their supply chain needs. Get a competitive quote today.
                    </p>
                    <Link href="/contact">
                        <Button size="lg" variant="secondary" className="text-lg px-8 py-6 h-auto font-semibold">
                            Contact Us Now
                        </Button>
                    </Link>
                </div>
            </section>
        </div>
    );
}
