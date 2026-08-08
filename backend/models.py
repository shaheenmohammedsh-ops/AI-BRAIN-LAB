from dataclasses import dataclass
from datetime import datetime
from typing import Optional
import sqlite3

@dataclass
class Participant:
    id: Optional[int] = None
    session_id: Optional[str] = None
    created_at: Optional[datetime] = None

@dataclass
class Session:
    id: Optional[int] = None
    participant_id: Optional[int] = None
    session_id: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    final_accuracy: Optional[float] = None
    final_loss: Optional[float] = None
    final_precision: Optional[float] = None
    final_recall: Optional[float] = None
    final_brain_health: Optional[float] = None
    final_neural_energy: Optional[float] = None
    final_score: Optional[int] = None
    final_combo: Optional[int] = None
    completion_time: Optional[float] = None
    total_actions: Optional[int] = None
    correct_actions: Optional[int] = None
    wrong_actions: Optional[int] = None
    events_solved: Optional[int] = None
    challenge_type: Optional[str] = None
    challenge_order: Optional[int] = None

@dataclass
class Interaction:
    id: Optional[int] = None
    session_id: Optional[str] = None
    action_type: Optional[str] = None
    target_node: Optional[str] = None
    energy_allocated: Optional[float] = None
    event_type: Optional[str] = None
    timestamp: Optional[datetime] = None
    accuracy_after: Optional[float] = None
    loss_after: Optional[float] = None
    precision_after: Optional[float] = None
    recall_after: Optional[float] = None
    brain_health_after: Optional[float] = None
    neural_energy_after: Optional[float] = None
    accuracy_before: Optional[float] = None
    loss_before: Optional[float] = None
    precision_before: Optional[float] = None
    recall_before: Optional[float] = None
    brain_health_before: Optional[float] = None
    neural_energy_before: Optional[float] = None
    reaction_time: Optional[float] = None
    decision_time: Optional[float] = None
    time_remaining: Optional[float] = None
    combo: Optional[int] = None
    level: Optional[int] = None
    is_success: Optional[int] = None
    event_solved: Optional[int] = None

