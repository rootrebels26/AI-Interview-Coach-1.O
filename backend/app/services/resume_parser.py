import io
import re
from typing import Dict, Any, List
from app.schemas.interview import ResumeData, EducationItem, ProjectItem, ExperienceItem

# Known common programming languages and technical keywords for accurate matching
KNOWN_LANGUAGES = {
    "python", "javascript", "typescript", "java", "c++", "c", "c#", "go", "golang",
    "rust", "ruby", "php", "swift", "kotlin", "scala", "r", "sql", "bash", "shell",
    "html", "html5", "css", "css3", "dart"
}

KNOWN_SKILLS = {
    "react", "react.js", "next.js", "vue", "vue.js", "angular", "node", "node.js",
    "express", "fastapi", "flask", "django", "spring", "spring boot", "tailwind",
    "tailwind css", "bootstrap", "docker", "kubernetes", "aws", "azure", "gcp",
    "postgresql", "mysql", "mongodb", "redis", "graphql", "rest api", "git", "github",
    "ci/cd", "linux", "machine learning", "deep learning", "pytorch", "tensorflow",
    "pandas", "numpy", "scikit-learn", "opencv", "nlp", "microservices", "kafka",
    "system design", "agile", "scrum", "unit testing", "jest", "pytest"
}

def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """Extracts text from PDF bytes using PyMuPDF (fitz), with PyPDF2 fallback."""
    text_content = []
    
    # Try PyMuPDF first
    try:
        import fitz  # PyMuPDF
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        for page in doc:
            text = page.get_text()
            if text:
                text_content.append(text)
        doc.close()
        combined = "\n".join(text_content).strip()
        if combined:
            return combined
    except Exception as e:
        print(f"[PyMuPDF extraction note]: {e}")

    # Fallback to PyPDF2 if fitz fails
    try:
        import PyPDF2
        reader = PyPDF2.PdfReader(io.BytesIO(pdf_bytes))
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text_content.append(page_text)
        return "\n".join(text_content).strip()
    except Exception as e:
        print(f"[PyPDF2 fallback note]: {e}")

    return "\n".join(text_content).strip()

def extract_text_from_docx(docx_bytes: bytes) -> str:
    """Extracts text from DOCX bytes using python-docx."""
    import docx
    doc = docx.Document(io.BytesIO(docx_bytes))
    text_content = []
    for para in doc.paragraphs:
        if para.text and para.text.strip():
            text_content.append(para.text.strip())
    for table in doc.tables:
        for row in table.rows:
            row_text = [cell.text.strip() for cell in row.cells if cell.text.strip()]
            if row_text:
                text_content.append(" | ".join(row_text))
    return "\n".join(text_content).strip()

