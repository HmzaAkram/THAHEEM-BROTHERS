import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Plane, Ship, Truck, PackageCheck } from 'lucide-react';

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
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-6 animate-in slide-in-from-bottom-5 duration-700">
                        Global Logistics <span className="text-primary">Partner</span>
                    </h1>
                    <p className="text-lg md:text-xl text-slate-200 mb-8 max-w-2xl mx-auto animate-in slide-in-from-bottom-5 duration-1000 delay-200">
                        Simplifying international trade with reliable freight forwarding, customs clearance, and supply chain solutions.
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
            <section className="py-24 bg-background">
                <div className="container px-4">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl font-bold mb-4">Why Choose Thaheem Brothers?</h2>
                        <p className="text-muted-foreground">
                            We leverage decades of experience and a global network to ensure your cargo reaches its destination safely and on time.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            {
                                icon: <Ship className="h-10 w-10 text-primary" />,
                                title: "Ocean Freight",
                                desc: "Reliable FCL and LCL shipping solutions for global trade connecting major ports worldwide."
                            },
                            {
                                icon: <Plane className="h-10 w-10 text-primary" />,
                                title: "Air Freight",
                                desc: "Expedited air cargo services for time-sensitive shipments with varied priority options."
                            },
                            {
                                icon: <Truck className="h-10 w-10 text-primary" />,
                                title: "Land Transport",
                                desc: "Seamless cross-border trucking and inland transportation networks for door-to-door delivery."
                            },
                            {
                                icon: <PackageCheck className="h-10 w-10 text-primary" />,
                                title: "Customs Brokerage",
                                desc: "Expert handling of documentation and compliance to ensure smooth customs clearance."
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
            <section className="py-20 bg-primary/5">
                <div className="container px-4">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
                        {[
                            { label: "Years Experience", value: "28+" },
                            { label: "Global Partners", value: "50+" },
                            { label: "Happy Clients", value: "2000+" },
                            { label: "Shipments/Year", value: "10k+" }
                        ].map((stat, idx) => (
                            <div key={idx}>
                                <p className="text-4xl lg:text-5xl font-bold text-primary mb-2">{stat.value}</p>
                                <p className="text-muted-foreground font-medium">{stat.label}</p>
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
