import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'button.db')

def init_db():
    conn = sqlite3.connect(DB_PATH)
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

if __name__ == '__main__':
    init_db(); print('Initialized', DB_PATH)
