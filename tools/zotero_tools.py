"""
Zotero Tools — Search and browse the user's Zotero reference library.

Uses pyzotero to interact with the Zotero Web API.
Configured via environment variables.
"""

import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

# Zotero configuration
ZOTERO_API_KEY = os.getenv("ZOTERO_API_KEY", "")
ZOTERO_LIBRARY_ID = os.getenv("ZOTERO_LIBRARY_ID", "")
ZOTERO_LIBRARY_TYPE = os.getenv("ZOTERO_LIBRARY_TYPE", "user")
ZOTERO_STORAGE_PATH = os.getenv(
    "ZOTERO_STORAGE_PATH", str(Path.home() / "Zotero" / "storage")
)


def _get_zotero_client():
    """Get a configured pyzotero client."""
    if not ZOTERO_API_KEY or not ZOTERO_LIBRARY_ID:
        return None
    try:
        from pyzotero import zotero
        return zotero.Zotero(ZOTERO_LIBRARY_ID, ZOTERO_LIBRARY_TYPE, ZOTERO_API_KEY)
    except ImportError:
        return None


def search_zotero_library(query: str, limit: int = 20) -> str:
    """Search across all items in the user's Zotero library.

    Args:
        query: Search query string.
        limit: Maximum number of results (default 20).

    Returns:
        Formatted list of matching Zotero items with title, authors,
        date, item type, and attachment info.
    """
    zot = _get_zotero_client()
    if zot is None:
        return (
            "Zotero is not configured. Please set ZOTERO_API_KEY and "
            "ZOTERO_LIBRARY_ID in your .env file."
        )

    try:
        items = zot.items(q=query, limit=limit, sort="relevance")
    except Exception as e:
        return f"Zotero search failed: {e}"

    if not items:
        return f"No items found in Zotero for query: '{query}'"

    results = []
    for i, item in enumerate(items, 1):
        data = item.get("data", {})
        item_type = data.get("itemType", "unknown")

        # Skip attachments and notes in top-level results
        if item_type in ("attachment", "note"):
            continue

        title = data.get("title", "Untitled")
        creators = data.get("creators", [])
        author_str = ", ".join(
            f"{c.get('lastName', '')}, {c.get('firstName', '')}"
            for c in creators[:3]
        )
        if len(creators) > 3:
            author_str += " et al."

        date = data.get("date", "N/A")
        abstract = data.get("abstractNote", "")
        if abstract and len(abstract) > 200:
            abstract = abstract[:200] + "..."

        item_key = item.get("key", "")
        url = data.get("url", "")

        # Check for local PDF
        has_pdf = _check_local_pdf(item_key)
        pdf_status = "📄 PDF available locally" if has_pdf else "No local PDF"

        results.append(
            f"### {i}. {title}\n"
            f"**Authors**: {author_str}\n"
            f"**Date**: {date} | **Type**: {item_type}\n"
            f"**Zotero Key**: {item_key}\n"
            f"**URL**: {url}\n"
            f"**PDF**: {pdf_status}\n"
            f"**Abstract**: {abstract or 'No abstract'}\n"
        )

    if not results:
        return f"No relevant items found in Zotero for: '{query}'"

    return f"## Zotero Library Results for: '{query}'\n\n" + "\n---\n".join(results)


def list_zotero_collections() -> str:
    """List all collections in the user's Zotero library.

    Returns:
        Formatted list of collections with names, item counts, and keys.
    """
    zot = _get_zotero_client()
    if zot is None:
        return (
            "Zotero is not configured. Please set ZOTERO_API_KEY and "
            "ZOTERO_LIBRARY_ID in your .env file."
        )

    try:
        collections = zot.collections()
    except Exception as e:
        return f"Failed to list Zotero collections: {e}"

    if not collections:
        return "No collections found in your Zotero library."

    results = []
    for coll in collections:
        data = coll.get("data", {})
        name = data.get("name", "Unnamed")
        key = data.get("key", "")
        num_items = data.get("numItems", 0)
        parent = data.get("parentCollection", "")

        indent = "  " if parent else ""
        results.append(
            f"{indent}- **{name}** ({num_items} items) [key: `{key}`]"
        )

    return "## Zotero Collections\n\n" + "\n".join(results)


def get_collection_items(collection_key: str, limit: int = 20) -> str:
    """Get items from a specific Zotero collection.

    Args:
        collection_key: The Zotero collection key.
        limit: Maximum number of items to return.

    Returns:
        Formatted list of items in the collection.
    """
    zot = _get_zotero_client()
    if zot is None:
        return "Zotero is not configured."

    try:
        items = zot.collection_items(collection_key, limit=limit)
    except Exception as e:
        return f"Failed to get collection items: {e}"

    if not items:
        return "No items found in this collection."

    results = []
    for i, item in enumerate(items, 1):
        data = item.get("data", {})
        item_type = data.get("itemType", "unknown")
        if item_type in ("attachment", "note"):
            continue

        title = data.get("title", "Untitled")
        creators = data.get("creators", [])
        author_str = ", ".join(
            c.get("lastName", "Unknown") for c in creators[:3]
        )
        date = data.get("date", "N/A")
        item_key = item.get("key", "")
        has_pdf = _check_local_pdf(item_key)

        results.append(
            f"{i}. **{title}** — {author_str} ({date}) "
            f"[key: `{item_key}`] {'📄' if has_pdf else ''}"
        )

    return "## Collection Items\n\n" + "\n".join(results)


def _check_local_pdf(item_key: str) -> bool:
    """Check if a local PDF exists for a Zotero item."""
    storage_path = Path(ZOTERO_STORAGE_PATH)
    if not storage_path.exists():
        return False

    item_dir = storage_path / item_key
    if not item_dir.exists():
        return False

    return any(f.suffix.lower() == ".pdf" for f in item_dir.iterdir())


def get_local_pdf_path(item_key: str) -> str:
    """Get the local file path for a PDF attached to a Zotero item.

    Args:
        item_key: The Zotero item key.

    Returns:
        The absolute path to the PDF file, or an error message.
    """
    storage_path = Path(ZOTERO_STORAGE_PATH)
    item_dir = storage_path / item_key

    if not item_dir.exists():
        return f"No local storage found for item key: {item_key}"

    pdfs = [f for f in item_dir.iterdir() if f.suffix.lower() == ".pdf"]
    if not pdfs:
        return f"No PDF found in local storage for item key: {item_key}"

    return str(pdfs[0])
