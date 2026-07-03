//ClientHRLayout.jsx

import React from 'react';
import { DashboardLayout } from './DashboardLayout';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Bell,
  FileBarChart
} from 'lucide-react';
import { useLocation } from 'react-router-dom';

export const ClientHRLayout = () => {

  const location = useLocation();

  // const companyName =
  //   location.state?.companyName ||
  //   sessionStorage.getItem('companyName') ||
  //   'Client Company';

  // const companyName = sessionStorage.getItem('companyName') || 'Client Company';
  const session =
    JSON.parse(localStorage.getItem("kpc_session"));

  const companyName =
    session?.company || "Client Company";

  const navItems = [
    { label: 'Dashboard', path: '/hr/dashboard', icon: LayoutDashboard },
    { label: 'Employee List', path: '/hr/employees', icon: Users },
    { label: 'Verification Tracking', path: '/hr/tracking', icon: ShieldCheck },
    { label: 'Notifications', path: '/hr/notifications', icon: Bell }
  ];

  return (
    <DashboardLayout
      navigationItems={navItems}
      userName={session?.userName || "Client HR"}
      roleName={`${companyName} HR`}
    />
  );
};