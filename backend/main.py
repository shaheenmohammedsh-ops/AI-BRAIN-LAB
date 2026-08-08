from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
from io import BytesIO
import uuid
import pandas as pd
from datetime import datetime
import xlsxwriter
from models import Database, Interaction
from simulation import get_simulation

app = FastAPI(title="Neural Shield AI Learning Simulator")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

db = Database()
simulation = get_simulation()


def simulation_state_snapshot(state):
    return {
        "accuracy": state.accuracy,
        "loss": state.loss,
        "precision": state.precision,
        "recall": state.recall,
        "brain_health": state.brain_health,
        "neural_energy": state.neural_energy,
        "current_event": state.current_event,
        "events_solved": state.events_solved,
        "total_events": state.total_events,
        "current_level": state.current_level,
        "time_remaining": state.time_remaining,
        "score": state.score,
        "combo": state.combo,
        "game_status": state.game_status,
    }


def record_interaction_from_states(session_id, action_type, target_node, energy_allocated, state_before, state_after):
    event_solved = 1 if state_after.events_solved > state_before.events_solved else 0
    accuracy_changed = state_after.accuracy != state_before.accuracy
    is_success = 1 if accuracy_changed and state_after.accuracy > state_before.accuracy else 0

    interaction = Interaction(
        session_id=session_id,
        action_type=action_type,
        target_node=target_node,
        energy_allocated=energy_allocated,
        event_type=state_after.current_event,
        accuracy_before=state_before.accuracy,
        loss_before=state_before.loss,
        precision_before=state_before.precision,
        recall_before=state_before.recall,
        brain_health_before=state_before.brain_health,
        neural_energy_before=state_before.neural_energy,
        accuracy_after=state_after.accuracy,
        loss_after=state_after.loss,
        precision_after=state_after.precision,
        recall_after=state_after.recall,
        brain_health_after=state_after.brain_health,
        neural_energy_after=state_after.neural_energy,
        time_remaining=state_after.time_remaining,
        combo=state_after.combo,
        level=state_after.current_level,
        is_success=is_success,
        event_solved=event_solved
    )
    db.record_interaction(interaction)

class StartSessionRequest(BaseModel):
    participant_id: Optional[str] = None
    challenge_type: Optional[str] = None
    challenge_order: Optional[int] = None

class ActionRequest(BaseModel):
    session_id: str
    action_type: str
    target_node: Optional[str] = None
    energy_allocated: Optional[float] = None
    source_node: Optional[str] = None
    target_node_connect: Optional[str] = None

class GameActionRequest(BaseModel):
    session_id: str
    action_type: str
    target_event: Optional[str] = None

class SelectProblemRequest(BaseModel):
    session_id: str
    problem_id: str

class FinishSessionRequest(BaseModel):
    session_id: str
    result: Optional[str] = None
    challenge_type: Optional[str] = None
    challenge_order: Optional[int] = None

