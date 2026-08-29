import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import {
  Send, CheckCircle, CheckCheck, XCircle,
  Clock, Bot, Wifi, WifiOff, Zap, Users, Loader2, RefreshCw
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './Dashboard.css';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const dataObj = payload[0]?.payload || {};
    return (
      <div className="custom-tooltip">
        <p className="tooltip-date">{label}</p>
        <p className="tooltip-item">
          <span>Sent:</span>
          <span style={{ fontWeight: 700, color: '#0284c7' }}>{dataObj.sent ?? 0}</span>
        </p>
        <p className="tooltip-item">
          <span>Delivered:</span>
          <span style={{ fontWeight: 700, color: '#10b981' }}>{dataObj.delivered ?? 0}</span>
        </p>
        <p className="tooltip-item">
          <span>Read:</span>
          <span style={{ fontWeight: 700, color: '#8b5cf6' }}>{dataObj.read ?? 0}</span>
        </p>
        <p className="tooltip-item">
          <span>Failed:</span>
          <span style={{ fontWeight: 700, color: '#ef4444' }}>{dataObj.failed ?? 0}</span>
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
  const [isSyncing, setIsSyncing] = useState(false);

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

  const handleSyncAll = async () => {
    setIsSyncing(true);
    try {
      const syncRes = await api.post('/api/template/sync-meta');
      await Promise.all([loadData(), pollStatus()]);
      toast.success(syncRes.data?.message || 'Synchronized live Meta account data! 🔄');
    } catch (err) {
      await loadData();
      toast.error(err.response?.data?.message || 'Failed to sync Meta data');
    }
    setIsSyncing(false);
  };

  const getChartData = () => {
    const data = [];
    const now = new Date();

    if (timeframe === 'Day') {
      // 12 slots of 2-hour increments for today (00:00 to 22:00)
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      for (let h = 0; h < 24; h += 2) {
        const slotStart = new Date(startOfToday.getTime() + h * 3600000);
        const slotEnd = new Date(startOfToday.getTime() + (h + 2) * 3600000);
        const hourLabel = slotStart.toLocaleTimeString('en-IN', { hour: 'numeric', hour12: true });
        data.push({
          date: hourLabel,
          sent: 0,
          delivered: 0,
          read: 0,
          failed: 0,
          startTime: slotStart.getTime(),
          endTime: slotEnd.getTime(),
        });
      }

      chartLogs.forEach((log) => {
        const t = new Date(log.timestamp).getTime();
        data.forEach((slot) => {
          if (t >= slot.startTime && t < slot.endTime) {
            if (['sent', 'delivered', 'read'].includes(log.status)) slot.sent += 1;
            if (['delivered', 'read'].includes(log.status)) slot.delivered += 1;
            if (log.status === 'read') slot.read += 1;
            if (log.status === 'failed') slot.failed += 1;
          }
        });
      });
    } else if (timeframe === 'Week') {
      // Last 7 days
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        data.push({
          date: d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }),
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
    } else {
      // Month: Last 30 days
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      for (let i = 29; i >= 0; i--) {
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
    }

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
      <div className="dash-header-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="dash-title">Good Evening, Zest Eat</h1>
          <p className="dash-subtitle">
            Your agents handled <span className="dash-highlight-dark">{(stats?.sent ?? 0).toLocaleString()} messages</span> this month with <span className="dash-highlight-success">{successRate}% success</span>
          </p>
          {stats?.wabaId && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 8, fontSize: 12, color: '#475569', background: '#f1f5f9', padding: '4px 10px', borderRadius: 6, fontWeight: 600 }}>
              <span style={{ color: '#16a34a', fontWeight: 700 }}>● Active Meta Account:</span>
              <span style={{ color: '#0f172a', fontFamily: 'monospace' }}>{stats.wabaId}</span>
              {stats.phoneId && <span style={{ color: '#64748b' }}>({stats.phoneId})</span>}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={handleSyncAll}
          disabled={isSyncing}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            borderRadius: 10,
            border: '1px solid #e2e8f0',
            background: '#ffffff',
            color: '#0f172a',
            fontWeight: 700,
            fontSize: 13,
            cursor: isSyncing ? 'not-allowed' : 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            transition: 'all 0.15s ease',
          }}
        >
          <RefreshCw size={15} style={{ animation: isSyncing ? 'spin 1s linear infinite' : 'none' }} />
          {isSyncing ? 'Syncing with Meta...' : 'Sync Meta Data'}
        </button>
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
          <div className="card-header-clean" style={{ flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2 className="card-title-clean">Usage Trends</h2>
              <p className="card-subtitle-clean">
                {timeframe === 'Day' && "Today's hourly message activity (every 2 hours)"}
                {timeframe === 'Week' && "Last 7 days daily message activity"}
                {timeframe === 'Month' && "Last 30 days daily message activity"}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: '#64748b', fontWeight: 600 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#0284c7' }} />
                  Sent
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
                  Delivered
                </span>
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
                    <linearGradient id="sentTrendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0284c7" stopOpacity={0.22} />
                      <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="deliveredTrendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.22} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    dy={10}
                    minTickGap={timeframe === 'Month' ? 24 : 10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="sent"
                    name="Sent"
                    stroke="#0284c7"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#sentTrendGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="delivered"
                    name="Delivered"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#deliveredTrendGrad)"
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