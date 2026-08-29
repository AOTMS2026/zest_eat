import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import api from '../api';
import toast from 'react-hot-toast';
import {
  LayoutTemplate, ShieldCheck, ShieldAlert,
  Plus, RefreshCw, ArrowLeft, Image as ImageIcon,
  CheckCircle, Smartphone, Trash2, Link as LinkIcon,
  Phone, MessageSquare, AlertCircle
} from 'lucide-react';

/* ── User-Provided Styled Action Button ────────── */
const StyledWrapper = styled.div`
  display: inline-block;

  button {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 6px;
    background: #183153;
    font-family: "Montserrat", -apple-system, BlinkMacSystemFont, sans-serif;
    box-shadow: 0px 6px 24px 0px rgba(0, 0, 0, 0.15);
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
    padding: 12px 22px;
    color: #fff;
    font-size: 0.9em;
    font-weight: 700;
    letter-spacing: 0.18em;
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

export default function TemplateList() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category: 'MARKETING', // MARKETING or UTILITY
    language: 'en_US',     // English only
    headerType: 'IMAGE',   // Default to IMAGE for marketing
    headerText: '',
    bodyText: 'Hello {{1}}, check out our special fresh offers at Zest Eat today! Valid until midnight.',
    footerText: 'Zest Eat • Reply STOP to unsubscribe',
  });

  const [headerImage, setHeaderImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Dynamic Multi-Button State
  const [buttons, setButtons] = useState([
    { id: 1, type: 'QUICK_REPLY', text: 'Order Now', url: '', phoneNumber: '' }
  ]);
  const [currentWabaId, setCurrentWabaId] = useState('');

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/template');
      if (data.success) {
        setTemplates(data.templates || []);
        if (data.currentWabaId) setCurrentWabaId(data.currentWabaId);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleSyncAll = async () => {
    setSyncing(true);
    try {
      const { data } = await api.post('/api/template/sync-meta');
      if (data?.templates) setTemplates(data.templates);
      else await loadTemplates();
      toast.success(data?.message || 'Templates synchronized with Meta successfully! 🔄');
    } catch (err) {
      await loadTemplates();
      toast.error(err.response?.data?.message || 'Failed to sync templates with Meta');
    }
    setSyncing(false);
  };

  const checkStatus = async (id) => {
    try {
      const { data } = await api.get(`/api/template/meta/${id}/status`);
      loadTemplates();
      toast.success(`Template status: ${data.status || 'Updated'}`);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to sync status');
    }
  };

  const handleDeleteTemplate = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete template "${name}"?`)) return;
    try {
      await api.delete(`/api/template/${id}`);
      toast.success('Template deleted');
      loadTemplates();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to delete template');
    }
  };

  // Category switch handler: customize defaults by category
  const handleCategoryChange = (cat) => {
    if (cat === 'MARKETING') {
      setFormData((prev) => ({
        ...prev,
        category: cat,
        headerType: 'IMAGE',
        bodyText: prev.bodyText || 'Special discount! Get 20% off on fresh meat this weekend. Use code ZEST20.',
      }));
    } else {
      // UTILITY
      setFormData((prev) => ({
        ...prev,
        category: cat,
        headerType: 'NONE',
        bodyText: prev.bodyText || 'Your order {{1}} from Zest Eat has been confirmed and is being prepared.',
      }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setHeaderImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // ── Dynamic Button Handlers ──────────────────
  const handleAddButton = () => {
    if (buttons.length >= 3) {
      toast.error('Maximum 3 buttons allowed by WhatsApp template guidelines');
      return;
    }
    const newId = Date.now();
    setButtons([
      ...buttons,
      { id: newId, type: 'QUICK_REPLY', text: `Action ${buttons.length + 1}`, url: 'https://zest-eat.com', phoneNumber: '' }
    ]);
  };

  const handleRemoveButton = (id) => {
    setButtons(buttons.filter((b) => b.id !== id));
  };

  const handleUpdateButton = (id, field, val) => {
    setButtons(buttons.map((b) => (b.id === id ? { ...b, [field]: val } : b)));
  };

  // ── Submit Template ───────────────────────────
  const handleSubmitTemplate = async (e) => {
    e.preventDefault();

    const formattedName = formData.name.trim().toLowerCase().replace(/\s+/g, '_');
    if (!formattedName) {
      toast.error('Please enter a template name');
      return;
    }

    if (!formData.bodyText.trim()) {
      toast.error('Body message is required');
      return;
    }

    setSubmitting(true);
    try {
      const components = [];

      // 1. Header component
      if (formData.headerType === 'TEXT' && formData.headerText.trim()) {
        components.push({
          type: 'HEADER',
          format: 'TEXT',
          text: formData.headerText.trim(),
        });
      } else if (formData.headerType === 'IMAGE') {
        components.push({
          type: 'HEADER',
          format: 'IMAGE',
        });
      }

      // 2. Body component
      components.push({
        type: 'BODY',
        text: formData.bodyText.trim(),
      });

      // 3. Footer component
      if (formData.footerText.trim()) {
        components.push({
          type: 'FOOTER',
          text: formData.footerText.trim(),
        });
      }

      // 4. Buttons component (Packaging all dynamic buttons)
      const validButtons = buttons.filter((b) => b.text && b.text.trim());
      if (validButtons.length > 0) {
        components.push({
          type: 'BUTTONS',
          buttons: validButtons.map((b) => {
            if (b.type === 'URL') {
              return {
                type: 'URL',
                text: b.text.trim(),
                url: b.url.trim() || 'https://zest-eat.com',
              };
            }
            if (b.type === 'PHONE_NUMBER') {
              return {
                type: 'PHONE_NUMBER',
                text: b.text.trim(),
                phone_number: b.phoneNumber.trim() || '+919876543210',
              };
            }
            return {
              type: 'QUICK_REPLY',
              text: b.text.trim(),
            };
          }),
        });
      }

      const bodyPayload = new FormData();
      bodyPayload.append('name', formattedName);
      bodyPayload.append('language', formData.language);
      bodyPayload.append('category', formData.category);
      bodyPayload.append('components', JSON.stringify(components));

      if (formData.headerType === 'IMAGE' && headerImage) {
        bodyPayload.append('media', headerImage);
      }

      const { data } = await api.post('/api/template/meta', bodyPayload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (data.success) {
        toast.success(data.message || 'Template created successfully! 🎉');
        setShowForm(false);
        setFormData({
          name: '',
          category: 'MARKETING',
          language: 'en_US',
          headerType: 'IMAGE',
          headerText: '',
          bodyText: 'Hello {{1}}, check out our special fresh offers at Zest Eat today!',
          footerText: 'Zest Eat • Reply STOP to unsubscribe',
        });
        setButtons([{ id: 1, type: 'QUICK_REPLY', text: 'Order Now', url: '', phoneNumber: '' }]);
        setHeaderImage(null);
        setImagePreview(null);
        loadTemplates();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create template');
    }
    setSubmitting(false);
  };

  return (
    <div className="dashboard-page animate-in" style={{ padding: '4px 0 32px' }}>
      {/* ── Top Header with Styled Buttons ───────────── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 22,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 800,
              color: '#0f172a',
              letterSpacing: '-0.5px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              margin: 0,
            }}
          >
            <LayoutTemplate size={24} color="#0f172a" />
            WhatsApp Templates
          </h1>
          <p style={{ color: '#64748b', fontSize: 14, margin: '4px 0 0 0' }}>
            Manage, build, and synchronize your WhatsApp templates right here on Zest Eat
          </p>
          {currentWabaId && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 8, fontSize: 12, color: '#475569', background: '#f1f5f9', padding: '4px 10px', borderRadius: 6, fontWeight: 600 }}>
              <span style={{ color: '#16a34a', fontWeight: 700 }}>● Active Meta Account:</span>
              <span style={{ color: '#0f172a', fontFamily: 'monospace' }}>{currentWabaId}</span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {showForm ? (
            <button
              type="button"
              onClick={() => setShowForm(false)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 18px',
                borderRadius: 8,
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                color: '#334155',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
              }}
            >
              <ArrowLeft size={16} /> Back to Templates
            </button>
          ) : (
            <>
              <StyledWrapper>
                <button type="button" onClick={() => setShowForm(true)}>
                  <span>
                    <Plus size={16} /> NEW TEMPLATE
                  </span>
                </button>
              </StyledWrapper>

              <StyledWrapper>
                <button type="button" onClick={handleSyncAll} disabled={syncing}>
                  <span>
                    <RefreshCw size={16} className={syncing ? 'spin' : ''} />
                    {syncing ? 'SYNCING...' : 'SYNC FROM DATA'}
                  </span>
                </button>
              </StyledWrapper>
            </>
          )}
        </div>
      </div>

      {/* ── Category-Wise Template Builder Form ─────── */}
      {showForm ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.4fr) minmax(320px, 1fr)',
            gap: 24,
          }}
        >
          {/* Left: Category-Wise Template Form */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #eef2f6',
              borderRadius: 16,
              padding: 26,
              boxShadow: '0 1px 3px rgba(0,0,0,0.02), 0 4px 12px -2px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>
                Create Category-Wise Template
              </h2>
              <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                Build your WhatsApp message with media upload and interactive call-to-action buttons.
              </p>
            </div>

            <form onSubmit={handleSubmitTemplate} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Category Selector Tabs */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.5px' }}>
                  SELECT CATEGORY
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => handleCategoryChange('MARKETING')}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 10,
                      border: formData.category === 'MARKETING' ? '2px solid #0f172a' : '1px solid #e2e8f0',
                      background: formData.category === 'MARKETING' ? '#f8fafc' : '#ffffff',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 14 }}>🎯 Marketing</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Upload media banners, offers & promos</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCategoryChange('UTILITY')}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 10,
                      border: formData.category === 'UTILITY' ? '2px solid #0f172a' : '1px solid #e2e8f0',
                      background: formData.category === 'UTILITY' ? '#f8fafc' : '#ffffff',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 14 }}>⚡ Utility</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Order confirmations & alerts</div>
                  </button>
                </div>
              </div>

              {/* Template Name & Language (English Only) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.5px' }}>
                    TEMPLATE NAME <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. festive_weekend_special"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })
                    }
                    required
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      fontSize: 14,
                      color: '#0f172a',
                      boxSizing: 'border-box',
                    }}
                  />
                  <span style={{ fontSize: 11, color: '#94a3b8', marginTop: 3, display: 'block' }}>
                    lowercase and underscores only
                  </span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.5px' }}>
                    LANGUAGE (ENGLISH ONLY)
                  </label>
                  <select
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      fontSize: 14,
                      color: '#0f172a',
                      background: '#fff',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="en_US">English (en_US)</option>
                    <option value="en">English (Global)</option>
                  </select>
                </div>
              </div>

              {/* Header Section (Category-Specific: Marketing Media Upload) */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #eef2f6',
                  borderRadius: 12,
                  padding: 16,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <label style={{ fontSize: 11, fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    HEADER {formData.category === 'MARKETING' ? '(RECOMMENDED: UPLOAD MEDIA)' : '(OPTIONAL)'}
                  </label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {['NONE', 'IMAGE', 'TEXT'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormData({ ...formData, headerType: type })}
                        style={{
                          padding: '5px 12px',
                          borderRadius: 6,
                          border: formData.headerType === type ? '2px solid #0f172a' : '1px solid #e2e8f0',
                          background: formData.headerType === type ? '#ffffff' : 'transparent',
                          color: formData.headerType === type ? '#0f172a' : '#64748b',
                          fontWeight: 700,
                          fontSize: 11,
                          cursor: 'pointer',
                        }}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {formData.headerType === 'IMAGE' && (
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      style={{ display: 'none' }}
                      id="marketing-image-upload"
                    />
                    <label
                      htmlFor="marketing-image-upload"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '18px',
                        border: '2px dashed #cbd5e1',
                        borderRadius: 8,
                        background: '#ffffff',
                        cursor: 'pointer',
                        gap: 6,
                      }}
                    >
                      <ImageIcon size={28} color="#0284c7" />
                      <span style={{ fontWeight: 700, color: '#0f172a', fontSize: 13 }}>
                        {headerImage ? headerImage.name : 'Click to Upload Marketing Banner / Image'}
                      </span>
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>Supports JPG, PNG (Max 5MB)</span>
                    </label>
                  </div>
                )}

                {formData.headerType === 'TEXT' && (
                  <input
                    type="text"
                    placeholder="e.g. Weekend Flash Sale Alert!"
                    value={formData.headerText}
                    onChange={(e) => setFormData({ ...formData, headerText: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      fontSize: 14,
                      background: '#fff',
                      boxSizing: 'border-box',
                    }}
                  />
                )}
              </div>

              {/* Body Message */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    BODY MESSAGE <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <span style={{ fontSize: 11, color: '#64748b' }}>Use &#123;&#123;1&#125;&#125;, &#123;&#123;2&#125;&#125; for customer variables</span>
                </div>
                <textarea
                  rows={4}
                  placeholder="Enter message text..."
                  value={formData.bodyText}
                  onChange={(e) => setFormData({ ...formData, bodyText: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    fontSize: 14,
                    color: '#0f172a',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Footer Text */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.5px' }}>
                  FOOTER (OPTIONAL)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Zest Eat • Taste the Freshness"
                  value={formData.footerText}
                  onChange={(e) => setFormData({ ...formData, footerText: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    fontSize: 14,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* ── Dynamic Multi-Button Section ────────── */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #eef2f6',
                  borderRadius: 12,
                  padding: 16,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 12,
                  }}
                >
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      INTERACTIVE BUTTONS ({buttons.length}/3)
                    </span>
                    <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0 0' }}>
                      Add Quick Replies or Call-To-Action buttons
                    </p>
                  </div>

                  {buttons.length < 3 && (
                    <button
                      type="button"
                      onClick={handleAddButton}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '6px 14px',
                        background: '#0f172a',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      <Plus size={14} /> Add Button
                    </button>
                  )}
                </div>

                {/* List of Added Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {buttons.map((btn, index) => (
                    <div
                      key={btn.id}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: 8,
                        padding: 12,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>
                          Button #{index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveButton(btn.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            padding: 4,
                          }}
                          title="Remove Button"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 8 }}>
                        <select
                          value={btn.type}
                          onChange={(e) => handleUpdateButton(btn.id, 'type', e.target.value)}
                          style={{
                            padding: '8px 10px',
                            borderRadius: 6,
                            border: '1px solid #cbd5e1',
                            fontSize: 12,
                            background: '#fff',
                            fontWeight: 600,
                          }}
                        >
                          <option value="QUICK_REPLY">Quick Reply</option>
                          <option value="URL">Visit URL</option>
                          <option value="PHONE_NUMBER">Call Phone</option>
                        </select>

                        <input
                          type="text"
                          placeholder="Button label (e.g. Order Now)"
                          value={btn.text}
                          onChange={(e) => handleUpdateButton(btn.id, 'text', e.target.value)}
                          maxLength={25}
                          style={{
                            padding: '8px 12px',
                            borderRadius: 6,
                            border: '1px solid #cbd5e1',
                            fontSize: 13,
                          }}
                        />
                      </div>

                      {btn.type === 'URL' && (
                        <input
                          type="url"
                          placeholder="Website URL (e.g. https://zest-eat.com/menu)"
                          value={btn.url}
                          onChange={(e) => handleUpdateButton(btn.id, 'url', e.target.value)}
                          style={{
                            padding: '8px 12px',
                            borderRadius: 6,
                            border: '1px solid #cbd5e1',
                            fontSize: 13,
                          }}
                        />
                      )}

                      {btn.type === 'PHONE_NUMBER' && (
                        <input
                          type="tel"
                          placeholder="Phone number with country code (e.g. +919876543210)"
                          value={btn.phoneNumber}
                          onChange={(e) => handleUpdateButton(btn.id, 'phoneNumber', e.target.value)}
                          style={{
                            padding: '8px 12px',
                            borderRadius: 6,
                            border: '1px solid #cbd5e1',
                            fontSize: 13,
                          }}
                        />
                      )}
                    </div>
                  ))}

                  {buttons.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '12px', color: '#94a3b8', fontSize: 13 }}>
                      No buttons added yet. Click <strong>+ Add Button</strong> above.
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Row with Styled Button */}
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 8 }}>
                <StyledWrapper>
                  <button type="submit" disabled={submitting}>
                    <span>
                      <CheckCircle size={16} />
                      {submitting ? 'SAVING...' : 'SUBMIT TEMPLATE'}
                    </span>
                  </button>
                </StyledWrapper>

                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{
                    padding: '12px 20px',
                    borderRadius: 6,
                    border: '1px solid #e2e8f0',
                    background: '#ffffff',
                    color: '#64748b',
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>

          {/* Right: Real-time WhatsApp Mockup Preview */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #eef2f6',
              borderRadius: 16,
              padding: 24,
              boxShadow: '0 1px 3px rgba(0,0,0,0.02), 0 4px 12px -2px rgba(0,0,0,0.03)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Smartphone size={18} color="#0f172a" />
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                Live WhatsApp Mockup
              </h3>
            </div>

            <div
              style={{
                flex: 1,
                background: '#efeae2',
                borderRadius: 12,
                padding: 16,
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'flex-start',
                minHeight: 380,
                backgroundImage: 'radial-gradient(#d1d7db 1px, transparent 1px)',
                backgroundSize: '16px 16px',
              }}
            >
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '0 12px 12px 12px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.12)',
                  maxWidth: '100%',
                  width: '100%',
                  overflow: 'hidden',
                }}
              >
                {/* Header Image Preview */}
                {formData.headerType === 'IMAGE' && (
                  <div
                    style={{
                      width: '100%',
                      height: 140,
                      background: '#f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#94a3b8',
                      overflow: 'hidden',
                    }}
                  >
                    {imagePreview ? (
                      <img src={imagePreview} alt="Header Banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ textAlign: 'center' }}>
                        <ImageIcon size={24} style={{ margin: '0 auto 4px' }} />
                        <span style={{ fontSize: 12, fontWeight: 600, display: 'block' }}>Marketing Image Banner</span>
                      </div>
                    )}
                  </div>
                )}

                <div style={{ padding: 12 }}>
                  {/* Header Text Preview */}
                  {formData.headerType === 'TEXT' && formData.headerText && (
                    <div style={{ fontWeight: 800, fontSize: 14, color: '#0f172a', marginBottom: 6 }}>
                      {formData.headerText}
                    </div>
                  )}

                  {/* Body Preview */}
                  <div style={{ fontSize: 13.5, color: '#111827', whiteSpace: 'pre-wrap', lineHeight: 1.45 }}>
                    {formData.bodyText || 'Your message text will appear here...'}
                  </div>

                  {/* Footer Preview */}
                  {formData.footerText && (
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 8 }}>{formData.footerText}</div>
                  )}
                </div>

                {/* ── ALL Live Interactive Buttons in Preview ── */}
                {buttons.map((btn, idx) => (
                  <div
                    key={btn.id || idx}
                    style={{
                      borderTop: '1px solid #f1f5f9',
                      padding: '10px 14px',
                      color: '#0284c7',
                      fontSize: 13,
                      fontWeight: 700,
                      textAlign: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    {btn.type === 'URL' && <LinkIcon size={14} />}
                    {btn.type === 'PHONE_NUMBER' && <Phone size={14} />}
                    {btn.type === 'QUICK_REPLY' && <MessageSquare size={14} />}
                    <span>{btn.text || `Action Button ${idx + 1}`}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ── Template List Table View ───────────────── */
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #eef2f6',
            borderRadius: 16,
            padding: 24,
            boxShadow: '0 1px 3px rgba(0,0,0,0.02), 0 4px 12px -2px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>
              All templates are stored in your database and synced for campaign broadcasting.
            </p>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>
              Total: {templates.length} templates
            </span>
          </div>

          {loading ? (
            <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>Loading templates...</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                    <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>
                      Template Name
                    </th>
                    <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>
                      Category
                    </th>
                    <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>
                      Meta ID
                    </th>
                    <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>
                      Status
                    </th>
                    <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {templates.map((t) => (
                    <tr key={t._id} style={{ borderBottom: '1px solid #f8fafc' }}>
                      <td style={{ padding: '16px', fontWeight: 700, color: '#0f172a', fontSize: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          {t.imageUrl ? (
                            <img
                              src={t.imageUrl.startsWith('http') ? t.imageUrl : `https://zest-eat.onrender.com${t.imageUrl}`}
                              alt={t.name}
                              style={{ width: 38, height: 38, borderRadius: 8, objectFit: 'cover', border: '1px solid #e2e8f0', flexShrink: 0 }}
                            />
                          ) : (
                            <div style={{ width: 38, height: 38, borderRadius: 8, background: '#f8fafc', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', flexShrink: 0 }}>
                              <LayoutTemplate size={16} />
                            </div>
                          )}
                          <div>
                            <div>{t.name}</div>
                            {t.language && <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>{t.language}</div>}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px', color: '#64748b', fontSize: 13 }}>
                        <span
                          style={{
                            background: t.category === 'MARKETING' ? '#f0fdf4' : '#f8fafc',
                            color: t.category === 'MARKETING' ? '#16a34a' : '#475569',
                            padding: '4px 10px',
                            borderRadius: 6,
                            border: '1px solid #e2e8f0',
                            fontWeight: 700,
                            fontSize: 11,
                          }}
                        >
                          {t.category || 'MARKETING'}
                        </span>
                      </td>
                      <td style={{ padding: '16px', color: '#64748b', fontFamily: 'monospace', fontSize: 12 }}>
                        {t.metaTemplateId || 'local'}
                      </td>
                      <td style={{ padding: '16px' }}>
                        {t.metaStatus === 'APPROVED' ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              padding: '4px 10px',
                              background: '#dcfce7',
                              color: '#16a34a',
                              borderRadius: 20,
                              fontSize: 11,
                              fontWeight: 700,
                            }}
                          >
                            <ShieldCheck size={13} /> APPROVED
                          </span>
                        ) : (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              padding: '4px 10px',
                              background: '#fef3c7',
                              color: '#d97706',
                              borderRadius: 20,
                              fontSize: 11,
                              fontWeight: 700,
                            }}
                          >
                            <ShieldAlert size={13} /> {t.metaStatus || 'PENDING'}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '16px', display: 'flex', gap: 8, alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={() => checkStatus(t._id)}
                          style={{
                            padding: '6px 12px',
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: 6,
                            color: '#334155',
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontSize: 12,
                            transition: 'all 0.15s',
                          }}
                        >
                          Sync Status
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTemplate(t._id, t.name)}
                          style={{
                            padding: '6px 10px',
                            background: '#fff1f2',
                            border: '1px solid #fecdd3',
                            borderRadius: 6,
                            color: '#e11d48',
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontSize: 12,
                            transition: 'all 0.15s',
                          }}
                          title="Delete template"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {templates.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>
                        No templates found. Click <strong>+ NEW TEMPLATE</strong> to create your first template!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
