//hr/CreateEmployee.jsx

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  User, FileText, CheckCircle2, ArrowRight, ArrowLeft,
  UploadCloud, RotateCw, RotateCcw, Trash2, Save,
  Send, Crop, Sparkles, X, AlertTriangle, FileCheck, Check,
  AlertCircle, ShieldCheck, RefreshCw, Calendar, ListTodo, Plus
} from 'lucide-react';
import { mockDb } from '../../utils/mockDb';
import { supabase } from "../../utils/supabase";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import PageHeader from '../../components/common/PageHeader';

// const ALL_SERVICES = [
//   { id: 'Identity Verification', name: 'Identity Verification', desc: 'Validates Aadhaar Card and PAN Card details.' },
//   { id: 'Address Verification', name: 'Address Verification', desc: 'Validates physical address via Light Bill/Rent Agreement.' },
//   { id: 'Police Verification', name: 'Police Verification', desc: 'Verifies local law enforcement and criminal records.' },
//   { id: 'Background Verification', name: 'Background Verification', desc: 'Verifies comprehensive corporate credentials and academic records.' }
// ];

const ALL_DOCUMENTS = [
  { id: 'Aadhaar Card', description: 'National Identity Card' },
  { id: 'PAN Card', description: 'Income Tax Identity Card' },
  { id: 'Light Bill/Rent Agreement', description: 'Physical Utility Bill or Rental Lease' },
  { id: 'Voter ID', description: 'Election Commission Identity Card' },
  { id: 'Birth Certificate', description: 'Official Birth Record' },
  { id: 'School Leaving', description: 'Academic Leaving Certificate' }
];

