import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Building2, Users, Settings, CheckCircle2,
  Check, Save, Plus, Trash2, ShieldCheck, Mail, Phone, MapPin
} from 'lucide-react';
import { mockDb } from '../utils/mockDb';
import { supabase } from '../utils/supabase';

const INDUSTRIES = ['IT Services', 'Finance', 'Manufacturing', 'Healthcare', 'Banking & Finance', 'Consulting', 'Retail', 'Education'];
const ALL_SERVICES = [
  { id: 'Identity Verification', name: 'Identity Verification', desc: 'Aadhaar & PAN validation' },
  { id: 'Address Verification', name: 'Address Verification', desc: 'Physical address check via utility bill / rent agreement' },
  { id: 'Police Verification', name: 'Police Verification', desc: 'Criminal record & law enforcement check' },
  // { id: 'Background Verification', name: 'Background Verification', desc: 'Academic & corporate credential audit', defaultRate: 1500 },
  // { id: 'Other Services', name: 'Other Services', desc: 'Custom or supplementary checks', defaultRate: 2000 },
];

export const CreateClient = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  const [step, setStep] = useState(1);

  // Step 1: Company Information
  const [companyName, setCompanyName] = useState('');
  const [hq, setHq] = useState('');
  const [industry, setIndustry] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [billingContact, setBillingContact] = useState('');
  const [billingEmail, setBillingEmail] = useState('');
  const [billingPhone, setBillingPhone] = useState('');

  // Step 2: Services & Rate Card
  const [selectedServices, setSelectedServices] = useState([]);
  const [rateCard, setRateCard] = useState({});

  // Step 3: HR Account
  const [hrAccounts, setHrAccounts] = useState([
    { name: '', email: '', role: ' HR' }
  ]);

  // Errors
  const [errors, setErrors] = useState({});

  // Success state
  const [createdClient, setCreatedClient] = useState(null);

  // ── LOAD EXISTING CLIENT ──────────────────────────────────────
  useEffect(() => {
    const fetchClient = async () => {
      if (isEditing) {
        if (supabase) {
          try {
            const { data: company } = await supabase.from('companies').select('*').eq('id', id).single();
            if (company) {
              setCompanyName(company.company_name || '');
              setHq(company.hq || '');
              setIndustry(company.industry || '');
              setGstNumber(company.gst_number || '');
              setContactPerson(company.contact_person || '');
              setContactEmail(company.email || '');
              setContactPhone(company.phone || '');
              setBillingContact(company.billing_contact || '');
              setBillingEmail(company.billing_email || '');
              setBillingPhone(company.billing_phone || '');

              const { data: services } = await supabase.from('company_services').select('*').eq('company_id', id);
              if (services) {
                setSelectedServices(services.map(s => s.service_name));
              }
              const { data: hr } = await supabase.from('hr_accounts').select('*').eq('company_id', id);
              if (hr && hr.length > 0) {
                setHrAccounts(hr);
              } else {
                setHrAccounts([{ name: '', email: '', role: ' HR' }]);
              }
            }
          } catch (e) {
            console.error(e);
          }
        } else {
          const existingClient = mockDb.getClientById(id);
          if (existingClient) {
            setCompanyName(existingClient.name || '');
            setHq(existingClient.hq || '');
            setIndustry(existingClient.industry || '');
            setGstNumber(existingClient.gstNumber || '');
            setContactPerson(existingClient.contactPerson || '');
            setContactEmail(existingClient.contactEmail || '');
            setContactPhone(existingClient.contactPhone || '');
            setBillingContact(existingClient.billingContact || '');
            setBillingEmail(existingClient.billingEmail || '');
            setBillingPhone(existingClient.billingPhone || '');
            setSelectedServices(existingClient.services || []);
            setRateCard(existingClient.rateCard || {});
            setHrAccounts(existingClient.hrAccounts && existingClient.hrAccounts.length > 0 ? existingClient.hrAccounts : [{ name: '', email: '', role: ' HR' }]);
          }
        }
      }
    };
    fetchClient();
  }, [id, isEditing]);

  // ── VALIDATION ────────────────────────────────────────────────
  const validateStep1 = () => {
    const e = {};
    if (!companyName.trim()) e.companyName = 'Company name is required.';
    if (!hq) e.hq = 'Headquarters city is required.';
    if (!industry) e.industry = 'Industry is required.';
    if (!contactPerson.trim()) e.contactPerson = 'Primary contact name is required.';
    if (!contactEmail.trim()) e.contactEmail = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) e.contactEmail = 'Enter a valid email.';
    if (!contactPhone.trim()) e.contactPhone = 'Phone number is required.';
    else if (!/^[0-9]{10}$/.test(contactPhone)) e.contactPhone = 'Enter a valid 10-digit number.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e = {};
    if (selectedServices.length === 0) e.services = 'Select at least one service.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep3 = () => {
    const e = {};
    hrAccounts.forEach((hr, i) => {
      if (!hr.name.trim()) e[`hr_name_${i}`] = 'Name required.';
      if (!hr.email.trim()) e[`hr_email_${i}`] = 'Email required.';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(hr.email)) e[`hr_email_${i}`] = 'Valid email required.';
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── STEP NAVIGATION ──────────────────────────────────────────
  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
    else if (step === 3 && validateStep3()) setStep(4);
  };

  // ── SERVICE TOGGLE ────────────────────────────────────────────
  const toggleService = (svcId) => {
    if (selectedServices.includes(svcId)) {
      setSelectedServices(prev => prev.filter(s => s !== svcId));
      setRateCard(prev => { const n = { ...prev }; delete n[svcId]; return n; });
    } else {
      const svc = ALL_SERVICES.find(s => s.id === svcId);
      setSelectedServices(prev => [...prev, svcId]);
      setRateCard(prev => ({ ...prev, [svcId]: svc.defaultRate }));
    }
  };

  // ── HR ACCOUNT MANAGEMENT ────────────────────────────────────
  const addHrAccount = () => {
    setHrAccounts(prev => [...prev, { name: '', email: '', role: prev.length === 0 ? 'Primary HR' : 'Secondary HR' }]);
  };
  const removeHrAccount = (i) => {
    if (hrAccounts.length <= 1) return;
    setHrAccounts(prev => prev.filter((_, idx) => idx !== i));
  };
  const updateHrField = (i, field, val) => {
    setHrAccounts(prev => prev.map((hr, idx) => idx === i ? { ...hr, [field]: val } : hr));
  };

  // ── SUBMIT ────────────────────────────────────────────────────
  const handleCreate = async () => {

    const hrAccountsFinal = hrAccounts.map((hr, i) => ({
      id: hr.id || `HR-${Date.now()}-${i}`,
      name: hr.name,
      email: hr.email,
      role: hr.role,
      status: hr.status || 'Active',
      lastLogin: hr.lastLogin || null
    }));
    const now = new Date().toISOString();

    const rateObj = {};
    selectedServices.forEach(svc => {
      rateObj[svc] = parseFloat(rateCard[svc]);
    });



    // if (hrError) {
    //   alert(hrError.message);
    //   return;
    // }

    if (isEditing) {
      if (supabase) {
        try {
          const { error: updateError } = await supabase.from('companies').update({
            company_name: companyName.trim(),
            hq: hq,
            industry: industry,
            gst_number: gstNumber.trim(),
            contact_person: contactPerson.trim(),
            email: contactEmail.trim(),
            phone: contactPhone.trim(),
            billing_contact: billingContact.trim() || contactPerson.trim(),
            billing_email: billingEmail.trim() || contactEmail.trim(),
            billing_phone: billingPhone.trim() || contactPhone.trim(),
          }).eq('id', id);
          if (updateError) throw updateError;

          // Delete existing services
          await supabase.from('company_services').delete().eq('company_id', id);
          // Insert new services
          if (selectedServices.length > 0) {
            const servicesData = selectedServices.map(service => ({
              company_id: id,
              service_name: service,
            }));
            await supabase.from('company_services').insert(servicesData);
          }

          // Handle HR accounts (update existing, add new)
          for (const hr of hrAccountsFinal) {
            if (hr.id && !hr.id.toString().startsWith('HR-')) {
              await supabase.from('hr_accounts').update({
                name: hr.name,
                email: hr.email,
                role: hr.role,
                status: hr.status
              }).eq('id', hr.id);
            } else {
              await supabase.from('hr_accounts').insert({
                company_id: id,
                name: hr.name,
                email: hr.email,
                role: hr.role,
                status: hr.status || 'Active'
              });
            }
          }
          alert('Client Updated Successfully');
          navigate(`/ops/clients/${id}`);
          return;
        } catch (e) {
          console.error(e);
          alert('Error: ' + e.message);
          return;
        }
      } else {
        const updatedFields = {
          name: companyName.trim(),
          hq,
          industry,
          gstNumber: gstNumber.trim(),
          contactPerson: contactPerson.trim(),
          contactEmail: contactEmail.trim(),
          contactPhone: contactPhone.trim(),
          billingContact: billingContact.trim() || contactPerson.trim(),
          billingEmail: billingEmail.trim() || contactEmail.trim(),
          billingPhone: billingPhone.trim() || contactPhone.trim(),
          services: selectedServices,
          rateCard: rateObj,
          hrAccounts: hrAccountsFinal
        };

        mockDb.updateClient(id, updatedFields);
        navigate(`/ops/clients/${id}`);
        return;
      }
    }

    try {
      if (!supabase) {
        // Fallback to MockDB if Supabase is not configured
        const newClient = {
          id: mockDb.getNextClientId(),
          name: companyName.trim(),
          hq,
          industry,
          gstNumber: gstNumber.trim(),
          contactPerson: contactPerson.trim(),
          contactEmail: contactEmail.trim(),
          contactPhone: contactPhone.trim(),
          billingContact: billingContact.trim() || contactPerson.trim(),
          billingEmail: billingEmail.trim() || contactEmail.trim(),
          billingPhone: billingPhone.trim() || contactPhone.trim(),
          services: selectedServices,
          rateCard: rateObj,
          hrAccounts: hrAccountsFinal,
          status: 'Active',
          createdDate: now,
          timeline: [{ event: 'Client Onboarded', user: 'Operations Manager', date: now }]
        };
        mockDb.addClient(newClient);
        alert('Client Created Successfully (Mock Database)');
        navigate('/ops/clients');
        return;
      }

      const { data: companyData, error: companyError } =
        await supabase
          .from('companies')
          .insert([
            {
              company_name: companyName.trim(),
              hq: hq,
              industry: industry,
              gst_number: gstNumber.trim(),
              contact_person: contactPerson.trim(),
              email: contactEmail.trim(),
              phone: contactPhone.trim(),
              billing_contact: billingContact.trim() || contactPerson.trim(),
              billing_email: billingEmail.trim() || contactEmail.trim(),
              billing_phone: billingPhone.trim() || contactPhone.trim(),
              status: 'Active'
            }
          ])
          .select()
          .single();

      if (companyError) {
        console.error(companyError);
        alert('Company Error: ' + companyError.message);
        return;
      }

      const companyId = companyData.id;

      if (selectedServices.length > 0) {
        const servicesData = selectedServices.map(service => ({
          company_id: companyId,
          service_name: service,
          // rate: rateObj[service] || 0
        }));

        await supabase
          .from('company_services')
          .insert(servicesData);
      }

      if (hrAccountsFinal.length > 0) {
        const hrData = hrAccountsFinal.map(hr => ({
          company_id: companyId,
          name: hr.name,
          email: hr.email,
          role: hr.role,
          status: hr.status
        }));

        const { data: hrInsertData, error: hrInsertError } =
          await supabase
            .from('hr_accounts')
            .insert(hrData)
            .select();

        if (hrInsertError) {
          console.error(hrInsertError);
          alert(hrInsertError.message);
          return;
        }
      }

      alert('Client Created Successfully');
      navigate('/ops/clients');

    } catch (err) {
      console.error(err);
      alert('Error: ' + (err.message || JSON.stringify(err)));
    }
  };


  // ── SHARED INPUT STYLE ────────────────────────────────────────
  const inputStyle = { padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '14px', width: '100%', boxSizing: 'border-box', outline: 'none' };
  const errorInputStyle = { ...inputStyle, borderColor: '#ef4444' };
  const labelStyle = { fontSize: '13px', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '6px', display: 'block' };
  const errorTextStyle = { fontSize: '11px', color: '#ef4444', fontWeight: 500, marginTop: '4px' };
  const selectStyle = { ...inputStyle, backgroundColor: '#fff', cursor: 'pointer' };

  // ══════════════════════════════════════════════════════════════
  //  SUCCESS SCREEN
  // ══════════════════════════════════════════════════════════════
  if (createdClient) {
    return (
      <div style={{ maxWidth: '600px', margin: '48px auto', textAlign: 'center', animation: 'fadeIn 0.5s ease-out' }}>
        <div className="card" style={{ padding: '48px 32px', backgroundColor: '#fff' }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#dcfce7',
            color: '#10b981', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '24px', boxShadow: '0 0 0 10px #f0fdf4'
          }}>
            <Check size={40} strokeWidth={3} />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-dark)' }}>Client Account Created!</h2>
          <p style={{ color: 'var(--text-gray)', marginTop: '8px' }}>
            <strong>{createdClient.name}</strong> has been successfully onboarded with {createdClient.hrAccounts.length} HR account{createdClient.hrAccounts.length > 1 ? 's' : ''}.
          </p>

          <div className="card" style={{ padding: '20px', backgroundColor: '#f8fafc', margin: '32px 0', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <span style={{ color: 'var(--text-gray)', fontSize: '13px' }}>Client ID</span>
              <strong style={{ color: 'var(--text-dark)' }}>{createdClient.id}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <span style={{ color: 'var(--text-gray)', fontSize: '13px' }}>Industry</span>
              <span style={{ fontWeight: 600 }}>{createdClient.industry}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <span style={{ color: 'var(--text-gray)', fontSize: '13px' }}>HQ Location</span>
              <span style={{ fontWeight: 600 }}>{createdClient.hq}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <span style={{ color: 'var(--text-gray)', fontSize: '13px' }}>Active Services</span>
              <span style={{ fontWeight: 600 }}>{createdClient.services.length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-gray)', fontSize: '13px' }}>HR Accounts</span>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                {createdClient.hrAccounts.map(hr => (
                  <span key={hr.id} style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'var(--primary-blue-light)', color: 'var(--primary-blue)', fontWeight: 600 }}>{hr.name} ({hr.email})</span>
                ))}
              </div>
            </div>
          </div>

          <div style={{ padding: '16px', backgroundColor: '#fff8f1', borderRadius: '8px', border: '1px solid #fed7aa', marginBottom: '24px', textAlign: 'left' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#9a3412', marginBottom: '8px' }}>Login Instructions for HR</h4>
            <p style={{ fontSize: '12px', color: '#9a3412', marginBottom: '8px' }}>Please share these details with the client's HR team so they can access the system:</p>
            <ul style={{ fontSize: '13px', color: '#7c2d12', paddingLeft: '20px', margin: 0 }}>
              <li><strong>Username:</strong> Their registered Email Address</li>
              <li><strong>Password:</strong> <code style={{ backgroundColor: '#ffedd5', padding: '2px 6px', borderRadius: '4px' }}>hr@123</code></li>
            </ul>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button className="btn btn-primary" onClick={() => navigate(`/ops/clients/${createdClient.id}`)} style={{ width: '100%', padding: '12px' }}>
              View Client Details
            </button>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-outline" onClick={() => navigate('/ops/clients')} style={{ flex: 1, padding: '10px', backgroundColor: '#fff' }}>
                Return to Client List
              </button>
              <button className="btn btn-outline" onClick={() => { setCreatedClient(null); setStep(1); setCompanyName(''); setHq(''); setIndustry(''); setGstNumber(''); setContactPerson(''); setContactEmail(''); setContactPhone(''); setBillingContact(''); setBillingEmail(''); setBillingPhone(''); setSelectedServices([]); setRateCard({}); setHrAccounts([{ name: '', email: '', role: ' HR' }]); }} style={{ flex: 1, padding: '10px', backgroundColor: '#fff' }}>
                <Plus size={16} style={{ marginRight: '6px' }} /> Create Another
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  //  MAIN FORM
  // ══════════════════════════════════════════════════════════════
  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.5s ease-out' }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .step-circle { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; border: 2px solid var(--border-color); background: #fff; color: var(--text-gray); transition: all 0.3s; }
        .step-circle.active { border-color: var(--primary-blue); background: var(--primary-blue-light); color: var(--primary-blue); box-shadow: 0 0 0 4px rgba(11,75,175,0.15); }
        .step-circle.completed { border-color: #10b981; background: #dcfce7; color: #10b981; }
        .step-line { flex: 1; height: 2px; background: var(--border-color); transition: background 0.3s; }
        .step-line.completed { background: #10b981; }
        .step-label { font-size: 11px; font-weight: 600; color: var(--text-gray); margin-top: 8px; }
        .step-label.active { color: var(--primary-blue); }
        .step-label.completed { color: #10b981; }
        .service-card { border: 2px solid var(--border-color); transition: all 0.2s; cursor: pointer; border-radius: 10px; padding: 16px; }
        .service-card:hover { border-color: #cbd5e1; }
        .service-card.selected { border-color: var(--primary-blue); background: var(--primary-blue-light); }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => navigate('/ops/clients')} style={{ padding: '8px', borderRadius: '50%', backgroundColor: '#fff', border: '1px solid var(--border-color)', cursor: 'pointer' }}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-dark)' }}>Create Client Account</h1>
            <p style={{ color: 'var(--text-gray)', marginTop: '4px' }}>Onboard a new enterprise client with services, rate card, and HR credentials.</p>
          </div>
        </div>
      </div>

      {/* Stepper */}
      <div className="card" style={{ padding: '24px 40px', backgroundColor: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {[
          { num: 1, label: 'Company Info' },
          { num: 2, label: 'Services' },
          { num: 3, label: 'HR Accounts' },
          { num: 4, label: 'Review & Create' }
        ].map((s, i) => (
          <React.Fragment key={s.num}>
            {i > 0 && <div className={`step-line ${step > s.num - 1 ? 'completed' : ''}`} />}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
              <div className={`step-circle ${step === s.num ? 'active' : ''} ${step > s.num ? 'completed' : ''}`}>
                {step > s.num ? <Check size={18} /> : s.num}
              </div>
              <span className={`step-label ${step === s.num ? 'active' : ''} ${step > s.num ? 'completed' : ''}`}>{s.label}</span>
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* ── STEP 1: Company Information ─────────────────────────── */}
      {step === 1 && (
        <div className="card" style={{ padding: '32px', backgroundColor: '#fff', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building2 size={20} color="var(--primary-blue)" /> Company Information
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Company Legal Name *</label>
              <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="e.g. TechCorp Solutions Pvt. Ltd." style={errors.companyName ? errorInputStyle : inputStyle} />
              {errors.companyName && <div style={errorTextStyle}>{errors.companyName}</div>}
            </div>

            <div>
              <label style={labelStyle}>Headquarters City *</label>
              <input type="text" value={hq} onChange={e => setHq(e.target.value)} placeholder="e.g. Pune" style={errors.hq ? errorInputStyle : inputStyle} />
              {errors.hq && <div style={errorTextStyle}>{errors.hq}</div>}
            </div>

            <div>
              <label style={labelStyle}>Industry *</label>
              <select value={industry} onChange={e => setIndustry(e.target.value)} style={errors.industry ? errorInputStyle : selectStyle}>
                <option value="">Select Industry</option>
                {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
              {errors.industry && <div style={errorTextStyle}>{errors.industry}</div>}
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>GST Number</label>
              <input type="text" value={gstNumber} onChange={e => setGstNumber(e.target.value)} placeholder="e.g. 29AABCT1234A1Z5" style={inputStyle} />
            </div>
          </div>

          {/* Contact Section */}
          <h3 style={{ fontSize: '16px', fontWeight: 600, borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', color: 'var(--text-dark)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Phone size={18} color="var(--primary-blue)" /> Primary Contact
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
            <div>
              <label style={labelStyle}>Contact Person *</label>
              <input type="text" value={contactPerson} onChange={e => setContactPerson(e.target.value)} placeholder="Full Name" style={errors.contactPerson ? errorInputStyle : inputStyle} />
              {errors.contactPerson && <div style={errorTextStyle}>{errors.contactPerson}</div>}
            </div>
            <div>
              <label style={labelStyle}>Contact Email *</label>
              <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="email@company.in" style={errors.contactEmail ? errorInputStyle : inputStyle} />
              {errors.contactEmail && <div style={errorTextStyle}>{errors.contactEmail}</div>}
            </div>
            <div>
              <label style={labelStyle}>Contact Phone *</label>
              <input type="tel" value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="10-digit number" style={errors.contactPhone ? errorInputStyle : inputStyle} />
              {errors.contactPhone && <div style={errorTextStyle}>{errors.contactPhone}</div>}
            </div>
          </div>

          {/* Billing Contact */}
          <h3 style={{ fontSize: '16px', fontWeight: 600, borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Mail size={18} color="var(--text-gray)" /> Billing Contact <span style={{ fontSize: '12px', color: 'var(--text-gray)', fontWeight: 400 }}>(Optional — defaults to primary contact)</span>
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
            <div>
              <label style={labelStyle}>Billing Contact</label>
              <input type="text" value={billingContact} onChange={e => setBillingContact(e.target.value)} placeholder="Full Name" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Billing Email</label>
              <input type="email" value={billingEmail} onChange={e => setBillingEmail(e.target.value)} placeholder="billing@company.in" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Billing Phone</label>
              <input type="tel" value={billingPhone} onChange={e => setBillingPhone(e.target.value)} placeholder="10-digit number" style={inputStyle} />
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 2: Services & Rate Card ────────────────────────── */}
      {step === 2 && (
        <div className="card" style={{ padding: '32px', backgroundColor: '#fff', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings size={20} color="var(--primary-blue)" /> Service Package
          </h3>
          {errors.services && <div style={{ ...errorTextStyle, fontSize: '13px', backgroundColor: '#fef2f2', padding: '10px 16px', borderRadius: '8px', border: '1px solid #fecaca' }}>{errors.services}</div>}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {ALL_SERVICES.map(svc => {
              const isSelected = selectedServices.includes(svc.id);
              return (
                <div
                  key={svc.id}
                  className={`service-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => toggleService(svc.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-dark)' }}>{svc.name}</span>
                    <div style={{
                      width: '22px', height: '22px', borderRadius: '50%',
                      border: isSelected ? 'none' : '2px solid var(--border-color)',
                      backgroundColor: isSelected ? 'var(--primary-blue)' : '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {isSelected && <Check size={14} color="#fff" strokeWidth={3} />}
                    </div>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-gray)', marginBottom: '12px' }}>{svc.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── STEP 3: HR Account Setup ─────────────────────────────── */}
      {step === 3 && (
        <div className="card" style={{ padding: '32px', backgroundColor: '#fff', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={20} color="var(--primary-blue)" /> HR Account Setup
            </h3>
            <button className="btn btn-outline" onClick={addHrAccount} style={{ fontSize: '12px', padding: '6px 12px' }}>
              <Plus size={14} style={{ marginRight: '4px' }} /> Add HR Account
            </button>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-gray)' }}>These credentials will allow the client's HR team to log in, create employee verification requests, and track progress.</p>

          {hrAccounts.map((hr, i) => (
            <div key={i} style={{ padding: '20px', border: '1px solid var(--border-color)', borderRadius: '10px', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-dark)' }}>HR Account #{i + 1}</span>
                {hrAccounts.length > 1 && (
                  <button onClick={() => removeHrAccount(i)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600 }}>
                    <Trash2 size={14} /> Remove
                  </button>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Full Name *</label>
                  <input type="text" value={hr.name} onChange={e => updateHrField(i, 'name', e.target.value)} placeholder="HR Contact Name" style={errors[`hr_name_${i}`] ? errorInputStyle : inputStyle} />
                  {errors[`hr_name_${i}`] && <div style={errorTextStyle}>{errors[`hr_name_${i}`]}</div>}
                </div>
                <div>
                  <label style={labelStyle}>Email Address *</label>
                  <input type="email" value={hr.email} onChange={e => updateHrField(i, 'email', e.target.value)} placeholder="hr@company.in" style={errors[`hr_email_${i}`] ? errorInputStyle : inputStyle} />
                  {errors[`hr_email_${i}`] && <div style={errorTextStyle}>{errors[`hr_email_${i}`]}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── STEP 4: Review ───────────────────────────────────────── */}
      {step === 4 && (
        <div className="card" style={{ padding: '32px', backgroundColor: '#fff', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={20} color="var(--primary-blue)" /> Review & Confirm
          </h3>

          {/* Company Info Summary */}
          <div style={{ padding: '20px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Building2 size={14} /> Company Information
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              {[
                ['Company Name', companyName],
                ['HQ', hq],
                ['Industry', industry],
                ['GST', gstNumber || '—'],
                ['Contact', contactPerson],
                ['Email', contactEmail],
                ['Phone', contactPhone],
              ].map(([l, v]) => (
                <div key={l}><span style={{ fontSize: '11px', color: 'var(--text-gray)' }}>{l}</span><div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-dark)', marginTop: '2px' }}>{v}</div></div>
              ))}
            </div>
          </div>

          {/* Services Summary */}
          <div style={{ padding: '20px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Settings size={14} /> Services
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {selectedServices.map(svc => (
                <div key={svc} style={{ padding: '10px 12px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-dark)' }}>{svc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* HR Accounts Summary */}
          <div style={{ padding: '20px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Users size={14} /> HR Accounts
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {hrAccounts.map((hr, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-dark)' }}>{hr.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-gray)' }}>{hr.email}</div>
                  </div>
                  <span className="badge badge-completed" style={{ padding: '4px 12px' }}>{hr.role}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── FOOTER ACTIONS ───────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          {step > 1 && (
            <button className="btn btn-outline" onClick={() => setStep(step - 1)} style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#fff' }}>
              <ArrowLeft size={16} /> Back
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-outline" onClick={() => navigate('/ops/clients')} style={{ color: '#dc2626', borderColor: '#fee2e2', backgroundColor: '#fff' }}>
            Cancel
          </button>
          {step < 4 ? (
            <button className="btn btn-primary" onClick={handleNext} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              Next <ArrowRight size={16} />
            </button>
          ) : (
            <button className="btn btn-primary" onClick={handleCreate} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} /> Create Client Account
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
