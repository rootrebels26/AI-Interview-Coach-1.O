"""Utilities for extracting text from uploaded resume files."""

import pdfplumber
from docx import Document


def extract_text_from_pdf(path):
    text = ""

    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            text += page.extract_text() + "\n"

    return text


def extract_text_from_docx(path):
    doc = Document(path)

    text = ""

    for para in doc.paragraphs:
        text += para.text + "\n"

    return text
