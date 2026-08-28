import React, { useState, useEffect } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import { Eye, ShieldCheck, ShieldAlert, RefreshCw, LayoutTemplate } from 'lucide-react';

export default function TemplateList() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/template');
      if (data.success) {
         setTemplates(data.templates || []);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { 
    loadTemplates(); 
  }, []);

  const checkStatus = async (id) => {
    try {
      await api.get(`/api/template/meta/${id}/status`);
      loadTemplates();
      toast.success('Status synced with Meta');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to sync status');
    }
  };

  return (
    <div className="dashboard-page animate-in">
      <div className="section-title-container">
        <h2 className="section-title" style={{ fontSize: 24 }}><LayoutTemplate /> Meta Templates</h2>
        <button onClick={loadTemplates} className="btn-secondary" style={{ background: '#fff' }}><RefreshCw size={16} /> Refresh</button>
      </div>
      
      <div className="dash-card">
        <p style={{ color: '#64748b', marginBottom: 20 }}>
          This list shows your templates synchronized directly from Meta WhatsApp Business Manager.
          Templates must be APPROVED by Meta before they can be used in campaigns.
        </p>

        {loading ? (
            <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>
        ) : (
            <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                    <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600, fontSize: 13, textTransform: 'uppercase' }}>Template Name</th>
                    <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600, fontSize: 13, textTransform: 'uppercase' }}>Meta ID</th>
                    <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600, fontSize: 13, textTransform: 'uppercase' }}>Category</th>
                    <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600, fontSize: 13, textTransform: 'uppercase' }}>Status</th>
                    <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600, fontSize: 13, textTransform: 'uppercase' }}>Actions</th>
                </tr>
                </thead>
                <tbody>
                {templates.map(t => (
                    <tr key={t._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '16px', fontWeight: 600, color: '#0f172a' }}>{t.name}</td>
                    <td style={{ padding: '16px', color: '#64748b', fontFamily: 'monospace' }}>{t.metaTemplateId || 'N/A'}</td>
                    <td style={{ padding: '16px', color: '#64748b' }}>{t.category}</td>
                    <td style={{ padding: '16px' }}>
                        {t.metaStatus === 'APPROVED' ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px', background: '#dcfce7', color: '#16a34a', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                            <ShieldCheck size={14} /> APPROVED
                        </span>
                        ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px', background: '#fef3c7', color: '#d97706', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                            <ShieldAlert size={14} /> {t.metaStatus || 'PENDING'}
                        </span>
                        )}
                    </td>
                    <td style={{ padding: '16px' }}>
                        <button onClick={() => checkStatus(t._id)} style={{ padding: '6px 12px', background: '#f1f5f9', border: 'none', borderRadius: 6, color: '#475569', fontWeight: 600, cursor: 'pointer', fontSize: 12 }}>
                        Sync Status
                        </button>
                    </td>
                    </tr>
                ))}
                {templates.length === 0 && (
                    <tr>
                    <td colSpan="5" style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No templates synced yet.</td>
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
