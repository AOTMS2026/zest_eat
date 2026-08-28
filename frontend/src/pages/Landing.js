import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HeroSection } from '../components/ui/hero-section';
import { LeverSwitch } from '../components/ui/lever-switch';
import { LogIn } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(true);

  return (
    <div className="relative min-h-screen bg-[#1a1d18]">
      {/* Navbar overlay */}
      <nav className="absolute top-0 left-0 w-full z-50 flex justify-between items-center px-8 py-6">
        <div className="flex items-center gap-2 text-[#c8b4a0]">
          <span className="text-2xl">🚀</span>
          <span className="font-bold text-xl tracking-wider uppercase font-mono">Zest Eat</span>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-3">
             <span className="text-sm font-mono text-[#c8b4a0] uppercase tracking-wider">Dark Mode</span>
             <LeverSwitch checked={isDarkMode} onChange={setIsDarkMode} />
          </div>
          <button 
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 bg-[#c8b4a0] text-[#1a1d18] px-6 py-2.5 rounded-full font-bold hover:bg-[#a89080] transition-colors"
          >
            <LogIn size={18} /> Login
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <HeroSection />
    </div>
  );
}
