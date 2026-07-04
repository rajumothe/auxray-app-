import { useState, useEffect } from 'react';
import { Building2, Edit2, Trash2, MapPin, FileText, X } from 'lucide-react';
import api from '../services/api';

/* eslint-disable react-hooks/set-state-in-effect */

const CompanyConfig = () => {
  const [companies, setCompanies] = useState([]);
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [formData, setFormData] = useState({ companyName: '', companyCode: '', stateCode: '', gstNumber: '', panNumber: '', state: '', fullAddress: '' });

  async function fetchCompanies() {
    try {
      const response = await api.get('/companies');
      setCompanies(response?.data?.data || []);
    } catch (err) {
      console.error('Failed to load companies', err);
      setCompanies([]);
    }
  }

  useEffect(() => {
    void fetchCompanies();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const openEditDrawer = (company) => {
    setEditingCompany(company);
    setFormData({ 
      companyName: company.companyName, 
      companyCode: company.companyCode, // Displays sequential integer (e.g. 1000)
      stateCode: company.stateCode, 
      gstNumber: company.gstNumber, 
      panNumber: company.panNumber, 
      state: company.state, 
      fullAddress: company.fullAddress 
    });
    setIsSlideOverOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCompany) {
        // Sends updated parameters directly to backend mutation controller paths
        await api.put(`/companies/${editingCompany.id}`, formData);
        alert('Company updated successfully');
      }
      setIsSlideOverOpen(false);
      setEditingCompany(null);
      setFormData({ companyName: '', companyCode: '', stateCode: '', gstNumber: '', panNumber: '', state: '', fullAddress: '' });
      await fetchCompanies();
    } catch (err) {
      const apiMessage = err?.response?.data?.message || err?.response?.data?.error;
      alert(apiMessage || 'Error saving company entity');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to deactivate this company entity?')) {
      try {
        await api.delete(`/companies/${id}`);
        await fetchCompanies();
      } catch (err) {
        const apiMessage = err?.response?.data?.message || err?.response?.data?.error;
        alert(apiMessage || 'Error deactivating record');
      }
    }
  };

  return (
    <div style={{ width: '100%', color: '#f8fafc', boxSizing: 'border-box' }}>
      
      {/* --- Action Header Bar --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building2 color="#0ea5e9" /> Company Configuration
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>View initialized corporate entities and manage localized tax registration and compliance details.</p>
        </div>
        {/* 🌟 REMOVED MANUAL CREATION BUTTON ACCORDING TO SYSTEM LAWS */}
      </div>

      {/* --- Data Table Grid --- */}
      <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '16px', overflowX: 'auto', width: '100%' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8', backgroundColor: '#0f172a' }}>
              <th style={{ padding: '16px 24px', fontWeight: '600' }}>Company Name</th>
              <th style={{ padding: '16px 24px', fontWeight: '600' }}>Company / State Code</th>
              <th style={{ padding: '16px 24px', fontWeight: '600' }}>State / GSTIN</th>
              <th style={{ padding: '16px 24px', fontWeight: '600' }}>PAN Number</th>
              <th style={{ padding: '16px 24px', fontWeight: '600' }}>Registered Address</th>
              <th style={{ padding: '16px 24px', fontWeight: '600', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((c) => (
              <tr key={c.id} style={{ borderBottom: '1px solid #334155', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#33415555'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                <td style={{ padding: '18px 24px', color: '#ffffff', fontWeight: '600' }}>{c.companyName}</td>
                <td style={{ padding: '18px 24px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontWeight: '600', color: '#38bdf8', fontFamily: 'monospace' }}>Code: {c.companyCode}</span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>GST State: {c.stateCode}</span>
                  </div>
                </td>
                <td style={{ padding: '18px 24px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontWeight: '600', color: '#cbd5e1' }}>{c.state}</span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'monospace' }}>{c.gstNumber}</span>
                  </div>
                </td>
                <td style={{ padding: '18px 24px', fontFamily: 'monospace', color: '#cbd5e1' }}>{c.panNumber}</td>
                <td style={{ padding: '18px 24px', color: '#94a3b8', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={14} style={{ flexShrink: 0 }} /> {c.fullAddress}
                  </div>
                </td>
                <td style={{ padding: '18px 24px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button onClick={() => openEditDrawer(c)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}><Edit2 size={16} /></button>
                    <button onClick={() => handleDelete(c.id)} style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', padding: '4px' }}><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {companies.length === 0 && (
              <tr>
                <td colSpan="6" style={{ padding: '48px 24px', textAlign: 'center', color: '#64748b' }}>No active company profiles registered in system core.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- Slide-Over Form Drawer (Updates Metadata Only) --- */}
      {isSlideOverOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '450px', height: '100%', backgroundColor: '#1e293b', borderLeft: '1px solid #334155', boxShadow: '-10px 0 25px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column' }}>
            
            {/* Drawer Header */}
            <div style={{ height: '64px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 24px' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}><FileText size={20} color="#0ea5e9" /> Modify Corporate Details</h3>
              <button onClick={() => setIsSlideOverOpen(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            {/* Form Inputs */}
            <form onSubmit={handleSubmit} style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
              
              {/* 🌟 READ-ONLY IMMUTABLE COMPANY CODE CHIP ROW */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#64748b', marginBottom: '6px' }}>System Company Code (Locked)</label>
                <input 
                  type="text" 
                  name="companyCode" 
                  value={formData.companyCode} 
                  disabled 
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#64748b', fontFamily: 'monospace', fontWeight: 'bold', outline: 'none', cursor: 'not-allowed' }} 
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#cbd5e1', marginBottom: '6px' }}>Company Legal Name *</label>
                <input type="text" name="companyName" value={formData.companyName} onChange={handleInputChange} required style={{ width: '100%', padding: '12px', borderRadius: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', color: 'white', outline: 'none' }} />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#cbd5e1', marginBottom: '6px' }}>State Code (GST Number Prefix) *</label>
                <input type="text" name="stateCode" value={formData.stateCode} onChange={handleInputChange} placeholder="e.g. 36" maxLength="2" required style={{ width: '100%', padding: '12px', borderRadius: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', color: 'white', outline: 'none', fontFamily: 'monospace' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#cbd5e1', marginBottom: '6px' }}>State Name *</label>
                <input type="text" name="state" value={formData.state} onChange={handleInputChange} required style={{ width: '100%', padding: '12px', borderRadius: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', color: 'white', outline: 'none' }} />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#cbd5e1', marginBottom: '6px' }}>GST Number (GSTIN) *</label>
                <input type="text" name="gstNumber" value={formData.gstNumber} onChange={handleInputChange} required style={{ width: '100%', padding: '12px', borderRadius: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', color: 'white', outline: 'none', fontFamily: 'monospace', textTransform: 'uppercase' }} />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#cbd5e1', marginBottom: '6px' }}>PAN Number *</label>
                <input type="text" name="panNumber" value={formData.panNumber} onChange={handleInputChange} maxLength="10" required style={{ width: '100%', padding: '12px', borderRadius: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', color: 'white', outline: 'none', fontFamily: 'monospace', textTransform: 'uppercase' }} />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#cbd5e1', marginBottom: '6px' }}>Full Registered Address *</label>
                <textarea name="fullAddress" value={formData.fullAddress} onChange={handleInputChange} rows="3" required style={{ width: '100%', padding: '12px', borderRadius: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', color: 'white', outline: 'none', resize: 'vertical' }}></textarea>
              </div>

              <div style={{ marginTop: 'auto', paddingTop: '16px', display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setIsSlideOverOpen(false)} style={{ flex: 1, padding: '12px', borderRadius: '10px', backgroundColor: '#334155', color: 'white', border: 'none', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ flex: 1, padding: '12px', borderRadius: '10px', backgroundColor: '#0ea5e9', color: 'white', border: 'none', fontWeight: '600', cursor: 'pointer' }}>Update Entity</button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default CompanyConfig;