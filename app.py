import os
import json
from datetime import datetime
from flask import Flask, render_template, request, jsonify
from google import genai
from google.genai import types

# Initialize Flask with current directory for templates and static files
app = Flask(__name__, template_folder='.', static_folder='.')

# Initialize Gemini Client
# We use standard os.environ for Python.
client = genai.Client(api_key=os.environ.get("API_KEY"))

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/generate', methods=['POST'])
def generate_plan():
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
    app.run(debug=True, port=3000, host='0.0.0.0')
