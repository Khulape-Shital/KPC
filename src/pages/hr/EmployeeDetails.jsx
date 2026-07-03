import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Calendar, User, Phone, ShieldAlert, FileText,
  CheckCircle2, AlertTriangle, Clock, Download, Plus,
  MessageSquare, Send, History, Sparkles, UploadCloud, X,
  RotateCw, RotateCcw, Crop, RefreshCw, FileCheck, Check
} from 'lucide-react';
import { mockDb } from '../../utils/mockDb';
import { supabase } from '../../utils/supabase';

export const EmployeeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);

  // Internal notes state
  const [newNote, setNewNote] = useState('');
  const [notesList, setNotesList] = useState([]);

  // Image Editor modal states for Re-upload
  const [activeUploadType, setActiveUploadType] = useState(null);
  const [editorImageSrc, setEditorImageSrc] = useState(null);
  const [editorFile, setEditorFile] = useState(null);
  const [editorFilename, setEditorFilename] = useState('');
  const [editorFilesize, setEditorFilesize] = useState('');
  const [editorFiletype, setEditorFiletype] = useState('');

  // Image manipulation slider states
  const [zoom, setZoom] = useState(1);
  const [rotate, setRotate] = useState(0);
  const [straighten, setStraighten] = useState(0);
  const [cropBox, setCropBox] = useState({ x: 10, y: 10, w: 80, h: 80 });

  // Refs
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // useEffect(() => {
  //   mockDb.init();
  //   loadEmployeeData();
  // }, [id]);


  useEffect(() => {
    loadEmployeeData();
  }, [id]);

  // const loadEmployeeData = () => {
  //   const emp = mockDb.getEmployeeById(id);

  //   if (emp) {
  //     setEmployee(emp);

  //     if (emp.notes) {
  //       setNotesList(
  //         emp.notes.split('\n\n').filter(Boolean)
  //       );
  //     } else {
  //       setNotesList([]);
  //     }
  //   }
  // };

  const loadEmployeeData = async () => {

    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error(error);
      return;
    }

    // Load documents
    const { data: documents, error: docsError } =
      await supabase
        .from("employee_documents")
        .select("*")
        .eq("employee_id", id);

    if (docsError) {
      console.error(docsError);
    }

    console.log("DOCUMENTS FROM DB:", documents);

    const employeeData = {
      ...data,

      name: data.full_name,
      fatherName: data.father_name,
      motherName: data.mother_name,
      contactNumber: data.mobile,
      status: data.verification_status,

      documents: (documents || []).map(doc => ({
        name: doc.document_type,
        type: doc.document_type,
        status: "Uploaded",

        thumbnail: doc.file_url,
        file_url: doc.file_url,

        quality: "Uploaded",
        size: "",
        isPdf: doc.file_url?.toLowerCase().includes(".pdf")
      }))
    };

    console.log("EMPLOYEE DATA:", employeeData);

    setEmployee(employeeData);

    if (data.notes) {
      setNotesList(
        data.notes.split('\n\n').filter(Boolean)
      );
    } else {
      setNotesList([]);
    }
  };


  const getStatusLabel = (status) => {
    switch (status) {
      case 'draft': return 'Draft';
      case 'submitted': return 'Submitted';
      case 'assigned': return 'Assigned';
      case 'call-pending': return 'Call Pending';
      case 'otp-received': return 'OTP Received';
      case 'in-progress': return 'In Progress';
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      case 'completed': return 'Completed';
      default: return status;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'draft': return 'badge-draft';
      case 'submitted': return 'badge-submitted';
      case 'assigned': return 'badge-assigned';
      case 'call-pending': return 'badge-call-pending';
      case 'otp-received': return 'badge-otp-received';
      case 'in-progress': return 'badge-in-progress';
      case 'approved': return 'badge-approved';
      case 'rejected': return 'badge-rejected';
      case 'completed': return 'badge-completed';
      default: return '';
    }
  };

  // 10. HR Internal Notes Submission
  const handleAddNote = (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    const now = new Date().toISOString();
    const updatedNotes = employee.notes
      ? `${employee.notes}\n\nClient HR (${new Date(now).toLocaleDateString()}): ${newNote.trim()}`
      : `Client HR (${new Date(now).toLocaleDateString()}): ${newNote.trim()}`;

    const newTimelineEvent = {
      event: 'Note Added',
      user: 'Client HR',
      date: now,
      details: newNote.trim()
    };

    const newAuditEntry = {
      user: 'Client HR',
      action: 'Notes Added',
      date: now
    };

    const updatedEmployee = {
      ...employee,
      notes: updatedNotes,
      timeline: [
        ...(employee.timeline || []),
        newTimelineEvent
      ],
      audit: [
        ...(employee.audit || []),
        newAuditEntry
      ]
    };

    updateSupabaseEmployee(employee.id, updatedEmployee);
    setNewNote('');
    loadEmployeeData();
  };

  // 9. Document Re-upload Triggers
  const handleReuploadClick = (docType) => {
    setActiveUploadType(docType);
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      alert('Only JPEG, PNG images and PDF files are supported.');
      e.target.value = null;
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('File size exceeds 5MB limit.');
      e.target.value = null;
      return;
    }

    const sizeMB = (file.size / (1024 * 1024)).toFixed(2) + 'MB';
    setEditorFilename(file.name);
    setEditorFilesize(sizeMB);
    setEditorFiletype(file.type);
    setEditorFile(file);

    if (file.type === 'application/pdf') {
      const now = new Date().toISOString();
      const updatedDocs = employee.documents.map(d => {
        if (d.type === activeUploadType) {
          return {
            ...d,
            status: 'Uploaded',
            name: file.name,
            quality: 'High',
            size: sizeMB,
            isPdf: true
          };
        }
        return d;
      });

      const updatedEmployee = {
        ...employee,
        documents: updatedDocs,
        timeline: [
          ...(employee.timeline || []),
          {
            event: 'Document Uploaded',
            user: 'Client HR',
            date: now,
            details: `${activeUploadType} Re-uploaded`
          }
        ],
        audit: [
          ...(employee.audit || []),
          {
            user: 'Client HR',
            action: `Re-uploaded ${activeUploadType}`,
            date: now
          }
        ]
      };

      updateSupabaseEmployee(employee.id, updatedEmployee);
      loadEmployeeData();
      setActiveUploadType(null);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        setEditorImageSrc(event.target.result);
        setZoom(1);
        setRotate(0);
        setStraighten(0);
        setCropBox({ x: 15, y: 15, w: 70, h: 70 });
      };
      reader.readAsDataURL(file);
    }
    e.target.value = null;
  };

  // Image manipulation preview
  useEffect(() => {
    if (!editorImageSrc || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const image = new Image();

    image.onload = () => {
      canvas.width = 400;
      canvas.height = 300;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotate * Math.PI) / 180);
      ctx.rotate((straighten * Math.PI) / 180);
      ctx.scale(zoom, zoom);

      const wRatio = canvas.width / image.width;
      const hRatio = canvas.height / image.height;
      const ratio = Math.min(wRatio, hRatio) * 0.9;
      const w = image.width * ratio;
      const h = image.height * ratio;

      ctx.drawImage(image, -w / 2, -h / 2, w, h);
      ctx.restore();

      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 4]);

      const cx = (cropBox.x / 100) * canvas.width;
      const cy = (cropBox.y / 100) * canvas.height;
      const cw = (cropBox.w / 100) * canvas.width;
      const ch = (cropBox.h / 100) * canvas.height;

      ctx.strokeRect(cx, cy, cw, ch);
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(cx - 4, cy - 4, 8, 8);
      ctx.fillRect(cx + cw - 4, cy - 4, 8, 8);
      ctx.fillRect(cx - 4, cy + ch - 4, 8, 8);
      ctx.fillRect(cx + cw - 4, cy + ch - 4, 8, 8);
    };
    image.src = editorImageSrc;
  }, [editorImageSrc, zoom, rotate, straighten, cropBox]);
  if (!employee) {
    return (
      <div style={{ padding: '48px', textAlign: 'center' }}>
        <AlertTriangle
          size={48}
          color="#dc2626"
          style={{
            display: 'inline-block',
            marginBottom: '16px'
          }}
        />
        <h2>Employee Record Not Found</h2>
        <p
          style={{
            color: 'var(--text-gray)',
            marginTop: '8px'
          }}
        >
          Employee ID: {id}
        </p>

        <button
          className="btn btn-primary"
          onClick={() => navigate('/hr/employees')}
          style={{ marginTop: '16px' }}
        >
          Back to Employee List
        </button>
      </div>
    );
  }
  const getEditorQuality = () => {
    if (!editorFilesize) return 'Medium';
    const mb = parseFloat(editorFilesize.replace('MB', ''));
    if (mb < 0.3) return 'Low';
    if (mb > 1.2) return 'High';
    return 'Medium';
  };

  const handleSaveCroppedDocument = () => {
    console.log("editorImageSrc =", editorImageSrc);
    const quality = getEditorQuality();
    const now = new Date().toISOString();

    const updatedDocs = employee.documents.map(d => {
      if (d.type === activeUploadType) {
        return {
          ...d,
          status: 'Uploaded',
          name: `reuploaded_${editorFilename}`,
          quality: quality,
          size: editorFilesize,
          thumbnail: editorImageSrc,
          isPdf: false,
          file: currentFile
        };
      }
      return d;
    });

    // If candidate overall verification status was rejected, and HR re-uploads, we can automatically transition status back to 'submitted' or log it
    let newStatus = employee.status;
    let autoLog = '';
    if (employee.status === 'rejected') {
      newStatus = 'submitted';
      autoLog = ' (Status automatically reverted to Submitted)';
    }

    const updatedEmployee = {
      ...employee,
      status: newStatus,
      documents: updatedDocs,
      timeline: [
        ...(employee.timeline || []),
        {
          event: 'Document Uploaded',
          user: 'Client HR',
          date: now,
          details: `${activeUploadType} Re-uploaded${autoLog}`
        }
      ],
      audit: [
        ...(employee.audit || []),
        {
          user: 'Client HR',
          action: `Re-uploaded ${activeUploadType}${autoLog}`,
          date: now
        }
      ]
    };

    updateSupabaseEmployee(employee.id, updatedEmployee);
    loadEmployeeData();

    // Clear editor modal
    setEditorImageSrc(null);
    setActiveUploadType(null);
    alert(`${activeUploadType} re-uploaded and saved successfully!`);
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.5s ease-out' }}>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .section-title {
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--text-gray);
          margin-bottom: 16px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .badge-draft { background-color: #f1f5f9; color: #475569; }
        .reupload-warning-box {
          border: 1px solid #fca5a5;
          background-color: #fee2e2;
          color: #991b1b;
          border-radius: 8px;
          padding: 12px 16px;
          font-size: 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-top: 8px;
        }
        @media print {
          body { background-color: #fff; color: #000; }
          .sidebar, .top-header, .btn, .no-print, .notes-composer {
            display: none !important;
          }
          .main-wrapper, .main-content, .employee-list-container {
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
          }
          .card { border: 1px solid #000 !important; box-shadow: none !important; margin-bottom: 12px !important; }
          .print-certificate-header {
            display: block !important;
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 16px;
            margin-bottom: 24px;
          }
        }
        .print-certificate-header {
          display: none;
        }
      `}</style>

      {/* Hidden file input for reupload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {/* Printable Report Header */}
      <div className="print-certificate-header">
        <h1 style={{ fontSize: '28px', color: '#1e3a8a' }}>KPC BACKGROUND VERIFICATION REPORT</h1>
        <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>CONFIDENTIAL AUDIT CERTIFICATE • GENERATED ON {new Date().toLocaleDateString()}</p>
      </div>

      {/* Header Panel */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button className="btn btn-outline" onClick={() => navigate('/hr/employees')} style={{ backgroundColor: '#fff' }}>
          <ArrowLeft size={16} style={{ marginRight: '8px' }} /> Back to Employee List
        </button>
        <div style={{ display: 'flex', gap: '12px' }}>
          {/* 8. Download Verification Report (PDF download trigger) */}
          <button className="btn btn-primary" onClick={() => window.print()} style={{ backgroundColor: 'var(--primary-blue)' }}>
            <Download size={16} style={{ marginRight: '8px' }} /> Download PDF Report
          </button>
        </div>
      </div>

      {/* Main Grid: Left Side (7 cols) - Profile, Docs, Notes. Right Side (5 cols) - Status, Services, Timeline, Audit */}
      <div style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: '24px', alignItems: 'start' }}>

        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* 1. Employee Profile Summary */}
          <div className="card" style={{ padding: '24px', backgroundColor: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-dark)' }}>{employee.name}</h2>
                <div style={{ fontSize: '13px', color: 'var(--text-gray)', marginTop: '4px' }}>
                  ID: <strong>{employee.id}</strong> • Priority:{' '}
                  <strong style={{ color: employee.priority === 'Urgent' ? '#dc2626' : employee.priority === 'High' ? '#ea580c' : 'inherit' }}>{employee.priority}</strong>
                </div>
              </div>
              <span className={`badge ${getStatusClass(employee.status)}`} style={{ padding: '6px 14px', fontSize: '12px' }}>
                {getStatusLabel(employee.status)}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '24px', fontSize: '14px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
              <div><span style={{ color: 'var(--text-gray)' }}>Date of Birth:</span> <strong>{employee.dob}</strong></div>
              <div><span style={{ color: 'var(--text-gray)' }}>Mobile:</span> <strong>{employee.contactNumber}</strong></div>
              <div><span style={{ color: 'var(--text-gray)' }}>Alternate Contact:</span> {employee.alternateContactNumber || 'N/A'}</div>
              <div><span style={{ color: 'var(--text-gray)' }}>SLA Aging Status:</span> <span style={{ fontWeight: 600 }}>{employee.slaStatus || 'SLA safe'}</span></div>
              <div><span style={{ color: 'var(--text-gray)' }}>Father's Details:</span> <strong>{employee.fatherName || 'N/A'}</strong> {employee.fatherDob}</div>
              <div><span style={{ color: 'var(--text-gray)' }}>Mother's Details:</span> <strong>{employee.motherName || 'N/A'}</strong> {employee.motherDob}</div>
            </div>
          </div>

          {/* 4. Uploaded Documents & Validation Status */}
          <div className="card" style={{ padding: '24px', backgroundColor: '#fff' }}>
            <h3 className="section-title"><FileText size={16} /> Uploaded Documents & Validation</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {employee.documents && employee.documents.map((doc, idx) => {
                const isRejected = doc.status === 'Rejected' || doc.status === 'Re-upload Required';
                let tagColor = '#10b981'; // green
                let tagBg = '#dcfce7';

                if (doc.status === 'Rejected') { tagColor = '#dc2626'; tagBg = '#fee2e2'; }
                else if (doc.status === 'Re-upload Required') { tagColor = '#d97706'; tagBg = '#fef3c7'; }

                return (
                  <div key={idx} style={{ padding: '16px', border: `1px solid ${isRejected ? '#fca5a5' : 'var(--border-color)'}`, borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: isRejected ? '#fffdfd' : 'transparent' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}>
                          {doc.isPdf ? (
                            <FileText size={20} color="var(--text-gray)" />
                          ) : (
                            <img
                              src={doc.file_url}
                              alt={doc.type}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                              }}
                              onError={(e) => {
                                console.log("IMAGE FAILED:", doc);
                              }}
                            />
                          )}
                          <a
                            href={doc.file_url}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-outline"
                            style={{
                              marginTop: '8px',
                              fontSize: '12px'
                            }}
                          >
                            View Document
                          </a>
                        </div>

                        <div>
                          <strong style={{ fontSize: '14px', color: 'var(--text-dark)' }}>{doc.type}</strong>
                          <div style={{ fontSize: '11px', color: 'var(--text-gray)', marginTop: '2px' }}>{doc.name} ({doc.size}) • Quality: <strong>{doc.quality}</strong></div>
                        </div>
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', color: tagColor, backgroundColor: tagBg }}>
                        {doc.status}
                      </span>
                    </div>

                    {/* 10. Re-upload warning and button actions */}
                    {isRejected && (
                      <div className="reupload-warning-box no-print">
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <AlertTriangle size={16} />
                          <span>This proof was flagged. Please click re-upload to correct the file.</span>
                        </div>
                        <button
                          className="btn btn-outline"
                          onClick={() => handleReuploadClick(doc.type)}
                          style={{ padding: '4px 10px', fontSize: '12px', backgroundColor: '#fff', color: '#b91c1c', borderColor: '#fca5a5' }}
                        >
                          <RefreshCw size={12} style={{ marginRight: '6px' }} /> Re-upload File
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {(!employee.documents || employee.documents.length === 0) && (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-gray)', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
                  No documents attached to this record.
                </div>
              )}
            </div>
          </div>

          {/* 11. HR Internal Notes */}
          <div className="card" style={{ padding: '24px', backgroundColor: '#fff' }}>
            <h3 className="section-title"><MessageSquare size={16} /> HR Internal Notes</h3>

            {/* Notes Composer (Form) */}
            <form onSubmit={handleAddNote} className="no-print" style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Type internal remarks or instructions for audit trail..."
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px', resize: 'vertical', minHeight: '44px' }}
              />
              <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-end', height: '40px' }}>
                <Send size={15} />
              </button>
            </form>

            {/* Notes Feed */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {notesList.length === 0 ? (
                <div style={{ fontSize: '13px', color: 'var(--text-gray)', fontStyle: 'italic', padding: '8px' }}>No internal notes saved.</div>
              ) : (
                notesList.map((note, idx) => (
                  <div key={idx} style={{ padding: '12px', backgroundColor: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '13px', lineHeight: 1.5 }}>
                    {note}
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* 2. Verification Status Card */}
          <div className="card" style={{ padding: '24px', backgroundColor: '#fff', borderLeft: '4px solid var(--primary-blue)' }}>
            <h3 className="section-title"><CheckCircle2 size={16} color="var(--primary-blue)" /> Verification Status</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-gray)' }}>Overall Status</span>
                <span className={`badge ${getStatusClass(employee.status)}`} style={{ padding: '4px 12px' }}>{getStatusLabel(employee.status)}</span>
              </div>
              {employee.status === "rejected" && (
                <div
                  style={{
                    marginTop: "16px",
                    padding: "12px",
                    border: "1px solid #fecaca",
                    borderRadius: "8px",
                    background: "#fef2f2"
                  }}
                >
                  <p>
                    <strong>Rejected By:</strong> {employee.rejected_by}
                  </p>

                  <p>
                    <strong>Reason:</strong> {employee.rejection_reason}
                  </p>

                  <p>
                    <strong>Rejected On:</strong>{" "}
                    {employee.rejected_at
                      ? new Date(employee.rejected_at).toLocaleString()
                      : "-"}
                  </p>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-gray)' }}>Assigned Executive</span>
                <span style={{ fontWeight: 600, color: 'var(--text-dark)' }}>{employee.assigned || 'Unassigned (Ops Queue)'}</span>
              </div>
            </div>
          </div>

          {/* 3. Services Requested */}
          <div className="card" style={{ padding: '24px', backgroundColor: '#fff' }}>
            <h3 className="section-title"><Sparkles size={16} /> Services Requested</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {employee.services ? employee.services.map((svc, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: 'var(--primary-blue-light)', borderRadius: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--primary-blue)' }}>
                  <span>{svc}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-gray)', fontWeight: 500 }}>Active check</span>
                </div>
              )) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: 'var(--primary-blue-light)', borderRadius: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--primary-blue)' }}>
                  <span>Identity Verification</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-gray)', fontWeight: 500 }}>Default check</span>
                </div>
              )}
            </div>
          </div>

          {/* 5. Executive Remarks */}
          {employee.notes && (
            <div className="card" style={{ padding: '24px', backgroundColor: '#fff7ed', borderLeft: '4px solid #f97316' }}>
              <h3 className="section-title" style={{ color: '#c2410c' }}><MessageSquare size={16} /> Executive Remarks</h3>
              <p style={{ fontSize: '13px', color: '#7c2d12', fontStyle: 'italic', marginTop: '8px', lineHeight: 1.5 }}>
                "{employee.notes.split('\n\n')[0]}"
              </p>
            </div>
          )}

          {/* 6. Activity Timeline */}
          {/* <div className="card" style={{ padding: '24px', backgroundColor: '#fff' }}>
            <h3 className="section-title"><History size={16} /> Activity Timeline</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', paddingLeft: '20px', marginTop: '12px' }}>

              <div style={{ position: 'absolute', left: '6px', top: '8px', bottom: '8px', width: '2px', backgroundColor: '#e2e8f0' }}></div>

              {employee.timeline && employee.timeline.map((evt, idx) => (
                <div key={idx} style={{ position: 'relative' }}>
                  <div style={{
                    position: 'absolute',
                    left: '-20px',
                    top: '4px',
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: idx === employee.timeline.length - 1 ? 'var(--primary-blue)' : '#cbd5e1',
                    border: '2px solid #fff',
                    boxShadow: '0 0 0 2px ' + (idx === employee.timeline.length - 1 ? 'var(--primary-blue-light)' : '#e2e8f0')
                  }}></div>
                  <div style={{ fontSize: '13px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-dark)' }}>{evt.event}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-gray)', marginTop: '2px' }}>{new Date(evt.date).toLocaleString()} • by {evt.user}</div>
                    {evt.details && (
                      <div style={{ fontSize: '11px', color: 'var(--primary-blue)', marginTop: '4px' }}>{evt.details}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div> */}

          {/* 7. Audit Trail */}
          {/* <div className="card" style={{ padding: '24px', backgroundColor: '#fff' }}>
            <h3 className="section-title"><History size={16} /> Audit Log</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
              {employee.audit && employee.audit.map((entry, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: idx !== employee.audit.length - 1 ? '1px solid var(--border-color)' : 'none', paddingBottom: idx !== employee.audit.length - 1 ? '10px' : 0, fontSize: '12px' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-dark)' }}>{entry.action}</div>
                    <div style={{ color: 'var(--text-gray)', marginTop: '2px' }}>By {entry.user}</div>
                  </div>
                  <span style={{ color: 'var(--text-gray)' }}>{new Date(entry.date).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div> */}

        </div>

      </div>

      {/* Editor Modal for Re-uploaded document */}
      {editorImageSrc && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card editor-modal" style={{ width: '850px', backgroundColor: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column' }}>

            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Adjust Re-uploaded Document</h3>
                <p style={{ color: 'var(--text-gray)', fontSize: '12px', marginTop: '2px' }}>Optimize crop boundary, rotation, and fine alignment before confirming.</p>
              </div>
              <button onClick={() => setEditorImageSrc(null)} style={{ padding: '8px' }}><X size={20} /></button>
            </div>

            <div style={{ display: 'flex', flex: 1 }}>

              <div style={{ flex: 1, backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', borderRight: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <div style={{ border: '2px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#fff' }}>
                    <canvas ref={canvasRef} style={{ display: 'block', maxWidth: '100%' }} />
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-gray)', fontStyle: 'italic' }}>Simulated Crop viewport</span>
                </div>
              </div>

              <div style={{ width: '320px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                <div>
                  <h4 style={{ fontSize: '12px', color: 'var(--text-gray)', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 700 }}>File Details</h4>
                  <div style={{ fontSize: '13px', color: 'var(--text-dark)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div><strong>Filename:</strong> {editorFilename}</div>
                    <div><strong>Size:</strong> {editorFilesize}</div>
                    <div><strong>Clarity:</strong> <strong>{getEditorQuality()}</strong></div>
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: '12px', color: 'var(--text-gray)', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 700 }}>Zoom Viewport ({zoom}x)</h4>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.1"
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--primary-blue)' }}
                  />
                </div>

                <div>
                  <h4 style={{ fontSize: '12px', color: 'var(--text-gray)', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 700 }}>Rotate</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <button className="btn btn-outline" onClick={() => setRotate(prev => (prev - 90 + 360) % 360)} style={{ fontSize: '12px', padding: '8px', backgroundColor: '#fff' }}>
                      <RotateCcw size={14} style={{ marginRight: '6px' }} /> Counter
                    </button>
                    <button className="btn btn-outline" onClick={() => setRotate(prev => (prev + 90) % 360)} style={{ fontSize: '12px', padding: '8px', backgroundColor: '#fff' }}>
                      <RotateCw size={14} style={{ marginRight: '6px' }} /> Clockwise
                    </button>
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: '12px', color: 'var(--text-gray)', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 700 }}>Fine Align ({straighten}°)</h4>
                  <input
                    type="range"
                    min="-45"
                    max="45"
                    step="1"
                    value={straighten}
                    onChange={(e) => setStraighten(parseInt(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--primary-blue)' }}
                  />
                </div>

              </div>

            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifySelf: 'flex-end', gap: '12px', backgroundColor: '#f8fafc' }}>
              <button className="btn btn-outline" onClick={() => setEditorImageSrc(null)} style={{ backgroundColor: '#fff' }}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveCroppedDocument}>
                Confirm & Re-upload Proof
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
export default EmployeeDetails;
