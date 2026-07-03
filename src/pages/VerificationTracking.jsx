import React, { useState, useEffect } from 'react';
import { Search, Filter, Kanban, Table as TableIcon, Clock, AlertTriangle, Users, Edit2, Flag, X, FileText, History, Info, MessageSquare, Building, ShieldCheck, ChevronDown } from 'lucide-react';

import { getSupabaseEmployees, getSupabaseClients, supabase } from '../utils/supabase';
import { mockDb } from '../utils/mockDb';
import PageHeader from '../components/common/PageHeader';

const STATUSES = [
  "Submitted",
  "Assigned",
  "In Progress",
  "Rejected",
  "Completed"
];

export const VerificationTracking = () => {
  const [view, setView] = useState('kanban');
  const [data, setData] = useState([]);
  const [companiesList, setCompaniesList] = useState([]);
  const [allCompanies, setAllCompanies] = useState([]);
  const [allHrAccounts, setAllHrAccounts] = useState([]);
  const [modalData, setModalData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      let hrAccountsData = [];
      let clientsData = [];
      let employees = [];

      if (supabase) {
        const hrAccountsRes = await supabase.from('hr_accounts').select('*');
        if (hrAccountsRes.error) console.error('Error fetching HR accounts:', hrAccountsRes.error);
        hrAccountsData = hrAccountsRes.data || [];
        
        const [empData, cliData] = await Promise.all([
          getSupabaseEmployees(),
          getSupabaseClients()
        ]);
        employees = empData || [];
        clientsData = cliData || [];
      } else {
        // Fallback to mock data if supabase is not configured
        employees = mockDb.getEmployees() || [];
        clientsData = mockDb.getClients() || [];
        // Extract HR accounts from mock clients
        clientsData.forEach(client => {
          if (client.hrAccounts) {
            hrAccountsData = [...hrAccountsData, ...client.hrAccounts.map(hr => ({ ...hr, company_id: client.id }))];
          }
        });
      }

      setCompaniesList([...new Set((clientsData || []).map(c => c.company_name || c.name).filter(Boolean))]);
      setAllCompanies(clientsData || []);
      setAllHrAccounts(hrAccountsData || []);

      const formattedData = employees.map(emp => {
        const submitEvent = emp.timeline?.find(
          t => t.event === "Submitted"
        );

        const escalationEvent = emp.timeline?.find(
          t => t.event === "Escalated"
        );

        const exec =
          emp.assigned_name ||
          "Unassigned";

        const isAssigned =
          !!emp.assigned_to;

        // Calculate SLA (20 min Warning, 30 min Breach)

        const createdTime = new Date(emp.createdDate);

        let sla = "Safe";

        if (!isAssigned) {

          const diffMinutes =
            (Date.now() - createdTime.getTime()) / (1000 * 60);

          if (diffMinutes >= 30)
            sla = "30 Min Breached";
          else if (diffMinutes >= 20)
            sla = "20 Min Warning";
        }
        // Calculate last update
        // let displayStatus = "Assigned";
        // Calculate last update
        let lastUpdate = "Just now";

        if (emp.timeline && emp.timeline.length > 0) {
          const lastEvent = emp.timeline[emp.timeline.length - 1];

          const updateDiff = Math.floor(
            (Date.now() - new Date(lastEvent.date)) /
            (1000 * 60 * 60)
          );

          if (updateDiff > 24)
            lastUpdate = `${Math.floor(updateDiff / 24)}d ago`;
          else if (updateDiff > 0)
            lastUpdate = `${updateDiff}h ago`;
        }

        // Map employee status to Kanban status
        let displayStatus = "Submitted";

        // First check assignment
        if (!isAssigned) {

          displayStatus = "Submitted";

        } else {


          switch ((emp.status || "").toLowerCase()) {

            case "assigned":
              displayStatus = "Assigned";
              break;

            case "in-progress":
            case "call-received":
            case "otp-shared":
            case "cfc-verification":
            case "final-client-invoice":
            case "report-submission":
              displayStatus = "In Progress";
              break;

            case "completed":
              displayStatus = "Completed";
              break;

            case "rejected":
              displayStatus = "Rejected";
              break;

            default:
              displayStatus = "Assigned";
          }

        }

        return {
          id: emp.id,
          employee: emp.name,
          company: emp.company || "Unknown",
          client: emp.company || "Unknown",
          exec: isAssigned
            ? exec
            : "Unassigned",
          service: emp.services ? emp.services[0] : "Identity Verification",
          priority: emp.priority || "Medium",
          sla,

          status: displayStatus,

          escalated: !!escalationEvent || emp.priority === "Urgent",
          escReason: escalationEvent
            ? escalationEvent.details
            : "Client urgently requesting update",
          escBy: escalationEvent
            ? escalationEvent.user
            : "Operations Manager",
          escDate: escalationEvent
            ? new Date(escalationEvent.date).toLocaleDateString()
            : "Recent",
          lastUpdate
        };
      });

      setData(formattedData);
    };
    fetchData();
  }, []);

  // Filters
  const [search, setSearch] = useState('');
  const [filterCompany, setFilterCompany] = useState('All');
  const [filterClient, setFilterClient] = useState('All');
  const [filterService, setFilterService] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterSla, setFilterSla] = useState('All');
  const [filterEscalated, setFilterEscalated] = useState('All');

  const filteredData = data.filter(item => {
    return (item.employee.toLowerCase().includes(search.toLowerCase()) || item.id.toLowerCase().includes(search.toLowerCase())) &&
      (filterCompany === 'All' || item.company === filterCompany) &&
      (filterClient === 'All' || item.client === filterClient) &&
      (filterService === 'All' || item.service === filterService) &&
      (filterPriority === 'All' || item.priority === filterPriority) &&
      (filterSla === 'All' || item.sla === filterSla) &&
      (filterEscalated === 'All' || (filterEscalated === 'Yes' ? item.escalated : !item.escalated));
  });

  const getSlaStyle = (sla) => {
    switch (sla) {

      case "30 Min Breached":
        return {
          bg: "#fef2f2",
          color: "#991b1b",
          border: "#fecaca"
        };

      case "20 Min Warning":
        return {
          bg: "#fff7ed",
          color: "#9a3412",
          border: "#fed7aa"
        };

      default:
        return {
          bg: "#f0fdf4",
          color: "#166534",
          border: "#bbf7d0"
        };
    }
  };

  const uniqueCompanies = companiesList;
  
  let uniqueClients = [];
  if (filterCompany === 'All') {
    uniqueClients = [...new Set(allHrAccounts.map(hr => hr.name))].filter(Boolean);
  } else {
    const selectedCompany = allCompanies.find(c => c.company_name === filterCompany);
    if (selectedCompany) {
      uniqueClients = allHrAccounts
        .filter(hr => hr.company_id === selectedCompany.id)
        .map(hr => hr.name)
        .filter(Boolean);
    }
  }

  const uniqueServices = ["Identity Verification", "Background Verification", "Police Verification", "Address Verification"];
  const uniqueSlas = ["Safe", "20 Min Warning", "30 Min Breached"];

  const activeCount = data.length;
  const safeCount =
    data.filter(d => d.sla === "Safe").length;

  const warningCount =
    data.filter(d => d.sla === "20 Min Warning").length;

  const breachedCount =
    data.filter(d => d.sla === "30 Min Breached").length;
  const escalatedCount = data.filter(d => d.escalated).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '8px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
        <div>
          <PageHeader 
            title="Verification Tracking" 
            subtitle="Command center for overseeing verification workflows, SLAs, and escalations."
            icon={ShieldCheck}
          />
        </div>
      </div>

      {/* SLA Dashboard Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px', marginTop: '8px' }}>
        <div style={{ padding: '24px', borderRadius: '20px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.1)', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', cursor: 'default', position: 'relative', overflow: 'hidden' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, rgba(255,255,255,0) 70%)', transform: 'translate(30%, -30%)' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase' }}>Total Active</div>
              <div style={{ fontSize: '38px', fontWeight: 800, marginTop: '8px', color: '#0f172a', lineHeight: 1 }}>{activeCount}</div>
            </div>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
              <Users size={24} strokeWidth={2.5} />
            </div>
          </div>
        </div>

        <div style={{ padding: '24px', borderRadius: '20px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(34, 197, 94, 0.1)', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', cursor: 'default', position: 'relative', overflow: 'hidden' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(34,197,94,0.1) 0%, rgba(255,255,255,0) 70%)', transform: 'translate(30%, -30%)' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '13px', color: '#15803d', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase' }}>On Track (Safe)</div>
              <div style={{ fontSize: '38px', fontWeight: 800, marginTop: '8px', color: '#166534', lineHeight: 1 }}>{safeCount}</div>
            </div>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
              <Flag size={24} strokeWidth={2.5} />
            </div>
          </div>
        </div>

        <div style={{ padding: '24px', borderRadius: '20px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(249, 115, 22, 0.1)', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', cursor: 'default', position: 'relative', overflow: 'hidden' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(249,115,22,0.1) 0%, rgba(255,255,255,0) 70%)', transform: 'translate(30%, -30%)' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '13px', color: '#c2410c', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase' }}>Warning (20 Mins)</div>
              <div style={{ fontSize: '38px', fontWeight: 800, marginTop: '8px', color: '#9a3412', lineHeight: 1 }}>{warningCount}</div>
            </div>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ea580c' }}>
              <Clock size={24} strokeWidth={2.5} />
            </div>
          </div>
        </div>

        <div style={{ padding: '24px', borderRadius: '20px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(239, 68, 68, 0.1)', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', cursor: 'default', position: 'relative', overflow: 'hidden' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(239,68,68,0.1) 0%, rgba(255,255,255,0) 70%)', transform: 'translate(30%, -30%)' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '13px', color: '#b91c1c', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase' }}>Breached (30 Mins)</div>
              <div style={{ fontSize: '38px', fontWeight: 800, marginTop: '8px', color: '#7f1d1d', lineHeight: 1 }}>{breachedCount}</div>
            </div>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }}>
              <AlertTriangle size={24} strokeWidth={2.5} />
            </div>
          </div>
        </div>
        {/* <div className="card" style={{ padding: '16px', borderTop: '4px solid #991b1b', backgroundColor: '#fef2f2' }}>
          <div style={{ fontSize: '12px', color: '#991b1b', fontWeight: 600 }}>ESCALATED CASES</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#991b1b' }}>{escalatedCount}</div>
        </div> */}
      </div>

      {/* Control Bar (Filters & View Toggles) */}
      <div style={{ padding: '24px', backgroundColor: '#ffffff', borderRadius: '20px', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.03), 0 0 3px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', flex: 1 }}>
            <div style={{ flex: 1, minWidth: '280px', position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={20} style={{ position: 'absolute', left: '16px', color: '#94a3b8' }} />
              <input 
                type="text" 
                placeholder="Search ID or Name" 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                onFocus={e => {e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.15)'; e.currentTarget.style.borderColor = '#3b82f6'}} 
                onBlur={e => {e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#e2e8f0'}} 
                style={{ width: '100%', height: '52px', padding: '0 16px 0 48px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '15px', outline: 'none', transition: 'all 0.2s', backgroundColor: '#f8fafc', color: '#0f172a', fontWeight: 500 }} 
              />
            </div>

            <div style={{ position: "relative", display: "flex", flexDirection: "column", justifyContent: "center", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "0 16px", minWidth: "180px", height: "52px", transition: "all 0.2s", cursor: "pointer" }} onFocusCapture={e => {e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.15)'; e.currentTarget.style.borderColor = '#3b82f6'}} onBlurCapture={e => {e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#e2e8f0'}}>
              <label style={{ fontSize: "10px", color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "2px", pointerEvents: "none" }}>Company</label>
              <select value={filterCompany} onChange={(e) => setFilterCompany(e.target.value)} style={{ border: "none", background: "transparent", outline: "none", fontSize: "14px", fontWeight: 600, color: "#0f172a", padding: "0", width: "100%", appearance: "none", cursor: "pointer" }}>
                <option value="All">All Companies</option>
                {uniqueCompanies.map((c, i) => <option key={i} value={c}>{c}</option>)}
              </select>
              <div style={{ position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", display: "flex", color: "#94a3b8" }}>
                <ChevronDown size={16} />
              </div>
            </div>

            <div style={{ position: "relative", display: "flex", flexDirection: "column", justifyContent: "center", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "0 16px", minWidth: "180px", height: "52px", transition: "all 0.2s", cursor: "pointer" }} onFocusCapture={e => {e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.15)'; e.currentTarget.style.borderColor = '#3b82f6'}} onBlurCapture={e => {e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#e2e8f0'}}>
              <label style={{ fontSize: "10px", color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "2px", pointerEvents: "none" }}>Client Account</label>
              <select value={filterClient} onChange={(e) => setFilterClient(e.target.value)} style={{ border: "none", background: "transparent", outline: "none", fontSize: "14px", fontWeight: 600, color: "#0f172a", padding: "0", width: "100%", appearance: "none", cursor: "pointer" }}>
                <option value="All">All Client Accounts</option>
                {uniqueClients.map((c, i) => <option key={i} value={c}>{c}</option>)}
              </select>
              <div style={{ position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", display: "flex", color: "#94a3b8" }}>
                <ChevronDown size={16} />
              </div>
            </div>

            <div style={{ position: "relative", display: "flex", flexDirection: "column", justifyContent: "center", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "0 16px", minWidth: "180px", height: "52px", transition: "all 0.2s", cursor: "pointer" }} onFocusCapture={e => {e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.15)'; e.currentTarget.style.borderColor = '#3b82f6'}} onBlurCapture={e => {e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#e2e8f0'}}>
              <label style={{ fontSize: "10px", color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "2px", pointerEvents: "none" }}>Service</label>
              <select value={filterService} onChange={(e) => setFilterService(e.target.value)} style={{ border: "none", background: "transparent", outline: "none", fontSize: "14px", fontWeight: 600, color: "#0f172a", padding: "0", width: "100%", appearance: "none", cursor: "pointer" }}>
                <option value="All">All Services</option>
                {uniqueServices.map((s, i) => <option key={i} value={s}>{s}</option>)}
              </select>
              <div style={{ position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", display: "flex", color: "#94a3b8" }}>
                <ChevronDown size={16} />
              </div>
            </div>

            <div style={{ position: "relative", display: "flex", flexDirection: "column", justifyContent: "center", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "0 16px", minWidth: "180px", height: "52px", transition: "all 0.2s", cursor: "pointer" }} onFocusCapture={e => {e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.15)'; e.currentTarget.style.borderColor = '#3b82f6'}} onBlurCapture={e => {e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#e2e8f0'}}>
              <label style={{ fontSize: "10px", color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "2px", pointerEvents: "none" }}>SLA Status</label>
              <select value={filterSla} onChange={(e) => setFilterSla(e.target.value)} style={{ border: "none", background: "transparent", outline: "none", fontSize: "14px", fontWeight: 600, color: "#0f172a", padding: "0", width: "100%", appearance: "none", cursor: "pointer" }}>
                <option value="All">All SLAs</option>
                {uniqueSlas.map((s, i) => <option key={i} value={s}>{s}</option>)}
              </select>
              <div style={{ position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", display: "flex", color: "#94a3b8" }}>
                <ChevronDown size={16} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', backgroundColor: 'var(--bg-surface)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            {/* <button onClick={() => setView('kanban')} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: view === 'kanban' ? '#fff' : 'transparent', boxShadow: view === 'kanban' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: view === 'kanban' ? 600 : 400 }}><Kanban size={16} /> Kanban</button> */}
            {/* <button onClick={() => setView('table')} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: view === 'table' ? '#fff' : 'transparent', boxShadow: view === 'table' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: view === 'table' ? 600 : 400 }}><TableIcon size={16} /> Table</button> */}
            {/* <button onClick={() => setView('timeline')} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: view === 'timeline' ? '#fff' : 'transparent', boxShadow: view === 'timeline' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: view === 'timeline' ? 600 : 400 }}><Clock size={16} /> Timeline</button> */}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {/* <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} style={{ width: '150px', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '14px', backgroundColor: '#fff', outline: 'none', cursor: 'pointer' }}>
            <option value="All">All Priorities</option>
            <option value="Urgent">Urgent</option>
            <option value="High">High</option>
          </select> */}

          {/* <select value={filterEscalated} onChange={(e) => setFilterEscalated(e.target.value)} style={{ width: '150px', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '14px', backgroundColor: '#fff', outline: 'none', cursor: 'pointer' }}>
            <option value="All">Escalation Status</option>
            <option value="Yes">Escalated Only</option>
            <option value="No">Non-Escalated</option>
          </select> */}
        </div>
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {view === 'kanban' ? (
          <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '16px', height: '100%' }}>
            {STATUSES.map(status => {
              const columnData = filteredData.filter(d => d.status === status);
              return (
                <div key={status} style={{ flex: '0 0 320px', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                  {/* Kanban Column Header */}
                  <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
                    <div style={{ fontWeight: 700, fontSize: '15px', color: '#1e293b' }}>{status}</div>
                    <div style={{ backgroundColor: '#e2e8f0', color: '#475569', fontSize: '12px', fontWeight: 600, padding: '4px 10px', borderRadius: '20px' }}>
                      {columnData.length}
                    </div>
                  </div>
                  
                  {/* Kanban Cards */}
                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', flex: 1 }}>
                    {columnData.map(item => {
                      const colors = getSlaStyle(item.sla);
                      return (
                        <div key={item.id} className="card" onClick={() => setModalData(item)} style={{ padding: '16px', borderRadius: '16px', cursor: 'pointer', border: `1px solid ${colors.border}`, backgroundColor: '#ffffff', transition: 'all 0.2s ease', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.05)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)'; }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', backgroundColor: '#f1f5f9', padding: '4px 8px', borderRadius: '6px' }}>{item.id}</span>
                            <span style={{ fontSize: '12px', fontWeight: 600, padding: '4px 10px', borderRadius: '20px', backgroundColor: colors.bg, color: colors.color, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <Clock size={12} />
                              {item.sla}
                            </span>
                          </div>
                          <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '6px', color: '#0f172a' }}>{item.employee}</div>
                          <div style={{ fontSize: '13px', color: '#475569', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Building size={14} style={{ color: '#94a3b8' }} /> {item.company}
                          </div>
                          
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: '#475569' }}>
                                {item.exec !== "Unassigned" ? item.exec.substring(0, 2).toUpperCase() : "?"}
                              </div>
                              <span style={{ fontSize: '12px', color: item.exec === "Unassigned" ? '#94a3b8' : '#475569', fontWeight: 500 }}>
                                {item.exec === "Unassigned" ? "Unassigned" : item.exec}
                              </span>
                            </div>
                            {item.escalated && <AlertTriangle size={16} color="#ef4444" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>

      {/* {view === 'table' && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '16px', fontSize: '12px', color: 'var(--text-gray)' }}>VERIFICATION ID</th>
                <th style={{ padding: '16px', fontSize: '12px', color: 'var(--text-gray)' }}>EMPLOYEE & COMPANY</th>
                <th style={{ padding: '16px', fontSize: '12px', color: 'var(--text-gray)' }}>SERVICE</th>
                <th style={{ padding: '16px', fontSize: '12px', color: 'var(--text-gray)' }}>EXECUTIVE</th>
                <th style={{ padding: '16px', fontSize: '12px', color: 'var(--text-gray)' }}>STATUS</th>
                <th style={{ padding: '16px', fontSize: '12px', color: 'var(--text-gray)' }}>SLA AGING</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map(row => {
                const slaStyle = getSlaStyle(row.sla);
                return (
                  <tr key={row.id} onClick={() => setModalData(row)} style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: row.escalated ? '#fef2f2' : 'transparent', cursor: 'pointer' }}>
                    <td style={{ padding: '16px', fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {row.escalated && <Flag size={14} color="#dc2626" />} {row.id}
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontWeight: 600 }}>{row.employee}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-gray)' }}>{row.company} • {row.client}</div>
                    </td>
                    <td style={{ padding: '16px' }}>{row.service}</td>
                    <td style={{ padding: '16px' }}>{row.exec}</td>
                    <td style={{ padding: '16px' }}><span className={`badge badge-${row.status.toLowerCase().replace(' ', '-')}`}>{row.status}</span></td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '4px', backgroundColor: slaStyle.bg, color: slaStyle.color, border: `1px solid ${slaStyle.border}`, fontWeight: 600 }}>{row.sla}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )} */}

      {/* Case Details Drawer */}
      {/* {modalData && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 50, display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '600px', backgroundColor: '#fff', height: '100%', boxShadow: '-4px 0 15px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column' }}>

            <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <h2 style={{ fontSize: '20px', margin: 0 }}>{modalData.employee}</h2>
                  <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '12px', border: `1px solid #000`, fontWeight: 600 }}>{modalData.priority} Priority</span>
                </div>
                <div style={{ color: 'var(--text-gray)', fontSize: '14px' }}>{modalData.id} • {modalData.company} ({modalData.client})</div>
              </div>
              <button onClick={() => setModalData(null)} style={{ padding: '8px' }}><X size={20} /></button>
            </div>

            <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>

              {modalData.escalated && (
                <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', padding: '16px', borderRadius: '8px' }}>
                  <h3 style={{ fontSize: '14px', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}><Flag size={16} /> Escalation Center</h3>
                  <div style={{ fontSize: '13px', color: '#991b1b', marginBottom: '8px' }}><strong>Reason:</strong> {modalData.escReason}</div>
                  <div style={{ fontSize: '12px', color: '#991b1b' }}>Escalated by {modalData.escBy} on {modalData.escDate}</div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="card" style={{ padding: '16px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-gray)', fontWeight: 600, marginBottom: '8px' }}>SLA AGING</div>
                  <div style={{ fontWeight: 600, color: getSlaStyle(modalData.sla).color }}>{modalData.sla}</div>
                </div>
                <div className="card" style={{ padding: '16px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-gray)', fontWeight: 600, marginBottom: '8px' }}>ASSIGNMENT</div>
                  <div style={{ fontWeight: 600, color: modalData.exec === 'Unassigned' ? '#dc2626' : 'inherit' }}>{modalData.exec}</div>
                </div>
              </div>

              <div className="card" style={{ padding: '16px' }}>
                <h3 style={{ fontSize: '14px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><Info size={16} color="var(--primary-blue)" /> Service Information</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 500 }}>{modalData.service}</span>
                  <span className={`badge badge-${modalData.status.toLowerCase().replace(' ', '-')}`}>{modalData.status}</span>
                </div>
              </div>

              <div className="card" style={{ padding: '16px' }}>
                <h3 style={{ fontSize: '14px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><History size={16} color="var(--primary-blue)" /> Audit Trail & Timeline</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '12px', backgroundColor: '#e2e8f0', color: '#475569' }}>SY</div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600 }}>Status updated to {modalData.status}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-gray)' }}>System • {modalData.lastUpdate}</div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )} */}

    </div>
  );
};
