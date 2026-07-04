import { useState, useEffect } from 'react';
import { MapPin, Plus, Edit2, Trash2, FileText, X, Building } from 'lucide-react';
import api from '../services/api';

/* eslint-disable react-hooks/set-state-in-effect */

const SalesOfficeConfig = () => {
  const [offices, setOffices] = useState([]);
  const [plants, setPlants] = useState([]);
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
  const [editingOffice, setEditingOffice] = useState(null);
  const [formData, setFormData] = useState({ officeName: '', officeCode: '', fullAddress: '', plantId: '' });

  async function fetchData() {
    try {
      const [officesRes, plantsRes] = await Promise.all([
        api.get('/sales-offices'),
        api.get('/plants')
      ]);
      setOffices(officesRes?.data?.data || []);
      setPlants(plantsRes?.data?.data || []);
    } catch (err) {
      console.error('Failed to load Sales Office data', err);
    }
  }

  useEffect(() => {
    void fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const openAddDrawer = () => {
    setEditingOffice(null);
    setFormData({ officeName: '', officeCode: '', fullAddress: '', plantId: '' });
    setIsSlideOverOpen(true);
  };

  const openEditDrawer = (office) => {
    setEditingOffice(office);
    setFormData({ 
      officeName: office.officeName, 
      officeCode: office.officeCode, 
      fullAddress: office.fullAddress, 
      plantId: office.Plant?.id || '' 
    });
    setIsSlideOverOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingOffice) {
        await api.put(`/sales-offices/${editingOffice.id}`, formData);
        alert('Sales Office updated successfully');
      } else {
        await api.post('/sales-offices', formData);
        alert('Sales Office created successfully');
      }
      setIsSlideOverOpen(false);
      await fetchData();
    } catch (err) {
      const msg = err.response?.data?.message || 'Error processing request';
      alert(msg);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to deactivate this Sales Office?')) {
      try {
        await api.delete(`/sales-offices/${id}`);
        await fetchData();
      } catch {
        alert('Error deactivating Sales Office');
      }
    }
  };

  return (
    <div style={{ width: '100%', color: '#f8fafc', boxSizing: 'border-box' }}>
      
      {/* --- Action Header Bar --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin color="#0ea5e9" /> Sales Office Configuration
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Establish localized points of presence cascading downwards from your Plants.</p>
        </div>
        <button 
          onClick={openAddDrawer}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#0ea5e9', color: '#ffffff', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', transition: 'background 0.2s' }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#0284c7'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#0ea5e9'}
        >
          <Plus size={18} /> Add Sales Office
        </button>
      </div>

      {/* --- Responsive Data Grid Table --- */}
      <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '16px', overflowX: 'auto', width: '100%' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8', backgroundColor: '#0f172a' }}>
              <th style={{ padding: '16px 24px', fontWeight: '600' }}>Office Name & Code</th>
              <th style={{ padding: '16px 24px', fontWeight: '600' }}>Parent Plant</th>
              <th style={{ padding: '16px 24px', fontWeight: '600' }}>Full Address</th>
              <th style={{ padding: '16px 24px', fontWeight: '600', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {offices.map((o) => (
              <tr key={o.id} style={{ borderBottom: '1px solid #334155', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#33415555'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                <td style={{ padding: '18px 24px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontWeight: '600', color: '#ffffff' }}>{o.officeName}</span>
                    <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontFamily: 'monospace' }}>Code: {o.officeCode}</span>
                  </div>
                </td>
                <td style={{ padding: '18px 24px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontWeight: '600', color: '#cbd5e1' }}>{o.Plant?.plantName || 'N/A'}</span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'monospace' }}>Plant Code: {o.Plant?.plantCode || 'N/A'}</span>
                  </div>
                </td>
                <td style={{ padding: '18px 24px', color: '#94a3b8', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Building size={14} style={{ flexShrink: 0 }} /> {o.fullAddress}
                  </div>
                </td>
                <td style={{ padding: '18px 24px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button onClick={() => openEditDrawer(o)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}><Edit2 size={16} /></button>
                    <button onClick={() => handleDelete(o.id)} style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', padding: '4px' }}><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {offices.length === 0 && (
              <tr>
                <td colSpan="4" style={{ padding: '48px 24px', textAlign: 'center', color: '#64748b' }}>No sales office records found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- Slide-Over Form Drawer --- */}
      {isSlideOverOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '450px', height: '100%', backgroundColor: '#1e293b', borderLeft: '1px solid #334155', boxShadow: '-10px 0 25px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', animation: 'slideIn 0.3s ease-out' }}>
            
            {/* Drawer Header */}
            <div style={{ height: '64px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 24px' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}><FileText size={20} color="#0ea5e9" /> {editingOffice ? 'Edit Sales Office' : 'Add Sales Office'}</h3>
              <button onClick={() => setIsSlideOverOpen(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            {/* Form Inputs */}
            <form onSubmit={handleSubmit} style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#cbd5e1', marginBottom: '6px' }}>Select Parent Plant *</label>
                <select name="plantId" value={formData.plantId} onChange={handleInputChange} required style={{ width: '100%', padding: '12px', borderRadius: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', color: 'white', outline: 'none' }}>
                  <option value="">-- Choose Parent Plant --</option>
                  {plants.map(p => (
                    <option key={p.id} value={p.id}>{p.plantName} ({p.plantCode})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#cbd5e1', marginBottom: '6px' }}>Office Name *</label>
                <input type="text" name="officeName" value={formData.officeName} onChange={handleInputChange} required style={{ width: '100%', padding: '12px', borderRadius: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', color: 'white', outline: 'none' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#cbd5e1', marginBottom: '6px' }}>Office Code *</label>
                <input type="text" name="officeCode" value={formData.officeCode} onChange={handleInputChange} placeholder="e.g. OFF-HYD-01" required style={{ width: '100%', padding: '12px', borderRadius: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', color: 'white', outline: 'none', textTransform: 'uppercase' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#cbd5e1', marginBottom: '6px' }}>Full Office Address *</label>
                <textarea name="fullAddress" value={formData.fullAddress} onChange={handleInputChange} rows="3" required style={{ width: '100%', padding: '12px', borderRadius: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', color: 'white', outline: 'none', resize: 'vertical' }}></textarea>
              </div>

              <div style={{ marginTop: 'auto', paddingTop: '16px', display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setIsSlideOverOpen(false)} style={{ flex: 1, padding: '12px', borderRadius: '10px', backgroundColor: '#334155', color: 'white', border: 'none', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ flex: 1, padding: '12px', borderRadius: '10px', backgroundColor: '#0ea5e9', color: 'white', border: 'none', fontWeight: '600', cursor: 'pointer' }}>{editingOffice ? 'Update Office' : 'Save Office'}</button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default SalesOfficeConfig;