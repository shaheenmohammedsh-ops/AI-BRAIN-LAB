import type { SimulationState } from '../types';

interface GameActionsProps {
  state: SimulationState;
  onAction: (actionType: string) => void;
}

function GameActions({ state, onAction }: GameActionsProps) {
  const handleActionClick = (actionId: string) => {
    const playClickSound = (window as any).playClickSound;
    if (playClickSound) playClickSound();
    onAction(actionId);
  };

  const actions = [
    {
      id: 'clean_dataset',
      name: 'Clean Dataset',
      description: 'Remove inconsistent entries',
      energyCost: 15,
      accuracyBonus: 0.08,
      icon: '🧹'
    },
    {
      id: 'normalize_data',
      name: 'Normalize Data',
      description: 'Scale features to equal range',
      energyCost: 10,
      accuracyBonus: 0.05,
      icon: '📊'
    },
    {
      id: 'feature_selection',
      name: 'Feature Selection',
      description: 'Select optimal features',
      energyCost: 20,
      accuracyBonus: 0.10,
      icon: '🎯'
    },
    {
      id: 'collect_more_data',
      name: 'Collect More Data',
      description: 'Gather additional samples',
      energyCost: 25,
      accuracyBonus: 0.12,
      icon: '📥'
    },
    {
      id: 'remove_noise',
      name: 'Remove Noise',
      description: 'Filter random errors',
      energyCost: 12,
      accuracyBonus: 0.06,
      icon: '🔇'
    },
    {
      id: 'balance_dataset',
      name: 'Balance Dataset',
      description: 'Equalize class distribution',
      energyCost: 18,
      accuracyBonus: 0.09,
      icon: '⚖️'
    },
    {
      id: 'tune_hyperparameters',
      name: 'Tune Hyperparams',
      description: 'Optimize model parameters',
      energyCost: 22,
      accuracyBonus: 0.11,
      icon: '🔧'
    },
    {
      id: 'validate_model',
      name: 'Validate Model',
      description: 'Test model performance',
      energyCost: 8,
      accuracyBonus: 0.03,
      icon: '✅'
    }
  ];

  const canAffordAction = (energyCost: number) => {
    return state.neural_energy >= energyCost;
  };

  const getEnergyStatus = (energyCost: number) => {
    const energy = state.neural_energy;
    if (energy < energyCost) return 'insufficient';
    if (energy <= 20) return 'critical';
    if (energy <= 40) return 'low';
    return 'normal';
  };

  return (
    <div>
      {/* Compact Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-[#7c3aed]/10 flex items-center justify-center">
            <svg className="w-2.5 h-2.5 text-[#7c3aed]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="text-[11px] font-semibold text-white tracking-tight">Actions</h2>
        </div>
      </div>

      {/* Compact Action Grid - 2 columns */}
      <div className="grid grid-cols-2 gap-1.5">
        {actions.map((action) => {
          const canAfford = canAffordAction(action.energyCost);
          const energyStatus = getEnergyStatus(action.energyCost);
          
          return (
            <button
              key={action.id}
              onClick={() => handleActionClick(action.id)}
              disabled={!canAfford || state.game_status !== 'playing'}
              className={`
                group relative p-2 rounded border transition-all duration-200 text-left
                ${canAfford && state.game_status === 'playing'
                  ? 'bg-gray-800/30 border-gray-700/30 hover:border-[#0ea5e9]/50 hover:bg-gray-800/50 cursor-pointer'
                  : 'bg-gray-900/20 border-gray-800/20 opacity-50 cursor-not-allowed'
                }
              `}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-sm">{action.icon}</span>
                <div className="text-[10px] font-medium text-white truncate">{action.name}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className={`text-[9px] font-medium ${
                  energyStatus === 'insufficient' ? 'text-[#ef4444]' :
                  energyStatus === 'critical' ? 'text-[#f59e0b]' :
                  energyStatus === 'low' ? 'text-[#f59e0b]' : 'text-[#0ea5e9]'
                }`}>
                  ⚡{action.energyCost}
                </div>
                <div className="text-[9px] text-[#10b981]">
                  +{(action.accuracyBonus * 100).toFixed(0)}%
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default GameActions;
