import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Inbox, Search, Filter, RotateCw, AlertTriangle,
  ShieldCheck, FileText, CheckCircle2, XCircle,
  Eye, UserPlus, File, X
} from 'lucide-react';
import { mockDb } from '../../utils/mockDb';
import {
  getSupabaseEmployees,
  getSupabaseEmployeeById,
  updateSupabaseEmployee
} from "../../utils/supabase";

export const AvailableTasks = () => {
  const navigate = useNavigate();
  const [availableTasks, setAvailableTasks] = useState([]);
  const [assignedTasks, setAssignedTasks] = useState([]); // tasks taken by some executive
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [serviceFilter, setServiceFilter] = useState('All');

  // Drawer & Modal states
  const [previewTask, setPreviewTask] = useState(null);
  const [assignConfirmTask, setAssignConfirmTask] = useState(null);

  // Exec Info
  const session =
    JSON.parse(localStorage.getItem("kpc_session")) || {};
  const EXEC_NAME = session.userName || 'Amitabh S.';

  console.log("SESSION =", session);

  const fetchTasks = async () => {
    const all = await getSupabaseEmployees();
    // Unassigned tasks: no 'Executive Assigned' timeline event
    // const unassigned = all.filter(e =>
    //   (e.status === 'pending' || e.status === 'submitted') &&
    //   !e.timeline.some(t => t.event === 'Executive Assigned')
    // );
    // // Already assigned (active, not completed)
    // const assigned = all.filter(e =>
    //   e.timeline.some(t => t.event === 'Executive Assigned') &&
    //   !['completed', 'approved', 'rejected'].includes(e.status)
    // );

    const unassigned = all.filter(e =>
      (e.status === "pending" || e.status === "submitted") &&
      !e.assigned_to
    );

    const assigned = all.filter(e =>
      e.assigned_to &&
      !["completed", "approved", "rejected"].includes(e.status)
    );

    setAvailableTasks(unassigned);
    setAssignedTasks(assigned);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Filter Logic
  const filteredTasks = useMemo(() => {
    return availableTasks.filter(task => {
      const matchesSearch = task.name.toLowerCase().includes(searchTerm.toLowerCase()) || task.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPriority = priorityFilter === 'All' || task.priority === priorityFilter;

      const taskService = task.services ? task.services[0] : 'Identity Verification';
      const matchesService = serviceFilter === 'All' || taskService === serviceFilter;

      return matchesSearch && matchesPriority && matchesService;
    });
  }, [availableTasks, searchTerm, priorityFilter, serviceFilter]);

  // Metrics
  const totalAvailable = availableTasks.length;
  const highPriority = availableTasks.filter(t => t.priority === 'Urgent' || t.priority === 'High').length;
  const slaRisk = availableTasks.filter(t => t.slaStatus === '7+ Days' || t.slaStatus === '4-7 Days').length;
  const today = new Date().toISOString().split('T')[0];
  const unassignedToday = availableTasks.filter(t => t.createdDate && t.createdDate.startsWith(today)).length;
  const policeVerification = availableTasks.filter(t => t.services && t.services.includes('Police Verification')).length;
  const backgroundVerification = availableTasks.filter(t => t.services && t.services.includes('Background Check')).length;

  // Assignment Logic
  const handleAssignTask = async (task) => {
    // 1. Add Timeline Event
    const currentTimeline = task.timeline || [];
    currentTimeline.push({
      event: 'Executive Assigned',
      user: 'System',
      date: new Date().toISOString(),
      details: EXEC_NAME
    });

    console.log(session);
    // 2. Add Audit Event
    const currentAudit = task.audit || [];
    currentAudit.push({
      user: EXEC_NAME,
      action: `Self-assigned task`,
      date: new Date().toISOString()
    });

    // 3. Update status in Supabase and local storage
    // await updateSupabaseEmployee(task.id, {
    //   status: 'assigned',
    //   timeline: currentTimeline,
    //   audit: currentAudit
    // });
    console.log("Assigning to:", session.userId);
    await updateSupabaseEmployee(task.id, {
      status: "assigned",
      assigned_to: session.userId,
      assigned_name: EXEC_NAME,
      assigned_at: new Date().toISOString(),
      timeline: currentTimeline,
      audit: currentAudit
    });

    console.log("Update completed");
    const updated = await getSupabaseEmployeeById(task.id);

    console.log(updated);
    setAssignConfirmTask(null);
    setPreviewTask(null);
    fetchTasks(); // Refresh list to remove it
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Urgent': return '#ef4444';
      case 'High': return '#f97316';
      case 'Medium': return '#3b82f6';
      case 'Low': return '#64748b';
      default: return '#64748b';
    }
  };

  // Helper for document visual indicators
  // const renderDocIcons = (documents = []) => {
  //   const requiredDocs = ['Aadhaar Card', 'PAN Card', 'Voter ID', 'Birth Certificate', 'School Leaving', 'Address Proof'];

  //   // Simplistic visual representation
  //   return (
  //     <div style={{ display: 'flex', gap: '4px' }}>
  //       {requiredDocs.map((docType, idx) => {
  //         const doc = documents.find(d => d.type.includes(docType.split(' ')[0])); // fuzzy match
  //         let color = '#cbd5e1'; // gray (missing)
  //         if (doc) {
  //           if (doc.status === 'Rejected' || doc.status === 'Re-upload Required') color = '#ef4444'; // red
  //           else color = '#3b82f6'; // blue (uploaded)
  //         }
  //         return (
  //           <div key={idx} title={docType} style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: color }}></div>
  //         );
  //       })}
  //     </div>
  //   );
  // };

  // 2. Fix doc blocks — replace the entire renderDocIcons function:
  const renderDocIcons = (documents = []) => {
    if (!documents || documents.length === 0) {
      return (
        <div style={{ fontSize: '11px', color: 'var(--text-gray)' }}>No docs</div>
      );
    }

    return (
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
        {documents.map((doc, idx) => {
          let color = '#3b82f6'; // blue = uploaded
          if (doc.status === 'Rejected' || doc.status === 'Re-upload Required') {
            color = '#ef4444'; // red = rejected
          }
          return (
            <div
              key={idx}
              title={doc.type}
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '2px',
                backgroundColor: color
              }}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="page-container" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.5s ease-out' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Inbox size={26} color="var(--primary-blue)" />
            Available Tasks Queue
          </h1>
          <p style={{ color: 'var(--text-gray)', marginTop: '6px', fontSize: '14px' }}>
            Self-assign pending verifications. Claiming a task locks it exclusively to you.
          </p>
        </div>
        <button className="btn btn-outline" onClick={fetchTasks} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <RotateCw size={16} /> Refresh Queue
        </button>
      </div>

      {/* TOP METRIC CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
        <div className="card metric-card" style={{ padding: '16px', backgroundColor: '#fff', borderLeft: '4px solid #3b82f6' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-gray)', textTransform: 'uppercase' }}>Total Available</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-dark)', marginTop: '8px' }}>{totalAvailable}</div>
        </div>
        <div className="card metric-card" style={{ padding: '16px', backgroundColor: '#fff', borderLeft: '4px solid #ef4444' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-gray)', textTransform: 'uppercase' }}>High Priority</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#ef4444', marginTop: '8px' }}>{highPriority}</div>
        </div>
        <div className="card metric-card" style={{ padding: '16px', backgroundColor: '#fff', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-gray)', textTransform: 'uppercase' }}>SLA Risk</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#d97706', marginTop: '8px' }}>{slaRisk}</div>
        </div>
        <div className="card metric-card" style={{ padding: '16px', backgroundColor: '#fff', borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-gray)', textTransform: 'uppercase' }}>Unassigned Today</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-dark)', marginTop: '8px' }}>{unassignedToday}</div>
        </div>
        {/* <div className="card metric-card" style={{ padding: '16px', backgroundColor: '#fff', borderLeft: '4px solid #8b5cf6' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-gray)', textTransform: 'uppercase' }}>Police Queue</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-dark)', marginTop: '8px' }}>{policeVerification}</div>
        </div> */}
        {/* <div className="card metric-card" style={{ padding: '16px', backgroundColor: '#fff', borderLeft: '4px solid #06b6d4' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-gray)', textTransform: 'uppercase' }}>BGC Queue</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-dark)', marginTop: '8px' }}>{backgroundVerification}</div>
        </div> */}
      </div>

      {/* FILTER BAR */}
      <div className="card" style={{ padding: '16px', backgroundColor: '#fff', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '250px' }}>
          <Search size={18} color="var(--text-light)" />
          <input
            type="text"
            placeholder="Search by Employee Name or ID..."
            className="input-field"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <select className="select-input" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} style={{ padding: '8px', width: '160px' }}>
          <option value="All">All Priorities</option>
          <option value="Urgent">Urgent</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>

        <select className="select-input" value={serviceFilter} onChange={e => setServiceFilter(e.target.value)} style={{ padding: '8px', width: '200px' }}>
          <option value="All">All Services</option>
          <option value="Identity Verification">Identity Verification</option>
          <option value="Police Verification">Police Verification</option>
          <option value="Background Check">Background Check</option>
        </select>

        <button className="btn btn-outline" onClick={() => { setSearchTerm(''); setPriorityFilter('All'); setServiceFilter('All'); }} style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Filter size={14} /> Reset
        </button>
      </div>

      {/* MAIN TABLE */}
      <div className="card" style={{ backgroundColor: '#fff', overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', minWidth: '1000px', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 10 }}>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 600, color: 'var(--text-gray)' }}>EMPLOYEE</th>
                <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 600, color: 'var(--text-gray)' }}>COMPANY</th>
                <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 600, color: 'var(--text-gray)' }}>SERVICE TYPE</th>
                <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 600, color: 'var(--text-gray)' }}>SUBMITTED DATE</th>
                <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 600, color: 'var(--text-gray)' }}>PRIORITY</th>
                <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 600, color: 'var(--text-gray)' }}>SLA AGING</th>
                <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 600, color: 'var(--text-gray)' }}>DOCS</th>
                <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 600, color: 'var(--text-gray)', textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ padding: '64px 24px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CheckCircle2 size={32} color="#10b981" />
                      </div>
                      <div>
                        <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-dark)' }}>All available tasks have been assigned.</h3>
                        <p style={{ fontSize: '13px', color: 'var(--text-gray)', marginTop: '4px' }}>You're all caught up! Refresh the queue to check for new tasks.</p>
                      </div>
                      <button className="btn btn-outline" onClick={fetchTasks} style={{ marginTop: '8px' }}>Refresh Queue</button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTasks.map(task => {
                  // const service = task.services ? task.services[0] : 'Identity Verification';
                  const services = Array.isArray(task.services)
                    ? task.services
                    : [];
                  return (
                    <tr key={task.id} className="table-row-hover" style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-dark)' }}>{task.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-gray)' }}>{task.id}</div>
                      </td>
                      <td style={{ padding: '16px', fontSize: '13px', color: 'var(--text-gray)' }}>{task.company || 'N/A'}</td>
                      {/* <td style={{ padding: '16px', fontSize: '13px', color: 'var(--text-dark)' }}>{service}</td>
                       */}
                      <td style={{ padding: "16px" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            flexWrap: "nowrap",
                          }}
                        >
                          {services.slice(0, 2).map((service, index) => (
                            <span
                              key={index}
                              style={{
                                padding: "4px 10px",
                                background: "#EEF4FF",
                                color: "#2563eb",
                                borderRadius: "12px",
                                fontSize: "11px",
                                fontWeight: 600,
                                whiteSpace: "nowrap",
                              }}
                            >
                              {service}
                            </span>
                          ))}

                          {services.length > 2 && (
                            <span
                              title={services.slice(2).join(", ")}
                              style={{
                                padding: "4px 10px",
                                background: "#F3F4F6",
                                color: "#374151",
                                borderRadius: "12px",
                                fontSize: "11px",
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                            >
                              +{services.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      {/* // 1. Fix submitted date — in the table row: */}
                      <td style={{ padding: '16px', fontSize: '13px', color: 'var(--text-gray)' }}>
                        {task.createdDate   // ⬅️ was task.submittedDate
                          ? new Date(task.createdDate).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
                          : 'N/A'}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: getPriorityColor(task.priority), padding: '4px 8px', borderRadius: '4px', backgroundColor: `${getPriorityColor(task.priority)}15` }}>
                          {task.priority || 'Medium'}
                        </span>
                      </td>
                      <td style={{ padding: '16px', fontSize: '13px' }}>
                        <span style={{ color: task.slaStatus?.includes('7+') ? '#ef4444' : 'var(--text-dark)', fontWeight: task.slaStatus?.includes('7+') ? 600 : 400 }}>
                          {task.slaStatus || 'On Track'}
                        </span>
                      </td>
                      <td style={{ padding: '16px' }}>
                        {renderDocIcons(task.documents)}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button className="btn btn-outline" onClick={() => setPreviewTask(task)} style={{ padding: '6px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Eye size={14} /> Preview
                          </button>
                          <button className="btn btn-primary" onClick={() => setAssignConfirmTask(task)} style={{ padding: '6px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <UserPlus size={14} /> Assign To Me
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

      {/* ALREADY ASSIGNED TASKS */}
      {assignedTasks.length > 0 && (
        <div className="card" style={{ backgroundColor: '#fff', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#f8fafc' }}>
            <ShieldCheck size={16} color="#10b981" />
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-dark)' }}>Already Assigned — Active Cases</h3>
            <span style={{ fontSize: '12px', backgroundColor: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>{assignedTasks.length} cases</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', minWidth: '900px', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ backgroundColor: '#f8fafc' }}>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 600, color: 'var(--text-gray)' }}>EMPLOYEE</th>
                  <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 600, color: 'var(--text-gray)' }}>COMPANY</th>
                  <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 600, color: 'var(--text-gray)' }}>SERVICE</th>
                  <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 600, color: 'var(--text-gray)' }}>ASSIGNED TO</th>
                  <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 600, color: 'var(--text-gray)' }}>CALL STATUS</th>
                  <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 600, color: 'var(--text-gray)' }}>CASE STATUS</th>
                </tr>
              </thead>
              <tbody>
                {assignedTasks.map(task => {
                  // const assignEvent = task.timeline?.find(t => t.event === 'Executive Assigned');
                  // const execName = assignEvent?.details || 'Unknown';
                  const execName = task.assigned_name || "Unknown";
                  const isMe = task.assigned_to === session.userId;

                  const callEvents = (task.timeline || []).filter(t => t.event?.startsWith('Call '));
                  const lastCall = callEvents.length > 0 ? callEvents[callEvents.length - 1] : null;
                  let callLabel = 'No call yet';
                  let callColor = '#94a3b8';
                  if (lastCall) {
                    if (lastCall.callReceived && lastCall.otpReceived) { callLabel = 'OTP Received ✓'; callColor = '#15803d'; }
                    else if (lastCall.callReceived) { callLabel = 'Call Rcvd — OTP Pending'; callColor = '#d97706'; }
                    else { callLabel = 'Call Not Answered'; callColor = '#dc2626'; }
                  }

                  return (
                    <tr key={task.id} style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: isMe ? '#f0fdf4' : 'transparent' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-dark)' }}>{task.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-gray)' }}>{task.id}</div>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--text-gray)' }}>{task.company || 'N/A'}</td>
                      <td style={{ padding: '14px 16px', fontSize: '12px', color: 'var(--text-dark)' }}>{task.services?.[0] || 'N/A'}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '28px', height: '28px', borderRadius: '50%',
                            backgroundColor: isMe ? '#dcfce7' : '#dbeafe',
                            color: isMe ? '#15803d' : '#1d4ed8',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '10px', fontWeight: 700, flexShrink: 0
                          }}>
                            {execName.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-dark)' }}>{execName}</div>
                            {isMe && <div style={{ fontSize: '10px', color: '#15803d', fontWeight: 600 }}>← You</div>}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: callColor }}>{callLabel}</span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span className={`badge badge-${task.status}`}>{task.status?.replace('-', ' ').toUpperCase()}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
