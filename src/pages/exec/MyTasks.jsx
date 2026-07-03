import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  List, Search, Filter, RotateCw, AlertTriangle,
  PhoneCall, CheckCircle2, PlaySquare,
  Clock, Download, Briefcase, Activity, Eye, X, User
} from 'lucide-react';
// import { mockDb } from '../../utils/mockDb';
import { getSupabaseEmployees } from '../../utils/supabase';

export const MyTasks = () => {
  const navigate = useNavigate();
  const [assignedTasks, setAssignedTasks] = useState([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');

  // Drawer state
  const [previewTask, setPreviewTask] = useState(null);

  const session = JSON.parse(localStorage.getItem("kpc_session")) || {};
  // const EXEC_NAME = session.userName || 'Amitabh S.';
  const EXEC_ID = session.userId;
  console.log("SESSION =", session);

  const fetchTasks = async () => {
    const all = await getSupabaseEmployees();


    console.log("ALL EMPLOYEES", all);

    all.forEach(emp => {
      console.log(emp.employeeCode, {
        status: emp.status,
        assigned_to: emp.assigned_to,
        assigned_name: emp.assigned_name,
      });
    });
    // Filter cases assigned to this executive and NOT completed/approved/rejected
    // const activeCases = all.filter(emp => {
    //   const assignmentEvent = emp.timeline?.find(t => t.event === 'Executive Assigned');
    //   const isMine = assignmentEvent && assignmentEvent.details === EXEC_NAME;
    //   const isActive = !['completed', 'approved', 'rejected'].includes(emp.status);
    //   return isMine && isActive;
    // });

    // const session =
    //   JSON.parse(localStorage.getItem("kpc_session"));

    // const EXEC_ID = session.userId;  

    // console.log("EXEC_ID:", EXEC_ID);
    const activeCases = all.filter(emp => {

      const isMine =
        emp.assigned_to === EXEC_ID;

      const isActive =
        !["completed", "approved", "rejected"]
          .includes(
            (emp.status || "").toLowerCase()
          );

      return isMine && isActive;

    });

    console.log("EXEC_ID =", EXEC_ID);

    all.forEach(emp => {
      console.log({
        emp: emp.employeeCode,
        assigned_to: emp.assigned_to,
        status: emp.status,
        match: emp.assigned_to === EXEC_ID
      });
    });

    setAssignedTasks(activeCases);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Filtering Logic
  const filteredTasks = useMemo(() => {
    return assignedTasks.filter(task => {
      const matchesSearch =
        task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.employeeCode.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || task.status === statusFilter.toLowerCase().replace(' ', '-');
      const matchesPriority = priorityFilter === 'All' || task.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [assignedTasks, searchTerm, statusFilter, priorityFilter]);

  // Metrics
  const totalActive = assignedTasks.length;
  const inProgress = assignedTasks.filter(t => t.status === 'in-progress').length;
  const callsPending = assignedTasks.filter(t => !(t.timeline || []).some(ev => ev.event?.startsWith('Call '))).length;
  const callReceived = assignedTasks.filter(t => (t.timeline || []).some(ev => ev.callReceived === true)).length;
  const slaRisk = assignedTasks.filter(t => t.slaStatus === '7+ Days' || t.slaStatus === '4-7 Days' || t.priority === 'Urgent').length;

  // Completed Today
  const [completedToday, setCompletedToday] = useState(0);

  useEffect(() => {
    const calcCompleted = async () => {
      const today = new Date().toISOString().split('T')[0];
      const allEmployees = await getSupabaseEmployees();
      const count = allEmployees.filter(e => {

        const isMine = e.assigned_to === EXEC_ID;

        if (!isMine) return false;

        if (
          !["completed", "approved", "rejected"]
            .includes((e.status || "").toLowerCase())
        ) return false;

        const completionEvent =
          e.timeline?.find(t =>
            t.event === "Verification Completed" ||
            t.event === "Verification Approved" ||
            t.event === "Verification Rejected"
          );

        return (
          completionEvent &&
          completionEvent.date.startsWith(today)
        );

      }).length;
      setCompletedToday(count);
    };
    calcCompleted();
  }, [assignedTasks]);

  // Helper Functions
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Urgent': return '#ef4444';
      case 'High': return '#f97316';
      case 'Medium': return '#3b82f6';
      case 'Low': return '#64748b';
      default: return '#64748b';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'assigned': return 'badge-assigned';
      case 'call-pending': return 'badge-call-pending';
      case 'otp-received': return 'badge-otp-received';
      case 'in-progress': return 'badge-in-progress';
      case 'escalated': return 'badge-rejected';
      default: return 'badge-assigned';
    }
  };

  const getSlaRiskColor = (status, priority) => {
    if (status === '7+ Days' || priority === 'Urgent') return '#ef4444'; // Red
    if (status === '4-7 Days' || priority === 'High') return '#f59e0b'; // Amber
    return '#10b981'; // Green
  };

  const getPendingAction = (task) => {
    const timeline = task.timeline || [];
    const lastCall = [...timeline].reverse().find(t => t.event?.startsWith('Call '));

    if (!lastCall) {
      return { label: 'Call Pending', color: '#f59e0b', bg: '#fef3c7' };
    }
    if (lastCall.callReceived && lastCall.otpReceived) {
      return { label: 'OTP Received ✓', color: '#10b981', bg: '#ecfdf5' };
    }
    if (lastCall.callReceived && !lastCall.otpReceived) {
      return { label: 'OTP Not Shared', color: '#f59e0b', bg: '#fef3c7' };
    }
    // Call not received
    return { label: 'Call Not Answered', color: '#ef4444', bg: '#fee2e2' };
  };

  const handleExport = () => {
    if (filteredTasks.length === 0) {
      alert("No tasks to export.");
      return;
    }
    
    const headers = ["Employee ID", "Employee Name", "Company", "Service", "Status", "Priority", "SLA Status", "Last Activity"];
    
    const csvRows = filteredTasks.map(task => {
      const service = task.services && task.services.length ? task.services[0] : 'Identity Verification';
      const lastEvent = task.timeline && task.timeline.length > 0 ? task.timeline[task.timeline.length - 1] : null;
      const lastActivity = lastEvent ? `${lastEvent.event} (${new Date(lastEvent.date).toLocaleDateString()})` : 'Assigned';
      
      return [
        `"${task.employeeCode || task.id}"`,
        `"${task.name}"`,
        `"${task.company || 'N/A'}"`,
        `"${service}"`,
        `"${task.status || 'assigned'}"`,
        `"${task.priority || 'Medium'}"`,
        `"${task.slaStatus || 'On Track'}"`,
        `"${lastActivity}"`
      ].join(",");
    });
    
    const csvContent = [headers.join(","), ...csvRows].join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `my_tasks_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="page-container" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.5s ease-out' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <List size={26} color="var(--primary-blue)" />
            My Tasks
          </h1>
          <p style={{ color: 'var(--text-gray)', marginTop: '6px', fontSize: '14px' }}>
            Manage your assigned verification cases. Prioritize SLA risks and pending calls.
          </p>
        </div>
      </div>

      {/* TOP METRIC CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
        <div className="card metric-card" style={{ padding: '16px', backgroundColor: '#fff', borderTop: '4px solid #0369a1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-gray)' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>My Active Cases</span>
            <Briefcase size={16} />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-dark)', marginTop: '12px' }}>{totalActive}</div>
        </div>

        <div className="card metric-card" style={{ padding: '16px', backgroundColor: '#fff', borderTop: '4px solid #3b82f6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-gray)' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>In Progress</span>
            <Activity size={16} />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-dark)', marginTop: '12px' }}>{inProgress}</div>
        </div>

        <div className="card metric-card" style={{ padding: '16px', backgroundColor: '#fff', borderTop: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-gray)' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Calls Pending</span>
            <PhoneCall size={16} />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-dark)', marginTop: '12px' }}>{callsPending}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-gray)', marginTop: '4px' }}>No call logged yet</div>
        </div>

        <div className="card metric-card" style={{ padding: '16px', backgroundColor: '#fff', borderTop: '4px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-gray)' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Call Received</span>
            <CheckCircle2 size={16} />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-dark)', marginTop: '12px' }}>{callReceived}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-gray)', marginTop: '4px' }}>Candidate answered</div>
        </div>

        <div className="card metric-card" style={{ padding: '16px', backgroundColor: '#fff', borderTop: '4px solid #ef4444' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-gray)' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>SLA Risk</span>
            <AlertTriangle size={16} />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-dark)', marginTop: '12px' }}>{slaRisk}</div>
        </div>

        <div className="card metric-card" style={{ padding: '16px', backgroundColor: '#fff', borderTop: '4px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-gray)' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Completed Today</span>
            <CheckCircle2 size={16} />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-dark)', marginTop: '12px' }}>{completedToday}</div>
        </div>
      </div>

      {/* FILTER + ACTION BAR */}
      <div className="card" style={{ padding: '16px', backgroundColor: '#fff', display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '220px' }}>
            <Search size={18} color="var(--text-light)" />
            <input
              type="text"
              placeholder="Search Name or ID..."
              className="input-field"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '8px' }}
            />
          </div>

          <select className="select-input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '8px', width: '160px' }}>
            <option value="All">All Statuses</option>
            <option value="Assigned">Assigned</option>
            <option value="Call Pending">Call Pending</option>
            <option value="OTP Received">OTP Received</option>
            <option value="In Progress">In Progress</option>
          </select>

          {/* <select className="select-input" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} style={{ padding: '8px', width: '160px' }}>
            <option value="All">All Priorities</option>
            <option value="Urgent">Urgent</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select> */}
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-outline" onClick={fetchTasks} style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RotateCw size={14} /> Refresh
          </button>
          <button className="btn btn-outline" onClick={handleExport} style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Download size={14} /> Export
          </button>
          <button className="btn btn-primary" onClick={() => assignedTasks.length > 0 && navigate(`/exec/workspace/${assignedTasks[0].id}`)} style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <PlaySquare size={14} /> Resume Last
          </button>
        </div>
      </div>

      {/* MAIN MY TASKS TABLE */}
      <div className="card" style={{ backgroundColor: '#fff', overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', minWidth: '1000px', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 10 }}>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 600, color: 'var(--text-gray)' }}>EMPLOYEE</th>
                <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 600, color: 'var(--text-gray)' }}>COMPANY / SERVICE</th>
                <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 600, color: 'var(--text-gray)' }}>CURRENT STATUS</th>
                <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 600, color: 'var(--text-gray)' }}>PRIORITY & SLA</th>
                <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 600, color: 'var(--text-gray)' }}>LAST ACTIVITY</th>
                <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 600, color: 'var(--text-gray)' }}>PENDING ACTIONS</th>
                <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 600, color: 'var(--text-gray)', textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '64px 24px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Briefcase size={32} color="var(--text-light)" />
                      </div>
                      <div>
                        <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-dark)' }}>No active verification tasks assigned.</h3>
                        <p style={{ fontSize: '13px', color: 'var(--text-gray)', marginTop: '4px' }}>Head over to Available Tasks to pick up new assignments.</p>
                      </div>
                      <button className="btn btn-primary" onClick={() => navigate('/exec/tasks/available')} style={{ marginTop: '8px' }}>Open Available Tasks</button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTasks.map(task => {
                  // const service = task.services ? task.services[0] : 'Identity Verification';
                  const service =
                    task.services?.length
                      ?
                      task.services.join(", ")
                      :
                      "No Service";
                  const pendingAction = getPendingAction(task);
                  const lastEvent = task.timeline && task.timeline.length > 0 ? task.timeline[task.timeline.length - 1] : null;

                  return (
                    <tr key={task.employeeCode} className="table-row-hover" style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-dark)' }}>{task.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-gray)' }}>{task.employeeCode}</div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontSize: '13px', color: 'var(--text-dark)', fontWeight: 500 }}>{task.company || 'N/A'}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-gray)' }}>{service}</div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span className={`badge ${getStatusBadge(task.status)}`}>{(task.status || "assigned")
                          .replace("-", " ")}</span>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: getPriorityColor(task.priority), padding: '2px 6px', borderRadius: '4px', backgroundColor: `${getPriorityColor(task.priority)}15` }}>
                            {task.priority || 'Medium'}
                          </span>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: getSlaRiskColor(task.slaStatus, task.priority) }}>
                            {task.slaStatus || 'On Track'}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '16px', fontSize: '12px', color: 'var(--text-gray)' }}>
                        <div style={{ color: 'var(--text-dark)', fontWeight: 500 }}>{lastEvent ? lastEvent.event : 'Assigned'}</div>
                        <div>{lastEvent ? new Date(lastEvent.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}</div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: pendingAction.color, backgroundColor: pendingAction.bg, padding: '4px 8px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <AlertTriangle size={12} /> {pendingAction.label}
                        </span>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button className="btn btn-outline" onClick={() => setPreviewTask(task)} style={{ padding: '6px', fontSize: '12px' }} title="Task Details">
                            <Eye size={14} />
                          </button>
                          <button className="btn btn-primary" onClick={() => navigate(`/exec/workspace/${task.id}`)} style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            Workspace <PlaySquare size={14} />
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

      {/* TASK DETAILS DRAWER */}
      {previewTask && (
        <>
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100 }} onClick={() => setPreviewTask(null)}></div>
          <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '450px', backgroundColor: '#fff', zIndex: 101, display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 24px rgba(0,0,0,0.1)', animation: 'slideInRight 0.3s ease-out' }}>

            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={18} color="var(--primary-blue)" /> Task Details
              </h2>
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
                    <div style={{ fontSize: '11px', color: 'var(--text-gray)' }}>Name</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-dark)' }}>{previewTask.name}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-gray)' }}>ID</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-dark)' }}>{previewTask.employeeCode}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-gray)' }}>Contact</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-dark)' }}>{previewTask.contactNumber || 'N/A'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-gray)' }}>Company</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-dark)' }}>{previewTask.company || 'N/A'}</div>
                  </div>
                </div>
              </div>

              {/* SECTION 2 — Verification Progress */}
              <div style={{ padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Verification Progress</h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {['Assigned', 'Call Pending', 'OTP Received', 'In Progress'].map((stage, idx) => {
                    // Very simplistic progress logic based on string ordering mapping for demo
                    const stages = ['assigned', 'call-pending', 'otp-received', 'in-progress', 'approved', 'rejected', 'completed'];
                    const currentIdx = stages.indexOf(previewTask.status);
                    const stageIdx = ['assigned', 'call-pending', 'otp-received', 'in-progress'].indexOf(stage.toLowerCase().replace(' ', '-'));

                    const isCompleted = currentIdx > stageIdx;
                    const isCurrent = currentIdx === stageIdx;

                    return (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: isCompleted ? '#10b981' : isCurrent ? 'var(--primary-blue)' : '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {isCompleted && <CheckCircle2 size={12} color="#fff" />}
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: isCurrent ? 600 : 500, color: isCurrent ? 'var(--primary-blue)' : isCompleted ? 'var(--text-dark)' : 'var(--text-gray)' }}>
                          {stage}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 3 — SLA + Priority */}
              <div>
                <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>SLA & Priority</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-gray)' }}>Priority</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: getPriorityColor(previewTask.priority) }}>{previewTask.priority || 'Medium'}</div>
                  </div>
                  <div style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-gray)' }}>SLA Remaining</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: getSlaRiskColor(previewTask.slaStatus, previewTask.priority) }}>{previewTask.slaStatus || 'On Track'}</div>
                  </div>
                </div>
              </div>

              {/* SECTION 4 — Recent Timeline */}
              <div>
                <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Recent Timeline</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {previewTask.timeline && (previewTask.timeline || [])
                    .slice(-4)
                    .reverse().map((t, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '12px', position: 'relative' }}>
                        {idx !== Math.min(3, previewTask.timeline.length - 1) && (
                          <div style={{ position: 'absolute', top: '16px', left: '7px', bottom: '-12px', width: '2px', backgroundColor: 'var(--border-color)' }}></div>
                        )}
                        <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: 'var(--bg-secondary)', border: '2px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, marginTop: '2px' }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--primary-blue)' }}></div>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-dark)' }}>{t.event}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-gray)' }}>{new Date(t.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

            </div>

            {/* SECTION 5 — Quick Actions */}
            <div style={{ padding: '20px 24px', borderTop: '1px solid var(--border-color)', backgroundColor: '#fff', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button className="btn btn-primary" onClick={() => navigate(`/exec/workspace/${previewTask.id}`)} style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                <PlaySquare size={16} /> Resume Workspace
              </button>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn btn-outline" onClick={() => navigate(`/exec/workspace/${previewTask.id}`)} style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                  <PhoneCall size={14} /> Log Call
                </button>
                <button className="btn btn-outline" onClick={() => navigate(`/exec/timeline`)} style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                  <Clock size={14} /> Full Timeline
                </button>
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  );
};
