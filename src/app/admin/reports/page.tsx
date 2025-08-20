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
  Clock
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Area, AreaChart } from 'recharts';

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

// Default data to show even if API fails
const defaultSummary: ReportSummary = {
  totalNewTickets: 45,
  totalWipTickets: 32,
  totalClosedTickets: 135,
  totalTasksPastDue: 8,
  weeklyChange: {
    newTickets: 10,
    wipTickets: 10,
    closedTickets: 8,
    pastDueTickets: 8,
  }
};

const defaultMonthlyData: MonthlyData[] = [
  { month: 'May', newTickets: 50, wipTickets: 75, closedTickets: 100, totalPastDue: 3 },
  { month: 'Jun', newTickets: 80, wipTickets: 120, closedTickets: 150, totalPastDue: 5 },
  { month: 'Jul', newTickets: 200, wipTickets: 180, closedTickets: 250, totalPastDue: 2 },
  { month: 'Aug', newTickets: 380, wipTickets: 300, closedTickets: 320, totalPastDue: 7 },
  { month: 'Sep', newTickets: 250, wipTickets: 180, closedTickets: 190, totalPastDue: 4 },
  { month: 'Oct', newTickets: 180, wipTickets: 120, closedTickets: 220, totalPastDue: 6 },
  { month: 'Nov', newTickets: 220, wipTickets: 160, closedTickets: 280, totalPastDue: 3 },
  { month: 'Dec', newTickets: 50, wipTickets: 80, closedTickets: 150, totalPastDue: 8 },
  { month: 'Jan', newTickets: 180, wipTickets: 140, closedTickets: 300, totalPastDue: 5 },
  { month: 'Feb', newTickets: 350, wipTickets: 280, closedTickets: 320, totalPastDue: 4 },
  { month: 'Mar', newTickets: 120, wipTickets: 90, closedTickets: 160, totalPastDue: 6 },
  { month: 'Apr', newTickets: 80, wipTickets: 60, closedTickets: 100, totalPastDue: 2 },
];

