import React, { useState, useEffect } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import { Settings, Shield, Phone, Building2, CheckCircle2, Wifi, WifiOff } from 'lucide-react';
import './Dashboard.css';

export default function WhatsAppConnection() {
  const [wppStatus, setWppStatus] = useState('DISCONNECTED');
  const [config, setConfig] = useState({
    wabaId: '',
    phoneId: '',
    version: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statusRes, configRes] = await Promise.all([
          api.get('/api/whatsapp/status'),
          api.get('/api/whatsapp/config')
        ]);
        if (statusRes.data?.status) setWppStatus(statusRes.data.status);
        if (configRes.data) {
          setConfig({
            wabaId: configRes.data.wabaId || '',
            phoneId: configRes.data.phoneId || '',
            version: configRes.data.version || 'v19.0'
          });
        }
      } catch (err) {
        console.error('Failed to load WhatsApp status/config:', err);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="dashboard-page animate-in">
      <div className="section-title-container">
        <h2 className="section-title" style={{ fontSize: 24 }}><Settings /> Meta WhatsApp Connection</h2>
      </div>
      
      <div className="layout-grid">
        <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
          <div className="dash-card">
            <h3 className="section-title"><Shield /> Connection Status</h3>
            
            <div style={{ marginTop: 24, padding: 24, borderRadius: 16, border: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', alignItems: 'center', gap: 16 }}>
               <div style={{ width: 64, height: 64, borderRadius: '50%', background: wppStatus === 'CONNECTED' ? '#dcfce7' : '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: wppStatus === 'CONNECTED' ? '#16a34a' : '#ef4444' }}>
                  {wppStatus === 'CONNECTED' ? <Wifi size={32} /> : <WifiOff size={32} />}
               </div>
               <div>
                  <h4 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: '#0f172a' }}>{wppStatus === 'CONNECTED' ? 'Connected to Meta' : 'Disconnected'}</h4>
                  <p style={{ margin: '4px 0 0', color: '#64748b' }}>Your backend is successfully listening to Meta Webhooks.</p>
               </div>
            </div>
          </div>
          
          <div className="dash-card">
            <h3 className="section-title"><Building2 /> Business Configuration</h3>
            
            <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 16, borderBottom: '1px solid #f1f5f9' }}>
                    <div>
                        <div style={{ fontWeight: 600, color: '#334155' }}>WhatsApp Business Account ID</div>
                        <div style={{ fontSize: 13, color: '#64748b' }}>The WABA ID associated with Zest Eat</div>
                    </div>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{config.wabaId || 'Configured via .env'}</div>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 16, borderBottom: '1px solid #f1f5f9' }}>
                    <div>
                        <div style={{ fontWeight: 600, color: '#334155' }}>Phone Number ID</div>
                        <div style={{ fontSize: 13, color: '#64748b' }}>The specific phone number ID used for broadcasting</div>
                    </div>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{config.phoneId || 'Configured via .env'}</div>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 16, borderBottom: '1px solid #f1f5f9' }}>
                    <div>
                        <div style={{ fontWeight: 600, color: '#334155' }}>Graph API Version</div>
                        <div style={{ fontSize: 13, color: '#64748b' }}>The Meta Graph API version in use</div>
                    </div>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{config.version}</div>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                        <div style={{ fontWeight: 600, color: '#334155' }}>System Access Token</div>
                        <div style={{ fontSize: 13, color: '#64748b' }}>Never share this token with anyone</div>
                    </div>
                    <div style={{ fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <CheckCircle2 size={16} /> Securely Stored
                    </div>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
