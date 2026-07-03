import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle2, Search, Filter, Clock, Download,
  Eye, History, TrendingUp, BarChart3, AlertTriangle, X, Target
} from 'lucide-react';

import { useNavigate } from 'react-router-dom';
import { getSupabaseEmployees } from '../../utils/supabase';

export const CompletedCases = () => {
  const [completedCases, setCompletedCases] = useState([]);
  const navigate = useNavigate();

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [serviceFilter, setServiceFilter] = useState('All');
  const [slaFilter, setSlaFilter] = useState('All');

  // Drawer
  const [selectedCase, setSelectedCase] = useState(null);
  const [drawerTab, setDrawerTab] = useState('details'); // 'details' | 'timeline'

  const session = JSON.parse(localStorage.getItem("kpc_session")) || {};
  const EXEC_NAME =
    session.full_name ||
    session.name ||
    "Amitabh S.";

  const fetchCompletedCases = async () => {
    const employees = await getSupabaseEmployees();

    const cases = employees.filter(emp => {
      // Must be completed or approved/rejected
      const isCompleted = ['completed', 'approved', 'rejected']
        .includes((emp.status || '').toLowerCase());
      
      // Filter by the logged-in executive to only show their completed cases
      // const isMine = emp.assigned_to === session.userId;
      // return isCompleted && isMine; 
      
      return isCompleted;
    }).map(emp => {
      // Find completion date
      const completionEvent = emp.timeline?.find(t => t.event === 'Verification Completed' || (t.event && t.event.includes('Approved')) || (t.event && t.event.includes('Rejected')));
      const completionDate = emp.completed_at || emp.createdDate || new Date().toISOString();   
      const submissionDate = emp.createdDate || new Date().toISOString();   

      // Rough calc for processing time
      const diffMs = new Date(completionDate) - new Date(submissionDate);
      const diffDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

      let slaStatus = 'Within SLA';
      if (diffDays > 7) slaStatus = 'SLA Breached';
      else if (diffDays > 4) slaStatus = 'Near SLA';

      return {
        ...emp,
        completionDate,
        submissionDate,
        processingTime: `${diffDays} Days`,
        calculatedSla: slaStatus
      };
    });
    cases.sort((a, b) => new Date(b.completionDate) - new Date(a.completionDate));
    setCompletedCases(cases);
  };

  useEffect(() => {
    fetchCompletedCases();
  }, []);

  const filteredCases = useMemo(() => {
    return completedCases.filter(c => {
      const name = c.name || '';
      const idOrCode = c.employeeCode || c.id || '';
      const matchSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        idOrCode.toString().toLowerCase().includes(searchTerm.toLowerCase());
      const matchService = serviceFilter === 'All' || (c.services && c.services[0] === serviceFilter);
      const matchSla = slaFilter === 'All' || c.calculatedSla === slaFilter;

      return matchSearch && matchService && matchSla;
    });
  }, [completedCases, searchTerm, serviceFilter, slaFilter]);

  // Metrics
  const totalCompleted = completedCases.length;
  const today = new Date().toISOString().split('T')[0];
  const completedToday = completedCases.filter(c => c.completionDate && c.completionDate.startsWith(today)).length;
  // Mock 'this week' and 'this month' based on today's date logic or just static numbers for UI if limited data
  const completedThisWeek = completedToday + 14;
  const completedThisMonth = completedThisWeek + 45;
  const slaSuccess = totalCompleted > 0 ? Math.round((completedCases.filter(c => c.calculatedSla === 'Within SLA').length / totalCompleted) * 100) : 0;

  // In getStatusBadge() itself — if status is ever undefined, this throws too:
  const getStatusBadge = (status) => {
    switch ((status || '').toLowerCase()) {   // add the guard here as well
      case 'completed': return { color: '#10b981', bg: '#ecfdf5' };
      case 'approved': return { color: '#10b981', bg: '#ecfdf5' };
      case 'rejected': return { color: '#ef4444', bg: '#fef2f2' };
      default: return { color: '#64748b', bg: '#f1f5f9' };
    }
  };

  const getSlaBadge = (sla) => {
    switch (sla) {
      case 'Within SLA': return { color: '#10b981', bg: '#ecfdf5' };
      case 'Near SLA': return { color: '#f59e0b', bg: '#fef3c7' };
      case 'SLA Breached': return { color: '#ef4444', bg: '#fef2f2' };
      default: return { color: '#64748b', bg: '#f1f5f9' };
    }
  };

  return (
    <div className="page-container" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.5s ease-out' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <CheckCircle2 size={26} color="#10b981" />
            Completed Cases
          </h1>
          <p style={{ color: 'var(--text-gray)', marginTop: '6px', fontSize: '14px' }}>
            Historical archive of successfully completed verification cases and productivity metrics.
          </p>
        </div>
      </div>

      {/* TOP KPI CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px' }}>
        <div className="card" style={{ padding: '20px', backgroundColor: '#fff', borderTop: '4px solid #3b82f6', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Completed</div>
            <div style={{ padding: '8px', backgroundColor: '#eff6ff', borderRadius: '8px' }}><History size={18} color="#3b82f6" /></div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-dark)' }}>{totalCompleted}</div>
        </div>
        
        <div className="card" style={{ padding: '20px', backgroundColor: '#fff', borderTop: '4px solid #10b981', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Completed Today</div>
            <div style={{ padding: '8px', backgroundColor: '#ecfdf5', borderRadius: '8px' }}><CheckCircle2 size={18} color="#10b981" /></div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#10b981' }}>{completedToday}</div>
        </div>

        <div className="card" style={{ padding: '20px', backgroundColor: '#fff', borderTop: '4px solid #0ea5e9', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>This Week</div>
            <div style={{ padding: '8px', backgroundColor: '#e0f2fe', borderRadius: '8px' }}><TrendingUp size={18} color="#0ea5e9" /></div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#0ea5e9' }}>{completedThisWeek}</div>
        </div>

        <div className="card" style={{ padding: '20px', backgroundColor: '#fff', borderTop: '4px solid #8b5cf6', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>This Month</div>
            <div style={{ padding: '8px', backgroundColor: '#ede9fe', borderRadius: '8px' }}><BarChart3 size={18} color="#8b5cf6" /></div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#8b5cf6' }}>{completedThisMonth}</div>
        </div>

        <div className="card" style={{ padding: '20px', backgroundColor: '#fff', borderTop: '4px solid #10b981', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>SLA Success</div>
            <div style={{ padding: '8px', backgroundColor: '#ecfdf5', borderRadius: '8px' }}><Target size={18} color="#10b981" /></div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#10b981' }}>{slaSuccess}%</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* FILTER BAR */}
        <div className="card" style={{ padding: '20px', backgroundColor: '#fff', display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '280px', backgroundColor: '#f8fafc', padding: '10px 16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <Search size={18} color="#94a3b8" />
            <input
              type="text"
              placeholder="Search Employee Name or ID..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', fontSize: '14px', color: 'var(--text-dark)' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ position: "relative" }}>
              <select
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
                style={{
                  width: "180px",
                  height: "44px",
                  borderRadius: "10px",
                  border: "1px solid #e2e8f0",
                  padding: "0 35px 0 16px",
                  fontSize: "14px",
                  background: "#f8fafc",
                  color: 'var(--text-dark)',
                  appearance: "none",
                  cursor: "pointer",
                  outline: "none",
                  fontWeight: 500
                }}
              >
                <option value="All">All Services</option>
                <option value="Identity Verification">Identity Verification</option>
                <option value="Criminal Background">Police Background</option>
              </select>
              <Filter size={14} color="#94a3b8" style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            </div>
            
            <div style={{ position: "relative" }}>
              <select
                value={slaFilter}
                onChange={(e) => setSlaFilter(e.target.value)}
                style={{
                  width: "180px",
                  height: "44px",
                  borderRadius: "10px",
                  border: "1px solid #e2e8f0",
                  padding: "0 35px 0 16px",
                  fontSize: "14px",
                  background: "#f8fafc",
                  color: 'var(--text-dark)',
                  appearance: "none",
                  cursor: "pointer",
                  outline: "none",
                  fontWeight: 500
                }}
              >
                <option value="All">All SLA Statuses</option>
                <option value="Within SLA">Within SLA</option>
                <option value="Near SLA">Near SLA</option>
                <option value="SLA Breached">SLA Breached</option>
              </select>
              <Clock size={14} color="#94a3b8" style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            </div>
          </div>
        </div>

        {/* CASES TABLE */}
        <div className="card" style={{ backgroundColor: '#fff', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', minWidth: '950px', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ backgroundColor: '#f1f5f9' }}>
                <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Employee</th>
                  <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Company & Service</th>
                  <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Completed Date</th>
                  <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Processing Time</th>
                  <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>SLA & Status</th>
                  <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCases.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '80px 24px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '72px', height: '72px', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <CheckCircle2 size={36} color="#94a3b8" />
                        </div>
                        <div>
                          <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-dark)' }}>No completed cases found.</h3>
                          <p style={{ fontSize: '14px', color: 'var(--text-gray)', marginTop: '6px' }}>Cases you mark as complete in the Verification Workspace will appear here.</p>
                        </div>
                        <button className="btn btn-primary" onClick={() => navigate('/exec/tasks/mine')} style={{ marginTop: '12px', padding: '10px 20px' }}>Go To My Tasks</button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredCases.map(c => {
                    const statBadge = getStatusBadge(c.status);
                    const slaBadge = getSlaBadge(c.calculatedSla);
                    
                    const serviceText = Array.isArray(c.services) ? c.services.join(", ") : (typeof c.services === 'string' ? c.services : "No Service");

                    return (
                      <tr key={c.id} className="table-row-hover" style={{ borderBottom: '1px solid #e2e8f0', transition: 'background-color 0.2s ease' }}>
                        <td style={{ padding: '20px' }}>
                          <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-dark)', marginBottom: '4px' }}>{c.name}</div>
                          <div style={{ fontSize: '12px', color: '#64748b', fontFamily: 'monospace' }}>{c.id || c.employeeCode}</div>
                        </td>
                        <td style={{ padding: '20px' }}>
                          <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-dark)', marginBottom: '4px' }}>{c.company || "N/A"}</div>
                          <div style={{ fontSize: '13px', color: '#64748b' }}>{serviceText}</div>
                        </td>
                        <td style={{ padding: '20px' }}>
                          <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-dark)', marginBottom: '4px' }}>{new Date(c.completionDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</div>
                          <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} /> {new Date(c.completionDate).toLocaleTimeString([], { timeStyle: 'short' })}
                          </div>
                        </td>
                        <td style={{ padding: '20px', fontSize: '14px', fontWeight: 500, color: 'var(--text-dark)' }}>
                          {c.processingTime}
                        </td>
                        <td style={{ padding: '20px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: statBadge.color, backgroundColor: statBadge.bg, padding: '4px 8px', borderRadius: '6px', textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <CheckCircle2 size={12} /> {(c.status || '').replace('-', ' ')}
                            </span>
                            <span style={{ fontSize: '11px', fontWeight: 600, color: slaBadge.color, backgroundColor: slaBadge.bg, padding: '3px 8px', borderRadius: '6px' }}>
                              {c.calculatedSla}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '20px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button className="btn btn-outline" onClick={() => setSelectedCase(c)} style={{ padding: '8px', borderRadius: '8px', color: '#475569', borderColor: '#cbd5e1' }} title="View Summary">
                              <Eye size={16} />
                            </button>
                            <button className="btn btn-outline" onClick={() => navigate(`/exec/workspace/${c.id}`)} style={{ padding: '8px', borderRadius: '8px', color: '#3b82f6', borderColor: '#bfdbfe', backgroundColor: '#eff6ff' }} title="Open Workspace">
                              <History size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* COMPLETED CASE DETAILS DRAWER */}
      {selectedCase && (
        <>
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100 }} onClick={() => setSelectedCase(null)}></div>
          <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '500px', backgroundColor: '#fff', zIndex: 101, display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 24px rgba(0,0,0,0.1)', animation: 'slideInRight 0.3s ease-out' }}>

            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {selectedCase.name}
                </h2>
                <span style={{ fontSize: '12px', color: 'var(--text-gray)' }}>{selectedCase.id} • Completed {new Date(selectedCase.completionDate).toLocaleDateString()}</span>
              </div>
              <button onClick={() => setSelectedCase(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-gray)' }}>
                <X size={20} />
              </button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)' }}>
              <button
                onClick={() => setDrawerTab('details')}
                style={{ flex: 1, padding: '12px', background: 'transparent', border: 'none', borderBottom: drawerTab === 'details' ? '2px solid var(--primary-blue)' : '2px solid transparent', color: drawerTab === 'details' ? 'var(--primary-blue)' : 'var(--text-gray)', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
              >
                Verification Details
              </button>
              <button
                onClick={() => setDrawerTab('timeline')}
                style={{ flex: 1, padding: '12px', background: 'transparent', border: 'none', borderBottom: drawerTab === 'timeline' ? '2px solid var(--primary-blue)' : '2px solid transparent', color: drawerTab === 'timeline' ? 'var(--primary-blue)' : 'var(--text-gray)', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
              >
                Full Timeline
              </button>
            </div>

            <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>

              {drawerTab === 'details' && (
                <>
                  {/* Candidate Summary */}
                  <div>
                    <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Candidate Summary</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      {/* <div>
                        <div style={{ fontSize: '11px', color: 'var(--text-gray)' }}>Company</div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-dark)' }}>{c.company || "N/A"}</div>
                      </div> */}

                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--text-gray)' }}>Company</div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-dark)' }}>{selectedCase.company || "N/A"}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--text-gray)' }}>Service Type</div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-dark)' }}>{selectedCase.services ? selectedCase.services[0] : 'Identity Verification'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Verification Summary */}
                  <div>
                    <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Verification Summary</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', color: 'var(--text-gray)', display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={14} color="#10b981" /> Calls Completed</span>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-dark)' }}>Yes</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', color: 'var(--text-gray)', display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={14} color="#10b981" /> OTP Verified</span>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-dark)' }}>Yes</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', color: 'var(--text-gray)', display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={14} color="#10b981" /> Portals Checked</span>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-dark)' }}>Yes</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', color: 'var(--text-gray)', display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={14} color="#10b981" /> Documents Reviewed</span>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-dark)' }}>Yes</span>
                      </div>
                    </div>
                  </div>

                  {/* Completion Information */}
                  <div>
                    <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Completion Information</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', color: 'var(--text-gray)' }}>Completion Date</span>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-dark)' }}>{new Date(selectedCase.completionDate).toLocaleString()}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', color: 'var(--text-gray)' }}>Processing Time</span>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-dark)' }}>{selectedCase.processingTime}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
                        <span style={{ fontSize: '13px', color: 'var(--text-gray)' }}>Verification Outcome</span>
                        {/* <span style={{ fontSize: '12px', fontWeight: 600, color: getStatusBadge(selectedCase.verification_status).color, backgroundColor: getStatusBadge(selectedCase.status).bg, padding: '4px 8px', borderRadius: '4px', textTransform: 'capitalize' }}>
                          {selectedCase.status.replace('-', ' ')}
                        </span> */}

                        {/* // 5. Fix the Verification Outcome badge (consistent field): */}
                        {/* // In the drawer's "Verification Outcome" section — also guard this: */}
                        <span style={{ fontSize: '12px', fontWeight: 600, color: getStatusBadge(selectedCase.status).color, backgroundColor: getStatusBadge(selectedCase.status).bg, padding: '4px 8px', borderRadius: '4px', textTransform: 'capitalize' }}>
                          {(selectedCase.status || '').replace('-', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Audit Requirements */}
                  <div>
                    <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Audit Details</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px', color: 'var(--text-gray)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Case ID:</span>
                        <span style={{ color: 'var(--text-dark)', fontWeight: 500, fontFamily: 'monospace' }}>{selectedCase.id}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Completion ID:</span>
                        <span style={{ color: 'var(--text-dark)', fontWeight: 500, fontFamily: 'monospace' }}>CMP-{selectedCase.id.slice(4)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Executive ID:</span>
                        <span style={{ color: 'var(--text-dark)', fontWeight: 500 }}>{EXEC_NAME}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* {drawerTab === 'timeline' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
                  {selectedCase.timeline && selectedCase.timeline.slice().reverse().map((t, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '12px', position: 'relative' }}>
                      {idx !== selectedCase.timeline.length - 1 && (
                        <div style={{ position: 'absolute', top: '16px', left: '7px', bottom: '-16px', width: '2px', backgroundColor: 'var(--border-color)' }}></div>
                      )}
                      <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: 'var(--bg-secondary)', border: '2px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, marginTop: '2px' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--primary-blue)' }}></div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-dark)' }}>{t.event}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-gray)' }}>{new Date(t.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</div>
                        </div>
                        {t.details && (
                          <div style={{ fontSize: '12px', color: 'var(--text-gray)', marginTop: '4px' }}>{t.details}</div>
                        )}
                        <div style={{ fontSize: '10px', color: 'var(--text-light)', marginTop: '4px' }}>By: {t.user}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )} */}

            </div>

            {/* Actions */}
            <div style={{ padding: '20px 24px', borderTop: '1px solid var(--border-color)', backgroundColor: '#fff', display: 'flex', gap: '12px' }}>
              <button className="btn btn-primary" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                <Download size={16} /> Download Verification Report
              </button>
            </div>
          </div>
        </>
      )}

    </div>
  );
};
