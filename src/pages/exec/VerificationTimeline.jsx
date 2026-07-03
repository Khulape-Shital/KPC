// import React, { useState, useEffect, useMemo } from 'react';
// import {
//   Clock,
//   Search,
//   Filter,
//   Calendar,
//   BarChart3,
//   CheckCircle2,
//   XCircle,
//   AlertTriangle,
//   Eye,
//   X,
//   FileText,
//   PhoneCall,
//   KeyRound,
//   Globe,
//   BookOpen,
//   UserCheck,
//   Inbox,
//   ShieldCheck,
//   Briefcase
// } from 'lucide-react';

// // import { mockDb } from '../../utils/mockDb';
// import { getSupabaseEmployees } from '../../utils/supabase';

// export const VerificationTimeline = () => {
//   const [allEvents, setAllEvents] = useState([]);
//   const [cases, setCases] = useState([]);

//   // View State: 'global' | 'case' | 'daily'
//   const [currentView, setCurrentView] = useState('global');
//   const [selectedCaseId, setSelectedCaseId] = useState('All');

//   // Filters
//   const [searchTerm, setSearchTerm] = useState('');
//   const [eventTypeFilter, setEventTypeFilter] = useState('All');

//   // Drawer
//   const [selectedEvent, setSelectedEvent] = useState(null);

//   const session = JSON.parse(localStorage.getItem("kpc_session")) || {};

//   const EXEC_NAME =
//     session.userName ||
//     session.name ||
//     "";

//   console.log(session);

//   const fetchTimelineData = async () => {
//     const employees = await getSupabaseEmployees();
//     console.log("EMPLOYEES", employees);
//     console.log(
//       "TIMELINES",
//       employees.map(e => ({
//         name: e.name,
//         timeline: e.timeline
//       }))
//     );

//     // Filter cases owned by this executive
//     // const execCases = employees.filter(emp => {
//     //   const assignmentEvent = emp.timeline?.find(t => t.event === 'Executive Assigned');
//     //   return assignmentEvent && assignmentEvent.details === EXEC_NAME;
//     // });

//     console.table(
//       employees.map(emp => ({
//         name: emp.name,
//         assigned_name: emp.assigned_name,
//         status: emp.status,
//         timeline: emp.timeline?.length
//       }))
//     );

//     const execCases = employees.filter(
//       emp => emp.assigned_name === EXEC_NAME
//     );

//     console.log("EXEC NAME =", EXEC_NAME);
//     console.log("EXEC CASES =", execCases);

//     setCases(execCases);

//     let events = [];
//     // execCases.forEach(emp => {
//     //   if (emp.timeline) {
//     //     emp.timeline.forEach((t, idx) => {
//     //       events.push({
//     //         ...t,
//     //         empId: emp.id,
//     //         empName: emp.name,
//     //         serviceType: emp.services ? emp.services[0] : 'Identity Verification',
//     //         priority: emp.priority || 'Medium',
//     //         empStatus: emp.status,
//     //         eventId: `EVT-${Date.now()}-${idx}-${emp.id}`
//     //       });
//     //     });
//     //   }
//     // });

//     execCases.forEach(emp => {

//       if (Array.isArray(emp.timeline) && emp.timeline.length > 0) {

//         emp.timeline.forEach((t, idx) => {

//           events.push({
//             ...t,
//             empId: emp.id,
//             empName: emp.name,
//             serviceType: emp.services?.[0] || "Identity Verification",
//             priority: emp.priority || "Medium",
//             empStatus: emp.status,
//             eventId: `${emp.id}-${idx}`
//           });

//         });

//       }

//     });

//     events.sort((a, b) => new Date(b.date) - new Date(a.date));
//     setAllEvents(events);
//   };

//   useEffect(() => {
//     fetchTimelineData();
//   }, []);

//   // Filtering Logic
//   const filteredEvents = useMemo(() => {
//     let filtered = allEvents;

//     // If case view is selected but a specific case is chosen
//     if (currentView === 'case' && selectedCaseId !== 'All') {
//       filtered = filtered.filter(e => e.empId === selectedCaseId);
//     }

