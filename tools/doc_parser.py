"""
Document Parser — Extract text from various formats for voice profiling.
"""

from pathlib import Path


def parse_docx(file_path: str) -> str:
    """Extract text from a Word document (.docx).

    Args:
        file_path: Absolute path to the .docx file.

    Returns:
        Extracted text with paragraph breaks preserved.
    """
    path = Path(file_path)
    if not path.exists():
        return f"File not found: {file_path}"
    if path.suffix.lower() != ".docx":
        return f"File is not a Word document: {file_path}"

    try:
        from docx import Document
    except ImportError:
        return "python-docx is not installed. Run: pip install python-docx"

    try:
        doc = Document(str(path))
        # Keep paragraphs that have text, strip them
        paragraphs = [p.text.strip() for p in doc.paragraphs if p.text.strip()]

        if not paragraphs:
            return f"No text found in {path.name}"

        return "\n\n".join(paragraphs)
    except Exception as e:
        return f"Failed to parse Word document {path.name}: {e}"

