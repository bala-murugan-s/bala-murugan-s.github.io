"""
SD-WAN AI Ops Dashboard - Flask Backend
Run: python app.py
"""
from flask import Flask
from flask_cors import CORS
from routes.api import api_bp

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000", "http://127.0.0.1:3000"])

app.register_blueprint(api_bp, url_prefix="/api")

if __name__ == "__main__":
    print("=" * 55)
    print("  SD-WAN AI Ops Dashboard — Backend")
    print("  Running at: http://localhost:5000")
    print("  API prefix: /api")
    print("=" * 55)
    app.run(host="0.0.0.0", port=5000, debug=True)
