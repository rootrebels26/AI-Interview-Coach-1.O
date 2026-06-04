"""One-off local migration helper for updating the SQLite interview table."""

from app import app, db
from models import Interview

with app.app_context():
    # Add subject column to Interview table
    try:
        db.session.execute(db.text("ALTER TABLE interview ADD COLUMN subject VARCHAR(100) DEFAULT 'general'"))
        db.session.commit()
        print("Successfully added subject column to Interview table")
    except Exception as e:
        print(f"Column might already exist or error occurred: {e}")

    # Verify the table structure
    result = db.session.execute(db.text("PRAGMA table_info(interview)"))
    columns = result.fetchall()
    print("Interview table columns:")
    for col in columns:
        print(f"  {col[1]}: {col[2]}")
