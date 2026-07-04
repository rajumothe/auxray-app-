import { useState, useEffect } from 'react';
import { Navigation, Plus, Edit2, Trash2, FileText, X, Hash } from 'lucide-react';
import api from '../services/api';

/* eslint-disable react-hooks/set-state-in-effect */

const RouteConfig = () => {
  const [routes, setRoutes] = useState([]);
  const [offices, setOffices] = useState([]);
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [formData, setFormData] = useState({ serialNumber: '', routeName: '', routeCode: '', salesOfficeId: '' });

  async function fetchData() {
    try {
      const [routesRes, officesRes] = await Promise.all([
        api.get('/routes'),
        api.get('/sales-offices')
      ]);
      setRoutes(routesRes?.data?.data || []);
      setOffices(officesRes?.data?.data || []);
    } catch (err) {
      console.error('Failed to load Route data', err);
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
    setEditingRoute(null);
    setFormData({ serialNumber: '', routeName: '', routeCode: '', salesOfficeId: '' });
    setIsSlideOverOpen(true);
  };

  const openEditDrawer = (route) => {
    setEditingRoute(route);
    setFormData({ 
      serialNumber: route.serialNumber, 
      routeName: route.routeName, 
      routeCode: route.routeCode, 
      salesOfficeId: route.SalesOffice?.id || '' 
    });
    setIsSlideOverOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRoute) {
        await api.put(`/routes/${editingRoute.id}`, formData);
        alert('Route updated successfully');
      } else {
        await api.post('/routes', formData);
        alert('Route created successfully');
      }
      setIsSlideOverOpen(false);
      await fetchData();
    } catch (err) {
      const msg = err.response?.data?.message || 'Error processing request';
      alert(msg);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to deactivate this Route?')) {
      try {
        await api.delete(`/routes/${id}`);
        await fetchData();
      } catch {
        alert('Error deactivating Route');
      }
    }
  };

  return (
    <div style={{ width: '100%', color: '#f8fafc', boxSizing: 'border-box' }}>
      
      {/* --- Action Header Bar --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Navigation color="#0ea5e9" /> Route Configuration
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Manage geographical field routes linked to downstream Sales Offices.</p>
        </div>
        <button 
          onClick={openAddDrawer}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#0ea5e9', color: '#ffffff', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', transition: 'background 0.2s' }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#0284c7'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#0ea5e9'}
        >
          <Plus size={18} /> Add Route
        </button>
      </div>

      {/* --- Responsive Data Grid Table --- */}
      <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '16px', overflowX: 'auto', width: '100%' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8', backgroundColor: '#0f172a' }}>
              <th style={{ padding: '16px 24px', fontWeight: '600' }}>Route Name & Code</th>
              <th style={{ padding: '16px 24px', fontWeight: '600' }}>Serial Number</th>
              <th style={{ padding: '16px 24px', fontWeight: '600' }}>Parent Sales Office</th>
              <th style={{ padding: '16px 24px', fontWeight: '600', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {routes.map((r) => (
              <tr key={r.id} style={{ borderBottom: '1px solid #334155', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#33415555'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                <td style={{ padding: '18px 24px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontWeight: '600', color: '#ffffff' }}>{r.routeName}</span>
                    <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontFamily: 'monospace' }}>Code: {r.routeCode}</span>
                  </div>
                </td>
                <td style={{ padding: '18px 24px', fontFamily: 'monospace', color: '#cbd5e1' }}><Hash size={14} style={{ display: 'inline' }} />{r.serialNumber}</td>
                <td style={{ padding: '18px 24px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontWeight: '600', color: '#cbd5e1' }}>{r.SalesOffice?.officeName || 'N/A'}</span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'monospace' }}>Office Code: {r.SalesOffice?.officeCode || 'N/A'}</span>
                  </div>
                </td>
                <td style={{ padding: '18px 24px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button onClick={() => openEditDrawer(r)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}><Edit2 size={16} /></button>
                    <button onClick={() => handleDelete(r.id)} style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', padding: '4px' }}><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {routes.length === 0 && (
              <tr>
                <td colSpan="4" style={{ padding: '48px 24px', textAlign: 'center', color: '#64748b' }}>No route records found</td>
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
              <h3 style={{ fontSize: '1.125rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}><FileText size={20} color="#0ea5e9" /> {editingRoute ? 'Edit Route' : 'Add Route'}</h3>
              <button onClick={() => setIsSlideOverOpen(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            {/* Form Inputs */}
            <form onSubmit={handleSubmit} style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#cbd5e1', marginBottom: '6px' }}>Select Parent Sales Office *</label>
                <select name="salesOfficeId" value={formData.salesOfficeId} onChange={handleInputChange} required style={{ width: '100%', padding: '12px', borderRadius: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', color: 'white', outline: 'none' }}>
                  <option value="">-- Choose Sales Office --</option>
                  {offices.map(o => (
                    <option key={o.id} value={o.id}>{o.officeName} ({o.officeCode})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#cbd5e1', marginBottom: '6px' }}>Route Name *</label>
                <input type="text" name="routeName" value={formData.routeName} onChange={handleInputChange} required style={{ width: '100%', padding: '12px', borderRadius: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', color: 'white', outline: 'none' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#cbd5e1', marginBottom: '6px' }}>Route Code *</label>
                <input type="text" name="routeCode" value={formData.routeCode} onChange={handleInputChange} placeholder="e.g. RTE-HYD-01" required style={{ width: '100%', padding: '12px', borderRadius: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', color: 'white', outline: 'none', textTransform: 'uppercase' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#cbd5e1', marginBottom: '6px' }}>Serial Number *</label>
                <input type="text" name="serialNumber" value={formData.serialNumber} onChange={handleInputChange} placeholder="e.g. SR-001" required style={{ width: '100%', padding: '12px', borderRadius: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', color: 'white', outline: 'none', fontFamily: 'monospace' }} />
              </div>

              <div style={{ marginTop: 'auto', paddingTop: '16px', display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setIsSlideOverOpen(false)} style={{ flex: 1, padding: '12px', borderRadius: '10px', backgroundColor: '#334155', color: 'white', border: 'none', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ flex: 1, padding: '12px', borderRadius: '10px', backgroundColor: '#0ea5e9', color: 'white', border: 'none', fontWeight: '600', cursor: 'pointer' }}>{editingRoute ? 'Update Route' : 'Save Route'}</button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default RouteConfig;