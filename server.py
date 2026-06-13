from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit
import json, os

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

DATA_FILE = "stats.json"

def load():
    if not os.path.exists(DATA_FILE):
        return {
            "presses": 0,
            "visitors": 0,
            "goose": 0,
            "potato": 0,
            "pranks": 0
        }
    return json.load(open(DATA_FILE))

def save(data):
    json.dump(data, open(DATA_FILE, "w"))

# 🌍 send update to ALL clients
def broadcast():
    socketio.emit("stats_update", load())

@app.post("/api/press")
def press():
    data = load()
    data["presses"] += request.json.get("delta", 1)
    save(data)
    broadcast()
    return jsonify(ok=True)

@app.post("/api/visit")
def visit():
    data = load()
    data["visitors"] += 1
    save(data)
    broadcast()
    return jsonify(ok=True)

@app.post("/api/event")
def event():
    data = load()
    t = request.json.get("type")
    data[t] = data.get(t, 0) + request.json.get("delta", 1)
    save(data)
    broadcast()
    return jsonify(ok=True)

@app.get("/api/stats")
def stats():
    return jsonify(load())

# socket connection
@socketio.on("connect")
def connect():
    emit("stats_update", load())

socketio.run(app, host="0.0.0.0", port=5000)