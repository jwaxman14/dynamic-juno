import asyncio
import json
import logging
import os
import shutil
import time
from contextlib import asynccontextmanager
from datetime import date as DateClass
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv

# Load environment variables immediately
load_dotenv()

from fastapi import FastAPI, Request, Form, UploadFile, File
from fastapi.responses import HTMLResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

import google.adk as adk
from google.adk.events import Event, EventActions
from google.adk.sessions import DatabaseSessionService
from google.genai import types

from agents import build_agent_team
from tools.doc_parser import parse_docx

# Load environment variables
load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("writing-team")

# Paths
BASE_DIR = Path(__file__).parent
WEB_DIR = BASE_DIR / "web"
DB_PATH = BASE_DIR / "sessions.db"
PROJECTS_DIR = BASE_DIR / "projects"


def _extract_title(content: str, fallback: str = "Untitled") -> str:
    for line in content.splitlines():
        stripped = line.strip()
        if stripped.startswith("# "):
            return stripped[2:].strip()
    return fallback


def _extract_summary(content: str) -> str:
    current: list[str] = []
    for line in content.splitlines():
        if line.strip().startswith("#"):
            continue
        if line.strip() == "":
            if current:
                return " ".join(current)[:200]
        else:
            current.append(line.strip())
    return " ".join(current)[:200] if current else ""


def _scan_for_artifacts(project_id: str, book_name: str, since: float) -> list:
    """Return artifact event dicts for any project files written since `since`."""
    if not book_name:
        return []
    project_dir = PROJECTS_DIR / book_name
    if not project_dir.exists():
        return []

    today = DateClass.today().strftime("%d %b %Y")
    results = []

    research_dir = project_dir / "research"
    if research_dir.exists():
        for f in sorted(research_dir.glob("*.md")):
            if f.stat().st_mtime >= since:
                content = f.read_text(encoding="utf-8")
                results.append({
                    "kind": "research",
                    "data": {
                        "id": f"research-{project_id}-{f.stem}",
                        "project": project_id,
                        "title": _extract_title(content, f.stem.replace("-", " ").title()),
                        "date": today,
                        "sources": content.count("**") // 2,
                        "summary": _extract_summary(content),
                        "body": content,
                    },
                })

    chapters_dir = project_dir / "chapters"
    if chapters_dir.exists():
        for f in sorted(chapters_dir.glob("chapter-*.md")):
            if f.stat().st_mtime >= since:
                content = f.read_text(encoding="utf-8")
                try:
                    ch_num = int(f.stem.split("-")[1])
                except (IndexError, ValueError):
                    ch_num = 1
                results.append({
                    "kind": "drafts",
                    "data": {
                        "id": f"draft-{project_id}-ch{ch_num:02d}",
                        "project": project_id,
                        "title": _extract_title(content, f"Chapter {ch_num}"),
                        "updated": today,
                        "words": len(content.split()),
                        "status": "draft",
                        "body": content,
                    },
                })

    outline_path = project_dir / "outline.md"
    if outline_path.exists() and outline_path.stat().st_mtime >= since:
        content = outline_path.read_text(encoding="utf-8")
        ch_count = sum(1 for l in content.splitlines() if l.strip().startswith("###"))
        results.append({
            "kind": "outlines",
            "data": {
                "id": f"outline-{project_id}",
                "project": project_id,
                "title": _extract_title(content, f"{book_name} — Outline"),
                "updated": today,
                "chapters": ch_count or content.count("\n##"),
                "body": content,
            },
        })

    ideas_path = project_dir / "ideas.md"
    if ideas_path.exists() and ideas_path.stat().st_mtime >= since:
        content = ideas_path.read_text(encoding="utf-8")
        results.append({
            "kind": "ideas",
            "data": {
                "id": f"idea-{project_id}",
                "project": project_id,
                "title": _extract_title(content, book_name),
                "updated": today,
                "body": content,
            },
        })

    return results


# ── Project index helpers ──────────────────────────────────────────────────

def _slugify(title: str) -> str:
    slug = "".join(c if c.isalnum() or c == " " else "" for c in title.lower().strip())
    return "-".join(slug.split()) or f"project-{int(time.time())}"


def _read_projects_index() -> list:
    index_path = BASE_DIR / ".projects-index.json"
    if index_path.exists():
        try:
            return json.loads(index_path.read_text(encoding="utf-8"))
        except Exception:
            pass
    return []


