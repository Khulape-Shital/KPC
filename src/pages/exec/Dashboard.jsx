import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase, PhoneCall, KeyRound, CheckCircle2,
  AlertTriangle, Clock, ChevronRight, Activity,
  PhoneForwarded, PlaySquare, Inbox, Upload, FileText,
  Eye, UserPlus, ShieldCheck, X
} from 'lucide-react';
import { mockDb } from '../../utils/mockDb';
import { getSupabaseEmployees, getSupabaseEmployeeById, updateSupabaseEmployee } from '../../utils/supabase';
import PageHeader from '../../components/common/PageHeader';
export const Dashboard = () => {
  const navigate = useNavigate();
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [allTimelineEvents, setAllTimelineEvents] = useState([]);

  // Logged-in executive session info
  const session = JSON.parse(localStorage.getItem("kpc_session")) || {};
  const EXEC_NAME = session.userName || 'Amitabh S.';
  const EXEC_ID = session.userId;
  const [availableCases, setAvailableCases] = useState([]);
  const [allCases, setAllCases] = useState([]);

  const [previewTask, setPreviewTask] = useState(null);
  const [assignConfirmTask, setAssignConfirmTask] = useState(null);

  const loadDashboard = async () => {
    const allEmployees = await getSupabaseEmployees();
    console.log("ALL EMPLOYEES FROM SUPABASE", allEmployees);

    // Available tasks
    const available = allEmployees.filter(emp =>
      (emp.status === "pending" || emp.status === "submitted") &&
      !emp.assigned_to
    );

    setAvailableCases(available);
    setAllCases(allEmployees);

    const assigned = allEmployees.filter(emp => {
      const isMine = emp.assigned_to === EXEC_ID;
      const isActive = !["completed", "approved", "rejected"].includes((emp.status || "").toLowerCase());
      return isMine && isActive;
    });
    setAssignedTasks(assigned);

    // Fetch all timeline and audit events for all assigned projects
    let events = [];

    allEmployees.forEach(emp => {
      const isMyProject = emp.assigned_to === EXEC_ID;
      
      if (isMyProject) {
        // Timeline events
        if (emp.timeline) {
          emp.timeline.forEach(t => {
            events.push({
              event: t.event,
              date: t.date,
              empId: emp.id,
              empName: emp.name,
              empCompany: emp.company || 'Unknown Company',
              type: 'timeline'
            });
          });
        }
        
        // Audit events (actions explicitly taken)
        if (emp.audit) {
          emp.audit.forEach(a => {
            events.push({
              event: a.action,
              date: a.date,
              empId: emp.id,
              empName: emp.name,
              empCompany: emp.company || 'Unknown Company',
              type: 'audit'
            });
          });
        }
      } else {
        // Also include events explicitly taken by this executive on projects they might not own anymore
        if (emp.timeline) {
          emp.timeline.forEach(t => {
            if (t.user === EXEC_NAME || (t.details && t.details.includes(EXEC_NAME))) {
              events.push({
                event: t.event,
                date: t.date,
                empId: emp.id,
                empName: emp.name,
                empCompany: emp.company || 'Unknown Company',
                type: 'timeline'
              });
            }
          });
        }
        if (emp.audit) {
          emp.audit.forEach(a => {
            if (a.user === EXEC_NAME) {
              events.push({
                event: a.action,
                date: a.date,
                empId: emp.id,
                empName: emp.name,
                empCompany: emp.company || 'Unknown Company',
                type: 'audit'
              });
            }
          });
        }
      }
    });

    // Remove duplicates that happen at the exact same time on the same case (e.g. audit and timeline logged simultaneously)
    const uniqueEvents = events.filter((evt, idx, self) => 
      idx === self.findIndex((e) => new Date(e.date).getTime() === new Date(evt.date).getTime() && e.empId === evt.empId)
    );

    uniqueEvents.sort((a, b) => new Date(b.date) - new Date(a.date));
    setAllTimelineEvents(uniqueEvents.slice(0, 15));
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleAssignTask = async (task) => {
    const currentTimeline = task.timeline || [];
    currentTimeline.push({
      event: 'Executive Assigned',
      user: 'System',
      date: new Date().toISOString(),
      details: EXEC_NAME
    });

    const currentAudit = task.audit || [];
    currentAudit.push({
      user: EXEC_NAME,
      action: `Self-assigned task`,
      date: new Date().toISOString()
    });

    await updateSupabaseEmployee(task.id, {
      status: "assigned",
      assigned_to: session.userId,
      assigned_name: EXEC_NAME,
      assigned_at: new Date().toISOString(),
      timeline: currentTimeline,
      audit: currentAudit
    });

    setAssignConfirmTask(null);
    setPreviewTask(null);
    loadDashboard();
  };

  // Metrics calculation
  const totalAvailable = availableCases.length;
  const inProgress =
    assignedTasks.filter(e => e.status === "in-progress" || e.status === "assigned" || e.status === "call-pending" || e.status === "otp-received").length;

  const callsPending =
    assignedTasks.filter(
      e =>
        e.status === "call-pending" ||
        e.status === "assigned"
    ).length;

  const otpPending =
    assignedTasks.filter(
      e => e.status === "otp-received"
    ).length;

  // Completed today
  const today = new Date().toISOString().split('T')[0];
  const completedToday = allCases.filter(e => {
    // Match CompletedCases logic (which currently shows all completed cases)
    if (e.status !== 'completed' && e.status !== 'approved' && e.status !== 'rejected') return false;
    
    const completionDate = e.completed_at || e.createdDate || new Date().toISOString();
    return completionDate.startsWith(today);
  }).length;

  const slaRiskCases = assignedTasks.filter(e =>
    e.status !== 'completed' && e.status !== 'approved' && e.status !== 'rejected' &&
    (e.slaStatus === '7+ Days' || e.slaStatus === '4-7 Days' || e.priority === 'Urgent' || e.priority === 'High')
  );

  const getStatusBadge = (status) => {
    switch (status) {
      case 'submitted': return 'badge-submitted';
      case 'assigned': return 'badge-assigned';
      case 'call-pending': return 'badge-call-pending';
      case 'otp-received': return 'badge-otp-received';
      case 'in-progress': return 'badge-in-progress';
      case 'approved': return 'badge-approved';
      case 'rejected': return 'badge-rejected';
      case 'completed': return 'badge-completed';
      case 'escalated': return 'badge-rejected';
      default: return 'badge-assigned';
    }
  };

  const getSlaRiskColor = (status, priority) => {
    if (status === '7+ Days' || priority === 'Urgent') return '#ef4444'; // Red
    if (status === '4-7 Days' || priority === 'High') return '#f59e0b'; // Amber
    return '#10b981'; // Green
  };

  const formatEventMessage = (evt) => {
    const action = (evt.event || '').toLowerCase();
    const emp = evt.empName;
    const company = evt.empCompany || 'Unknown Company';

    if (action.includes('assign')) return `Assigned to verification of ${emp} from ${company}`;
    if (action.includes('complete')) return `Verification of ${emp} from ${company} is completed`;
    if (action.includes('reject')) return `Verification of ${emp} from ${company} was rejected`;
    if (action.includes('call')) return `Logged a call for ${emp} from ${company}`;
    if (action.includes('document') || action.includes('upload')) return `Uploaded documents for ${emp} from ${company}`;
    if (action.includes('create') || action.includes('onboard')) return `New assignment received for ${emp} from ${company}`;
    
    // Default formatting
    return `${evt.event} for ${emp} from ${company}`;
  };

  return (
    <div className="dashboard-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.5s ease-out' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <PageHeader 
            title="Executive Workspace" 
            subtitle="Manage your daily verifications, calls, and pending tasks."
            icon={Briefcase}
          />
        </div>
      </div>

      {/* TOP METRIC CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        
        <div className="card" style={{ padding: '24px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'linear-gradient(145deg, #ffffff, #f8fafc)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Available Tasks</div>
              <div style={{ fontSize: '36px', fontWeight: 700, color: 'var(--text-dark)', lineHeight: '1', letterSpacing: '-1px' }}>{totalAvailable}</div>
            </div>
            <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: '#e0f2fe', color: '#0284c7', boxShadow: '0 4px 12px rgba(2, 132, 199, 0.15)' }}>
              <Briefcase size={22} strokeWidth={2.5} />
            </div>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-gray)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
            <Activity size={14} color="#0284c7" /> Total active queue
          </div>
        </div>

        <div className="card" style={{ padding: '24px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'linear-gradient(145deg, #ffffff, #f8fafc)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>In Progress</div>
              <div style={{ fontSize: '36px', fontWeight: 700, color: 'var(--text-dark)', lineHeight: '1', letterSpacing: '-1px' }}>{inProgress}</div>
            </div>
            <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: '#dbeafe', color: '#2563eb', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.15)' }}>
              <Activity size={22} strokeWidth={2.5} />
            </div>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-gray)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
            <Clock size={14} color="#2563eb" /> Currently processing
          </div>
        </div>

        <div className="card" style={{ padding: '24px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'linear-gradient(145deg, #ffffff, #f8fafc)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Calls Pending</div>
              <div style={{ fontSize: '36px', fontWeight: 700, color: 'var(--text-dark)', lineHeight: '1', letterSpacing: '-1px' }}>{callsPending}</div>
            </div>
            <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: '#f3e8ff', color: '#9333ea', boxShadow: '0 4px 12px rgba(147, 51, 234, 0.15)' }}>
              <PhoneCall size={22} strokeWidth={2.5} />
            </div>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-gray)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
            <PhoneForwarded size={14} color="#9333ea" /> Requires outreach
          </div>
        </div>

        <div className="card" style={{ padding: '24px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'linear-gradient(145deg, #ffffff, #f8fafc)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Completed Today</div>
              <div style={{ fontSize: '36px', fontWeight: 700, color: 'var(--text-dark)', lineHeight: '1', letterSpacing: '-1px' }}>{completedToday}</div>
            </div>
            <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: '#dcfce7', color: '#16a34a', boxShadow: '0 4px 12px rgba(22, 163, 74, 0.15)' }}>
              <CheckCircle2 size={22} strokeWidth={2.5} />
            </div>
          </div>
          <div style={{ fontSize: '13px', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
            <Activity size={14} /> + Daily target
          </div>
        </div>

      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* MY ACTIVE CASES TABLE */}
          <div className="card" style={{ padding: '28px', backgroundColor: '#fff', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.04)', borderRadius: '20px', overflowX: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Inbox size={20} color="var(--primary-blue)" /> Available Tasks
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-gray)', marginTop: '4px', fontWeight: 500 }}>Tasks ready to be assigned and verified.</p>
              </div>
              <button className="btn btn-outline" onClick={() => navigate('/exec/tasks/available')} style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                View All <ChevronRight size={16} />
              </button>
            </div>

            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0', textAlign: 'left' }}>
              <thead>
                <tr>
                  <th style={{ padding: '16px', fontSize: '12px', fontWeight: 700, color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '2px solid var(--border-color)' }}>Employee</th>
                  <th style={{ padding: '16px', fontSize: '12px', fontWeight: 700, color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '2px solid var(--border-color)' }}>Company</th>
                  <th style={{ padding: '16px', fontSize: '12px', fontWeight: 700, color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '2px solid var(--border-color)' }}>Service Type</th>
                  <th style={{ padding: '16px', fontSize: '12px', fontWeight: 700, color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '2px solid var(--border-color)' }}>Status</th>
                  <th style={{ padding: '16px', fontSize: '12px', fontWeight: 700, color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '2px solid var(--border-color)' }}>SLA</th>
                  <th style={{ padding: '16px', fontSize: '12px', fontWeight: 700, color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '2px solid var(--border-color)', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {availableCases.filter(e => e.status !== 'completed' && e.status !== 'approved' && e.status !== 'rejected').map((emp, index, arr) => (
                  <tr key={emp.id} style={{ transition: 'all 0.2s ease', backgroundColor: 'transparent' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ padding: '16px', borderBottom: index === arr.length - 1 ? 'none' : '1px solid var(--border-color)' }}>
                      <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-dark)' }}>{emp.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-gray)', marginTop: '2px', fontFamily: 'monospace' }}>{emp.id}</div>
                    </td>
                    <td style={{ padding: '16px', borderBottom: index === arr.length - 1 ? 'none' : '1px solid var(--border-color)', fontSize: '14px', color: 'var(--text-dark)', fontWeight: 500 }}>{emp.company || 'N/A'}</td>
                    <td style={{ padding: '16px', borderBottom: index === arr.length - 1 ? 'none' : '1px solid var(--border-color)', fontSize: '14px', color: 'var(--text-gray)' }}>Identity Verification</td>
                    <td style={{ padding: '16px', borderBottom: index === arr.length - 1 ? 'none' : '1px solid var(--border-color)' }}>
                      <span className={`badge ${getStatusBadge(emp.status)}`} style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '11px' }}>{emp.status.replace('-', ' ')}</span>
                    </td>
                    <td style={{ padding: '16px', borderBottom: index === arr.length - 1 ? 'none' : '1px solid var(--border-color)' }}>
                      <span style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        color: getSlaRiskColor(emp.slaStatus, emp.priority),
                        backgroundColor: `${getSlaRiskColor(emp.slaStatus, emp.priority)}15`,
                        padding: '6px 12px',
                        borderRadius: '8px'
                      }}>
                        {emp.slaStatus || 'On Track'}
                      </span>
                    </td>
                    <td style={{ padding: '16px', borderBottom: index === arr.length - 1 ? 'none' : '1px solid var(--border-color)', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button className="btn btn-outline" onClick={() => setPreviewTask(emp)} style={{ padding: '8px 12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '8px' }}>
                          <Eye size={16} /> Preview
                        </button>
                        <button className="btn btn-primary" onClick={() => setAssignConfirmTask(emp)} style={{ padding: '8px 12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(37, 99, 235, 0.2)' }}>
                          <UserPlus size={16} /> Assign
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {availableCases.filter(e => e.status !== 'completed' && e.status !== 'approved' && e.status !== 'rejected').length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-gray)', fontSize: '13px' }}>
                      No available tasks at the moment.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* TASKS ASSIGNED TO ME TABLE */}
          {/* TASKS ASSIGNED TO ME TABLE */}
          <div className="card" style={{ padding: '28px', backgroundColor: '#fff', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.04)', borderRadius: '20px', overflowX: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Briefcase size={20} color="var(--primary-blue)" /> Tasks Assigned To Me
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-gray)', marginTop: '4px', fontWeight: 500 }}>Your active verifications to process.</p>
              </div>
              <button className="btn btn-outline" onClick={() => navigate('/exec/tasks/mine')} style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                View All <ChevronRight size={16} />
              </button>
            </div>

            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0', textAlign: 'left' }}>
              <thead>
                <tr>
                  <th style={{ padding: '16px', fontSize: '12px', fontWeight: 700, color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '2px solid var(--border-color)' }}>Employee</th>
                  <th style={{ padding: '16px', fontSize: '12px', fontWeight: 700, color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '2px solid var(--border-color)' }}>Company</th>
                  <th style={{ padding: '16px', fontSize: '12px', fontWeight: 700, color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '2px solid var(--border-color)' }}>Status</th>
                  <th style={{ padding: '16px', fontSize: '12px', fontWeight: 700, color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '2px solid var(--border-color)' }}>SLA</th>
                  <th style={{ padding: '16px', fontSize: '12px', fontWeight: 700, color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '2px solid var(--border-color)', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignedTasks.map((emp, index, arr) => (
                  <tr key={emp.id} style={{ transition: 'all 0.2s ease', backgroundColor: 'transparent' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ padding: '16px', borderBottom: index === arr.length - 1 ? 'none' : '1px solid var(--border-color)' }}>
                      <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-dark)' }}>{emp.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-gray)', marginTop: '2px', fontFamily: 'monospace' }}>{emp.employeeCode || emp.id}</div>
                    </td>
                    <td style={{ padding: '16px', borderBottom: index === arr.length - 1 ? 'none' : '1px solid var(--border-color)', fontSize: '14px', color: 'var(--text-dark)', fontWeight: 500 }}>{emp.company || 'N/A'}</td>
                    <td style={{ padding: '16px', borderBottom: index === arr.length - 1 ? 'none' : '1px solid var(--border-color)' }}>
                      <span className={`badge ${getStatusBadge(emp.status)}`} style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '11px' }}>{(emp.status || 'assigned').replace('-', ' ')}</span>
                    </td>
                    <td style={{ padding: '16px', borderBottom: index === arr.length - 1 ? 'none' : '1px solid var(--border-color)' }}>
                      <span style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        color: getSlaRiskColor(emp.slaStatus, emp.priority),
                        backgroundColor: `${getSlaRiskColor(emp.slaStatus, emp.priority)}15`,
                        padding: '6px 12px',
                        borderRadius: '8px'
                      }}>
                        {emp.slaStatus || 'On Track'}
                      </span>
                    </td>
                    <td style={{ padding: '16px', borderBottom: index === arr.length - 1 ? 'none' : '1px solid var(--border-color)', textAlign: 'right' }}>
                      <button
                        className="btn btn-outline"
                        onClick={() => navigate(`/exec/workspace/${emp.id}`)}
                        style={{ padding: '8px 12px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px', borderRadius: '8px', color: '#2563eb', borderColor: '#bfdbfe', backgroundColor: '#eff6ff' }}
                      >
                        <PlaySquare size={16} /> Resume Workspace
                      </button>
                    </td>
                  </tr>
                ))}
                {assignedTasks.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-gray)', fontSize: '13px' }}>
                      No tasks assigned to you right now.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        {/* Top Row: Quick Actions and Recent Activity */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', alignItems: 'start' }}>
          
          {/* QUICK ACTION CENTER */}
          <div className="card" style={{ padding: '28px', backgroundColor: '#fff', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.04)', borderRadius: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Briefcase size={20} color="var(--primary-blue)" /> Quick Actions
            </h3>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <button className="btn btn-outline" onClick={() => navigate('/exec/tasks/mine')} style={{ flex: 1, padding: '14px', fontSize: '14px', fontWeight: 600, display: 'flex', justifyContent: 'center', gap: '8px', borderRadius: '12px' }}>
                <Briefcase size={18} /> Assigned To Me
              </button>
              <button className="btn btn-primary" onClick={() => navigate('/exec/tasks/mine')} style={{ flex: 1, padding: '14px', fontSize: '14px', fontWeight: 600, display: 'flex', justifyContent: 'center', gap: '8px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)' }}>
                <PlaySquare size={18} /> Resume Last
              </button>
            </div>
          </div>

          {/* TODAY'S ACTIVITY TIMELINE */}
          <div className="card" style={{ padding: '28px', backgroundColor: '#fff', flex: 1, border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.04)', borderRadius: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={20} color="var(--primary-blue)" /> My Recent Activity
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
              {allTimelineEvents.length === 0 ? (
                <div style={{ fontSize: '14px', color: 'var(--text-gray)', fontStyle: 'italic' }}>No recent activity.</div>
              ) : (
                allTimelineEvents.map((evt, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '16px', position: 'relative' }}>
                    {idx !== allTimelineEvents.length - 1 && (
                      <div style={{ position: 'absolute', top: '28px', left: '11px', bottom: '-20px', width: '2px', backgroundColor: 'var(--border-color)', opacity: 0.7 }}></div>
                    )}
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#e0f2fe', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, boxShadow: '0 0 0 1px #e0f2fe' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0284c7' }}></div>
                    </div>
                    <div style={{ flex: 1, paddingBottom: '4px' }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-dark)' }}>{formatEventMessage(evt)}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-gray)', marginTop: '4px', fontWeight: 500 }}>{new Date(evt.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>

      {/* TASK PREVIEW DRAWER */}
      {previewTask && (
        <>
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 100 }} onClick={() => setPreviewTask(null)}></div>
          <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '450px', backgroundColor: '#fff', zIndex: 101, display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 24px rgba(0,0,0,0.1)', animation: 'slideInRight 0.3s ease-out' }}>

            <style>{`
              @keyframes slideInRight {
                from { transform: translateX(100%); }
                to { transform: translateX(0); }
              }
            `}</style>

            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-dark)' }}>Task Preview</h2>
              <button onClick={() => setPreviewTask(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-gray)' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>

              {/* SECTION 1 — Candidate Summary */}
              <div>
                <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Candidate Summary</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-gray)' }}>Employee Name</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-dark)' }}>{previewTask.name}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-gray)' }}>Employee ID</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-dark)' }}>{previewTask.id}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-gray)' }}>Company</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-dark)' }}>{previewTask.company || 'N/A'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-gray)' }}>Contact</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-dark)' }}>{previewTask.contactNumber || 'N/A'}</div>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-gray)' }}>Service Type</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-dark)' }}>{previewTask.services ? previewTask.services[0] : 'Identity Verification'}</div>
                  </div>
                </div>
              </div>

              {/* SECTION 4 — SLA INFORMATION */}
              <div style={{ padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>SLA Information</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-gray)' }}>Priority Level</span>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: getPriorityColor(previewTask.priority) }}>{previewTask.priority || 'Medium'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-gray)' }}>SLA Aging</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-dark)' }}>{previewTask.slaStatus || 'On Track'}</span>
                  </div>
                </div>
              </div>

              {/* SECTION 2 — Uploaded Documents */}
              <div>
                <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Uploaded Documents</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {!previewTask.documents || previewTask.documents.length === 0 ? (
                    <div style={{ fontSize: '13px', color: 'var(--text-gray)' }}>No documents uploaded.</div>
                  ) : (
                    previewTask.documents.map((doc, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <FileText size={16} color="var(--primary-blue)" />
                          <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-dark)' }}>{doc.type}</span>
                        </div>
                        {doc.status === 'Rejected' || doc.status === 'Re-upload Required' ? (
                          <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}><AlertTriangle size={12} /> {doc.status}</span>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle2 size={12} /> {doc.status}</span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* SECTION 3 — Verification Timeline */}
              <div>
                <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Task Timeline</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {previewTask.timeline && previewTask.timeline.map((t, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '12px', position: 'relative' }}>
                      {idx !== previewTask.timeline.length - 1 && (
                        <div style={{ position: 'absolute', top: '16px', left: '7px', bottom: '-12px', width: '2px', backgroundColor: 'var(--border-color)' }}></div>
                      )}
                      <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: 'var(--bg-secondary)', border: '2px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, marginTop: '2px' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--primary-blue)' }}></div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-dark)' }}>{t.event}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-gray)' }}>{new Date(t.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* SECTION 5 — ACTIONS */}
            <div style={{ padding: '20px 24px', borderTop: '1px solid var(--border-color)', backgroundColor: '#fff', display: 'flex', gap: '12px' }}>
              <button className="btn btn-primary" onClick={() => { setAssignConfirmTask(previewTask); setPreviewTask(null); }} style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '8px' }}>
                <UserPlus size={16} /> Assign To Me
              </button>
            </div>
          </div>
        </>
      )}

      {/* ASSIGN CONFIRMATION MODAL */}
      {assignConfirmTask && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px', backgroundColor: '#fff', padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.2s ease-out' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
              <UserPlus size={24} color="#2563eb" />
            </div>
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '8px' }}>Assign Task to You?</h2>
              <p style={{ fontSize: '14px', color: 'var(--text-gray)', lineHeight: '1.5' }}>
                You are about to assign <strong>{assignConfirmTask.name} ({assignConfirmTask.id})</strong> to yourself.
                This action will lock the task, removing it from the available queue for all other executives.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button className="btn btn-outline" onClick={() => setAssignConfirmTask(null)} style={{ flex: 1 }}>Cancel</button>
              <button className="btn btn-primary" onClick={() => handleAssignTask(assignConfirmTask)} style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '6px' }}>
                <ShieldCheck size={16} /> Confirm Assignment
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
