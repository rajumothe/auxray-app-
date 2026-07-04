import { useState, useEffect } from 'react';
import { Factory, Plus, Edit2, Trash2, MapPin, FileText, X, Info } from 'lucide-react';
import api from '../services/api';

/* eslint-disable react-hooks/set-state-in-effect */

const PlantConfig = () => {
  const [plants, setPlants] = useState([]);
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
  const [editingPlant, setEditingPlant] = useState(null);
  
  // 🌟 REMOVED companyId FROM MULTI-TENANT INITIAL FORM STATE INPUT METRICS
  const [formData, setFormData] = useState({ 
    plantName: '', plantCode: '', address: '', state: '', gstNumber: '' 
  });

  async function fetchData() {
    try {
      // 🌟 The server filters this response body contextually via JWT session payload parameters
      const plantsRes = await api.get('/plants');
      setPlants(plantsRes?.data?.data || []);
    } catch (err) {
      console.error('Failed to load multi-tenant configuration profile data', err);
      setPlants([]);
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
    setEditingPlant(null);
    setFormData({ plantName: '', plantCode: '', address: '', state: '', gstNumber: '' });
    setIsSlideOverOpen(true);
  };

  const openEditDrawer = (plant) => {
    setEditingPlant(plant);
    setFormData({ 
      plantName: plant.plantName, 
      plantCode: plant.plantCode, 
      address: plant.address, 
      state: plant.state, 
      gstNumber: plant.gstNumber
    });
    setIsSlideOverOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPlant) {
        await api.put(`/plants/${editingPlant.id}`, formData);
        alert('Plant updated successfully');
      } else {
        // 🌟 SERVER SYSTEM HOOK INTERCEPTS AND INJECTS THE USER COMPANY CONTEXT SYSTEMATICALLY
        await api.post('/plants', formData);
        alert('Plant created successfully! Bound to your parent corporate entity partition.');
      }
      setIsSlideOverOpen(false);
      await fetchData();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Error processing request';
      alert(msg);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to deactivate this plant entity?')) {
      try {
        await api.delete(`/plants/${id}`);
        await fetchData();
      } catch {
        alert('Error deactivating plant profile record');
      }
    }
  };

  return (
    <div style={{ width: '100%', color: '#f8fafc', boxSizing: 'border-box' }}>
      
      {/* --- Action Header Bar --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Factory color="#0ea5e9" /> Plant Configuration
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Set up localized regional manufacturing or assembly sites bound to your organization partition.</p>
        </div>
        <button 
          onClick={openAddDrawer}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#0ea5e9', color: '#ffffff', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', transition: 'background 0.2s' }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#0284c7'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#0ea5e9'}
        >
          <Plus size={18} /> Add New Plant
        </button>
      </div>

      {/* --- Responsive Data Grid Table --- */}
      <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '16px', overflowX: 'auto', width: '100%' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8', backgroundColor: '#0f172a' }}>
              <th style={{ padding: '16px 24px', fontWeight: '600' }}>Plant Name & Code</th>
              <th style={{ padding: '16px 24px', fontWeight: '600' }}>Parent Corporate</th>
              <th style={{ padding: '16px 24px', fontWeight: '600' }}>State / GSTIN</th>
              <th style={{ padding: '16px 24px', fontWeight: '600' }}>Plant Address</th>
              <th style={{ padding: '16px 24px', fontWeight: '600', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {plants.map((p) => (
              <tr key={p.id} style={{ borderBottom: '1px solid #334155', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#33415555'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                <td style={{ padding: '18px 24px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontWeight: '600', color: '#ffffff' }}>{p.plantName}</span>
                    <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontFamily: 'monospace' }}>Code: {p.plantCode}</span>
                  </div>
                </td>
                <td style={{ padding: '18px 24px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {/* Displays parent enterprise relation metadata securely fetched via include statements */}
                    <span style={{ fontWeight: '600', color: '#cbd5e1' }}>{p.Company?.companyName || 'N/A'}</span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'monospace' }}>Entity ID: {p.Company?.companyCode || 'N/A'}</span>
                  </div>
                </td>
                <td style={{ padding: '18px 24px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontWeight: '500', color: '#cbd5e1' }}>{p.state}</span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'monospace' }}>{p.gstNumber}</span>
                  </div>
                </td>
                <td style={{ padding: '18px 24px', color: '#94a3b8', maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={14} style={{ flexShrink: 0 }} /> {p.address}
                  </div>
                </td>
                <td style={{ padding: '18px 24px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button onClick={() => openEditDrawer(p)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}><Edit2 size={16} /></button>
                    <button onClick={() => handleDelete(p.id)} style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', padding: '4px' }}><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {plants.length === 0 && (
              <tr>
                <td colSpan="5" style={{ padding: '48px 24px', textAlign: 'center', color: '#64748b' }}>No localized plant records found within this tenant scope directory.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- Slide-Over Form Drawer --- */}
      {isSlideOverOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '450px', height: '100%', backgroundColor: '#1e293b', borderLeft: '1px solid #334155', display: 'flex', flexDirection: 'column' }}>
            
            {/* Drawer Header */}
            <div style={{ height: '64px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 24px' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}><FileText size={20} color="#0ea5e9" /> {editingPlant ? 'Edit Regional Plant' : 'Add Regional Plant'}</h3>
              <button onClick={() => setIsSlideOverOpen(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            {/* Form Inputs */}
            <form onSubmit={handleSubmit} style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
              
              {/* 🌟 READ-ONLY TENANT INDICATOR: Visible exclusively during active modification contexts */}
              {editingPlant && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#64748b', marginBottom: '6px' }}>Assigned Parent Corporate Context</label>
                  <input 
                    type="text" 
                    value={`${editingPlant.Company?.companyName || 'N/A'} (Code: ${editingPlant.Company?.companyCode || 'N/A'})`} 
                    disabled 
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#64748b', fontWeight: 'bold', outline: 'none', cursor: 'not-allowed' }} 
                  />
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#cbd5e1', marginBottom: '6px' }}>Plant Name *</label>
                <input type="text" name="plantName" value={formData.plantName} onChange={handleInputChange} required style={{ width: '100%', padding: '12px', borderRadius: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', color: 'white', outline: 'none' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#cbd5e1', marginBottom: '6px' }}>Plant Code (Alphanumeric identifier) *</label>
                <input type="text" name="plantCode" value={formData.plantCode} onChange={handleInputChange} placeholder="e.g. PLT-HYD-01" required style={{ width: '100%', padding: '12px', borderRadius: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', color: 'white', outline: 'none', textTransform: 'uppercase' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#cbd5e1', marginBottom: '6px' }}>State Name *</label>
                <input type="text" name="state" value={formData.state} onChange={handleInputChange} required style={{ width: '100%', padding: '12px', borderRadius: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', color: 'white', outline: 'none' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#cbd5e1', marginBottom: '6px' }}>GST Number *</label>
                <input type="text" name="gstNumber" value={formData.gstNumber} onChange={handleInputChange} required style={{ width: '100%', padding: '12px', borderRadius: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', color: 'white', outline: 'none', fontFamily: 'monospace', textTransform: 'uppercase' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#cbd5e1', marginBottom: '6px' }}>Plant Site Address *</label>
                <textarea name="address" value={formData.address} onChange={handleInputChange} rows="3" required style={{ width: '100%', padding: '12px', borderRadius: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', color: 'white', outline: 'none', resize: 'vertical' }}></textarea>
              </div>

              {!editingPlant && (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', backgroundColor: '#0f172a', border: '1px solid #334155', padding: '10px', borderRadius: '8px' }}>
                  <Info size={16} color="#0ea5e9" style={{ shrink: 0 }} />
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    Asset Security Warning: This plant will automatically lock context to your current logged-in enterprise tier scope.
                  </span>
                </div>
              )}

              <div style={{ marginTop: 'auto', paddingTop: '16px', display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setIsSlideOverOpen(false)} style={{ flex: 1, padding: '12px', borderRadius: '10px', backgroundColor: '#334155', color: 'white', border: 'none', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ flex: 1, padding: '12px', borderRadius: '10px', backgroundColor: '#0ea5e9', color: 'white', border: 'none', fontWeight: '600', cursor: 'pointer' }}>{editingPlant ? 'Update Plant' : 'Save Plant'}</button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default PlantConfig;