import random
from typing import Dict, Literal, Optional
from dataclasses import dataclass
from datetime import datetime

AccuracyResult = Literal["CORRECT", "WRONG", "INITIALIZE"]

@dataclass
class SimulationState:
    accuracy: float
    loss: float
    precision: float
    recall: float
    brain_health: float
    neural_energy: float
    current_event: Optional[str]
    active_events: list  # Multiple active problems
    problem_states: dict  # Problem state tracking
    events_solved: int
    total_events: int
    current_level: int
    time_remaining: int
    score: int
    combo: int
    game_status: str
    end_reason: Optional[str] = None
    session_start_time: Optional[datetime] = None

class NeuralSimulation:
    def __init__(self):
        self.base_accuracy = 0.5
        self.base_loss = 1.0
        self.base_precision = 0.5
        self.base_recall = 0.5
        self.base_brain_health = 100.0
        self.base_neural_energy = 100.0
        
        self.event_types = [
            "Dirty Data",
            "Missing Values", 
            "Noise",
            "Class Imbalance",
            "Data Drift",
            "Bias",
            "Concept Drift"
        ]
        
        self.event_difficulty = {
            "Dirty Data": 0.15,
            "Missing Values": 0.20,
            "Noise": 0.25,
            "Class Imbalance": 0.30,
            "Data Drift": 0.35,
            "Bias": 0.40,
            "Concept Drift": 0.45
        }
        
        self.action_effects = {
            "clean_dataset": {"energy_cost": 15, "time_cost": 2, "accuracy_reward": 0.08, "energy_bonus": 0},
            "normalize_data": {"energy_cost": 10, "time_cost": 1, "accuracy_reward": 0.05, "energy_bonus": 5},
            "feature_selection": {"energy_cost": 20, "time_cost": 3, "accuracy_reward": 0.10, "energy_bonus": -5},
            "collect_more_data": {"energy_cost": 25, "time_cost": 4, "accuracy_reward": 0.12, "energy_bonus": 10},
            "remove_noise": {"energy_cost": 12, "time_cost": 2, "accuracy_reward": 0.06, "energy_bonus": 0},
            "balance_dataset": {"energy_cost": 18, "time_cost": 3, "accuracy_reward": 0.09, "energy_bonus": -3},
            "tune_hyperparameters": {"energy_cost": 22, "time_cost": 3, "accuracy_reward": 0.11, "energy_bonus": -8},
            "validate_model": {"energy_cost": 8, "time_cost": 1, "accuracy_reward": 0.03, "energy_bonus": 3}
        }
        
        self.nodes = {
            "Input_Layer": {"energy": 20, "max_energy": 30, "importance": 0.2},
            "Hidden_1": {"energy": 25, "max_energy": 40, "importance": 0.25},
            "Hidden_2": {"energy": 25, "max_energy": 40, "importance": 0.25},
            "Hidden_3": {"energy": 20, "max_energy": 35, "importance": 0.2},
            "Output_Layer": {"energy": 10, "max_energy": 25, "importance": 0.1}
        }
        
        self.current_event = None
        self.active_events = []  # Multiple active problems
        self.problem_states = {}  # Track problem states: AVAILABLE, SELECTED, SOLVED
        self.events_solved = 0
        self.target_events = 7
        self.event_queue = []
        self.session_seed = None
        self.session_start_time = None
        
        # Game mechanics
        self.current_level = 1
        self.time_remaining = 180  # 3 minutes
        self.score = 0
        self.combo = 0
        self.game_status = "playing"  # playing, won, lost
        self.end_reason = None  # 'target_reached', 'time_expired', 'energy_depleted'
        self.end_reason = None  # 'target_reached', 'time_expired', 'energy_depleted'
        self.max_time = 180
        self.event_timer = 0
        self.event_interval = 15  # New event every 15 seconds
    
    def initialize_session(self, session_id: str) -> SimulationState:
        self.session_seed = hash(session_id)
        random.seed(self.session_seed)
        
        # Record actual session start time
        self.session_start_time = datetime.now()
        
        self._update_accuracy("INITIALIZE")
        self.base_loss = 1.0
        self.base_precision = 0.5
        self.base_recall = 0.5
        self.base_brain_health = 100.0
        self.base_neural_energy = 100.0
        
        self.nodes = {
            "Input_Layer": {"energy": 20, "max_energy": 30, "importance": 0.2},
            "Hidden_1": {"energy": 25, "max_energy": 40, "importance": 0.25},
            "Hidden_2": {"energy": 25, "max_energy": 40, "importance": 0.25},
            "Hidden_3": {"energy": 20, "max_energy": 35, "importance": 0.2},
            "Output_Layer": {"energy": 10, "max_energy": 25, "importance": 0.1}
        }
        
        self.event_queue = self.event_types.copy()
        random.shuffle(self.event_queue)
        
        # Start with all 7 problems visible
        self.active_events = []
        self.problem_states = {}
        for _ in range(min(7, len(self.event_queue))):
            if self.event_queue:
                problem = self.event_queue.pop(0)
                self.active_events.append(problem)
                self.problem_states[problem] = 'AVAILABLE'
        
        self.current_event = self.active_events[0] if self.active_events else None
        self.events_solved = 0
        
        # Reset game state
        self.current_level = 1
        self.time_remaining = self.max_time
        self.score = 0
        self.combo = 0
        self.game_status = "playing"
        self.event_timer = 0
        
        # Reset base metrics to initial values
        self._update_accuracy("INITIALIZE")
        self.base_loss = 1.0
        self.base_precision = 0.5
        self.base_recall = 0.5
        self.base_brain_health = 100.0
        
        return self.get_current_state()
    
    def _update_accuracy(self, result: AccuracyResult, amount: float = 0.0) -> None:
        """
        Authoritative function for Accuracy changes during gameplay.
        ONLY this function may modify base_accuracy after initialization.

        CORRECT  -> apply reward (amount > 0)
        WRONG    -> apply penalty (amount > 0)
        INITIALIZE -> reset to starting value (0.5)
        Anything else -> unchanged
        """
        if result == "INITIALIZE":
            self.base_accuracy = 0.5
            return

        if result == "CORRECT" and amount > 0:
            self.base_accuracy = max(0.0, min(1.0, self.base_accuracy + amount))
        elif result == "WRONG" and amount > 0:
            self.base_accuracy = max(0.0, min(1.0, self.base_accuracy - amount))
        # All other cases: accuracy unchanged
    
    def _calculate_correct_reward(self, action_type: str, event: str) -> float:
        """Calculate total accuracy reward for a correct submitted solution."""
        action_reward = self.action_effects.get(action_type, {}).get("accuracy_reward", 0.0)
        event_reward = self.event_difficulty.get(event, 0.3) * 2 * 0.5
        return action_reward + event_reward

    def _calculate_wrong_penalty(self, event: Optional[str]) -> float:
        """Calculate accuracy penalty for a wrong submitted solution."""
        event_difficulty = self.event_difficulty.get(event, 0.3) if event else 0.3
        return event_difficulty * 0.5 * 0.3
    
    def _validate_metric(self, value: float, min_val: float, max_val: float, metric_name: str) -> float:
        """Validate and clamp a metric to its valid range."""
        if value < min_val or value > max_val:
            print(f"WARNING: {metric_name} out of range: {value}. Clamping to [{min_val}, {max_val}]")
        return max(min_val, min(max_val, value))
    
    def get_current_state(self) -> SimulationState:
        event_penalty = self._calculate_event_penalty()
        
        # CRITICAL: Do NOT apply event penalty to accuracy/precision/recall/brain_health
        # Event penalty is only applied when explicit damage is triggered via _trigger_event_damage
        # This ensures selecting a problem (UI navigation) does not decrease metrics
        
        # Calculate accuracy with proper bounds (0.0 to 1.0 representing 0% to 100%)
        accuracy = max(0.0, min(1.0, self.base_accuracy))
        loss = max(0.0, self.base_loss)
        precision = max(0.0, min(1.0, self.base_precision))
        recall = max(0.0, min(1.0, self.base_recall))
        
        # Brain health with proper bounds (0 to 100)
        brain_health = max(0.0, min(100.0, self.base_brain_health))
        
        # Neural energy - sum of node energies
        neural_energy = sum(node["energy"] for node in self.nodes.values())
        
        # Check win/lose conditions
        self._check_game_conditions(accuracy, brain_health, neural_energy)
        
        return SimulationState(
            accuracy=round(accuracy, 3),
            loss=round(loss, 3),
            precision=round(precision, 3),
            recall=round(recall, 3),
            brain_health=round(brain_health, 3),
            neural_energy=round(neural_energy, 3),
            current_event=self.current_event,
            active_events=self.active_events,
            problem_states=self.problem_states,
            events_solved=self.events_solved,
            total_events=self.target_events,
            current_level=self.current_level,
            time_remaining=self.time_remaining,
            score=self.score,
            combo=self.combo,
            game_status=self.game_status,
            end_reason=self.end_reason,
            session_start_time=self.session_start_time
        )
    
    def _calculate_event_penalty(self) -> float:
        if not self.current_event:
            return 0.0
        return self.event_difficulty.get(self.current_event, 0.3)
    
    def _check_game_conditions(self, accuracy: float, brain_health: float, neural_energy: float):
        if self.game_status != "playing":
            return
        
        # PRIMARY WIN CONDITION: Reach accuracy target (90%)
        if accuracy >= 0.90:
            self.game_status = "won"
            self.end_reason = "target_reached"
            self.score += int(brain_health * 10) + int(neural_energy * 5)
            return
        
        # PRIMARY LOSS CONDITIONS - Check in priority order
        
        # Loss Condition 1: Time expired
        if self.time_remaining <= 0:
            self.game_status = "lost"
            self.end_reason = "time_expired"
            return
        
        # Loss Condition 2: Energy depleted
        if neural_energy <= 0:
            self.game_status = "lost"
            self.end_reason = "energy_depleted"
            return
    
    def allocate_energy(self, node_id: str, amount: float) -> SimulationState:
        if node_id not in self.nodes:
            return self.get_current_state()
        
        node = self.nodes[node_id]
        actual_amount = min(amount, node["max_energy"] - node["energy"])
        if actual_amount <= 0:
            return self.get_current_state()
        node["energy"] = min(node["max_energy"], node["energy"] + actual_amount)
        
        total_energy = sum(n["energy"] for n in self.nodes.values())
        energy_ratio = total_energy / sum(n["max_energy"] for n in self.nodes.values())
        
        improvement = energy_ratio * 0.1
        self.base_loss = max(0.1, self.base_loss - improvement * 0.3)
        self.base_precision = min(0.95, self.base_precision + improvement * 0.4)
        self.base_recall = min(0.95, self.base_recall + improvement * 0.4)
        self.base_brain_health = min(100.0, self.base_brain_health + improvement * 10)
        
        return self.get_current_state()
    
    def connect_nodes(self, source_id: str, target_id: str) -> SimulationState:
        if source_id not in self.nodes or target_id not in self.nodes:
            return self.get_current_state()
        
        connection_bonus = 0.05
        self.base_loss = max(0.1, self.base_loss - connection_bonus * 0.2)
        self.base_precision = min(0.95, self.base_precision + connection_bonus * 0.25)
        self.base_recall = min(0.95, self.base_recall + connection_bonus * 0.25)
        
        return self.get_current_state()
    
    def disconnect_nodes(self, source_id: str, target_id: str) -> SimulationState:
        if source_id not in self.nodes or target_id not in self.nodes:
            return self.get_current_state()
        
        penalty = 0.03
        self.base_loss = min(1.5, self.base_loss + penalty * 0.2)
        self.base_precision = max(0.4, self.base_precision - penalty * 0.25)
        self.base_recall = max(0.4, self.base_recall - penalty * 0.25)
        
        return self.get_current_state()
    
    def solve_event(self) -> SimulationState:
        if not self.current_event:
            return self.get_current_state()
        
        event_difficulty = self.event_difficulty.get(self.current_event, 0.3)
        total_energy = sum(n["energy"] for n in self.nodes.values())
        max_energy = sum(n["max_energy"] for n in self.nodes.values())
        energy_ratio = total_energy / max_energy
        
        if energy_ratio > 0.6:
            self.events_solved += 1
            reward = event_difficulty * 1.5
            self._update_accuracy("CORRECT", reward * 0.4)
            self.base_loss = max(0.1, self.base_loss - reward * 0.5)
            self.base_precision = min(0.95, self.base_precision + reward * 0.35)
            self.base_recall = min(0.95, self.base_recall + reward * 0.35)
            self.base_brain_health = min(100.0, self.base_brain_health + reward * 20)
            
            self.current_event = self.event_queue.pop(0) if self.event_queue else None
        else:
            penalty = event_difficulty * 0.5
            self._update_accuracy("WRONG", penalty * 0.3)
            self.base_loss = min(2.0, self.base_loss + penalty * 0.4)
            self.base_brain_health = max(0.0, self.base_brain_health - penalty * 15)
        
        return self.get_current_state()
    
    def inspect_node(self, node_id: str) -> Dict:
        if node_id not in self.nodes:
            return {}
        
        node = self.nodes[node_id]
        return {
            "id": node_id,
            "energy": node["energy"],
            "max_energy": node["max_energy"],
            "importance": node["importance"],
            "health_percent": round((node["energy"] / node["max_energy"]) * 100, 1)
        }
    
    def get_nodes(self) -> Dict:
        return {
            node_id: {
                "energy": node["energy"],
                "max_energy": node["max_energy"],
                "importance": node["importance"],
                "health_percent": round((node["energy"] / node["max_energy"]) * 100, 1)
            }
            for node_id, node in self.nodes.items()
        }
    
    def is_complete(self) -> bool:
        # Game completes when accuracy target is reached, time expires, or energy depletes
        # This is handled in _check_game_conditions, not by counting solved problems
        return False
    
    def select_problem(self, problem_id: str) -> SimulationState:
        """Select a problem from the problem board."""
        if problem_id not in self.active_events:
            return self.get_current_state()
        
        if self.problem_states.get(problem_id) == 'SOLVED':
            return self.get_current_state()
        
        # Mark all problems as AVAILABLE, then mark selected as SELECTED
        for problem in self.active_events:
            if self.problem_states.get(problem) != 'SOLVED':
                self.problem_states[problem] = 'AVAILABLE'
        
        self.problem_states[problem_id] = 'SELECTED'
        self.current_event = problem_id
        
        return self.get_current_state()
    
    def apply_game_action(self, action_type: str, target_event: str = None) -> SimulationState:
        if action_type not in self.action_effects:
            return self.get_current_state()
        
        if self.game_status != "playing":
            return self.get_current_state()
        
        effects = self.action_effects[action_type]
        
        # Check if player has enough energy - CRITICAL VALIDATION
        total_energy = sum(n["energy"] for n in self.nodes.values())
        if total_energy < effects["energy_cost"]:
            self.combo = 0  # Reset combo on failed action
            return self.get_current_state()
        
        # Apply energy cost - ensure no negative energy
        energy_to_remove = effects["energy_cost"]
        for node_id in self.nodes:
            if energy_to_remove <= 0:
                break
            available = self.nodes[node_id]["energy"]
            remove = min(available, energy_to_remove)
            self.nodes[node_id]["energy"] = max(0.0, self.nodes[node_id]["energy"] - remove)
            energy_to_remove -= remove
        
        # Apply energy bonus/penalty with bounds
        if effects["energy_bonus"] > 0:
            # Distribute bonus energy respecting max limits
            bonus = effects["energy_bonus"]
            for node_id in self.nodes:
                if bonus <= 0:
                    break
                space = self.nodes[node_id]["max_energy"] - self.nodes[node_id]["energy"]
                add = min(space, bonus)
                self.nodes[node_id]["energy"] = min(self.nodes[node_id]["max_energy"], self.nodes[node_id]["energy"] + add)
                bonus -= add
        elif effects["energy_bonus"] < 0:
            # Additional energy penalty - ensure no negative
            penalty = abs(effects["energy_bonus"])
            for node_id in self.nodes:
                if penalty <= 0:
                    break
                available = self.nodes[node_id]["energy"]
                remove = min(available, penalty)
                self.nodes[node_id]["energy"] = max(0.0, self.nodes[node_id]["energy"] - remove)
                penalty -= remove
        
        # Update combo and score - score is deterministic
        self.combo += 1
        combo_multiplier = 1 + (self.combo * 0.1)
        action_score = int(effects["accuracy_reward"] * 100 * combo_multiplier)
        self.score += action_score
        
        # Accuracy changes ONLY on explicit correct/wrong submitted solution
        event_to_solve = target_event if target_event in self.active_events else self.current_event
        if event_to_solve and self._action_solves_event(action_type, event_to_solve):
            reward = self._calculate_correct_reward(action_type, event_to_solve)
            self._update_accuracy("CORRECT", reward)
            self._solve_event(event_to_solve)
        elif event_to_solve:
            penalty = self._calculate_wrong_penalty(event_to_solve)
            self._update_accuracy("WRONG", penalty)
            self.combo = 0
        
        # Update current event to first active event (solved problems remain in active_events but marked SOLVED)
        self.current_event = self.active_events[0] if self.active_events else None
        
        return self.get_current_state()
    
    def _action_solves_event(self, action: str, event: str) -> bool:
        # Mapping of actions to events they can solve
        solutions = {
            "clean_dataset": ["Dirty Data"],
            "normalize_data": ["Dirty Data", "Missing Values"],
            "remove_noise": ["Noise"],
            "balance_dataset": ["Class Imbalance"],
            "tune_hyperparameters": ["Bias"],
            "collect_more_data": ["Class Imbalance", "Data Drift"],
            "feature_selection": ["Data Drift", "Concept Drift"],
            "validate_model": ["Concept Drift"]
        }
        return event in solutions.get(action, [])
    
    def _solve_event(self, event_to_solve: str):
        if not event_to_solve or event_to_solve not in self.active_events:
            return
        
        reward = self.event_difficulty.get(event_to_solve, 0.3) * 2
        
        # Apply brain health improvement with bounds (accuracy handled by _update_accuracy)
        self.base_brain_health = max(0.0, min(100.0, self.base_brain_health + reward * 25))
        
        # Bonus score for solving event
        self.score += int(reward * 200 * (1 + self.combo * 0.2))
        
        self.events_solved += 1
        self.current_level = min(7, self.events_solved + 1)
        
        # Mark problem as SOLVED but keep it in active_events so it remains visible
        self.problem_states[event_to_solve] = 'SOLVED'
        
        # Update current event to first unsolved event
        for event in self.active_events:
            if self.problem_states.get(event) != 'SOLVED':
                self.current_event = event
                return
        self.current_event = None
    
    def advance_time(self, seconds: int) -> SimulationState:
        if self.game_status != "playing":
            return self.get_current_state()
        
        self.time_remaining = max(0, self.time_remaining - seconds)
        self.event_timer += seconds
        
        # CRITICAL: Do NOT trigger automatic event damage during idle time
        # The passage of time alone must NOT decrease Accuracy or other metrics
        # Damage should only occur from explicit gameplay actions
        # Commented out the automatic damage trigger:
        # if self.current_event and self.event_timer >= self.event_interval:
        #     self._trigger_event_damage()
        #     self.event_timer = 0
        
        return self.get_current_state()

_sim_instance = None

def get_simulation() -> NeuralSimulation:
    global _sim_instance
    if _sim_instance is None:
        _sim_instance = NeuralSimulation()
    return _sim_instance
