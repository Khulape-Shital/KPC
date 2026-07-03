import React, { useState, useEffect } from 'react';
import { Users, Building2, ShieldCheck, AlertTriangle, TrendingUp, Target, Activity, CheckCircle2, Clock } from 'lucide-react';
import { getSupabaseEmployees, getSupabaseClients } from '../../utils/supabase';
import { mockDb } from '../../utils/mockDb';
import { useNavigate } from 'react-router-dom';

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '36px', fontWeight: 700, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Activity size={26} color="var(--primary-blue)" />
            Operations Dashboard
          </h1>
          <p style={{ color: 'var(--text-gray)', marginTop: '6px', fontSize: '18px' }}>
            Overview of overall platform health, verification volumes, and real-time operations.
          </p>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', animation: 'fadeIn 0.6s ease-out forwards' }}>
        <div className="card metric-card" onClick={() => navigate('/ops/clients')} style={{ padding: '24px', cursor: 'pointer', background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '100px', height: '100px', background: 'radial-gradient(circle, rgba(59,130,246,0.05) 0%, rgba(255,255,255,0) 70%)', transform: 'translate(30%, -30%)' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Clients</div>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(59,130,246,0.1)' }}><Building2 size={20} color="#3b82f6" /></div>
          </div>
          <div style={{ fontSize: '36px', fontWeight: 700, color: 'var(--text-dark)', lineHeight: 1 }}>{metrics.totalClients}</div>
        </div>

        <div className="card metric-card" onClick={() => navigate('/ops/forms')} style={{ padding: '24px', cursor: 'pointer', background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '100px', height: '100px', background: 'radial-gradient(circle, rgba(139,92,246,0.05) 0%, rgba(255,255,255,0) 70%)', transform: 'translate(30%, -30%)' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Verifications</div>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(139,92,246,0.1)' }}><ShieldCheck size={20} color="#8b5cf6" /></div>
          </div>
          <div style={{ fontSize: '36px', fontWeight: 700, color: 'var(--text-dark)', lineHeight: 1 }}>{metrics.activeVerifications}</div>
        </div>

        <div className="card metric-card" style={{ padding: '24px', background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '100px', height: '100px', background: 'radial-gradient(circle, rgba(16,185,129,0.05) 0%, rgba(255,255,255,0) 70%)', transform: 'translate(30%, -30%)' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Completed Today</div>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(16,185,129,0.1)' }}><CheckCircle2 size={20} color="#10b981" /></div>
          </div>
          <div style={{ fontSize: '36px', fontWeight: 700, color: 'var(--text-dark)', lineHeight: 1 }}>{metrics.completedToday}</div>
        </div>

        <div className="card metric-card" onClick={() => navigate('/ops/tracking')} style={{ padding: '24px', cursor: 'pointer', background: 'linear-gradient(135deg, #ffffff 0%, #fef2f2 100%)', position: 'relative', overflow: 'hidden', borderColor: '#fee2e2' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '100px', height: '100px', background: 'radial-gradient(circle, rgba(239,68,68,0.05) 0%, rgba(255,255,255,0) 70%)', transform: 'translate(30%, -30%)' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#b91c1c', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Overdue (30 Mins)</div>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(239,68,68,0.1)' }}><Clock size={20} color="#ef4444" /></div>
          </div>
          <div style={{ fontSize: '36px', fontWeight: 700, color: '#ef4444', lineHeight: 1 }}>{metrics.slaBreached}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* RECENT ACTIVITY LOG */}
        <div className="card" style={{ padding: '24px', backgroundColor: '#fff', borderRadius: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '35px', fontWeight: 700, color: '#123178ff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={18} color="var(--primary-blue)" /> Platform Activity Stream
            </h2>
            {/* <button className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => navigate('/ops/tracking')}>View Full Log</button> */}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {recentActivity.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-gray)', fontSize: '24px' }}>No recent activity to display.</div>
            ) : (
              recentActivity.map((act, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '12px', paddingBottom: '16px', borderBottom: idx !== recentActivity.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                    {getEventIcon(act.event)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-dark)' }}>{act.event}</div>
                      <div style={{ fontSize: '18px', color: 'var(--text-gray)' }}>{new Date(act.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</div>
                    </div>
                    <div style={{ fontSize: '20px', color: 'var(--text-gray)', marginTop: '2px' }}>
                      <span style={{ fontWeight: 500, color: 'var(--text-dark)' }}>{act.empName}</span> ({act.empId}) • {act.company}
                    </div>
                    {act.details && (
                      <div style={{ fontSize: '22px', color: 'var(--text-gray)', marginTop: '4px', fontStyle: 'italic' }}>
                        "{act.details}"
                      </div>
                    )}
                    <div style={{ fontSize: '20px', color: 'var(--text-light)', marginTop: '4px' }}>By: {act.user}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: "20px",
            backgroundColor: "#fff",
            alignSelf: "start",
            height: "fit-content"
          }}
        >
          <h3
            style={{
              fontSize: "30px",
              fontWeight: 600,
              color: "var(--text-dark)",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <TrendingUp size={38} color="var(--primary-blue)" />
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
                    fontSize: "22px",
                    fontWeight: 600,
                    color: "var(--text-gray)"
                  }}
                >
                  Overdue Cases
                </span>

                <span
                  style={{
                    fontSize: '22px',
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
                  fontSize: "22px",
                  fontWeight: 600,
                  color: "var(--text-gray)"
                }}
              >
                Completion Rate
              </span>

              <span
                style={{
                  fontSize: "22px",
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
                    fontSize: "25px",
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
        {/* QUICK ACTIONS & NOTICES */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* <div className="card" style={{ padding: '20px', backgroundColor: '#fff' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '16px' }}>Quick Actions</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button className="btn btn-primary" onClick={() => navigate('/ops/clients')} style={{ display: 'flex', justifyContent: 'flex-start', padding: '12px', backgroundColor: '#f8fafc', color: 'var(--text-dark)', border: '1px solid var(--border-color)' }}>
                Add New Client
              </button>
              <button className="btn btn-primary" onClick={() => navigate('/ops/monitoring')} style={{ display: 'flex', justifyContent: 'flex-start', padding: '12px', backgroundColor: '#f8fafc', color: 'var(--text-dark)', border: '1px solid var(--border-color)' }}>
                Rebalance Workloads
              </button>
              <button className="btn btn-primary" onClick={() => navigate('/ops/tracking')} style={{ display: 'flex', justifyContent: 'flex-start', padding: '12px', backgroundColor: '#f8fafc', color: 'var(--text-dark)', border: '1px solid var(--border-color)' }}>
                Review SLA Breaches
              </button>
            </div>
          </div> */}

          {/* <div className="card" style={{ padding: '20px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#1e3a8a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertTriangle size={16} /> System Notice
            </h2>
            <p style={{ fontSize: '13px', color: '#1e40af', lineHeight: '1.5' }}>
              The verification tracking dashboard now includes real-time database syncing. Reports module has been deprecated and merged into the Tracking and Monitoring dashboards for centralized access.
            </p>
          </div> */}
        </div>
      </div>
    </div>
  );
};
