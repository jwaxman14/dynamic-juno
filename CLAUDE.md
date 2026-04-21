# CLAUDE.md — Dynamic Juno

## What This Project Is

Dynamic Juno is a multi-agent AI book writing assistant. A **Coordinator** agent (Google ADK + Gemini) routes user messages to specialist sub-agents. The UI is a three-rail React app served by a FastAPI server.

## Architecture

```
server.py          FastAPI server — routes /chat to the ADK agent team, serves /static
agents/            Python ADK agents
  coordinator.py   Root orchestrator — intent detection + routing
  idea_agent.py    Brainstorming, themes, conceptual work
  research_agent.py  Evidence, citations, arxiv/Semantic Scholar
  outline_agent.py  Book structure and chapter scaffolding
  writer_agent.py   Drafts chapter content
  editor_agent.py   Polishes and reviews drafts
  voice_agent.py    Builds author voice profiles from uploaded samples
  debater_agent.py  Stress-tests theses and arguments
  world_builder_agent.py  Characters, locations, lore (fiction)
tools/             Shared tool functions used by agents
  arxiv_search.py, semantic_scholar.py, zotero_tools.py  — research
  voice_analysis.py, text_analysis.py                    — text processing
  file_io.py, doc_parser.py, pdf_reader.py               — document handling
  world_builder_tools.py                                 — fiction world state
web/               Frontend (no build step)
  index.html       Entry point — loads React + Babel from CDN, then the JSX files
  styles.css       Design system: OKLCH color palette, three-rail grid layout
  agents.js        Window globals: AGENTS registry, SCENARIOS, DEFAULT_SCENARIO
  artifacts.js     Window globals: ARTIFACTS (projects, ideas, outlines, drafts, voice)
  ui-status.jsx    Right rail — live agent status cards; exports window utilities
  ui-artifacts.jsx Left rail — artifact browser, project switcher, sync button
  ui-chat.jsx      Center — Message, Composer, ReaderPanel, TypingBubble
  ui-app.jsx       App shell — composes all three rails, runs agent state machine
projects/          User book projects (auto-discovered from Finder)
  <project-name>/
    metadata.json  Project metadata (id, name, status, type, genre, word/chapter counts)
    ideas.md       Core thesis and thematic framing
    outline.md     Chapter structure and scaffolding
    chapters/      Draft chapters (chapter-01.md, chapter-02.md, etc.)
    research/      Research reports and evidence summaries
    edits/         Edit passes and revisions
voice_profiles/    Uploaded author writing samples (used by voice_agent)
sessions.db        SQLite session store (ADK DatabaseSessionService)
.projects-index.json  Cached project metadata (generated/updated by /api/sync)
```

## Running the Server

```bash
# One-time setup
python -m venv .venv && source .venv/bin/activate
pip install -e .

# Create .env and add your Google API key
cat > .env << EOF
GOOGLE_API_KEY=your-api-key-here
EOF

# Start the server
source .venv/bin/activate && python server.py
# → http://127.0.0.1:8000
```

The server hot-reads `web/index.html` on every request, so HTML changes are live instantly. CSS and JS changes are live on browser reload (no build step needed).

**Python & dependencies:**
- Python 3.9+ (tested on 3.13)
- See `pyproject.toml` for full dependency list
- Key packages: google-adk, fastapi, uvicorn, python-docx, PyMuPDF, textstat
- Install: `pip install -e .` (from project root)

## Project Discovery & Sync

Projects are stored in `projects/` as subdirectories. Each project is a folder containing:
- `metadata.json` — project metadata (auto-created if missing)
- `ideas.md` — thesis and framing
- `outline.md` — chapter structure
- `chapters/` — chapter drafts (chapter-01.md, etc.)
- `research/` — research reports
- `edits/` — edit passes

**To add projects manually:**
1. Create a new folder in `projects/`
2. Add markdown files (ideas.md, outline.md, chapters/chapter-01.md, etc.)
3. Click "↻ Sync Files" in the left rail footer
4. The app will auto-discover the folder, generate `metadata.json`, scan for artifacts, and update stats

## API Endpoints

**Project management:**
- `GET /api/projects` — list all projects with metadata
- `POST /api/projects` — create a new project (body: `{ title, type, genre, description }`)
- `DELETE /api/projects/{project_id}` — delete a project
- `POST /api/sync` — scan `projects/` folder, auto-register new folders, recompute stats, return `{ projects, artifacts, synced }`

