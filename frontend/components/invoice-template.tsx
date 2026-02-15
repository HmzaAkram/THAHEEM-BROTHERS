import React, { forwardRef } from 'react';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDate } from '@/lib/utils';
import { Bill } from '@/context/data-context';

interface InvoiceTemplateProps {
    bill: Bill | null;
}

const statusStyles: Record<string, string> = {
    Paid: 'bg-green-100 text-green-800 border-green-200',
    Partial: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    Unpaid: 'bg-red-100 text-red-800 border-red-200',
};

export const InvoiceTemplate = forwardRef<HTMLDivElement, InvoiceTemplateProps>(({ bill }, ref) => {
    if (!bill) return null;

    return (
        <div ref={ref} className="bg-white p-8 max-w-4xl mx-auto">
            <div className="space-y-8 py-4">
                {/* Header Section */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 p-6 bg-muted/30 rounded-2xl border">
                    <div>
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Invoice No</Label>
                        <p className="font-mono font-bold text-lg">{bill.billNo}</p>
                    </div>
                    <div>
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Date</Label>
                        <p className="font-semibold">{formatDate(bill.date)}</p>
                    </div>
                    <div>
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Job No</Label>
                        <p className="font-mono font-semibold">{bill.jobNumber}</p>
                    </div>
                    <div>
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Status</Label>
                        <div className="mt-1">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusStyles[bill.calculatedStatus || 'Unpaid']}`}>
                                {bill.calculatedStatus || 'Unpaid'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <h3 className="font-bold text-sm uppercase tracking-widest text-primary">Shipment Details</h3>
                        <div className="space-y-2 grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-[10px] font-bold text-muted-foreground">VIA</Label>
                                <p className="text-sm font-medium">{bill.via || 'N/A'}</p>
                            </div>
                            <div>
                                <Label className="text-[10px] font-bold text-muted-foreground">Weight</Label>
                                <p className="text-sm font-medium">{bill.weight ? `${bill.weight} KG` : 'N/A'}</p>
                            </div>
                            <div>
                                <Label className="text-[10px] font-bold text-muted-foreground">Packages</Label>
                                <p className="text-sm font-medium">{bill.packages || 'N/A'}</p>
                            </div>
                            <div>
                                <Label className="text-[10px] font-bold text-muted-foreground">GD No</Label>
                                <p className="text-sm font-medium">{bill.gdNumber || 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-bold text-sm uppercase tracking-widest text-primary">Customs Info</h3>
                        <div className="space-y-2 grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <Label className="text-[10px] font-bold text-muted-foreground">Exporter</Label>
                                <p className="text-sm font-medium">{bill.exporter || 'N/A'}</p>
                            </div>
                            <div>
                                <Label className="text-[10px] font-bold text-muted-foreground">BE Number</Label>
                                <p className="text-sm font-mono text-xs">{bill.beNumber || 'N/A'}</p>
                            </div>
                            <div>
                                <Label className="text-[10px] font-bold text-muted-foreground">HAWB</Label>
                                <p className="text-sm font-medium">{bill.hawb || 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="font-bold text-sm uppercase tracking-widest text-primary">Itemized Charges</h3>
                    <div className="border rounded-2xl overflow-hidden">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="text-[10px] font-bold">DESCRIPTION</TableHead>
                                    <TableHead className="text-[10px] font-bold">NOTES</TableHead>
                                    <TableHead className="text-right text-[10px] font-bold">AMOUNT</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {bill.items.map((item, i) => (
                                    <TableRow key={i}>
                                        <TableCell className="font-medium text-sm">{item.description}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground italic">{item.notes}</TableCell>
                                        <TableCell className="text-right font-mono text-sm">{item.amount.toLocaleString()}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <div className="w-full max-w-sm space-y-3 bg-slate-50 dark:bg-slate-900 p-6 rounded-2xl border">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Total Items</span>
                            <span className="font-mono">PKR {bill.totalAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Service Charges</span>
                            <span className="font-mono">PKR {(bill.serviceCharges || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm text-primary font-semibold">
                            <span>SBR Sales Tax (15%)</span>
                            <span className="font-mono">PKR {(bill.salesTax || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm text-green-600 font-semibold border-b pb-2">
                            <span>Advance Received</span>
                            <span className="font-mono">- PKR {(bill.advancePayment || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-end pt-2">
                            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Grand Total</span>
                            <span className="text-2xl font-black text-primary font-mono tracking-tighter">
                                PKR {bill.grandTotal.toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

InvoiceTemplate.displayName = 'InvoiceTemplate';
