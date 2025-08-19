'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { Home, User, Settings } from 'lucide-react';

export default function CustomerPage() {
  const navigation = [
    { name: 'Home', href: '/customer', icon: Home, current: true },
    { name: 'Profile', href: '/customer/profile', icon: User, current: false },
    { name: 'Settings', href: '/customer/settings', icon: Settings, current: false },
  ];

  return (
    <DashboardLayout navigation={navigation} title="Customer Dashboard">
      {/* No main content, just empty */}
      <></>
    </DashboardLayout>
  );
}