export const CreateEmployee = () => {
  const kpc_session = JSON.parse(localStorage.getItem("kpc_session"));
  const company = kpc_session?.company;

  const { id } = useParams();
  // console.log("ID:", id);
  const isEditMode = !!id;
  // console.log("Edit Mode:", isEditMode);
  const navigate = useNavigate();
  const location = useLocation();

  // 4-step progress: 1 = Personal Info, 2 = Service Selection, 3 = Document Upload, 4 = Review & Submit
  const [step, setStep] = useState(1);
  const [editEmployeeId, setEditEmployeeId] = useState(null);
  const [clients, setClients] = useState([]);
  const [companyServices, setCompanyServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(true);

  const [companyName, setCompanyName] = useState(
    location.state?.companyName || kpc_session?.company || ''
  );

  useEffect(() => {
    const session = JSON.parse(localStorage.getItem("kpc_session"));

    if (location.state?.companyName) {
      setCompanyName(location.state.companyName);
    } else if (session?.company) {
      setCompanyName(session.company);
    }
  }, [location.state]);

  // Form fields state
  const [form, setForm] = useState({
    name: '',
    dob: '',
    motherName: '',
    motherDob: '',
    fatherName: '',
    fatherDob: '',
    contactNumber: '',
    alternateContactNumber: '',
    priority: 'High'
  });
  useEffect(() => {
    if (isEditMode) {
      const employees = JSON.parse(localStorage.getItem('kpc_employees')) || [];

      const existingEmployee = employees.find(
        emp => String(emp.id) === String(id)
      );

      // console.log("Matched Employee:", existingEmployee);

      if (existingEmployee) {
        // 👉 form data
        setForm(prev => ({
          ...prev,
          ...existingEmployee
        }));

        // 👉 🔥 IMPORTANT: documents set कर
        if (existingEmployee.documents) {
          s(existingEmployee.documents);
        }

        // 👉 services (जर वापरत असशील)
        if (existingEmployee.services) {
          setSelectedServices(existingEmployee.services);
        }

        // 👉 company
        if (existingEmployee.company) {
          setCompanyName(existingEmployee.company);
        }
      }
    }
  }, [id]);
  const [formErrors, setFormErrors] = useState({});

  // Selected services state
  const [selectedServices, setSelectedServices] =
    useState([
      'Identity Verification',
      'Background Verification'
    ]);

  // Documents state
  const [uploadedDocs, setUploadedDocs] = useState([]);

  // Duplicate check
  const [duplicateCheckPassed, setDuplicateCheckPassed] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(null);

  // Submission success screen details
  const [submittedEmployee, setSubmittedEmployee] = useState(null);

  // Image Editor Modal state
  const [activeUploadType, setActiveUploadType] = useState(null);
  const [editorImageSrc, setEditorImageSrc] = useState(null);
  const [editorFilename, setEditorFilename] = useState('');
  const [editorFilesize, setEditorFilesize] = useState('');
  const [editorFiletype, setEditorFiletype] = useState('');

  // Image manipulation slider states
  const [zoom, setZoom] = useState(1);
  const [rotate, setRotate] = useState(0);
  const [straighten, setStraighten] = useState(0);
  const [cropBox, setCropBox] = useState({ x: 10, y: 10, w: 80, h: 80 });

  // Dragging states
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialCrop, setInitialCrop] = useState(null);

  // Ref elements
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      mockDb.init();

      // Load clients
      setClients(mockDb.getClients());

      // Fetch company services
      const session = JSON.parse(localStorage.getItem("kpc_session"));

      try {
        if (session?.clientId) {
          const { data: svcData, error: svcError } = await supabase
            .from("company_services")
            .select("*")
            .eq("company_id", session.clientId);
          console.log("Session: " + session);

          if (!svcError && svcData) {
            setCompanyServices(svcData);

            if (svcData.length === 1) {
              setSelectedServices([svcData[0].service_name]);
            } else {
              setSelectedServices([]);
            }
          } else if (svcError) {
            console.error("Service fetch error:", svcError);
          }
        } else {
          console.warn("No clientId found in kpc_session — cannot fetch company services.");
        }
      } catch (err) {
        console.error("Unexpected error loading services:", err);
      } finally {
        setServicesLoading(false);
      }

      // Resume employee
      if (location.state?.resumeEmployeeId) {
        const emp = mockDb.getEmployeeById(location.state.resumeEmployeeId);

        if (emp) {
          setEditEmployeeId(emp.id);

          setForm({
            name: emp.name || "",
            dob: emp.dob || "",
            motherName: emp.motherName || "",
            motherDob: emp.motherDob || "",
            fatherName: emp.fatherName || "",
            fatherDob: emp.fatherDob || "",
            contactNumber: emp.contactNumber || "",
            alternateContactNumber: emp.alternateContactNumber || "",
            priority: emp.priority || "High",
          });

          if (emp.documents) {
            setUploadedDocs(emp.documents);
          }

          if (emp.services) {
            setSelectedServices(emp.services);
          }

          if (emp.company) {
            setCompanyName(emp.company);
          }
        }
      }
    };
    init();
  }, [location.state]);


  // Handle Form changes
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
    setDuplicateCheckPassed(false);
    setDuplicateWarning(null);
  };

  // Form validations
  const validateForm = (updateState = true) => {
    const errors = {};
    const contactRegex = /^[0-9]{10}$/;

    if (!form.name.trim()) errors.name = 'Full legal name is required.';
    if (!form.dob) errors.dob = 'Date of birth is required.';
    if (!form.motherName.trim()) errors.motherName = "Mother's name is required.";
    if (!form.motherDob) errors.motherDob = "Mother's DOB is required.";
    if (!form.fatherName.trim()) errors.fatherName = "Father's name is required.";
    if (!form.fatherDob) errors.fatherDob = "Father's DOB is required.";

    if (!form.contactNumber) {
      errors.contactNumber = 'Contact number is required.';
    } else if (!contactRegex.test(form.contactNumber)) {
      errors.contactNumber = 'Contact number must be exactly 10 digits.';
    }

    if (form.alternateContactNumber && !contactRegex.test(form.alternateContactNumber)) {
      errors.alternateContactNumber = 'Alternate contact must be exactly 10 digits.';
    }

    // if (!company) {
    //   errors.company = 'Client company is required.';
    // }

    if (updateState) {
      setFormErrors(errors);
    }
    // console.log("VALIDATION ERRORS:", errors);
    return Object.keys(errors).length === 0;
  };

  // 1. Service Selection & Document Mapping Logic
  // const toggleService = (svcId) => {
  //   if (selectedServices.includes(svcId)) {
  //     if (selectedServices.length > 1) {
  //       setSelectedServices(prev => prev.filter(s => s !== svcId));
  //     } else {
  //       alert('At least one verification service must be selected.');
  //     }
  //   } else {
  //     setSelectedServices(prev => [...prev, svcId]);
  //   }
  // };

  const getRequiredDocTypes = () => {
    const req = new Set();
    if (selectedServices.includes('Identity Verification')) {
      req.add('Aadhaar Card');
      req.add('PAN Card');
    }
    // if (selectedServices.includes('Address Verification')) {
    //   req.add('Light Bill/Rent Agreement');
    // }
    if (selectedServices.includes('Police Verification')) {
      req.add('Aadhaar Card');
      req.add('PAN Card');
    }
    if (selectedServices.includes('Background Verification')) {
      req.add('Aadhaar Card');
      req.add('PAN Card');
      req.add('School Leaving');
    }
    if (req.size === 0) {
      req.add('Aadhaar Card');
      req.add('PAN Card');
    }
    return Array.from(req);
  };

  const requiredDocTypes = getRequiredDocTypes();

  const getDocRequirementStatus = () => {
    const req = requiredDocTypes;
    const uploaded = uploadedDocs.map(d => d.type);
    const countUploadedReq = req.filter(r => uploaded.includes(r)).length;
    return {
      uploaded: countUploadedReq,
      total: req.length,
      text: `${countUploadedReq} of ${req.length} Required Documents Uploaded`,
      isComplete: countUploadedReq === req.length
    };
  };

  // 3. Duplicate Employee Detection
  const checkDuplicateEmployee = () => {
    if (duplicateCheckPassed) return true;

    const allEmps = mockDb.getEmployees();
    const cleanName = form.name.trim().toLowerCase();

    const duplicate = allEmps.find(emp => {
      // Don't match self when editing draft
      if (editEmployeeId && emp.id === editEmployeeId) return false;

      const nameMatch = emp.name.trim().toLowerCase() === cleanName && emp.dob === form.dob;
      const contactMatch = emp.contactNumber === form.contactNumber;
      return nameMatch || contactMatch;
    });

    if (duplicate) {
      setDuplicateWarning({
        name: duplicate.name,
        dob: duplicate.dob,
        contact: duplicate.contactNumber,
        id: duplicate.id
      });
      return false;
    }

    setDuplicateCheckPassed(true);
    return true;
  };

  // Navigation Steps handler
  const handleNextStep = () => {
    // console.log("FORM VALID:", validateForm());
    // console.log("COMPANY:", company);
    // console.log("FORM:", form);
    if (step === 1) {
      if (validateForm()) setStep(2);
    } else if (step === 2) {
      if (selectedServices.length === 0) {
        alert('Please select at least one verification service.');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      const docStatus = getDocRequirementStatus();
      if (!docStatus.isComplete) {
        alert(`Mandatory Document Check: Please upload all required documents: ${requiredDocTypes.join(', ')}.`);
        return;
      }
      setStep(4);
    }
  };

  // Upload trigger
  const handleUploadClick = (docType) => {
    setActiveUploadType(docType);
    fileInputRef.current.click();
  };

  // Handle selected file
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

    if (file.type === 'application/pdf') {
      const newDoc = {
        type: activeUploadType,
        status: 'Uploaded',
        name: file.name,
        quality: 'High',
        size: sizeMB,
        isPdf: true,
        file: file
      };
      setUploadedDocs(prev => {
        const filtered = prev.filter(d => d.type !== activeUploadType);
        return [...filtered, newDoc];
      });
      setActiveUploadType(null);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        setEditorImageSrc(event.target.result);

        window.currentUploadedFile = file;
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
    };
    image.src = editorImageSrc;
  }, [editorImageSrc, zoom, rotate, straighten]);

  const getEditorQuality = () => {
    if (!editorFilesize) return 'Medium';
    const mb = parseFloat(editorFilesize.replace('MB', ''));
    if (mb < 0.3) return 'Low (Blurry warning)';
    if (mb > 1.2) return 'High';
    return 'Medium';
  };

  const handleSaveCroppedDocument = () => {
    const quality = getEditorQuality().includes('Low') ? 'Low' : getEditorQuality();
    const newDoc = {
      type: activeUploadType,
      status: 'Uploaded',
      name: `processed_${editorFilename}`,
      quality: quality,
      size: editorFilesize,
      thumbnail: editorImageSrc,
      isPdf: false,
      file: window.currentUploadedFile
    };

    setUploadedDocs(prev => {
      const filtered = prev.filter(d => d.type !== activeUploadType);
      return [...filtered, newDoc];
    });

    setEditorImageSrc(null);
    setActiveUploadType(null);
  };

  const handleDeleteDocument = (docType) => {
    setUploadedDocs(prev => prev.filter(d => d.type !== docType));
  };

  const handlePointerDown = (e, type) => {
    e.preventDefault();
    setIsDragging(true);
    setDragType(type);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialCrop({ ...cropBox });
  };

  useEffect(() => {
    if (!isDragging) return;
    const handlePointerMove = (e) => {
      const dx = ((e.clientX - dragStart.x) / 400) * 100;
      const dy = ((e.clientY - dragStart.y) / 300) * 100;

      let newBox = { ...initialCrop };

      if (dragType === 'move') {
        newBox.x = Math.max(0, Math.min(100 - newBox.w, initialCrop.x + dx));
        newBox.y = Math.max(0, Math.min(100 - newBox.h, initialCrop.y + dy));
      } else {
        if (dragType.includes('n')) {
          newBox.y = Math.min(initialCrop.y + initialCrop.h - 5, Math.max(0, initialCrop.y + dy));
          newBox.h = initialCrop.h + (initialCrop.y - newBox.y);
        }
        if (dragType.includes('s')) {
          newBox.h = Math.max(5, Math.min(100 - initialCrop.y, initialCrop.h + dy));
        }
        if (dragType.includes('w')) {
          newBox.x = Math.min(initialCrop.x + initialCrop.w - 5, Math.max(0, initialCrop.x + dx));
          newBox.w = initialCrop.w + (initialCrop.x - newBox.x);
        }
        if (dragType.includes('e')) {
          newBox.w = Math.max(5, Math.min(100 - initialCrop.x, initialCrop.w + dx));
        }
      }
      setCropBox(newBox);
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      setDragType(null);
    };

    document.addEventListener('mousemove', handlePointerMove);
    document.addEventListener('mouseup', handlePointerUp);
    return () => {
      document.removeEventListener('mousemove', handlePointerMove);
      document.removeEventListener('mouseup', handlePointerUp);
    };
  }, [isDragging, dragType, dragStart, initialCrop]);

  // 4. Submission Readiness calculations
  const isPersonalComplete = validateForm(false);
  const isServicesSelected = selectedServices.length > 0;
  const docStatusObj = getDocRequirementStatus();
  const isDocsComplete = docStatusObj.isComplete;
  const isDuplicateCheckClear = !duplicateWarning || duplicateCheckPassed;

  const isFormFullyReady = isPersonalComplete && isServicesSelected && isDocsComplete && isDuplicateCheckClear;

  // Actions: Save Draft
  const handleSaveDraft = () => {
    const draftId = editEmployeeId || `EMP-DRAFT-${Date.now().toString().substring(8)}`;
    const now = new Date().toISOString();

    const newEmployee = {
      id: draftId,
      name: form.name || 'Unnamed Draft',
      company: companyName,
      dob: form.dob,
      motherName: form.motherName,
      motherDob: form.motherDob,
      fatherName: form.fatherName,
      fatherDob: form.fatherDob,
      contactNumber: form.contactNumber,
      alternateContactNumber: form.alternateContactNumber,
      status: 'draft',
      priority: form.priority,
      services: selectedServices,
      slaStatus: 'Submitted Today',
      createdDate: now,
      documents: uploadedDocs,
      timeline: editEmployeeId ? [] : [{ event: 'Employee Created', user: kpc_session?.userName || 'Client HR', date: now }],
      audit: editEmployeeId ? [] : [{ user: kpc_session?.userName || 'Client HR', action: 'Form Created (Saved as Draft)', date: now }]
    };

    if (editEmployeeId) {
      const existing = mockDb.getEmployeeById(editEmployeeId);
      newEmployee.timeline = [...(existing.timeline || []), { event: 'Draft Updated', user: kpc_session?.userName || 'Client HR', date: now }];
      newEmployee.audit = [...(existing.audit || []), { user: kpc_session?.userName || 'Client HR', action: 'Draft Saved', date: now }];
      newEmployee.createdDate = existing.createdDate;
      updateSupabaseEmployee(editEmployeeId, newEmployee);
    } else {
      mockDb.addEmployee(newEmployee);
    }

    alert('Draft saved successfully!');
    navigate('/hr/employees');
  };

  // Actions: Submit Verification
  const handleSubmitVerification = async () => {
    if (!isFormFullyReady) {
      alert('Verification submission blocked. All readiness checklist items must pass.');
      return;
    }

    // Double check duplicate before actual submit
    if (!checkDuplicateEmployee()) {
      return;
    }

    const submissionId = editEmployeeId || `EMP-${Date.now().toString().substring(7)}`;
    const now = new Date().toISOString();

    const newEmployee = {
      id: submissionId,
      name: form.name,
      company: companyName,
      dob: form.dob,
      motherName: form.motherName,
      motherDob: form.motherDob,
      fatherName: form.fatherName,
      fatherDob: form.fatherDob,
      contactNumber: form.contactNumber,
      alternateContactNumber: form.alternateContactNumber,
      status: 'submitted',
      priority: form.priority,
      services: selectedServices,
      slaStatus: 'Submitted Today',
      createdDate: now,
      submittedDate: now,
      documents: uploadedDocs,
      timeline: [
        { event: 'Employee Created', user: kpc_session?.userName || 'Client HR', date: now },
        { event: 'Form Submitted', user: kpc_session?.userName || 'Client HR', date: now }
      ],
      audit: [
        { user: kpc_session?.userName || 'Client HR', action: 'Form Created', date: now },
        { user: kpc_session?.userName || 'Client HR', action: 'Documents Uploaded', date: now },
        { user: kpc_session?.userName || 'Client HR', action: 'Status Changed to Submitted', date: now }
      ]
    };

    try {
      const companyId = location.state?.companyId || null;

      console.log("LOCATION STATE:", location.state);
      console.log("COMPANY ID:", kpc_session?.clientId);

      const { data, error } = await supabase
        .from('employees')
        .insert([
          {
            company_id: kpc_session?.clientId,

            employee_code: submissionId,

            full_name: form.name,

            father_name: form.fatherName,

            mother_name: form.motherName,

            dob: form.dob,

            mobile: form.contactNumber,

            verification_status: 'pending',

            services: selectedServices
          }
        ])
        .select()
        .single();

      if (error) {
        console.error(error);
        alert(error.message);
        return;
      }
      setSubmittedEmployee({
        id: data.id, // Supabase UUID
        name: form.name,
        date: now,
        services: selectedServices,
        status: 'Submitted'
      });

      console.log('Employee Saved Successfully:', data);
      console.log("UPLOADED DOCS:", uploadedDocs);
      const employeeId = data.id;

      // Save initial timeline to local storage for Supabase mix-in
      const localData = JSON.parse(localStorage.getItem('kpc_supabase_assignments') || '{}');
      localData[employeeId] = {
        timeline: newEmployee.timeline,
        audit: newEmployee.audit,
        priority: newEmployee.priority
      };
      localStorage.setItem('kpc_supabase_assignments', JSON.stringify(localData));


      for (const doc of uploadedDocs) {

        console.log("PROCESSING DOC:", doc);

        if (!doc.file) {
          console.log("No file found:", doc.type);
          continue;
        }

        // Fixed:
        const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const fileName = `${employeeId}/${uniqueSuffix}-${doc.file.name}`;

        const { error: uploadError } = await supabase.storage
          .from("employee-documents")
          .upload(fileName, doc.file, { upsert: true }); // ⬅️ safety net

        if (uploadError) {
          console.error("UPLOAD ERROR:", uploadError);
          continue;
        }

        console.log("FILE UPLOADED:", fileName);

        const { data: urlData } =
          supabase.storage
            .from("employee-documents")
            .getPublicUrl(fileName);

        const publicUrl =
          urlData.publicUrl;

        const { error: docError } =
          await supabase
            .from("employee_documents")
            .insert([
              {
                employee_id: employeeId,
                document_type: doc.type,
                file_url: publicUrl
              }
            ]);

        if (docError) {
          console.error("DOCUMENT INSERT ERROR:", docError);
        } else {
          console.log("DOCUMENT SAVED:", doc.type);
        }
      }

    } catch (err) {

      console.error(err);
      alert('Failed to save employee');

      return;
    }

  };

  const handleCreateAnother = () => {
    // Reset all form state
    setForm({
      name: '',
      dob: '',
      motherName: '',
      motherDob: '',
      fatherName: '',
      fatherDob: '',
      contactNumber: '',
      alternateContactNumber: '',
      priority: 'High'
    });
    setFormErrors({});
    setSelectedServices(['Identity Verification']);
    setUploadedDocs([]);
    setDuplicateCheckPassed(false);
    setDuplicateWarning(null);
    setSubmittedEmployee(null);
    setStep(1);
  };

  // 6. Render Success Confirmation Screen
  if (submittedEmployee) {
    return (
      <div style={{ maxWidth: '600px', margin: '48px auto', textAlign: 'center', animation: 'fadeIn 0.5s ease-out' }}>
        <style>{`
          .success-badge {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background-color: #dcfce7;
            color: #10b981;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 24px;
            box-shadow: 0 0 0 10px #f0fdf4;
          }
        `}</style>

        <div className="card" style={{ padding: '48px 32px', backgroundColor: '#fff' }}>
          <div className="success-badge">
            <Check size={40} strokeWidth={3} />
          </div>

          <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-dark)' }}>Verification Dispatched!</h2>
          <p style={{ color: 'var(--text-gray)', marginTop: '8px' }}>
            Verification request for <strong>{submittedEmployee.name}</strong> was submitted successfully.
          </p>

          {/* Submission Info Grid */}
          <div className="card" style={{ padding: '20px', backgroundColor: '#f8fafc', margin: '32px 0', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <span style={{ color: 'var(--text-gray)', fontSize: '13px' }}>Employee ID</span>
              <strong style={{ color: 'var(--text-dark)' }}>{submittedEmployee.id}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <span style={{ color: 'var(--text-gray)', fontSize: '13px' }}>Submission Date</span>
              <span style={{ color: 'var(--text-dark)', fontWeight: 600 }}>{new Date(submittedEmployee.date).toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <span style={{ color: 'var(--text-gray)', fontSize: '13px' }}>Selected Checks</span>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                {submittedEmployee.services.map(s => (
                  <span key={s} style={{ fontSize: '11px', padding: '1px 6px', borderRadius: '4px', backgroundColor: 'var(--primary-blue-light)', color: 'var(--primary-blue)', fontWeight: 600 }}>{s}</span>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-gray)', fontSize: '13px' }}>Workflow Status</span>
              <span className="badge badge-submitted" style={{ padding: '4px 12px' }}>{submittedEmployee.status}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              className="btn btn-primary"
              onClick={() => navigate(`/hr/employees/${submittedEmployee.id}`)}
              style={{ width: '100%', padding: '12px' }}
            >
              View Employee Details screen
            </button>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                className="btn btn-outline"
                onClick={handleCreateAnother}
                style={{ flex: 1, padding: '10px', backgroundColor: '#fff' }}
              >
                <Plus size={16} style={{ marginRight: '6px' }} /> Create Another
              </button>
              <button
                className="btn btn-outline"
                onClick={() => navigate('/hr/employees')}
                style={{ flex: 1, padding: '10px', backgroundColor: '#fff' }}
              >
                Return to Employee List
              </button>
            </div>
          </div>

        </div>

      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.5s ease-out' }}>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .step-circle {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 13px;
          border: 2px solid var(--border-color);
          background-color: #fff;
          color: var(--text-gray);
          transition: all 0.3s;
        }
        .step-circle.active {
          border-color: var(--primary-blue);
          background-color: var(--primary-blue-light);
          color: var(--primary-blue);
          box-shadow: 0 0 0 4px rgba(11, 75, 175, 0.15);
        }
        .step-circle.completed {
          border-color: #10b981;
          background-color: #dcfce7;
          color: #10b981;
        }
        .step-line {
          flex: 1;
          height: 2px;
          background-color: var(--border-color);
          transition: background-color 0.3s;
        }
        .step-line.completed {
          background-color: #10b981;
        }
        .step-label {
          font-size: 11px;
          font-weight: 600;
          color: var(--text-gray);
          margin-top: 8px;
        }
        .step-label.active { color: var(--primary-blue); }
        .step-label.completed { color: #10b981; }
        
        .service-card {
          border: 2px solid var(--border-color);
          transition: all 0.2s;
          cursor: pointer;
        }
        .service-card:hover {
          border-color: #cbd5e1;
        }
        .service-card.selected {
          border-color: var(--primary-blue);
          background-color: var(--primary-blue-light);
        }
        .upload-card {
          border: 1px dashed var(--border-color);
          transition: all 0.2s;
        }
        .upload-card:hover {
          border-color: var(--primary-blue);
          background-color: var(--bg-hover);
        }
        .editor-modal {
          animation: modalFade 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes modalFade {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .readiness-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: var(--text-gray);
        }
        .readiness-item.valid {
          color: #166534;
        }
      `}</style>

      {/* Header Panel */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <PageHeader
            title={editEmployeeId ? 'Resume Verification Form' : 'New Verification Request'}
            subtitle="Submit candidate credentials and upload proof documents for verification."
          />
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-outline" onClick={handleSaveDraft} style={{ backgroundColor: '#fff' }}>
            <Save size={16} style={{ marginRight: '8px' }} /> Save Draft
          </button>
          <button className="btn btn-outline" onClick={() => navigate('/hr/employees')} style={{ color: '#dc2626', borderColor: '#fee2e2', backgroundColor: '#fff' }}>
            Cancel & Exit
          </button>
        </div>
      </div>

      {/* Stepper Progress Bar (4 steps now) */}
      <div className="card" style={{ padding: '24px 40px', backgroundColor: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

        {/* Step 1 */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
          <div className={`step-circle ${step === 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
            {step > 1 ? <Check size={18} /> : '1'}
          </div>
          <span className={`step-label ${step === 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>Candidate Profile</span>
        </div>

        <div className={`step-line ${step > 1 ? 'completed' : ''}`} />

        {/* Step 2 (New Service selection step) */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
          <div className={`step-circle ${step === 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
            {step > 2 ? <Check size={18} /> : '2'}
          </div>
          <span className={`step-label ${step === 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>Select Checks</span>
        </div>

        <div className={`step-line ${step > 2 ? 'completed' : ''}`} />

        {/* Step 3 */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
          <div className={`step-circle ${step === 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`}>
            {step > 3 ? <Check size={18} /> : '3'}
          </div>
          <span className={`step-label ${step === 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`}>Upload Documents</span>
        </div>

        <div className={`step-line ${step > 3 ? 'completed' : ''}`} />

        {/* Step 4 */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
          <div className={`step-circle ${step === 4 ? 'active' : ''}`}>4</div>
          <span className={`step-label ${step === 4 ? 'active' : ''}`}>Review & Dispatch</span>
        </div>

      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {/* Step 1: Employee Information Form */}
      {step === 1 && (
        <div className="card" style={{ padding: '32px', backgroundColor: '#fff', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', color: 'var(--text-dark)' }}>
            Step 1: Employee Information
          </h3>

          {/* Company Selector — full width above the grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-dark)' }}>Client Company *</label>
            <input
              type="text"
              value={companyName}
              readOnly
              style={{
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                fontSize: '14px',
                backgroundColor: '#f8fafc',
                color: 'var(--text-gray)',
                cursor: 'not-allowed',
                fontWeight: 600
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-dark)' }}>Legal Full Name (Matching ID proof) *</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleFormChange}
                placeholder="e.g. Rajiv Ramesh Jhunjhunwala"
                style={{ padding: '10px', borderRadius: '8px', border: `1px solid ${formErrors.name ? '#ef4444' : 'var(--border-color)'}`, fontSize: '14px' }}
              />
              {formErrors.name && <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: 500 }}>{formErrors.name}</span>}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-dark)' }}>Date of Birth *</label>
              <div style={{ width: '100%' }}>
                <DatePicker
                  selected={form.dob ? new Date(form.dob + "T12:00:00") : null}
                  onChange={(date) => {
                    const value = date ? date.toLocaleDateString('en-CA') : "";
                    handleFormChange({ target: { name: 'dob', value } });
                  }}
                  dateFormat="yyyy-MM-dd"
                  placeholderText="Select Date"
                  wrapperClassName="full-width-datepicker"
                  customInput={
                    <input
                      style={{ width: '100%', boxSizing: 'border-box', padding: '10px', borderRadius: '8px', border: `1px solid ${formErrors.dob ? '#ef4444' : 'var(--border-color)'}`, fontSize: '14px', fontFamily: 'var(--font-family)', outline: 'none' }}
                      onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.15)'}
                      onBlur={(e) => e.target.style.boxShadow = 'none'}
                    />
                  }
                />
              </div>
              {formErrors.dob && <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: 500 }}>{formErrors.dob}</span>}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-dark)' }}>Father's Full Name *</label>
              <input
                type="text"
                name="fatherName"
                value={form.fatherName}
                onChange={handleFormChange}
                placeholder="e.g. Ramesh Gopal Jhunjhunwala"
                style={{ padding: '10px', borderRadius: '8px', border: `1px solid ${formErrors.fatherName ? '#ef4444' : 'var(--border-color)'}`, fontSize: '14px' }}
              />
              {formErrors.fatherName && <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: 500 }}>{formErrors.fatherName}</span>}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-dark)' }}>Father's Date of Birth *</label>
              <div style={{ width: '100%' }}>
                <DatePicker
                  selected={form.fatherDob ? new Date(form.fatherDob + "T12:00:00") : null}
                  onChange={(date) => {
                    const value = date ? date.toLocaleDateString('en-CA') : "";
                    handleFormChange({ target: { name: 'fatherDob', value } });
                  }}
                  dateFormat="yyyy-MM-dd"
                  placeholderText="Select Date"
                  wrapperClassName="full-width-datepicker"
                  customInput={
                    <input
                      style={{ width: '100%', boxSizing: 'border-box', padding: '10px', borderRadius: '8px', border: `1px solid ${formErrors.fatherDob ? '#ef4444' : 'var(--border-color)'}`, fontSize: '14px', fontFamily: 'var(--font-family)', outline: 'none' }}
                      onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.15)'}
                      onBlur={(e) => e.target.style.boxShadow = 'none'}
                    />
                  }
                />
              </div>
              {formErrors.fatherDob && <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: 500 }}>{formErrors.fatherDob}</span>}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-dark)' }}>Mother's Full Name *</label>
              <input
                type="text"
                name="motherName"
                value={form.motherName}
                onChange={handleFormChange}
                placeholder="e.g. Saraswati Ramesh Jhunjhunwala"
                style={{ padding: '10px', borderRadius: '8px', border: `1px solid ${formErrors.motherName ? '#ef4444' : 'var(--border-color)'}`, fontSize: '14px' }}
              />
              {formErrors.motherName && <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: 500 }}>{formErrors.motherName}</span>}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-dark)' }}>Mother's Date of Birth *</label>
              <div style={{ width: '100%' }}>
                <DatePicker
                  selected={form.motherDob ? new Date(form.motherDob + "T12:00:00") : null}
                  onChange={(date) => {
                    const value = date ? date.toLocaleDateString('en-CA') : "";
                    handleFormChange({ target: { name: 'motherDob', value } });
                  }}
                  dateFormat="yyyy-MM-dd"
                  placeholderText="Select Date"
                  wrapperClassName="full-width-datepicker"
                  customInput={
                    <input
                      style={{ width: '100%', boxSizing: 'border-box', padding: '10px', borderRadius: '8px', border: `1px solid ${formErrors.motherDob ? '#ef4444' : 'var(--border-color)'}`, fontSize: '14px', fontFamily: 'var(--font-family)', outline: 'none' }}
                      onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.15)'}
                      onBlur={(e) => e.target.style.boxShadow = 'none'}
                    />
                  }
                />
              </div>
              {formErrors.motherDob && <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: 500 }}>{formErrors.motherDob}</span>}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-dark)' }}>Primary Contact Number *</label>
              <input
                type="text"
                name="contactNumber"
                value={form.contactNumber}
                onChange={handleFormChange}
                placeholder="10-digit mobile number"
                style={{ padding: '10px', borderRadius: '8px', border: `1px solid ${formErrors.contactNumber ? '#ef4444' : 'var(--border-color)'}`, fontSize: '14px' }}
              />
              {formErrors.contactNumber && <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: 500 }}>{formErrors.contactNumber}</span>}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-dark)' }}>Alternate Contact Number (Optional)</label>
              <input
                type="text"
                name="alternateContactNumber"
                value={form.alternateContactNumber}
                onChange={handleFormChange}
                placeholder="Secondary 10-digit mobile number"
                style={{ padding: '10px', borderRadius: '8px', border: `1px solid ${formErrors.alternateContactNumber ? '#ef4444' : 'var(--border-color)'}`, fontSize: '14px' }}
              />
              {formErrors.alternateContactNumber && <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: 500 }}>{formErrors.alternateContactNumber}</span>}
            </div>


          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '20px', marginTop: '12px' }}>
            <button className="btn btn-outline" onClick={handleSaveDraft} style={{ backgroundColor: '#fff' }}>
              <Save size={16} style={{ marginRight: '8px' }} /> Save Draft
            </button>
            <button className="btn btn-primary" onClick={handleNextStep}>
              Select Checks <ArrowRight size={16} style={{ marginLeft: '8px' }} />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Service Selection */}
      {step === 2 && (
        <div className="card" style={{ padding: '32px', backgroundColor: '#fff', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', color: 'var(--text-dark)' }}>
              Step 2: Select Verification Services
            </h3>
            <p style={{ color: 'var(--text-gray)', fontSize: '13px', marginTop: '8px' }}>Select checks to perform for this employee. Multiple packages can be selected simultaneously.</p>
          </div>

          {/* Service grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Service grid — dynamically loaded from company_services */}
            {servicesLoading ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-gray)' }}>
                Loading services...
              </div>
            ) : companyServices.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#ef4444', fontSize: '14px' }}>
                No services configured for this company. Please contact your Operations Manager.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {companyServices.map(svc => {
                  const isSelected = selectedServices.includes(svc.service_name);
                  return (
                    <div
                      key={svc.id}
                      className={`service-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => {
                        if (isSelected) {
                          if (selectedServices.length > 1) {
                            setSelectedServices(prev => prev.filter(s => s !== svc.service_name));
                          } else {
                            alert('At least one verification service must be selected.');
                          }
                        } else {
                          setSelectedServices(prev => [...prev, svc.service_name]);
                        }
                      }}
                      style={{
                        padding: '24px 20px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        cursor: 'pointer',
                        border: `2px solid ${isSelected ? 'var(--primary-blue)' : '#e2e8f0'}`,
                        backgroundColor: isSelected ? '#f0f9ff' : '#fff',
                        boxShadow: isSelected ? '0 4px 12px rgba(11, 75, 175, 0.08)' : '0 1px 3px rgba(0,0,0,0.02)',
                        transition: 'all 0.2s ease',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      {isSelected && (
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '4px',
                          height: '100%',
                          backgroundColor: 'var(--primary-blue)'
                        }} />
                      )}
                      
                      <div style={{
                        width: '24px', height: '24px', borderRadius: '6px',
                        border: `2px solid ${isSelected ? 'var(--primary-blue)' : '#94a3b8'}`,
                        backgroundColor: isSelected ? 'var(--primary-blue)' : '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'all 0.2s'
                      }}>
                        {isSelected && <Check size={16} color="#fff" strokeWidth={4} />}
                      </div>
                      
                      <div style={{ flex: 1 }}>
                        <h4 style={{ 
                          fontSize: '16px', 
                          fontWeight: isSelected ? 700 : 600, 
                          color: isSelected ? 'var(--primary-blue)' : 'var(--text-dark)',
                          margin: 0,
                          lineHeight: '1.2'
                        }}>
                          {svc.service_name}
                        </h4>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Navigation buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '20px', marginTop: '12px' }}>
            <button className="btn btn-outline" onClick={() => setStep(1)} style={{ backgroundColor: '#fff' }}>
              <ArrowLeft size={16} style={{ marginRight: '8px' }} /> Back
            </button>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-outline" onClick={handleSaveDraft} style={{ backgroundColor: '#fff' }}>
                <Save size={16} style={{ marginRight: '8px' }} /> Save Draft
              </button>
              <button className="btn btn-primary" onClick={handleNextStep}>
                Document Upload <ArrowRight size={16} style={{ marginLeft: '8px' }} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Document Upload */}
      {step === 3 && (
        <div className="card" style={{ padding: '32px', backgroundColor: '#fff', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-dark)' }}>
              Step 3: Document Upload
            </h3>

            {/* 2. Document requirement progress */}
            <span style={{ fontSize: '13px', fontWeight: 700, color: getDocRequirementStatus().isComplete ? '#10b981' : '#f59e0b' }}>
              {getDocRequirementStatus().text}
            </span>
          </div>

          {/* Required Documents list */}
          <div>
            <h4 style={{ fontSize: '13px', color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px', fontWeight: 700 }}>Required Verification Proofs</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              {ALL_DOCUMENTS.filter(d => requiredDocTypes.includes(d.id)).map(docType => {
                const matchedUploaded = uploadedDocs.find(d => d.type === docType.id);
                return (
                  <div key={docType.id} className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid #fed7aa', backgroundColor: '#fffdfa' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-dark)' }}>{docType.id}</span>
                        <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-gray)', marginTop: '2px' }}>{docType.description}</span>
                      </div>
                      {matchedUploaded ? (
                        <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#dcfce7', color: '#10b981', fontWeight: 700 }}>Clarity: {matchedUploaded.quality}</span>
                      ) : (
                        <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#fee2e2', color: '#dc2626', fontWeight: 700 }}>REQUIRED</span>
                      )}
                    </div>

                    {matchedUploaded ? (
                      <div style={{ display: 'flex', gap: '12px', padding: '8px 12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border-color)', alignItems: 'center' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
                          {matchedUploaded.isPdf ? <FileText size={20} /> : <img src={matchedUploaded.thumbnail} alt="Th" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                        </div>
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                          <span style={{ display: 'block', fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{matchedUploaded.name}</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-gray)' }}>{matchedUploaded.size}</span>
                        </div>
                        <button className="btn btn-outline" onClick={() => handleDeleteDocument(docType.id)} style={{ padding: '6px', borderColor: '#fee2e2' }} title="Delete">
                          <Trash2 size={13} color="#dc2626" />
                        </button>
                      </div>
                    ) : (
                      <div className="upload-card" onClick={() => handleUploadClick(docType.id)} style={{ padding: '16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                        <UploadCloud size={24} color="var(--text-gray)" />
                        <span style={{ fontSize: '12px', fontWeight: 600 }}>Click to Upload</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Optional Documents list */}
          <div style={{ marginTop: '12px' }}>
            <h4 style={{ fontSize: '13px', color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px', fontWeight: 700 }}>Optional Supporting Proofs</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              {ALL_DOCUMENTS.filter(d => !requiredDocTypes.includes(d.id)).map(docType => {
                const matchedUploaded = uploadedDocs.find(d => d.type === docType.id);
                return (
                  <div key={docType.id} className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid var(--border-color)', backgroundColor: '#fff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-dark)' }}>{docType.id}</span>
                        <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-gray)', marginTop: '2px' }}>{docType.description}</span>
                      </div>
                      {matchedUploaded && (
                        <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#dcfce7', color: '#10b981', fontWeight: 700 }}>Clarity: {matchedUploaded.quality}</span>
                      )}
                    </div>

                    {matchedUploaded ? (
                      <div style={{ display: 'flex', gap: '12px', padding: '8px 12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border-color)', alignItems: 'center' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
                          {matchedUploaded.isPdf ? <FileText size={20} /> : <img src={matchedUploaded.thumbnail} alt="Th" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                        </div>
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                          <span style={{ display: 'block', fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{matchedUploaded.name}</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-gray)' }}>{matchedUploaded.size}</span>
                        </div>
                        <button className="btn btn-outline" onClick={() => handleDeleteDocument(docType.id)} style={{ padding: '6px', borderColor: '#fee2e2' }} title="Delete">
                          <Trash2 size={13} color="#dc2626" />
                        </button>
                      </div>
                    ) : (
                      <div className="upload-card" onClick={() => handleUploadClick(docType.id)} style={{ padding: '16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                        <UploadCloud size={24} color="var(--text-gray)" />
                        <span style={{ fontSize: '12px', fontWeight: 600 }}>Click to Upload</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Navigation buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '20px', marginTop: '12px' }}>
            <button className="btn btn-outline" onClick={() => setStep(2)} style={{ backgroundColor: '#fff' }}>
              <ArrowLeft size={16} style={{ marginRight: '8px' }} /> Back
            </button>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-outline" onClick={handleSaveDraft} style={{ backgroundColor: '#fff' }}>
                <Save size={16} style={{ marginRight: '8px' }} /> Save Draft
              </button>
              <button className="btn btn-primary" onClick={handleNextStep}>
                Review Details <ArrowRight size={16} style={{ marginLeft: '8px' }} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Review and Submit Screen */}
      {step === 4 && (
        <div style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: '24px', alignItems: 'start' }}>

          {/* Left: Review details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* profile Summary */}
            <div className="card" style={{ padding: '24px', backgroundColor: '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-dark)' }}>Candidate Profile</h3>
                <button className="btn btn-outline" onClick={() => setStep(1)} style={{ padding: '4px 10px', fontSize: '12px', backgroundColor: '#fff' }}>Edit</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '13px' }}>
                <div><span style={{ color: 'var(--text-gray)' }}>Full Name:</span> <strong>{form.name}</strong></div>
                <div><span style={{ color: 'var(--text-gray)' }}>Date of Birth:</span> <strong>{form.dob}</strong></div>
                <div><span style={{ color: 'var(--text-gray)' }}>Father:</span> {form.fatherName} ({form.fatherDob})</div>
                <div><span style={{ color: 'var(--text-gray)' }}>Mother:</span> {form.motherName} ({form.motherDob})</div>
                <div><span style={{ color: 'var(--text-gray)' }}>Contact:</span> {form.contactNumber}</div>
                <div><span style={{ color: 'var(--text-gray)' }}>Alt Contact:</span> {form.alternateContactNumber || 'None'}</div>
                <div>
                  <span style={{ color: 'var(--text-gray)' }}>Priority:</span>{' '}
                  <span style={{ fontWeight: 700, color: form.priority === 'Urgent' ? '#dc2626' : form.priority === 'High' ? '#ea580c' : '#64748b' }}>{form.priority}</span>
                </div>
              </div>
            </div>

            {/* Selected checks list */}
            <div className="card" style={{ padding: '24px', backgroundColor: '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-dark)' }}>Selected Services</h3>
                <button className="btn btn-outline" onClick={() => setStep(2)} style={{ padding: '4px 10px', fontSize: '12px', backgroundColor: '#fff' }}>Edit</button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {selectedServices.map(svc => (
                  <span key={svc} style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '6px', backgroundColor: 'var(--primary-blue-light)', color: 'var(--primary-blue)', fontWeight: 600 }}>{svc}</span>
                ))}
              </div>
            </div>

            {/* 5. Document Preview Gallery */}
            <div className="card" style={{ padding: '24px', backgroundColor: '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-dark)' }}>Document Gallery</h3>
                <button className="btn btn-outline" onClick={() => setStep(3)} style={{ padding: '4px 10px', fontSize: '12px', backgroundColor: '#fff' }}>Upload More</button>
              </div>

              {/* Gallery Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
                {uploadedDocs.map((doc, idx) => (
                  <div key={idx} className="card" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', background: '#f8fafc' }}>
                    <div style={{ width: '100%', height: '110px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-color)', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {doc.isPdf ? (
                        <FileText size={36} color="var(--text-gray)" />
                      ) : (
                        <img src={doc.thumbnail} alt="th" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-dark)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={doc.type}>{doc.type}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-gray)', marginTop: '2px' }}>{doc.size} • Clarity: <strong>{doc.quality}</strong></div>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: '6px', borderTop: '1px solid var(--border-color)', paddingTop: '8px', marginTop: '4px' }}>
                      <button
                        className="btn btn-outline"
                        onClick={() => handleUploadClick(doc.type)}
                        style={{ flex: 1, padding: '4px', fontSize: '10px', backgroundColor: '#fff' }}
                      >
                        Replace
                      </button>
                      <button
                        className="btn btn-outline"
                        onClick={() => handleDeleteDocument(doc.type)}
                        style={{ padding: '4px', borderColor: '#fee2e2', backgroundColor: '#fff' }}
                      >
                        <Trash2 size={12} color="#dc2626" />
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right: Submission Readiness Panel & Duplicate Warning */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* 4. Submission Readiness Panel */}
            <div className="card" style={{ padding: '24px', backgroundColor: '#fff' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ListTodo size={18} color="var(--primary-blue)" /> Readiness Check
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

                <div className={`readiness-item ${isPersonalComplete ? 'valid' : ''}`}>
                  {isPersonalComplete ? <CheckCircle2 size={16} color="#10b981" /> : <AlertCircle size={16} color="#dc2626" />}
                  <span>Candidate Profile Complete</span>
                </div>

                <div className={`readiness-item ${isServicesSelected ? 'valid' : ''}`}>
                  {isServicesSelected ? <CheckCircle2 size={16} color="#10b981" /> : <AlertCircle size={16} color="#dc2626" />}
                  <span>Verification Checks Selected</span>
                </div>

                <div className={`readiness-item ${isDocsComplete ? 'valid' : ''}`}>
                  {isDocsComplete ? <CheckCircle2 size={16} color="#10b981" /> : <AlertCircle size={16} color="#dc2626" />}
                  <span>Required Documents: {docStatusObj.uploaded}/{docStatusObj.total} uploaded</span>
                </div>

                <div className={`readiness-item ${isDuplicateCheckClear ? 'valid' : ''}`}>
                  {isDuplicateCheckClear ? <CheckCircle2 size={16} color="#10b981" /> : <AlertCircle size={16} color="#dc2626" />}
                  <span>No Unconfirmed Duplicates</span>
                </div>

              </div>

              {/* Submit Dispatch Actions */}
              <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button
                  className="btn btn-primary"
                  onClick={handleSubmitVerification}
                  disabled={!isFormFullyReady}
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '14px',
                    fontWeight: 700,
                    backgroundColor: isFormFullyReady ? '#10b981' : '#cbd5e1',
                    cursor: isFormFullyReady ? 'pointer' : 'not-allowed'
                  }}
                >
                  <Send size={16} style={{ marginRight: '8px' }} /> Submit Verification
                </button>
                <button className="btn btn-outline" onClick={handleSaveDraft} style={{ width: '100%', backgroundColor: '#fff' }}>
                  <Save size={16} style={{ marginRight: '8px' }} /> Save As Draft
                </button>
              </div>

            </div>

            {/* 3. Duplicate Employee Warning Display */}
            {!duplicateCheckPassed && !duplicateWarning && (
              <button
                className="btn btn-outline"
                onClick={checkDuplicateEmployee}
                style={{ width: '100%', padding: '10px', fontSize: '13px', fontWeight: 600, backgroundColor: '#fff' }}
              >
                Scan for Potential Duplicates
              </button>
            )}

            {duplicateWarning && (
              <div className="card" style={{ padding: '20px', border: '1px solid #fca5a5', backgroundColor: '#fee2e2', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '10px', color: '#b91c1c' }}>
                  <AlertTriangle size={20} style={{ flexShrink: 0 }} />
                  <div>
                    <strong style={{ fontSize: '14px' }}>Potential Duplicate Employee Detected!</strong>
                    <p style={{ fontSize: '12px', marginTop: '4px', lineHeight: 1.5 }}>
                      A record already exists in KPC with these details:
                    </p>
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: '#7f1d1d', background: 'rgba(255,255,255,0.4)', padding: '10px', borderRadius: '6px' }}>
                  <div><strong>Name:</strong> {duplicateWarning.name}</div>
                  <div><strong>DOB:</strong> {duplicateWarning.dob}</div>
                  <div><strong>Contact:</strong> {duplicateWarning.contact}</div>
                  <div><strong>Employee ID:</strong> {duplicateWarning.id}</div>
                </div>

                {/* Checkbox to force continue */}
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', fontSize: '12px', color: '#7f1d1d', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={duplicateCheckPassed}
                    onChange={(e) => setDuplicateCheckPassed(e.target.checked)}
                    style={{ marginTop: '3px' }}
                  />
                  <span>Yes, I confirm this is a different employee and want to proceed.</span>
                </label>
              </div>
            )}

          </div>

        </div>
      )}

      {/* Image Manipulation Editor modal */}
      {editorImageSrc && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card editor-modal" style={{ width: '850px', backgroundColor: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column' }}>

            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Document Editor & Image Enhancer</h3>
                <p style={{ color: 'var(--text-gray)', fontSize: '12px', marginTop: '2px' }}>Adjust alignment, rotation, and crop layout to guarantee document legibility.</p>
              </div>
              <button onClick={() => setEditorImageSrc(null)} style={{ padding: '8px' }}><X size={20} /></button>
            </div>

            <div style={{ display: 'flex', flex: 1 }}>

              <div style={{ flex: 1, backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', borderRight: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <div style={{ position: 'relative', border: '2px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#fff', width: '400px', height: '300px' }}>
                    <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
                    <div
                      style={{
                        position: 'absolute',
                        left: `${cropBox.x}%`,
                        top: `${cropBox.y}%`,
                        width: `${cropBox.w}%`,
                        height: `${cropBox.h}%`,
                        border: '2px dashed #3b82f6',
                        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.4)',
                        cursor: 'move',
                        boxSizing: 'border-box'
                      }}
                      onMouseDown={(e) => handlePointerDown(e, 'move')}
                    >
                      <div style={{ position: 'absolute', left: '-4px', top: '-4px', width: '8px', height: '8px', backgroundColor: '#1e3a8a', cursor: 'nwse-resize' }} onMouseDown={(e) => { e.stopPropagation(); handlePointerDown(e, 'nw'); }} />
                      <div style={{ position: 'absolute', right: '-4px', top: '-4px', width: '8px', height: '8px', backgroundColor: '#1e3a8a', cursor: 'nesw-resize' }} onMouseDown={(e) => { e.stopPropagation(); handlePointerDown(e, 'ne'); }} />
                      <div style={{ position: 'absolute', left: '-4px', bottom: '-4px', width: '8px', height: '8px', backgroundColor: '#1e3a8a', cursor: 'nesw-resize' }} onMouseDown={(e) => { e.stopPropagation(); handlePointerDown(e, 'sw'); }} />
                      <div style={{ position: 'absolute', right: '-4px', bottom: '-4px', width: '8px', height: '8px', backgroundColor: '#1e3a8a', cursor: 'nwse-resize' }} onMouseDown={(e) => { e.stopPropagation(); handlePointerDown(e, 'se'); }} />

                      <div style={{ position: 'absolute', left: '0', top: '-4px', right: '0', height: '8px', cursor: 'ns-resize' }} onMouseDown={(e) => { e.stopPropagation(); handlePointerDown(e, 'n'); }} />
                      <div style={{ position: 'absolute', left: '0', bottom: '-4px', right: '0', height: '8px', cursor: 'ns-resize' }} onMouseDown={(e) => { e.stopPropagation(); handlePointerDown(e, 's'); }} />
                      <div style={{ position: 'absolute', left: '-4px', top: '0', bottom: '0', width: '8px', cursor: 'ew-resize' }} onMouseDown={(e) => { e.stopPropagation(); handlePointerDown(e, 'w'); }} />
                      <div style={{ position: 'absolute', right: '-4px', top: '0', bottom: '0', width: '8px', cursor: 'ew-resize' }} onMouseDown={(e) => { e.stopPropagation(); handlePointerDown(e, 'e'); }} />
                    </div>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-gray)', fontStyle: 'italic' }}>Simulated Crop viewport</span>
                </div>
              </div>

              <div style={{ width: '320px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                <div>
                  <h4 style={{ fontSize: '12px', color: 'var(--text-gray)', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 700 }}>File Information</h4>
                  <div style={{ fontSize: '13px', color: 'var(--text-dark)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div><strong>Filename:</strong> {editorFilename}</div>
                    <div><strong>File size:</strong> {editorFilesize}</div>
                    <div>
                      <strong>Clarity Quality:</strong>{' '}
                      <span style={{
                        fontWeight: 700,
                        color: getEditorQuality().includes('Low') ? '#dc2626' : '#166534'
                      }}>
                        {getEditorQuality()}
                      </span>
                    </div>
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
                  <h4 style={{ fontSize: '12px', color: 'var(--text-gray)', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 700 }}>Rotate Alignment</h4>
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
                  <h4 style={{ fontSize: '12px', color: 'var(--text-gray)', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 700 }}>Fine Align / Straighten ({straighten}°)</h4>
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

                {getEditorQuality().includes('Low') && (
                  <div style={{ display: 'flex', gap: '8px', padding: '10px', backgroundColor: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '6px', color: '#dc2626', fontSize: '11px', fontWeight: 500 }}>
                    <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span>Warning: Lower resolution files might be rejected by the Operations verification team.</span>
                  </div>
                )}

              </div>

            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', backgroundColor: '#f8fafc' }}>
              <button
                className="btn btn-outline"
                onClick={() => handleUploadClick(activeUploadType)}
                style={{ color: 'var(--primary-blue)', backgroundColor: '#fff' }}
              >
                Choose Alternate File
              </button>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn btn-outline" onClick={() => setEditorImageSrc(null)} style={{ backgroundColor: '#fff' }}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSaveCroppedDocument}>
                  Confirm & Apply Layout
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
export default CreateEmployee;
