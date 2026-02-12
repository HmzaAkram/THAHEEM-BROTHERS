import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, Target, Users, History, Globe } from 'lucide-react';

export default function AboutPage() {
    return (
        <div className="container px-4 py-16">
            <div className="max-w-4xl mx-auto space-y-20">
                {/* Header */}
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-bold tracking-tight">About Thaheem Brothers</h1>
                    <p className="text-xl text-muted-foreground">
                        A legacy of excellence in global logistics and supply chain management.
                    </p>
                </div>

                {/* Company Overview & History */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div className="prose prose-lg dark:prose-invert">
                        <p className="text-xl leading-relaxed font-medium text-foreground">
                            Founded in 1995, Thaheem Brothers has grown from a local freight forwarding company into a global logistics partner. With over two decades of experience, we specialize in providing comprehensive supply chain solutions that drive efficiency and growth for our clients.
                        </p>
                        <p>
                            Our journey began with a single mission: to simplify the complexities of international trade. Today, we operate at the intersection of traditional logistics and modern technology, ensuring every shipment is handled with precision and care.
                        </p>
                        <p>
                            Our commitment to reliability, transparency, and innovation has earned us the trust of businesses across diverse industries, from retail and manufacturing to healthcare and technology.
                        </p>
                    </div>
                    <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-xl">
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1556761175-5973dc0f32e7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1632&q=80')] bg-cover bg-center" />
                    </div>
                </div>

                {/* Values Section */}
                <div className="bg-slate-50 -mx-4 px-4 py-16 rounded-3xl">
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-3xl font-bold text-center mb-12">Our Guiding Principles</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <Card className="bg-white border-0 shadow-md">
                                <CardHeader>
                                    <Target className="h-10 w-10 text-primary mb-2" />
                                    <CardTitle>Mission</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    To simplify global trade by delivering reliable, cost-effective, and innovative logistics solutions tailored to our clients' unique needs.
                                </CardContent>
                            </Card>
                            <Card className="bg-white border-0 shadow-md">
                                <CardHeader>
                                    <Award className="h-10 w-10 text-primary mb-2" />
                                    <CardTitle>Vision</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    To be the preferred logistics partner for businesses worldwide, recognized for our operational excellence and customer-centric approach.
                                </CardContent>
                            </Card>
                            <Card className="bg-white border-0 shadow-md">
                                <CardHeader>
                                    <Users className="h-10 w-10 text-primary mb-2" />
                                    <CardTitle>Values</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    Integrity, Transparency, and relentless Commitment to customer success are the pillars of our organization.
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>

                {/* Team Section */}
                <div>
                    <h2 className="text-3xl font-bold mb-12 text-center">Meet Our Leadership</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { name: "Abdul Thaheem", role: "CEO & Founder", img: "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=687&q=80" },
                            { name: "Sarah Ahmed", role: "Head of Operations", img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=688&q=80" },
                            { name: "Michael Chen", role: "Global Strategy Director", img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80" }
                        ].map((leader, i) => (
                            <div key={i} className="group">
                                <div className="relative h-80 bg-muted rounded-xl overflow-hidden mb-4 shadow-sm group-hover:shadow-md transition-all">
                                    <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105" style={{ backgroundImage: `url(${leader.img})` }} />
                                </div>
                                <div className="text-center">
                                    <h3 className="font-bold text-xl">{leader.name}</h3>
                                    <p className="text-primary font-medium">{leader.role}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
