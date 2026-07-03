import React, { useState, useEffect } from 'react';
import { Plus, Search, Building, Users, FileText, RefreshCw, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { mockDb } from '../utils/mockDb';
import { supabase } from '../utils/supabase';

export const ClientAccounts = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [filterIndustry, setFilterIndustry] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const loadClients = async () => {
    setIsLoading(true);
    if (!supabase) {
      // Fallback to MockDb
      setClients(mockDb.getClients());
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error(error);
        return;
      }

      // Fetch all services and HR accounts in two queries instead of one per client
      const { data: allServices, error: svcError } = await supabase
        .from('company_services')
        .select('*');

      if (svcError) console.error('Error fetching services:', svcError);

      const { data: allHrAccounts, error: hrError } = await supabase
        .from('hr_accounts')
        .select('*');

      if (hrError) console.error('Error fetching HR accounts:', hrError);

      const formattedClients = data.map(company => ({
        id: company.id,
        name: company.company_name,
        industry: company.industry,
        hq: company.hq,
        status: company.status,
        services: (allServices || [])
          .filter(s => s.company_id === company.id)
          .map(s => s.service_name),
        hrAccounts: (allHrAccounts || [])
          .filter(h => h.company_id === company.id)
      }));

      setClients(formattedClients);
    } catch (err) {
      console.error('Error fetching clients from Supabase:', err);
    } finally {
      setIsLoading(false);
    }
  }; useEffect(() => {
    loadClients();
  }, []);

  // Derive active employee count per client from employees
  const getEmployeeCount = (clientName) => {
    const emps = mockDb.getEmployees();
    return emps.filter(e => e.company === clientName).length;
  };

  const industries = [...new Set(clients.map(c => c.industry))].sort();

  const filtered = clients.filter(c => {
    if (filterIndustry && c.industry !== filterIndustry) return false;
    if (filterStatus && c.status !== filterStatus) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!c.name.toLowerCase().includes(s) && !c.id.toLowerCase().includes(s)) return false;
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '35px', fontWeight: 700, marginBottom: '8px' }}>Client Accounts</h1>
          <p style={{ fontSize: '20px', color: 'var(--text-gray)' }}>Manage client companies, HR credentials, and verification services.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {/* <button className="btn btn-outline" onClick={() => loadClients()} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={15} /> Refresh
          </button> */}
          <button className="btn btn-primary" onClick={() => navigate('/ops/clients/create')} style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '50px', fontSize: '25px' }}>
            <Plus size={16} />Create Client
          </button>
        </div>
      </div>

      {/* Filters */}
      {/* Filters */}
      <div
        className="card"
        style={{
          padding: "18px 22px",
          display: "flex",
          alignItems: "center",
          gap: "18px",
          flexWrap: "wrap",
          background: "#fff",
          borderRadius: "14px",
          border: "1px solid #e5e7eb",
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
        }}
      >
        {/* Search */}
        <div style={{ flex: 1, minWidth: '280px', position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={20} style={{ position: 'absolute', left: '16px', color: '#94a3b8' }} />
          <input type="text" placeholder="Search Client Name or ID" value={search} onChange={(e) => setSearch(e.target.value)} onFocus={e => e.currentTarget.parentElement.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.1)'} onBlur={e => e.currentTarget.parentElement.style.boxShadow = 'none'} style={{ width: '100%', padding: '14px 16px 14px 48px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '15px', outline: 'none', transition: 'all 0.2s', backgroundColor: '#f8fafc', color: '#0f172a' }} />
        </div>

        {/* Industry */}
        <div style={{ position: "relative", display: "flex", flexDirection: "column", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "6px 16px", minWidth: "180px", transition: "all 0.2s" }} onFocusCapture={e => e.currentTarget.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.1)'} onBlurCapture={e => e.currentTarget.style.boxShadow = 'none'}>
          <label style={{ fontSize: "11px", color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "2px" }}>Industry</label>
          <select value={filterIndustry} onChange={(e) => setFilterIndustry(e.target.value)} style={{ border: "none", background: "transparent", outline: "none", fontSize: "14px", fontWeight: 600, color: "#0f172a", padding: "0", width: "100%", appearance: "none", cursor: "pointer" }}>
            <option value="">All Industries</option>
            {industries.map((industry) => (
              <option key={industry} value={industry}>{industry}</option>
            ))}
          </select>
          <span style={{ position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#94a3b8", fontSize: "10px" }}>▼</span>
        </div>

        {/* Status */}
        <div style={{ position: "relative", display: "flex", flexDirection: "column", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "6px 16px", minWidth: "180px", transition: "all 0.2s" }} onFocusCapture={e => e.currentTarget.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.1)'} onBlurCapture={e => e.currentTarget.style.boxShadow = 'none'}>
          <label style={{ fontSize: "11px", color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "2px" }}>Status</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ border: "none", background: "transparent", outline: "none", fontSize: "14px", fontWeight: 600, color: "#0f172a", padding: "0", width: "100%", appearance: "none", cursor: "pointer" }}>
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Suspended">Suspended</option>
          </select>
          <span style={{ position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#94a3b8", fontSize: "10px" }}>▼</span>
        </div>

        {/* Counter */}
        <div
          style={{
            marginLeft: "auto",
            padding: "8px 16px",
            background: "#eef4ff",
            color: "#2563eb",
            borderRadius: "20px",
            fontSize: "13px",
            fontWeight: "600"
          }}
        >
          {filtered.length} of {clients.length} Clients
        </div>
      </div>
      {/* Table */}
      {isLoading ? (
        <div className="card" style={{ padding: '64px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <Loader size={48} className="spin" color="var(--primary-blue)" />
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-dark)' }}>Loading Clients...</h3>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding: '64px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <Building size={48} color="var(--text-gray)" style={{ opacity: 0.3 }} />
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-dark)' }}>No Clients Found</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-gray)' }}>No clients match your search. Create the first client account to get started.</p>
          <button className="btn btn-primary" onClick={() => navigate('/ops/clients/create')}>
            <Plus size={16} /> Create Client Account
          </button>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '14px 16px', fontSize: '18px', fontWeight: 600, color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>CLIENT</th>
                <th style={{ padding: '14px 16px', fontSize: '18px', fontWeight: 600, color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>INDUSTRY & HQ</th>
                <th style={{ padding: '14px 16px', font0Size: '18px', fontWeight: 600, color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>SERVICES</th>
                <th style={{ padding: '14px 16px', fontSize: '18px', fontWeight: 600, color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>HR ACCOUNTS</th>
                {/* <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 600, color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>EMPLOYEES</th> */}
                <th style={{ padding: '14px 16px', fontSize: '18px', fontWeight: 600, color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>STATUS</th>
                <th style={{ padding: '14px 16px', fontSize: '18px', fontWeight: 600, color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((client) => {
                const empCount = getEmployeeCount(client.name);
                return (
                  <tr
                    key={client.id}
                    className="table-row-hover"
                    style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }}
                    onClick={() => navigate(`/ops/clients/${client.id}`)}
                  >
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="avatar" style={{ backgroundColor: 'var(--primary-blue-light)', color: 'var(--primary-blue)', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Building size={18} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 300, fontSize: '15px', color: 'var(--text-dark)' }}>{client.name}</div>
                          <div style={{ fontSize: '18px', color: 'var(--text-gray)', marginTop: '2px' }}>ID: {client.id}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px', fontSize: '15px' }}>
                      <div style={{ fontWeight: 500, color: 'var(--text-dark)' }}>{client.industry}</div>
                      <div style={{ fontSize: '18px', color: 'var(--text-gray)', marginTop: '2px' }}>{client.hq}</div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {(client.services || []).slice(0, 2).map(s => (
                          <span key={s} style={{ fontSize: '15px', fontWeight: 600, padding: '2px 8px', borderRadius: '10px', backgroundColor: 'var(--primary-blue-light)', color: 'var(--primary-blue)' }}>
                            {s.replace(' Verification', '')}
                          </span>
                        ))}
                        {(client.services || []).length > 2 && (
                          <span style={{ fontSize: '20px', fontWeight: 600, padding: '2px 8px', borderRadius: '10px', backgroundColor: '#f1f5f9', color: 'var(--text-gray)' }}>
                            +{client.services.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '16px', fontSize: '24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Users size={24} color="var(--text-gray)" />
                        <span style={{ fontWeight: 500 }}>{(client.hrAccounts.length)}</span>
                        <span style={{ color: 'var(--text-gray)', fontSize: '18px' }}>users</span>
                      </div>
                    </td>
                    {/* <td style={{ padding: '16px', fontSize: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FileText size={16} color="var(--text-gray)" />
                        <span style={{ fontWeight: 500 }}>{empCount}</span>
                        <span style={{ color: 'var(--text-gray)', fontSize: '12px' }}>forms</span>
                      </div>
                    </td> */}
                    <td style={{ padding: '16px' }}>
                      <span className={client.status === 'Active' ? 'badge badge-completed' : 'badge badge-rejected'}>
                        {client.status}
                      </span>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                      <button
                        className="btn btn-outline"
                        onClick={() => navigate(`/ops/clients/${client.id}`)}
                        style={{ padding: '10px 20px', fontSize: '15px' }}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