class Database:
    def __init__(self, db_path: str = "neural_shield.db"):
        self.db_path = db_path
        self.init_db()
    
    def init_db(self):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS participants (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                participant_id INTEGER,
                session_id TEXT NOT NULL,
                start_time TIMESTAMP,
                end_time TIMESTAMP,
                final_accuracy REAL,
                final_loss REAL,
                final_precision REAL,
                final_recall REAL,
                final_brain_health REAL,
                final_neural_energy REAL,
                final_score INTEGER,
                final_combo INTEGER,
                completion_time REAL,
                total_actions INTEGER,
                correct_actions INTEGER,
                wrong_actions INTEGER,
                events_solved INTEGER,
                challenge_type TEXT,
                challenge_order INTEGER,
                FOREIGN KEY (participant_id) REFERENCES participants(id)
            )
        """)
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS interactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                action_type TEXT NOT NULL,
                target_node TEXT,
                energy_allocated REAL,
                event_type TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                accuracy_after REAL,
                loss_after REAL,
                precision_after REAL,
                recall_after REAL,
                brain_health_after REAL,
                neural_energy_after REAL,
                accuracy_before REAL,
                loss_before REAL,
                precision_before REAL,
                recall_before REAL,
                brain_health_before REAL,
                neural_energy_before REAL,
                reaction_time REAL,
                decision_time REAL,
                time_remaining REAL,
                combo INTEGER,
                level INTEGER,
                is_success INTEGER,
                event_solved INTEGER
            )
        """)

        # Ensure column compatibility for existing databases.
        self._ensure_interaction_columns(cursor)
        self._ensure_session_columns(cursor)
        
        conn.commit()
        conn.close()

    def _ensure_session_columns(self, cursor):
        existing_columns = [row[1] for row in cursor.execute("PRAGMA table_info(sessions)").fetchall()]
        session_column_definitions = {
            'final_score': 'INTEGER',
            'final_combo': 'INTEGER',
            'completion_time': 'REAL',
            'total_actions': 'INTEGER',
            'correct_actions': 'INTEGER',
            'wrong_actions': 'INTEGER',
            'challenge_type': 'TEXT',
            'challenge_order': 'INTEGER'
        }
        for column, dtype in session_column_definitions.items():
            if column not in existing_columns:
                cursor.execute(f"ALTER TABLE sessions ADD COLUMN {column} {dtype}")

    def _ensure_interaction_columns(self, cursor):
        existing_columns = [row[1] for row in cursor.execute("PRAGMA table_info(interactions)").fetchall()]
        column_definitions = {
            'accuracy_after': 'REAL',
            'loss_after': 'REAL',
            'precision_after': 'REAL',
            'recall_after': 'REAL',
            'brain_health_after': 'REAL',
            'neural_energy_after': 'REAL',
            'accuracy_before': 'REAL',
            'loss_before': 'REAL',
            'precision_before': 'REAL',
            'recall_before': 'REAL',
            'brain_health_before': 'REAL',
            'neural_energy_before': 'REAL',
            'reaction_time': 'REAL',
            'decision_time': 'REAL',
            'time_remaining': 'REAL',
            'combo': 'INTEGER',
            'level': 'INTEGER',
            'is_success': 'INTEGER',
            'event_solved': 'INTEGER'
        }
        for column, dtype in column_definitions.items():
            if column not in existing_columns:
                cursor.execute(f"ALTER TABLE interactions ADD COLUMN {column} {dtype}")
    
    def create_participant(self, session_id: str) -> int:
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO participants (session_id) VALUES (?)",
            (session_id,)
        )
        participant_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return participant_id
    
    def create_session(self, participant_id: int, session_id: str, challenge_type: str = None, challenge_order: int = None) -> int:
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        # Use explicit NULL for start_time - will be set when game actually starts
        cursor.execute(
            "INSERT INTO sessions (participant_id, session_id, challenge_type, challenge_order, start_time) VALUES (?, ?, ?, ?, NULL)",
            (participant_id, session_id, challenge_type, challenge_order)
        )
        session_db_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return session_db_id
    
    def record_interaction(self, interaction: Interaction):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO interactions (
                session_id, action_type, target_node, energy_allocated,
                event_type, accuracy_after, loss_after, precision_after,
                recall_after, brain_health_after, neural_energy_after,
                accuracy_before, loss_before, precision_before, recall_before,
                brain_health_before, neural_energy_before, reaction_time,
                decision_time, time_remaining, combo, level,
                is_success, event_solved
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            interaction.session_id,
            interaction.action_type,
            interaction.target_node,
            interaction.energy_allocated,
            interaction.event_type,
            interaction.accuracy_after,
            interaction.loss_after,
            interaction.precision_after,
            interaction.recall_after,
            interaction.brain_health_after,
            interaction.neural_energy_after,
            interaction.accuracy_before,
            interaction.loss_before,
            interaction.precision_before,
            interaction.recall_before,
            interaction.brain_health_before,
            interaction.neural_energy_before,
            interaction.reaction_time,
            interaction.decision_time,
            interaction.time_remaining,
            interaction.combo,
            interaction.level,
            1 if interaction.is_success else 0,
            1 if interaction.event_solved else 0
        ))
        conn.commit()
        conn.close()
    
    def _validate_session_metrics(self, metrics: dict) -> dict:
        """Validate and clamp session metrics to valid ranges."""
        validated = metrics.copy()
        
        # Accuracy: 0.0 to 1.0 (representing 0% to 100%)
        if 'accuracy' in validated:
            validated['accuracy'] = max(0.0, min(1.0, validated['accuracy']))
            if validated['accuracy'] < 0 or validated['accuracy'] > 1.0:
                print(f"WARNING: Accuracy out of range [0,1]: {validated['accuracy']}")
        
        # Precision: 0.0 to 1.0 (representing 0% to 100%)
        if 'precision' in validated:
            validated['precision'] = max(0.0, min(1.0, validated['precision']))
            if validated['precision'] < 0 or validated['precision'] > 1.0:
                print(f"WARNING: Precision out of range [0,1]: {validated['precision']}")
        
        # Recall: 0.0 to 1.0 (representing 0% to 100%)
        if 'recall' in validated:
            validated['recall'] = max(0.0, min(1.0, validated['recall']))
            if validated['recall'] < 0 or validated['recall'] > 1.0:
                print(f"WARNING: Recall out of range [0,1]: {validated['recall']}")
        
        # Brain Health: 0 to 100 (already in percentage form)
        if 'brain_health' in validated:
            validated['brain_health'] = max(0.0, min(100.0, validated['brain_health']))
            if validated['brain_health'] < 0 or validated['brain_health'] > 100:
                print(f"WARNING: Brain Health out of range [0,100]: {validated['brain_health']}")
        
        # Neural Energy: 0 to max (around 170 for all nodes)
        if 'neural_energy' in validated:
            validated['neural_energy'] = max(0.0, min(200.0, validated['neural_energy']))
        
        # Completion Time: should be reasonable (0 to 3600 seconds)
        if 'completion_time' in validated:
            if validated['completion_time'] is None:
                validated['completion_time'] = 0
            else:
                validated['completion_time'] = max(0.0, min(3600.0, validated['completion_time']))
                # Game is max 180 seconds, warn if significantly over
                if validated['completion_time'] > 200:
                    print(f"WARNING: Completion time suspiciously high: {validated['completion_time']}s (max game time: 180s)")
        
        # Score: should be non-negative
        if 'score' in validated:
            validated['score'] = max(0, validated['score'])
        
        # Actions: should be non-negative
        for action_field in ['total_actions', 'correct_actions', 'wrong_actions', 'events_solved']:
            if action_field in validated:
                validated[action_field] = max(0, validated[action_field])
        
        # Validate consistency: correct + wrong should equal total
        if 'total_actions' in validated and 'correct_actions' in validated and 'wrong_actions' in validated:
            if validated['total_actions'] != validated['correct_actions'] + validated['wrong_actions']:
                print(f"WARNING: Action count inconsistency: total={validated['total_actions']}, correct={validated['correct_actions']}, wrong={validated['wrong_actions']}")
                # Recalculate total to maintain consistency
                validated['total_actions'] = validated['correct_actions'] + validated['wrong_actions']
        
        # Validate events_solved <= total_events (7)
        if 'events_solved' in validated:
            if validated['events_solved'] > 7:
                print(f"WARNING: Events solved exceeds maximum: {validated['events_solved']} > 7")
                validated['events_solved'] = 7
        
        return validated
    
    def update_session(self, session_id: str, final_metrics: dict):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Validate metrics before saving
        validated_metrics = self._validate_session_metrics(final_metrics)
        
        cursor.execute("""
            UPDATE sessions 
            SET end_time = CURRENT_TIMESTAMP,
                start_time = COALESCE(?, start_time),
                final_accuracy = ?,
                final_loss = ?,
                final_precision = ?,
                final_recall = ?,
                final_brain_health = ?,
                final_neural_energy = ?,
                final_score = ?,
                final_combo = ?,
                completion_time = ?,
                total_actions = ?,
                correct_actions = ?,
                wrong_actions = ?,
                events_solved = ?,
                challenge_type = ?,
                challenge_order = ?
            WHERE session_id = ?
        """, (
            validated_metrics.get('session_start_time'),
            validated_metrics.get('accuracy'),
            validated_metrics.get('loss'),
            validated_metrics.get('precision'),
            validated_metrics.get('recall'),
            validated_metrics.get('brain_health'),
            validated_metrics.get('neural_energy'),
            validated_metrics.get('score'),
            validated_metrics.get('combo'),
            validated_metrics.get('completion_time'),
            validated_metrics.get('total_actions'),
            validated_metrics.get('correct_actions'),
            validated_metrics.get('wrong_actions'),
            validated_metrics.get('events_solved'),
            validated_metrics.get('challenge_type'),
            validated_metrics.get('challenge_order'),
            session_id
        ))
        conn.commit()
        conn.close()
    
    def get_session_results(self, session_id: str) -> dict:
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, participant_id, session_id, start_time, end_time,
                   final_accuracy, final_loss, final_precision, final_recall,
                   final_brain_health, final_neural_energy, final_score,
                   final_combo, completion_time, total_actions, correct_actions,
                   wrong_actions, events_solved
            FROM sessions WHERE session_id = ?
        """, (session_id,))
        row = cursor.fetchone()
        conn.close()
        
        if row:
            columns = [
                'id', 'participant_id', 'session_id', 'start_time', 'end_time',
                'final_accuracy', 'final_loss', 'final_precision', 'final_recall',
                'final_brain_health', 'final_neural_energy', 'final_score',
                'final_combo', 'completion_time', 'total_actions', 'correct_actions',
                'wrong_actions', 'events_solved'
            ]
            return dict(zip(columns, row))
        return {}
    
    def get_all_interactions(self, session_id: str) -> list:
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, session_id, action_type, target_node, energy_allocated,
                   event_type, timestamp, accuracy_before, loss_before,
                   precision_before, recall_before, brain_health_before,
                   neural_energy_before, accuracy_after, loss_after,
                   precision_after, recall_after, brain_health_after,
                   neural_energy_after, reaction_time, decision_time,
                   time_remaining, combo, level, is_success, event_solved
            FROM interactions WHERE session_id = ?
        """, (session_id,))
        rows = cursor.fetchall()
        conn.close()
        
        columns = [
            'id', 'session_id', 'action_type', 'target_node', 'energy_allocated',
            'event_type', 'timestamp', 'accuracy_before', 'loss_before',
            'precision_before', 'recall_before', 'brain_health_before',
            'neural_energy_before', 'accuracy_after', 'loss_after',
            'precision_after', 'recall_after', 'brain_health_after',
            'neural_energy_after', 'reaction_time', 'decision_time',
            'time_remaining', 'combo', 'level', 'is_success', 'event_solved'
        ]
        return [dict(zip(columns, row)) for row in rows]
