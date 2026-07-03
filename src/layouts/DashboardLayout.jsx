import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';

export const DashboardLayout = ({ navigationItems, userName, roleName }) => {
  return (
    <div className="app-layout">
      <Sidebar navigationItems={navigationItems} role={roleName} />
      <div className="main-wrapper">
        <Header userName={userName} roleName={roleName} />
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
