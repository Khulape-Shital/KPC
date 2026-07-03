import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, User, Building2, Phone, Briefcase,
  Clock, CheckCircle2, AlertTriangle, PlaySquare
} from 'lucide-react';
import {
  supabase,
  getSupabaseEmployeeById,
  updateSupabaseEmployee
} from '../../utils/supabase';

import { DocumentReviewPanel } from './workspace/DocumentReviewPanel';
import { CallVerificationPanel } from './workspace/CallVerificationPanel';
import { CompletionChecklist } from './workspace/CompletionChecklist';
import { ActivityTimeline } from './workspace/ActivityTimeline';

export const VerificationWorkspace = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);

  // Checklist State tracking — simplified to documents + call
  const [checklist, setChecklist] = useState({
    documentsReviewed: false,
    callLogged: false
  });

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  // const [workflowStep, setWorkflowStep] = useState(employee?.status || "in-progress");


  const session = JSON.parse(localStorage.getItem("kpc_session")) || {};
  const EXEC_NAME = session.userName || 'Amitabh S.';

  useEffect(() => {
    const loadData = async () => {
      const emp = await getSupabaseEmployeeById(id);
      if (emp) {
        setEmployee(emp);

        // Auto-compute checklist from timeline
        const t = emp.timeline || [];
        setChecklist(prev => ({
          ...prev,
          callLogged: t.some(evt => evt.event?.startsWith('Call ')),
          documentsReviewed: (emp.documents || []).length > 0
        }));
      } else {
        navigate('/exec/tasks/mine'); // Redirect if invalid
      }
    };
    loadData();
  }, [id, navigate]);

  if (!employee) return <div style={{ padding: '24px' }}>Loading workspace...</div>;

  const handleUpdate = async (updatePayload) => {

    if (updatePayload.type === "call-log") {

      await supabase
        .from("verification_logs")
        .insert({
          case_id: employee.id,
          updated_by: session.userId,
          status: updatePayload.eventLabel,
          remarks: updatePayload.remarks
        });

      setChecklist(prev => ({
        ...prev,
        callLogged: true
      }));
    }

    let newStatus = employee.status;

    if (newStatus === "assigned") {
      newStatus = "in-progress";
    }

    const result = await updateSupabaseEmployee(employee.id, {
      status: newStatus
    });

    if (result) {
      setEmployee(result);
    }
  };

  const updateWorkflowStatus = async (status) => {

    const { error } = await supabase
      .from("verification_logs")
      .insert({
        case_id: employee.id,
        updated_by: session.userId,
        status,
        remarks: status
      });

    if (error) {
      console.error(error);
    }

    const result = await updateSupabaseEmployee(employee.id, {
      status
    });
    console.log(result);

    if (result) {
      setEmployee(result);
    }
  };


  const confirmStatusChange = (status) => {
    setPendingStatus(status);
    setShowStatusModal(true);
  };

  const handleCompleteVerification = async () => {
    // Validation
    const allChecked = Object.values(checklist).every(Boolean);
    if (!allChecked) {
      alert("Please complete all verification steps before submitting.");
      setShowConfirmModal(false);
      return;
    }


    const { error } = await supabase
      .from("verification_logs")
      .insert({
        case_id: employee.id,
        updated_by: session.userId,
        status: "Verification Completed",
        remarks: "All checks cleared and submitted."
      });

    if (error) {
      console.error(error);
    }

    const currentTimeline = employee.timeline || [];
    currentTimeline.push({
      event: 'Verification Completed',
      user: EXEC_NAME,
      date: new Date().toISOString(),
      details: 'All checks cleared and submitted.'
    });

    const currentAudit = employee.audit || [];
    currentAudit.push({
      user: EXEC_NAME,
      action: 'Completed Verification',
      date: new Date().toISOString()
    });

    const result = await updateSupabaseEmployee(employee.id, {
      status: "completed",
      verification_status: "completed",
      completed_at: new Date().toISOString(),
      timeline: currentTimeline,
      audit: currentAudit
    });

    if (result) {
      setEmployee(result);
    }

    setShowConfirmModal(false);

    // Redirect after short delay
    setTimeout(() => {
      navigate('/exec/tasks/mine');
    }, 1500);
  };


  const handleRejectVerification = async () => {
    if (!rejectReason.trim()) {
      alert("Please enter rejection reason.");
      return;
    }


    const { error } = await supabase
      .from("verification_logs")
      .insert({
        case_id: employee.id,
        updated_by: session.userId,
        status: "Rejected",
        remarks: rejectReason
      });

    if (error) {
      console.error(error);
    }

    const currentTimeline = employee.timeline || [];
    currentTimeline.push({
      event: 'Verification Rejected',
      user: EXEC_NAME,
      date: new Date().toISOString(),
      details: rejectReason
    });

    const currentAudit = employee.audit || [];
    currentAudit.push({
      user: EXEC_NAME,
      action: 'Rejected Verification',
      date: new Date().toISOString()
    });

    const result = await updateSupabaseEmployee(employee.id, {
      status: "rejected",
      verification_status: "rejected",
      rejection_reason: rejectReason,
      rejected_by: EXEC_NAME,
      rejected_at: new Date().toISOString(),
      timeline: currentTimeline,
      audit: currentAudit
    });

    if (result) {
      setEmployee(result);
      alert("Employee rejected successfully.");

      setTimeout(() => {
        navigate("/exec/tasks/mine");
      }, 1000);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Urgent': return '#ef4444';
      case 'High': return '#f97316';
      case 'Medium': return '#3b82f6';
      case 'Low': return '#64748b';
      default: return '#64748b';
    }
  };

  const isCompleted = employee.status === 'completed' || employee.status === 'approved' || employee.status === 'rejected';

  return (
    <div className="page-container" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.5s ease-out', position: 'relative' }}>

      {/* Header Area */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button className="btn btn-outline" onClick={() => navigate(-1)} style={{ padding: '8px', display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={16} />
        </button>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-dark)' }}>{employee.name}</h1>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#3b82f6', backgroundColor: '#eff6ff', padding: '4px 8px', borderRadius: '4px' }}>{employee.employeeCode}</span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: getPriorityColor(employee.priority), backgroundColor: `${getPriorityColor(employee.priority)}15`, padding: '4px 8px', borderRadius: '4px' }}>
              {employee.priority} Priority
            </span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-gray)', marginTop: '4px' }}>
            Verification Workspace • Assigned {new Date(employee.assigned_at
              ? new Date(employee.assigned_at).toLocaleDateString()
              : "N/A"?.date || Date.now()).toLocaleDateString()}
          </p>
        </div>
      </div>

      {isCompleted && (
        <div style={{ padding: '16px', backgroundColor: '#ecfdf5', border: '1px solid #10b981', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', color: '#065f46', fontWeight: 600 }}>
          <CheckCircle2 size={20} /> This verification is {employee.status}. The workspace is now read-only.
        </div>
      )}

      {/* Split Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '7fr 4fr', gap: '24px', alignItems: 'start' }}>

        {/* LEFT COLUMN - Primary Workspace */}
        <div style={{ display: 'flex', flexDirection: 'column', pointerEvents: isCompleted ? 'none' : 'auto', opacity: isCompleted ? 0.7 : 1 }}>

          {/* SECTION 1 — Candidate Summary */}
          <div className="card" style={{ padding: '20px', backgroundColor: '#fff', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={18} color="var(--primary-blue)" /> Candidate Information
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <Building2 size={16} color="var(--text-gray)" style={{ marginTop: '2px' }} />
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-gray)' }}>Company</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-dark)' }}>{employee.company || 'N/A'}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <Briefcase size={16} color="var(--text-gray)" style={{ marginTop: '2px' }} />
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-gray)' }}>Service Package</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-dark)' }}>{employee.services?.length
                    ? employee.services.join(", ")
                    : "No Service"}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <Phone size={16} color="var(--text-gray)" style={{ marginTop: '2px' }} />
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-gray)' }}>Contact Numbers</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-dark)' }}>{employee.contactNumber}</div>
                  {employee.alternateContactNumber && <div style={{ fontSize: '12px', color: 'var(--text-gray)' }}>Alt: {employee.alternateContactNumber}</div>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <User size={16} color="var(--text-gray)" style={{ marginTop: '2px' }} />
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-gray)' }}>Parents</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-dark)' }}>Father: {employee.fatherName || 'N/A'}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-dark)' }}>Mother: {employee.motherName || 'N/A'}</div>
                </div>
              </div>
            </div>
          </div>

          <DocumentReviewPanel documents={employee.documents} />

          <CallVerificationPanel employee={employee} onUpdate={handleUpdate} />

        </div>

        {/* RIGHT COLUMN - Context Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'sticky', top: '24px' }}>

          {/* SECTION 10 — SLA Panel */}
          <div className="card" style={{ padding: '20px', backgroundColor: '#fff' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} color="var(--primary-blue)" /> SLA & Status
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-gray)' }}>Current Status</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-dark)' }}>{(employee.status || "assigned")
                  .replace("-", " ")
                  .toUpperCase()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-gray)' }}>SLA Target</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-dark)' }}>{employee.slaStatus || '7 Days'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-gray)' }}>Days Active</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-dark)' }}>{
                  employee.assigned_at
                    ?
                    Math.floor(
                      (
                        Date.now() -
                        new Date(employee.assigned_at)
                      )
                      /
                      86400000
                    )
                    + " Days"
                    :
                    "N/A"
                }</span>
              </div>
            </div>
          </div>

          <CompletionChecklist employee={employee} checklistState={checklist} />

          {/* Action Button */}
          {!isCompleted && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "10px"
              }}
            >

              <div style={{ position: "relative" }}>

                <button
                  className="btn"
                  style={{
                    background: "#ef4444",
                    color: "#fff"
                  }}
                  onClick={() => setShowRejectModal(!showRejectModal)}
                >
                  Reject Application
                </button>

                {showRejectModal && (

                  <div
                    style={{
                      position: "absolute",
                      top: "110%",
                      left: 0,
                      width: "330px",
                      background: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "12px",
                      padding: "16px",
                      boxShadow: "0 10px 25px rgba(0,0,0,.15)",
                      zIndex: 999
                    }}
                  >

                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: "14px",
                        marginBottom: "10px"
                      }}
                    >
                      Rejection Reason
                    </div>

                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Type rejection reason..."
                      style={{
                        width: "100%",
                        height: "90px",
                        resize: "none",
                        padding: "10px",
                        borderRadius: "8px",
                        border: "1px solid #d1d5db",
                        outline: "none",
                        fontSize: "13px",
                        boxSizing: "border-box"
                      }}
                    />

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: "10px",
                        marginTop: "14px"
                      }}
                    >
                      <button
                        className="btn btn-outline"
                        onClick={() => {
                          setShowRejectModal(false);
                          setRejectReason("");
                        }}
                      >
                        Cancel
                      </button>

                      <button
                        className="btn"
                        style={{
                          background: "#ef4444",
                          color: "#fff"
                        }}
                        onClick={async () => {
                          await handleRejectVerification();
                          setShowRejectModal(false);
                        }}
                      >
                        Reject
                      </button>
                    </div>

                  </div>

                )}

              </div>

              {employee.status === "in-progress" && (
                <button
                  className="btn btn-primary"
                  onClick={() => confirmStatusChange("cfc-verification")}
                >
                  CFC Verification
                </button>
              )}

              {employee.status === "cfc-verification" && (
                <button
                  className="btn btn-primary"
                  onClick={() => confirmStatusChange("final-client-invoice")}
                >
                  Final Client Invoice
                </button>
              )}

              {employee.status === "final-client-invoice" && (
                <button
                  className="btn btn-primary"
                  onClick={() => confirmStatusChange("complete-report-submission")}
                >
                  Complete Report Submission
                </button>
              )}

              {employee.status === "complete-report-submission" && (
                <button
                  className="btn btn-primary"
                  onClick={() => setShowConfirmModal(true)}
                >
                  Mark Verification Complete
                </button>
              )}

            </div>
          )}

          <ActivityTimeline employee={employee} />

        </div>
      </div>

      {showStatusModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 300
          }}
        >
          <div
            className="card"
            style={{
              width: "100%",
              maxWidth: "480px",
              background: "#fff",
              padding: "28px",
              borderRadius: "12px"
            }}
          >
            <h2
              style={{
                fontSize: "20px",
                fontWeight: 700,
                marginBottom: "12px"
              }}
            >
              Change Workflow Status?
            </h2>

            <p
              style={{
                fontSize: "14px",
                color: "#64748b",
                lineHeight: 1.6
              }}
            >
              Are you sure you want to change the application status from
              <br />

              <strong>
                {(employee.status || "")
                  .replace(/-/g, " ")
                  .toUpperCase()}
              </strong>

              {" "}to{" "}

              <strong>
                {(pendingStatus || "")
                  .replace(/-/g, " ")
                  .toUpperCase()}
              </strong>

              ?
            </p>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "12px",
                marginTop: "24px"
              }}
            >
              <button
                className="btn btn-outline"
                onClick={() => {
                  setShowStatusModal(false);
                  setPendingStatus(null);
                }}
              >
                No
              </button>

              <button
                className="btn btn-primary"
                onClick={async () => {
                  await updateWorkflowStatus(pendingStatus);

                  setShowStatusModal(false);
                  setPendingStatus(null);
                }}
              >
                Yes, Change Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Completion Confirmation Modal */}
      {showConfirmModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ width: '100%', maxWidth: '450px', backgroundColor: '#fff', padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.2s ease-out' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
              <PlaySquare size={28} color="#10b981" />
            </div>
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '8px' }}>Complete Verification?</h2>
              <p style={{ fontSize: '14px', color: 'var(--text-gray)', lineHeight: '1.5' }}>
                You are about to mark <strong>{employee.name}</strong> as completed. This action will finalize the report and lock the workspace. You will not be able to make further edits.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button className="btn btn-outline" onClick={() => setShowConfirmModal(false)} style={{ flex: 1 }}>Review Again</button>
              <button className="btn btn-primary" onClick={handleCompleteVerification} style={{ flex: 1, backgroundColor: '#10b981', display: 'flex', justifyContent: 'center', gap: '6px' }}>
                <CheckCircle2 size={16} /> Finalize & Submit
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
