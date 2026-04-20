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
  ui-artifacts.jsx Left rail — artifact browser grouped by type
  ui-chat.jsx      Center — Message, Composer, ReaderPanel, TypingBubble
  ui-app.jsx       App shell — composes all three rails, runs agent state machine
voice_profiles/    Uploaded author writing samples (used by voice_agent)
sessions.db        SQLite session store (ADK DatabaseSessionService)
```

## Running the Server

```bash
# One-time setup
python -m venv .venv && source .venv/bin/activate
pip install -e .
cp .env.example .env   # add GOOGLE_API_KEY

# Start
source .venv/bin/activate && python server.py
# → http://127.0.0.1:8000
```

The server hot-reads `web/index.html` on every request, so HTML changes are live instantly. CSS and JS changes are live on browser reload (no build step needed).

## Key Implementation Details

**Dual-layer UI.** The web UI has two independent layers:
1. **Scripted demo** (`agents.js` scenarios + `ui-app.jsx` state machine) — renders immediately with no backend, driven by `window.SCENARIOS` pattern matching.
2. **Live agents** (backend `/chat` endpoint + ADK) — real Gemini calls that stream through the agent team.

The current UI only uses the scripted demo layer. Wiring the composer to `/chat` is the next step.

**Script loading order matters.** The JSX files use `window.*` globals from earlier scripts. The load order in `index.html` is intentional:
1. `artifacts.js` → `agents.js` (define globals)
2. `ui-status.jsx` → `ui-artifacts.jsx` → `ui-chat.jsx` → `ui-app.jsx` (consume globals)

Babel Standalone processes `type="text/babel"` scripts sequentially, so this order is preserved.

**No SRI on CDN scripts.** The `integrity` attributes were removed from the React/Babel CDN tags because hash mismatches silently block script loading, resulting in a blank page with no console error.

**Session storage.** ADK `DatabaseSessionService` writes to `sessions.db`. Delete this file to reset all conversation history.

**The running server may live elsewhere.** When Gemini Antigravity starts the server, it runs from `~/.gemini/antigravity/playground/dynamic-juno/`, not this directory. After editing files here, sync with:
```bash
cp web/* ~/.gemini/antigravity/playground/dynamic-juno/web/
```

## Agent Routing

Users can route explicitly with `@mentions`: `@idea`, `@research`, `@outline`, `@voice`, `@writer`, `@editor`, `@debater`, `@world`. Without a mention, the Coordinator classifies intent automatically.

## Design System (styles.css)

- Colors: OKLCH throughout — `--paper` (cream), `--ink` (dark brown), `--amber` (primary accent)
- Layout: CSS grid `300px / 1fr / 340px` — left rail / stage / right rail
- Fonts: Newsreader (display/body), Inter Tight (UI), JetBrains Mono (meta/code)
- Agent accents: each specialist has a `--c-{agentid}` custom property
