import React, { useState, useEffect, useMemo } from 'react';
import {
  PhoneCall, Search, Filter, PhoneForwarded,
  PhoneMissed, Clock, CheckCircle2, AlertTriangle,
  X, User, Download, Eye, TrendingUp, BarChart3, RotateCw
} from 'lucide-react';
import { mockDb } from '../../utils/mockDb';
import { getSupabaseEmployees, supabase } from '../../utils/supabase';

export const CallLogs = () => {
  const [callLogs, setCallLogs] = useState([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('All');
  const [otpFilter, setOtpFilter] = useState('All');

  // Drawer
  const [selectedCall, setSelectedCall] = useState(null);

  const session = JSON.parse(localStorage.getItem("kpc_session")) || {};
  const EXEC_NAME = session.userName || 'Amitabh S.';

  const fetchCalls = async () => {
    const employees = await getSupabaseEmployees();
    
    const { data: callLogsData, error } = await supabase
      .from("call_logs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching call logs:", error);
    }

    let logs = [];
    (callLogsData || []).forEach((c, idx) => {
      // Filter for this executive's calls
      // if (c.executive_id !== session.userId && c.executive_name !== EXEC_NAME) {
      //   return;
      // }

      // Match employee
      const emp = employees.find(e => e.id === c.employee_id);

      // Map OTP Status
      let otpStatus = 'Not Sent';
      if (c.outcome_id === 'call_received_otp_received') otpStatus = 'Verified';
      else if (c.outcome_id === 'call_received_no_otp') otpStatus = 'Sent';

      // Map Outcome
      let outcomeLabel = c.outcome;
      if (outcomeLabel.includes('Call Received')) outcomeLabel = 'Connected';
      else if (outcomeLabel.includes('Not Received') || outcomeLabel.includes('Busy')) outcomeLabel = 'Attempted';

      logs.push({
        id: c.id || `CALL-${Date.now()}-${idx}`,
        empId: c.employee_id,
        empName: emp ? emp.name : 'Unknown Employee',
        contactNumber: emp ? (emp.contactNumber || emp.mobile) : 'N/A',
        serviceType: emp && emp.services && emp.services.length ? emp.services[0] : 'Identity Verification',
        executive: c.executive_name || EXEC_NAME,
        date: c.created_at,
        duration: c.call_received ? '2m 45s' : '0m 0s',
        outcome: outcomeLabel,
        otpStatus: otpStatus,
        followUpDate: null,
        details: c.remarks || 'No remarks provided.',
        timeline: emp ? emp.timeline : []
      });
    });

    // Sort newest first
    logs.sort((a, b) => new Date(b.date) - new Date(a.date));
    setCallLogs(logs);
  };

  useEffect(() => {
    fetchCalls();
  }, []);

  const filteredLogs = useMemo(() => {
    return callLogs.filter(log => {
      const matchSearch = log.empName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.empId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.contactNumber.includes(searchTerm);
      const matchOutcome = outcomeFilter === 'All' || log.outcome === outcomeFilter;
      const matchOtp = otpFilter === 'All' || log.otpStatus === otpFilter;

      return matchSearch && matchOutcome && matchOtp;
    });
  }, [callLogs, searchTerm, outcomeFilter, otpFilter]);

  // Metrics
  const today = new Date().toISOString().split('T')[0];
  const callsToday = callLogs.filter(l => l.date.startsWith(today)).length;
  const connectedCalls = callLogs.filter(l => l.outcome === 'Connected' || l.outcome === 'Verified').length;
  const missedCalls = callLogs.filter(l => l.outcome === 'Attempted').length;
  const otpVerifiedCalls = callLogs.filter(l => l.otpStatus === 'Verified').length;

  const getOutcomeBadge = (outcome) => {
    switch (outcome) {
      case 'Connected':
      case 'Verified': return { color: '#10b981', bg: '#ecfdf5', icon: <CheckCircle2 size={12} /> };
      case 'Attempted': return { color: '#ef4444', bg: '#fef2f2', icon: <PhoneMissed size={12} /> };
      case 'Logged': return { color: '#3b82f6', bg: '#eff6ff', icon: <PhoneCall size={12} /> };
      default: return { color: '#64748b', bg: '#f1f5f9', icon: <PhoneCall size={12} /> };
    }
  };

  const getOtpBadge = (status) => {
    switch (status) {
      case 'Verified': return { color: '#f59e0b', bg: '#ecfdf5' };
      case 'Sent': return { color: '#007427ff', bg: '#b5eacaff', fontSize: '15px' };
      case 'Not Sent': return { color: '#94a3b8', bg: '#f8fafc' };
    }
  };

  return (
    <div className="page-container" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.5s ease-out' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <PhoneCall size={26} color="var(--primary-blue)" />
            Call Logs
          </h1>
          <p style={{ color: 'var(--text-gray)', marginTop: '6px', fontSize: '14px' }}>
            Central communication audit center. Review call history, productivity, and outcomes.
          </p>
        </div>
      </div>

      {/* TOP KPI CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
        <div className="card metric-card" style={{ padding: '16px', backgroundColor: '#fff', borderLeft: '4px solid #3b82f6' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-gray)', textTransform: 'uppercase' }}>Total Calls Today</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-dark)', marginTop: '8px' }}>{callsToday}</div>
        </div>
        <div className="card metric-card" style={{ padding: '16px', backgroundColor: '#fff', borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-gray)', textTransform: 'uppercase' }}>Connected</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#10b981', marginTop: '8px' }}>{connectedCalls}</div>
        </div>
        <div className="card metric-card" style={{ padding: '16px', backgroundColor: '#fff', borderLeft: '4px solid #ef4444' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-gray)', textTransform: 'uppercase' }}>Missed / Attempted</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#ef4444', marginTop: '8px' }}>{missedCalls}</div>
        </div>
        <div className="card metric-card" style={{ padding: '16px', backgroundColor: '#fff', borderLeft: '4px solid #8b5cf6' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-gray)', textTransform: 'uppercase' }}>OTP Verified</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#8b5cf6', marginTop: '8px' }}>{otpVerifiedCalls}</div>
        </div>
        <div className="card metric-card" style={{ padding: '16px', backgroundColor: '#fff', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-gray)', textTransform: 'uppercase' }}>Follow-Ups Pending</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#d97706', marginTop: '8px' }}>0</div>
        </div>
        {/* <div className="card metric-card" style={{ padding: '16px', backgroundColor: '#fff', borderLeft: '4px solid #06b6d4' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-gray)', textTransform: 'uppercase' }}>Avg Call Duration</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-dark)', marginTop: '8px' }}>1m 45s</div>
        </div> */}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '24px', alignItems: 'start' }}>

        {/* Main Content Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* FILTER BAR */}
          <div className="card" style={{ padding: '16px', backgroundColor: '#fff', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '250px' }}>
              <Search size={18} color="var(--text-light)" />
              <input
                type="text"
                placeholder="Search Employee, ID or Phone..."
                className="input-field"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ width: '85%', padding: '8px', borderRadius: '12px' }}
              />
            </div>

            <div style={{ position: "relative" }}>
              <label
                style={{
                  position: "absolute",
                  top: "-8px",
                  left: "12px",
                  background: "#fff",
                  padding: "0 5px",
                  fontSize: "11px",
                  color: "#64748b",
                  fontWeight: 600
                }}
              >
                Outcome
              </label>

              <select
                className="select-input"
                value={outcomeFilter}
                onChange={(e) => setOutcomeFilter(e.target.value)}
                style={{
                  width: "200px",
                  height: "46px",
                  borderRadius: "10px",
                  border: "1px solid #d1d5db",
                  padding: "0 35px 0 14px",
                  fontSize: "14px",
                  background: "#fff",
                  appearance: "none",
                  cursor: "pointer",
                  outline: "none"
                }}
              >
                <option value="All">All Outcomes</option>
                <option value="Connected">Connected</option>
                <option value="Verified">Verified</option>
                <option value="Attempted">Attempted</option>
              </select>

              <span
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                  color: "#64748b",
                  fontSize: "12px"
                }}
              >
                ▼
              </span>
            </div>

            <div style={{ position: "relative" }}>
              <label
                style={{
                  position: "absolute",
                  top: "-8px",
                  left: "12px",
                  background: "#fff",
                  padding: "0 5px",
                  fontSize: "11px",
                  color: "#64748b",
                  fontWeight: 600
                }}
              >
                OTP Status
              </label>

              <select
                className="select-input"
                value={otpFilter}
                onChange={(e) => setOtpFilter(e.target.value)}
                style={{
                  width: "200px",
                  height: "46px",
                  borderRadius: "10px",
                  border: "1px solid #d1d5db",
                  padding: "0 35px 0 14px",
                  fontSize: "14px",
                  background: "#fff",
                  appearance: "none",
                  cursor: "pointer",
                  outline: "none"
                }}
              >
                <option value="All">All OTP Status</option>
                <option value="Verified">Verified</option>
                <option value="Sent">Sent</option>
                <option value="Not Sent">Not Sent</option>
              </select>

              <span
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                  color: "#64748b",
                  fontSize: "12px"
                }}
              >
                ▼
              </span>
            </div>

            {/* <button className="btn btn-outline" onClick={() => { setSearchTerm(''); setOutcomeFilter('All'); setOtpFilter('All'); }} style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Filter size={14} /> Reset
            </button> */}
          </div>

          {/* CALL LOG TABLE */}
          <div className="card" style={{ backgroundColor: '#fff', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ width: '100%', minWidth: '900px', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ backgroundColor: '#f8fafc' }}>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 600, color: 'var(--text-gray)' }}>EMPLOYEE</th>
                    <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 600, color: 'var(--text-gray)' }}>CONTACT</th>
                    <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 600, color: 'var(--text-gray)' }}>DATE & TIME</th>
                    {/* <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 600, color: 'var(--text-gray)' }}>DURATION</th> */}
                    <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 600, color: 'var(--text-gray)' }}>OUTCOME</th>
                    <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 600, color: 'var(--text-gray)' }}>OTP STATUS</th>
                    <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 600, color: 'var(--text-gray)', textAlign: 'right' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ padding: '64px 24px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                          <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <PhoneCall size={32} color="var(--text-light)" />
                          </div>
                          <div>
                            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-dark)' }}>No call records found.</h3>
                            <p style={{ fontSize: '13px', color: 'var(--text-gray)', marginTop: '4px' }}>Adjust your filters or initiate calls from the Verification Workspace.</p>
                          </div>
                          <button className="btn btn-outline" onClick={() => { setSearchTerm(''); setOutcomeFilter('All'); setOtpFilter('All'); }} style={{ marginTop: '8px' }}>Clear Filters</button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map(log => {
                      const outcomeBadge = getOutcomeBadge(log.outcome);
                      const otpBadge = getOtpBadge(log.otpStatus);

                      return (
                        <tr key={log.id} className="table-row-hover" style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '16px' }}>
                            <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-dark)' }}>{log.empName}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-gray)' }}>{log.empId}</div>
                          </td>
                          <td style={{ padding: '16px', fontSize: '13px', color: 'var(--text-dark)' }}>
                            {log.contactNumber}
                          </td>
                          <td style={{ padding: '16px' }}>
                            <div style={{ fontSize: '13px', color: 'var(--text-dark)' }}>{new Date(log.date).toLocaleDateString()}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-gray)' }}>{new Date(log.date).toLocaleTimeString([], { timeStyle: 'short' })}</div>
                          </td>
                          {/* <td style={{ padding: '16px', fontSize: '13px', color: 'var(--text-dark)' }}>
                            {log.duration}
                          </td> */}
                          <td style={{ padding: '16px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 600, color: outcomeBadge.color, backgroundColor: outcomeBadge.bg, padding: '4px 8px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              {outcomeBadge.icon} {log.outcome}
                            </span>
                          </td>
                          <td style={{ padding: '16px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 600, color: otpBadge.color, backgroundColor: otpBadge.bg, padding: '4px 8px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              {log.otpStatus}
                            </span>
                          </td>
                          <td style={{ padding: '16px', textAlign: 'right' }}>
                            <button className="btn btn-outline" onClick={() => setSelectedCall(log)} style={{ padding: '6px 10px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <Eye size={14} /> Details
                            </button>
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

        {/* Right Side Widgets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* FOLLOW-UP MANAGEMENT */}
          <div className="card" style={{ padding: '20px', backgroundColor: '#fff' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} color="var(--primary-blue)" /> Follow-Ups
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-dark)' }}>Today</span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#fff', backgroundColor: '#3b82f6', padding: '2px 8px', borderRadius: '12px' }}>0</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-dark)' }}>Tomorrow</span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-gray)', backgroundColor: '#e2e8f0', padding: '2px 8px', borderRadius: '12px' }}>0</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: '#fef2f2', borderRadius: '6px', border: '1px solid #fca5a5' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#991b1b' }}>Overdue</span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#fff', backgroundColor: '#ef4444', padding: '2px 8px', borderRadius: '12px' }}>0</span>
              </div>
            </div>
          </div>

          {/* ANALYTICS SECTION */}
          {/* <div className="card" style={{ padding: '20px', backgroundColor: '#fff' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart3 size={18} color="var(--primary-blue)" /> Call Analytics
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-gray)' }}>Connected Rate</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#10b981' }}>85%</span>
                </div>
                <div style={{ height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: '85%', backgroundColor: '#10b981' }}></div>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-gray)' }}>OTP Success</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#8b5cf6' }}>92%</span>
                </div>
                <div style={{ height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: '92%', backgroundColor: '#8b5cf6' }}></div>
                </div>
              </div>

              <div style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingUp size={16} color="#3b82f6" />
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-gray)' }}>Calls Per Day Trend</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-dark)' }}>+12% vs last week</div>
                </div>
              </div>
            </div>
          </div> */}

        </div>
      </div>

      {/* CALL DETAILS DRAWER */}
      {selectedCall && (
        <>
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 100 }} onClick={() => setSelectedCall(null)}></div>
          <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '450px', backgroundColor: '#fff', zIndex: 101, display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 24px rgba(0,0,0,0.1)', animation: 'slideInRight 0.3s ease-out' }}>

            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PhoneCall size={18} color="var(--primary-blue)" /> Call Details
              </h2>
              <button onClick={() => setSelectedCall(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-gray)' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>

              {/* Candidate Summary */}
              <div>
                <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Candidate Summary</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-gray)' }}>Employee Name</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-dark)' }}>{selectedCall.empName}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-gray)' }}>Employee ID</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-dark)' }}>{selectedCall.empId}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-gray)' }}>Company</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-dark)' }}>{selectedCall.company || 'N/A'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-gray)' }}>Service Type</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-dark)' }}>{selectedCall.serviceType}</div>
                  </div>
                </div>
              </div>

              {/* Call Information */}
              <div>
                <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Call Information</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-gray)' }}>Call Date</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-dark)' }}>{new Date(selectedCall.date).toLocaleDateString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-gray)' }}>Call Time</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-dark)' }}>{new Date(selectedCall.date).toLocaleTimeString([], { timeStyle: 'short' })}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-gray)' }}>Duration</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-dark)' }}>{selectedCall.duration}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-gray)' }}>Call Outcome</span>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: getOutcomeBadge(selectedCall.outcome).color, backgroundColor: getOutcomeBadge(selectedCall.outcome).bg, padding: '4px 8px', borderRadius: '4px' }}>
                      {selectedCall.outcome}
                    </span>
                  </div>
                </div>
              </div>

              {/* OTP Information */}
              <div>
                <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>OTP Information</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-gray)' }}>OTP Status</span>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: getOtpBadge(selectedCall.otpStatus).color, backgroundColor: getOtpBadge(selectedCall.otpStatus).bg, padding: '4px 8px', borderRadius: '4px' }}>
                    {selectedCall.otpStatus}
                  </span>
                </div>
              </div>

              {/* Executive Notes */}
              <div>
                <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Executive Remarks</h3>
                <div style={{ padding: '16px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', fontSize: '13px', color: 'var(--text-dark)', lineHeight: '1.5' }}>
                  {selectedCall.details}
                </div>
              </div>

              {/* Call Recording Placeholder */}
              <div>
                <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Call Recording</h3>
                <div style={{ padding: '16px', backgroundColor: '#f8fafc', border: '1px dashed var(--border-color)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-gray)', fontSize: '12px' }}>
                  <PhoneCall size={16} style={{ marginRight: '8px' }} /> Recording unavailable for this session.
                </div>
              </div>

              {/* Audit Trail */}
              <div>
                <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Audit Trail</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px', color: 'var(--text-gray)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Created By:</span>
                    <span style={{ color: 'var(--text-dark)', fontWeight: 500 }}>{selectedCall.executive}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Created Date:</span>
                    <span style={{ color: 'var(--text-dark)', fontWeight: 500 }}>{new Date(selectedCall.date).toLocaleString()}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Actions */}
            <div style={{ padding: '20px 24px', borderTop: '1px solid var(--border-color)', backgroundColor: '#fff', display: 'flex', gap: '12px' }}>
              <button className="btn btn-outline" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                <Download size={14} /> Export Log
              </button>
            </div>
          </div>
        </>
      )}

    </div>
  );
};
