'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Types
export interface Company {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  password?: string; // Optional for now to avoid breaking existing logic immediately
  status: 'Active' | 'Inactive';
  createdAt: string;
}

export type BillStatus = 'Paid' | 'Partial' | 'Unpaid';

export interface BillItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Bill {
  id: string;
  billNo: string;
  companyId: string;
  companyName: string;
  date: string;
  dueDate: string;
  items: BillItem[];
  totalAmount: number;
  paidAmount: number;
  status: BillStatus;
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
  billId?: string;
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

interface DataContextType {
  companies: Company[];
  bills: Bill[];
  payments: Payment[];
  addCompany: (company: Omit<Company, 'id' | 'createdAt'>) => void;
  updateCompany: (id: string, data: Partial<Company>) => void;
  deleteCompany: (id: string) => void;
  addBill: (bill: Omit<Bill, 'id' | 'createdAt' | 'paidAmount' | 'status'>) => void;
  addPayment: (payment: Omit<Payment, 'id' | 'createdAt'>) => void;
  getCompanyLedger: (companyId: string) => LedgerEntry[];
  getCompanyBalance: (companyId: string) => number;
  getDashboardStats: () => {
    totalBilled: number;
    totalCollected: number;
    outstanding: number;
    activeCompanies: number;
  };
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Mock Initial Data
const INITIAL_COMPANIES: Company[] = [
  {
    id: 'c1',
    name: 'THAHEEM BROTHERS',
    email: 'contact@thaheem.com',
    phone: '+92 300 1234567',
    address: 'Karachi, Pakistan',
    password: 'password123',
    status: 'Active',
    createdAt: '2026-01-01',
  },
  {
    id: 'c2',
    name: 'Import Traders',
    email: 'info@importtraders.com',
    phone: '+92 321 7654321',
    address: 'Lahore, Pakistan',
    password: 'password123',
    status: 'Active',
    createdAt: '2026-01-15',
  },
  {
    id: 'c3',
    name: 'Global Freight Co',
    email: 'ops@globalfreight.com',
    phone: '+92 333 9876543',
    address: 'Islamabad, Pakistan',
    password: 'password123',
    status: 'Active',
    createdAt: '2026-02-01',
  },
];

const INITIAL_BILLS: Bill[] = [
  {
    id: 'b1',
    billNo: 'BILL-001',
    companyId: 'c1',
    companyName: 'THAHEEM BROTHERS',
    date: '2026-01-10',
    dueDate: '2026-01-25',
    items: [
      { id: 'i1', description: 'Customs Clearance', quantity: 1, rate: 50000, amount: 50000 },
    ],
    totalAmount: 50000,
    paidAmount: 50000,
    status: 'Paid',
    createdAt: '2026-01-10',
  },
  {
    id: 'b2',
    billNo: 'BILL-002',
    companyId: 'c2',
    companyName: 'Import Traders',
    date: '2026-02-01',
    dueDate: '2026-02-15',
    items: [
      { id: 'i2', description: 'Freight Charges', quantity: 1, rate: 120000, amount: 120000 },
    ],
    totalAmount: 120000,
    paidAmount: 60000,
    status: 'Partial',
    createdAt: '2026-02-01',
  },
];

const INITIAL_PAYMENTS: Payment[] = [
  {
    id: 'p1',
    companyId: 'c1',
    companyName: 'THAHEEM BROTHERS',
    date: '2026-01-15',
    amount: 50000,
    reference: 'CHK-101',
    method: 'Check',
    billId: 'b1',
    createdAt: '2026-01-15',
  },
  {
    id: 'p2',
    companyId: 'c2',
    companyName: 'Import Traders',
    date: '2026-02-05',
    amount: 60000,
    reference: 'TRF-555',
    method: 'Bank Transfer',
    billId: 'b2',
    createdAt: '2026-02-05',
  },
];

export function DataProvider({ children }: { children: ReactNode }) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load data from localStorage on mount
  useEffect(() => {
    const loadedCompanies = localStorage.getItem('companies');
    const loadedBills = localStorage.getItem('bills');
    const loadedPayments = localStorage.getItem('payments');

    if (loadedCompanies) {
      setCompanies(JSON.parse(loadedCompanies));
    } else {
      setCompanies(INITIAL_COMPANIES);
      localStorage.setItem('companies', JSON.stringify(INITIAL_COMPANIES));
    }

    if (loadedBills) {
      setBills(JSON.parse(loadedBills));
    } else {
      setBills(INITIAL_BILLS);
      localStorage.setItem('bills', JSON.stringify(INITIAL_BILLS));
    }

    if (loadedPayments) {
      setPayments(JSON.parse(loadedPayments));
    } else {
      setPayments(INITIAL_PAYMENTS);
      localStorage.setItem('payments', JSON.stringify(INITIAL_PAYMENTS));
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('companies', JSON.stringify(companies));
      localStorage.setItem('bills', JSON.stringify(bills));
      localStorage.setItem('payments', JSON.stringify(payments));
    }
  }, [companies, bills, payments, isLoaded]);

