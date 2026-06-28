import argparse
import base64
import json
import os
import sqlite3


BASE_DIR = os.path.dirname(os.path.abspath(__file__))


def load_dotenv(path=os.path.join(BASE_DIR, ".env")):
    if not os.path.exists(path):
        return
    with open(path, "r", encoding="utf-8") as env_file:
        for line in env_file:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip().strip('"').strip("'").replace("\\n", "\n")
            os.environ.setdefault(key, value)


load_dotenv()
DB_FILE = os.environ.get("BUTTON_DB_PATH", os.path.join(BASE_DIR, "button.db"))
VAPID_PRIVATE_KEY = os.environ.get("VAPID_PRIVATE_KEY", "")
VAPID_SUBJECT = os.environ.get("VAPID_SUBJECT", "mailto:admin@pressthebutton.click")


def base64url_decode(value):
    compact = "".join(str(value or "").strip().split())
    padding = "=" * ((4 - len(compact) % 4) % 4)
    return base64.urlsafe_b64decode((compact + padding).encode("ascii"))


def base64url_encode(value):
    return base64.urlsafe_b64encode(value).decode("ascii").rstrip("=")


def webpush_vapid_private_key(value):
    value = str(value or "").strip()
    if not value:
        return ""

    try:
        raw = base64url_decode(value)
        if len(raw) == 32:
            return value.rstrip("=")
    except Exception:
        pass

    if "BEGIN PRIVATE KEY" in value:
        try:
            from cryptography.hazmat.primitives.serialization import load_pem_private_key
            private_key = load_pem_private_key(value.encode("utf-8"), password=None)
            private_value = private_key.private_numbers().private_value
            return base64url_encode(private_value.to_bytes(32, "big"))
        except Exception:
            return ""

    return value


def connect():
    conn = sqlite3.connect(DB_FILE, timeout=30)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with connect() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS push_subscriptions (
                endpoint TEXT PRIMARY KEY,
                name TEXT NOT NULL DEFAULT '',
                subscription TEXT NOT NULL,
                chaos_enabled INTEGER NOT NULL DEFAULT 1,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )


def delete_push_subscription(endpoint):
    with connect() as conn:
        conn.execute("DELETE FROM push_subscriptions WHERE endpoint = ?", (endpoint,))


def main():
    try:
        from pywebpush import WebPushException, webpush
    except ImportError as error:
        raise SystemExit("Install requirements first: pip install -r requirements.txt") from error

    parser = argparse.ArgumentParser(description="Send Web Push notifications to Chaos Mode subscribers.")
    parser.add_argument("title")
    parser.add_argument("body")
    parser.add_argument("--url", default="/index.html")
    parser.add_argument("--tag", default="the-button-chaos")
    args = parser.parse_args()

    vapid_private_key = webpush_vapid_private_key(VAPID_PRIVATE_KEY)
    if not vapid_private_key:
        raise SystemExit("VAPID_PRIVATE_KEY is not set")
    init_db()

    payload = json.dumps({
        "title": args.title,
        "body": args.body,
        "url": args.url,
        "tag": args.tag,
        "icon": "/icon-192.svg",
        "badge": "/icon-192.svg",
    }, separators=(",", ":"))

    with connect() as conn:
        rows = conn.execute(
            "SELECT endpoint, subscription FROM push_subscriptions WHERE chaos_enabled = 1"
        ).fetchall()

    sent = 0
    failed = 0
    for row in rows:
        try:
            subscription = json.loads(row["subscription"])
            webpush(
                subscription_info=subscription,
                data=payload,
                vapid_private_key=vapid_private_key,
                vapid_claims={"sub": VAPID_SUBJECT},
            )
            sent += 1
        except json.JSONDecodeError as error:
            delete_push_subscription(row["endpoint"])
            failed += 1
            print(f"Failed {row['endpoint']}: {error}")
        except WebPushException as error:
            failed += 1
            if "410" in str(error) or "404" in str(error):
                delete_push_subscription(row["endpoint"])
                print(f"Removed expired subscription: {row['endpoint']}")
            print(f"Failed {row['endpoint']}: {error}")
        except Exception as error:
            failed += 1
            print(f"Failed {row['endpoint']}: {error}")

    print(f"Sent: {sent}")
    print(f"Failed: {failed}")


if __name__ == "__main__":
    main()
