'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { useState } from 'react';

export default function ContactPage() {
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
        // Add logic to actually send email/message later
    };

    return (
        <div className="container px-4 py-16">
            

            <div className="text-center max-w-3xl mx-auto mb-16">
                <h1 className="text-4xl font-bold tracking-tight mb-4">Contact Us</h1>
                <p className="text-xl text-muted-foreground">
                    Get in touch with our team for quotes, inquiries, or support.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
                {/* Contact Info */}
                <div className="space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Head Office</CardTitle>
                            <CardDescription>Reach out to us directly through any of these channels.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-start gap-4">
                                <MapPin className="h-6 w-6 text-primary shrink-0 mt-1" />
                                <div>
                                    <p className="font-semibold">Address</p>
                                    <p className="text-muted-foreground">
                                        Suite 23, 2nd Floor, R.K. Square Extension,<br />
                                        Shahrah-e-Liaquat, New Challi,<br />
                                        Karachi, Pakistan
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <Phone className="h-6 w-6 text-primary shrink-0 mt-1" />
                                <div>
                                    <p className="font-semibold">Phone & Fax</p>
                                    <p className="text-muted-foreground">
                                        +92 21 32421347<br />
                                        +92 300 2791780<br />
                                        +92 330 2791786<br />
                                        +92 317 2004257<br />
                                        +92 320 2017200<br />
                                        <span className="text-sm">Fax: +92 21 32421347</span>
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <Mail className="h-6 w-6 text-primary shrink-0" />
                                <div>
                                    <p className="font-semibold">Email</p>
                                    <p className="text-muted-foreground">
                                        <a href="mailto:import.khi@hotmail.com" className="hover:underline">import.khi@hotmail.com</a>
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Map Placeholder */}
                    <div className="h-64 bg-muted rounded-xl flex items-center justify-center border">
                        <p className="text-muted-foreground">Map Integration (Google Maps)</p>
                    </div>
                </div>

                {/* Contact Form */}
                <Card>
                    <CardHeader>
                        <CardTitle>Send us a Message</CardTitle>
                        <CardDescription>Fill out the form below and we'll get back to you shortly.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {submitted ? (
                            <div className="text-center py-12 space-y-4">
                                <div className="h-16 w-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                                    <Send className="h-8 w-8" />
                                </div>
                                <h3 className="text-xl font-semibold">Message Sent!</h3>
                                <p className="text-muted-foreground">Thank you for contacting us. We will respond to your inquiry within 24 hours.</p>
                                <Button variant="outline" onClick={() => setSubmitted(false)}>Send Another Message</Button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Name</Label>
                                        <Input id="name" placeholder="Your Name" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input id="email" type="email" placeholder="john@example.com" required />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="subject">Subject</Label>
                                    <Input id="subject" placeholder="Inquiry about..." required />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="message">Message</Label>
                                    <Textarea id="message" placeholder="How can we help you?" className="min-h-[120px]" required />
                                </div>

                                <Button type="submit" className="w-full">Send Message</Button>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}