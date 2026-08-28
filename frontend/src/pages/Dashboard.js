import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import {
  Send, CheckCircle, CheckCheck, XCircle,
  Clock, Bot, Wifi, WifiOff, Zap, Users, Loader2
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './Dashboard.css';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="tooltip-date">{label}</p>
        <p className="tooltip-item">
          <span>Sent:</span>
          <span style={{ fontWeight: 700, color: '#0f172a' }}>{payload[0]?.value || 0}</span>
        </p>
        <p className="tooltip-item">
          <span>Delivered:</span>
          <span style={{ fontWeight: 700, color: '#10b981' }}>{payload[1]?.value || 0}</span>
        </p>
        <p className="tooltip-item">
          <span>Read:</span>
          <span style={{ fontWeight: 700, color: '#0284c7' }}>{payload[2]?.value || 0}</span>
        </p>
        <p className="tooltip-item">
          <span>Failed:</span>
          <span style={{ fontWeight: 700, color: '#ef4444' }}>{payload[3]?.value || 0}</span>
        </p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [chartLogs, setChartLogs] = useState([]);
  const [wpp, setWpp] = useState({ status: 'DISCONNECTED' });
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('Month');

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
    } catch {
      toast.error('Failed to load dashboard data');
    }
    setLoading(false);
  };

  const getChartData = () => {
    const data = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      data.push({
        date: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        sent: 0,
        delivered: 0,
        read: 0,
        failed: 0,
        rawDate: d,
      });
    }

    chartLogs.forEach((log) => {
      const logDate = new Date(log.timestamp);
      logDate.setHours(0, 0, 0, 0);

      data.forEach((day) => {
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

  const successRate =
    stats?.sent > 0
      ? ((stats.delivered / stats.sent) * 100).toFixed(2)
      : '0.00';

  const readRate =
    stats?.delivered > 0
      ? ((stats.read / stats.delivered) * 100).toFixed(0)
      : '0';

  const statCards = [
    {
      label: 'TOTAL MESSAGES',
      value: (stats?.sent ?? 0).toLocaleString('en-IN'),
      icon: <Clock size={16} />,
    },
    {
      label: 'ACTIVE AGENTS',
      value: (stats?.activeTemplates ?? 0).toLocaleString('en-IN'),
      icon: <Bot size={16} />,
    },
    {
      label: 'LIVE CONNECTION',
      value: wpp.status === 'CONNECTED' ? 'ONLINE' : 'STANDBY',
      icon: <Wifi size={16} />,
      badge: wpp.status === 'CONNECTED' ? '● LIVE' : '● IDLE',
      isLive: wpp.status === 'CONNECTED',
    },
    {
      label: 'DELIVERED',
      value: (stats?.delivered ?? 0).toLocaleString('en-IN'),
      icon: <CheckCircle size={16} />,
    },
    {
      label: 'SUCCESS RATE',
      value: `${successRate}%`,
      icon: <CheckCheck size={16} />,
    },
    {
      label: 'CONVERSION',
      value: `${readRate}%`,
      icon: <Zap size={16} />,
    },
  ];

  const chartData = getChartData();

  return (
    <div className="dashboard-page animate-in">
      {/* ── Top Greeting Header ─────────────────────── */}
      <div className="dash-header-section">
        <h1 className="dash-title">Good Evening, Zest Eat</h1>
        <p className="dash-subtitle">
          Your agents handled <span className="dash-highlight-dark">{(stats?.sent ?? 0).toLocaleString()} messages</span> this month with <span className="dash-highlight-success">{successRate}% success</span>
        </p>
      </div>

      {/* ── 6 Clean White Stat Cards ─────────────────── */}
      <div className="stats-grid-6">
        {statCards.map(({ label, value, icon, badge, isLive }) => (
          <div key={label} className="clean-card stat-card-box">
            <div className="stat-card-header">
              <span className="stat-icon-wrapper">{icon}</span>
              {badge && (
                <span className={`stat-badge ${isLive ? 'stat-badge-live' : 'stat-badge-idle'}`}>
                  {badge}
                </span>
              )}
            </div>
            <div className="stat-card-label">{label}</div>
            <div className="stat-card-value">{value}</div>
          </div>
        ))}
      </div>

      {/* ── Main Layout: Usage Trends & Outcomes ─────── */}
      <div className="layout-grid-clean">
        {/* Left: Usage Trends Area Chart */}
        <div className="clean-card chart-card">
          <div className="card-header-clean">
            <div>
              <h2 className="card-title-clean">Usage Trends</h2>
              <p className="card-subtitle-clean">Last 30 days</p>
            </div>
            <div className="timeframe-toggle">
              {['Day', 'Week', 'Month'].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setTimeframe(tab)}
                  className={`timeframe-btn ${timeframe === tab ? 'timeframe-btn-active' : ''}`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div style={{ width: '100%', height: 260, marginTop: 16 }}>
            {loading ? (
              <div className="flex-center h-full">
                <Loader2 className="spin" style={{ color: '#94a3b8' }} />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="coolTrendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0284c7" stopOpacity={0.12} />
                      <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="sent"
                    stroke="#0284c7"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#coolTrendGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Right: Outcomes & Quick Actions */}
        <div className="clean-card outcomes-card">
          <div className="card-header-clean">
            <div>
              <h2 className="card-title-clean">Campaign Outcomes</h2>
              <p className="card-subtitle-clean">Success vs failed per week</p>
            </div>
          </div>

          <div className="outcomes-tiles-grid">
            <div className="outcome-tile">
              <span className="outcome-label">TOTAL</span>
              <span className="outcome-val">{(stats?.sent ?? 0).toLocaleString()}</span>
            </div>
            <div className="outcome-tile">
              <span className="outcome-label">SUCCESS</span>
              <span className="outcome-val text-green">{(stats?.delivered ?? 0).toLocaleString()}</span>
            </div>
            <div className="outcome-tile">
              <span className="outcome-label">FAILED</span>
              <span className="outcome-val text-red">{(stats?.failed ?? 0).toLocaleString()}</span>
            </div>
            <div className="outcome-tile">
              <span className="outcome-label">CONTACTS</span>
              <span className="outcome-val">{(stats?.totalContacts ?? 0).toLocaleString()}</span>
            </div>
          </div>

          <div className="card-actions-clean">
            <a href="/app/campaigns" className="btn-clean-primary">
              + New Campaign
            </a>
            <a href="/app/templates" className="btn-clean-secondary">
              Manage Templates
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}