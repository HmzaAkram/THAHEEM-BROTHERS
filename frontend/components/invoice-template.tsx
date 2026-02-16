import React, { forwardRef } from 'react';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDate } from '@/lib/utils';
import { Bill } from '@/context/data-context';

interface InvoiceTemplateProps {
    bill: Bill | null;
    hideAttachments?: boolean;
    attachmentDataUrl?: string | null;
}

const statusStyles: Record<string, string> = {
    Paid: 'bg-green-100 text-green-800 border-green-200 shadow-sm',
    Partial: 'bg-yellow-100 text-yellow-800 border-yellow-200 shadow-sm',
    Unpaid: 'bg-red-100 text-red-800 border-red-200 shadow-sm',
};

export const InvoiceTemplate = forwardRef<HTMLDivElement, InvoiceTemplateProps>(({ bill, hideAttachments = false, attachmentDataUrl = null }, ref) => {
    if (!bill) return null;

    const isPaid = bill.calculatedStatus === 'Paid' || bill.status === 'Paid';

    return (
        <div ref={ref} className="bg-white p-4 max-w-4xl mx-auto relative overflow-hidden ring-1 ring-slate-200 shadow-lg rounded-2xl" suppressHydrationWarning>
            {/* PAID Stamp Effect - More Subtle */}
            {isPaid && (
                <div className="absolute top-16 right-8 rotate-[20deg] opacity-[0.08] pointer-events-none select-none z-0">
                    <div className="border-[8px] border-green-600 rounded-2xl p-4 flex flex-col items-center justify-center">
                        <span className="text-6xl font-black text-green-600 tracking-tighter leading-none">PAID</span>
                        <span className="text-lg font-bold text-green-600 uppercase tracking-[0.2em] mt-1">Processed</span>
                    </div>
                </div>
            )}

            <div className="relative z-10 space-y-2">
                {/* Brand Header - Ultra Compact */}
                <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center p-1 shadow-inner border border-slate-100">
                            <img
                                src="/logo.PNG"
                                alt="Thaheem Brothers"
                                className="w-full h-full object-contain"
                            />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-1">THAHEEM BROTHERS</h1>
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                                <p className="text-[10px] font-black text-primary tracking-widest uppercase">Logistics & Supply Chain Solutions</p>
                            </div>
                        </div>
                    </div>
                    <div className="text-right space-y-2">
                        <div className="inline-block transform skew-x-[-12deg] bg-slate-900 text-white px-4 py-1.5 rounded-md shadow-lg">
                            <span className="inline-block skew-x-[12deg] text-[10px] font-black uppercase tracking-[0.2em]">Official Invoice</span>
                        </div>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Original Document</p>
                    </div>
                </div>

                {/* Main Details Grid - Ultra Compact */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="col-span-2 grid grid-cols-2 gap-3 p-3 bg-slate-50/50 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden">

                        <div className="space-y-1 relative z-10">
                            <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">Invoice Reference</Label>
                            <p className="font-mono font-black text-xl text-slate-900 tracking-tighter">{bill.billNo}</p>
                        </div>

                        <div className="space-y-1 relative z-10">
                            <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">Billing Date</Label>
                            <p className="font-bold text-base text-slate-800">{formatDate(bill.date)}</p>
                        </div>

                        <div className="space-y-1 relative z-10">
                            <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">Billed To</Label>
                            <div className="space-y-0.5">
                                <p className="font-black text-lg text-primary leading-tight">{(bill as any).company?.name || bill.companyName}</p>
                                {(bill as any).company?.address && (
                                    <p className="text-[10px] font-medium text-muted-foreground max-w-[200px] leading-relaxed">{(bill as any).company.address}</p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-1 relative z-10">
                            <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">Job Number</Label>
                            <p className="font-mono font-black text-lg text-slate-700 bg-white px-2 py-1 rounded-md border border-slate-100 shadow-sm inline-block">{bill.jobNumber}</p>
                        </div>
                    </div>

                    <div className="flex flex-col justify-between p-4 bg-slate-900 rounded-2xl text-white shadow-xl border-4 border-white">
                        <div className="space-y-1">
                            <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground text-slate-400">Weight</Label>
                            <p className="text-xl font-black">{bill.weight ? `${bill.weight} KG` : 'N/A'}</p>
                        </div>
                        <div className="mt-2 pt-2 border-t border-white/10">
                            <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground text-slate-400">Status</Label>
                            <div className="mt-1">
                                <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-white/20 inline-block ${isPaid ? 'bg-green-500 text-white' : 'bg-amber-500 text-white'
                                    }`}>
                                    {bill.calculatedStatus || 'Unpaid'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Shipping Metadata - Ultra Compact */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 px-1">
                    <div className="space-y-1">
                        <Label className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Carrier / VIA</Label>
                        <p className="text-[10px] font-black text-slate-800 uppercase">{bill.via || 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Packages</Label>
                        <p className="text-[10px] font-black text-slate-800 uppercase">{bill.packages || 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">GD Ref</Label>
                        <p className="text-[10px] font-black text-slate-800 uppercase">{bill.gdNumber || 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">BE/ED Number</Label>
                        <p className="text-[10px] font-mono font-bold text-slate-800 tracking-tighter">{bill.beNumber || 'N/A'}</p>
                    </div>
                </div>

                {/* Itemized Table - More Compact Padding */}
                <div className="space-y-2">
                    <div className="overflow-hidden rounded-2xl border border-slate-100 shadow-sm">
                        <Table>
                            <TableHeader className="bg-slate-900 border-none">
                                <TableRow className="hover:bg-slate-900 border-none">
                                    <TableHead className="text-[9px] font-black text-slate-300 uppercase tracking-widest py-3">Service Description</TableHead>
                                    <TableHead className="text-[9px] font-black text-slate-300 uppercase tracking-widest py-3">Internal Notes</TableHead>
                                    <TableHead className="text-right text-[9px] font-black text-slate-300 uppercase tracking-widest py-3 px-6">Subtotal</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {bill.items.map((item, i) => (
                                    <TableRow key={i} className="group border-b border-slate-50 last:border-none">
                                        <TableCell className="font-black text-sm text-slate-800 py-3">{item.description}</TableCell>
                                        <TableCell className="text-[10px] font-bold text-muted-foreground italic group-hover:text-primary transition-colors">{item.notes || '-'}</TableCell>
                                        <TableCell className="text-right font-mono font-black text-sm text-slate-900 px-6">
                                            {item.amount.toLocaleString()}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {/* Calculations & Notes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                    <div className="space-y-4 self-start pt-2">
                        <div className="space-y-2 p-4 bg-red-50/50 rounded-2xl border border-red-100/50">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-red-800 mb-2">Important Notices</h3>
                            <div className="space-y-2">
                                {bill.attachment && (
                                    <div className="flex items-start gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-600 mt-1 flex-shrink-0" />
                                        <p className="text-xs font-black text-red-600 leading-tight uppercase tracking-tight">
                                            A high-resolution scanned copy of the document is enclosed.
                                        </p>
                                    </div>
                                )}
                                {(!bill.advancePayment || bill.advancePayment <= 0) && (
                                    <div className="flex items-start gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-600 mt-1 flex-shrink-0" />
                                        <p className="text-xs font-black text-red-600 leading-tight uppercase tracking-tight">
                                            The consignee has not made any advance payment.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Bank Card - Updated Terminology */}
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3 shadow-sm">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <h3 className="font-black text-[10px] uppercase tracking-widest text-primary">Bank Account Details</h3>
                                <div className="flex gap-1">
                                    <div className="w-0.5 h-3 bg-primary/20 rounded-full" />
                                    <div className="w-0.5 h-3 bg-primary/40 rounded-full" />
                                    <div className="w-0.5 h-3 bg-primary/60 rounded-full" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-1">
                                    <div className="flex justify-between items-end">
                                        <Label className="text-[8px] font-black text-muted-foreground uppercase text-slate-500">Dubai Islamic Bank</Label>
                                        <span className="text-[8px] font-black text-slate-400">Account #</span>
                                    </div>
                                    <p className="font-mono font-black text-xs text-slate-900 bg-white p-2 rounded-lg border border-slate-100 shadow-sm uppercase tracking-tight">PK92DUIB000000571507001</p>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between items-end">
                                        <Label className="text-[8px] font-black text-muted-foreground uppercase text-slate-500">Bank Al-Habib</Label>
                                        <span className="text-[8px] font-black text-slate-400">Account #</span>
                                    </div>
                                    <p className="font-mono font-black text-xs text-slate-900 bg-white p-2 rounded-lg border border-slate-100 shadow-sm uppercase tracking-tight">PK14BAHL5028008100103201</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="p-4 bg-slate-900 rounded-2xl text-white shadow-xl relative overflow-hidden ring-2 ring-slate-50">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-xs border-b border-white/5 pb-3">
                                    <span className="font-bold text-slate-400 uppercase tracking-widest text-[9px]">Total Items</span>
                                    <span className="font-mono font-black text-base">{bill.totalAmount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs border-b border-white/5 pb-3">
                                    <span className="font-bold text-slate-400 uppercase tracking-widest text-[9px]">Service Charges</span>
                                    <span className="font-mono font-black text-base">{(bill.serviceCharges || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs border-b border-white/5 pb-3">
                                    <span className="font-bold text-primary-foreground/80 uppercase tracking-widest text-[9px]">Sales Tax (15%)</span>
                                    <span className="font-mono font-black text-base text-primary-foreground">{(bill.salesTax || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs border-b border-white/5 pb-3 bg-green-500/10 px-4 -mx-4 py-2">
                                    <span className="font-black text-green-400 uppercase tracking-widest text-[9px]">Advance Credit</span>
                                    <span className="font-mono font-black text-base text-green-400">- {(bill.advancePayment || 0).toLocaleString()}</span>
                                </div>
                                <div className="pt-2 space-y-1">
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 text-center mb-1">Total Payable Amount</p>
                                    <div className="text-center p-4 bg-white/5 rounded-2xl border border-white/10">
                                        <p className="text-3xl font-black text-white font-mono tracking-tighter">
                                            {bill.grandTotal.toLocaleString()}
                                        </p>
                                        <span className="text-[8px] font-black text-slate-500 tracking-widest uppercase">PKR Currency</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Brand */}
                <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-4 bg-primary rounded-full" />
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.4em]">Powered by TB Logistics</p>
                    </div>
                    <div className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">
                        Certified Document #{bill.id?.toString().slice(-6).toUpperCase() || 'OFFICIAL'}
                    </div>
                </div>
                {/* Attachments Section - High Fidelity */}
                {bill.attachment && !hideAttachments && (
                    <div className="pt-20 mt-20 border-t-4 border-dashed border-slate-100">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-primary/10 rounded-2xl">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.51a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
                            </div>
                            <div>
                                <h3 className="font-black text-xl uppercase tracking-tighter text-slate-900">Digital Enclosures</h3>
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Linked supporting documentation</p>
                            </div>
                        </div>

                        <div className="bg-slate-50 rounded-[3rem] p-10 border border-slate-200 shadow-inner group">
                            <div className="flex justify-center flex-col items-center">
                                <div className="relative inline-block border-[12px] border-white rounded-[3rem] shadow-2xl overflow-hidden bg-white max-w-full">
                                    <img
                                        src={attachmentDataUrl || `${bill.attachment}${bill.attachment.includes('?') ? '&' : '?'}t=${Date.now()}`}
                                        alt="Bill Attachment"
                                        crossOrigin="anonymous"
                                        className="max-w-full h-auto max-h-[1200px] object-contain transition-transform group-hover:scale-[1.02] duration-700"
                                    />
                                    <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-[2rem]" />

                                    {/* External View Link - Repositioned for standard image view */}
                                    <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <a
                                            href={bill.attachment}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="bg-primary/90 backdrop-blur-sm text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 transition-all flex items-center gap-2"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6" /><path d="M10 14 21 3" /><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /></svg>
                                            External View
                                        </a>
                                    </div>
                                </div>
                                <div className="mt-8 flex items-center gap-2 px-6 py-2 bg-white/50 backdrop-blur-sm rounded-full border border-white shadow-sm font-black text-[10px] text-slate-400 uppercase tracking-[0.3em]">
                                    <span className="w-2 h-2 rounded-full bg-primary" />
                                    End of Document
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
});

InvoiceTemplate.displayName = 'InvoiceTemplate';
