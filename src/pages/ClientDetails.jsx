//ClientDetails.jsx


import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, Building2, Users, FileText, CheckCircle2, Key,
  Plus, History, Settings, MoreVertical, Edit2, Trash2,
  Phone, Mail, Zap, Power, ShieldCheck, X, Check, Loader
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { mockDb } from '../utils/mockDb';
import { supabase } from '../utils/supabase';


export const ClientDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [client, setClient] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [showAddHR, setShowAddHR] = useState(false);
  const [hrForm, setHrForm] = useState({ name: '', email: '', role: 'HR' });
  const [hrFormErrors, setHrFormErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);

    const { data: company, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(error);
      setClient(null);
      setIsLoading(false);
      return;
    }

    const { data: servicesData } = await supabase
      .from('company_services')
      .select('*')
      .eq('company_id', id);

    const { data: hrData } = await supabase
      .from('hr_accounts')
      .select('*')
      .eq('company_id', id);

    const { data: employeesData } = await supabase
      .from('employees')
      .select('*')
      .eq('company_id', id)
      .order('created_at', { ascending: false });

    if (employeesData) {
      const formattedEmployees = employeesData.map(e => ({
        ...e,
        name: e.first_name ? `${e.first_name} ${e.last_name}` : e.name,
        submittedDate: e.submitted_at || e.created_at,
        status: e.verification_status || 'draft'
      }));
      setEmployees(formattedEmployees);
    }

    const formattedClient = {
      id: company.id,
      name: company.company_name,
      industry: company.industry,
      hq: company.hq,
      gstNumber: company.gst_number,

      contactPerson: company.contact_person,
      contactEmail: company.email,
      contactPhone: company.phone,

      billingContact: company.billing_contact,
      billingEmail: company.billing_email,
      billingPhone: company.billing_phone,

      status: company.status,
      createdDate: company.created_at,

      services: servicesData?.map(
        service => service.service_name
      ) || [],

      hrAccounts: hrData || [],

      timeline: []
    };

    setClient(formattedClient);

    // const { data: hrData } = await supabase
    //   .from('hr_accounts')
    //   .select('*')
    //   .eq('company_id', id);

    // formattedClient.hrAccounts = hrData || [];

    setClient({ ...formattedClient });
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="card" style={{ padding: '64px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <Loader size={48} className="spin" color="var(--primary-blue)" />
        <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-dark)' }}>Loading Client Details...</h3>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="card" style={{ padding: '64px', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--text-gray)' }}>Client not found.</h2>
        <button className="btn btn-outline" onClick={() => navigate('/ops/clients')} style={{ marginTop: '16px' }}>
          Back to Client List
        </button>
      </div>
    );
  }

  // ── Computed stats ────────────────────────────────────────────
  const stats = {
    total: client.hrAccounts.length,
    active: employees.filter(e => ['submitted', 'assigned', 'in-progress', 'call-pending', 'otp-received'].includes(e.status)).length,
    completed: employees.filter(e => e.status === 'completed').length,
    rejected: employees.filter(e => e.status === 'rejected').length,
  };

  // ── Add HR account ────────────────────────────────────────────
  const validateHrForm = () => {
    const e = {};
    if (!hrForm.name.trim()) e.name = 'Name required.';
    if (!hrForm.email.trim()) e.email = 'Email required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(hrForm.email)) e.email = 'Valid email required.';
    setHrFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAddHR = async () => {

    console.log("HANDLE ADD HR CLICKED");

    const isValid = validateHrForm();

    console.log("VALIDATION RESULT:", isValid);
    console.log("FORM DATA:", hrForm);


    if (!validateHrForm()) return;

    const { data, error } = await supabase
      .from('hr_accounts')
      .insert([
        {
          company_id: client.id,
          name: hrForm.name.trim(),
          email: hrForm.email.trim(),
          role: 'HR',
          status: 'Active'
        }
      ])
      .select();

    console.log("HR INSERT:", data);
    console.log("HR ERROR:", error);

    if (error) {
      alert(error.message);
      return;
    }

    setHrForm({
      name: '',
      email: '',
      role: 'HR'
    });

    setHrFormErrors({});
    setShowAddHR(false);

    loadData();
  };
  console.log("CLIENT:", client);
  console.log("CLIENT ID:", client?.id);


  // ── Toggle HR status ──────────────────────────────────────────
  const toggleHRStatus = async (hrId) => {
    const targetHr = client.hrAccounts.find(hr => hr.id === hrId);
    if (!targetHr) return;

    const newStatus = targetHr.status === 'Active' ? 'Locked' : 'Active';

    const { error } = await supabase
      .from('hr_accounts')
      .update({ status: newStatus })
      .eq('id', hrId);

    if (error) {
      console.error('Error updating HR account status:', error);
      alert(`Failed to update account status: ${error.message}`);
      return;
    }

    const action = newStatus === 'Locked' ? 'Locked' : 'Unlocked';
    const updatedTimeline = [
      ...(client.timeline || []),
      { event: `Account ${action} (${targetHr.name})`, user: 'Operations', date: new Date().toISOString() }
    ];

    // Keep timeline locally since there's no Supabase table for it yet
    setClient(prev => ({ ...prev, timeline: updatedTimeline }));

    loadData(); // re-fetch so hrAccounts reflects the real updated status
  };
  
  const fmtDate = (d) => d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Never';

  const inputStyle = { padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px', width: '100%', boxSizing: 'border-box', outline: 'none' };
  const errorInputStyle = { ...inputStyle, borderColor: '#ef4444' };
  const labelStyle = { fontSize: '12px', fontWeight: 600, color: 'var(--text-gray)', marginBottom: '5px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.3px' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button onClick={() => navigate('/ops/clients')} style={{ padding: '8px', borderRadius: '50%', backgroundColor: '#fff', border: '1px solid var(--border-color)', cursor: 'pointer' }}>
          <ArrowLeft size={20} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>{client.name}</h1>
          <p style={{ color: 'var(--text-gray)', fontSize: '14px' }}>
            Client ID: {client.id} • {client.industry} • {client.hq} • Since {new Date(client.createdDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {/* <button className="btn btn-outline" onClick={() => navigate('/hr/employees/create', {
            state: {
              companyId: client.id,
              companyName: client.name
            }
          })} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Users size={15} /> Add Employee (HR)
          </button> */}
          <button className="btn btn-outline" onClick={() => setShowAddHR(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Key size={15} /> Add HR Account
          </button>
          <button className="btn btn-outline" onClick={() => navigate(`/ops/clients/${id}/edit`)} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#3b82f6', borderColor: '#3b82f6' }}>
            <Edit2 size={15} /> Edit Client
          </button>
          <button className="btn btn-outline" onClick={async () => {
            if (window.confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
              const { error } = await supabase.from('companies').delete().eq('id', id);
              if (error) {
                console.error("Error deleting client:", error);
                alert("Failed to delete client.");
              } else {
                navigate('/ops/clients');
              }
            }
          }} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444', borderColor: '#ef4444' }}>
            <Trash2 size={15} /> Delete Client
          </button>
        </div>
      </div>

      {/* Health Dashboard */}
      <div className="card" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Zap size={18} color="var(--primary-blue)" /> Client Health Dashboard
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          {[
            { label: 'TOTAL EMPLOYEES || HR', val: stats.total, color: 'var(--text-dark)' },
            { label: 'ACTIVE VERIFICATIONS', val: stats.active, color: '#0284c7' },
            { label: 'COMPLETED', val: stats.completed, color: '#166534' },
            { label: 'REJECTED', val: stats.rejected, color: '#dc2626' },
          ].map((s, i) => (
            <div key={i} style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-gray)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</span>
              <div style={{ fontSize: '32px', fontWeight: 700, color: s.color, marginTop: '8px' }}>{s.val}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>

        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Company Profile */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <Building2 size={18} color="var(--primary-blue)" />
              <h2 style={{ fontSize: '16px', fontWeight: 600 }}>Company Profile</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                ['Industry', client.industry],
                ['HQ', client.hq],
                ['GST', client.gstNumber || '—'],
                ['Status', null],
              ].map(([label, val]) => (
                <div key={label}>
                  <span style={{ fontSize: '12px', color: 'var(--text-gray)', fontWeight: 600, textTransform: 'uppercase' }}>{label}</span>
                  {label === 'Status' ? (
                    <div style={{ marginTop: '4px' }}>
                      <span className={client.status === 'Active' ? 'badge badge-completed' : 'badge badge-rejected'}>{client.status}</span>
                    </div>
                  ) : (
                    <div style={{ fontWeight: 500, fontSize: '14px', marginTop: '4px' }}>{val}</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Contacts */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <Phone size={18} color="var(--primary-blue)" />
              <h2 style={{ fontSize: '16px', fontWeight: 600 }}>Contacts</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-gray)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>Primary Contact</div>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>{client.contactPerson}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-gray)', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Mail size={14} /> {client.contactEmail}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-gray)', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Phone size={14} /> {client.contactPhone}
                </div>
              </div>
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-gray)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>Billing Contact</div>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>{client.billingContact || client.contactPerson}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-gray)', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Mail size={14} /> {client.billingEmail || client.contactEmail}
                </div>
              </div>
            </div>
          </div>

          {/* Services */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <Settings size={18} color="var(--primary-blue)" />
              <h2 style={{ fontSize: '16px', fontWeight: 600 }}>Services</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(client.services || []).map(svc => (
                <div key={svc} style={{ padding: '10px 12px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-dark)' }}>{svc}</span>
                </div>
              ))}
              {(!client.services || client.services.length === 0) && (
                <p style={{ fontSize: '13px', color: 'var(--text-gray)', fontStyle: 'italic' }}>No services assigned.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* HR Account Management */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={18} color="var(--primary-blue)" /> HR Account Management
              </h2>
              <button className="btn btn-outline" onClick={() => setShowAddHR(true)} style={{ fontSize: '13px', padding: '6px 14px' }}>
                <Plus size={14} style={{ marginRight: '4px' }} /> Add Account
              </button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-gray)', fontSize: '12px', textTransform: 'uppercase' }}>
                  <th style={{ paddingBottom: '12px', fontWeight: 600 }}>NAME & EMAIL</th>
                  <th style={{ paddingBottom: '12px', fontWeight: 600 }}>ROLE</th>
                  <th style={{ paddingBottom: '12px', fontWeight: 600 }}>LAST LOGIN</th>
                  <th style={{ paddingBottom: '12px', fontWeight: 600 }}>STATUS</th>
                  <th style={{ paddingBottom: '12px', fontWeight: 600, textAlign: 'right' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {(client.hrAccounts || []).map((hr) => (
                  <tr key={hr.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '16px 0' }}>
                      <div style={{ fontWeight: 600, fontSize: '14px' }}>{hr.name}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-gray)', marginTop: '2px' }}>{hr.email}</div>
                    </td>
                    <td style={{ padding: '16px 0', fontSize: '14px', color: 'var(--text-dark)' }}>HR</td>
                    <td style={{ padding: '16px 0', fontSize: '13px', color: 'var(--text-gray)' }}>{fmtDate(hr.lastLogin)}</td>
                    <td style={{ padding: '16px 0' }}>
                      <span className={hr.status === 'Active' ? 'badge badge-completed' : 'badge badge-rejected'}>
                        {hr.status}
                      </span>
                    </td>
                    <td style={{ padding: '16px 0', textAlign: 'right' }}>
                      <button
                        onClick={() => toggleHRStatus(hr.id)}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: hr.status === 'Active' ? '#ef4444' : '#10b981', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}
                        title={hr.status === 'Active' ? 'Lock Account' : 'Unlock Account'}
                      >
                        <Power size={14} /> {hr.status === 'Active' ? 'Lock' : 'Unlock'}
                      </button>
                    </td>
                  </tr>
                ))}
                {(!client.hrAccounts || client.hrAccounts.length === 0) && (
                  <tr>
                    <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-gray)', fontSize: '14px' }}>
                      No HR accounts yet. <button onClick={() => setShowAddHR(true)} style={{ background: 'none', border: 'none', color: 'var(--primary-blue)', cursor: 'pointer', fontWeight: 600 }}>Create one →</button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Credential Audit Log */}
            {(client.timeline || []).length > 0 && (
              <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-dark)' }}>
                  <History size={16} color="var(--text-gray)" /> Timeline & Audit Log
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {client.timeline.slice().reverse().map((log, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', alignItems: 'flex-start' }}>
                      <div>
                        <span style={{ fontWeight: 600 }}>{log.event}</span>
                        <span style={{ color: 'var(--text-gray)' }}> by {log.user}</span>
                      </div>
                      <div style={{ color: 'var(--text-gray)', fontSize: '12px', whiteSpace: 'nowrap', marginLeft: '16px' }}>{fmtDate(log.date)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Recent Created Employees */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={18} color="var(--primary-blue)" /> Recent Created Employee
              </h2>
              <button className="btn btn-outline" onClick={() => navigate('/ops/forms')} style={{ fontSize: '13px', padding: '6px 14px' }}>
                View All
              </button>
            </div>
            {employees.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-gray)', fontSize: '14px' }}>
                No employees created by this client yet.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-gray)', fontSize: '12px', textTransform: 'uppercase' }}>
                    <th style={{ paddingBottom: '12px', fontWeight: 600 }}>EMPLOYEE</th>
                    <th style={{ paddingBottom: '12px', fontWeight: 600 }}>CREATED</th>
                    <th style={{ paddingBottom: '12px', fontWeight: 600 }}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.slice(0, 5).map(emp => (
                    <tr
                      key={emp.id}
                      className="table-row-hover"
                      style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }}
                      onClick={() => navigate(`/ops/forms`)}
                    >
                      <td style={{ padding: '16px 0' }}>
                        <div style={{ fontWeight: 600, fontSize: '14px' }}>{emp.name}</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-gray)', marginTop: '2px' }}>{emp.id}</div>
                      </td>
                      <td style={{ padding: '16px 0', fontSize: '13px', color: 'var(--text-gray)' }}>
                        {emp.created_at ? new Date(emp.created_at).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td style={{ padding: '16px 0' }}>
                        <span className={`badge badge-${emp.status === 'completed' ? 'completed' : emp.status === 'rejected' ? 'rejected' : emp.status === 'draft' ? 'draft' : 'submitted'}`}>
                          {emp.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Recent Employees */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} color="var(--primary-blue)" /> Recent Employee Submissions
              </h2>
              <button className="btn btn-outline" onClick={() => navigate('/ops/forms')} style={{ fontSize: '13px', padding: '6px 14px' }}>
                View All
              </button>
            </div>
            {employees.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-gray)', fontSize: '14px' }}>
                No employee forms submitted by this client yet.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-gray)', fontSize: '12px', textTransform: 'uppercase' }}>
                    <th style={{ paddingBottom: '12px', fontWeight: 600 }}>EMPLOYEE</th>
                    <th style={{ paddingBottom: '12px', fontWeight: 600 }}>SUBMITTED</th>
                    <th style={{ paddingBottom: '12px', fontWeight: 600 }}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.slice(0, 5).map(emp => (
                    <tr
                      key={emp.id}
                      className="table-row-hover"
                      style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }}
                      onClick={() => navigate(`/ops/forms`)}
                    >
                      <td style={{ padding: '16px 0' }}>
                        <div style={{ fontWeight: 600, fontSize: '14px' }}>{emp.name}</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-gray)', marginTop: '2px' }}>{emp.id}</div>
                      </td>
                      <td style={{ padding: '16px 0', fontSize: '13px', color: 'var(--text-gray)' }}>
                        {emp.submittedDate ? new Date(emp.submittedDate).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td style={{ padding: '16px 0' }}>
                        <span className={`badge badge-${emp.status === 'completed' ? 'completed' : emp.status === 'rejected' ? 'rejected' : emp.status === 'draft' ? 'draft' : 'submitted'}`}>
                          {emp.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* ── Add HR Modal ────────────────────────────────────────── */}
      {showAddHR && (
        <>
          <div onClick={() => setShowAddHR(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 300 }} />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            zIndex: 301, backgroundColor: '#fff', borderRadius: '12px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)', width: '480px', overflow: 'hidden'
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-dark)' }}>Add HR Account</h2>
              <button onClick={() => setShowAddHR(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={20} color="var(--text-gray)" />
              </button>
            </div>
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Full Name *</label>
                <input type="text" value={hrForm.name} onChange={e => setHrForm(p => ({ ...p, name: e.target.value }))} placeholder="HR Contact Name" style={hrFormErrors.name ? errorInputStyle : inputStyle} />
                {hrFormErrors.name && <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>{hrFormErrors.name}</div>}
              </div>
              <div>
                <label style={labelStyle}>Email Address *</label>
                <input type="email" value={hrForm.email} onChange={e => setHrForm(p => ({ ...p, email: e.target.value }))} placeholder="hr@company.in" style={hrFormErrors.email ? errorInputStyle : inputStyle} />
                {hrFormErrors.email && <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>{hrFormErrors.email}</div>}
              </div>
              <div>
                <label style={labelStyle}>Role</label>
                <p>HR</p>
              </div>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowAddHR(false)} className="btn btn-outline" style={{ fontSize: '13px' }}>Cancel</button>
              <button onClick={handleAddHR} className="btn btn-primary" style={{ fontSize: '13px' }}>
                <Check size={14} /> Create HR Account
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
