import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

const isSupabaseConfigured =
  supabaseUrl &&
  supabaseKey &&
  !supabaseUrl.includes('placeholder') &&
  !supabaseKey.includes('placeholder')

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey)
  : null

export const isSupabaseReady = isSupabaseConfigured

export const getSupabaseEmployees = async () => {
  if (!supabase) return [];

  try {
    const { data: dbEmployees, error } = await supabase
      .from("employees")
      .select("*, employee_documents(*), companies(company_name)");

    if (error) {
      console.error(error);
      return [];
    }

    const localData = JSON.parse(
      localStorage.getItem("kpc_supabase_assignments") || "{}"
    );

    return dbEmployees.map((emp) => {
      const docs = (emp.employee_documents || []).map((d) => ({
        type: d.document_type,
        name: d.document_type,
        status: "Uploaded",
        file_url: d.file_url,
        quality: "Uploaded",
        size: "",
      }));

      const localRecord = localData[emp.id] || {};

      return {
        id: emp.id,
        name: emp.full_name,
        employeeCode: emp.employee_code,

        company: emp.companies?.company_name || emp.company_id || "",
        companyId: emp.company_id,

        dob: emp.dob,
        fatherName: emp.father_name,
        motherName: emp.mother_name,
        contactNumber: emp.mobile,

        status: localRecord.status || emp.verification_status,
        verification_status: emp.verification_status,

        createdDate: emp.created_at,
        created_at: emp.created_at,

        // ******** ADD THESE ********
        completed_at: emp.completed_at,
        rejected_at: emp.rejected_at,
        assigned_at: emp.assigned_at,
        // ***************************

        priority: localRecord.priority || "Medium",

        services: emp.services || ["Identity Verification"],
        documents: docs,

        assigned_to: emp.assigned_to,
        assigned_name: emp.assigned_name,

        timeline: localRecord.timeline || [],
        audit: localRecord.audit || [],
        notes: localRecord.notes || "",
      };
    });

  } catch (err) {
    console.error(err);
    return [];
  }
};

export const getSupabaseClients = async () => {
  const { data, error } = await supabase
    .from('companies')   // your Supabase table name
    .select('*');
  if (error) { console.error('Error fetching clients:', error); return []; }
  return data || [];
};

export const getSupabaseEmployeeById = async (id) => {
  if (!supabase) return null;
  try {
    const { data: emp, error } = await supabase
      .from('employees')
      .select('*, employee_documents(*), companies(company_name)')
      .eq('id', id)
      .single();

    if (error) {
      console.error(error);
      return null;
    }

    const localData = JSON.parse(localStorage.getItem('kpc_supabase_assignments') || '{}');
    const docs = (emp.employee_documents || []).map(d => ({
      type: d.document_type,
      name: d.document_type,
      status: 'Uploaded',
      file_url: d.file_url,
      quality: 'Uploaded',
      size: ''
    }));

    const localRecord = localData[emp.id] || {};

    return {
      id: emp.id,
      name: emp.full_name,
      employeeCode: emp.employee_code,
      company: emp.companies?.company_name || emp.company_id || '',
      companyId: emp.company_id,

      dob: emp.dob,
      fatherName: emp.father_name,
      motherName: emp.mother_name,
      contactNumber: emp.mobile,

      status: localRecord.status || emp.verification_status,
      createdDate: emp.created_at,
      priority: localRecord.priority || 'Medium',

      services: emp.services || ['Identity Verification'],
      documents: docs,

      assigned_to: emp.assigned_to,
      assigned_name: emp.assigned_name,
      assigned_at: emp.assigned_at,

      timeline: localRecord.timeline || [],
      audit: localRecord.audit || [],
      notes: localRecord.notes || ''
    };
  } catch (err) {
    console.error(err);
    return null;
  }
};

// export const updateSupabaseEmployee = async (id, updatedFields) => {
//   if (!supabase) return null;
//   try {
//     // 1. Update status in Supabase if verification_status or status is passed
//     const statusToUpdate = updatedFields.status || updatedFields.verification_status;
//     if (statusToUpdate) {
//       await supabase
//         .from('employees')
//         .update({ verification_status: statusToUpdate })
//         .eq('id', id);
//     }

