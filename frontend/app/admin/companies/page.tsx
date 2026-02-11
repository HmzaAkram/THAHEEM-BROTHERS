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
import { Plus, Edit2, Eye, Trash2, Search } from 'lucide-react';
import { useState } from 'react';

const dummyCompanies = [
  {
    id: 1,
    name: 'THAHEEM BROTHERS',
    contact: 'Hamza Khan',
    phone: '+92(021)32421347',
    email: 'Import.khi@hotmail.com',
    balance: 'PKR 250,000',
    status: 'Active',
  },
  {
    id: 2,
    name: 'Import Traders',
    contact: 'Ali Ahmed',
    phone: '+92(021)35678901',
    email: 'info@importtraders.com',
    balance: 'PKR 125,500',
    status: 'Active',
  },
  {
    id: 3,
    name: 'Global Freight Co',
    contact: 'Sara Williams',
    phone: '+92(021)34123456',
    email: 'contact@globalfreight.com',
    balance: 'PKR 450,000',
    status: 'Active',
  },
  {
    id: 4,
    name: 'Karachi Logistics',
    contact: 'Hassan Ali',
    phone: '+92(021)38765432',
    email: 'logistics@karachi.com',
    balance: 'PKR 180,000',
    status: 'Active',
  },
  {
    id: 5,
    name: 'Orient Shipping',
    contact: 'Fatima Khan',
    phone: '+92(021)36543210',
    email: 'orient@shipping.com',
    balance: 'PKR 320,000',
    status: 'Active',
  },
  {
    id: 6,
    name: 'Metro Cargo Services',
    contact: 'Ahmed Hassan',
    phone: '+92(021)37654321',
    email: 'metro@cargo.com',
    balance: 'PKR 95,000',
    status: 'Active',
  },
  {
    id: 7,
    name: 'Express Imports Ltd',
    contact: 'Zainab Ali',
    phone: '+92(021)39876543',
    email: 'express@imports.com',
    balance: 'PKR 210,000',
    status: 'Active',
  },
  {
    id: 8,
    name: 'Trade Hub International',
    contact: 'Muhammad Khan',
    phone: '+92(021)32456789',
    email: 'hub@tradeinternational.com',
    balance: 'PKR 435,000',
    status: 'Inactive',
  },
];

export default function CompaniesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filteredCompanies = dummyCompanies.filter(
    (company) =>
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Companies</h1>
            <p className="text-muted-foreground mt-1">
              Manage all client companies and their information
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Company
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Company</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Company Name</Label>
                    <Input
                      id="name"
                      placeholder="Enter company name"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact">Contact Person</Label>
                    <Input
                      id="contact"
                      placeholder="Full name"
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@company.com"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      placeholder="+92(021)..."
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    placeholder="Company address"
                    className="mt-1"
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button className="flex-1">Save Company</Button>
                  <Button
                    variant="outline"
                    className="flex-1 bg-transparent"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search companies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 border-0 bg-transparent"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCompanies.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell className="font-medium">
                        {company.name}
                      </TableCell>
                      <TableCell>{company.contact}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {company.email}
                      </TableCell>
                      <TableCell>{company.phone}</TableCell>
                      <TableCell className="font-semibold">
                        {company.balance}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            company.status === 'Active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {company.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-between mt-4 text-sm">
              <p className="text-muted-foreground">
                Showing {filteredCompanies.length} of {dummyCompanies.length}{' '}
                companies
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  Previous
                </Button>
                <Button variant="outline" size="sm">
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
