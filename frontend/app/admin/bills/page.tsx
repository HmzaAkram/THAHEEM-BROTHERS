'use client';

import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Download, Eye, trash2, Trash2 } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useData, BillItem } from '@/context/data-context';

const statusStyles = {
  Paid: 'bg-green-100 text-green-800 border-green-200',
  Partial: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  Unpaid: 'bg-red-100 text-red-800 border-red-200',
};

export default function BillsPage() {
  const { bills, companies, addBill } = useData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form State
  const [companyId, setCompanyId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [items, setItems] = useState<Omit<BillItem, 'id'>[]>([
    { description: '', quantity: 1, rate: 0, amount: 0 },
  ]);

  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

  const handleAddItem = () => {
    setItems([...items, { description: '', quantity: 1, rate: 0, amount: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof typeof items[0], value: string | number) => {
    const newItems = [...items];
    const item = { ...newItems[index], [field]: value };

    // Auto calculate amount
    if (field === 'quantity' || field === 'rate') {
      item.amount = Number(item.quantity) * Number(item.rate);
    }

    newItems[index] = item as any;
    setItems(newItems);
  };

  const handleSubmit = () => {
    if (!companyId || !date || !dueDate) {
      alert("Please fill all required fields");
      return;
    }

    const selectedCompany = companies.find(c => c.id === companyId);
    if (!selectedCompany) return;

    // Generate valid bill items with IDs
    const finalItems: BillItem[] = items.map((item, idx) => ({
      ...item,
      id: `item-${Date.now()}-${idx}`,
      quantity: Number(item.quantity),
      rate: Number(item.rate),
      amount: Number(item.amount)
    })).filter(i => i.description && i.amount > 0);

    if (finalItems.length === 0) {
      alert("Please add at least one valid item");
      return;
    }

    addBill({
      billNo: `BILL-${String(bills.length + 1).padStart(3, '0')}`,
      companyId: selectedCompany.id,
      companyName: selectedCompany.name,
      date,
      dueDate,
      items: finalItems,
      totalAmount: finalItems.reduce((sum, i) => sum + i.amount, 0),
    });

    setIsDialogOpen(false);
    // Reset Form
    setCompanyId('');
    setItems([{ description: '', quantity: 1, rate: 0, amount: 0 }]);
  };

  // Sort bills by date desc
  const sortedBills = useMemo(() => {
    return [...bills].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [bills]);

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Bills & Invoices</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage invoices for your clients.
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 shadow-md hover:bg-primary/90">
                <Plus className="w-4 h-4" />
                Create New Bill
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Bill</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1">
                    <Label>Select Company</Label>
                    <Select onValueChange={setCompanyId} value={companyId}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Choose client..." />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Bill Date</Label>
                    <Input
                      type="date"
                      className="mt-1"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Due Date</Label>
                    <Input
                      type="date"
                      className="mt-1"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="border rounded-lg p-4 bg-secondary/20">
                  <div className="flex justify-between items-center mb-4">
                    <Label className="text-base font-semibold">Bill Items</Label>
                    <Button size="sm" variant="outline" onClick={handleAddItem}>
                      <Plus className="w-3 h-3 mr-1" /> Add Item
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {items.map((item, idx) => (
                      <div key={idx} className="flex gap-3 items-start animate-in fade-in slide-in-from-left-2">
                        <div className="flex-1">
                          <Input
                            placeholder="Description (e.g. Storage Charges)"
                            value={item.description}
                            onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                          />
                        </div>
                        <div className="w-20">
                          <Input
                            type="number"
                            placeholder="Qty"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                          />
                        </div>
                        <div className="w-32">
                          <Input
                            type="number"
                            placeholder="Rate"
                            min="0"
                            value={item.rate}
                            onChange={(e) => handleItemChange(idx, 'rate', e.target.value)}
                          />
                        </div>
                        <div className="w-32 pt-2 font-mono text-right font-medium">
                          {item.amount.toLocaleString()}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                          onClick={() => handleRemoveItem(idx)}
                          disabled={items.length === 1}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end">
                  <div className="bg-primary/5 rounded-lg p-4 border border-primary/20 min-w-[200px]">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span>PKR {totalAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-primary border-t border-primary/20 pt-2 mt-2">
                      <span>Total:</span>
                      <span>PKR {totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button className="flex-1 bg-primary hover:bg-primary/90" onClick={handleSubmit}>Create Bill</Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="shadow-md border-border/50">
          <CardHeader>
            <CardTitle>All Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            {sortedBills.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                No bills found. Create one to get started.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/50">
                      <TableHead>Bill No</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedBills.map((bill) => (
                      <TableRow key={bill.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="font-mono text-sm font-medium">
                          {bill.billNo}
                        </TableCell>
                        <TableCell>
                          {bill.companyName}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(bill.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(bill.dueDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="font-semibold">
                          PKR {bill.totalAmount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          PKR {bill.paidAmount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusStyles[bill.status]
                              }`}
                          >
                            {bill.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon" title="View Details">
                              <Eye className="w-4 h-4 text-muted-foreground hover:text-primary" />
                            </Button>
                            <Button variant="ghost" size="icon" title="Download PDF">
                              <Download className="w-4 h-4 text-muted-foreground hover:text-primary" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
