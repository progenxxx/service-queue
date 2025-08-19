'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileText, Plus, Download } from 'lucide-react';

interface RequestNote {
  id: string;
  noteContent: string;
  isInternal: boolean;
  createdAt: string;
  author: {
    firstName: string;
    lastName: string;
  };
}

interface RequestAttachment {
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
}

interface ServiceRequestDetail {
  id: string;
  serviceQueueId: string;
  client: string;
  serviceRequestNarrative: string;
  taskStatus: string;
  serviceQueueCategory: string;
  dueDate?: string;
  createdAt: string;
  assignedTo?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  assignedBy: {
    firstName: string;
    lastName: string;
  };
  company: {
    companyName: string;
  };
  notes: RequestNote[];
  attachments: RequestAttachment[];
}

const navigation = [
  { name: 'Dashboard', href: '/customer', icon: FileText, current: false },
  { name: 'All Requests', href: '/customer/requests', icon: FileText, current: false },
];

const categoryOptions = [
  { value: 'policy_inquiry', label: 'Policy Inquiry' },
  { value: 'claims_processing', label: 'Claims Processing' },
  { value: 'account_update', label: 'Account Update' },
  { value: 'technical_support', label: 'Technical Support' },
  { value: 'billing_inquiry', label: 'Billing Inquiry' },
  { value: 'other', label: 'Other' },
];

export default function RequestDetailPage() {
  const params = useParams();
  const requestId = params.id as string;
  
  const [request, setRequest] = useState<ServiceRequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddNote, setShowAddNote] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);

  useEffect(() => {
    if (requestId) {
      fetchRequestDetail();
    }
  }, [requestId]);

  const fetchRequestDetail = async () => {
    try {
      const response = await fetch(`/api/customer/requests/detail?id=${requestId}`);
      if (response.ok) {
        const data = await response.json();
        setRequest(data.request);
      }
    } catch (error) {
      console.error('Failed to fetch request detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingNote(true);

    try {
      const response = await fetch('/api/customer/requests/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          requestId: requestId,
          noteContent 
        }),
      });

      if (response.ok) {
        setShowAddNote(false);
        setNoteContent('');
        fetchRequestDetail();
      }
    } catch (error) {
      console.error('Failed to add note:', error);
    } finally {
      setSubmittingNote(false);
    }
  };

  const handleDownloadFile = async (attachment: RequestAttachment) => {
    try {
      const fileName = attachment.filePath.split('/').pop();
      const response = await fetch(`/api/uploads/download?requestId=${requestId}&fileName=${fileName}`);
      
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <DashboardLayout navigation={navigation} title="Request Details">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#087055]"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!request) {
    return (
      <DashboardLayout navigation={navigation} title="Request Details">
        <div className="text-center py-8">
          <p className="text-gray-500">Request not found</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navigation={navigation} title="Request Details">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Request #{request.serviceQueueId}
              {getStatusBadge(request.taskStatus)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Client</Label>
                <p className="text-sm text-gray-900">{request.client}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Category</Label>
                <p className="text-sm text-gray-900">
                  {categoryOptions.find(cat => cat.value === request.serviceQueueCategory)?.label || request.serviceQueueCategory}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Assigned To</Label>
                <p className="text-sm text-gray-900">
                  {request.assignedTo 
                    ? `${request.assignedTo.firstName} ${request.assignedTo.lastName}`
                    : 'Unassigned'
                  }
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Due Date</Label>
                <p className="text-sm text-gray-900">
                  {request.dueDate 
                    ? new Date(request.dueDate).toLocaleDateString()
                    : 'No due date set'
                  }
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Created By</Label>
                <p className="text-sm text-gray-900">
                  {`${request.assignedBy.firstName} ${request.assignedBy.lastName}`}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Created</Label>
                <p className="text-sm text-gray-900">
                  {new Date(request.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-700">Description</Label>
              <p className="text-sm text-gray-900 mt-1">{request.serviceRequestNarrative}</p>
            </div>
          </CardContent>
        </Card>

        {request.attachments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Attachments ({request.attachments.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {request.attachments.map((attachment) => (
                  <div key={attachment.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{attachment.fileName}</p>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(attachment.fileSize)} • Uploaded by {attachment.uploadedBy.firstName} {attachment.uploadedBy.lastName}
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDownloadFile(attachment)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Notes ({request.notes.length})</CardTitle>
            <Dialog open={showAddNote} onOpenChange={setShowAddNote}>
              <DialogTrigger asChild>
                <Button className="bg-[#068d1f] hover:bg-[#087055] text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Note
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Note</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddNote} className="space-y-4">
                  <div>
                    <Label htmlFor="noteContent">Note Content</Label>
                    <Textarea
                      id="noteContent"
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      rows={4}
                      required
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowAddNote(false)}
                      disabled={submittingNote}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      className="bg-[#068d1f] hover:bg-[#087055] text-white"
                      disabled={submittingNote}
                    >
                      {submittingNote ? 'Adding...' : 'Add Note'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {request.notes.length > 0 ? (
              <div className="space-y-4">
                {request.notes.map((note) => (
                  <div key={note.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">
                        {note.author.firstName} {note.author.lastName}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(note.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-gray-700">{note.noteContent}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">No notes added yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}