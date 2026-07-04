import { useState, useEffect } from 'react';
import { Tag, Plus, X } from 'lucide-react';
import api from '../services/api';

/* eslint-disable react-hooks/set-state-in-effect */

const MaterialTypeConfig = () => {
  const [types, setTypes] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ shortCode: '', description: '' });

  async function fetchTypes() {
    try {
      const res = await api.get('/material-types');
      setTypes(res?.data?.data || []);
    } catch (err) { console.error(err); }
  }

  useEffect(() => {
    void fetchTypes();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/material-types', formData);
      alert('Material Type added successfully');
      setIsOpen(false);
      setFormData({ shortCode: '', description: '' });
      fetchTypes();
    } catch (err) { alert(err.response?.data?.message || 'Error saving data'); }
  };

  return (
    <div style={{ width: '100%', color: '#f8fafc' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Tag color="#0ea5e9" /> Material Type Configuration
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Define foundational categorization groups for your enterprise inventory catalog.</p>
        </div>
        <button onClick={() => setIsOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#0ea5e9', color: '#ffffff', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: '600', cursor: 'pointer' }}>
          <Plus size={18} /> Add Material Type
        </button>
      </div>

      <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '16px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8', backgroundColor: '#0f172a' }}>
              <th style={{ padding: '16px 24px', fontWeight: '600', width: '200px' }}>Short Code</th>
              <th style={{ padding: '16px 24px', fontWeight: '600' }}>Description</th>
            </tr>
          </thead>
          <tbody>
            {types.map(t => (
              <tr key={t.id} style={{ borderBottom: '1px solid #334155' }}>
                <td style={{ padding: '18px 24px', fontFamily: 'monospace', color: '#38bdf8', fontWeight: '700' }}>{t.shortCode}</td>
                <td style={{ padding: '18px 24px', color: '#ffffff' }}>{t.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '450px', height: '100%', backgroundColor: '#1e293b', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '700' }}>Add Material Type</h3>
              <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '6px' }}>Short Code (Max 4 Characters) *</label>
                <input type="text" maxLength="4" value={formData.shortCode} onChange={(e) => setFormData({...formData, shortCode: e.target.value})} required style={{ width: '100%', padding: '12px', borderRadius: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', color: 'white', textTransform: 'uppercase' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '6px' }}>Description *</label>
                <input type="text" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} required style={{ width: '100%', padding: '12px', borderRadius: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', color: 'white' }} />
              </div>
              <button type="submit" style={{ padding: '12px', borderRadius: '10px', backgroundColor: '#0ea5e9', color: 'white', border: 'none', fontWeight: '600', cursor: 'pointer' }}>Save Type</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaterialTypeConfig;