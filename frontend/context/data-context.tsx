'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from './auth-context';
import ApiService from '@/lib/api';

// Types
export interface Company {
  id: string;
  identifier?: string;
  name: string;
  ntn?: string;
  saleTaxNo?: string;
  email: string;
  phone: string;
  address: string;
  username?: string;
  password?: string; // Optional for now to avoid breaking existing logic immediately
  openingBalance?: number;
  status: 'Active' | 'Inactive';
  createdAt: string;
}

export type BillStatus = 'Paid' | 'Partial' | 'Unpaid' | 'Draft';

export interface BillItem {
  id: string;
  description: string;
  notes?: string;
  amount: number;
  invoiceNo?: string;
}

export interface Bill {
  id: string;
  billNo?: string;
  companyId: string;
  companyName: string;
  date: string; // This will represent Arrival Date
  invoiceNo?: string;
  invoiceDate: string;
  jobNumber?: string;
  items: BillItem[];
  totalAmount: number;
  paidAmount: number;
  status: BillStatus;
  calculatedStatus: BillStatus;
  attachment?: string;
  attachments?: string[];
  via?: string;
  weight?: string | number;
  exporter?: string;
  note?: string;
  packages?: string | number;
  igm?: string;
  hawb?: string;
  indexNo?: string | number;
  gdNumber?: string;
  noOfContainers?: string | number;
  containerNo?: string;
  serviceCharges?: number;
  salesTax?: number;
  advancePayment?: number;
  grandTotal: number;
  createdAt: string;
}

const parseNumber = (val: any) => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  // Remove commas and other non-numeric chars except period and minus
  const cleaned = String(val).replace(/[^0-9.-]/g, '');
  return parseFloat(cleaned) || 0;
};

export interface Payment {
  id: string;
  companyId: string;
  companyName: string;
  date: string;
  amount: number;
  reference: string;
  method: string;
  // New Fields for Specific Methods
  trackingId?: string; // Bank Transfer
  chequeNo?: string;   // Cheque
  payOrderNo?: string; // Pay Order
  description?: string; // Advance / General
  adjustment?: number; // Adjustment Amount
  billId?: string;     // Linked Bill
  createdAt: string;
}

export interface LedgerEntry {
  id: string;
  date: string;
  description: string;
  debit: number; // Bill amount
  credit: number; // Payment amount
  balance: number;
  companyId: string;
  referenceId: string; // Bill ID or Payment ID
  type: 'BILL' | 'PAYMENT';
  companyName?: string;
  timestamp?: number;
  billNo?: string;
  jobNumber?: string;
  paymentRef?: string;
  method?: string;
  trackingId?: string;
  chequeNo?: string;
  payOrderNo?: string;
  note?: string;
  // Extra detailed bill fields for expansion
  via?: string;
  weight?: string | number;
  packages?: string | number;
  igm?: string;
  gdNumber?: string;
}

export interface SecurityTracking {
  id: string;
  companyId: string;
  companyName: string;
  gdNumber: string;
  noOfContainers: number;
  containerNo: string;
  amountPerContainer: number;
  refundDays: number;
  port: string;
  isDocumentSubmitted: boolean;
  refundDueDate: string;
  isRefundReceived: boolean;
  receivedAmountDate?: string | null;
  payOrderNo?: string | null;
  paidBy?: string | null;
  chequeName?: string | null;
  receiverName?: string | null;
  receiverContact?: string | null;
  depositBank?: string | null; // New field
  attachment?: string | null;   // New field (Path or URL)
  status: 'Pending' | 'Completed';
  createdAt: string;
}

export interface Exporter {
  id: string;
  name: string;
  createdAt: string;
}

export interface SaleTax {
  id: string;
  companyId: string;
  companyName: string;
  date: string;
  refBillNo?: string;
  clearingForwardingOf?: string;
  packages?: string;
  igmEgm?: string;
  igmEgmDate?: string;
  indexNo?: string;
  gdNo?: string;
  gdDate?: string;
  value: number;
  serviceCharges: number;
  salesTaxPercentage: number;
  grandTotal: number;
  words?: string;
  status: string;
  createdAt: string;
}

