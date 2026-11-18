import os
from fastapi import HTTPException, UploadFile
from app.config import settings

def validate_uploaded_resume(file: UploadFile, max_size_mb: int = settings.MAX_FILE_SIZE_MB) -> str:
    """Validates resume file extension and size without permanently saving to disk."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided or filename is empty.")

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{ext}'. Allowed formats are: {', '.join(settings.ALLOWED_EXTENSIONS)}"
        )

    # Note: File size check will be validated when reading chunks in memory
    return ext
