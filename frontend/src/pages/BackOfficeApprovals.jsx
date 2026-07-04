import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../services/api';

/* eslint-disable react-hooks/set-state-in-effect */

const stageLabel = (stage) => {
  if (!stage) return 'UNKNOWN';
  if (stage === 'ASM_APPROVED') return 'Pending Back Office Review';
  if (stage === 'PENDING_BACK_OFFICE_REVIEW') return 'Pending Back Office Review';
  if (stage === 'BACK_OFFICE_APPROVED') return 'Back Office Approved';
  if (stage === 'LOAN_INITIATED') return 'Bank Loan / Payment Initiated';
  if (stage === 'MATERIAL_DISPATCHED') return 'Order Dispatched';
  if (stage === 'TECHNICIAN_VISITED') return 'Technician Visited';
  return String(stage).replace(/_/g, ' ');
};

const nextActionForStage = (stage) => {
  if (stage === 'ASM_APPROVED' || stage === 'PENDING_BACK_OFFICE_REVIEW') {
    return { action: 'BACK_OFFICE_APPROVE', label: 'Back Office Approve' };
  }
  if (stage === 'BACK_OFFICE_APPROVED') {
    return { action: 'CREATE_CUSTOMER', label: 'Create Customer' };
  }
  if (stage === 'CUSTOMER_CREATED') {
    return { action: 'INITIATE_LOAN', label: 'Initiate Bank Loan / Payment' };
  }
  if (stage === 'LOAN_INITIATED') {
    return { action: 'PAYMENT_COMPLETED', label: 'Mark Payment Completed' };
  }
  if (stage === 'PAYMENT_COMPLETED') {
    return { action: 'ORDER_CONFIRMED', label: 'Order Confirmed' };
  }
  if (stage === 'ORDER_CONFIRMED') {
    return { action: 'MATERIAL_DISPATCHED', label: 'Order Dispatched' };
  }
  if (stage === 'MATERIAL_DISPATCHED' || stage === 'MATERIAL_DELIVERED') {
    return { action: 'ASSIGN_TECHNICIAN', label: 'Assign Technician (Auto by Route)' };
  }
  if (stage === 'TECHNICIAN_ASSIGNED') {
    return { action: 'TECHNICIAN_VISITED', label: 'Technician Visited' };
  }
  if (stage === 'TECHNICIAN_VISITED') {
    return { action: 'INSTALLATION_START', label: 'Start Installation' };
  }
  if (stage === 'INSTALLATION_IN_PROGRESS') {
    return { action: 'INSTALLATION_COMPLETE', label: 'Complete Process' };
  }
  return null;
};

