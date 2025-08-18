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
import { 
  Building2, 
  UserCheck, 
  BarChart3,
  Settings,
  Home,
  Users,
  Plus,
  Eye,
  EyeOff,
  Trash2
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

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

const navigation = [
  { name: 'All Customers', href: '/admin/customers', icon: Building2, current: false },
  { name: 'Customer Management', href: '/admin/customers/manage', icon: Users, current: false },
  { name: 'Agent Management', href: '/admin/agents', icon: UserCheck, current: true },
  { name: 'Reports', href: '/admin/reports', icon: BarChart3, current: false },
  { name: 'Settings', href: '/admin/settings', icon: Settings, current: false },
];

export default function AgentManagementPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showAddAgent, setShowAddAgent] = useState(false);
  const [showAssignedTo, setShowAssignedTo] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    assignedCompanyIds: [] as string[]
  });

  useEffect(() => {
    fetchAgents();
    fetchCompanies();
  }, []);

  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/admin/agents');
      if (response.ok) {
        const data = await response.json();
        setAgents(data.agents);
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await fetch('/api/admin/companies');
      if (response.ok) {
        const data = await response.json();
        setCompanies(data.companies);
      }
    } catch (error) {
      console.error('Failed to fetch companies:', error);
    }
  };

  const handleAddAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowAddAgent(false);
        setFormData({ firstName: '', lastName: '', email: '', assignedCompanyIds: [] });
        fetchAgents();
      }
    } catch (error) {
      console.error('Failed to add agent:', error);
    }
  };

  const handleViewDetails = (agent: Agent) => {
    setSelectedAgent(agent);
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
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Agent Management</h1>
          <div className="flex justify-between items-center">
            <Input
              placeholder="Search agents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-80"
            />
            <Dialog open={showAddAgent} onOpenChange={setShowAddAgent}>
              <DialogTrigger asChild>
                <Button className="bg-[#068d1f] hover:bg-[#087055] text-white px-6 py-2 font-medium">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Agent
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-xl font-semibold">Add New Agent</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddAgent} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="assignedCompanies">Assigned Companies</Label>
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
                      <SelectTrigger>
                        <SelectValue placeholder="Select companies to assign" />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.map((company) => (
                          <SelectItem key={company.id} value={company.id}>
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
                  <div className="flex justify-end space-x-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setShowAddAgent(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-[#068d1f] hover:bg-[#087055] text-white">
                      Add Agent
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card className="shadow-sm border-0">
          <CardContent className="p-0">
            <div className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#087055] hover:bg-[#087055] border-0">
                    <TableHead className="text-white font-medium py-4 px-6 text-left border-0">Agent Name</TableHead>
                    <TableHead className="text-white font-medium py-4 px-6 text-left border-0">Email</TableHead>
                    <TableHead className="text-white font-medium py-4 px-6 text-center border-0">Assigned Companies</TableHead>
                    <TableHead className="text-white font-medium py-4 px-6 text-left border-0">Login Code</TableHead>
                    <TableHead className="text-white font-medium py-4 px-6 text-center border-0">Status</TableHead>
                    <TableHead className="text-white font-medium py-4 px-6 text-center border-0">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAgents.length > 0 ? (
                    filteredAgents.map((agent, index) => (
                      <>
                        <TableRow 
                          key={agent.id} 
                          className={`hover:bg-gray-50 border-0 ${
                            index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                          }`}
                        >
                          <TableCell className="py-4 px-6 border-0">
                            <div className="font-medium text-gray-900">
                              {agent.firstName} {agent.lastName}
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-600 py-4 px-6 border-0">
                            {agent.email}
                          </TableCell>
                          <TableCell className="text-center py-4 px-6 border-0">
                            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 font-semibold px-3 py-1">
                              {agent.assignedCompanyIds?.length || 0} companies
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-600 font-mono py-4 px-6 border-0 text-sm">
                            <code className="bg-gray-100 px-2 py-1 rounded">{agent.loginCode}</code>
                          </TableCell>
                          <TableCell className="text-center py-4 px-6 border-0">
                            <Badge className={`font-semibold px-3 py-1 ${
                              agent.isActive 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {agent.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center py-4 px-6 border-0">
                            <div className="flex space-x-2 justify-center">
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-white bg-[#068d1f] border-[#068d1f] hover:bg-[#087055] hover:text-white hover:border-[#087055] px-3 py-2 text-xs font-medium rounded"
                                onClick={() => setShowAssignedTo(showAssignedTo === agent.id ? null : agent.id)}
                              >
                                {showAssignedTo === agent.id ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                                {showAssignedTo === agent.id ? 'Hide' : 'View'}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-white bg-[#068d1f] border-[#068d1f] hover:bg-[#087055] hover:text-white hover:border-[#087055] px-3 py-2 text-xs font-medium rounded"
                                onClick={() => handleViewDetails(agent)}
                              >
                                Details
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        {showAssignedTo === agent.id && agent.assignedCompanies && agent.assignedCompanies.length > 0 && (
                          <TableRow className="border-0">
                            <TableCell colSpan={6} className="bg-blue-50 p-6 border-0">
                              <div className="space-y-3">
                                <h4 className="font-semibold text-gray-900 text-lg">
                                  Assigned Companies for {agent.firstName} {agent.lastName}
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {agent.assignedCompanies.map((company) => (
                                    <div key={company.id} className="bg-white p-4 rounded-lg border shadow-sm">
                                      <div className="text-sm font-medium text-gray-900">
                                        {company.companyName}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    ))
                  ) : (
                    <TableRow className="border-0">
                      <TableCell colSpan={6} className="text-center py-12 text-gray-500 border-0">
                        No agents found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {selectedAgent && (
          <Dialog open={!!selectedAgent} onOpenChange={() => setSelectedAgent(null)}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold text-gray-900">
                  Agent Details - {selectedAgent.firstName} {selectedAgent.lastName}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <Label className="text-sm font-medium text-gray-700 block mb-1">First Name</Label>
                    <div className="text-base text-gray-900">{selectedAgent.firstName}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <Label className="text-sm font-medium text-gray-700 block mb-1">Last Name</Label>
                    <div className="text-base text-gray-900">{selectedAgent.lastName}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <Label className="text-sm font-medium text-gray-700 block mb-1">Email</Label>
                    <div className="text-base text-gray-900">{selectedAgent.email}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <Label className="text-sm font-medium text-gray-700 block mb-1">Login Code</Label>
                    <div className="text-base text-gray-900 font-mono">
                      <code className="bg-white px-3 py-1 rounded border">{selectedAgent.loginCode}</code>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <Label className="text-sm font-medium text-gray-700 block mb-1">Status</Label>
                    <div className="text-sm mt-2">
                      <Badge className={`font-semibold px-3 py-1 ${
                        selectedAgent.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedAgent.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <Label className="text-sm font-medium text-gray-700 block mb-1">Created</Label>
                    <div className="text-base text-gray-900">
                      {new Date(selectedAgent.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {selectedAgent.assignedCompanies && selectedAgent.assignedCompanies.length > 0 && (
                  <div className="pt-6 border-t border-gray-200">
                    <Label className="text-lg font-semibold text-gray-900 block mb-4">
                      Assigned Companies ({selectedAgent.assignedCompanies.length})
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedAgent.assignedCompanies.map((company) => (
                        <div key={company.id} className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                          <div className="text-sm font-medium text-blue-900">{company.companyName}</div>
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