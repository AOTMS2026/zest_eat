import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import api from '../api';
import toast from 'react-hot-toast';
import { Send, Eye, Link as LinkIcon, Phone, Image as ImageIcon, Video, FileText, Type, RefreshCw } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

/* ── User-Provided Styled Action Button (Navy + Yellow Hover) ── */
const StyledWrapper = styled.div`
  display: inline-block;
  width: ${props => props.$fullWidth ? '100%' : 'auto'};

  button {
    width: 100%;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 6px;
    background: #183153;
    font-family: "Montserrat", -apple-system, BlinkMacSystemFont, sans-serif;
    box-shadow: 0px 4px 16px 0px rgba(0, 0, 0, 0.15);
    overflow: hidden;
    cursor: pointer;
    border: none;
    transition: all 0.2s ease;
  }

  button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  button:after {
    content: " ";
    width: 0%;
    height: 100%;
    background: #ffd401;
    position: absolute;
    transition: all 0.4s ease-in-out;
    right: 0;
  }

  button:hover:not(:disabled)::after {
    right: auto;
    left: 0;
    width: 100%;
  }

  button span {
    text-align: center;
    text-decoration: none;
    width: 100%;
    padding: 12px 20px;
    color: #fff;
    font-size: 0.85em;
    font-weight: 700;
    letter-spacing: 0.14em;
    z-index: 20;
    transition: all 0.3s ease-in-out;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    white-space: nowrap;
  }

  button:hover:not(:disabled) span {
    color: #183153;
    animation: scaleUp 0.3s ease-in-out;
  }

  @keyframes scaleUp {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(0.95);
    }
    100% {
      transform: scale(1);
    }
  }
`;

const S = {
  page:  { animation: 'fadeIn .35s ease' },
  card:  { background: '#fff', borderRadius: 16, padding: '22px 24px', boxShadow: '0 2px 12px rgba(0,0,0,.07)', border: '1px solid #f0f0f0', marginBottom: 16 },
  title: { fontSize: 16, fontWeight: 700, color: '#1a1a1a', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 },
  
  // WhatsApp Preview Styles
  waBg: { background: '#efeae2', padding: 20, borderRadius: 16, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minHeight: 300, position: 'relative' },
  waBubble: { background: '#fff', padding: 4, borderRadius: '0 8px 8px 8px', maxWidth: '85%', boxShadow: '0 1px 1px rgba(0,0,0,0.1)', position: 'relative' },
  waContent: { padding: '6px 8px 8px 8px' },
  waHeader: { fontWeight: 700, fontSize: 14, color: '#111b21', marginBottom: 4 },
  waBody: { fontSize: 14, color: '#111b21', whiteSpace: 'pre-wrap', lineHeight: 1.4 },
  waFooter: { fontSize: 11, color: '#667781', marginTop: 4 },
  waBtn: { borderTop: '1px solid #f0f2f5', padding: '10px 0', textAlign: 'center', color: '#00a884', fontSize: 14, fontWeight: 500, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, cursor: 'default' },
  waMedia: { width: '100%', borderRadius: 6, marginBottom: 6, objectFit: 'cover', maxHeight: 200, backgroundColor: '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#54656f' }
};

