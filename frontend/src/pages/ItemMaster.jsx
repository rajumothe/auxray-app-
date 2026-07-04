import { useState, useEffect } from 'react';
import { Package, Plus, Edit2, Trash2, FileText, X, Hash, Tag } from 'lucide-react';
import api from '../services/api';

/* eslint-disable react-hooks/set-state-in-effect */

const ItemMaster = () => {
  const [skus, setSkus] = useState([]);
  const [materialTypes, setMaterialTypes] = useState([]);
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
  const [editingSku, setEditingSku] = useState(null);
  const [formData, setFormData] = useState({ itemName: '', uom: 'PC', materialTypeId: '' });

  const uomList = ['PC', 'Boxes', 'Mtrs', 'Eachs', 'Sets'];

  async function fetchMasterData() {
    try {
      const [skusResponse, typesResponse] = await Promise.all([
        api.get('/skus'),
        api.get('/material-types')
      ]);
      setSkus(skusResponse?.data?.data || []);
      setMaterialTypes(typesResponse?.data?.data || []);
    } catch (err) {
      console.error('Failed to load SKU master catalog context data chains', err);
    }
  }

  useEffect(() => {
    void fetchMasterData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const openAddDrawer = () => {
    setEditingSku(null);
    setFormData({ itemName: '', uom: 'PC', materialTypeId: '' });
    setIsSlideOverOpen(true);
  };

  const openEditDrawer = (sku) => {
    setEditingSku(sku);
    setFormData({ 
      itemName: sku.itemName, 
      uom: sku.uom,
      materialTypeId: sku.materialTypeId || '' 
    });
    setIsSlideOverOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSku) {
        await api.put(`/skus/${editingSku.id}`, formData);
        alert('SKU master record updated successfully');
      } else {
        await api.post('/skus', formData);
        alert('New SKU cataloged successfully');
      }
      setIsSlideOverOpen(false);
      await fetchMasterData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error processing product SKU data');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to retire this SKU from active inventories?')) {
      try {
        await api.delete(`/skus/${id}`);
        await fetchMasterData();
      } catch {
        alert('Error retiring SKU index');
      }
    }
  };

  return (
    <div style={{ width: '100%', color: '#f8fafc', boxSizing: 'border-box' }}>
      
      {/* Header Panel */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Package color="#0ea5e9" /> SKU Master Catalog
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Universal commercial product configuration parameters, indexing tracking codes, and operational units of measurement.</p>
        </div>
        <button onClick={openAddDrawer} style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#0ea5e9', color: '#ffffff', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: '600', cursor: 'pointer' }}>
          <Plus size={18} /> Register New SKU
        </button>
      </div>

      {/* Main Table Grid */}
      <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '16px', overflowX: 'auto', width: '100%' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8', backgroundColor: '#0f172a' }}>
              <th style={{ padding: '16px 24px', fontWeight: '600', width: '150px' }}>System Item Code</th>
              <th style={{ padding: '16px 24px', fontWeight: '600' }}>Item Display Name</th>
              <th style={{ padding: '16px 24px', fontWeight: '600' }}>Material Classification</th>
              <th style={{ padding: '16px 24px', fontWeight: '600', width: '150px' }}>UOM Assignment</th>
              <th style={{ padding: '16px 24px', fontWeight: '600', textAlign: 'right', width: '120px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {skus.map((sku) => (
              <tr key={sku.id} style={{ borderBottom: '1px solid #334155' }}>
                <td style={{ padding: '18px 24px', fontFamily: 'monospace', color: '#38bdf8', fontWeight: '600' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Hash size={14} />
                    {String(sku.itemCode).padStart(5, '0')}
                  </div>
                </td>
                <td style={{ padding: '18px 24px', color: '#ffffff', fontWeight: '600' }}>{sku.itemName}</td>
                <td style={{ padding: '18px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#cbd5e1' }}>
                    <Tag size={14} style={{ color: '#0ea5e9' }} />
                    <span>{sku.MaterialType?.description || 'N/A'}</span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>[{sku.MaterialType?.shortCode || 'N/A'}]</span>
                  </div>
                </td>
                <td style={{ padding: '18px 24px' }}>
                  <span style={{ backgroundColor: '#0f172a', padding: '6px 12px', borderRadius: '8px', border: '1px solid #334155', color: '#cbd5e1', fontSize: '0.8rem', fontWeight: '500' }}>{sku.uom}</span>
                </td>
                <td style={{ padding: '18px 24px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button onClick={() => openEditDrawer(sku)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><Edit2 size={16} /></button>
                    <button onClick={() => handleDelete(sku.id)} style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer' }}><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {skus.length === 0 && (
              <tr>
                <td colSpan="5" style={{ padding: '48px 24px', textAlign: 'center', color: '#64748b' }}>No items added to SKU master registry yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Slide-Over Drawer Form */}
      {isSlideOverOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '450px', height: '100%', backgroundColor: '#1e293b', borderLeft: '1px solid #334155', display: 'flex', flexDirection: 'column' }}>
            <div style={{ height: '64px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 24px' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}><FileText size={20} color="#0ea5e9" /> {editingSku ? 'Edit SKU Parameters' : 'Catalog New SKU'}</h3>
              <button onClick={() => setIsSlideOverOpen(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
              
              {/* Material Type Dropdown Selection */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '6px' }}>Material Type Assignment *</label>
                <select name="materialTypeId" value={formData.materialTypeId} onChange={handleInputChange} required style={{ width: '100%', padding: '12px', borderRadius: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', color: 'white', outline: 'none' }}>
                  <option value="">-- Choose Classification --</option>
                  {materialTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.description} ({type.shortCode})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '6px' }}>Item Name *</label>
                <input type="text" name="itemName" value={formData.itemName} onChange={handleInputChange} required placeholder="e.g. Solar Mono Panel 550W" style={{ width: '100%', padding: '12px', borderRadius: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', color: 'white', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '6px' }}>Unit of Measurement (UOM) *</label>
                <select name="uom" value={formData.uom} onChange={handleInputChange} required style={{ width: '100%', padding: '12px', borderRadius: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', color: 'white', outline: 'none' }}>
                  {uomList.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>

              <div style={{ marginTop: 'auto', display: 'flex', gap: '12px', paddingTop: '16px' }}>
                <button type="button" onClick={() => setIsSlideOverOpen(false)} style={{ flex: 1, padding: '12px', borderRadius: '10px', backgroundColor: '#334155', color: 'white', border: 'none', fontWeight: '600' }}>Cancel</button>
                <button type="submit" style={{ flex: 1, padding: '12px', borderRadius: '10px', backgroundColor: '#0ea5e9', color: 'white', border: 'none', fontWeight: '600' }}>{editingSku ? 'Update Master' : 'Publish SKU'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemMaster;