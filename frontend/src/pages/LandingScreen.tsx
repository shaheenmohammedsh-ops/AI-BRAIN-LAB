import { useState, useEffect } from 'react';
import LandingNeuralVisualization from '../components/LandingNeuralVisualization';

interface LandingScreenProps {
  onStart: () => void;
}

function LandingScreen({ onStart }: LandingScreenProps) {
  const [showTransition, setShowTransition] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [buttonHovered, setButtonHovered] = useState(false);

  useEffect(() => {
    // Trigger entry animations after component mounts
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleStart = () => {
    const playClickSound = (window as any).playClickSound;
    if (playClickSound) playClickSound();
    setShowTransition(true);
    
    // Transition to game after brief delay
    setTimeout(() => onStart(), 1200);
  };

  if (showTransition) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0e1a]">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-6 relative">
            <div className="absolute inset-0 border-2 border-[#0ea5e9]/30 rounded-full animate-[spin_1s_linear_infinite]" />
            <div className="absolute inset-2 border-2 border-[#0ea5e9]/50 rounded-full animate-[spin_1.5s_linear_infinite_reverse]" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 bg-[#0ea5e9] rounded-full animate-pulse" />
            </div>
          </div>
          <p className="text-lg text-[#0ea5e9] font-medium">Initializing Challenge</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0e1a] relative overflow-hidden">
      {/* Sophisticated layered background */}
      <div className="absolute inset-0">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0e1a] via-[#0f141f] to-[#0a0e1a]" />
        
        {/* Subtle radial light */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#0ea5e9]/5 rounded-full blur-[120px]" />
        </div>
        
        {/* Extremely faint grid */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div style={{
            backgroundImage: `
              linear-gradient(rgba(14, 165, 233, 0.4) 1px, transparent 1px),
              linear-gradient(90deg, rgba(14, 165, 233, 0.4) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px'
          }} />
        </div>
        
        {/* Ambient particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-[#0ea5e9]/20 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float ${8 + Math.random() * 4}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 4}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Main content container */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side: Brand and content */}
          <div className="order-2 lg:order-1 text-center lg:text-left">
            {/* Brand */}
            <div 
              className={`transition-all duration-700 ease-out ${
                isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              <h1 className="text-5xl lg:text-6xl font-semibold text-white mb-4 tracking-tight">
                AI BRAIN LAB
              </h1>
              <p className="text-xl lg:text-2xl text-gray-300 mb-8 leading-relaxed max-w-lg">
                Improve an AI model by making the right decisions before your resources run out.
              </p>
            </div>

            {/* Game information */}
            <div 
              className={`flex flex-wrap gap-6 justify-center lg:justify-start mb-10 transition-all duration-700 ease-out ${
                isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: '150ms' }}
            >
              <div className="flex items-center gap-2 text-gray-400">
                <div className="w-2 h-2 bg-[#0ea5e9] rounded-full" />
                <span className="text-sm">Challenges</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <div className="w-2 h-2 bg-[#7c3aed] rounded-full" />
                <span className="text-sm">3 Minutes</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <div className="w-2 h-2 bg-[#10b981] rounded-full" />
                <span className="text-sm">Limited Energy</span>
              </div>
            </div>

            {/* Start button */}
            <div 
              className={`transition-all duration-700 ease-out ${
                isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: '300ms' }}
            >
              <button
                onClick={handleStart}
                onMouseEnter={() => setButtonHovered(true)}
                onMouseLeave={() => setButtonHovered(false)}
                className="group relative px-10 py-4 bg-gradient-to-r from-[#0ea5e9] to-[#3b82f6] text-white font-medium rounded-lg transition-all duration-300 hover:shadow-[0_0_30px_rgba(14,165,233,0.4)] hover:scale-105 active:scale-95"
                style={{
                  boxShadow: buttonHovered ? '0 0 30px rgba(14,165,233,0.4)' : '0 4px 20px rgba(14,165,233,0.2)'
                }}
              >
                <span className="relative z-10 text-lg">Start Challenge</span>
                {/* Subtle glow effect */}
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#0ea5e9] to-[#3b82f6] opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-lg" />
              </button>
            </div>

            {/* Footer text */}
            <div 
              className={`mt-8 text-sm text-gray-500 transition-all duration-700 ease-out ${
                isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: '450ms' }}
            >
              Neural Network Training Simulation
            </div>
          </div>

          {/* Right side: Interactive AI visualization */}
          <div 
            className={`order-1 lg:order-2 transition-all duration-1000 ease-out ${
              isLoaded ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
            }`}
            style={{ transitionDelay: '200ms' }}
          >
            <div className="relative">
              {/* Visualization container with subtle border */}
              <div className="relative p-8 rounded-2xl bg-[#111827]/50 border border-[#0ea5e9]/10 backdrop-blur-sm">
                <LandingNeuralVisualization />
                
                {/* Subtle corner accents */}
                <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-[#0ea5e9]/30 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-[#0ea5e9]/30 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 border-[#0ea5e9]/30 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-[#0ea5e9]/30 rounded-br-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom animation for floating particles */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0.2;
          }
          50% {
            transform: translateY(-20px) translateX(10px);
            opacity: 0.4;
          }
        }
      `}</style>
    </div>
  );
};

export default LandingScreen;
