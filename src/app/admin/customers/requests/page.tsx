'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Building2, 
  UserCheck, 
  BarChart3,
  Settings,
  Users,
  FileText,
  Eye,
  Download,
  Plus,
  Upload,
  X
} from 'lucide-react';

interface ServiceRequest {
  id: string;
  serviceQueueId: string;
  client: string;
  serviceRequestNarrative: string;
  taskStatus: string;
  serviceQueueCategory: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  company: {
    id: string;
    companyName: string;
  };
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
  notes: Array<{
    id: string;
    noteContent: string;
    isInternal: boolean;
    createdAt: string;
    author: {
      firstName: string;
      lastName: string;
    };
  }>;
  attachments: Array<{
    id: string;
    fileName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    createdAt: string;
    uploadedBy: {
      firstName: string;
      lastName: string;
    };
  }>;
}

const navigation = [
  { name: 'All Customers', href: '/admin/customers', icon: Building2, current: false },
  { name: 'Customer Management', href: '/admin/customers/manage', icon: Users, current: false },
  { name: 'All Request', href: '/admin/customers/requests', icon: Building2, current: true },
  { name: 'Agent Management', href: '/admin/agents', icon: UserCheck, current: false },
  { name: 'Summary', href: '/admin/customers', icon: Building2, current: false },
  { name: 'Reports', href: '/admin/reports', icon: BarChart3, current: false },
  { name: 'Settings', href: '/admin/settings', icon: Settings, current: false },
];

const categoryOptions = [
  { value: 'policy_inquiry', label: 'Policy Inquiry' },
  { value: 'claims_processing', label: 'Claims Processing' },
  { value: 'account_update', label: 'Account Update' },
  { value: 'technical_support', label: 'Technical Support' },
  { value: 'billing_inquiry', label: 'Billing Inquiry' },
  { value: 'other', label: 'Other' },
];

