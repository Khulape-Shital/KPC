import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText, Search, Filter, Plus, Download, Send, CheckCircle2,
  XCircle, X, Eye, MoreVertical, Clock, AlertCircle, CreditCard,
  ChevronDown, Printer, ArrowUpRight, Edit3, Ban, Receipt
} from 'lucide-react';
import { mockDb } from '../../utils/mockDb';

// ── Constants ──────────────────────────────────────────────────────
const APPROVAL_THRESHOLD = 50000; // ₹50,000 GST-exclusive threshold

const STATUS_CONFIG = {
  draft:            { label: 'Draft',           color: '#64748b', bg: '#f1f5f9' },
  pending_approval: { label: 'Pending Approval',color: '#f59e0b', bg: '#fef3c7' },
  approved:         { label: 'Approved',        color: '#8b5cf6', bg: '#ede9fe' },
  generated:        { label: 'Generated',       color: '#3b82f6', bg: '#dbeafe' },
  sent:             { label: 'Sent',            color: '#0ea5e9', bg: '#e0f2fe' },
  partially_paid:   { label: 'Partially Paid',  color: '#f97316', bg: '#ffedd5' },
  paid:             { label: 'Paid',            color: '#10b981', bg: '#d1fae5' },
  overdue:          { label: 'Overdue',         color: '#ef4444', bg: '#fef2f2' },
  cancelled:        { label: 'Cancelled',       color: '#6b7280', bg: '#f3f4f6' },
  credit_note:      { label: 'Credit Note',     color: '#ec4899', bg: '#fce7f3' },
};

const SERVICE_TYPES = ['Police Verification', 'Address Verification', 'Identity Verification', 'Background Verification', 'Other Services'];
const CLIENT_NAMES = ['TechCorp Solutions', 'Global Services Ltd', 'FinServe Banking', 'Vertex Group', 'Innovate Global'];

const IMMUTABLE_STATUSES = ['generated', 'sent', 'partially_paid', 'paid', 'cancelled', 'credit_note'];

// ── Helper ─────────────────────────────────────────────────────────
const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const outstandingOf = (inv) => {
  const paid = (inv.paymentAllocations || []).reduce((s, a) => s + a.amount, 0);
  const credits = (inv.creditNotes || []).reduce((s, c) => s + c.amount, 0);
  return Math.max(inv.totalAmount - paid - credits, 0);
};

const nextInvoiceId = (invoices) => {
  const now = new Date();
  const prefix = `KPC-INV-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-`;
  const existing = invoices.filter(i => i.id.startsWith(prefix));
  const maxSeq = existing.reduce((mx, inv) => {
    const seq = parseInt(inv.id.split('-').pop(), 10);
    return seq > mx ? seq : mx;
  }, 0);
  return `${prefix}${String(maxSeq + 1).padStart(5, '0')}`;
};

