import React, { useEffect, useRef } from "react";
import OptionWheel from "./OptionWheel";
import { Facebook, Instagram, Twitter, MessageCircle, Mail } from "lucide-react";
 
const colors = {
  50: "#f8f7f5",
  100: "#e6e1d7",
  200: "#c8b4a0",
  300: "#a89080",
  400: "#8a7060",
  500: "#6b5545",
  600: "#544237",
  700: "#3c4237",
  800: "#2a2e26",
  900: "#1a1d18",
};
 
export function HeroSection({ isDarkMode = true }) {
  const gradientRef = useRef(null);
 
  useEffect(() => {
    // Animate words
    const words = document.querySelectorAll(".word");
    words.forEach((word) => {
      const delay = parseInt(word.getAttribute("data-delay") || "0", 10);
      setTimeout(() => {
        word.style.animation = "word-appear 0.8s ease-out forwards";
      }, delay);
    });
 
    // Mouse gradient
    const gradient = gradientRef.current;
    function onMouseMove(e) {
      if (gradient) {
        gradient.style.left = e.clientX - 192 + "px";
        gradient.style.top = e.clientY - 192 + "px";
        gradient.style.opacity = "1";
      }
    }
    function onMouseLeave() {
      if (gradient) gradient.style.opacity = "0";
    }
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseleave", onMouseLeave);
 
    // Word hover effects
    words.forEach((word) => {
      word.addEventListener("mouseenter", () => {
        word.style.textShadow = "0 0 20px rgba(200, 180, 160, 0.5)";
      });
      word.addEventListener("mouseleave", () => {
        word.style.textShadow = "none";
      });
    });
 
    // Click ripple effect
    function onClick(e) {
      const ripple = document.createElement("div");
      ripple.style.position = "fixed";
      ripple.style.left = e.clientX + "px";
      ripple.style.top = e.clientY + "px";
      ripple.style.width = "4px";
      ripple.style.height = "4px";
      ripple.style.background = "rgba(200, 180, 160, 0.6)";
      ripple.style.borderRadius = "50%";
      ripple.style.transform = "translate(-50%, -50%)";
      ripple.style.pointerEvents = "none";
      ripple.style.animation = "pulse-glow 1s ease-out forwards";
      document.body.appendChild(ripple);
      setTimeout(() => ripple.remove(), 1000);
    }
    document.addEventListener("click", onClick);
 
    // Floating elements on scroll
    let scrolled = false;
    function onScroll() {
      if (!scrolled) {
        scrolled = true;
        document.querySelectorAll(".floating-element").forEach((el, index) => {
          setTimeout(() => {
            el.style.animationPlayState = "running";
          }, index * 200);
        });
      }
    }
    window.addEventListener("scroll", onScroll);
 
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("click", onClick);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);
 
  return (
    <div
      className={`min-h-screen ${isDarkMode ? 'bg-black text-[#e6e1d7]' : 'bg-white text-[#1a1d18]'} overflow-hidden relative w-full`}
    >
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path
              d="M 60 0 L 0 0 0 60"
              fill="none"
              stroke={isDarkMode ? "rgba(200,180,160,0.08)" : "rgba(26,29,24,0.08)"}
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        <line x1="0" y1="20%" x2="100%" y2="20%" className="grid-line" style={{ animationDelay: "0.5s" }} />
        <line x1="0" y1="80%" x2="100%" y2="80%" className="grid-line" style={{ animationDelay: "1s" }} />
        <line x1="20%" y1="0" x2="20%" y2="100%" className="grid-line" style={{ animationDelay: "1.5s" }} />
        <line x1="80%" y1="0" x2="80%" y2="100%" className="grid-line" style={{ animationDelay: "2s" }} />
        <line
          x1="50%"
          y1="0"
          x2="50%"
          y2="100%"
          className="grid-line"
          style={{ animationDelay: "2.5s", opacity: 0.05 }}
        />
        <line
          x1="0"
          y1="50%"
          x2="100%"
          y2="50%"
          className="grid-line"
          style={{ animationDelay: "3s", opacity: 0.05 }}
        />
        <circle cx="20%" cy="20%" r="2" className="detail-dot" style={{ animationDelay: "3s" }} />
        <circle cx="80%" cy="20%" r="2" className="detail-dot" style={{ animationDelay: "3.2s" }} />
        <circle cx="20%" cy="80%" r="2" className="detail-dot" style={{ animationDelay: "3.4s" }} />
        <circle cx="80%" cy="80%" r="2" className="detail-dot" style={{ animationDelay: "3.6s" }} />
        <circle cx="50%" cy="50%" r="1.5" className="detail-dot" style={{ animationDelay: "4s" }} />
      </svg>
 
      {/* Corner elements */}
      <div className="corner-element top-8 left-8" style={{ animationDelay: "4s" }}>
        <div
          className="absolute top-0 left-0 w-2 h-2 opacity-30"
          style={{ background: colors[200] }}
        ></div>
      </div>
      <div className="corner-element top-8 right-8" style={{ animationDelay: "4.2s" }}>
        <div
          className="absolute top-0 right-0 w-2 h-2 opacity-30"
          style={{ background: colors[200] }}
        ></div>
      </div>
      <div className="corner-element bottom-8 left-8" style={{ animationDelay: "4.4s" }}>
        <div
          className="absolute bottom-0 left-0 w-2 h-2 opacity-30"
          style={{ background: colors[200] }}
        ></div>
      </div>
      <div className="corner-element bottom-8 right-8" style={{ animationDelay: "4.6s" }}>
        <div
          className="absolute bottom-0 right-0 w-2 h-2 opacity-30"
          style={{ background: colors[200] }}
        ></div>
      </div>
 
      {/* Floating elements */}
      <div className="floating-element" style={{ top: "25%", left: "15%", animationDelay: "5s" }}></div>
      <div className="floating-element" style={{ top: "60%", left: "85%", animationDelay: "5.5s" }}></div>
      <div className="floating-element" style={{ top: "40%", left: "10%", animationDelay: "6s" }}></div>
      <div className="floating-element" style={{ top: "75%", left: "90%", animationDelay: "6.5s" }}></div>
 
      {/* OptionWheel on the left */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 h-[500px] w-64 z-20 hidden md:block" style={{ animation: "slideIn 1s ease-out forwards", animationDelay: "2s", opacity: 0 }}>
        <OptionWheel
          items={['WhatsApp', 'Facebook', 'Instagram', 'SMS', 'Email', 'Push']}
          defaultSelected={0}
          textColor={isDarkMode ? "#544237" : "#c8b4a0"}
          activeColor={isDarkMode ? "#c8b4a0" : "#6b5545"}
          side="left"
          fontSize={2}
          spacing={1.8}
          inset={40}
        />
      </div>

      {/* Social Icons on the right */}
      <div className="absolute top-1/2 right-8 -translate-y-1/2 flex flex-col gap-6 z-20 hidden md:flex" style={{ animation: "fadeIn 1s ease-out forwards", animationDelay: "2.5s", opacity: 0 }}>
        <a href="#" className={`hover:scale-110 transition-transform ${isDarkMode ? 'text-[#c8b4a0] hover:text-[#fff]' : 'text-[#6b5545] hover:text-[#000]'}`}><MessageCircle size={24} /></a>
        <a href="#" className={`hover:scale-110 transition-transform ${isDarkMode ? 'text-[#c8b4a0] hover:text-[#fff]' : 'text-[#6b5545] hover:text-[#000]'}`}><Facebook size={24} /></a>
        <a href="#" className={`hover:scale-110 transition-transform ${isDarkMode ? 'text-[#c8b4a0] hover:text-[#fff]' : 'text-[#6b5545] hover:text-[#000]'}`}><Instagram size={24} /></a>
        <a href="#" className={`hover:scale-110 transition-transform ${isDarkMode ? 'text-[#c8b4a0] hover:text-[#fff]' : 'text-[#6b5545] hover:text-[#000]'}`}><Twitter size={24} /></a>
        <a href="#" className={`hover:scale-110 transition-transform ${isDarkMode ? 'text-[#c8b4a0] hover:text-[#fff]' : 'text-[#6b5545] hover:text-[#000]'}`}><Mail size={24} /></a>
      </div>

      <div className="relative z-10 min-h-[90vh] flex flex-col justify-center items-center px-8 py-12 md:px-16 md:py-20 mt-16">
        {/* Top tagline */}
        <div className="text-center">
          <h2
            className="text-xs md:text-sm font-mono font-light uppercase tracking-[0.2em] opacity-80 flex flex-wrap justify-center gap-1.5"
            style={{ color: isDarkMode ? colors[200] : colors[600] }}
          >
            <span className="word" data-delay="0">Welcome</span>
            <span className="word" data-delay="200">to</span>
            <span className="word" data-delay="400"><b>Zest Eat</b></span>
            <span className="word" data-delay="600">—</span>
            <span className="word" data-delay="800">Powering</span>
            <span className="word" data-delay="1000">your</span>
            <span className="word" data-delay="1200">WhatsApp</span>
            <span className="word" data-delay="1400">campaigns.</span>
          </h2>
          <div
            className="mt-4 w-16 h-px opacity-30 mx-auto"
            style={{
              background: `linear-gradient(to right, transparent, ${colors[200]}, transparent)`,
            }}
          ></div>
        </div>
 
        {/* Main headline */}
        <div className="text-center max-w-5xl mx-auto mt-12 mb-12">
          <h1
            className="text-4xl md:text-6xl lg:text-7xl font-extralight leading-tight tracking-tight"
            style={{ color: isDarkMode ? colors[50] : colors[900] }}
          >
            <div className="mb-4 md:mb-6 flex flex-wrap justify-center gap-x-2 gap-y-1">
              <span className="word" data-delay="1600">Supercharge</span>
              <span className="word" data-delay="1750">your</span>
              <span className="word" data-delay="1900">marketing</span>
              <span className="word" data-delay="2050">with</span>
              <span className="word" data-delay="2200">seamless</span>
              <span className="word" data-delay="2350">automation.</span>
            </div>
            <div
              className="text-base md:text-xl lg:text-2xl font-thin leading-relaxed flex flex-wrap justify-center gap-x-2 gap-y-1 mt-4"
              style={{ color: isDarkMode ? colors[200] : colors[600] }}
            >
              <span className="word" data-delay="2600">Send,</span>
              <span className="word" data-delay="2750">track,</span>
              <span className="word" data-delay="2900">and</span>
              <span className="word" data-delay="3050">scale</span>
              <span className="word" data-delay="3200">your</span>
              <span className="word" data-delay="3350">campaigns</span>
              <span className="word" data-delay="3500">— all</span>
              <span className="word" data-delay="3650">in</span>
              <span className="word" data-delay="3800">one</span>
              <span className="word" data-delay="3950">secure</span>
              <span className="word" data-delay="4100">dashboard.</span>
            </div>
          </h1>
          <div
            className="absolute -left-8 top-1/2 w-4 h-px opacity-20"
            style={{
              background: colors[200],
              animation: "word-appear 1s ease-out forwards",
              animationDelay: "3.5s",
            }}
          ></div>
          <div
            className="absolute -right-8 top-1/2 w-4 h-px opacity-20"
            style={{
              background: colors[200],
              animation: "word-appear 1s ease-out forwards",
              animationDelay: "3.7s",
            }}
          ></div>
        </div>
 
        {/* Bottom tagline */}
        <div className="text-center mt-8">
          <div
            className="mb-4 w-16 h-px opacity-30 mx-auto"
            style={{
              background: `linear-gradient(to right, transparent, ${colors[200]}, transparent)`,
            }}
          ></div>
          <h2
            className="text-xs md:text-sm font-mono font-light uppercase tracking-[0.2em] opacity-80 flex flex-wrap justify-center gap-1.5"
            style={{ color: isDarkMode ? colors[200] : colors[600] }}
          >
            <span className="word" data-delay="4400">Real-time</span>
            <span className="word" data-delay="4550">analytics,</span>
            <span className="word" data-delay="4700">seamless</span>
            <span className="word" data-delay="4850">integrations,</span>
            <span className="word" data-delay="5000">Meta</span>
            <span className="word" data-delay="5150">approved.</span>
          </h2>
          <div
            className="mt-6 flex justify-center space-x-4 opacity-0"
            style={{
              animation: "word-appear 1s ease-out forwards",
              animationDelay: "4.5s",
            }}
          >
            <div
              className="w-1 h-1 rounded-full opacity-40"
              style={{ background: colors[200] }}
            ></div>
            <div
              className="w-1 h-1 rounded-full opacity-60"
              style={{ background: colors[200] }}
            ></div>
            <div
              className="w-1 h-1 rounded-full opacity-40"
              style={{ background: colors[200] }}
            ></div>
          </div>
        </div>
      </div>
 
      <div
        id="mouse-gradient"
        ref={gradientRef}
        className="fixed pointer-events-none w-96 h-96 rounded-full blur-3xl transition-all duration-500 ease-out opacity-0 z-0"
        style={{
          background: `radial-gradient(circle, ${colors[500]}1A 0%, transparent 100%)`,
        }}
      ></div>
    </div>
  );
}