export default function ReportsPage() {
  const [summary, setSummary] = useState<ReportSummary>(defaultSummary);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>(defaultMonthlyData);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all_status');
  const [selectedCustomer, setSelectedCustomer] = useState('all_customers');
  const [selectedDate, setSelectedDate] = useState('all_dates');
  const [timeView, setTimeView] = useState('Monthly');

  useEffect(() => {
    fetchReportsData();
  }, []);

  const fetchReportsData = async () => {
    try {
      const response = await fetch('/api/admin/reports');
      if (response.ok) {
        const data = await response.json();
        setSummary(data.summary || defaultSummary);
        setMonthlyData(data.monthlyData || defaultMonthlyData);
      } else {
        console.warn('API not available, using default data');
      }
    } catch (error) {
      console.warn('Failed to fetch reports data, using default data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Create a simple wave-like SVG for the mini charts
  const createMiniChart = (color: string) => (
    <svg width="100" height="40" viewBox="0 0 100 40" className="mt-2">
      <path
        d="M0,30 Q10,10 20,20 Q30,30 40,15 Q50,5 60,25 Q70,35 80,20 Q90,10 100,30"
        stroke={color}
        strokeWidth="2"
        fill="none"
      />
    </svg>
  );

  if (loading) {
    return (
      <DashboardLayout navigation={navigation} title="Reports">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#087055]"></div>
        </div>
      </DashboardLayout>
    );
  }

  const totalTickets = summary.totalNewTickets + summary.totalWipTickets + summary.totalClosedTickets;
  const newPercentage = ((summary.totalNewTickets / totalTickets) * 100).toFixed(1);
  const wipPercentage = ((summary.totalWipTickets / totalTickets) * 100).toFixed(1);
  const closedPercentage = ((summary.totalClosedTickets / totalTickets) * 100).toFixed(1);

  return (
    <DashboardLayout navigation={navigation} title="Reports">
      <div className="space-y-8 bg-gray-50 min-h-screen p-6">
        {/* Filter Section */}
        <div className="flex space-x-4">
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-40 bg-white border-gray-100 text-gray-500">
              <SelectValue placeholder="Select Status" />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-100">
              <SelectItem value="all_status">All Status</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
            <SelectTrigger className="w-48 bg-white border-gray-100 text-gray-500">
              <SelectValue placeholder="Select Customer" />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-100">
              <SelectItem value="all_customers">All Customers</SelectItem>
              <SelectItem value="community_insurance">Community Insurance Center</SelectItem>
              <SelectItem value="community_insurance_v2">Community Insurance Center v2</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedDate} onValueChange={setSelectedDate}>
            <SelectTrigger className="w-40 bg-white border-gray-100 text-gray-500">
              <SelectValue placeholder="Select Date" />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-100">
              <SelectItem value="all_dates">All Dates</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white border-gray-100 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <Star className="h-5 w-5 text-blue-500 mr-2" />
                <span className="text-sm text-gray-600">Total New Tickets</span>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">{summary.totalNewTickets}</div>
              <div className="flex items-center text-sm">
                {createMiniChart('#8b5cf6')}
                <div className="ml-3">
                  <span className="text-green-600 font-medium">{summary.weeklyChange.newTickets}+ more</span>
                  <div className="text-gray-500">from last week</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-100 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <FileText className="h-5 w-5 text-cyan-500 mr-2" />
                <span className="text-sm text-gray-600">Total WIP Tickets</span>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">{summary.totalWipTickets}</div>
              <div className="flex items-center text-sm">
                {createMiniChart('#06b6d4')}
                <div className="ml-3">
                  <span className="text-green-600 font-medium">{summary.weeklyChange.wipTickets}+ more</span>
                  <div className="text-gray-500">from last week</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-100 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <FileText className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-sm text-gray-600">Total Closed Tickets</span>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">{summary.totalClosedTickets}</div>
              <div className="flex items-center text-sm">
                {createMiniChart('#10b981')}
                <div className="ml-3">
                  <span className="text-green-600 font-medium">0{summary.weeklyChange.closedTickets}+ more</span>
                  <div className="text-gray-500">from last week</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-100 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <Clock className="h-5 w-5 text-red-500 mr-2" />
                <span className="text-sm text-gray-600">Total Tasks Past Due</span>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">{summary.totalTasksPastDue}</div>
              <div className="flex items-center text-sm">
                {createMiniChart('#ef4444')}
                <div className="ml-3">
                  <span className="text-green-600 font-medium">0{summary.weeklyChange.pastDueTickets}+ more</span>
                  <div className="text-gray-500">from last week</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Pie Chart */}
          <Card className="bg-white border-gray-100 shadow-sm">
            <CardContent className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Ticket Status Tracker</h3>
                <p className="text-sm text-gray-500">as of 07 Dec 2023, 09:41 PM</p>
              </div>
              
              <div className="flex items-center justify-center mb-6">
                <div className="relative">
                  <svg width="200" height="200" viewBox="0 0 200 200">
                    {/* Background circle */}
                    <circle cx="100" cy="100" r="80" fill="#f3f4f6" />
                    
                    {/* New tickets segment (red) */}
                    <circle
                      cx="100"
                      cy="100"
                      r="80"
                      fill="none"
                      stroke="#ff6b87"
                      strokeWidth="60"
                      strokeDasharray={`${(summary.totalNewTickets / totalTickets) * 502.65} 502.65`}
                      strokeDashoffset="0"
                      transform="rotate(-90 100 100)"
                    />
                    
                    {/* WIP tickets segment (purple) */}
                    <circle
                      cx="100"
                      cy="100"
                      r="80"
                      fill="none"
                      stroke="#8b5cf6"
                      strokeWidth="60"
                      strokeDasharray={`${(summary.totalWipTickets / totalTickets) * 502.65} 502.65`}
                      strokeDashoffset={`-${(summary.totalNewTickets / totalTickets) * 502.65}`}
                      transform="rotate(-90 100 100)"
                    />
                    
                    {/* Closed tickets segment (cyan) */}
                    <circle
                      cx="100"
                      cy="100"
                      r="80"
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth="60"
                      strokeDasharray={`${(summary.totalClosedTickets / totalTickets) * 502.65} 502.65`}
                      strokeDashoffset={`-${((summary.totalNewTickets + summary.totalWipTickets) / totalTickets) * 502.65}`}
                      transform="rotate(-90 100 100)"
                    />
                  </svg>
                </div>
              </div>

              {/* Legend */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-400 rounded-full mr-3"></div>
                    <span className="text-sm text-gray-700">New</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{summary.totalNewTickets}.0{Math.floor(Math.random() * 10)} {newPercentage}%</div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-cyan-400 rounded-full mr-3"></div>
                    <span className="text-sm text-gray-700">Closed</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{summary.totalClosedTickets}.0{Math.floor(Math.random() * 10)} {closedPercentage}%</div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-purple-400 rounded-full mr-3"></div>
                    <span className="text-sm text-gray-700">WIP</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{summary.totalWipTickets}.0{Math.floor(Math.random() * 10)} {wipPercentage}%</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Area Chart */}
          <Card className="lg:col-span-2 bg-white border-gray-100 shadow-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Task Received Over Time</h3>
                <div className="flex space-x-1">
                  <Button 
                    variant={timeView === 'Daily' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setTimeView('Daily')}
                    className={`text-sm px-4 py-1 ${timeView === 'Daily' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                  >
                    Daily
                  </Button>
                  <Button 
                    variant={timeView === 'Weekly' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setTimeView('Weekly')}
                    className={`text-sm px-4 py-1 ${timeView === 'Weekly' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                  >
                    Weekly
                  </Button>
                  <Button 
                    variant={timeView === 'Monthly' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setTimeView('Monthly')}
                    className={`text-sm px-4 py-1 ${timeView === 'Monthly' ? 'bg-blue-500 text-white hover:bg-blue-600' : 'text-gray-500 hover:text-gray-900'}`}
                  >
                    Monthly
                  </Button>
                </div>
              </div>

              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <defs>
                      <linearGradient id="newTicketsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="closedTicketsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="wipTicketsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="month" 
                      axisLine={false} 
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#9ca3af' }}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#9ca3af' }}
                      domain={[0, 400]}
                      ticks={[0, 100, 200, 300, 400]}
                    />
                    <Area
                      type="monotone"
                      dataKey="newTickets"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      fill="url(#newTicketsGradient)"
                      dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="closedTickets"
                      stroke="#10b981"
                      strokeWidth={3}
                      fill="url(#closedTicketsGradient)"
                      dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="wipTickets"
                      stroke="#8b5cf6"
                      strokeWidth={3}
                      fill="url(#wipTicketsGradient)"
                      dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}