export default function Campaigns() {
  const [templates, setTemplates] = useState([]);
  const [contacts, setContacts] = useState([]);
  
  // Active Preview State
  const [activePreviewId, setActivePreviewId] = useState(null);
  
  // Sending State
  const [sendingTemplateId, setSendingTemplateId] = useState(null);
  const [sendMode, setSendMode] = useState('ALL'); // 'ALL' or 'SELECT'
  const [sendPhones, setSendPhones] = useState([]); 
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // Custom Confirm Modal State (replaces browser "localhost says" alert)
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    templateId: null,
    title: '',
    message: '',
  });

  useEffect(() => { 
    loadTemplates(); 
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const { data } = await api.get('/api/contacts');
      if (data.success) setContacts(data.contacts || []);
    } catch (e) { console.error('Failed to load contacts', e); }
  };

  const [syncingTemplates, setSyncingTemplates] = useState(false);

  const loadTemplates = async () => {
    try {
      const { data } = await api.get('/api/template');
      if (data.success) {
         setTemplates(data.templates || []);
         if (data.templates?.length > 0) {
            setActivePreviewId(data.templates[0]._id);
         }
      }
    } catch (e) { console.error(e); }
  };

  const handleSyncTemplates = async () => {
    setSyncingTemplates(true);
    try {
      const { data } = await api.post('/api/template/sync-meta');
      if (data?.templates) {
        setTemplates(data.templates);
        if (data.templates.length > 0) setActivePreviewId(data.templates[0]._id);
      } else {
        await loadTemplates();
      }
      toast.success(data?.message || 'Synced Meta templates! 🔄');
    } catch (e) {
      await loadTemplates();
      toast.error(e.response?.data?.message || 'Failed to sync templates');
    }
    setSyncingTemplates(false);
  };

  const checkStatus = async (id) => {
    try {
      await api.get(`/api/template/meta/${id}/status`);
      loadTemplates();
      toast.success('Status updated');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update status');
    }
  };

  const handleInitiateBroadcast = (templateId) => {
    const template = templates.find(t => t._id === templateId);
    if (!template) return toast.error('Template not found');

    if (sendMode === 'SELECT' && sendPhones.length === 0) {
      return toast.error('Please select at least one contact.');
    }

    const recipientsCount = sendMode === 'ALL' ? contacts.filter(c => !c.optedOut).length : sendPhones.length;

    setConfirmModal({
      isOpen: true,
      templateId,
      title: 'Send Bulk Message',
      message: `Ready to send "${template.name || template.title}" to ${recipientsCount} recipient(s)? This will broadcast to your audience.`,
    });
  };

  const executeBroadcast = async () => {
    if (!confirmModal.templateId) return;
    setIsBroadcasting(true);
    
    try {
      const phonesPayload = sendMode === 'ALL' ? '' : sendPhones.join(',');
      
      const { data } = await api.post('/api/template/send-meta', {
        templateId: confirmModal.templateId,
        phones: phonesPayload
      });
      
      if (data.success) {
        toast.success(`Broadcast started to ${data.total} contacts! 🚀`);
        setSendingTemplateId(null);
        setSendPhones([]);
        setSendMode('ALL');
      } else {
        toast.error(data.message);
      }
    } catch (e) {
      toast.error(e.response?.data?.message || e.message || 'Failed to start broadcast');
    }
    setIsBroadcasting(false);
  };
  
  const toggleContact = (phone) => {
    if (sendPhones.includes(phone)) {
      setSendPhones(sendPhones.filter(p => p !== phone));
    } else {
      setSendPhones([...sendPhones, phone]);
    }
  };

  // Determine what to show in the preview
  const previewData = activePreviewId ? templates.find(t => t._id === activePreviewId) : null;
  
  let pHeaderType = 'NONE';
  let pHeaderText = '';
  let pMediaUrl = null;
  let pBodyText = '';
  let pFooterText = '';
  let pButtons = [];

  if (previewData) {
    const headerComp = previewData.components?.find(c => c.type === 'HEADER');
    if (headerComp) {
      pHeaderType = headerComp.format;
      pHeaderText = headerComp.text || '';
      if (['IMAGE', 'VIDEO'].includes(pHeaderType)) {
        pMediaUrl = previewData.imageUrl;
        if (pMediaUrl && !pMediaUrl.includes('/campaigns/') && pMediaUrl.startsWith('/uploads/')) {
           pMediaUrl = pMediaUrl.replace('/uploads/', '/uploads/campaigns/');
        }
        if (pMediaUrl) pMediaUrl = `https://zest-eat.onrender.com${pMediaUrl}`;
      }
    }
    
    pBodyText = previewData.components?.find(c => c.type === 'BODY')?.text || '';
    pFooterText = previewData.components?.find(c => c.type === 'FOOTER')?.text || '';
    
    const btnComp = previewData.components?.find(c => c.type === 'BUTTONS');
    pButtons = btnComp ? btnComp.buttons : [];
  }

  return (
    <div style={S.page}>
      <h2 style={{ marginBottom: 20, fontSize: 24, fontWeight: 800, color: '#1e293b' }}>Your Templates</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }}>
        
        {/* LIST PANEL */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={S.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ ...S.title, margin: 0 }}>Saved Templates</div>
              <button
                type="button"
                onClick={handleSyncTemplates}
                disabled={syncingTemplates}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#0f172a',
                  fontWeight: 600,
                  fontSize: 12,
                  cursor: syncingTemplates ? 'not-allowed' : 'pointer'
                }}
              >
                <RefreshCw size={13} style={{ animation: syncingTemplates ? 'spin 1s linear infinite' : 'none' }} />
                {syncingTemplates ? 'Syncing...' : 'Sync Meta Templates'}
              </button>
            </div>
            {templates.length === 0 ? (
              <p style={{ color: '#aaa', fontSize: 13 }}>No templates created yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 600, overflowY: 'auto', paddingRight: 5 }}>
                {templates.map(t => (
                  <div 
                    key={t._id} 
                    style={{ border: activePreviewId === t._id ? '2px solid #059669' : '1px solid #e2e8f0', borderRadius: 10, padding: 15, background: activePreviewId === t._id ? '#ecfdf5' : '#fafafa', cursor: 'pointer', transition: 'all 0.2s' }}
                    onClick={() => setActivePreviewId(t._id)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div>
                        <strong style={{ fontSize: 14, color: '#1e293b', display: 'block' }}>{t.name || t.title}</strong>
                        {t.metaTemplateId && <span style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>ID: {t.metaTemplateId}</span>}
                      </div>
                      <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 12, fontWeight: 700, background: t.metaStatus === 'APPROVED' ? '#dcfce7' : t.metaStatus === 'REJECTED' ? '#fee2e2' : '#fef3c7', color: t.metaStatus === 'APPROVED' ? '#166534' : t.metaStatus === 'REJECTED' ? '#991b1b' : '#92400e' }}>
                        {t.metaStatus || 'DRAFT'}
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                      {t.metaTemplateId && (
                        <button onClick={(e) => { e.stopPropagation(); checkStatus(t._id); }} style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: 11, fontWeight: 600, padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                          Check Status
                        </button>
                      )}
                      {t.metaStatus === 'APPROVED' && sendingTemplateId !== t._id && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); setActivePreviewId(t._id); setSendingTemplateId(t._id); }} 
                          style={{ 
                            background: '#0f172a', 
                            border: 'none', 
                            color: '#ffffff', 
                            fontSize: 11, 
                            fontWeight: 700, 
                            padding: '5px 12px', 
                            borderRadius: 6, 
                            cursor: 'pointer', 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: 6,
                            transition: 'all .2s' 
                          }}
                          onMouseOver={e => e.currentTarget.style.background = '#1e293b'}
                          onMouseOut={e => e.currentTarget.style.background = '#0f172a'}
                        >
                          <Send size={12}/> Send Broadcast
                        </button>
                      )}
                    </div>

                    {/* Send Broadcast Panel */}
                    {sendingTemplateId === t._id && (
                      <div style={{ marginTop: 12, padding: 16, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }} onClick={e => e.stopPropagation()}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 12 }}>Select Audience</div>
                        
                        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                            <input type="radio" name={`sendMode-${t._id}`} checked={sendMode === 'ALL'} onChange={() => setSendMode('ALL')} />
                            All Customers ({contacts.length})
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                            <input type="radio" name={`sendMode-${t._id}`} checked={sendMode === 'SELECT'} onChange={() => setSendMode('SELECT')} />
                            Specific Customers
                          </label>
                        </div>
                        
                        {sendMode === 'SELECT' && (
                          <div style={{ border: '1px solid #e2e8f0', borderRadius: 6, maxHeight: 150, overflowY: 'auto', marginBottom: 16, background: '#fafafa' }}>
                            {contacts.length === 0 ? (
                               <div style={{ padding: 12, fontSize: 12, color: '#94a3b8' }}>No contacts found in database.</div>
                            ) : (
                               contacts.map(c => (
                                 <label key={c._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}>
                                   <input type="checkbox" checked={sendPhones.includes(c.phone)} onChange={() => toggleContact(c.phone)} />
                                   <div style={{ flex: 1 }}>
                                      <div style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>{c.name || 'Unknown'}</div>
                                      <div style={{ fontSize: 11, color: '#64748b' }}>{c.phone}</div>
                                   </div>
                                 </label>
                               ))
                            )}
                          </div>
                        )}
                        
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 8 }}>
                          <StyledWrapper $fullWidth style={{ flex: 1 }}>
                            <button 
                              type="button"
                              onClick={() => handleInitiateBroadcast(t._id)}
                              disabled={isBroadcasting}
                            >
                              <span>
                                <Send size={15} />
                                {isBroadcasting 
                                  ? 'SENDING...' 
                                  : sendMode === 'ALL' 
                                  ? `BULK SEND MESSAGE (${contacts.length})` 
                                  : `BULK SEND MESSAGE (${sendPhones.length})`}
                              </span>
                            </button>
                          </StyledWrapper>

                          <button 
                            type="button"
                            style={{ 
                              padding: '12px 20px', 
                              background: '#ffffff', 
                              color: '#475569', 
                              border: '1px solid #e2e8f0', 
                              borderRadius: 6, 
                              fontSize: 13, 
                              fontWeight: 700, 
                              cursor: 'pointer', 
                              transition: 'all .2s' 
                            }}
                            onClick={() => { setSendingTemplateId(null); setSendMode('ALL'); setSendPhones([]); }}
                            onMouseOver={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                            onMouseOut={e => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* PREVIEW PANEL */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={S.card}>
             <div style={S.title}>
                <Eye size={18} color="#059669" /> 
                {previewData ? `Previewing: ${previewData.name}` : 'Select a template'}
             </div>
             
             {previewData ? (
               <div style={S.waBg}>
                  <div style={S.waBubble}>
                     <div style={S.waContent}>
                        
                        {/* Media Header Preview */}
                        {pHeaderType === 'IMAGE' && pMediaUrl && (
                           <img src={pMediaUrl} alt="Header" style={S.waMedia} />
                        )}
                        {pHeaderType === 'IMAGE' && !pMediaUrl && (
                           <div style={{...S.waMedia, height: 120}}><ImageIcon size={32} opacity={0.5}/></div>
                        )}
                        
                        {pHeaderType === 'VIDEO' && (
                           <div style={{...S.waMedia, height: 120, background: '#111b21'}}><Video size={32} color="#fff" opacity={0.8}/></div>
                        )}

                        {pHeaderType === 'DOCUMENT' && (
                           <div style={{...S.waMedia, height: 60, borderRadius: 4}}><FileText size={24} opacity={0.6}/></div>
                        )}

                        {/* Text Header Preview */}
                        {pHeaderType === 'TEXT' && pHeaderText && (
                           <div style={S.waHeader}>{pHeaderText}</div>
                        )}
                        
                        <div style={S.waBody}>{pBodyText || <span style={{color: '#94a3b8', fontStyle: 'italic'}}>Body text will appear here...</span>}</div>
                        
                        {pFooterText && <div style={S.waFooter}>{pFooterText}</div>}
                     </div>

                     {/* Buttons Preview */}
                     {pButtons.map((b, i) => (
                        <div key={i} style={S.waBtn}>
                           {b.type === 'URL' ? <LinkIcon size={14}/> : b.type === 'PHONE_NUMBER' ? <Phone size={14}/> : <Type size={14}/>}
                           {b.type === 'COPY_CODE' ? 'Copy Offer Code' : (b.text || 'Button')}
                        </div>
                     ))}
                  </div>
               </div>
             ) : (
               <div style={{ ...S.waBg, justifyContent: 'center', alignItems: 'center' }}>
                 <p style={{ color: '#94a3b8', fontSize: 13 }}>Click a template to preview it here.</p>
               </div>
             )}
          </div>
        </div>

      </div>

      {/* Custom Styled Confirm Modal (Replacing "localhost says") */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={executeBroadcast}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText="Send"
        cancelText="Cancel"
      />
    </div>
  );
}
