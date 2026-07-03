import React, { useState, useEffect } from 'react';
import { PhoneCall, PhoneOff, PhoneMissed, CheckCircle2, XCircle, Clock, Save, MessageCircle } from 'lucide-react';
import { supabase } from "../../../utils/supabase";

const CALL_OUTCOMES = [
  {
    id: 'call_received_otp_received',
    label: 'Call Received — OTP Shared',
    desc: 'Candidate answered the call and provided OTP successfully.',
    callReceived: true,
    otpReceived: true,
    color: '#10b981',
    bg: '#ecfdf5',
    border: '#a7f3d0',
    icon: CheckCircle2
  },
  {
    id: 'call_received_no_otp',
    label: 'Call Received — OTP Not Shared',
    desc: 'Candidate answered but did not share OTP (refused / said later).',
    callReceived: true,
    otpReceived: false,
    color: '#f59e0b',
    bg: '#fffbeb',
    border: '#fcd34d',
    icon: PhoneCall
  },
  {
    id: 'call_not_received',
    label: 'Call Not Received',
    desc: 'Candidate did not pick up the call.',
    callReceived: false,
    otpReceived: false,
    color: '#ef4444',
    bg: '#fef2f2',
    border: '#fca5a5',
    icon: PhoneMissed
  },
  {
    id: 'call_busy_retry',
    label: 'Busy / Will Retry',
    desc: 'Number was busy or candidate asked to call back later.',
    callReceived: false,
    otpReceived: false,
    color: '#8b5cf6',
    bg: '#f5f3ff',
    border: '#c4b5fd',
    icon: PhoneOff
  }
];

export const CallVerificationPanel = ({ employee, onUpdate }) => {
  const [selectedOutcome, setSelectedOutcome] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Get all call-related events from the timeline
  // const callLogs = (employee.timeline || []).filter(t =>
  //   t.event.startsWith('Call ') || t.callMeta
  // );

  const [callLogs, setCallLogs] = useState([]);
  useEffect(() => {
    const loadCalls = async () => {


      const { data, error } = await supabase
        .from("call_logs")
        .select("*")
        .eq("employee_id", employee.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
      } else {
        setCallLogs(data || []);
      }
    };

    if (employee?.id) {
      loadCalls();
    }

  }, [employee.id]);

  const handleSaveLog = async () => {
    if (!selectedOutcome) {
      alert('Please select a call outcome before saving.');
      return;
    }

    setSaving(true);

    const outcome = CALL_OUTCOMES.find(o => o.id === selectedOutcome);
    const eventLabel = outcome.label;

    const session =
      JSON.parse(localStorage.getItem("kpc_session")) || {};

    const { error: insertError } = await supabase
      .from("call_logs")
      .insert({
        employee_id: employee.id,
        executive_id: session.userId,
        executive_name: session.userName,
        outcome: outcome.label,
        outcome_id: outcome.id,
        remarks: remarks,
        call_received: outcome.callReceived,
        otp_received: outcome.otpReceived,
        call_status: outcome.callReceived && outcome.otpReceived ? 'Verified' : 'Attempted'
      });

    if (insertError) {
      console.error("Failed to save call log:", insertError);
      alert("Failed to save call log to the database. " + insertError.message);
    } else {
      // Append the newly created log to state immediately to show in UI
      setCallLogs(prev => [{
        employee_id: employee.id,
        executive_id: session.userId,
        executive_name: session.userName,
        outcome: outcome.label,
        outcome_id: outcome.id,
        remarks: remarks,
        call_received: outcome.callReceived,
        otp_received: outcome.otpReceived,
        created_at: new Date().toISOString()
      }, ...prev]);
    }

    if (onUpdate) {
      await onUpdate({
        type: 'call-log',
        status: outcome.callReceived && outcome.otpReceived ? 'Verified' : 'Attempted',
        callReceived: outcome.callReceived,
        otpReceived: outcome.otpReceived,
        outcomeId: outcome.id,
        remarks: remarks || outcome.desc,
        timestamp: new Date().toISOString(),
        eventLabel
      });
    }

    setSaving(false);
    setSaved(true);
    setRemarks('');
    setSelectedOutcome(null);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="card" style={{ padding: '20px', backgroundColor: '#fff', marginBottom: '24px' }}>
      <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <PhoneCall size={18} color="var(--primary-blue)" /> Call Verification Center
      </h3>
      <p style={{ fontSize: '12px', color: 'var(--text-gray)', marginBottom: '20px' }}>
        Log the outcome of your call attempt with the candidate.
      </p>

      {/* Outcome Selection */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
        {CALL_OUTCOMES.map(outcome => {
          const Icon = outcome.icon;
          const isSelected = selectedOutcome === outcome.id;
          return (
            <button
              key={outcome.id}
              onClick={() => setSelectedOutcome(outcome.id)}
              style={{
                padding: '14px 16px',
                borderRadius: '10px',
                border: `2px solid ${isSelected ? outcome.color : 'var(--border-color)'}`,
                backgroundColor: isSelected ? outcome.bg : '#f8fafc',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px'
              }}
            >
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: isSelected ? outcome.bg : '#e2e8f0',
                border: `1px solid ${isSelected ? outcome.border : 'transparent'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Icon size={16} color={isSelected ? outcome.color : '#94a3b8'} />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: isSelected ? outcome.color : 'var(--text-dark)' }}>
                  {outcome.label}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-gray)', marginTop: '3px', lineHeight: '1.4' }}>
                  {outcome.desc}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Remarks Field */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--text-gray)', marginBottom: '8px' }}>
          <MessageCircle size={13} /> Additional Remarks (Optional)
        </label>
        <textarea
          className="input-field"
          rows="2"
          placeholder="e.g. Candidate said will call back at 5 PM..."
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          style={{ width: '100%', padding: '10px', resize: 'vertical', boxSizing: 'border-box' }}
        />
      </div>

      {/* Save Button */}
      <button
        className="btn btn-primary"
        onClick={handleSaveLog}
        disabled={!selectedOutcome || saving}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '8px',
          padding: '12px',
          fontSize: '14px',
          fontWeight: 600,
          opacity: !selectedOutcome ? 0.5 : 1,
          backgroundColor: saved ? '#10b981' : undefined,
          transition: 'background-color 0.3s'
        }}
      >
        {saved ? (
          <><CheckCircle2 size={16} /> Call Log Saved!</>
        ) : saving ? (
          <><Clock size={16} /> Saving...</>
        ) : (
          <><Save size={16} /> Save Call Log</>
        )}
      </button>

      {/* Recent Call Logs */}
      {callLogs.length > 0 && (
        <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
          <h4 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
            Recent Call History
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {callLogs.slice().reverse().map((t, idx) => {
              const outcome = CALL_OUTCOMES.find(o => o.id === t.outcome_id);
              const color = outcome ? outcome.color : '#3b82f6';
              const bg = outcome ? outcome.bg : '#eff6ff';
              return (
                <div key={idx} style={{ display: 'flex', gap: '12px', padding: '10px 12px', backgroundColor: bg, borderRadius: '8px', border: `1px solid ${outcome ? outcome.border : '#bfdbfe'}` }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color, marginTop: '5px', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-dark)' }}>{t.outcome}</div>
                    {t.remarks && <div style={{ fontSize: '11px', color: 'var(--text-gray)', marginTop: '2px' }}>{t.remarks}</div>}
                    <div style={{ fontSize: '11px', color: 'var(--text-gray)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={10} /> {new Date(t.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })} · {t.executive_name || 'Executive'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
