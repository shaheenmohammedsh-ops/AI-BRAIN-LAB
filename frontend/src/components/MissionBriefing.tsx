import { CHALLENGES } from '../config/missions';

interface MissionBriefingProps {
  missionId: number;
  onStart: () => void;
}

function MissionBriefing({ missionId, onStart }: MissionBriefingProps) {
  const mission = CHALLENGES.find(m => m.id === missionId) || CHALLENGES[0];

  const handleStart = () => {
    const playClickSound = (window as any).playClickSound;
    if (playClickSound) playClickSound();
    onStart();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0e1a] p-8">
      <div className="max-w-2xl w-full">
        <div className="bg-gray-800/50 rounded-2xl p-8 border border-gray-700/50">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#0ea5e9]/20 mb-4">
              <svg className="w-8 h-8 text-[#0ea5e9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414a5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-3xl font-semibold text-white mb-2 tracking-tight">{mission.title}</h1>
            <p className="text-gray-400 text-base">{mission.description}</p>
          </div>

          {/* Key Objectives */}
          <div className="space-y-3 mb-8">
            <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/50">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Target Accuracy</span>
                <span className="text-2xl font-semibold text-[#0ea5e9]">{(mission.target_accuracy * 100).toFixed(0)}%</span>
              </div>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/50">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Time Limit</span>
                <span className="text-2xl font-semibold text-[#7c3aed]">{mission.estimated_duration}</span>
              </div>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/50">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-[#ef4444]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="text-sm text-gray-300">{mission.current_challenge}</span>
              </div>
            </div>
          </div>

          {/* Start Button */}
          <div className="flex justify-center">
            <button
              onClick={handleStart}
              className="px-8 py-3 bg-gradient-to-r from-[#0ea5e9] to-[#3b82f6] text-white font-medium rounded-lg hover:from-[#0284c7] hover:to-[#2563eb] transition-all flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Begin Training
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MissionBriefing;