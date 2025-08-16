'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Users, 
  Building2, 
  UserCheck, 
  BarChart3,
  Settings,
  Home,
  UserPlus,
  Plus
} from 'lucide-react';

interface AdminStats {
  totalRequests: number;
  totalCustomers: number;
  totalAgents: number;
  totalUsers: number;
  activeRequests: number;
  completedRequests: number;
  overdueRequests: number;
}

interface CustomerOverview {
  id: string;
  companyName: string;
  primaryContact: string;
  email: string;
  openTickets: number;
  closedTickets: number;
  wipTickets: number;
  totalUsers: number;
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
  { name: 'Dashboard', href: '/admin', icon: Home, current: true },
  { name: 'All Customers', href: '/admin/customers', icon: Building2, current: false },
  { name: 'Customer Management', href: '/admin/customers/manage', icon: Users, current: false },
  { name: 'Agent Management', href: '/admin/agents', icon: UserCheck, current: false },
  { name: 'Reports', href: '/admin/reports', icon: BarChart3, current: false },
  { name: 'Settings', href: '/admin/settings', icon: Settings, current: false },
];

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [customers, setCustomers] = useState<CustomerOverview[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsResponse, customersResponse, activityResponse] = await Promise.all([
        fetch('/api/admin/dashboard/stats'),
        fetch('/api/admin/dashboard/customers'),
        fetch('/api/admin/dashboard/activity')
      ]);

      if (statsResponse.ok && customersResponse.ok && activityResponse.ok) {
        const statsData = await statsResponse.json();
        const customersData = await customersResponse.json();
        const activityData = await activityResponse.json();
        
        setStats(statsData.stats);
        setCustomers(customersData.customers);
        setRecentActivity(activityData.activities);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'request_created':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'user_created':
        return <UserPlus className="h-4 w-4 text-green-500" />;
      case 'status_changed':
        return <BarChart3 className="h-4 w-4 text-orange-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <DashboardLayout navigation={navigation} title="Super Admin Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#087055]"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navigation={navigation} title="Super Admin Dashboard">
      <div className="py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalRequests || 0}</div>
              <p className="text-xs text-muted-foreground">Across all customers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Customers</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalCustomers || 0}</div>
              <p className="text-xs text-muted-foreground">Active companies</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Agents</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalAgents || 0}</div>
              <p className="text-xs text-muted-foreground">Active agents</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
              <p className="text-xs text-muted-foreground">System wide</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Request Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Active</span>
                  <Badge className="bg-blue-100 text-blue-800">
                    {stats?.activeRequests || 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Completed</span>
                  <Badge className="bg-green-100 text-green-800">
                    {stats?.completedRequests || 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Overdue</span>
                  <Badge className="bg-red-100 text-red-800">
                    {stats?.overdueRequests || 0}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col items-center justify-center"
                  onClick={() => window.location.href = '/admin/customers/manage'}
                >
                  <Plus className="h-5 w-5 mb-1" />
                  Add Customer
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col items-center justify-center"
                  onClick={() => window.location.href = '/admin/agents'}
                >
                  <UserPlus className="h-5 w-5 mb-1" />
                  Add Agent
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col items-center justify-center"
                  onClick={() => window.location.href = '/admin/reports'}
                >
                  <BarChart3 className="h-5 w-5 mb-1" />
                  View Reports
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col items-center justify-center"
                  onClick={() => window.location.href = '/admin/customers'}
                >
                  <Building2 className="h-5 w-5 mb-1" />
                  All Customers
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Customer Overview</CardTitle>
            <Button 
              href="/admin/customers" 
              variant="outline"
              size="sm"
            >
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Primary Contact</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Open</TableHead>
                  <TableHead>WIP</TableHead>
                  <TableHead>Closed</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.length > 0 ? (
                  customers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">
                        <a 
                          href={`/admin/customers/${customer.id}`}
                          className="text-[#087055] hover:underline"
                        >
                          {customer.companyName}
                        </a>
                      </TableCell>
                      <TableCell>{customer.primaryContact}</TableCell>
                      <TableCell>{customer.email}</TableCell>
                      <TableCell>
                        <Badge className="bg-blue-100 text-blue-800">
                          {customer.openTickets}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-orange-100 text-orange-800">
                          {customer.wipTickets}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800">
                          {customer.closedTickets}
                        </Badge>
                      </TableCell>
                      <TableCell>{customer.totalUsers}</TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.location.href = `/admin/customers/${customer.id}`}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No customers found. 
                      <a href="/admin/customers/manage" className="text-[#087055] hover:underline ml-1">
                        Add your first customer
                      </a>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg border">
                    {getActivityIcon(activity.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.description}
                      </p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <span>{`${activity.user.firstName} ${activity.user.lastName}`}</span>
                        {activity.company && (
                          <>
                            <span>•</span>
                            <span>{activity.company.companyName}</span>
                          </>
                        )}
                        <span>•</span>
                        <span>{formatDate(activity.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">No recent activity</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}