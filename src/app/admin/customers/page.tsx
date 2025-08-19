'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Building2, 
  UserCheck, 
  BarChart3,
  Settings,
  Users
} from 'lucide-react';

interface CustomerData {
  id: string;
  companyName: string;
  primaryContact: string;
  email: string;
  openTickets: number;
  closedTickets: number;
  wipTickets: number;
  modifiedBy: string;
  modifiedOn: string;
}

interface CustomerWithUsers {
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
  { name: 'All Customers', href: '/admin/customers', icon: Building2, current: true },
  { name: 'Customer Management', href: '/admin/customers/manage', icon: Users, current: false },
  { name: 'All Request', href: '/admin/customers/requests', icon: Building2, current: false },
  { name: 'Agent Management', href: '/admin/agents', icon: UserCheck, current: false },
  { name: 'Summary', href: '/admin/customers', icon: Building2, current: false },
  { name: 'Reports', href: '/admin/reports', icon: BarChart3, current: false },
  { name: 'Settings', href: '/admin/settings', icon: Settings, current: false },
];

export default function AllCustomersPage() {
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedCustomerUsers, setSelectedCustomerUsers] = useState<CustomerWithUsers | null>(null);
  const [selectedCustomerDetails, setSelectedCustomerDetails] = useState<CustomerData | null>(null);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/admin/customers');
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

  const handleViewUsers = async (customer: CustomerData) => {
    setLoadingUsers(true);
    setShowUsersModal(true);
    
    try {
      const response = await fetch('/api/admin/customers/manage');
      if (response.ok) {
        const data = await response.json();
        const customerWithUsers = data.customers.find((c: CustomerWithUsers) => c.id === customer.id);
        setSelectedCustomerUsers(customerWithUsers || null);
      }
    } catch (error) {
      console.error('Failed to fetch customer users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleViewDetails = (customer: CustomerData) => {
    setSelectedCustomerDetails(customer);
    setShowDetailsModal(true);
  };

  const filteredCustomers = customers.filter(customer =>
    customer.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.primaryContact.toLowerCase().includes(searchTerm.toLowerCase())
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
              className="w-80"
            />
            <Button 
              className="bg-[#068d1f] hover:bg-[#087055] text-white px-6 py-2 font-medium"
              onClick={() => window.location.href = '/admin/customers/manage'}
            >
              Add Customer
            </Button>
          </div>
        </div>

        <Card className="shadow-sm border-0">
          <CardContent className="p-0">
            <div className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#087055] hover:bg-[#087055] border-0">
                    <TableHead className="text-white font-medium py-4 px-6 text-left border-0">Customer</TableHead>
                    <TableHead className="text-white font-medium py-4 px-6 text-center border-0">Open Tickets</TableHead>
                    <TableHead className="text-white font-medium py-4 px-6 text-center border-0">Closed Tickets</TableHead>
                    <TableHead className="text-white font-medium py-4 px-6 text-center border-0">WIP Tickets</TableHead>
                    <TableHead className="text-white font-medium py-4 px-6 text-left border-0">Modified By</TableHead>
                    <TableHead className="text-white font-medium py-4 px-6 text-left border-0">Modified On</TableHead>
                    <TableHead className="text-white font-medium py-4 px-6 text-center border-0">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.length > 0 ? (
                    filteredCustomers.map((customer, index) => (
                      <TableRow 
                        key={customer.id} 
                        className={`hover:bg-gray-50 border-0 ${
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                        }`}
                      >
                        <TableCell className="py-4 px-6 border-0">
                          <div className="font-medium text-gray-900">
                            {customer.companyName}
                          </div>
                          <div className="text-sm text-gray-600">
                            {customer.primaryContact}
                          </div>
                        </TableCell>
                        <TableCell className="text-center py-4 px-6 border-0">
                          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 font-semibold px-3 py-1">
                            {customer.openTickets}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center py-4 px-6 border-0">
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 font-semibold px-3 py-1">
                            {customer.closedTickets}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center py-4 px-6 border-0">
                          <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100 font-semibold px-3 py-1">
                            {customer.wipTickets}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-600 py-4 px-6 border-0">
                          {customer.modifiedBy}
                        </TableCell>
                        <TableCell className="text-gray-600 py-4 px-6 border-0">
                          {customer.modifiedOn}
                        </TableCell>
                        <TableCell className="text-center py-4 px-6 border-0">
                          <div className="flex space-x-2 justify-center">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-white bg-[#068d1f] border-[#068d1f] hover:bg-[#087055] hover:text-white hover:border-[#087055] px-4 py-2 text-xs font-medium rounded"
                              onClick={() => handleViewUsers(customer)}
                            >
                              View Users
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-white bg-[#068d1f] border-[#068d1f] hover:bg-[#087055] hover:text-white hover:border-[#087055] px-4 py-2 text-xs font-medium rounded"
                              onClick={() => handleViewDetails(customer)}
                            >
                              View Details
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow className="border-0">
                      <TableCell colSpan={7} className="text-center py-12 text-gray-500 border-0">
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
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-gray-900">
                Users - {selectedCustomerUsers?.companyName || 'Loading...'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {loadingUsers ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#087055]"></div>
                </div>
              ) : selectedCustomerUsers && selectedCustomerUsers.users && selectedCustomerUsers.users.length > 0 ? (
                <div className="space-y-3">
                  {selectedCustomerUsers.users.map((user) => (
                    <div key={user.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border shadow-sm">
                      <div>
                        <div className="font-medium text-gray-900 text-lg">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-gray-600">{user.email}</div>
                      </div>
                      <div className="flex space-x-2">
                        <Badge className={
                          user.role === 'customer_admin' 
                            ? 'bg-blue-100 text-blue-800 px-3 py-1' 
                            : 'bg-green-100 text-green-800 px-3 py-1'
                        }>
                          {user.role.replace('_', ' ')}
                        </Badge>
                        <Badge className={
                          user.isActive 
                            ? 'bg-green-100 text-green-800 px-3 py-1' 
                            : 'bg-red-100 text-red-800 px-3 py-1'
                        }>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-lg">No users found for this customer.</div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-gray-900">
                Customer Details - {selectedCustomerDetails?.companyName}
              </DialogTitle>
            </DialogHeader>
            {selectedCustomerDetails && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="text-sm font-medium text-gray-700 block mb-1">Company Name</label>
                    <div className="text-base text-gray-900">{selectedCustomerDetails.companyName}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="text-sm font-medium text-gray-700 block mb-1">Primary Contact</label>
                    <div className="text-base text-gray-900">{selectedCustomerDetails.primaryContact}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="text-sm font-medium text-gray-700 block mb-1">Email</label>
                    <div className="text-base text-gray-900">{selectedCustomerDetails.email}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <label className="text-sm font-medium text-gray-700 block mb-1">Last Modified By</label>
                      <div className="text-base text-gray-900">{selectedCustomerDetails.modifiedBy}</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <label className="text-sm font-medium text-gray-700 block mb-1">Last Modified On</label>
                      <div className="text-base text-gray-900">{selectedCustomerDetails.modifiedOn}</div>
                    </div>
                  </div>
                </div>
                
                <div className="pt-6 border-t border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Ticket Summary</h4>
                  <div className="grid grid-cols-3 gap-6">
                    <div className="text-center bg-blue-50 p-6 rounded-lg border border-blue-200">
                      <div className="text-3xl font-bold text-blue-600 mb-2">{selectedCustomerDetails.openTickets}</div>
                      <div className="text-sm font-medium text-blue-700">Open Tickets</div>
                    </div>
                    <div className="text-center bg-orange-50 p-6 rounded-lg border border-orange-200">
                      <div className="text-3xl font-bold text-orange-600 mb-2">{selectedCustomerDetails.wipTickets}</div>
                      <div className="text-sm font-medium text-orange-700">WIP Tickets</div>
                    </div>
                    <div className="text-center bg-green-50 p-6 rounded-lg border border-green-200">
                      <div className="text-3xl font-bold text-green-600 mb-2">{selectedCustomerDetails.closedTickets}</div>
                      <div className="text-sm font-medium text-green-700">Closed Tickets</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}