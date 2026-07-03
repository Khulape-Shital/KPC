import React from 'react';
import { DashboardLayout } from './DashboardLayout';
import { 
  LayoutDashboard, Inbox, List, PhoneCall, 
  Clock, CheckSquare
} from 'lucide-react';

export const ExecutiveLayout = () => {
  const navItems = [
    { label: 'Dashboard', path: '/exec/dashboard', icon: LayoutDashboard },
    { label: 'My Tasks', path: '/exec/tasks/mine', icon: List },
    { label: 'Call Logs', path: '/exec/calls', icon: PhoneCall },
    // { label: 'Verification Timeline', path: '/exec/timeline', icon: Clock },
    { label: 'Completed Cases', path: '/exec/completed', icon: CheckSquare },
  ];

  const session = JSON.parse(localStorage.getItem('kpc_session')) || {};
  const execName = session.userName || 'Executive';

  return (
    <DashboardLayout 
      navigationItems={navItems}
      userName={execName}
      roleName="Verification Executive"
    />
  );
};