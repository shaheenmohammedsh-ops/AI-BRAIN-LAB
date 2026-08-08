import { useEffect, useRef, useCallback } from 'react';

interface AudioManagerProps {
  musicEnabled: boolean;
}

const AudioManager: React.FC<AudioManagerProps> = ({ musicEnabled }) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const musicContextRef = useRef<AudioContext | null>(null);
  const initializedRef = useRef(false);
  const musicInitializedRef = useRef(false);
  const musicGainRef = useRef<GainNode | null>(null);

  const initAudio = useCallback(async () => {
    // Resume if suspended
    if (audioContextRef.current) {
      if (audioContextRef.current.state === 'suspended') {
        try {
          await audioContextRef.current.resume();
        } catch (e) {
          console.warn('Failed to resume AudioContext:', e);
        }
      }
      return true;
    }

    // Create new AudioContext
    const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextCtor) {
      console.warn('Web Audio API not supported');
      return false;
    }

    try {
      const context = new AudioContextCtor();
      await context.resume();
      audioContextRef.current = context;
      initializedRef.current = true;
      return true;
    } catch (e) {
      console.warn('Failed to initialize AudioContext:', e);
      return false;
    }
  }, []);

  const initMusic = useCallback(async () => {
    if (musicContextRef.current) {
      if (musicContextRef.current.state === 'suspended') {
        try {
          await musicContextRef.current.resume();
        } catch (e) {
          console.warn('Failed to resume music AudioContext:', e);
        }
      }
      return true;
    }

    const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextCtor) {
      console.warn('Web Audio API not supported');
      return false;
    }

    try {
      const context = new AudioContextCtor();
      await context.resume();
      musicContextRef.current = context;
      musicInitializedRef.current = true;
      return true;
    } catch (e) {
      console.warn('Failed to initialize music AudioContext:', e);
      return false;
    }
  }, []);

  const playClickSound = useCallback(async () => {
    // Click sounds ALWAYS play
    const initialized = await initAudio();
    if (!initialized) return;

    const context = audioContextRef.current;
    if (!context || context.state === 'closed') return;

    try {
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      // Very short, clean click sound
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(1200, context.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(800, context.currentTime + 0.05);

      // Subtle envelope
      gainNode.gain.setValueAtTime(0, context.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.05, context.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.05);

      oscillator.start(context.currentTime);
      oscillator.stop(context.currentTime + 0.05);
    } catch (e) {
      console.warn('Failed to play click sound:', e);
    }
  }, [initAudio]);

  const playSound = useCallback(async (type: 'success' | 'warning' | 'error' | 'combo' | 'complete' | 'threat' | 'low-energy' | 'progress') => {
    const initialized = await initAudio();
    if (!initialized) return;

    const context = audioContextRef.current;
    if (!context || context.state === 'closed') return;

    try {
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      const sounds = {
        success: { frequency: 880, duration: 0.2, type: 'sine' as const },
        warning: { frequency: 440, duration: 0.3, type: 'sawtooth' as const },
        error: { frequency: 220, duration: 0.35, type: 'square' as const },
        combo: { frequency: 1047, duration: 0.15, type: 'sine' as const },
        complete: { frequency: 1175, duration: 0.5, type: 'triangle' as const },
        threat: { frequency: 330, duration: 0.35, type: 'sawtooth' as const },
        'low-energy': { frequency: 262, duration: 0.25, type: 'square' as const },
        progress: { frequency: 740, duration: 0.2, type: 'triangle' as const }
      };

      const sound = sounds[type] || sounds.success;
      oscillator.type = sound.type;
      oscillator.frequency.setValueAtTime(sound.frequency, context.currentTime);

      // Envelope for smoother sound
      gainNode.gain.setValueAtTime(0, context.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.15, context.currentTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + sound.duration);

      oscillator.start(context.currentTime);
      oscillator.stop(context.currentTime + sound.duration);
    } catch (e) {
      console.warn('Failed to play sound:', e);
    }
  }, [initAudio]);

  const startBackgroundMusic = useCallback(async () => {
    if (!musicEnabled) return;

    const initialized = await initMusic();
    if (!initialized) return;

    const context = musicContextRef.current;
    if (!context || context.state === 'closed') return;

    try {
      // Generate ambient drone using oscillators
      const oscillator1 = context.createOscillator();
      const oscillator2 = context.createOscillator();
      const gainNode = context.createGain();
      const filterNode = context.createBiquadFilter();

      oscillator1.type = 'sine';
      oscillator1.frequency.setValueAtTime(55, context.currentTime); // Low A
      oscillator2.type = 'sine';
      oscillator2.frequency.setValueAtTime(82.5, context.currentTime); // E above low A

      filterNode.type = 'lowpass';
      filterNode.frequency.setValueAtTime(200, context.currentTime);
      filterNode.Q.setValueAtTime(1, context.currentTime);

      oscillator1.connect(filterNode);
      oscillator2.connect(filterNode);
      filterNode.connect(gainNode);
      gainNode.connect(context.destination);

      gainNode.gain.setValueAtTime(0, context.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.03, context.currentTime + 2); // Very gradual fade in

      oscillator1.start(context.currentTime);
      oscillator2.start(context.currentTime);

      musicGainRef.current = gainNode;
    } catch (e) {
      console.warn('Failed to start background music:', e);
    }
  }, [musicEnabled, initMusic]);

  const stopBackgroundMusic = useCallback(() => {
    if (musicGainRef.current) {
      const context = musicContextRef.current;
      if (context) {
        musicGainRef.current.gain.linearRampToValueAtTime(0, context.currentTime + 1);
        setTimeout(() => {
          if (musicContextRef.current) {
            musicContextRef.current.close().catch(() => undefined);
            musicContextRef.current = null;
          }
          musicGainRef.current = null;
        }, 1000);
      }
    }
  }, []);

  // Initialize on first user interaction
  useEffect(() => {
    const handleUserInteraction = async () => {
      if (!initializedRef.current) {
        await initAudio();
      }
    };

    const events = ['click', 'keydown', 'touchstart', 'mousedown'];
    events.forEach(event => {
      window.addEventListener(event, handleUserInteraction, { once: true, passive: true });
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleUserInteraction);
      });
    };
  }, [initAudio]);

  // Handle background music
  useEffect(() => {
    if (musicEnabled) {
      startBackgroundMusic();
    } else {
      stopBackgroundMusic();
    }
  }, [musicEnabled, startBackgroundMusic, stopBackgroundMusic]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => undefined);
      }
      if (musicContextRef.current) {
        musicContextRef.current.close().catch(() => undefined);
      }
    };
  }, []);

  // Expose functions globally
  useEffect(() => {
    (window as any).playSound = playSound;
    (window as any).playClickSound = playClickSound;
    (window as any).initAudio = initAudio;
    return () => {
      delete (window as any).playSound;
      delete (window as any).playClickSound;
      delete (window as any).initAudio;
    };
  }, [playSound, playClickSound, initAudio]);

  return null;
};

export default AudioManager;
