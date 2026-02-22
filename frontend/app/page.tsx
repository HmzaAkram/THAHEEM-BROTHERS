'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowRight, Plane, Ship, Truck, PackageCheck } from 'lucide-react';
import { PublicNavbar } from '@/components/public/navbar';
import { PublicFooter } from '@/components/public/footer';

const CLIENT_LOGOS = Array.from({ length: 40 }, (_, i) => ({
  id: i + 1,
  src: `/clients/${(i + 1).toString().padStart(2, '0')}.PNG`,
  alt: `Trusted Client ${i + 1}`
}));

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <PublicNavbar />
      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section className="relative h-[calc(100vh-64px)] flex items-center justify-center overflow-hidden bg-slate-900">
          {/* Background Image/Gradient */}
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/40 z-10" />
            {/* Placeholder for actual image - using a dark gradient pattern for now */}
            <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')] bg-cover bg-center" />
          </div>

          <div className="container mx-auto relative z-20 px-4 text-center">
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

        {/* Global Presence Section */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold mb-4">Connecting You to the World</h2>
              <p className="text-muted-foreground text-lg">
                With a robust network spanning over 50 countries, we ensure your cargo moves seamlessly across borders, oceans, and skies.
              </p>
            </div>
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              {/* Map Placeholder Image */}
              <div className="aspect-[21/9] bg-slate-100 relative">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2074&q=80')] bg-cover bg-center opacity-90" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8">
                  <div className="text-white">
                    <h3 className="text-2xl font-bold">Global Reach, Local Expertise</h3>
                    <p className="opacity-90">Operating in major hubs across Asia, Europe, and the Americas.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose Us - Detailed */}
        <section className="py-24 bg-slate-50">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl font-bold mb-4">Why Industry Leaders Trust Us</h2>
                  <p className="text-muted-foreground text-lg">
                    We don't just move freight; we engineer supply chains. Our commitment to precision, transparency, and speed sets us apart.
                  </p>
                </div>
                <div className="space-y-6">
                  {[
                    {
                      title: "24/7 Real-Time Tracking",
                      desc: "Complete visibility of your shipments from origin to destination via our advanced digital portal."
                    },
                    {
                      title: "Customized Solutions",
                      desc: "Tailored logistics strategies that align with your specific business goals and timeline requirements."
                    },
                    {
                      title: "Compliance & Security",
                      desc: "Rigorous adherence to international trade regulations and security protocols so you never have to worry."
                    }

                  ].map((item, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className="h-10 w-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {idx + 1}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{item.title}</h3>
                        <p className="text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4 mt-8">
                  <div className="h-64 rounded-2xl bg-[url('https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?ixlib=rb-4.0.3&auto=format&fit=crop&w=1469&q=80')] bg-cover bg-center shadow-lg" />
                  <div className="h-48 rounded-2xl bg-[url('https://images.unsplash.com/photo-1570710891163-6d3b5c47248b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80')] bg-cover bg-center shadow-lg" />
                </div>
                <div className="space-y-4">
                  <div className="h-48 rounded-2xl bg-[url('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80')] bg-cover bg-center shadow-lg" />
                  <div className="h-64 rounded-2xl bg-[url('https://images.unsplash.com/photo-1580674285054-bed31e145f59?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80')] bg-cover bg-center shadow-lg" />
                </div>
              </div>
            </div>
          </div>
        </section>


        {/* List of Our Trusted Clients */}
        <section className="py-24 bg-slate-50">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold mb-4">LIST OF OUR TRUSTED CLIENTS</h2>
              <p className="text-muted-foreground text-lg">
                We are proud to partner with industry leaders who trust us with their global logistics needs.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
              {CLIENT_LOGOS.map((logo) => (
                <div
                  key={logo.id}
                  className="flex items-center justify-center p-4 bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300 h-24 sm:h-28 group"
                >
                  <div className="relative w-full h-full">
                    <Image
                      src={logo.src}
                      alt={logo.alt}
                      fill
                      className="object-contain filter grayscale group-hover:grayscale-0 transition-all duration-300"
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 16vw"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        {/* Services Overview Grid */}
        <section className="py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold mb-4">Our Core Services</h2>
              <p className="text-muted-foreground">
                End-to-end logistics solutions designed for modern commerce.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: <Ship className="h-8 w-8 text-primary" />,
                  title: "Ocean Freight",
                  desc: "FCL & LCL connectivity to all major global ports."
                },
                {
                  icon: <Plane className="h-8 w-8 text-primary" />,
                  title: "Air Freight",
                  desc: "Fast and reliable air cargo for urgent shipments."
                },
                {
                  icon: <Truck className="h-8 w-8 text-primary" />,
                  title: "Land Transport",
                  desc: "Cross-border trucking and domestic distribution."
                },
                {
                  icon: <PackageCheck className="h-8 w-8 text-primary" />,
                  title: "Customs Brokerage",
                  desc: "Hassle-free clearance and documentation handling."
                }
              ].map((feature, idx) => (
                <div key={idx} className="bg-card border p-8 rounded-xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
                  <div className="bg-primary/5 w-14 h-14 rounded-full flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section with Image Background */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1494412574643-35d324698420?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')] bg-cover bg-center fixed-bg" />
          <div className="absolute inset-0 bg-slate-900/90" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 text-center">
              {[
                { label: "Years Experience", value: "28+" },
                { label: "Global Partners", value: "50+" },
                { label: "Happy Clients", value: "2000+" },
                { label: "Shipments/Year", value: "10k+" }
              ].map((stat, idx) => (
                <div key={idx}>
                  <p className="text-5xl lg:text-6xl font-bold text-white mb-2">{stat.value}</p>
                  <p className="text-slate-400 font-medium text-lg uppercase tracking-wider">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* Trusted Partners / CTA */}
        <section className="py-24 bg-slate-900 text-white">
          <div className="container mx-auto px-4 text-center">
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
      </main>
      <PublicFooter />
    </div>
  );
}
