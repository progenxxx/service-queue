'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Building2, 
  UserCheck, 
  BarChart3,
  Settings,
  Users,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Home
} from 'lucide-react';

interface ServiceRequest {
  id: string;
  serviceQueueId: string;
  client: string;
  serviceRequestNarrative: string;
  taskStatus: string;
  serviceQueueCategory: string;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  assignedTo?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  assignedBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
  company: {
    companyName: string;
  };
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface SummaryStats {
  totalRequests: number;
  newRequests: number;
  openRequests: number;
  inProgressRequests: number;
  closedRequests: number;
  overdueRequests: number;
}

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: Home, current: false },
  { name: 'All Customers', href: '/admin/customers', icon: Building2, current: false },
  { name: 'Customer Management', href: '/admin/customers/manage', icon: Users, current: false },
  { name: 'All Request', href: '/admin/customers/requests', icon: Building2, current: false },
  { name: 'Agent Management', href: '/admin/agents', icon: UserCheck, current: false },
  { name: 'Summary', href: '/admin/summary', icon: BarChart3, current: true },
  { name: 'Reports', href: '/admin/reports', icon: BarChart3, current: false },
  { name: 'Settings', href: '/admin/settings', icon: Settings, current: false },
];

export default function SummaryPage() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<ServiceRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [summaryStats, setSummaryStats] = useState<SummaryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const [filters, setFilters] = useState({
    client: '',
    assignedBy: '',
    status: '',
    startDate: '',
    endDate: '',
    search: ''
  });

  useEffect(() => {
    fetchSummaryData();
    fetchUsers();
  }, []);

  useEffect(() => {
    let filtered = [...requests];

    if (filters.client) {
      filtered = filtered.filter(request => 
        request.client.toLowerCase().includes(filters.client.toLowerCase())
      );
    }

    if (filters.assignedBy) {
      filtered = filtered.filter(request => request.assignedBy.id === filters.assignedBy);
    }

    if (filters.status) {
      filtered = filtered.filter(request => request.taskStatus === filters.status);
    }

    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      filtered = filtered.filter(request => 
        new Date(request.createdAt) >= startDate
      );
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(request => 
        new Date(request.createdAt) <= endDate
      );
    }

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(request => 
        request.serviceQueueId.toLowerCase().includes(searchTerm) ||
        request.client.toLowerCase().includes(searchTerm) ||
        request.serviceRequestNarrative.toLowerCase().includes(searchTerm) ||
        request.company.companyName.toLowerCase().includes(searchTerm)
      );
    }

    setFilteredRequests(filtered);
  }, [requests, filters]);

  const fetchSummaryData = async () => {
    try {
      const response = await fetch('/api/admin/summary');
      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests || []);
        setSummaryStats(data.summary || null);
      }
    } catch (error) {
      console.error('Failed to fetch summary data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const resetFilters = () => {
    setFilters({
      client: '',
      assignedBy: '',
      status: '',
      startDate: '',
      endDate: '',
      search: ''
    });
  };

  const handleViewDetails = (request: ServiceRequest) => {
    setSelectedRequest(request);
    setShowDetailsModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'open':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-orange-100 text-orange-800';
      case 'closed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getUniqueClients = () => {
    const clients = [...new Set(requests.map(request => request.client))];
    return clients.sort();
  };

  if (loading) {
    return (
      <DashboardLayout navigation={navigation} title="Summary">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#087055]"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navigation={navigation} title="Summary">
      <div className="space-y-6">
        {summaryStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">Total</p>
                    <p className="text-2xl font-bold text-blue-900">{summaryStats.totalRequests}</p>
                  </div>
                  <div className="bg-blue-500 p-2 rounded-full">
                    <FileText className="h-4 w-4 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-cyan-600">New</p>
                    <p className="text-2xl font-bold text-cyan-900">{summaryStats.newRequests}</p>
                  </div>
                  <div className="bg-cyan-500 p-2 rounded-full">
                    <FileText className="h-4 w-4 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-yellow-600">Open</p>
                    <p className="text-2xl font-bold text-yellow-900">{summaryStats.openRequests}</p>
                  </div>
                  <div className="bg-yellow-500 p-2 rounded-full">
                    <Clock className="h-4 w-4 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-600">In Progress</p>
                    <p className="text-2xl font-bold text-orange-900">{summaryStats.inProgressRequests}</p>
                  </div>
                  <div className="bg-orange-500 p-2 rounded-full">
                    <Clock className="h-4 w-4 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">Closed</p>
                    <p className="text-2xl font-bold text-green-900">{summaryStats.closedRequests}</p>
                  </div>
                  <div className="bg-green-500 p-2 rounded-full">
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-600">Overdue</p>
                    <p className="text-2xl font-bold text-red-900">{summaryStats.overdueRequests}</p>
                  </div>
                  <div className="bg-red-500 p-2 rounded-full">
                    <AlertTriangle className="h-4 w-4 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Filter Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <div>
                <Label htmlFor="search" className="text-sm font-medium text-gray-700 mb-2 block">
                  Search
                </Label>
                <Input
                  id="search"
                  placeholder="Search requests..."
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                  className="w-full"
                />
              </div>

              <div>
                <Label htmlFor="client" className="text-sm font-medium text-gray-700 mb-2 block">
                  Client
                </Label>
                <Select
                  value={filters.client || undefined}
                  onValueChange={(value) => setFilters({...filters, client: value || ''})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Clients" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All Clients</SelectItem>
                    {getUniqueClients().map((client) => (
                      <SelectItem key={client} value={client}>
                        {client}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="assignedBy" className="text-sm font-medium text-gray-700 mb-2 block">
                  Assigned By
                </Label>
                <Select
                  value={filters.assignedBy || undefined}
                  onValueChange={(value) => setFilters({...filters, assignedBy: value === '__all__' ? '' : value || ''})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Users" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All Users</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.firstName} {user.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status" className="text-sm font-medium text-gray-700 mb-2 block">
                  Status
                </Label>
                <Select
                  value={filters.status || undefined}
                  onValueChange={(value) => setFilters({...filters, status: value === '__all__' ? '' : value || ''})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All Status</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="startDate" className="text-sm font-medium text-gray-700 mb-2 block">
                  Start Date
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                  className="w-full"
                />
              </div>

              <div>
                <Label htmlFor="endDate" className="text-sm font-medium text-gray-700 mb-2 block">
                  End Date
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-gray-600">
                Showing {filteredRequests.length} of {requests.length} requests
              </div>
              <Button
                variant="outline"
                onClick={resetFilters}
                className="text-gray-600 border-gray-300 hover:bg-gray-50"
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-0">
          <CardContent className="p-0">
            <div className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#087055] hover:bg-[#087055] border-0">
                    <TableHead className="text-white font-medium py-4 px-6 text-left border-0">Service Queue ID</TableHead>
                    <TableHead className="text-white font-medium py-4 px-6 text-left border-0">Client</TableHead>
                    <TableHead className="text-white font-medium py-4 px-6 text-left border-0">Request Narrative</TableHead>
                    <TableHead className="text-white font-medium py-4 px-6 text-center border-0">Status</TableHead>
                    <TableHead className="text-white font-medium py-4 px-6 text-left border-0">Assigned By</TableHead>
                    <TableHead className="text-white font-medium py-4 px-6 text-left border-0">Company</TableHead>
                    <TableHead className="text-white font-medium py-4 px-6 text-left border-0">Created Date</TableHead>
                    <TableHead className="text-white font-medium py-4 px-6 text-center border-0">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.length > 0 ? (
                    filteredRequests.map((request, index) => (
                      <TableRow 
                        key={request.id} 
                        className={`hover:bg-gray-50 border-0 ${
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                        }`}
                      >
                        <TableCell className="py-4 px-6 border-0">
                          <div className="font-medium text-[#087055]">
                            {request.serviceQueueId}
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6 border-0">
                          <div className="font-medium text-gray-900">
                            {request.client}
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6 border-0">
                          <div className="text-gray-600 max-w-xs truncate">
                            {request.serviceRequestNarrative}
                          </div>
                        </TableCell>
                        <TableCell className="text-center py-4 px-6 border-0">
                          <Badge className={`font-semibold px-3 py-1 ${getStatusColor(request.taskStatus)}`}>
                            {request.taskStatus.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4 px-6 border-0">
                          <div className="text-gray-600">
                            {request.assignedBy.firstName} {request.assignedBy.lastName}
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6 border-0">
                          <div className="text-gray-600">
                            {request.company.companyName}
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6 border-0">
                          <div className="text-gray-600">
                            {formatDate(request.createdAt)}
                          </div>
                        </TableCell>
                        <TableCell className="text-center py-4 px-6 border-0">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-white bg-[#068d1f] border-[#068d1f] hover:bg-[#087055] hover:text-white hover:border-[#087055] px-4 py-2 text-xs font-medium rounded"
                            onClick={() => handleViewDetails(request)}
                          >
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow className="border-0">
                      <TableCell colSpan={8} className="text-center py-12 text-gray-500 border-0">
                        No requests found matching your filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {selectedRequest && (
          <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold text-gray-900">
                  Request Details - {selectedRequest.serviceQueueId}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <Label className="text-sm font-medium text-gray-700 block mb-1">Service Queue ID</Label>
                    <div className="text-base text-gray-900 font-mono">{selectedRequest.serviceQueueId}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <Label className="text-sm font-medium text-gray-700 block mb-1">Client</Label>
                    <div className="text-base text-gray-900">{selectedRequest.client}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <Label className="text-sm font-medium text-gray-700 block mb-1">Status</Label>
                    <Badge className={`font-semibold px-3 py-1 ${getStatusColor(selectedRequest.taskStatus)}`}>
                      {selectedRequest.taskStatus.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <Label className="text-sm font-medium text-gray-700 block mb-1">Category</Label>
                    <div className="text-base text-gray-900">{selectedRequest.serviceQueueCategory.replace('_', ' ')}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <Label className="text-sm font-medium text-gray-700 block mb-1">Company</Label>
                    <div className="text-base text-gray-900">{selectedRequest.company.companyName}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <Label className="text-sm font-medium text-gray-700 block mb-1">Assigned By</Label>
                    <div className="text-base text-gray-900">
                      {selectedRequest.assignedBy.firstName} {selectedRequest.assignedBy.lastName}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <Label className="text-sm font-medium text-gray-700 block mb-1">Created Date</Label>
                    <div className="text-base text-gray-900">{formatDate(selectedRequest.createdAt)}</div>
                  </div>
                  {selectedRequest.dueDate && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <Label className="text-sm font-medium text-gray-700 block mb-1">Due Date</Label>
                      <div className="text-base text-gray-900">{formatDate(selectedRequest.dueDate)}</div>
                    </div>
                  )}
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <Label className="text-sm font-medium text-gray-700 block mb-2">Service Request Narrative</Label>
                  <div className="text-base text-gray-900 whitespace-pre-wrap">
                    {selectedRequest.serviceRequestNarrative}
                  </div>
                </div>

                {selectedRequest.assignedTo && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <Label className="text-sm font-medium text-blue-700 block mb-2">Assigned To</Label>
                    <div className="text-base text-blue-900">
                      {selectedRequest.assignedTo.firstName} {selectedRequest.assignedTo.lastName}
                    </div>
                    <div className="text-sm text-blue-700">
                      {selectedRequest.assignedTo.email}
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