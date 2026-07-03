//hr/Dashboard.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusCircle, Clock, AlertTriangle, CheckCircle2,
  Users, FileText, ArrowRight, TrendingUp,
  Layers, CheckSquare, BellRing, Calendar, ChevronRight,
  ShieldCheck, HelpCircle, FileCheck, Eye, MessageSquare
} from 'lucide-react';
import { supabase } from '../../utils/supabase';

export const Dashboard = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [hoveredSegment, setHoveredSegment] = useState(null);

  useEffect(() => {

    const loadDashboard = async () => {

      const session =
        JSON.parse(localStorage.getItem("kpc_session"));

      const { data: employeesData, error } =
        await supabase
          .from("employees")
          .select("*")
          .eq("company_id", session.clientId);

      if (error) {
        console.error(error);
        return;
      }

      // setEmployees(employeesData || []);
      setEmployees(
        (employeesData || []).map(emp => ({
          ...emp,
          status: emp.verification_status || 'pending',
          documents: emp.documents || []
        }))
      );

      setNotifications([]);
    };

    loadDashboard();

  }, []);


  // Calculate Metrics
  const totalEmployees = employees.length;
  const draftCount = employees.filter(e => e.verification_status === 'draft').length;
  const submittedCount = employees.filter(e => e.verification_status === 'submitted').length;
  const assignedCount = employees.filter(e => e.verification_status === 'assigned').length;
  const inProgressCount = employees.filter(e =>
    ['call-pending', 'otp-received', 'in-progress'].includes(e.verification_status)
  ).length;
  const approvedCount = employees.filter(e => e.verification_status === 'completed').length;
  const pendingCount = employees.filter(e => e.verification_status === 'pending').length;
  const rejectedCount = employees.filter(e => e.verification_status === 'rejected').length;
  const completedCount = employees.filter(e => e.verification_status === 'completed').length;

  const totalActiveVerifications = submittedCount + assignedCount + inProgressCount;

  // 1. Draft Summary Widget Logic
  const drafts = employees.filter(e => e.verification_status === 'draft');
  const totalDrafts = drafts.length;
  // A draft is awaiting documents if it has less than 2 documents uploaded
  const draftsAwaiting = drafts.filter(e => !e.documents || e.documents.length < 2).length;
  const draftsReady = totalDrafts - draftsAwaiting;

  // 2. Document Validation Summary Logic
  let missingDocs = 0;
  let rejectedDocs = 0;
  let reuploadDocs = 0;

  employees.forEach(emp => {
    // For drafts, check missing mandatory identity proofs (Aadhaar & PAN are mandatory)
    if (emp.verification_status === 'draft') {
      const docTypes = emp.documents ? emp.documents.map(d => d.type) : [];
      if (!docTypes.includes('Aadhaar Card')) missingDocs++;
      if (!docTypes.includes('PAN Card')) missingDocs++;
    }
    if (emp.documents) {


      emp.documents.forEach(doc => {
        if (doc.verification_status === 'Missing') missingDocs++;
        if (doc.verification_status === 'Rejected') rejectedDocs++;
        if (doc.verification_status === 'Re-upload Required') reuploadDocs++;
      });
    }
  });

  // 3. Notification Snapshot Logic
  const unreadNotifsCount = notifications.filter(n => !n.read).length;
  const approvalNotifsCount = notifications.filter(n => n.type === 'completion' || n.type === 'approval').length;
  const rejectionNotifsCount = notifications.filter(n => n.type === 'rejection').length;
  const remarksNotifsCount = notifications.filter(n => n.type === 'remarks').length;
  const notificationFeed = notifications.slice(0, 4);

  // 4. Recent Employee Submissions (Submitted/Active/Completed verifications)
  // const recentSubmissions = employees
  //   .filter(e => e.verification_status !== 'draft')
  //   .sort((a, b) => new Date(b.submittedDate || b.createdDate) - new Date(a.submittedDate || a.createdDate))
  //   .slice(0, 5);

  const recentSubmissions = employees
    .filter(e => e.verification_status !== 'draft')
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  // Status Distribution Chart Data
  const statusData = [
    { label: 'Submitted', count: submittedCount, color: '#f59e0b' },
    { label: 'Assigned', count: assignedCount, color: '#0369a1' },
    { label: 'In Progress', count: inProgressCount, color: '#3b82f6' },
    { label: 'Approved', count: approvedCount, color: '#10b981' },
    { label: 'Rejected', count: rejectedCount, color: '#ef4444' },
    { label: 'Completed', count: completedCount, color: '#06b6d4' }
  ].filter(item => item.count > 0);

  const totalChartCount = statusData.reduce((sum, item) => sum + item.count, 0);

  // SVG Donut calculation
  let accumulatedPercent = 0;
  const donutSegments = statusData.map((item) => {
    const percent = (item.count / totalChartCount) * 100;
    const strokeDash = `${percent} ${100 - percent}`;
    const strokeOffset = 100 - accumulatedPercent + 25; // +25 to start at top (12 o'clock)
    accumulatedPercent += percent;
    return {
      ...item,
      percent,
      strokeDash,
      strokeOffset: strokeOffset % 100
    };
  });

  // Service Type Breakdown dynamic counts
  const serviceCounts = {
    'Aadhaar/PAN Check': 0,
    'Police Verification': 0,
    'Address Check': 0,
    'Academic Check': 0
  };

  employees.forEach(emp => {
    const docTypes = emp.documents ? emp.documents.map(d => d.type) : [];
    if (docTypes.includes('Aadhaar Card') || docTypes.includes('PAN Card')) {
      serviceCounts['Aadhaar/PAN Check']++;
    }
    if (docTypes.includes('Birth Certificate') || docTypes.includes('School Leaving')) {
      serviceCounts['Academic Check']++;
    }
    if (emp.notes && emp.notes.toLowerCase().includes('address')) {
      serviceCounts['Address Check']++;
    } else {
      serviceCounts['Address Check']++;
    }
    if (emp.priority === 'Urgent' || emp.id === 'EMP-90421') {
      serviceCounts['Police Verification']++;
    }
  });

  const serviceData = Object.entries(serviceCounts).map(([name, count]) => ({
    name,
    count,
    percentage: totalEmployees > 0 ? Math.round((count / (totalEmployees * 2)) * 100) : 0
  }));

  const handleQuickAction = (actionType) => {
    switch (actionType) {
      case 'create':
        navigate('/hr/employees/create');
        break;
      case 'pending':
        navigate('/hr/employees', { state: { filterStatus: 'In Progress' } });
        break;
      case 'rejected':
        navigate('/hr/employees', { state: { filterStatus: 'Rejected' } });
        break;
      case 'completed':
        navigate('/hr/employees', { state: { filterStatus: 'Completed' } });
        break;
      default:
        break;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'submitted': return 'badge-submitted';
      case 'assigned': return 'badge-assigned';
      case 'call-pending': return 'badge-call-pending';
      case 'otp-received': return 'badge-otp-received';
      case 'in-progress': return 'badge-in-progress';
      case 'approved': return 'badge-approved';
      case 'rejected': return 'badge-rejected';
      case 'completed': return 'badge-completed';
      default: return '';
    }
  };

  const getServiceType = (emp) => {
    if (emp.services && emp.services.length > 0) {
      return emp.services.join(', ');
    }
    return 'Identity Verification'; // fallback default
  };

  return (
    <div className="dashboard-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.5s ease-out' }}>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .quick-action-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .quick-action-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 20px -8px rgba(11, 75, 175, 0.15);
          border-color: var(--primary-blue);
        }
        .quick-action-card:hover .action-arrow {
          transform: translateX(4px);
          color: var(--primary-blue);
        }
        .metric-card {
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        .metric-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }
        .metric-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 4px;
          height: 100%;
          background-color: var(--accent-color, var(--primary-blue));
        }
        .activity-row {
          transition: background-color 0.2s ease;
        }
        .activity-row:hover {
          background-color: var(--bg-hover);
        }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '35px', fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--text-dark)' }}>Client Dashboard</h1>
          <p style={{fontSize: '20px', color: 'var(--text-gray)', marginTop: '4px' }}>Welcome back! Monitor employee verifications and pending items.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* <div className="card" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#fff', fontSize: '14px', color: 'var(--text-gray)' }}>
            <Calendar size={16} />
            <span>June 25, 2026</span>
          </div> */}
          <button
            className="btn btn-primary"
            onClick={() => handleQuickAction('create')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '24px' }}
          >
            <PlusCircle size={16} /> Create Employee
          </button>
        </div>
      </div>

      {/* HR Dashboard Quick Actions */}
      <div>
        <h2 style={{ fontSize: '20px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-gray)', marginBottom: '12px', fontWeight: 600 }}>Quick Actions</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>

          {/* <div className="card quick-action-card" onClick={() => handleQuickAction('create')} style={{ padding: '20px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#fff' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'var(--primary-blue-light)', color: 'var(--primary-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PlusCircle size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                Create Employee <ChevronRight size={16} className="action-arrow" style={{ transition: 'transform 0.2s' }} />
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-gray)', marginTop: '4px' }}>Register new employee forms & upload proofs.</p>
            </div>
          </div> */}

          {/* <div className="card quick-action-card" onClick={() => handleQuickAction('pending')} style={{ padding: '20px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#fff' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                View Pending <ChevronRight size={16} className="action-arrow" style={{ transition: 'transform 0.2s' }} />
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-gray)', marginTop: '4px' }}>Check verifications currently in progress.</p>
            </div>
          </div>

          <div className="card quick-action-card" onClick={() => handleQuickAction('rejected')} style={{ padding: '20px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#fff' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                View Rejected <ChevronRight size={16} className="action-arrow" style={{ transition: 'transform 0.2s' }} />
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-gray)', marginTop: '4px' }}>See flagged accounts requiring re-upload.</p>
            </div>
          </div>

          <div className="card quick-action-card" onClick={() => handleQuickAction('completed')} style={{ padding: '20px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#fff' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#dcfce7', color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                View Completed <ChevronRight size={16} className="action-arrow" style={{ transition: 'transform 0.2s' }} />
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-gray)', marginTop: '4px' }}>Download finalized reports & certificates.</p>
            </div>
          </div> */}

        </div>
      </div>

      {/* Metric Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>

        <div className="card metric-card" style={{ padding: '20px', backgroundColor: '#fff', '--accent-color': '#0b4baf' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-gray)' }}>
            <span style={{ fontSize: '23px', fontWeight: 600 }}>Total Employees</span>
            <Users size={18} />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-dark)', marginTop: '12px' }}>{totalEmployees}</div>
          <div style={{ fontSize: '16px', color: 'var(--text-gray)', marginTop: '4px' }}>Saved or registered</div>
        </div>

        <div className="card metric-card" style={{ padding: '20px', backgroundColor: '#fff', '--accent-color': '#3b82f6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-gray)' }}>
            <span style={{ fontSize: '23px', fontWeight: 600 }}>In Progress</span>
            <Clock size={18} />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-dark)', marginTop: '12px' }}>{inProgressCount}</div>
          <div style={{ fontSize: '16px', color: 'var(--text-gray)', marginTop: '4px' }}>Active verification checks</div>
        </div>

        <div className="card metric-card" style={{ padding: '20px', backgroundColor: '#fff', '--accent-color': '#10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-gray)' }}>
            <span style={{ fontSize: '23px', fontWeight: 600 }}>Approved</span>
            <CheckCircle2 size={18} />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-dark)', marginTop: '12px' }}>{approvedCount}</div>
          <div style={{ fontSize: '16px', color: 'var(--text-gray)', marginTop: '4px' }}>Verification successful</div>
        </div>

        <div className="card metric-card" style={{ padding: '20px', backgroundColor: '#fff', '--accent-color': '#ffe600ff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-gray)' }}>
            <span style={{ fontSize: '23px', fontWeight: 600 }}>Pending</span>
            <CheckCircle2 size={18} />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-dark)', marginTop: '12px' }}>{pendingCount}</div>
          <div style={{ fontSize: '16px', color: 'var(--text-gray)', marginTop: '4px' }}>Verification successful</div>
        </div>

        <div className="card metric-card" style={{ padding: '20px', backgroundColor: '#fff', '--accent-color': '#ef4444' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-gray)' }}>
            <span style={{ fontSize: '23px', fontWeight: 600 }}>Rejected</span>
            <AlertTriangle size={18} />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-dark)', marginTop: '12px' }}>{rejectedCount}</div>
          <div style={{ fontSize: '16px', color: 'var(--text-gray)', marginTop: '4px' }}>Requires action</div>
        </div>

      </div>

      {/* 4. Recent Employee Submissions */}
      <div className="card" style={{ padding: '24px', backgroundColor: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '26px', fontWeight: 600, color: 'var(--text-dark)' }}>Recent Employee Submissions</h3>
            <p style={{ fontSize: '18px', color: 'var(--text-gray)', marginTop: '4px' }}>Latest verifications dispatched for screening.</p>
          </div>
          <button className="btn btn-outline" onClick={() => navigate('/hr/employees')} style={{ padding: '6px 12px', fontSize: '18px' }}>
            View Employee List <ChevronRight size={14} style={{ marginLeft: '4px' }} />
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          {recentSubmissions.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-gray)' }}>No submitted verifications yet.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: '#f8fafc' }}>
                  <th style={{ padding: '12px 16px', fontSize: '18px', fontWeight: 600, color: 'var(--text-gray)' }}>EMPLOYEE NAME</th>
                  <th style={{ padding: '12px 16px', fontSize: '18px', fontWeight: 600, color: 'var(--text-gray)' }}>SUBMISSION DATE</th>
                  <th style={{ padding: '12px 16px', fontSize: '18px', fontWeight: 600, color: 'var(--text-gray)' }}>SERVICE TYPE</th>
                  <th style={{ padding: '12px 16px', fontSize: '18px', fontWeight: 600, color: 'var(--text-gray)' }}>STATUS</th>
                  <th style={{ padding: '12px 16px', fontSize: '18px', fontWeight: 600, color: 'var(--text-gray)' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {recentSubmissions.map((row) => (
                  <tr key={row.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 400, fontSize: '25px' }}>{row.full_name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-gray)' }}>{row.id}</div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '15px', color: 'black' }}>
                      {row.created_at ? new Date(row.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '15px' }}>
                      {getServiceType(row)}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className={`badge ${getStatusClass(row.verification_status || row.status)}`}>
                        {(row.verification_status || row.status || 'pending').replace('-', ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button
                        className="btn btn-outline"
                        onClick={() => navigate('/hr/employees', { state: { viewEmployeeId: row.id } })}
                        style={{ padding: '4px 8px', fontSize: '18px' }}
                      >
                        <Eye size={15} style={{ marginRight: '4px' }} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
};
export default Dashboard;
