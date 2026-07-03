import React, { useState, useEffect } from 'react';
import { Bell, Settings, Search } from 'lucide-react';
import { mockDb } from '../utils/mockDb';

export const Header = ({ userName, roleName }) => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchNotifs = () => {
      const notifs = mockDb.getNotifications();
      setUnreadCount(notifs.filter(n => !n.read).length);
    };
    
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="top-header">
      <div className="header-search">
        <Search size={18} className="search-icon" />
        <input type="text" placeholder="Search for employees, forms, or IDs..." />
      </div>
      
      <div className="header-actions">
        <button className="icon-button" style={{ position: 'relative' }}>
          <Bell size={20} />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '-2px',
              right: '-2px',
              background: '#ef4444',
              color: '#fff',
              fontSize: '10px',
              fontWeight: 'bold',
              height: '16px',
              minWidth: '16px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              border: '2px solid var(--bg-primary)'
            }}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
        <button className="icon-button">
          <Settings size={20} />
        </button>
        
        <div className="user-profile">
          <div className="user-info">
            <span className="user-name">{userName}</span>
            <span className="user-role">{roleName}</span>
          </div>
          <div className="avatar">
            {/* Initials fallback */}
            {userName.split(' ').map(n => n[0]).join('')}
          </div>
        </div>
      </div>
    </header>
  );
};
