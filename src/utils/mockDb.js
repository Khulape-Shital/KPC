// Mock Database for KPC Verification Management System

const INITIAL_USERS = [
  { id: 'U-001', username: 'admin', password: 'admin@123', role: 'admin', name: 'System Admin' },
  { id: 'U-002', username: 'operation', password: 'Ops@123', role: 'ops', name: 'Operations Manager' }
];

const INITIAL_CLIENTS = [
  {
    id: 'C-001',
    name: 'TechCorp Solutions',
    hq: 'Bangalore',
    industry: 'IT Services',
    gstNumber: '29AABCT1234A1Z5',
    contactPerson: 'Vikram Singh',
    contactEmail: 'vikram@techcorp.in',
    contactPhone: '9876543210',
    billingContact: 'Neha Gupta',
    billingEmail: 'finance@techcorp.in',
    billingPhone: '9876511111',
    services: ['Identity Verification', 'Address Verification', 'Police Verification', 'Background Verification'],
    rateCard: { 'Identity Verification': 300, 'Address Verification': 800, 'Police Verification': 500, 'Background Verification': 1500 },
    status: 'Active',
    createdDate: '2025-01-10T10:00:00.000Z',
    hrAccounts: [
      { id: 'HR-001', name: 'Priya Sharma', email: 'priya@techcorp.in', role: 'Primary HR', status: 'Active', lastLogin: '2026-06-16T09:41:00.000Z' },
      { id: 'HR-002', name: 'Rahul Desai', email: 'rahul@techcorp.in', role: 'Secondary HR', status: 'Locked', lastLogin: '2025-10-01T09:00:00.000Z' }
    ],
    timeline: [
      { event: 'Client Onboarded', user: 'Operations Manager', date: '2025-01-10T10:00:00.000Z' },
      { event: 'HR Account Created (Priya Sharma)', user: 'Operations Manager', date: '2025-01-10T11:00:00.000Z' },
      { event: 'HR Account Created (Rahul Desai)', user: 'Operations Manager', date: '2025-02-15T09:00:00.000Z' },
      { event: 'Account Locked (Rahul Desai)', user: 'System', date: '2025-10-24T10:14:00.000Z' }
    ]
  },
  {
    id: 'C-002',
    name: 'Vertex Group',
    hq: 'Mumbai',
    industry: 'Finance',
    gstNumber: '27AABCV5678B2Z3',
    contactPerson: 'Arjun Mehta',
    contactEmail: 'arjun@vertexgroup.in',
    contactPhone: '9876500001',
    billingContact: 'Deepak Verma',
    billingEmail: 'billing@vertexgroup.in',
    billingPhone: '9876500002',
    services: ['Identity Verification', 'Background Verification', 'Police Verification'],
    rateCard: { 'Identity Verification': 300, 'Background Verification': 1500, 'Police Verification': 500 },
    status: 'Active',
    createdDate: '2025-03-15T10:00:00.000Z',
    hrAccounts: [
      { id: 'HR-003', name: 'Sneha Patel', email: 'sneha@vertexgroup.in', role: 'Primary HR', status: 'Active', lastLogin: '2026-06-15T14:20:00.000Z' },
      { id: 'HR-004', name: 'Kunal Shah', email: 'kunal@vertexgroup.in', role: 'Secondary HR', status: 'Active', lastLogin: '2026-06-14T11:00:00.000Z' }
    ],
    timeline: [
      { event: 'Client Onboarded', user: 'Operations Manager', date: '2025-03-15T10:00:00.000Z' }
    ]
  },
  {
    id: 'C-003',
    name: 'Innovate Global',
    hq: 'Delhi',
    industry: 'Manufacturing',
    gstNumber: '07AABCI9012C3Z1',
    contactPerson: 'Ritu Kapoor',
    contactEmail: 'ritu@innovateglobal.in',
    contactPhone: '9876500003',
    billingContact: 'Ritu Kapoor',
    billingEmail: 'ritu@innovateglobal.in',
    billingPhone: '9876500003',
    services: ['Police Verification', 'Address Verification'],
    rateCard: { 'Police Verification': 500, 'Address Verification': 800 },
    status: 'Active',
    createdDate: '2025-06-01T10:00:00.000Z',
    hrAccounts: [
      { id: 'HR-005', name: 'Amit Joshi', email: 'amit@innovateglobal.in', role: 'Primary HR', status: 'Active', lastLogin: '2026-06-10T09:00:00.000Z' }
    ],
    timeline: [
      { event: 'Client Onboarded', user: 'Operations Manager', date: '2025-06-01T10:00:00.000Z' }
    ]
  },
  {
    id: 'C-004',
    name: 'FinServe Banking',
    hq: 'Pune',
    industry: 'Banking & Finance',
    gstNumber: '27AABCF3456D4Z9',
    contactPerson: 'Meera Jain',
    contactEmail: 'meera@finserve.in',
    contactPhone: '9876500004',
    billingContact: 'Suresh Kumar',
    billingEmail: 'accounts@finserve.in',
    billingPhone: '9876500005',
    services: ['Identity Verification', 'Address Verification', 'Background Verification'],
    rateCard: { 'Identity Verification': 300, 'Address Verification': 800, 'Background Verification': 1200 },
    status: 'Active',
    createdDate: '2025-04-20T10:00:00.000Z',
    hrAccounts: [
      { id: 'HR-006', name: 'Pooja Nair', email: 'pooja@finserve.in', role: 'Primary HR', status: 'Active', lastLogin: '2026-06-16T11:30:00.000Z' }
    ],
    timeline: [
      { event: 'Client Onboarded', user: 'Operations Manager', date: '2025-04-20T10:00:00.000Z' }
    ]
  },
  {
    id: 'C-005',
    name: 'Global Services Ltd',
    hq: 'Hyderabad',
    industry: 'Consulting',
    gstNumber: '36AABCG7890E5Z7',
    contactPerson: 'Shalini Rao',
    contactEmail: 'shalini@globalservices.in',
    contactPhone: '9876500006',
    billingContact: 'Shalini Rao',
    billingEmail: 'accounting@globalservices.in',
    billingPhone: '9876500007',
    services: ['Address Verification', 'Police Verification'],
    rateCard: { 'Address Verification': 800, 'Police Verification': 500 },
    status: 'Active',
    createdDate: '2025-07-10T10:00:00.000Z',
    hrAccounts: [
      { id: 'HR-007', name: 'Varun Thakur', email: 'varun@globalservices.in', role: 'Primary HR', status: 'Active', lastLogin: '2026-06-12T10:15:00.000Z' }
    ],
    timeline: [
      { event: 'Client Onboarded', user: 'Operations Manager', date: '2025-07-10T10:00:00.000Z' }
    ]
  },
  {
    id: 'C-006',
    name: 'Nexus Corp',
    hq: 'Chennai',
    industry: 'Healthcare',
    gstNumber: '33AABCN1111F1Z1',
    contactPerson: 'Karan Mehra',
    contactEmail: 'karan@nexuscorp.in',
    contactPhone: '9876522222',
    billingContact: 'Anjali Desai',
    billingEmail: 'billing@nexuscorp.in',
    billingPhone: '9876522223',
    services: ['Background Verification', 'Identity Verification'],
    rateCard: { 'Background Verification': 1500, 'Identity Verification': 300 },
    status: 'Active',
    createdDate: '2025-08-12T10:00:00.000Z',
    hrAccounts: [
      { id: 'HR-008', name: 'Rohan Gupta', email: 'rohan@nexuscorp.in', role: 'Primary HR', status: 'Active', lastLogin: '2026-06-11T09:30:00.000Z' }
    ],
    timeline: [
      { event: 'Client Onboarded', user: 'Operations Manager', date: '2025-08-12T10:00:00.000Z' }
    ]
  },
  {
    id: 'C-007',
    name: 'Alpha Logistics',
    hq: 'Noida',
    industry: 'Logistics',
    gstNumber: '09AABCA2222G2Z2',
    contactPerson: 'Simran Kaur',
    contactEmail: 'simran@alphalogistics.in',
    contactPhone: '9876533333',
    billingContact: 'Amit Singh',
    billingEmail: 'finance@alphalogistics.in',
    billingPhone: '9876533334',
    services: ['Police Verification', 'Address Verification'],
    rateCard: { 'Police Verification': 500, 'Address Verification': 800 },
    status: 'Active',
    createdDate: '2025-09-05T10:00:00.000Z',
    hrAccounts: [
      { id: 'HR-009', name: 'Vivek Sharma', email: 'vivek@alphalogistics.in', role: 'Primary HR', status: 'Active', lastLogin: '2026-06-13T10:00:00.000Z' }
    ],
    timeline: [
      { event: 'Client Onboarded', user: 'Operations Manager', date: '2025-09-05T10:00:00.000Z' }
    ]
  },
  {
    id: 'C-008',
    name: 'Pinnacle Edu',
    hq: 'Kolkata',
    industry: 'Education',
    gstNumber: '19AABCP3333H3Z3',
    contactPerson: 'Aditi Bose',
    contactEmail: 'aditi@pinnacleedu.in',
    contactPhone: '9876544444',
    billingContact: 'Rahul Roy',
    billingEmail: 'accounts@pinnacleedu.in',
    billingPhone: '9876544445',
    services: ['Identity Verification', 'Background Verification'],
    rateCard: { 'Identity Verification': 300, 'Background Verification': 1200 },
    status: 'Active',
    createdDate: '2025-10-20T10:00:00.000Z',
    hrAccounts: [
      { id: 'HR-010', name: 'Snehasish Sen', email: 'snehasish@pinnacleedu.in', role: 'Primary HR', status: 'Active', lastLogin: '2026-06-14T11:20:00.000Z' }
    ],
    timeline: [
      { event: 'Client Onboarded', user: 'Operations Manager', date: '2025-10-20T10:00:00.000Z' }
    ]
  },
  {
    id: 'C-009',
    name: 'Quantum Tech',
    hq: 'Gurgaon',
    industry: 'IT Services',
    gstNumber: '06AABCQ4444I4Z4',
    contactPerson: 'Nitin Jain',
    contactEmail: 'nitin@quantumtech.in',
    contactPhone: '9876555555',
    billingContact: 'Priya Ahuja',
    billingEmail: 'billing@quantumtech.in',
    billingPhone: '9876555556',
    services: ['Address Verification', 'Identity Verification', 'Police Verification'],
    rateCard: { 'Address Verification': 800, 'Identity Verification': 300, 'Police Verification': 500 },
    status: 'Active',
    createdDate: '2025-11-15T10:00:00.000Z',
    hrAccounts: [
      { id: 'HR-011', name: 'Manish Kumar', email: 'manish@quantumtech.in', role: 'Primary HR', status: 'Active', lastLogin: '2026-06-15T09:15:00.000Z' }
    ],
    timeline: [
      { event: 'Client Onboarded', user: 'Operations Manager', date: '2025-11-15T10:00:00.000Z' }
    ]
  },
  {
    id: 'C-010',
    name: 'Zeith Pharma',
    hq: 'Ahmedabad',
    industry: 'Pharmaceuticals',
    gstNumber: '24AABCZ5555J5Z5',
    contactPerson: 'Saurabh Patel',
    contactEmail: 'saurabh@zeithpharma.in',
    contactPhone: '9876566666',
    billingContact: 'Bhavna Shah',
    billingEmail: 'finance@zeithpharma.in',
    billingPhone: '9876566667',
    services: ['Background Verification', 'Police Verification'],
    rateCard: { 'Background Verification': 1500, 'Police Verification': 500 },
    status: 'Active',
    createdDate: '2025-12-01T10:00:00.000Z',
    hrAccounts: [
      { id: 'HR-012', name: 'Kiran Desai', email: 'kiran@zeithpharma.in', role: 'Primary HR', status: 'Active', lastLogin: '2026-06-16T10:45:00.000Z' }
    ],
    timeline: [
      { event: 'Client Onboarded', user: 'Operations Manager', date: '2025-12-01T10:00:00.000Z' }
    ]
  }
];

