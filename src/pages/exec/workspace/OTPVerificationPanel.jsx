import React, { useState } from 'react';
import { KeyRound, Send, CheckCircle2, XCircle } from 'lucide-react';

export const OTPVerificationPanel = ({ employee, onUpdate }) => {
  const [otpStatus, setOtpStatus] = useState('Pending'); // Pending, Sent, Verified, Failed
  const [otpCode, setOtpCode] = useState('');

  const handleSendOTP = () => {
    setOtpStatus('Sent');
    if (onUpdate) {
      onUpdate({ type: 'otp-sent', timestamp: new Date().toISOString() });
    }
  };

  const handleVerifyOTP = () => {
    if (otpCode.length === 4 || otpCode.length === 6) {
      setOtpStatus('Verified');
      if (onUpdate) {
        onUpdate({ type: 'otp-verified', timestamp: new Date().toISOString() });
      }
    } else {
      setOtpStatus('Failed');
    }
  };

  return (
    <div className="card" style={{ padding: '20px', backgroundColor: '#fff', marginBottom: '24px' }}>
      <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <KeyRound size={18} color="var(--primary-blue)" /> OTP Verification Center
      </h3>

      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '13px', color: 'var(--text-gray)', marginBottom: '16px' }}>
            Verification cannot be completed until OTP is verified. Send OTP to registered mobile: <strong style={{ color: 'var(--text-dark)' }}>{employee.contactNumber || 'N/A'}</strong>
          </div>

          {otpStatus === 'Pending' && (
            <button className="btn btn-primary" onClick={handleSendOTP} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Send size={16} /> Generate & Send OTP
            </button>
          )}

          {(otpStatus === 'Sent' || otpStatus === 'Failed') && (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <input 
                type="text" 
                placeholder="Enter 4 or 6 digit OTP" 
                className="input-field" 
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                style={{ width: '180px', padding: '10px' }}
                maxLength={6}
              />
              <button className="btn btn-primary" onClick={handleVerifyOTP}>Verify OTP</button>
              <button className="btn btn-outline" onClick={handleSendOTP}>Resend</button>
            </div>
          )}

          {otpStatus === 'Verified' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: 600, fontSize: '14px', padding: '12px', backgroundColor: '#ecfdf5', borderRadius: '6px', border: '1px solid #a7f3d0' }}>
              <CheckCircle2 size={18} /> OTP Verified Successfully
            </div>
          )}
          {otpStatus === 'Failed' && (
            <div style={{ marginTop: '8px', color: '#ef4444', fontSize: '12px', fontWeight: 600 }}>Invalid OTP. Please try again.</div>
          )}
        </div>

        <div style={{ width: '200px', padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <h4 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-gray)', textTransform: 'uppercase', marginBottom: '12px' }}>OTP Status</h4>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: otpStatus === 'Pending' ? '#3b82f6' : '#cbd5e1' }}></div>
            <span style={{ fontSize: '13px', color: 'var(--text-dark)', fontWeight: otpStatus === 'Pending' ? 600 : 400 }}>Pending</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: otpStatus === 'Sent' ? '#f59e0b' : '#cbd5e1' }}></div>
            <span style={{ fontSize: '13px', color: 'var(--text-dark)', fontWeight: otpStatus === 'Sent' ? 600 : 400 }}>Sent</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: otpStatus === 'Verified' ? '#10b981' : otpStatus === 'Failed' ? '#ef4444' : '#cbd5e1' }}></div>
            <span style={{ fontSize: '13px', color: 'var(--text-dark)', fontWeight: (otpStatus === 'Verified' || otpStatus === 'Failed') ? 600 : 400 }}>
              {otpStatus === 'Failed' ? 'Failed' : 'Verified'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
