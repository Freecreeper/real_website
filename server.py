from flask import Flask, request, jsonify, send_from_directory, abort
from flask_socketio import SocketIO, emit
import json
import os
import random
from threading import Lock
from datetime import datetime, timezone, timedelta

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
app = Flask(__name__, static_folder=None)
socketio = SocketIO(app, cors_allowed_origins="*")

STATS_FILE = os.path.join(BASE_DIR, "stats.json")
LEADERBOARD_FILE = os.path.join(BASE_DIR, "leaderboard.json")
WORLD_FIRSTS_FILE = os.path.join(BASE_DIR, "world_firsts.json")
DAILY_GOAL_FILE = os.path.join(BASE_DIR, "daily_goal.json")
GLOBAL_MILESTONES_FILE = os.path.join(BASE_DIR, "global_milestones.json")
storage_lock = Lock()
STANDARD_ACHIEVEMENT_MILESTONES = (10, 25, 50, 100, 500, 1000)
WORLD_FIRST_INTERVAL = 5000
DAILY_GOAL_TARGET = 1000
MOON_SKIN_DROP_CHANCE = 0.05
GLOBAL_MILESTONE_DEFS = [
    {
        "id": "first-era",
        "threshold": 10000,
        "icon": "Moon",
        "title": "The Night Falls",
        "event": "The First Era has ended...",
        "active_hours": 24,
        "effects": ["Screen fades to black", "Music changes", "Stars appear", "The button glows"],
        "rewards": ["First Era badge for everyone who presses during the event", "Small chance for the Moon Button skin"],
    },
    {
        "id": "meteor",
        "threshold": 20000,
        "icon": "Meteor",
        "title": "Meteor Impact",
        "event": "A meteor crashes into the button.",
        "active_hours": 48,
        "effects": ["Countdown near impact", "Whole page shake", "Dust everywhere", "Permanent crack on the button"],
        "rewards": ["Meteor Badge for everyone online", "Meteor Button skin drop chance for 48 hours"],
    },
    {
        "id": "divide",
        "threshold": 50000,
        "icon": "Divide",
        "title": "The Great Divide",
        "event": "Choose Red or Blue for the season.",
        "active_hours": None,
        "effects": ["The screen splits", "Every press helps your team", "Season-long team choice"],
        "rewards": ["Winning team gets an exclusive champion skin", "MVPs get a special title"],
    },
    {
        "id": "alien",
        "threshold": 100000,
        "icon": "Alien",
        "title": "Alien Contact",
        "event": "Aliens hack the website.",
        "active_hours": 168,
        "effects": ["Page glitches", "Random weird sounds", "The button floats", "UFOs fly across the page"],
        "rewards": ["Alien button skin available for a week"],
    },
    {
        "id": "surge",
        "threshold": 250000,
        "icon": "Surge",
        "title": "Power Surge",
        "event": "Lightning hits. Everything glows.",
        "active_hours": 24,
        "effects": ["Every press counts as two for one day", "Lightning effects", "Fireworks for everyone"],
        "rewards": ["One-day double press event"],
    },
    {
        "id": "space",
        "threshold": 500000,
        "icon": "Space",
        "title": "Into Space",
        "event": "The button leaves Earth.",
        "active_hours": None,
        "effects": ["Space background", "Moving stars", "Rotating Earth", "Floating button and gravity effects"],
        "rewards": ["Galaxy button becomes obtainable"],
    },
    {
        "id": "million",
        "threshold": 1000000,
        "icon": "Crown",
        "title": "One Million",
        "event": "The Button reaches one million presses.",
        "active_hours": None,
        "effects": ["Confetti", "Fireworks", "Golden button", "Credits rolling"],
        "rewards": ["Million Club Badge for everyone online", "Never obtainable again"],
    },
]
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
    "menu.html",
    "daily.html",
    "global-milestones.html",
    "skins.html",
    "easter-egg.html",
    "achievements.html",
    "achievements.js",
    "lore.html",
    "lore.js",
    "leaderboard.html",
    "stats.html",
    "script.js",
    "daily.js",
    "global-milestones.js",
    "skins.js",
    "version-egg.js",
    "page-effects.js",
    "api-client.js",
    "style.css",
    "version.json",
    "images/goose.png",
    "images/broken.png",
}


@app.after_request
def add_cache_headers(response):
    if request.path.startswith("/api/"):
        response.headers["Cache-Control"] = "no-store, max-age=0"
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    return response


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