**Chat & agents:**
- `POST /api/chat` — send a message to the coordinator agent (body: `{ message, session_id, project_id, book_name }`)
- `GET /api/state/{session_id}` — fetch session state and message history

**Artifact editing:**
- `PUT /api/artifacts/{artifact_id}` — save edited artifact content to disk (body: `{ content }`)
  - Artifact IDs: `idea-{project_id}`, `outline-{project_id}`, `draft-{project_id}-ch{NN}`
  - Returns updated artifact data with new `updated` timestamp and recomputed stats

**Voice profiles:**
- `POST /api/voice/upload` — upload a writing sample for voice analysis (multipart form: `file`, `profile_name`)

## Key Implementation Details

**React UI state machine.** The frontend in `ui-app.jsx` manages:
- Project list and active project switching
- Artifact browser (ideas, outlines, drafts, research, world building) filtered by active project
- Message thread with agent responses
- Agent status tracking (idle/listening/working) synced to the right rail
- Session state management — listens to SSE `state` events and updates React state in real time

Live agent chat is fully wired: `/api/chat` endpoint sends SSE events; frontend parses message, status, and state events and renders them live.

**ReaderPanel inline editing.** When a user clicks an idea, outline, or draft in the left rail, a `ReaderPanel` overlay opens showing the artifact content. Users can:
- Click **Edit** to enable a textarea for live editing
- Click **Save** to persist changes to disk via `PUT /api/artifacts/{artifact_id}` and update stats
- Click **Cancel** to discard changes and return to read mode
- Click the close (×) button to close the panel at any time

The panel updates the artifact state locally and in the left rail artifact list on successful save.

**Script loading order matters.** The JSX files use `window.*` globals from earlier scripts. The load order in `index.html` is intentional:
1. `artifacts.js` → `agents.js` (define globals)
2. `ui-status.jsx` → `ui-artifacts.jsx` → `ui-chat.jsx` → `ui-app.jsx` (consume globals)

Babel Standalone processes `type="text/babel"` scripts sequentially, so this order is preserved.

**No SRI on CDN scripts.** The `integrity` attributes were removed from the React/Babel CDN tags because hash mismatches silently block script loading, resulting in a blank page with no console error.

**Session storage.** ADK `DatabaseSessionService` writes to `sessions.db`. Delete this file to reset all conversation history.

**Cache-busting for JSX changes.** The HTML file references JSX scripts with version params (`?v=N`). When you edit `.jsx` files and they don't appear in the browser, increment the version number in `index.html` to bust the browser cache.

**Agent context injection.** All agent instruction files use ADK's template substitution syntax `{variable_name}` to inject dynamic values at runtime. For example, each agent's instructions include:
```
## Current Project

**Active project:** {book_name}

Use `{book_name}` as the `book_name` argument for every file tool call.
```
ADK substitutes the actual value from session state when the agent runs, ensuring agents always have the current project context without needing to ask the user. The server injects values by passing `instruction=INSTRUCTION_CONSTANT` to `LlmAgent` — ADK handles substitution internally.

## Current Status

**Fully working:**
- Project CRUD (create, read, delete)
- Project discovery and sync from the file system
- Artifact scanning and display (ideas, outlines, chapters, research reports)
- UI state management and project switching
- Agent team definition and routing logic
- Live chat via `/api/chat` endpoint with SSE streaming
- Session state persistence to SQLite database via ADK Event/EventActions
- Agent project context via ADK template substitution (`{book_name}`)
- Inline artifact editing: click Edit on ideas/outlines/drafts, modify, Save (persists to disk), or Cancel
- Coordinator can read existing project files: responds to "review the current state" by calling `load_ideas()`, `load_outline()`, `list_project_files()`

**Partially wired/WIP:**
- Voice profile uploads (endpoint exists, integration untested)

## Agent Routing

Users can route explicitly with `@mentions`: `@idea`, `@research`, `@outline`, `@voice`, `@writer`, `@editor`, `@debater`, `@world`. Without a mention, the Coordinator classifies intent automatically.

## Design System (styles.css)

- Colors: OKLCH throughout — `--paper` (cream), `--ink` (dark brown), `--amber` (primary accent)
- Layout: CSS grid `300px / 1fr / 340px` — left rail / stage / right rail
- Fonts: Newsreader (display/body), Inter Tight (UI), JetBrains Mono (meta/code)
- Agent accents: each specialist has a `--c-{agentid}` custom property