def parse_resume_deterministic(text: str) -> ResumeData:
    """Parses raw resume text into structured fields without fabricating missing info."""
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    if not lines:
        return ResumeData(
            candidate_background="No readable text found in resume.",
            summary="Resume file appeared empty or unscannable."
        )

    # 1. Candidate Name (heuristic: first clean non-header line that looks like a real person's name)
    candidate_name = ""
    non_name_terms = {
        "resume", "curriculum", "vitae", "cv", "page", "phone", "email", "@", "http",
        "github", "linkedin", "portfolio", "summary", "profile", "contact",
        "experience", "education", "skills", "projects", "project", "portal",
        "system", "online", "examination", "viva", "application", "platform",
        "website", "service", "app", "dashboard", "manager", "management",
        "developer", "engineer", "analyst", "intern", "university", "college",
        "school", "institute", "bachelor", "master", "degree", "technologies",
        "technical", "frontend", "backend", "fullstack", "software", "data", "cloud"
    }
    for line in lines[:8]:
        clean = line.strip()
        # Handle "Name: Sagneek Sen" or "Candidate Name: Sagneek Sen"
        clean = re.sub(r'^(name|candidate\s*name|candidate)\s*[:\-]\s*', '', clean, flags=re.IGNORECASE).strip()
        words = clean.split()
        if 1 <= len(words) <= 4 and not any(kw in clean.lower() for kw in non_name_terms):
            # Check that it contains valid name characters (letters, spaces, periods, hyphens)
            if re.match(r"^[A-Za-z\s\.\'-]+$", clean) and len(clean) >= 2:
                clean_words_lower = [w.lower().strip(".,-") for w in words]
                if not any(w in non_name_terms for w in clean_words_lower):
                    candidate_name = clean
                    break

    # 2. Languages & Skills extraction
    lowered_full = text.lower()
    found_languages = []
    for lang in KNOWN_LANGUAGES:
        pattern = r'\b' + re.escape(lang) + r'\b'
        if re.search(pattern, lowered_full):
            # Display nicely formatted name
            found_languages.append(lang.title() if lang not in ("sql", "html", "css", "ci/cd") else lang.upper())

    found_skills = []
    for skill in KNOWN_SKILLS:
        pattern = r'\b' + re.escape(skill) + r'\b'
        if re.search(pattern, lowered_full):
            found_skills.append(skill.title())

    # Deduplicate while preserving order
    found_languages = list(dict.fromkeys(found_languages))
    found_skills = list(dict.fromkeys(found_skills))

    # 3. Section Segmenting
    sections: Dict[str, List[str]] = {
        "education": [],
        "experience": [],
        "projects": [],
        "certifications": [],
        "achievements": [],
    }

    current_section = None
    for line in lines:
        lower_line = line.lower()
        if any(h in lower_line for h in ["education", "academic", "qualification"]):
            current_section = "education"
            continue
        elif any(h in lower_line for h in ["experience", "employment", "work history", "internship"]):
            current_section = "experience"
            continue
        elif any(h in lower_line for h in ["project", "personal project", "academic project"]):
            current_section = "projects"
            continue
        elif any(h in lower_line for h in ["certification", "certificate", "license"]):
            current_section = "certifications"
            continue
        elif any(h in lower_line for h in ["achievement", "honor", "award", "accomplishment"]):
            current_section = "achievements"
            continue
        elif any(h in lower_line for h in ["skills", "technical skills", "languages", "interests", "hobbies"]):
            current_section = None
            continue

        if current_section and len(line) > 3:
            sections[current_section].append(line)

    # 4. Parse Education
    education_items = []
    for line in sections["education"][:6]:
        if any(deg in line.lower() for deg in ["bachelor", "master", "b.tech", "b.e", "b.s", "m.s", "m.tech", "ph.d", "diploma", "degree", "university", "college", "school"]):
            year_match = re.search(r'\b(19\d\d|20\d\d)\b', line)
            year = year_match.group(0) if year_match else ""
            education_items.append(EducationItem(
                degree=line[:100],
                institution="",
                year=year
            ))

    # 5. Parse Projects
    project_items = []
    current_proj = None
    for line in sections["projects"][:12]:
        if len(line.split()) < 8 and not line.startswith(("-", "•", "*")):
            if current_proj:
                project_items.append(current_proj)
            current_proj = ProjectItem(title=line, description="")
        elif current_proj:
            current_proj.description += (" " + line).strip()
    if current_proj:
        project_items.append(current_proj)

    # 6. Parse Work Experience / Internships
    work_items = []
    internship_items = []
    for line in sections["experience"][:15]:
        is_intern = "intern" in line.lower()
        item = ExperienceItem(
            role=line[:60],
            company="",
            duration="",
            highlights=[line] if len(line) > 20 else []
        )
        if is_intern:
            internship_items.append(item)
        else:
            work_items.append(item)

    # 7. Candidate Background & Summary
    summary_parts = []
    if candidate_name:
        summary_parts.append(f"Candidate: {candidate_name}.")
    if found_languages:
        summary_parts.append(f"Languages: {', '.join(found_languages[:6])}.")
    if found_skills:
        summary_parts.append(f"Core Skills: {', '.join(found_skills[:8])}.")
    if education_items:
        summary_parts.append(f"Education: {education_items[0].degree}.")
    if project_items:
        summary_parts.append(f"Highlighted Projects: {', '.join([p.title for p in project_items[:3]])}.")

    summary_text = " ".join(summary_parts) if summary_parts else "Candidate resume extracted with documented skills and credentials."

    return ResumeData(
        candidate_name=candidate_name or "Candidate",
        candidate_background=summary_text,
        education=education_items,
        technical_skills=found_skills,
        programming_languages=found_languages,
        projects=project_items[:5],
        internships=internship_items[:3],
        work_experience=work_items[:5],
        certifications=sections["certifications"][:6],
        achievements=sections["achievements"][:6],
        summary=summary_text,
        extracted_text_preview=text[:1200]
    )

def parse_resume_bytes(file_bytes: bytes, file_ext: str) -> ResumeData:
    """Main extraction dispatcher: extracts text from bytes and parses structured resume."""
    if file_ext == ".pdf":
        raw_text = extract_text_from_pdf(file_bytes)
    elif file_ext == ".docx":
        raw_text = extract_text_from_docx(file_bytes)
    else:
        raw_text = ""

    return parse_resume_deterministic(raw_text)
