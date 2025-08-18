'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, Menu, X, Bell, ChevronDown } from 'lucide-react';
import logoImage from '@/assets/images/logo.png';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  companyId?: string;
  company?: {
    companyName: string;
  };
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  current: boolean;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  navigation: NavigationItem[];
  title: string;
}

const getInitials = (firstName: string, lastName: string) => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

export default function DashboardLayout({ children, navigation, title }: DashboardLayoutProps) {
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const userData = await response.json();
        setUser(userData.user);
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 flex z-40 lg:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          <SidebarContent navigation={navigation} imageError={imageError} setImageError={setImageError} />
        </div>
        <div className="flex-shrink-0 w-14" />
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64 bg-white border-r border-gray-200 h-screen fixed">
          <SidebarContent navigation={navigation} imageError={imageError} setImageError={setImageError} />
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 lg:pl-64">
        {/* Top header */}
        <div className="bg-white shadow-sm border-b border-gray-200 px-4 sm:px-6 lg:px-8 sticky top-0 z-30">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                type="button"
                className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 mr-2"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-6 w-6" />
              </button>
              <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            </div>

            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <div className="relative">
                <Button variant="ghost" size="sm" className="p-2">
                  <Bell className="h-5 w-5 text-gray-500" />
                </Button>
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  3
                </span>
              </div>

              {/* User dropdown */}
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 transition-colors"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-[#087055] text-white text-sm">
                      {user ? getInitials(user.firstName, user.lastName) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">
                        {user ? `${user.firstName} ${user.lastName}` : 'Loading...'}
                      </p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Dropdown overlay */}
        {dropdownOpen && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setDropdownOpen(false)}
          />
        )}

        {/* Main content area */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

function SidebarContent({ navigation, imageError, setImageError }: { 
  navigation: NavigationItem[];
  imageError: boolean;
  setImageError: (error: boolean) => void;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo section */}
      <div className="bg-[#f3f4f6] text-white px-4 py-8 border-b border-gray-300">
        <div className="flex justify-center">
          {!imageError ? (
            <img
              src={typeof logoImage === 'string' ? logoImage : logoImage.src}
              alt="Community Insurance Center"
              width={120}
              height={60}
              className="h-auto w-auto max-w-[120px]"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-[120px] h-[60px] bg-white rounded flex items-center justify-center">
              <span className="text-[#087055] text-xs font-bold">CIC</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 bg-gray-100 mt-4">
        {navigation.map((item) => (
          <a
            key={item.name}
            href={item.href}
            className={`${
              item.current
                ? 'bg-white text-gray-900 border-r-4 border-[#087055]'
                : 'text-gray-700 hover:bg-gray-200'
            } block px-6 py-3 text-sm font-medium transition-colors duration-200 border-b border-gray-300`}
          >
            {item.name}
          </a>
        ))}
      </nav>
    </div>
  );
}