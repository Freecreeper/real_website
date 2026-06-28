import argparse
import os
import sqlite3
import sys
from datetime import datetime, timezone


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.environ.get("BUTTON_DB_PATH", os.path.join(BASE_DIR, "button.db"))


def normalize_name(name):
    return " ".join(str(name or "").strip().lower().split())


def clean_name(name):
    return str(name or "").strip()[:32]


def connect():
    conn = sqlite3.connect(DB_FILE, timeout=30)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with connect() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS banned_players (
                normalized_name TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                reason TEXT NOT NULL DEFAULT '',
                banned_at TEXT NOT NULL
            )
            """
        )


def ban(name, reason):
    name = clean_name(name)
    if not name:
        raise SystemExit("name is required")
    init_db()
    with connect() as conn:
        conn.execute(
            """
            INSERT INTO banned_players(normalized_name, name, reason, banned_at)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(normalized_name) DO UPDATE SET
                name = excluded.name,
                reason = excluded.reason,
                banned_at = excluded.banned_at
            """,
            (normalize_name(name), name, reason or "", datetime.now(timezone.utc).isoformat()),
        )
    print(f"Banned {name}")


def unban(name):
    name = clean_name(name)
    init_db()
    with connect() as conn:
        cur = conn.execute(
            "DELETE FROM banned_players WHERE normalized_name = ?",
            (normalize_name(name),),
        )
    print(f"Unbanned {name}" if cur.rowcount else f"No ban found for {name}")


def list_bans():
    init_db()
    with connect() as conn:
        rows = conn.execute(
            "SELECT name, reason, banned_at FROM banned_players ORDER BY banned_at DESC"
        ).fetchall()
    if not rows:
        print("No banned names.")
        return
    for row in rows:
        reason = f" - {row['reason']}" if row["reason"] else ""
        print(f"{row['name']} ({row['banned_at']}){reason}")


def main():
    if len(sys.argv) in (2, 3) and sys.argv[1] not in {"ban", "unban", "list", "-h", "--help"}:
        ban(sys.argv[1], sys.argv[2] if len(sys.argv) == 3 else "")
        return

    parser = argparse.ArgumentParser(description="Ban or unban The Button player names.")
    sub = parser.add_subparsers(dest="command", required=True)

    ban_parser = sub.add_parser("ban")
    ban_parser.add_argument("name")
    ban_parser.add_argument("reason", nargs="?", default="")

    unban_parser = sub.add_parser("unban")
    unban_parser.add_argument("name")

    sub.add_parser("list")

    args = parser.parse_args()
    if args.command == "ban":
        ban(args.name, args.reason)
    elif args.command == "unban":
        unban(args.name)
    else:
        list_bans()


if __name__ == "__main__":
    main()
