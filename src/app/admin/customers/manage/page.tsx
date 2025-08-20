'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  UserCheck, 
  BarChart3,
  Settings,
  Users,
  Trash2,
  Copy,
  Check
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Customer {
  id: string;
  companyName: string;
  companyCode: string;
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
  { name: 'All Request', href: '/admin/customers/requests', icon: Building2, current: false },
  { name: 'Agent Management', href: '/admin/agents', icon: UserCheck, current: false },
  { name: 'Summary', href: '/admin/summary', icon: Building2, current: false },
  { name: 'Reports', href: '/admin/reports', icon: BarChart3, current: false },
  { name: 'Settings', href: '/admin/settings', icon: Settings, current: false },
];

export default function CustomerManagementPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedCustomerUsers, setSelectedCustomerUsers] = useState<Customer | null>(null);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
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
        setCustomers(data.customers || []);
      } else {
        setCustomers([]);
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const generateCompanyCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 7; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
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
        const data = await response.json();
        setGeneratedCode(data.companyCode);
        setShowAddCustomer(false);
        setFormData({ companyName: '', primaryContact: '', phone: '', email: '' });
        fetchCustomers();
      }
    } catch (error) {
      console.error('Failed to add customer:', error);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return;
    
    try {
      const response = await fetch('/api/admin/customers/manage', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: customerToDelete }),
      });

      if (response.ok) {
        fetchCustomers();
        setShowDeleteDialog(false);
        setCustomerToDelete(null);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to delete customer');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete customer');
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(text);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  const confirmDelete = (customerId: string) => {
    setCustomerToDelete(customerId);
    setShowDeleteDialog(true);
  };

  const handleViewDetails = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowDetailsModal(true);
  };

  const handleViewUsers = (customer: Customer) => {
    setSelectedCustomerUsers(customer);
    setShowUsersModal(true);
  };

  const filteredCustomers = customers.filter(customer =>
    customer.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.primaryContact.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.companyCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <DashboardLayout navigation={navigation} title="">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#087055]"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navigation={navigation} title="">
      <div className="space-y-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Customers</h1>
          <div className="flex items-center space-x-4">
            <Input
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 rounded-lg border-gray-200"
            />
            <Dialog open={showAddCustomer} onOpenChange={setShowAddCustomer}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg">
                  Add Customer
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
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
                  
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <Label className="text-sm font-medium text-blue-700">Generated Company Code</Label>
                    </div>
                    <div className="text-lg font-mono font-bold text-blue-800 bg-white px-3 py-2 rounded border">
                      {generateCompanyCode()}
                    </div>
                    <p className="text-xs text-blue-600 mt-2">
                      This 7-digit code will be automatically generated and sent to the customer&apos;s email upon creation.
                    </p>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setShowAddCustomer(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white">
                      Add Customer
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {generatedCode && (
          <Dialog open={!!generatedCode} onOpenChange={() => setGeneratedCode('')}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-green-700">Customer Created Successfully!</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <Label className="text-sm font-medium text-green-700 block mb-2">
                    Generated Company Code
                  </Label>
                  <div className="flex items-center space-x-2">
                    <code className="flex-1 bg-white px-3 py-2 rounded border font-mono text-lg font-bold text-green-800">
                      {generatedCode}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(generatedCode)}
                      className="flex items-center space-x-1"
                    >
                      {copiedCode === generatedCode ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                      <span>{copiedCode === generatedCode ? 'Copied' : 'Copy'}</span>
                    </Button>
                  </div>
                  <p className="text-xs text-green-600 mt-2">
                    The company code has been sent to the customer&apos;s email address.
                  </p>
                </div>
                <div className="flex justify-end">
                  <Button onClick={() => setGeneratedCode('')} className="bg-green-600 hover:bg-green-700 text-white">
                    Continue
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        <Card className="rounded-lg border border-gray-200 shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-hidden rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow className="bg-green-600 hover:bg-green-600 border-0">
                    <TableHead className="text-white font-medium py-4 px-6 text-left border-0 rounded-tl-lg">
                      Company Name
                    </TableHead>
                    <TableHead className="text-white font-medium py-4 px-6 text-left border-0">
                      Primary Contact
                    </TableHead>
                    <TableHead className="text-white font-medium py-4 px-6 text-left border-0">
                      Phone
                    </TableHead>
                    <TableHead className="text-white font-medium py-4 px-6 text-left border-0">
                      Email
                    </TableHead>
                    <TableHead className="text-white font-medium py-4 px-6 text-center border-0 rounded-tr-lg">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.length > 0 ? (
                    filteredCustomers.map((customer, index) => (
                      <TableRow 
                        key={customer.id} 
                        className="hover:bg-gray-50 border-0 border-b border-gray-100 last:border-b-0"
                      >
                        <TableCell className="font-medium text-gray-900 py-4 px-6 border-0">
                          {customer.companyName}
                        </TableCell>
                        <TableCell className="text-gray-600 py-4 px-6 border-0">
                          {customer.primaryContact}
                        </TableCell>
                        <TableCell className="text-gray-600 py-4 px-6 border-0">
                          {customer.phone || '-'}
                        </TableCell>
                        <TableCell className="text-gray-600 py-4 px-6 border-0">
                          {customer.email}
                        </TableCell>
                        <TableCell className="text-center py-4 px-6 border-0">
                          <div className="flex space-x-2 justify-center">
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-green-600 text-white border-green-600 hover:bg-green-700 hover:border-green-700 px-4 py-2 text-xs rounded-lg"
                              onClick={() => handleViewUsers(customer)}
                            >
                              View Users
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-green-600 text-white border-green-600 hover:bg-green-700 hover:border-green-700 px-4 py-2 text-xs rounded-lg"
                              onClick={() => handleViewDetails(customer)}
                            >
                              View Details
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-gray-500 border-gray-300 hover:bg-gray-100 hover:text-gray-700 p-2 rounded-lg"
                              onClick={() => confirmDelete(customer.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow className="border-0">
                      <TableCell colSpan={5} className="text-center py-12 text-gray-500 border-0">
                        No customers found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={showUsersModal} onOpenChange={setShowUsersModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                Users - {selectedCustomerUsers?.companyName || 'Loading...'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {selectedCustomerUsers && selectedCustomerUsers.users && selectedCustomerUsers.users.length > 0 ? (
                <div className="space-y-3">
                  {selectedCustomerUsers.users.map((user) => (
                    <div key={user.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border">
                      <div>
                        <div className="font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-gray-600">{user.email}</div>
                      </div>
                      <div className="flex space-x-2">
                        <Badge className={
                          user.role === 'customer_admin' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }>
                          {user.role.replace('_', ' ')}
                        </Badge>
                        <Badge className={
                          user.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No users found for this customer.
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {selectedCustomer && (
          <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  Customer Details - {selectedCustomer.companyName}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Company Name</label>
                    <div className="text-sm text-gray-900 mt-1">{selectedCustomer.companyName}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Company Code</label>
                    <div className="text-sm text-gray-900 mt-1">
                      <code className="bg-gray-100 px-2 py-1 rounded font-mono">{selectedCustomer.companyCode}</code>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Primary Contact</label>
                    <div className="text-sm text-gray-900 mt-1">{selectedCustomer.primaryContact}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Phone</label>
                    <div className="text-sm text-gray-900 mt-1">{selectedCustomer.phone || 'Not provided'}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <div className="text-sm text-gray-900 mt-1">{selectedCustomer.email}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Created</label>
                    <div className="text-sm text-gray-900 mt-1">
                      {new Date(selectedCustomer.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                
                {selectedCustomer.users && selectedCustomer.users.length > 0 && (
                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Users ({selectedCustomer.users.length})</h4>
                    <div className="space-y-2">
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

        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Confirm Delete</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Are you sure you want to delete this customer? This action cannot be undone and will also delete all associated users.
              </p>
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowDeleteDialog(false);
                    setCustomerToDelete(null);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={handleDeleteCustomer}
                >
                  Delete
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}