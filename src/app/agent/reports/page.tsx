'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, 
  UserCheck, 
  BarChart3,
  Settings,
  Users,
  TrendingUp,
  FileText,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface ReportData {
  summary: {
    totalNewTickets: number;
    totalWipTickets: number;
    totalClosedTickets: number;
    totalTasksPastDue: number;
    weeklyChange: {
      newTickets: number;
      wipTickets: number;
      closedTickets: number;
      pastDueTickets: number;
    };
  };
  monthlyData: Array<{
    month: string;
    newTickets: number;
    wipTickets: number;
    closedTickets: number;
    totalPastDue: number;
  }>;
}

const navigation = [
  { name: 'All Customers', href: '/admin/customers', icon: Building2, current: false },
  { name: 'Customer Management', href: '/admin/customers/manage', icon: Users, current: false },
  { name: 'Agent Management', href: '/admin/agents', icon: UserCheck, current: false },
  { name: 'Summary', href: '/admin/summary', icon: Building2, current: false },
  { name: 'Reports', href: '/admin/reports', icon: BarChart3, current: true },
  { name: 'Settings', href: '/admin/settings', icon: Settings, current: false },
];

const COLORS = {
  new: '#ef4444',
  wip: '#3b82f6',
  closed: '#10b981'
};

const fetchReportData = async (filters: {
  status: string;
  customerId: string;
  dateRange: string;
}): Promise<ReportData> => {
  const params = new URLSearchParams();
  if (filters.status !== 'all') params.append('status', filters.status);
  if (filters.customerId !== 'all') params.append('customerId', filters.customerId);
  if (filters.dateRange !== 'all') params.append('dateRange', filters.dateRange);
  
  const response = await fetch(`/api/admin/report?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch report data');
  }
  return response.json();
};

const fetchCustomers = async () => {
  const response = await fetch('/api/admin/customers');
  if (!response.ok) {
    throw new Error('Failed to fetch customers');
  }
  const data = await response.json();
  return data.customers;
};

export default function ReportsPage() {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('monthly');

  const {
    data: reportData,
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ['reports', selectedStatus, selectedCustomer, selectedDate],
    queryFn: () => fetchReportData({
      status: selectedStatus,
      customerId: selectedCustomer,
      dateRange: selectedDate,
    }),
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: fetchCustomers,
  });

  if (loading) {
    return (
      <DashboardLayout navigation={navigation} title="">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#087055]"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout navigation={navigation} title="">
        <div className="text-center py-12">
          <p className="text-gray-500">Failed to load report data</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!reportData) {
    return (
      <DashboardLayout navigation={navigation} title="">
        <div className="text-center py-12">
          <p className="text-gray-500">No report data available</p>
        </div>
      </DashboardLayout>
    );
  }

  const pieChartData = [
    { name: 'New', value: reportData.summary.totalNewTickets, color: COLORS.new },
    { name: 'WIP', value: reportData.summary.totalWipTickets, color: COLORS.wip },
    { name: 'Closed', value: reportData.summary.totalClosedTickets, color: COLORS.closed }
  ];

  const lineChartData = reportData.monthlyData.map(item => ({
    month: item.month,
    'New Tickets': item.newTickets,
    'WIP Tickets': item.wipTickets,
    'Closed Tickets': item.closedTickets
  }));

  const formatChangeIndicator = (value: number) => {
    const isPositive = value >= 0;
    const prefix = isPositive ? '+' : '';
    const color = isPositive ? 'text-green-600' : 'text-red-600';
    return (
      <span className={`text-sm ${color} font-medium`}>
        {prefix}{value}% more from last week
      </span>
    );
  };

  return (
    <DashboardLayout navigation={navigation} title="">
      <div className="space-y-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
        </div>

        <div className="flex items-center space-x-4 mb-6">
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select Customer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Customers</SelectItem>
              {customers.map((customer: any) => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.companyName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedDate} onValueChange={setSelectedDate}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select Date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-sm border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <span className="text-sm text-gray-600">Total New Tickets</span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-bold text-gray-900">{reportData.summary.totalNewTickets}</p>
                {formatChangeIndicator(reportData.summary.weeklyChange.newTickets)}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Clock className="h-5 w-5 text-orange-600" />
                  </div>
                  <span className="text-sm text-gray-600">Total WIP Tickets</span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-bold text-gray-900">{reportData.summary.totalWipTickets}</p>
                {formatChangeIndicator(reportData.summary.weeklyChange.wipTickets)}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>
                  <span className="text-sm text-gray-600">Total Closed Tickets</span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-bold text-gray-900">{reportData.summary.totalClosedTickets}</p>
                {formatChangeIndicator(reportData.summary.weeklyChange.closedTickets)}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-red-600" />
                  </div>
                  <span className="text-sm text-gray-600">Total Tasks Past Due</span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-bold text-gray-900">{reportData.summary.totalTasksPastDue}</p>
                {formatChangeIndicator(reportData.summary.weeklyChange.pastDueTickets)}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-sm border-0">
            <CardContent className="p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Ticket Status Tracker</h3>
                <p className="text-sm text-gray-500">as of 17 Dec 2023, 09:41 PM</p>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">New</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">{reportData.summary.totalNewTickets}</p>
                  <p className="text-xs text-gray-500">21.7%</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">WIP</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">{reportData.summary.totalWipTickets}</p>
                  <p className="text-xs text-gray-500">12.13%</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Closed</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">{reportData.summary.totalClosedTickets}</p>
                  <p className="text-xs text-gray-500">66.86%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-0">
            <CardContent className="p-6">
              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Task Received Over Time</h3>
                  <Tabs value={timeRange} onValueChange={setTimeRange}>
                    <TabsList className="grid w-full max-w-xs grid-cols-3">
                      <TabsTrigger value="daily">Daily</TabsTrigger>
                      <TabsTrigger value="weekly">Weekly</TabsTrigger>
                      <TabsTrigger value="monthly">Monthly</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="month" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="New Tickets" 
                      stroke="#ef4444" 
                      strokeWidth={3}
                      dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="WIP Tickets" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="Closed Tickets" 
                      stroke="#10b981" 
                      strokeWidth={3}
                      dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}