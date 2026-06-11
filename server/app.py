from flask import Flask, jsonify, request, g
import sqlite3
import os
from flask_cors import CORS

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'button.db')

app = Flask(__name__)
CORS(app)  # in production restrict origins

def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DB_PATH)
        db.row_factory = sqlite3.Row
    return db

def init_db():
    with app.app_context():
        db = get_db()
        db.executescript('''
        CREATE TABLE IF NOT EXISTS statistics (
            id INTEGER PRIMARY KEY,
            key TEXT UNIQUE,
            value INTEGER DEFAULT 0
        );
        ''')
        # ensure all keys exist
        keys = ['total_visitors','total_presses','gooses_released','potatoes_detected','government_investigations','button_prime_defeats','rickroll_victims','alien_contacts','achievement_unlocks']
        cur = db.cursor()
        for k in keys:
            cur.execute('INSERT OR IGNORE INTO statistics(key,value) VALUES(?,?)', (k, 0))
        db.commit()

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

def read_all_stats():
    db = get_db()
    cur = db.execute('SELECT key,value FROM statistics')
    rows = cur.fetchall()
    return {r['key']: r['value'] for r in rows}

@app.route('/api/stats', methods=['GET'])
def api_stats():
    return jsonify(read_all_stats())

@app.route('/api/press', methods=['POST'])
def api_press():
    delta = int(request.json.get('delta', 1))
    db = get_db()
    db.execute('UPDATE statistics SET value = value + ? WHERE key = ?', (delta, 'total_presses'))
    db.commit()
    return jsonify(read_all_stats())

@app.route('/api/event', methods=['POST'])
def api_event():
    data = request.json or {}
    etype = data.get('type')
    delta = int(data.get('delta', 1))
    mapping = {
        'goose': 'gooses_released',
        'potato': 'potatoes_detected',
        'rickroll': 'rickroll_victims',
        'alien': 'alien_contacts',
        'button_prime': 'button_prime_defeats',
        'achievement': 'achievement_unlocks',
        'investigation': 'government_investigations'
    }
    key = mapping.get(etype)
    if not key:
        return jsonify({'error':'unknown event type'}), 400
    db = get_db()
    db.execute('UPDATE statistics SET value = value + ? WHERE key = ?', (delta, key))
    db.commit()
    return jsonify(read_all_stats())

@app.route('/api/visit', methods=['POST'])
def api_visit():
    db = get_db()
    db.execute('UPDATE statistics SET value = value + 1 WHERE key = ?', ('total_visitors',))
    db.commit()
    return jsonify(read_all_stats())

if __name__ == '__main__':
    if not os.path.exists(DB_PATH):
        init_db()
    app.run(host='0.0.0.0', port=5000)
