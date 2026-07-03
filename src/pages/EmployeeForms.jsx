import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import * as XLSX from "xlsx";
import { Download, Layers, Search, Calendar, Eye, CheckCircle2, XCircle, FileText, ChevronDown, X, Clock, User, CheckSquare, AlertCircle, History, Trash2 } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
const DOC_TYPES = [
  { id: 'Profile Photo', label: 'PP', tooltip: 'Profile Photo' },
  { id: 'Signature', label: 'Sg', tooltip: 'Signature' },
  { id: 'Aadhaar Card', label: 'A', tooltip: 'Aadhaar Card' },
  { id: 'PAN Card', label: 'P', tooltip: 'PAN Card' },
  { id: 'Voter ID', label: 'V', tooltip: 'Voter ID' },
  { id: 'Birth Certificate', label: 'B', tooltip: 'Birth Certificate' },
  { id: 'School Leaving', label: 'S', tooltip: 'School Leaving' },
  { id: 'Light Bill/Rent Agreement', label: 'Ad', tooltip: 'Address Proof' },
];

const STATUS_WORKFLOW = {
  'submitted': ['assigned'],
  'assigned': ['call-pending'],
  'call-pending': ['otp-received', 'rejected'],
  'otp-received': ['in-progress', 'rejected'],
  'in-progress': ['approved', 'rejected'],
  'approved': ['completed'],
  'rejected': [],
  'completed': []
};

// INITIAL_DATA removed - fetching from Supabase

const getPriorityColor = (priority) => {
  switch (priority) {
    case 'Urgent': return '#dc2626'; // Red
    case 'High': return '#ea580c'; // Orange
    case 'Medium': return '#0284c7'; // Blue
    case 'Low': return '#64748b'; // Gray
    default: return '#64748b';
  }
};

const getSlaColor = (sla) => {
  switch (sla) {
    case '7+ Days': return '#fef2f2'; // Red BG
    case '4-7 Days': return '#fff7ed'; // Orange BG
    case '1-3 Days': return '#f0fdf4'; // Green BG
    case 'Submitted Today': return '#f8fafc'; // Gray BG
    default: return 'transparent';
  }
};

const getSlaTextColor = (sla) => {
  switch (sla) {
    case '7+ Days': return '#991b1b'; // Red Text
    case '4-7 Days': return '#9a3412'; // Orange Text
    case '1-3 Days': return '#166534'; // Green Text
    case 'Submitted Today': return '#475569'; // Gray Text
    default: return '#000';
  }
};

