import React, { useState, useEffect } from 'react';
import { Users, Building2, ShieldCheck, AlertTriangle, TrendingUp, Target, Activity, CheckCircle2, Clock } from 'lucide-react';
import { getSupabaseEmployees, getSupabaseClients } from '../../utils/supabase';
import { mockDb } from '../../utils/mockDb';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';

export const Dashboard = () => {
  const [metrics, setMetrics] = useState({
    totalClients: 0,
    activeVerifications: 0,
    completedToday: 0,
    escalations: 0,
    slaBreached: 0,
    totalVerifications: 0,
    completedVerifications: 0
  });

  const [projects, setProjects] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const navigate = useNavigate();


  useEffect(() => {
    const fetchData = async () => {
      // Remove mockDb.init() and mockDb.getClients()
      const clients = await getSupabaseClients(); // same source as Client Accounts page
      console.log('clients:', clients); // Check what IDs/names come back
      const employees = await getSupabaseEmployees();

      const active = employees.filter(e => !['completed', 'approved', 'rejected'].includes((e.status || '').toLowerCase()));
      const escalated = employees.filter(e => e.priority === 'Urgent');

      const todayStr = new Date().toISOString().split('T')[0];
      let completedTodayCount = 0;
      let activities = [];

      employees.forEach(emp => {
        if (emp.timeline && emp.timeline.length > 0) {
          // Check completed today
          const completedEvent = emp.timeline.find(t => t.event === 'Verification Completed' || t.event.includes('Approved'));
          if (completedEvent && completedEvent.date.startsWith(todayStr)) {
            completedTodayCount++;
          }

          // Collect activities
          emp.timeline.forEach(t => {
            activities.push({
              ...t,
              empName: emp.name,
              empId: emp.id,
              company: emp.company || 'Unknown'
            });
          });
        }
      });

      // Sort activities descending
      activities.sort((a, b) => new Date(b.date) - new Date(a.date));

      // Calculate SLA breached (mock logic: submitted > 7 days ago and active)
      // let breached = 0;
      // active.forEach(emp => {
      //   const subEvent = emp.timeline?.find(t => t.event === 'Submitted');
      //   const subDate = subEvent ? new Date(subEvent.date) : new Date(emp.createdDate || Date.now());
      //   const diffDays = Math.ceil((Date.now() - subDate) / (1000 * 60 * 60 * 24));
      //   if (diffDays > 7) breached++;
      // });

      // Calculate SLA Breached (30 minutes not assigned to Executive)
      let breached = 0;

      active.forEach(emp => {

        // Only check applications that are NOT assigned
        if (!emp.assigned_to) {

          const createdTime = new Date(emp.createdDate);

          const diffMinutes =
            (Date.now() - createdTime.getTime()) / (1000 * 60);

          if (diffMinutes >= 30) {
            breached++;
          }
        }

      });
      setMetrics({
        totalClients: clients.length,
        activeVerifications: active.length,
        completedToday: completedTodayCount,
        escalations: escalated.length,
        slaBreached: breached,
        totalVerifications: employees.length,
        completedVerifications: employees.filter(e => ['completed', 'approved'].includes((e.status || '').toLowerCase())).length
      });

      const projectStats = clients.map(client => {
        const clientEmployees = employees.filter(e => e.company === client.company_name || e.companyId === client.id);
        const completedCount = clientEmployees.filter(e => ['completed', 'approved'].includes((e.status || '').toLowerCase())).length;
        const totalCount = clientEmployees.length;
        
        return {
          id: client.id,
          name: client.company_name || 'Unknown',
          industry: client.industry || 'Unknown',
          services: 'Identity Verification', // Default or placeholder
          completedCount,
          totalCount,
        };
      });
      setProjects(projectStats);

      setRecentActivity(activities.slice(0, 10)); // Top 10 recent
    };

    fetchData();
  }, []);

  const getEventIcon = (event) => {
    const ev = event.toLowerCase();
    if (ev.includes('completed') || ev.includes('approved')) return <CheckCircle2 size={16} color="#10b981" />;
    if (ev.includes('rejected') || ev.includes('escalated')) return <AlertTriangle size={16} color="#ef4444" />;
    return <Activity size={16} color="#3b82f6" />;
  };

  const slaSuccess =
    metrics.activeVerifications + metrics.completedToday > 0
      ? Math.round(
        (metrics.completedToday /
          (metrics.activeVerifications + metrics.completedToday)) *
        100
      )
      : 0;
  const completionRate = metrics.totalVerifications > 0 
    ? Math.round((metrics.completedVerifications / metrics.totalVerifications) * 100) 
    : 0;

  return (
    <div className="page-container" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.5s ease-out' }}>

      {/* Header */}
      <PageHeader 
        title="Operations Dashboard"
        subtitle="Overview of overall platform health, verification volumes, and real-time operations."
        icon={Activity}
      />

      {/* METRIC CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', animation: 'fadeIn 0.6s ease-out forwards' }}>
        <div className="card metric-card" onClick={() => navigate('/ops/clients')} style={{ padding: '24px', cursor: 'pointer', background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '100px', height: '100px', background: 'radial-gradient(circle, rgba(59,130,246,0.05) 0%, rgba(255,255,255,0) 70%)', transform: 'translate(30%, -30%)' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Clients</div>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(59,130,246,0.1)' }}><Building2 size={20} color="#3b82f6" /></div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-dark)', lineHeight: 1 }}>{metrics.totalClients}</div>
        </div>

        <div className="card metric-card" onClick={() => navigate('/ops/forms')} style={{ padding: '24px', cursor: 'pointer', background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '100px', height: '100px', background: 'radial-gradient(circle, rgba(139,92,246,0.05) 0%, rgba(255,255,255,0) 70%)', transform: 'translate(30%, -30%)' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Verifications</div>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(139,92,246,0.1)' }}><ShieldCheck size={20} color="#8b5cf6" /></div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-dark)', lineHeight: 1 }}>{metrics.activeVerifications}</div>
        </div>

        <div className="card metric-card" style={{ padding: '24px', background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '100px', height: '100px', background: 'radial-gradient(circle, rgba(16,185,129,0.05) 0%, rgba(255,255,255,0) 70%)', transform: 'translate(30%, -30%)' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Completed Today</div>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(16,185,129,0.1)' }}><CheckCircle2 size={20} color="#10b981" /></div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-dark)', lineHeight: 1 }}>{metrics.completedToday}</div>
        </div>

        <div className="card metric-card" onClick={() => navigate('/ops/tracking')} style={{ padding: '24px', cursor: 'pointer', background: 'linear-gradient(135deg, #ffffff 0%, #fef2f2 100%)', position: 'relative', overflow: 'hidden', borderColor: '#fee2e2' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '100px', height: '100px', background: 'radial-gradient(circle, rgba(239,68,68,0.05) 0%, rgba(255,255,255,0) 70%)', transform: 'translate(30%, -30%)' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#b91c1c', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Overdue (30 Mins)</div>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(239,68,68,0.1)' }}><Clock size={20} color="#ef4444" /></div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#ef4444', lineHeight: 1 }}>{metrics.slaBreached}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* PROJECT SNAPSHOT WIDGET */}
        <div className="card" style={{ padding: '24px', backgroundColor: '#fff', borderRadius: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#123178ff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building2 size={18} color="var(--primary-blue)" /> Project Snapshot
            </h2>
            <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '13px' }} onClick={() => navigate('/ops/clients')}>View All Projects</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '420px', overflowY: 'auto', paddingRight: '8px' }}>
            {projects.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-gray)', fontSize: '14px' }}>No ongoing projects to display.</div>
            ) : (
              projects.map((proj, idx) => (
                <div key={idx} style={{ padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', transition: 'all 0.2s', cursor: 'pointer' }} onClick={() => navigate(`/ops/clients/${proj.id}`)}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Building2 size={20} color="#3b82f6" />
                    </div>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-dark)' }}>{proj.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-gray)', marginTop: '2px' }}>Service Taken: {proj.services}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--primary-blue)' }}>
                      {proj.completedCount} <span style={{ fontSize: '13px', color: 'var(--text-gray)', fontWeight: 500 }}>/ {proj.totalCount}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-gray)' }}>Completed</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* QUICK ACTIONS WIDGET */}
          <div className="card" style={{ padding: '20px', backgroundColor: '#fff' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '16px' }}>Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button 
                className="btn btn-primary" 
                onClick={() => navigate('/ops/clients/create')} 
                style={{ width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <Building2 size={18} /> Create Client
              </button>
              <button 
                className="btn btn-outline" 
                onClick={() => navigate('/ops/forms')} 
                style={{ width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: '1px solid var(--primary-blue)', color: 'var(--primary-blue)' }}
              >
                <Users size={18} /> Add Employee
              </button>
            </div>
          </div>

          <div
            className="card"
            style={{
              padding: "20px",
              backgroundColor: "#fff",
              alignSelf: "start",
              height: "fit-content",
              width: "100%"
            }}
          >
          <h3
            style={{
              fontSize: "18px",
              fontWeight: 600,
              color: "var(--text-dark)",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <TrendingUp size={20} color="var(--primary-blue)" />
            Performance Analytics
          </h3>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              fontSize: "12px"
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "6px"
                }}
              >
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "var(--text-gray)"
                  }}
                >
                  Overdue Cases
                </span>

                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    color: "#10b981"
                  }}
                >
                  {slaSuccess}%
                </span>
              </div>

              <div
                style={{
                  height: "26px",
                  backgroundColor: "#e2e8f0",
                  borderRadius: "20px",
                  overflow: "hidden"
                }}
              >
                <div
                  style={{

                    height: "100%",
                    width: `${slaSuccess}%`,
                    backgroundColor: "#10b981"
                  }}
                />
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px",
                backgroundColor: "#f8fafc",
                borderRadius: "6px",
                border: "1px solid var(--border-color)"
              }}
            >
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "var(--text-gray)"
                }}
              >
                Completion Rate
              </span>

              <span
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "var(--primary-blue)"
                }}
              >
                {completionRate}%
              </span>
            </div>

            <div
              style={{
                padding: "12px",
                backgroundColor: "#f8fafc",
                borderRadius: "6px",
                border: "1px solid var(--border-color)",
                display: "flex",
                alignItems: "center",
                gap: "12px"
              }}
            >
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  backgroundColor: "#dbeafe",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <TrendingUp size={16} color="#3b82f6" />
              </div>

              <div>
                <div
                  style={{
                    fontSize: "14px",
                    color: "var(--text-gray)"
                  }}
                >
                  Weekly Throughput
                </div>

                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "var(--text-dark)"
                  }}
                >
                  {/* +18% vs last week */}
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};
