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
    MessageSquare,
    Loader2,
    Search,
    CheckCircle2,
    Clock,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { DashboardLayout } from '@/components/dashboard-layout';

interface Company {
    id: number;
    name: string;
    identifier: string;
}

interface QueryMessage {
    id: number;
    message: string;
    senderType: 'company' | 'admin';
    createdAt: string;
}

interface Query {
    id: number;
    company: Company;
    subject: string;
    status: 'pending' | 'replied';
    createdAt: string;
    messages?: QueryMessage[];
}

export default function AdminQueriesPage() {
    const { token, isHydrated: authHydrated } = useAuth();
    const { toast } = useToast();
    const [queries, setQueries] = useState<Query[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter]);

    const adminQuickReplies = [
        "Okay, I am looking into this right now.",
        "Sorry for the mistake, the charges have been updated.",
        "Your payment has been verified and updated.",
        "Please provide more details regarding this issue."
    ];

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

    useEffect(() => {
        if (authHydrated && token) {
            fetchQueries();
        } else if (authHydrated && !token) {
            setLoading(false);
        }
    }, [authHydrated, token]);

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

    const filteredQueries = queries.filter(q => {
        const matchesSearch =
            q.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
            q.company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            q.company.identifier.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || q.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const totalPages = Math.ceil(filteredQueries.length / itemsPerPage);
    const paginatedQueries = filteredQueries.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    if (!authHydrated) {
        return (
            <DashboardLayout role="admin">
                <div className="flex h-[80vh] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout role="admin">
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Support Queries</h1>
                    <p className="text-muted-foreground">
                        Manage and reply to queries from companies.
                    </p>
                </div>

                <Card className="shadow-sm">
                    <CardHeader className="pb-3">
                        <div className="flex flex-col sm:flex-row gap-4 justify-between">
                            <div className="relative flex-1">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by company or subject..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-8"
                                />
                            </div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="replied">Replied</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : filteredQueries.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                No queries found matching your criteria.
                            </div>
                        ) : (
                            <>
                                <div className="rounded-md border overflow-hidden">
                                    <Table>
                                    <TableHeader className="bg-muted/50">
                                        <TableRow>
                                            <TableHead>Company</TableHead>
                                            <TableHead>Subject</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead className="text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginatedQueries.map((query) => (
                                            <TableRow key={query.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openChat(query)}>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{query.company.name}</span>
                                                        <span className="text-xs text-muted-foreground">{query.company.identifier}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {query.subject}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={query.status === 'replied' ? 'default' : 'secondary'} className="gap-1">
                                                        {query.status === 'replied' ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                                                        {query.status === 'replied' ? 'Replied' : 'Pending'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{format(new Date(query.createdAt), 'MMM d, yyyy')}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm">View</Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                            
                            {/* Pagination Controls */}
                            {totalPages > 0 && (
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
                                    <p className="text-sm text-muted-foreground w-full text-center sm:text-left">
                                        Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredQueries.length)} of {filteredQueries.length} entries
                                    </p>
                                    <div className="flex items-center gap-1.5 w-full justify-center sm:justify-end">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                            disabled={currentPage === 1}
                                            className="h-8 shadow-sm rounded-lg"
                                        >
                                            Previous
                                        </Button>
                                        <div className="flex items-center gap-1 hidden md:flex">
                                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                                                .map((p, i, arr) => {
                                                    if (i > 0 && p - arr[i - 1] > 1) {
                                                        return (
                                                            <div key={`ellipsis-${p}`} className="flex items-center gap-1">
                                                                <span className="px-2 text-muted-foreground">...</span>
                                                                <Button
                                                                    variant={currentPage === p ? 'default' : 'outline'}
                                                                    size="sm"
                                                                    onClick={() => setCurrentPage(p)}
                                                                    className={`h-8 w-8 p-0 rounded-lg shadow-sm ${currentPage === p ? 'bg-primary text-primary-foreground font-bold hover:bg-primary/90' : 'text-slate-600 hover:text-slate-900 border-border/50 bg-slate-50'}`}
                                                                >
                                                                    {p}
                                                                </Button>
                                                            </div>
                                                        );
                                                    }
                                                    return (
                                                        <Button
                                                            key={p}
                                                            variant={currentPage === p ? 'default' : 'outline'}
                                                            size="sm"
                                                            onClick={() => setCurrentPage(p)}
                                                            className={`h-8 w-8 p-0 rounded-lg shadow-sm ${currentPage === p ? 'bg-primary text-primary-foreground font-bold hover:bg-primary/90' : 'text-slate-600 hover:text-slate-900 border-border/50 bg-white'}`}
                                                        >
                                                            {p}
                                                        </Button>
                                                    );
                                                })}
                                        </div>
                                        <span className="md:hidden text-sm px-2 font-medium">
                                            Page {currentPage} of {totalPages}
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                            disabled={currentPage === totalPages}
                                            className="h-8 shadow-sm rounded-lg"
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                        )}
                    </CardContent>
                </Card>

                {/* Chat Dialog */}
                <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
                    <DialogContent className="max-w-2xl h-[80vh] flex flex-col p-0 gap-0">
                        <DialogHeader className="p-6 pb-2 border-b">
                            <div className="flex items-center gap-2">
                                <DialogTitle>
                                    {selectedQuery?.subject}
                                </DialogTitle>
                                <Badge variant="outline" className="capitalize">{selectedQuery?.status}</Badge>
                            </div>
                            <DialogDescription>
                                {selectedQuery?.company.name} ({selectedQuery?.company.identifier})
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/10">
                            {selectedQuery?.messages?.map((msg) => (
                                <div key={msg.id} className={`flex ${msg.senderType === 'admin' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] rounded-lg p-3 ${msg.senderType === 'admin'
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted border'
                                        }`}>
                                        <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                                        <div className={`text-[10px] mt-1 opacity-70 ${msg.senderType === 'admin' ? 'text-right pt-2 border-t border-primary-foreground/20' : ''}`}>
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

                        <div className="p-4 border-t bg-background mt-auto flex flex-col gap-3">
                            {/* Quick Replies Row */}
                            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide hide-scrollbar">
                                {adminQuickReplies.map((reply, idx) => (
                                    <Badge
                                        key={idx}
                                        variant="outline"
                                        className="cursor-pointer whitespace-nowrap hover:bg-primary hover:text-primary-foreground transition-colors"
                                        onClick={() => setChatMessage(reply)}
                                    >
                                        {reply}
                                    </Badge>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <Textarea
                                    value={chatMessage}
                                    onChange={(e) => setChatMessage(e.target.value)}
                                    placeholder="Type a reply..."
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
