//hr/EmployeeList.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import * as XLSX from "xlsx";
import {
  Search, Calendar, Filter, Download, Plus,
  Trash2, Send, CheckSquare, Eye, Edit3, X,
  AlertTriangle, FileText, CheckCircle2, RefreshCw, FileSpreadsheet,
  Clock, Check, User, HelpCircle, FileCheck, ShieldAlert, AlertCircle, Loader
} from 'lucide-react';
import { mockDb } from '../../utils/mockDb';
import { supabase } from '../../utils/supabase';

const SERVICE_TYPES = [
  { id: 'All', label: 'All Services' },
  { id: 'Identity Verification', label: 'Identity Verification' },
  // { id: 'Background Verification', label: 'Background Verification' },
  { id: 'Address Verification', label: 'Address Verification' },
  { id: 'Police Verification', label: 'Police Verification' }
];

export const EmployeeList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [employees, setEmployees] = useState([]);
  const kpc_session = JSON.parse(localStorage.getItem("kpc_session"));
  // const company = kpc_session?.company;

  // Filtering states
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterService, setFilterService] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentTab, setCurrentTab] = useState('all'); // all, active, drafts

  // Smart Filter States
  const [filterRejectedShortcut, setFilterRejectedShortcut] = useState(false);
  const [filterPendingAction, setFilterPendingAction] = useState(false);

  // Selection states
  const [selectedRows, setSelectedRows] = useState([]);
  const [quickViewEmployee, setQuickViewEmployee] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    mockDb.init();
    loadEmployees();

    // Read navigation state parameters (e.g. from Dashboard Quick Actions)
    if (location.state) {
      if (location.state.filterStatus) {
        setFilterStatus(location.state.filterStatus);
        if (location.state.filterStatus === 'Rejected') {
          setFilterRejectedShortcut(true);
        }
        if (['Submitted', 'In Progress', 'Approved', 'Rejected', 'Completed'].includes(location.state.filterStatus)) {
          setCurrentTab('active');
        }
      }
      if (location.state.showDraftsOnly) {
        setCurrentTab('drafts');
        setFilterStatus('All');
      }
      if (location.state.viewEmployeeId) {
        const emp = mockDb.getEmployeeById(location.state.viewEmployeeId);
        if (emp) setQuickViewEmployee(emp);
      }
    }
  }, [location.state]);

  // const loadEmployees = async () => {

  //   const { data, error } = await supabase
  //     .from('employees')
  //     .select('*')
  //     .order('created_at', { ascending: false });

  //   if (error) {
  //     console.error(error);
  //     return;
  //   }

  //   const formattedEmployees = data.map(emp => ({
  //     id: emp.id,
  //     name: emp.full_name,
  //     company: '',
  //     status: emp.verification_status,
  //     contactNumber: emp.mobile,
  //     createdDate: emp.created_at,
  //     priority: 'Medium',
  //     services: []
  //   }));

  //   setEmployees(formattedEmployees);
  // };

  const loadEmployees = async () => {
    setIsLoading(true);

    const session = JSON.parse(localStorage.getItem("kpc_session"));

    console.log("SESSION =", session);

    const clientId = session?.clientId;

    if (session?.role !== "hr") {
      setIsLoading(false);
      return;
    }

    if (!clientId) {
      console.error("HR session has no company id");
      setIsLoading(false);
      return;
    }

    console.log("CLIENT ID =", clientId);

    const { data, error } = await supabase
      .from("employees")
      .select(`
    *,
    companies(company_name),
    employee_documents(*)
  `)
      .eq("company_id", clientId);

    if (error) {
      console.error(error);
      setIsLoading(false);
      return;
    }

    const localData = JSON.parse(
      localStorage.getItem("kpc_supabase_assignments") || "{}"
    );

    const formattedEmployees = data.map(emp => {

      const documents = (emp.employee_documents || []).map(doc => ({
        name: doc.document_type,
        type: doc.document_type,
        status: "Uploaded",
        thumbnail: doc.file_url,
        file_url: doc.file_url,
        quality: "Uploaded",
        size: "",
        isPdf: doc.file_url?.toLowerCase().includes(".pdf")
      }));

      return {
        id: emp.id,
        employeeCode: emp.employee_code,
        name: emp.full_name,
        company: emp.companies?.company_name || "",
        email: emp.email,
        dob: emp.dob,
        fatherName: emp.father_name,
        motherName: emp.mother_name,
        contactNumber: emp.mobile,
        status: emp.verification_status,

        assignedName: emp.assigned_name,
        assignedAt: emp.assigned_at,
        completedAt: emp.completed_at,
        rejectedAt: emp.rejected_at,

        rejectionReason: emp.rejection_reason,
        rejectedBy: emp.rejected_by,

        createdDate: emp.created_at,

        priority: localData[emp.id]?.priority || "Medium",

        services: emp.services || [],

        documentsUploaded: documents.length > 0,

        documents,

        timeline: localData[emp.id]?.timeline || []
      };
    });

    console.log("FORMATTED:", formattedEmployees);

    setEmployees(formattedEmployees);
    setIsLoading(false);
  };


  useEffect(() => {
    loadEmployees();
  }, []);

  // Helper: map internal state code to clean labels
  const getStatusLabel = (status) => {
    switch (status) {
      case 'in-progress': return 'badge-in-progress';
      case 'cfc-verification': return 'badge-in-progress';
      case 'final-client-invoice': return 'badge-in-progress';
      case 'complete-report-submission': return 'badge-in-progress';
      case 'approved': return 'badge-approved';
      case 'rejected': return 'badge-rejected';
      case 'completed': return 'badge-completed';
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'draft': return 'badge-draft';
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

  // const getServiceType = (emp) => {
  //   if (emp.id === 'EMP-90421') return 'Background Verification';
  //   if (emp.id === 'EMP-90422') return 'Background Verification';
  //   if (emp.id === 'EMP-90423') return 'Address Verification';
  //   if (emp.id === 'EMP-90424') return 'Identity Verification';
  //   return 'Identity Verification';
  // };

  const getServiceType = (emp) => {
    if (emp.services && emp.services.length > 0) {
      return emp.services.join(', ');
    }
    return 'Identity Verification'; // fallback default
  };

  // 1. Document Completeness Helper
  // const getDocCompleteness = (emp) => {
  //   const totalDocs = 6;
  //   const uploadedDocs = emp.documents ? emp.documents.length : 0;

  //   // Check if any uploaded document is rejected or re-upload required
  //   const hasRejected = emp.documents ? emp.documents.some(d => d.status === 'Rejected') : false;
  //   const hasReupload = emp.documents ? emp.documents.some(d => d.status === 'Re-upload Required') : false;

  //   // Check if mandatory Aadhaar & PAN are missing
  //   const docTypes = emp.documents ? emp.documents.map(d => d.type) : [];
  //   const missingMandatory = !docTypes.includes('Aadhaar Card') || !docTypes.includes('PAN Card');

  //   let state = 'Complete';
  //   let color = '#10b981'; // Green

  //   if (hasRejected || hasReupload) {
  //     state = 'Re-upload Required';
  //     color = '#ef4444'; // Red
  //   } else if (missingMandatory || uploadedDocs < 2) {
  //     state = 'Missing Documents';
  //     color = '#f59e0b'; // Amber
  //   }

  //   return {
  //     text: `${uploadedDocs}/${totalDocs} Uploaded`,
  //     state,
  //     color
  //   };
  // };

  // Add this helper above getDocCompleteness:
  const getRequiredDocTypesForEmp = (emp) => {
    const req = new Set();
    const services = emp.services || [];
    if (services.includes('Identity Verification')) { req.add('Aadhaar Card'); req.add('PAN Card'); }
    if (services.includes('Address Verification')) { req.add('Light Bill/Rent Agreement'); }
    if (services.includes('Police Verification')) { req.add('Aadhaar Card'); req.add('PAN Card'); }
    if (services.includes('Background Verification')) { req.add('Aadhaar Card'); req.add('PAN Card'); req.add('School Leaving'); }
    if (req.size === 0) { req.add('Aadhaar Card'); req.add('PAN Card'); }
    return Array.from(req);
  };

  // Replace getDocCompleteness with this:
  const getDocCompleteness = (emp) => {
    const uploadedDocs = emp.documents ? emp.documents.length : 0;
    const requiredDocs = getRequiredDocTypesForEmp(emp);
    const docTypes = emp.documents ? emp.documents.map(d => d.type) : [];

    const hasRejected = emp.documents ? emp.documents.some(d => d.status === 'Rejected') : false;
    const hasReupload = emp.documents ? emp.documents.some(d => d.status === 'Re-upload Required') : false;
    const missingRequired = requiredDocs.some(r => !docTypes.includes(r));

    let state = 'Complete';
    let color = '#10b981';

    if (hasRejected || hasReupload) {
      state = 'Re-upload Required';
      color = '#ef4444';
    } else if (missingRequired) {
      state = 'Missing Documents';
      color = '#f59e0b';
    }

    return {
      text: `${uploadedDocs}/${requiredDocs.length} Uploaded`,  // shows actual required count, not hardcoded 6
      state,
      color
    };
  };

  // 3. Last Activity Helper
  const getLastActivity = (emp) => {
    if (emp.timeline && emp.timeline.length > 0) {
      const last = emp.timeline[emp.timeline.length - 1];
      return {
        action: last.event,
        date: new Date(last.date).toLocaleDateString()
      };
    }
    return {
      action: 'Form Created',
      date: new Date(emp.createdDate).toLocaleDateString()
    };
  };

  const getCreatedBy = (emp) => {
    if (emp.timeline && emp.timeline.length > 0) {
      const createdEvent = emp.timeline.find(t => t.event === 'Employee Created');
      return createdEvent ? createdEvent.user : 'Unknown HR';
    }
    return 'Unknown HR';
  };

  // Apply filters
  const filteredEmployees = employees.filter(emp => {

    // ✅ 0. Company filter (हे सर्वात वर टाक)
    // if (emp.company !== company) return false;
    // if (company && emp.company !== company) return false;

    // 1. Search Query
    const query = search.toLowerCase();
    const matchSearch =
      emp.name.toLowerCase().includes(query) ||
      emp.id.toLowerCase().includes(query) ||
      (emp.contactNumber && emp.contactNumber.includes(query));

    // 2. Tab selection
    let matchTab = true;
    if (currentTab === 'active') matchTab = emp.status !== 'draft';
    if (currentTab === 'drafts') matchTab = emp.status === 'draft';

    // 3. Rejected Shortcut
    if (filterRejectedShortcut && emp.status !== 'rejected') return false;

    // 4. Pending Action
    if (filterPendingAction) {
      const docsCheck = getDocCompleteness(emp);
      const isPending =
        emp.status === 'draft' ||
        emp.status === 'rejected' ||
        docsCheck.state === 'Re-upload Required' ||
        docsCheck.state === 'Missing Documents';

      if (!isPending) return false;
    }

    // 5. Status filter
    let matchStatus = true;
    if (!filterRejectedShortcut && filterStatus !== 'All') {
      if (filterStatus === 'In Progress') {
        matchStatus = [
          'assigned',
          'call-pending',
          'otp-received',
          'in-progress',
          'cfc-verification',
          'final-client-invoice',
          'complete-report-submission'
        ].includes(emp.status);
      } else {
        matchStatus = emp.status === filterStatus.toLowerCase();
      }
    }

    // 6. Service filter
    // let matchService = true;
    // if (filterService !== 'All') {
    //   matchService = getServiceType(emp) === filterService;
    // }

    let matchService = true;
    if (filterService !== 'All') {
      matchService = emp.services && emp.services.includes(filterService);
    }
    // 7. Date filter
    let matchDate = true;
    const itemDate = new Date(emp.submittedDate || emp.createdDate);

    if (startDate) {
      matchDate = matchDate && itemDate >= new Date(startDate);
    }

    if (endDate) {
      const endLimit = new Date(endDate);
      endLimit.setHours(23, 59, 59, 999);
      matchDate = matchDate && itemDate <= endLimit;
    }

    return matchSearch && matchTab && matchStatus && matchService && matchDate;
  });

  // Checkbox interactions
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows(filteredEmployees.map(emp => emp.id));
    } else {
      setSelectedRows([]);
    }
  };

  const handleSelectRow = (id) => {
    if (selectedRows.includes(id)) {
      setSelectedRows(selectedRows.filter(r => r !== id));
    } else {
      setSelectedRows([...selectedRows, id]);
    }
  };

  // Bulk Actions
  const handleBulkSubmit = () => {
    const selectedDrafts = employees.filter(emp => selectedRows.includes(emp.id) && emp.status === 'draft');

    if (selectedDrafts.length === 0) {
      alert('No selected drafts are available to submit.');
      return;
    }

    const incompleteDrafts = selectedDrafts.filter(d => {
      const comp = getDocCompleteness(d);
      return comp.state === 'Missing Documents' || comp.state === 'Re-upload Required';
    });

    if (incompleteDrafts.length > 0) {
      alert(`Cannot submit. The following drafts have missing/rejected documents: ${incompleteDrafts.map(i => i.name).join(', ')}`);
      return;
    }

    const updated = filteredEmployees.map(emp => {
      if (selectedRows.includes(emp.id) && emp.status === 'draft') {
        const now = new Date().toISOString();
        return {
          ...emp,
          status: 'submitted',
          submittedDate: now,
          timeline: [
            ...emp.timeline,
            { event: 'Form Submitted', user: 'Client HR', date: now }
          ],
          audit: [
            ...emp.audit,
            { user: 'Client HR', action: 'Form Submitted (Bulk)', date: now }
          ]
        };
      }
      return emp;
    });

    mockDb.saveEmployees(updated);
    loadEmployees();
    setSelectedRows([]);
    alert(`Successfully submitted ${selectedDrafts.length} verifications!`);
  };

  const handleBulkDelete = () => {
    const selectedDrafts = employees.filter(emp => selectedRows.includes(emp.id) && emp.status === 'draft');

    if (selectedDrafts.length === 0) {
      alert('Only drafts can be deleted.');
      return;
    }

    if (window.confirm(`Are you sure you want to delete the selected ${selectedDrafts.length} drafts?`)) {
      const updated = employees.filter(emp => !(selectedRows.includes(emp.id) && emp.status === 'draft'));
      mockDb.saveEmployees(updated);
      loadEmployees();
      setSelectedRows([]);
    }
  };
  const handleDeleteEmployee = async (employeeId) => {
    const employee = filteredEmployees.find(emp => emp.id === employeeId);
    if (!employee) return;

    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${employee.name}?`
    );
    if (!confirmDelete) return;

    // Delete associated documents first (FK constraint safety)
    const { error: docsError } = await supabase
      .from('employee_documents')
      .delete()
      .eq('employee_id', employeeId);

    if (docsError) {
      console.error('Error deleting employee documents:', docsError);
      alert('Failed to delete employee documents. Aborting deletion.');
      return;
    }

    // Delete the employee record
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', employeeId);

    if (error) {
      console.error('Error deleting employee:', error);
      alert(`Failed to delete employee: ${error.message}`);
      return;
    }

    await loadEmployees(); // re-fetch fresh list from Supabase
    alert('Employee deleted successfully.');
  };

  // Export CSV
  const handleExportCSV = async () => {
    try {
      const session = JSON.parse(localStorage.getItem("kpc_session"));
      console.log("SESSION =", session);

      // const { data, error } = await supabase
      //   .from("employees")
      //   .select(`
      //   id,
      //   employee_code,
      //   full_name,
      //   email,
      //   mobile,
      //   dob,
      //   verification_status,
      //   assigned_name,
      //   assigned_at,
      //   completed_at,
      //   rejected_at,
      //   rejection_reason,
      //   created_at,
      //   services,
      //   company_id,
      //   companies(company_name),
      //   employee_documents(id)
      // `)
      //   .eq("company_id", session.clientId);

      const data = filteredEmployees;
      // if (error) {
      //   console.error(error);
      //   alert("Unable to export data.");
      //   return;
      // }

      // const exportData = filteredEmployees.map(emp => ({

      //   "Employee ID": emp.id,

      //   "Employee Code": emp.employee_code,

      //   "Employee Name": emp.full_name,

      //   Company: emp.companies?.company_name || "",

      //   Email: emp.email || "",

      //   Mobile: emp.mobile || "",

      //   DOB: emp.dob || "",

      //   Status: emp.verification_status,

      //   "Assigned Executive": emp.assigned_name || "",

      //   "Assigned Date": emp.assigned_at
      //     ? new Date(emp.assigned_at).toLocaleString()
      //     : "",

      //   "Completed Date": emp.completed_at
      //     ? new Date(emp.completed_at).toLocaleString()
      //     : "",

      //   "Rejected Date": emp.rejected_at
      //     ? new Date(emp.rejected_at).toLocaleString()
      //     : "",

      //   "Rejection Reason": emp.rejection_reason || "",

      //   Services: Array.isArray(emp.services)
      //     ? emp.services.join(", ")
      //     : "",

      //   "Documents Uploaded": emp.employee_documents?.length || 0,

      //   "Created Date": new Date(emp.created_at).toLocaleString()

      // }));

      const exportData = filteredEmployees.map(emp => ({

        "Employee ID": emp.id,

        "Employee Name": emp.name,

        Company: emp.company,

        Mobile: emp.contactNumber,

        DOB: emp.dob,

        Status: emp.status,

        Services: emp.services?.join(", ") || "",

        "Documents Uploaded": emp.documents?.length || 0,

        "Created Date": emp.createdDate
          ? new Date(emp.createdDate).toLocaleString()
          : ""

      }));

      console.log("SUPABASE DATA:", data);
      console.log("EXPORT DATA:", exportData);

      const worksheet = XLSX.utils.json_to_sheet(exportData);

      worksheet["!cols"] = [
        { wch: 40 },
        { wch: 18 },
        { wch: 28 },
        { wch: 25 },
        { wch: 30 },
        { wch: 18 },
        { wch: 15 },
        { wch: 18 },
        { wch: 22 },
        { wch: 22 },
        { wch: 22 },
        { wch: 30 },
        { wch: 35 },
        { wch: 18 },
        { wch: 22 }
      ];

      const workbook = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "Employee List"
      );

      XLSX.writeFile(
        workbook,
        `Employee_List_${new Date().toISOString().slice(0, 10)}.xlsx`
      );

    } catch (err) {
      console.error(err);
    }
  };


  const handleClearFilters = () => {
    setSearch('');
    setFilterStatus('All');
    setFilterService('All');
    setStartDate('');
    setEndDate('');
    setCurrentTab('all');
    setFilterRejectedShortcut(false);
    setFilterPendingAction(false);
  };

  return (
    <div className="employee-list-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.5s ease-out' }}>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .tab-btn {
          padding: 8px 16px;
          border-radius: var(--radius-md);
          font-weight: 500;
          font-size: 13px;
          color: var(--text-gray);
          transition: all 0.2s;
        }
        .tab-btn:hover {
          color: var(--text-dark);
          background-color: var(--bg-hover);
        }
        .tab-btn.active {
          color: var(--primary-blue);
          background-color: var(--primary-blue-light);
          font-weight: 600;
        }
        .badge-draft { background-color: #f1f5f9; color: #475569; }
        .details-drawer {
          animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .filter-btn-shortcut {
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border: 1px solid var(--border-color);
          background: #fff;
          color: var(--text-gray);
        }
        .filter-btn-shortcut.active {
          background-color: #fee2e2;
          color: #dc2626;
          border-color: #fca5a5;
        }
        .filter-btn-action.active {
          background-color: #fff7ed;
          color: #d97706;
          border-color: #fed7aa;
        }
        @media print {
          body { background-color: #fff; color: #000; }
          .sidebar, .top-header, .btn, .filter-section, .tabs-container, .bulk-actions-bar, .actions-column {
            display: none !important;
          }
          .main-wrapper, .main-content, .employee-list-container {
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
          }
          .card { border: none !important; box-shadow: none !important; }
          table { border: 1px solid #000 !important; width: 100% !important; }
          th, td { padding: 8px !important; border-bottom: 1px solid #000 !important; }
        }
      `}</style>

      {/* Header Panel */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '35px', fontWeight: 700, color: 'var(--text-dark)' }}>Employee List</h1>
          <p style={{ fontSize: '18px', color: 'var(--text-gray)', marginTop: '4px' }}>Register employees and track their credentials verification status.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-outline" style={{ backgroundColor: 'whitesmoke', fontSize: '17px' }} onClick={handleExportCSV}>
            <FileSpreadsheet size={16} style={{ marginRight: '8px' }} /> Export Excel
          </button>
          <button className="btn btn-primary" style={{ fontSize: '17px' }} onClick={() => navigate('/hr/employees/create')}>
            <Plus size={16} style={{ marginRight: '8px' }} /> Create New Employee
          </button>
        </div>
      </div>

      {/* Workspace Tabs & Smart Shortcuts */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div className="card tabs-container" style={{ padding: '6px', display: 'inline-flex', gap: '4px', backgroundColor: '#e2e8f0', borderRadius: '10px' }}>
          <button className={`tab-btn ${currentTab === 'all' ? 'active' : ''}`} onClick={() => { setCurrentTab('all'); setSelectedRows([]); }}>All Cases ({employees.length})</button>
          <button className={`tab-btn ${currentTab === 'active' ? 'active' : ''}`} onClick={() => { setCurrentTab('active'); setSelectedRows([]); }}>Active Checks ({employees.filter(e => e.status !== 'draft').length})</button>
          <button className={`tab-btn ${currentTab === 'drafts' ? 'active' : ''}`} onClick={() => { setCurrentTab('drafts'); setSelectedRows([]); }}>Draft Workspace ({employees.filter(e => e.status === 'draft').length})</button>
        </div>

        {/* 5. Rejected Cases Shortcut & 6. Pending Actions Smart Filter */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className={`filter-btn-shortcut ${filterRejectedShortcut ? 'active' : ''}`}
            onClick={() => {
              setFilterRejectedShortcut(!filterRejectedShortcut);
              if (!filterRejectedShortcut) setFilterPendingAction(false); // mutually exclusive helper
            }}
          >
            <ShieldAlert size={15} />
            Rejected Cases ({employees.filter(e => e.status === 'rejected').length})
          </button>

          <button
            className={`filter-btn-shortcut filter-btn-action ${filterPendingAction ? 'active' : ''}`}
            onClick={() => {
              setFilterPendingAction(!filterPendingAction);
              if (!filterPendingAction) setFilterRejectedShortcut(false);
            }}
          >
            <AlertCircle size={15} />
            Pending My Action ({employees.filter(e => {
              const docsCheck = getDocCompleteness(e);
              return e.status === 'draft' || e.status === 'rejected' || docsCheck.state === 'Re-upload Required' || docsCheck.state === 'Missing Documents';
            }).length})
          </button>
        </div>
      </div>

      {/* Filter Section */}
      <div className="card filter-section" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', backgroundColor: '#ffffff', borderRadius: '20px', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.03), 0 0 3px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9' }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "20px",
            width: "100%"
          }}
        >
          {/* Search */}
          <div
            className="header-search"
            style={{
              border: "1px solid #e2e8f0",
              margin: 0,
              width: "420px",
              backgroundColor: "#ffffff",
              height: "48px",
              borderRadius: "12px",
              transition: "all 0.2s"
            }}
            onFocusCapture={e => e.currentTarget.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.1)'}
            onBlurCapture={e => e.currentTarget.style.boxShadow = 'none'}
          >
            <Search size={20} color="#94a3b8" />
            <input
              type="text"
              placeholder="Search by ID, Name, or Contact..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ fontSize: "15px", color: "#0f172a" }}
            />
          </div>

          {/* Right Side Filters */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              marginLeft: "auto"
            }}
          >
            {/* Status Dropdown */}
            <div style={{ position: "relative", display: "flex", flexDirection: "column", backgroundColor: filterRejectedShortcut ? "#f1f5f9" : "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "6px 16px", minWidth: "180px", transition: "all 0.2s" }} onFocusCapture={e => { if(!filterRejectedShortcut) e.currentTarget.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.1)'; }} onBlurCapture={e => e.currentTarget.style.boxShadow = 'none'}>
              <label style={{ fontSize: "11px", color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "2px" }}>Status</label>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} disabled={filterRejectedShortcut} style={{ border: "none", background: "transparent", outline: "none", fontSize: "14px", fontWeight: 600, color: "#0f172a", padding: "0", width: "100%", appearance: "none", cursor: filterRejectedShortcut ? "not-allowed" : "pointer" }}>
                <option value="All">All Statuses</option>
                {currentTab !== "drafts" && (
                  <>
                    <option value="Submitted">Submitted</option>
                    <option value="Assigned">Assigned</option>
                    <option value="In Progress">In Progress</option>
                    <option value="CFC Verification">CFC Verification</option>
                    <option value="Final Client Invoice">Final Client Invoice</option>
                    <option value="Complete Report Submission">Complete Report Submission</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Completed">Completed</option>
                  </>
                )}
                {currentTab === "drafts" && <option value="Draft">Draft</option>}
              </select>
              <span style={{ position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#94a3b8", fontSize: "10px" }}>▼</span>
            </div>

            {/* Service Dropdown */}
            <div style={{ position: "relative", display: "flex", flexDirection: "column", backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "6px 16px", minWidth: "180px", transition: "all 0.2s" }} onFocusCapture={e => e.currentTarget.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.1)'} onBlurCapture={e => e.currentTarget.style.boxShadow = 'none'}>
              <label style={{ fontSize: "11px", color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "2px" }}>Service</label>
              <select value={filterService} onChange={(e) => setFilterService(e.target.value)} style={{ border: "none", background: "transparent", outline: "none", fontSize: "14px", fontWeight: 600, color: "#0f172a", padding: "0", width: "100%", appearance: "none", cursor: "pointer" }}>
                {SERVICE_TYPES.map((svc) => (
                  <option key={svc.id} value={svc.id}>{svc.label}</option>
                ))}
              </select>
              <span style={{ position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#94a3b8", fontSize: "10px" }}>▼</span>
            </div>
          </div>
        </div>

        {(search || filterStatus !== 'All' || filterService !== 'All' || startDate || endDate || filterRejectedShortcut || filterPendingAction) && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-gray)' }}>
              Showing <strong>{filteredEmployees.length}</strong> matching entries.
            </span>
            <button className="btn btn-outline" onClick={handleClearFilters} style={{ padding: '4px 8px', fontSize: '12px', color: '#dc2626', borderColor: '#fee2e2' }}>
              Clear Active Filters
            </button>
          </div>
        )}
      </div>

      {/* Bulk Actions Bar */}
      {selectedRows.length > 0 && (
        <div className="card bulk-actions-bar" style={{ padding: '16px 24px', backgroundColor: 'var(--primary-blue-light)', border: '1px solid var(--primary-blue)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '12px' }}>
          <span style={{ color: 'var(--primary-blue)', fontWeight: 600, fontSize: '14px' }}>
            {selectedRows.length} Employee{selectedRows.length > 1 ? 's' : ''} Selected
          </span>
          <div style={{ display: 'flex', gap: '12px' }}>
            {currentTab !== 'active' && (
              <>
                <button className="btn btn-primary" onClick={handleBulkSubmit} style={{ padding: '6px 14px', fontSize: '12px' }}>
                  <Send size={14} style={{ marginRight: '6px' }} /> Bulk Submit verifications
                </button>
                <button className="btn btn-outline" onClick={handleBulkDelete} style={{ padding: '6px 14px', fontSize: '12px', borderColor: '#ef4444', color: '#dc2626', backgroundColor: '#fff' }}>
                  <Trash2 size={14} style={{ marginRight: '6px' }} /> Bulk Delete Drafts
                </button>
              </>
            )}
            <button className="btn btn-outline" onClick={() => setSelectedRows([])} style={{ padding: '6px 14px', fontSize: '12px', backgroundColor: '#fff' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Main Employee Table */}
      <div className="card" style={{ overflow: 'hidden', backgroundColor: '#ffffff', borderRadius: '20px', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.03), 0 0 3px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9' }}>
        {isLoading ? (
          <div style={{ padding: '64px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <Loader size={48} className="spin" color="var(--primary-blue)" />
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-dark)' }}>Loading Employees...</h3>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div style={{ padding: '64px', textAlign: 'center' }}>
            <FileText size={48} color="var(--text-light)" style={{ marginBottom: '16px', display: 'inline-block' }} />
            <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>No Employees Found</h3>
            <p style={{ color: 'var(--text-gray)', marginBottom: '16px' }}>Try adjusting your search criteria, dates, or filter categories.</p>
            <button className="btn btn-outline" onClick={handleClearFilters}>Reset Filters</button>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '16px' }} className="actions-column">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={selectedRows.length === filteredEmployees.length && filteredEmployees.length > 0}
                  />
                </th>
                <th style={{ padding: '22px', fontSize: '12px', color: 'var(--text-gray)', fontWeight: 600 }}>EMPLOYEE DETAILS</th>
                <th style={{ padding: '16px', fontSize: '12px', color: 'var(--text-gray)', fontWeight: 600 }}>CREATED BY</th>
                {/* 1. Document Completeness Indicator Column */}
                <th style={{ padding: '18px', fontSize: '12px', color: 'var(--text-gray)', fontWeight: 600 }}>DOCUMENTS</th>
                {/* 2. Verification Service Column */}
                <th style={{ padding: '18px', fontSize: '12px', color: 'var(--text-gray)', fontWeight: 600 }}>VERIFICATION SERVICE</th>
                {/* 3. Last Activity Column */}
                <th style={{ padding: '16px', fontSize: '12px', color: 'var(--text-gray)', fontWeight: 600 }}>LAST ACTIVITY</th>
                <th style={{ padding: '18px', fontSize: '12px', color: 'var(--text-gray)', fontWeight: 600 }}>STATUS</th>
                <th style={{ padding: '18px', fontSize: '12px', color: 'var(--text-gray)', fontWeight: 600 }} className="actions-column">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((emp) => {
                const docStatus = getDocCompleteness(emp);
                const lastAct = getLastActivity(emp);
                return (
                  <tr 
                    key={emp.id} 
                    style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: selectedRows.includes(emp.id) ? 'var(--bg-hover)' : 'transparent', transition: 'background-color 0.2s ease' }}
                    onMouseEnter={e => { if(!selectedRows.includes(emp.id)) e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; }}
                    onMouseLeave={e => { if(!selectedRows.includes(emp.id)) e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <td style={{ padding: '16px' }} className="actions-column">
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(emp.id)}
                        onChange={() => handleSelectRow(emp.id)}
                      />
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontWeight: 600, fontSize: '18px', color: 'var(--text-dark)' }}>{emp.name}</div>
                      <div style={{ fontSize: '15px', color: 'var(--text-gray)', marginTop: '2px' }}>{emp.id}</div>
                    </td>

                    <td style={{ padding: '16px' }}>
                      <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-dark)' }}>{getCreatedBy(emp)}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-gray)', marginTop: '2px' }}>HR User</div>
                    </td>

                    {/* 1. Completeness Cell */}
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-dark)' }}>{docStatus.text}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: docStatus.color, marginTop: '2px', fontWeight: 600 }}>
                        <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: docStatus.color }}></span>
                        {docStatus.state}
                      </div>
                    </td>

                    {/* 2. Service Cell */}
                    {/* <td style={{ padding: '16px', fontSize: '13px', color: 'var(--text-dark)', fontWeight: 500 }}>
                      {getServiceType(emp)}
                    </td> */}

                    {/* 2. Service Cell */}
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {emp.services && emp.services.length > 0 ? (
                          emp.services.map((svc, idx) => (
                            <span
                              key={idx}
                              style={{
                                fontSize: '11px',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                backgroundColor: 'var(--primary-blue-light)',
                                color: 'var(--primary-blue)',
                                fontWeight: 600,
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {svc}
                            </span>
                          ))
                        ) : (
                          <span
                            style={{
                              fontSize: '11px',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              backgroundColor: 'var(--primary-blue-light)',
                              color: 'var(--primary-blue)',
                              fontWeight: 600
                            }}
                          >
                            Identity Verification
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 3. Last Activity Cell */}
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-dark)' }}>{lastAct.action}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-gray)', marginTop: '2px' }}>{lastAct.date}</div>
                    </td>

                    <td style={{ padding: '16px' }}>
                      <span className={`badge ${getStatusClass(emp.status)}`}>{getStatusLabel(emp.status)}</span>
                    </td>
                    <td style={{ padding: '16px' }} className="actions-column">
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn btn-outline"
                          onClick={() => handleDeleteEmployee(emp.id)}
                          style={{
                            padding: '4px 8px',
                            fontSize: '12px',
                            color: '#dc2626',
                            borderColor: '#fecaca'
                          }}
                        >
                          <Trash2 size={13} style={{ marginRight: '4px' }} />
                          Delete
                        </button>
                        {/* 4. Quick View Action */}
                        <button
                          className="btn btn-outline"
                          onClick={() => setQuickViewEmployee(emp)}
                          style={{ padding: '4px 8px', fontSize: '12px' }}
                        >
                          <Eye size={13} style={{ marginRight: '4px', fontSize: '15px' }} /> Quick View
                        </button>
                        <button
                          className="btn btn-outline"
                          onClick={() => navigate(`/hr/employees/${emp.id}/edit`)}
                          style={{
                            padding: '4px 8px',
                            fontSize: '12px',
                            color: 'var(--primary-blue)'
                          }}
                        >
                          <Edit3 size={13} style={{ marginRight: '4px' }} />
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* 4. Rich Quick View Side Drawer */}
      {quickViewEmployee && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', justifyContent: 'flex-end' }}>
          <div className="details-drawer" style={{ width: '520px', backgroundColor: '#fff', height: '100%', boxShadow: '-4px 0 25px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column' }}>

            {/* Drawer Header */}
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-dark)' }}>{quickViewEmployee.name}</h2>
                  <span className={`badge ${getStatusClass(quickViewEmployee.status)}`}>{getStatusLabel(quickViewEmployee.status)}</span>
                </div>
                <p style={{ color: 'var(--text-gray)', fontSize: '13px', marginTop: '2px' }}>Employee ID: {quickViewEmployee.id} • {getServiceType(quickViewEmployee)}</p>
              </div>
              <button
                onClick={() => setQuickViewEmployee(null)}
                style={{ padding: '8px', borderRadius: '50%', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={18} color="var(--text-gray)" />
              </button>
            </div>

            {/* Drawer Content */}
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* Employee Information */}
              <div className="card" style={{ padding: '16px', backgroundColor: '#f8fafc' }}>
                <h4 style={{ fontSize: '12px', color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px', fontWeight: 700 }}>Employee Details</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px', color: 'var(--text-dark)' }}>
                  <div><span style={{ color: 'var(--text-gray)' }}>DOB:</span> {quickViewEmployee.dob}</div>
                  <div><span style={{ color: 'var(--text-gray)' }}>Contact:</span> {quickViewEmployee.contactNumber || 'N/A'}</div>
                  <div><span style={{ color: 'var(--text-gray)' }}>Father's Name:</span> {quickViewEmployee.fatherName || 'N/A'}</div>
                  <div><span style={{ color: 'var(--text-gray)' }}>Mother's Name:</span> {quickViewEmployee.motherName || 'N/A'}</div>
                </div>
              </div>

              {/* Document Validation Grid */}
              <div className="card" style={{ padding: '16px' }}>
                <h4 style={{ fontSize: '12px', color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px', fontWeight: 700 }}>Documents & Validation Status</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {quickViewEmployee.documents && quickViewEmployee.documents.map((doc, idx) => {
                    let badgeColor = '#10b981'; // green
                    let bg = '#dcfce7';
                    if (doc.status === 'Rejected') { badgeColor = '#dc2626'; bg = '#fee2e2'; }
                    else if (doc.status === 'Re-upload Required') { badgeColor = '#d97706'; bg = '#fef3c7'; }
                    return (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '13px' }}>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-dark)' }}>{doc.type}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-gray)', marginTop: '2px' }}>{doc.name} ({doc.size}) • Quality: <strong>{doc.quality}</strong></div>
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', color: badgeColor, backgroundColor: bg }}>
                          {doc.status}
                        </span>
                      </div>
                    );
                  })}
                  {(!quickViewEmployee.documents || quickViewEmployee.documents.length === 0) && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', border: '1px dashed #cbd5e1', borderRadius: '8px', color: 'var(--text-gray)', fontSize: '12px' }}>
                      <AlertTriangle size={16} color="#d97706" />
                      No documents uploaded. Aadhaar Card and PAN Card are mandatory.
                    </div>
                  )}
                </div>
              </div>

              {/* Timeline Summary */}
              <div className="card" style={{ padding: '16px' }}>
                <h4 style={{ fontSize: '12px', color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px', fontWeight: 700 }}>Verification Timeline</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', paddingLeft: '20px' }}>

                  {/* Vertical Timeline bar */}
                  <div style={{ position: 'absolute', left: '6px', top: '8px', bottom: '8px', width: '2px', backgroundColor: '#e2e8f0' }}></div>

                  {quickViewEmployee.timeline && quickViewEmployee.timeline.map((evt, idx) => (
                    <div key={idx} style={{ position: 'relative' }}>
                      {/* Dot icon indicator */}
                      <div style={{
                        position: 'absolute',
                        left: '-20px',
                        top: '4px',
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: idx === quickViewEmployee.timeline.length - 1 ? 'var(--primary-blue)' : '#cbd5e1',
                        border: '2px solid #fff',
                        boxShadow: '0 0 0 2px ' + (idx === quickViewEmployee.timeline.length - 1 ? 'var(--primary-blue-light)' : '#e2e8f0')
                      }}></div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-dark)' }}>{evt.event}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-gray)', marginTop: '2px' }}>{new Date(evt.date).toLocaleString()} • by {evt.user}</div>
                        {evt.details && (
                          <div style={{ fontSize: '11px', color: 'var(--primary-blue)', marginTop: '4px', fontWeight: 500 }}>{evt.details}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Executive Remarks */}
              {quickViewEmployee.notes && (
                <div className="card" style={{ padding: '16px', borderLeft: '4px solid var(--primary-blue)', backgroundColor: 'var(--primary-blue-light)' }}>
                  <h4 style={{ fontSize: '12px', color: 'var(--primary-blue)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', fontWeight: 700 }}>Executive Remarks</h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-dark)', fontStyle: 'italic' }}>
                    "{quickViewEmployee.notes}"
                  </p>
                </div>
              )}

            </div>

            {/* Drawer Footer Actions */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '12px', backgroundColor: '#f8fafc' }}>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setQuickViewEmployee(null);
                  navigate(`/hr/employees/${quickViewEmployee.id}`);
                }}
                style={{ flex: 1 }}
              >
                Go to Complete Details Screen
              </button>
              {quickViewEmployee.status === 'draft' && (
                <button
                  className="btn btn-outline"
                  onClick={() => {
                    setQuickViewEmployee(null);
                    navigate(`/hr/employees/${quickViewEmployee.id}/edit`);
                  }}
                  style={{ color: 'var(--primary-blue)', backgroundColor: '#fff' }}
                >
                  Resume Draft
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
export default EmployeeList;