export const mockDb = {
  init: () => {
    if (!localStorage.getItem('kpc_users')) {
      localStorage.setItem('kpc_users', JSON.stringify(INITIAL_USERS));
    }
    if (!localStorage.getItem('kpc_employees')) localStorage.setItem('kpc_employees', JSON.stringify([]));
    if (!localStorage.getItem('kpc_notifications')) localStorage.setItem('kpc_notifications', JSON.stringify([]));
    if (!localStorage.getItem('kpc_invoices')) localStorage.setItem('kpc_invoices', JSON.stringify([]));
    if (!localStorage.getItem('kpc_payments')) localStorage.setItem('kpc_payments', JSON.stringify([]));
    if (!localStorage.getItem('kpc_financial_closing')) localStorage.setItem('kpc_financial_closing', JSON.stringify([]));
    if (!localStorage.getItem('kpc_financial_activity')) localStorage.setItem('kpc_financial_activity', JSON.stringify([]));
    if (!localStorage.getItem('kpc_clients') || localStorage.getItem('kpc_clients') === '[]') localStorage.setItem('kpc_clients', JSON.stringify(INITIAL_CLIENTS));
    if (!localStorage.getItem('kpc_executives')) {
      const INITIAL_EXECS = [
        { id: 'EX-01', name: 'Amitabh S.', email: 'amitabh@kpc.com', status: 'Active', designation: 'Senior Executive', cases: 28, completed: 8, pendingCalls: 3, avgTime: '2.4 Days', sla: '98%', rank: 1, alert: 'Overloaded' },
        { id: 'EX-02', name: 'Sanjay V.', email: 'sanjay@kpc.com', status: 'Active', designation: 'Executive', cases: 22, completed: 4, pendingCalls: 12, avgTime: '4.1 Days', sla: '82%', rank: 4, alert: 'SLA Risk' },
        { id: 'EX-03', name: 'Neha Gupta', email: 'neha@kpc.com', status: 'Active', designation: 'Lead Executive', cases: 5, completed: 12, pendingCalls: 0, avgTime: '1.8 Days', sla: '100%', rank: 2, alert: 'Underutilized' },
        { id: 'EX-04', name: 'Ravi Kumar', email: 'ravi@kpc.com', status: 'Active', designation: 'Executive', cases: 18, completed: 5, pendingCalls: 8, avgTime: '3.5 Days', sla: '88%', rank: 3 }
      ];
      localStorage.setItem('kpc_executives', JSON.stringify(INITIAL_EXECS));
    }
    if (!localStorage.getItem('kpc_ops_accounts')) localStorage.setItem('kpc_ops_accounts', JSON.stringify([]));
    if (!localStorage.getItem('kpc_accountant_accounts')) localStorage.setItem('kpc_accountant_accounts', JSON.stringify([]));
    if (!localStorage.getItem('kpc_session')) sessionStorage.setItem('kpc_session', JSON.stringify(null));
  },

  // Auth / Session Management
  login: (username, password) => {
    mockDb.init();

    // Check main users first (admin, ops)
    const users = JSON.parse(localStorage.getItem('kpc_users') || '[]');
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      const session = { role: user.role, userId: user.id, userName: user.name };
      sessionStorage.setItem("kpc_session", JSON.stringify(session));
      return session;
    }

    // HR Login (username = email, password = hr@123)
    const clients = mockDb.getClients();
    for (const client of clients) {
      const hr = (client.hrAccounts || []).find(h => h.email === username && h.status === 'Active');
      if (hr && password === 'hr@123') {
        const session = { role: 'hr', userId: hr.id, userName: hr.name, email: hr.email, company: client.name, clientId: client.id, hrRole: hr.role };
        sessionStorage.setItem("kpc_session", JSON.stringify(session));
        return session;
      }
    }

    // Exec Login (username = email, password = exec@123)
    const execs = mockDb.getExecutives();
    const exec = execs.find(e => e.email === username && e.status === 'Active');
    if (exec && password === 'exec@123') {
      const session = { role: 'exec', userId: exec.id, userName: exec.name, email: exec.email, designation: exec.designation };
      sessionStorage.setItem("kpc_session", JSON.stringify(session));
      return session;
    }

    return null; // Invalid credentials
  },

  getSession: () => {
    return JSON.parse(sessionStorage.getItem('kpc_session') || 'null');
  },

  logout: () => {
    sessionStorage.removeItem('kpc_session');
  },

  getCurrentUser: () => {
    return JSON.parse(sessionStorage.getItem('kpc_session'));
  },

  // Employee Operations
  getEmployees: () => { mockDb.init(); return JSON.parse(sessionStorage.getItem('kpc_employees') || '[]'); },
  saveEmployees: (employees) => { sessionStorage.setItem('kpc_employees', JSON.stringify(employees)); },
  getEmployeeById: (id) => { const employees = mockDb.getEmployees(); return employees.find(emp => emp.id === id); },
  addEmployee: (employee) => {
    const employees = mockDb.getEmployees();
    employees.unshift(employee);
    mockDb.saveEmployees(employees);
    mockDb.addNotification({
      type: employee.status === 'draft' ? 'draft' : 'upload',
      title: employee.status === 'draft' ? 'Draft Form Saved' : 'Document Uploaded & Submitted',
      message: employee.status === 'draft' ? `Draft form for ${employee.name} was saved.` : `Employee details and documents for ${employee.name} have been submitted.`,
      employeeId: employee.id,
      employeeName: employee.name
    });
    return employee;
  },
  updateEmployee: (id, updatedFields) => {
    const employees = mockDb.getEmployees();
    const index = employees.findIndex(emp => emp.id === id);
    if (index !== -1) {
      employees[index] = { ...employees[index], ...updatedFields };
      mockDb.saveEmployees(employees);
      return employees[index];
    }
    return null;
  },
  deleteEmployee: (id) => {
    const employees = mockDb.getEmployees();
    const filtered = employees.filter(emp => emp.id !== id);
    mockDb.saveEmployees(filtered);
  },

  // Notification Operations
  getNotifications: () => { mockDb.init(); return JSON.parse(localStorage.getItem('kpc_notifications') || '[]'); },
  saveNotifications: (notifications) => { localStorage.setItem('kpc_notifications', JSON.stringify(notifications)); },
  addNotification: (notification) => {
    const notifications = mockDb.getNotifications();
    const newNotif = { id: `notif-${Date.now()}`, timestamp: new Date().toISOString(), read: false, ...notification };
    notifications.unshift(newNotif);
    mockDb.saveNotifications(notifications);
    return newNotif;
  },
  markNotificationAsRead: (id) => {
    const notifications = mockDb.getNotifications();
    const updated = notifications.map(notif => notif.id === id ? { ...notif, read: true } : notif);
    mockDb.saveNotifications(updated);
  },
  markAllNotificationsAsRead: () => {
    const notifications = mockDb.getNotifications();
    const updated = notifications.map(notif => ({ ...notif, read: true }));
    mockDb.saveNotifications(updated);
  },

  // Invoice Operations
  getInvoices: () => { mockDb.init(); return JSON.parse(localStorage.getItem('kpc_invoices') || '[]'); },
  saveInvoices: (invoices) => { localStorage.setItem('kpc_invoices', JSON.stringify(invoices)); },
  addInvoice: (invoice) => {
    const invoices = mockDb.getInvoices();
    invoices.unshift(invoice);
    mockDb.saveInvoices(invoices);
    mockDb.addFinancialActivity({ event: 'Invoice Generated', desc: `${invoice.id} for ${invoice.clientName} auto-compiled & created`, type: 'invoice' });
    return invoice;
  },
  updateInvoice: (id, updatedFields) => {
    const invoices = mockDb.getInvoices();
    const index = invoices.findIndex(inv => inv.id === id);
    if (index !== -1) {
      invoices[index] = { ...invoices[index], ...updatedFields };
      mockDb.saveInvoices(invoices);
      return invoices[index];
    }
    return null;
  },

  // Payment Operations
  getPayments: () => { mockDb.init(); return JSON.parse(localStorage.getItem('kpc_payments') || '[]'); },
  savePayments: (payments) => { localStorage.setItem('kpc_payments', JSON.stringify(payments)); },
  addPayment: (payment) => {
    const payments = mockDb.getPayments();
    payments.unshift(payment);
    mockDb.savePayments(payments);
    mockDb.addFinancialActivity({ event: 'Payment Recorded', desc: `₹${payment.amount.toLocaleString('en-IN')} received from ${payment.clientName}`, type: 'payment' });
    return payment;
  },

  // Financial Closing Operations
  getFinancialClosing: () => { mockDb.init(); return JSON.parse(localStorage.getItem('kpc_financial_closing') || '{}'); },
  saveFinancialClosing: (closing) => { localStorage.setItem('kpc_financial_closing', JSON.stringify(closing)); },

  // Financial Activity Operations
  getFinancialActivity: () => { mockDb.init(); return JSON.parse(localStorage.getItem('kpc_financial_activity') || '[]'); },
  addFinancialActivity: (activity) => {
    const activities = mockDb.getFinancialActivity();
    const newAct = { id: `act-${Date.now()}`, date: new Date().toISOString(), ...activity };
    activities.unshift(newAct);
    localStorage.setItem('kpc_financial_activity', JSON.stringify(activities.slice(0, 50)));
    return newAct;
  },

  // Client Operations
  getClients: () => { mockDb.init(); return JSON.parse(localStorage.getItem('kpc_clients') || '[]'); },
  saveClients: (clients) => { localStorage.setItem('kpc_clients', JSON.stringify(clients)); },
  getClientById: (id) => { const clients = mockDb.getClients(); return clients.find(c => c.id === id); },
  addClient: (client) => {
    const clients = mockDb.getClients();
    clients.unshift(client);
    mockDb.saveClients(clients);
    return client;
  },
  updateClient: (id, updatedFields) => {
    const clients = mockDb.getClients();
    const index = clients.findIndex(c => c.id === id);
    if (index !== -1) {
      clients[index] = { ...clients[index], ...updatedFields };
      mockDb.saveClients(clients);
      return clients[index];
    }
    return null;
  },
  deleteClient: (id) => {
    const clients = mockDb.getClients();
    const filtered = clients.filter(c => c.id !== id);
    mockDb.saveClients(filtered);
  },
  getNextClientId: () => {
    const clients = mockDb.getClients();
    const maxSeq = clients.reduce((mx, c) => {
      const num = parseInt(c.id.replace('C-', ''), 10);
      return num > mx ? num : mx;
    }, 0);
    return `C-${String(maxSeq + 1).padStart(3, '0')}`;
  },

  // Executive Operations
  getExecutives: () => { mockDb.init(); return JSON.parse(localStorage.getItem('kpc_executives') || '[]'); },
  saveExecutives: (execs) => { localStorage.setItem('kpc_executives', JSON.stringify(execs)); },
  addExecutive: (exec) => {
    const execs = mockDb.getExecutives();
    execs.unshift(exec);
    mockDb.saveExecutives(execs);
    return exec;
  },
  updateExecutive: (id, fields) => {
    const execs = mockDb.getExecutives();
    const idx = execs.findIndex(e => e.id === id);
    if (idx !== -1) {
      execs[idx] = { ...execs[idx], ...fields };
      mockDb.saveExecutives(execs);
      return execs[idx];
    }
    return null;
  },
  deleteExecutive: (id) => {
    const execs = mockDb.getExecutives();
    const filtered = execs.filter(e => e.id !== id);
    mockDb.saveExecutives(filtered);
  },
  getNextExecutiveId: () => {
    const execs = mockDb.getExecutives();
    const maxSeq = execs.reduce((mx, e) => {
      const num = parseInt(e.id.replace('EXEC-', ''), 10);
      return num > mx ? num : mx;
    }, 0);
    return `EXEC-${String(maxSeq + 1).padStart(3, '0')}`;
  }
};
