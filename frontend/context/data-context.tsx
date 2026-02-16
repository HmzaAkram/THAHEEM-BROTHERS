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
  email: string;
  phone: string;
  address: string;
  username?: string;
  password?: string; // Optional for now to avoid breaking existing logic immediately
  status: 'Active' | 'Inactive';
  createdAt: string;
}

export type BillStatus = 'Paid' | 'Partial' | 'Unpaid';

export interface BillItem {
  id: string;
  description: string;
  notes?: string;
  amount: number;
  invoiceNo?: string;
}

export interface Bill {
  id: string;
  billNo: string;
  companyId: string;
  companyName: string;
  date: string; // This will represent Arrival Date
  invoiceNo?: string;
  invoiceDate: string;
  jobNumber: string;
  items: BillItem[];
  totalAmount: number;
  paidAmount: number;
  status: BillStatus;
  calculatedStatus: BillStatus;
  attachment?: string;
  via?: string;
  weight?: string | number;
  exporter?: string;
  beNumber?: string;
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
  receivedAmountDate?: string;
  payOrderNo: string;
  receiverName: string;
  status: 'Pending' | 'Completed';
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
  addPayment: (payment: Omit<Payment, 'id' | 'createdAt'>) => Promise<any>;
  addSecurity: (security: Omit<SecurityTracking, 'id' | 'createdAt' | 'status'>) => Promise<any>;
  updateSecurity: (id: string, data: Partial<SecurityTracking>) => void;
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
  const [isLoaded, setIsLoaded] = useState(false);

  const refreshData = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const token = localStorage.getItem('auth_token');

      // BUG FIX: Use Promise.allSettled instead of Promise.all
      // This prevents one API failure from breaking all data fetching
      const results = await Promise.allSettled([
        ApiService.get('/companies', token),
        ApiService.get('/bills', token),
        ApiService.get('/payments', token),
        ApiService.get('/securities', token),
      ]);

      // Handle each result independently
      const [companiesRes, billsRes, paymentsRes, securitiesRes] = results;

      // SECURITY FIX: Remove unsafe 'as any' casts, use proper type checking
      if (companiesRes.status === 'fulfilled' && companiesRes.value.ok) {
        setCompanies(companiesRes.value.data || []);
      } else {
        console.error('Failed to load companies:', companiesRes);
      }

      if (billsRes.status === 'fulfilled' && billsRes.value.ok) {
        // Handle paginated response from backend
        const billData = billsRes.value.data;
        setBills(Array.isArray(billData) ? billData : (billData?.data || []));
      } else {
        console.error('Failed to load bills:', billsRes);
      }

      if (paymentsRes.status === 'fulfilled' && paymentsRes.value.ok) {
        setPayments(paymentsRes.value.data || []);
      } else {
        console.error('Failed to load payments:', paymentsRes);
      }

      if (securitiesRes.status === 'fulfilled' && securitiesRes.value.ok) {
        setSecurities(securitiesRes.value.data || []);
      } else {
        console.error('Failed to load securities:', securitiesRes);
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
    const token = localStorage.getItem('auth_token');
    const result = await ApiService.post('/companies', companyData, token);
    if (result.ok) {
      setCompanies(prev => [...prev, (result as any).data]);
      return { ok: true };
    } else {
      console.error('Failed to add company:', result.message, (result as any).data);
      return { ok: false, message: result.message };
    }
  };

  const updateCompany = async (id: string, data: Partial<Company>) => {
    const token = localStorage.getItem('auth_token');
    const result = await ApiService.put(`/companies/${id}`, data, token);
    if (result.ok) {
      setCompanies(prev => prev.map(c => c.id === id ? (result as any).data : c));
    }
  };

  const deleteCompany = async (id: string) => {
    const token = localStorage.getItem('auth_token');
    const result = await ApiService.delete(`/companies/${id}`, token);
    if (result.ok) {
      setCompanies(prev => prev.filter(company => company.id !== id));
    }
  };

  const addBill = async (billData: Omit<Bill, 'id' | 'createdAt' | 'paidAmount' | 'status' | 'calculatedStatus'>) => {
    const token = localStorage.getItem('auth_token');
    const result = await ApiService.post('/bills', billData, token);
    if (result.ok) {
      setBills(prev => [...prev, (result as any).data]);
    }
    return result;
  };

