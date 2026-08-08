import { useState, useEffect } from 'react';
import { api } from '../services/api';

interface ResultsScreenProps {
  sessionId: string;
  onRestart: () => void;
}

function ResultsScreen({ sessionId, onRestart }: ResultsScreenProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [sessionData, setSessionData] = useState<any>(null);

  const loadResults = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getResults(sessionId);
      setSessionData(response.session);
      setLoading(false);
    } catch (err) {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const downloadSessionExcel = async () => {
    try {
      setDownloading(true);
      setDownloadSuccess(false);
      const blob = await api.downloadSessionXlsx(sessionId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai_brain_lab_session_${sessionId}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (downloadError) {
      setError('Download failed. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    loadResults();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0e1a]">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-[#0ea5e9] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 text-sm">Loading results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0e1a]">
        <div className="text-center p-8 bg-gray-800/50 border border-gray-700/50 rounded-lg max-w-md w-full">
          <p className="text-[#ef4444] mb-4 text-sm">{error}</p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <button
              onClick={loadResults}
              disabled={loading}
              className={`px-4 py-2 rounded text-white transition-colors text-sm ${loading ? 'bg-gray-600 cursor-not-allowed' : 'bg-[#0ea5e9] hover:bg-[#0284c7]'}`}
            >
              Try Again
            </button>
            <button
              onClick={onRestart}
              className="px-4 py-2 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors text-sm"
            >
              Back to Start
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!sessionData) {
    return null;
  }

  const result = sessionData.result || 'manual';
  const finalAccuracy = sessionData.final_accuracy || 0;
  const targetAccuracy = 0.90;
  const finalEnergy = sessionData.final_neural_energy || 0;
  const finalBrainHealth = sessionData.final_brain_health || 0;
  const startingEnergy = 100;
  const energyUsed = Math.max(0, startingEnergy - finalEnergy);
  const finalScore = sessionData.final_score || 0;
  const totalActions = sessionData.total_actions || 0;
  const eventsSolved = sessionData.events_solved || 0;
  const totalEvents = 7;
  const eventsRemaining = totalEvents - eventsSolved;
  const completionTimeSeconds = sessionData.completion_time || 0;

  // CRITICAL: Determine outcome based on backend result, not generic completion
  const isTargetReached = result === 'target_reached';
  const isTimeExpired = result === 'time_expired';
  const isEnergyDepleted = result === 'energy_depleted';

  const getResultTitle = () => {
    if (isTargetReached) return 'Target reached';
    if (isTimeExpired) return 'Time ran out';
    if (isEnergyDepleted) return 'Energy ran out';
    return 'Session ended';
  };

  const getResultSubtitle = () => {
    if (isTargetReached) return 'You improved the model enough to reach the 90% accuracy target.';
    if (isTimeExpired) return 'The session ended before the model reached the 90% accuracy target.';
    if (isEnergyDepleted) return 'The session ended because there was no energy left for more actions.';
    return 'The session has finished.';
  };

  const formatCompletionTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
            isTargetReached ? 'bg-[#10b981]/20' : 'bg-[#ef4444]/20'
          }`}>
            {isTargetReached ? (
              <svg className="w-8 h-8 text-[#10b981]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-[#ef4444]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
          </div>
          <h1 className={`text-3xl font-semibold mb-2 tracking-tight ${
            isTargetReached ? 'text-[#10b981]' : 'text-[#ef4444]'
          }`}>
            {getResultTitle()}
          </h1>
          <p className="text-gray-400 text-sm">{getResultSubtitle()}</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Final Accuracy</p>
            <p className="text-2xl font-semibold text-white">{(finalAccuracy * 100).toFixed(1)}%</p>
            <p className="text-xs text-gray-500">Target: {(targetAccuracy * 100).toFixed(0)}%</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Final Brain Health</p>
            <p className="text-2xl font-semibold text-white">{finalBrainHealth.toFixed(1)}%</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Energy Used</p>
            <p className="text-2xl font-semibold text-white">{energyUsed.toFixed(0)}</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Final Score</p>
            <p className="text-2xl font-semibold text-white">{finalScore}</p>
          </div>
        </div>

        {/* Session Details */}
        <div className="bg-gray-800/50 rounded-lg p-6 mb-6 border border-gray-700/50">
          <h2 className="text-sm font-semibold text-white mb-4 tracking-tight">Session Details</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Completion Time</p>
              <p className="text-sm text-white">{formatCompletionTime(completionTimeSeconds)}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Total Actions</p>
              <p className="text-sm text-white">{totalActions}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Problems Solved</p>
              <p className="text-sm text-white">{eventsSolved} / {totalEvents}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Problems Remaining</p>
              <p className="text-sm text-white">{eventsRemaining}</p>
            </div>
          </div>
        </div>

        {/* Download Section */}
        <div className="bg-gray-800/50 rounded-lg p-6 mb-6 border border-gray-700/50">
          <h2 className="text-sm font-semibold text-white mb-2 tracking-tight">Session Report</h2>
          <p className="text-xs text-gray-400 mb-4">
            Download detailed session analysis as an Excel file.
          </p>

          <button
            onClick={downloadSessionExcel}
            disabled={downloading}
            className="w-full px-6 py-3 bg-gradient-to-r from-[#0ea5e9] to-[#3b82f6] text-white font-medium rounded-lg hover:from-[#0284c7] hover:to-[#2563eb] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {downloading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Preparing report...
              </>
            ) : downloadSuccess ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Report downloaded successfully
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Session Report
              </>
            )}
          </button>
        </div>

        {/* Restart Button */}
        <div className="text-center">
          <button
            onClick={onRestart}
            className="px-8 py-3 bg-gray-700 text-white font-medium rounded-lg hover:bg-gray-600 transition-colors text-sm"
          >
            Start New Session
          </button>
        </div>
      </div>
    </div>
  );
}

export default ResultsScreen;
