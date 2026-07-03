import React, { useState } from 'react';
import { BookOpen, Save, Clock } from 'lucide-react';

export const VerificationNotesPanel = ({ employee, onUpdate }) => {
  const [noteCategory, setNoteCategory] = useState('General Notes');
  const [noteContent, setNoteContent] = useState('');

  const EXEC_NAME = 'Amitabh S.'; // Assume logged in exec

  const handleSaveNote = () => {
    if (!noteContent.trim()) return;

    if (onUpdate) {
      onUpdate({
        type: 'add-note',
        category: noteCategory,
        content: noteContent,
        user: EXEC_NAME,
        timestamp: new Date().toISOString()
      });
      setNoteContent('');
    }
  };

  // Mocking the extraction of notes from timeline if no dedicated notes array exists in mockDb
  const notes = employee.timeline ? employee.timeline.filter(t => t.event === 'Notes Added') : [];

  return (
    <div className="card" style={{ padding: '20px', backgroundColor: '#fff', marginBottom: '24px' }}>
      <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <BookOpen size={18} color="var(--primary-blue)" /> Verification Notes
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-gray)', marginBottom: '8px' }}>Note Category</label>
            <select 
              className="select-input" 
              value={noteCategory} 
              onChange={(e) => setNoteCategory(e.target.value)}
              style={{ width: '100%', padding: '10px' }}
            >
              <option value="General Notes">General Notes</option>
              <option value="Call Notes">Call Notes</option>
              <option value="Document Notes">Document Notes</option>
              <option value="Escalation Notes">Escalation Notes</option>
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-gray)', marginBottom: '8px' }}>Note Content</label>
            <textarea 
              className="input-field" 
              rows="4" 
              placeholder="Enter comprehensive verification notes here..."
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              style={{ width: '100%', padding: '10px', resize: 'vertical' }}
            ></textarea>
          </div>

          <button className="btn btn-primary" onClick={handleSaveNote} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Save size={14} /> Save Note
          </button>
        </div>

        <div style={{ backgroundColor: '#f8fafc', borderRadius: '8px', padding: '16px', border: '1px solid var(--border-color)', overflowY: 'auto', maxHeight: '300px' }}>
          <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '12px' }}>Saved Notes</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {notes.length > 0 ? (
              notes.map((note, idx) => (
                <div key={idx} style={{ padding: '12px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--primary-blue)', backgroundColor: '#eff6ff', padding: '2px 6px', borderRadius: '4px' }}>
                      {note.category || 'General Notes'}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--text-gray)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={10} /> {new Date(note.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-dark)', lineHeight: '1.5' }}>
                    {note.details}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-gray)', marginTop: '8px', textAlign: 'right' }}>
                    By: {note.user}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ fontSize: '12px', color: 'var(--text-gray)', textAlign: 'center', padding: '20px 0' }}>No notes added yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
