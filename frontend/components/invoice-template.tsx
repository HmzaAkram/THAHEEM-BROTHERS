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
        <div ref={ref} className="bg-white p-12 max-w-[210mm] mx-auto min-h-[297mm] relative text-slate-900 border" style={{ fontSize: '11px', lineHeight: '1.2' }}>

            {/* Header Section */}
            <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4 mb-6">
                <div className="flex gap-4 max-w-[65%]">
                    <div className="w-16 h-16 object-contain flex-shrink-0">
                        <img src="/logo.jpeg" alt="Logo" className="w-full h-full" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold uppercase tracking-wide leading-tight">Thaheem Brothers</h1>
                        <p className="text-[10px] font-bold text-slate-600 mt-0.5">CHALLAN NO. 2083 | NTN NO: 6491648</p>
                        <div className="mt-2 text-[10px] text-slate-500 break-words leading-relaxed font-semibold">
                            <p>Suite 23, 2nd Floor, R.K. Square Ext, Shahrah-e-Liaquat, Karachi</p>
                            <p>Phone: +92 21 32421347 | Mob: +92 300 2791780 | Email: import.khi@hotmail.com</p>
                        </div>
                    </div>
                </div>
                <div className="text-right flex-shrink-0">
                    <h2 className="text-3xl font-black uppercase text-slate-900 tracking-tighter leading-none mb-2">Invoice</h2>
                    <div className="space-y-1">
                        <div>
                            <p className="text-[9px] font-bold uppercase text-slate-400 leading-none">Job Number</p>
                            <p className="text-lg font-mono font-black leading-tight text-primary">{bill.jobNumber || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-bold uppercase text-slate-400 leading-none">Date</p>
                            <p className="text-sm font-bold leading-tight">{formatDate(bill.date)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bill To & Details Grid */}
            <div className="grid grid-cols-2 gap-8 mb-6">
                <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 border-b border-slate-200 pb-1">Bill To</h3>
                    <div className="space-y-1">
                        <p className="text-sm font-bold break-words leading-tight uppercase text-slate-800">{companyName}</p>
                        <p className="text-[10px] text-slate-600 whitespace-pre-wrap break-words leading-tight mb-2">{companyAddress}</p>

                        <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-dashed border-slate-200">
                            <div>
                                <p className="text-[8px] font-bold text-slate-400 uppercase leading-none">NTN No</p>
                                <p className="text-[10px] font-bold text-slate-700">{(bill as any).company?.ntn || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-[8px] font-bold text-slate-400 uppercase leading-none">Sales Tax (STRN)</p>
                                <p className="text-[10px] font-bold text-slate-700">{(bill as any).company?.saleTaxNo || 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 border-b border-slate-200 pb-1">Shipment Details</h3>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[10px]">
                        <div>
                            <p className="text-[9px] text-slate-500 font-semibold uppercase leading-none">Exporter</p>
                            <p className="font-bold break-words leading-tight">{bill.exporter || '-'}</p>
                        </div>
                        <div>
                            <p className="text-[9px] text-slate-500 font-semibold uppercase leading-none">VIA</p>
                            <p className="font-bold break-words leading-tight">{bill.via || '-'}</p>
                        </div>
                        <div>
                            <p className="text-[9px] text-slate-500 font-semibold uppercase leading-none">GD No</p>
                            <p className="font-bold break-words leading-tight font-mono">{bill.gdNumber || '-'}</p>
                        </div>
                        <div>
                            <p className="text-[9px] text-slate-500 font-semibold uppercase leading-none">Weight / Pkgs</p>
                            <p className="font-bold leading-tight">{bill.weight ? `${bill.weight} KG` : '-'} / {bill.packages || '-'}</p>
                        </div>
                        <div>
                            <p className="text-[9px] text-slate-500 font-semibold uppercase leading-none">IGM / Index</p>
                            <p className="font-bold leading-tight">{bill.igm || '-'} / {bill.indexNo || '-'}</p>
                        </div>
                        <div>
                            <p className="text-[9px] text-slate-500 font-semibold uppercase leading-none">HAWB No</p>
                            <p className="font-bold font-mono leading-tight">{bill.hawb || '-'}</p>
                        </div>
                        <div className="col-span-2">
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
            <div className="mb-8">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="border-y-2 border-slate-800 bg-slate-50/50">
                            <th className="text-left p-2 text-[10px] font-black uppercase tracking-widest text-slate-700 w-[8%]">#</th>
                            <th className="text-left p-2 text-[10px] font-black uppercase tracking-widest text-slate-700">Description of Charges</th>
                            <th className="text-left p-2 text-[10px] font-black uppercase tracking-widest text-slate-700 w-[15%]">Inv No</th>
                            <th className="text-right p-2 text-[10px] font-black uppercase tracking-widest text-slate-700 w-[20%]">Amount (PKR)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bill.items.map((item, index) => (
                            <tr key={index} className="border-b border-slate-100 hover:bg-slate-50/30 transition-colors">
                                <td className="p-2 align-top text-slate-500 font-mono text-[10px]">{String(index + 1).padStart(2, '0')}</td>
                                <td className="p-2 align-top">
                                    <div className="font-bold text-slate-800 text-xs leading-tight mb-1">{item.description}</div>
                                    {item.notes && <div className="text-[9px] text-slate-500 italic leading-tight">{item.notes}</div>}
                                </td>
                                <td className="p-2 align-top text-slate-500 font-mono text-[10px]">{item.invoiceNo || '-'}</td>
                                <td className="p-2 align-top text-right font-mono font-bold text-slate-900 text-xs">
                                    {parseFloat(item.amount as any).toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Bottom Section */}
            <div className="mt-auto">
                <div className="flex justify-between items-start pt-6 border-t-2 border-slate-800">
                    {/* Bank Details & Signature */}
                    <div className="w-1/2 pr-10 space-y-8">
                        <div>
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900 mb-2">Our Bank Details</h4>
                            <div className="grid grid-cols-1 gap-1.5">
                                <div className="p-2 bg-slate-50/80 border border-slate-200 rounded-lg">
                                    <p className="font-bold text-slate-900 text-[10px] leading-none mb-1">Dubai Islamic Bank</p>
                                    <p className="font-mono text-[9px] text-slate-600">A/C: PK92DUIB000000571507001</p>
                                </div>
                                <div className="p-2 bg-slate-50/80 border border-slate-200 rounded-lg">
                                    <p className="font-bold text-slate-900 text-[10px] leading-none mb-1">Bank Al-Habib</p>
                                    <p className="font-mono text-[9px] text-slate-600">A/C: PK14BAHL5028008100103201</p>
                                </div>
                            </div>
                        </div>

                        {/* Signature area */}
                        <div className="flex justify-between items-end pt-12">
                            <div className="text-center w-36">
                                <div className="border-b-2 border-slate-300 w-full mb-2 h-10 flex items-center justify-center">
                                    <span className="text-[8px] text-slate-300 italic">Official Seal here</span>
                                </div>
                                <p className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">Official Seal</p>
                            </div>
                            <div className="text-center w-36">
                                <div className="border-b-2 border-slate-300 w-full mb-2 h-10"></div>
                                <p className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">Authorized Signature</p>
                            </div>
                        </div>
                    </div>

                    {/* Totals Calculation */}
                    <div className="w-5/12 ml-auto">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                            <div className="flex justify-between text-xs">
                                <span className="font-semibold text-slate-500">Service Charges</span>
                                <span className="font-mono font-bold">{serviceCharges.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-xs pb-1 border-b border-slate-200">
                                <span className="text-slate-500">SBR Sales Tax ({displayTaxRate}%)</span>
                                <span className="font-mono font-bold">{salesTax.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between pt-1">
                                <span className="font-bold text-slate-900 text-xs">Total Bill Amount</span>
                                <span className="font-mono font-black text-sm">{grandTotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-green-600 text-xs italic">
                                <span>Advance Payment</span>
                                <span className="font-mono font-bold">(-) {advance.toLocaleString()}</span>
                            </div>

                            <div className="pt-3 mt-1 border-t-2 border-slate-900">
                                <div className="flex justify-between items-center">
                                    <span className="font-black uppercase tracking-widest text-slate-900 text-sm">Net Payable</span>
                                    <div className="text-right">
                                        <p className="font-mono font-black text-2xl text-slate-900 leading-none">
                                            {netPayable.toLocaleString()}
                                        </p>
                                        <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Amount in PKR</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Note area */}
                        <div className="mt-4 p-3 bg-primary/[0.03] border border-primary/10 rounded-lg">
                            <p className="text-[9px] font-black uppercase text-primary/60 mb-1 tracking-widest">Customer Note</p>
                            <p className="text-[10px] text-slate-600 italic leading-tight">
                                {displayNote && displayNote.trim() !== '' && displayNote !== 'None' && displayNote !== 'No notes have been provided by the admin.'
                                    ? displayNote
                                    : (bill.attachment ? "All Necessary documents enclosed." : "No specific notes for this invoice.")}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Print Footer */}
                <div className="mt-8 pt-4 border-t border-slate-100 flex justify-between items-center text-[8px] text-slate-400 font-bold uppercase tracking-widest">
                    <span>Generated by Thaheem Brothers Management System</span>
                    <span>Page 1 of 1</span>
                </div>
            </div>
        </div>
    );
});

InvoiceTemplate.displayName = 'InvoiceTemplate';
