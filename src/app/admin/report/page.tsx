'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Building2, 
  UserCheck, 
  BarChart3,
  Settings,
  Users,
  Home,
  Star,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';

interface ReportSummary {
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
}

interface MonthlyData {
  month: string;
  newTickets: number;
  wipTickets: number;
  closedTickets: number;
  totalPastDue: number;
}

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: Home, current: false },
  { name: 'All Customers', href: '/admin/customers', icon: Building2, current: false },
  { name: 'Customer Management', href: '/admin/customers/manage', icon: Users, current: false },
  { name: 'All Request', href: '/admin/customers/requests', icon: Building2, current: false },
  { name: 'Agent Management', href: '/admin/agents', icon: UserCheck, current: false },
  { name: 'Summary', href: '/admin/summary', icon: BarChart3, current: false },
  { name: 'Reports', href: '/admin/reports', icon: BarChart3, current: true },
  { name: 'Settings', href: '/admin/settings', icon: Settings, current: false },
];

export default function ReportsPage() {
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [timeView, setTimeView] = useState('Monthly');

  useEffect(() => {
    fetchReportsData();
  }, []);

  const fetchReportsData = async () => {
    try {
      const response = await fetch('/api/admin/reports');
      if (response.ok) {
        const data = await response.json();
        setSummary(data.summary);
        setMonthlyData(data.monthlyData);
      }
    } catch (error) {
      // Handle error silently
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout navigation={navigation} title="Reports">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#087055]"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navigation={navigation} title="Reports">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex space-x-4">
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
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
                <SelectItem value="">All Customers</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedDate} onValueChange={setSelectedDate}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Select Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Dates</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Total New Tickets</p>
                  <p className="text-3xl font-bold text-blue-900">{summary?.totalNewTickets || 45}</p>
                  <div className="flex items-center mt-2">
                    <Star className="h-4 w-4 text-blue-600 mr-1" />
                    <span className="text-sm text-blue-600 font-medium">
                      10+ more from last week
                    </span>
                  </div>
                </div>
                <div className="bg-blue-500 p-3 rounded-full">
                  <FileText className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-cyan-600">Total WIP Tickets</p>
                  <p className="text-3xl font-bold text-cyan-900">{summary?.totalWipTickets || 32}</p>
                  <div className="flex items-center mt-2">
                    <Star className="h-4 w-4 text-cyan-600 mr-1" />
                    <span className="text-sm text-cyan-600 font-medium">
                      10+ more from last week
                    </span>
                  </div>
                </div>
                <div className="bg-cyan-500 p-3 rounded-full">
                  <Clock className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Total Closed Tickets</p>
                  <p className="text-3xl font-bold text-green-900">{summary?.totalClosedTickets || 135}</p>
                  <div className="flex items-center mt-2">
                    <Star className="h-4 w-4 text-green-600 mr-1" />
                    <span className="text-sm text-green-600 font-medium">
                      08+ more from last week
                    </span>
                  </div>
                </div>
                <div className="bg-green-500 p-3 rounded-full">
                  <CheckCircle2 className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600">Total Tasks Past Due</p>
                  <p className="text-3xl font-bold text-red-900">{summary?.totalTasksPastDue || 8}</p>
                  <div className="flex items-center mt-2">
                    <Star className="h-4 w-4 text-red-600 mr-1" />
                    <span className="text-sm text-red-600 font-medium">
                      08+ more from last week
                    </span>
                  </div>
                </div>
                <div className="bg-red-500 p-3 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardContent className="p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Ticket Status Tracker</h3>
                <p className="text-sm text-gray-500">as of 07 Dec 2023, 09:41 PM</p>
              </div>
              
              <div className="relative">
                <svg viewBox="0 0 200 200" className="w-full h-48">
                  <circle
                    cx="100"
                    cy="100"
                    r="80"
                    fill="#ff6b6b"
                    stroke="none"
                  />
                  <circle
                    cx="100"
                    cy="100"
                    r="80"
                    fill="#4ecdc4"
                    stroke="none"
                    strokeDasharray="200 200"
                    strokeDashoffset="67"
                    transform="rotate(-90 100 100)"
                    style={{ transformOrigin: '100px 100px' }}
                  />
                  <circle
                    cx="100"
                    cy="100"
                    r="80"
                    fill="#6c5ce7"
                    stroke="none"
                    strokeDasharray="120 280"
                    strokeDashoffset="180"
                    transform="rotate(60 100 100)"
                    style={{ transformOrigin: '100px 100px' }}
                  />
                </svg>
                
                <div className="absolute inset-0 flex flex-col justify-end space-y-2 p-4">
                  <div className="flex items-center text-sm">
                    <div className="w-3 h-3 bg-red-400 rounded-full mr-2"></div>
                    <span className="text-gray-700">New</span>
                    <span className="ml-auto font-semibold">134.02 33.27%</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <div className="w-3 h-3 bg-teal-400 rounded-full mr-2"></div>
                    <span className="text-gray-700">Closed</span>
                    <span className="ml-auto font-semibold">210.87 54.80%</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <div className="w-3 h-3 bg-purple-400 rounded-full mr-2"></div>
                    <span className="text-gray-700">WIP</span>
                    <span className="ml-auto font-semibold">48.85 12.13%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Task Received Over Time</h3>
                <div className="flex space-x-2">
                  <Button 
                    variant={timeView === 'Daily' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTimeView('Daily')}
                    className={timeView === 'Daily' ? 'bg-[#087055] hover:bg-[#087055]' : ''}
                  >
                    Daily
                  </Button>
                  <Button 
                    variant={timeView === 'Weekly' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTimeView('Weekly')}
                    className={timeView === 'Weekly' ? 'bg-[#087055] hover:bg-[#087055]' : ''}
                  >
                    Weekly
                  </Button>
                  <Button 
                    variant={timeView === 'Monthly' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTimeView('Monthly')}
                    className={timeView === 'Monthly' ? 'bg-[#087055] hover:bg-[#087055] text-white' : ''}
                  >
                    Monthly
                  </Button>
                </div>
              </div>

              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData}>
                    <XAxis 
                      dataKey="month" 
                      axisLine={false} 
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#666' }}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#666' }}
                      domain={[0, 400]}
                      ticks={[0, 100, 200, 300, 400]}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="newTickets" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="closedTickets" 
                      stroke="#10b981" 
                      strokeWidth={3}
                      dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="wipTickets" 
                      stroke="#f59e0b" 
                      strokeWidth={3}
                      dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
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