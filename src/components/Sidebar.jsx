import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Building2, Users, FileText,
  Activity, ShieldCheck, FileBarChart, Settings, LogOut,
  Briefcase
} from 'lucide-react';

export const Sidebar = ({ role, navigationItems }) => {
  const navigate = useNavigate();

  const handleSignOut = () => {
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-container">
          {/* We will replace this with the generated logo */}
          <ShieldCheck size={24} className="logo-icon" color="var(--primary-blue)" />
          <span className="logo-text">KPC Consultancy</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navigationItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={index}
              to={item.path}
              className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button className="nav-item sign-out" onClick={handleSignOut}>
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
