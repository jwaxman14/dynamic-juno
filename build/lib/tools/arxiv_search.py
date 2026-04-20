"""
ArXiv Search Tools — Search and retrieve preprints from ArXiv.

Uses the ArXiv API (free, no key required).
"""

import xml.etree.ElementTree as ET

import httpx

ARXIV_API = "http://export.arxiv.org/api/query"


def search_arxiv(query: str, max_results: int = 10) -> str:
    """Search for papers on ArXiv.

    Args:
        query: Search query (e.g., "transformer architecture attention mechanism").
        max_results: Maximum number of results (default 10, max 50).

    Returns:
        Formatted list of ArXiv papers with titles, authors, abstracts,
        and PDF links.
    """
    max_results = min(max_results, 50)
    try:
        response = httpx.get(
            ARXIV_API,
            params={
                "search_query": f"all:{query}",
                "start": 0,
                "max_results": max_results,
                "sortBy": "relevance",
                "sortOrder": "descending",
            },
            timeout=30.0,
        )
        response.raise_for_status()
    except httpx.HTTPError as e:
        return f"ArXiv search failed: {e}"

    # Parse Atom XML response
    ns = {"atom": "http://www.w3.org/2005/Atom"}
    try:
        root = ET.fromstring(response.text)
    except ET.ParseError as e:
        return f"Failed to parse ArXiv response: {e}"

    entries = root.findall("atom:entry", ns)
    if not entries:
        return f"No ArXiv papers found for query: '{query}'"

    results = []
    for i, entry in enumerate(entries, 1):
        title = entry.findtext("atom:title", "Untitled", ns).strip().replace("\n", " ")

        authors = []
        for author in entry.findall("atom:author", ns):
            name = author.findtext("atom:name", "Unknown", ns)
            authors.append(name)
        author_str = ", ".join(authors[:3])
        if len(authors) > 3:
            author_str += " et al."

        abstract = entry.findtext("atom:summary", "No abstract.", ns).strip()
        if len(abstract) > 400:
            abstract = abstract[:400] + "..."

        published = entry.findtext("atom:published", "N/A", ns)[:10]

        # Get links
        pdf_link = ""
        abs_link = ""
        for link in entry.findall("atom:link", ns):
            if link.get("title") == "pdf":
                pdf_link = link.get("href", "")
            elif link.get("type") == "text/html":
                abs_link = link.get("href", "")

        # Extract ArXiv ID from the entry id
        entry_id = entry.findtext("atom:id", "", ns)
        arxiv_id = entry_id.split("/abs/")[-1] if "/abs/" in entry_id else entry_id

        results.append(
            f"### {i}. {title}\n"
            f"**Authors**: {author_str}\n"
            f"**Published**: {published}\n"
            f"**ArXiv ID**: {arxiv_id}\n"
            f"**Abstract page**: {abs_link}\n"
            f"**PDF**: {pdf_link}\n"
            f"**Abstract**: {abstract}\n"
        )

    return f"## ArXiv Results for: '{query}'\n\n" + "\n---\n".join(results)
