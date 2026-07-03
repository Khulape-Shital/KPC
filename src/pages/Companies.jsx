import React from 'react';
import { Plus, Search, Building2, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MOCK_COMPANIES = [
  { id: 'COMP-101', name: 'TechCorp Enterprise Group', entities: 3, totalEmployees: 1450, status: 'Active', joined: 'Jan 2022' },
  { id: 'COMP-102', name: 'Vertex Holdings Ltd', entities: 1, totalEmployees: 89, status: 'Active', joined: 'Mar 2023' },
];

export const Companies = () => {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '24px', marginBottom: '8px' }}>Companies</h1>
          <p style={{ color: 'var(--text-gray)' }}>Manage parent corporate entities and their associated client accounts.</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/ops/companies/create')}>
          <Plus size={16} style={{ marginRight: '8px' }} /> Create Company
        </button>
      </div>

      <div className="card" style={{ padding: '16px', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <div className="header-search" style={{ width: '300px', border: '1px solid var(--border-color)', margin: 0, backgroundColor: '#fff' }}>
          <Search size={16} color="var(--text-gray)" />
          <input type="text" placeholder="Search Company Name or ID" />
        </div>
        <select style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <option>All Statuses</option>
          <option>Active</option>
          <option>Inactive</option>
        </select>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '16px', fontSize: '12px', color: 'var(--text-gray)' }}>COMPANY NAME</th>
              <th style={{ padding: '16px', fontSize: '12px', color: 'var(--text-gray)' }}>CLIENT ACCOUNTS</th>
              <th style={{ padding: '16px', fontSize: '12px', color: 'var(--text-gray)' }}>TOTAL EMPLOYEES</th>
              <th style={{ padding: '16px', fontSize: '12px', color: 'var(--text-gray)' }}>JOINED</th>
              <th style={{ padding: '16px', fontSize: '12px', color: 'var(--text-gray)' }}>STATUS</th>
              <th style={{ padding: '16px', fontSize: '12px', color: 'var(--text-gray)', textAlign: 'right' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_COMPANIES.map((comp) => (
              <tr key={comp.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="avatar" style={{ backgroundColor: 'var(--primary-blue-light)', color: 'var(--primary-blue)' }}>
                      <Building2 size={16} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{comp.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-gray)' }}>ID: {comp.id}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '16px', fontSize: '14px', fontWeight: 500 }}>{comp.entities} Accounts</td>
                <td style={{ padding: '16px', fontSize: '14px' }}>{comp.totalEmployees}</td>
                <td style={{ padding: '16px', fontSize: '14px', color: 'var(--text-gray)' }}>{comp.joined}</td>
                <td style={{ padding: '16px' }}><span className="badge badge-completed">{comp.status}</span></td>
                <td style={{ padding: '16px', textAlign: 'right' }}>
                  <button className="btn btn-outline" onClick={() => navigate(`/ops/companies/${comp.id}`)} style={{ padding: '4px 8px', fontSize: '12px' }}>
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
