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
            "presses": 0,
            "visitors": 0,
            "goose": 0,
            "potato": 0,
            "pranks": 0
        }

    with open(STATS_FILE, "r") as f:
        return json.load(f)


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
    stats["presses"] += delta
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

    stats["visitors"] += 1

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