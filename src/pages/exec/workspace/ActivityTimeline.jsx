import React, { useEffect, useState } from 'react';
import { supabase } from "../../../utils/supabase";
import { History } from 'lucide-react';

export const ActivityTimeline = ({ employee }) => {

  const [timeline, setTimeline] = useState([]);
  useEffect(() => {

    const loadTimeline = async () => {

      const { data, error } = await supabase
        .from("verification_logs")
        .select("*")
        .eq("case_id", employee.id)
        .order("created_at", { ascending: false });

      if (!error) {
        setTimeline(data || []);
      }

    };
    if (employee?.id) {
      loadTimeline();
    }

  }, [employee]);
  return (
    <div className="card" style={{ padding: '20px', backgroundColor: '#fff', marginBottom: '24px' }}>
      <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <History size={18} color="var(--primary-blue)" /> Activity Timeline
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
        {timeline && timeline.length > 0 ? (
          timeline.slice().reverse().map((t, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '12px', position: 'relative' }}>
              {idx !== timeline.length - 1 && (
                <div style={{ position: 'absolute', top: '16px', left: '7px', bottom: '-16px', width: '2px', backgroundColor: 'var(--border-color)' }}></div>
              )}
              <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: 'var(--bg-secondary)', border: '2px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, marginTop: '2px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--primary-blue)' }}></div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-dark)' }}>{t.status}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-gray)' }}>{new Date(t.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</div>
                </div>
                {t.remarks && (
                  <div style={{ fontSize: '12px', color: 'var(--text-gray)', marginTop: '4px' }}>{t.remarks}</div>
                )}
                <div style={{ fontSize: '10px', color: 'var(--text-light)', marginTop: '4px' }}>By: {t.executive_name}</div>
              </div>
            </div>
          ))
        ) : (
          <div style={{ fontSize: '12px', color: 'var(--text-gray)' }}>No timeline events found.</div>
        )}
      </div>
    </div>
  );
};
