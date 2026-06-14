from flask import Flask, request, jsonify, send_from_directory, abort
from flask_socketio import SocketIO, emit
import json
import os
from threading import Lock

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
app = Flask(__name__, static_folder=None)
socketio = SocketIO(app, cors_allowed_origins="*")

STATS_FILE = os.path.join(BASE_DIR, "stats.json")
LEADERBOARD_FILE = os.path.join(BASE_DIR, "leaderboard.json")
storage_lock = Lock()
EVENT_KEYS = {
    "gooses_released",
    "potatoes_detected",
    "pranks_triggered",
    "alien_contacts",
    "rickroll_victims",
    "achievement_unlocks",
}
PUBLIC_FILES = {
    "index.html",
    "achievements.html",
    "leaderboard.html",
    "stats.html",
    "script.js",
    "style.css",
    "version.json",
}


# -----------------------
# Stats Storage
# -----------------------
def load_stats():
    if not os.path.exists(STATS_FILE):
        return {
            "total_presses": 0,
            "total_visitors": 0,
            "gooses_released": 0,
            "potatoes_detected": 0,
            "pranks_triggered": 0,
            "alien_contacts": 0,
            "rickroll_victims": 0,
            "achievement_unlocks": 0
        }

    try:
        with open(STATS_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
    except (OSError, json.JSONDecodeError):
        data = {}

    # normalize old saves (important or your file stays broken forever)
    return {
        "total_presses": data.get("presses", data.get("total_presses", 0)),
        "total_visitors": data.get("visitors", data.get("total_visitors", 0)),
        "gooses_released": data.get("goose", data.get("gooses_released", 0)),
        "potatoes_detected": data.get("potato", data.get("potatoes_detected", 0)),
        "pranks_triggered": data.get("pranks", data.get("pranks_triggered", 0)),
        "alien_contacts": data.get("alien_contacts", 0),
        "rickroll_victims": data.get("rickroll_victims", 0),
        "achievement_unlocks": data.get("achievement_unlocks", 0),
    }


def save_stats(data):
    with open(STATS_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


# -----------------------
# Leaderboard Storage
# -----------------------

def load_leaderboard():
    if not os.path.exists(LEADERBOARD_FILE):
        return {}

    try:
        with open(LEADERBOARD_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except (OSError, json.JSONDecodeError):
        return {}


def save_leaderboard(data):
    with open(LEADERBOARD_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


# -----------------------
# Live Updates
# -----------------------

def broadcast():
    socketio.emit("stats_update", load_stats())


# -----------------------
# API
# -----------------------

@app.post("/api/press")
def press():
    payload = request.json or {}
    delta = payload.get("delta", 1)
    name = str(payload.get("name", "Anonymous")).strip()[:32] or "Anonymous"
    if not isinstance(delta, int) or isinstance(delta, bool) or not 1 <= delta <= 100:
        return jsonify(error="delta must be an integer from 1 to 100"), 400

    with storage_lock:
        stats = load_stats()
        stats["total_presses"] = stats.get("total_presses", 0) + delta
        save_stats(stats)

        leaderboard = load_leaderboard()
        if name not in leaderboard:
            leaderboard[name] = {"presses": 0, "achievements": 0}
        leaderboard[name]["presses"] += delta
        save_leaderboard(leaderboard)

    broadcast()

    return jsonify(ok=True)


@app.post("/api/visit")
def visit():
    with storage_lock:
        stats = load_stats()
        stats["total_visitors"] = stats.get("total_visitors", 0) + 1
        save_stats(stats)

    broadcast()

    return jsonify(ok=True)


@app.post("/api/event")
def event():
    payload = request.json or {}
    event_type = payload.get("type")
    delta = payload.get("delta", 1)
    if event_type not in EVENT_KEYS:
        return jsonify(error="unknown event type"), 400
    if not isinstance(delta, int) or isinstance(delta, bool) or not 1 <= delta <= 100:
        return jsonify(error="delta must be an integer from 1 to 100"), 400

    with storage_lock:
        stats = load_stats()
        stats[event_type] = stats.get(event_type, 0) + delta
        save_stats(stats)

    broadcast()

    return jsonify(ok=True)


@app.get("/api/stats")
def stats():
    return jsonify(load_stats())


# -----------------------
# Leaderboard Endpoint
# -----------------------

@app.get("/api/leaderboard")
def leaderboard():

    data = load_leaderboard()

    sorted_players = sorted(
        data.items(),
        key=lambda x: x[1]["presses"],
        reverse=True
    )

    result = []

    for name, info in sorted_players:
        result.append({
            "name": name,
            "presses": info["presses"],
            "achievements": info.get("achievements", 0)
        })

    return jsonify(result)


@app.get("/")
def index():
    return send_from_directory(BASE_DIR, "index.html")


@app.get("/<path:filename>")
def static_files(filename):
    if filename not in PUBLIC_FILES:
        abort(404)
    return send_from_directory(BASE_DIR, filename)


# -----------------------
# Socket.IO
# -----------------------

@socketio.on("connect")
def connect():
    emit("stats_update", load_stats())


# -----------------------
# Start Server
# -----------------------

if __name__ == "__main__":
    socketio.run(
        app,
        host="0.0.0.0",
        port=5000,
        allow_unsafe_werkzeug=True
    )
