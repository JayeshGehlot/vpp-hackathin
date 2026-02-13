import os
import json
from datetime import datetime
from flask import Flask, render_template, request, jsonify, session
from google import genai
from google.genai import types
import database

# Initialize Flask with current directory for templates and static files
app = Flask(__name__, template_folder='.', static_folder='.')
app.secret_key = os.environ.get("SECRET_KEY", "dev_secret_key_change_in_prod")

# Initialize Database
database.init_db()

# Initialize Gemini Client
client = genai.Client(api_key=os.environ.get("API_KEY"))

@app.route('/')
def index():
    return render_template('index.html')

# --- Auth Routes ---

@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({"error": "Missing credentials"}), 400
        
    user_id = database.create_user(username, password)
    if user_id:
        session['user_id'] = user_id
        session['username'] = username
        return jsonify({"message": "User created", "username": username})
    else:
        return jsonify({"error": "Username already exists"}), 409

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    user_id = database.verify_user(username, password)
    if user_id:
        session['user_id'] = user_id
        session['username'] = username
        return jsonify({"message": "Logged in", "username": username})
    else:
        return jsonify({"error": "Invalid credentials"}), 401

@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({"message": "Logged out"})

@app.route('/api/check_session', methods=['GET'])
def check_session():
    if 'user_id' in session:
        return jsonify({"logged_in": True, "username": session['username']})
    return jsonify({"logged_in": False})

# --- Data Routes ---

@app.route('/api/plan', methods=['GET', 'POST'])
def handle_plan():
    if 'user_id' not in session:
        return jsonify({"error": "Unauthorized"}), 401
        
    user_id = session['user_id']
    
    if request.method == 'POST':
        plan_data = request.json
        database.save_user_plan(user_id, plan_data)
        return jsonify({"message": "Plan saved"})
        
    elif request.method == 'GET':
        plan = database.get_user_plan(user_id)
        if plan:
            return jsonify(plan)
        else:
            return jsonify(None) # No plan yet

# --- AI Route ---

@app.route('/generate', methods=['POST'])
def generate_plan():
    if 'user_id' not in session:
        return jsonify({"error": "Unauthorized"}), 401

    try:
        data = request.json
        subject = data.get('subject')
        goal = data.get('goal')
        start_date_str = data.get('startDate')
        end_date_str = data.get('endDate')
        daily_minutes = data.get('dailyMinutes')
        difficulty = data.get('difficulty')

        # Calculate duration
        start = datetime.strptime(start_date_str, '%Y-%m-%d')
        end = datetime.strptime(end_date_str, '%Y-%m-%d')
        diff_days = (end - start).days + 1

        if diff_days < 1:
            return jsonify({"error": "End date must be after start date"}), 400

        prompt = f"""
        Create a detailed study plan for: {subject}.
        Goal: {goal}.
        Difficulty Level: {difficulty}.
        Duration: {diff_days} days (from {start_date_str} to {end_date_str}).
        Daily availability: {daily_minutes} minutes.

        Return a structured JSON response with a day-by-day breakdown.
        Each day should have a specific theme and a list of actionable tasks.
        The tasks should sum up approximately to the daily availability minutes.
        """

        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema={
                    "type": "OBJECT",
                    "properties": {
                        "overview": {"type": "STRING", "description": "A brief encouraging overview of the plan."},
                        "schedule": {
                            "type": "ARRAY",
                            "items": {
                                "type": "OBJECT",
                                "properties": {
                                    "dayOffset": {"type": "INTEGER", "description": "0 for start date, 1 for next day, etc."},
                                    "theme": {"type": "STRING"},
                                    "tasks": {
                                        "type": "ARRAY",
                                        "items": {
                                            "type": "OBJECT",
                                            "properties": {
                                                "title": {"type": "STRING"},
                                                "description": {"type": "STRING"},
                                                "minutes": {"type": "INTEGER"},
                                            },
                                            "required": ["title", "description", "minutes"]
                                        }
                                    }
                                },
                                "required": ["dayOffset", "theme", "tasks"]
                            }
                        }
                    },
                    "required": ["overview", "schedule"]
                }
            )
        )

        return jsonify(json.loads(response.text))

    except Exception as e:
        print(f"Error generating plan: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 3000))
    app.run(debug=True, port=port, host='0.0.0.0')
