import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Ship, Truck, PackageCheck, Warehouse, Globe, FileCheck, 
  Shield, Briefcase, Plane, Activity, DollarSign 
} from 'lucide-react';

const services = [
    {
        icon: <Globe className="h-8 w-8 text-white" />,
        title: "Freight Forwarding (Air, Sea & Ground)",
        description: "Comprehensive freight solutions tailored to your timeline and budget across international borders and domestic routes.",
        features: [
            "Airfreight & Ocean Freight (Import/Export)",
            "FCL / LCL Consolidation & Deconsolidation",
            "Multimodal Transport Solutions",
            "Cost-effective, time-definite deliveries"
        ]
    },
    {
        icon: <FileCheck className="h-8 w-8 text-white" />,
        title: "Regulatory Compliance & Duty Recovery",
        description: "Expert navigation of complex tariff codes ensuring perfect compliance while recovering maximum permitted duties.",
        features: [
            "Duty/Tax Refund Claims (up to 99%)",
            "Legislative Advisory Services",
            "Government Liaison & Documentation"
        ]
    },
    {
        icon: <Briefcase className="h-8 w-8 text-white" />,
        title: "Pre-Shipment & Project Logistics",
        description: "Specialized logistics planning and execution for large-scale, complex, or heavy machinery movements.",
        features: [
            "IT, Textile, Heavy Equipment Projects",
            "Site Surveys, Route Planning, Permits",
            "End-to-End Project Management"
        ]
    },
    {
        icon: <Activity className="h-8 w-8 text-white" />,
        title: "Specialized Expertise",
        description: "Niche logistical solutions for unique trade scenarios, banking regulations, and special economic zones.",
        features: [
            "Export Processing Zone (EPZ) Handling",
            "Trade Show/Temporary Import Logistics",
            "Banking & Consular Documentation"
        ]
    },
    {
        icon: <PackageCheck className="h-8 w-8 text-white" />,
        title: "Customs Brokerage & Clearance",
        description: "Navigate complex customs regulations with ease. Our licensed brokers ensure compliance and facilitate quick clearance of your goods.",
        features: [
            "Tariff Classification & Valuation",
            "Regulatory & Compliance Guidance",
            "Advance EDI Customs Filing",
            "Temporary Imports & Trade Displays"
        ]
    },
    {
        icon: <Warehouse className="h-8 w-8 text-white" />,
        title: "Warehousing & Distribution",
        description: "Strategic storage solutions to optimize your inventory management. Our facilities are secure, modern, and equipped for various cargo types.",
        features: [
            "Secure Warehousing Solutions",
            "Inventory & Handling Optimization",
            "Nationwide and Global Distribution",
            "Supply Chain Cost Reduction"
        ]
    },
    {
        icon: <Truck className="h-8 w-8 text-white" />,
        title: "Door-to-Door Delivery",
        description: "Completely transparent, end-to-end transportation of your goods directly to their final destination securely.",
        features: [
            "Efficient, Trackable Delivery Services",
            "Domestic and Cross-border Logistics",
            "Hassle-free Pickup & Dropoff"
        ]
    },
    {
        icon: <Shield className="h-8 w-8 text-white" />,
        title: "Cargo Insurance (CIF)",
        description: "Comprehensive risk management protecting your valuable cargo against unforeseen events during transit.",
        features: [
            "Strategic Partnerships for Cost Savings (5-10%)",
            "Full Risk Coverage of Goods in Transit",
            "Sight Draft Collections, LC Management"
        ]
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

            {/* Industries We Serve */}
            <div className="mt-16 bg-slate-900 -mx-4 px-4 py-20 text-white rounded-3xl relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519389950473-47ba0277781c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')] bg-cover bg-center opacity-20" />
                <div className="relative z-10 text-center max-w-4xl mx-auto">
                    <h2 className="text-3xl font-bold mb-8">Industries We Serve</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {[
                            "Textiles", "IT & Technology", "Engineering", "Pharmaceuticals",
                            "Automotive", "Consumer Goods", "Heavy Equipment", "Export Processing"
                        ].map((industry, i) => (
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