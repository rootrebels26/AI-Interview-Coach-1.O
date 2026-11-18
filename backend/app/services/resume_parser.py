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

# Comprehensive non-name terms blacklist to reject headers, job roles, technologies, and projects
NON_NAME_TERMS = {
    # Resume meta
    "resume", "curriculum", "vitae", "cv", "page", "phone", "email", "contact", "address",
    "github", "linkedin", "portfolio", "summary", "profile", "objective", "about", "declaration",
    # Section titles
    "experience", "education", "skills", "projects", "project", "work", "history", "employment",
    "certifications", "certificate", "achievements", "awards", "activities", "publications", "interests",
    # Job roles & engineering titles
    "developer", "engineer", "architect", "designer", "analyst", "intern", "internship", "student",
    "fresher", "consultant", "specialist", "administrator", "scientist", "programmer", "manager", "lead",
    "software", "hardware", "frontend", "backend", "fullstack", "full-stack", "web", "mobile", "cloud",
    "devops", "data", "ai", "ml", "system", "systems", "application", "platform",
    # Academic & institutions
    "university", "college", "school", "institute", "academy", "department", "faculty", "bachelor",
    "master", "degree", "diploma", "b.tech", "m.tech", "btech", "mtech", "bca", "mca", "b.sc", "m.sc",
    "phd", "cgpa", "gpa", "board", "higher", "secondary", "semester", "year",
    # Technologies & project words
    "online", "viva", "examination", "exam", "portal", "management", "website", "service", "app",
    "dashboard", "database", "python", "flask", "django", "fastapi", "react", "node", "javascript",
    "technologies", "technical", "tools", "frameworks", "languages", "libraries", "architecture"
}

def extract_name_from_email_prefix(email_str: str) -> str:
    m = re.search(r'([a-zA-Z0-9_\.\+-]+)@', email_str)
    if not m:
        return ""
    user = m.group(1).lower()
    user = re.sub(r'\d+$', '', user)
    parts = re.split(r'[\._-]', user)
    parts = [p for p in parts if len(p) >= 2 and p.isalpha() and p not in NON_NAME_TERMS]
    if 1 <= len(parts) <= 3:
        return " ".join(p.capitalize() for p in parts)
    return ""

def extract_candidate_name_robustly(text: str) -> str:
    """
    Extracts the candidate's actual human person name from resume text with maximum accuracy.
    Uses multi-tiered extraction:
    1. Explicit labeled name regex (e.g. 'Name: Sagnik Sen', 'Candidate: Sagnik Sen')
    2. Header block inspection (first 15 lines, checking word counts, uppercase/titlecase, non-name terms)
    3. Email corroboration (cross-referencing with email username)
    4. Fast LLM extraction fallback (when AI provider is active)
    """
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    if not lines:
        return ""

    header_preview = "\n".join(lines[:15])
    email_match = re.search(r'[a-zA-Z0-9_\.\+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-\.]+', header_preview)
    email_name = extract_name_from_email_prefix(email_match.group(0)) if email_match else ""

    # Tier 1: Explicit labels
    label_match = re.search(
        r'(?:^|\n)\s*(?:Candidate\s*Name|Full\s*Name|Name)\s*[:\-]\s*([A-Za-z\s\.\'-]{2,35})',
        header_preview,
        re.IGNORECASE
    )
    if label_match:
        words = label_match.group(1).strip().split()
        if 1 <= len(words) <= 4 and not any(w.lower().strip(".,-") in NON_NAME_TERMS for w in words):
            return " ".join(w.capitalize() for w in words)

    # Tier 2: Structural Header Line Inspection
    candidate_found = ""
    for line in lines[:12]:
        clean = line.strip()
        # Drop lines with contact info, urls, emails, bullets
        if any(char in clean for char in ["@", "http", "www.", ".com", "+", "|", "/", "\\", ":", ";"]):
            continue
        if re.search(r'\d{3,}', clean):
            continue
        if clean.startswith(("•", "-", "*", "–", "—")):
            continue

        words = clean.split()
        if not (1 <= len(words) <= 4):
            continue

        if not re.match(r"^[A-Za-z\s\.\'-]+$", clean) or len(clean) < 2 or len(clean) > 35:
            continue

        clean_words_lower = [w.lower().strip(".,-") for w in words]
        if any(w in NON_NAME_TERMS for w in clean_words_lower):
            continue

        candidate_found = " ".join(w.capitalize() for w in words)
        break

    if candidate_found:
        if len(candidate_found.split()) == 1 and email_name and len(email_name.split()) > 1 and candidate_found.lower() in email_name.lower():
            return email_name
        return candidate_found

    if email_name and len(email_name.split()) >= 2:
        return email_name

    # Tier 3: Fast AI Name Extraction Fallback (if Groq/Gemini is configured)
    try:
        from app.services.ai_provider import call_ai, extract_json_from_text
        prompt = (
            "Extract ONLY the candidate's actual human full name from this resume header block.\n"
            "Return valid JSON: {\"name\": \"First Last\"}.\n"
            "If no human person name exists, return {\"name\": \"\"}.\n"
            f"Header:\n{header_preview[:600]}"
        )
        ai_reply = call_ai(
            messages=[{"role": "user", "content": prompt}],
            max_tokens=40,
            temperature=0.1,
            response_format={"type": "json_object"}
        )
        parsed = extract_json_from_text(ai_reply)
        ai_name = parsed.get("name", "").strip()
        ai_words = ai_name.split()
        if 1 <= len(ai_words) <= 4 and not any(w.lower().strip(".,-") in NON_NAME_TERMS for w in ai_words):
            if re.match(r"^[A-Za-z\s\.\'-]+$", ai_name) and len(ai_name) >= 2:
                return " ".join(w.capitalize() for w in ai_words)
    except Exception as e:
        print(f"[Resume AI Name Extraction Note]: {e}")

    return candidate_found or email_name or ""

def parse_resume_deterministic(text: str) -> ResumeData:
    """Parses raw resume text into structured fields without fabricating missing info."""
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    if not lines:
        return ResumeData(
            candidate_background="No readable text found in resume.",
            summary="Resume file appeared empty or unscannable."
        )

    # 1. Candidate Name (Ultra-accurate multi-tiered extractor)
    candidate_name = extract_candidate_name_robustly(text)

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
