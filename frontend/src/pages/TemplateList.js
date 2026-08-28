import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import api from '../api';
import toast from 'react-hot-toast';
import {
  LayoutTemplate, ShieldCheck, ShieldAlert,
  Plus, RefreshCw, ArrowLeft, Image as ImageIcon,
  CheckCircle, Smartphone
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
    category: 'MARKETING',
    language: 'en_US',
    headerType: 'NONE', // NONE, TEXT, IMAGE
    headerText: '',
    bodyText: 'Hello {{1}}, welcome to Zest Eat! Check out our special offers today.',
    footerText: 'Zest Eat • Reply STOP to opt-out',
    buttonText: 'Order Now',
    buttonUrl: 'https://zest-eat.com',
  });
  const [headerImage, setHeaderImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/template');
      if (data.success) {
        setTemplates(data.templates || []);
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
      await loadTemplates();
      toast.success('Templates synchronized from data successfully! 🔄');
    } catch {
      toast.error('Failed to sync templates');
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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setHeaderImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmitTemplate = async (e) => {
    e.preventDefault();

    const formattedName = formData.name.trim().toLowerCase().replace(/\s+/g, '_');
    if (!formattedName) {
      toast.error('Please enter a valid template name');
      return;
    }

    if (!formData.bodyText.trim()) {
      toast.error('Body text is required');
      return;
    }

    setSubmitting(true);
    try {
      const components = [];

      // Header component
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

      // Body component
      components.push({
        type: 'BODY',
        text: formData.bodyText.trim(),
      });

      // Footer component
      if (formData.footerText.trim()) {
        components.push({
          type: 'FOOTER',
          text: formData.footerText.trim(),
        });
      }

      // Button component
      if (formData.buttonText.trim()) {
        components.push({
          type: 'BUTTONS',
          buttons: [
            {
              type: 'URL',
              text: formData.buttonText.trim(),
              url: formData.buttonUrl.trim() || 'https://zest-eat.com',
            },
          ],
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
          headerType: 'NONE',
          headerText: '',
          bodyText: 'Hello {{1}}, welcome to Zest Eat! Check out our special offers today.',
          footerText: 'Zest Eat • Reply STOP to opt-out',
          buttonText: 'Order Now',
          buttonUrl: 'https://zest-eat.com',
        });
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
          marginBottom: 20,
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
            Manage, build, and synchronize your WhatsApp marketing & utility templates
          </p>
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

      {/* ── Form Section (Inside Own Website) ────────── */}
      {showForm ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.4fr) minmax(320px, 1fr)',
            gap: 24,
          }}
        >
          {/* Left: Template Builder Form */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #eef2f6',
              borderRadius: 16,
              padding: 26,
              boxShadow: '0 1px 3px rgba(0,0,0,0.02), 0 4px 12px -2px rgba(0,0,0,0.03)',
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' }}>
              Create New WhatsApp Template
            </h2>
            <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 20px 0' }}>
              Create your template right here on Zest Eat. Once created, it syncs directly with your account.
            </p>

            <form onSubmit={handleSubmitTemplate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Template Name */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                  TEMPLATE NAME <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. fresh_meat_weekend_deal"
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
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <span style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, display: 'block' }}>
                  Only lowercase letters, numbers, and underscores allowed
                </span>
              </div>

              {/* Category & Language */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                    CATEGORY
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
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
                    <option value="MARKETING">MARKETING</option>
                    <option value="UTILITY">UTILITY</option>
                    <option value="AUTHENTICATION">AUTHENTICATION</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                    LANGUAGE
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
                    <option value="en">English (en)</option>
                    <option value="hi">Hindi (hi)</option>
                    <option value="es">Spanish (es)</option>
                    <option value="ar">Arabic (ar)</option>
                  </select>
                </div>
              </div>

              {/* Header Selection */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                  HEADER TYPE
                </label>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  {['NONE', 'TEXT', 'IMAGE'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData({ ...formData, headerType: type })}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 6,
                        border: formData.headerType === type ? '2px solid #183153' : '1px solid #e2e8f0',
                        background: formData.headerType === type ? '#f0f9ff' : '#ffffff',
                        color: formData.headerType === type ? '#183153' : '#64748b',
                        fontWeight: 600,
                        fontSize: 12,
                        cursor: 'pointer',
                      }}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                {formData.headerType === 'TEXT' && (
                  <input
                    type="text"
                    placeholder="e.g. Special Weekend Deal!"
                    value={formData.headerText}
                    onChange={(e) => setFormData({ ...formData, headerText: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      fontSize: 14,
                      boxSizing: 'border-box',
                    }}
                  />
                )}

                {formData.headerType === 'IMAGE' && (
                  <div
                    style={{
                      border: '2px dashed #cbd5e1',
                      borderRadius: 8,
                      padding: 14,
                      textAlign: 'center',
                      background: '#f8fafc',
                    }}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      style={{ display: 'none' }}
                      id="template-img-input"
                    />
                    <label htmlFor="template-img-input" style={{ cursor: 'pointer', color: '#183153', fontWeight: 600, fontSize: 13 }}>
                      <ImageIcon size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
                      {headerImage ? headerImage.name : 'Upload Header Image Banner'}
                    </label>
                  </div>
                )}
              </div>

              {/* Body Text */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                  BODY MESSAGE <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Enter message content... You can use {{1}}, {{2}} for custom variables"
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
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              {/* Footer Text */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                  FOOTER (OPTIONAL)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Zest Eat • Reply STOP to unsubscribe"
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

              {/* Action Button Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                    BUTTON TEXT
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Order Now"
                    value={formData.buttonText}
                    onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
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

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                    BUTTON URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://zest-eat.com"
                    value={formData.buttonUrl}
                    onChange={(e) => setFormData({ ...formData, buttonUrl: e.target.value })}
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
              </div>

              {/* Submit Row with Styled Button */}
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 10 }}>
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

          {/* Right: Live Interactive WhatsApp Mockup Preview */}
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
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Live WhatsApp Preview</h3>
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
                minHeight: 340,
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
                      <img src={imagePreview} alt="Header Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: 12, fontWeight: 600 }}>Header Image Preview</span>
                    )}
                  </div>
                )}

                <div style={{ padding: 12 }}>
                  {/* Header Text Preview */}
                  {formData.headerType === 'TEXT' && formData.headerText && (
                    <div style={{ fontWeight: 800, fontSize: 14, color: '#0f172a', marginBottom: 4 }}>
                      {formData.headerText}
                    </div>
                  )}

                  {/* Body Preview */}
                  <div style={{ fontSize: 13.5, color: '#111827', whiteSpace: 'pre-wrap', lineHeight: 1.45 }}>
                    {formData.bodyText || 'Your message body will appear here...'}
                  </div>

                  {/* Footer Preview */}
                  {formData.footerText && (
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 8 }}>{formData.footerText}</div>
                  )}
                </div>

                {/* Button Preview */}
                {formData.buttonText && (
                  <div
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
                    🔗 {formData.buttonText}
                  </div>
                )}
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
                      <td style={{ padding: '16px', fontWeight: 700, color: '#0f172a', fontSize: 14 }}>{t.name}</td>
                      <td style={{ padding: '16px', color: '#64748b', fontSize: 13 }}>
                        <span style={{ background: '#f8fafc', padding: '4px 8px', borderRadius: 6, border: '1px solid #f1f5f9', fontWeight: 600 }}>
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
                      <td style={{ padding: '16px' }}>
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
