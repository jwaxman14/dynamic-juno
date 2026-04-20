/*
 * Left rail: artifact browser.
 * Groups: Ideas, Outlines, Drafts, Voice Profiles, World Building.
 * Clicking a leaf opens the reader panel in the center.
 */

const { useState: useStateL, useMemo: useMemoL } = React;

const FICTION_GENRES = [
  "Literary Fiction", "Science Fiction", "Fantasy", "Mystery / Thriller",
  "Historical Fiction", "Romance", "Horror", "Short Stories", "Other",
];
const NONFICTION_GENRES = [
  "Memoir / Autobiography", "Self-Help", "History", "Science", "Philosophy",
  "Business / Economics", "True Crime", "Travel", "Essay Collection", "Other",
];

function NewProjectModal({ onConfirm, onCancel }) {
  const [title, setTitle] = useStateL("");
  const [type, setType] = useStateL("nonfiction");
  const [genre, setGenre] = useStateL("");
  const [description, setDescription] = useStateL("");

  const genres = type === "fiction" ? FICTION_GENRES : NONFICTION_GENRES;
  const canConfirm = title.trim().length > 0;

  const handleConfirm = () => {
    if (!canConfirm) return;
    onConfirm({ title: title.trim(), type, genre, description: description.trim() });
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <h2 className="modal__title" id="modal-title">New project</h2>

        <div className="modal__field">
          <label className="modal__label" htmlFor="np-title">Working title</label>
          <input
            id="np-title"
            className="modal__input"
            type="text"
            placeholder="Untitled"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
        </div>

        <div className="modal__field">
          <span className="modal__label">Type</span>
          <div className="modal__type-group">
            <button
              type="button"
              className={`modal__type-btn ${type === "nonfiction" ? "modal__type-btn--active" : ""}`}
              onClick={() => { setType("nonfiction"); setGenre(""); }}
            >Non-fiction</button>
            <button
              type="button"
              className={`modal__type-btn ${type === "fiction" ? "modal__type-btn--active" : ""}`}
              onClick={() => { setType("fiction"); setGenre(""); }}
            >Fiction</button>
          </div>
        </div>

        <div className="modal__field">
          <label className="modal__label" htmlFor="np-genre">Genre</label>
          <div className="modal__select-wrap">
            <select
              id="np-genre"
              className="modal__select"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
            >
              <option value="">Select a genre</option>
              {genres.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        </div>

        <div className="modal__field">
          <label className="modal__label" htmlFor="np-desc">Description</label>
          <textarea
            id="np-desc"
            className="modal__textarea"
            placeholder="A brief description of the book — themes, concept, or anything that anchors the project."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="modal__actions">
          <button type="button" className="modal__btn modal__btn--cancel" onClick={onCancel}>Cancel</button>
          <button
            type="button"
            className="modal__btn modal__btn--confirm"
            onClick={handleConfirm}
            disabled={!canConfirm}
          >Start project</button>
        </div>
      </div>
    </div>
  );
}

// Simple glyph marks for each artifact kind, drawn as small SVG shapes
// so nothing leans on emoji or icon fonts.
function Glyph({ kind }) {
  const common = { width: 14, height: 14, viewBox: "0 0 14 14", fill: "none" };
  switch (kind) {
    case "idea":
      return (
        <svg {...common} aria-hidden="true">
          <circle cx="7" cy="6" r="3.2" stroke="currentColor" strokeWidth="1.2" />
          <path d="M5.5 10.5h3M6 12h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
    case "outline":
      return (
        <svg {...common} aria-hidden="true">
          <path d="M3 3.5h8M3 7h6M3 10.5h7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
    case "draft":
      return (
        <svg {...common} aria-hidden="true">
          <rect x="3" y="2.5" width="8" height="9" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
          <path d="M5 5.5h4M5 7.5h4M5 9.5h2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
    case "voice":
      return (
        <svg {...common} aria-hidden="true">
          <path d="M2 7h1.5M4.5 4.5v5M6.5 3v8M8.5 5v4M10.5 6.5v1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
    case "world":
      return (
        <svg {...common} aria-hidden="true">
          <circle cx="7" cy="7" r="4.2" stroke="currentColor" strokeWidth="1.2" />
          <path d="M2.8 7h8.4M7 2.8c1.6 1.3 1.6 7 0 8.4M7 2.8c-1.6 1.3-1.6 7 0 8.4" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      );
    default:
      return null;
  }
}

function ArtifactLeaf({ node, active, onOpen }) {
  return (
    <button
      type="button"
      className={`leaf ${active ? "leaf--active" : ""}`}
      onClick={() => onOpen(node)}
    >
      <span className="leaf__glyph"><Glyph kind={node.kind} /></span>
      <span className="leaf__label">{node.label}</span>
      <span className="leaf__meta">{node.meta}</span>
    </button>
  );
}

function ArtifactGroup({ title, count, children, defaultOpen = true }) {
  const [open, setOpen] = useStateL(defaultOpen);
  return (
    <div className={`group ${open ? "group--open" : ""}`}>
      <button
        type="button"
        className="group__head"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="group__caret" aria-hidden="true">▸</span>
        <span className="group__title">{title}</span>
        <span className="group__count">{count}</span>
      </button>
      {open ? <div className="group__body">{children}</div> : null}
    </div>
  );
}

function ArtifactBrowser({ projects, activeProjectId, setActiveProjectId, openArtifact, activeArtifactId, onNewProject }) {
  const [showNewModal, setShowNewModal] = useStateL(false);
  const A = window.ARTIFACTS;

  // Build filtered leaves per group, limited to the active project for
  // project-scoped artifacts; voice profiles are global.
  const ideaLeaves = A.ideas
    .filter((i) => i.project === activeProjectId)
    .map((i) => ({ kind: "idea", id: i.id, label: i.title, meta: i.updated, payload: { type: "idea", data: i } }));
  const outlineLeaves = A.outlines
    .filter((o) => o.project === activeProjectId)
    .map((o) => ({ kind: "outline", id: o.id, label: o.title, meta: `${o.chapters} ch`, payload: { type: "outline", data: o } }));
  const draftLeaves = A.drafts
    .filter((d) => d.project === activeProjectId)
    .map((d) => ({ kind: "draft", id: d.id, label: d.title, meta: `${d.words.toLocaleString()} w`, payload: { type: "draft", data: d } }));
  const voiceLeaves = A.voiceProfiles.map((v) => ({
    kind: "voice", id: v.id, label: v.name, meta: `${v.samples} sample${v.samples === 1 ? "" : "s"}`, payload: { type: "voice", data: v },
  }));
  const worldLeaves = A.world
    .filter((w) => w.project === activeProjectId)
    .map((w) => ({ kind: "world", id: w.id, label: w.title, meta: w.type, payload: { type: "world", data: w } }));

  return (
    <aside className="rail rail--left">
      <div className="rail__header">
        <div className="rail__title">
          <span className="brand-mark" aria-hidden="true">
            {/* A simple descender-and-ascender glyph — a "J" carved into a square. */}
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="1.5" y="1.5" width="15" height="15" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
              <path d="M11 4.5v6.2a2.5 2.5 0 0 1-2.5 2.5H7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </span>
          <span>Dynamic Juno</span>
        </div>
        <div className="rail__meta rail__meta--quiet">writing system · v0.4</div>
      </div>

      <div className="project-switcher">
        <div className="project-switcher__label">Current project</div>
        <div className="project-switcher__list">
          {projects.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`project-row ${p.id === activeProjectId ? "project-row--active" : ""}`}
              onClick={() => setActiveProjectId(p.id)}
            >
              <span className="project-row__name">{p.name}</span>
              <span className={`project-row__status status--${p.status}`}>{p.status}</span>
              <span className="project-row__meta">
                {p.chapters} ch · {p.wordCount.toLocaleString()} w · {p.updated}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="rail__section-label rail__section-label--top">Artifacts</div>

      <div className="groups">
        <ArtifactGroup title="Ideas" count={ideaLeaves.length}>
          {ideaLeaves.map((n) => (
            <ArtifactLeaf key={n.id} node={n} active={n.id === activeArtifactId} onOpen={openArtifact} />
          ))}
        </ArtifactGroup>
        <ArtifactGroup title="Outlines" count={outlineLeaves.length}>
          {outlineLeaves.map((n) => (
            <ArtifactLeaf key={n.id} node={n} active={n.id === activeArtifactId} onOpen={openArtifact} />
          ))}
        </ArtifactGroup>
        <ArtifactGroup title="Drafts" count={draftLeaves.length}>
          {draftLeaves.map((n) => (
            <ArtifactLeaf key={n.id} node={n} active={n.id === activeArtifactId} onOpen={openArtifact} />
          ))}
        </ArtifactGroup>
        <ArtifactGroup title="Voice Profiles" count={voiceLeaves.length}>
          {voiceLeaves.map((n) => (
            <ArtifactLeaf key={n.id} node={n} active={n.id === activeArtifactId} onOpen={openArtifact} />
          ))}
        </ArtifactGroup>
        <ArtifactGroup title="World Building" count={worldLeaves.length}>
          {worldLeaves.map((n) => (
            <ArtifactLeaf key={n.id} node={n} active={n.id === activeArtifactId} onOpen={openArtifact} />
          ))}
        </ArtifactGroup>
      </div>

      <div className="rail__footer rail__footer--left">
        <button type="button" className="ghost-btn" onClick={() => setShowNewModal(true)}>+ New project</button>
        <button type="button" className="ghost-btn">Import samples</button>
      </div>

      {showNewModal && (
        <NewProjectModal
          onCancel={() => setShowNewModal(false)}
          onConfirm={(data) => {
            setShowNewModal(false);
            onNewProject && onNewProject(data);
          }}
        />
      )}
    </aside>
  );
}

window.ArtifactBrowser = ArtifactBrowser;
