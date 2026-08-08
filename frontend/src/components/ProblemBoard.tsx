interface ProblemBoardProps {
  activeEvents: string[];
  problemStates: Record<string, string>;
  onSelectProblem: (problemId: string) => void;
  disabled: boolean;
}

const problemIcons: Record<string, string> = {
  "Dirty Data": "🧹",
  "Missing Values": "❓",
  "Noise": "📊",
  "Class Imbalance": "⚖️",
  "Data Drift": "📈",
  "Bias": "🎯",
  "Concept Drift": "🔄"
};

function ProblemBoard({ 
  activeEvents, 
  problemStates, 
  onSelectProblem,
  disabled 
}: ProblemBoardProps) {
  const solvedCount = activeEvents.filter(p => problemStates[p] === 'SOLVED').length;
  const progressPercent = activeEvents.length > 0 
    ? Math.round((solvedCount / activeEvents.length) * 100)
    : 100;

  return (
    <div>
      {/* Compact Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-[#0ea5e9]/10 flex items-center justify-center">
            <svg className="w-2.5 h-2.5 text-[#0ea5e9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h2 className="text-[11px] font-semibold text-white tracking-tight">AI Problems</h2>
        </div>
        <div className="text-[10px] text-gray-400">
          {solvedCount}/{activeEvents.length}
        </div>
      </div>

      {/* Compact Problem Grid - 3 columns for 7 problems */}
      {activeEvents.length > 0 ? (
        <div className="grid grid-cols-3 gap-1.5 mb-2">
          {activeEvents.map((problem) => {
            const state = problemStates[problem] || 'AVAILABLE';
            const isSolved = state === 'SOLVED';
            const isSelected = state === 'SELECTED';
            
            return (
              <button
                key={problem}
                onClick={() => !disabled && !isSolved && onSelectProblem(problem)}
                disabled={disabled || isSolved}
                className={`
                  relative p-2 rounded border transition-all duration-200 text-left
                  ${isSolved 
                    ? 'bg-gray-900/30 border-[#10b981]/30 opacity-60 cursor-not-allowed' 
                    : isSelected 
                      ? 'bg-[#0ea5e9]/10 border-[#0ea5e9] cursor-pointer' 
                      : 'bg-gray-800/30 border-gray-700/30 cursor-pointer hover:border-[#0ea5e9]/50 hover:bg-gray-800/50'
                  }
                  ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-xs">{problemIcons[problem] || '⚠️'}</span>
                  <h3 className={`text-[10px] font-semibold ${isSolved ? 'text-[#10b981] line-through' : 'text-white'} truncate`}>
                    {problem}
                  </h3>
                </div>
                {isSolved && (
                  <div className="text-[8px] text-[#10b981]">✓</div>
                )}
                {isSelected && (
                  <div className="text-[8px] text-[#0ea5e9]">→</div>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="border-l-2 border-[#10b981] bg-gray-800/30 p-2 mb-2 rounded-r">
          <div className="flex items-center gap-1">
            <div className="text-sm text-[#10b981]">✓</div>
            <span className="text-[10px] text-white">All Solved</span>
          </div>
        </div>
      )}

      {/* Compact Progress Bar */}
      <div className="border-t border-gray-700/50 pt-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[8px] text-gray-400 uppercase tracking-wider">Progress</span>
          <span className="text-[10px] font-medium text-[#0ea5e9]">{progressPercent}%</span>
        </div>
        <div className="h-1 rounded-full bg-gray-700/50 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#0ea5e9] to-[#3b82f6] transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default ProblemBoard;
