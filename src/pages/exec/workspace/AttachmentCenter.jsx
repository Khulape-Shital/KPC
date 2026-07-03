import React, { useState } from 'react';
import { Paperclip, UploadCloud, Trash2, Eye } from 'lucide-react';

export const AttachmentCenter = ({ employee }) => {
  const [attachments, setAttachments] = useState([
    { name: 'police_clearance_receipt.pdf', date: '2026-06-12', size: '1.2MB' },
    { name: 'address_photo.jpg', date: '2026-06-13', size: '2.4MB' }
  ]);

  const handleUpload = () => {
    // Mock upload
    const newAtt = {
      name: `evidence_${Date.now()}.png`,
      date: new Date().toISOString().split('T')[0],
      size: '1.5MB'
    };
    setAttachments([...attachments, newAtt]);
  };

  const handleDelete = (idx) => {
    const updated = [...attachments];
    updated.splice(idx, 1);
    setAttachments(updated);
  };

  return (
    <div className="card" style={{ padding: '20px', backgroundColor: '#fff', marginBottom: '24px' }}>
      <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Paperclip size={18} color="var(--primary-blue)" /> Attachment Center
        </div>
        <button className="btn btn-outline" onClick={handleUpload} style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <UploadCloud size={14} /> Upload Evidence
        </button>
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {attachments.length > 0 ? (
          attachments.map((att, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '6px', backgroundColor: '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '6px', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Paperclip size={14} color="var(--text-gray)" />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-dark)' }}>{att.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-gray)' }}>{att.date} • {att.size}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-outline" style={{ padding: '6px', fontSize: '12px' }} title="Preview">
                  <Eye size={14} />
                </button>
                <button className="btn btn-outline" onClick={() => handleDelete(idx)} style={{ padding: '6px', fontSize: '12px', color: '#ef4444', borderColor: '#fca5a5' }} title="Delete">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div style={{ fontSize: '12px', color: 'var(--text-gray)', textAlign: 'center', padding: '20px 0' }}>No attachments uploaded.</div>
        )}
      </div>
    </div>
  );
};
