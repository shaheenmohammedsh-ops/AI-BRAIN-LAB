import { useState, useEffect, useRef } from 'react';
import { CHALLENGES } from './config/missions';
import LandingScreen from './pages/LandingScreen';
import MissionBriefing from './components/MissionBriefing';
import TutorialPopup from './components/TutorialPopup';
import GameActions from './components/GameActions';
import ProblemBoard from './components/ProblemBoard';
import ResultsScreen from './pages/ResultsScreen';
import AudioManager from './components/AudioManager';
import VisualFeedback from './components/VisualFeedback';
import EducationalInsight from './components/EducationalInsight';
import NeuralNetwork from './components/NeuralNetwork';
import { api } from './services/api';
import type { SimulationState } from './types';

function App() {
  const [screen, setScreen] = useState<'landing' | 'briefing' | 'simulation' | 'results'>('landing');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentChallengeIndex, setCurrentChallengeIndex] = useState(0);
  const [simulationState, setSimulationState] = useState<SimulationState | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [endingMessage, setEndingMessage] = useState<{ title: string; subtitle: string } | null>(null);
  const [educationalInsight, setEducationalInsight] = useState<{ event: string | null; action: string; show: boolean }>({ event: null, action: '', show: false });
  const finishingRef = useRef(false);

  const currentChallenge = CHALLENGES[currentChallengeIndex];

  const handleStart = async () => {
    const playClickSound = (window as any).playClickSound;
    if (playClickSound) playClickSound();
    setCurrentChallengeIndex(0);
    setScreen('briefing');
  };

  const handleMissionBriefingComplete = async () => {
    const challengeType = currentChallenge.difficulty;
    const challengeOrder = currentChallengeIndex + 1;
    const response = await api.startSession(undefined, challengeType, challengeOrder);
    setSessionId(response.session_id);
    setSimulationState(response.state);
    setShowTutorial(true);
    setScreen('simulation');
  };

  const handleTutorialComplete = () => {
    setShowTutorial(false);
  };

  const handleSelectProblem = async (problemId: string) => {
    if (!sessionId || simulationState?.game_status !== 'playing') return;
    
    const playClickSound = (window as any).playClickSound;
    if (playClickSound) playClickSound();
    
    try {
      const response = await api.selectProblem(sessionId, problemId);
      setSimulationState(response.state);
    } catch (error) {
      console.error('Failed to select problem:', error);
    }
  };

  const handleGameAction = async (actionType: string) => {
    if (!sessionId || finishingRef.current) return;

    const response = await api.applyGameAction(sessionId, actionType);
    setSimulationState(response.state);

    // Show visual feedback
    const showFeedback = (window as any).showFloatingText;
    const playSound = (window as any).playSound;
    const showCombo = (window as any).showCombo;
    if (showFeedback) {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      
      const actionEffects: Record<string, { text: string; color: string; sound: string }> = {
        clean_dataset: { text: 'Data Cleaned!', color: 'text-green-400', sound: 'success' },
        normalize_data: { text: 'Normalized!', color: 'text-blue-400', sound: 'success' },
        feature_selection: { text: 'Features Selected!', color: 'text-purple-400', sound: 'success' },
        collect_more_data: { text: 'Data Collected!', color: 'text-cyan-400', sound: 'success' },
        remove_noise: { text: 'Noise Removed!', color: 'text-yellow-400', sound: 'success' },
        balance_dataset: { text: 'Balanced!', color: 'text-pink-400', sound: 'success' },
        tune_hyperparameters: { text: 'Tuned!', color: 'text-orange-400', sound: 'success' },
        validate_model: { text: 'Validated!', color: 'text-emerald-400', sound: 'success' }
      };
      
      const effect = actionEffects[actionType];
      if (effect) {
        showFeedback(centerX, centerY, effect.text, effect.color, 'text-xl');
        if (playSound) playSound(effect.sound as any);
      }
    }

    // Show combo if increased
    if (response.state.combo > (simulationState?.combo || 0) && response.state.combo > 1) {
      if (showCombo) showCombo(response.state.combo);
    }

    // Show educational insight if event was solved
    if (response.state.current_event !== simulationState?.current_event && simulationState?.current_event) {
      setEducationalInsight({
        event: simulationState.current_event,
        action: actionType,
        show: true
      });
      if (playSound) playSound('combo');
    }

    // Check game end conditions - use backend's end_reason for priority
    if (response.state.game_status !== 'playing') {
      await handleFinishSession(response.state.end_reason || undefined);
    }
  };

  const handleFinishSession = async (result?: string) => {
    if (!sessionId) return;
    if (finishingRef.current) return; // already finishing
    finishingRef.current = true;

    // CRITICAL: Pass result to backend and let backend determine the authoritative outcome
    // Don't infer success from game_status alone - use actual end_reason from simulation
    const endReason = result || simulationState?.end_reason;

    let title = 'SESSION ENDED';
    let subtitle = 'The session has finished.';

    if (endReason === 'target_reached') {
      title = '✓ TARGET REACHED';
      subtitle = 'AI efficiency target achieved.';
    } else if (endReason === 'time_expired') {
      title = 'TIME EXPIRED';
      subtitle = 'The model did not reach the required efficiency before time ran out.';
    } else if (endReason === 'energy_depleted') {
      title = 'SYSTEM ENERGY DEPLETED';
      subtitle = 'The available AI resources were exhausted before reaching the target.';
    }

    setEndingMessage({ title, subtitle });

    // Short professional transition before moving to results
    await new Promise((res) => setTimeout(res, 1200));

    try {
      const challengeType = currentChallenge.difficulty;
      const challengeOrder = currentChallengeIndex + 1;
      await api.finishSession(sessionId, { result: endReason }, challengeType, challengeOrder);
    } catch (e) {
      console.error('Failed to finish session:', e);
    } finally {
      setEndingMessage(null);
      setScreen('results');
    }
  };

  const handleRestart = () => {
    setSessionId(null);
    setSimulationState(null);
    setShowTutorial(true);
    setCurrentChallengeIndex(0);
    setScreen('landing');
  };

  // Game loop timer - starts only when tutorial is closed and simulation is playing
  useEffect(() => {
    let interval: number;
    
    if (screen === 'simulation' && !showTutorial && simulationState && simulationState.game_status === 'playing' && !finishingRef.current) {
      interval = setInterval(async () => {
        if (!sessionId || finishingRef.current) return;
        const response = await api.advanceTime(sessionId, 1);
        setSimulationState(response.state);
        
        // Check game end conditions - use backend's end_reason for priority
        if (response.state.game_status !== 'playing') {
          await handleFinishSession(response.state.end_reason || undefined);
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [screen, simulationState, sessionId, showTutorial]);

  if (screen === 'landing') {
    return <LandingScreen onStart={handleStart} />;
  }

  if (screen === 'briefing') {
    return <MissionBriefing missionId={currentChallenge.id} onStart={handleMissionBriefingComplete} />;
  }

  if (screen === 'results' && sessionId) {
    return <ResultsScreen sessionId={sessionId} onRestart={handleRestart} />;
  }

  if (screen === 'simulation' && simulationState) {
    return (
      <VisualFeedback>
        <AudioManager musicEnabled={musicEnabled} />
        {endingMessage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-8 text-center text-white max-w-lg">
              <h2 className="text-2xl font-bold mb-2">{endingMessage.title}</h2>
              <p className="text-gray-300">{endingMessage.subtitle}</p>
            </div>
          </div>
        )}
        {showTutorial && <TutorialPopup onClose={handleTutorialComplete} />}
        <div className="h-screen bg-[#0a0e1a] flex flex-col overflow-hidden">
          {/* Compact HUD */}
          <header className="flex items-center justify-between px-4 py-2 border-b border-gray-800/50 bg-[#0a0e1a]/95 backdrop-blur-sm shrink-0">
            <div className="flex items-center gap-4">
              <h1 className="text-sm font-semibold text-white tracking-tight">AI Brain Lab</h1>
              <div className="text-xs text-gray-400">
                {currentChallenge.title}
              </div>
            </div>
            
            {/* Key Metrics - Priority Hierarchy */}
            <div className="flex items-center gap-6">
              {/* Accuracy - Highest Priority with progress */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider">Accuracy</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-white">{(simulationState.accuracy * 100).toFixed(0)}%</span>
                  <div className="w-20 h-1.5 rounded-full bg-gray-700 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        simulationState.accuracy >= 0.9 ? 'bg-[#10b981]' : 
                        simulationState.accuracy >= 0.7 ? 'bg-[#0ea5e9]' : 'bg-[#f59e0b]'
                      }`}
                      style={{ width: `${(simulationState.accuracy / 0.9) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Energy with progress */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider">Energy</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 rounded-full bg-gray-700 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        simulationState.neural_energy <= 20 ? 'bg-[#ef4444]' : 
                        simulationState.neural_energy <= 40 ? 'bg-[#f59e0b]' : 'bg-[#10b981]'
                      }`}
                      style={{ width: `${simulationState.neural_energy}%` }}
                    />
                  </div>
                  <span className={`text-sm font-medium ${
                    simulationState.neural_energy <= 20 ? 'text-[#ef4444]' : 
                    simulationState.neural_energy <= 40 ? 'text-[#f59e0b]' : 'text-white'
                  }`}>
                    {simulationState.neural_energy.toFixed(0)}
                  </span>
                </div>
              </div>

              {/* Timer */}
              <div className={`flex items-center gap-2 px-3 py-1 rounded border ${
                simulationState.time_remaining < 30 
                  ? 'border-[#ef4444]/30 bg-[#ef4444]/10' 
                  : 'border-gray-700/50 bg-gray-800/50'
              }`}>
                <span className="text-[10px] text-gray-400 uppercase tracking-wider">Time</span>
                <span className={`text-sm font-mono font-medium ${
                  simulationState.time_remaining < 30 ? 'text-[#ef4444]' : 'text-white'
                }`}>
                  {Math.floor(simulationState.time_remaining / 60)}:{(simulationState.time_remaining % 60).toString().padStart(2, '0')}
                </span>
              </div>

              {/* Music Toggle */}
              <button
                onClick={() => setMusicEnabled(!musicEnabled)}
                className="p-1.5 text-gray-400 hover:text-white transition-colors"
                title={musicEnabled ? 'Mute Music' : 'Enable Music'}
              >
                🎵
              </button>

              {/* End Button */}
              <button
                onClick={() => handleFinishSession('manual')}
                className="px-2 py-1 text-[10px] text-gray-400 hover:text-white border border-gray-700/50 hover:border-gray-600 rounded transition-colors"
              >
                End
              </button>
            </div>
          </header>

          {/* Main Gameplay Area - CSS Grid Layout */}
          <main className="flex-1 grid grid-cols-12 gap-0 overflow-hidden">
            {/* Neural Network - Left Panel (55%) */}
            <section className="col-span-7 p-4 overflow-hidden flex flex-col">
              <NeuralNetwork
                state={simulationState}
                onAction={handleGameAction}
              />
            </section>

            {/* Right Panel - Problems + Actions (45%) */}
            <aside className="col-span-5 border-l border-gray-800 flex flex-col overflow-hidden">
              {/* Problem Board - Compact Grid */}
              <div className="p-3 border-b border-gray-800 shrink-0">
                <ProblemBoard 
                  activeEvents={simulationState.active_events || []}
                  problemStates={simulationState.problem_states || {}}
                  onSelectProblem={handleSelectProblem}
                  disabled={simulationState.game_status !== 'playing'}
                />
              </div>

              {/* Selected Problem Info */}
              {simulationState.current_event && (
                <div className="p-3 border-b border-gray-800 bg-gray-800/30 shrink-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-[#0ea5e9]" />
                    <span className="text-xs font-medium text-white">{simulationState.current_event}</span>
                  </div>
                  <p className="text-[10px] text-gray-400">
                    Select an action to address this problem
                  </p>
                </div>
              )}

              {/* Available Actions - Compact Grid */}
              <div className="flex-1 p-3 overflow-y-auto">
                <GameActions state={simulationState} onAction={handleGameAction} />
              </div>
            </aside>
          </main>

          <EducationalInsight
            event={educationalInsight.event}
            action={educationalInsight.action}
            show={educationalInsight.show}
            onClose={() => setEducationalInsight({ event: null, action: '', show: false })}
          />
        </div>
      </VisualFeedback>
    );
  }

  return <LandingScreen onStart={handleStart} />;
}

export default App;
