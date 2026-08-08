import React from 'react';
import type { SimulationState } from '../types';

interface AIDashboardProps {
  state: SimulationState;
  currentMission?: string;
  missionStage?: string;
}

const AIDashboard: React.FC<AIDashboardProps> = ({ state, currentMission, missionStage }) => {
  const metrics = [
    { name: 'Accuracy', value: state.accuracy, format: 'percent', color: 'cyan', icon: '🎯' },
    { name: 'Brain Health', value: state.brain_health, format: 'percent100', color: 'purple', icon: '🧠' },
    { name: 'Neural Energy', value: state.neural_energy, format: 'energy', color: 'blue', icon: '⚡' }
  ];

  const formatValue = (metric: any) => {
    if (metric.format === 'percent') {
      return `${(metric.value * 100).toFixed(1)}%`;
    }
    if (metric.format === 'percent100') {
      return `${metric.value.toFixed(0)}%`;
    }
    if (metric.format === 'energy') {
      return `${metric.value.toFixed(0)}`;
    }
    return metric.value.toFixed(3);
  };

  const getColorClass = (metric: any) => {
    const colors: Record<string, string> = {
      cyan: 'from-cyan-500 to-cyan-600',
      purple: 'from-purple-500 to-purple-600',
      blue: 'from-blue-500 to-blue-600'
    };
    return colors[metric.color] || colors.cyan;
  };

  const getTextColorClass = (metric: any) => {
    const colors: Record<string, string> = {
      cyan: 'text-cyan-400',
      purple: 'text-purple-400',
      blue: 'text-blue-400'
    };
    return colors[metric.color] || colors.cyan;
  };

  const getBgColorClass = (metric: any) => {
    const colors: Record<string, string> = {
      cyan: 'bg-cyan-500/10',
      purple: 'bg-purple-500/10',
      blue: 'bg-blue-500/10'
    };
    return colors[metric.color] || colors.cyan;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getHealthStatus = (health: number) => {
    if (health > 70) return { status: 'Strong', color: 'text-green-400' };
    if (health > 40) return { status: 'Okay', color: 'text-yellow-400' };
    return { status: 'Low', color: 'text-red-400' };
  };

  const healthStatus = getHealthStatus(state.brain_health);

  return (
    <div className="glass-strong rounded-2xl p-6 shadow-glow">
      <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-start mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center shadow-glow">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-cyan-300">Neural Hub</h2>
            <div className="text-sm text-gray-400">
              {currentMission || 'Adventure'}
              {missionStage && <span className="text-cyan-400 ml-2">• {missionStage}</span>}
            </div>
          </div>
        </div>

        <div className={`rounded-xl border text-center ${state.time_remaining < 30 ? 'border-red-500/50 bg-red-500/10 text-red-400' : 'border-slate-700 bg-slate-900/50 text-cyan-400'}`}>
          <div className="text-xs text-gray-400 mb-1">Time</div>
          <div className="text-lg font-bold">{formatTime(state.time_remaining)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
        {metrics.map((metric, index) => (
          <div
            key={index}
            className={`${getBgColorClass(metric)} border border-slate-700/50 rounded-2xl p-5 transition-all duration-300`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-gray-400 font-semibold">{metric.name}</div>
              <div className="text-xl">{metric.icon}</div>
            </div>
            <div className={`text-3xl font-bold ${getTextColorClass(metric)}`}>{formatValue(metric)}</div>
            <div className="mt-4 h-2 bg-slate-700/50 rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${getColorClass(metric)} transition-all duration-500`}
                style={{ width: `${metric.format === 'percent100' ? Math.min(100, metric.value) : Math.min(100, metric.value * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="bg-slate-900/50 rounded-2xl p-5 border border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm text-gray-400 uppercase tracking-[0.2em]">Brain Health</div>
              <div className="mt-2 text-lg font-semibold text-white">{state.brain_health.toFixed(0)}%</div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${healthStatus.color}`}>{healthStatus.status}</span>
          </div>
          <div className="text-sm text-gray-400">A healthy system keeps your actions effective and your next move ready.</div>
        </div>

        <div className="bg-slate-900/50 rounded-2xl p-5 border border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm text-gray-400 uppercase tracking-[0.2em]">Current Event</div>
              <div className="mt-2 text-lg font-semibold text-white">{state.current_event || 'No active issue'}</div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${state.current_event ? 'bg-blue-500/20 text-blue-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
              {state.current_event ? 'Active' : 'Calm'}
            </span>
          </div>
          <div className="text-sm text-gray-400">Focus on the core metrics to resolve the challenge before the timer runs low.</div>
        </div>
      </div>
    </div>
  );
};

export default AIDashboard;
