'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import ApiService from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Plus, MessageSquare, Loader2, Search } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { DashboardLayout } from '@/components/dashboard-layout';

interface QueryMessage {
    id: number;
    message: string;
    senderType: 'company' | 'admin';
    createdAt: string;
}

interface Query {
    id: number;
    subject: string;
    status: 'pending' | 'replied';
    createdAt: string;
    messages?: QueryMessage[];
}

export default function CompanyQueriesPage() {
    const { user, token, isHydrated: authHydrated } = useAuth();
    const { toast } = useToast();
    const [queries, setQueries] = useState<Query[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Create Query State
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [newSubject, setNewSubject] = useState('');
    const [newInitialMessage, setNewInitialMessage] = useState('');

    const queryTemplates = [
        {
            label: "Service charges not added",
            subject: "Missing Service Charges",
            message: "Hello team, please note that the service charges seem to be missing or incorrect for our recent jobs. Kindly check and update our ledger. Thank you."
        },
        {
            label: "Issue with Job Number",
            subject: "Correction Required for Job Number",
            message: "Hello, there is a discrepancy with a Job Number mapped to our account. Please investigate and correct the bill details."
        },
        {
            label: "Payment not updated in ledger",
            subject: "Payment Not Reflected in Ledger",
            message: "Hi, we recently made a payment that does not seem to be updated in our ledger yet. Please verify the transaction and update our balance."
        },
        {
            label: "Other Issue",
            subject: "",
            message: ""
        }
    ];

    const handleTemplateChange = (val: string) => {
        setSelectedTemplate(val);
        const template = queryTemplates.find(t => t.label === val);
        if (template && val !== "Other Issue") {
            setNewSubject(template.subject);
            setNewInitialMessage(template.message);
        } else if (val === "Other Issue") {
            setNewSubject('');
            setNewInitialMessage('');
        }
    };

    // Chat / View State
    const [selectedQuery, setSelectedQuery] = useState<Query | null>(null);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatMessage, setChatMessage] = useState('');
    const [isSendingMessage, setIsSendingMessage] = useState(false);

    const fetchQueries = async () => {
        if (!token) return;

        setLoading(true);
        try {
            const response = await ApiService.get('/queries', token);
            if (response.ok) {
                setQueries(response.data);
            } else {
                if (response.status !== 401) {
                    toast({
                        title: 'Error',
                        description: response.message || 'Failed to fetch queries',
                        variant: 'destructive',
                    });
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch individual query details (messages) when opening chat
    const openChat = async (query: Query) => {
        setSelectedQuery(query);
        setIsChatOpen(true);
        // Ensure we have the latest messages
        if (!token) return;
        try {
            const response = await ApiService.get(`/queries/${query.id}`, token);
            if (response.ok) {
                setSelectedQuery(response.data);
            }
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        if (authHydrated && token) {
            fetchQueries();
        } else if (authHydrated && !token) {
            setLoading(false);
        }
    }, [authHydrated, token]);

    const handleCreateQuery = async () => {
        if (!newSubject.trim() || !newInitialMessage.trim()) {
            toast({
                title: 'Validation Error',
                description: 'Please fill in all fields',
                variant: 'destructive',
            });
            return;
        }

        if (!token) return;

        setIsSubmitting(true);
        try {
            const response = await ApiService.post('/queries', {
                subject: newSubject,
                message: newInitialMessage,
            }, token);

            if (response.ok) {
                toast({
                    title: 'Success',
                    description: 'Query submitted successfully',
                });
                setIsCreateOpen(false);
                setSelectedTemplate('');
                setNewSubject('');
                setNewInitialMessage('');
                fetchQueries();
            } else {
                toast({
                    title: 'Error',
                    description: response.message || 'Failed to submit query',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSendMessage = async () => {
        if (!chatMessage.trim() || !selectedQuery || !token) return;

        setIsSendingMessage(true);
        try {
            const response = await ApiService.post(`/queries/${selectedQuery.id}/messages`, {
                message: chatMessage,
            }, token);

            if (response.ok) {
                setChatMessage('');
                // Refresh messages
                const updatedQueryResponse = await ApiService.get(`/queries/${selectedQuery.id}`, token);
                if (updatedQueryResponse.ok) {
                    setSelectedQuery(updatedQueryResponse.data);
                }
            } else {
                toast({
                    title: 'Error',
                    description: response.message || 'Failed to send message',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSendingMessage(false);
        }
    };

    const filteredQueries = queries.filter(q =>
        q.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.status.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!authHydrated) {
        return (
            <DashboardLayout role="company">
                <div className="flex h-[80vh] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout role="company">
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">My Queries</h1>
                        <p className="text-muted-foreground">
                            View and manage your support tickets.
                        </p>
                    </div>
                    <Button onClick={() => setIsCreateOpen(true)} className="bg-primary hover:bg-primary/90 shadow-md">
                        <Plus className="mr-2 h-4 w-4" />
                        New Query
                    </Button>
                </div>

                <Card className="shadow-sm border-primary/5">
                    <CardHeader className="pb-3">
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search queries..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8 max-w-sm"
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : filteredQueries.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground space-y-4">
                                <div className="p-4 bg-muted/50 rounded-full">
                                    <MessageSquare className="h-8 w-8 text-muted-foreground/50" />
                                </div>
                                <div>
                                    <p className="font-medium text-lg">Upload your first query</p>
                                    <p className="text-sm text-muted-foreground">Create a new query to get started with support.</p>
                                </div>
                                <Button onClick={() => setIsCreateOpen(true)} className="mt-4">
                                    Create Query
                                </Button>
                            </div>
                        ) : (
                            <div className="rounded-md border overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-muted/50">
                                        <TableRow>
                                            <TableHead>Subject</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead className="text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredQueries.map((query) => (
                                            <TableRow key={query.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => openChat(query)}>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <MessageSquare className="h-4 w-4 text-primary/70" />
                                                        {query.subject}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={query.status === 'replied' ? 'default' : 'secondary'} className={query.status === 'replied' ? 'bg-green-600 hover:bg-green-700' : ''}>
                                                        {query.status === 'replied' ? 'Replied' : 'Pending'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">{format(new Date(query.createdAt), 'MMM d, yyyy')}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                        <span className="sr-only">View</span>
                                                        <MessageSquare className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Create Query Dialog */}
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Query</DialogTitle>
                            <DialogDescription>
                                Submit a new query regarding bills, ledgers, or other issues.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Quick Template</label>
                                <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a common issue or choose 'Other'" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {queryTemplates.map(t => (
                                            <SelectItem key={t.label} value={t.label}>{t.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="subject" className="text-sm font-medium">Subject</label>
                                <Input
                                    id="subject"
                                    placeholder="e.g. Issue with Bill #123"
                                    value={newSubject}
                                    onChange={(e) => setNewSubject(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="message" className="text-sm font-medium">Initial Message</label>
                                <Textarea
                                    id="message"
                                    placeholder="Describe your issue..."
                                    rows={5}
                                    value={newInitialMessage}
                                    onChange={(e) => setNewInitialMessage(e.target.value)}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                            <Button onClick={handleCreateQuery} disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Submit
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Chat / View Query Dialog */}
                <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
                    <DialogContent className="max-w-md sm:max-w-lg h-[80vh] flex flex-col p-0 gap-0">
                        <DialogHeader className="p-6 pb-2 border-b">
                            <DialogTitle>
                                {selectedQuery?.subject}
                            </DialogTitle>
                            <DialogDescription>
                                Status: <Badge variant="outline" className="ml-2">{selectedQuery?.status}</Badge>
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/10">
                            {selectedQuery?.messages?.map((msg) => (
                                <div key={msg.id} className={`flex ${msg.senderType === 'company' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] rounded-lg p-3 ${msg.senderType === 'company'
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted border'
                                        }`}>
                                        <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                                        <div className={`text-[10px] mt-1 opacity-70 ${msg.senderType === 'company' ? 'text-right pt-2 border-t border-primary-foreground/20' : ''}`}>
                                            {format(new Date(msg.createdAt), 'MMM d, p')}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {selectedQuery?.messages?.length === 0 && (
                                <div className="text-center text-muted-foreground text-sm italic py-10">
                                    No messages yet.
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t bg-background mt-auto">
                            <div className="flex gap-2">
                                <Textarea
                                    value={chatMessage}
                                    onChange={(e) => setChatMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    className="resize-none min-h-[50px] max-h-[100px]"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage();
                                        }
                                    }}
                                />
                                <Button size="icon" className="h-auto" onClick={handleSendMessage} disabled={isSendingMessage || !chatMessage.trim()}>
                                    {isSendingMessage ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
}
