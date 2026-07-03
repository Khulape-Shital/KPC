import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, Search, Check, CheckCircle2, AlertCircle, FileText,
  MessageSquare, Settings, Activity, Trash2, ArrowRight
} from 'lucide-react';
import { mockDb } from '../../utils/mockDb';
import { getSupabaseEmployees } from '../../utils/supabase';
const CATEGORIES = [
  { id: 'all', label: 'All Notifications' },
  { id: 'verification', label: 'Verification Updates' },
  { id: 'document', label: 'Document Alerts' },
  { id: 'executive', label: 'Executive Updates' },
  { id: 'system', label: 'System Notifications' }
];

export const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // all, unread, read
  const [activeCategory, setActiveCategory] = useState('all');

  const loadNotifications = async () => {
    const sessionStr = localStorage.getItem('kpc_session');
    let company = '';
    if (sessionStr) {
      try {
        company = JSON.parse(sessionStr).company || '';
      } catch (e) { }
    }

    const employees = await getSupabaseEmployees();
    const myEmployees = employees.filter(e => e.company === company && e.status !== 'draft');

    let generatedNotifications = [];
    const readIds = JSON.parse(localStorage.getItem('hr_read_notifs') || '[]');

    myEmployees.forEach(emp => {
      if (emp.timeline) {
        emp.timeline.forEach((t, i) => {
          // Skip creation and generic assignments to avoid noise
          if (t.event === 'Employee Created' || t.event === 'Submitted') return;

          let type = 'system';
          let title = t.event;

          const eventLower = t.event.toLowerCase();
          if (eventLower.includes('reject')) type = 'rejection';
          else if (eventLower.includes('complet') || eventLower.includes('approv')) type = 'completion';
          else if (eventLower.includes('assign')) type = 'assigned';
          else if (eventLower.includes('otp')) type = 'otp-received';
          else if (eventLower.includes('call')) type = 'call-pending';
          else if (t.details) type = 'executive';

          const id = `${emp.id}-event-${i}`;
          generatedNotifications.push({
            id,
            type,
            title: title,
            message: t.details || `Status updated by ${t.user}`,
            timestamp: t.date,
            read: readIds.includes(id),
            employeeId: emp.id,
            employeeName: emp.name
          });
        });
      }
    });

    // Sort descending by date
    generatedNotifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    setNotifications(generatedNotifications);
  };

  useEffect(() => {
    loadNotifications();

    // In a real app, this would use websockets or polling. For mock, we'll listen to a custom event or just poll every 5s
    const interval = setInterval(loadNotifications, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = (id) => {
    const readIds = JSON.parse(localStorage.getItem('hr_read_notifs') || '[]');
    if (!readIds.includes(id)) {
      readIds.push(id);
      localStorage.setItem('hr_read_notifs', JSON.stringify(readIds));
    }
    loadNotifications();
  };

  const handleMarkAllAsRead = () => {
    const readIds = notifications.map(n => n.id);
    localStorage.setItem('hr_read_notifs', JSON.stringify(readIds));
    loadNotifications();
  };

  const handleDismiss = (id) => {
    const dismissedIds = JSON.parse(localStorage.getItem('hr_dismissed_notifs') || '[]');
    if (!dismissedIds.includes(id)) {
      dismissedIds.push(id);
      localStorage.setItem('hr_dismissed_notifs', JSON.stringify(dismissedIds));
    }
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Map types to categories based on requirements
  const getCategoryFromType = (type) => {
    const verificationTypes = ['submitted', 'assigned', 'call-pending', 'otp-received', 'in-progress', 'approved', 'completion', 'draft'];
    const documentTypes = ['upload', 'rejection', 'missing'];
    const executiveTypes = ['remarks', 'notes'];

    if (verificationTypes.includes(type)) return 'verification';
    if (documentTypes.includes(type)) return 'document';
    if (executiveTypes.includes(type)) return 'executive';
    return 'system';
  };

  const filteredNotifications = useMemo(() => {
    const dismissedIds = JSON.parse(localStorage.getItem('hr_dismissed_notifs') || '[]');
    return notifications.filter(notif => {
      if (dismissedIds.includes(notif.id)) return false;

      // Tab filter
      if (activeTab === 'unread' && notif.read) return false;
      if (activeTab === 'read' && !notif.read) return false;

      // Category filter
      if (activeCategory !== 'all' && getCategoryFromType(notif.type) !== activeCategory) return false;

      // Search filter
      const searchLower = search.toLowerCase();
      if (search && !notif.title?.toLowerCase().includes(searchLower)
        && !notif.message?.toLowerCase().includes(searchLower)
        && !notif.employeeName?.toLowerCase().includes(searchLower)) {
        return false;
      }

      return true;
    });
  }, [notifications, search, activeTab, activeCategory]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="page-container" style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', height: '100vh', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Bell size={28} color="var(--primary-blue)" />
            Notifications Center
          </h1>
          <p style={{ color: 'var(--text-gray)', marginTop: '8px', fontSize: '15px' }}>
            You have <span style={{ fontWeight: 700, color: unreadCount > 0 ? '#ef4444' : 'var(--text-primary)' }}>{unreadCount} unread</span> notifications.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={handleMarkAllAsRead} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} disabled={unreadCount === 0}>
            <CheckCircle2 size={18} /> Mark All as Read
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px', flex: 1, overflow: 'hidden' }}>

        {/* Sidebar Filters */}
        <div style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Search */}
          <div className="card" style={{ padding: "16px" }}>
            <div
              style={{
                position: "relative",
                width: "100%"
              }}
            >
              <Search
                size={18}
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#94a3b8",
                  pointerEvents: "none"
                }}
              />

              <input
                type="text"
                placeholder="Search notifications..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: "100%",
                  height: "44px",
                  padding: "0 16px 0 42px",
                  border: "1px solid var(--border-color)",
                  borderRadius: "10px",
                  fontSize: "14px",
                  outline: "none",
                  background: "#fff",
                  color: "var(--text-dark)",
                  boxSizing: "border-box"
                }}
              />
            </div>
          </div>
          {/* Read Status Tabs */}
          <div className="card" style={{ padding: '8px' }}>
            {[
              { id: 'all', label: 'All Messages' },
              { id: 'unread', label: `Unread (${unreadCount})` },
              { id: 'read', label: 'Read' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  textAlign: 'left',
                  background: activeTab === tab.id ? 'var(--bg-secondary)' : 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  color: activeTab === tab.id ? 'var(--primary-blue)' : 'var(--text-gray)',
                  fontWeight: activeTab === tab.id ? 600 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}
              >
                {tab.label}
                {activeTab === tab.id && <ChevronRight size={16} />}
              </button>
            ))}
          </div>

          {/* Categories */}
          <div className="card" style={{ padding: '16px' }}>
            <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-light)', fontWeight: 700, letterSpacing: '1px', marginBottom: '12px', paddingLeft: '8px' }}>Categories</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  style={{
                    padding: '10px 12px',
                    textAlign: 'left',
                    background: activeCategory === cat.id ? 'var(--bg-secondary)' : 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    color: activeCategory === cat.id ? 'var(--primary-blue)' : 'var(--text-secondary)',
                    fontWeight: activeCategory === cat.id ? 600 : 500,
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.2s'
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Notifications Feed */}
        <div className="card" style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>
          {filteredNotifications.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-light)' }}>
              <Bell size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-secondary)' }}>No Notifications Found</h3>
              <p style={{ marginTop: '8px' }}>You're all caught up with your updates.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {filteredNotifications.map((notif, idx) => {
                const category = getCategoryFromType(notif.type);
                let Icon = Activity;
                let color = 'var(--primary-blue)';
                let bg = 'rgba(59, 130, 246, 0.1)';
                let priority = 'Normal';

                if (category === 'document') { Icon = FileText; color = '#f59e0b'; bg = '#fef3c7'; priority = 'High'; }
                if (notif.type === 'rejection') { Icon = AlertCircle; color = '#ef4444'; bg = '#fef2f2'; priority = 'Urgent'; }
                if (notif.type === 'completion') { Icon = CheckCircle2; color = '#10b981'; bg = '#d1fae5'; priority = 'Normal'; }
                if (category === 'executive') { Icon = MessageSquare; color = '#8b5cf6'; bg = '#ede9fe'; priority = 'Normal'; }
                if (category === 'system') { Icon = Settings; color = '#64748b'; bg = '#f1f5f9'; priority = 'Low'; }

                return (
                  <div
                    key={notif.id}
                    style={{
                      padding: '24px',
                      borderBottom: '1px solid var(--border-color)',
                      background: notif.read ? 'transparent' : 'var(--bg-secondary)',
                      display: 'flex',
                      gap: '20px',
                      transition: 'background 0.2s',
                      position: 'relative'
                    }}
                  >
                    {!notif.read && (
                      <div style={{ position: 'absolute', left: 0, top: '24px', bottom: '24px', width: '4px', background: 'var(--primary-blue)', borderRadius: '0 4px 4px 0' }} />
                    )}

                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: bg, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={24} />
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: notif.read ? 600 : 700, color: 'var(--text-primary)' }}>{notif.title}</h3>
                            {priority === 'Urgent' && <span style={{ fontSize: '10px', fontWeight: 700, background: '#ef4444', color: '#fff', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>Urgent</span>}
                            {priority === 'High' && <span style={{ fontSize: '10px', fontWeight: 700, background: '#f59e0b', color: '#fff', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>High Priority</span>}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '4px' }}>
                            {new Date(notif.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <p style={{ color: notif.read ? 'var(--text-secondary)' : 'var(--text-primary)', fontSize: '14px', lineHeight: 1.6, marginBottom: '16px' }}>
                        {notif.message}
                      </p>

                      {notif.employeeName && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', background: 'var(--bg-primary)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', width: 'fit-content' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{notif.employeeName}</span>
                          <span style={{ color: 'var(--text-light)' }}>|</span>
                          <span style={{ color: 'var(--text-gray)' }}>ID: {notif.employeeId}</span>
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        {notif.employeeId && (
                          <button onClick={() => navigate(`/hr/employees/${notif.employeeId}`)} className="btn-primary" style={{ padding: '6px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            Open Employee <ArrowRight size={14} />
                          </button>
                        )}
                        <button onClick={() => navigate(`/hr/tracking`)} className="btn-secondary" style={{ padding: '6px 16px', fontSize: '13px' }}>
                          View in Tracking
                        </button>

                        <div style={{ flex: 1 }} />

                        {!notif.read && (
                          <button onClick={() => handleMarkAsRead(notif.id)} style={{ padding: '6px', background: 'transparent', border: 'none', color: 'var(--primary-blue)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
                            <Check size={16} /> Mark as Read
                          </button>
                        )}
                        <button onClick={() => handleDismiss(notif.id)} style={{ padding: '6px', background: 'transparent', border: 'none', color: 'var(--text-light)', cursor: 'pointer' }} title="Dismiss">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

// Helper chevron icon since it's used inline
const ChevronRight = ({ size }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"></polyline>
  </svg>
);
