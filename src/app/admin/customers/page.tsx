'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  UserCheck, 
  BarChart3,
  Settings,
  Home,
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

const navigation = [
  { name: 'All Customers', href: '/admin/customers', icon: Building2, current: true },
  { name: 'Customer Management', href: '/admin/customers/manage', icon: Users, current: false },
  { name: 'Agent Management', href: '/admin/agents', icon: UserCheck, current: false },
  { name: 'Reports', href: '/admin/reports', icon: BarChart3, current: false },
  { name: 'Settings', href: '/admin/settings', icon: Settings, current: false },
];

export default function AllCustomersPage() {
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

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

  const filteredCustomers = customers.filter(customer =>
    customer.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.primaryContact.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <DashboardLayout navigation={navigation} title="Customers">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#087055]"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navigation={navigation} title="Customers">
      <div className="space-y-6">
        {/* Header with search and add button */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Input
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
          </div>
          <Button 
            className="bg-[#087055] hover:bg-[#065946] text-white"
            onClick={() => window.location.href = '/admin/customers/manage'}
          >
            Add Customer
          </Button>
        </div>

        {/* Customer table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#087055] hover:bg-[#087055]">
                  <TableHead className="text-white font-medium">Customer</TableHead>
                  <TableHead className="text-white font-medium text-center">Open Tickets</TableHead>
                  <TableHead className="text-white font-medium text-center">Closed Tickets</TableHead>
                  <TableHead className="text-white font-medium text-center">WIP Tickets</TableHead>
                  <TableHead className="text-white font-medium">Modified By</TableHead>
                  <TableHead className="text-white font-medium">Modified On</TableHead>
                  <TableHead className="text-white font-medium text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer) => (
                    <TableRow key={customer.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900">
                            {customer.companyName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {customer.primaryContact}
                          </div>
                          <div className="text-sm text-gray-500">
                            {customer.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 font-semibold px-3 py-1">
                          {customer.openTickets}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 font-semibold px-3 py-1">
                          {customer.closedTickets}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100 font-semibold px-3 py-1">
                          {customer.wipTickets}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {customer.modifiedBy}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {customer.modifiedOn}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex space-x-2 justify-center">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-[#087055] border-[#087055] hover:bg-[#087055] hover:text-white"
                          >
                            View Users
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-[#087055] border-[#087055] hover:bg-[#087055] hover:text-white"
                          >
                            View Details
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No customers found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}