"""
File I/O Tools — Read and write markdown project files.

All file operations are scoped to the projects/ directory.
Each book project gets its own subdirectory with a standard structure.
"""

import json
import os
from pathlib import Path

# Base directory for all projects
PROJECTS_DIR = Path(__file__).parent.parent / "projects"


def _ensure_project_dir(book_name: str) -> Path:
    """Ensure the project directory structure exists and return the path."""
    project_dir = PROJECTS_DIR / book_name
    project_dir.mkdir(parents=True, exist_ok=True)
    (project_dir / "research").mkdir(exist_ok=True)
    (project_dir / "chapters").mkdir(exist_ok=True)
    (project_dir / "edits").mkdir(exist_ok=True)

    # Create metadata if it doesn't exist
    meta_path = project_dir / "metadata.json"
    if not meta_path.exists():
        meta_path.write_text(json.dumps({
            "book_name": book_name,
            "created": str(Path()),
            "status": "ideation",
        }, indent=2))

    return project_dir


def save_ideas(book_name: str, content: str) -> str:
    """Save confirmed ideas to the project's ideas.md file.

    Args:
        book_name: Name of the book project.
        content: Markdown-formatted ideas content to save.

    Returns:
        Confirmation message with the file path.
    """
    project_dir = _ensure_project_dir(book_name)
    path = project_dir / "ideas.md"
    path.write_text(content, encoding="utf-8")
    return f"Ideas saved to {path.relative_to(PROJECTS_DIR.parent)}"


def load_ideas(book_name: str) -> str:
    """Load saved ideas from the project's ideas.md file.

    Args:
        book_name: Name of the book project.

    Returns:
        The ideas content, or a message if no ideas exist yet.
    """
    project_dir = _ensure_project_dir(book_name)
    path = project_dir / "ideas.md"
    if path.exists():
        return path.read_text(encoding="utf-8")
    return "No ideas saved yet for this project."


def save_outline(book_name: str, content: str) -> str:
    """Save the book outline to the project's outline.md file.

    Args:
        book_name: Name of the book project.
        content: Markdown-formatted outline content to save.

    Returns:
        Confirmation message with the file path.
    """
    project_dir = _ensure_project_dir(book_name)
    path = project_dir / "outline.md"
    path.write_text(content, encoding="utf-8")
    return f"Outline saved to {path.relative_to(PROJECTS_DIR.parent)}"


def load_outline(book_name: str) -> str:
    """Load the book outline from the project's outline.md file.

    Args:
        book_name: Name of the book project.

    Returns:
        The outline content, or a message if no outline exists yet.
    """
    project_dir = _ensure_project_dir(book_name)
    path = project_dir / "outline.md"
    if path.exists():
        return path.read_text(encoding="utf-8")
    return "No outline created yet for this project."


def save_chapter(book_name: str, chapter_number: int, content: str) -> str:
    """Save a chapter draft to the project's chapters directory.

    Args:
        book_name: Name of the book project.
        chapter_number: Chapter number (1-indexed).
        content: Markdown-formatted chapter content.

    Returns:
        Confirmation message with the file path.
    """
    project_dir = _ensure_project_dir(book_name)
    filename = f"chapter-{chapter_number:02d}.md"
    path = project_dir / "chapters" / filename
    path.write_text(content, encoding="utf-8")
    return f"Chapter {chapter_number} saved to {path.relative_to(PROJECTS_DIR.parent)}"


def load_chapter(book_name: str, chapter_number: int) -> str:
    """Load a chapter draft from the project's chapters directory.

    Args:
        book_name: Name of the book project.
        chapter_number: Chapter number (1-indexed).

    Returns:
        The chapter content, or a message if the chapter doesn't exist yet.
    """
    project_dir = _ensure_project_dir(book_name)
    filename = f"chapter-{chapter_number:02d}.md"
    path = project_dir / "chapters" / filename
    if path.exists():
        return path.read_text(encoding="utf-8")
    return f"Chapter {chapter_number} has not been drafted yet."


def save_research(book_name: str, topic: str, content: str) -> str:
    """Save a research report to the project's research directory.

    Args:
        book_name: Name of the book project.
        topic: Research topic (used as filename, sanitized).
        content: Markdown-formatted research report.

    Returns:
        Confirmation message with the file path.
    """
    project_dir = _ensure_project_dir(book_name)
    # Sanitize topic for filename
    safe_topic = topic.lower().replace(" ", "-")
    safe_topic = "".join(c for c in safe_topic if c.isalnum() or c == "-")
    filename = f"{safe_topic}.md"
    path = project_dir / "research" / filename
    path.write_text(content, encoding="utf-8")
    return f"Research report saved to {path.relative_to(PROJECTS_DIR.parent)}"


def save_edit_report(book_name: str, chapter_number: int, content: str) -> str:
    """Save an editing report for a chapter.

    Args:
        book_name: Name of the book project.
        chapter_number: Chapter number the report is for.
        content: Markdown-formatted editing report.

    Returns:
        Confirmation message with the file path.
    """
    project_dir = _ensure_project_dir(book_name)
    filename = f"chapter-{chapter_number:02d}-report.md"
    path = project_dir / "edits" / filename
    path.write_text(content, encoding="utf-8")
    return f"Edit report saved to {path.relative_to(PROJECTS_DIR.parent)}"


def list_project_files(book_name: str) -> str:
    """List all files in a book project directory.

    Args:
        book_name: Name of the book project.

    Returns:
        A formatted list of all files in the project.
    """
    project_dir = _ensure_project_dir(book_name)
    files = []
    for root, dirs, filenames in os.walk(project_dir):
        for f in sorted(filenames):
            rel = os.path.relpath(os.path.join(root, f), project_dir)
            files.append(rel)

    if not files:
        return "Project directory is empty."

    return "Project files:\n" + "\n".join(f"  - {f}" for f in files)