function BackOfficeApprovals() {
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState('');
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState('');
  const [technicianOptionsByLead, setTechnicianOptionsByLead] = useState({});
  const [selectedTechnicianByLead, setSelectedTechnicianByLead] = useState({});

  const loadTechniciansForLead = async (leadId, routeId) => {
    try {
      const response = await api.get('/mobile/technicians', { params: { routeId } });
      const options = response?.data?.data || [];
      setTechnicianOptionsByLead((prev) => ({ ...prev, [leadId]: options }));
      if (options.length > 0) {
        setSelectedTechnicianByLead((prev) => ({ ...prev, [leadId]: prev[leadId] || options[0].id }));
      }
    } catch {
      setTechnicianOptionsByLead((prev) => ({ ...prev, [leadId]: [] }));
    }
  };

  const fetchQueue = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/mobile/leads/approval-queue');
      const queue = response?.data?.data || [];
      setRows(queue);

      queue
        .filter((r) => r.stage === 'MATERIAL_DISPATCHED' || r.stage === 'MATERIAL_DELIVERED')
        .forEach((r) => {
          loadTechniciansForLead(r.id, r.routeId);
        });
    } catch (error) {
      setRows([]);
      alert(error?.response?.data?.message || 'Unable to fetch approval queue.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const filteredRows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((row) => {
      return (
        row.leadName?.toLowerCase().includes(needle) ||
        row.executiveName?.toLowerCase().includes(needle) ||
        row.executiveEmpId?.toLowerCase().includes(needle) ||
        row.routeName?.toLowerCase().includes(needle) ||
        row.id?.toLowerCase().includes(needle)
      );
    });
  }, [rows, query]);

  const handleAction = async (row, action) => {
    try {
      setProcessingId(row.id);

      const payload = { action };
      if (action === 'ASSIGN_TECHNICIAN' && selectedTechnicianByLead[row.id]) {
        payload.technicianId = selectedTechnicianByLead[row.id];
      }

      await api.patch(`/mobile/leads/${row.id}/workflow`, payload);
      await fetchQueue();
    } catch (error) {
      alert(error?.response?.data?.message || 'Unable to process this workflow step right now.');
    } finally {
      setProcessingId('');
    }
  };

  return (
    <div style={{ width: '100%' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '16px',
        flexWrap: 'wrap'
      }}>
        <h3 style={{ margin: 0, color: '#ffffff' }}>Back Office Approval Queue</h3>
        <button
          onClick={fetchQueue}
          style={{
            backgroundColor: '#1e293b',
            color: '#cbd5e1',
            border: '1px solid #334155',
            borderRadius: '8px',
            padding: '8px 12px',
            cursor: 'pointer'
          }}
        >
          Refresh
        </button>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by lead, executive, route, or ID"
          style={{
            width: '100%',
            maxWidth: '560px',
            backgroundColor: '#1e293b',
            color: '#e2e8f0',
            border: '1px solid #334155',
            borderRadius: '10px',
            height: '42px',
            padding: '0 12px',
            outline: 'none'
          }}
        />
      </div>

      <div style={{
        backgroundColor: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '16px',
        overflow: 'hidden'
      }}>
        {loading && (
          <div style={{ padding: '24px', color: '#94a3b8' }}>Loading Back Office queue...</div>
        )}

        {!loading && filteredRows.length === 0 && (
          <div style={{ padding: '24px', color: '#94a3b8' }}>No leads available in back office process queue.</div>
        )}

        {!loading && filteredRows.map((row) => (
          (() => {
            const next = nextActionForStage(row.stage);
            const techOptions = technicianOptionsByLead[row.id] || [];

            return (
          <div
            key={row.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px',
              padding: '14px 16px',
              borderBottom: '1px solid #334155'
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ color: '#ffffff', fontWeight: 700 }}>{row.leadName}</div>
              <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '4px' }}>
                Lead ID: {row.id.slice(0, 8).toUpperCase()} | Exec: {row.executiveName} {row.executiveEmpId ? `(${row.executiveEmpId})` : ''}
              </div>
              <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '3px' }}>
                Route: {row.routeName || 'NA'} {row.routeCode ? `(${row.routeCode})` : ''} | Stage: {stageLabel(row.stage)}
              </div>

              {row.stage === 'MATERIAL_DISPATCHED' && (
                <div style={{ marginTop: '8px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <select
                    value={selectedTechnicianByLead[row.id] || ''}
                    onChange={(e) => setSelectedTechnicianByLead((prev) => ({ ...prev, [row.id]: e.target.value }))}
                    style={{
                      backgroundColor: '#0f172a',
                      color: '#e2e8f0',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      height: '34px',
                      padding: '0 8px',
                      minWidth: '260px'
                    }}
                  >
                    {techOptions.map((tech) => (
                      <option key={tech.id} value={tech.id}>
                        {tech.fullName} ({tech.empId})
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => loadTechniciansForLead(row.id, row.routeId)}
                    style={{
                      backgroundColor: '#1e293b',
                      color: '#cbd5e1',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      cursor: 'pointer'
                    }}
                  >
                    Reload Technician Options
                  </button>
                </div>
              )}
            </div>

            {next ? (
              <button
                onClick={() => handleAction(row, next.action)}
                disabled={processingId === row.id}
                style={{
                  backgroundColor: processingId === row.id ? '#334155' : '#16a34a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  cursor: processingId === row.id ? 'not-allowed' : 'pointer',
                  fontWeight: 700,
                  minWidth: '190px'
                }}
              >
                {processingId === row.id ? 'Updating...' : next.label}
              </button>
            ) : (
              <span style={{ color: '#22c55e', fontWeight: 700 }}>Process Complete</span>
            )}
          </div>
            );
          })()
        ))}
      </div>
    </div>
  );
}

export default BackOfficeApprovals;
