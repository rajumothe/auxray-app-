import { useCallback, useState, useEffect } from 'react';
import { IndianRupee, Plus, Percent, X, ChevronRight, Layers } from 'lucide-react';
import api from '../services/api';

/* eslint-disable react-hooks/set-state-in-effect */

const PriceTaxConfig = () => {
  const [activeTab, setActiveTab] = useState('price'); // 'price' or 'tax'
  const [prices, setPrices] = useState([]);
  const [taxes, setTaxes] = useState([]);
  const [skus, setSkus] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [plants, setPlants] = useState([]);
  const [salesOffices, setSalesOffices] = useState([]);
  const [routes, setRoutes] = useState([]);
  
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
  const [priceForm, setPriceForm] = useState({ skuId: '', price: '', effectiveFrom: '', effectiveTo: '', companyId: '', plantId: '', salesOfficeId: '', routeId: '' });
  const [taxForm, setTaxForm] = useState({ skuId: '', state: '', cgstRate: '0', sgstRate: '0', igstRate: '0', hsnCode: '' });

  const loadMasterData = useCallback(async () => {
    try {
      const results = await Promise.allSettled([
        api.get('/skus'), 
        api.get('/companies'), 
        api.get('/plants'),
        api.get('/sales-offices'), 
        api.get('/routes'),
        activeTab === 'price' ? api.get('/pricing/prices') : api.get('/pricing/taxes')
      ]);
      
      // Robust unpacking utility protecting against different API envelope wraps
      const unpack = (result) => {
        if (result.status === 'fulfilled') {
          const payload = result.value?.data;
          if (!payload) return [];
          if (Array.isArray(payload)) return payload;
          if (Array.isArray(payload.data)) return payload.data;
        }
        return [];
      };

      // Log network tracking alerts for debugging broken endpoints in your browser console
      results.forEach((res, index) => {
        if (res.status === 'rejected') {
          const endpoints = ['/skus', '/companies', '/plants', '/sales-offices', '/routes', activeTab === 'price' ? '/pricing/prices' : '/pricing/taxes'];
          console.error(`Endpoint failed to resolve: ${endpoints[index]}`, res.reason);
        }
      });

      setSkus(unpack(results[0]));
      setCompanies(unpack(results[1]));
      setPlants(unpack(results[2]));
      setSalesOffices(unpack(results[3]));
      setRoutes(unpack(results[4]));
      
      const mainData = unpack(results[5]);
      if (activeTab === 'price') {
        setPrices(mainData);
      } else {
        setTaxes(mainData);
      }
    } catch (err) {
      console.error('Fatal tracking error in fallback processor', err);
    }
  }, [activeTab]);

  useEffect(() => {
    void loadMasterData();
  }, [loadMasterData]);

  const handlePriceSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/pricing/prices', priceForm);
      alert('Hierarchical price parameter applied successfully');
      setIsSlideOverOpen(false);
      setPriceForm({ skuId: '', price: '', effectiveFrom: '', effectiveTo: '', companyId: '', plantId: '', salesOfficeId: '', routeId: '' });
      loadMasterData();
    } catch (err) { 
      alert(err.response?.data?.message || 'Error processing rate override rule'); 
    }
  };

  const handleTaxSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/pricing/taxes', taxForm);
      alert('Statutory state tax mapping updated');
      setIsSlideOverOpen(false);
      setTaxForm({ skuId: '', state: '', cgstRate: '0', sgstRate: '0', igstRate: '0', hsnCode: '' });
      loadMasterData();
    } catch (err) { 
      alert(err.response?.data?.message || 'Error mapping tax schedule'); 
    }
  };

  return (
    <div style={{ width: '100%', color: '#f8fafc', boxSizing: 'border-box' }}>
      
      {/* --- Tab Switcher Row --- */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', backgroundColor: '#0f172a', padding: '6px', borderRadius: '12px', width: 'fit-content', border: '1px solid #334155' }}>
        <button onClick={() => setActiveTab('price')} style={{ padding: '8px 16px', borderRadius: '8px', fontWeight: '600', fontSize: '0.875rem', cursor: 'pointer', backgroundColor: activeTab === 'price' ? '#1e293b' : 'transparent', color: activeTab === 'price' ? '#0ea5e9' : '#94a3b8', border: 'none' }}>
          <IndianRupee size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }} /> Hierarchical Price Master
        </button>
        <button onClick={() => setActiveTab('tax')} style={{ padding: '8px 16px', borderRadius: '8px', fontWeight: '600', fontSize: '0.875rem', cursor: 'pointer', backgroundColor: activeTab === 'tax' ? '#1e293b' : 'transparent', color: activeTab === 'tax' ? '#0ea5e9' : '#94a3b8', border: 'none' }}>
          <Percent size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }} /> State Tax Matrix
        </button>
      </div>

      {/* --- Action Info Header --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '4px' }}>
            {activeTab === 'price' ? 'Base & Hierarchical Override Pricing' : 'Statutory State GST Configuration'}
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
            {activeTab === 'price' ? 'Configure fallbacks checking explicit nodes starting at Route up to global Company scopes.' : 'Manage country-wide HSN classification tracking structures.'}
          </p>
        </div>
        <button onClick={() => setIsSlideOverOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#0ea5e9', color: '#ffffff', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: '600', cursor: 'pointer' }}>
          <Plus size={18} /> Add {activeTab === 'price' ? 'Pricing Rule' : 'Tax Map'}
        </button>
      </div>

      {/* --- DATA GRIDS --- */}
      {activeTab === 'price' ? (
        <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '16px', overflowX: 'auto', width: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8', backgroundColor: '#0f172a' }}>
                <th style={{ padding: '16px 24px', fontWeight: '600' }}>SKU Info</th>
                <th style={{ padding: '16px 24px', fontWeight: '600' }}>Hierarchical Assignment Limit</th>
                <th style={{ padding: '16px 24px', fontWeight: '600' }}>Validity Horizon</th>
                <th style={{ padding: '16px 24px', fontWeight: '600' }}>Rate Value (INR)</th>
              </tr>
            </thead>
            <tbody>
              {prices.map(p => {
                const itemData = p.SKU || p.sku || {};
                const displayCode = itemData.itemCode !== undefined ? String(itemData.itemCode).padStart(5, '0') : '00000';
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid #334155' }}>
                    <td style={{ padding: '18px 24px', fontWeight: '600', color: '#fff' }}>
                      {itemData.itemName || 'Unknown Item'} <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontFamily: 'monospace' }}>(#{displayCode})</span>
                    </td>
                    <td style={{ padding: '18px 24px', color: '#cbd5e1' }}>
                      {p.routeId ? `Route: ${p.Route?.routeName || p.route?.routeName}` : p.salesOfficeId ? `Office: ${p.SalesOffice?.officeName || p.salesOffice?.officeName}` : p.plantId ? `Plant: ${p.Plant?.plantName || p.plant?.plantName}` : p.companyId ? `Company: ${p.Company?.companyName || p.company?.companyName}` : <span style={{ color: '#64748b' }}>Global Standard Base</span>}
                    </td>
                    <td style={{ padding: '18px 24px', fontFamily: 'monospace', color: '#94a3b8' }}>
                      {p.effectiveFrom} <ChevronRight size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> {p.effectiveTo || 'Indefinite'}
                    </td>
                    <td style={{ padding: '18px 24px', fontWeight: '700', color: '#22c55e' }}>
                      ₹{Number(p.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}
              {prices.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>No operational price metrics mapped yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '16px', overflowX: 'auto', width: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8', backgroundColor: '#0f172a' }}>
                <th style={{ padding: '16px 24px', fontWeight: '600' }}>Target SKU</th>
                <th style={{ padding: '16px 24px', fontWeight: '600' }}>State Jurisdiction</th>
                <th style={{ padding: '16px 24px', fontWeight: '600' }}>HSN Code</th>
                <th style={{ padding: '16px 24px', fontWeight: '600' }}>CGST / SGST</th>
                <th style={{ padding: '16px 24px', fontWeight: '600' }}>IGST Vector</th>
              </tr>
            </thead>
            <tbody>
              {taxes.map(t => {
                const itemData = t.SKU || t.sku || {};
                return (
                  <tr key={t.id} style={{ borderBottom: '1px solid #334155' }}>
                    <td style={{ padding: '18px 24px', color: '#fff', fontWeight: '600' }}>{itemData.itemName || 'Unknown Item'}</td>
                    <td style={{ padding: '18px 24px', color: '#cbd5e1', fontWeight: '600' }}>{t.state}</td>
                    <td style={{ padding: '18px 24px', fontFamily: 'monospace', color: '#94a3b8' }}>{t.hsnCode || 'N/A'}</td>
                    <td style={{ padding: '18px 24px', color: '#cbd5e1' }}>{t.cgstRate}% / {t.sgstRate}%</td>
                    <td style={{ padding: '18px 24px', color: '#f43f5e', fontWeight: '700' }}>{t.igstRate}%</td>
                  </tr>
                );
              })}
              {taxes.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>No state compliance rules found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* --- SLIDE-OVER DRAWER FORMS --- */}
      {isSlideOverOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '450px', height: '100%', backgroundColor: '#1e293b', borderLeft: '1px solid #334155', display: 'flex', flexDirection: 'column' }}>
            <div style={{ height: '64px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 24px' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '700' }}>
                {activeTab === 'price' ? 'Configure Level Override' : 'Define State Compliance Bounds'}
              </h3>
              <button onClick={() => setIsSlideOverOpen(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            {activeTab === 'price' ? (
              <form onSubmit={handlePriceSubmit} style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', fontWeight: '500' }}>Target Product SKU *</label>
                  <select required value={priceForm.skuId} onChange={e => setPriceForm({...priceForm, skuId: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', color: 'white', outline: 'none' }}>
                    <option value="">-- Select SKU --</option>
                    {skus.map(s => {
                      const codeStr = s.itemCode !== undefined ? String(s.itemCode).padStart(5, '0') : '00000';
                      return <option key={s.id} value={s.id}>{s.itemName} (#{codeStr})</option>;
                    })}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', fontWeight: '500' }}>Rate Value (INR) *</label>
                  <input type="number" step="0.01" required value={priceForm.price} onChange={e => setPriceForm({...priceForm, price: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', color: 'white', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', fontWeight: '500' }}>Valid From *</label>
                    <input type="date" required value={priceForm.effectiveFrom} onChange={e => setPriceForm({...priceForm, effectiveFrom: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', color: 'white', outline: 'none' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', fontWeight: '500' }}>Valid To</label>
                    <input type="date" value={priceForm.effectiveTo} onChange={e => setPriceForm({...priceForm, effectiveTo: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', color: 'white', outline: 'none' }} />
                  </div>
                </div>
                
                <div style={{ borderTop: '1px solid #334155', paddingTop: '10px', marginTop: '6px' }}>
                  <span style={{ fontSize: '0.8rem', color: '#0ea5e9', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}><Layers size={12} /> Hierarchy Structural Scopes (Choose one override level maximum)</span>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', fontWeight: '500' }}>Company Scope Fallback</label>
                  <select value={priceForm.companyId} onChange={e => setPriceForm({...priceForm, companyId: e.target.value, plantId: '', salesOfficeId: '', routeId: ''})} style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', color: 'white', outline: 'none' }}><option value="">-- None --</option>{companies.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}</select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', fontWeight: '500' }}>Regional Plant Override</label>
                  <select value={priceForm.plantId} onChange={e => setPriceForm({...priceForm, plantId: e.target.value, companyId: '', salesOfficeId: '', routeId: ''})} style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', color: 'white', outline: 'none' }}><option value="">-- None --</option>{plants.map(p => <option key={p.id} value={p.id}>{p.plantName}</option>)}</select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', fontWeight: '500' }}>Sales Office Override</label>
                  <select value={priceForm.salesOfficeId} onChange={e => setPriceForm({...priceForm, salesOfficeId: e.target.value, companyId: '', plantId: '', routeId: ''})} style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', color: 'white', outline: 'none' }}><option value="">-- None --</option>{salesOffices.map(o => <option key={o.id} value={o.id}>{o.officeName}</option>)}</select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', fontWeight: '500' }}>Target Operations Route Override</label>
                  <select value={priceForm.routeId} onChange={e => setPriceForm({...priceForm, routeId: e.target.value, companyId: '', plantId: '', salesOfficeId: ''})} style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', color: 'white', outline: 'none' }}><option value="">-- None --</option>{routes.map(r => <option key={r.id} value={r.id}>{r.routeName}</option>)}</select>
                </div>

                <button type="submit" style={{ marginTop: 'auto', padding: '12px', borderRadius: '10px', backgroundColor: '#0ea5e9', color: 'white', border: 'none', fontWeight: '600', cursor: 'pointer' }}>Commit Pricing Parameter</button>
              </form>
            ) : (
              <form onSubmit={handleTaxSubmit} style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '6px', fontWeight: '500' }}>Target SKU Assignment *</label>
                  <select required value={taxForm.skuId} onChange={e => setTaxForm({...taxForm, skuId: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', color: 'white', outline: 'none' }}>
                    <option value="">-- Select SKU --</option>
                    {skus.map(s => <option key={s.id} value={s.id}>{s.itemName}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '6px', fontWeight: '500' }}>State Name Jurisdiction *</label>
                  <input type="text" required value={taxForm.state} onChange={e => setTaxForm({...taxForm, state: e.target.value})} placeholder="e.g. Telangana" style={{ width: '100%', padding: '12px', borderRadius: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', color: 'white', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '6px', fontWeight: '500' }}>HSN Code Reference</label>
                  <input type="text" value={taxForm.hsnCode} onChange={e => setTaxForm({...taxForm, hsnCode: e.target.value})} placeholder="e.g. 8541" style={{ width: '100%', padding: '12px', borderRadius: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', color: 'white', fontFamily: 'monospace', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '6px', fontWeight: '500' }}>CGST Rate (%)</label>
                    <input type="number" step="0.01" value={taxForm.cgstRate} onChange={e => setTaxForm({...taxForm, cgstRate: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', color: 'white', outline: 'none' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '6px', fontWeight: '500' }}>SGST Rate (%)</label>
                    <input type="number" step="0.01" value={taxForm.sgstRate} onChange={e => setTaxForm({...taxForm, sgstRate: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', color: 'white', outline: 'none' }} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '6px', fontWeight: '500' }}>IGST Rate (%)</label>
                  <input type="number" step="0.01" value={taxForm.igstRate} onChange={e => setTaxForm({...taxForm, igstRate: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', color: 'white', outline: 'none' }} />
                </div>

                <button type="submit" style={{ marginTop: 'auto', padding: '12px', borderRadius: '10px', backgroundColor: '#0ea5e9', color: '#fff', border: 'none', fontWeight: '600', cursor: 'pointer' }}>Save Compliance Rule</button>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

export default PriceTaxConfig;