//     return filtered.filter(e => {
//       const matchesSearch = e.empName.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         e.empId.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         e.event.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         (e.details && e.details.toLowerCase().includes(searchTerm.toLowerCase()));
//       const matchesType = eventTypeFilter === 'All' || e.event.includes(eventTypeFilter);
//       return matchesSearch && matchesType;
//     });
//   }, [allEvents, currentView, selectedCaseId, searchTerm, eventTypeFilter]);

//   // Metrics (Today)
//   const today = new Date().toISOString().split('T')[0];
//   const eventsToday = allEvents.filter(e => e.date.startsWith(today));

//   const totalEvents = allEvents.length;
//   // Cases worked today = unique empIds in today's events
//   const casesWorkedToday = new Set(eventsToday.map(e => e.empId)).size;
//   const callsLoggedToday = eventsToday.filter(e => e.event.includes('Call')).length;
//   const otpVerifiedToday = eventsToday.filter(e => e.event === 'OTP Verified').length;
//   const portalsCheckedToday = eventsToday.filter(e => e.event === 'Portal Verified').length;
//   const casesCompletedToday = eventsToday.filter(e => e.event === 'Verification Completed').length;

//   const getEventIconInfo = (eventText) => {
//     const text = eventText.toLowerCase();
//     if (text.includes('call')) return { icon: <PhoneCall size={14} />, color: '#3b82f6', bg: '#eff6ff' };
//     if (text.includes('otp')) return { icon: <KeyRound size={14} />, color: '#8b5cf6', bg: '#ede9fe' };
//     if (text.includes('portal')) return { icon: <Globe size={14} />, color: '#0ea5e9', bg: '#e0f2fe' };
//     if (text.includes('document')) return { icon: <FileText size={14} />, color: '#64748b', bg: '#f1f5f9' };
//     if (text.includes('note')) return { icon: <BookOpen size={14} />, color: '#eab308', bg: '#fef9c3' };
//     if (text.includes('assigned')) return { icon: <UserCheck size={14} />, color: '#f97316', bg: '#ffedd5' };
//     if (text.includes('completed') || text.includes('approved')) return { icon: <CheckCircle2 size={14} />, color: '#10b981', bg: '#ecfdf5' };
//     if (text.includes('rejected') || text.includes('escalated')) return { icon: <AlertTriangle size={14} />, color: '#ef4444', bg: '#fef2f2' };
//     return { icon: <Clock size={14} />, color: '#64748b', bg: '#f1f5f9' };
//   };

//   // Daily Activity Aggregation
//   const getDailyActivity = () => {
//     const grouped = {};
//     filteredEvents.forEach(e => {
//       const dateStr = new Date(e.date).toLocaleDateString();
//       if (!grouped[dateStr]) {
//         grouped[dateStr] = {
//           calls: 0, otp: 0, portal: 0, completed: 0, total: 0
//         };
//       }
//       grouped[dateStr].total++;
//       if (e.event.includes('Call')) grouped[dateStr].calls++;
//       if (e.event === 'OTP Verified') grouped[dateStr].otp++;
//       if (e.event === 'Portal Verified') grouped[dateStr].portal++;
//       if (e.event === 'Verification Completed') grouped[dateStr].completed++;
//     });
//     return grouped;
//   };

//   const dailyActivity = getDailyActivity();

//   return (
//     <div className="page-container" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.5s ease-out' }}>

//       {/* Header */}
//       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
//         <div>
//           <h1 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '12px' }}>
//             <Clock size={26} color="var(--primary-blue)" />
//             Verification Timeline
//           </h1>
//           <p style={{ color: 'var(--text-gray)', marginTop: '6px', fontSize: '14px' }}>
//             Master read-only activity history. Single source of truth for all verification events.
//           </p>
//         </div>
//       </div>

//       {/* TOP KPI CARDS */}
//       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
//         <div className="card metric-card" style={{ padding: '16px', backgroundColor: '#fff', borderLeft: '4px solid #64748b' }}>
//           <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-gray)', textTransform: 'uppercase' }}>Total Events</div>
//           <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-dark)', marginTop: '8px' }}>{totalEvents}</div>
//         </div>
//         <div className="card metric-card" style={{ padding: '16px', backgroundColor: '#fff', borderLeft: '4px solid #3b82f6' }}>
//           <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-gray)', textTransform: 'uppercase' }}>Cases Worked Today</div>
//           <div style={{ fontSize: '24px', fontWeight: 700, color: '#3b82f6', marginTop: '8px' }}>{casesWorkedToday}</div>
//         </div>
//         <div className="card metric-card" style={{ padding: '16px', backgroundColor: '#fff', borderLeft: '4px solid #8b5cf6' }}>
//           <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-gray)', textTransform: 'uppercase' }}>Calls Today</div>
//           <div style={{ fontSize: '24px', fontWeight: 700, color: '#8b5cf6', marginTop: '8px' }}>{callsLoggedToday}</div>
//         </div>
//         <div className="card metric-card" style={{ padding: '16px', backgroundColor: '#fff', borderLeft: '4px solid #f59e0b' }}>
//           <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-gray)', textTransform: 'uppercase' }}>OTP Verified Today</div>
//           <div style={{ fontSize: '24px', fontWeight: 700, color: '#d97706', marginTop: '8px' }}>{otpVerifiedToday}</div>
//         </div>
//         <div className="card metric-card" style={{ padding: '16px', backgroundColor: '#fff', borderLeft: '4px solid #0ea5e9' }}>
//           <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-gray)', textTransform: 'uppercase' }}>Portals Today</div>
//           <div style={{ fontSize: '24px', fontWeight: 700, color: '#0ea5e9', marginTop: '8px' }}>{portalsCheckedToday}</div>
//         </div>
//         <div className="card metric-card" style={{ padding: '16px', backgroundColor: '#fff', borderLeft: '4px solid #10b981' }}>
//           <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-gray)', textTransform: 'uppercase' }}>Completed Today</div>
//           <div style={{ fontSize: '24px', fontWeight: 700, color: '#10b981', marginTop: '8px' }}>{casesCompletedToday}</div>
//         </div>
//       </div>

//       <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '24px', alignItems: 'start' }}>

//         {/* Main Content Area */}
//         <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

//           {/* FILTER & VIEW BAR */}
//           <div className="card" style={{ padding: '16px', backgroundColor: '#fff', display: 'flex', flexDirection: 'column', gap: '16px' }}>

//             {/* View Toggle */}
//             <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
//               <button
//                 className={`btn ${currentView === 'global' ? 'btn-primary' : 'btn-outline'}`}
//                 onClick={() => { setCurrentView('global'); setSelectedCaseId('All'); }}
//                 style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
//               >
//                 <Globe size={16} /> Global Timeline
//               </button>
//               <button
//                 className={`btn ${currentView === 'case' ? 'btn-primary' : 'btn-outline'}`}
//                 onClick={() => setCurrentView('case')}
//                 style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
//               >
//                 <Briefcase size={16} /> Case Timeline
//               </button>
//               <button
//                 className={`btn ${currentView === 'daily' ? 'btn-primary' : 'btn-outline'}`}
//                 onClick={() => setCurrentView('daily')}
//                 style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
//               >
//                 <Calendar size={16} /> Daily Activity
//               </button>
//             </div>

//             {/* Filters */}
//             <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
//               <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '200px' }}>
//                 <Search size={18} color="var(--text-light)" />
//                 <input
//                   type="text"
//                   placeholder="Search Events, Employee, or ID..."
//                   className="input-field"
//                   value={searchTerm}
//                   onChange={e => setSearchTerm(e.target.value)}
//                   style={{ width: '100%', padding: '8px' }}
//                 />
//               </div>

//               {currentView === 'case' && (
//                 <select className="select-input" value={selectedCaseId} onChange={e => setSelectedCaseId(e.target.value)} style={{ padding: '8px', width: '200px' }}>
//                   <option value="All">Select a Case...</option>
//                   {cases.map(c => (
//                     <option key={c.id} value={c.id}>{c.name} ({c.id})</option>
//                   ))}
//                 </select>
//               )}

//               <select className="select-input" value={eventTypeFilter} onChange={e => setEventTypeFilter(e.target.value)} style={{ padding: '8px', width: '160px' }}>
//                 <option value="All">All Event Types</option>
//                 <option value="Call">Call Events</option>
//                 <option value="OTP">OTP Events</option>
//                 <option value="Portal">Portal Events</option>
//                 <option value="Note">Notes</option>
//                 <option value="Completed">Completion</option>
//               </select>

//               <button className="btn btn-outline" onClick={() => { setSearchTerm(''); setEventTypeFilter('All'); setSelectedCaseId('All'); }} style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
//                 <Filter size={14} /> Reset
//               </button>
//             </div>
//           </div>

//           {/* TIMELINE RENDERER */}
//           <div className="card" style={{ padding: '24px', backgroundColor: '#fff', minHeight: '500px' }}>

//             {/* Global & Case View */}
//             {(currentView === 'global' || currentView === 'case') && (
//               <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
//                 {filteredEvents.length === 0 ? (
//                   <div style={{ textAlign: 'center', padding: '64px', color: 'var(--text-gray)' }}>
//                     <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}><Clock size={48} color="var(--bg-secondary)" /></div>
//                     <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-dark)' }}>No timeline events found</h3>
//                     <p style={{ marginTop: '8px' }}>Try adjusting your filters or search terms.</p>
//                   </div>
//                 ) : (
//                   filteredEvents.map((evt, idx) => {
//                     const evtStyle = getEventIconInfo(evt.event);
//                     return (
//                       <div key={idx} style={{ display: 'flex', gap: '16px', position: 'relative' }}>
//                         {idx !== filteredEvents.length - 1 && (
//                           <div style={{ position: 'absolute', top: '24px', left: '19px', bottom: '-20px', width: '2px', backgroundColor: 'var(--border-color)' }}></div>
//                         )}
//                         <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: evtStyle.bg, border: '2px solid #fff', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
//                           <div style={{ color: evtStyle.color }}>{evtStyle.icon}</div>
//                         </div>
//                         <div style={{ flex: 1, backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
//                           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
//                             <div>
//                               <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-dark)' }}>{evt.event}</div>
//                               <div style={{ fontSize: '12px', color: 'var(--text-gray)', marginTop: '2px' }}>
//                                 <span style={{ fontWeight: 600, color: 'var(--primary-blue)' }}>{evt.empName}</span> • {evt.empId}
//                               </div>
//                             </div>
//                             <div style={{ textAlign: 'right' }}>
//                               <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-dark)' }}>{new Date(evt.date).toLocaleDateString()}</div>
//                               <div style={{ fontSize: '11px', color: 'var(--text-gray)' }}>{new Date(evt.date).toLocaleTimeString([], { timeStyle: 'short' })}</div>
//                             </div>
//                           </div>
//                           {evt.details && (
//                             <div style={{ fontSize: '13px', color: 'var(--text-dark)', backgroundColor: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
//                               {evt.details}
//                             </div>
//                           )}
//                           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
//                             <span style={{ fontSize: '11px', color: 'var(--text-gray)' }}>By: {evt.user}</span>
//                             <button className="btn btn-outline" onClick={() => setSelectedEvent(evt)} style={{ padding: '4px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', border: 'none', backgroundColor: '#e2e8f0' }}>
//                               <Eye size={12} /> View Audit Details
//                             </button>
//                           </div>
//                         </div>
//                       </div>
//                     );
//                   })
//                 )}
//               </div>
//             )}