def _write_projects_index(projects: list) -> None:
    (BASE_DIR / ".projects-index.json").write_text(
        json.dumps(projects, indent=2, ensure_ascii=False), encoding="utf-8"
    )


def _upsert_project(entry: dict) -> None:
    projects = [p for p in _read_projects_index() if p["id"] != entry["id"]]
    projects.append(entry)
    _write_projects_index(projects)


def _compute_project_stats(book_name: str) -> dict:
    chapters_dir = PROJECTS_DIR / book_name / "chapters"
    word_count, chapter_count = 0, 0
    if chapters_dir.exists():
        for f in chapters_dir.glob("chapter-*.md"):
            word_count += len(f.read_text(encoding="utf-8").split())
            chapter_count += 1
    return {"wordCount": word_count, "chapters": chapter_count}

# Global application state
app_state = {}

class ChatRequest(BaseModel):
    message: str
    session_id: str
    project_id: str = ""
    book_name: str = ""


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting Writing Team Server...")
    
    # Verify API Keys
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key or "your-gemini-api-key" in api_key:
        logger.warning("CRITICAL: GOOGLE_API_KEY is not set or is still the placeholder in .env!")
        logger.warning("The agents will fail when you try to chat.")
    
    # Initialize Session Service (SQLite)
    db_uri = f"sqlite:///{DB_PATH.absolute()}"
    session_service = DatabaseSessionService(db_url=db_uri)
    app_state["session_service"] = session_service
    
    # Build the agent team
    root_agent = build_agent_team()
    
    # Initialize Runner
    runner = adk.Runner(
        agent=root_agent,
        app_name="writing-team",
        session_service=session_service,
    )
    app_state["runner"] = runner
    
    yield
    
    # Shutdown
    logger.info("Shutting down...")


app = FastAPI(lifespan=lifespan)

# Mount static files (UI)
app.mount("/static", StaticFiles(directory=WEB_DIR), name="static")

@app.get("/", response_class=HTMLResponse)
async def get_index():
    """Serve the main UI."""
    return (WEB_DIR / "index.html").read_text()


async def get_or_create_session(user_id: str, session_id: str):
    session_service = app_state["session_service"]
    try:
        session = await session_service.get_session(
            app_name="writing-team",
            user_id=user_id,
            session_id=session_id
        )
        if not session:
            session = await session_service.create_session(
                app_name="writing-team",
                user_id=user_id,
                session_id=session_id
            )
        return session
    except Exception as e:
        logger.error(f"Session error: {e}")
        # fallback create
        return await session_service.create_session(
            app_name="writing-team",
            user_id=user_id,
            session_id=session_id
        )


@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest):
    """Handle chat messages and stream responses using SSE."""
    runner = app_state["runner"]
    user_id = "local_user"  # Single-user local setup

    session = await get_or_create_session(user_id, request.session_id)

    # Persist project context into session state so all agents can read it across turns.
    if request.book_name and session:
        try:
            state_event = Event(
                invocation_id="project-ctx",
                author="system",
                actions=EventActions(state_delta={
                    "book_name": request.book_name,
                    "project_id": request.project_id,
                }),
            )
            await app_state["session_service"].append_event(session, state_event)
        except Exception as state_err:
            logger.warning(f"Could not persist project state: {state_err}")

    content = types.Content(role="user", parts=[types.Part.from_text(text=request.message)])
    
    async def event_stream():
        start_time = time.time()
        try:
            async for event in runner.run_async(
                user_id=user_id,
                session_id=request.session_id,
                new_message=content
            ):
                # Always broadcast which agent is active
                if event.author:
                    yield f"data: {json.dumps({'type': 'status', 'author': event.author})}\n\n"

                # Emit state updates whenever they change so panels refresh in real-time
                try:
                    session = await app_state["session_service"].get_session(
                        app_name="writing-team",
                        user_id=user_id,
                        session_id=request.session_id,
                    )
                    if session:
                        state_payload = {
                            "type": "state",
                            "book_name": session.state.get("book_name") or request.book_name,
                            "research_status": session.state.get("research_status", ""),
                            "editor_status": session.state.get("editor_status", ""),
                            "active_voice_profile": session.state.get("active_voice_profile", ""),
                        }
                        yield f"data: {json.dumps(state_payload)}\n\n"
                except Exception as state_err:
                    logger.warning(f"Could not read session state mid-stream: {state_err}")

                if event.is_final_response():
                    text = "".join(p.text for p in event.content.parts if p.text)
                    yield f"data: {json.dumps({'type': 'message', 'text': text, 'author': event.author})}\n\n"

                    # Emit artifact events for any files written during this turn
                    book_name = request.book_name
                    try:
                        final_session = await app_state["session_service"].get_session(
                            app_name="writing-team",
                            user_id=user_id,
                            session_id=request.session_id,
                        )
                        if final_session:
                            book_name = final_session.state.get("book_name", request.book_name)
                    except Exception:
                        pass
                    new_artifacts = _scan_for_artifacts(request.project_id, book_name, start_time)
                    for artifact in new_artifacts:
                        yield f"data: {json.dumps({'type': 'artifact', **artifact})}\n\n"

                    # Update project stats in the index if files changed
                    if new_artifacts and book_name:
                        projects = _read_projects_index()
                        entry = next((p for p in projects if p["id"] == request.project_id), None)
                        if entry:
                            stats = _compute_project_stats(book_name)
                            entry.update({**stats, "updated": DateClass.today().isoformat()})
                            meta_path = PROJECTS_DIR / book_name / "metadata.json"
                            if meta_path.exists():
                                meta = json.loads(meta_path.read_text(encoding="utf-8"))
                                meta.update({**stats, "updated": entry["updated"]})
                                meta_path.write_text(json.dumps(meta, indent=2), encoding="utf-8")
                            _write_projects_index(projects)
                            yield f"data: {json.dumps({'type': 'project_update', 'id': request.project_id, **stats, 'updated': entry['updated']})}\n\n"

                    break
        except Exception as e:
            logger.error(f"Runner error: {e}")
            yield f"data: {json.dumps({'type': 'error', 'text': str(e)})}\n\n"
            
    return StreamingResponse(event_stream(), media_type="text/event-stream")


