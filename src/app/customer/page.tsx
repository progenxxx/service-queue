'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Building2, UserCheck, BarChart3, Settings, Users, FileText, Upload, X, Send, Loader2 } from 'lucide-react';

const getNavigation = (userRole: string) => [
  { name: 'Create Request', href: '/customer', icon: Building2, current: true },
  { name: 'Summary', href: '/customer/summary', icon: Building2, current: false },
  { name: 'Reports', href: '/customer/reports', icon: BarChart3, current: false },
  ...(userRole === 'customer_admin' ? [
    { name: 'Admin Settings', href: '/customer/admin/settings', icon: Settings, current: false }
  ] : [])
];

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  companyId?: string;
}

interface Company {
  id: string;
  companyName: string;
  primaryContact: string;
}

interface Agent {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
  type: string;
}

interface NoteLog {
  id: string;
  noteContent: string;
  createdAt: string;
  author: {
    firstName: string;
    lastName: string;
  };
  request: {
    serviceQueueId: string;
    client: string;
    company: {
      companyName: string;
    };
  };
}

export default function CustomerRequestPage() {
  const [formData, setFormData] = useState({
    serviceQueueId: generateServiceQueueId(),
    taskStatus: 'new',
    dueDate: '',
    serviceObjective: '',
    client: '',
    assignedById: '',
    serviceQueueCategory: 'client_service_cancel_non_renewal',
    companyId: '',
  });

  const [noteData, setNoteData] = useState({ noteTitle: '', noteDetails: '', emailAddress: '' });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [noteLogs, setNoteLogs] = useState<NoteLog[]>([]);
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null);
  const [navigation, setNavigation] = useState(getNavigation('customer'));

  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([
          fetchCurrentUser(),
          fetchCompanies(),
          fetchAgents(),
          fetchNoteLogs()
        ]);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          setCurrentUser(data.user);
          setNavigation(getNavigation(data.user.role));
          setFormData((prev) => ({
            ...prev,
            companyId: data.user.companyId || '',
          }));
        }
      }
    } catch (error) {
      console.error('Failed to fetch current user:', error);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await fetch('/api/customer/companies');
      if (response.ok) {
        const data = await response.json();
        setCompanies(data.companies || []);
      } else {
        setCompanies([]);
      }
    } catch (error) {
      setCompanies([]);
    }
  };

  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/customer/agents');
      if (response.ok) {
        const data = await response.json();
        const agentsOnly = (data.agents || []).filter((agent: Agent) => agent.type === 'agent');
        setAgents(agentsOnly);
      } else {
        setAgents([]);
      }
    } catch (error) {
      setAgents([]);
    }
  };

  const fetchNoteLogs = async () => {
    try {
      const response = await fetch('/api/admin/request');
      if (response.ok) {
        const data = await response.json();
        const validNotes = (data.notes || []).filter(
          (note: NoteLog) =>
            note &&
            note.id &&
            note.author &&
            note.request &&
            typeof note.noteContent === 'string'
        );
        setNoteLogs(validNotes);
      } else {
        setNoteLogs([]);
      }
    } catch (error) {
      setNoteLogs([]);
    }
  };

  function generateServiceQueueId() {
    const prefix = 'ServQUE';
    const timestamp = Date.now().toString();
    return `${prefix}-${timestamp}`;
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((files) => files.filter((_, i) => i !== index));
  };

  const handleAddNote = async () => {
    if (!noteData.noteDetails.trim() || !noteData.emailAddress.trim()) {
      alert('Please fill in the note details and email address');
      return;
    }
    if (!currentRequestId) {
      alert('Please create a service request first');
      return;
    }

    setIsAddingNote(true);
    try {
      const response = await fetch('/api/admin/customers/requests/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteContent: noteData.noteDetails,
          recipientEmail: noteData.emailAddress,
          requestId: currentRequestId,
        }),
      });

      const result = await response.json();
      if (response.ok) {
        setShowNoteDialog(false);
        setNoteData({ noteTitle: '', noteDetails: '', emailAddress: '' });
        alert('Note added and email sent successfully!');
        await fetchNoteLogs();
      } else {
        alert(`Failed to add note: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      alert('Error adding note');
    } finally {
      setIsAddingNote(false);
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.client || !formData.serviceObjective || !formData.assignedById) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('client', formData.client);
      formDataToSend.append('serviceRequestNarrative', formData.serviceObjective);
      formDataToSend.append('serviceQueueCategory', formData.serviceQueueCategory);
      formDataToSend.append('serviceQueueId', formData.serviceQueueId);
      formDataToSend.append('assignedById', formData.assignedById);

      if (formData.companyId) {
        formDataToSend.append('companyId', formData.companyId);
      }
      if (formData.dueDate) {
        formDataToSend.append('dueDate', formData.dueDate);
      }

      selectedFiles.forEach((file) => {
        formDataToSend.append('files', file);
      });

      const response = await fetch('/api/customer', {
        method: 'POST',
        body: formDataToSend,
      });

      const result = await response.json();
      if (response.ok) {
        const newRequestId = result.request?.id;
        setCurrentRequestId(newRequestId);

        setFormData({
          serviceQueueId: generateServiceQueueId(),
          taskStatus: 'new',
          dueDate: '',
          serviceObjective: '',
          client: '',
          assignedById: '',
          serviceQueueCategory: 'client_service_cancel_non_renewal',
          companyId: currentUser?.companyId || '',
        });

        setSelectedFiles([]);
        await fetchNoteLogs();
        alert('Service request created successfully!');
      } else {
        alert(`Failed to create service request: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      alert('Error creating service request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <DashboardLayout navigation={navigation} title="">
      <div className="space-y-6 bg-gray-50 min-h-screen p-6">
        <h1 className="text-2xl font-bold text-gray-900">Service Request</h1>
        
        <div className="mb-6">
          <nav className="border-b border-gray-200 bg-white">
            <div className="flex space-x-8 px-6">
              <button className="py-3 px-1 border-b-2 border-teal-500 text-teal-600 font-medium text-sm">
                Request Details
              </button>
            </div>
          </nav>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="shadow-sm border border-gray-200 bg-white">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-lg font-semibold text-gray-900">Form</CardTitle>
                <p className="text-sm text-gray-500">Please Fill Out the Form Below to Add a Service Request</p>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSubmitRequest}>
                  <div className="space-y-5">
                    <div>
                      <Label htmlFor="serviceQueueId" className="text-sm font-medium text-gray-700 mb-2 block">
                        Service Queue Rec ID
                      </Label>
                      <Input
                        id="serviceQueueId"
                        value={formData.serviceQueueId}
                        readOnly
                        className="bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <Label htmlFor="taskStatus" className="text-sm font-medium text-gray-700 mb-2 block">
                        Task Status
                      </Label>
                      <Select value={formData.taskStatus} onValueChange={(value) => setFormData({...formData, taskStatus: value})}>
                        <SelectTrigger className="border-gray-200 bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-200">
                          <SelectItem value="new" className="bg-white hover:bg-gray-50">New</SelectItem>
                          <SelectItem value="open" className="bg-white hover:bg-gray-50">Open</SelectItem>
                          <SelectItem value="in_progress" className="bg-white hover:bg-gray-50">In Progress</SelectItem>
                          <SelectItem value="closed" className="bg-white hover:bg-gray-50">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="dueDate" className="text-sm font-medium text-gray-700 mb-2 block">
                        Due Date
                      </Label>
                      <div className="relative w-full">
                        <Input
                          id="dueDate"
                          type="date"
                          value={formData.dueDate}
                          onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                          className="border-gray-200 w-full"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="serviceObjective" className="text-sm font-medium text-gray-700 mb-2 block">
                        Service Objective and Narrative *
                      </Label>
                      <Textarea
                        id="serviceObjective"
                        value={formData.serviceObjective}
                        onChange={(e) => setFormData({...formData, serviceObjective: e.target.value})}
                        placeholder="Enter the service request objective and narrative"
                        className="min-h-[100px] border-gray-200"
                        rows={4}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="client" className="text-sm font-medium text-gray-700 mb-2 block">
                        Client *
                      </Label>
                      <Input
                        id="client"
                        placeholder="Enter client name"
                        value={formData.client}
                        onChange={(e) => setFormData({...formData, client: e.target.value})}
                        required
                        className="border-gray-200"
                      />
                    </div>

                    <div>
                      <Label htmlFor="assignedById" className="text-sm font-medium text-gray-700 mb-2 block">
                        The Person Who Assigned (Assigned By) *
                      </Label>
                      <Select 
                        value={formData.assignedById} 
                        onValueChange={(value) => setFormData({...formData, assignedById: value})}
                      >
                        <SelectTrigger className="border-gray-200 bg-white">
                          <SelectValue placeholder="Select an agent" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-200">
                          {agents.length > 0 ? (
                            agents.map((agent) => (
                              <SelectItem 
                                key={agent.id} 
                                value={agent.id}
                                className="bg-white hover:bg-gray-50"
                              >
                                {agent.firstName} {agent.lastName} (Agent)
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-agents" disabled className="text-gray-400">
                              No agents available
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      {agents.length === 0 && (
                        <p className="mt-1 text-xs text-red-500">
                          No agents found. Please contact your administrator.
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="serviceQueueCategory" className="text-sm font-medium text-gray-700 mb-2 block">
                        Service Queue Category
                      </Label>
                      <Select 
                        value={formData.serviceQueueCategory} 
                        onValueChange={(value) => setFormData({...formData, serviceQueueCategory: value})}
                      >
                        <SelectTrigger className="border-gray-200 bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-200">
                          <SelectItem value="client_service_cancel_non_renewal" className="bg-white hover:bg-gray-50">
                            Client Service - Cancel/Non Renewal Notice
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">
                        Attach File
                      </Label>
                      <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center hover:border-gray-300 transition-colors bg-gray-50">
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
                          className="cursor-pointer flex flex-col items-center"
                        >
                          <div className="bg-gray-100 rounded-full p-3 mb-3">
                            <Upload className="h-6 w-6 text-gray-400" />
                          </div>
                          <span className="text-sm font-medium text-gray-600">Drag and Drop Your Files</span>
                          <span className="text-xs text-gray-400 mt-1">Max. File formats: .pdf, .docx, .jpg, .png (up to 10MB)</span>
                        </label>
                      </div>

                      {selectedFiles.length > 0 && (
                        <div className="mt-4 space-y-2">
                          {selectedFiles.map((file, index) => (
                            <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200">
                              <div className="flex items-center space-x-3">
                                <FileText className="h-5 w-5 text-gray-400" />
                                <div>
                                  <span className="text-sm font-medium text-gray-900">{file.name}</span>
                                  <span className="text-xs text-gray-500 ml-2">({formatFileSize(file.size)})</span>
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFile(index)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      <Button 
                        type="button"
                        variant="outline"
                        className="mt-3 text-sm border-gray-200"
                        onClick={() => document.getElementById('file-upload')?.click()}
                      >
                        Select File
                      </Button>
                    </div>

                    <div className="pt-6">
                      <Button 
                        type="submit"
                        className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-2 rounded-md"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          'Add Service Queue'
                        )}
                      </Button>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="shadow-sm border border-gray-200 bg-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b border-gray-100">
                <CardTitle className="text-lg font-semibold text-gray-900">Note Log</CardTitle>
                <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
                  <DialogTrigger asChild>
                    <Badge 
                      className="bg-teal-100 hover:bg-teal-200 text-teal-700 cursor-pointer px-3 py-1 text-xs font-medium rounded-full"
                      onClick={() => {
                        if (!currentRequestId) {
                          alert('Please create a service request first');
                          return;
                        }
                        setShowNoteDialog(true);
                      }}
                    >
                      Add Note
                    </Badge>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-semibold text-gray-900">Add Note</DialogTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        Please fill out the fields below and click save to add a new log to the service request.
                      </p>
                    </DialogHeader>
                    
                    <div className="space-y-4 mt-4">
                      <div>
                        <Label htmlFor="noteTitle" className="text-sm font-medium text-gray-700 mb-2 block">
                          Note Title
                        </Label>
                        <Input
                          id="noteTitle"
                          value={noteData.noteTitle}
                          onChange={(e) => setNoteData({...noteData, noteTitle: e.target.value})}
                          placeholder="Enter Document Title"
                          className="border-gray-200"
                        />
                      </div>

                      <div>
                        <Label htmlFor="noteDetails" className="text-sm font-medium text-gray-700 mb-2 block">
                          Note Details *
                        </Label>
                        <Textarea
                          id="noteDetails"
                          value={noteData.noteDetails}
                          onChange={(e) => setNoteData({...noteData, noteDetails: e.target.value})}
                          placeholder="Enter Service Objective and Narrative"
                          className="min-h-[120px] border-gray-200"
                          rows={5}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="emailAddress" className="text-sm font-medium text-gray-700 mb-2 block">
                          Email Address *
                        </Label>
                        <Input
                          id="emailAddress"
                          type="email"
                          value={noteData.emailAddress}
                          onChange={(e) => setNoteData({...noteData, emailAddress: e.target.value})}
                          className="border-gray-200"
                          placeholder="Enter email address"
                          required
                        />
                      </div>

                      <div className="pt-4">
                        <Button 
                          onClick={handleAddNote}
                          className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                          disabled={isAddingNote}
                        >
                          {isAddingNote ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Adding...
                            </>
                          ) : (
                            <>
                              <Send className="mr-2 h-4 w-4" />
                              Save
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="p-6">
                {noteLogs.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {noteLogs.slice(0, 10).map((note) => (
                      <div key={note.id} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="text-xs font-medium text-teal-600 mb-1">
                              {note.request?.serviceQueueId || 'N/A'}
                            </p>
                            <p className="text-sm font-semibold text-gray-900 mb-1">
                              {note.request?.client || 'Unknown Client'}
                            </p>
                            <p className="text-xs text-gray-600 line-clamp-2">
                              {note.noteContent}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>
                            By: {note.author?.firstName || 'Unknown'} {note.author?.lastName || ''}
                          </span>
                          <span>{formatDate(note.createdAt)}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Company: {note.request?.company?.companyName || 'N/A'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-sm">No note logs available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}