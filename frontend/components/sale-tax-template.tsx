import React, { forwardRef } from 'react';
import { SaleTax } from '@/context/data-context';
import { formatDate, formatCurrency } from '@/lib/utils';

interface SaleTaxTemplateProps {
  record: SaleTax | null;
}

export const SaleTaxTemplate = forwardRef<HTMLDivElement, SaleTaxTemplateProps>(({ record }, ref) => {
  if (!record) return null;

  const serviceCharges = Number(record.serviceCharges) || 0;
  const taxPercentage = Number(record.salesTaxPercentage) || 15;
  const taxAmount = serviceCharges * (taxPercentage / 100);
  const totalChargesAndTax = serviceCharges + taxAmount;

  const companyName = (record as any).company?.name || record.companyName;
  const companyAddress = (record as any).company?.address || 'N/A';
  const companyNtn = (record as any).company?.ntn || 'N/A';
  const companySaleTaxNo = (record as any).company?.saleTaxNo || 'N/A';

  return (
    <div ref={ref} className="bg-white p-12 max-w-[210mm] mx-auto min-h-[297mm] relative text-slate-900 border" style={{ fontSize: '11px', lineHeight: '1.4' }}>

      {/* Header */}
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
          <h2 className="text-2xl font-black uppercase text-slate-900 tracking-tighter leading-none mb-2">Sale Tax (SRB) Invoice</h2>
          <div className="space-y-1">
            <div>
              <p className="text-[9px] font-bold uppercase text-slate-400 leading-none">Invoice No</p>
              <p className="text-lg font-mono font-black leading-tight text-primary">{record.refBillNo || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase text-slate-400 leading-none">Date</p>
              <p className="text-sm font-bold leading-tight">{formatDate(record.date)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bill To & Details Grid */}
      <div className="grid grid-cols-2 gap-8 mb-6">
        <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-100">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 border-b border-slate-200 pb-1">Messrs</h3>
          <div className="space-y-1">
            <p className="text-sm font-bold break-words leading-tight uppercase text-slate-800">{companyName}</p>
            <p className="text-[10px] text-slate-600 whitespace-pre-wrap break-words leading-tight mb-2">{companyAddress}</p>
            <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-dashed border-slate-200">
              <div>
                <p className="text-[8px] font-bold text-slate-400 uppercase leading-none">NTN No</p>
                <p className="text-[10px] font-bold text-slate-700">{companyNtn}</p>
              </div>
              <div>
                <p className="text-[8px] font-bold text-slate-400 uppercase leading-none">S. Tax Reg No</p>
                <p className="text-[10px] font-bold text-slate-700">{companySaleTaxNo}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-100">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 border-b border-slate-200 pb-1">Invoice Details</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-[10px] text-slate-500 font-semibold">Our Ref Bill No.</span>
              <span className="text-[10px] font-bold">{record.refBillNo || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[10px] text-slate-500 font-semibold">Clearing/Forwarding Of</span>
              <span className="text-[10px] font-bold">{record.clearingForwardingOf || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[10px] text-slate-500 font-semibold">Packages</span>
              <span className="text-[10px] font-bold">{record.packages || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[10px] text-slate-500 font-semibold">IGM / EGM</span>
              <span className="text-[10px] font-bold">{record.igmEgm || '-'} {record.igmEgmDate ? `(${formatDate(record.igmEgmDate)})` : ''}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[10px] text-slate-500 font-semibold">Index No</span>
              <span className="text-[10px] font-bold">{record.indexNo || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[10px] text-slate-500 font-semibold">GD No</span>
              <span className="text-[10px] font-bold">{record.gdNo || '-'} {record.gdDate ? `(${formatDate(record.gdDate)})` : ''}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Breakdown */}
      <div className="mb-8">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-800 text-white">
              <th className="text-left py-2 px-4 text-[10px] uppercase font-bold tracking-wider border border-slate-700">Description</th>
              <th className="text-right py-2 px-4 text-[10px] uppercase font-bold tracking-wider border border-slate-700 w-40">Amount (Rs.)</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-200 hover:bg-slate-50">
              <td className="py-3 px-4 text-[11px] border border-slate-200 font-semibold">Service Charges &amp; Miscellaneous Expenses</td>
              <td className="py-3 px-4 text-[11px] text-right font-mono border border-slate-200">{formatCurrency(serviceCharges)}</td>
            </tr>
            <tr className="border-b border-slate-200 hover:bg-slate-50">
              <td className="py-3 px-4 text-[11px] border border-slate-200 font-semibold">Sales Tax @ {taxPercentage}%</td>
              <td className="py-3 px-4 text-[11px] text-right font-mono border border-slate-200">{formatCurrency(taxAmount)}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr className="bg-slate-100 border-t-2 border-slate-800">
              <td className="py-3 px-4 text-[12px] font-black uppercase border border-slate-300">Total Charges + Tax</td>
              <td className="py-3 px-4 text-[12px] text-right font-black font-mono border border-slate-300">{formatCurrency(totalChargesAndTax)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Amount in Words */}
      {record.words && (
        <div className="mb-8 p-3 bg-slate-50/80 rounded border border-slate-100">
          <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Amount Rupees in Words:</p>
          <p className="text-sm font-bold italic text-slate-700 leading-tight">{record.words}</p>
        </div>
      )}

      {/* Footer */}
      <div className="absolute bottom-10 left-12 right-12">
        <div className="flex justify-between items-end pt-4 border-t-2 border-slate-800">
          <div className="text-[9px] text-slate-400 font-semibold space-y-0.5">
            <p>This is a system generated Sale Tax (SRB) Invoice.</p>
            <p>Generated on {new Date().toLocaleDateString()}</p>
          </div>
          <div className="text-center">
            <div className="w-48 border-t border-slate-400 pt-2">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">For Thaheem Brothers</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

SaleTaxTemplate.displayName = 'SaleTaxTemplate';
