import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Filter, KanbanSquare, Table as TableIcon, List, Clock,
  AlertCircle, CheckCircle, Clock3, MessageSquare, AlertTriangle, User,
  Calendar, FileText, ChevronRight, Activity
} from 'lucide-react';
import { getSupabaseEmployees } from '../../utils/supabase';
import PageHeader from '../../components/common/PageHeader';
const TRACKING_COLUMNS = [
  // { id: 'submitted', title: 'Submitted', color: '#6366f1' },
  { id: 'assigned', title: 'Assigned', color: '#8b5cf6' },
  // { id: 'call-pending', title: 'Call Pending', color: '#f59e0b' },
  // { id: 'otp-received', title: 'OTP Received', color: '#3b82f6' },
  { id: 'in-progress', title: 'Verification In Progress', color: '#0ea5e9' },
  // { id: 'approved', title: 'Approved', color: '#10b981' },
  { id: 'rejected', title: 'Rejected', color: '#ef4444' },
  { id: 'completed', title: 'Completed', color: '#22c55e' }
];

export const VerificationTracking = () => {
  const navigate = useNavigate();
  const [view, setView] = useState('kanban'); // kanban, table, timeline
  const [employees, setEmployees] = useState([]);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [execFilter, setExecFilter] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      const allEmps = await getSupabaseEmployees();
      const sessionStr = localStorage.getItem('kpc_session');
      let company = '';
      if (sessionStr) {
        try {
          const session = JSON.parse(sessionStr);
          company = session.company || '';
        } catch (e) { }
      }

      const filtered = allEmps.filter(e => e.status !== 'draft' && e.company === company);
      setEmployees(filtered);
    };
    fetchData();
  }, []);

  // Compute filtered employees
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchesSearch = emp.name.toLowerCase().includes(search.toLowerCase()) ||
        emp.id.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || emp.status === statusFilter;
      // In a real app, serviceType would be an array on employee. For mock, we might derive it or mock it.
      // Assuming we just bypass service matching for now or match against a mock field.
      const matchesService = serviceFilter === 'all' || (emp.services && emp.services.includes(serviceFilter));

      const assignedExec =
        emp.assigned_name || "Unassigned";
      const matchesExec = execFilter === 'all' || assignedExec.includes(execFilter);

      return matchesSearch && matchesStatus && matchesService && matchesExec;
    });
  }, [employees, search, statusFilter, serviceFilter, execFilter]);

  // Compute Metrics
  const metrics = useMemo(() => {
    const total = filteredEmployees.length;
    const submitted = filteredEmployees.filter(e => e.status === 'submitted').length;
    const inProgress = filteredEmployees.filter(e => ['assigned', 'call-pending', 'otp-received', 'in-progress'].includes(e.status)).length;
    const approved = filteredEmployees.filter(e => e.status === 'approved').length;
    const rejected = filteredEmployees.filter(e => e.status === 'rejected').length;
    const completed = filteredEmployees.filter(e => e.status === 'completed').length;

    return { total, submitted, inProgress, approved, rejected, completed };
  }, [filteredEmployees]);

  // Compute Timeline Events
  // const timelineEvents = useMemo(() => {
  //   let events = [];
  //   filteredEmployees.forEach(emp => {
  //     if (emp.timeline) {
  //       emp.timeline.forEach(t => {
  //         events.push({
  //           ...t,
  //           employeeId: emp.id,
  //           employeeName: emp.name,
  //           serviceType: emp.services ? emp.services[0] : 'Identity Verification'
  //         });
  //       });
  //     }
  //   });
  //   // Sort descending by date
  //   return events.sort((a, b) => new Date(b.date) - new Date(a.date));
  // }, [filteredEmployees]);
  const timelineEvents = [];

  // SLA Calculation Helper
  const getSLA = (emp) => {

    const submitDate = new Date(emp.createdDate);

    const now = new Date();

    const minutes =
      Math.floor(
        (now - submitDate) / (1000 * 60)
      );

    let status = "On Track";
    let remaining = "30 mins";

    if (minutes >= 30) {
      status = 'SLA Breached';
      remaining = '0 Days';
    } else if (minutes >= 20) {
      status = 'Near SLA Limit';
      remaining = `${30 - minutes} mins`;
    } else {
      remaining = `${30 - minutes} mins`;
    }

    if (['completed', 'approved', 'rejected'].includes(emp.status)) {
      status = 'Resolved';
      remaining = 'N/A';
    }

    return {
      minutes,
      status,
      remaining
    };
  };

  return (
    <div className="page-container" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', height: '100vh', overflow: 'hidden' }}>

      {/* Header & View Toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <PageHeader 
            title="Verification Tracking"
            subtitle="Real-time read-only monitoring workspace"
            icon={Activity}
          />
        </div>

        <div style={{ display: 'flex', background: 'var(--bg-secondary)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <button
            onClick={() => setView('kanban')}
            style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: view === 'kanban' ? '#fff' : 'transparent', color: view === 'kanban' ? 'var(--primary-blue)' : 'var(--text-gray)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: view === 'kanban' ? 600 : 500, cursor: 'pointer', boxShadow: view === 'kanban' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}
          >
            <KanbanSquare size={16} /> Kanban
          </button>
          {/* <button
            onClick={() => setView('table')}
            style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: view === 'table' ? '#fff' : 'transparent', color: view === 'table' ? 'var(--primary-blue)' : 'var(--text-gray)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: view === 'table' ? 600 : 500, cursor: 'pointer', boxShadow: view === 'table' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}
          >
            <TableIcon size={16} /> Table
          </button>
          <button
            onClick={() => setView('timeline')}
            style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: view === 'timeline' ? '#fff' : 'transparent', color: view === 'timeline' ? 'var(--primary-blue)' : 'var(--text-gray)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: view === 'timeline' ? 600 : 500, cursor: 'pointer', boxShadow: view === 'timeline' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}
          >
            <List size={16} /> Timeline
          </button> */}
        </div>
      </div>

      {/* Summary Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '16px' }}>
        {[
          { label: 'Total Cases', value: metrics.total, color: '#0f172a', bg: '#f1f5f9' },
          { label: 'Submitted', value: metrics.submitted, color: '#4f46e5', bg: '#e0e7ff' },
          { label: 'In Progress', value: metrics.inProgress, color: '#0ea5e9', bg: '#e0f2fe' },
          { label: 'Approved', value: metrics.approved, color: '#10b981', bg: '#d1fae5' },
          { label: 'Rejected', value: metrics.rejected, color: '#ef4444', bg: '#fee2e2' },
          { label: 'Completed', value: metrics.completed, color: '#22c55e', bg: '#dcfce7' }
        ].map((metric, idx) => (
          <div key={idx} className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 4px 15px -3px rgba(0,0,0,0.03)', transition: 'transform 0.2s', cursor: 'default' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{metric.label}</span>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <span style={{ fontSize: '32px', fontWeight: 800, color: metric.color, lineHeight: 1 }}>{metric.value}</span>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: metric.color }}></div>
            </div>
          </div>
        ))}
      </div>

      {/* Smart Filters */}
      <div className="card" style={{ padding: '24px', display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap', backgroundColor: '#ffffff', borderRadius: '20px', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.03), 0 0 3px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9' }}>
        <div style={{ flex: 1, minWidth: '280px', position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={20} style={{ position: 'absolute', left: '16px', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search by Employee Name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={e => e.currentTarget.parentElement.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.1)'} 
            onBlur={e => e.currentTarget.parentElement.style.boxShadow = 'none'}
            style={{ width: '100%', padding: '14px 16px 14px 48px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '15px', outline: 'none', transition: 'all 0.2s', backgroundColor: '#ffffff', color: '#0f172a' }}
          />
        </div>

        <div style={{ position: "relative", display: "flex", flexDirection: "column", backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "6px 16px", minWidth: "180px", transition: "all 0.2s" }} onFocusCapture={e => e.currentTarget.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.1)'} onBlurCapture={e => e.currentTarget.style.boxShadow = 'none'}>
          <label style={{ fontSize: "11px", color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "2px" }}>Status</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ border: "none", background: "transparent", outline: "none", fontSize: "14px", fontWeight: 600, color: "#0f172a", padding: "0", width: "100%", appearance: "none", cursor: "pointer" }}>
            <option value="all">All Statuses</option>
            {TRACKING_COLUMNS.map((col) => (
              <option key={col.id} value={col.id}>{col.title}</option>
            ))}
          </select>
          <span style={{ position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#94a3b8", fontSize: "10px" }}>▼</span>
        </div>

        <div style={{ position: "relative", display: "flex", flexDirection: "column", backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "6px 16px", minWidth: "180px", transition: "all 0.2s" }} onFocusCapture={e => e.currentTarget.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.1)'} onBlurCapture={e => e.currentTarget.style.boxShadow = 'none'}>
          <label style={{ fontSize: "11px", color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "2px" }}>Service</label>
          <select value={serviceFilter} onChange={(e) => setServiceFilter(e.target.value)} style={{ border: "none", background: "transparent", outline: "none", fontSize: "14px", fontWeight: 600, color: "#0f172a", padding: "0", width: "100%", appearance: "none", cursor: "pointer" }}>
            <option value="all">All Services</option>
            <option value="Identity Verification">Identity Verification</option>
            <option value="Address Verification">Address Verification</option>
            <option value="Police Verification">Police Verification</option>
          </select>
          <span style={{ position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#94a3b8", fontSize: "10px" }}>▼</span>
        </div>

        {/* <select value={execFilter} onChange={e => setExecFilter(e.target.value)} style={{ width: '180px', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '14px', backgroundColor: '#fff', outline: 'none', cursor: 'pointer' }}>
          <option value="all">All Executives</option>
          <option value="Amitabh S.">Amitabh S.</option>
          <option value="Sanjay V.">Sanjay V.</option>
          <option value="Unassigned">Unassigned</option>
        </select> */}
      </div>

      {/* Views Container */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

        {/* KANBAN VIEW */}
        {view === 'kanban' && (
          <div style={{ flex: 1, display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '16px' }}>
            {TRACKING_COLUMNS.map(column => {
              // const columnEmps = filteredEmployees.filter(e => e.status === column.id);

              const columnEmps = filteredEmployees.filter(e => {

                if (column.id === "assigned")
                  return e.status === "assigned";

                if (column.id === "in-progress")
                  return [
                    "in-progress",
                    "call-received",
                    "otp-shared",
                    "cfc-verification",
                    "final-client-invoice",
                    "report-submission"
                  ].includes(e.status);

                if (column.id === "completed")
                  return e.status === "completed";

                if (column.id === "rejected")
                  return e.status === "rejected";

                return false;
              });

              return (
                <div key={column.id} style={{ minWidth: '320px', width: '320px', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                  <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: column.color }} />
                      <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>{column.title}</h3>
                    </div>
                    <span style={{ backgroundColor: '#e2e8f0', color: '#475569', fontSize: '12px', fontWeight: 600, padding: '4px 10px', borderRadius: '20px' }}>
                      {columnEmps.length}
                    </span>
                  </div>

                  <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px' }}>
                    {columnEmps.map(emp => {
                      const sla = getSLA(emp);
                      // const assignedExec = emp.timeline?.find(t => t.event === 'Executive Assigned')?.details || 'Unassigned';
                      const assignedExec =
                        emp.assigned_name || "Unassigned";
                      const hasRejectedDoc = emp.documents?.some(d => d.status === 'Rejected');
                      const service = emp.services ? emp.services[0] : 'Identity Verification';
                      const isCompleted = emp.status === 'completed';

                      // Status Alerts
                      // const recentlyUpdated = (new Date() - new Date(emp.timeline?.[emp.timeline.length - 1]?.date || emp.createdDate)) < 86400000;
                      const recentlyUpdated =
                        (new Date() - new Date(emp.createdDate))
                        < 86400000;
                      const isRecentlyApproved = emp.status === 'approved' && recentlyUpdated;
                      const isRecentlyRejected = emp.status === 'rejected' && recentlyUpdated;

                      return (
                        <div
                          key={emp.id}
                          className="card"
                          style={{ padding: '16px', borderRadius: '16px', cursor: 'pointer', border: `1px solid #f1f5f9`, borderLeft: `4px solid ${column.color}`, backgroundColor: '#ffffff', transition: 'all 0.2s ease', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column' }}
                          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.05)'; }} 
                          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)'; }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                            <div style={{ cursor: 'pointer' }} onClick={() => navigate(`/hr/employees/${emp.id}`)}>
                              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', ':hover': { color: 'var(--primary-blue)' } }}>{emp.name}</div>
                              <div style={{ fontSize: '12px', color: 'var(--text-gray)', marginTop: '2px' }}>{emp.id}</div>
                            </div>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              {hasRejectedDoc && <span title="Re-upload Required" style={{ background: '#fef2f2', color: '#ef4444', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 600 }}>Re-upload Required</span>}
                              {!hasRejectedDoc && isRecentlyApproved && <span style={{ background: '#f0fdf4', color: '#10b981', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 600 }}>Recently Approved</span>}
                              {!hasRejectedDoc && isRecentlyRejected && <span style={{ background: '#fef2f2', color: '#ef4444', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 600 }}>Recently Rejected</span>}
                              {!hasRejectedDoc && !isRecentlyApproved && !isRecentlyRejected && recentlyUpdated && <span style={{ background: '#eff6ff', color: '#3b82f6', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 600 }}>New Update</span>}
                            </div>
                          </div>

                          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FileText size={12} /> {service}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#475569', marginBottom: '12px', background: 'var(--bg-secondary)', padding: '6px 8px', borderRadius: '6px' }}>
                            <User size={14} /> {assignedExec}
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: sla.status === 'SLA Breached' ? '#ef4444' : sla.status === 'Near SLA Limit' ? '#f59e0b' : '#10b981', fontWeight: 600 }}>
                              <Clock3 size={12} />
                              {sla.status !== 'Resolved' ? `${sla.status} (${sla.remaining})` : 'Resolved'}
                            </div>
                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                              {/* Updated {new Date(emp.timeline?.[emp.timeline.length - 1]?.date || emp.createdDate).toLocaleDateString()} */}
                              Updated
                              {
                                new Date(emp.createdDate)
                                  .toLocaleDateString()
                              }
                            </div>
                          </div>

                          {/* Card Actions */}
                          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                            <button onClick={() => navigate(`/hr/employees/${emp.id}`)} className="btn-secondary" style={{ flex: 1, padding: '6px', fontSize: '11px' }}>
                              View Details
                            </button>
                            {isCompleted && (
                              <button onClick={() => { window.print(); }} className="btn-primary" style={{ flex: 1, padding: '6px', fontSize: '11px', background: '#22c55e', borderColor: '#22c55e' }}>
                                Download Report
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {columnEmps.length === 0 && (
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '14px', border: '2px dashed #e2e8f0', borderRadius: '12px', backgroundColor: '#f8fafc', minHeight: '120px' }}>
                        No cases
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TABLE VIEW */}
        {/* {view === 'table' && (
          <div className="card" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ overflow: 'auto', flex: 1 }}>
              <table className="data-table" style={{ width: '100%', minWidth: '900px' }}>
                <thead>
                  <tr>
                    <th>Employee Info</th>
                    <th>Service Type</th>
                    <th>Current Status</th>
                    <th>Assigned Exec</th>
                    <th>Submission Date</th>
                    <th>Last Activity</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map(emp => {
                    // const assignedExec = emp.timeline?.find(t => t.event === 'Executive Assigned')?.details || 'Unassigned';
                    const assignedExec =
                      emp.assigned_name || "Unassigned";
                    // const lastTimeline = emp.timeline?.[emp.timeline.length - 1];
                    const lastTimeline = {
                      event: "Updated",
                      date: emp.createdDate
                    };
                    const service = emp.services ? emp.services[0] : 'Identity Verification';
                    const sla = getSLA(emp);
                    const col = TRACKING_COLUMNS.find(c => c.id === emp.status);

                    return (
                      <tr key={emp.id} className="table-row-hover" style={{ cursor: 'pointer' }} onClick={() => navigate(`/hr/employees/${emp.id}`)}>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{emp.name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-gray)', marginTop: '2px' }}>{emp.id}</div>
                        </td>
                        <td>
                          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{service}</span>
                        </td>
                        <td>
                          <span className="badge" style={{ background: `${col?.color}15`, color: col?.color, border: `1px solid ${col?.color}30` }}>
                            {col?.title || emp.status}
                          </span>
                          {sla.status !== 'Resolved' && (
                            <div style={{ fontSize: '11px', marginTop: '4px', color: sla.status === 'SLA Breached' ? '#ef4444' : sla.status === 'Near SLA Limit' ? '#f59e0b' : 'var(--text-gray)' }}>
                              SLA: {sla.status} ({sla.remaining})
                            </div>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                            <User size={14} color="var(--text-light)" /> {assignedExec}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                            {new Date(emp.createdDate)
                              .toLocaleDateString()}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{lastTimeline?.event || 'Created'}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: '2px' }}>
                            {new Date(lastTimeline?.date || emp.createdDate).toLocaleString()}
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '13px' }}>
                            View <ChevronRight size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredEmployees.length === 0 && (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-light)' }}>
                        No records found matching filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )} */}

        {/* TIMELINE VIEW */}
        {/* {false && (
          <div className="card" style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
              {timelineEvents.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-light)', padding: '48px' }}>No activity history found.</div>
              ) : (
                <div style={{ position: 'relative', borderLeft: '2px solid var(--border-color)', marginLeft: '16px' }}>
                  {timelineEvents.map((tEvent, idx) => {
                    const isRejection = tEvent.event.toLowerCase().includes('reject');
                    const isCompletion = tEvent.event.toLowerCase().includes('complet');
                    const isCreation = tEvent.event.toLowerCase().includes('creat');

                    let Icon = Activity;
                    let color = 'var(--primary-blue)';
                    let bg = 'rgba(59, 130, 246, 0.1)';

                    if (isRejection) { Icon = AlertTriangle; color = '#ef4444'; bg = '#fef2f2'; }
                    else if (isCompletion) { Icon = CheckCircle; color = '#22c55e'; bg = '#f0fdf4'; }
                    else if (isCreation) { Icon = User; color = '#8b5cf6'; bg = '#f5f3ff'; }

                    return (
                      <div key={idx} style={{ position: 'relative', paddingLeft: '32px', paddingBottom: idx === timelineEvents.length - 1 ? '0' : '32px' }}>
                        <div style={{ position: 'absolute', left: '-17px', top: '0', width: '32px', height: '32px', borderRadius: '50%', backgroundColor: bg, border: `2px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: color }}>
                          <Icon size={16} />
                        </div>

                        <div
                          className="card"
                          onClick={() => navigate(`/hr/employees/${tEvent.employeeId}`)}
                          style={{ padding: '16px', cursor: 'pointer', transition: 'transform 0.2s', ':hover': { transform: 'translateX(4px)' } }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '15px' }}>
                              {tEvent.event} <span style={{ fontWeight: 400, color: 'var(--text-gray)' }}>for</span> {tEvent.employeeName}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Clock size={12} /> {new Date(tEvent.date).toLocaleString()}
                            </div>
                          </div>

                          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                            Actor: <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{tEvent.user}</span>
                          </div>

                          {tEvent.details && (
                            <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px', fontSize: '13px', color: 'var(--text-primary)', borderLeft: `3px solid ${color}` }}>
                              {tEvent.details}
                            </div>
                          )}

                          <div style={{ display: 'flex', gap: '12px', marginTop: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', gap: '12px' }}>
                              <span style={{ fontSize: '11px', background: 'var(--bg-primary)', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-color)', color: 'var(--text-gray)' }}>
                                ID: {tEvent.employeeId}
                              </span>
                              <span style={{ fontSize: '11px', background: 'var(--bg-primary)', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-color)', color: 'var(--text-gray)' }}>
                                Service: {tEvent.serviceType}
                              </span>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); navigate(`/hr/employees/${tEvent.employeeId}`); }} className="btn-secondary" style={{ padding: '4px 12px', fontSize: '11px' }}>
                              View Employee Details <ChevronRight size={12} />
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
        )} */}
      </div>

    </div>
  );
};
