import React, { useEffect, useState } from 'react';

interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  size: string;
  animation: string;
}

interface ScreenEffect {
  id: number;
  type: 'shake' | 'flash-success' | 'flash-danger' | 'combo';
  intensity: number;
}

interface VisualFeedbackProps {
  children: React.ReactNode;
}

const VisualFeedback: React.FC<VisualFeedbackProps> = ({ children }) => {
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [screenEffects, setScreenEffects] = useState<ScreenEffect[]>([]);
  const [nextId, setNextId] = useState(0);
  const [comboCount, setComboCount] = useState(0);

  const showFloatingText = (
    x: number,
    y: number,
    text: string,
    color: string = 'text-cyan-400',
    size: string = 'text-lg',
    animation: string = 'float-up'
  ) => {
    const id = nextId;
    setNextId(prev => prev + 1);
    
    setFloatingTexts(prev => [...prev, { id, x, y, text, color, size, animation }]);
    
    setTimeout(() => {
      setFloatingTexts(prev => prev.filter(item => item.id !== id));
    }, 1500);
  };

  const triggerScreenShake = (intensity: number = 1) => {
    const id = nextId;
    setNextId(prev => prev + 1);
    
    setScreenEffects(prev => [...prev, { id, type: 'shake', intensity }]);
    
    setTimeout(() => {
      setScreenEffects(prev => prev.filter(item => item.id !== id));
    }, 500);
  };

  const triggerFlash = (type: 'success' | 'danger') => {
    const id = nextId;
    setNextId(prev => prev + 1);
    
    setScreenEffects(prev => [...prev, { id, type: type === 'success' ? 'flash-success' : 'flash-danger', intensity: 1 }]);
    
    setTimeout(() => {
      setScreenEffects(prev => prev.filter(item => item.id !== id));
    }, 500);
  };

  const showCombo = (count: number) => {
    setComboCount(count);
    const id = nextId;
    setNextId(prev => prev + 1);
    
    setScreenEffects(prev => [...prev, { id, type: 'combo', intensity: count }]);
    
    setTimeout(() => {
      setScreenEffects(prev => prev.filter(item => item.id !== id));
      setComboCount(0);
    }, 2000);
  };

  useEffect(() => {
    (window as any).showFloatingText = showFloatingText;
    (window as any).triggerScreenShake = triggerScreenShake;
    (window as any).triggerFlash = triggerFlash;
    (window as any).showCombo = showCombo;
    
    return () => {
      delete (window as any).showFloatingText;
      delete (window as any).triggerScreenShake;
      delete (window as any).triggerFlash;
      delete (window as any).showCombo;
    };
  }, [nextId]);

  const getShakeStyle = () => {
    const shakeEffects = screenEffects.filter(e => e.type === 'shake');
    if (shakeEffects.length === 0) return {};
    
    const intensity = shakeEffects[0].intensity;
    const offset = 5 * intensity;
    return {
      animation: `shake 0.5s ease-in-out`,
      transform: `translate(${Math.random() * offset - offset/2}px, ${Math.random() * offset - offset/2}px)`
    };
  };

  const getFlashClass = () => {
    const flashEffects = screenEffects.filter(e => e.type.startsWith('flash'));
    if (flashEffects.length === 0) return '';
    return flashEffects[0].type;
  };

  return (
    <div className={`relative ${getFlashClass()}`} style={getShakeStyle()}>
      {children}
      
      {/* Combo Display */}
      {comboCount > 1 && (
        <div className="fixed top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
          <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500 animate-pulse-glow">
            {comboCount}x COMBO!
          </div>
        </div>
      )}
      
      {/* Floating Text Container */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {floatingTexts.map(item => (
          <div
            key={item.id}
            className={`absolute font-bold ${item.color} ${item.size} ${item.animation}`}
            style={{
              left: `${item.x}px`,
              top: `${item.y}px`,
              textShadow: '0 0 10px currentColor, 0 0 20px currentColor'
            }}
          >
            {item.text}
          </div>
        ))}
      </div>
    </div>
  );
};

export default VisualFeedback;
