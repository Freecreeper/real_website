from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit
import json
import os

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

STATS_FILE = "stats.json"
LEADERBOARD_FILE = "leaderboard.json"


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

    with open(STATS_FILE, "r") as f:
        data = json.load(f)

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
    with open(STATS_FILE, "w") as f:
        json.dump(data, f, indent=2)


# -----------------------
# Leaderboard Storage
# -----------------------

def load_leaderboard():
    if not os.path.exists(LEADERBOARD_FILE):
        return {}

    with open(LEADERBOARD_FILE, "r") as f:
        return json.load(f)


def save_leaderboard(data):
    with open(LEADERBOARD_FILE, "w") as f:
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

    stats = load_stats()

    payload = request.json or {}

    delta = payload.get("delta", 1)
    name = payload.get("name", "Anonymous")

    # global presses
    stats["total_presses"] = stats.get("total_presses", 0) + delta
    save_stats(stats)

    # leaderboard update
    leaderboard = load_leaderboard()

    if name not in leaderboard:
        leaderboard[name] = {
            "presses": 0,
            "achievements": 0
        }

    leaderboard[name]["presses"] += delta

    save_leaderboard(leaderboard)

    broadcast()

    return jsonify(ok=True)


@app.post("/api/visit")
def visit():

    stats = load_stats()

    stats["total_visitors"] = stats.get("total_visitors", 0) + 1

    save_stats(stats)

    broadcast()

    return jsonify(ok=True)


@app.post("/api/event")
def event():

    stats = load_stats()

    payload = request.json or {}

    event_type = payload.get("type")
    delta = payload.get("delta", 1)

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
        port=5000
    )