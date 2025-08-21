'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  UserCheck, 
  BarChart3,
  Settings,
  Users,
  Plus,
  Trash2,
  RefreshCw
} from 'lucide-react';

interface CustomerData {
  id: string;
  companyName: string;
  primaryContact: string;
  email: string;
  phone: string;
  companyCode: string;
  openTickets: number;
  closedTickets: number;
  wipTickets: number;
  modifiedBy: string;
  modifiedOn: string;
  users: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    isActive: boolean;
    loginCode?: string;
  }>;
}

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  user: {
    firstName: string;
    lastName: string;
  };
  company?: {
    companyName: string;
  };
}

const navigation = [
  { name: 'All Customers', href: '/admin/customers', icon: Building2, current: true },
  { name: 'All Requests', href: '/admin/summary', icon: Building2, current: false },
  { name: 'Customer Management', href: '/admin/customers/manage', icon: Users, current: false },
  { name: 'Agent Management', href: '/admin/agents', icon: UserCheck, current: false },
  { name: 'Settings', href: '/admin/settings', icon: Settings, current: false },
  { name: 'Reports', href: '/admin/reports', icon: BarChart3, current: false },
];

const generateLoginCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 7; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export default function AllCustomersPage() {
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedCustomerDetails, setSelectedCustomerDetails] = useState<CustomerData | null>(null);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showUsersTable, setShowUsersTable] = useState(false);
  const [showDetailsForm, setShowDetailsForm] = useState(false);
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [currentCustomerUsers, setCurrentCustomerUsers] = useState<CustomerData | null>(null);
  const [isTableTransitioning, setIsTableTransitioning] = useState(false);
  
  const [editableDetails, setEditableDetails] = useState({
    companyName: '',
    firstName: '',
    lastName: '',
    email: '',
    loginCode: '',
    role: ''
  });
  
  const [formData, setFormData] = useState({
    companyName: '',
    primaryContact: '',
    phone: '',
    email: ''
  });

  const [userFormData, setUserFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'customer',
    loginCode: ''
  });

  useEffect(() => {
    if (showAddUserForm) {
      setUserFormData(prev => ({
        ...prev,
        loginCode: generateLoginCode()
      }));
    }
  }, [showAddUserForm]);

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/admin/customers');
      if (response.ok) {
        const data = await response.json();
        const customersWithUsers = await Promise.all(
          data.customers.map(async (customer: CustomerData) => {
            try {
              const usersResponse = await fetch('/api/admin/customers/manage');
              if (usersResponse.ok) {
                const usersData = await usersResponse.json();
                const customerWithUsers = usersData.customers.find((c: CustomerData) => c.id === customer.id);
                return { ...customer, users: customerWithUsers?.users || [] };
              }
              return { ...customer, users: [] };
            } catch {
              return { ...customer, users: [] };
            }
          })
        );
        setCustomers(customersWithUsers);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const response = await fetch('/api/admin/dashboard/activity');
      if (response.ok) {
        const data = await response.json();
        setRecentActivity(data.activities || []);
      }
    } catch {
    }
  };

  useEffect(() => {
    fetchCustomers();
    fetchRecentActivity();
  }, []);

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
    } catch {
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCustomerUsers) return;

    try {
      const response = await fetch('/api/admin/customers/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...userFormData,
          customerId: currentCustomerUsers.id
        }),
      });

      if (response.ok) {
        setShowAddUserForm(false);
        setUserFormData({ firstName: '', lastName: '', email: '', role: 'customer', loginCode: '' });
        await fetchCustomers();
        
        const updatedCustomer = customers.find(c => c.id === currentCustomerUsers.id);
        if (updatedCustomer) {
          setCurrentCustomerUsers({
            ...currentCustomerUsers,
            users: updatedCustomer.users
          });
        }
      }
    } catch {
    }
  };

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerDetails) return;

    try {
      const response = await fetch('/api/admin/customers/update-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomerDetails.id,
          companyName: editableDetails.companyName,
          firstName: editableDetails.firstName,
          lastName: editableDetails.lastName,
          email: editableDetails.email,
          loginCode: editableDetails.loginCode,
          role: editableDetails.role
        }),
      });

      if (response.ok) {
        fetchCustomers();
        alert('Customer details updated successfully');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to update customer details');
      }
    } catch {
      alert('Failed to save customer details');
    }
  };

  const handleDeleteUser = async (userId: string, customerId: string) => {
    try {
      const response = await fetch('/api/admin/customers/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, customerId }),
      });

      if (response.ok) {
        await fetchCustomers();
        if (currentCustomerUsers) {
          const updatedCustomer = customers.find(c => c.id === customerId);
          if (updatedCustomer) {
            setCurrentCustomerUsers(updatedCustomer);
          }
        }
      }
    } catch {
    }
  };

  const handleViewUsers = async (customer: CustomerData) => {
    setIsTableTransitioning(true);
    
    setTimeout(() => {
      setCurrentCustomerUsers(customer);
      setShowUsersTable(true);
      setIsTableTransitioning(false);
    }, 300);
  };

  const handleViewDetails = (customer: CustomerData) => {
    setIsTableTransitioning(true);
    
    setTimeout(() => {
      setSelectedCustomerDetails(customer);
      if (customer.users && customer.users.length > 0) {
        const user = customer.users[0];
        setEditableDetails({
          companyName: customer.companyName,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          loginCode: user.loginCode || generateLoginCode(),
          role: user.role
        });
      }
      setShowDetailsForm(true);
      setIsTableTransitioning(false);
    }, 300);
  };

  const filteredCustomers = customers.filter(customer =>
    customer.primaryContact.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsers = currentCustomerUsers?.users?.filter(user =>
    user.firstName.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    user.lastName.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(userSearchTerm.toLowerCase())
  ) || [];

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
          <div className="flex items-center space-x-4 mb-4">
            <h1 className="text-3xl font-bold text-gray-900">
              {showUsersTable ? `Users` : 'Customers'}
            </h1>
          </div>
          
          {!showUsersTable && !showDetailsForm && !showAddCustomer && (
            <div className="flex items-center space-x-4">
              <Input
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-80"
              />
              <Button 
                className="bg-[#068d1f] hover:bg-[#087055] text-white px-6 py-2 font-medium"
                onClick={() => setShowAddCustomer(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Customer
              </Button>
            </div>
          )}
          
          {showUsersTable && !showAddUserForm && !showDetailsForm && (
            <div className="flex items-center space-x-4">
              <Input
                placeholder="Search users..."
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                className="w-80"
              />
              <Button 
                className="bg-[#068d1f] hover:bg-[#087055] text-white px-6 py-2 font-medium"
                onClick={() => setShowAddUserForm(true)}
              >
                Add Customer User
              </Button>
            </div>
          )}
        </div>

        {showAddCustomer && (
          <div className="w-full max-w-2xl">
            <Card className="shadow-sm border-0">
              <CardContent className="p-8">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Add New Customer</h2>
                </div>
                
                <form onSubmit={handleAddCustomer} className="space-y-6">
                  <div>
                    <Label htmlFor="companyName" className="text-sm font-medium text-gray-700 mb-2 block">
                      Company Name
                    </Label>
                    <Input
                      id="companyName"
                      placeholder="Enter company name"
                      value={formData.companyName}
                      onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                      required
                      className="h-12"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="primaryContact" className="text-sm font-medium text-gray-700 mb-2 block">
                      Primary Contact
                    </Label>
                    <Input
                      id="primaryContact"
                      placeholder="Enter primary contact name"
                      value={formData.primaryContact}
                      onChange={(e) => setFormData({...formData, primaryContact: e.target.value})}
                      required
                      className="h-12"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="phone" className="text-sm font-medium text-gray-700 mb-2 block">
                      Phone
                    </Label>
                    <Input
                      id="phone"
                      placeholder="Enter phone number"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="h-12"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700 mb-2 block">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter email address"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                      className="h-12"
                    />
                  </div>
                  
                  <div className="pt-4 flex space-x-4">
                    <Button 
                      type="submit" 
                      className="bg-[#068d1f] hover:bg-[#087055] text-white px-8 py-3"
                    >
                      Save
                    </Button>
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={() => setShowAddCustomer(false)}
                      className="px-8 py-3"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {!showAddCustomer && (
          <div className={`transition-all duration-300 ease-in-out ${
            isTableTransitioning ? 'opacity-0 transform -translate-x-8' : 'opacity-100 transform translate-x-0'
          }`}>
            {showDetailsForm ? (
              <div className="w-full">
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="shadow-sm border-0">
                    <CardContent className="p-8">
                      <h3 className="text-xl font-bold text-gray-900 mb-6">Customer Details</h3>
                      <form onSubmit={handleSaveDetails} className="space-y-6">
                        <div>
                          <Label htmlFor="detailsCompany" className="text-sm font-medium text-gray-700 mb-2 block">
                            Customer/Company
                          </Label>
                          <Input
                            id="detailsCompany"
                            value={editableDetails.companyName}
                            onChange={(e) => setEditableDetails({...editableDetails, companyName: e.target.value})}
                            className="h-12"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="detailsFirstName" className="text-sm font-medium text-gray-700 mb-2 block">
                            First Name
                          </Label>
                          <Input
                            id="detailsFirstName"
                            value={editableDetails.firstName}
                            onChange={(e) => setEditableDetails({...editableDetails, firstName: e.target.value})}
                            className="h-12"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="detailsLastName" className="text-sm font-medium text-gray-700 mb-2 block">
                            Last Name
                          </Label>
                          <Input
                            id="detailsLastName"
                            value={editableDetails.lastName}
                            onChange={(e) => setEditableDetails({...editableDetails, lastName: e.target.value})}
                            className="h-12"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="detailsEmail" className="text-sm font-medium text-gray-700 mb-2 block">
                            Email
                          </Label>
                          <Input
                            id="detailsEmail"
                            type="email"
                            value={editableDetails.email}
                            onChange={(e) => setEditableDetails({...editableDetails, email: e.target.value})}
                            className="h-12"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="detailsLoginCode" className="text-sm font-medium text-gray-700 mb-2 block">
                            Login Code
                          </Label>
                          <div className="relative">
                            <Input
                              id="detailsLoginCode"
                              value={editableDetails.loginCode}
                              onChange={(e) => setEditableDetails({...editableDetails, loginCode: e.target.value})}
                              className="h-12 pr-12"
                              maxLength={7}
                            />
                            <button
                              type="button"
                              onClick={() => setEditableDetails({...editableDetails, loginCode: generateLoginCode()})}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              <RefreshCw className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="detailsRole" className="text-sm font-medium text-gray-700 mb-2 block">
                            Role
                          </Label>
                          <Select value={editableDetails.role} onValueChange={(value) => setEditableDetails({...editableDetails, role: value})}>
                            <SelectTrigger className="h-12 bg-white border-gray-300">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white border border-gray-200">
                              <SelectItem value="customer" className="bg-white hover:bg-gray-50">Customer</SelectItem>
                              <SelectItem value="customer_admin" className="bg-white hover:bg-gray-50">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="pt-4">
                          <Button 
                            type="submit"
                            className="bg-[#068d1f] hover:bg-[#087055] text-white px-8 py-3"
                          >
                            Save
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                  
                  <Card className="shadow-sm border-0">
                    <CardContent className="p-8">
                      <h3 className="text-xl font-bold text-gray-900 mb-6">Recent Activity</h3>
                      <div className="space-y-4">
                        {recentActivity.length > 0 ? (
                          recentActivity.slice(0, 5).map((activity) => (
                            <div key={activity.id} className="flex items-start space-x-3">
                              <div className="flex-shrink-0">
                                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-sm font-medium">
                                    {activity.user.firstName.charAt(0)}{activity.user.lastName.charAt(0)}
                                  </span>
                                </div>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="font-medium text-gray-900">
                                    {activity.user.firstName} {activity.user.lastName}
                                  </span>
                                  <span className="text-sm text-gray-500">{activity.timestamp}</span>
                                </div>
                                <p className="text-sm text-gray-600">{activity.description}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-500">No recent activity</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : showAddUserForm ? (
              <div className="w-full max-w-2xl">
                <Card className="shadow-sm border-0">
                  <CardContent className="p-8">
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold text-gray-900">Add Customer User</h2>
                    </div>
                    
                    <form onSubmit={handleAddUser} className="space-y-6">
                      <div>
                        <Label htmlFor="customerCompany" className="text-sm font-medium text-gray-700 mb-2 block">
                          Customer/Company
                        </Label>
                        <Input
                          value={currentCustomerUsers?.companyName || ''}
                          disabled
                          className="h-12 bg-gray-50"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="firstName" className="text-sm font-medium text-gray-700 mb-2 block">
                          First Name
                        </Label>
                        <Input
                          id="firstName"
                          placeholder="Enter first name"
                          value={userFormData.firstName}
                          onChange={(e) => setUserFormData({...userFormData, firstName: e.target.value})}
                          required
                          className="h-12"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="lastName" className="text-sm font-medium text-gray-700 mb-2 block">
                          Last Name
                        </Label>
                        <Input
                          id="lastName"
                          placeholder="Enter last name"
                          value={userFormData.lastName}
                          onChange={(e) => setUserFormData({...userFormData, lastName: e.target.value})}
                          required
                          className="h-12"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="email" className="text-sm font-medium text-gray-700 mb-2 block">
                          Email
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter email address"
                          value={userFormData.email}
                          onChange={(e) => setUserFormData({...userFormData, email: e.target.value})}
                          required
                          className="h-12"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="loginCode" className="text-sm font-medium text-gray-700 mb-2 block">
                          Login Code
                        </Label>
                        <div className="relative">
                          <Input
                            id="loginCode"
                            value={userFormData.loginCode}
                            onChange={(e) => setUserFormData({...userFormData, loginCode: e.target.value})}
                            required
                            className="h-12 pr-12"
                            maxLength={7}
                          />
                          <button
                            type="button"
                            onClick={() => setUserFormData({...userFormData, loginCode: generateLoginCode()})}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            <RefreshCw className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="role" className="text-sm font-medium text-gray-700 mb-2 block">
                          Role
                        </Label>
                        <Select value={userFormData.role} onValueChange={(value) => setUserFormData({...userFormData, role: value})}>
                          <SelectTrigger className="h-12 bg-white border-gray-300">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white border border-gray-200">
                            <SelectItem value="customer" className="bg-white hover:bg-gray-50">Customer</SelectItem>
                            <SelectItem value="customer_admin" className="bg-white hover:bg-gray-50">Admin</SelectItem>
                            <SelectItem value="agent" className="bg-white hover:bg-gray-50">Agent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="pt-4">
                        <Button 
                          type="submit" 
                          className="bg-[#068d1f] hover:bg-[#087055] text-white px-8 py-3"
                        >
                          Save
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="shadow-sm border-0">
                <CardContent className="p-0">
                  <div className="overflow-hidden">
                  {!showUsersTable ? (
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
                                  {customer.primaryContact}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {customer.email}
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
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-[#087055] hover:bg-[#087055] border-0">
                          <TableHead className="text-white font-medium py-4 px-6 text-left border-0">First Name</TableHead>
                          <TableHead className="text-white font-medium py-4 px-6 text-left border-0">Last Name</TableHead>
                          <TableHead className="text-white font-medium py-4 px-6 text-left border-0">Email</TableHead>
                          <TableHead className="text-white font-medium py-4 px-6 text-left border-0">Company</TableHead>
                          <TableHead className="text-white font-medium py-4 px-6 text-center border-0">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentCustomerUsers && currentCustomerUsers.users && filteredUsers.length > 0 ? (
                          filteredUsers.map((user, index) => (
                            <TableRow 
                              key={user.id} 
                              className={`hover:bg-gray-50 border-0 ${
                                index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                              }`}
                            >
                              <TableCell className="py-4 px-6 border-0">
                                <div className="font-medium text-gray-900">
                                  {user.firstName}
                                </div>
                              </TableCell>
                              <TableCell className="py-4 px-6 border-0">
                                <div className="font-medium text-gray-900">
                                  {user.lastName}
                                </div>
                              </TableCell>
                              <TableCell className="py-4 px-6 border-0">
                                <div className="text-gray-600">
                                  {user.email}
                                </div>
                              </TableCell>
                              <TableCell className="py-4 px-6 border-0">
                                <div className="text-gray-600">
                                  {currentCustomerUsers.companyName}
                                </div>
                              </TableCell>
                              <TableCell className="text-center py-4 px-6 border-0">
                                <div className="flex space-x-2 justify-center">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-white bg-[#068d1f] border-[#068d1f] hover:bg-[#087055] hover:text-white hover:border-[#087055] px-4 py-2 text-xs font-medium rounded"
                                    onClick={() => handleViewDetails({
                                      ...currentCustomerUsers,
                                      users: [user]
                                    })}
                                  >
                                    View Details
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-600 border-red-400 hover:bg-red-500 hover:text-white px-3 py-2 rounded"
                                    onClick={() => handleDeleteUser(user.id, currentCustomerUsers.id)}
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
                              {userSearchTerm ? 'No users found matching your search.' : 'No users found for this customer.'}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </CardContent>
            </Card>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}