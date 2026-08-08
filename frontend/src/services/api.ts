import type { ActionResponse, SessionResults } from '../types';

const API_BASE = 'http://localhost:8080';

export const api = {
  async startSession(sessionId?: string, challengeType?: string, challengeOrder?: number): Promise<any> {
    const response = await fetch(`${API_BASE}/start-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participant_id: sessionId, challenge_type: challengeType, challenge_order: challengeOrder })
    });
    if (!response.ok) throw new Error('Failed to start session');
    return response.json();
  },

  async applyAction(
    sessionId: string,
    actionType: string,
    targetNode?: string,
    energyAllocated?: number,
    sourceNode?: string,
    targetNodeConnect?: string
  ): Promise<ActionResponse> {
    const response = await fetch(`${API_BASE}/apply-action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        action_type: actionType,
        target_node: targetNode,
        energy_allocated: energyAllocated,
        source_node: sourceNode,
        target_node_connect: targetNodeConnect
      })
    });
    if (!response.ok) throw new Error('Failed to apply action');
    return response.json();
  },

  async finishSession(sessionId: string, finalMetrics: any, challengeType?: string, challengeOrder?: number): Promise<any> {
    const response = await fetch(`${API_BASE}/finish-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, ...finalMetrics, challenge_type: challengeType, challenge_order: challengeOrder })
    });
    if (!response.ok) throw new Error('Failed to finish session');
    return response.json();
  },

  async getResults(sessionId: string): Promise<SessionResults> {
    const response = await fetch(`${API_BASE}/results?session_id=${sessionId}`);
    if (!response.ok) throw new Error('Failed to get results');
    return response.json();
  },

  async downloadSessionXlsx(sessionId: string): Promise<Blob> {
    const response = await fetch(`${API_BASE}/export/session-xlsx?session_id=${sessionId}`);
    if (!response.ok) {
      throw new Error('Failed to download session report');
    }
    return await response.blob();
  },

  async applyGameAction(sessionId: string, actionType: string, targetEvent?: string): Promise<ActionResponse> {
    const response = await fetch(`${API_BASE}/apply-game-action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        action_type: actionType,
        target_event: targetEvent
      })
    });
    if (!response.ok) throw new Error('Failed to apply game action');
    return response.json();
  },

  async selectProblem(sessionId: string, problemId: string): Promise<ActionResponse> {
    const response = await fetch(`${API_BASE}/select-problem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        problem_id: problemId
      })
    });
    if (!response.ok) throw new Error('Failed to select problem');
    return response.json();
  },

  async advanceTime(sessionId: string, seconds: number = 1): Promise<ActionResponse> {
    const response = await fetch(`${API_BASE}/advance-time`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        action_type: seconds.toString()
      })
    });
    if (!response.ok) throw new Error('Failed to advance time');
    return response.json();
  }
};
