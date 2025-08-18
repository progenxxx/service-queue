'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
      <DashboardLayout navigation={navigation} title="Agent Management">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#087055]"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navigation={navigation} title="Agent Management">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Input
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
          </div>
          <Dialog open={showAddAgent} onOpenChange={setShowAddAgent}>
            <DialogTrigger asChild>
              <Button className="bg-[#087055] hover:bg-[#065946] text-white">
                Add Agent
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Agent</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddAgent} className="space-y-4">
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
                    <div className="mt-2 space-y-1">
                      {formData.assignedCompanyIds.map((companyId) => {
                        const company = companies.find(c => c.id === companyId);
                        return (
                          <div key={companyId} className="flex justify-between items-center bg-gray-100 p-2 rounded">
                            <span className="text-sm">{company?.companyName}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
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
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowAddAgent(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-[#087055] hover:bg-[#065946] text-white">
                    Add Agent
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#087055] hover:bg-[#087055]">
                  <TableHead className="text-white font-medium">First Name</TableHead>
                  <TableHead className="text-white font-medium">Last Name</TableHead>
                  <TableHead className="text-white font-medium">Email</TableHead>
                  <TableHead className="text-white font-medium">Assigned To</TableHead>
                  <TableHead className="text-white font-medium">Login Code</TableHead>
                  <TableHead className="text-white font-medium text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAgents.length > 0 ? (
                  filteredAgents.map((agent) => (
                    <>
                      <TableRow key={agent.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium text-gray-900">
                          {agent.firstName}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {agent.lastName}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {agent.email}
                        </TableCell>
                        <TableCell>
                          <Select value="">
                            <SelectTrigger className="w-40">
                              <SelectValue placeholder={`${agent.assignedCompanyIds?.length || 0} companies`} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="view" onClick={() => setShowAssignedTo(showAssignedTo === agent.id ? null : agent.id)}>
                                View Assignments
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-gray-600 font-mono">
                          {agent.loginCode}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex space-x-2 justify-center">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-[#087055] border-[#087055] hover:bg-[#087055] hover:text-white"
                              onClick={() => setShowAssignedTo(showAssignedTo === agent.id ? null : agent.id)}
                            >
                              {showAssignedTo === agent.id ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              {showAssignedTo === agent.id ? 'Hide' : 'View'}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-[#087055] border-[#087055] hover:bg-[#087055] hover:text-white"
                              onClick={() => handleViewDetails(agent)}
                            >
                              Details
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {showAssignedTo === agent.id && agent.assignedCompanies && agent.assignedCompanies.length > 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="bg-gray-50 p-4">
                            <div className="space-y-2">
                              <h4 className="font-medium text-gray-900">
                                Assigned Companies for {agent.firstName} {agent.lastName}
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {agent.assignedCompanies.map((company) => (
                                  <div key={company.id} className="bg-white p-3 rounded border">
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
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No agents found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {selectedAgent && (
          <Dialog open={!!selectedAgent} onOpenChange={() => setSelectedAgent(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Agent Details - {selectedAgent.firstName} {selectedAgent.lastName}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">First Name</Label>
                    <div className="text-sm text-gray-900">{selectedAgent.firstName}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Last Name</Label>
                    <div className="text-sm text-gray-900">{selectedAgent.lastName}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Email</Label>
                    <div className="text-sm text-gray-900">{selectedAgent.email}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Login Code</Label>
                    <div className="text-sm text-gray-900 font-mono">{selectedAgent.loginCode}</div>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Status</Label>
                  <div className="text-sm">
                    <span className={`inline-block px-2 py-1 rounded text-xs ${
                      selectedAgent.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedAgent.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Created</Label>
                  <div className="text-sm text-gray-900">
                    {new Date(selectedAgent.createdAt).toLocaleDateString()}
                  </div>
                </div>
                {selectedAgent.assignedCompanies && selectedAgent.assignedCompanies.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Assigned Companies ({selectedAgent.assignedCompanies.length})</Label>
                    <div className="mt-2 space-y-2">
                      {selectedAgent.assignedCompanies.map((company) => (
                        <div key={company.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <div>
                            <div className="text-sm font-medium">{company.companyName}</div>
                          </div>
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