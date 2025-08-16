'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  BarChart3,
  Settings,
  Home,
  User
} from 'lucide-react';

interface AgentStats {
  totalAssigned: number;
  newRequests: number;
  inProgressRequests: number;
  completedRequests: number;
  overdueRequests: number;
  totalClients: number;
}

interface AssignedRequest {
  id: string;
  serviceQueueId: string;
  client: string;
  serviceRequestNarrative: string;
  taskStatus: string;
  createdAt: string;
  dueDate?: string;
  assignedBy: {
    firstName: string;
    lastName: string;
  };
  company: {
    companyName: string;
  };
}

const navigation = [
  { name: 'Dashboard', href: '/agent', icon: Home, current: true },
  { name: 'All Requests', href: '/agent/requests', icon: FileText, current: false },
  { name: 'My Queue', href: '/agent/queue', icon: User, current: false },
  { name: 'Reports', href: '/agent/reports', icon: BarChart3, current: false },
  { name: 'Settings', href: '/agent/settings', icon: Settings, current: false },
];

export default function AgentDashboard() {
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [assignedRequests, setAssignedRequests] = useState<AssignedRequest[]>([]);
  const [allRequests, setAllRequests] = useState<AssignedRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsResponse, assignedResponse, allResponse] = await Promise.all([
        fetch('/api/agent/dashboard/stats'),
        fetch('/api/agent/dashboard/assigned-requests'),
        fetch('/api/agent/dashboard/all-requests')
      ]);

      if (statsResponse.ok && assignedResponse.ok && allResponse.ok) {
        const statsData = await statsResponse.json();
        const assignedData = await assignedResponse.json();
        const allData = await allResponse.json();
        
        setStats(statsData.stats);
        setAssignedRequests(assignedData.requests);
        setAllRequests(allData.requests);
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

  const getPriorityBadge = (dueDate?: string) => {
    if (!dueDate) return null;
    
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return <Badge className="bg-red-100 text-red-800">Overdue</Badge>;
    } else if (diffDays <= 1) {
      return <Badge className="bg-orange-100 text-orange-800">Due Today</Badge>;
    } else if (diffDays <= 3) {
      return <Badge className="bg-yellow-100 text-yellow-800">Due Soon</Badge>;
    }
    return null;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const RequestTable = ({ requests, showCompany = false }: { requests: AssignedRequest[], showCompany?: boolean }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Request ID</TableHead>
          <TableHead>Client</TableHead>
          {showCompany && <TableHead>Company</TableHead>}
          <TableHead>Description</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead>Created By</TableHead>
          <TableHead>Due Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests.length > 0 ? (
          requests.map((request) => (
            <TableRow key={request.id}>
              <TableCell className="font-medium">
                <a 
                  href={`/agent/requests/${request.id}`}
                  className="text-[#087055] hover:underline"
                >
                  {request.serviceQueueId}
                </a>
              </TableCell>
              <TableCell>{request.client}</TableCell>
              {showCompany && <TableCell>{request.company.companyName}</TableCell>}
              <TableCell className="max-w-xs truncate">
                {request.serviceRequestNarrative}
              </TableCell>
              <TableCell>{getStatusBadge(request.taskStatus)}</TableCell>
              <TableCell>{getPriorityBadge(request.dueDate)}</TableCell>
              <TableCell>
                {`${request.assignedBy.firstName} ${request.assignedBy.lastName}`}
              </TableCell>
              <TableCell>
                {request.dueDate ? formatDate(request.dueDate) : 'No due date'}
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={showCompany ? 8 : 7} className="text-center py-8 text-gray-500">
              No requests found
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  if (loading) {
    return (
      <DashboardLayout navigation={navigation} title="Agent Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#087055]"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navigation={navigation} title="Agent Dashboard">
      <div className="py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assigned to Me</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalAssigned || 0}</div>
              <p className="text-xs text-muted-foreground">Active assignments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.inProgressRequests || 0}</div>
              <p className="text-xs text-muted-foreground">Currently working on</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.completedRequests || 0}</div>
              <p className="text-xs text-muted-foreground">Closed requests</p>
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

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Request Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="assigned" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="assigned">My Queue ({assignedRequests.length})</TabsTrigger>
                <TabsTrigger value="all">All Requests ({allRequests.length})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="assigned" className="mt-6">
                <RequestTable requests={assignedRequests} showCompany={true} />
              </TabsContent>
              
              <TabsContent value="all" className="mt-6">
                <RequestTable requests={allRequests} showCompany={true} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  className="h-24 flex flex-col items-center justify-center"
                  onClick={() => window.location.href = '/agent/queue'}
                >
                  <User className="h-6 w-6 mb-2" />
                  My Queue
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-24 flex flex-col items-center justify-center"
                  onClick={() => window.location.href = '/agent/requests'}
                >
                  <FileText className="h-6 w-6 mb-2" />
                  All Requests
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-24 flex flex-col items-center justify-center"
                  onClick={() => window.location.href = '/agent/reports'}
                >
                  <BarChart3 className="h-6 w-6 mb-2" />
                  View Reports
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-24 flex flex-col items-center justify-center"
                  onClick={() => window.location.href = '/agent/settings'}
                >
                  <Settings className="h-6 w-6 mb-2" />
                  Settings
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Workload Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">New Assignments</span>
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
                <hr className="my-2" />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Clients</span>
                  <span className="text-sm text-gray-600">{stats?.totalClients || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}