export default function AdminAllRequestsPage() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<ServiceRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showAddRequestModal, setShowAddRequestModal] = useState(false);
  const [formData, setFormData] = useState({
    client: '',
    serviceRequestNarrative: '',
    serviceQueueCategory: '',
    dueDate: ''
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAllRequests = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/requests');
      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests || []);
        setFilteredRequests(data.requests || []);
      }
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllRequests();
  }, [fetchAllRequests]);

  useEffect(() => {
    let filtered = requests;

    if (searchTerm) {
      filtered = filtered.filter(request =>
        request.serviceQueueId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.company.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.serviceRequestNarrative.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(request => request.taskStatus === statusFilter);
    }

    setFilteredRequests(filtered);
  }, [searchTerm, statusFilter, requests]);

  const handleAddRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('client', formData.client);
      formDataToSend.append('serviceRequestNarrative', formData.serviceRequestNarrative);
      formDataToSend.append('serviceQueueCategory', formData.serviceQueueCategory);
      if (formData.dueDate) {
        formDataToSend.append('dueDate', formData.dueDate);
      }

      selectedFiles.forEach(file => {
        formDataToSend.append('files', file);
      });

      const response = await fetch('/api/customer/requests', {
        method: 'POST',
        body: formDataToSend,
      });

      if (response.ok) {
        setShowAddRequestModal(false);
        setFormData({
          client: '',
          serviceRequestNarrative: '',
          serviceQueueCategory: '',
          dueDate: ''
        });
        setSelectedFiles([]);
        fetchAllRequests();
      } else {
        console.error('Failed to create request');
      }
    } catch (error) {
      console.error('Error creating request:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(files => files.filter((_, i) => i !== index));
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

  const getCategoryLabel = (category: string) => {
    const option = categoryOptions.find(opt => opt.value === category);
    return option ? option.label : category;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleViewRequest = (request: ServiceRequest) => {
    setSelectedRequest(request);
    setShowRequestModal(true);
  };

  const handleDownloadFile = async (attachment: ServiceRequest['attachments'][0]) => {
    try {
      const fileName = attachment.filePath.split('/').pop();
      const response = await fetch(`/api/uploads/download?requestId=${selectedRequest?.id}&fileName=${fileName}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = attachment.fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to download file:', error);
    }
  };

  if (loading) {
    return (
      <DashboardLayout navigation={navigation} title="All Requests">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#087055]"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navigation={navigation} title="All Requests">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Input
            placeholder="Search requests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#087055] focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="closed">Closed</option>
          </select>
          <Dialog open={showAddRequestModal} onOpenChange={setShowAddRequestModal}>
            <DialogTrigger asChild>
              <Button className="bg-[#068d1f] hover:bg-[#087055] text-white px-6 py-2 font-medium">
                <Plus className="h-4 w-4 mr-2" />
                Add Request
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold text-gray-900">
                  Create New Service Request
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleAddRequest} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="client">Client Name</Label>
                    <Input
                      id="client"
                      value={formData.client}
                      onChange={(e) => setFormData({...formData, client: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select 
                      value={formData.serviceQueueCategory} 
                      onValueChange={(value) => setFormData({...formData, serviceQueueCategory: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="dueDate">Due Date (Optional)</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                  />
                </div>

                <div>
                  <Label htmlFor="narrative">Service Request Description</Label>
                  <Textarea
                    id="narrative"
                    value={formData.serviceRequestNarrative}
                    onChange={(e) => setFormData({...formData, serviceRequestNarrative: e.target.value})}
                    rows={4}
                    required
                  />
                </div>

                <div>
                  <Label>Attachments (Optional)</Label>
                  <div className="mt-2">
                    <input
                      type="file"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.txt"
                    />
                    <label
                      htmlFor="file-upload"
                      className="flex items-center justify-center w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:border-[#087055] transition-colors"
                    >
                      <Upload className="h-5 w-5 mr-2 text-gray-400" />
                      <span className="text-gray-600">Choose files or drag and drop</span>
                    </label>
                  </div>

                  {selectedFiles.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border">
                          <div>
                            <span className="text-sm font-medium">{file.name}</span>
                            <span className="text-xs text-gray-500 ml-2">({formatFileSize(file.size)})</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowAddRequestModal(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-[#068d1f] hover:bg-[#087055] text-white"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Creating...' : 'Create Request'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="shadow-sm border-0">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#087055] hover:bg-[#087055] border-0">
                    <TableHead className="text-white font-medium py-4 px-6 text-left border-0">Request ID</TableHead>
                    <TableHead className="text-white font-medium py-4 px-6 text-left border-0">Client</TableHead>
                    <TableHead className="text-white font-medium py-4 px-6 text-left border-0">Company</TableHead>
                    <TableHead className="text-white font-medium py-4 px-6 text-left border-0">Category</TableHead>
                    <TableHead className="text-white font-medium py-4 px-6 text-left border-0">Status</TableHead>
                    <TableHead className="text-white font-medium py-4 px-6 text-left border-0">Assigned To</TableHead>
                    <TableHead className="text-white font-medium py-4 px-6 text-left border-0">Created</TableHead>
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
                        <TableCell className="font-medium text-gray-900 py-4 px-6 border-0">
                          {request.serviceQueueId}
                        </TableCell>
                        <TableCell className="text-gray-600 py-4 px-6 border-0">
                          {request.client}
                        </TableCell>
                        <TableCell className="text-gray-600 py-4 px-6 border-0">
                          {request.company.companyName}
                        </TableCell>
                        <TableCell className="text-gray-600 py-4 px-6 border-0">
                          {getCategoryLabel(request.serviceQueueCategory)}
                        </TableCell>
                        <TableCell className="py-4 px-6 border-0">
                          {getStatusBadge(request.taskStatus)}
                        </TableCell>
                        <TableCell className="text-gray-600 py-4 px-6 border-0">
                          {request.assignedTo 
                            ? `${request.assignedTo.firstName} ${request.assignedTo.lastName}`
                            : 'Unassigned'
                          }
                        </TableCell>
                        <TableCell className="text-gray-600 py-4 px-6 border-0">
                          {formatDate(request.createdAt)}
                        </TableCell>
                        <TableCell className="text-center py-4 px-6 border-0">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-white bg-[#068d1f] border-[#068d1f] hover:bg-[#087055] hover:text-white hover:border-[#087055] px-4 py-2 text-xs font-medium rounded"
                            onClick={() => handleViewRequest(request)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow className="border-0">
                      <TableCell colSpan={8} className="text-center py-12 text-gray-500 border-0">
                        No requests found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Request Details Modal */}
        {selectedRequest && (
          <Dialog open={showRequestModal} onOpenChange={setShowRequestModal}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold text-gray-900">
                  Request Details - {selectedRequest.serviceQueueId}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="text-sm font-medium text-gray-700 block mb-1">Request ID</label>
                    <div className="text-base text-gray-900">{selectedRequest.serviceQueueId}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="text-sm font-medium text-gray-700 block mb-1">Client</label>
                    <div className="text-base text-gray-900">{selectedRequest.client}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="text-sm font-medium text-gray-700 block mb-1">Company</label>
                    <div className="text-base text-gray-900">{selectedRequest.company.companyName}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="text-sm font-medium text-gray-700 block mb-1">Category</label>
                    <div className="text-base text-gray-900">{getCategoryLabel(selectedRequest.serviceQueueCategory)}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="text-sm font-medium text-gray-700 block mb-1">Status</label>
                    <div className="text-sm mt-2">
                      {getStatusBadge(selectedRequest.taskStatus)}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="text-sm font-medium text-gray-700 block mb-1">Assigned To</label>
                    <div className="text-base text-gray-900">
                      {selectedRequest.assignedTo 
                        ? `${selectedRequest.assignedTo.firstName} ${selectedRequest.assignedTo.lastName}`
                        : 'Unassigned'
                      }
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="text-sm font-medium text-gray-700 block mb-1">Created By</label>
                    <div className="text-base text-gray-900">
                      {`${selectedRequest.assignedBy.firstName} ${selectedRequest.assignedBy.lastName}`}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="text-sm font-medium text-gray-700 block mb-1">Created Date</label>
                    <div className="text-base text-gray-900">{formatDate(selectedRequest.createdAt)}</div>
                  </div>
                  {selectedRequest.dueDate && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <label className="text-sm font-medium text-gray-700 block mb-1">Due Date</label>
                      <div className="text-base text-gray-900">{formatDate(selectedRequest.dueDate)}</div>
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="text-sm font-medium text-gray-700 block mb-2">Description</label>
                  <div className="text-base text-gray-900">{selectedRequest.serviceRequestNarrative}</div>
                </div>

                {selectedRequest.attachments && selectedRequest.attachments.length > 0 && (
                  <div className="pt-6 border-t border-gray-200">
                    <label className="text-lg font-semibold text-gray-900 block mb-4">
                      Attachments ({selectedRequest.attachments.length})
                    </label>
                    <div className="space-y-3">
                      {selectedRequest.attachments.map((attachment) => (
                        <div key={attachment.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div>
                            <div className="text-sm font-medium text-blue-900">{attachment.fileName}</div>
                            <div className="text-xs text-blue-600">
                              {formatFileSize(attachment.fileSize)} • Uploaded by {attachment.uploadedBy.firstName} {attachment.uploadedBy.lastName}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadFile(attachment)}
                            className="text-blue-600 border-blue-400 hover:bg-blue-500 hover:text-white"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedRequest.notes && selectedRequest.notes.length > 0 && (
                  <div className="pt-6 border-t border-gray-200">
                    <label className="text-lg font-semibold text-gray-900 block mb-4">
                      Notes ({selectedRequest.notes.length})
                    </label>
                    <div className="space-y-4">
                      {selectedRequest.notes.map((note) => (
                        <div key={note.id} className="bg-white p-4 rounded-lg border shadow-sm">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-medium text-gray-900">
                              {note.author.firstName} {note.author.lastName}
                            </span>
                            <span className="text-sm text-gray-500">
                              {new Date(note.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-gray-700">{note.noteContent}</p>
                          {note.isInternal && (
                            <Badge className="mt-2 bg-yellow-100 text-yellow-800">Internal Note</Badge>
                          )}
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