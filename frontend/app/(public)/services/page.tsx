import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Ship, Plane, Truck, PackageCheck, Warehouse, Globe } from 'lucide-react';

const services = [
    {
        icon: <Ship className="h-8 w-8 text-white" />,
        title: "Ocean Freight",
        description: "Comprehensive ocean freight services including FCL (Full Container Load) and LCL (Less than Container Load). We partner with major carriers to offer competitive rates and flexible schedules.",
        features: ["Global Port Coverage", "Container Tracking", "Customs Documentation", "Marine Insurance"]
    },
    {
        icon: <Plane className="h-8 w-8 text-white" />,
        title: "Air Freight",
        description: "Fast and reliable air cargo solutions for urgent shipments. We offer direct and consolidated services to major airports worldwide.",
        features: ["Priority Shipping", "Door-to-Airport", "Airport-to-Airport", "Charter Services"]
    },
    {
        icon: <Truck className="h-8 w-8 text-white" />,
        title: "Overland Transport",
        description: "Efficient road transport network for domestic and cross-border logistics. From small parcels to heavy haulage, we have the fleet to handle it.",
        features: ["FTL & LTL", "Refrigerated Transport", "Project Cargo", "Real-time GPS Tracking"]
    },
    {
        icon: <PackageCheck className="h-8 w-8 text-white" />,
        title: "Customs Brokerage",
        description: "Navigate complex customs regulations with ease. Our licensed brokers ensure compliance and facilitate quick clearance of your goods.",
        features: ["Import/Export Declaration", "Duty & Tax Calculation", "Compliance Consulting", "Permit Applications"]
    },
    {
        icon: <Warehouse className="h-8 w-8 text-white" />,
        title: "Warehousing & Distribution",
        description: "Strategic storage solutions to optimize your inventory management. Our facilities are secure, modern, and equipped for various cargo types.",
        features: ["Inventory Management", "Pick & Pack", "Cross-docking", "Value-added Services"]
    },
    {
        icon: <Globe className="h-8 w-8 text-white" />,
        title: "Supply Chain Consulting",
        description: "Expert advice to streamline your supply chain operations. We analyze your logistics flow to identify cost-saving opportunities and efficiency improvements.",
        features: ["Network Design", "Cost Analysis", "Process Optimization", "Risk Management"]
    }
];

export default function ServicesPage() {
    return (
        <div className="container px-4 py-16">
            <div className="text-center max-w-3xl mx-auto mb-16">
                <h1 className="text-4xl font-bold tracking-tight mb-4">Our Services</h1>
                <p className="text-xl text-muted-foreground">
                    End-to-end logistics solutions designed to move your business forward.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
                {services.map((service, index) => (
                    <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-0 shadow-sm bg-white overflow-hidden">
                        <div className="h-48 bg-slate-900 relative overflow-hidden group">
                            {/* Placeholder for service image (could use specific images per service) */}
                            <div className={`absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-500 opacity-60`}
                                style={{ backgroundImage: `url('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80')` }}
                            />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <div className="bg-white/20 backdrop-blur-md p-4 rounded-full border border-white/30">
                                    {service.icon}
                                </div>
                            </div>
                        </div>
                        <CardHeader>
                            <CardTitle className="text-xl">{service.title}</CardTitle>
                            <CardDescription className="text-base mt-2">
                                {service.description}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2">
                                {service.features.map((feature, idx) => (
                                    <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Global Network / Industries */}
            <div className="mt-16 bg-slate-900 -mx-4 px-4 py-20 text-white rounded-3xl relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519389950473-47ba0277781c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')] bg-cover bg-center opacity-20" />
                <div className="relative z-10 text-center max-w-4xl mx-auto">
                    <h2 className="text-3xl font-bold mb-8">Industries We Serve</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {["Automotive", "Retail & Fashion", "Pharma & Healthcare", "Technology", "Oil & Gas", "FMCG", "Construction", "Agriculture"].map((industry, i) => (
                            <div key={i} className="p-4 border border-white/20 rounded-xl hover:bg-white/10 transition-colors cursor-default backdrop-blur-sm">
                                <p className="font-semibold">{industry}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
