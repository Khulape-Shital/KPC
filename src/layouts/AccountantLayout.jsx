import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FileText, CreditCard, Users,
  BarChart3, LogOut, Search, Bell, Settings, BadgeIndianRupee
} from 'lucide-react';

export const AccountantLayout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/login');
  };

  const navItems = [
    { path: '/accountant/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/accountant/invoices', label: 'Invoices', icon: <FileText size={20} /> },
    { path: '/accountant/payments', label: 'Payments', icon: <CreditCard size={20} /> },
    { path: '/accountant/billing', label: 'Client Billing', icon: <Users size={20} /> },
    { path: '/accountant/reports', label: 'Revenue Reports', icon: <BarChart3 size={20} /> },
  ];

  return (
    <div className="layout-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-container">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '32px', height: '32px', backgroundColor: 'var(--primary-blue)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '18px' }}>K</span>
              </div>
              <div>
                <h1 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-dark)', letterSpacing: '-0.5px' }}>KPC</h1>
                <div style={{ fontSize: '10px', color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '-2px' }}>Finance & Billing</div>
              </div>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
              style={{
                fontSize: "25px", // Increase font size
                fontWeight: 500
              }}
            >
              <item.icon size={52} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: 'auto' }}>
          <button className="nav-item" onClick={() => navigate('/accountant/integrations')} style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', color: 'var(--text-gray)' }}>
            <Settings size={20} />
            <span>ERP Settings</span>
          </button>
          <button className="nav-item" onClick={handleLogout} style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', color: '#ef4444', marginTop: '8px' }}>
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">

        {/* Header */}
        <header className="header">
          <div className="search-container">
            <Search size={18} color="var(--text-light)" />
            <input
              type="text"
              placeholder="Search Invoices, Payments, or Clients..."
              className="search-input"
            />
          </div>

          <div className="header-actions">
            <div className="notification-bell">
              <Bell size={20} />
              <span className="notification-badge">3</span>
            </div>

            <div className="user-profile">
              <div className="avatar">
                <BadgeIndianRupee size={20} color="var(--primary-blue)" />
              </div>
              <div className="user-info">
                <span className="user-name">Priya M.</span>
                <span className="user-role">Accountant</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content injected via Outlet */}
        <div style={{ height: 'calc(100vh - 70px)', overflowY: 'auto' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};