  const addPayment = async (paymentData: Omit<Payment, 'id' | 'createdAt'>) => {
    const token = localStorage.getItem('auth_token');

    // BUG FIX: Optimistic update with rollback to prevent race conditions
    const tempId = `temp_${Date.now()}_${Math.random()}`;
    const tempPayment = { ...paymentData, id: tempId, createdAt: new Date().toISOString() } as Payment;

    // Optimistically add payment
    setPayments(prev => [...prev, tempPayment]);

    try {
      const result = await ApiService.post('/payments', paymentData, token);

      if (result.ok && result.data) {
        // Replace temp payment with real one
        setPayments(prev => prev.map(p => p.id === tempId ? result.data : p));

        // Refresh bills to update their status
        const billsRes = await ApiService.get('/bills', token);
        if (billsRes.ok) {
          const billData = billsRes.data;
          setBills(Array.isArray(billData) ? billData : (billData?.data || []));
        }

        return result;
      } else {
        // Rollback on failure
        setPayments(prev => prev.filter(p => p.id !== tempId));
        return result;
      }
    } catch (error) {
      // Rollback on exception
      setPayments(prev => prev.filter(p => p.id !== tempId));
      console.error('Payment creation failed:', error);
      throw error;
    }
  };

  const addSecurity = async (securityData: Omit<SecurityTracking, 'id' | 'createdAt' | 'status'>) => {
    const token = localStorage.getItem('auth_token');
    const result = await ApiService.post('/securities', securityData, token);
    if (result.ok && result.data) {
      setSecurities(prev => [...prev, result.data]);
    }
    return result;
  };

  const updateSecurity = async (id: string, data: Partial<SecurityTracking>) => {
    const token = localStorage.getItem('auth_token');
    const result = await ApiService.put(`/securities/${id}`, data, token);
    if (result.ok && result.data) {
      setSecurities(prev => prev.map(s => s.id === id ? result.data : s));
    }
  };

  const getCompanyLedger = (companyId: string): LedgerEntry[] => {
    // BUG FIX: Use strict equality (===) to prevent type confusion auth bypass
    const companyBills = bills.filter(b => String(b.companyId) === String(companyId)).map(b => ({
      id: b.id + '_debit',
      date: b.date,
      description: `Invoice #${b.billNo}`,
      debit: b.totalAmount,
      credit: 0,
      balance: 0, // Calculated later
      companyId: b.companyId,
      companyName: b.companyName,
      referenceId: b.id,
      type: 'BILL' as const,
      timestamp: new Date(b.date).getTime(),
      billNo: b.billNo,
      jobNumber: b.jobNumber
    }));

    const companyPayments = payments.filter(p => String(p.companyId) === String(companyId)).map(p => {
      // Find linked bill to get Job Number if available
      // BUG FIX: Use strict equality here too
      const linkedBill = bills.find(b => String(b.id) === String(p.billId));

      return {
        id: p.id + '_credit',
        date: p.date,
        description: `Payment Received`,
        debit: 0,
        credit: p.amount,
        balance: 0,
        companyId: p.companyId,
        companyName: p.companyName,
        referenceId: p.id,
        type: 'PAYMENT' as const,
        timestamp: new Date(p.date).getTime(),
        method: p.method,
        paymentRef: p.reference,
        // Inherit Job/Bill info if linked
        billNo: linkedBill?.billNo,
        jobNumber: linkedBill?.jobNumber
      };
    });

    const allEntries = [...companyBills, ...companyPayments].sort((a, b) => a.timestamp - b.timestamp);

    let runningBalance = 0;
    return allEntries.map(entry => {
      runningBalance = runningBalance + entry.debit - entry.credit;
      return { ...entry, balance: runningBalance };
    });
  };

  const getCompanyBalance = (companyId: string) => {
    const ledger = getCompanyLedger(companyId);
    return ledger.length > 0 ? ledger[ledger.length - 1].balance : 0;
  };

  const getDashboardStats = () => {
    const totalBilled = bills.reduce((sum, bill) => sum + bill.totalAmount, 0);
    const totalCollected = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const outstanding = totalBilled - totalCollected;
    const activeCompanies = companies.length;

    return { totalBilled, totalCollected, outstanding, activeCompanies };
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
        addPayment,
        addSecurity,
        updateSecurity,
        securities,
        getCompanyLedger,
        getCompanyBalance,
        getDashboardStats,
        refreshData,
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
