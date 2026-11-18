from typing import List, Optional
from pydantic import BaseModel, Field

class EducationItem(BaseModel):
    degree: str = ""
    institution: str = ""
    year: str = ""
    score: str = ""

class ProjectItem(BaseModel):
    title: str = ""
    technologies: List[str] = Field(default_factory=list)
    description: str = ""

class ExperienceItem(BaseModel):
    role: str = ""
    company: str = ""
    duration: str = ""
    highlights: List[str] = Field(default_factory=list)

class ResumeData(BaseModel):
    candidate_name: Optional[str] = ""
    candidate_background: str = ""
    education: List[EducationItem] = Field(default_factory=list)
    technical_skills: List[str] = Field(default_factory=list)
    programming_languages: List[str] = Field(default_factory=list)
    projects: List[ProjectItem] = Field(default_factory=list)
    internships: List[ExperienceItem] = Field(default_factory=list)
    work_experience: List[ExperienceItem] = Field(default_factory=list)
    certifications: List[str] = Field(default_factory=list)
    achievements: List[str] = Field(default_factory=list)
    summary: str = ""
    extracted_text_preview: str = ""

class ResumeAnalysisResponse(BaseModel):
    success: bool
    filename: str
    file_type: str
    resume_data: ResumeData
    message: str = "Resume analysed successfully"

class InterviewConfigRequest(BaseModel):
    company: str
    role: str
    interview_type: str
    difficulty: str
    job_description: Optional[str] = ""
    resume_summary: Optional[ResumeData] = None
