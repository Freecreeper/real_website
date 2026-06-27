from flask import Flask, request, jsonify, send_from_directory, abort
from flask_socketio import SocketIO, emit
from difflib import SequenceMatcher
import json
import os
import random
import sqlite3
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
BLOCKED_NAMES_FILE = os.path.join(BASE_DIR, "blocked_names.txt")
DB_FILE = os.environ.get("BUTTON_DB_PATH", os.path.join(BASE_DIR, "button.db"))
storage_lock = Lock()
STANDARD_ACHIEVEMENT_MILESTONES = (10, 25, 50, 100, 500, 1000)
WORLD_FIRST_INTERVAL = 5000
DAILY_GOAL_TARGET = 1000
STAT_DEFAULTS = {
    "total_presses": 0,
    "total_visitors": 0,
    "gooses_released": 0,
    "potatoes_detected": 0,
    "pranks_triggered": 0,
    "alien_contacts": 0,
    "rickroll_victims": 0,
    "achievement_unlocks": 0,
}
DEFAULT_BLOCKED_NAME_TERMS = {
    "admin",
    "moderator",
    "owner",
    "staff",
    "fuck",
    "shit",
    "bitch",
    "asshole",
    "nigger",
    "nigga",
    "faggot",
    "retard",
    "kys",
    "hitler",
    "nazi",
}
MOON_SKIN_DROP_CHANCE = 0.05
METEOR_SKIN_DROP_CHANCE = 0.05
DIVIDE_TEAMS = {
    "red": {
        "name": "Red",
        "skin": "red-champion",
        "title": "Red Vanguard",
    },
    "blue": {
        "name": "Blue",
        "skin": "blue-champion",
        "title": "Blue Vanguard",
    },
}
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
        "effects": ["Countdown near impact", "Whole page shake", "Dust everywhere", "Meteor glow during the event"],
        "rewards": ["Meteor Badge for everyone online", "Meteor Button skin drop chance for 48 hours"],
    },
    {
        "id": "divide",
        "threshold": 50000,
        "icon": "Divide",
        "title": "The Great Divide",
        "event": "Choose Red or Blue for the season.",
        "active_hours": None,
        "effects": ["The screen splits", "Every press helps your team", "Season-long team choice", "Live Red vs Blue scoreboard"],
        "rewards": ["Winning team gets an exclusive champion skin when the season closes", "Top Red and Blue players become MVPs"],
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
def db_connect():
    conn = sqlite3.connect(DB_FILE, timeout=30)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA busy_timeout = 5000")
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    with db_connect() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS global_stats (
                key TEXT PRIMARY KEY,
                value INTEGER NOT NULL DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS players (
                name TEXT PRIMARY KEY,
                presses INTEGER NOT NULL DEFAULT 0,
                achievements INTEGER NOT NULL DEFAULT 0,
                exclusive_achievements TEXT NOT NULL DEFAULT '[]',
                event_achievements TEXT NOT NULL DEFAULT '[]',
                skins TEXT NOT NULL DEFAULT '["classic"]',
                divide_team TEXT,
                divide_season INTEGER,
                divide_presses INTEGER NOT NULL DEFAULT 0,
                title TEXT NOT NULL DEFAULT '',
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS world_firsts (
                milestone INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                claimed_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS daily_goals (
                date TEXT PRIMARY KEY,
                presses INTEGER NOT NULL DEFAULT 0,
                target INTEGER NOT NULL DEFAULT 1000
            );

            CREATE TABLE IF NOT EXISTS global_milestones (
                id TEXT PRIMARY KEY,
                data TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS banned_players (
                normalized_name TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                reason TEXT NOT NULL DEFAULT '',
                banned_at TEXT NOT NULL
            );
        """)
        for key, value in STAT_DEFAULTS.items():
            conn.execute(
                "INSERT OR IGNORE INTO global_stats(key, value) VALUES (?, ?)",
                (key, int(value)),
            )


def parse_json_list(value, default=None):
    default = [] if default is None else default
    if isinstance(value, list):
        return value
    try:
        parsed = json.loads(value or "[]")
    except (TypeError, json.JSONDecodeError):
        return list(default)
    return parsed if isinstance(parsed, list) else list(default)


def dumps_json(value):
    return json.dumps(value, separators=(",", ":"))


def normalize_player_name(name):
    return " ".join(str(name or "").strip().lower().split())


def compact_name_for_filter(name):
    table = str.maketrans({
        "0": "o",
        "1": "i",
        "3": "e",
        "4": "a",
        "5": "s",
        "7": "t",
        "@": "a",
        "$": "s",
        "!": "i",
    })
    return "".join(
        ch for ch in normalize_player_name(name).translate(table)
        if ch.isalnum()
    )


def load_blocked_name_terms():
    terms = set(DEFAULT_BLOCKED_NAME_TERMS)
    extra = os.environ.get("BUTTON_BLOCKED_NAME_TERMS", "")
    for term in extra.split(","):
        term = term.strip()
        if term:
            terms.add(term)

    if os.path.exists(BLOCKED_NAMES_FILE):
        try:
            with open(BLOCKED_NAMES_FILE, "r", encoding="utf-8") as f:
                for line in f:
                    term = line.strip()
                    if term and not term.startswith("#"):
                        terms.add(term)
        except OSError:
            pass

    return {compact_name_for_filter(term) for term in terms if compact_name_for_filter(term)}


def has_blocked_name_term(name):
    compact = compact_name_for_filter(name)
    if not compact:
        return False
    return any(term in compact for term in load_blocked_name_terms())


def clean_player_name(name):
    return str(name or "Anonymous").strip()[:32] or "Anonymous"


def is_banned_name(name):
    normalized = normalize_player_name(name)
    if not normalized:
        return False
    init_db()
    with db_connect() as conn:
        row = conn.execute(
            "SELECT 1 FROM banned_players WHERE normalized_name = ?",
            (normalized,),
        ).fetchone()
    return row is not None


def is_rejected_name(name):
    return is_banned_name(name) or has_blocked_name_term(name)


def ban_player_name(name, reason=""):
    name = clean_player_name(name)
    init_db()
    with db_connect() as conn:
        conn.execute(
            """
            INSERT INTO banned_players(normalized_name, name, reason, banned_at)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(normalized_name) DO UPDATE SET
                name = excluded.name,
                reason = excluded.reason,
                banned_at = excluded.banned_at
            """,
            (
                normalize_player_name(name),
                name,
                str(reason or "")[:160],
                datetime.now(timezone.utc).isoformat(),
            ),
        )
    return name


def unban_player_name(name):
    normalized = normalize_player_name(name)
    init_db()
    with db_connect() as conn:
        cur = conn.execute(
            "DELETE FROM banned_players WHERE normalized_name = ?",
            (normalized,),
        )
    return cur.rowcount > 0


def player_lookup_matches(query, limit=5):
    query = clean_player_name(query)
    normalized_query = normalize_player_name(query)
    if not normalized_query:
        return []

    leaderboard = public_leaderboard()
    matches = []
    for name, player in leaderboard.items():
        normalized_name = normalize_player_name(name)
        score = SequenceMatcher(None, normalized_query, normalized_name).ratio()
        if normalized_query in normalized_name or normalized_name in normalized_query:
            score = max(score, 0.82)
        if normalized_query == normalized_name:
            score = 1.0
        if score < 0.35:
            continue
        matches.append({
            "name": name,
            "presses": int(player.get("presses", 0) or 0),
            "score": round(score, 3),
            "exact": normalized_query == normalized_name,
        })

    matches.sort(key=lambda item: (item["score"], item["presses"]), reverse=True)
    return matches[:limit]


def load_stats():
    init_db()
    data = dict(STAT_DEFAULTS)
    with db_connect() as conn:
        rows = conn.execute("SELECT key, value FROM global_stats").fetchall()
    for row in rows:
        data[row["key"]] = int(row["value"] or 0)
    return data


def save_stats(data):
    init_db()
    with db_connect() as conn:
        for key, default in STAT_DEFAULTS.items():
            value = int(data.get(key, default) or 0)
            conn.execute(
                """
                INSERT INTO global_stats(key, value)
                VALUES (?, ?)
                ON CONFLICT(key) DO UPDATE SET value = excluded.value
                """,
                (key, value),
            )


# -----------------------
# Leaderboard Storage
# -----------------------

def load_leaderboard():
    init_db()
    with db_connect() as conn:
        rows = conn.execute(
            """
            SELECT name, presses, achievements, exclusive_achievements,
                   event_achievements, skins, divide_team, divide_season,
                   divide_presses, title
            FROM players
            """
        ).fetchall()

    leaderboard = {}
    for row in rows:
        leaderboard[row["name"]] = {
            "presses": int(row["presses"] or 0),
            "achievements": int(row["achievements"] or 0),
            "exclusive_achievements": parse_json_list(row["exclusive_achievements"]),
            "event_achievements": parse_json_list(row["event_achievements"]),
            "skins": parse_json_list(row["skins"], ["classic"]),
            "divide_team": row["divide_team"],
            "divide_season": row["divide_season"],
            "divide_presses": int(row["divide_presses"] or 0),
            "title": row["title"] or "",
        }
    return leaderboard


def public_leaderboard(data=None):
    data = data if data is not None else load_leaderboard()
    return {
        name: player
        for name, player in data.items()
        if not is_rejected_name(name)
    }


def save_leaderboard(data):
    init_db()
    with db_connect() as conn:
        conn.execute("DELETE FROM players")
        for name, player in data.items():
            skins = player.get("skins", ["classic"])
            if not isinstance(skins, list):
                skins = ["classic"]
            if "classic" not in skins:
                skins.insert(0, "classic")
            conn.execute(
                """
                INSERT INTO players(
                    name, presses, achievements, exclusive_achievements,
                    event_achievements, skins, divide_team, divide_season,
                    divide_presses, title, updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    str(name)[:32] or "Anonymous",
                    int(player.get("presses", 0) or 0),
                    int(player.get("achievements", 0) or 0),
                    dumps_json(player.get("exclusive_achievements", [])),
                    dumps_json(player.get("event_achievements", [])),
                    dumps_json(skins),
                    player.get("divide_team"),
                    player.get("divide_season"),
                    int(player.get("divide_presses", 0) or 0),
                    player.get("title", "") or "",
                    datetime.now(timezone.utc).isoformat(),
                ),
            )


def leaderboard_press_total():
    leaderboard = public_leaderboard()
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
    init_db()
    with db_connect() as conn:
        rows = conn.execute(
            "SELECT milestone, name, claimed_at FROM world_firsts"
        ).fetchall()
    return {
        str(row["milestone"]): {
            "milestone": int(row["milestone"]),
            "name": row["name"],
            "claimed_at": row["claimed_at"],
        }
        for row in rows
    }


def save_world_firsts(data):
    init_db()
    with db_connect() as conn:
        conn.execute("DELETE FROM world_firsts")
        for claim in data.values():
            conn.execute(
                """
                INSERT OR REPLACE INTO world_firsts(milestone, name, claimed_at)
                VALUES (?, ?, ?)
                """,
                (
                    int(claim.get("milestone", 0) or 0),
                    str(claim.get("name", "Anonymous")).strip()[:32] or "Anonymous",
                    claim.get("claimed_at") or datetime.now(timezone.utc).isoformat(),
                ),
            )


def today_key():
    return datetime.now(timezone.utc).date().isoformat()


def load_daily_goal():
    today = today_key()
    init_db()
    with db_connect() as conn:
        row = conn.execute(
            "SELECT date, presses, target FROM daily_goals WHERE date = ?",
            (today,),
        ).fetchone()
    if not row:
        return {"date": today, "presses": 0, "target": DAILY_GOAL_TARGET}
    return {
        "date": row["date"],
        "presses": int(row["presses"] or 0),
        "target": int(row["target"] or DAILY_GOAL_TARGET),
    }


def save_daily_goal(data):
    init_db()
    date = data.get("date") or today_key()
    with db_connect() as conn:
        conn.execute(
            """
            INSERT INTO daily_goals(date, presses, target)
            VALUES (?, ?, ?)
            ON CONFLICT(date) DO UPDATE SET
                presses = excluded.presses,
                target = excluded.target
            """,
            (
                date,
                int(data.get("presses", 0) or 0),
                int(data.get("target", DAILY_GOAL_TARGET) or DAILY_GOAL_TARGET),
            ),
        )


def load_global_milestone_unlocks():
    init_db()
    with db_connect() as conn:
        rows = conn.execute("SELECT id, data FROM global_milestones").fetchall()
    unlocks = {}
    for row in rows:
        try:
            unlocks[row["id"]] = json.loads(row["data"])
        except (TypeError, json.JSONDecodeError):
            continue
    return unlocks


def save_global_milestone_unlocks(data):
    init_db()
    with db_connect() as conn:
        conn.execute("DELETE FROM global_milestones")
        for milestone_id, unlock in data.items():
            conn.execute(
                "INSERT OR REPLACE INTO global_milestones(id, data) VALUES (?, ?)",
                (milestone_id, dumps_json(unlock)),
            )


def normalize_divide_unlock(unlock):
    if not isinstance(unlock, dict):
        unlock = {}

    teams = unlock.get("teams")
    if not isinstance(teams, dict):
        teams = {}

    for team in DIVIDE_TEAMS:
        team_data = teams.get(team)
        if not isinstance(team_data, dict):
            team_data = {}
        team_data["presses"] = int(team_data.get("presses", 0) or 0)
        teams[team] = team_data

    unlock["teams"] = teams
    unlock["season"] = int(unlock.get("season", 1) or 1)
    return unlock


def divide_is_active(unlocks=None):
    unlocks = unlocks if unlocks is not None else load_global_milestone_unlocks()
    unlock = unlocks.get("divide")
    return bool(unlock and not unlock.get("ended_at"))


def divide_player_payload(name, leaderboard=None, unlocks=None):
    leaderboard = leaderboard if leaderboard is not None else load_leaderboard()
    unlocks = unlocks if unlocks is not None else load_global_milestone_unlocks()
    if is_rejected_name(name):
        return {
            "name": "",
            "team": None,
            "presses": 0,
            "title": "",
        }
    player = leaderboard.get(name, {})
    team = player.get("divide_team")
    if team not in DIVIDE_TEAMS:
        team = None

    return {
        "name": name,
        "team": team,
        "presses": int(player.get("divide_presses", 0) or 0),
        "title": player.get("title", ""),
    }


def divide_state_payload(name=None, leaderboard=None, unlocks=None):
    unlocks = unlocks if unlocks is not None else load_global_milestone_unlocks()
    unlock = unlocks.get("divide")
    active = divide_is_active(unlocks)
    if unlock:
        unlock = normalize_divide_unlock(unlock)

    team_payload = {}
    for team, meta in DIVIDE_TEAMS.items():
        team_unlock = unlock["teams"][team] if unlock else {"presses": 0}
        team_payload[team] = {
            "id": team,
            "name": meta["name"],
            "presses": int(team_unlock.get("presses", 0) or 0),
            "champion_skin": meta["skin"],
            "mvp_title": meta["title"],
        }

    leaderboard = public_leaderboard(leaderboard if leaderboard is not None else load_leaderboard())
    mvps = {}
    for team in DIVIDE_TEAMS:
        contenders = [
            (player_name, player)
            for player_name, player in leaderboard.items()
            if player.get("divide_team") == team
        ]
        if contenders:
            player_name, player = max(
                contenders,
                key=lambda item: int(item[1].get("divide_presses", 0) or 0),
            )
            mvps[team] = {
                "name": player_name,
                "presses": int(player.get("divide_presses", 0) or 0),
                "title": DIVIDE_TEAMS[team]["title"],
            }
        else:
            mvps[team] = None

    red = team_payload["red"]["presses"]
    blue = team_payload["blue"]["presses"]
    leader = "tie"
    if red > blue:
        leader = "red"
    elif blue > red:
        leader = "blue"

    payload = {
        "active": active,
        "season": int(unlock.get("season", 1) if unlock else 1),
        "unlocked_at": unlock.get("unlocked_at") if unlock else None,
        "ended_at": unlock.get("ended_at") if unlock else None,
        "teams": team_payload,
        "leader": leader,
        "mvps": mvps,
    }
    if name:
        payload["player"] = divide_player_payload(name, leaderboard, unlocks)
    return payload


def choose_divide_team(name, team):
    if team not in DIVIDE_TEAMS:
        return None, "invalid team"

    unlocks = load_global_milestone_unlocks()
    if not divide_is_active(unlocks):
        return None, "divide is not active"

    unlocks["divide"] = normalize_divide_unlock(unlocks["divide"])
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
    current_team = player.get("divide_team")
    if current_team in DIVIDE_TEAMS and current_team != team:
        return None, "team already chosen"

    player["divide_team"] = team
    player["divide_season"] = unlocks["divide"].get("season", 1)
    player["divide_presses"] = int(player.get("divide_presses", 0) or 0)
    player.setdefault("skins", [])
    reward_skin = DIVIDE_TEAMS[team]["skin"]
    if reward_skin not in player["skins"]:
        player["skins"].append(reward_skin)
    save_leaderboard(leaderboard)
    save_global_milestone_unlocks(unlocks)
    payload = divide_state_payload(name, leaderboard, unlocks)
    payload["reward_skin"] = reward_skin
    return payload, None


def record_divide_press(player, unlocks, delta):
    if not divide_is_active(unlocks):
        return None

    unlocks["divide"] = normalize_divide_unlock(unlocks["divide"])
    team = player.get("divide_team")
    if team not in DIVIDE_TEAMS:
        return None

    unlocks["divide"]["teams"][team]["presses"] += delta
    player["divide_presses"] = int(player.get("divide_presses", 0) or 0) + delta
    return team


def update_global_milestone_unlocks(previous_presses, total_presses):
    unlocks = load_global_milestone_unlocks()
    now = datetime.now(timezone.utc).isoformat()
    new_unlocks = []

    for milestone in GLOBAL_MILESTONE_DEFS:
        milestone_id = milestone["id"]
        if previous_presses < milestone["threshold"] <= total_presses and milestone_id not in unlocks:
            unlocks[milestone_id] = {"unlocked_at": now}
            if milestone_id == "divide":
                unlocks[milestone_id] = normalize_divide_unlock(unlocks[milestone_id])
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
            if milestone["id"] == "divide":
                unlocks[milestone["id"]] = normalize_divide_unlock(unlocks[milestone["id"]])
            changed = True

    if changed:
        save_global_milestone_unlocks(unlocks)

    serialized = []
    for milestone in GLOBAL_MILESTONE_DEFS:
        item = dict(milestone)
        unlock = unlocks.get(milestone["id"])
        item["status"] = "locked"
        if unlock:
            if milestone["id"] == "divide":
                unlock = normalize_divide_unlock(unlock)
                item["divide"] = divide_state_payload(unlocks=unlocks)
            unlocked_at = datetime.fromisoformat(unlock["unlocked_at"])
            item["unlocked_at"] = unlock["unlocked_at"]
            if milestone["id"] == "divide" and not unlock.get("ended_at"):
                item["status"] = "active"
            elif milestone["active_hours"]:
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
        if milestone_id == "divide":
            return divide_is_active(unlocks)
        return False

    unlocked_at = datetime.fromisoformat(unlock["unlocked_at"])
    active_until = unlocked_at + timedelta(hours=milestone["active_hours"])
    return datetime.now(timezone.utc) < active_until


def apply_global_event_rewards(player):
    rewards = {
        "event_achievements": [],
        "skins": []
    }
    player.setdefault("event_achievements", [])
    player.setdefault("skins", [])

    if active_global_milestone("first-era"):
        if "first-era" not in player["event_achievements"]:
            player["event_achievements"].append("first-era")
            rewards["event_achievements"].append("first-era")

        if "moon" not in player["skins"] and random.random() < MOON_SKIN_DROP_CHANCE:
            player["skins"].append("moon")
            rewards["skins"].append("moon")

    if active_global_milestone("meteor"):
        if "meteor" not in player["event_achievements"]:
            player["event_achievements"].append("meteor")
            rewards["event_achievements"].append("meteor")

        if "meteor" not in player["skins"] and random.random() < METEOR_SKIN_DROP_CHANCE:
            player["skins"].append("meteor")
            rewards["skins"].append("meteor")

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
    name = clean_player_name(payload.get("name", "Anonymous"))
    if not isinstance(delta, int) or isinstance(delta, bool) or not 1 <= delta <= 100:
        return jsonify(error="delta must be an integer from 1 to 100"), 400
    if is_rejected_name(name):
        return jsonify(error="you cant do that"), 403

    new_world_firsts = []
    new_global_milestones = []
    event_rewards = {"event_achievements": [], "skins": []}
    divide_state = None
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
        milestone_unlocks = load_global_milestone_unlocks()
        divide_team = record_divide_press(player, milestone_unlocks, delta)
        if divide_team:
            save_global_milestone_unlocks(milestone_unlocks)
        event_rewards = apply_global_event_rewards(player)
        player["achievements"] = achievement_count(
            player["presses"],
            player["exclusive_achievements"]
        ) + len(player["event_achievements"])
        save_leaderboard(leaderboard)
        divide_state = divide_state_payload(name, leaderboard, milestone_unlocks)

    broadcast()

    return jsonify(
        ok=True,
        player_presses=player["presses"],
        new_world_firsts=new_world_firsts,
        daily_goal=daily_goal,
        new_global_milestones=new_global_milestones,
        event_rewards=event_rewards,
        divide=divide_state
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
        divide = divide_state_payload()

    next_milestone = next(
        (milestone for milestone in milestones if total_presses < milestone["threshold"]),
        None
    )
    return jsonify(
        total_presses=total_presses,
        next_milestone=next_milestone,
        milestones=milestones,
        divide=divide
    )


@app.get("/api/divide")
def divide_state():
    name = clean_player_name(request.args.get("name", "")).strip()
    with storage_lock:
        payload = divide_state_payload(name or None)
    return jsonify(payload)


@app.post("/api/divide/choose")
def divide_choose():
    payload = request.json or {}
    name = clean_player_name(payload.get("name", "Anonymous"))
    team = str(payload.get("team", "")).strip().lower()
    if is_rejected_name(name):
        return jsonify(error="you cant do that"), 403
    with storage_lock:
        result, error = choose_divide_team(name, team)

    if error:
        status = 409 if error == "team already chosen" else 400
        return jsonify(error=error), status
    return jsonify(result)


@app.get("/api/player-lookup")
def player_lookup():
    query = request.args.get("q", "")
    if has_blocked_name_term(query):
        return jsonify(error="you cant do that"), 403
    matches = player_lookup_matches(query)
    return jsonify(matches=matches)


@app.post("/api/admin/ban")
def admin_ban():
    token = os.environ.get("BUTTON_ADMIN_TOKEN", "")
    supplied = request.headers.get("X-Admin-Token") or (request.json or {}).get("token", "")
    if not token or supplied != token:
        return jsonify(error="admin token required"), 403

    payload = request.json or {}
    name = clean_player_name(payload.get("name", ""))
    reason = str(payload.get("reason", "")).strip()
    if not name:
        return jsonify(error="name required"), 400
    return jsonify(ok=True, name=ban_player_name(name, reason))


@app.post("/api/admin/unban")
def admin_unban():
    token = os.environ.get("BUTTON_ADMIN_TOKEN", "")
    supplied = request.headers.get("X-Admin-Token") or (request.json or {}).get("token", "")
    if not token or supplied != token:
        return jsonify(error="admin token required"), 403

    payload = request.json or {}
    name = clean_player_name(payload.get("name", ""))
    if not name:
        return jsonify(error="name required"), 400
    return jsonify(ok=True, removed=unban_player_name(name))


# -----------------------
# Leaderboard Endpoint
# -----------------------

@app.get("/api/leaderboard")
def leaderboard():

    data = public_leaderboard()
    divide = divide_state_payload(leaderboard=data)
    mvp_titles = {}
    for team, mvp in divide.get("mvps", {}).items():
        if mvp:
            mvp_titles[mvp["name"]] = DIVIDE_TEAMS[team]["title"]

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
            "achievements": info.get("achievements", 0),
            "team": info.get("divide_team"),
            "divide_presses": int(info.get("divide_presses", 0) or 0),
            "title": mvp_titles.get(name, info.get("title", ""))
        })

    return jsonify(result)


@app.get("/api/achievements")
def achievements():
    name = clean_player_name(request.args.get("name", "Anonymous"))
    if is_rejected_name(name):
        return jsonify(error="you cant do that"), 403
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
        divide=divide_state_payload(name, leaderboard_data),
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
