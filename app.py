from flask import Flask, render_template, request, jsonify
from datetime import datetime
import json
import os

app = Flask(__name__)
app.secret_key = 'your_secret_key'

DATA_FILE = 'mood_scheduler_data.json'

def load_data():
    if not os.path.exists(DATA_FILE):
        return {'moods': [], 'tasks': []}
    with open(DATA_FILE, 'r') as f:
        return json.load(f)

def save_data(data):
    with open(DATA_FILE, 'w') as f:
        json.dump(data, f, indent=4)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/analyze_mood', methods=['POST'])
def analyze_mood():
    data = request.get_json()
    mood_text = data.get('mood_text', '').lower()

    sentiment = 'neutral'
    emoji = '😐'
    intensity = 0.5
    tips = []
    if 'happy' in mood_text:
        sentiment = 'positive'
        emoji = '😊'
        intensity = 0.9
        tips = [
            "Keep up the positive vibes!",
            "Share your happiness with others.",
            "Take time to appreciate the good moments."
        ]
    elif 'sad' in mood_text:
        sentiment = 'negative'
        emoji = '😢'
        intensity = 0.8
        tips = [
            "It's okay to feel sad sometimes.",
            "Try to do something you enjoy.",
            "Reach out to friends or family for support."
        ]
    else:
        tips = ["Try to express your feelings more clearly for better analysis."]

    # Store mood data
    all_data = load_data()
    mood_entry = {
        'text': mood_text,
        'sentiment': sentiment,
        'emoji': emoji,
        'intensity': intensity,
        'tips': tips,
        'timestamp': datetime.utcnow().isoformat() + 'Z'
    }
    all_data['moods'].append(mood_entry)
    save_data(all_data)

    return jsonify(mood_entry)

@app.route('/api/add_task', methods=['POST'])
def add_task():
    data = request.get_json()
    title = data.get('title')
    start = data.get('start')
    end = data.get('end')
    description = data.get('description', '')

    if not title or not start or not end:
        return jsonify({'error': 'Missing required fields'}), 400

    all_data = load_data()
    task_id = len(all_data['tasks']) + 1
    task = {
        'id': task_id,
        'title': title,
        'start': start,
        'end': end,
        'description': description
    }
    all_data['tasks'].append(task)
    save_data(all_data)

    return jsonify(task), 201

@app.route('/api/get_tasks', methods=['GET'])
def get_tasks():
    all_data = load_data()
    return jsonify(all_data['tasks'])

if __name__ == '__main__':
    app.run(debug=True)
