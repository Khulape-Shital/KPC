import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { OperationsManagerLayout } from './layouts/OperationsManagerLayout';
import { ClientHRLayout } from './layouts/ClientHRLayout';
import { ExecutiveLayout } from './layouts/ExecutiveLayout';
import { EmployeeForms } from './pages/EmployeeForms';
import { ClientAccounts } from './pages/ClientAccounts';
import { ClientDetails } from './pages/ClientDetails';
import { VerificationTracking } from './pages/VerificationTracking';
import { ExecutiveMonitoring } from './pages/ExecutiveMonitoring';
import { ExecutiveDetails } from './pages/ExecutiveDetails';
import { Dashboard as HRDashboard } from './pages/hr/Dashboard';
import { Dashboard as OpsDashboard } from './pages/ops/Dashboard';
import { EmployeeList as HREmployeeList } from './pages/hr/EmployeeList';
import { CreateEmployee as HRCreateEmployee } from './pages/hr/CreateEmployee';
import { EmployeeDetails as HREmployeeDetails } from './pages/hr/EmployeeDetails';
import { VerificationTracking as HRTracking } from './pages/hr/VerificationTracking';
import { Notifications as HRNotifications } from './pages/hr/Notifications';
import { Dashboard as ExecDashboard } from './pages/exec/Dashboard';
import { AvailableTasks as ExecAvailableTasks } from './pages/exec/AvailableTasks';
import { MyTasks as ExecMyTasks } from './pages/exec/MyTasks';
import { VerificationWorkspace as ExecWorkspace } from './pages/exec/VerificationWorkspace';
import { CallLogs as ExecCallLogs } from './pages/exec/CallLogs';
// import { VerificationTimeline as ExecTimeline } from './pages/exec/VerificationTimeline';
import { CompletedCases as ExecCompleted } from './pages/exec/CompletedCases';
import { AccountantLayout } from './layouts/AccountantLayout';
import { AccountantDashboard } from './pages/accountant/Dashboard';
import { Invoices as AccInvoicesPage } from './pages/accountant/Invoices';
import { CreateClient } from './pages/CreateClient';
import { HRChangePassword } from "./pages/hr/ChangePassword";
// import { mockDb } from './utils/mockDb';
import { supabase } from './utils/supabase';
import { ShieldCheck, UserCheck, ShieldAlert, LogIn, ArrowRight, BadgeIndianRupee, Eye, EyeOff, Building, Mail, Lock, Activity, Users, Settings, Layers, Search, MapPin, RefreshCw } from 'lucide-react';
import VerificationFlowDiagram from './components/common/VerificationFlowDiagram';

// Initialize Mock Database
// mockDb.init();

