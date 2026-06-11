import sqlite3
import os
import sys

DB_PATH = os.path.join(os.path.dirname(__file__), 'button.db')

def init_db():
    # Use a local db_path so we don't need to rebind the module-level DB_PATH
    db_path = DB_PATH
    dirpath = os.path.dirname(db_path)
    # ensure target directory exists; if creation fails, fall back to a per-user location
    try:
        os.makedirs(dirpath, exist_ok=True)
    except Exception as e:
        print(f"Warning: could not ensure directory {dirpath}: {e}", file=sys.stderr)
        fallback_dir = os.path.join(os.path.expanduser('~'), '.button_site')
        print(f"Attempting fallback directory {fallback_dir}", file=sys.stderr)
        try:
            os.makedirs(fallback_dir, exist_ok=True)
            db_path = os.path.join(fallback_dir, 'button.db')
            dirpath = fallback_dir
        except Exception as e2:
            print(f"Failed to create fallback directory {fallback_dir}: {e2}", file=sys.stderr)
            sys.exit(1)

    # try opening/creating the sqlite file
    try:
        conn = sqlite3.connect(db_path)
    except Exception as e:
        print(f"Failed to open database file {db_path}: {e}", file=sys.stderr)
        print("Possible causes: directory not writable or SELinux/AppArmor restrictions.", file=sys.stderr)
        print(f"Suggestion: adjust permissions, for example: sudo chown -R $(whoami) {dirpath}", file=sys.stderr)
        sys.exit(1)

    cur = conn.cursor()
    cur.executescript('''
    CREATE TABLE IF NOT EXISTS statistics (
        id INTEGER PRIMARY KEY,
        key TEXT UNIQUE,
        value INTEGER DEFAULT 0
    );
    ''')
    keys = ['total_visitors','total_presses','gooses_released','potatoes_detected','government_investigations','button_prime_defeats','rickroll_victims','alien_contacts','achievement_unlocks']
    for k in keys:
        cur.execute('INSERT OR IGNORE INTO statistics(key,value) VALUES(?,?)', (k,0))
    conn.commit()
    conn.close()
    return db_path

if __name__ == '__main__':
    final_path = init_db()
    print('Initialized', final_path)
