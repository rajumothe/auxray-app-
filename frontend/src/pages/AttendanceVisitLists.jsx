import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../services/api';

/* eslint-disable react-hooks/set-state-in-effect */

const styles = {
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

const AttendanceVisitLists = () => {
  const [fromDate, setFromDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return toDateInputValue(date);
  });
  const [toDate, setToDate] = useState(() => toDateInputValue(new Date()));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [attendance, setAttendance] = useState([]);
  const [visits, setVisits] = useState([]);

  const query = useMemo(() => ({ fromDate, toDate }), [fromDate, toDate]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [attendanceRes, visitRes] = await Promise.all([
        api.get('/web-lists/attendance', { params: query }),
        api.get('/web-lists/visits', { params: query }),
      ]);
      setAttendance(attendanceRes.data?.data || []);
      setVisits(visitRes.data?.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load attendance/visit lists.');
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  return (
    <div>
      <div style={styles.card}>
        <h3 style={styles.title}>Attendance and Visit Lists</h3>
        <div style={styles.muted}>Date range applies to attendance date and visit date.</div>
        <div style={styles.row}>
          <div>
            <label style={styles.label}>From Date</label>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} style={styles.input} />
          </div>
          <div>
            <label style={styles.label}>To Date</label>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} style={styles.input} />
          </div>
          <button style={styles.button} onClick={fetchData}>Apply Filter</button>
        </div>
        {error ? <div style={{ color: '#fca5a5', marginTop: '10px' }}>{error}</div> : null}
      </div>

      <div style={styles.card}>
        <h3 style={styles.title}>Employee Attendance ({attendance.length})</h3>
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Employee</th>
                <th style={styles.th}>Role</th>
                <th style={styles.th}>Check In</th>
                <th style={styles.th}>Check Out</th>
                <th style={styles.th}>Work Hours</th>
                <th style={styles.th}>KM Traveled</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td style={styles.td} colSpan={7}>Loading...</td></tr>
              ) : attendance.length === 0 ? (
                <tr><td style={styles.td} colSpan={7}>No attendance records found.</td></tr>
              ) : (
                attendance.map((row) => (
                  <tr key={row.id}>
                    <td style={styles.td}>{row.date}</td>
                    <td style={styles.td}>{row.empId || '-'} / {row.employeeName || '-'}</td>
                    <td style={styles.td}>{row.role || '-'}</td>
                    <td style={styles.td}>{row.checkInTime ? new Date(row.checkInTime).toLocaleString() : '-'}</td>
                    <td style={styles.td}>{row.checkOutTime ? new Date(row.checkOutTime).toLocaleString() : '-'}</td>
                    <td style={styles.td}>{row.totalWorkHours ?? '-'}</td>
                    <td style={styles.td}>{row.totalKmsTraveled ?? '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div style={styles.card}>
        <h3 style={styles.title}>Visit List ({visits.length})</h3>
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Visit Date</th>
                <th style={styles.th}>Employee</th>
                <th style={styles.th}>Role</th>
                <th style={styles.th}>Lead</th>
                <th style={styles.th}>Customer</th>
                <th style={styles.th}>Purpose</th>
                <th style={styles.th}>Check In</th>
                <th style={styles.th}>Check Out</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td style={styles.td} colSpan={8}>Loading...</td></tr>
              ) : visits.length === 0 ? (
                <tr><td style={styles.td} colSpan={8}>No visit records found.</td></tr>
              ) : (
                visits.map((row) => (
                  <tr key={row.id}>
                    <td style={styles.td}>{row.visitDate}</td>
                    <td style={styles.td}>{row.empId || '-'} / {row.employeeName || '-'}</td>
                    <td style={styles.td}>{row.role || '-'}</td>
                    <td style={styles.td}>{row.leadName || '-'} {row.leadContactNumber ? `(${row.leadContactNumber})` : ''}</td>
                    <td style={styles.td}>{row.customerName || '-'} {row.customerContactNumber ? `(${row.customerContactNumber})` : ''}</td>
                    <td style={styles.td}>{row.purpose || '-'}</td>
                    <td style={styles.td}>{row.checkInTime ? new Date(row.checkInTime).toLocaleString() : '-'}</td>
                    <td style={styles.td}>{row.checkOutTime ? new Date(row.checkOutTime).toLocaleString() : '-'}</td>
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

export default AttendanceVisitLists;