// Login Screen Component
const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // const handleLogin = async (e) => {
  //   e.preventDefault();

  //   // HR Login
  //   if (password === "hr@123") {
  //     if (supabase) {
  //       try {
  //         const { data: hrUser, error: hrError } = await supabase
  //           .from("hr_accounts")
  //           .select("*")
  //           .eq("email", username)
  //           .single();

  //         if (hrUser && !hrError) {
  //           const { data: company } = await supabase
  //             .from("companies")
  //             .select("*")
  //             .eq("id", hrUser.company_id)
  //             .single();

  // sessionStorage.setItem(
  //   "kpc_session",
  //   JSON.stringify({
  //     role: "hr",
  //     clientId: hrUser.company_id,
  //     company: company?.company_name || 'Client Company',
  //     hrName: hrUser.name,
  //     email: hrUser.email
  //   })
  // );

  //           navigate("/hr/dashboard");
  //           return;
  //         }
  //       } catch (err) {
  //         console.error("Supabase login error:", err);
  //       }
  //     } else {
  //       console.warn("Supabase is not configured. Falling back to mockDb for HR login.");
  //     }
  //   }

  //   const session = mockDb.login(username, password);
  //   if (session) {
  //     if (session.role === 'admin') navigate('/admin/dashboard');
  //     else if (session.role === 'ops') navigate('/ops/dashboard');
  //     else if (session.role === 'hr') navigate('/hr/dashboard');
  //     else if (session.role === 'exec') navigate('/exec/dashboard');
  //     else if (session.role === 'accountant') navigate('/accountant/dashboard');
  //     else navigate('/');
  //   } else {
  //     setError('Invalid username or password');
  //   }
  // };


  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");

    // HR LOGIN
    // if (password === "hr@123") {

    //   const { data: hrUser } = await supabase
    //     .from("hr_accounts")
    //     .select("*")
    //     .eq("email", username)
    //     .single();

    //   if (hrUser) {

    //     const { data: company } = await supabase
    //       .from("companies")
    //       .select("*")
    //       .eq("id", hrUser.company_id)
    //       .single();

    //     localStorage.setItem(
    //       "kpc_session",
    //       JSON.stringify({
    //         role: "hr",
    //         clientId: hrUser.company_id,
    //         company: company?.company_name,
    //         userName: hrUser.name,
    //         email: hrUser.email
    //       })
    //     );

    //     navigate("/hr/dashboard");
    //     return;
    //   }
    // }

    // HR LOGIN

    const { data: hrUser } = await supabase
      .from("hr_accounts")
      .select("*")
      .eq("email", username)
      .single();

    if (hrUser) {

      if (password !== hrUser.password) {
        setError("Invalid username or password");
        return;
      }

      const { data: company } = await supabase
        .from("companies")
        .select("*")
        .eq("id", hrUser.company_id)
        .single();

      localStorage.setItem(
        "kpc_session",
        JSON.stringify({
          role: "hr",
          hrId: hrUser.id,
          clientId: hrUser.company_id,
          company: company?.company_name,
          userName: hrUser.name,
          email: hrUser.email
        })
      );

      // First Login
      if (!hrUser.password_changed) {

        navigate("/hr/change-password");

      } else {

        navigate("/hr/dashboard");

      }

      return;
    }

    // EXECUTIVE LOGIN

    if (password === "exec@123") {

      const { data: execUser } = await supabase
        .from("executives")
        .select("*")
        .eq("email", username)
        .single();

      if (execUser) {

        localStorage.setItem(
          "kpc_session",
          JSON.stringify({
            role: "exec",
            userId: execUser.id,
            userName: execUser.full_name,
            email: execUser.email
          })
        );

        navigate("/exec/dashboard");
        return;
      }
    }
    // OPERATION MANAGER LOGIN
    const { data: opsUser } = await supabase
      .from("users")
      .select("*")
      .eq("email", username)
      .eq("role", "ops")
      .single();

    if (opsUser) {
      if (password !== opsUser.password_hash && password !== "Ops@123") {
        setError("Invalid username or password");
        return;
      }

      localStorage.setItem(
        "kpc_session",
        JSON.stringify({
          role: "ops",
          userId: opsUser.id,
          userName: opsUser.name,
          email: opsUser.email
        })
      );

      navigate("/ops/dashboard");
      return;
    }

    setError("Invalid username or password");
  };
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#ffffff', fontFamily: '"Inter", sans-serif' }}>
      {/* Left Side */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 8%', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', backgroundColor: '#f0f4ff', borderRadius: '10px', color: '#4f46e5' }}>
            <Building size={22} strokeWidth={2.5} />
          </div>
          <span style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>KPC</span>
        </div>

        <h1 style={{ marginTop: 0, fontSize: '42px', fontWeight: 800, color: '#0f172a', marginBottom: '16px', letterSpacing: '-0.5px' }}>
          Welcome back.
        </h1>
        <p style={{ fontSize: '16px', color: '#64748b', marginBottom: '48px', lineHeight: 1.5, maxWidth: '400px' }}>
          Log in to manage employee verifications and track field operations.
        </p>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '400px' }}>
          {error && (
            <div style={{ padding: '12px', backgroundColor: '#fef2f2', color: '#ef4444', borderRadius: '8px', fontSize: '14px', border: '1px solid #fee2e2' }}>
              {error}
            </div>
          )}
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Work Email
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} color="#94a3b8" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="name@company.com"
                style={{
                  width: '100%', padding: '14px 16px 14px 44px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '15px', color: '#0f172a', outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s', boxSizing: 'border-box'
                }}
                onFocus={e => { e.target.style.borderColor = '#4f46e5'; e.target.style.boxShadow = '0 0 0 3px rgba(79, 70, 229, 0.1)'; }}
                onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} color="#94a3b8" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%', padding: '14px 44px 14px 44px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '15px', color: '#0f172a', outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s', boxSizing: 'border-box'
                }}
                onFocus={e => { e.target.style.borderColor = '#4f46e5'; e.target.style.boxShadow = '0 0 0 3px rgba(79, 70, 229, 0.1)'; }}
                onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0, display: 'flex' }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            style={{
              marginTop: '8px', width: '100%', padding: '14px', backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 600, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', transition: 'background-color 0.2s, transform 0.1s'
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#4338ca'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#4f46e5'}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <span>Continue</span>
            <ArrowRight size={18} />
          </button>
        </form>
      </div>

      {/* Right Side Illustration */}
      <div style={{ flex: 1, backgroundColor: '#fcfcfc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', position: 'relative' }}>
        <div style={{ width: '100%', maxWidth: '640px', backgroundColor: '#ffffff', borderRadius: '32px', padding: '48px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(0,0,0,0.02)', position: 'relative', overflow: 'hidden' }}>
          
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', backgroundColor: '#f0f4ff', borderRadius: '100px', color: '#4f46e5', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '24px' }}>
            <Activity size={14} />
            <span>System Orchestration</span>
          </div>

          <h2 style={{ fontSize: '36px', fontWeight: 800, color: '#0f172a', lineHeight: 1.1, marginBottom: '16px', letterSpacing: '-0.5px' }}>
            Coordinate your entire<br />
            <span style={{ color: '#4f46e5' }}>Verification lifecycle.</span>
          </h2>
          
          <p style={{ fontSize: '15px', color: '#64748b', marginBottom: '40px', maxWidth: '380px', lineHeight: 1.5 }}>
            A unified workspace for HR submissions, operations management, and field verification.
          </p>

          <VerificationFlowDiagram />
        </div>

        <div style={{ position: 'absolute', bottom: '24px', left: 0, right: 0, textAlign: 'center', fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>
          Designed & developed by <span style={{ fontWeight: 600, color: '#64748b' }}>Triple S production</span>
        </div>
      </div>
    </div>
  );
};

// Placeholder components for HR screens that will be built in order
const HREmployees = () => (
  <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
    <h2>Employee List (Screen 2)</h2>
    <p style={{ color: 'var(--text-gray)', marginTop: '8px' }}>This module is currently being prepared. Click 'Dashboard' to review progress.</p>
  </div>
);








// OpsDashboard is now imported







const AccDashboard = () => <div className="card" style={{ padding: '32px' }}><h2>Accountant Dashboard Placeholder</h2></div>;

const AccPayments = () => <div className="card" style={{ padding: '32px' }}><h2>Payments</h2></div>;
const AccBilling = () => <div className="card" style={{ padding: '32px' }}><h2>Client Billing</h2></div>;
const AccReports = () => <div className="card" style={{ padding: '32px' }}><h2>Revenue Reports</h2></div>;

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', background: '#fee2e2', color: '#991b1b', fontFamily: 'monospace' }}>
          <h2>Something went wrong.</h2>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  useEffect(() => {
    const testSupabase = async () => {
      if (!supabase) {
        console.log('Supabase client is not initialized.');
        return;
      }
      try {
        const { data, error } = await supabase.from('companies').select('*');
        console.log('SUPABASE DATA:', data);
        console.log('SUPABASE ERROR:', error);
      } catch (err) {
        console.error('Supabase test error:', err);
      }
    }
    testSupabase();
  }, [])
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />

          {/* Operations Manager Routes */}
          <Route path="/ops" element={<OperationsManagerLayout />}>
            <Route path="dashboard" element={<OpsDashboard />} />
            <Route path="forms" element={<EmployeeForms />} />
            <Route path="clients" element={<ClientAccounts />} />
            <Route path="clients/create" element={<CreateClient />} />
            <Route path="clients/:id/edit" element={<CreateClient />} />
            <Route path="clients/:id" element={<ClientDetails />} />
            <Route path="tracking" element={<VerificationTracking />} />
            <Route path="monitoring" element={<ExecutiveMonitoring />} />
            <Route path="monitoring/:id" element={<ExecutiveDetails />} />
          </Route>

          {/* Client HR Routes */}
          <Route
            path="/hr/change-password"
            element={<HRChangePassword />}
          />
          <Route path="/hr" element={<ClientHRLayout />}>
            <Route path="dashboard" element={<HRDashboard />} />
            <Route path="employees" element={<HREmployeeList />} />
            <Route path="employees/create" element={<HRCreateEmployee />} />
            <Route path="employees/:id/edit" element={<HRCreateEmployee />} />
            <Route path="employees/:id" element={<HREmployeeDetails />} />
            <Route path="tracking" element={<HRTracking />} />
            <Route path="notifications" element={<HRNotifications />} />
          </Route>

          {/* Verification Executive Module */}
          <Route path="/exec" element={<ExecutiveLayout />}>
            <Route path="dashboard" element={<ExecDashboard />} />
            <Route path="tasks/available" element={<ExecAvailableTasks />} />
            <Route path="tasks/mine" element={<ExecMyTasks />} />
            <Route path="workspace/:id" element={<ExecWorkspace />} />
            <Route path="calls" element={<ExecCallLogs />} />
            {/* <Route path="timeline" element={<ExecTimeline />} /> */}
            <Route path="completed" element={<ExecCompleted />} />
          </Route>

          <Route path="/accountant" element={<AccountantLayout />}>
            <Route path="dashboard" element={<AccountantDashboard />} />
            <Route path="invoices" element={<AccInvoicesPage />} />
            <Route path="payments" element={<AccPayments />} />
            <Route path="billing" element={<AccBilling />} />
            <Route path="reports" element={<AccReports />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