// ══════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════
export const Invoices = () => {
  // ── State ──────────────────────────────────────────────────────
  const [invoices, setInvoices] = useState([]);
  const [search, setSearch] = useState('');
  const [filterClient, setFilterClient] = useState('');
  const [filterService, setFilterService] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);

  // Drawers & Modals
  const [detailInvoice, setDetailInvoice] = useState(null);      // details drawer
  const [createOpen, setCreateOpen] = useState(false);            // create / edit modal
  const [editInvoice, setEditInvoice] = useState(null);           // editing existing draft
  const [cancelModal, setCancelModal] = useState(null);           // cancel reason modal
  const [cancelReason, setCancelReason] = useState('');
  const [rejectModal, setRejectModal] = useState(null);           // reject reason modal
  const [rejectReason, setRejectReason] = useState('');
  const [creditNoteModal, setCreditNoteModal] = useState(null);   // credit note modal
  const [creditAmount, setCreditAmount] = useState('');
  const [creditReason, setCreditReason] = useState('');

  // Create/Edit form
  const [formClient, setFormClient] = useState('');
  const [formService, setFormService] = useState('');
  const [formCount, setFormCount] = useState('');
  const [formRate, setFormRate] = useState('');

  // ── Load ───────────────────────────────────────────────────────
  const loadData = () => setInvoices(mockDb.getInvoices());
  useEffect(() => { loadData(); }, []);

  // ── KPI calculations ──────────────────────────────────────────
  const kpis = useMemo(() => {
    let draftCount = 0, pendingCount = 0, generatedCount = 0, outstandingVal = 0, overdueVal = 0;
    invoices.forEach(inv => {
      if (inv.status === 'draft') draftCount++;
      if (inv.status === 'pending_approval') pendingCount++;
      if (inv.status === 'generated') generatedCount++;
      if (['sent', 'partially_paid', 'overdue', 'generated'].includes(inv.status)) {
        outstandingVal += outstandingOf(inv);
      }
      if (inv.status === 'overdue') overdueVal += outstandingOf(inv);
    });
    return { draftCount, pendingCount, generatedCount, outstandingVal, overdueVal };
  }, [invoices]);

  // ── Filtering ─────────────────────────────────────────────────
  const periods = useMemo(() => {
    const set = new Set(invoices.map(i => i.financialPeriod));
    return [...set].sort().reverse();
  }, [invoices]);

  const filtered = useMemo(() => {
    return invoices.filter(inv => {
      if (filterClient && inv.clientName !== filterClient) return false;
      if (filterService && inv.serviceType !== filterService) return false;
      if (filterStatus && inv.status !== filterStatus) return false;
      if (filterPeriod && inv.financialPeriod !== filterPeriod) return false;
      if (search) {
        const s = search.toLowerCase();
        if (!inv.id.toLowerCase().includes(s) && !inv.clientName.toLowerCase().includes(s) && !inv.serviceType.toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }, [invoices, search, filterClient, filterService, filterStatus, filterPeriod]);

  // ── Select helpers ────────────────────────────────────────────
  const toggleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length) setSelectedIds([]);
    else setSelectedIds(filtered.map(i => i.id));
  };

  // ── ACTIONS ───────────────────────────────────────────────────
  const approveInvoice = (id) => {
    const inv = invoices.find(i => i.id === id);
    if (!inv) return;
    const tl = [...(inv.timeline || []),
      { date: new Date().toISOString(), event: 'Invoice Approved', details: 'Approved by Finance Accountant' },
      { date: new Date().toISOString(), event: 'Invoice Generated', details: `KPC-INV number assigned: ${id}` }
    ];
    mockDb.updateInvoice(id, { status: 'generated', timeline: tl });
    mockDb.addFinancialActivity({ event: 'Invoice Approved', desc: `${id} approved and generated`, type: 'approval' });
    loadData();
  };

  const handleReject = () => {
    if (!rejectModal || !rejectReason.trim()) return;
    const inv = invoices.find(i => i.id === rejectModal);
    if (!inv) return;
    const tl = [...(inv.timeline || []),
      { date: new Date().toISOString(), event: 'Invoice Rejected', details: `Returned to Draft. Reason: ${rejectReason}` }
    ];
    mockDb.updateInvoice(rejectModal, { status: 'draft', timeline: tl });
    mockDb.addFinancialActivity({ event: 'Invoice Rejected', desc: `${rejectModal} rejected & returned to Draft`, type: 'rejection' });
    setRejectModal(null);
    setRejectReason('');
    loadData();
  };

  const sendInvoice = (id) => {
    const inv = invoices.find(i => i.id === id);
    if (!inv || !['generated', 'approved'].includes(inv.status)) return;
    const tl = [...(inv.timeline || []),
      { date: new Date().toISOString(), event: 'Invoice Sent', details: `Dispatched to ${inv.clientName}` }
    ];
    mockDb.updateInvoice(id, { status: 'sent', timeline: tl });
    mockDb.addFinancialActivity({ event: 'Invoice Sent', desc: `${id} dispatched to ${inv.clientName}`, type: 'invoice' });
    loadData();
  };

  const handleCancel = () => {
    if (!cancelModal || !cancelReason.trim()) return;
    const inv = invoices.find(i => i.id === cancelModal);
    if (!inv) return;
    const tl = [...(inv.timeline || []),
      { date: new Date().toISOString(), event: 'Invoice Cancelled', details: `Reason: ${cancelReason}` }
    ];
    mockDb.updateInvoice(cancelModal, { status: 'cancelled', timeline: tl });
    mockDb.addFinancialActivity({ event: 'Invoice Cancelled', desc: `${cancelModal} cancelled. Reason: ${cancelReason}`, type: 'adjustment' });
    setCancelModal(null);
    setCancelReason('');
    loadData();
  };

  const handleCreditNote = () => {
    if (!creditNoteModal || !creditAmount || !creditReason.trim()) return;
    const inv = invoices.find(i => i.id === creditNoteModal);
    if (!inv) return;
    const amount = parseFloat(creditAmount);
    if (isNaN(amount) || amount <= 0) return;
    const notes = [...(inv.creditNotes || []), { id: `CN-${Date.now()}`, amount, reason: creditReason, date: new Date().toISOString() }];
    const tl = [...(inv.timeline || []),
      { date: new Date().toISOString(), event: 'Credit Note Issued', details: `₹${amount.toLocaleString('en-IN')} — ${creditReason}` }
    ];
    mockDb.updateInvoice(creditNoteModal, { creditNotes: notes, timeline: tl });
    mockDb.addFinancialActivity({ event: 'Credit Note Issued', desc: `CN for ₹${amount.toLocaleString('en-IN')} on ${creditNoteModal}`, type: 'adjustment' });
    setCreditNoteModal(null);
    setCreditAmount('');
    setCreditReason('');
    loadData();
  };

  // ── Create / Edit Invoice ─────────────────────────────────────
  const openCreate = () => {
    setEditInvoice(null);
    setFormClient('');
    setFormService('');
    setFormCount('');
    setFormRate('');
    setCreateOpen(true);
  };
  const openEdit = (inv) => {
    setEditInvoice(inv);
    setFormClient(inv.clientName);
    setFormService(inv.serviceType);
    setFormCount(String(inv.verificationCount));
    setFormRate(String(inv.ratePerVerification));
    setCreateOpen(true);
  };

  const handleSaveInvoice = () => {
    if (!formClient || !formService || !formCount || !formRate) return;
    const count = parseInt(formCount, 10);
    const rate = parseFloat(formRate);
    if (isNaN(count) || isNaN(rate) || count <= 0 || rate <= 0) return;

    const amount = count * rate;
    const gstAmount = Math.round(amount * 0.18);
    const totalAmount = amount + gstAmount;
    const now = new Date();
    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() + 15);
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Threshold check
    const needsApproval = totalAmount > APPROVAL_THRESHOLD;

    if (editInvoice) {
      // Update existing draft
      const tl = [...(editInvoice.timeline || []),
        { date: now.toISOString(), event: 'Invoice Updated', details: `Line items modified. New total: ₹${totalAmount.toLocaleString('en-IN')}` }
      ];
      if (needsApproval && editInvoice.status === 'draft') {
        tl.push({ date: now.toISOString(), event: 'Approval Requested', details: 'Amount > ₹50,000 threshold limit' });
      }
      mockDb.updateInvoice(editInvoice.id, {
        clientName: formClient, serviceType: formService,
        verificationCount: count, ratePerVerification: rate,
        amount, gstPercent: 18, gstAmount, totalAmount,
        status: needsApproval ? 'pending_approval' : editInvoice.status,
        timeline: tl
      });
    } else {
      // Create new
      const allInvoices = mockDb.getInvoices();
      const id = nextInvoiceId(allInvoices);
      const status = needsApproval ? 'pending_approval' : 'draft';
      const timeline = [
        { date: now.toISOString(), event: 'Invoice Draft Created', details: `Amount ₹${totalAmount.toLocaleString('en-IN')}` }
      ];
      if (needsApproval) {
        timeline.push({ date: now.toISOString(), event: 'Approval Requested', details: 'Amount > ₹50,000 threshold limit' });
      }
      mockDb.addInvoice({
        id, clientName: formClient, serviceType: formService,
        verificationCount: count, ratePerVerification: rate,
        amount, gstPercent: 18, gstAmount, totalAmount,
        status,
        invoiceDate: now.toISOString().substring(0, 10),
        dueDate: dueDate.toISOString().substring(0, 10),
        paymentAllocations: [],
        timeline,
        creditNotes: [],
        financialPeriod: period
      });
    }
    setCreateOpen(false);
    loadData();
  };

  // ── Bulk Actions ──────────────────────────────────────────────
  const bulkGenerate = () => {
    selectedIds.forEach(id => {
      const inv = invoices.find(i => i.id === id);
      if (inv && inv.status === 'draft') {
        const tl = [...(inv.timeline || []),
          { date: new Date().toISOString(), event: 'Invoice Generated', details: 'Bulk generated' }
        ];
        mockDb.updateInvoice(id, { status: 'generated', timeline: tl });
      }
    });
    setSelectedIds([]);
    loadData();
  };

  const bulkSend = () => {
    selectedIds.forEach(id => {
      const inv = invoices.find(i => i.id === id);
      if (inv && inv.status === 'generated') {
        const tl = [...(inv.timeline || []),
          { date: new Date().toISOString(), event: 'Invoice Sent', details: `Bulk sent to ${inv.clientName}` }
        ];
        mockDb.updateInvoice(id, { status: 'sent', timeline: tl });
      }
    });
    setSelectedIds([]);
    loadData();
  };

  const bulkExportCSV = () => {
    const rows = [['Invoice ID', 'Client', 'Service', 'Count', 'Subtotal', 'GST', 'Total', 'Outstanding', 'Status', 'Due Date']];
    selectedIds.forEach(id => {
      const inv = invoices.find(i => i.id === id);
      if (inv) rows.push([inv.id, inv.clientName, inv.serviceType, inv.verificationCount, inv.amount, inv.gstAmount, inv.totalAmount, outstandingOf(inv), STATUS_CONFIG[inv.status]?.label || inv.status, inv.dueDate]);
    });
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `KPC_Invoices_Export_${new Date().toISOString().substring(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const bulkExportPDF = () => window.print();

  const clearFilters = () => {
    setSearch('');
    setFilterClient('');
    setFilterService('');
    setFilterStatus('');
    setFilterPeriod('');
  };

  // ── Status badge ──────────────────────────────────────────────
  const StatusBadge = ({ status }) => {
    const cfg = STATUS_CONFIG[status] || { label: status, color: '#64748b', bg: '#f1f5f9' };
    return (
      <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '12px', backgroundColor: cfg.bg, color: cfg.color, whiteSpace: 'nowrap', letterSpacing: '0.3px' }}>
        {cfg.label}
      </span>
    );
  };

  // ── Action Menu ───────────────────────────────────────────────
  const [actionMenu, setActionMenu] = useState(null);

  const ActionMenu = ({ inv }) => {
    const isOpen = actionMenu === inv.id;
    const isImmutable = IMMUTABLE_STATUSES.includes(inv.status);
    return (
      <div style={{ position: 'relative' }}>
        <button
          onClick={(e) => { e.stopPropagation(); setActionMenu(isOpen ? null : inv.id); }}
          style={{ background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          <MoreVertical size={14} color="var(--text-gray)" />
        </button>
        {isOpen && (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute', right: 0, top: '100%', marginTop: '4px', zIndex: 100,
              background: '#fff', border: '1px solid var(--border-color)', borderRadius: '8px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: '180px', overflow: 'hidden'
            }}
          >
            <button onClick={() => { setDetailInvoice(inv); setActionMenu(null); }} style={menuBtnStyle}>
              <Eye size={14} /> View Details
            </button>
            {!isImmutable && (
              <button onClick={() => { openEdit(inv); setActionMenu(null); }} style={menuBtnStyle}>
                <Edit3 size={14} /> Edit Draft
              </button>
            )}
            {inv.status === 'pending_approval' && (
              <>
                <button onClick={() => { approveInvoice(inv.id); setActionMenu(null); }} style={{ ...menuBtnStyle, color: '#10b981' }}>
                  <CheckCircle2 size={14} /> Approve
                </button>
                <button onClick={() => { setRejectModal(inv.id); setActionMenu(null); }} style={{ ...menuBtnStyle, color: '#ef4444' }}>
                  <XCircle size={14} /> Reject
                </button>
              </>
            )}
            {inv.status === 'draft' && (
              <button onClick={() => {
                if (inv.totalAmount > APPROVAL_THRESHOLD) {
                  const tl = [...(inv.timeline || []), { date: new Date().toISOString(), event: 'Approval Requested', details: 'Amount > ₹50,000 threshold' }];
                  mockDb.updateInvoice(inv.id, { status: 'pending_approval', timeline: tl });
                } else {
                  const tl = [...(inv.timeline || []), { date: new Date().toISOString(), event: 'Invoice Generated', details: 'Auto-generated (below threshold)' }];
                  mockDb.updateInvoice(inv.id, { status: 'generated', timeline: tl });
                }
                setActionMenu(null);
                loadData();
              }} style={{ ...menuBtnStyle, color: '#3b82f6' }}>
                <ArrowUpRight size={14} /> Generate
              </button>
            )}
            {['generated', 'approved'].includes(inv.status) && (
              <button onClick={() => { sendInvoice(inv.id); setActionMenu(null); }} style={{ ...menuBtnStyle, color: '#0ea5e9' }}>
                <Send size={14} /> Send
              </button>
            )}
            {!['cancelled', 'paid', 'credit_note'].includes(inv.status) && (
              <button onClick={() => { setCancelModal(inv.id); setActionMenu(null); }} style={{ ...menuBtnStyle, color: '#ef4444', borderTop: '1px solid var(--border-color)' }}>
                <Ban size={14} /> Cancel
              </button>
            )}
            {['sent', 'partially_paid', 'overdue'].includes(inv.status) && (
              <button onClick={() => { setCreditNoteModal(inv.id); setActionMenu(null); }} style={{ ...menuBtnStyle, color: '#ec4899' }}>
                <Receipt size={14} /> Credit Note
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════
  //  RENDER
  // ══════════════════════════════════════════════════════════════
  return (
    <div
      className="page-container"
      style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.5s ease-out' }}
      onClick={() => setActionMenu(null)}
    >
      {/* ── PAGE HEADER ───────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-dark)' }}>Invoice Ledger</h1>
          <p style={{ color: 'var(--text-gray)', marginTop: '6px', fontSize: '14px' }}>
            Master invoice registry with full lifecycle management, approval workflows, and audit trails.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={bulkExportCSV} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }} disabled={selectedIds.length === 0}>
            <Download size={15} /> Export CSV
          </button>
          <button onClick={openCreate} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
            <Plus size={15} /> Create Invoice
          </button>
        </div>
      </div>

      {/* ── KPI CARDS ─────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
        {[
          { label: 'Draft Invoices',    val: kpis.draftCount,                                  color: '#64748b', icon: <FileText size={16} color="#64748b" /> },
          { label: 'Pending Approval',  val: kpis.pendingCount,                                color: '#f59e0b', icon: <Clock size={16} color="#f59e0b" /> },
          { label: 'Generated',         val: kpis.generatedCount,                              color: '#3b82f6', icon: <CheckCircle2 size={16} color="#3b82f6" /> },
          { label: 'Outstanding Value', val: formatCurrency(kpis.outstandingVal), raw: true,    color: '#f97316', icon: <CreditCard size={16} color="#f97316" /> },
          { label: 'Overdue Value',     val: formatCurrency(kpis.overdueVal),     raw: true,    color: '#ef4444', icon: <AlertCircle size={16} color="#ef4444" /> },
        ].map((kpi, i) => (
          <div key={i} className="card" style={{ padding: '18px 20px', backgroundColor: '#fff', borderLeft: `4px solid ${kpi.color}`, borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              {kpi.icon}
              <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-gray)' }}>{kpi.label}</span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-dark)' }}>{kpi.raw ? kpi.val : kpi.val}</div>
          </div>
        ))}
      </div>

      {/* ── FILTERS BAR ───────────────────────────────────────── */}
      <div className="card" style={{ padding: '16px 20px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 240px', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0 12px', backgroundColor: '#f8fafc' }}>
          <Search size={16} color="var(--text-gray)" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search Invoice ID, Client..." style={{ border: 'none', outline: 'none', background: 'transparent', padding: '10px 0', fontSize: '13px', width: '100%' }} />
        </div>
        <select value={filterClient} onChange={e => setFilterClient(e.target.value)} style={selectStyle}>
          <option value="">All Clients</option>
          {CLIENT_NAMES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterService} onChange={e => setFilterService(e.target.value)} style={selectStyle}>
          <option value="">All Services</option>
          {SERVICE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={selectStyle}>
          <option value="">All Statuses</option>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={filterPeriod} onChange={e => setFilterPeriod(e.target.value)} style={selectStyle}>
          <option value="">All Periods</option>
          {periods.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        {(search || filterClient || filterService || filterStatus || filterPeriod) && (
          <button onClick={clearFilters} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <X size={14} /> Clear
          </button>
        )}
      </div>

      {/* ── BULK ACTIONS BAR ──────────────────────────────────── */}
      {selectedIds.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#1d4ed8' }}>{selectedIds.length} selected</span>
          <div style={{ flex: 1 }} />
          <button onClick={bulkGenerate} className="btn btn-outline" style={{ fontSize: '12px', padding: '6px 12px' }}>Bulk Generate</button>
          <button onClick={bulkSend} className="btn btn-outline" style={{ fontSize: '12px', padding: '6px 12px' }}>Bulk Send</button>
          <button onClick={bulkExportCSV} className="btn btn-outline" style={{ fontSize: '12px', padding: '6px 12px' }}><Download size={13} /> CSV</button>
          <button onClick={bulkExportPDF} className="btn btn-outline" style={{ fontSize: '12px', padding: '6px 12px' }}><Printer size={13} /> PDF</button>
          <button onClick={() => setSelectedIds([])} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={16} /></button>
        </div>
      )}

      {/* ── TABLE ─────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        /* Empty State */
        <div className="card" style={{ padding: '80px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', backgroundColor: '#fff', borderRadius: '8px' }}>
          <FileText size={48} color="var(--text-gray)" style={{ opacity: 0.3 }} />
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-dark)' }}>No Invoices Found</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-gray)', maxWidth: '400px' }}>No invoices match your current filters. Try adjusting your search criteria or create a new invoice.</p>
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button onClick={clearFilters} className="btn btn-outline" style={{ fontSize: '13px' }}>Clear Filters</button>
            <button onClick={openCreate} className="btn btn-primary" style={{ fontSize: '13px' }}><Plus size={14} /> Create Invoice</button>
          </div>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ backgroundColor: '#f8fafc' }}>
                <tr>
                  <th style={thStyle}>
                    <input type="checkbox" checked={selectedIds.length === filtered.length && filtered.length > 0} onChange={toggleSelectAll} />
                  </th>
                  <th style={thStyle}>INVOICE ID</th>
                  <th style={thStyle}>CLIENT</th>
                  <th style={thStyle}>PERIOD</th>
                  <th style={thStyle}>SERVICE</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>COUNT</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>SUBTOTAL</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>GST</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>TOTAL</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>OUTSTANDING</th>
                  <th style={thStyle}>STATUS</th>
                  <th style={thStyle}>DUE DATE</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv, idx) => {
                  const outstanding = outstandingOf(inv);
                  return (
                    <tr
                      key={inv.id}
                      style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer', transition: 'background 0.15s' }}
                      className="table-row-hover"
                      onClick={() => setDetailInvoice(inv)}
                    >
                      <td style={tdStyle} onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={selectedIds.includes(inv.id)} onChange={() => toggleSelect(inv.id)} />
                      </td>
                      <td style={{ ...tdStyle, fontWeight: 600, color: 'var(--primary-blue)', fontSize: '12px' }}>{inv.id}</td>
                      <td style={{ ...tdStyle, fontWeight: 500, color: 'var(--text-dark)' }}>{inv.clientName}</td>
                      <td style={{ ...tdStyle, color: 'var(--text-gray)', fontSize: '12px' }}>{inv.financialPeriod}</td>
                      <td style={{ ...tdStyle, color: 'var(--text-dark)', fontSize: '12px' }}>{inv.serviceType}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 500 }}>{inv.verificationCount}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontSize: '12px' }}>{formatCurrency(inv.amount)}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontSize: '12px', color: 'var(--text-gray)' }}>{formatCurrency(inv.gstAmount)}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700 }}>{formatCurrency(inv.totalAmount)}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, color: outstanding > 0 ? '#ef4444' : '#10b981' }}>
                        {outstanding > 0 ? formatCurrency(outstanding) : '—'}
                      </td>
                      <td style={tdStyle}><StatusBadge status={inv.status} /></td>
                      <td style={{ ...tdStyle, fontSize: '12px', color: 'var(--text-gray)' }}>{fmtDate(inv.dueDate)}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                        <ActionMenu inv={inv} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '12px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-gray)' }}>Showing {filtered.length} of {invoices.length} invoices</span>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          DETAILS DRAWER
         ══════════════════════════════════════════════════════════ */}
      {detailInvoice && (
        <>
          <div onClick={() => setDetailInvoice(null)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 200 }} />
          <div style={{
            position: 'fixed', right: 0, top: 0, bottom: 0, width: '560px', zIndex: 201,
            backgroundColor: '#fff', boxShadow: '-8px 0 30px rgba(0,0,0,0.12)',
            display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.3s ease-out'
          }}>
            {/* Drawer Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-dark)' }}>Invoice Details</h2>
                <span style={{ fontSize: '13px', color: 'var(--primary-blue)', fontWeight: 600 }}>{detailInvoice.id}</span>
              </div>
              <button onClick={() => setDetailInvoice(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}>
                <X size={20} color="var(--text-gray)" />
              </button>
            </div>

            {/* Drawer Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              {/* A. Invoice Summary */}
              <div style={{ marginBottom: '28px' }}>
                <h3 style={drawerSectionTitle}>Invoice Summary</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div><span style={drawerLabel}>Client</span><div style={drawerValue}>{detailInvoice.clientName}</div></div>
                  <div><span style={drawerLabel}>Status</span><div style={{ marginTop: '4px' }}><StatusBadge status={detailInvoice.status} /></div></div>
                  <div><span style={drawerLabel}>Billing Period</span><div style={drawerValue}>{detailInvoice.financialPeriod}</div></div>
                  <div><span style={drawerLabel}>Invoice Date</span><div style={drawerValue}>{fmtDate(detailInvoice.invoiceDate)}</div></div>
                  <div><span style={drawerLabel}>Due Date</span><div style={drawerValue}>{fmtDate(detailInvoice.dueDate)}</div></div>
                  <div><span style={drawerLabel}>Grand Total</span><div style={{ ...drawerValue, fontWeight: 700, fontSize: '16px', color: 'var(--text-dark)' }}>{formatCurrency(detailInvoice.totalAmount)}</div></div>
                </div>
              </div>

              {/* B. Line Item Breakdown */}
              <div style={{ marginBottom: '28px' }}>
                <h3 style={drawerSectionTitle}>Line Item Breakdown</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc' }}>
                      <th style={liThStyle}>Service</th>
                      <th style={{ ...liThStyle, textAlign: 'right' }}>Count</th>
                      <th style={{ ...liThStyle, textAlign: 'right' }}>Rate</th>
                      <th style={{ ...liThStyle, textAlign: 'right' }}>Taxable</th>
                      <th style={{ ...liThStyle, textAlign: 'right' }}>GST %</th>
                      <th style={{ ...liThStyle, textAlign: 'right' }}>GST Amt</th>
                      <th style={{ ...liThStyle, textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={liTdStyle}>{detailInvoice.serviceType}</td>
                      <td style={{ ...liTdStyle, textAlign: 'right' }}>{detailInvoice.verificationCount}</td>
                      <td style={{ ...liTdStyle, textAlign: 'right' }}>{formatCurrency(detailInvoice.ratePerVerification)}</td>
                      <td style={{ ...liTdStyle, textAlign: 'right' }}>{formatCurrency(detailInvoice.amount)}</td>
                      <td style={{ ...liTdStyle, textAlign: 'right' }}>{detailInvoice.gstPercent}%</td>
                      <td style={{ ...liTdStyle, textAlign: 'right' }}>{formatCurrency(detailInvoice.gstAmount)}</td>
                      <td style={{ ...liTdStyle, textAlign: 'right', fontWeight: 700 }}>{formatCurrency(detailInvoice.totalAmount)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* C. Allocation History */}
              <div style={{ marginBottom: '28px' }}>
                <h3 style={drawerSectionTitle}>Allocation History</h3>
                {(detailInvoice.paymentAllocations || []).length === 0 && (detailInvoice.creditNotes || []).length === 0 ? (
                  <p style={{ fontSize: '12px', color: 'var(--text-gray)', fontStyle: 'italic' }}>No payments or credit notes allocated yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {(detailInvoice.paymentAllocations || []).map((a, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: '#f0fdf4', borderRadius: '6px', border: '1px solid #bbf7d0', fontSize: '12px' }}>
                        <span style={{ fontWeight: 600, color: '#166534' }}>{a.paymentId}</span>
                        <span style={{ color: '#166534' }}>{fmtDate(a.date)}</span>
                        <span style={{ fontWeight: 700, color: '#166534' }}>{formatCurrency(a.amount)}</span>
                      </div>
                    ))}
                    {(detailInvoice.creditNotes || []).map((cn, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: '#fdf2f8', borderRadius: '6px', border: '1px solid #fbcfe8', fontSize: '12px' }}>
                        <span style={{ fontWeight: 600, color: '#9d174d' }}>{cn.id}</span>
                        <span style={{ color: '#9d174d', flex: 1, marginLeft: '12px' }}>{cn.reason}</span>
                        <span style={{ fontWeight: 700, color: '#9d174d' }}>−{formatCurrency(cn.amount)}</span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '13px', fontWeight: 700 }}>
                      <span>Outstanding Balance</span>
                      <span style={{ color: outstandingOf(detailInvoice) > 0 ? '#ef4444' : '#10b981' }}>{formatCurrency(outstandingOf(detailInvoice))}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* D. Invoice Timeline */}
              <div>
                <h3 style={drawerSectionTitle}>Invoice Timeline</h3>
                {(detailInvoice.timeline || []).length === 0 ? (
                  <p style={{ fontSize: '12px', color: 'var(--text-gray)', fontStyle: 'italic' }}>No timeline events recorded.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                    {(detailInvoice.timeline || []).map((ev, i) => (
                      <div key={i} style={{ display: 'flex', gap: '12px', paddingBottom: '16px', position: 'relative' }}>
                        {/* Vertical line */}
                        {i < detailInvoice.timeline.length - 1 && (
                          <div style={{ position: 'absolute', left: '7px', top: '16px', bottom: 0, width: '2px', backgroundColor: '#e2e8f0' }} />
                        )}
                        <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: i === 0 ? 'var(--primary-blue)' : '#e2e8f0', border: `2px solid ${i === 0 ? 'var(--primary-blue)' : '#cbd5e1'}`, flexShrink: 0, marginTop: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {i === 0 && <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#fff' }} />}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-dark)' }}>{ev.event}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-gray)', marginTop: '2px' }}>{ev.details}</div>
                          <div style={{ fontSize: '10px', color: 'var(--text-gray)', marginTop: '4px' }}>{new Date(ev.date).toLocaleString('en-IN')}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              {detailInvoice.status === 'pending_approval' && (
                <>
                  <button onClick={() => { approveInvoice(detailInvoice.id); setDetailInvoice(null); loadData(); }} className="btn btn-outline" style={{ borderColor: '#10b981', color: '#10b981', fontSize: '13px' }}>
                    <CheckCircle2 size={14} /> Approve
                  </button>
                  <button onClick={() => { setRejectModal(detailInvoice.id); setDetailInvoice(null); }} className="btn btn-outline" style={{ borderColor: '#ef4444', color: '#ef4444', fontSize: '13px' }}>
                    <XCircle size={14} /> Reject
                  </button>
                </>
              )}
              <button onClick={() => setDetailInvoice(null)} className="btn btn-outline" style={{ fontSize: '13px' }}>Close</button>
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════
          CREATE / EDIT MODAL
         ══════════════════════════════════════════════════════════ */}
      {createOpen && (
        <>
          <div onClick={() => setCreateOpen(false)} style={overlayStyle} />
          <div style={modalStyle}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-dark)' }}>{editInvoice ? 'Edit Invoice Draft' : 'Create New Invoice'}</h2>
              <button onClick={() => setCreateOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={20} color="var(--text-gray)" /></button>
            </div>
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={labelStyle}>Client Name *</label>
                <select value={formClient} onChange={e => setFormClient(e.target.value)} style={inputStyle}>
                  <option value="">Select Client</option>
                  {CLIENT_NAMES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Service Type *</label>
                <select value={formService} onChange={e => setFormService(e.target.value)} style={inputStyle}>
                  <option value="">Select Service</option>
                  {SERVICE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Verification Count *</label>
                  <input type="number" value={formCount} onChange={e => setFormCount(e.target.value)} placeholder="e.g. 100" style={inputStyle} min="1" />
                </div>
                <div>
                  <label style={labelStyle}>Rate Per Verification (₹) *</label>
                  <input type="number" value={formRate} onChange={e => setFormRate(e.target.value)} placeholder="e.g. 500" style={inputStyle} min="1" />
                </div>
              </div>
              {/* Live Preview */}
              {formCount && formRate && !isNaN(parseInt(formCount)) && !isNaN(parseFloat(formRate)) && (
                <div style={{ backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border-color)', padding: '16px' }}>
                  <h4 style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-gray)', marginBottom: '12px', letterSpacing: '0.5px' }}>Invoice Preview</h4>
                  {(() => {
                    const c = parseInt(formCount); const r = parseFloat(formRate);
                    const amt = c * r; const gst = Math.round(amt * 0.18); const tot = amt + gst;
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-gray)' }}>Subtotal ({c} × ₹{r})</span><span style={{ fontWeight: 600 }}>{formatCurrency(amt)}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-gray)' }}>GST (18%)</span><span>{formatCurrency(gst)}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '8px', fontWeight: 700, fontSize: '15px' }}><span>Grand Total</span><span>{formatCurrency(tot)}</span></div>
                        {tot > APPROVAL_THRESHOLD && (
                          <div style={{ marginTop: '8px', padding: '8px 12px', backgroundColor: '#fef3c7', borderRadius: '6px', border: '1px solid #fde68a', fontSize: '11px', color: '#92400e', fontWeight: 600 }}>
                            ⚠ Amount exceeds ₹50,000 — will require Finance Approval
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setCreateOpen(false)} className="btn btn-outline" style={{ fontSize: '13px' }}>Cancel</button>
              <button onClick={handleSaveInvoice} className="btn btn-primary" style={{ fontSize: '13px' }} disabled={!formClient || !formService || !formCount || !formRate}>
                {editInvoice ? 'Update Invoice' : 'Create Invoice'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── REJECT MODAL ──────────────────────────────────────── */}
      {rejectModal && (
        <>
          <div onClick={() => { setRejectModal(null); setRejectReason(''); }} style={overlayStyle} />
          <div style={modalStyle}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#ef4444' }}>Reject Invoice</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-gray)', marginTop: '4px' }}>Invoice {rejectModal} will be returned to Draft status.</p>
            </div>
            <div style={{ padding: '24px' }}>
              <label style={labelStyle}>Rejection Reason *</label>
              <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Please provide a reason for rejecting this invoice..." style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }} />
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => { setRejectModal(null); setRejectReason(''); }} className="btn btn-outline" style={{ fontSize: '13px' }}>Cancel</button>
              <button onClick={handleReject} className="btn btn-primary" style={{ fontSize: '13px', backgroundColor: '#ef4444', borderColor: '#ef4444' }} disabled={!rejectReason.trim()}>Reject Invoice</button>
            </div>
          </div>
        </>
      )}

      {/* ── CANCEL MODAL ──────────────────────────────────────── */}
      {cancelModal && (
        <>
          <div onClick={() => { setCancelModal(null); setCancelReason(''); }} style={overlayStyle} />
          <div style={modalStyle}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#ef4444' }}>Cancel Invoice</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-gray)', marginTop: '4px' }}>This action is irreversible. Invoice {cancelModal} will be permanently cancelled.</p>
            </div>
            <div style={{ padding: '24px' }}>
              <label style={labelStyle}>Cancellation Reason *</label>
              <textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)} placeholder="Provide a mandatory reason for cancelling this invoice..." style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }} />
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => { setCancelModal(null); setCancelReason(''); }} className="btn btn-outline" style={{ fontSize: '13px' }}>Go Back</button>
              <button onClick={handleCancel} className="btn btn-primary" style={{ fontSize: '13px', backgroundColor: '#ef4444', borderColor: '#ef4444' }} disabled={!cancelReason.trim()}>Confirm Cancellation</button>
            </div>
          </div>
        </>
      )}

      {/* ── CREDIT NOTE MODAL ─────────────────────────────────── */}
      {creditNoteModal && (
        <>
          <div onClick={() => { setCreditNoteModal(null); setCreditAmount(''); setCreditReason(''); }} style={overlayStyle} />
          <div style={modalStyle}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#ec4899' }}>Issue Credit Note</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-gray)', marginTop: '4px' }}>Credit note for invoice {creditNoteModal}. Original invoice remains immutable.</p>
            </div>
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Credit Amount (₹) *</label>
                <input type="number" value={creditAmount} onChange={e => setCreditAmount(e.target.value)} placeholder="e.g. 5000" style={inputStyle} min="1" />
              </div>
              <div>
                <label style={labelStyle}>Reason *</label>
                <textarea value={creditReason} onChange={e => setCreditReason(e.target.value)} placeholder="Describe the reason for this credit note..." style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} />
              </div>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => { setCreditNoteModal(null); setCreditAmount(''); setCreditReason(''); }} className="btn btn-outline" style={{ fontSize: '13px' }}>Cancel</button>
              <button onClick={handleCreditNote} className="btn btn-primary" style={{ fontSize: '13px', backgroundColor: '#ec4899', borderColor: '#ec4899' }} disabled={!creditAmount || !creditReason.trim()}>Issue Credit Note</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ── Shared Styles ──────────────────────────────────────────────────
const thStyle = { padding: '12px 16px', fontSize: '10px', fontWeight: 600, color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap', borderBottom: '1px solid var(--border-color)' };
const tdStyle = { padding: '14px 16px', fontSize: '13px', whiteSpace: 'nowrap' };
const selectStyle = { padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px', backgroundColor: '#f8fafc', color: 'var(--text-dark)', cursor: 'pointer', outline: 'none' };
const menuBtnStyle = { display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 16px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '13px', color: 'var(--text-dark)', textAlign: 'left', transition: 'background 0.15s' };
const overlayStyle = { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 300 };
const modalStyle = { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 301, backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', width: '560px', maxHeight: '90vh', overflowY: 'auto', animation: 'fadeIn 0.3s ease-out' };
const labelStyle = { fontSize: '12px', fontWeight: 600, color: 'var(--text-gray)', marginBottom: '6px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.3px' };
const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px', outline: 'none', boxSizing: 'border-box' };
const drawerSectionTitle = { fontSize: '13px', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '8px' };
const drawerLabel = { fontSize: '11px', fontWeight: 600, color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.3px' };
const drawerValue = { fontSize: '14px', fontWeight: 500, color: 'var(--text-dark)', marginTop: '4px' };
const liThStyle = { padding: '8px 10px', fontSize: '10px', fontWeight: 600, color: 'var(--text-gray)', textTransform: 'uppercase', borderBottom: '1px solid var(--border-color)' };
const liTdStyle = { padding: '10px', fontSize: '12px', color: 'var(--text-dark)' };
