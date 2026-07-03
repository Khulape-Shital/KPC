import React, { useState, useEffect, useMemo } from 'react';
import {
  BadgeIndianRupee, CreditCard, Banknote, AlertCircle,
  Clock, Users, TrendingUp, Lock, CheckCircle2, XCircle, BarChart3, PieChart, ArrowUpRight, ChevronRight
} from 'lucide-react';
import { mockDb } from '../../utils/mockDb';

export const AccountantDashboard = () => {
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [closing, setClosing] = useState({});
  const [activities, setActivities] = useState([]);

  // Load data from mockDb
  const loadData = () => {
    setInvoices(mockDb.getInvoices());
    setPayments(mockDb.getPayments());
    setClosing(mockDb.getFinancialClosing());
    setActivities(mockDb.getFinancialActivity());
  };

  useEffect(() => {
    loadData();
  }, []);

  // Format currency in INR
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  // 1. Invoiced Revenue: Total value of all generated invoices (Generated, Sent, Paid, Partially Paid, Overdue)
  const invoicedInvoices = useMemo(() => {
    return invoices.filter(inv => ['generated', 'sent', 'paid', 'partially_paid', 'overdue', 'approved'].includes(inv.status));
  }, [invoices]);

  const invoicedRevenue = useMemo(() => {
    return invoicedInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  }, [invoicedInvoices]);

  // 2. Collected Revenue: Total amount successfully received (sum of payment allocations)
  const collectedRevenue = useMemo(() => {
    return invoices.reduce((sum, inv) => {
      const paid = (inv.paymentAllocations || []).reduce((pSum, alloc) => pSum + alloc.amount, 0);
      return sum + paid;
    }, 0);
  }, [invoices]);

  // 3. Outstanding Revenue: Remaining unpaid balance across all generated invoices
  const outstandingRevenue = useMemo(() => {
    return invoicedInvoices.reduce((sum, inv) => {
      const paid = (inv.paymentAllocations || []).reduce((pSum, alloc) => pSum + alloc.amount, 0);
      return sum + (inv.totalAmount - paid);
    }, 0);
  }, [invoicedInvoices]);

  // 4. Pending Approvals count
  const pendingApprovalsCount = useMemo(() => {
    return invoices.filter(inv => inv.status === 'pending_approval').length;
  }, [invoices]);

  const pendingApprovalsList = useMemo(() => {
    return invoices.filter(inv => inv.status === 'pending_approval');
  }, [invoices]);

  // 5. Overdue Amount
  const overdueAmount = useMemo(() => {
    return invoices.filter(inv => inv.status === 'overdue').reduce((sum, inv) => {
      const paid = (inv.paymentAllocations || []).reduce((pSum, alloc) => pSum + alloc.amount, 0);
      return sum + (inv.totalAmount - paid);
    }, 0);
  }, [invoices]);

  // 6. Active Billing Clients count
  const activeClients = useMemo(() => {
    return new Set(invoicedInvoices.map(inv => inv.clientName)).size;
  }, [invoicedInvoices]);

  // Collections Center metrics
  const collectionEfficiency = useMemo(() => {
    return invoicedRevenue > 0 ? Math.round((collectedRevenue / invoicedRevenue) * 100) : 0;
  }, [invoicedRevenue, collectedRevenue]);

  const avgCollectionDays = useMemo(() => {
    let totalDays = 0;
    let count = 0;
    invoicedInvoices.forEach(inv => {
      (inv.paymentAllocations || []).forEach(alloc => {
        const invDate = new Date(inv.invoiceDate);
        const payDate = new Date(alloc.date);
        const diffTime = Math.abs(payDate - invDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        totalDays += diffDays;
        count++;
      });
    });
    return count > 0 ? Math.round(totalDays / count) : 0;
  }, [invoicedInvoices]);

  // Outstanding Aging Buckets
  const agingBuckets = useMemo(() => {
    const currentDate = new Date('2026-06-15'); // Fixed system date for demo consistency
    const buckets = { '0_30': 0, '31_60': 0, '61_90': 0, '90_plus': 0 };

    invoicedInvoices.forEach(inv => {
      const paid = (inv.paymentAllocations || []).reduce((sum, alloc) => sum + alloc.amount, 0);
      const outstanding = inv.totalAmount - paid;
      if (outstanding <= 0) return;

      const invDate = new Date(inv.invoiceDate);
      const diffTime = currentDate - invDate;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 30) {
        buckets['0_30'] += outstanding;
      } else if (diffDays <= 60) {
        buckets['31_60'] += outstanding;
      } else if (diffDays <= 90) {
        buckets['61_90'] += outstanding;
      } else {
        buckets['90_plus'] += outstanding;
      }
    });
    return buckets;
  }, [invoicedInvoices]);

  // Revenue by Service Breakdown
  const serviceRevenue = useMemo(() => {
    const serviceMap = {
      'Police Verification': 0,
      'Background Verification': 0,

    };
    invoicedInvoices.forEach(inv => {
      let type = inv.serviceType;
      if (type === 'Background Checks') type = 'Background Verification';
      if (!serviceMap.hasOwnProperty(type)) {
        serviceMap['Other Services'] += inv.totalAmount;
      } else {
        serviceMap[type] += inv.totalAmount;
      }
    });
    const total = Object.values(serviceMap).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(serviceMap).map(([name, value], idx) => ({
      name,
      amount: value,
      value: Math.round((value / total) * 100),
      color: `hsl(215, 90%, ${45 + (idx * 8)}%)`
    }));
  }, [invoicedInvoices]);

  // Revenue by Client (Top 10)
  const topClients = useMemo(() => {
    const clientMap = {};
    invoicedInvoices.forEach(inv => {
      clientMap[inv.clientName] = (clientMap[inv.clientName] || 0) + inv.totalAmount;
    });
    return Object.entries(clientMap)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);
  }, [invoicedInvoices]);

  // Revenue Trend (Monthly Last 12 Months)
  const monthlyTrend = useMemo(() => {
    const months = [];
    const date = new Date(2026, 5, 1); // June 2026
    for (let i = 11; i >= 0; i--) {
      const d = new Date(date.getFullYear(), date.getMonth() - i, 1);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      months.push({ key: monthKey, label, invoiced: 0, collected: 0 });
    }

    invoices.forEach(inv => {
      if (!['generated', 'sent', 'paid', 'partially_paid', 'overdue', 'approved'].includes(inv.status)) return;
      const invMonth = inv.invoiceDate.substring(0, 7);
      const monthObj = months.find(m => m.key === invMonth);
      if (monthObj) {
        monthObj.invoiced += inv.totalAmount;
      }

      (inv.paymentAllocations || []).forEach(alloc => {
        const allocMonth = alloc.date.substring(0, 7);
        const allocMonthObj = months.find(m => m.key === allocMonth);
        if (allocMonthObj) {
          allocMonthObj.collected += alloc.amount;
        }
      });
    });
    return months;
  }, [invoices]);

  // SVGs for trend calculations
  const maxTrendVal = useMemo(() => {
    const maxVal = Math.max(...monthlyTrend.map(t => Math.max(t.invoiced, t.collected)), 100000);
    return maxVal;
  }, [monthlyTrend]);

  // Handle Invoice Approvals
  const handleApprove = (id) => {
    const inv = invoices.find(i => i.id === id);
    if (!inv) return;

    const updatedTimeline = [
      ...(inv.timeline || []),
      { date: new Date().toISOString(), event: 'Invoice Approved', details: 'Approved by Finance Accountant' },
      { date: new Date().toISOString(), event: 'Invoice Generated', details: `KPC-INV Number assigned: ${id}` }
    ];

    // In our workflow, approving an invoice shifts it to generated/sent
    mockDb.updateInvoice(id, {
      status: 'generated',
      timeline: updatedTimeline
    });

    mockDb.addFinancialActivity({
      event: 'Invoice Approved',
      desc: `${id} approved and generated`,
      type: 'approval'
    });

    loadData();
  };

  const handleReject = (id) => {
    const inv = invoices.find(i => i.id === id);
    if (!inv) return;

    const updatedTimeline = [
      ...(inv.timeline || []),
      { date: new Date().toISOString(), event: 'Invoice Rejected', details: 'Returned to Draft by Accountant' }
    ];

    // In our workflow, rejection returns it to Draft
    mockDb.updateInvoice(id, {
      status: 'draft',
      timeline: updatedTimeline
    });

    mockDb.addFinancialActivity({
      event: 'Invoice Rejected',
      desc: `${id} rejected & returned to Draft`,
      type: 'rejection'
    });

    loadData();
  };

  // Handle Month End closing
  const handleMonthEndClose = () => {
    if (closing.closingStatus === 'Locked') {
      alert('The current period is already locked.');
      return;
    }

    // Validate: Ensure no invoices are in pending_approval
    if (pendingApprovalsCount > 0) {
      alert(`Cannot close period: there are ${pendingApprovalsCount} invoices pending approval.`);
      return;
    }

    const nextPeriod = {
      openPeriod: 'July 2026',
      lastClosedPeriod: 'June 2026',
      lockedInvoices: invoices.length,
      closingStatus: 'Locked'
    };

    mockDb.saveFinancialClosing(nextPeriod);

    mockDb.addFinancialActivity({
      event: 'Financial Close',
      desc: 'June 2026 period closed & locked',
      type: 'closure'
    });

    loadData();
    alert('Financial Period closed and locked successfully.');
  };

  return (
    <div className="page-container" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.5s ease-out' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-dark)' }}>Financial Dashboard</h1>
          <p style={{ color: 'var(--text-gray)', marginTop: '6px', fontSize: '14px' }}>
            Enterprise overview of invoiced, collected, and outstanding revenue.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            className="btn btn-outline"
            onClick={handleMonthEndClose}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: closing.closingStatus === 'Locked' ? 0.6 : 1 }}
          >
            <Lock size={16} /> Month-End Close
          </button>
        </div>
      </div>

      {/* TOP KPI CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="card metric-card" style={{ padding: '20px', backgroundColor: '#fff', borderLeft: '4px solid #3b82f6', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-gray)', marginBottom: '8px' }}>
            <Banknote size={16} color="#3b82f6" />
            <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Invoiced Revenue</div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-dark)' }}>{formatCurrency(invoicedRevenue)}</div>
        </div>

        <div className="card metric-card" style={{ padding: '20px', backgroundColor: '#fff', borderLeft: '4px solid #10b981', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-gray)', marginBottom: '8px' }}>
            <CreditCard size={16} color="#10b981" />
            <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Collected Revenue</div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#10b981' }}>{formatCurrency(collectedRevenue)}</div>
        </div>

        <div className="card metric-card" style={{ padding: '20px', backgroundColor: '#fff', borderLeft: '4px solid #f59e0b', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-gray)', marginBottom: '8px' }}>
            <TrendingUp size={16} color="#f59e0b" />
            <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Outstanding Revenue</div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#d97706' }}>{formatCurrency(outstandingRevenue)}</div>
        </div>

        <div className="card metric-card" style={{ padding: '20px', backgroundColor: '#fff', borderLeft: '4px solid #ef4444', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-gray)', marginBottom: '8px' }}>
            <AlertCircle size={16} color="#ef4444" />
            <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Overdue Amount</div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#ef4444' }}>{formatCurrency(overdueAmount)}</div>
        </div>

        <div className="card metric-card" style={{ padding: '20px', backgroundColor: '#fff', borderLeft: '4px solid #8b5cf6', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-gray)', marginBottom: '8px' }}>
            <CheckCircle2 size={16} color="#8b5cf6" />
            <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pending Approvals</div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-dark)' }}>{pendingApprovalsCount}</div>
        </div>

        <div className="card metric-card" style={{ padding: '20px', backgroundColor: '#fff', borderLeft: '4px solid #64748b', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-gray)', marginBottom: '8px' }}>
            <Users size={16} color="#64748b" />
            <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Clients</div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-dark)' }}>{activeClients}</div>
        </div>
      </div>

      {/* Monthly Revenue Trend Graph Widget */}
      <div className="card" style={{ padding: '24px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={18} color="var(--primary-blue)" /> Revenue Trend (Last 12 Months)
          </h3>
          <div style={{ display: 'flex', gap: '16px', fontSize: '12px', fontWeight: 500 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', backgroundColor: '#3b82f6', borderRadius: '3px' }}></span> Invoiced Value
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', backgroundColor: '#10b981', borderRadius: '3px' }}></span> Collection Value
            </span>
          </div>
        </div>

        {/* Custom SVG Responsive Chart */}
        <div style={{ position: 'relative', width: '100%', height: '220px' }}>
          <svg viewBox="0 0 1000 220" width="100%" height="100%" preserveAspectRatio="none">
            {/* Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => (
              <line
                key={idx}
                x1="40"
                y1={20 + (160 * (1 - ratio))}
                x2="980"
                y2={20 + (160 * (1 - ratio))}
                stroke="#f1f5f9"
                strokeWidth="1.5"
              />
            ))}

            {/* Bars */}
            {monthlyTrend.map((m, idx) => {
              const xBase = 50 + (idx * 78);
              const invoiceHeight = (m.invoiced / maxTrendVal) * 160;
              const collectedHeight = (m.collected / maxTrendVal) * 160;
              const yInvoice = 180 - invoiceHeight;
              const yCollected = 180 - collectedHeight;

              return (
                <g key={idx}>
                  {/* Invoiced Bar */}
                  <rect
                    x={xBase}
                    y={yInvoice}
                    width="26"
                    height={Math.max(invoiceHeight, 2)}
                    fill="#3b82f6"
                    rx="3"
                  />
                  {/* Collected Bar */}
                  <rect
                    x={xBase + 30}
                    y={yCollected}
                    width="26"
                    height={Math.max(collectedHeight, 2)}
                    fill="#10b981"
                    rx="3"
                  />

                  {/* Labels */}
                  <text
                    x={xBase + 28}
                    y="202"
                    textAnchor="middle"
                    fill="#64748b"
                    fontSize="11"
                    fontWeight="500"
                  >
                    {m.label}
                  </text>

                  {/* Value Hover Tooltip Area (Conceptual) */}
                  <title>{`${m.label} -> Invoiced: ${formatCurrency(m.invoiced)}, Collected: ${formatCurrency(m.collected)}`}</title>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Analytics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>

        {/* Outstanding Aging Buckets */}
        <div className="card" style={{ padding: '24px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={18} color="var(--primary-blue)" /> Outstanding Aging Buckets
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '80px', fontSize: '12px', fontWeight: 600, color: 'var(--text-gray)' }}>0-30 Days</div>
              <div style={{ flex: 1, height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(agingBuckets['0_30'] / (outstandingRevenue || 1)) * 100}%`, backgroundColor: '#3b82f6' }}></div>
              </div>
              <div style={{ width: '80px', textAlign: 'right', fontSize: '13px', fontWeight: 600, color: 'var(--text-dark)' }}>{formatCurrency(agingBuckets['0_30'])}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '80px', fontSize: '12px', fontWeight: 600, color: 'var(--text-gray)' }}>31-60 Days</div>
              <div style={{ flex: 1, height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(agingBuckets['31_60'] / (outstandingRevenue || 1)) * 100}%`, backgroundColor: '#f59e0b' }}></div>
              </div>
              <div style={{ width: '80px', textAlign: 'right', fontSize: '13px', fontWeight: 600, color: 'var(--text-dark)' }}>{formatCurrency(agingBuckets['31_60'])}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '80px', fontSize: '12px', fontWeight: 600, color: 'var(--text-gray)' }}>61-90 Days</div>
              <div style={{ flex: 1, height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(agingBuckets['61_90'] / (outstandingRevenue || 1)) * 100}%`, backgroundColor: '#f97316' }}></div>
              </div>
              <div style={{ width: '80px', textAlign: 'right', fontSize: '13px', fontWeight: 600, color: 'var(--text-dark)' }}>{formatCurrency(agingBuckets['61_90'])}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '80px', fontSize: '12px', fontWeight: 600, color: '#ef4444' }}>90+ Days</div>
              <div style={{ flex: 1, height: '8px', backgroundColor: '#fef2f2', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(agingBuckets['90_plus'] / (outstandingRevenue || 1)) * 100}%`, backgroundColor: '#ef4444' }}></div>
              </div>
              <div style={{ width: '80px', textAlign: 'right', fontSize: '13px', fontWeight: 700, color: '#ef4444' }}>{formatCurrency(agingBuckets['90_plus'])}</div>
            </div>
          </div>
        </div>

        {/* Collection Efficiency */}
        <div className="card" style={{ padding: '24px', backgroundColor: '#fff', display: 'flex', flexDirection: 'column', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={18} color="var(--primary-blue)" /> Collections Center
          </h3>
          <div style={{ display: 'flex', gap: '20px', flex: 1 }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '20px' }}>
              <div style={{ fontSize: '36px', fontWeight: 700, color: '#10b981' }}>{collectionEfficiency}%</div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-gray)', textTransform: 'uppercase', marginTop: '8px', textAlign: 'center', letterSpacing: '0.5px' }}>Collection Efficiency</div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '20px' }}>
              <div style={{ fontSize: '36px', fontWeight: 700, color: 'var(--text-dark)' }}>{avgCollectionDays}<span style={{ fontSize: '16px', color: 'var(--text-gray)' }}> d</span></div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-gray)', textTransform: 'uppercase', marginTop: '8px', textAlign: 'center', letterSpacing: '0.5px' }}>Avg Collection Days</div>
            </div>
          </div>
        </div>

        {/* Revenue by Service */}
        <div className="card" style={{ padding: '24px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PieChart size={18} color="var(--primary-blue)" /> Revenue by Service
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {serviceRevenue.map((srv, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: srv.color }}></div>
                  <span style={{ fontSize: '13px', color: 'var(--text-dark)', fontWeight: 500 }}>{srv.name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-gray)' }}>{formatCurrency(srv.amount)}</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-dark)', width: '36px', textAlign: 'right' }}>{srv.value}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Layout Row: Approval Center, Top Clients, Closing, Feed */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>

        {/* Left Hand side: Approvals & Top Clients */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Approval Center */}
          <div className="card" style={{ backgroundColor: '#fff', overflow: 'hidden', display: 'flex', flexDirection: 'column', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={18} color="#f59e0b" /> Pending Invoice Approvals (Threshold &gt; ₹50,000)
              </h3>
              {pendingApprovalsCount > 0 && (
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#fff', backgroundColor: '#ef4444', padding: '2px 8px', borderRadius: '12px' }}>
                  {pendingApprovalsCount} Actions Required
                </span>
              )}
            </div>
            {pendingApprovalsCount === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-gray)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={32} color="#10b981" />
                <span style={{ fontWeight: 600, fontSize: '14px' }}>All Clear!</span>
                <span style={{ fontSize: '12px' }}>No invoices are currently pending approval.</span>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead style={{ backgroundColor: '#f8fafc' }}>
                    <tr>
                      <th style={{ padding: '12px 24px', fontSize: '11px', fontWeight: 600, color: 'var(--text-gray)' }}>INVOICE ID</th>
                      <th style={{ padding: '12px 24px', fontSize: '11px', fontWeight: 600, color: 'var(--text-gray)' }}>CLIENT</th>
                      <th style={{ padding: '12px 24px', fontSize: '11px', fontWeight: 600, color: 'var(--text-gray)' }}>REQUEST DATE</th>
                      <th style={{ padding: '12px 24px', fontSize: '11px', fontWeight: 600, color: 'var(--text-gray)' }}>AMOUNT</th>
                      <th style={{ padding: '12px 24px', fontSize: '11px', fontWeight: 600, color: 'var(--text-gray)', textAlign: 'right' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingApprovalsList.map((inv, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }} className="table-row-hover">
                        <td style={{ padding: '16px 24px', fontSize: '13px', fontWeight: 600, color: 'var(--primary-blue)' }}>{inv.id}</td>
                        <td style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-dark)', fontWeight: 500 }}>{inv.clientName}</td>
                        <td style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-gray)' }}>{new Date(inv.invoiceDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                        <td style={{ padding: '16px 24px', fontSize: '13px', fontWeight: 700, color: 'var(--text-dark)' }}>{formatCurrency(inv.totalAmount)}</td>
                        <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => handleApprove(inv.id)}
                              className="btn btn-outline"
                              style={{ padding: '6px 12px', fontSize: '12px', borderColor: '#10b981', color: '#10b981', backgroundColor: '#f0fdf4' }}
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(inv.id)}
                              className="btn btn-outline"
                              style={{ padding: '6px 12px', fontSize: '12px', borderColor: '#ef4444', color: '#ef4444', backgroundColor: '#fef2f2' }}
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Top Client Revenue Widget */}
          <div className="card" style={{ padding: '24px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={18} color="var(--primary-blue)" /> Top Revenue Clients (Top 10)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {topClients.map((client, idx) => {
                const maxClientVal = topClients[0]?.amount || 1;
                const pct = (client.amount / maxClientVal) * 100;
                return (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-dark)' }}>
                        {idx + 1}. {client.name}
                      </span>
                      <span style={{ fontWeight: 700, color: 'var(--text-dark)' }}>{formatCurrency(client.amount)}</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', backgroundColor: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', backgroundColor: 'var(--primary-blue)', borderRadius: '3px' }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Hand side: Closing & Activity Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Financial Closing Widget */}
          <div className="card" style={{ padding: '24px', backgroundColor: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lock size={18} color="var(--text-gray)" /> Financial Closing Control
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-gray)' }}>Current Open Period</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-dark)' }}>{closing.openPeriod || 'June 2026'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-gray)' }}>Last Closed Period</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-dark)' }}>{closing.lastClosedPeriod || 'May 2026'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-gray)' }}>Total Locked Invoices</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-dark)' }}>{closing.lockedInvoices || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-gray)' }}>Closing Status</span>
                <span className={`badge ${closing.closingStatus === 'Locked' ? 'badge-completed' : 'badge-draft'}`} style={{ fontSize: '11px', padding: '2px 8px' }}>
                  {closing.closingStatus || 'Active'}
                </span>
              </div>

              {closing.closingStatus === 'Locked' ? (
                <div style={{ marginTop: '8px', padding: '12px', backgroundColor: '#ecfdf5', borderRadius: '6px', border: '1px solid #a7f3d0', fontSize: '12px', color: '#065f46', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={14} /> Month Snapshot Archived Successfully
                </div>
              ) : (
                <div style={{ marginTop: '8px', padding: '12px', backgroundColor: '#fffbeb', borderRadius: '6px', border: '1px solid #fef3c7', fontSize: '12px', color: '#92400e', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertCircle size={14} /> Awaiting Period Closure Trigger
                </div>
              )}
            </div>
          </div>

          {/* Activity Feed */}
          <div className="card" style={{ padding: '24px', backgroundColor: '#fff', flex: 1, borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} color="var(--primary-blue)" /> Recent Financial Activity
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, maxHeight: '350px', overflowY: 'auto' }}>
              {activities.length === 0 ? (
                <div style={{ color: 'var(--text-gray)', fontSize: '12px', textAlign: 'center', padding: '20px' }}>
                  No recent financial activities logged.
                </div>
              ) : (
                activities.map((act, idx) => {
                  let badgeColor = '#3b82f6'; // invoice
                  if (act.type === 'payment') badgeColor = '#10b981';
                  if (act.type === 'approval') badgeColor = '#8b5cf6';
                  if (act.type === 'rejection') badgeColor = '#ef4444';
                  if (act.type === 'closure') badgeColor = '#64748b';
                  if (act.type === 'adjustment') badgeColor = '#f59e0b';

                  return (
                    <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: badgeColor, marginTop: '6px', flexShrink: 0 }}></div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-dark)' }}>{act.event}</span>
                          <span style={{ fontSize: '10px', color: 'var(--text-gray)', whiteSpace: 'nowrap' }}>
                            {new Date(act.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-gray)', marginTop: '2px' }}>{act.desc}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
