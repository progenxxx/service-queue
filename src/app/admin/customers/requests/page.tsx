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
import { 
  Building2, 
  UserCheck, 
  BarChart3,
  Settings,
  Users,
  FileText,
  Upload,
  X
} from 'lucide-react';

const navigation = [
  { name: 'All Customers', href: '/admin/customers', icon: Building2, current: false },
  { name: 'Customer Management', href: '/admin/customers/manage', icon: Users, current: false },
  { name: 'All Request', href: '/admin/customers/requests', icon: Building2, current: true },
  { name: 'Agent Management', href: '/admin/agents', icon: UserCheck, current: false },
  { name: 'Summary', href: '/admin/customers', icon: Building2, current: false },
  { name: 'Reports', href: '/admin/reports', icon: BarChart3, current: false },
  { name: 'Settings', href: '/admin/settings', icon: Settings, current: false },
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

export default function AdminAllRequestsPage() {
  const [formData, setFormData] = useState({
    serviceQueueId: generateServiceQueueId(),
    taskStatus: 'new',
    dueDate: '',
    serviceObjective: '',
    client: '',
    assignedById: '',
    companyId: '',
  });

  const [noteData, setNoteData] = useState({
    noteTitle: '',
    noteDetails: '',
    assignedTo: ''
  });

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Fetch users and companies data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch users for "Assigned By" dropdown
        const usersResponse = await fetch('/api/admin/users');
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          setUsers(usersData.users || []);
        }

        // Fetch companies for company selection
        const companiesResponse = await fetch('/api/admin/companies');
        if (companiesResponse.ok) {
          const companiesData = await companiesResponse.json();
          setCompanies(companiesData.companies || []);
        }

        // Get current user info
        const currentUserResponse = await fetch('/api/auth/me');
        if (currentUserResponse.ok) {
          const currentUserData = await currentUserResponse.json();
          setCurrentUser(currentUserData.user);
          // Set default assignedBy to current user
          setFormData(prev => ({
            ...prev,
            assignedById: currentUserData.user.id,
            companyId: currentUserData.user.companyId || ''
          }));
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };

    fetchData();
  }, []);

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
    setSelectedFiles(files => files.filter((_, i) => i !== index));
  };

  const handleAddNote = () => {
    setShowNoteDialog(false);
    setNoteData({
      noteTitle: '',
      noteDetails: '',
      assignedTo: ''
    });
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('client', formData.client);
      formDataToSend.append('serviceRequestNarrative', formData.serviceObjective);
      formDataToSend.append('serviceQueueCategory', 'other');
      formDataToSend.append('serviceQueueId', formData.serviceQueueId);
      formDataToSend.append('assignedById', formData.assignedById);
      
      if (formData.dueDate) {
        formDataToSend.append('dueDate', formData.dueDate);
      }
      
      if (formData.companyId) {
        formDataToSend.append('companyId', formData.companyId);
      }

      selectedFiles.forEach(file => {
        formDataToSend.append('files', file);
      });

      const response = await fetch('/api/admin/request', {
        method: 'POST',
        body: formDataToSend,
      });

      const result = await response.json();

      if (response.ok) {
        setFormData({
          serviceQueueId: generateServiceQueueId(),
          taskStatus: 'new',
          dueDate: '',
          serviceObjective: '',
          client: '',
          assignedById: currentUser?.id || '',
          companyId: currentUser?.companyId || '',
        });
        setSelectedFiles([]);
        alert('Service request created successfully!');
      } else {
        alert(`Failed to create service request: ${result.error}`);
      }
    } catch (error) {
      console.error('Error creating service request:', error);
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
                        Service Objective and Narrative
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
                        Client
                      </Label>
                      <Input
                        id="client"
                        value={formData.client}
                        onChange={(e) => setFormData({...formData, client: e.target.value})}
                        placeholder="Enter client name"
                        className="border-gray-200"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="companyId" className="text-sm font-medium text-gray-700 mb-2 block">
                        The Person Who Assigned (Assigned By)
                      </Label>
                      <Select value={formData.companyId} onValueChange={(value) => setFormData({...formData, companyId: value})}>
                        <SelectTrigger className="border-gray-200 bg-white">
                          <SelectValue placeholder="Select a company" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-200">
                          {companies.map((company) => (
                            <SelectItem 
                              key={company.id} 
                              value={company.id}
                              className="bg-white hover:bg-gray-50"
                            >
                              {company.primaryContact}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* <div>
                      <Label htmlFor="assignedById" className="text-sm font-medium text-gray-700 mb-2 block">
                        The Person Who Assigned (Assigned By)
                      </Label>
                      <Select value={formData.assignedById} onValueChange={(value) => setFormData({...formData, assignedById: value})}>
                        <SelectTrigger className="border-gray-200 bg-white">
                          <SelectValue placeholder="Select the person who assigned this" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-200">
                          {users.map((user) => (
                            <SelectItem 
                              key={user.id} 
                              value={user.id}
                              className="bg-white hover:bg-gray-50"
                            >
                              {user.firstName} {user.lastName} ({user.email}) - {user.role}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div> */}

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
                        {isSubmitting ? 'Creating...' : 'Add Service Queue'}
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
                <CardTitle className="text-lg font-semibold text-gray-900">Request Log</CardTitle>
                <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
                  <DialogTrigger asChild>
                    <Badge 
                      className="bg-teal-100 hover:bg-teal-200 text-teal-700 cursor-pointer px-3 py-1 text-xs font-medium rounded-full"
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
                          Note Details
                        </Label>
                        <Textarea
                          id="noteDetails"
                          value={noteData.noteDetails}
                          onChange={(e) => setNoteData({...noteData, noteDetails: e.target.value})}
                          placeholder="Enter Service Objective and Narrative"
                          className="min-h-[120px] border-gray-200"
                          rows={5}
                        />
                      </div>

                      <div>
                        <Label htmlFor="assignedToEmail" className="text-sm font-medium text-gray-700 mb-2 block">
                          Assigned To - Email Address
                        </Label>
                        <Input
                          id="assignedToEmail"
                          type="email"
                          value={noteData.assignedTo}
                          onChange={(e) => setNoteData({...noteData, assignedTo: e.target.value})}
                          className="border-gray-200"
                          placeholder="Enter email address"
                        />
                      </div>

                      <div className="pt-4">
                        <Button 
                          onClick={handleAddNote}
                          className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center py-8 text-gray-400">
                  <p className="text-sm">No request logs available</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}