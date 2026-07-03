import React, { useEffect, useState } from "react";
import { ArrowLeft, User, PhoneCall, CheckCircle, Clock, Activity, AlertTriangle, ShieldCheck, History } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase, getSupabaseEmployees } from "../utils/supabase";
import { getExecutiveStats } from "../utils/executiveStats";

export const ExecutiveDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();



  // const exec = {
  //   name: 'Amitabh S.', id: id, status: 'Online', phone: '+91 98765 12345', email: 'amitabh@kpc.in',
  //   metrics: { cases: 28, completed: 8, pendingCalls: 3, avgTime: '2.4 Days', sla: '98%', rejected: 1 },
  //   analytics: { loginTime: '08:45 AM', logoutTime: '--', activeHours: '6h 15m', idleTime: '45m', onCallDuration: '2h 30m' },
  //   callPerformance: { total: 45, connected: 38, missed: 7, avgDuration: '3m 45s', otpSuccess: '92%' },
  //   skills: ['Identity Verification', 'Address Verification', 'Police Verification'],
  //   auditTimeline: [
  //     { action: 'Verification Completed', details: 'Form #V-0998 approved', time: '10:45 AM', type: 'completed' },
  //     { action: 'Status Updated', details: 'Form #V-1021 changed to In Progress', time: '09:30 AM', type: 'update' },
  //     { action: 'Notes Added', details: 'Called candidate, no response.', time: '09:15 AM', type: 'note' },
  //     { action: 'Task Accepted', details: 'Assigned Form #V-1021', time: '09:05 AM', type: 'assigned' }
  //   ],
  //   assignedCases: [
  //     { id: '#V-1021', employee: 'Rajiv Jhunjhunwala', company: 'TechCorp Solutions', status: 'In Progress', sla: '7+ Days' },
  //     { id: '#V-1024', employee: 'Sneha Patel', company: 'TechCorp Solutions', status: 'Call Pending', sla: '4-7 Days' }
  //   ]
  // };

  const [exec, setExec] = useState(null);

  const [stats, setStats] = useState({

    totalCompleted: 0,
    completedToday: 0,
    completedWeek: 0,
    completedMonth: 0,
    slaSuccess: 100,
  });
  const [assignedCases, setAssignedCases] = useState([]);

  useEffect(() => {

    async function load() {

      const { data: executive } = await supabase
        .from("executives")
        .select("*")
        .eq("id", id)
        .single();

      setExec({
        id: executive.id,
        name: executive.full_name,
        email: executive.email,
        phone: executive.mobile,
        status: executive.status,
        designation: executive.designation
      });

      const employees = await getSupabaseEmployees();

      const myCases = employees.filter(
        emp => emp.assigned_to === executive.id
      );

      setAssignedCases(myCases);

      setStats(
        getExecutiveStats(
          employees,
          id
        )
      );

    }

    load();

  }, [id]);


  if (!exec) {

    return <div>Loading...</div>;

  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button onClick={() => navigate('/ops/monitoring')} style={{ padding: '8px', borderRadius: '50%', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 style={{ fontSize: '24px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {exec.name} <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#166534' }} title={exec.status} />
          </h1>
          <p style={{ color: 'var(--text-gray)', fontSize: '14px' }}>Executive ID: {exec.id} • {exec.email} • {exec.phone}</p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px' }}>
          <button className="btn btn-outline" >Reassign Cases</button>
          <button className="btn btn-primary">Download Report</button>
        </div>
      </div>

      {/* Analytics & Skills Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>

        {/* Availability & Call Performance */}
        {/* <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="card" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><Clock size={18} color="var(--primary-blue)" /> Availability Analytics</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
              <div><span style={{ fontSize: '11px', color: 'var(--text-gray)', fontWeight: 600 }}>LOGIN TIME</span><div style={{ fontSize: '16px', fontWeight: 600 }}>{exec.analytics.loginTime}</div></div>
              <div><span style={{ fontSize: '11px', color: 'var(--text-gray)', fontWeight: 600 }}>ACTIVE HOURS</span><div style={{ fontSize: '16px', fontWeight: 600, color: '#166534' }}>{exec.analytics.activeHours}</div></div>
              <div><span style={{ fontSize: '11px', color: 'var(--text-gray)', fontWeight: 600 }}>IDLE TIME</span><div style={{ fontSize: '16px', fontWeight: 600, color: '#dc2626' }}>{exec.analytics.idleTime}</div></div>
              <div><span style={{ fontSize: '11px', color: 'var(--text-gray)', fontWeight: 600 }}>ON CALL DURATION</span><div style={{ fontSize: '16px', fontWeight: 600 }}>{exec.analytics.onCallDuration}</div></div>
              <div><span style={{ fontSize: '11px', color: 'var(--text-gray)', fontWeight: 600 }}>LOGOUT TIME</span><div style={{ fontSize: '16px', fontWeight: 600 }}>{exec.analytics.logoutTime}</div></div>
            </div>
          </div>

          <div className="card" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><PhoneCall size={18} color="var(--primary-blue)" /> Call Performance Dashboard</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
              <div><span style={{ fontSize: '11px', color: 'var(--text-gray)', fontWeight: 600 }}>TOTAL CALLS</span><div style={{ fontSize: '20px', fontWeight: 700 }}>{exec.callPerformance.total}</div></div>
              <div><span style={{ fontSize: '11px', color: 'var(--text-gray)', fontWeight: 600 }}>CONNECTED</span><div style={{ fontSize: '20px', fontWeight: 700, color: '#166534' }}>{exec.callPerformance.connected}</div></div>
              <div><span style={{ fontSize: '11px', color: 'var(--text-gray)', fontWeight: 600 }}>MISSED</span><div style={{ fontSize: '20px', fontWeight: 700, color: '#dc2626' }}>{exec.callPerformance.missed}</div></div>
              <div><span style={{ fontSize: '11px', color: 'var(--text-gray)', fontWeight: 600 }}>AVG DURATION</span><div style={{ fontSize: '20px', fontWeight: 700 }}>{exec.callPerformance.avgDuration}</div></div>
              <div><span style={{ fontSize: '11px', color: 'var(--text-gray)', fontWeight: 600 }}>OTP SUCCESS</span><div style={{ fontSize: '20px', fontWeight: 700, color: '#166534' }}>{exec.callPerformance.otpSuccess}</div></div>
            </div>
          </div>
        </div> */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(6,minmax(200px,1fr))",
            gap: "36px"
          }}
        >

          {[
            {
              title: "TOTAL COMPLETED",
              value: stats.totalCompleted,
              color: "#2563eb"
            },
            {
              title: "COMPLETED TODAY",
              value: stats.completedToday,
              color: "#10b981"
            },
            {
              title: "THIS WEEK",
              value: stats.completedWeek,
              color: "#0ea5e9"
            },
            {
              title: "THIS MONTH",
              value: stats.completedMonth,
              color: "#8b5cf6"
            },
            {
              title: "Overdue SUCCESS",
              value: `${stats.slaSuccess}%`,
              color: "#16a34a"
            }
          ].map(card => (

            <div
              key={card.title}
              className="card"
              style={{
                padding: "18px",
                borderLeft: `4px solid ${card.color}`
              }}
            >

              <div
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#64748b"
                }}
              >
                {card.title}
              </div>

              <div
                style={{
                  fontSize: "30px",
                  fontWeight: 700,
                  color: card.color,
                  marginTop: "10px"
                }}
              >
                {card.value}
              </div>

            </div>

          ))}

        </div>

        {/* Skill Matrix */}
        {/* <div className="card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '16px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}><ShieldCheck size={18} color="var(--primary-blue)" /> Executive Skill Matrix</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {['Identity Verification', 'Address Verification', 'Police Verification', 'Background Verification', 'Criminal Record'].map(skill => {
              const trained = (exec.skills || []).includes(skill);
              return (
                <div key={skill} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {trained ? <CheckCircle size={16} color="#166534" /> : <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid var(--border-color)' }} />}
                  <span style={{ fontSize: '14px', color: trained ? 'var(--text-dark)' : 'var(--text-gray)', fontWeight: trained ? 500 : 400 }}>{skill}</span>
                </div>
              )
            })}
          </div>
        </div> */}

      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          width: "100%"
        }}
      >

        {/* Assigned Cases */}
        <div
          className="card"
          style={{
            padding: "24px",
            width: "100%",
            maxWidth: "1200px"
          }}
        >
          <h2 style={{ fontSize: '26px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={20} color="var(--primary-blue)" />Currently Assigned Cases ({assignedCases.length})
          </h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-gray)', fontSize: '22px' }}>
                <th style={{ paddingBottom: '12px' }}>VERIFICATION ID</th>
                <th style={{ paddingBottom: '12px' }}>EMPLOYEE & COMPANY</th>
                <th style={{ paddingBottom: '12px' }}>STATUS</th>
                {/* <th style={{ paddingBottom: '12px' }}>SLA Aging</th> */}
              </tr>
            </thead>
            <tbody>
              {assignedCases.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ fontSize: '16px', padding: '16px 0', fontWeight: 600 }}>{c.id}</td>
                  <td style={{ padding: '16px 0' }}>
                    <div style={{ fontSize: '20px', fontWeight: 500 }}>{c.name}</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-gray)' }}>{c.company}</div>
                  </td>
                  <td style={{ fontSize: '20px', padding: '16px 0' }}><span className={`badge badge-${c.status.toLowerCase().replace(' ', '-')}`}>{c.status}</span></td>
                  <td style={{ fontSize: '20px', padding: '16px 0', color: c.sla === '7+ Days' ? '#dc2626' : 'inherit', fontWeight: 600 }}>{c.sla}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Audit Timeline */}
        {/* <div className="card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '16px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={20} color="var(--primary-blue)" /> Executive Audit Timeline
          </h2>
          <div style={{ borderLeft: '2px solid var(--border-color)', marginLeft: '8px', paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {[]
              .map((event, index) => (
                <div key={idx} style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '-21px', top: '2px', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: event.type === 'completed' ? '#166534' : 'var(--primary-blue)' }} />
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>{event.action}</div>
                  <div style={{ fontSize: '13px', marginTop: '2px', color: 'var(--text-dark)' }}>{event.details}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-gray)', marginTop: '4px' }}>{event.time}</div>
                </div>
              ))}
          </div>
        </div> */}

      </div>
    </div>
  );
};
