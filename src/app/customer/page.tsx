'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Plus, 
  BarChart3,
  Settings,
  Home
} from 'lucide-react';

interface DashboardStats {
  totalRequests: number;
  newRequests: number;
  inProgressRequests: number;
  completedRequests: number;
  overdueRequests: number;
}

interface RecentRequest {
  id: string;
  serviceQueueId: string;
  client: string;
  serviceRequestNarrative: string;
  taskStatus: string;
  createdAt: string;
  dueDate?: string;
  assignedTo?: {
    firstName: string;
    lastName: string;
  };
}

const navigation = [
  { name: 'Dashboard', href: '/customer', icon: Home, current: true },
  { name: 'Create Request', href: '/customer/requests/create', icon: Plus, current: false },
  { name: 'My Requests', href: '/customer/requests', icon: FileText, current: false },
  { name: 'Reports', href: '/customer/reports', icon: BarChart3, current: false },
  { name: 'Settings', href: '/customer/settings', icon: Settings, current: false },
];

export default function CustomerDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentRequests, setRecentRequests] = useState<RecentRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsResponse, requestsResponse] = await Promise.all([
        fetch('/api/customer/dashboard/stats'),
        fetch('/api/customer/dashboard/recent-requests')
      ]);

      if (statsResponse.ok && requestsResponse.ok) {
        const statsData = await statsResponse.json();
        const requestsData = await requestsResponse.json();
        
        setStats(statsData.stats);
        setRecentRequests(requestsData.requests);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      new: { label: 'New', className: 'bg-blue-100 text-blue-800' },
      open: { label: 'Open', className: 'bg-yellow-100 text-yellow-800' },
      in_progress: { label: 'In Progress', className: 'bg-orange-100 text-orange-800' },
      closed: { label: 'Closed', className: 'bg-green-100 text-green-800' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.new;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  if (loading) {
    return (
      <DashboardLayout navigation={navigation} title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#087055]"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navigation={navigation} title="Dashboard">
      <div className="py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalRequests || 0}</div>
              <p className="text-xs text-muted-foreground">All time requests</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.inProgressRequests || 0}</div>
              <p className="text-xs text-muted-foreground">Currently being worked on</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.completedRequests || 0}</div>
              <p className="text-xs text-muted-foreground">Successfully closed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats?.overdueRequests || 0}</div>
              <p className="text-xs text-muted-foreground">Past due date</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Requests</CardTitle>
            <Button href="/customer/requests/create" className="bg-[#087055] hover:bg-[#065946]">
              <Plus className="h-4 w-4 mr-2" />
              New Request
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request ID</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentRequests.length > 0 ? (
                  recentRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">
                        <a 
                          href={`/customer/requests/${request.id}`}
                          className="text-[#087055] hover:underline"
                        >
                          {request.serviceQueueId}
                        </a>
                      </TableCell>
                      <TableCell>{request.client}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {request.serviceRequestNarrative}
                      </TableCell>
                      <TableCell>{getStatusBadge(request.taskStatus)}</TableCell>
                      <TableCell>
                        {request.assignedTo 
                          ? `${request.assignedTo.firstName} ${request.assignedTo.lastName}`
                          : 'Unassigned'
                        }
                      </TableCell>
                      <TableCell>
                        {request.dueDate ? (
                          <span className={isOverdue(request.dueDate) ? 'text-red-600 font-medium' : ''}>
                            {formatDate(request.dueDate)}
                          </span>
                        ) : (
                          'No due date'
                        )}
                      </TableCell>
                      <TableCell>{formatDate(request.createdAt)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No requests found. 
                      <a href="/customer/requests/create" className="text-[#087055] hover:underline ml-1">
                        Create your first request
                      </a>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  className="h-24 flex flex-col items-center justify-center"
                  onClick={() => window.location.href = '/customer/requests/create'}
                >
                  <Plus className="h-6 w-6 mb-2" />
                  Create New Request
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-24 flex flex-col items-center justify-center"
                  onClick={() => window.location.href = '/customer/requests'}
                >
                  <FileText className="h-6 w-6 mb-2" />
                  View All Requests
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-24 flex flex-col items-center justify-center"
                  onClick={() => window.location.href = '/customer/reports'}
                >
                  <BarChart3 className="h-6 w-6 mb-2" />
                  View Reports
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-24 flex flex-col items-center justify-center"
                  onClick={() => window.location.href = '/customer/settings'}
                >
                  <Settings className="h-6 w-6 mb-2" />
                  Manage Users
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Request Status Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">New</span>
                  <span className="text-sm text-blue-600">{stats?.newRequests || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">In Progress</span>
                  <span className="text-sm text-orange-600">{stats?.inProgressRequests || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Completed</span>
                  <span className="text-sm text-green-600">{stats?.completedRequests || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Overdue</span>
                  <span className="text-sm text-red-600">{stats?.overdueRequests || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}