//OperationsManagerLayout.jsx


import React from 'react';
import { DashboardLayout } from './DashboardLayout';
import { 
  LayoutDashboard, Building2, Users, FileText, 
  Activity, ShieldCheck, FileBarChart, Settings, LogOut, Briefcase
} from 'lucide-react';

export const OperationsManagerLayout = () => {
  const navItems = [
    { label: 'Dashboard', path: '/ops/dashboard', icon: LayoutDashboard },
    { label: 'Client Accounts', path: '/ops/clients', icon: Users },
    { label: 'Employee Forms', path: '/ops/forms', icon: FileText },
    { label: 'Monitoring', path: '/ops/monitoring', icon: Activity },
    { label: 'Verification Tracking', path: '/ops/tracking', icon: ShieldCheck },
  ];

  return (
    <DashboardLayout 
      navigationItems={navItems}
      userName="ops@kpc.com"
      roleName="Operation Manager"
    />
  );
};