//             {/* Daily Activity View */}
//             {currentView === 'daily' && (
//               <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
//                 {Object.keys(dailyActivity).length === 0 ? (
//                   <div style={{ textAlign: 'center', padding: '64px', color: 'var(--text-gray)' }}>No daily activity found.</div>
//                 ) : (
//                   Object.keys(dailyActivity).sort((a, b) => new Date(b) - new Date(a)).map((date, idx) => {
//                     const stats = dailyActivity[date];
//                     return (
//                       <div key={idx} style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
//                         <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-dark)', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
//                           <Calendar size={16} color="var(--primary-blue)" /> {date === new Date().toLocaleDateString() ? 'Today' : date}
//                         </h3>
//                         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
//                           <div style={{ textAlign: 'center' }}>
//                             <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-dark)' }}>{stats.total}</div>
//                             <div style={{ fontSize: '11px', color: 'var(--text-gray)', fontWeight: 600, textTransform: 'uppercase' }}>Total Events</div>
//                           </div>
//                           <div style={{ textAlign: 'center' }}>
//                             <div style={{ fontSize: '20px', fontWeight: 700, color: '#3b82f6' }}>{stats.calls}</div>
//                             <div style={{ fontSize: '11px', color: 'var(--text-gray)', fontWeight: 600, textTransform: 'uppercase' }}>Calls</div>
//                           </div>
//                           <div style={{ textAlign: 'center' }}>
//                             <div style={{ fontSize: '20px', fontWeight: 700, color: '#8b5cf6' }}>{stats.otp}</div>
//                             <div style={{ fontSize: '11px', color: 'var(--text-gray)', fontWeight: 600, textTransform: 'uppercase' }}>OTP Verified</div>
//                           </div>
//                           <div style={{ textAlign: 'center' }}>
//                             <div style={{ fontSize: '20px', fontWeight: 700, color: '#0ea5e9' }}>{stats.portal}</div>
//                             <div style={{ fontSize: '11px', color: 'var(--text-gray)', fontWeight: 600, textTransform: 'uppercase' }}>Portals</div>
//                           </div>
//                           <div style={{ textAlign: 'center' }}>
//                             <div style={{ fontSize: '20px', fontWeight: 700, color: '#10b981' }}>{stats.completed}</div>
//                             <div style={{ fontSize: '11px', color: 'var(--text-gray)', fontWeight: 600, textTransform: 'uppercase' }}>Completed</div>
//                           </div>
//                         </div>
//                       </div>
//                     )
//                   })
//                 )}
//               </div>
//             )}

//           </div>
//         </div>

//         {/* Right Side Widgets */}
//         <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

//           {/* ANALYTICS SECTION */}
//           <div className="card" style={{ padding: '20px', backgroundColor: '#fff' }}>
//             <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
//               <BarChart3 size={18} color="var(--primary-blue)" /> Timeline Analytics
//             </h3>

//             <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
//               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
//                 <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-gray)' }}>Most Common Event</span>
//                 <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary-blue)' }}>Document Uploaded</span>
//               </div>

//               <div>
//                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
//                   <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-gray)' }}>Completion Rate (Today)</span>
//                   <span style={{ fontSize: '12px', fontWeight: 700, color: '#10b981' }}>25%</span>
//                 </div>
//                 <div style={{ height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
//                   <div style={{ height: '100%', width: '25%', backgroundColor: '#10b981' }}></div>
//                 </div>
//               </div>

//               <div>
//                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
//                   <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-gray)' }}>OTP Success Rate</span>
//                   <span style={{ fontSize: '12px', fontWeight: 700, color: '#8b5cf6' }}>92%</span>
//                 </div>
//                 <div style={{ height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
//                   <div style={{ height: '100%', width: '92%', backgroundColor: '#8b5cf6' }}></div>
//                 </div>
//               </div>
//             </div>
//           </div>

//           <div className="card" style={{ padding: '20px', backgroundColor: '#fff', borderLeft: '4px solid #10b981' }}>
//             <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#10b981', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
//               <ShieldCheck size={16} /> Data Integrity Locked
//             </h3>
//             <p style={{ fontSize: '12px', color: 'var(--text-gray)', lineHeight: '1.5' }}>
//               All records displayed on this timeline are auto-generated from actual operational workflows. Manual editing or deletion is restricted to preserve compliance audits.
//             </p>
//           </div>

