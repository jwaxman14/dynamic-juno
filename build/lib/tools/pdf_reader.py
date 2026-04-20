"""
PDF Reader — Extract text from PDF files using PyMuPDF.
"""

from pathlib import Path


def extract_pdf_text(file_path: str, max_pages: int = 0) -> str:
    """Extract text content from a PDF file.

    Args:
        file_path: Absolute path to the PDF file.
        max_pages: Maximum number of pages to extract (0 = all pages).

    Returns:
        Extracted text content from the PDF, or an error message.
    """
    path = Path(file_path)
    if not path.exists():
        return f"PDF file not found: {file_path}"
    if path.suffix.lower() != ".pdf":
        return f"File is not a PDF: {file_path}"

    try:
        import fitz  # PyMuPDF
    except ImportError:
        return "PyMuPDF is not installed. Run: pip install PyMuPDF"

    try:
        doc = fitz.open(str(path))
        text_parts = []

        page_count = len(doc)
        pages_to_read = min(page_count, max_pages) if max_pages > 0 else page_count

        for i in range(pages_to_read):
            page = doc[i]
            text = page.get_text("text")
            if text.strip():
                text_parts.append(f"--- Page {i + 1} ---\n{text.strip()}")

        doc.close()

        if not text_parts:
            return (
                f"Could not extract text from {path.name}. "
                "The PDF may be scanned/image-based."
            )

        header = (
            f"## Extracted from: {path.name}\n"
            f"**Pages read**: {pages_to_read}/{page_count}\n\n"
        )
        return header + "\n\n".join(text_parts)

    except Exception as e:
        return f"Failed to read PDF {path.name}: {e}"
