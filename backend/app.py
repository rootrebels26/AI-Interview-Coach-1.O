"""Flask application entrypoint for the AI Interview Coach backend."""

from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from models import db, User
from api import auth_bp, chat_bp, feedback_bp, resume_bp
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///interview_coach.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv("JWT_SECRET_KEY", "super-secret-key")

db.init_app(app)
jwt = JWTManager(app)

# Register Blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(chat_bp, url_prefix='/api/chat')
app.register_blueprint(resume_bp, url_prefix='/api/resume')
app.register_blueprint(feedback_bp, url_prefix='/api/feedback')

@app.route('/api/health', methods=['GET'])
def health():
    return {"status": "ok"}, 200

# Initialize Database
with app.app_context():
    db.create_all()
    # Create default admin if not exists
    if not User.query.filter_by(username='admin').first():
        admin = User(username='admin', email='admin@example.com', role='admin')
        admin.set_password('admin123')
        db.session.add(admin)
        db.session.commit()
        print("Default admin created: admin/admin123")

if __name__ == "__main__":
    app.run(debug=True, port=5000)
