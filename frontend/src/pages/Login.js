import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';
import { LogIn, Building2, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Login() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'company'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Enter email and password'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/login', { email, password });
      if (data.success) {
        localStorage.setItem('admin_token', data.token);
        toast.success('Login successful! Welcome to Zest Eat 👋');
        window.location.href = '/dashboard';
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid email or password');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 font-sans relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-slate-500/20 rounded-full blur-3xl" />

      <div className="bg-white rounded-3xl p-8 md:p-10 w-full max-w-md shadow-2xl relative z-10">
        
        {/* Toggle Switch */}
        <div className="flex p-1 bg-slate-100 rounded-xl mb-8">
          <button
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === 'login' 
                ? 'bg-white text-blue-700 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <LogIn size={16} />
            Login
          </button>
          <button
            onClick={() => setActiveTab('company')}
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === 'company' 
                ? 'bg-white text-blue-700 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Building2 size={16} />
            Company Info
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'login' ? (
            <motion.div
              key="login"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-700 to-blue-500 flex items-center justify-center text-3xl mx-auto mb-6 shadow-lg shadow-blue-500/30">
                🚀
              </div>
              <h1 className="text-2xl font-black text-slate-900 text-center mb-1">
                Zest Eat Automation
              </h1>
              <p className="text-sm text-slate-500 text-center mb-8">
                Sign in to your WhatsApp dashboard
              </p>

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. admin@zesteat.com"
                    autoFocus
                    className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPwd ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition-all pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 mt-2 bg-gradient-to-br from-blue-700 to-blue-500 hover:from-blue-800 hover:to-blue-600 text-white rounded-xl text-sm font-black shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98] disabled:opacity-70 flex justify-center"
                >
                  {loading ? '⏳ Logging in...' : 'Log In'}
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="company"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center justify-center py-4"
            >
              <img 
                src="/zust-eat.png" 
                alt="Zest Eat Logo" 
                className="w-48 h-auto object-contain mb-8 drop-shadow-md"
              />
              <div className="bg-slate-50 w-full rounded-2xl p-6 border border-slate-100">
                <h3 className="font-bold text-slate-800 text-lg mb-2 text-center">
                  Zest Eat Automation Platform
                </h3>
                <p className="text-sm text-slate-600 text-center mb-6 leading-relaxed">
                  The ultimate Meta-approved WhatsApp broadcasting and campaign management system. 
                </p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 font-medium">Version</span>
                    <span className="font-bold text-slate-700">2.0.1</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 font-medium">Status</span>
                    <span className="font-bold text-emerald-600 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      All Systems Operational
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 font-medium">Contact</span>
                    <span className="font-bold text-blue-600">support@zesteat.com</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}