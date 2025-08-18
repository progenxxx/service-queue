'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Building2, 
  UserCheck, 
  BarChart3,
  Settings,
  Home,
  Users,
  Plus,
  Eye,
  EyeOff,
  Trash2
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Customer {
  id: string;
  companyName: string;
  primaryContact: string;
  phone: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  users: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    isActive: boolean;
  }>;
}

const navigation = [
  { name: 'All Customers', href: '/admin/customers', icon: Building2, current: false },
  { name: 'Customer Management', href: '/admin/customers/manage', icon: Users, current: true },
  { name: 'Agent Management', href: '/admin/agents', icon: UserCheck, current: false },
  { name: 'Reports', href: '/admin/reports', icon: BarChart3, current: false },
  { name: 'Settings', href: '/admin/settings', icon: Settings, current: false },
];

export default function CustomerManagementPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showUsers, setShowUsers] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    companyName: '',
    primaryContact: '',
    phone: '',
    email: ''
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/admin/customers/manage');
      if (response.ok) {
        const data = await response.json();
        setCustomers(data.customers);
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/customers/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowAddCustomer(false);
        setFormData({ companyName: '', primaryContact: '', phone: '', email: '' });
        fetchCustomers();
      }
    } catch (error) {
      console.error('Failed to add customer:', error);
    }
  };

  const handleViewDetails = (customer: Customer) => {
    setSelectedCustomer(customer);
  };

  const filteredCustomers = customers.filter(customer =>
    customer.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.primaryContact.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <DashboardLayout navigation={navigation} title="Customer Management">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#087055]"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navigation={navigation} title="Customer Management">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Input
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
          </div>
          <Dialog open={showAddCustomer} onOpenChange={setShowAddCustomer}>
            <DialogTrigger asChild>
              <Button className="bg-[#087055] hover:bg-[#065946] text-white">
                Add Customer
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Customer</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddCustomer} className="space-y-4">
                <div>
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="primaryContact">Primary Contact</Label>
                  <Input
                    id="primaryContact"
                    value={formData.primaryContact}
                    onChange={(e) => setFormData({...formData, primaryContact: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowAddCustomer(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-[#087055] hover:bg-[#065946] text-white">
                    Add Customer
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#087055] hover:bg-[#087055]">
                  <TableHead className="text-white font-medium">Company Name</TableHead>
                  <TableHead className="text-white font-medium">Primary Contact</TableHead>
                  <TableHead className="text-white font-medium">Phone</TableHead>
                  <TableHead className="text-white font-medium">Email</TableHead>
                  <TableHead className="text-white font-medium text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer) => (
                    <>
                      <TableRow key={customer.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium text-gray-900">
                          {customer.companyName}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {customer.primaryContact}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {customer.phone}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {customer.email}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex space-x-2 justify-center">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-[#087055] border-[#087055] hover:bg-[#087055] hover:text-white"
                              onClick={() => setShowUsers(showUsers === customer.id ? null : customer.id)}
                            >
                              {showUsers === customer.id ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              {showUsers === customer.id ? 'Hide Users' : 'View Users'}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-[#087055] border-[#087055] hover:bg-[#087055] hover:text-white"
                              onClick={() => handleViewDetails(customer)}
                            >
                              View Details
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {showUsers === customer.id && customer.users && customer.users.length > 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="bg-gray-50 p-4">
                            <div className="space-y-2">
                              <h4 className="font-medium text-gray-900">Users for {customer.companyName}</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {customer.users.map((user) => (
                                  <div key={user.id} className="bg-white p-3 rounded border">
                                    <div className="text-sm font-medium text-gray-900">
                                      {user.firstName} {user.lastName}
                                    </div>
                                    <div className="text-xs text-gray-500">{user.email}</div>
                                    <div className="text-xs">
                                      <span className={`inline-block px-2 py-1 rounded text-xs ${
                                        user.role === 'customer_admin' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                      }`}>
                                        {user.role.replace('_', ' ')}
                                      </span>
                                      <span className={`ml-2 inline-block px-2 py-1 rounded text-xs ${
                                        user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                      }`}>
                                        {user.isActive ? 'Active' : 'Inactive'}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      No customers found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {selectedCustomer && (
          <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Customer Details - {selectedCustomer.companyName}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Company Name</Label>
                    <div className="text-sm text-gray-900">{selectedCustomer.companyName}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Primary Contact</Label>
                    <div className="text-sm text-gray-900">{selectedCustomer.primaryContact}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Phone</Label>
                    <div className="text-sm text-gray-900">{selectedCustomer.phone || 'Not provided'}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Email</Label>
                    <div className="text-sm text-gray-900">{selectedCustomer.email}</div>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Created</Label>
                  <div className="text-sm text-gray-900">
                    {new Date(selectedCustomer.createdAt).toLocaleDateString()}
                  </div>
                </div>
                {selectedCustomer.users && selectedCustomer.users.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Users ({selectedCustomer.users.length})</Label>
                    <div className="mt-2 space-y-2">
                      {selectedCustomer.users.map((user) => (
                        <div key={user.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <div>
                            <div className="text-sm font-medium">{user.firstName} {user.lastName}</div>
                            <div className="text-xs text-gray-500">{user.email}</div>
                          </div>
                          <div className="flex space-x-2">
                            <span className={`px-2 py-1 rounded text-xs ${
                              user.role === 'customer_admin' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {user.role.replace('_', ' ')}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs ${
                              user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {user.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </DashboardLayout>
  );
}