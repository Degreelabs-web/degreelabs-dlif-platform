import json
from pathlib import Path
from typing import Any, Dict, List, Optional


class DiscoverCurriculumService:
    _cached_data: Optional[Dict[str, Any]] = None

    @classmethod
    def get_curriculum_path(cls) -> Path:
        # Resolve from repository root / data / discover_program_curriculum.json
        current = Path(__file__).resolve()
        for parent in current.parents:
            candidate = parent / "data" / "discover_program_curriculum.json"
            if candidate.is_file():
                return candidate
        return Path("data/discover_program_curriculum.json")

    @classmethod
    def load_curriculum(cls) -> Dict[str, Any]:
        if cls._cached_data is not None:
            return cls._cached_data

        path = cls.get_curriculum_path()
        if path.is_file():
            try:
                with open(path, "r", encoding="utf-8") as f:
                    cls._cached_data = json.load(f)
                    return cls._cached_data
            except Exception as e:
                # Log or fallback if corrupted
                pass

        # Fallback minimal schema if file missing
        return {
            "program": "DegreeLabs Impact Fellowship (DLIF)",
            "phase": "Discover",
            "total_weeks": 4,
            "total_sessions": 12,
            "weeks": [],
            "capabilities": [],
        }

    @classmethod
    def get_week_definition(cls, week_number: int) -> Optional[Dict[str, Any]]:
        curriculum = cls.load_curriculum()
        for w in curriculum.get("weeks", []):
            if w.get("week_number") == week_number:
                return w
        return None

    @classmethod
    def get_session_definition(cls, session_number: int) -> Optional[Dict[str, Any]]:
        curriculum = cls.load_curriculum()
        for w in curriculum.get("weeks", []):
            for s in w.get("sessions", []):
                if s.get("session_number") == session_number:
                    # Enrich with week metadata
                    item = dict(s)
                    item["week_number"] = w.get("week_number")
                    item["week_title"] = w.get("title")
                    return item
        return None

    @classmethod
    def list_all_sessions(cls) -> List[Dict[str, Any]]:
        curriculum = cls.load_curriculum()
        sessions = []
        for w in curriculum.get("weeks", []):
            for s in w.get("sessions", []):
                item = dict(s)
                item["week_number"] = w.get("week_number")
                item["week_title"] = w.get("title")
                sessions.append(item)
        return sessions
