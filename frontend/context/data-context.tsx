'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Types
export interface Company {
  id: string;
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
  attachment?: string;
  via?: string;
  weight?: string | number;
  exporter?: string;
  beNumber?: string;
  packages?: string | number;
  igm?: string;
  hawb?: string;
  index?: string | number;
  gdNumber?: string;
  noOfContainers?: string | number;
  containerNo?: string;
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
    name: 'Pacific Textiles Mills',
    ntn: '7890123-1',
    email: 'info@pacifictextiles.com',
    phone: '+92 300 5550011',
    address: 'Plot 12, SITE Area, Karachi',
    username: 'pacific',
    password: 'password123',
    status: 'Active',
    createdAt: '2025-01-01',
  },
  {
    id: 'c2',
    name: 'Global Electronics Pvt Ltd',
    ntn: '4567890-2',
    email: 'accounts@globalelectronics.pk',
    phone: '+92 321 5550022',
    address: 'Sector I-9/3, Islamabad',
    username: 'global',
    password: 'password123',
    status: 'Active',
    createdAt: '2025-02-15',
  },
  {
    id: 'c3',
    name: 'Fresh Foods Distributors',
    ntn: '1234567-3',
    email: 'finance@freshfoods.com',
    phone: '+92 333 5550033',
    address: 'Multan Road, Lahore',
    username: 'fresh',
    password: 'password123',
    status: 'Active',
    createdAt: '2025-03-01',
  },
];

const INITIAL_BILLS: Bill[] = [
  // Pacific Textiles Bills
  {
    id: 'b1',
    billNo: 'BILL-001',
    companyId: 'c1',
    companyName: 'Pacific Textiles Mills',
    date: '2025-01-15',
    invoiceNo: 'INV-2025-001',
    invoiceDate: '2025-01-14',
    jobNumber: 'JOB-25-001',
    via: 'Sea',
    weight: '12000 kg',
    exporter: 'Pacific Exports',
    items: [
      { id: 'i1', description: 'Customs Duty', amount: 450000 },
      { id: 'i2', description: 'Port Charges', amount: 25000 },
      { id: 'i3', description: 'Agency Fee', amount: 15000 },
    ],
    totalAmount: 490000,
    paidAmount: 490000,
    status: 'Paid',
    createdAt: '2025-01-15',
  },
  {
    id: 'b2',
    billNo: 'BILL-004',
    companyId: 'c1',
    companyName: 'Pacific Textiles Mills',
    date: '2025-02-20',
    invoiceNo: 'INV-2025-004',
    invoiceDate: '2025-02-19',
    jobNumber: 'JOB-25-012',
    via: 'Air',
    weight: '500 kg',
    items: [
      { id: 'i4', description: 'Air Freight', amount: 180000 },
      { id: 'i5', description: 'Handling', amount: 5000 },
    ],
    totalAmount: 185000,
    paidAmount: 100000,
    status: 'Partial',
    createdAt: '2025-02-20',
  },
  {
    id: 'b3',
    billNo: 'BILL-008',
    companyId: 'c1',
    companyName: 'Pacific Textiles Mills',
    date: '2025-03-10',
    invoiceNo: 'INV-2025-008',
    invoiceDate: '2025-03-09',
    jobNumber: 'JOB-25-025',
    via: 'Sea',
    weight: '24000 kg',
    items: [
      { id: 'i6', description: 'Customs & Duties', amount: 650000 },
    ],
    totalAmount: 650000,
    paidAmount: 0,
    status: 'Unpaid',
    createdAt: '2025-03-10',
  },

  // Global Electronics Bills
  {
    id: 'b4',
    billNo: 'BILL-002',
    companyId: 'c2',
    companyName: 'Global Electronics Pvt Ltd',
    date: '2025-02-05',
    invoiceNo: 'INV-2025-002',
    invoiceDate: '2025-02-04',
    jobNumber: 'JOB-25-005',
    via: 'Air',
    weight: '800 kg',
    items: [
      { id: 'i7', description: 'Clearance Charges', amount: 120000 },
      { id: 'i8', description: 'Delivery Order', amount: 15000 },
    ],
    totalAmount: 135000,
    paidAmount: 135000,
    status: 'Paid',
    createdAt: '2025-02-05',
  },
  {
    id: 'b5',
    billNo: 'BILL-005',
    companyId: 'c2',
    companyName: 'Global Electronics Pvt Ltd',
    date: '2025-03-01',
    invoiceNo: 'INV-2025-005',
    invoiceDate: '2025-02-28',
    jobNumber: 'JOB-25-018',
    via: 'Sea',
    weight: '5000 kg',
    items: [
      { id: 'i9', description: 'Import Duties', amount: 320000 },
      { id: 'i10', description: 'Sales Tax', amount: 85000 },
    ],
    totalAmount: 405000,
    paidAmount: 0,
    status: 'Unpaid',
    createdAt: '2025-03-01',
  },

  // Fresh Foods Bills
  {
    id: 'b6',
    billNo: 'BILL-003',
    companyId: 'c3',
    companyName: 'Fresh Foods Distributors',
    date: '2025-03-15',
    invoiceNo: 'INV-2025-003',
    invoiceDate: '2025-03-14',
    jobNumber: 'JOB-25-030',
    via: 'Land',
    weight: 'Truck Load',
    items: [
      { id: 'i11', description: 'Cross Border Fee', amount: 45000 },
      { id: 'i12', description: 'Customs', amount: 25000 },
    ],
    totalAmount: 70000,
    paidAmount: 70000,
    status: 'Paid',
    createdAt: '2025-03-15',
  },
];

const INITIAL_PAYMENTS: Payment[] = [
  // Pacific Payments
  {
    id: 'p1',
    companyId: 'c1',
    companyName: 'Pacific Textiles Mills',
    date: '2025-01-20',
    amount: 490000,
    reference: 'CHQ-998877',
    method: 'Cheque',
    chequeNo: '998877',
    billId: 'b1',
    createdAt: '2025-01-20',
  },
  {
    id: 'p2',
    companyId: 'c1',
    companyName: 'Pacific Textiles Mills',
    date: '2025-02-25',
    amount: 100000,
    reference: 'FT-112233',
    method: 'Bank Transfer',
    trackingId: 'TRX-123456',
    billId: 'b2',
    createdAt: '2025-02-25',
  },

  // Global Payments
  {
    id: 'p3',
    companyId: 'c2',
    companyName: 'Global Electronics Pvt Ltd',
    date: '2025-02-10',
    amount: 135000,
    reference: 'PO-554433',
    method: 'Pay Order',
    payOrderNo: '554433',
    billId: 'b4',
    createdAt: '2025-02-10',
  },

  // Fresh Foods Payment
  {
    id: 'p4',
    companyId: 'c3',
    companyName: 'Fresh Foods Distributors',
    date: '2025-03-18',
    amount: 70000,
    reference: 'Cash',
    method: 'Cash',
    description: 'Handed to Ali (Manager)',
    billId: 'b6',
    createdAt: '2025-03-18',
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
      companyName: b.companyName,
      referenceId: b.id,
      type: 'BILL' as const,
      timestamp: new Date(b.date).getTime(),
      billNo: b.billNo,
      jobNumber: b.jobNumber
    }));

    const companyPayments = payments.filter(p => p.companyId === companyId).map(p => {
      // Find linked bill to get Job Number if available
      const linkedBill = bills.find(b => b.id === p.billId);

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