export const EmployeeForms = () => {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  const [filterCompany, setFilterCompany] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [selectedRows, setSelectedRows] = useState([]);
  const [bulkMenuOpen, setBulkMenuOpen] = useState(false);
  const [modalData, setModalData] = useState(null);

  const [companiesMap, setCompaniesMap] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: companiesData } = await supabase.from('companies').select('*');
        const compMap = {};
        if (companiesData) {
          companiesData.forEach(c => compMap[c.id] = c.company_name);
          setCompaniesMap(compMap);
        }

        const { data: employeesData } = await supabase
          .from('employees')
          .select('*')
          .neq('verification_status', 'draft');

        const { data: documentsData } = await supabase
          .from('employee_documents')
          .select('employee_id, document_type');

        const docsByEmp = {};
        if (documentsData) {
          documentsData.forEach(d => {
            if (!docsByEmp[d.employee_id]) docsByEmp[d.employee_id] = [];
            docsByEmp[d.employee_id].push(d.document_type);
          });
        }

        // Read local assignment/timeline data stored by executives
        const localAssignments = JSON.parse(localStorage.getItem('kpc_supabase_assignments') || '{}');

        if (employeesData) {
          const formattedData = employeesData.map(emp => {
            const statusMap = {
              'pending': 'submitted',
              'submitted': 'submitted',
              'assigned': 'assigned',
              'call-pending': 'call-pending',
              'otp-received': 'otp-received',
              'in-progress': 'in-progress',
              'cfc-verification': 'cfc-verification',
              'final-client-invoice': 'final-client-invoice',
              'complete-report-submission': 'complete-report-submission',
              'approved': 'approved',
              'rejected': 'rejected',
              'completed': 'completed'
            };

            const labelMap = {
              'submitted': 'Submitted',
              'assigned': 'Assigned',
              'call-pending': 'Call Pending',
              'otp-received': 'OTP Received',
              'in-progress': 'In Progress',
              'cfc-verification': 'CFC Verification',
              'final-client-invoice': 'Final Client Invoice',
              'complete-report-submission': 'Complete Report Submission',
              'approved': 'Approved',
              'rejected': 'Rejected',
              'completed': 'Completed'
            };

            // Merge local timeline/status for this employee
            const localRecord = localAssignments[emp.id] || {};
            const timeline = localRecord.timeline || [];
            const localStatus = localRecord.status;

            const rawStatus = localStatus || emp.verification_status;
            const mappedStatus = statusMap[rawStatus] || 'submitted';

            // Extract assigned executive from database
            const assignedExec = emp.assigned_name;
            
            // Extract latest call outcome from timeline
            const callEvents = timeline.filter(t => t.event?.startsWith('Call '));
            const lastCall = callEvents.length > 0 ? callEvents[callEvents.length - 1] : null;
            let callStatusLabel = null;
            if (lastCall) {
              if (lastCall.callReceived && lastCall.otpReceived) callStatusLabel = 'OTP Received ✓';
              else if (lastCall.callReceived && !lastCall.otpReceived) callStatusLabel = 'Call Rcvd — OTP Pending';
              else callStatusLabel = 'Call Not Answered';
            }

            // Build audit trail from timeline
            const auditFromTimeline = timeline.map(t => ({
              user: t.user || 'System',
              action: t.event + (t.details ? ` — ${t.details}` : ''),
              date: new Date(t.date).toLocaleString()
            }));
            const baseAudit = [{ user: 'Client HR', action: 'Form Submitted', date: new Date(emp.created_at).toLocaleString() }];
            const fullAudit = [...baseAudit, ...auditFromTimeline];

            return {
              id: emp.id || `#E-Unknown`,
              name: emp.full_name || 'Unknown',
              company: compMap[emp.company_id] || 'Unknown Company',
              service: emp.services ? emp.services.join(', ') : 'Identity Verification',
              date: new Date(emp.created_at).toLocaleDateString(),
              assigned: assignedExec || 'Unassigned',
              callStatusLabel,
              workload: null,
              status: mappedStatus,
              statusLabel: labelMap[mappedStatus],
              docs: docsByEmp[emp.id] || [],
              priority: localRecord.priority || 'Medium',
              sla: 'Submitted Today',
              timeline,
              audit: fullAudit
            };
          });
          setData(formattedData);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };

    fetchData();
  }, []);

  const filteredData = data.filter(row => {
    const matchSearch = row.name.toLowerCase().includes(search.toLowerCase()) || row.id.toLowerCase().includes(search.toLowerCase());
    const matchCompany = filterCompany === 'All' || row.company === filterCompany;
    const matchStatus = filterStatus === 'All' || row.statusLabel === filterStatus;
    const matchPriority = filterPriority === 'All' || row.priority === filterPriority;
    return matchSearch && matchCompany && matchStatus && matchPriority;
  });

  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedRows(filteredData.map(r => r.id));
    else setSelectedRows([]);
  };

  const handleSelectRow = (id) => {
    if (selectedRows.includes(id)) setSelectedRows(selectedRows.filter(r => r !== id));
    else setSelectedRows([...selectedRows, id]);
  };

  const updateStatus = async (rowId, newStatusId, newStatusLabel) => {
    const row = data.find(r => r.id === rowId);
    if (!STATUS_WORKFLOW[row.status].includes(newStatusId)) {
      alert(`Invalid transition from ${row.status} to ${newStatusId}.`);
      return;
    }

    try {
      // Update in Supabase
      const { error } = await supabase
        .from('employees')
        .update({ verification_status: newStatusId })
        .eq('id', rowId);

      if (error) {
        console.error('Error updating status:', error);
        alert('Failed to update status.');
        return;
      }

      const newAuditEntry = { user: 'Operations Manager', action: `Status Changed to ${newStatusLabel}`, date: 'Just now' };
      const updatedRows = data.map(r => r.id === rowId ? {
        ...r,
        status: newStatusId,
        statusLabel: newStatusLabel,
        audit: [newAuditEntry, ...r.audit]
      } : r);

      setData(updatedRows);
      if (modalData) {
        setModalData(updatedRows.find(r => r.id === rowId));
      }
    } catch (err) {
      console.error(err);
    }
  };


  const handleExportData = async () => {
    try {
      const { data: employees, error } = await supabase
        .from("employees")
        .select(`
        id,
        employee_code,
        full_name,
        email,
        mobile,
        verification_status,
        assigned_name,
        assigned_at,
        completed_at,
        rejected_at,
        services,
        created_at,
        companies(company_name),
        employee_documents(id)
      `);

      if (error) {
        console.error(error);
        return;
      }

      const exportData = employees.map((emp) => ({
        "Employee ID": emp.id,

        "Employee Code": emp.employee_code,

        "Employee Name": emp.full_name,

        Company: emp.companies?.company_name || "",

        Email: emp.email || "",

        Mobile: emp.mobile || "",

        "Verification Status": emp.verification_status,

        "Assigned Executive": emp.assigned_name || "-",

        "Assigned Date": emp.assigned_at
          ? new Date(emp.assigned_at).toLocaleString()
          : "-",

        "Completed Date": emp.completed_at
          ? new Date(emp.completed_at).toLocaleString()
          : "-",

        "Rejected Date": emp.rejected_at
          ? new Date(emp.rejected_at).toLocaleString()
          : "-",

        Services: Array.isArray(emp.services)
          ? emp.services.join(", ")
          : "",

        "Documents Uploaded": emp.employee_documents?.length || 0,

        "Created Date": new Date(emp.created_at).toLocaleString()
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);

      worksheet["!cols"] = [
        { wch: 40 },
        { wch: 18 },
        { wch: 28 },
        { wch: 28 },
        { wch: 30 },
        { wch: 18 },
        { wch: 18 },
        { wch: 22 },
        { wch: 22 },
        { wch: 22 },
        { wch: 22 },
        { wch: 40 },
        { wch: 20 },
        { wch: 22 }
      ];

      const workbook = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "Employee Forms"
      );

      XLSX.writeFile(
        workbook,
        `Employee_Forms_${new Date().toISOString().slice(0, 10)}.xlsx`
      );

    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteEmployee = async (id) => {
    if (window.confirm('Are you sure you want to delete this employee? This action cannot be undone.')) {
      try {
        const { error } = await supabase.from('employees').delete().eq('id', id);
        if (error) {
          console.error("Error deleting employee:", error);
          alert("Failed to delete employee.");
        } else {
          setData(prev => prev.filter(r => r.id !== id));
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <PageHeader 
            title="Employee Forms" 
            subtitle="Manage and monitor employee verification submissions."
            icon={FileText}
          />
        </div>
        <div style={{ display: 'flex', gap: '12px', position: 'relative' }}>
          <button
            className="btn btn-outline"
            onClick={handleExportData}
          >
            Export Data
          </button>
          <div style={{ position: 'relative', fontSize: '25px' }}>
            {/* <button className="btn btn-primary" onClick={() => setBulkMenuOpen(!bulkMenuOpen)}>
              <Layers size={16} style={{ marginRight: '8px' }} /> Bulk Actions <ChevronDown size={16} style={{ marginLeft: '4px' }} />
            </button> */}
            {/* {bulkMenuOpen && (
              <div className="card" style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', zIndex: 10, width: '200px', padding: '8px 0' }}>
                <button style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 16px', borderBottom: '1px solid var(--border-color)' }}>Bulk Export</button>
                <button style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 16px', borderBottom: '1px solid var(--border-color)' }}>Bulk Status Update</button>
                <button style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 16px' }}>Bulk Assignment</button>
              </div>
            )} */}
          </div>
        </div>
      </div>

      <div style={{ padding: '24px', backgroundColor: '#ffffff', borderRadius: '20px', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.03), 0 0 3px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '280px', position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={20} style={{ position: 'absolute', left: '16px', color: '#94a3b8' }} />
          <input type="text" placeholder="Search ID or Name" value={search} onChange={(e) => setSearch(e.target.value)} onFocus={e => e.currentTarget.parentElement.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.1)'} onBlur={e => e.currentTarget.parentElement.style.boxShadow = 'none'} style={{ width: '100%', padding: '14px 16px 14px 48px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '15px', outline: 'none', transition: 'all 0.2s', backgroundColor: '#f8fafc', color: '#0f172a' }} />
        </div>

        <div style={{ position: "relative", display: "flex", flexDirection: "column", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "6px 16px", minWidth: "180px", transition: "all 0.2s" }} onFocusCapture={e => e.currentTarget.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.1)'} onBlurCapture={e => e.currentTarget.style.boxShadow = 'none'}>
          <label style={{ fontSize: "11px", color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "2px" }}>Status</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ border: "none", background: "transparent", outline: "none", fontSize: "14px", fontWeight: 600, color: "#0f172a", padding: "0", width: "100%", appearance: "none", cursor: "pointer" }}>
            <option value="Submitted">Submitted</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="CFC Verification">CFC Verification</option>
            <option value="Final Client Invoice">Final Client Invoice</option>
            <option value="Complete Report Submission">Complete Report Submission</option>
            <option value="Completed">Completed</option>
          </select>
          <span style={{ position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#94a3b8", fontSize: "10px" }}>▼</span>
        </div>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        {filteredData.length === 0 ? (
          <div style={{ padding: '64px', textAlign: 'center' }}>
            <FileText size={48} color="var(--text-light)" style={{ marginBottom: '16px', display: 'inline-block' }} />
            <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>No Forms Found</h3>
            <p style={{ color: 'var(--text-gray)', marginBottom: '16px' }}>Try adjusting your search or filters to find what you're looking for.</p>
            <button className="btn btn-outline" onClick={() => { setSearch(''); setFilterCompany('All'); setFilterStatus('All'); setFilterPriority('All'); }}>Clear Filters</button>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '12px 16px' }}><input type="checkbox" onChange={handleSelectAll} checked={selectedRows.length === filteredData.length && filteredData.length > 0} /></th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>EMPLOYEE</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>SLA</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>DOCUMENTS</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ASSIGNMENT</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>STATUS</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row) => (
                <tr key={row.id} style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: selectedRows.includes(row.id) ? 'var(--bg-hover)' : 'transparent', transition: 'background-color 0.2s ease' }}>
                  <td style={{ padding: '12px 16px' }}><input type="checkbox" checked={selectedRows.includes(row.id)} onChange={() => handleSelectRow(row.id)} /></td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-dark)' }}>{row.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-gray)', marginTop: '2px' }}>{row.id} • {row.company}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', backgroundColor: getSlaColor(row.sla), color: getSlaTextColor(row.sla), fontWeight: 500 }}>{row.sla}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {DOC_TYPES.map(doc => {
                        const hasDoc = row.docs.includes(doc.id);
                        return (
                          <div key={doc.id} title={doc.tooltip} style={{
                            width: '24px', height: '24px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '11px', fontWeight: 700,
                            backgroundColor: hasDoc ? 'var(--primary-blue-light)' : '#f1f5f9',
                            color: hasDoc ? 'var(--primary-blue)' : '#cbd5e1',
                            border: `1px solid ${hasDoc ? 'rgba(37, 99, 235, 0.2)' : 'transparent'}`
                          }}>
                            {doc.label}
                          </div>
                        )
                      })}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px' }}>
                    {row.assigned === 'Unassigned' ? (
                      <span style={{ color: '#ef4444', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <AlertCircle size={14} /> Unassigned
                      </span>
                    ) : (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '24px', height: '24px', borderRadius: '50%',
                            backgroundColor: '#eff6ff', color: '#2563eb',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '10px', fontWeight: 700, flexShrink: 0,
                            border: '1px solid #bfdbfe'
                          }}>
                            {row.assigned.substring(0, 2).toUpperCase()}
                          </div>
                          <div style={{ fontWeight: 500, fontSize: '13px', color: 'var(--text-dark)' }}>{row.assigned}</div>
                        </div>
                        {row.callStatusLabel && (
                          <div style={{
                            fontSize: '11px',
                            marginTop: '6px',
                            color: row.callStatusLabel.includes('✓') ? '#15803d' :
                              row.callStatusLabel.includes('Not') ? '#dc2626' : '#d97706',
                            fontWeight: 500,
                            display: 'flex', alignItems: 'center', gap: '4px'
                          }}>
                            <Phone size={10} /> {row.callStatusLabel}
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className={`badge badge-${row.status}`} style={{ fontSize: '12px', padding: '4px 8px' }}>{row.statusLabel}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-outline" onClick={() => setModalData(row)} style={{ padding: '4px 8px', fontSize: '12px' }}>
                        <Eye size={14} style={{ marginRight: '4px' }} /> View
                      </button>
                      <button className="btn btn-outline" onClick={() => handleDeleteEmployee(row.id)} style={{ padding: '4px 8px', fontSize: '12px', color: '#ef4444', borderColor: '#ef4444' }}>
                        <Trash2 size={14} style={{ marginRight: '4px' }} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Employee Details Drawer/Modal */}
      {modalData && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 50, display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '600px', backgroundColor: '#fff', height: '100%', boxShadow: '-4px 0 15px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column' }}>

            <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <h2 style={{ fontSize: '20px', margin: 0 }}>{modalData.name}</h2>
                  <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '12px', border: `1px solid ${getPriorityColor(modalData.priority)}`, color: getPriorityColor(modalData.priority), fontWeight: 600 }}>{modalData.priority} Priority</span>
                </div>
                <div style={{ color: 'var(--text-gray)', fontSize: '14px' }}>{modalData.id} • {modalData.company}</div>
              </div>
              <button onClick={() => setModalData(null)} style={{ padding: '8px' }}><X size={20} /></button>
            </div>

            <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="card" style={{ padding: '16px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-gray)', fontWeight: 600, marginBottom: '8px' }}>SLA AGING</div>
                  <div style={{ fontWeight: 600, color: getSlaTextColor(modalData.sla) }}>{modalData.sla}</div>
                </div>
                <div className="card" style={{ padding: '16px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-gray)', fontWeight: 600, marginBottom: '8px' }}>ASSIGNMENT</div>
                  {modalData.assigned === 'Unassigned' ? (
                    <div style={{ fontWeight: 600, color: '#dc2626' }}>⊘ Unassigned</div>
                  ) : (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '50%',
                          backgroundColor: '#dbeafe', color: '#1d4ed8',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '12px', fontWeight: 700
                        }}>
                          {modalData.assigned.substring(0, 2).toUpperCase()}
                        </div>
                        <div style={{ fontWeight: 600, color: 'var(--text-dark)' }}>{modalData.assigned}</div>
                      </div>
                      {modalData.callStatusLabel && (
                        <div style={{
                          fontSize: '12px', fontWeight: 600,
                          color: modalData.callStatusLabel.includes('✓') ? '#15803d' :
                            modalData.callStatusLabel.includes('Not') ? '#dc2626' : '#d97706',
                          padding: '6px 10px', borderRadius: '6px',
                          backgroundColor: modalData.callStatusLabel.includes('✓') ? '#f0fdf4' :
                            modalData.callStatusLabel.includes('Not') ? '#fef2f2' : '#fffbeb',
                          display: 'inline-block'
                        }}>
                          📞 Call: {modalData.callStatusLabel}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="card" style={{ padding: '16px' }}>
                <h3 style={{ fontSize: '14px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckSquare size={16} color="var(--primary-blue)" /> Workflow Status
                </h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className={`badge badge-${modalData.status}`} style={{ fontSize: '14px', padding: '6px 12px' }}>{modalData.statusLabel}</span>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    {STATUS_WORKFLOW[modalData.status].map(nextStatus => (
                      <button key={nextStatus} className="btn btn-outline" onClick={() => updateStatus(modalData.id, nextStatus, nextStatus.replace('-', ' ').toUpperCase())} style={{ fontSize: '12px' }}>
                        Move to {nextStatus}
                      </button>
                    ))}
                    {STATUS_WORKFLOW[modalData.status].length === 0 && <span style={{ fontSize: '12px', color: 'var(--text-gray)' }}>Final State Reached</span>}
                  </div>
                </div>
              </div>

              <div className="card" style={{ padding: '16px' }}>
                <h3 style={{ fontSize: '14px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <History size={16} color="var(--primary-blue)" /> Audit Trail
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {modalData.audit.map((entry, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '12px', borderBottom: idx !== modalData.audit.length - 1 ? '1px solid var(--border-color)' : 'none', paddingBottom: idx !== modalData.audit.length - 1 ? '12px' : 0 }}>
                      <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '12px', backgroundColor: '#e2e8f0', color: '#475569' }}>
                        {entry.user.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 600 }}>{entry.action}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-gray)' }}>{entry.user} • {entry.date}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};
