import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../services/api';

/* eslint-disable react-hooks/set-state-in-effect */

const pageStyle = {
  card: {
    background: '#111827',
    border: '1px solid #334155',
    borderRadius: '14px',
    padding: '20px',
    marginBottom: '20px',
  },
  title: { color: '#fff', margin: 0, fontSize: '1.1rem' },
  muted: { color: '#94a3b8', fontSize: '0.9rem', marginTop: '6px' },
  row: { display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'end', marginTop: '14px' },
  label: { color: '#cbd5e1', fontSize: '0.85rem', display: 'block', marginBottom: '6px' },
  input: {
    background: '#0f172a',
    border: '1px solid #334155',
    color: '#e2e8f0',
    borderRadius: '8px',
    padding: '9px 10px',
    minWidth: '180px',
  },
  button: {
    background: '#0ea5e9',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 16px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  tableWrap: { overflowX: 'auto', marginTop: '14px', border: '1px solid #334155', borderRadius: '10px' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: '900px' },
  th: { textAlign: 'left', padding: '10px', color: '#cbd5e1', borderBottom: '1px solid #334155', background: '#0b1220' },
  td: { padding: '10px', color: '#e2e8f0', borderBottom: '1px solid #1f2937', fontSize: '0.9rem' },
};

const toDateInputValue = (d) => d.toISOString().slice(0, 10);

const CustomerLeadLists = () => {
  const [fromDate, setFromDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return toDateInputValue(date);
  });
  const [toDate, setToDate] = useState(() => toDateInputValue(new Date()));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [customers, setCustomers] = useState([]);
  const [leads, setLeads] = useState([]);

  const query = useMemo(() => ({ fromDate, toDate }), [fromDate, toDate]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [customerRes, leadRes] = await Promise.all([
        api.get('/web-lists/customers', { params: query }),
        api.get('/web-lists/leads', { params: query }),
      ]);
      setCustomers(customerRes.data?.data || []);
      setLeads(leadRes.data?.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load customer/lead lists.');
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  return (
    <div>
      <div style={pageStyle.card}>
        <h3 style={pageStyle.title}>Customers and Leads</h3>
        <div style={pageStyle.muted}>Date range filter applies to record creation date.</div>
        <div style={pageStyle.row}>
          <div>
            <label style={pageStyle.label}>From Date</label>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} style={pageStyle.input} />
          </div>
          <div>
            <label style={pageStyle.label}>To Date</label>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} style={pageStyle.input} />
          </div>
          <button style={pageStyle.button} onClick={fetchData}>Apply Filter</button>
        </div>
        {error ? <div style={{ color: '#fca5a5', marginTop: '10px' }}>{error}</div> : null}
      </div>

      <div style={pageStyle.card}>
        <h3 style={pageStyle.title}>Customer List ({customers.length})</h3>
        <div style={pageStyle.tableWrap}>
          <table style={pageStyle.table}>
            <thead>
              <tr>
                <th style={pageStyle.th}>Customer</th>
                <th style={pageStyle.th}>Contact</th>
                <th style={pageStyle.th}>Route</th>
                <th style={pageStyle.th}>Sales Office</th>
                <th style={pageStyle.th}>Plant</th>
                <th style={pageStyle.th}>Created On</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td style={pageStyle.td} colSpan={6}>Loading...</td></tr>
              ) : customers.length === 0 ? (
                <tr><td style={pageStyle.td} colSpan={6}>No customer records found.</td></tr>
              ) : (
                customers.map((row) => (
                  <tr key={row.id}>
                    <td style={pageStyle.td}>{row.customerName}</td>
                    <td style={pageStyle.td}>{row.contactNumber}</td>
                    <td style={pageStyle.td}>{row.routeCode || '-'} / {row.routeName || '-'}</td>
                    <td style={pageStyle.td}>{row.officeCode || '-'} / {row.officeName || '-'}</td>
                    <td style={pageStyle.td}>{row.plantCode || '-'} / {row.plantName || '-'}</td>
                    <td style={pageStyle.td}>{new Date(row.createdAt).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div style={pageStyle.card}>
        <h3 style={pageStyle.title}>Lead List ({leads.length})</h3>
        <div style={pageStyle.tableWrap}>
          <table style={pageStyle.table}>
            <thead>
              <tr>
                <th style={pageStyle.th}>Lead</th>
                <th style={pageStyle.th}>Contact</th>
                <th style={pageStyle.th}>Status</th>
                <th style={pageStyle.th}>Stage</th>
                <th style={pageStyle.th}>Unit Capacity</th>
                <th style={pageStyle.th}>Route</th>
                <th style={pageStyle.th}>Executive</th>
                <th style={pageStyle.th}>Created On</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td style={pageStyle.td} colSpan={8}>Loading...</td></tr>
              ) : leads.length === 0 ? (
                <tr><td style={pageStyle.td} colSpan={8}>No lead records found.</td></tr>
              ) : (
                leads.map((row) => (
                  <tr key={row.id}>
                    <td style={pageStyle.td}>{row.leadName}</td>
                    <td style={pageStyle.td}>{row.contactNumber}</td>
                    <td style={pageStyle.td}>{row.status || '-'}</td>
                    <td style={pageStyle.td}>{row.stage || '-'}</td>
                    <td style={pageStyle.td}>{row.unitCapacitySelection || '-'}</td>
                    <td style={pageStyle.td}>{row.routeCode || '-'} / {row.routeName || '-'}</td>
                    <td style={pageStyle.td}>{row.executiveEmpId || '-'} / {row.executiveName || '-'}</td>
                    <td style={pageStyle.td}>{new Date(row.createdAt).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CustomerLeadLists;
