import argparse
import json
import os
import sqlite3
from datetime import datetime, timezone


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.environ.get("BUTTON_DB_PATH", os.path.join(BASE_DIR, "button.db"))


def connect():
    conn = sqlite3.connect(DB_FILE, timeout=30)
    conn.row_factory = sqlite3.Row
    return conn


def parse_json_list(value):
    try:
      parsed = json.loads(value or "[]")
    except (TypeError, json.JSONDecodeError):
      return []
    return parsed if isinstance(parsed, list) else []


def set_world_first(milestone, name):
    milestone = int(milestone)
    name = str(name or "").strip()[:32]
    if milestone <= 0 or milestone % 5000 != 0:
        raise SystemExit("milestone must be a positive multiple of 5000")
    if not name:
        raise SystemExit("name is required")

    now = datetime.now(timezone.utc).isoformat()
    with connect() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS world_firsts (
                milestone INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                claimed_at TEXT NOT NULL
            )
            """
        )
        conn.execute(
            """
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
            )
            """
        )
        conn.execute(
            """
            INSERT INTO world_firsts(milestone, name, claimed_at)
            VALUES (?, ?, ?)
            ON CONFLICT(milestone) DO UPDATE SET
                name = excluded.name,
                claimed_at = excluded.claimed_at
            """,
            (milestone, name, now),
        )

        row = conn.execute(
            "SELECT exclusive_achievements FROM players WHERE name = ?",
            (name,),
        ).fetchone()
        if row:
            achievements = parse_json_list(row["exclusive_achievements"])
            if milestone not in achievements:
                achievements.append(milestone)
                conn.execute(
                    """
                    UPDATE players
                    SET exclusive_achievements = ?, achievements = achievements + 1, updated_at = ?
                    WHERE name = ?
                    """,
                    (json.dumps(achievements, separators=(",", ":")), now, name),
                )

    print(f"World First {milestone:,} set to {name}")


def main():
    parser = argparse.ArgumentParser(description="Set a world-first owner.")
    parser.add_argument("milestone", type=int)
    parser.add_argument("name")
    args = parser.parse_args()
    set_world_first(args.milestone, args.name)


if __name__ == "__main__":
    main()
