import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HeroSection } from '../components/ui/hero-section';
import { RobotHero } from '../components/ui/robot-hero';
import { LeverSwitch } from '../components/ui/lever-switch';
import { LogIn, User, LayoutDashboard, LogOut } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const token = localStorage.getItem('admin_token');
  const isLoggedIn = !!token;

  const handleSignOut = () => {
    localStorage.removeItem('admin_token');
    window.location.reload();
  };

  return (
    <div className={`relative min-h-screen ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
      {/* Navbar overlay */}
      <nav className="absolute top-0 left-0 w-full z-50 flex justify-between items-center px-8 py-6">
        <div className={`flex items-center gap-2 ${isDarkMode ? 'text-[#c8b4a0]' : 'text-[#8a7060]'}`}>
          <img src="/image.png" alt="Zest Eat Logo" className="h-10 w-auto object-contain" />
          <span className="font-bold text-xl tracking-wider uppercase font-mono">Zest Eat</span>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-3">
             <span className={`text-sm font-mono uppercase tracking-wider ${isDarkMode ? 'text-[#c8b4a0]' : 'text-[#8a7060]'}`}>Dark Mode</span>
             <LeverSwitch checked={isDarkMode} onChange={setIsDarkMode} />
          </div>
          {isLoggedIn ? (
            <div className="relative">
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                title="Profile Menu"
                className="flex items-center justify-center bg-[#1d4ed8] text-white w-10 h-10 rounded-full hover:bg-[#1e3a8a] transition-all shadow-md shadow-blue-500/30 border border-blue-400/30 hover:scale-105"
              >
                <User size={20} />
              </button>
              
              {isProfileOpen && (
                <div className={`absolute right-0 mt-2 w-48 rounded-xl shadow-xl py-2 border z-50 ${isDarkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-slate-100 text-slate-800'}`}>
                  <button 
                    onClick={() => navigate('/app/dashboard')}
                    className={`w-full text-left px-4 py-2.5 text-sm font-bold flex items-center gap-3 transition-colors ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-300' : 'hover:bg-slate-50 text-slate-700'}`}
                  >
                    <LayoutDashboard size={16} className="text-blue-500" /> Dashboard
                  </button>
                  <div className={`h-px w-full my-1 ${isDarkMode ? 'bg-zinc-800' : 'bg-slate-100'}`} />
                  <button 
                    onClick={handleSignOut}
                    className={`w-full text-left px-4 py-2.5 text-sm font-bold flex items-center gap-3 transition-colors text-red-500 ${isDarkMode ? 'hover:bg-zinc-800' : 'hover:bg-red-50'}`}
                  >
                    <LogOut size={16} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button 
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 bg-[#c8b4a0] text-[#1a1d18] px-6 py-2.5 rounded-full font-bold hover:bg-[#a89080] transition-colors"
            >
              <LogIn size={18} /> Login
            </button>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      {isDarkMode ? <HeroSection isDarkMode={true} /> : <RobotHero />}
    </div>
  );
}
