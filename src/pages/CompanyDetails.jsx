import React from 'react';
import { ArrowLeft, Building2, Users, FileBarChart, CreditCard, Activity } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

export const CompanyDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const company = {
    name: 'TechCorp Enterprise Group', id: id, hq: 'Bangalore, India', industry: 'Conglomerate',
    accounts: [
      { name: 'TechCorp Solutions (IT)', id: 'C-001', forms: 1204, status: 'Active' },
      { name: 'TechCorp Retail', id: 'C-004', forms: 450, status: 'Active' }
    ],
    billing: { totalInvoiced: '₹14,50,000', outstanding: '₹45,000', nextInvoice: 'Nov 01, 2023' }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button onClick={() => navigate('/ops/companies')} style={{ padding: '8px', borderRadius: '50%', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 style={{ fontSize: '24px', marginBottom: '4px' }}>{company.name}</h1>
          <p style={{ color: 'var(--text-gray)', fontSize: '14px' }}>Company ID: {company.id} • Parent Entity</p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px' }}>
          <button className="btn btn-outline">Edit Company</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
        
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="card" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <Building2 size={20} color="var(--primary-blue)" /> Company Profile
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div><span style={{ fontSize: '12px', color: 'var(--text-gray)' }}>INDUSTRY</span><div style={{ fontWeight: 500 }}>{company.industry}</div></div>
              <div><span style={{ fontSize: '12px', color: 'var(--text-gray)' }}>HEADQUARTERS</span><div style={{ fontWeight: 500 }}>{company.hq}</div></div>
              <div><span style={{ fontSize: '12px', color: 'var(--text-gray)' }}>PARENT ORG</span><div style={{ fontWeight: 500 }}>None (Top Level)</div></div>
            </div>
          </div>

          <div className="card" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <CreditCard size={20} color="var(--primary-blue)" /> Billing Overview
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div><span style={{ fontSize: '12px', color: 'var(--text-gray)' }}>TOTAL INVOICED YTD</span><div style={{ fontWeight: 700, fontSize: '20px' }}>{company.billing.totalInvoiced}</div></div>
              <div><span style={{ fontSize: '12px', color: 'var(--text-gray)' }}>TOTAL OUTSTANDING</span><div style={{ fontWeight: 700, fontSize: '20px', color: '#dc2626' }}>{company.billing.outstanding}</div></div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><Users size={20} color="var(--primary-blue)" /> Associated Client Accounts</h2>
              <button className="btn btn-outline" style={{ fontSize: '12px', padding: '4px 12px' }}>Link Client Account</button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-gray)', fontSize: '12px' }}>
                  <th style={{ paddingBottom: '12px' }}>ACCOUNT NAME & ID</th>
                  <th style={{ paddingBottom: '12px' }}>TOTAL FORMS</th>
                  <th style={{ paddingBottom: '12px' }}>STATUS</th>
                  <th style={{ paddingBottom: '12px', textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {company.accounts.map((acc, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '16px 0' }}>
                      <div style={{ fontWeight: 600 }}>{acc.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-gray)' }}>{acc.id}</div>
                    </td>
                    <td style={{ padding: '16px 0', fontWeight: 500 }}>{acc.forms}</td>
                    <td style={{ padding: '16px 0' }}><span className="badge badge-completed">{acc.status}</span></td>
                    <td style={{ padding: '16px 0', textAlign: 'right' }}>
                      <button className="btn btn-outline" onClick={() => navigate(`/ops/clients/${acc.id}`)} style={{ padding: '4px 8px', fontSize: '12px' }}>View Client</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card" style={{ padding: '24px' }}>
             <h2 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <Activity size={20} color="var(--primary-blue)" /> Activity Timeline
            </h2>
            <div style={{ borderLeft: '2px solid var(--border-color)', marginLeft: '8px', paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '-21px', top: '2px', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--primary-blue)' }} />
                <div style={{ fontSize: '14px', fontWeight: 600 }}>New Client Account Linked: TechCorp Retail</div>
                <div style={{ fontSize: '12px', color: 'var(--text-gray)' }}>Oct 15, 2023 by System Admin</div>
              </div>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '-21px', top: '2px', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#cbd5e1' }} />
                <div style={{ fontSize: '14px', fontWeight: 600 }}>Consolidated Invoice Generated for Q3</div>
                <div style={{ fontSize: '12px', color: 'var(--text-gray)' }}>Oct 01, 2023</div>
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
