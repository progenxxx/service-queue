'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3,
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

const navigation = [
  { name: 'All Request', href: '/agent', icon: Home, current: false },
  { name: 'My Queues', href: '/agent/summary', icon: BarChart3, current: true },
  { name: 'Reports', href: '/agent/reports', icon: BarChart3, current: false },
];

export default function AgentSummaryPage() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    client: '',
    assignedBy: '',
    status: '',
    startDate: '',
    endDate: '',
    search: ''
  });

  useEffect(() => {
    fetchMyRequests();
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

  const fetchMyRequests = async () => {
    try {
      const response = await fetch('/api/agent/summary');
      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests || []);
      }
    } catch (error) {
      console.error('Failed to fetch my requests data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddServiceRequest = () => {
    window.location.href = '/admin/customers/requests';
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
            <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
            <div className="ml-auto">
              <Button
                onClick={handleAddServiceRequest}
                className="bg-[#087055] hover:bg-[#065a42] text-white px-6"
              >
                Add Service Request
              </Button>
            </div>
          </div>
        </div>

        <div className="flex gap-4 items-center py-4">
          <div className="flex-1">
            <Input
              placeholder="Search"
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              className="border-0 shadow-none bg-gray-50 placeholder-gray-500"
            />
          </div>

          <div className="w-48">
            <Select
              value={filters.client || undefined}
              onValueChange={(value) => setFilters({...filters, client: value || ''})}
            >
              <SelectTrigger className="border-0 shadow-none bg-gray-50">
                <SelectValue placeholder="Select Clients" />
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

          <div className="w-48">
            <Select
              value={filters.status || undefined}
              onValueChange={(value) => setFilters({...filters, status: value === '__all__' ? '' : value || ''})}
            >
              <SelectTrigger className="border-0 shadow-none bg-gray-50">
                <SelectValue placeholder="Select Status" />
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
        </div>

        <Card className="shadow-sm border-0">
          <CardContent className="p-0">
            <div className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#087055] hover:bg-[#087055] border-0">
                    <TableHead className="text-white font-medium py-4 px-6 text-left border-0">Client</TableHead>
                    <TableHead className="text-white font-medium py-4 px-6 text-left border-0">Serv Que ID</TableHead>
                    <TableHead className="text-white font-medium py-4 px-6 text-center border-0">Status</TableHead>
                    <TableHead className="text-white font-medium py-4 px-6 text-left border-0">Service Request Narrative</TableHead>
                    <TableHead className="text-white font-medium py-4 px-6 text-left border-0">Service Que Category</TableHead>
                    <TableHead className="text-white font-medium py-4 px-6 text-left border-0">Assigned By</TableHead>
                    <TableHead className="text-white font-medium py-4 px-6 text-left border-0">Due Date</TableHead>
                    <TableHead className="text-white font-medium py-4 px-6 text-left border-0">Modified By</TableHead>
                    <TableHead className="text-white font-medium py-4 px-6 text-left border-0">Created On</TableHead>
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
                          <div className="font-medium text-gray-900">
                            {request.client}
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6 border-0">
                          <div className="font-medium text-[#087055]">
                            {request.serviceQueueId}
                          </div>
                        </TableCell>
                        <TableCell className="text-center py-4 px-6 border-0">
                          <Badge className={`font-semibold px-3 py-1 ${getStatusColor(request.taskStatus)}`}>
                            {request.taskStatus.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4 px-6 border-0">
                          <div className="text-gray-600 max-w-xs truncate">
                            {request.serviceRequestNarrative}
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6 border-0">
                          <div className="text-gray-600">
                            {request.serviceQueueCategory.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6 border-0">
                          <div className="text-gray-600">
                            {request.assignedBy.firstName} {request.assignedBy.lastName}
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6 border-0">
                          <div className="text-gray-600">
                            {request.dueDate ? formatDate(request.dueDate) : 'No Due Date'}
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6 border-0">
                          <div className="text-gray-600">
                            {request.assignedBy.firstName} {request.assignedBy.lastName}
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6 border-0">
                          <div className="text-gray-600">
                            {formatDate(request.createdAt)}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow className="border-0">
                      <TableCell colSpan={9} className="text-center py-12 text-gray-500 border-0">
                        {filters.search || filters.client || filters.status ? 
                          'No requests found matching your filters.' : 
                          'No requests assigned to you yet.'
                        }
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}