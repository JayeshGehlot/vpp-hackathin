import sqlite3
import json
from werkzeug.security import generate_password_hash, check_password_hash

DB_NAME = "mind_architect.db"

def init_db():
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    # Create Users Table
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL
        )
    ''')
    # Create Plans Table
    c.execute('''
        CREATE TABLE IF NOT EXISTS plans (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            plan_data TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    conn.commit()
    conn.close()

def create_user(username, password):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    try:
        hashed_pw = generate_password_hash(password)
        c.execute("INSERT INTO users (username, password_hash) VALUES (?, ?)", (username, hashed_pw))
        conn.commit()
        user_id = c.lastrowid
        return user_id
    except sqlite3.IntegrityError:
        return None  # Username already exists
    finally:
        conn.close()

def verify_user(username, password):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute("SELECT id, password_hash FROM users WHERE username = ?", (username,))
    user = c.fetchone()
    conn.close()
    
    if user and check_password_hash(user[1], password):
        return user[0] # Return user_id
    return None

def save_user_plan(user_id, plan_data_dict):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    # Serialize dict to JSON string
    plan_json = json.dumps(plan_data_dict)
    
    # Check if plan exists (simple 1 plan per user limit for this MVP)
    c.execute("SELECT id FROM plans WHERE user_id = ?", (user_id,))
    exists = c.fetchone()
    
    if exists:
        c.execute("UPDATE plans SET plan_data = ? WHERE user_id = ?", (plan_json, user_id))
    else:
        c.execute("INSERT INTO plans (user_id, plan_data) VALUES (?, ?)", (user_id, plan_json))
    
    conn.commit()
    conn.close()

def get_user_plan(user_id):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute("SELECT plan_data FROM plans WHERE user_id = ?", (user_id,))
    row = c.fetchone()
    conn.close()
    
    if row:
        return json.loads(row[0])
    return None
