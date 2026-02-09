import json
import sys
import time

class Dash:
    def log(self, msg, level="info"):
        self._emit({"type": "log", "message": msg, "level": level, "timestamp": time.strftime("%H:%M:%S")})

    def stat(self, label, value, trend=None):
        self._emit({"type": "stat", "label": label, "value": value, "trend": trend})

    def pipeline(self, name, status, metric):
        self._emit({"type": "pipeline", "name": name, "status": status, "metric": metric})

    def _emit(self, data):
        # Print to stdout and flush immediately to ensure real-time streaming
        print(json.dumps(data), flush=True)

# Usage in your pipeline
# dash = Dash()
# dash.log("Starting Python Analysis...")
