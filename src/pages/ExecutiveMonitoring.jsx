import React, { useState, useEffect } from 'react';
import { Users, PhoneCall, Clock, CheckCircle, Search, AlertCircle, PhoneMissed, PhoneForwarded, Plus, X, Trash2, Briefcase, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
// import { mockDb } from '../utils/mockDb';
import { supabase, getSupabaseEmployees } from '../utils/supabase';
import { getExecutiveStats } from '../utils/executiveStats';

export const ExecutiveMonitoring = () => {
  const navigate = useNavigate();
  const [executives, setExecutives] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [designation, setDesignation] = useState('Executive');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [callMetrics, setCallMetrics] = useState({ total: 0, connected: 0, missed: 0, otpSuccess: '0%' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const employees = await getSupabaseEmployees();

    const { data: baseExecs, error } = await supabase
      .from("executives")
      .select("*");

    if (error) {
      console.error(error);
      return;
    }

    const updatedExecs = baseExecs.map(exec => {
      const assignedCases = employees.filter(
        emp => emp.assigned_to === exec.id
      );

      const activeCases = assignedCases.filter(emp =>
        !["completed", "approved", "rejected"]
          .includes((emp.status || "").toLowerCase())
      );

      const stats = getExecutiveStats(
        employees,
        exec.id
      );

      return {
        id: exec.id,
        name: exec.full_name,
        email: exec.email,
        designation: exec.designation,
        status: exec.status || "Active",
        cases: activeCases.length,
        completed: stats.totalCompleted,
        completedToday: stats.completedToday,
        completedWeek: stats.completedWeek,
        completedMonth: stats.completedMonth,
        slaSuccess: stats.slaSuccess
      };
    });

    setExecutives(updatedExecs);

    // Compute Global Call Metrics dynamically
    let totalCalls = 0;
    let connectedCalls = 0;
    let missedCalls = 0;
    let otpSuccessCalls = 0;

    employees.forEach(emp => {
      const calls = emp.timeline?.filter(t => {
        const e = (t.event || "").toLowerCase();
        return e.includes("call") || e.includes("connected") || e.includes("attempted") || e.includes("verified");
      }) || [];

      calls.forEach(c => {
        totalCalls++;
        let outcome = (c.event || '').replace('Call ', '');
        if (outcome === 'Call') outcome = 'Logged';
        
        if (outcome === 'Connected' || outcome === 'Verified') connectedCalls++;
        if (outcome === 'Attempted') missedCalls++;

        const eventText = (c.event || '').toLowerCase();
        const detailText = (c.details || '').toLowerCase();
        const combined = eventText + ' ' + detailText;

        if (combined.includes('otp verified')) {
          otpSuccessCalls++;
        }
      });
    });

    const otpRate = totalCalls > 0 ? Math.round((otpSuccessCalls / totalCalls) * 100) : 0;
    setCallMetrics({
      total: totalCalls,
      connected: connectedCalls,
      missed: missedCalls,
      otpSuccess: `${otpRate}%`
    });
  };

  const handleCreateExecutive = async (e) => {
    e.preventDefault();

    const { error } = await supabase
      .from("executives")
      .insert({
        full_name: name,
        email,
        designation,
        password: "exec@123",
        status: "Active"
      });

    if (error) {
      console.error(error);
      return;
    }

    setShowCreateModal(false);
    setName("");
    setEmail("");
    setDesignation("Executive");
    fetchData();
  };

  const filteredExecutives = executives.filter(exec => {
    const matchesSearch = exec.name.toLowerCase().includes(searchQuery.toLowerCase()) || exec.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All Statuses' || exec.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalActive = filteredExecutives.reduce((sum, e) => sum + (e.cases || 0), 0);
  const totalCompleted = filteredExecutives.reduce((sum, e) => sum + (e.completed || 0), 0);
  const avgSla = filteredExecutives.length > 0
    ? (filteredExecutives.reduce((sum, e) => sum + parseInt(e.slaSuccess || '100'), 0) / filteredExecutives.length).toFixed(0)
    : '100';

  const handleDeleteExecutive = async (id) => {
    if (
      window.confirm(
        "Are you sure you want to delete this executive? This action cannot be undone."
      )
    ) {
      const { error } = await supabase
        .from("executives")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error deleting executive:", error);
        alert("Failed to delete executive.");
        return;
      }
      fetchData();
    }
  };

  // Global Call Metrics are now computed dynamically in fetchData

  const getStatusColor = (status) => {
    switch (status) {
      case 'Online': return { text: '#166534', bg: '#dcfce7', dot: '#22c55e' };
      case 'Busy': return { text: '#ea580c', bg: '#ffedd5', dot: '#f97316' };
      case 'Offline': return { text: '#475569', bg: '#f1f5f9', dot: '#94a3b8' };
      case 'On Call': return { text: '#0369a1', bg: '#e0f2fe', dot: '#0ea5e9' };
      case 'Active': return { text: '#166534', bg: '#dcfce7', dot: '#22c55e' };
      default: return { text: '#475569', bg: '#f1f5f9', dot: '#94a3b8' };
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px', paddingBottom: '32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="gradient-text" style={{ fontSize: '36px', marginBottom: '8px', letterSpacing: '-0.5px' }}>Executive Monitoring</h1>
          <p style={{ fontSize: '16px', color: 'var(--text-gray)', maxWidth: '600px', lineHeight: '1.5' }}>
            Monitor workforce performance, distribute workload, and track SLA compliance in real-time.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', fontSize: '15px', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.2)' }}>
          <Plus size={18} /> Create Executive
        </button>
      </div>

      {/* Global Call Performance Dashboard */}
      <div className="card" style={{ padding: '32px', backgroundColor: '#fff', borderTop: '4px solid var(--primary-blue)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(37,99,235,0.08) 0%, rgba(255,255,255,0) 70%)', borderRadius: '50%' }}></div>
        <h2 style={{ fontSize: '18px', marginBottom: '28px', display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-dark)' }}>
          <div style={{ padding: '10px', backgroundColor: 'var(--primary-blue-light)', borderRadius: '10px', color: 'var(--primary-blue)' }}>
            <PhoneCall size={20} />
          </div>
          Global Call Performance
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-gray)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', letterSpacing: '0.5px' }}>TOTAL CALLS</span>
            <div style={{ fontSize: '36px', fontWeight: 700, color: 'var(--text-dark)', letterSpacing: '-1px' }}>{callMetrics.total}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-gray)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', letterSpacing: '0.5px' }}><PhoneForwarded size={16} color="#166534" /> CONNECTED</span>
            <div style={{ fontSize: '36px', fontWeight: 700, color: '#166534', letterSpacing: '-1px' }}>{callMetrics.connected}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-gray)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', letterSpacing: '0.5px' }}><PhoneMissed size={16} color="#dc2626" /> MISSED</span>
            <div style={{ fontSize: '36px', fontWeight: 700, color: '#dc2626', letterSpacing: '-1px' }}>{callMetrics.missed}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-gray)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', letterSpacing: '0.5px' }}><CheckCircle size={16} color="#0284c7" /> OTP SUCCESS</span>
            <div style={{ fontSize: '36px', fontWeight: 700, color: '#0284c7', letterSpacing: '-1px' }}>{callMetrics.otpSuccess}</div>
          </div>
        </div>
      </div>

      {/* Aggregate Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
        <div className="card" style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #e2e8f0', background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)' }}>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text-gray)', fontWeight: 600, marginBottom: '8px', letterSpacing: '0.5px' }}>ACTIVE CASES</div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text-dark)', letterSpacing: '-1px' }}>{totalActive}</div>
          </div>
          <div style={{ padding: '16px', backgroundColor: '#eff6ff', borderRadius: '16px', color: 'var(--primary-blue)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
            <Briefcase size={28} />
          </div>
        </div>
        <div className="card" style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #e2e8f0', background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)' }}>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text-gray)', fontWeight: 600, marginBottom: '8px', letterSpacing: '0.5px' }}>COMPLETED TODAY</div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: '#166534', letterSpacing: '-1px' }}>{totalCompleted}</div>
          </div>
          <div style={{ padding: '16px', backgroundColor: '#dcfce7', borderRadius: '16px', color: '#166534', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
            <CheckCircle size={28} />
          </div>
        </div>
        <div className="card" style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #e2e8f0', background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)' }}>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text-gray)', fontWeight: 600, marginBottom: '8px', letterSpacing: '0.5px' }}>SLA COMPLIANCE</div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: avgSla >= 90 ? '#166534' : '#ea580c', letterSpacing: '-1px' }}>{avgSla}%</div>
          </div>
          <div style={{ padding: '16px', backgroundColor: avgSla >= 90 ? '#dcfce7' : '#ffedd5', borderRadius: '16px', color: avgSla >= 90 ? '#166534' : '#ea580c', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
            <Clock size={28} />
          </div>
        </div>
      </div>

      {/* Controls & Table */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', backgroundColor: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="header-search" style={{ margin: 0, backgroundColor: '#f1f5f9', borderRadius: '12px', width: '320px', border: '1px solid transparent', transition: 'all 0.2s', padding: '10px 16px' }}>
              <Search size={18} color="var(--text-gray)" />
              <input type="text" placeholder="Search executives..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ fontSize: '14px', backgroundColor: 'transparent' }} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '10px 36px 10px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: '#f8fafc', fontWeight: 500 }}>
              <option>All Statuses</option>
              <option>Online</option>
              <option>Busy</option>
              <option>On Call</option>
              <option>Offline</option>
              <option>Active</option>
            </select>
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', backgroundColor: '#fff' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '16px 24px', fontSize: '12px', color: 'var(--text-gray)', fontWeight: 600, letterSpacing: '0.5px' }}>EXECUTIVE</th>
              <th style={{ padding: '16px 24px', fontSize: '12px', color: 'var(--text-gray)', fontWeight: 600, letterSpacing: '0.5px' }}>STATUS</th>
              <th style={{ padding: '16px 24px', fontSize: '12px', color: 'var(--text-gray)', fontWeight: 600, letterSpacing: '0.5px', textAlign: 'center' }}>ACTIVE CASES</th>
              <th style={{ padding: '16px 24px', fontSize: '12px', color: 'var(--text-gray)', fontWeight: 600, letterSpacing: '0.5px', textAlign: 'center' }}>COMPLETED</th>
              <th style={{ padding: '16px 24px', fontSize: '12px', color: 'var(--text-gray)', fontWeight: 600, letterSpacing: '0.5px', textAlign: 'right' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredExecutives.map(exec => {
              const statusStyle = getStatusColor(exec.status);
              return (
                <tr key={exec.id} className="table-row" style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '20px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div className="avatar" style={{ background: 'linear-gradient(135deg, var(--primary-blue) 0%, #6366f1 100%)', width: '44px', height: '44px', fontSize: '16px', boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)' }}>
                        {exec.name?.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '4px' }}>{exec.name}</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-gray)' }}>{exec.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '20px 24px' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', borderRadius: '20px', backgroundColor: statusStyle.bg, color: statusStyle.text, fontSize: '13px', fontWeight: 600 }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: statusStyle.dot, boxShadow: `0 0 0 2px ${statusStyle.bg}` }} />
                      {exec.status}
                    </div>
                  </td>
                  <td style={{ padding: '20px 24px', textAlign: 'center' }}>
                    <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-dark)', backgroundColor: '#f1f5f9', padding: '6px 16px', borderRadius: '8px' }}>
                      {exec.cases}
                    </span>
                  </td>
                  <td style={{ padding: '20px 24px', textAlign: 'center' }}>
                    <span style={{ fontSize: '16px', fontWeight: 600, color: '#166534', backgroundColor: '#dcfce7', padding: '6px 16px', borderRadius: '8px' }}>
                      {exec.completed}
                    </span>
                  </td>
                  <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button className="btn btn-outline" onClick={() => navigate(`/ops/monitoring/${exec.id}`)} style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '8px', backgroundColor: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        Details <ChevronRight size={14} />
                      </button>
                      <button className="btn btn-outline" onClick={() => handleDeleteExecutive(exec.id)} style={{ padding: '8px', borderRadius: '8px', color: '#ef4444', borderColor: 'transparent', backgroundColor: '#fee2e2' }} title="Delete Executive">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredExecutives.length === 0 && (
              <tr>
                <td colSpan="5" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-gray)' }}>
                  <Users size={48} color="#cbd5e1" style={{ margin: '0 auto 16px' }} />
                  <div style={{ fontSize: '16px', fontWeight: 500 }}>No executives found</div>
                  <div style={{ fontSize: '14px', marginTop: '4px' }}>Try adjusting your search or filters</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create Executive Modal */}
      {showCreateModal && (
        <div className="animate-fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' }}>
          <div className="card" style={{ width: '100%', maxWidth: '480px', padding: '32px', backgroundColor: '#fff', display: 'flex', flexDirection: 'column', gap: '24px', borderRadius: '20px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-dark)' }}>
                <div style={{ padding: '8px', backgroundColor: 'var(--primary-blue-light)', borderRadius: '10px', color: 'var(--primary-blue)' }}>
                  <Users size={20} />
                </div>
                Create Executive Account
              </h2>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'var(--bg-hover)', border: 'none', cursor: 'pointer', color: 'var(--text-gray)', padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} className="hover:bg-gray-200">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateExecutive} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-dark)' }}>Full Name *</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Ramesh Patil" style={{ padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border-color)', fontSize: '15px', outline: 'none', transition: 'border-color 0.2s', backgroundColor: '#f8fafc' }} onFocus={(e) => e.target.style.borderColor = 'var(--primary-blue)'} onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-dark)' }}>Email Address *</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="e.g. ramesh@kpc.com" style={{ padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border-color)', fontSize: '15px', outline: 'none', transition: 'border-color 0.2s', backgroundColor: '#f8fafc' }} onFocus={(e) => e.target.style.borderColor = 'var(--primary-blue)'} onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-dark)' }}>Designation *</label>
                <input type="text" value="Executive" readOnly style={{ padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border-color)', fontSize: '15px', backgroundColor: '#f1f5f9', outline: 'none', color: 'var(--text-gray)', cursor: 'not-allowed' }} />
              </div>

              <div style={{ fontSize: '13px', color: '#0369a1', backgroundColor: '#e0f2fe', padding: '12px 16px', borderRadius: '10px', display: 'flex', alignItems: 'flex-start', gap: '10px', lineHeight: '1.5' }}>
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>The default password for newly created accounts will be <strong>exec@123</strong>.</div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-outline" style={{ padding: '12px 24px', borderRadius: '10px', fontWeight: 600 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ padding: '12px 24px', borderRadius: '10px', fontWeight: 600, boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)' }}>Create Account</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

