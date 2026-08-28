import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import { Send, CheckCircle, CheckCheck, XCircle, LayoutDashboard, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './Dashboard.css';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="tooltip-date">{label}</p>
        <p className="tooltip-item">
          <span>Sent:</span>
          <span style={{ fontWeight:800, color:'#60a5fa' }}>{payload[0]?.value || 0}</span>
        </p>
        <p className="tooltip-item">
          <span>Delivered:</span>
          <span style={{ fontWeight:800, color:'#34d399' }}>{payload[1]?.value || 0}</span>
        </p>
        <p className="tooltip-item">
          <span>Read:</span>
          <span style={{ fontWeight:800, color:'#818cf8' }}>{payload[2]?.value || 0}</span>
        </p>
        <p className="tooltip-item">
          <span>Failed:</span>
          <span style={{ fontWeight:800, color:'#ef4444' }}>{payload[3]?.value || 0}</span>
        </p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const [stats,      setStats]      = useState(null);
  const [chartLogs,  setChartLogs]  = useState([]);
  const [wpp,        setWpp]        = useState({ status:'DISCONNECTED' });
  const [loading,    setLoading]    = useState(true);

  const pollStatus = useCallback(async () => {
    try {
      const { data } = await api.get('/api/whatsapp/status');
      setWpp({ status: data.status });
    } catch {}
  }, []);

  useEffect(() => {
    loadData();
    pollStatus();
    const interval = setInterval(pollStatus, 5000);
    return () => clearInterval(interval);
  }, [pollStatus]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/template/stats/summary');
      if (res.data.success) {
        setStats(res.data.stats);
        setChartLogs(res.data.chartData || []);
      }
    } catch { toast.error('Failed to load dashboard data'); }
    setLoading(false);
  };

  const getChartData = () => {
    const data = [];
    const today = new Date();
    today.setHours(0,0,0,0);
    
    // Last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      data.push({
        date: d.toLocaleDateString('en-IN', { day:'numeric', month:'short' }),
        sent: 0,
        delivered: 0,
        read: 0,
        failed: 0,
        rawDate: d,
      });
    }

    chartLogs.forEach(log => {
      const logDate = new Date(log.timestamp);
      logDate.setHours(0,0,0,0);
      
      data.forEach(day => {
        if (logDate.getTime() === day.rawDate.getTime()) {
           if (['sent', 'delivered', 'read'].includes(log.status)) day.sent += 1;
           if (['delivered', 'read'].includes(log.status)) day.delivered += 1;
           if (log.status === 'read') day.read += 1;
           if (log.status === 'failed') day.failed += 1;
        }
      });
    });
    return data;
  };

  const statCards = [
    { label:'Sent Messages',   value: stats?.sent ?? 0,      icon:<Send size={20}/>,       classType:'card-cool', iconBg:'rgba(255,255,255,0.1)', iconColor:'#60a5fa' },
    { label:'Delivered',       value: stats?.delivered ?? 0, icon:<CheckCircle size={20}/>,classType:'card-cool', iconBg:'rgba(255,255,255,0.1)', iconColor:'#34d399' },
    { label:'Read',            value: stats?.read ?? 0,      icon:<CheckCheck size={20}/>, classType:'card-cool', iconBg:'rgba(255,255,255,0.1)', iconColor:'#818cf8' },
    { label:'Failed',          value: stats?.failed ?? 0,    icon:<XCircle size={20}/>,    classType:'card-cool', iconBg:'rgba(255,255,255,0.1)', iconColor:'#f87171' },
  ];

  const chartData = getChartData();

  return (
    <div className="dashboard-page animate-in">

      {/* ── Stat Cards ──────────────────────────────── */}
      <div className="stats-grid">
        {statCards.map(({ label, value, icon, classType, iconBg, iconColor }) => (
          <div key={label} className={`dash-card ${classType}`}>
            <div className="card-header">
              <span className="stat-label">{label}</span>
              <span className="stat-icon-box" style={{ background:iconBg, color:iconColor }}>{icon}</span>
            </div>
            <div className="stat-value" style={{ color:iconColor }}>{value.toLocaleString('en-IN')}</div>
          </div>
        ))}
      </div>

      {/* ── Main Layout ──────────────────────────────── */}
      <div className="layout-grid">

        {/* Left */}
        <div style={{ display:'flex', flexDirection:'column', gap:24 }}>

          {/* Chart */}
          <div className="dash-card chart-section">
            <div className="section-title-container">
              <span className="section-title">Campaign Delivery Trends</span>
              <div className="chart-legend">
                <span><span style={{ background:'#60a5fa', width:10, height:10, borderRadius:'50%', display:'inline-block', marginRight:5 }}/>Sent</span>
                <span><span style={{ background:'#34d399', width:10, height:10, borderRadius:'50%', display:'inline-block', marginRight:5 }}/>Delivered</span>
                <span><span style={{ background:'#818cf8', width:10, height:10, borderRadius:'50%', display:'inline-block', marginRight:5 }}/>Read</span>
                <span><span style={{ background:'#ef4444', width:10, height:10, borderRadius:'50%', display:'inline-block', marginRight:5 }}/>Failed</span>
              </div>
            </div>

            <div style={{ width:'100%', height:260 }}>
              {loading ? (
                <div className="flex-center h-full"><Loader2 className="spin" style={{ color:'#9ca3af' }} /></div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top:10, right:10, left:-20, bottom:0 }}>
                    <defs>
                      <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#60a5fa" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorDelivered" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#34d399" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorRead" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize:12, fill:'#6b7280' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize:12, fill:'#6b7280' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="sent" stroke="#60a5fa" strokeWidth={3} fillOpacity={1} fill="url(#colorSent)" />
                    <Area type="monotone" dataKey="delivered" stroke="#34d399" strokeWidth={3} fillOpacity={1} fill="url(#colorDelivered)" />
                    <Area type="monotone" dataKey="read" stroke="#818cf8" strokeWidth={3} fillOpacity={1} fill="url(#colorRead)" />
                    <Area type="monotone" dataKey="failed" stroke="#ef4444" strokeWidth={2} fill="none" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
          
          <div className="dash-card">
            <h3 className="section-title">Automation Overview</h3>
            <div className="target-box" style={{ marginTop: 15 }}>
               <div className="target-label">Active Meta Templates</div>
               <div className="target-value">{stats?.activeTemplates || 0}</div>
            </div>
            <div className="target-box" style={{ marginTop: 15 }}>
               <div className="target-label">Total Campaigns Run</div>
               <div className="target-value">{stats?.totalCampaigns || 0}</div>
            </div>
            <div className="target-box" style={{ marginTop: 15 }}>
               <div className="target-label">Total Contacts</div>
               <div className="target-value">{stats?.totalContacts || 0}</div>
            </div>
          </div>

          <div className="dash-card">
             <h3 className="section-title">Quick Actions</h3>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 15 }}>
                <a href="/app/campaigns" className="btn-primary" style={{ textAlign: 'center', textDecoration: 'none' }}>New Campaign</a>
                <a href="/app/templates" className="btn-secondary" style={{ textAlign: 'center', textDecoration: 'none', background: '#f3f4f6', color: '#374151' }}>Manage Templates</a>
                <a href="/app/contacts" className="btn-secondary" style={{ textAlign: 'center', textDecoration: 'none', background: '#f3f4f6', color: '#374151' }}>Import Contacts</a>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}