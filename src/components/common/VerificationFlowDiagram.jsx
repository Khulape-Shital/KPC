import React from 'react';
import { Users, Settings, MapPin, Search } from 'lucide-react';

const VerificationFlowDiagram = () => {
  return (
    <div style={{ position: 'relative', height: '300px', border: '1px solid #f1f5f9', borderRadius: '20px', backgroundImage: 'radial-gradient(#e2e8f0 1px, transparent 1px)', backgroundSize: '24px 24px', backgroundColor: '#fafaf9' }}>
      {/* SVG Connecting Lines */}
      <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        <path d="M120,60 L400,80 L200,150 L420,170" fill="none" stroke="#e2e8f0" strokeWidth="2" />
      </svg>

      {/* Nodes */}
      <div style={{ position: 'absolute', top: '40px', left: '40px', display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#fff', padding: '8px 16px 8px 8px', borderRadius: '100px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03), 0 0 0 1px rgba(0,0,0,0.02)' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}><Users size={16} /></div>
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>Client HR</span>
      </div>

      <div style={{ position: 'absolute', top: '60px', right: '40px', display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#fff', padding: '8px 16px 8px 8px', borderRadius: '100px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03), 0 0 0 1px rgba(0,0,0,0.02)' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6' }}><Settings size={16} /></div>
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>Ops Manager</span>
      </div>

      <div style={{ position: 'absolute', top: '130px', left: '100px', display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#fff', padding: '8px 16px 8px 8px', borderRadius: '100px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03), 0 0 0 1px rgba(0,0,0,0.02)' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22c55e' }}><MapPin size={16} /></div>
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>Verification</span>
      </div>

      <div style={{ position: 'absolute', top: '150px', right: '100px', display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#fff', padding: '8px 16px 8px 8px', borderRadius: '100px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03), 0 0 0 1px rgba(0,0,0,0.02)' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#fefce8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#eab308' }}><Search size={16} /></div>
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>Review</span>
      </div>
    </div>
  );
};

export default VerificationFlowDiagram;
