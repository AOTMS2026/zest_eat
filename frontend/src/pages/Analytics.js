import React, { useState, useEffect } from 'react';
import api from '../api';
import { BarChart2, Calendar, FileText, CheckCircle2, Clock, Eye, AlertCircle } from 'lucide-react';

export default function Analytics() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/api/template/stats/summary');
        if (data.success) {
          // Sort logs newest first
          const sortedLogs = (data.chartData || []).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
          setLogs(sortedLogs);
        }
      } catch (e) { console.error('Failed to load logs', e); }
      setLoading(false);
    };
    fetchStats();
  }, []);

  return (
    <div className="dashboard-page animate-in">
      <div className="section-title-container">
        <h2 className="section-title" style={{ fontSize: 24 }}><BarChart2 /> Delivery Analytics</h2>
      </div>
      
      <div className="dash-card">
        <h3 className="section-title" style={{ marginBottom: 20 }}>Message Delivery Log</h3>
        
        {loading ? (
            <div style={{ padding: 40, textAlign: 'center' }}>Loading Analytics...</div>
        ) : (
            <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                    <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600, fontSize: 13, textTransform: 'uppercase' }}>Timestamp</th>
                    <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600, fontSize: 13, textTransform: 'uppercase' }}>Recipient Phone</th>
                    <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600, fontSize: 13, textTransform: 'uppercase' }}>Delivery Status</th>
                    <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600, fontSize: 13, textTransform: 'uppercase' }}>WAMID (Reference)</th>
                </tr>
                </thead>
                <tbody>
                {logs.map(log => (
                    <tr key={log.wamid} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '16px', color: '#64748b', fontSize: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Calendar size={14}/> {new Date(log.timestamp).toLocaleDateString()}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}><Clock size={14}/> {new Date(log.timestamp).toLocaleTimeString()}</div>
                    </td>
                    <td style={{ padding: '16px', fontWeight: 600, color: '#0f172a' }}>+{log.phone}</td>
                    <td style={{ padding: '16px' }}>
                        {log.status === 'sent' && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px', background: '#eff6ff', color: '#3b82f6', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>Sent</span>}
                        {log.status === 'delivered' && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px', background: '#dcfce7', color: '#16a34a', borderRadius: 20, fontSize: 12, fontWeight: 700 }}><CheckCircle2 size={14}/> Delivered</span>}
                        {log.status === 'read' && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px', background: '#f3e8ff', color: '#8b5cf6', borderRadius: 20, fontSize: 12, fontWeight: 700 }}><Eye size={14}/> Read</span>}
                        {log.status === 'failed' && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px', background: '#fee2e2', color: '#ef4444', borderRadius: 20, fontSize: 12, fontWeight: 700 }}><AlertCircle size={14}/> Failed</span>}
                    </td>
                    <td style={{ padding: '16px', color: '#94a3b8', fontFamily: 'monospace', fontSize: 12, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {log.wamid}
                    </td>
                    </tr>
                ))}
                {logs.length === 0 && (
                    <tr>
                    <td colSpan="4" style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No messages sent yet.</td>
                    </tr>
                )}
                </tbody>
            </table>
            </div>
        )}
      </div>
    </div>
  );
}
