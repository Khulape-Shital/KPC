import React, { useState } from 'react';
import { Globe, Check, AlertTriangle, ExternalLink } from 'lucide-react';

export const PortalVerificationPanel = ({ portals = [], onUpdate }) => {
  const [portalData, setPortalData] = useState(
    portals.length > 0 ? portals : [
      { name: 'MahaOnline', status: 'Pending', reference: '', date: '' },
      { name: 'Police Verification', status: 'Pending', reference: '', date: '' },
      { name: 'Background Check Portal', status: 'Pending', reference: '', date: '' }
    ]
  );

  const handleStatusChange = (index, newStatus) => {
    const updated = [...portalData];
    updated[index].status = newStatus;
    if (newStatus === 'Verified') {
      updated[index].date = new Date().toISOString().split('T')[0];
    }
    setPortalData(updated);
    
    if (onUpdate) {
      onUpdate({ type: 'portal-update', portals: updated });
    }
  };

  const handleRefChange = (index, ref) => {
    const updated = [...portalData];
    updated[index].reference = ref;
    setPortalData(updated);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Verified': return '#10b981';
      case 'Failed': return '#ef4444';
      default: return '#64748b';
    }
  };

  return (
    <div className="card" style={{ padding: '20px', backgroundColor: '#fff', marginBottom: '24px' }}>
      <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Globe size={18} color="var(--primary-blue)" /> Government Portal Verification
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {portalData.map((portal, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {portal.name}
                <ExternalLink size={12} color="var(--primary-blue)" style={{ cursor: 'pointer' }} title="Open Portal" />
              </div>
              <div style={{ marginTop: '8px', display: 'flex', gap: '12px' }}>
                <input 
                  type="text" 
                  placeholder="Reference Number" 
                  className="input-field" 
                  value={portal.reference}
                  onChange={(e) => handleRefChange(idx, e.target.value)}
                  style={{ padding: '6px 10px', fontSize: '12px', width: '200px' }}
                />
                {portal.date && (
                  <span style={{ fontSize: '12px', color: 'var(--text-gray)', alignSelf: 'center' }}>
                    Date: {portal.date}
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: getStatusColor(portal.status) }}>
                {portal.status}
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  className="btn btn-outline" 
                  onClick={() => handleStatusChange(idx, 'Verified')}
                  style={{ padding: '6px 10px', fontSize: '12px', borderColor: portal.status === 'Verified' ? '#10b981' : '', color: portal.status === 'Verified' ? '#10b981' : '' }}
                >
                  <Check size={14} /> Verify
                </button>
                <button 
                  className="btn btn-outline" 
                  onClick={() => handleStatusChange(idx, 'Failed')}
                  style={{ padding: '6px 10px', fontSize: '12px', borderColor: portal.status === 'Failed' ? '#ef4444' : '', color: portal.status === 'Failed' ? '#ef4444' : '' }}
                >
                  <AlertTriangle size={14} /> Fail
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
