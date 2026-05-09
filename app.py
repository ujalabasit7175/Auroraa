import os
from dotenv import load_dotenv
from flask import Flask, render_template, request, jsonify, session, redirect
from spotipy.oauth2 import SpotifyOAuth
import spotipy

load_dotenv()
app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY")

SPOTIPY_CLIENT_ID = os.getenv("SPOTIPY_CLIENT_ID")
SPOTIPY_CLIENT_SECRET = os.getenv("SPOTIPY_CLIENT_SECRET")
SPOTIPY_REDIRECT_URI = os.getenv("SPOTIPY_REDIRECT_URI")
scope = "streaming user-read-playback-state user-modify-playback-state user-read-email"

sp_oauth = SpotifyOAuth(client_id=SPOTIPY_CLIENT_ID,
                        client_secret=SPOTIPY_CLIENT_SECRET,
                        redirect_uri=SPOTIPY_REDIRECT_URI,
                        scope=scope)

def detect_emotion(text):
    text = text.lower()
    if any(word in text for word in ["sad", "cry", "low", "bad"]): return "sad"
    if any(word in text for word in ["love", "crush", "sweet", "heart"]): return "love"
    if any(word in text for word in ["dance", "party", "club"]): return "dance"
    if any(word in text for word in ["fun", "play", "yay"]): return "fun"
    return "happy"

mood_playlists = {
    "happy": "spotify:playlist:5LmUJlDTi4xx0KH1aHyrDQ",
    "sad": "spotify:playlist:7q41DjzVgggs4ZteCjZAuS",
    "love": "spotify:playlist:5sLAMoLH6MkF0Y0DCEUhfu",
    "dance": "spotify:playlist:6qVBCuRUrMNVTcrZzvi9y0",
    "fun": "spotify:playlist:5LmUJlDTi4xx0KH1aHyrDQ"
}

@app.route("/")
def home():
    if not session.get("token_info"):
        return redirect("/login")
    return render_template("index.html")

@app.route("/detect-mood", methods=["POST"])
def detect_mood_route():
    token_info = session.get("token_info")
    if not token_info:
        return jsonify({"error": "Login required"}), 401
    
    sp = spotipy.Spotify(auth=token_info['access_token'])
    data = request.json
    mood = detect_emotion(data.get("text", ""))
    playlist_uri = mood_playlists.get(mood, mood_playlists["happy"])

    try:
        # Step 1: Find an active device
        devices = sp.devices()
        active_device = next((d for d in devices['devices'] if d['is_active']), None)
        
        # Step 2: If no active device, just grab the first available one
        device_id = active_device['id'] if active_device else (devices['devices'][0]['id'] if devices['devices'] else None)

        if not device_id:
            return jsonify({"status": "error", "message": "Please open Spotify on your device first!"})

        # Step 3: Play!
        sp.start_playback(device_id=device_id, context_uri=playlist_uri)
        return jsonify({"status": "success", "mood": mood})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

@app.route("/login")
def login():
    return redirect(sp_oauth.get_authorize_url())

@app.route("/callback")
def callback():
    session['token_info'] = sp_oauth.get_access_token(request.args.get("code"))
    return redirect("/")

if __name__ == "__main__":
    app.run(debug=True)