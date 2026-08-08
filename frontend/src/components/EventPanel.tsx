import React from 'react';
import type { SimulationState } from '../types';

interface EventPanelProps {
  state: SimulationState;
}

const eventDescriptions: Record<string, string> = {
  'Dirty Data': 'Inaccurate or corrupted entries are affecting model decisions.',
  'Missing Values': 'Some inputs are incomplete and need cleaning.',
  'Noise': 'Random data errors are confusing the model.',
  'Class Imbalance': 'One outcome is dominating the training samples.',
  'Data Drift': 'The dataset is shifting away from what the model expects.',
  'Bias': 'The system is leaning too far in one direction.',
  'Concept Drift': 'The target behavior has changed unexpectedly.'
};

const eventHints: Record<string, string> = {
  'Dirty Data': 'Clean the dataset to restore accuracy.',
  'Missing Values': 'Fill gaps or standardize incomplete inputs.',
  'Noise': 'Remove noisy examples and focus on clear data.',
  'Class Imbalance': 'Balance the classes with targeted sampling.',
  'Data Drift': 'Collect fresh data and retrain carefully.',
  'Bias': 'Tune and test to remove systematic error.',
  'Concept Drift': 'Validate assumptions and update the model.'
};

const EventPanel: React.FC<EventPanelProps> = ({ state }) => {
  const activeEvents = state.active_events || [];
  const solvedPercent = Math.round((state.events_solved / state.total_events) * 100);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 rounded bg-[#0ea5e9] flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-section-title text-white">Active Problems</h2>
      </div>

      {activeEvents.length > 0 ? (
        <div className="space-y-3 mb-4">
          {activeEvents.map((event, index) => (
            <div key={event} className="border-l-4 border-[#ef4444] bg-gray-800 p-3">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-micro text-gray-400 uppercase tracking-wider">Problem {index + 1}</p>
                  <h3 className="text-base font-semibold text-white mt-1">{event}</h3>
                </div>
              </div>
              <p className="text-xs text-gray-300 mb-2">{eventDescriptions[event] || 'A model issue is in progress.'}</p>
              <div className="bg-gray-900 p-2 rounded border border-gray-700">
                <div className="text-micro text-gray-400 mb-1">Recommended Action</div>
                <div className="text-xs text-white">{eventHints[event] || 'Choose the action that matches the issue.'}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="border-l-4 border-[#10b981] bg-gray-800 p-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="text-2xl">✓</div>
            <div>
              <h3 className="text-lg font-semibold text-white">All Clear</h3>
              <p className="text-sm text-gray-400">No active issues</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gray-800 p-4 rounded border border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-micro text-gray-400 uppercase tracking-wider">Progress</p>
            <p className="text-sm text-white">{state.events_solved} / {state.total_events}</p>
          </div>
          <div className="text-sm font-medium text-[#0ea5e9]">{solvedPercent}%</div>
        </div>
        <div className="h-2 rounded-full bg-gray-700 overflow-hidden">
          <div
            className="h-full bg-[#0ea5e9] transition-all duration-300"
            style={{ width: `${solvedPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default EventPanel;