@app.post("/start-session")
async def start_session(request: StartSessionRequest):
    try:
        session_id = str(uuid.uuid4())
        participant_id = db.create_participant(session_id)
        session_db_id = db.create_session(participant_id, session_id, request.challenge_type, request.challenge_order)

        state = simulation.initialize_session(session_id)

        return {
            "session_id": session_id,
            "participant_id": participant_id,
            "session_db_id": session_db_id,
            "message": "Session started successfully",
            "state": {
                "accuracy": state.accuracy,
                "loss": state.loss,
                "precision": state.precision,
                "recall": state.recall,
                "brain_health": state.brain_health,
                "neural_energy": state.neural_energy,
                "current_event": state.current_event,
                "active_events": state.active_events,
                "problem_states": state.problem_states,
                "events_solved": state.events_solved,
                "total_events": state.total_events,
                "nodes": simulation.get_nodes(),
                "current_level": state.current_level,
                "time_remaining": state.time_remaining,
                "score": state.score,
                "combo": state.combo,
                "game_status": state.game_status,
                "end_reason": state.end_reason
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/apply-action")
async def apply_action(request: ActionRequest):
    try:
        state_before = simulation.get_current_state()
        state = state_before
        
        if request.action_type == "allocate_energy":
            if request.target_node and request.energy_allocated:
                state = simulation.allocate_energy(request.target_node, request.energy_allocated)
        elif request.action_type == "connect_nodes":
            if request.source_node and request.target_node_connect:
                state = simulation.connect_nodes(request.source_node, request.target_node_connect)
        elif request.action_type == "disconnect_nodes":
            if request.source_node and request.target_node_connect:
                state = simulation.disconnect_nodes(request.source_node, request.target_node_connect)
        elif request.action_type == "solve_event":
            state = simulation.solve_event()
        elif request.action_type == "inspect_node":
            if request.target_node:
                node_info = simulation.inspect_node(request.target_node)
                return {
                    "state": {
                        "accuracy": state.accuracy,
                        "loss": state.loss,
                        "precision": state.precision,
                        "recall": state.recall,
                        "brain_health": state.brain_health,
                        "neural_energy": state.neural_energy,
                        "current_event": state.current_event,
                        "events_solved": state.events_solved,
                        "total_events": state.total_events,
                        "nodes": simulation.get_nodes(),
                        "current_level": state.current_level,
                        "time_remaining": state.time_remaining,
                        "score": state.score,
                        "combo": state.combo,
                        "game_status": state.game_status
                    },
                    "node_info": node_info
                }
        
        state_after = simulation.get_current_state()
        
        if request.action_type != "inspect_node":
            record_interaction_from_states(
                request.session_id,
                request.action_type,
                request.target_node,
                request.energy_allocated,
                state_before,
                state_after
            )
        
        return {
            "state": {
                "accuracy": state_after.accuracy,
                "loss": state_after.loss,
                "precision": state_after.precision,
                "recall": state_after.recall,
                "brain_health": state_after.brain_health,
                "neural_energy": state_after.neural_energy,
                "current_event": state_after.current_event,
                "active_events": state_after.active_events,
                "problem_states": state_after.problem_states,
                "events_solved": state_after.events_solved,
                "total_events": state_after.total_events,
                "nodes": simulation.get_nodes(),
                "current_level": state_after.current_level,
                "time_remaining": state_after.time_remaining,
                "score": state_after.score,
                "combo": state_after.combo,
                "game_status": state_after.game_status
            },
            "is_complete": simulation.is_complete()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/select-problem")
async def select_problem(request: SelectProblemRequest):
    try:
        state_after = simulation.select_problem(request.problem_id)
        
        return {
            "state": {
                "accuracy": state_after.accuracy,
                "loss": state_after.loss,
                "precision": state_after.precision,
                "recall": state_after.recall,
                "brain_health": state_after.brain_health,
                "neural_energy": state_after.neural_energy,
                "current_event": state_after.current_event,
                "active_events": state_after.active_events,
                "problem_states": state_after.problem_states,
                "events_solved": state_after.events_solved,
                "total_events": state_after.total_events,
                "nodes": simulation.get_nodes(),
                "current_level": state_after.current_level,
                "time_remaining": state_after.time_remaining,
                "score": state_after.score,
                "combo": state_after.combo,
                "game_status": state_after.game_status
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/apply-game-action")
async def apply_game_action(request: GameActionRequest):
    try:
        state_before = simulation.get_current_state()
        state_after = simulation.apply_game_action(request.action_type, request.target_event)
        
        record_interaction_from_states(
            request.session_id,
            request.action_type,
            request.target_event,
            None,
            state_before,
            state_after
        )
        
        return {
            "state": {
                "accuracy": state_after.accuracy,
                "loss": state_after.loss,
                "precision": state_after.precision,
                "recall": state_after.recall,
                "brain_health": state_after.brain_health,
                "neural_energy": state_after.neural_energy,
                "current_event": state_after.current_event,
                "active_events": state_after.active_events,
                "events_solved": state_after.events_solved,
                "total_events": state_after.total_events,
                "nodes": simulation.get_nodes(),
                "current_level": state_after.current_level,
                "time_remaining": state_after.time_remaining,
                "score": state_after.score,
                "combo": state_after.combo,
                "game_status": state_after.game_status
            },
            "is_complete": simulation.is_complete()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/advance-time")
async def advance_time(request: GameActionRequest):
    try:
        state_before = simulation.get_current_state()
        seconds = int(request.action_type) if request.action_type.isdigit() else 1
        state_after = simulation.advance_time(seconds)
        
        record_interaction_from_states(
            request.session_id,
            "advance_time",
            None,
            float(seconds),
            state_before,
            state_after
        )
        
        return {
            "state": {
                "accuracy": state_after.accuracy,
                "loss": state_after.loss,
                "precision": state_after.precision,
                "recall": state_after.recall,
                "brain_health": state_after.brain_health,
                "neural_energy": state_after.neural_energy,
                "current_event": state_after.current_event,
                "active_events": state_after.active_events,
                "problem_states": state_after.problem_states,
                "events_solved": state_after.events_solved,
                "total_events": state_after.total_events,
                "nodes": simulation.get_nodes(),
                "current_level": state_after.current_level,
                "time_remaining": state_after.time_remaining,
                "score": state_after.score,
                "combo": state_after.combo,
                "game_status": state_after.game_status
            },
            "is_complete": simulation.is_complete()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/finish-session")
async def finish_session(request: FinishSessionRequest):
    try:
        state = simulation.get_current_state()
        
        # CRITICAL: Use simulation session start time, not database creation time
        session_start_time = state.session_start_time
        if not session_start_time:
            # Fallback to database if simulation doesn't have it
            session_data = db.get_session_results(request.session_id)
            if session_data.get('start_time'):
                session_start_time = session_data.get('start_time')
                if isinstance(session_start_time, str):
                    session_start_time = datetime.fromisoformat(session_start_time)
        
        end_time = datetime.now()
        
        # Calculate completion time in seconds
        if session_start_time:
            completion_time = (end_time - session_start_time).total_seconds()
            # Sanity check: duration should be reasonable (not hours for a short game)
            if completion_time < 0:
                completion_time = 0
            elif completion_time > 3600:  # More than 1 hour is suspicious
                print(f"WARNING: Suspicious completion time: {completion_time} seconds")
                completion_time = min(completion_time, 3600)
        else:
            completion_time = 0
        
        interactions = db.get_all_interactions(request.session_id)
        total_actions = len(interactions)
        correct_actions = sum(int(i.get('event_solved', 0) or 0) for i in interactions)
        wrong_actions = total_actions - correct_actions
        
        # CRITICAL: Determine result based on actual terminal condition
        # Priority: 1) Explicit result from request, 2) Simulation's end_reason, 3) Calculate from state
        if request.result:
            result = request.result
        elif state.end_reason:
            result = state.end_reason
        else:
            # Calculate from actual state
            if state.accuracy >= 0.90:
                result = "target_reached"
            elif state.time_remaining <= 0:
                result = "time_expired"
            elif state.neural_energy <= 0:
                result = "energy_depleted"
            else:
                # Fallback - should not happen if game ended properly
                result = "manual"
        
        final_metrics = {
            "accuracy": state.accuracy,
            "loss": state.loss,
            "precision": state.precision,
            "recall": state.recall,
            "brain_health": state.brain_health,
            "neural_energy": state.neural_energy,
            "events_solved": state.events_solved,
            "current_level": state.current_level,
            "time_remaining": state.time_remaining,
            "score": state.score,
            "combo": state.combo,
            "game_status": state.game_status,
            "end_reason": state.end_reason,
            "completion_time": completion_time,
            "total_actions": total_actions,
            "correct_actions": correct_actions,
            "wrong_actions": wrong_actions,
            "challenge_type": request.challenge_type,
            "challenge_order": request.challenge_order,
            "result": result,
            "session_start_time": session_start_time
        }
        
        db.update_session(request.session_id, final_metrics)
        
        return {
            "session_id": request.session_id,
            "final_metrics": final_metrics
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/results")
async def get_results(session_id: str):
    try:
        session_data = db.get_session_results(session_id)
        if not session_data:
            raise HTTPException(status_code=404, detail="Session not found")
        interactions = db.get_all_interactions(session_id)
        
        return {
            "session": session_data,
            "interactions": interactions
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/export/session-xlsx")
async def export_session_xlsx(session_id: str):
    try:
        # Data validation
        session_data = db.get_session_results(session_id)
        if not session_data:
            raise HTTPException(status_code=404, detail="Session not found")
        
        interactions = db.get_all_interactions(session_id)
        if not interactions:
            raise HTTPException(status_code=404, detail="No interactions found for session")

        # Validate session data
        if not session_data.get('session_id'):
            raise HTTPException(status_code=400, detail="Invalid session data: missing session_id")
        if not session_data.get('participant_id'):
            raise HTTPException(status_code=400, detail="Invalid session data: missing participant_id")

        # CRITICAL: Validate all numeric values before export
        # These validations match the Results Screen display logic
        
        # Accuracy: 0.0 to 1.0 (representing 0% to 100%)
        final_accuracy = session_data.get('final_accuracy', 0)
        if not (0.0 <= final_accuracy <= 1.0):
            print(f"WARNING: Invalid final_accuracy in XLSX export: {final_accuracy}")
            final_accuracy = max(0.0, min(1.0, final_accuracy))
        
        # Precision: 0.0 to 1.0
        final_precision = session_data.get('final_precision', 0)
        if not (0.0 <= final_precision <= 1.0):
            print(f"WARNING: Invalid final_precision in XLSX export: {final_precision}")
            final_precision = max(0.0, min(1.0, final_precision))
        
        # Recall: 0.0 to 1.0
        final_recall = session_data.get('final_recall', 0)
        if not (0.0 <= final_recall <= 1.0):
            print(f"WARNING: Invalid final_recall in XLSX export: {final_recall}")
            final_recall = max(0.0, min(1.0, final_recall))
        
        # Brain Health: 0 to 100
        final_brain_health = session_data.get('final_brain_health', 0)
        if not (0.0 <= final_brain_health <= 100.0):
            print(f"WARNING: Invalid final_brain_health in XLSX export: {final_brain_health}")
            final_brain_health = max(0.0, min(100.0, final_brain_health))
        
        # Completion Time: 0 to 180 seconds
        completion_time = session_data.get('completion_time', 0)
        if completion_time < 0 or completion_time > 180:
            print(f"WARNING: Invalid completion_time in XLSX export: {completion_time}")
            completion_time = max(0.0, min(180.0, completion_time))
        
        # Energy: 0 to initial (100)
        final_neural_energy = session_data.get('final_neural_energy', 0)
        if not (0.0 <= final_neural_energy <= 200.0):
            print(f"WARNING: Invalid final_neural_energy in XLSX export: {final_neural_energy}")
            final_neural_energy = max(0.0, min(200.0, final_neural_energy))
        
        # Score: non-negative
        final_score = session_data.get('final_score', 0)
        if final_score < 0:
            print(f"WARNING: Invalid final_score in XLSX export: {final_score}")
            final_score = max(0, final_score)
        
        # Problems Solved: 0 to 7
        events_solved = session_data.get('events_solved', 0)
        if not (0 <= events_solved <= 7):
            print(f"WARNING: Invalid events_solved in XLSX export: {events_solved}")
            events_solved = max(0, min(7, events_solved))
        
        # Validate outcome consistency with accuracy
        result = session_data.get('result', 'manual')
        if result == 'target_reached' and final_accuracy < 0.90:
            print(f"WARNING: Outcome mismatch: result={result} but accuracy={final_accuracy}")
            # Do not auto-correct - let the inconsistency be visible for debugging
        
        # Validate interactions belong to this session
        for interaction in interactions:
            if interaction.get('session_id') != session_id:
                raise HTTPException(status_code=400, detail="Interaction does not belong to this session")

        buffer = BytesIO()
        workbook = xlsxwriter.Workbook(buffer, {'in_memory': True, 'password': '2026'})

        workbook.set_properties({
            'title': 'AI Brain Lab — Session Research Report',
            'subject': 'AI Training Simulation Research Data',
            'author': 'AI Brain Lab Research',
            'category': 'Research Data',
            'comments': 'Password protected research data - Session ID: ' + session_id
        })

        # Professional formats
        title_format = workbook.add_format({
            'bold': True,
            'font_size': 14,
            'font_color': '#0a0e1a',
            'bg_color': '#f1f5f9'
        })
        
        section_header_format = workbook.add_format({
            'bold': True,
            'font_size': 12,
            'font_color': '#0ea5e9',
            'bg_color': '#f8fafc'
        })
        
        header_format = workbook.add_format({
            'bold': True,
            'bg_color': '#1e293b',
            'font_color': '#ffffff',
            'font_size': 10,
            'border': 1,
            'border_color': '#475569',
            'text_wrap': True
        })
        
        data_format = workbook.add_format({
            'font_size': 10,
            'border': 1,
            'border_color': '#e2e8f0',
            'text_wrap': True
        })
        
        # CRITICAL: Percent format expects decimal (0.5 = 50%), not percentage (50 = 5000%)
        percent_format = workbook.add_format({
            'num_format': '0.0%',
            'font_size': 10,
            'border': 1,
            'border_color': '#e2e8f0'
        })
        
        integer_format = workbook.add_format({
            'num_format': '0',
            'font_size': 10,
            'border': 1,
            'border_color': '#e2e8f0'
        })
        
        number_format = workbook.add_format({
            'num_format': '0.00',
            'font_size': 10,
            'border': 1,
            'border_color': '#e2e8f0'
        })
        
        date_format = workbook.add_format({
            'num_format': 'yyyy-mm-dd hh:mm:ss',
            'font_size': 10,
            'border': 1,
            'border_color': '#e2e8f0'
        })
        
        success_format = workbook.add_format({
            'font_size': 10,
            'bg_color': '#d1fae5',
            'font_color': '#065f46',
            'border': 1,
            'border_color': '#e2e8f0'
        })
        
        warning_format = workbook.add_format({
            'font_size': 10,
            'bg_color': '#fef3c7',
            'font_color': '#92400e',
            'border': 1,
            'border_color': '#e2e8f0'
        })
        
        error_format = workbook.add_format({
            'font_size': 10,
            'bg_color': '#fee2e2',
            'font_color': '#991b1b',
            'border': 1,
            'border_color': '#e2e8f0'
        })

        # SHEET 1: Research Summary
        summary_sheet = workbook.add_worksheet('Research Summary')
        summary_sheet.set_column('A:A', 25)
        summary_sheet.set_column('B:B', 35)
        summary_sheet.set_column('C:C', 20)
        
        summary_sheet.write('A1', 'AI Brain Lab — Session Research Report', title_format)
        summary_sheet.write('A2', '', data_format)
        
        # Session Information
        summary_sheet.write('A3', 'Session Information', section_header_format)
        summary_sheet.write('A4', 'Participant ID', data_format)
        summary_sheet.write('B4', session_data.get('participant_id'), data_format)
        summary_sheet.write('A5', 'Session ID', data_format)
        summary_sheet.write('B5', session_data.get('session_id'), data_format)
        summary_sheet.write('A6', 'Challenge Type', data_format)
        summary_sheet.write('B6', session_data.get('challenge_type', 'N/A'), data_format)
        summary_sheet.write('A7', 'Challenge Order', data_format)
        summary_sheet.write('B7', session_data.get('challenge_order', 'N/A'), integer_format)
        summary_sheet.write('A8', 'Date', data_format)
        summary_sheet.write('B8', session_data.get('start_time', 'N/A')[:10] if session_data.get('start_time') else 'N/A', data_format)
        summary_sheet.write('A9', 'Start Time', data_format)
        summary_sheet.write('B9', session_data.get('start_time', 'N/A'), date_format)
        summary_sheet.write('A10', 'End Time', data_format)
        summary_sheet.write('B10', session_data.get('end_time', 'N/A'), date_format)
        summary_sheet.write('A11', 'Total Duration (seconds)', data_format)
        summary_sheet.write('B11', completion_time, number_format)
        
        summary_sheet.write('A12', '', data_format)
        
        # Performance
        summary_sheet.write('A13', 'Performance', section_header_format)
        
        # CRITICAL: Use validated values from above, not session_data directly
        # This ensures XLSX matches Results Screen exactly
        summary_sheet.write('A14', 'Final Accuracy', data_format)
        summary_sheet.write('B14', final_accuracy, percent_format)
        summary_sheet.write('C14', 'Target: 90%', data_format)
        
        # CRITICAL: Brain Health is stored as 0-100 (percentage), convert to decimal for percent_format
        summary_sheet.write('A15', 'Final Brain Health', data_format)
        summary_sheet.write('B15', final_brain_health  if final_brain_health > 0 else 0, percent_format)
        
        summary_sheet.write('A16', 'Final Energy', data_format)
        summary_sheet.write('B16', final_neural_energy, integer_format)
        
        summary_sheet.write('A17', 'Final Score', data_format)
        summary_sheet.write('B17', final_score, integer_format)
        
        summary_sheet.write('A18', '', data_format)
        
        # Decision Performance
        summary_sheet.write('A19', 'Decision Performance', section_header_format)
        total_actions = session_data.get('total_actions', 0)
        correct_actions = session_data.get('correct_actions', 0)
        wrong_actions = session_data.get('wrong_actions', 0)
        success_rate = (correct_actions / total_actions * 100) if total_actions > 0 else 0
        
        # CRITICAL: Use validated variables instead of session_data directly
        # This ensures XLSX matches Results Screen exactly
        summary_sheet.write('A20', 'Total Actions', data_format)
        summary_sheet.write('B20', total_actions, integer_format)
        
        summary_sheet.write('A21', 'Correct Actions', data_format)
        summary_sheet.write('B21', correct_actions, integer_format)
        
        summary_sheet.write('A22', 'Incorrect Actions', data_format)
        summary_sheet.write('B22', wrong_actions, integer_format)
        
        summary_sheet.write('A23', 'Success Rate', data_format)
        summary_sheet.write('B23', success_rate / 100, percent_format)
        
        summary_sheet.write('A24', '', data_format)
        
        # Events
        summary_sheet.write('A25', 'Events', section_header_format)
        total_events = len([i for i in interactions if i.get('event_type')])
        events_ignored = total_events - events_solved
        event_success_rate = (events_solved / total_events * 100) if total_events > 0 else 0
        
        summary_sheet.write('A26', 'Total Events', data_format)
        summary_sheet.write('B26', total_events, integer_format)
        
        summary_sheet.write('A27', 'Events Solved', data_format)
        summary_sheet.write('B27', events_solved, integer_format)
        
        summary_sheet.write('A28', 'Events Ignored', data_format)
        summary_sheet.write('B28', events_ignored, integer_format)
        
        summary_sheet.write('A29', 'Event Success Rate', data_format)
        summary_sheet.write('B29', event_success_rate / 100, percent_format)
        
        summary_sheet.write('A30', '', data_format)
        
        # Outcome
        summary_sheet.write('A31', 'Outcome', section_header_format)
        # CRITICAL: Use backend result, not recalculate from accuracy
        # This ensures XLSX matches Results Screen exactly
        challenge_result = 'Completed' if result == 'target_reached' else 'Failed'
        result_format = success_format if challenge_result == 'Completed' else error_format
        
        summary_sheet.write('A32', 'Challenge Result', data_format)
        summary_sheet.write('B32', challenge_result, result_format)
        
        summary_sheet.freeze_panes(3, 0)

        # SHEET 2: Challenge Summary
        challenge_sheet = workbook.add_worksheet('Challenge Summary')
        challenge_sheet.set_column('A:A', 15)
        challenge_sheet.set_column('B:B', 12)
        challenge_sheet.set_column('C:C', 8)
        challenge_sheet.set_column('D:L', 14)
        
        challenge_headers = [
            'Challenge', 'Difficulty', 'Order', 'Start Time', 'End Time',
            'Duration (seconds)', 'Starting Accuracy', 'Final Accuracy',
            'Accuracy Change', 'Starting Brain Health', 'Final Brain Health',
            'Brain Health Change', 'Starting Energy', 'Final Energy',
            'Energy Used', 'Score', 'Total Actions', 'Correct Actions',
            'Wrong Actions', 'Success Rate', 'Result'
        ]
        
        for col_index, header in enumerate(challenge_headers):
            challenge_sheet.write(0, col_index, header, header_format)
        
        # Calculate challenge-specific data
        challenge_type = session_data.get('challenge_type', 'N/A')
        challenge_order = session_data.get('challenge_order', 1)
        start_time = session_data.get('start_time', 'N/A')
        end_time = session_data.get('end_time', 'N/A')
        duration = completion_time  # Use validated value
        
        # Get initial state from first interaction
        starting_accuracy = interactions[0].get('accuracy_before', 0) if interactions else 0
        starting_health = interactions[0].get('brain_health_before', 0) if interactions else 0
        starting_energy = interactions[0].get('neural_energy_before', 0) if interactions else 0
        
        accuracy_change = final_accuracy - starting_accuracy
        health_change = final_brain_health - starting_health
        energy_used = starting_energy - final_neural_energy
        
        challenge_success_rate = success_rate / 100
        # CRITICAL: Use backend result, not recalculate from accuracy
        challenge_result = 'Completed' if result == 'target_reached' else 'Failed'
        
        challenge_data = [
            challenge_type,
            challenge_type,
            challenge_order,
            start_time,
            end_time,
            duration,
            starting_accuracy,
            final_accuracy,
            accuracy_change,
            starting_health,
            final_brain_health,
            health_change,
            starting_energy,
            final_neural_energy,
            energy_used,
            final_score,
            total_actions,
            correct_actions,
            wrong_actions,
            challenge_success_rate,
            challenge_result
        ]
        
        for col_index, value in enumerate(challenge_data):
            if col_index in [6, 7]:  # Accuracy columns - stored as 0.0-1.0
                challenge_sheet.write(1, col_index, value, percent_format)
            elif col_index in [9, 10]:  # Brain Health columns - stored as 0-100, convert to decimal
                challenge_sheet.write(1, col_index, value / 100.0 if value > 0 else 0, percent_format)
            elif col_index in [5, 12, 13, 14, 15, 16, 17, 18]:  # Integer columns
                challenge_sheet.write(1, col_index, value, integer_format)
            elif col_index in [8, 11]:  # Change columns
                challenge_sheet.write(1, col_index, value, number_format)
            elif col_index == 19:  # Success rate
                challenge_sheet.write(1, col_index, value, percent_format)
            elif col_index == 20:  # Result
                cell_format = success_format if value == 'Completed' else error_format
                challenge_sheet.write(1, col_index, value, cell_format)
            else:
                challenge_sheet.write(1, col_index, value, data_format)
        
        challenge_sheet.freeze_panes(1, 0)

        # SHEET 3: Action Log
        action_sheet = workbook.add_worksheet('Action Log')
        action_headers = [
            'Timestamp', 'Challenge', 'Action', 'Problem', 'Action Result',
            'Accuracy Before', 'Accuracy After', 'Accuracy Change',
            'Brain Health Before', 'Brain Health After', 'Energy Before',
            'Energy After', 'Score Change', 'Reaction Time (ms)',
            'Decision Time (ms)'
        ]
        
        for col_index, header in enumerate(action_headers):
            action_sheet.write(0, col_index, header, header_format)
            action_sheet.set_column(col_index, col_index, 16)
        
        for row_index, interaction in enumerate(interactions, start=1):
            timestamp = interaction.get('timestamp', 'N/A')
            action_type = interaction.get('action_type', 'N/A')
            event_type = interaction.get('event_type', 'N/A')
            is_success = interaction.get('is_success', 0)
            
            acc_before = interaction.get('accuracy_before', 0)
            acc_after = interaction.get('accuracy_after', 0)
            acc_change = acc_after - acc_before
            
            health_before = interaction.get('brain_health_before', 0)
            health_after = interaction.get('brain_health_after', 0)
            
            energy_before = interaction.get('neural_energy_before', 0)
            energy_after = interaction.get('neural_energy_after', 0)
            
            action_sheet.write(row_index, 0, timestamp, date_format)
            action_sheet.write(row_index, 1, challenge_type, data_format)
            action_sheet.write(row_index, 2, action_type, data_format)
            action_sheet.write(row_index, 3, event_type, data_format)
            action_sheet.write(row_index, 4, 'Success' if is_success == 1 else 'Failed', 
                          success_format if is_success == 1 else error_format)
            # CRITICAL: Accuracy stored as 0.0-1.0, percent_format expects decimal
            action_sheet.write(row_index, 5, acc_before, percent_format)
            action_sheet.write(row_index, 6, acc_after, percent_format)
            action_sheet.write(row_index, 7, acc_change, number_format)
            # CRITICAL: Brain Health stored as 0-100, convert to decimal for percent_format
            action_sheet.write(row_index, 8, health_before / 100.0 if health_before > 0 else 0, percent_format)
            action_sheet.write(row_index, 9, health_after / 100.0 if health_after > 0 else 0, percent_format)
            action_sheet.write(row_index, 10, energy_before, integer_format)
            action_sheet.write(row_index, 11, energy_after, integer_format)
            action_sheet.write(row_index, 12, interaction.get('level', 0), integer_format)
            action_sheet.write(row_index, 13, 'N/A', data_format)  # Reaction time not tracked
            action_sheet.write(row_index, 14, 'N/A', data_format)  # Decision time not tracked
        
        action_sheet.freeze_panes(1, 0)

        # SHEET 4: Event Log
        event_sheet = workbook.add_worksheet('Event Log')
        event_headers = [
            'Timestamp', 'Challenge', 'Event', 'Problem Type', 'Difficulty',
            'Player Response', 'Correct / Incorrect', 'Time to Response',
            'Accuracy Before', 'Accuracy After', 'Brain Health Before',
            'Brain Health After', 'Event Result'
        ]
        
        for col_index, header in enumerate(event_headers):
            event_sheet.write(0, col_index, header, header_format)
            event_sheet.set_column(col_index, col_index, 16)
        
        event_row = 1
        for interaction in interactions:
            event_type = interaction.get('event_type')
            if event_type:  # Only record actual events
                timestamp = interaction.get('timestamp', 'N/A')
                action_type = interaction.get('action_type', 'N/A')
                is_success = interaction.get('is_success', 0)
                event_solved = interaction.get('event_solved', 0)
                
                event_sheet.write(event_row, 0, timestamp, date_format)
                event_sheet.write(event_row, 1, challenge_type, data_format)
                event_sheet.write(event_row, 2, event_type, data_format)
                event_sheet.write(event_row, 3, event_type, data_format)
                event_sheet.write(event_row, 4, challenge_type, data_format)
                event_sheet.write(event_row, 5, action_type, data_format)
                event_sheet.write(event_row, 6, 'Correct' if is_success == 1 else 'Incorrect',
                              success_format if is_success == 1 else error_format)
                event_sheet.write(event_row, 7, 'N/A', data_format)  # Time to response not tracked
                # CRITICAL: Accuracy stored as 0.0-1.0, percent_format expects decimal
                event_sheet.write(event_row, 8, interaction.get('accuracy_before', 0), percent_format)
                event_sheet.write(event_row, 9, interaction.get('accuracy_after', 0), percent_format)
                # CRITICAL: Brain Health stored as 0-100, convert to decimal for percent_format
                event_sheet.write(event_row, 10, interaction.get('brain_health_before', 0) / 100.0 if interaction.get('brain_health_before', 0) > 0 else 0, percent_format)
                event_sheet.write(event_row, 11, interaction.get('brain_health_after', 0) / 100.0 if interaction.get('brain_health_after', 0) > 0 else 0, percent_format)
                event_sheet.write(event_row, 12, 'Solved' if event_solved == 1 else 'Unsolved',
                              success_format if event_solved == 1 else warning_format)
                event_row += 1
        
        event_sheet.freeze_panes(1, 0)

        # SHEET 5: Research Metrics
        metrics_sheet = workbook.add_worksheet('Research Metrics')
        metrics_sheet.set_column('A:A', 20)
        metrics_sheet.set_column('B:D', 15)
        
        metrics_headers = ['Metric', 'Mean', 'Minimum', 'Maximum']
        for col_index, header in enumerate(metrics_headers):
            metrics_sheet.write(0, col_index, header, header_format)
        
        # Calculate real statistics from actual data
        accuracies = [i.get('accuracy_after', 0) for i in interactions if i.get('accuracy_after') is not None]
        healths = [i.get('brain_health_after', 0) for i in interactions if i.get('brain_health_after') is not None]
        energies = [i.get('neural_energy_after', 0) for i in interactions if i.get('neural_energy_after') is not None]
        scores = [i.get('level', 0) for i in interactions if i.get('level') is not None]
        
        metrics_data = [
            ['Accuracy', accuracies, percent_format],
            ['Brain Health', healths, percent_format],
            ['Energy', energies, integer_format],
            ['Score', scores, integer_format]
        ]
        
        row = 1
        for metric_name, values, format_type in metrics_data:
            if values:
                metrics_sheet.write(row, 0, metric_name, data_format)
                metrics_sheet.write(row, 1, sum(values) / len(values), format_type)
                metrics_sheet.write(row, 2, min(values), format_type)
                metrics_sheet.write(row, 3, max(values), format_type)
            row += 1
        
        # Add decision statistics
        metrics_sheet.write(row, 0, 'Correct Decisions', data_format)
        metrics_sheet.write(row, 1, correct_actions, integer_format)
        metrics_sheet.write(row, 2, correct_actions, integer_format)
        metrics_sheet.write(row, 3, correct_actions, integer_format)
        row += 1
        
        metrics_sheet.write(row, 0, 'Incorrect Decisions', data_format)
        metrics_sheet.write(row, 1, wrong_actions, integer_format)
        metrics_sheet.write(row, 2, wrong_actions, integer_format)
        metrics_sheet.write(row, 3, wrong_actions, integer_format)
        row += 1
        
        metrics_sheet.write(row, 0, 'Events Solved', data_format)
        metrics_sheet.write(row, 1, events_solved, integer_format)
        metrics_sheet.write(row, 2, events_solved, integer_format)
        metrics_sheet.write(row, 3, events_solved, integer_format)
        row += 1
        
        metrics_sheet.write(row, 0, 'Events Ignored', data_format)
        metrics_sheet.write(row, 1, events_ignored, integer_format)
        metrics_sheet.write(row, 2, events_ignored, integer_format)
        metrics_sheet.write(row, 3, events_ignored, integer_format)
        
        metrics_sheet.freeze_panes(1, 0)

        workbook.close()
        buffer.seek(0)

        return StreamingResponse(
            buffer,
            media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            headers={
                'Content-Disposition': f'attachment; filename=ai_brain_lab_session_{session_id}.xlsx'
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
