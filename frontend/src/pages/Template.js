import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import { Send, Plus, Trash2, LayoutTemplate, Link as LinkIcon, Phone, Image as ImageIcon, Video, FileText, Type, Eye } from 'lucide-react';

const S = {
  page:  { animation: 'fadeIn .35s ease' },
  card:  { background: '#fff', borderRadius: 16, padding: '22px 24px', boxShadow: '0 2px 12px rgba(0,0,0,.07)', border: '1px solid #f0f0f0', marginBottom: 16 },
  title: { fontSize: 16, fontWeight: 700, color: '#1a1a1a', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 },
  label: { display: 'block', fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 6, textTransform: 'uppercase', letterSpacing: .5 },
  input: { width: '100%', padding: '11px 13px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 13, outline: 'none', fontFamily: 'inherit', transition: 'border .2s', marginBottom: 12, boxSizing: 'border-box', background: '#fafafa' },
  select: { width: '100%', padding: '11px 13px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 13, outline: 'none', fontFamily: 'inherit', marginBottom: 12, background: '#fafafa', cursor: 'pointer' },
  btn:   { display: 'inline-flex', alignItems: 'center', gap: 7, padding: '11px 20px', borderRadius: 9, fontWeight: 600, fontSize: 13, cursor: 'pointer', border: 'none', transition: 'all .18s' },
  
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

export default function Template() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Builder State
  const [category, setCategory] = useState('MARKETING');
  const [name, setName] = useState('');
  const [language, setLanguage] = useState('en_US');
  
  const [headerType, setHeaderType] = useState('NONE'); // NONE, TEXT, IMAGE, VIDEO, DOCUMENT
  const [headerText, setHeaderText] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  
  const [bodyText, setBodyText] = useState('');
  const [footerText, setFooterText] = useState('');
  const [buttons, setButtons] = useState([]);
  
  // Sending State
  const [sendingTemplateId, setSendingTemplateId] = useState(null);
  const [sendMode, setSendMode] = useState('ALL'); // 'ALL' or 'SELECT'
  const [sendPhones, setSendPhones] = useState([]); // Array of selected phone numbers
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  
  const [contacts, setContacts] = useState([]);

  const fileRef = useRef(null);

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

  const loadTemplates = async () => {
    try {
      const { data } = await api.get('/api/template');
      if (data.success) setTemplates(data.templates || []);
    } catch (e) { console.error(e); }
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

  const sendMetaTemplate = async (templateId) => {
    if (sendMode === 'SELECT' && sendPhones.length === 0) {
      return toast.error('Please select at least one contact.');
    }
    
    if (!window.confirm('Are you sure you want to send this template?')) return;
    setIsBroadcasting(true);
    
    try {
      // If ALL is selected, we send an empty string so the backend fetches all contacts
      const phonesPayload = sendMode === 'ALL' ? '' : sendPhones.join(',');
      
      const { data } = await api.post('/api/template/send-meta', {
        templateId,
        phones: phonesPayload
      });
      if (data.success) {
        toast.success(`Broadcast started to ${data.total} contacts!`);
        setSendingTemplateId(null);
        setSendPhones([]);
        setSendMode('ALL');
      } else {
        toast.error(data.message);
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to start broadcast');
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

  const handleNameChange = (e) => {
    setName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'));
  };
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate based on headerType
    if (headerType === 'IMAGE' && !file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
    }
    if (headerType === 'VIDEO' && !file.type.startsWith('video/')) {
        toast.error('Please select a video file');
        return;
    }

    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
  };

  const addButton = (type) => {
    if (buttons.length >= 3) return toast.error('Maximum 3 buttons allowed');
    if (type === 'PHONE_NUMBER') setButtons([...buttons, { type: 'PHONE_NUMBER', text: 'Call Us', phone_number: '+91' }]);
    else if (type === 'URL') setButtons([...buttons, { type: 'URL', text: 'Visit Website', url: 'https://' }]);
    else if (type === 'QUICK_REPLY') setButtons([...buttons, { type: 'QUICK_REPLY', text: 'Yes, I am interested' }]);
    else if (type === 'COPY_CODE') setButtons([...buttons, { type: 'COPY_CODE', example: 'SALE20' }]);
  };

  const removeButton = (i) => setButtons(buttons.filter((_, idx) => idx !== i));
  const updateButton = (i, field, value) => {
    const newBtns = [...buttons];
    newBtns[i][field] = value;
    setButtons(newBtns);
  };

  const submitMetaTemplate = async () => {
    if (!name || !bodyText) return toast.error('Template Name and Body are required');
    if (['IMAGE', 'VIDEO', 'DOCUMENT'].includes(headerType) && !mediaFile) return toast.error('Please select a media file for the header');

    setLoading(true);
    
    const components = [];
    
    // Header Component
    if (headerType === 'TEXT' && headerText) {
      components.push({ type: 'HEADER', format: 'TEXT', text: headerText });
    } else if (['IMAGE', 'VIDEO', 'DOCUMENT'].includes(headerType)) {
      components.push({ type: 'HEADER', format: headerType });
    }
    
    components.push({ type: 'BODY', text: bodyText });
    
    if (footerText) components.push({ type: 'FOOTER', text: footerText });
    
    if (buttons.length > 0) {
      components.push({
        type: 'BUTTONS',
        buttons: buttons.map(b => {
          if (b.type === 'PHONE_NUMBER') return { type: 'PHONE_NUMBER', text: b.text, phone_number: b.phone_number };
          if (b.type === 'URL') return { type: 'URL', text: b.text, url: b.url };
          if (b.type === 'COPY_CODE') return { type: 'COPY_CODE', example: b.example };
          if (b.type === 'QUICK_REPLY') return { type: 'QUICK_REPLY', text: b.text };
          return b;
        })
      });
    }

    try {
      const fd = new FormData();
      fd.append('name', name);
      fd.append('language', language);
      fd.append('category', category);
      fd.append('components', JSON.stringify(components));
      
      if (mediaFile) {
        fd.append('media', mediaFile);
      }

      const { data } = await api.post('/api/template/meta', fd, { headers: { 'Content-Type': 'multipart/form-data' }});
      
      if (data.success) {
        toast.success('Template submitted to Meta successfully!');
        setName(''); setHeaderText(''); setBodyText(''); setFooterText(''); setButtons([]); 
        setMediaFile(null); setMediaPreview(null); setHeaderType('NONE');
        loadTemplates();
      } else {
        toast.error(data.message);
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Submission failed');
    }
    setLoading(false);
  };

  return (
    <div style={S.page}>
      <h2 style={{ marginBottom: 20, fontSize: 24, fontWeight: 800, color: '#1e293b' }}>Meta Template Manager</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }}>
        
        {/* BUILDER PANEL */}
        <div>
          <div style={S.card}>
            <div style={S.title}><LayoutTemplate size={18} color="#2563eb" /> Set up your template</div>
            
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={S.label}>Category</label>
                <select style={S.select} value={category} onChange={e => setCategory(e.target.value)}>
                  <option value="MARKETING">Marketing (Promotions, Offers)</option>
                  <option value="UTILITY">Utility (Order updates, Alerts)</option>
                  <option value="AUTHENTICATION">Authentication (OTPs)</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={S.label}>Language</label>
                <select style={S.select} value={language} onChange={e => setLanguage(e.target.value)}>
                  <option value="en_US">English (US)</option>
                  <option value="en_UK">English (UK)</option>
                </select>
              </div>
            </div>

            <label style={S.label}>Template Name</label>
            <input style={S.input} placeholder="e.g. fresh_stock_alert" value={name} onChange={handleNameChange} />
            <p style={{ fontSize: 11, color: '#64748b', marginTop: -8, marginBottom: 16 }}>Lowercase and underscores only.</p>

            <label style={S.label}>Header (Optional)</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                {['NONE', 'TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT'].map(type => (
                    <button 
                        key={type}
                        onClick={() => { setHeaderType(type); setMediaFile(null); setMediaPreview(null); }}
                        style={{ 
                            padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid #e2e8f0',
                            background: headerType === type ? '#ebf5ff' : '#fff',
                            color: headerType === type ? '#2563eb' : '#64748b',
                            borderColor: headerType === type ? '#bfdbfe' : '#e2e8f0'
                        }}>
                        {type}
                    </button>
                ))}
            </div>

            {headerType === 'TEXT' && (
                <input style={S.input} placeholder="Short heading text (Max 60 chars)" maxLength={60} value={headerText} onChange={e => setHeaderText(e.target.value)} />
            )}

            {['IMAGE', 'VIDEO', 'DOCUMENT'].includes(headerType) && (
                <div style={{ marginBottom: 12 }}>
                    <input type="file" ref={fileRef} onChange={handleFileChange} style={{ display: 'none' }} accept={headerType === 'IMAGE' ? 'image/*' : headerType === 'VIDEO' ? 'video/*' : '*/*'} />
                    <button className="btn-secondary" onClick={() => fileRef.current.click()} style={{ width: '100%', justifyContent: 'center' }}>
                        {headerType === 'IMAGE' ? <ImageIcon size={16}/> : headerType === 'VIDEO' ? <Video size={16}/> : <FileText size={16}/>}
                        {mediaFile ? mediaFile.name : `Select ${headerType} File for Header`}
                    </button>
                </div>
            )}

            <label style={S.label}>Body Message *</label>
            <textarea 
              style={{ ...S.input, minHeight: 120, resize: 'vertical' }} 
              placeholder="Enter your message body here... Use {{1}} for variables."
              value={bodyText}
              onChange={e => setBodyText(e.target.value)}
            />

            <label style={S.label}>Footer (Optional)</label>
            <input style={S.input} placeholder="Short footer text, e.g. Reply STOP to opt out" maxLength={60} value={footerText} onChange={e => setFooterText(e.target.value)} />

            <div style={{ borderTop: '1px solid #e2e8f0', margin: '20px 0', paddingTop: 20 }}>
              <label style={S.label}>Buttons (Optional, Max 3)</label>
              
              {buttons.map((btn, i) => (
                <div key={i} style={{ background: '#f8fafc', padding: 15, borderRadius: 10, border: '1px solid #e2e8f0', marginBottom: 12, position: 'relative' }}>
                  <button onClick={() => removeButton(i)} style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={16} /></button>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {btn.type === 'URL' ? <LinkIcon size={14}/> : btn.type === 'PHONE_NUMBER' ? <Phone size={14}/> : <Type size={14}/>} 
                    {btn.type === 'URL' ? 'Visit Website' : btn.type === 'PHONE_NUMBER' ? 'Call Phone Number' : btn.type === 'COPY_CODE' ? 'Copy Offer Code' : 'Custom Quick Reply'}
                  </div>
                  
                  {btn.type !== 'COPY_CODE' && (
                      <input style={S.input} placeholder="Button Text (e.g. Buy Now)" maxLength={20} value={btn.text} onChange={e => updateButton(i, 'text', e.target.value)} />
                  )}
                  
                  {btn.type === 'URL' && <input style={{ ...S.input, marginBottom: 0 }} placeholder="URL (e.g. https://zest-eat.com)" value={btn.url} onChange={e => updateButton(i, 'url', e.target.value)} />}
                  {btn.type === 'PHONE_NUMBER' && <input style={{ ...S.input, marginBottom: 0 }} placeholder="Phone Number (e.g. +919876543210)" value={btn.phone_number} onChange={e => updateButton(i, 'phone_number', e.target.value)} />}
                  {btn.type === 'COPY_CODE' && <input style={{ ...S.input, marginBottom: 0 }} placeholder="Offer Code (e.g. SALE20)" value={btn.example} onChange={e => updateButton(i, 'example', e.target.value)} />}
                </div>
              ))}

              {buttons.length < 3 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 10 }}>
                  <button className="btn-secondary" onClick={() => addButton('QUICK_REPLY')}><Plus size={14}/> Custom Quick Reply</button>
                  <button className="btn-secondary" onClick={() => addButton('URL')}><Plus size={14}/> Visit Website</button>
                  <button className="btn-secondary" onClick={() => addButton('PHONE_NUMBER')}><Plus size={14}/> Call Phone Number</button>
                  <button className="btn-secondary" onClick={() => addButton('COPY_CODE')}><Plus size={14}/> Copy Offer Code</button>
                </div>
              )}
            </div>

            <button className="btn-primary" style={{ width: '100%', marginTop: 20 }} onClick={submitMetaTemplate} disabled={loading}>
              {loading ? 'Submitting...' : <><Send size={16}/> Submit to Meta for Approval</>}
            </button>
          </div>
        </div>

        {/* PREVIEW AND LIST PANEL */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* LIVE PREVIEW */}
          <div style={S.card}>
             <div style={S.title}><Eye size={18} color="#059669" /> Message Preview</div>
             <div style={S.waBg}>
                <div style={S.waBubble}>
                   <div style={S.waContent}>
                      
                      {/* Media Header Preview */}
                      {headerType === 'IMAGE' && mediaPreview && (
                         <img src={mediaPreview} alt="Header" style={S.waMedia} />
                      )}
                      {headerType === 'IMAGE' && !mediaPreview && (
                         <div style={{...S.waMedia, height: 120}}><ImageIcon size={32} opacity={0.5}/></div>
                      )}
                      
                      {headerType === 'VIDEO' && (
                         <div style={{...S.waMedia, height: 120, background: '#111b21'}}><Video size={32} color="#fff" opacity={0.8}/></div>
                      )}

                      {headerType === 'DOCUMENT' && (
                         <div style={{...S.waMedia, height: 60, borderRadius: 4}}><FileText size={24} opacity={0.6}/></div>
                      )}

                      {/* Text Header Preview */}
                      {headerType === 'TEXT' && headerText && (
                         <div style={S.waHeader}>{headerText}</div>
                      )}
                      
                      <div style={S.waBody}>{bodyText || <span style={{color: '#94a3b8', fontStyle: 'italic'}}>Body text will appear here...</span>}</div>
                      
                      {footerText && <div style={S.waFooter}>{footerText}</div>}
                   </div>

                   {/* Buttons Preview */}
                   {buttons.map((b, i) => (
                      <div key={i} style={S.waBtn}>
                         {b.type === 'URL' ? <LinkIcon size={14}/> : b.type === 'PHONE_NUMBER' ? <Phone size={14}/> : <Type size={14}/>}
                         {b.type === 'COPY_CODE' ? 'Copy Offer Code' : (b.text || 'Button')}
                      </div>
                   ))}
                </div>
             </div>
          </div>

          <div style={S.card}>
            <div style={S.title}>Your Templates</div>
            {templates.length === 0 ? (
              <p style={{ color: '#aaa', fontSize: 13 }}>No templates created yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 400, overflowY: 'auto' }}>
                {templates.map(t => (
                  <div key={t._id} style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 15, background: '#fafafa' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <strong style={{ fontSize: 14, color: '#1e293b' }}>{t.name || t.title}</strong>
                      <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 12, fontWeight: 700, background: t.metaStatus === 'APPROVED' ? '#dcfce7' : t.metaStatus === 'REJECTED' ? '#fee2e2' : '#fef3c7', color: t.metaStatus === 'APPROVED' ? '#166534' : t.metaStatus === 'REJECTED' ? '#991b1b' : '#92400e' }}>
                        {t.metaStatus || 'DRAFT'}
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                      {t.metaTemplateId && (
                        <button onClick={() => checkStatus(t._id)} style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: 11, fontWeight: 600, padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                          Check Status
                        </button>
                      )}
                      {t.metaStatus === 'APPROVED' && sendingTemplateId !== t._id && (
                        <button onClick={() => setSendingTemplateId(t._id)} style={{ background: 'none', border: 'none', color: '#059669', fontSize: 11, fontWeight: 600, padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Send size={12}/> Send Broadcast
                        </button>
                      )}
                    </div>

                    {/* Send Broadcast Panel */}
                    {sendingTemplateId === t._id && (
                      <div style={{ marginTop: 12, padding: 16, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 12 }}>Select Audience</div>
                        
                        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                            <input type="radio" name="sendMode" checked={sendMode === 'ALL'} onChange={() => setSendMode('ALL')} />
                            All Customers ({contacts.length})
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                            <input type="radio" name="sendMode" checked={sendMode === 'SELECT'} onChange={() => setSendMode('SELECT')} />
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
                        
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button 
                            style={{ flex: 1, padding: '8px', background: '#059669', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'background .2s' }}
                            onClick={() => sendMetaTemplate(t._id)}
                            disabled={isBroadcasting}
                            onMouseOver={e => e.currentTarget.style.background = '#047857'}
                            onMouseOut={e => e.currentTarget.style.background = '#059669'}
                          >
                            {isBroadcasting ? 'Sending Broadcast...' : sendMode === 'ALL' ? `Send to All (${contacts.length})` : `Send to ${sendPhones.length} Customers`}
                          </button>
                          <button 
                            style={{ padding: '8px 16px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'background .2s' }}
                            onClick={() => { setSendingTemplateId(null); setSendMode('ALL'); setSendPhones([]); }}
                            onMouseOver={e => e.currentTarget.style.background = '#e2e8f0'}
                            onMouseOut={e => e.currentTarget.style.background = '#f1f5f9'}
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

      </div>
    </div>
  );
}