import asyncio
import json
import logging
import os
from contextlib import asynccontextmanager
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

    # Propagate project context into session state so all agents can read it.
    if request.book_name and session:
        try:
            session.state["book_name"] = request.book_name
            session.state["project_id"] = request.project_id
        except Exception as state_err:
            logger.warning(f"Could not set project state: {state_err}")

    content = types.Content(role="user", parts=[types.Part.from_text(text=request.message)])
    
    async def event_stream():
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
                            "book_name": session.state.get("book_name", ""),
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
