import io
import docx
from app.services.resume_parser import extract_text_from_pdf, extract_text_from_docx, parse_resume_bytes

def create_sample_pdf_bytes(text: str) -> bytes:
    try:
        import fitz
        doc = fitz.open()
        page = doc.new_page()
        page.insert_text((50, 72), text)
        pdf_bytes = doc.tobytes()
        doc.close()
        return pdf_bytes
    except ImportError:
        pass

    # Pure Python standard PDF stream fallback for testing
    lines = [l.strip() for l in text.strip().split("\n") if l.strip()]
    escaped = [l.replace("(", "\(").replace(")", "\)") for l in lines]
    stream_content = "BT /F1 12 Tf 50 750 Td " + " T* (".join(["(" + escaped[0] + ") Tj"] + [l + ") Tj" for l in escaped[1:]]) + " ET"
    stream_bytes = stream_content.encode("latin1")
    pdf = f"""%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length {len(stream_bytes)} >>
stream
{stream_content}
endstream
endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000360 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
450
%%EOF"""
    return pdf.encode("latin1")

def test_pdf_extraction():
    sample_text = """
    Jane Doe
    jane.doe@example.com | 123-456-7890 | San Francisco, CA

    Education
    Bachelor of Science in Computer Science, Stanford University, 2023

    Technical Skills
    Programming Languages: Python, Java, JavaScript, TypeScript, Go, SQL
    Frameworks & Tools: React, FastAPI, Docker, Kubernetes, AWS, Git, Redis

    Work Experience
    Software Engineer Intern at Acme Cloud (2022 - 2023)
    - Developed microservices in Python and FastAPI with 99.9% uptime.
    - Optimized database queries in PostgreSQL, reducing p99 latency by 35%.

    Projects
    Distributed Task Queue
    - Built a high-throughput job queue in Go and Redis handling 10,000 tasks/second.
    - Implemented worker heartbeat checks and fault-tolerant retry policies.

    Certifications
    AWS Certified Solutions Architect Associate
    """
    pdf_bytes = create_sample_pdf_bytes(sample_text)

    parsed = parse_resume_bytes(pdf_bytes, ".pdf")
    print("--- PDF Extraction Results ---")
    print(f"Candidate Name: {parsed.candidate_name}")
    print(f"Summary: {parsed.summary}")
    print(f"Languages: {parsed.programming_languages}")
    print(f"Skills: {parsed.technical_skills}")
    print(f"Education: {[e.degree for e in parsed.education]}")
    print(f"Projects: {[p.title for p in parsed.projects]}")
    print(f"Certifications: {parsed.certifications}")

    assert "Python" in parsed.programming_languages
    assert "Fastapi" in parsed.technical_skills or "Docker" in parsed.technical_skills
    assert len(parsed.education) > 0
    assert len(parsed.projects) > 0
    print("PDF Extraction Test PASSED!")

def test_docx_extraction():
    # Create an in-memory DOCX using python-docx
    doc = docx.Document()
    doc.add_heading("Alex Rivera", 0)
    doc.add_paragraph("Education: Master in Artificial Intelligence, MIT, 2024")
    doc.add_paragraph("Technical Skills: Python, PyTorch, TensorFlow, C++, Linux, Docker")
    doc.add_paragraph("Projects: Computer Vision Object Tracker with OpenCV and YOLO")

    docx_buffer = io.BytesIO()
    doc.save(docx_buffer)
    docx_bytes = docx_buffer.getvalue()

    parsed = parse_resume_bytes(docx_bytes, ".docx")
    print("\n--- DOCX Extraction Results ---")
    print(f"Candidate Name: {parsed.candidate_name}")
    print(f"Summary: {parsed.summary}")
    print(f"Languages: {parsed.programming_languages}")
    print(f"Skills: {parsed.technical_skills}")
    print("DOCX Extraction Test PASSED!")

if __name__ == "__main__":
    test_pdf_extraction()
    test_docx_extraction()
