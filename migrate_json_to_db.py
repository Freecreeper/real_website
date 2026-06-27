import argparse
import json
import os
import sqlite3
from datetime import datetime, timezone

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATS_FILE = os.path.join(BASE_DIR, "stats.json")
LEADERBOARD_FILE = os.path.join(BASE_DIR, "leaderboard.json")
WORLD_FIRSTS_FILE = os.path.join(BASE_DIR, "world_firsts.json")
DAILY_GOAL_FILE = os.path.join(BASE_DIR, "daily_goal.json")
GLOBAL_MILESTONES_FILE = os.path.join(BASE_DIR, "global_milestones.json")
DB_FILE = os.environ.get("BUTTON_DB_PATH", os.path.join(BASE_DIR, "button.db"))
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


def read_json(path, default):
    if not os.path.exists(path):
        return default
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except (OSError, json.JSONDecodeError):
        return default


def normalize_stats(data):
    data = data if isinstance(data, dict) else {}
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


def normalize_leaderboard(data):
    if not isinstance(data, dict):
        return {}

    normalized = {}
    for raw_name, raw_player in data.items():
        name = str(raw_name).strip()[:32] or "Anonymous"
        player = raw_player if isinstance(raw_player, dict) else {}
        skins = player.get("skins", ["classic"])
        if not isinstance(skins, list):
            skins = ["classic"]
        if "classic" not in skins:
            skins.insert(0, "classic")

        normalized[name] = {
            "presses": int(player.get("presses", 0) or 0),
            "achievements": int(player.get("achievements", 0) or 0),
            "exclusive_achievements": player.get("exclusive_achievements", []),
            "event_achievements": player.get("event_achievements", []),
            "skins": skins,
            "divide_team": player.get("divide_team"),
            "divide_season": player.get("divide_season"),
            "divide_presses": int(player.get("divide_presses", 0) or 0),
            "title": player.get("title", "") or "",
        }
    return normalized


def normalize_world_firsts(data):
    if not isinstance(data, dict):
        return {}

    normalized = {}
    for key, raw_claim in data.items():
        claim = raw_claim if isinstance(raw_claim, dict) else {}
        milestone = int(claim.get("milestone", key) or 0)
        if milestone <= 0:
            continue
        normalized[str(milestone)] = {
            "milestone": milestone,
            "name": str(claim.get("name", "Anonymous")).strip()[:32] or "Anonymous",
            "claimed_at": claim.get("claimed_at") or datetime.now(timezone.utc).isoformat(),
        }
    return normalized


def normalize_daily_goal(data):
    today = datetime.now(timezone.utc).date().isoformat()
    data = data if isinstance(data, dict) else {}
    if data.get("date") != today:
        return {"date": today, "presses": 0, "target": DAILY_GOAL_TARGET}
    return {
        "date": today,
        "presses": int(data.get("presses", 0) or 0),
        "target": int(data.get("target", DAILY_GOAL_TARGET) or DAILY_GOAL_TARGET),
    }


def normalize_global_milestones(data):
    return data if isinstance(data, dict) else {}


def db_has_live_data():
    init_db()
    with db_connect() as conn:
        player_count = conn.execute("SELECT COUNT(*) FROM players").fetchone()[0]
        world_first_count = conn.execute("SELECT COUNT(*) FROM world_firsts").fetchone()[0]
        milestone_count = conn.execute("SELECT COUNT(*) FROM global_milestones").fetchone()[0]
        stats_total = conn.execute(
            "SELECT COALESCE(SUM(value), 0) FROM global_stats"
        ).fetchone()[0]
    return any([player_count, world_first_count, milestone_count, stats_total])


def clear_db():
    init_db()
    with db_connect() as conn:
        conn.execute("DELETE FROM global_stats")
        conn.execute("DELETE FROM players")
        conn.execute("DELETE FROM world_firsts")
        conn.execute("DELETE FROM daily_goals")
        conn.execute("DELETE FROM global_milestones")
        conn.execute("DELETE FROM banned_players")


