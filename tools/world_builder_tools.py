"""
World Builder Tools — File I/O for fictional world development.

Manages the World/ subdirectory within a project, organizing
world-building artifacts into categorized subfolders.
"""

import json
import os
from pathlib import Path
from typing import Optional

PROJECTS_DIR = Path(__file__).parent.parent / "projects"

# Canonical subfolder names for each world-building category
WORLD_FOLDERS = {
    "characters": "Characters",
    "character": "Characters",
    "locations": "Locations",
    "location": "Locations",
    "environments": "Locations",
    "environment": "Locations",
    "factions": "Factions",
    "faction": "Factions",
    "politics": "Factions",
    "political": "Factions",
    "organizations": "Factions",
    "history": "History",
    "timeline": "History",
    "timelines": "History",
    "events": "History",
    "magic": "Magic & Systems",
    "technology": "Magic & Systems",
    "systems": "Magic & Systems",
    "religion": "Magic & Systems",
    "culture": "Culture",
    "languages": "Culture",
    "customs": "Culture",
    "flora": "Flora & Fauna",
    "fauna": "Flora & Fauna",
    "creatures": "Flora & Fauna",
    "beasts": "Flora & Fauna",
    "maps": "Maps",
    "map": "Maps",
    "geography": "Maps",
    "lore": "Lore",
    "notes": "Notes",
    "misc": "Notes",
}


def _world_dir(book_name: str) -> Path:
    """Return the World/ directory for a project, creating it if needed."""
    world = PROJECTS_DIR / book_name / "World"
    world.mkdir(parents=True, exist_ok=True)
    return world


def _resolve_folder(category: str) -> str:
    """Map a user-supplied category name to the canonical subfolder name."""
    key = category.strip().lower()
    return WORLD_FOLDERS.get(key, category.title())


def save_world_entry(
    book_name: str,
    category: str,
    entry_name: str,
    content: str,
) -> str:
    """Save a world-building entry to the appropriate category folder.

    Args:
        book_name: Name of the book/project.
        category: Category (e.g., 'characters', 'locations', 'factions').
        entry_name: Name of the entry (used as filename, e.g., 'Aria Dawnforge').
        content: Full markdown content for this entry.

    Returns:
        Confirmation message with the saved file path.
    """
    folder_name = _resolve_folder(category)
    folder = _world_dir(book_name) / folder_name
    folder.mkdir(exist_ok=True)

    safe_name = "".join(c if c.isalnum() or c in " _-" else "" for c in entry_name)
    safe_name = safe_name.strip().replace(" ", "_")
    filename = f"{safe_name}.md"
    path = folder / filename
    path.write_text(content, encoding="utf-8")
    return f"✅ Saved '{entry_name}' to World/{folder_name}/{filename}"


def load_world_entry(book_name: str, category: str, entry_name: str) -> str:
    """Load a specific world-building entry.

    Args:
        book_name: Name of the book/project.
        category: Category subfolder.
        entry_name: Name of the entry.

    Returns:
        The markdown content, or an error message if not found.
    """
    folder_name = _resolve_folder(category)
    safe_name = "".join(c if c.isalnum() or c in " _-" else "" for c in entry_name)
    safe_name = safe_name.strip().replace(" ", "_")
    path = _world_dir(book_name) / folder_name / f"{safe_name}.md"
    if path.exists():
        return path.read_text(encoding="utf-8")
    return f"No entry found for '{entry_name}' in {folder_name}."


def list_world_entries(book_name: str, category: Optional[str] = None) -> str:
    """List world-building entries, optionally filtered by category.

    Args:
        book_name: Name of the book/project.
        category: Optional category filter. If None, lists all entries.

    Returns:
        A formatted markdown list of entries.
    """
    world = _world_dir(book_name)

    if category:
        folder_name = _resolve_folder(category)
        folder = world / folder_name
        if not folder.exists():
            return f"No entries yet in {folder_name}."
        files = sorted(folder.glob("*.md"))
        if not files:
            return f"No entries yet in {folder_name}."
        names = [f.stem.replace("_", " ") for f in files]
        return f"**{folder_name}**\n" + "\n".join(f"  - {n}" for n in names)

    # All categories
    result_lines = []
    for folder in sorted(world.iterdir()):
        if folder.is_dir():
            files = sorted(folder.glob("*.md"))
            if files:
                result_lines.append(f"**{folder.name}** ({len(files)} entries)")
                for f in files:
                    result_lines.append(f"  - {f.stem.replace('_', ' ')}")
    if not result_lines:
        return "The World folder is empty — let's start building!"
    return "\n".join(result_lines)


def save_world_timeline(book_name: str, timeline_name: str, events: list[dict]) -> str:
    """Save a timeline as a formatted markdown file.

    Args:
        book_name: Name of the book/project.
        timeline_name: Name of the timeline (e.g., 'Age of Empires').
        events: List of dicts with keys: year (str), title (str), description (str).
                Example: [{'year': '340 AE', 'title': 'Fall of Valdris', 'description': '...'}]

    Returns:
        Confirmation message.
    """
    lines = [f"# Timeline: {timeline_name}\n"]
    for event in events:
        year = event.get("year", "Unknown")
        title = event.get("title", "Untitled Event")
        description = event.get("description", "")
        lines.append(f"## {year} — {title}")
        if description:
            lines.append(f"\n{description}\n")
    content = "\n".join(lines)

    safe_name = timeline_name.strip().replace(" ", "_")
    safe_name = "".join(c if c.isalnum() or c == "_" else "" for c in safe_name)
    folder = _world_dir(book_name) / "History"
    folder.mkdir(exist_ok=True)
    path = folder / f"timeline_{safe_name}.md"
    path.write_text(content, encoding="utf-8")
    return f"✅ Timeline '{timeline_name}' saved to World/History/timeline_{safe_name}.md"


def get_world_summary(book_name: str) -> str:
    """Return a concise summary of everything built so far for the world.

    Args:
        book_name: Name of the book/project.

    Returns:
        Summary string of entity counts per category.
    """
    world = _world_dir(book_name)
    summary = [f"## World Summary: {book_name}\n"]
    total = 0
    for folder in sorted(world.iterdir()):
        if folder.is_dir():
            count = len(list(folder.glob("*.md")))
            if count:
                summary.append(f"- **{folder.name}**: {count} entr{'y' if count == 1 else 'ies'}")
                total += count
    summary.append(f"\n**Total entries**: {total}")
    if total == 0:
        return "No world entries yet. Start by creating characters, locations, or a timeline!"
    return "\n".join(summary)
