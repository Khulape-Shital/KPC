import React from 'react';
import { CheckSquare, CheckCircle2, Circle, AlertTriangle, PhoneCall, FileText } from 'lucide-react';

export const CompletionChecklist = ({ employee, checklistState }) => {
  const items = [
    {
      id: 'documentsReviewed',
      label: 'Documents Reviewed',
      subLabel: 'All uploaded documents have been checked.',
      checked: checklistState?.documentsReviewed,
      icon: FileText
    },
    {
      id: 'callLogged',
      label: 'Call Outcome Logged',
      subLabel: 'A call attempt has been recorded with its outcome.',
      checked: checklistState?.callLogged,
      icon: PhoneCall
    }
  ];

  const allChecked = items.every(i => i.checked);

  return (
    <div className="card" style={{ padding: '20px', backgroundColor: '#fff' }}>
      <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <CheckSquare size={18} color="var(--primary-blue)" /> Completion Checklist
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {items.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: item.checked ? '#f0fdf4' : '#f8fafc',
              border: `1px solid ${item.checked ? '#bbf7d0' : 'var(--border-color)'}`,
              transition: 'all 0.2s'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: item.checked ? '#dcfce7' : '#e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Icon size={15} color={item.checked ? '#16a34a' : '#94a3b8'} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: item.checked ? '#15803d' : 'var(--text-dark)' }}>
                  {item.label}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-gray)', marginTop: '1px' }}>
                  {item.subLabel}
                </div>
              </div>
              {item.checked ? (
                <CheckCircle2 size={18} color="#16a34a" />
              ) : (
                <Circle size={18} color="#cbd5e1" />
              )}
            </div>
          );
        })}
      </div>

      <div style={{
        marginTop: '16px',
        padding: '12px',
        borderRadius: '8px',
        backgroundColor: allChecked ? '#ecfdf5' : '#fef2f2',
        border: `1px solid ${allChecked ? '#a7f3d0' : '#fca5a5'}`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 600, color: allChecked ? '#065f46' : '#991b1b' }}>
          {allChecked ? (
            <><CheckCircle2 size={14} /> Ready for Completion — All steps done!</>
          ) : (
            <><AlertTriangle size={14} /> Complete all steps above before submitting.</>
          )}
        </div>
      </div>
    </div>
  );
};