@app.get("/api/state/{session_id}")
async def get_state(session_id: str):
    """Retrieve interesting session state variables for the UI panels."""
    session_service = app_state["session_service"]
    session = await get_or_create_session("local_user", session_id)
    
    return {
        "current_agent": session.state.get("current_agent", "coordinator"),
        "book_name": session.state.get("book_name", ""),
        "research_status": session.state.get("research_status", ""),
        "editor_status": session.state.get("editor_status", ""),
        "active_voice_profile": session.state.get("active_voice_profile", ""),
    }


class ProjectCreate(BaseModel):
    title: str
    type: str = "nonfiction"
    genre: str = ""
    description: str = ""


def _normalize_project(raw: dict, dir_name: str) -> dict:
    """Ensure a project entry has all fields the UI expects."""
    book_name = raw.get("name") or raw.get("book_name") or dir_name
    project_id = raw.get("id") or _slugify(book_name)
    return {
        "id": project_id,
        "name": book_name,
        "dir": raw.get("dir", dir_name),
        "status": raw.get("status", "ideation"),
        "created": raw.get("created", DateClass.today().isoformat()),
        "wordCount": raw.get("wordCount", 0),
        "chapters": raw.get("chapters", 0),
        "updated": raw.get("updated", raw.get("created", DateClass.today().isoformat())),
        "type": raw.get("type", "nonfiction"),
        "genre": raw.get("genre", ""),
        "description": raw.get("description", ""),
    }


@app.get("/api/projects")
async def list_projects():
    """Return all projects from the index, falling back to scanning the projects dir."""
    projects = _read_projects_index()
    if not projects and PROJECTS_DIR.exists():
        for meta_path in sorted(PROJECTS_DIR.glob("*/metadata.json")):
            try:
                raw = json.loads(meta_path.read_text(encoding="utf-8"))
                entry = _normalize_project(raw, meta_path.parent.name)
                projects.append(entry)
            except Exception:
                pass
    else:
        projects = [_normalize_project(p, p.get("dir", p.get("name", ""))) for p in projects]
    return projects