def save_json_atomic(path, data):
    tmp_path = f"{path}.tmp"
    with open(tmp_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    os.replace(tmp_path, path)


def save_stats(data):
    save_json_atomic(STATS_FILE, data)


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
    save_json_atomic(LEADERBOARD_FILE, data)


def leaderboard_press_total():
    leaderboard = load_leaderboard()
    total = 0
    for player in leaderboard.values():
        try:
            total += int(player.get("presses", 0))
        except (TypeError, ValueError):
            continue
    return total


def repair_total_presses(stats):
    leaderboard_total = leaderboard_press_total()
    stored_total = int(stats.get("total_presses", 0) or 0)
    if leaderboard_total > stored_total:
        stats["total_presses"] = leaderboard_total
        save_stats(stats)
    return stats


def load_world_firsts():
    if not os.path.exists(WORLD_FIRSTS_FILE):
        return {}

    try:
        with open(WORLD_FIRSTS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except (OSError, json.JSONDecodeError):
        return {}


def save_world_firsts(data):
    save_json_atomic(WORLD_FIRSTS_FILE, data)


def today_key():
    return datetime.now(timezone.utc).date().isoformat()


def load_daily_goal():
    today = today_key()
    if not os.path.exists(DAILY_GOAL_FILE):
        return {"date": today, "presses": 0, "target": DAILY_GOAL_TARGET}

    try:
        with open(DAILY_GOAL_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
    except (OSError, json.JSONDecodeError):
        data = {}

    if data.get("date") != today:
        return {"date": today, "presses": 0, "target": DAILY_GOAL_TARGET}

    return {
        "date": today,
        "presses": int(data.get("presses", 0)),
        "target": int(data.get("target", DAILY_GOAL_TARGET)),
    }


def save_daily_goal(data):
    save_json_atomic(DAILY_GOAL_FILE, data)


def load_global_milestone_unlocks():
    if not os.path.exists(GLOBAL_MILESTONES_FILE):
        return {}

    try:
        with open(GLOBAL_MILESTONES_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except (OSError, json.JSONDecodeError):
        return {}


def save_global_milestone_unlocks(data):
    save_json_atomic(GLOBAL_MILESTONES_FILE, data)


def update_global_milestone_unlocks(previous_presses, total_presses):
    unlocks = load_global_milestone_unlocks()
    now = datetime.now(timezone.utc).isoformat()
    new_unlocks = []

    for milestone in GLOBAL_MILESTONE_DEFS:
        milestone_id = milestone["id"]
        if previous_presses < milestone["threshold"] <= total_presses and milestone_id not in unlocks:
            unlocks[milestone_id] = {"unlocked_at": now}
            new_unlocks.append(milestone)

    if new_unlocks:
        save_global_milestone_unlocks(unlocks)

    return unlocks, new_unlocks


def serialize_global_milestones(total_presses):
    unlocks = load_global_milestone_unlocks()
    changed = False
    now = datetime.now(timezone.utc)

    for milestone in GLOBAL_MILESTONE_DEFS:
        if total_presses >= milestone["threshold"] and milestone["id"] not in unlocks:
            unlocks[milestone["id"]] = {"unlocked_at": now.isoformat()}
            changed = True

    if changed:
        save_global_milestone_unlocks(unlocks)

    serialized = []
    for milestone in GLOBAL_MILESTONE_DEFS:
        item = dict(milestone)
        unlock = unlocks.get(milestone["id"])
        item["status"] = "locked"
        if unlock:
            unlocked_at = datetime.fromisoformat(unlock["unlocked_at"])
            item["unlocked_at"] = unlock["unlocked_at"]
            if milestone["active_hours"]:
                active_until = unlocked_at + timedelta(hours=milestone["active_hours"])
                item["active_until"] = active_until.isoformat()
                item["status"] = "active" if now < active_until else "unlocked"
            else:
                item["status"] = "unlocked"
        serialized.append(item)

    return serialized


def active_global_milestone(milestone_id):
    unlocks = load_global_milestone_unlocks()
    unlock = unlocks.get(milestone_id)
    if not unlock:
        return False

    milestone = next((item for item in GLOBAL_MILESTONE_DEFS if item["id"] == milestone_id), None)
    if not milestone or not milestone["active_hours"]:
        return False

    unlocked_at = datetime.fromisoformat(unlock["unlocked_at"])
    active_until = unlocked_at + timedelta(hours=milestone["active_hours"])
    return datetime.now(timezone.utc) < active_until


def apply_first_era_rewards(player):
    rewards = {
        "event_achievements": [],
        "skins": []
    }
    player.setdefault("event_achievements", [])
    player.setdefault("skins", [])

    if not active_global_milestone("first-era"):
        return rewards

    if "first-era" not in player["event_achievements"]:
        player["event_achievements"].append("first-era")
        rewards["event_achievements"].append("first-era")

    if "moon" not in player["skins"] and random.random() < MOON_SKIN_DROP_CHANCE:
        player["skins"].append("moon")
        rewards["skins"].append("moon")

    return rewards


def achievement_count(presses, exclusive_achievements):
    standard_count = sum(presses >= milestone for milestone in STANDARD_ACHIEVEMENT_MILESTONES)
    return standard_count + len(exclusive_achievements)


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

    new_world_firsts = []
    new_global_milestones = []
    event_rewards = {"event_achievements": [], "skins": []}
    with storage_lock:
        stats = repair_total_presses(load_stats())
        previous_total_presses = int(stats.get("total_presses", 0))
        stats["total_presses"] = stats.get("total_presses", 0) + delta
        save_stats(stats)

        leaderboard = load_leaderboard()
        if name not in leaderboard:
            leaderboard[name] = {
                "presses": 0,
                "achievements": 0,
                "exclusive_achievements": [],
                "event_achievements": [],
                "skins": []
            }

        player = leaderboard[name]
        player.setdefault("exclusive_achievements", [])
        player.setdefault("event_achievements", [])
        player.setdefault("skins", [])
        previous_presses = int(player.get("presses", 0))
        player["presses"] = previous_presses + delta

        world_firsts = load_world_firsts()
        first_milestone = ((previous_presses // WORLD_FIRST_INTERVAL) + 1) * WORLD_FIRST_INTERVAL
        for milestone in range(first_milestone, player["presses"] + 1, WORLD_FIRST_INTERVAL):
            milestone_key = str(milestone)
            if milestone_key in world_firsts:
                continue

            claim = {
                "milestone": milestone,
                "name": name,
                "claimed_at": datetime.now(timezone.utc).isoformat()
            }
            world_firsts[milestone_key] = claim
            player["exclusive_achievements"].append(milestone)
            new_world_firsts.append(claim)

        player["achievements"] = achievement_count(
            player["presses"],
            player["exclusive_achievements"]
        )
        save_world_firsts(world_firsts)
        save_leaderboard(leaderboard)

        daily_goal = load_daily_goal()
        daily_goal["presses"] = daily_goal.get("presses", 0) + delta
        save_daily_goal(daily_goal)
        _, new_global_milestones = update_global_milestone_unlocks(
            previous_total_presses,
            stats["total_presses"]
        )
        event_rewards = apply_first_era_rewards(player)
        player["achievements"] = achievement_count(
            player["presses"],
            player["exclusive_achievements"]
        ) + len(player["event_achievements"])
        save_leaderboard(leaderboard)

    broadcast()

    return jsonify(
        ok=True,
        player_presses=player["presses"],
        new_world_firsts=new_world_firsts,
        daily_goal=daily_goal,
        new_global_milestones=new_global_milestones,
        event_rewards=event_rewards
    )


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


@app.get("/api/daily-goal")
def get_daily_goal():
    with storage_lock:
        daily_goal = load_daily_goal()
        save_daily_goal(daily_goal)

    return jsonify(daily_goal)


@app.post("/api/daily-press")
def daily_press():
    payload = request.json or {}
    delta = payload.get("delta", 1)
    if not isinstance(delta, int) or isinstance(delta, bool) or not 1 <= delta <= 100:
        return jsonify(error="delta must be an integer from 1 to 100"), 400

    with storage_lock:
        daily_goal = load_daily_goal()
        daily_goal["presses"] = daily_goal.get("presses", 0) + delta
        save_daily_goal(daily_goal)

    return jsonify(daily_goal)


@app.get("/api/stats")
def stats():
    with storage_lock:
        current_stats = repair_total_presses(load_stats())
    return jsonify(current_stats)


@app.get("/api/global-milestones")
def global_milestones():
    with storage_lock:
        current_stats = repair_total_presses(load_stats())
        total_presses = int(current_stats.get("total_presses", 0))
        milestones = serialize_global_milestones(total_presses)

    next_milestone = next(
        (milestone for milestone in milestones if total_presses < milestone["threshold"]),
        None
    )
    return jsonify(
        total_presses=total_presses,
        next_milestone=next_milestone,
        milestones=milestones
    )


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


@app.get("/api/achievements")
def achievements():
    name = str(request.args.get("name", "Anonymous")).strip()[:32] or "Anonymous"
    with storage_lock:
        leaderboard_data = load_leaderboard()
        world_firsts = load_world_firsts()

    player = leaderboard_data.get(name, {})
    ordered_claims = sorted(
        world_firsts.values(),
        key=lambda claim: int(claim["milestone"])
    )
    claimed_milestones = {int(milestone) for milestone in world_firsts}
    next_milestone = WORLD_FIRST_INTERVAL
    while next_milestone in claimed_milestones:
        next_milestone += WORLD_FIRST_INTERVAL

    return jsonify(
        name=name,
        presses=int(player.get("presses", 0)),
        exclusive_achievements=player.get("exclusive_achievements", []),
        event_achievements=player.get("event_achievements", []),
        skins=player.get("skins", []),
        world_firsts=ordered_claims,
        next_world_first_milestone=next_milestone
    )


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