//     // 2. Update local assignments and timelines
//     const localData = JSON.parse(localStorage.getItem('kpc_supabase_assignments') || '{}');
//     const localRecord = localData[id] || { timeline: [], audit: [] };

//     if (updatedFields.status) localRecord.status = updatedFields.status;
//     if (updatedFields.priority) localRecord.priority = updatedFields.priority;
//     if (updatedFields.timeline) localRecord.timeline = updatedFields.timeline;
//     if (updatedFields.audit) localRecord.audit = updatedFields.audit;
//     if (updatedFields.notes) localRecord.notes = updatedFields.notes;

//     localData[id] = localRecord;
//     localStorage.setItem('kpc_supabase_assignments', JSON.stringify(localData));

//     return getSupabaseEmployeeById(id);
//   } catch (err) {
//     console.error(err);
//     return null;
//   }
// };


export const updateSupabaseEmployee = async (id, updatedFields) => {
  if (!supabase) return null;
  try {
    // 1. Build the set of columns that actually belong on the employees table
    const statusToUpdate = updatedFields.status || updatedFields.verification_status;
    const dbUpdate = {};

    if (updatedFields.assigned_to !== undefined)
      dbUpdate.assigned_to = updatedFields.assigned_to;

    if (updatedFields.assigned_name !== undefined)
      dbUpdate.assigned_name = updatedFields.assigned_name;

    if (updatedFields.assigned_at !== undefined)
      dbUpdate.assigned_at = updatedFields.assigned_at;

    // if (statusToUpdate) dbUpdate.verification_status = statusToUpdate;
    // if (updatedFields.rejection_reason !== undefined) dbUpdate.rejection_reason = updatedFields.rejection_reason;
    // if (updatedFields.rejected_by !== undefined) dbUpdate.rejected_by = updatedFields.rejected_by;
    // if (updatedFields.rejected_at !== undefined) dbUpdate.rejected_at = updatedFields.rejected_at;

    if (statusToUpdate)
      dbUpdate.verification_status = statusToUpdate;

    if (updatedFields.rejection_reason !== undefined)
      dbUpdate.rejection_reason = updatedFields.rejection_reason;

    if (updatedFields.rejected_by !== undefined)
      dbUpdate.rejected_by = updatedFields.rejected_by;

    if (updatedFields.rejected_at !== undefined)
      dbUpdate.rejected_at = updatedFields.rejected_at;

    if (updatedFields.completed_at !== undefined)
      dbUpdate.completed_at = updatedFields.completed_at;

    if (updatedFields.assigned_to !== undefined)
      dbUpdate.assigned_to = updatedFields.assigned_to;

    if (updatedFields.assigned_name !== undefined)
      dbUpdate.assigned_name = updatedFields.assigned_name;

    if (updatedFields.assigned_at !== undefined)
      dbUpdate.assigned_at = updatedFields.assigned_at;

    if (Object.keys(dbUpdate).length > 0) {
      const { error } = await supabase
        .from('employees')
        .update(dbUpdate)
        .eq('id', id);

      if (error) {
        console.error('Error updating employee in Supabase:', error);
      }
    }

    // 2. Update local assignments and timelines (unchanged)
    const localData = JSON.parse(localStorage.getItem('kpc_supabase_assignments') || '{}');
    const localRecord = localData[id] || { timeline: [], audit: [] };

    if (updatedFields.status) localRecord.status = updatedFields.status;
    if (updatedFields.priority) localRecord.priority = updatedFields.priority;
    if (updatedFields.timeline) localRecord.timeline = updatedFields.timeline;
    if (updatedFields.audit) localRecord.audit = updatedFields.audit;
    if (updatedFields.notes) localRecord.notes = updatedFields.notes;

    localData[id] = localRecord;
    localStorage.setItem('kpc_supabase_assignments', JSON.stringify(localData));

    return getSupabaseEmployeeById(id);
  } catch (err) {
    console.error(err);
    return null;
  }
};