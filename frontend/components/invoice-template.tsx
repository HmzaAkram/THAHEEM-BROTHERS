import React, { forwardRef } from 'react';
import { Bill } from '@/context/data-context';
import { formatDate } from '@/lib/utils';
import { Download } from 'lucide-react';

interface InvoiceTemplateProps {
    bill: Bill | null;
    hideAttachments?: boolean;
    attachmentDataUrl?: string | null;
    paidDate?: string;
}

export const InvoiceTemplate = forwardRef<HTMLDivElement, InvoiceTemplateProps>(({ bill, hideAttachments = false, paidDate }, ref) => {
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

    const trMatch = bill.note?.match(/\[TR:(\d+)\]/);
    const displayTaxRate = trMatch ? trMatch[1] : '15';
    const displayNote = bill.note?.replace(/\[TR:\d+\]/, '').trim();

    return (
        <div ref={ref} className="bg-white p-6 max-w-[210mm] mx-auto min-h-[297mm] relative text-slate-900" style={{ fontSize: '11px', lineHeight: '1.2' }}>

            {/* Header Section */}
            <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4 mb-4">
                <div className="flex gap-3 max-w-[60%]">
                    <div className="w-14 h-14 object-contain flex-shrink-0">
                        <img src="/logo.PNG" alt="Logo" className="w-full h-full" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold uppercase tracking-wide leading-tight">Thaheem Brothers</h1>
                        <div className="mt-2 text-xs text-slate-500 break-words leading-snug font-bold">
                            <p>Suite 23, 2nd Floor, R.K. Square Ext, Shahrah-e-Liaquat, Karachi</p>
                            <p>+92 21 32421347 | +92 300 2791780 | import.khi@hotmail.com</p>
                        </div>
                    </div>
                </div>
                <div className="text-right flex-shrink-0">
                    <h2 className="text-2xl font-black uppercase text-slate-900 tracking-tighter leading-none">Invoice</h2>
                    {/* Job Number Highlight */}
                    <div className="mt-1 text-right">
                        <p className="text-[10px] font-bold uppercase text-slate-400 leading-none">Job Number</p>
                        <p className="text-xl font-mono font-black leading-tight">{bill.jobNumber || 'N/A'}</p>
                    </div>
                    <div className="mt-2 text-right">
                        <p className="text-[10px] font-bold uppercase text-slate-400 leading-none">Date</p>
                        <p className="text-sm font-bold leading-tight">{formatDate(bill.date)}</p>
                    </div>
                    <div className="mt-2 bg-slate-100 px-2 py-0.5 rounded inline-block">
                        <span className="text-[10px] font-bold uppercase text-slate-500 mr-1.5">Status:</span>
                        <span className={`text-[10px] font-black uppercase ${bill.calculatedStatus === 'Paid' ? 'text-green-600' : 'text-red-600'}`}>
                            {bill.calculatedStatus || 'Unpaid'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Bill To & Details Grid */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 border-b border-slate-200 pb-0.5">Bill To</h3>
                    <div className="space-y-0.5">
                        <p className="text-sm font-bold break-words leading-tight">{companyName}</p>
                        <p className="text-[10px] text-slate-600 whitespace-pre-wrap break-words leading-tight">{companyAddress}</p>
                        <div className="mt-1 pt-1 border-t border-dashed border-slate-200 text-[10px]">
                            <p className="flex justify-between flex-wrap gap-1"><span className="text-slate-500 font-semibold">Phone:</span> <span className="break-all">{companyPhone}</span></p>
                            <p className="flex justify-between flex-wrap gap-1"><span className="text-slate-500 font-semibold">Email:</span> <span className="break-all">{companyEmail}</span></p>
                        </div>
                    </div>
                </div>
                <div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 border-b border-slate-200 pb-0.5">Shipment Details</h3>
                    <div className="grid grid-cols-3 gap-x-2 gap-y-1 text-[10px]">
                        <div>
                            <p className="text-[9px] text-slate-500 font-semibold uppercase leading-none">Job No</p>
                            <p className="font-bold break-words leading-tight">{bill.jobNumber || 'N/A'}</p>
                        </div>
                        <div className="col-span-2">
                            <p className="text-[9px] text-slate-500 font-semibold uppercase leading-none">Exporter</p>
                            <p className="font-bold break-words leading-tight">{bill.exporter || '-'}</p>
                        </div>
                        <div>
                            <p className="text-[9px] text-slate-500 font-semibold uppercase leading-none">GD No</p>
                            <p className="font-bold break-words leading-tight">{bill.gdNumber || '-'}</p>
                        </div>
                        <div>
                            <p className="text-[9px] text-slate-500 font-semibold uppercase leading-none">Weight</p>
                            <p className="font-bold break-words leading-tight">{bill.weight ? `${bill.weight} KG` : '-'}</p>
                        </div>
                        <div>
                            <p className="text-[9px] text-slate-500 font-semibold uppercase leading-none">Packages</p>
                            <p className="font-bold break-words leading-tight">{bill.packages || '-'}</p>
                        </div>
                        <div>
                            <p className="text-[9px] text-slate-500 font-semibold uppercase leading-none">VIA</p>
                            <p className="font-bold break-words leading-tight">{bill.via || '-'}</p>
                        </div>
                        <div>
                            <p className="text-[9px] text-slate-500 font-semibold uppercase leading-none">IGM No</p>
                            <p className="font-bold break-words leading-tight">{bill.igm || '-'}</p>
                        </div>
                        <div>
                            <p className="text-[9px] text-slate-500 font-semibold uppercase leading-none">Index No</p>
                            <p className="font-bold break-words leading-tight">{bill.indexNo || '-'}</p>
                        </div>
                        <div>
                            <p className="text-[9px] text-slate-500 font-semibold uppercase leading-none">HAWB No</p>
                            <p className="font-bold break-words leading-tight">{bill.hawb || '-'}</p>
                        </div>
                        <div className="col-span-3">
                            <p className="text-[9px] text-slate-500 font-semibold uppercase leading-none">Container Info</p>
                            <p className="font-bold break-words leading-tight">
                                {bill.noOfContainers ? `${bill.noOfContainers}x Containers` : ''}
                                {bill.containerNo ? ` (${bill.containerNo})` : ''}
                                {!bill.noOfContainers && !bill.containerNo && '-'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Items Table */}
            <div className="mb-4">
                <table className="w-full border-collapse table-fixed">
                    <thead>
                        <tr className="border-b-2 border-slate-900">
                            <th className="text-left py-1 text-[10px] font-black uppercase tracking-widest text-slate-600 w-[5%]">#</th>
                            <th className="text-left py-1 text-[10px] font-black uppercase tracking-widest text-slate-600 w-[35%]">Description</th>
                            <th className="text-left py-1 text-[10px] font-black uppercase tracking-widest text-slate-600 w-[15%]">Inv. No</th>
                            <th className="text-left py-1 text-[10px] font-black uppercase tracking-widest text-slate-600 w-[25%]">Notes</th>
                            <th className="text-right py-1 text-[10px] font-black uppercase tracking-widest text-slate-600 w-[20%]">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bill.items.map((item, index) => (
                            <tr key={index} className="border-b border-slate-200 text-[10px]">
                                <td className="py-1 align-top text-slate-500 font-mono">{index + 1}</td>
                                <td className="py-1 align-top font-bold text-slate-800 pr-2">
                                    <div className="break-words whitespace-pre-wrap leading-tight">{item.description}</div>
                                </td>
                                <td className="py-1 align-top text-slate-500 font-mono text-[9px] pr-2">
                                    <div className="break-words leading-tight">{item.invoiceNo || '-'}</div>
                                </td>
                                <td className="py-1 align-top text-slate-500 text-[9px] italic pr-2">
                                    <div className="break-words whitespace-pre-wrap leading-tight">{item.notes || '-'}</div>
                                </td>
                                <td className="py-1 align-top text-right font-mono font-bold text-slate-900 leading-tight">
                                    {parseFloat(item.amount as any).toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Footer / Totals */}
            <div className="flex justify-between items-start border-t-2 border-slate-900 pt-3 mt-auto">

                {/* Bank Details / Notes */}
                <div className="w-1/2 pr-6">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900 mb-1">Bank Details</h4>
                    <div className="text-[10px] flex flex-col gap-1 text-slate-600">
                        <div className="p-1.5 bg-slate-50 border border-slate-200 rounded">
                            <p className="font-bold text-slate-900 leading-none">Dubai Islamic Bank</p>
                            <p className="font-mono text-[9px]">PK92DUIB000000571507001</p>
                        </div>
                        <div className="p-1.5 bg-slate-50 border border-slate-200 rounded">
                            <p className="font-bold text-slate-900 leading-none">Bank Al-Habib</p>
                            <p className="font-mono text-[9px]">PK14BAHL5028008100103201</p>
                        </div>
                    </div>

                    {/* Attachment Link */}
                    {bill.attachment && !hideAttachments && (
                        <div className="mt-3">
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    window.open(bill.attachment, '_blank');
                                }}
                                className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                            >
                                <Download size={12} />
                                Download Attached Document (PDF)
                            </button>
                        </div>
                    )}

                    {/* Conditional Notes */}
                    <div className="mt-4 space-y-1">
                        {displayNote && displayNote.trim() !== '' && displayNote !== 'None' && displayNote !== 'No notes have been provided by the admin.' ? (
                            <p className="text-[10px] text-slate-600 italic font-medium">Note: {displayNote}</p>
                        ) : (
                            /* Fallback for old bills without note field or with 'None/No Notes' selected */
                            <div className="space-y-1">
                                {bill.attachment && (
                                    <p className="text-[10px] text-slate-600 italic font-medium">Note: All Necessary documents enclosed.</p>
                                )}
                                {advance === 0 && (
                                    <p className="text-[10px] text-slate-600 italic font-medium">Note: The consignee has not made any advance payment.</p>
                                )}
                                {(!bill.attachment && advance !== 0) && (
                                    <p className="text-[10px] text-slate-600 italic font-medium">Note: No notes have been provided by the admin.</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Calculation */}
                <div className="w-1/2 pl-6">
                    <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                            <span className="font-semibold text-slate-500">Subtotal</span>
                            <span className="font-mono font-bold">{subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-semibold text-slate-500">Service Charges</span>
                            <span className="font-mono font-bold">{serviceCharges.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200">
                            <span className="text-slate-500">SBR Sales Tax ({displayTaxRate}%)</span>
                            <span className="font-mono font-bold">{salesTax.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between pt-0.5">
                            <span className="font-bold text-slate-900">Grand Total</span>
                            <span className="font-mono font-black text-sm">{grandTotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-green-600">
                            <span className="font-semibold">Advance / Paid</span>
                            <span className="font-mono font-bold">(-) {advance.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t-2 border-slate-900 mt-1 items-center">
                            <span className="font-black uppercase tracking-widest text-slate-900 text-sm">Net Payable</span>
                            <span className="font-mono font-black text-xl text-slate-900">
                                {netPayable.toLocaleString()}
                            </span>
                        </div>
                        {/* Paid Date Message */}
                        {bill.calculatedStatus === 'Paid' && paidDate && (
                            <div className="pt-2 text-right">
                                <p className="text-[10px] font-bold text-green-600 uppercase tracking-tight">
                                    Total Bill is Paid at {formatDate(paidDate)}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
});

InvoiceTemplate.displayName = 'InvoiceTemplate';
