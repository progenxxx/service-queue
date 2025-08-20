// src/app/admin/agents/page.tsx
'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Building2, 
  UserCheck, 
  BarChart3,
  Settings,
  Users,
  Plus,
  Trash2,
  RotateCcw
} from 'lucide-react';

interface Agent {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  loginCode: string;
  assignedCompanyIds: string[];
  isActive: boolean;
  createdAt: string;
  assignedCompanies?: Array<{
    id: string;
    companyName: string;
  }>;
}

interface Company {
  id: string;
  companyName: string;
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
  { name: 'All Customers', href: '/admin/customers', icon: Building2, current: false },
  { name: 'Customer Management', href: '/admin/customers/manage', icon: Users, current: false },
  { name: 'All Request', href: '/admin/customers/requests', icon: Building2, current: false },
  { name: 'Agent Management', href: '/admin/agents', icon: UserCheck, current: true },
  { name: 'Summary', href: '/admin/summary', icon: Building2, current: false },
  { name: 'Reports', href: '/admin/reports', icon: BarChart3, current: false },
  { name: 'Settings', href: '/admin/settings', icon: Settings, current: false },
];

export default function AgentManagementPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showAddAgent, setShowAddAgent] = useState(false);
  const [showDetailsForm, setShowDetailsForm] = useState(false);
  const [isTableTransitioning, setIsTableTransitioning] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    assignedCompanyIds: [] as string[]
  });

  const [editableDetails, setEditableDetails] = useState({
    firstName: '',
    lastName: '',
    email: '',
    loginCode: '',
    assignedCompanyIds: [] as string[]
  });

  useEffect(() => {
    fetchAgents();
    fetchCompanies();
    fetchRecentActivity();
  }, []);

  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/admin/agents');
      if (response.ok) {
        const data = await response.json();
        setAgents(data.agents || []);
      } else {
        setAgents([]);
      }
    } catch (error) {
      setAgents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await fetch('/api/admin/companies');
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

  const fetchRecentActivity = async () => {
    try {
      const response = await fetch('/api/admin/dashboard/activity');
      if (response.ok) {
        const data = await response.json();
        setRecentActivity(data.activities || []);
      }
    } catch (error) {
      setRecentActivity([]);
    }
  };

  const generateAgentCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 7; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleAddAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch('/api/admin/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const result = await response.json();
        setShowAddAgent(false);
        setFormData({ firstName: '', lastName: '', email: '', assignedCompanyIds: [] });
        await fetchAgents();
        alert(result.message || 'Agent created successfully!');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to create agent');
      }
    } catch (error) {
      alert('Failed to add agent. Please try again.');
    }
  };

  const handleViewDetails = (agent: Agent) => {
    setIsTableTransitioning(true);
    
    setTimeout(() => {
      setSelectedAgent(agent);
      setEditableDetails({
        firstName: agent.firstName,
        lastName: agent.lastName,
        email: agent.email,
        loginCode: agent.loginCode,
        assignedCompanyIds: agent.assignedCompanyIds || []
      });
      setShowDetailsForm(true);
      setIsTableTransitioning(false);
    }, 300);
  };

  const handleBackFromDetails = () => {
    setIsTableTransitioning(true);
    
    setTimeout(() => {
      setShowDetailsForm(false);
      setSelectedAgent(null);
      setIsTableTransitioning(false);
    }, 300);
  };

  const handleBackToAgents = () => {
    setIsTableTransitioning(true);
    
    setTimeout(() => {
      setShowAddAgent(false);
      setFormData({ firstName: '', lastName: '', email: '', assignedCompanyIds: [] });
      setIsTableTransitioning(false);
    }, 300);
  };

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgent) return;

    try {
      const response = await fetch('/api/admin/agents', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: selectedAgent.id,
          ...editableDetails
        }),
      });

      if (response.ok) {
        await fetchAgents();
        alert('Agent details updated successfully');
        handleBackFromDetails();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to update agent details');
      }
    } catch (error) {
      alert('Failed to save agent details');
    }
  };

  const handleDeleteAgent = async (agentId: string) => {
    if (!confirm('Are you sure you want to delete this agent?')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/agents', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId }),
      });

      if (response.ok) {
        await fetchAgents();
        alert('Agent deleted successfully');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to delete agent');
      }
    } catch (error) {
      alert('Failed to delete agent');
    }
  };

  const filteredAgents = agents.filter(agent =>
    agent.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              {showDetailsForm ? 'Agent Details' : 'Agents'}
            </h1>
            {showDetailsForm && (
              <Button 
                onClick={handleBackFromDetails}
                variant="outline"
                className="text-[#087055] border-[#087055] hover:bg-[#087055] hover:text-white"
              >
                ← Back to Agents
              </Button>
            )}
          </div>
          
          {!showDetailsForm && !showAddAgent && (
            <div className="flex items-center space-x-4">
              <Input
                placeholder="Search agents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-80"
              />
              <Button 
                className="bg-[#068d1f] hover:bg-[#087055] text-white px-6 py-2 font-medium"
                onClick={() => setShowAddAgent(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </div>
          )}
        </div>

        {!showAddAgent && (
          <div className={`transition-all duration-300 ease-in-out ${
            isTableTransitioning ? 'opacity-0 transform -translate-x-8' : 'opacity-100 transform translate-x-0'
          }`}>
            {showDetailsForm ? (
              <div className="w-full">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="shadow-sm border-0">
                    <CardContent className="p-8">
                      <h3 className="text-xl font-bold text-gray-900 mb-6">Agent Details</h3>
                      <form onSubmit={handleSaveDetails} className="space-y-6">
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
                          <Label htmlFor="detailsAssignedCompanies" className="text-sm font-medium text-gray-700 mb-2 block">
                            Assign Customer
                          </Label>
                          <Select
                            onValueChange={(value) => {
                              if (!editableDetails.assignedCompanyIds.includes(value)) {
                                setEditableDetails({
                                  ...editableDetails,
                                  assignedCompanyIds: [...editableDetails.assignedCompanyIds, value]
                                });
                              }
                            }}
                          >
                            <SelectTrigger className="h-12 bg-white border-gray-300">
                              <SelectValue placeholder="Company Name" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border border-gray-200">
                              {companies.map((company) => (
                                <SelectItem key={company.id} value={company.id} className="bg-white hover:bg-gray-50">
                                  {company.companyName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {editableDetails.assignedCompanyIds.length > 0 && (
                            <div className="mt-3 space-y-2">
                              {editableDetails.assignedCompanyIds.map((companyId) => {
                                const company = companies.find(c => c.id === companyId);
                                return (
                                  <div key={companyId} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border">
                                    <span className="text-sm font-medium">{company?.companyName}</span>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                      onClick={() => setEditableDetails({
                                        ...editableDetails,
                                        assignedCompanyIds: editableDetails.assignedCompanyIds.filter(id => id !== companyId)
                                      })}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
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
                              onClick={() => setEditableDetails({...editableDetails, loginCode: generateAgentCode()})}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              <RotateCcw className="h-5 w-5" />
                            </button>
                          </div>
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
            ) : (
              <Card className="shadow-sm border-0">
                <CardContent className="p-0">
                  <div className="overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-[#087055] hover:bg-[#087055] border-0">
                          <TableHead className="text-white font-medium py-4 px-6 text-left border-0">First Name</TableHead>
                          <TableHead className="text-white font-medium py-4 px-6 text-left border-0">Last Name</TableHead>
                          <TableHead className="text-white font-medium py-4 px-6 text-left border-0">Assigned To</TableHead>
                          <TableHead className="text-white font-medium py-4 px-6 text-left border-0">Email</TableHead>
                          <TableHead className="text-white font-medium py-4 px-6 text-center border-0">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAgents.length > 0 ? (
                          filteredAgents.map((agent, index) => (
                            <TableRow 
                              key={agent.id} 
                              className={`hover:bg-gray-50 border-0 ${
                                index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                              }`}
                            >
                              <TableCell className="py-4 px-6 border-0">
                                <div className="font-medium text-gray-900">
                                  {agent.firstName}
                                </div>
                              </TableCell>
                              <TableCell className="py-4 px-6 border-0">
                                <div className="font-medium text-gray-900">
                                  {agent.lastName}
                                </div>
                              </TableCell>
                              <TableCell className="py-4 px-6 border-0">
                                <div className="text-gray-600">
                                  {agent.assignedCompanies && agent.assignedCompanies.length > 0 
                                    ? agent.assignedCompanies.map(c => c.companyName).join(', ')
                                    : 'No companies assigned'
                                  }
                                </div>
                              </TableCell>
                              <TableCell className="text-gray-600 py-4 px-6 border-0">
                                {agent.email}
                              </TableCell>
                              <TableCell className="text-center py-4 px-6 border-0">
                                <div className="flex space-x-2 justify-center">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-white bg-[#068d1f] border-[#068d1f] hover:bg-[#087055] hover:text-white hover:border-[#087055] px-3 py-2 text-xs font-medium rounded"
                                    onClick={() => handleViewDetails(agent)}
                                  >
                                    View Details
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-600 border-red-400 hover:bg-red-500 hover:text-white px-3 py-2 rounded"
                                    onClick={() => handleDeleteAgent(agent.id)}
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
                              No agents found.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {showAddAgent && (
          <div className="w-full max-w-2xl">
            <Card className="shadow-sm border-0">
              <CardContent className="p-8">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Agent User</h2>
                  <Button 
                    onClick={handleBackToAgents}
                    variant="outline"
                    className="text-[#087055] border-[#087055] hover:bg-[#087055] hover:text-white"
                  >
                    ← Back to Agents
                  </Button>
                </div>
                
                <form onSubmit={handleAddAgent} className="space-y-6">
                  <div>
                    <Label htmlFor="firstName" className="text-sm font-medium text-gray-700 mb-2 block">
                      First Name
                    </Label>
                    <Input
                      id="firstName"
                      placeholder="First Name"
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
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
                      placeholder="Last Name"
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
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
                      placeholder="test@gmail.com"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                      className="h-12"
                    />
                  </div>

                  <div>
                    <Label htmlFor="assignedCompanies" className="text-sm font-medium text-gray-700 mb-2 block">
                      Assign Customer
                    </Label>
                    <Select
                      onValueChange={(value) => {
                        if (!formData.assignedCompanyIds.includes(value)) {
                          setFormData({
                            ...formData,
                            assignedCompanyIds: [...formData.assignedCompanyIds, value]
                          });
                        }
                      }}
                    >
                      <SelectTrigger className="h-12 bg-white border-gray-300">
                        <SelectValue placeholder="Company Name" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200">
                        {companies.map((company) => (
                          <SelectItem key={company.id} value={company.id} className="bg-white hover:bg-gray-50">
                            {company.companyName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formData.assignedCompanyIds.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {formData.assignedCompanyIds.map((companyId) => {
                          const company = companies.find(c => c.id === companyId);
                          return (
                            <div key={companyId} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border">
                              <span className="text-sm font-medium">{company?.companyName}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => setFormData({
                                  ...formData,
                                  assignedCompanyIds: formData.assignedCompanyIds.filter(id => id !== companyId)
                                })}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
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
                      onClick={handleBackToAgents}
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
      </div>
    </DashboardLayout>
  );
}