//         </div>
//       </div>

//       {/* EVENT DETAILS DRAWER */}
//       {selectedEvent && (
//         <>
//           <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 100 }} onClick={() => setSelectedEvent(null)}></div>
//           <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '450px', backgroundColor: '#fff', zIndex: 101, display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 24px rgba(0,0,0,0.1)', animation: 'slideInRight 0.3s ease-out' }}>

//             <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
//               <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
//                 <Clock size={18} color="var(--primary-blue)" /> Event Details
//               </h2>
//               <button onClick={() => setSelectedEvent(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-gray)' }}>
//                 <X size={20} />
//               </button>
//             </div>

//             <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>

//               {/* Event Metadata */}
//               <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingBottom: '20px', borderBottom: '1px solid var(--border-color)' }}>
//                 <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: getEventIconInfo(selectedEvent.event).bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: getEventIconInfo(selectedEvent.event).color }}>
//                   {getEventIconInfo(selectedEvent.event).icon}
//                 </div>
//                 <div>
//                   <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-dark)' }}>{selectedEvent.event}</div>
//                   <div style={{ fontSize: '12px', color: 'var(--text-gray)', marginTop: '4px' }}>{new Date(selectedEvent.date).toLocaleString()}</div>
//                 </div>
//               </div>

//               {/* Candidate Info */}
//               <div>
//                 <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Related Case</h3>
//                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
//                   <div>
//                     <div style={{ fontSize: '11px', color: 'var(--text-gray)' }}>Employee Name</div>
//                     <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-dark)' }}>{selectedEvent.empName}</div>
//                   </div>
//                   <div>
//                     <div style={{ fontSize: '11px', color: 'var(--text-gray)' }}>Employee ID</div>
//                     <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-dark)' }}>{selectedEvent.empId}</div>
//                   </div>
//                   <div>
//                     <div style={{ fontSize: '11px', color: 'var(--text-gray)' }}>Service Type</div>
//                     <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-dark)' }}>{selectedEvent.serviceType}</div>
//                   </div>
//                   <div>
//                     <div style={{ fontSize: '11px', color: 'var(--text-gray)' }}>Current Case Status</div>
//                     <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-dark)' }}>{selectedEvent.empStatus.replace('-', ' ')}</div>
//                   </div>
//                 </div>
//               </div>

//               {/* Event Description */}
//               <div>
//                 <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Event Description</h3>
//                 <div style={{ padding: '16px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', fontSize: '13px', color: 'var(--text-dark)', lineHeight: '1.5' }}>
//                   {selectedEvent.details || 'No additional remarks or description provided for this event.'}
//                 </div>
//               </div>

//               {/* Audit Information */}
//               <div>
//                 <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Audit Information</h3>
//                 <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px', color: 'var(--text-gray)' }}>
//                   <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border-color)', paddingBottom: '4px' }}>
//                     <span>Event ID:</span>
//                     <span style={{ color: 'var(--text-dark)', fontFamily: 'monospace' }}>{selectedEvent.eventId}</span>
//                   </div>
//                   <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border-color)', paddingBottom: '4px' }}>
//                     <span>Case ID:</span>
//                     <span style={{ color: 'var(--text-dark)', fontFamily: 'monospace' }}>{selectedEvent.empId}</span>
//                   </div>
//                   <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border-color)', paddingBottom: '4px' }}>
//                     <span>Executive Actor:</span>
//                     <span style={{ color: 'var(--text-dark)', fontWeight: 500 }}>{selectedEvent.user}</span>
//                   </div>
//                   <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px' }}>
//                     <span>Created Timestamp:</span>
//                     <span style={{ color: 'var(--text-dark)', fontWeight: 500 }}>{selectedEvent.date}</span>
//                   </div>
//                 </div>
//               </div>

//             </div>
//           </div>
//         </>
//       )}

//     </div>
//   );
// };
