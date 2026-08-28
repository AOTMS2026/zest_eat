import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HeroSection } from '../components/ui/hero-section';
import { RobotHero } from '../components/ui/robot-hero';
import { LeverSwitch } from '../components/ui/lever-switch';
import { LogIn, User, LayoutDashboard, LogOut } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const token = localStorage.getItem('admin_token');
  const isLoggedIn = !!token;

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
            <button 
              onClick={() => navigate('/app/dashboard')}
              title="Go to Dashboard"
              className="flex items-center justify-center bg-[#1d4ed8] text-white w-10 h-10 rounded-full hover:bg-[#1e3a8a] transition-all shadow-md shadow-blue-500/30 border border-blue-400/30 hover:scale-105"
            >
              <User size={20} />
            </button>
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
