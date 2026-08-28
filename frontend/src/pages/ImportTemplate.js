import React, { useState } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import { DownloadCloud, Link as LinkIcon } from 'lucide-react';

const S = {
  page:  { animation: 'fadeIn .35s ease', maxWidth: 600, margin: '0 auto' },
  card:  { background: '#fff', borderRadius: 16, padding: '22px 24px', boxShadow: '0 2px 12px rgba(0,0,0,.07)', border: '1px solid #f0f0f0', marginBottom: 16 },
  title: { fontSize: 16, fontWeight: 700, color: '#1a1a1a', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 },
  label: { display: 'block', fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 6, textTransform: 'uppercase', letterSpacing: .5 },
  input: { width: '100%', padding: '11px 13px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 13, outline: 'none', fontFamily: 'inherit', transition: 'border .2s', marginBottom: 12, boxSizing: 'border-box', background: '#fafafa' }
};

export default function ImportTemplate() {
  const [importTemplateId, setImportTemplateId] = useState('');
  const [importImageUrl, setImportImageUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const importMetaTemplate = async () => {
    if (!importTemplateId) return toast.error('Please provide a Meta Template ID');
    
    setLoading(true);
    try {
      const { data } = await api.post('/api/template/import-meta', {
        metaTemplateId: importTemplateId,
        imageUrl: importImageUrl
      });
      if (data.success) {
        toast.success('Template imported successfully!');
        setImportTemplateId('');
        setImportImageUrl('');
      } else {
        toast.error(data.message);
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to import template');
    }
    setLoading(false);
  };

  return (
    <div style={S.page}>
      <h2 style={{ marginBottom: 20, fontSize: 24, fontWeight: 800, color: '#1e293b' }}>Import Meta Template</h2>
      
      <div style={S.card}>
        <div style={S.title}><LinkIcon size={18} color="#8b5cf6" /> Sync from Facebook Business Manager</div>
        <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>Paste a Meta Template ID to sync it directly from Facebook. This ensures the correct configuration is used for broadcasts.</p>
        
        <div style={{ display: 'flex', gap: 10, flexDirection: 'column' }}>
          <div>
            <label style={S.label}>Meta Template ID</label>
            <input 
              style={S.input} 
              placeholder="e.g. 931585889990523" 
              value={importTemplateId} 
              onChange={e => setImportTemplateId(e.target.value)} 
            />
          </div>
          <div>
            <label style={S.label}>Media URL (Optional)</label>
            <input 
              style={S.input} 
              placeholder="e.g. https://your-website.com/image.jpg" 
              value={importImageUrl} 
              onChange={e => setImportImageUrl(e.target.value)} 
            />
            <p style={{ fontSize: 11, color: '#94a3b8', marginTop: -4 }}>Only required if the template has a media (image/video/document) header.</p>
          </div>
          
          <button 
            style={{ padding: '12px 16px', background: '#8b5cf6', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'background .2s', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 10 }} 
            onClick={importMetaTemplate} 
            disabled={loading}
          >
            <DownloadCloud size={18} />
            {loading ? 'Importing...' : 'Sync Template'}
          </button>
        </div>
      </div>
    </div>
  );
}