interface DataContextType {
  companies: Company[];
  bills: Bill[];
  payments: Payment[];
  addCompany: (company: Omit<Company, 'id' | 'createdAt'>) => void;
  updateCompany: (id: string, data: Partial<Company>) => void;
  deleteCompany: (id: string) => void;
  addBill: (bill: Omit<Bill, 'id' | 'createdAt' | 'paidAmount' | 'status' | 'calculatedStatus'>) => Promise<any>;
  updateBill: (id: string, bill: Partial<Bill>) => Promise<any>;
  updateBillStatus: (id: string, status: string) => Promise<any>;
  deleteBill: (id: string) => Promise<void>;
  addPayment: (payment: Omit<Payment, 'id' | 'createdAt'>) => Promise<any>;
  updatePayment: (id: string, payment: Partial<Payment>) => Promise<any>;
  deletePayment: (id: string) => Promise<void>;
  addSecurity: (security: Omit<SecurityTracking, 'id' | 'createdAt' | 'status'>) => Promise<any>;
  updateSecurity: (id: string, data: any) => Promise<any>; // Updated to return result
  deleteSecurity: (id: string) => Promise<void>;
  securities: SecurityTracking[];
  getCompanyLedger: (companyId: string) => LedgerEntry[];
  getCompanyBalance: (companyId: string) => number;
  getDashboardStats: () => {
    totalBilled: number;
    totalCollected: number;
    outstanding: number;
    activeCompanies: number;
  };
  refreshData: () => Promise<void>;
  isLoaded: boolean;
  exporters: Exporter[];
  addExporter: (exporter: Omit<Exporter, 'id' | 'createdAt'>) => Promise<any>;
  saleTaxes: SaleTax[];
  addSaleTax: (data: any) => Promise<any>;
  updateSaleTax: (id: string, data: any) => Promise<any>;
  deleteSaleTax: (id: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Initial data removed for backend integration
const INITIAL_COMPANIES: Company[] = [];
const INITIAL_BILLS: Bill[] = [];
const INITIAL_PAYMENTS: Payment[] = [];

export function DataProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isHydrated: isAuthHydrated } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [securities, setSecurities] = useState<SecurityTracking[]>([]);
  const [exporters, setExporters] = useState<Exporter[]>([]);
  const [saleTaxes, setSaleTaxes] = useState<SaleTax[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const refreshData = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const token = sessionStorage.getItem('authToken');

      const response = await ApiService.get('/bootstrap', token);

      if (response.ok && response.data) {
        const data = response.data;
        setCompanies(data.companies || []);
        setBills(Array.isArray(data.bills) ? data.bills : (data.bills?.data || []));
        setPayments(Array.isArray(data.payments) ? data.payments : (data.payments?.data || []));
        setSecurities(data.securities || []);
        setExporters(data.exporters || []);
        setSaleTaxes(data.saleTaxes || data.sale_taxes || []);
      } else {
        console.error('Failed to load bootstrap data:', response);
      }

      setIsLoaded(true);
    } catch (error) {
      console.error('Critical error fetching data:', error);
      // Don't throw - let app continue with existing data
    }
  }, [isAuthenticated]);

  // Load data on mount / auth change
  useEffect(() => {
    if (isAuthHydrated && isAuthenticated) {
      refreshData();
    }
  }, [isAuthenticated, isAuthHydrated, refreshData]);

  const addCompany = async (companyData: Omit<Company, 'id' | 'createdAt'>) => {
    const token = sessionStorage.getItem('authToken');
    const result = await ApiService.post('/companies', companyData, token);
    if (result.ok) {
      setCompanies(prev => [...prev, (result as any).data]);
      return { ok: true };
    } else {
      console.error('Failed to add company:', result.message, (result as any).data);
      return { ok: false, message: result.message };
    }
  };

  const addExporter = async (exporterData: Omit<Exporter, 'id' | 'createdAt'>) => {
    const token = sessionStorage.getItem('authToken');
    const result = await ApiService.post('/exporters', exporterData, token);
    if (result.ok && result.data) {
      setExporters(prev => [...prev, result.data]);
    }
    return result;
  };

  const updateCompany = async (id: string, data: Partial<Company>) => {
    const token = sessionStorage.getItem('authToken');
    const result = await ApiService.put(`/companies/${id}`, data, token);
    if (result.ok && result.data) {
      setCompanies(prev => prev.map(c => c.id === id ? result.data : c));
    }
  };

  const deleteCompany = async (id: string) => {
    const token = sessionStorage.getItem('authToken');
    const result = await ApiService.delete(`/companies/${id}`, token);
    if (result.ok) {
      setCompanies(prev => prev.filter(c => c.id !== id));
      refreshData();
    }
  };

  const deleteBill = async (id: string) => {
    const token = sessionStorage.getItem('authToken');
    const result = await ApiService.delete(`/bills/${id}`, token);
    if (result.ok) {
      setBills(prev => prev.filter(b => b.id !== id));
      refreshData();
    }
  };

  const addBill = async (billData: Omit<Bill, 'id' | 'createdAt' | 'paidAmount' | 'status' | 'calculatedStatus'>) => {
    const token = sessionStorage.getItem('authToken');
    const result = await ApiService.post('/bills', billData, token);
    if (result.ok && result.data) {
      // Ensure createdAt is present, fallback to now. Prepend so it appears at top.
      const newBill = { ...result.data, createdAt: result.data.createdAt || new Date().toISOString() };
      setBills(prev => [newBill, ...prev]);
    }
    return result;
  };

  const updateBill = async (id: string, billData: Partial<Bill>) => {
    const token = sessionStorage.getItem('authToken');
    const result = await ApiService.put(`/bills/${id}`, billData, token);
    if (result.ok && result.data) {
      setBills(prev => prev.map(b => b.id === id ? result.data : b));
    }
    return result;
  };

  const updateBillStatus = async (id: string, status: string) => {
    const token = sessionStorage.getItem('authToken');
    const result = await ApiService.patch(`/bills/${id}/status`, { status }, token);
    if (result.ok && result.data) {
      setBills(prev => prev.map(b => b.id === id ? { ...b, status: result.data.status } : b));
    }
    return result;
  };

  const addPayment = async (paymentData: Omit<Payment, 'id' | 'createdAt'>) => {
    const token = sessionStorage.getItem('authToken');

    // Optimistic update with rollback
    const tempId = `temp_${Date.now()}_${Math.random()}`;
    const tempPayment = { ...paymentData, id: tempId, createdAt: new Date().toISOString() } as Payment;

    setPayments(prev => [...prev, tempPayment]);

    try {
      const result = await ApiService.post('/payments', paymentData, token);

      if (result.ok && result.data) {
        // Backend returns an array of payments — remove temp and add all real ones
        const returnedPayments = Array.isArray(result.data) ? result.data : [result.data];
        setPayments(prev => [
          ...prev.filter(p => p.id !== tempId),
          ...returnedPayments,
        ]);

        // Re-fetch full payments list for consistency
        const paymentsRes = await ApiService.get('/payments?all=true', token);
        if (paymentsRes.ok) {
          const paymentsList = paymentsRes.data;
          setPayments(Array.isArray(paymentsList) ? paymentsList : (paymentsList?.data || []));
        }

        // Refresh bills to update their status
        const billsRes = await ApiService.get('/bills?all=true', token);
        if (billsRes.ok) {
          const billData = billsRes.data;
          setBills(Array.isArray(billData) ? billData : (billData?.data || []));
        }

        return result;
      } else {
        setPayments(prev => prev.filter(p => p.id !== tempId));
        return result;
      }
    } catch (error) {
      setPayments(prev => prev.filter(p => p.id !== tempId));
      console.error('Payment creation failed:', error);
      throw error;
    }
  };

  const updatePayment = async (id: string, paymentData: Partial<Payment>) => {
    const token = sessionStorage.getItem('authToken');
    const result = await ApiService.put(`/payments/${id}`, paymentData, token);
    if (result.ok && result.data) {
      setPayments(prev => prev.map(p => p.id === id ? result.data : p));

      // Refresh bills in case the payment edit affects bill statuses
      const billsRes = await ApiService.get('/bills?all=true', token);
      if (billsRes.ok) {
        const billData = billsRes.data;
        setBills(Array.isArray(billData) ? billData : (billData?.data || []));
      }
    }
    return result;
  };

  const deletePayment = async (id: string) => {
    const token = sessionStorage.getItem('authToken');
    const result = await ApiService.delete(`/payments/${id}`, token);
    if (result.ok) {
      setPayments(prev => prev.filter(p => p.id !== id));
      refreshData();
    }
  };

  const addSecurity = async (securityData: Omit<SecurityTracking, 'id' | 'createdAt' | 'status'>) => {
    const token = sessionStorage.getItem('authToken');
    const result = await ApiService.post('/securities', securityData, token);
    if (result.ok && result.data) {
      setSecurities(prev => [...prev, result.data]);
    }
    return result;
  };

  const updateSecurity = async (id: string, data: any) => {
    const token = sessionStorage.getItem('authToken');
    const result = await ApiService.put(`/securities/${id}`, data, token);
    if (result.ok && result.data) {
      setSecurities(prev => prev.map(s => s.id === id ? result.data : s));
      refreshData();
    }
    return result;
  };

  const deleteSecurity = async (id: string) => {
    const token = sessionStorage.getItem('authToken');
    const result = await ApiService.delete(`/securities/${id}`, token);
    if (result.ok) {
      setSecurities(prev => prev.filter(s => s.id !== id));
    }
  };

  const getCompanyLedger = (companyId: string): LedgerEntry[] => {
    // BUG FIX: Use numeric equality to prevent type confusion
    const companyBills = bills.filter(b => String(b.companyId) === String(companyId) && b.status !== 'Draft').flatMap(b => {
      const entries: LedgerEntry[] = [];

      // 1. Add Debit Entry (Gross Bill)
      entries.push({
        id: b.id + '_debit',
        date: b.date,
        description: `Job #${b.jobNumber || 'N/A'}`,
        debit: parseNumber(b.grandTotal),
        credit: 0,
        balance: 0,
        companyId: b.companyId,
        companyName: b.companyName,
        referenceId: b.id,
        type: 'BILL' as const,
        timestamp: new Date(b.date).getTime(),
        jobNumber: b.jobNumber,
        via: b.via,
        weight: b.weight,
        packages: b.packages,
        igm: b.igm,
        gdNumber: b.gdNumber,
      });

      // 2. Add Credit Entry if Advance was paid
      if (b.advancePayment && b.advancePayment > 0) {
        // Check for surplus applied marker in note
        const surplusMatch = b.note?.match(/\[Surplus Applied: ([\d,.]+)\]/);
        const description = surplusMatch
          ? `Surplus Applied (from previous overpayment) - Job #${b.jobNumber || 'N/A'}`
          : `Advance Payment - Job #${b.jobNumber || 'N/A'}`;

        entries.push({
          id: b.id + '_advance',
          date: b.date,
          description: description,
          debit: 0,
          credit: parseNumber(b.advancePayment),
          balance: 0,
          companyId: b.companyId,
          companyName: b.companyName,
          referenceId: b.id,
          type: 'PAYMENT' as const,
          timestamp: new Date(b.date).getTime() + 1, // Slightly after bill
          jobNumber: b.jobNumber
        });
      }

      return entries;
    });

    const companyPayments = payments.filter(p => String(p.companyId) === String(companyId)).map(p => {
      const linkedBill = bills.find(b => String(b.id) === String(p.billId));

      return {
        id: p.id + '_credit',
        date: p.date,
        description: p.description ? `Payment: ${p.description}` : `Payment Received`,
        debit: 0,
        credit: parseNumber(p.amount) + parseNumber(p.adjustment),
        balance: 0,
        companyId: p.companyId,
        companyName: p.companyName,
        referenceId: p.id,
        type: 'PAYMENT' as const,
        timestamp: new Date(p.date).getTime(),
        method: p.method,
        paymentRef: p.reference,
        trackingId: p.trackingId,
        chequeNo: p.chequeNo,
        payOrderNo: p.payOrderNo,
        jobNumber: linkedBill?.jobNumber
      };
    });

    const allEntries = [...companyBills, ...companyPayments].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

    // Inject Opening Balance
    const company = companies.find(c => String(c.id) === String(companyId));
    const openingBalanceAmount = parseNumber(company?.openingBalance);

    let entriesWithOpening = allEntries;
    if (openingBalanceAmount > 0) {
      const openingEntry: LedgerEntry = {
        id: `opening_${companyId}`,
        date: company?.createdAt ? new Date(company.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        description: 'Opening Balance',
        debit: openingBalanceAmount,
        credit: 0,
        balance: 0,
        companyId: companyId,
        companyName: company?.name,
        referenceId: `opening_${companyId}`,
        type: 'BILL' as const,
        timestamp: 0, // Ensure it's the very first entry
      };
      entriesWithOpening = [openingEntry, ...allEntries];
    }

    let runningBalance = 0;
    return entriesWithOpening.map(entry => {
      runningBalance = runningBalance + entry.debit - entry.credit;
      return { ...entry, balance: runningBalance };
    });
  };

  const getCompanyBalance = (companyId: string) => {
    const ledger = getCompanyLedger(companyId);
    return ledger.length > 0 ? ledger[ledger.length - 1].balance : 0;
  };

  const getDashboardStats = () => {
    const nonDraftBills = bills.filter(b => b.status !== 'Draft');
    
    const totalBilled = 
      nonDraftBills.reduce((sum, bill) => sum + parseNumber(bill.grandTotal), 0) + 
      companies.reduce((sum, c) => sum + parseNumber(c.openingBalance), 0);

    const totalCollected =
      nonDraftBills.reduce((sum, bill) => sum + parseNumber(bill.advancePayment), 0) +
      payments.reduce((sum, payment) => sum + parseNumber(payment.amount) + parseNumber(payment.adjustment), 0);

    const outstanding = totalBilled - totalCollected;
    const activeCompanies = companies.length;

    return { totalBilled, totalCollected, outstanding, activeCompanies };
  };

  const addSaleTax = async (data: any) => {
    const token = sessionStorage.getItem('authToken');
    const result = await ApiService.post('/sale-taxes', data, token);
    if (result.ok && result.data) {
      // Ensure createdAt is present, fallback to now. Prepend so it appears at top.
      const newSaleTax = { ...result.data, createdAt: result.data.createdAt || new Date().toISOString() };
      setSaleTaxes(prev => [newSaleTax, ...prev]);
    }
    return result;
  };

  const updateSaleTax = async (id: string, data: any) => {
    const token = sessionStorage.getItem('authToken');
    const result = await ApiService.put(`/sale-taxes/${id}`, data, token);
    if (result.ok && result.data) {
      setSaleTaxes(prev => prev.map(s => s.id === id ? result.data : s));
    }
    return result;
  };

  const deleteSaleTax = async (id: string) => {
    const token = sessionStorage.getItem('authToken');
    const result = await ApiService.delete(`/sale-taxes/${id}`, token);
    if (result.ok) {
      setSaleTaxes(prev => prev.filter(s => s.id !== id));
    }
  };

  return (
    <DataContext.Provider
      value={{
        companies,
        bills,
        payments,
        addCompany,
        updateCompany,
        deleteCompany,
        addBill,
        updateBill,
        updateBillStatus,
        deleteBill,
        addPayment,
        updatePayment,
        deletePayment,
        addSecurity,
        updateSecurity,
        deleteSecurity,
        securities,
        getCompanyLedger,
        getCompanyBalance,
        getDashboardStats,
        refreshData,
        isLoaded,
        exporters,
        addExporter,
        saleTaxes,
        addSaleTax,
        updateSaleTax,
        deleteSaleTax,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
