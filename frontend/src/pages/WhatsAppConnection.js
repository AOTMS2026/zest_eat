import React, { useState, useEffect } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import { Settings, Shield, Phone, Building2, CheckCircle2, Wifi, WifiOff, Key, Save, RefreshCw, AlertTriangle } from 'lucide-react';
import styled from 'styled-components';
import './Dashboard.css';

const ActionButton = styled.button`
  position: relative;
  display: inline-flex;
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
  padding: 0;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &:after {
    content: " ";
    width: 0%;
    height: 100%;
    background: #ffd401;
    position: absolute;
    transition: all 0.4s ease-in-out;
    right: 0;
  }

  &:hover:not(:disabled)::after {
    right: auto;
    left: 0;
    width: 100%;
  }

  span {
    text-align: center;
    text-decoration: none;
    width: 100%;
    padding: 12px 24px;
    color: #fff;
    font-size: 0.9em;
    font-weight: 700;
    letter-spacing: 0.1em;
    z-index: 20;
    transition: all 0.3s ease-in-out;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    white-space: nowrap;
  }

  &:hover:not(:disabled) span {
    color: #183153;
  }
`;

export default function WhatsAppConnection() {
  const [wppStatus, setWppStatus] = useState('DISCONNECTED');
  const [accountName, setAccountName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    wabaId: '',
    phoneId: '',
    accessToken: '',
    verifyToken: 'zest_eat_meta_verify_8f9q2a',
    graphVersion: 'v19.0'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statusRes, configRes] = await Promise.all([
        api.get('/api/whatsapp/status'),
        api.get('/api/whatsapp/config')
      ]);

      if (statusRes.data) {
        setWppStatus(statusRes.data.status || 'DISCONNECTED');
        setAccountName(statusRes.data.wabaName || '');
        setErrorMessage(statusRes.data.error || '');
      }

      if (configRes.data) {
        setForm(prev => ({
          ...prev,
          wabaId: configRes.data.wabaId || '',
          phoneId: configRes.data.phoneId || '',
          verifyToken: configRes.data.verifyToken || 'zest_eat_meta_verify_8f9q2a',
          graphVersion: configRes.data.version || 'v19.0'
        }));
      }
    } catch (err) {
      console.error('Failed to load WhatsApp status/config:', err);
      toast.error('Failed to connect to backend server');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    if (!form.wabaId.trim() || !form.phoneId.trim() || !form.accessToken.trim()) {
      toast.error('Please enter WABA ID, Phone Number ID, and Access Token');
      return;
    }

    setSaving(true);
    try {
      const { data } = await api.post('/api/whatsapp/config', {
        wabaId: form.wabaId.trim(),
        phoneId: form.phoneId.trim(),
        accessToken: form.accessToken.trim(),
        verifyToken: form.verifyToken.trim(),
        graphVersion: form.graphVersion.trim()
      });

      if (data.success) {
        toast.success(data.message || 'Meta credentials saved & verified successfully! 🎉');
        setForm(prev => ({ ...prev, accessToken: '' })); // clear raw input after save
        fetchData();
      } else {
        toast.error(data.message || 'Failed to verify Meta credentials');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Meta API validation failed');
    }
    setSaving(false);
  };

  return (
    <div className="dashboard-page animate-in" style={{ padding: '4px 0 32px' }}>
      <div className="section-title-container" style={{ marginBottom: 24 }}>
        <h2 className="section-title" style={{ fontSize: 24, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Settings color="#0f172a" /> Meta WhatsApp Business Connection
        </h2>
        <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: 14 }}>
          Manage your WhatsApp Business Account (WABA) credentials and live Graph API connection settings.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
        {/* Status Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="dash-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24 }}>
            <h3 className="section-title" style={{ fontSize: 18, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Shield size={20} color="#183153" /> Connection Status
            </h3>

            <div style={{ padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', background: wppStatus === 'CONNECTED' ? '#f0fdf4' : '#fef2f2', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: wppStatus === 'CONNECTED' ? '#dcfce7' : '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: wppStatus === 'CONNECTED' ? '#16a34a' : '#ef4444', flexShrink: 0 }}>
                {wppStatus === 'CONNECTED' ? <Wifi size={28} /> : <WifiOff size={28} />}
              </div>
              <div>
                <h4 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: wppStatus === 'CONNECTED' ? '#166534' : '#991b1b' }}>
                  {wppStatus === 'CONNECTED' ? 'Live Meta Connection Active' : 'Disconnected / Unreachable'}
                </h4>
                {accountName && (
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#15803d', marginTop: 2 }}>
                    Account: {accountName}
                  </div>
                )}
                <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>
                  {wppStatus === 'CONNECTED'
                    ? 'Your backend is connected to Meta Graph API and receiving status webhooks.'
                    : 'Meta Graph API is unreachable or your Access Token has expired.'}
                </p>
              </div>
            </div>

            {errorMessage && (
              <div style={{ marginTop: 16, padding: 12, borderRadius: 8, background: '#fff1f2', border: '1px solid #fecdd3', color: '#9f1239', fontSize: 13, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <strong>Diagnostic Message:</strong> {errorMessage}
                </div>
              </div>
            )}

            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={fetchData}
                disabled={loading}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 14px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#334155',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <RefreshCw size={14} className={loading ? 'spin' : ''} />
                {loading ? 'Testing Connection...' : 'Re-test Meta Connection'}
              </button>
            </div>
          </div>

          <div className="dash-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24 }}>
            <h3 className="section-title" style={{ fontSize: 18, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Building2 size={20} color="#183153" /> Active Configuration Summary
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#334155', fontSize: 14 }}>WhatsApp Business Account ID</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>WABA Account ID on Meta Developer Portal</div>
                </div>
                <div style={{ fontWeight: 700, color: '#0f172a', fontFamily: 'monospace', fontSize: 13 }}>
                  {form.wabaId || 'Not Configured'}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#334155', fontSize: 14 }}>Phone Number ID</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>Phone Number ID used for broadcasting</div>
                </div>
                <div style={{ fontWeight: 700, color: '#0f172a', fontFamily: 'monospace', fontSize: 13 }}>
                  {form.phoneId || 'Not Configured'}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#334155', fontSize: 14 }}>Graph API Version</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>Meta Graph API endpoint version</div>
                </div>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 13 }}>
                  {form.graphVersion}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#334155', fontSize: 14 }}>Database Persistence</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>Saved securely in MongoDB</div>
                </div>
                <div style={{ fontWeight: 700, color: '#16a34a', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
                  <CheckCircle2 size={15} /> Active in DB
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Credentials Form Card */}
        <div className="dash-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24 }}>
          <h3 className="section-title" style={{ fontSize: 18, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Key size={20} color="#183153" /> Update Meta Account Credentials
          </h3>
          <p style={{ color: '#64748b', fontSize: 13, marginBottom: 20 }}>
            Enter your permanent Meta System User Access Token and Business Account IDs below. When saved, credentials are <strong>validated live with Meta</strong> and stored permanently in MongoDB.
          </p>

          <form onSubmit={handleSaveConfig} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 13, color: '#334155', marginBottom: 6 }}>
                WhatsApp Business Account ID (WABA ID) *
              </label>
              <input
                type="text"
                placeholder="e.g. 1026026910332703"
                value={form.wabaId}
                onChange={e => setForm({ ...form, wabaId: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  fontSize: 14,
                  fontFamily: 'monospace',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 13, color: '#334155', marginBottom: 6 }}>
                Phone Number ID *
              </label>
              <input
                type="text"
                placeholder="e.g. 1340972425758369"
                value={form.phoneId}
                onChange={e => setForm({ ...form, phoneId: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  fontSize: 14,
                  fontFamily: 'monospace',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 13, color: '#334155', marginBottom: 6 }}>
                Meta Permanent Access Token *
              </label>
              <textarea
                placeholder="Paste your EAAR... Access Token here"
                rows={4}
                value={form.accessToken}
                onChange={e => setForm({ ...form, accessToken: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  fontSize: 13,
                  fontFamily: 'monospace',
                  outline: 'none',
                  resize: 'vertical'
                }}
              />
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                Generate a <strong>Permanent System User Token</strong> in Meta Business Settings for 24/7 uninterrupted production access.
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 12, color: '#334155', marginBottom: 4 }}>
                  Graph API Version
                </label>
                <select
                  value={form.graphVersion}
                  onChange={e => setForm({ ...form, graphVersion: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
                >
                  <option value="v19.0">v19.0 (Recommended)</option>
                  <option value="v20.0">v20.0</option>
                  <option value="v21.0">v21.0</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 12, color: '#334155', marginBottom: 4 }}>
                  Webhook Verify Token
                </label>
                <input
                  type="text"
                  value={form.verifyToken}
                  onChange={e => setForm({ ...form, verifyToken: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
                />
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <ActionButton type="submit" disabled={saving}>
                <span>
                  <Save size={16} />
                  {saving ? 'Testing & Saving...' : 'TEST & SAVE META CREDENTIALS'}
                </span>
              </ActionButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
