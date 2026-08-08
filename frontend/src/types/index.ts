export interface SimulationState {
  accuracy: number;
  loss: number;
  precision: number;
  recall: number;
  brain_health: number;
  neural_energy: number;
  current_event: string | null;
  active_events: string[];
  problem_states: Record<string, string>;
  events_solved: number;
  total_events: number;
  nodes: Record<string, NodeInfo>;
  current_level: number;
  time_remaining: number;
  score: number;
  combo: number;
  game_status: 'playing' | 'won' | 'lost';
  end_reason?: string | null;
  current_mission?: MissionInfo;
  mission_stage?: MissionStage;
}

export interface NodeInfo {
  energy: number;
  max_energy: number;
  importance: number;
  health_percent: number;
}

export interface StartSessionResponse {
  session_id: string;
  participant_id: number;
  state: SimulationState;
}

export interface ActionResponse {
  state: SimulationState;
  is_complete?: boolean;
  node_info?: NodeInfo;
}

export interface SessionResults {
  session: any;
  interactions: any[];
}

export interface ExportData {
  session_id: string;
  timestamp: string;
  interactions_csv: string;
  session_csv: string;
  statistics: {
    total_interactions: number;
    events_solved: number;
    final_accuracy: number;
    avg_accuracy: number;
    avg_brain_health: number;
    avg_neural_energy: number;
    avg_combo: number;
    actions_per_minute: number;
    session_duration_minutes: number;
  };
}

export interface MissionInfo {
  id: number;
  title: string;
  description: string;
  customer_objective: string;
  target_accuracy: number;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  estimated_duration: string;
  current_challenge: string;
}

export type MissionStage = 
  | 'briefing'
  | 'dataset_preparation'
  | 'missing_values'
  | 'noise'
  | 'feature_engineering'
  | 'training'
  | 'bias_detection'
  | 'validation'
  | 'concept_drift'
  | 'deployment'
  | 'mission_complete';

export interface EducationalInsight {
  event: string;
  action: string;
  insight: string;
  real_world_application: string;
}
