import React, { useState, useEffect } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import { BarChart2, Calendar, FileText, CheckCircle2, Clock, Eye, AlertCircle, RefreshCw, Send } from 'lucide-react';

export default function Analytics() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/api/template/stats/summary');
      if (data.success) {
        setStats(data.stats);
        const sortedLogs = (data.chartData || []).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setLogs(sortedLogs);
      }
    } catch (e) {
      console.error('Failed to load analytics logs', e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleSyncAnalytics = async () => {
    setIsSyncing(true);
    try {
      await api.post('/api/template/sync-meta');
      await fetchStats();
      toast.success('Analytics synchronized with live Meta data! 🔄');
    } catch (err) {
      await fetchStats();
      toast.error(err.response?.data?.message || 'Failed to sync analytics');
    }
    setIsSyncing(false);
  };

  const sentCount = stats?.sent || 0;
  const deliveredCount = stats?.delivered || 0;
  const readCount = stats?.read || 0;
  const failedCount = stats?.failed || 0;

  const deliveredRate = sentCount > 0 ? Math.round((deliveredCount / sentCount) * 100) : 0;
  const readRate = deliveredCount > 0 ? Math.round((readCount / deliveredCount) * 100) : 0;

  return (
    <div className="dashboard-page animate-in">
      <div className="section-title-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 className="section-title" style={{ fontSize: 24 }}><BarChart2 /> Delivery Analytics</h2>
          {stats?.wabaId && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 6, fontSize: 12, color: '#475569', background: '#f1f5f9', padding: '4px 10px', borderRadius: 6, fontWeight: 600 }}>
              <span style={{ color: '#16a34a', fontWeight: 700 }}>● Active Meta Account:</span>
              <span style={{ color: '#0f172a', fontFamily: 'monospace' }}>{stats.wabaId}</span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleSyncAnalytics}
          disabled={isSyncing}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 16px',
            borderRadius: 8,
            border: '1px solid #e2e8f0',
            background: '#ffffff',
            color: '#0f172a',
            fontWeight: 700,
            fontSize: 13,
            cursor: isSyncing ? 'not-allowed' : 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            transition: 'all 0.15s ease',
          }}
        >
          <RefreshCw size={14} style={{ animation: isSyncing ? 'spin 1s linear infinite' : 'none' }} />
          {isSyncing ? 'Syncing Live Data...' : 'Sync Live Analytics'}
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="clean-card" style={{ padding: 20, borderRadius: 12, background: '#fff', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Total Sent</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginTop: 8 }}>{sentCount.toLocaleString()}</div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>Meta WhatsApp messages</div>
        </div>

        <div className="clean-card" style={{ padding: 20, borderRadius: 12, background: '#fff', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 700, textTransform: 'uppercase' }}>Delivered</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#16a34a', marginTop: 8 }}>{deliveredCount.toLocaleString()}</div>
          <div style={{ fontSize: 11, color: '#16a34a', marginTop: 4 }}>{deliveredRate}% Delivery Rate</div>
        </div>

        <div className="clean-card" style={{ padding: 20, borderRadius: 12, background: '#fff', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 12, color: '#8b5cf6', fontWeight: 700, textTransform: 'uppercase' }}>Read</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#8b5cf6', marginTop: 8 }}>{readCount.toLocaleString()}</div>
          <div style={{ fontSize: 11, color: '#8b5cf6', marginTop: 4 }}>{readRate}% Read Rate</div>
        </div>

        <div className="clean-card" style={{ padding: 20, borderRadius: 12, background: '#fff', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 12, color: '#ef4444', fontWeight: 700, textTransform: 'uppercase' }}>Failed</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#ef4444', marginTop: 8 }}>{failedCount.toLocaleString()}</div>
          <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>Undelivered or invalid numbers</div>
        </div>
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
