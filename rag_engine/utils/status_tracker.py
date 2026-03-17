import logging

logger = logging.getLogger(__name__)

class StatusTracker:
    _instance = None
    _status_map = {}

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(StatusTracker, cls).__new__(cls)
        return cls._instance

    def update_status(self, policy_id: str, status: str, progress: int = 0, message: str = ""):
        self._status_map[policy_id] = {
            "status": status,
            "progress": progress,
            "message": message
        }
        logger.info(f"Status update for {policy_id}: {status} ({progress}%) - {message}")

    def get_status(self, policy_id: str):
        return self._status_map.get(policy_id)

    def clear(self, policy_id: str):
        if policy_id in self._status_map:
            del self._status_map[policy_id]

status_tracker = StatusTracker()
