from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.schemas.interview import ResumeAnalysisResponse, ResumeData
from app.services.resume_parser import parse_resume_bytes
from app.utils.validators import validate_uploaded_resume
import os

resume_router = APIRouter(prefix="/interview", tags=["Resume"])

@resume_router.post("/analyse-resume", response_model=ResumeAnalysisResponse)
async def analyse_resume(
    file: UploadFile = File(...),
    company: str = Form(default="General"),
    role: str = Form(default="Software Engineer"),
):
    """
    Accepts candidate PDF/DOCX resume, extracts structured background, skills,
    projects, and credentials in memory, and deletes temporary data immediately.
    """
    file_ext = validate_uploaded_resume(file)

    try:
        # Read contents directly into memory buffer (enforce 10MB limit)
        max_bytes = 10 * 1024 * 1024
        contents = await file.read()
        
        if len(contents) > max_bytes:
            raise HTTPException(
                status_code=400,
                detail=f"File exceeds maximum allowed size of 10MB (file size: {len(contents) / (1024*1024):.1f}MB)"
            )
        
        if len(contents) == 0:
            raise HTTPException(status_code=400, detail="The uploaded file appears to be empty.")

        # Parse structured details
        resume_data = parse_resume_bytes(contents, file_ext)

        # Clear buffer from local reference immediately
        del contents

        return ResumeAnalysisResponse(
            success=True,
            filename=file.filename or f"resume{file_ext}",
            file_type=file_ext.replace(".", "").upper(),
            resume_data=resume_data,
            message=f"Resume parsed successfully for {role} role at {company}."
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyse resume: {str(e)}")
    finally:
        await file.close()
