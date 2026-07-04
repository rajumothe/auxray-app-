import { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, Shield, FileText, X, Info } from 'lucide-react';
import api from '../services/api';

/* eslint-disable react-hooks/set-state-in-effect */

const EmployeeRoster = () => {
  const [employees, setEmployees] = useState([]);
  const [salesOffices, setSalesOffices] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState(null);
  
  const [formData, setFormData] = useState({ 
    fullName: '',
    email: '',
    mobileNumber: '',
    alternateNumber: '',
    address: '',
    password: '',
    role: '',
    managerId: '',
    salesOfficeIds: [],
    routeIds: []
  });

  const rolesList = ['HOD', 'State Head', 'RSM', 'ASM', 'Executive', 'Technician'];

  async function fetchRosterData() {
    try {
      const [empRes, officeRes, routeRes] = await Promise.all([
        api.get('/employees'),
        api.get('/sales-offices'),
        api.get('/routes')
      ]);
      setEmployees(empRes?.data?.data || []);
      setSalesOffices(officeRes?.data?.data || []);
      setRoutes(routeRes?.data?.data || []);
    } catch (err) {
      console.error('Failed to load roster data', err);
    }
  }

  useEffect(() => {
    void fetchRosterData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const openAddDrawer = () => {
    setEditingEmp(null);
    setFormData({
      fullName: '',
      email: '',
      mobileNumber: '',
      alternateNumber: '',
      address: '',
      password: '',
      role: '',
      managerId: '',
      salesOfficeIds: [],
      routeIds: []
    });
    setIsSlideOverOpen(true);
  };

  const openEditDrawer = (emp) => {
    setEditingEmp(emp);
    setFormData({ 
      fullName: emp.fullName,
      email: emp.email || '',
      mobileNumber: emp.mobileNumber || '',
      alternateNumber: emp.alternateNumber || '',
      address: emp.address || '',
      password: '',
      role: emp.role,
      managerId: emp.managerId || '',
      salesOfficeIds: emp.SalesOffices?.map(so => so.id) || [],
      routeIds: emp.Routes?.map(r => r.id) || []
    });
    setIsSlideOverOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingEmp) {
        await api.put(`/employees/${editingEmp.id}`, formData);
        alert('Employee profile modified successfully');
      } else {
        // 🌟 SERVER SYSTEM HOOK GENERATES AND RETURNS THE empId DYNAMICALLY HERE
        await api.post('/employees', formData);
        alert('Employee profile created successfully! Serial ID generated automatically by server.');
      }
      setIsSlideOverOpen(false);
      await fetchRosterData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error processing request');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Deactivate this Employee account profile?')) {
      try {
        await api.delete(`/employees/${id}`);
        await fetchRosterData();
      } catch {
        alert('Error deactivating profile');
      }
    }
  };

  return (
    <div style={{ width: '100%', color: '#f8fafc', boxSizing: 'border-box' }}>
      
      {/* Action Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users color="#0ea5e9" /> Employee Roster Setup
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Provision system operators, choose line managers, and configure contextual assignment clusters.</p>
        </div>
        <button onClick={openAddDrawer} style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#0ea5e9', color: '#ffffff', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: '600', cursor: 'pointer' }}>
          <Plus size={18} /> Register Staff Profile
        </button>
      </div>

      {/* Main Roster Grid */}
      <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '16px', overflowX: 'auto', width: '100%' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8', backgroundColor: '#0f172a' }}>
              <th style={{ padding: '16px 24px', fontWeight: '600' }}>Full Name & Role</th>
              <th style={{ padding: '16px 24px', fontWeight: '600' }}>Auto-Generated ID</th>
              <th style={{ padding: '16px 24px', fontWeight: '600' }}>Contact Details</th>
              <th style={{ padding: '16px 24px', fontWeight: '600' }}>Reporting Manager</th>
              <th style={{ padding: '16px 24px', fontWeight: '600' }}>Assigned Territories</th>
              <th style={{ padding: '16px 24px', fontWeight: '600', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp.id} style={{ borderBottom: '1px solid #334155' }}>
                <td style={{ padding: '18px 24px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontWeight: '600', color: '#ffffff' }}>{emp.fullName}</span>
                    <span style={{ fontSize: '0.75rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '4px' }}><Shield size={12} /> {emp.role}</span>
                  </div>
                </td>
                <td style={{ padding: '18px 24px', fontFamily: 'monospace', color: '#38bdf8', fontWeight: '700', letterSpacing: '0.5px' }}>{emp.empId || 'Generating...'}</td>
                <td style={{ padding: '18px 24px', color: '#cbd5e1' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontWeight: '600' }}>{emp.mobileNumber || '-'}</span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{emp.email || 'Email not provided'}</span>
                  </div>
                </td>
                <td style={{ padding: '18px 24px', color: '#cbd5e1', fontWeight: '500' }}>
                  {emp.Manager ? `${emp.Manager.fullName} (${emp.Manager.role})` : <span style={{ color: '#64748b' }}>None (Top Level)</span>}
                </td>
                <td style={{ padding: '18px 24px', color: '#cbd5e1' }}>
                  {emp.role === 'HOD' ? <span style={{ color: '#22c55e', fontWeight: '600' }}>Full Global Scope</span> : (
                    <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {['State Head', 'RSM', 'ASM'].includes(emp.role) && (
                        <div><strong style={{ color: '#38bdf8' }}>Offices:</strong> {emp.SalesOffices?.map(so => so.officeCode).join(', ') || 'None assigned'}</div>
                      )}
                      {['Executive', 'Technician'].includes(emp.role) && (
                        <div><strong style={{ color: '#a855f7' }}>Routes:</strong> {emp.Routes?.map(r => r.routeCode).join(', ') || 'None assigned'}</div>
                      )}
                    </div>
                  )}
                </td>
                <td style={{ padding: '18px 24px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button onClick={() => openEditDrawer(emp)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><Edit2 size={16} /></button>
                    <button onClick={() => handleDelete(emp.id)} style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer' }}><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Form Slide-Over Drawer */}
      {isSlideOverOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '450px', height: '100%', backgroundColor: '#1e293b', borderLeft: '1px solid #334155', display: 'flex', flexDirection: 'column' }}>
            <div style={{ height: '64px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 24px' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}><FileText size={20} color="#0ea5e9" /> {editingEmp ? 'Modify Profile' : 'Register Profile'}</h3>
              <button onClick={() => setIsSlideOverOpen(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
              
              {/* 🌟 CONDITIONAL RENDERING LAYOUT: Only display ID during an active Edit operation */}
              {editingEmp && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '6px', color: '#64748b' }}>Assigned Employee ID</label>
                  <input type="text" value={editingEmp.empId} disabled style={{ width: '100%', padding: '12px', borderRadius: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#64748b', fontFamily: 'monospace', fontWeight: 'bold', outline: 'none', cursor: 'not-allowed' }} />
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '6px' }}>Full Name *</label>
                <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} required style={{ width: '100%', padding: '12px', borderRadius: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', color: 'white', outline: 'none' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '6px' }}>Mobile Number *</label>
                <input type="tel" name="mobileNumber" value={formData.mobileNumber} onChange={handleInputChange} required style={{ width: '100%', padding: '12px', borderRadius: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', color: 'white', outline: 'none' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '6px' }}>Email ID (Optional)</label>
                <input type="email" name="email" value={formData.email} onChange={handleInputChange} style={{ width: '100%', padding: '12px', borderRadius: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', color: 'white', outline: 'none' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '6px' }}>Alternate Contact Number</label>
                <input type="tel" name="alternateNumber" value={formData.alternateNumber} onChange={handleInputChange} style={{ width: '100%', padding: '12px', borderRadius: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', color: 'white', outline: 'none' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '6px' }}>Address</label>
                <textarea name="address" value={formData.address} onChange={handleInputChange} rows="2" style={{ width: '100%', padding: '12px', borderRadius: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', color: 'white', outline: 'none', resize: 'vertical' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '6px' }}>System Access Password {editingEmp && '(Leave blank to retain)'}</label>
                <input type="password" name="password" value={formData.password} onChange={handleInputChange} required={!editingEmp} style={{ width: '100%', padding: '12px', borderRadius: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', color: 'white', outline: 'none' }} />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '6px' }}>Role Type *</label>
                <select name="role" value={formData.role} onChange={handleInputChange} required style={{ width: '100%', padding: '12px', borderRadius: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', color: 'white', outline: 'none' }}>
                  <option value="">-- Choose Access Role --</option>
                  {rolesList.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              
              {/* Info Notification Tooltip when creating a fresh employee */}
              {!editingEmp && formData.role && (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', backgroundColor: '#0f172a', border: '1px solid #334155', padding: '10px', borderRadius: '8px' }}>
                  <Info size={16} color="#0ea5e9" style={{ shrink: 0 }} />
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    Note: A unique 6-digit dynamic ID will automatically increment and assign once saved.
                  </span>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '6px' }}>Direct Reporting Manager</label>
                <select name="managerId" value={formData.managerId} onChange={handleInputChange} style={{ width: '100%', padding: '12px', borderRadius: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', color: 'white', outline: 'none' }}>
                  <option value="">-- No Manager (Top Level) --</option>
                  {employees.filter(e => e.id !== editingEmp?.id).map(m => <option key={m.id} value={m.id}>{m.fullName} ({m.role})</option>)}
                </select>
              </div>

              {/* Multi-Select Box: Sales Offices */}
              {['State Head', 'RSM', 'ASM'].includes(formData.role) && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '6px', color: '#38bdf8' }}>Map Accessible Sales Offices (Hold Ctrl/Cmd to select multiple)</label>
                  <select multiple name="salesOfficeIds" value={formData.salesOfficeIds} onChange={(e) => setFormData({ ...formData, salesOfficeIds: [...e.target.selectedOptions].map(o => o.value) })} style={{ width: '100%', height: '100px', padding: '12px', borderRadius: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', color: 'white', outline: 'none' }}>
                    {salesOffices.map(so => <option key={so.id} value={so.id}>{so.officeName} ({so.officeCode})</option>)}
                  </select>
                </div>
              )}

              {/* Multi-Select Box: Field Routes */}
              {['Executive', 'Technician'].includes(formData.role) && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '6px', color: '#c084fc' }}>Map Assigned Field Routes (Hold Ctrl/Cmd to select multiple)</label>
                  <select multiple name="routeIds" value={formData.routeIds} onChange={(e) => setFormData({ ...formData, routeIds: [...e.target.selectedOptions].map(o => o.value) })} style={{ width: '100%', height: '100px', padding: '12px', borderRadius: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', color: 'white', outline: 'none' }}>
                    {routes.map(rt => <option key={rt.id} value={rt.id}>{rt.routeName} ({rt.routeCode})</option>)}
                  </select>
                </div>
              )}

              <div style={{ marginTop: 'auto', display: 'flex', gap: '12px', paddingTop: '16px' }}>
                <button type="button" onClick={() => setIsSlideOverOpen(false)} style={{ flex: 1, padding: '12px', borderRadius: '10px', backgroundColor: '#334155', color: 'white', border: 'none', fontWeight: '600' }}>Cancel</button>
                <button type="submit" style={{ flex: 1, padding: '12px', borderRadius: '10px', backgroundColor: '#0ea5e9', color: 'white', border: 'none', fontWeight: '600' }}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeRoster;