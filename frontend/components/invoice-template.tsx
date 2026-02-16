import React, { forwardRef } from 'react';
import { Bill } from '@/context/data-context';
import { formatDate } from '@/lib/utils';
import { Download } from 'lucide-react';

interface InvoiceTemplateProps {
    bill: Bill | null;
    hideAttachments?: boolean;
    attachmentDataUrl?: string | null;
}

export const InvoiceTemplate = forwardRef<HTMLDivElement, InvoiceTemplateProps>(({ bill, hideAttachments = false }, ref) => {
    if (!bill) return null;

    // Calculate totals - Ensure numerical addition
    const subtotal = bill.items.reduce((sum, item) => sum + (parseFloat(item.amount as any) || 0), 0);
    const serviceCharges = parseFloat(bill.serviceCharges as any) || 0;
    const salesTax = parseFloat(bill.salesTax as any) || 0;
    const grandTotal = bill.grandTotal ? parseFloat(bill.grandTotal as any) : (subtotal + serviceCharges + salesTax);
    const advance = parseFloat(bill.advancePayment as any) || 0;
    const netPayable = grandTotal - advance;

    const companyName = (bill as any).company?.name || bill.companyName;
    const companyAddress = (bill as any).company?.address || 'N/A';
    const companyPhone = (bill as any).company?.phone || 'N/A';
    const companyEmail = (bill as any).company?.email || 'N/A';

    return (
        <div ref={ref} className="bg-white p-8 max-w-[210mm] mx-auto min-h-[297mm] relative text-slate-900" style={{ fontSize: '12px', lineHeight: '1.4' }}>

            {/* Header Section */}
            <div className="flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-6">
                <div className="flex gap-4 max-w-[60%]">
                    <div className="w-16 h-16 object-contain flex-shrink-0">
                        <img src="/logo.PNG" alt="Logo" className="w-full h-full" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold uppercase tracking-wide">Thaheem Brothers</h1>
                        <p className="text-xs text-slate-600 uppercase tracking-widest font-semibold">Logistics & Supply Chain Solutions</p>
                        <div className="mt-2 text-xs text-slate-500 break-words">
                            <p>Office # 123, Business Center</p>
                            <p>Karachi, Pakistan</p>
                            <p>+92 300 1234567 | info@thaheembrothers.com</p>
                        </div>
                    </div>
                </div>
                <div className="text-right flex-shrink-0">
                    <h2 className="text-3xl font-black uppercase text-slate-900 tracking-tighter">Invoice</h2>
                    <p className="text-sm font-bold text-slate-500 mt-1">#{bill.billNo}</p>
                    <div className="mt-2 bg-slate-100 px-3 py-1 rounded inline-block">
                        <span className="text-xs font-bold uppercase text-slate-500 mr-2">Status:</span>
                        <span className={`text-xs font-black uppercase ${bill.calculatedStatus === 'Paid' ? 'text-green-600' : 'text-red-600'}`}>
                            {bill.calculatedStatus || 'Unpaid'}
                        </span>
                    </div>
                    {/* Job Number Highlight */}
                    <div className="mt-2">
                        <p className="text-xs font-bold uppercase text-slate-400">Job Number</p>
                        <p className="text-lg font-mono font-black">{bill.jobNumber || bill.billNo}</p>
                    </div>
                </div>
            </div>

            {/* Bill To & Details Grid */}
            <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 border-b border-slate-200 pb-1">Bill To</h3>
                    <div className="space-y-1">
                        <p className="text-lg font-bold break-words">{companyName}</p>
                        <p className="text-sm text-slate-600 whitespace-pre-wrap break-words">{companyAddress}</p>
                        <div className="mt-2 pt-2 border-t border-dashed border-slate-200">
                            <p className="flex justify-between flex-wrap"><span className="text-slate-500 font-semibold">Phone:</span> <span className="break-all">{companyPhone}</span></p>
                            <p className="flex justify-between flex-wrap"><span className="text-slate-500 font-semibold">Email:</span> <span className="break-all">{companyEmail}</span></p>
                        </div>
                    </div>
                </div>
                <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 border-b border-slate-200 pb-1">Shipment Details</h3>
                    <div className="grid grid-cols-3 gap-x-2 gap-y-2 text-[10px]">
                        <div>
                            <p className="text-[9px] text-slate-500 font-semibold uppercase">Job No</p>
                            <p className="font-bold break-words">{bill.jobNumber || bill.billNo}</p>
                        </div>
                        <div className="col-span-2">
                            <p className="text-[9px] text-slate-500 font-semibold uppercase">Exporter</p>
                            <p className="font-bold break-words">{bill.exporter || '-'}</p>
                        </div>
                        <div>
                            <p className="text-[9px] text-slate-500 font-semibold uppercase">Date</p>
                            <p className="font-bold">{formatDate(bill.date)}</p>
                        </div>
                        <div>
                            <p className="text-[9px] text-slate-500 font-semibold uppercase">Arrival Date</p>
                            <p className="font-bold">{bill.invoiceDate ? formatDate(bill.invoiceDate) : '-'}</p>
                        </div>
                        <div>
                            <p className="text-[9px] text-slate-500 font-semibold uppercase">GD Ref</p>
                            <p className="font-bold break-words">{bill.gdNumber || '-'}</p>
                        </div>
                        <div>
                            <p className="text-[9px] text-slate-500 font-semibold uppercase">Weight</p>
                            <p className="font-bold break-words">{bill.weight ? `${bill.weight} KG` : '-'}</p>
                        </div>
                        <div>
                            <p className="text-[9px] text-slate-500 font-semibold uppercase">Packages</p>
                            <p className="font-bold break-words">{bill.packages || '-'}</p>
                        </div>
                        <div>
                            <p className="text-[9px] text-slate-500 font-semibold uppercase">VIA</p>
                            <p className="font-bold break-words">{bill.via || '-'}</p>
                        </div>
                        <div>
                            <p className="text-[9px] text-slate-500 font-semibold uppercase">IGM No</p>
                            <p className="font-bold break-words">{bill.igm || '-'}</p>
                        </div>
                        <div>
                            <p className="text-[9px] text-slate-500 font-semibold uppercase">Index No</p>
                            <p className="font-bold break-words">{bill.indexNo || '-'}</p>
                        </div>
                        <div>
                            <p className="text-[9px] text-slate-500 font-semibold uppercase">HAWB No</p>
                            <p className="font-bold break-words">{bill.hawb || '-'}</p>
                        </div>
                        <div className="col-span-3">
                            <p className="text-[9px] text-slate-500 font-semibold uppercase">Container Info</p>
                            <p className="font-bold break-words">
                                {bill.noOfContainers ? `${bill.noOfContainers}x Containers` : ''}
                                {bill.containerNo ? ` (${bill.containerNo})` : ''}
                                {!bill.noOfContainers && !bill.containerNo && '-'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Items Table */}
            <div className="mb-8">
                <table className="w-full border-collapse table-fixed">
                    <thead>
                        <tr className="border-b-2 border-slate-900">
                            <th className="text-left py-2 text-xs font-black uppercase tracking-widest text-slate-600 w-[5%]">#</th>
                            <th className="text-left py-2 text-xs font-black uppercase tracking-widest text-slate-600 w-[35%]">Description</th>
                            <th className="text-left py-2 text-xs font-black uppercase tracking-widest text-slate-600 w-[15%]">Inv. No</th>
                            <th className="text-left py-2 text-xs font-black uppercase tracking-widest text-slate-600 w-[25%]">Notes</th>
                            <th className="text-right py-2 text-xs font-black uppercase tracking-widest text-slate-600 w-[20%]">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bill.items.map((item, index) => (
                            <tr key={index} className="border-b border-slate-200 text-sm">
                                <td className="py-2 align-top text-slate-500 font-mono">{index + 1}</td>
                                <td className="py-2 align-top font-bold text-slate-800 pr-2">
                                    <div className="break-words whitespace-pre-wrap">{item.description}</div>
                                </td>
                                <td className="py-2 align-top text-slate-500 font-mono text-xs pr-2">
                                    <div className="break-words">{item.invoiceNo || '-'}</div>
                                </td>
                                <td className="py-2 align-top text-slate-500 text-xs italic pr-2">
                                    <div className="break-words whitespace-pre-wrap">{item.notes || '-'}</div>
                                </td>
                                <td className="py-2 align-top text-right font-mono font-bold text-slate-900">
                                    {parseFloat(item.amount as any).toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Footer / Totals */}
            <div className="flex justify-between items-start border-t-2 border-slate-900 pt-6">

                {/* Bank Details / Notes */}
                <div className="w-1/2 pr-8">
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 mb-2">Bank Details</h4>
                    <div className="text-xs space-y-2 text-slate-600">
                        <div className="p-2 bg-slate-50 border border-slate-200 rounded">
                            <p className="font-bold text-slate-900">Dubai Islamic Bank</p>
                            <p className="font-mono">PK92DUIB000000571507001</p>
                        </div>
                        <div className="p-2 bg-slate-50 border border-slate-200 rounded">
                            <p className="font-bold text-slate-900">Bank Al-Habib</p>
                            <p className="font-mono">PK14BAHL5028008100103201</p>
                        </div>
                    </div>

                    {/* Attachment Link */}
                    {bill.attachment && !hideAttachments && (
                        <div className="mt-6">
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    window.open(bill.attachment, '_blank');
                                }}
                                className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                            >
                                <Download size={14} />
                                Download Attached Document (PDF)
                            </button>
                        </div>
                    )}
                </div>

                {/* Calculation */}
                <div className="w-1/2 pl-8">
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="font-semibold text-slate-500">Subtotal</span>
                            <span className="font-mono font-bold">{subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-semibold text-slate-500">Service Charges</span>
                            <span className="font-mono font-bold">{serviceCharges.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200 pb-2">
                            <span className="font-semibold text-slate-500">Sales Tax (15%)</span>
                            <span className="font-mono font-bold">{salesTax.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between pt-1">
                            <span className="font-bold text-slate-900">Grand Total</span>
                            <span className="font-mono font-black text-lg">{grandTotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-green-600">
                            <span className="font-semibold">Advance / Paid</span>
                            <span className="font-mono font-bold">(-) {advance.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between pt-4 border-t-2 border-slate-900 mt-2 items-center">
                            <span className="font-black uppercase tracking-widest text-slate-900">Net Payable</span>
                            <span className="font-mono font-black text-2xl bg-slate-900 text-white px-3 py-1 rounded">
                                {netPayable.toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

InvoiceTemplate.displayName = 'InvoiceTemplate';
