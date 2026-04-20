"""
Semantic Scholar Tools — Search academic papers via the free Semantic Scholar API.

No API key required. Rate-limited to 100 requests per 5 minutes.
"""

import httpx

API_BASE = "https://api.semanticscholar.org/graph/v1"


def search_papers(query: str, limit: int = 10) -> str:
    """Search for academic papers on Semantic Scholar.

    Args:
        query: Search query string (e.g., "cognitive load theory education").
        limit: Maximum number of results to return (default 10, max 100).

    Returns:
        Formatted list of papers with titles, authors, year, citation count,
        and URLs. Returns an error message if the search fails.
    """
    limit = min(limit, 100)
    try:
        response = httpx.get(
            f"{API_BASE}/paper/search",
            params={
                "query": query,
                "limit": limit,
                "fields": "title,authors,year,abstract,citationCount,url,externalIds",
            },
            timeout=30.0,
        )
        response.raise_for_status()
        data = response.json()
    except httpx.HTTPError as e:
        return f"Semantic Scholar search failed: {e}"

    papers = data.get("data", [])
    if not papers:
        return f"No papers found for query: '{query}'"

    results = []
    for i, paper in enumerate(papers, 1):
        authors = ", ".join(
            a.get("name", "Unknown") for a in (paper.get("authors") or [])[:3]
        )
        if len(paper.get("authors") or []) > 3:
            authors += " et al."

        year = paper.get("year", "N/A")
        citations = paper.get("citationCount", 0)
        url = paper.get("url", "")
        abstract = paper.get("abstract", "No abstract available.")
        if abstract and len(abstract) > 300:
            abstract = abstract[:300] + "..."

        paper_id = paper.get("paperId", "")

        results.append(
            f"### {i}. {paper.get('title', 'Untitled')}\n"
            f"**Authors**: {authors}\n"
            f"**Year**: {year} | **Citations**: {citations}\n"
            f"**Paper ID**: {paper_id}\n"
            f"**URL**: {url}\n"
            f"**Abstract**: {abstract}\n"
        )

    return f"## Semantic Scholar Results for: '{query}'\n\n" + "\n---\n".join(results)


def get_paper_details(paper_id: str) -> str:
    """Get detailed information about a specific paper by its Semantic Scholar ID.

    Args:
        paper_id: The Semantic Scholar paper ID.

    Returns:
        Detailed paper information including full abstract, references,
        and citation details.
    """
    try:
        response = httpx.get(
            f"{API_BASE}/paper/{paper_id}",
            params={
                "fields": (
                    "title,authors,year,abstract,citationCount,"
                    "referenceCount,url,venue,publicationDate,"
                    "externalIds,tldr"
                ),
            },
            timeout=30.0,
        )
        response.raise_for_status()
        paper = response.json()
    except httpx.HTTPError as e:
        return f"Failed to fetch paper details: {e}"

    authors = ", ".join(
        a.get("name", "Unknown") for a in (paper.get("authors") or [])
    )
    tldr = paper.get("tldr", {})
    tldr_text = tldr.get("text", "") if tldr else ""

    result = (
        f"# {paper.get('title', 'Untitled')}\n\n"
        f"**Authors**: {authors}\n"
        f"**Year**: {paper.get('year', 'N/A')}\n"
        f"**Venue**: {paper.get('venue', 'N/A')}\n"
        f"**Published**: {paper.get('publicationDate', 'N/A')}\n"
        f"**Citations**: {paper.get('citationCount', 0)} | "
        f"**References**: {paper.get('referenceCount', 0)}\n"
        f"**URL**: {paper.get('url', '')}\n\n"
    )

    if tldr_text:
        result += f"**TL;DR**: {tldr_text}\n\n"

    result += f"## Abstract\n\n{paper.get('abstract', 'No abstract available.')}\n"

    return result