@app.post("/api/projects")
async def create_project(data: ProjectCreate):
    """Create a new project directory, metadata.json, and register in the index."""
    project_id = _slugify(data.title)
    existing_ids = {p["id"] for p in _read_projects_index()}
    base_id, counter = project_id, 2
    while project_id in existing_ids:
        project_id = f"{base_id}-{counter}"
        counter += 1

    today = DateClass.today().isoformat()
    entry = {
        "id": project_id,
        "name": data.title,
        "dir": data.title,
        "status": "ideation",
        "created": today,
        "wordCount": 0,
        "chapters": 0,
        "updated": today,
        "type": data.type,
        "genre": data.genre,
        "description": data.description,
    }

    project_dir = PROJECTS_DIR / data.title
    project_dir.mkdir(parents=True, exist_ok=True)
    (project_dir / "research").mkdir(exist_ok=True)
    (project_dir / "chapters").mkdir(exist_ok=True)
    (project_dir / "edits").mkdir(exist_ok=True)
    (project_dir / "metadata.json").write_text(
        json.dumps(entry, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    _upsert_project(entry)
    logger.info(f"Created project: {project_id} → {project_dir}")
    return entry


@app.delete("/api/projects/{project_id}")
async def delete_project(project_id: str):
    """Delete a project directory and remove it from the index."""
    from fastapi import HTTPException
    projects = _read_projects_index()
    entry = next((p for p in projects if p["id"] == project_id), None)
    if not entry:
        raise HTTPException(status_code=404, detail="Project not found")

    project_dir = PROJECTS_DIR / entry.get("dir", entry["name"])
    if project_dir.exists():
        shutil.rmtree(project_dir)
        logger.info(f"Deleted project directory: {project_dir}")

    _write_projects_index([p for p in projects if p["id"] != project_id])
    return {"status": "deleted", "id": project_id}


@app.post("/api/sync")
async def sync_projects():
    """Scan the projects directory for manually added folders, register any new ones, and return all artifacts."""
    today = DateClass.today().isoformat()
    indexed = {p.get("dir", p.get("name", "")): p for p in _read_projects_index()}
    new_entries = []

    if PROJECTS_DIR.exists():
        for folder in sorted(PROJECTS_DIR.iterdir()):
            if not folder.is_dir():
                continue
            dir_name = folder.name

            if dir_name in indexed:
                # Recompute stats for existing projects so stale counts are fixed
                entry = dict(indexed[dir_name])
                stats = _compute_project_stats(dir_name)
                entry.update(stats)
                entry["updated"] = today
                indexed[dir_name] = entry
                continue

            meta_path = folder / "metadata.json"
            if meta_path.exists():
                try:
                    raw = json.loads(meta_path.read_text(encoding="utf-8"))
                    entry = _normalize_project(raw, dir_name)
                except Exception:
                    entry = None
            else:
                entry = None

            if entry is None:
                project_id = _slugify(dir_name)
                existing_ids = {p["id"] for p in _read_projects_index()} | {e["id"] for e in new_entries}
                base_id, counter = project_id, 2
                while project_id in existing_ids:
                    project_id = f"{base_id}-{counter}"
                    counter += 1
                stats = _compute_project_stats(dir_name)
                entry = {
                    "id": project_id,
                    "name": dir_name,
                    "dir": dir_name,
                    "status": "ideation",
                    "created": today,
                    "updated": today,
                    "type": "nonfiction",
                    "genre": "",
                    "description": "",
                    **stats,
                }
                meta_path.write_text(json.dumps(entry, indent=2, ensure_ascii=False), encoding="utf-8")
                logger.info(f"Sync: registered new project '{dir_name}' → {entry['id']}")
            else:
                stats = _compute_project_stats(dir_name)
                entry.update(stats)
                entry["updated"] = today

            new_entries.append(entry)
            indexed[dir_name] = entry

    all_projects_raw = list(indexed.values())
    _write_projects_index(all_projects_raw)

    all_projects = [_normalize_project(p, p.get("dir", p.get("name", ""))) for p in all_projects_raw]

    artifacts: dict[str, list] = {"ideas": [], "outlines": [], "drafts": [], "research": [], "world": []}
    for project in all_projects:
        dir_name = project.get("dir", project.get("name", ""))
        for event in _scan_for_artifacts(project["id"], dir_name, since=0):
            kind = event["kind"]
            if kind in artifacts:
                artifacts[kind].append(event["data"])

    return {"projects": all_projects, "artifacts": artifacts, "synced": len(new_entries)}


@app.post("/api/voice/upload")
async def upload_voice_sample(file: UploadFile = File(...), profile_name: str = Form(...)):
    """Upload a writing sample for the voice agent."""
    try:
        content_bytes = await file.read()
        
        # Extremely simple parse logic here, in reality we'd save to a temp file and use doc_parser
        # or pdf_reader based on content type. For brevity, assuming text/markdown here,
        # but you would extend this.
        text_content = content_bytes.decode('utf-8', errors='ignore')
        
        # We simulate passing this to the voice agent by saving it or directly analyzing it.
        # For full integration, the user would tell the Voice Agent they uploaded a file.
        return {"status": "success", "filename": file.filename, "message": "File received"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="127.0.0.1", port=8000, reload=True)