  const addCompany = (companyData: Omit<Company, 'id' | 'createdAt'>) => {
    const newCompany: Company = {
      ...companyData,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
    };
    setCompanies([...companies, newCompany]);
  };

  const updateCompany = (id: string, data: Partial<Company>) => {
    setCompanies(prev => prev.map(company =>
      company.id === id ? { ...company, ...data } : company
    ));
  };

  const deleteCompany = (id: string) => {
    setCompanies(prev => prev.filter(company => company.id !== id));
  };

  const addBill = (billData: Omit<Bill, 'id' | 'createdAt' | 'paidAmount' | 'status'>) => {
    const newBill: Bill = {
      ...billData,
      id: Math.random().toString(36).substr(2, 9),
      paidAmount: 0,
      status: 'Unpaid',
      createdAt: new Date().toISOString(),
    };
    setBills([...bills, newBill]);
  };

  const addPayment = (paymentData: Omit<Payment, 'id' | 'createdAt'>) => {
    const newPayment: Payment = {
      ...paymentData,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
    };
    setPayments([...payments, newPayment]);

    // Update bill status logic (simple FIFO or specific bill targeting)
    // For now, let's just update the specific bill if provided, otherwise leave it
    if (paymentData.billId) {
      setBills(prevBills => prevBills.map(bill => {
        if (bill.id === paymentData.billId) {
          const newPaidAmount = bill.paidAmount + paymentData.amount;
          let newStatus: BillStatus = 'Unpaid';
          if (newPaidAmount >= bill.totalAmount) newStatus = 'Paid';
          else if (newPaidAmount > 0) newStatus = 'Partial';

          return { ...bill, paidAmount: newPaidAmount, status: newStatus };
        }
        return bill;
      }));
    } else {
      // Logic to auto-allocate payment to oldest unpaid bills could go here
      // prioritizing "fully automated" requirement
    }
  };

  const getCompanyLedger = (companyId: string): LedgerEntry[] => {
    const companyBills = bills.filter(b => b.companyId === companyId).map(b => ({
      id: b.id + '_debit',
      date: b.date,
      description: `Invoice #${b.billNo}`,
      debit: b.totalAmount,
      credit: 0,
      balance: 0, // Calculated later
      companyId: b.companyId,
      referenceId: b.id,
      type: 'BILL' as const,
      timestamp: new Date(b.date).getTime()
    }));

    const companyPayments = payments.filter(p => p.companyId === companyId).map(p => ({
      id: p.id + '_credit',
      date: p.date,
      description: `Payment Received (${p.method}) - ${p.reference}`,
      debit: 0,
      credit: p.amount,
      balance: 0, // Calculated later
      companyId: p.companyId,
      referenceId: p.id,
      type: 'PAYMENT' as const,
      timestamp: new Date(p.date).getTime()
    }));

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
        getCompanyLedger,
        getCompanyBalance,
        getDashboardStats,
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