def migrate(force=False):
    if db_has_live_data() and not force:
        raise SystemExit(
            f"{DB_FILE} already has data. Re-run with --force to replace it."
        )

    if force:
        clear_db()

    stats = normalize_stats(read_json(STATS_FILE, {}))
    leaderboard = normalize_leaderboard(read_json(LEADERBOARD_FILE, {}))
    world_firsts = normalize_world_firsts(read_json(WORLD_FIRSTS_FILE, {}))
    daily_goal = normalize_daily_goal(read_json(DAILY_GOAL_FILE, {}))
    milestones = normalize_global_milestones(read_json(GLOBAL_MILESTONES_FILE, {}))

    leaderboard_total = sum(int(player.get("presses", 0) or 0) for player in leaderboard.values())
    stats["total_presses"] = max(int(stats.get("total_presses", 0) or 0), leaderboard_total)

    now = datetime.now(timezone.utc).isoformat()
    with db_connect() as conn:
        for key, default in STAT_DEFAULTS.items():
            conn.execute(
                """
                INSERT INTO global_stats(key, value)
                VALUES (?, ?)
                ON CONFLICT(key) DO UPDATE SET value = excluded.value
                """,
                (key, int(stats.get(key, default) or 0)),
            )

        for name, player in leaderboard.items():
            conn.execute(
                """
                INSERT INTO players(
                    name, presses, achievements, exclusive_achievements,
                    event_achievements, skins, divide_team, divide_season,
                    divide_presses, title, updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(name) DO UPDATE SET
                    presses = excluded.presses,
                    achievements = excluded.achievements,
                    exclusive_achievements = excluded.exclusive_achievements,
                    event_achievements = excluded.event_achievements,
                    skins = excluded.skins,
                    divide_team = excluded.divide_team,
                    divide_season = excluded.divide_season,
                    divide_presses = excluded.divide_presses,
                    title = excluded.title,
                    updated_at = excluded.updated_at
                """,
                (
                    name,
                    player["presses"],
                    player["achievements"],
                    json.dumps(player["exclusive_achievements"], separators=(",", ":")),
                    json.dumps(player["event_achievements"], separators=(",", ":")),
                    json.dumps(player["skins"], separators=(",", ":")),
                    player["divide_team"],
                    player["divide_season"],
                    player["divide_presses"],
                    player["title"],
                    now,
                ),
            )

        for claim in world_firsts.values():
            conn.execute(
                """
                INSERT OR REPLACE INTO world_firsts(milestone, name, claimed_at)
                VALUES (?, ?, ?)
                """,
                (claim["milestone"], claim["name"], claim["claimed_at"]),
            )

        conn.execute(
            """
            INSERT INTO daily_goals(date, presses, target)
            VALUES (?, ?, ?)
            ON CONFLICT(date) DO UPDATE SET
                presses = excluded.presses,
                target = excluded.target
            """,
            (daily_goal["date"], daily_goal["presses"], daily_goal["target"]),
        )

        for milestone_id, unlock in milestones.items():
            conn.execute(
                "INSERT OR REPLACE INTO global_milestones(id, data) VALUES (?, ?)",
                (milestone_id, json.dumps(unlock, separators=(",", ":"))),
            )

    print(f"Migrated JSON data into {DB_FILE}")
    print(f"Players: {len(leaderboard)}")
    print(f"World firsts: {len(world_firsts)}")
    print(f"Global milestones: {len(milestones)}")
    print(f"Total presses: {stats.get('total_presses', 0)}")


def main():
    parser = argparse.ArgumentParser(description="Migrate The Button JSON files into SQLite.")
    parser.add_argument(
        "--force",
        action="store_true",
        help="replace existing SQLite data before importing JSON",
    )
    args = parser.parse_args()
    migrate(force=args.force)


if __name__ == "__main__":
    main()
