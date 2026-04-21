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
    case "research":
      return (
        <svg {...common} aria-hidden="true">
          <circle cx="6" cy="6" r="3.2" stroke="currentColor" strokeWidth="1.2" />
          <path d="M8.5 8.5l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      );
    case "debate":
      return (
        <svg {...common} aria-hidden="true">
          <path d="M2.5 4h5.5M2.5 7h4M8 10h3.5M11.5 10h-3.5M11.5 7h-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M7 5.5v3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}

function ArtifactListModal({ title, kind, items, onClose }) {
  const [selected, setSelected] = useStateL(null);

  const renderMeta = (item) => {
    if (kind === "research") return [`${item.sources} sources`, item.date];
    if (kind === "debate") return [item.outcome, item.date];
    return [item.date];
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal modal--artifact" role="dialog" aria-modal="true">
        <div className="modal__nav">
          {selected ? (
            <button type="button" className="modal__back-btn" onClick={() => setSelected(null)}>
              ← Back
            </button>
          ) : null}
          <span className="modal__nav-title">{selected ? selected.title : title}</span>
          <button type="button" className="modal__close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="modal__scroll">
          {selected ? (
            <div className="modal__detail">
              <div className="modal__detail-meta">
                {renderMeta(selected).map((tag) => (
                  <span key={tag} className="modal__detail-tag">{tag}</span>
                ))}
                {kind === "debate" && selected.thesis ? (
                  <span className="modal__detail-tag modal__detail-tag--thesis">"{selected.thesis}"</span>
                ) : null}
              </div>
              <div className="prose" dangerouslySetInnerHTML={{ __html: window.mdToHtml(selected.body) }} />
            </div>
          ) : (
            <div className="modal__list">
              {items.length === 0 ? (
                <div className="modal__empty">No {title.toLowerCase()} yet for this project.</div>
              ) : items.map((item) => (
                <button key={item.id} type="button" className="artifact-card" onClick={() => setSelected(item)}>
                  <div className="artifact-card__title">{item.title}</div>
                  <div className="artifact-card__summary">{item.summary}</div>
                  <div className="artifact-card__meta">
                    {renderMeta(item).map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ModalArtifactGroup({ title, count, onClick }) {
  return (
    <div className="group">
      <button type="button" className="group__head group__head--modal" onClick={onClick}>
        <span className="group__modal-arrow" aria-hidden="true">↗</span>
        <span className="group__title">{title}</span>
        <span className="group__count">{count}</span>
      </button>
    </div>
  );
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

function ArtifactBrowser({ projects, artifacts, activeProjectId, setActiveProjectId, openArtifact, activeArtifactId, onNewProject, onDeleteProject, onSync, syncing, syncResult }) {
  const [showNewModal, setShowNewModal] = useStateL(false);
  const [artifactModal, setArtifactModal] = useStateL(null); // { kind, title, items }
  const A = artifacts || {};

  // Build filtered leaves per group, limited to the active project for
  // project-scoped artifacts; voice profiles are global.
  const ideaLeaves = (A.ideas || [])
    .filter((i) => i.project === activeProjectId)
    .map((i) => ({ kind: "idea", id: i.id, label: i.title, meta: i.updated, payload: { type: "idea", data: i } }));
  const outlineLeaves = (A.outlines || [])
    .filter((o) => o.project === activeProjectId)
    .map((o) => ({ kind: "outline", id: o.id, label: o.title, meta: `${o.chapters} ch`, payload: { type: "outline", data: o } }));
  const draftLeaves = (A.drafts || [])
    .filter((d) => d.project === activeProjectId)
    .map((d) => ({ kind: "draft", id: d.id, label: d.title, meta: `${d.words.toLocaleString()} w`, payload: { type: "draft", data: d } }));
  const voiceLeaves = (A.voiceProfiles || []).map((v) => ({
    kind: "voice", id: v.id, label: v.name, meta: `${v.samples} sample${v.samples === 1 ? "" : "s"}`, payload: { type: "voice", data: v },
  }));
  const worldLeaves = (A.world || [])
    .filter((w) => w.project === activeProjectId)
    .map((w) => ({ kind: "world", id: w.id, label: w.title, meta: w.type, payload: { type: "world", data: w } }));
  const researchItems = (A.research || []).filter((r) => r.project === activeProjectId);
  const debateItems = (A.debates || []).filter((d) => d.project === activeProjectId);

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
            <div key={p.id} className="project-row-wrap">
              <button
                type="button"
                className={`project-row ${p.id === activeProjectId ? "project-row--active" : ""}`}
                onClick={() => setActiveProjectId(p.id)}
              >
                <span className="project-row__name">{p.name}</span>
                <span className={`project-row__status status--${p.status}`}>{p.status}</span>
                <span className="project-row__meta">
                  {p.chapters ?? 0} ch · {(p.wordCount ?? 0).toLocaleString()} w · {p.updated}
                </span>
              </button>
              {onDeleteProject && (
                <button
                  type="button"
                  className="project-row__delete"
                  onClick={() => onDeleteProject(p.id)}
                  aria-label={`Delete ${p.name}`}
                  title="Delete project"
                >✕</button>
              )}
            </div>
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
        <ModalArtifactGroup
          title="Research Reports"
          count={researchItems.length}
          onClick={() => setArtifactModal({ kind: "research", title: "Research Reports", items: researchItems })}
        />
        <ModalArtifactGroup
          title="Debates"
          count={debateItems.length}
          onClick={() => setArtifactModal({ kind: "debate", title: "Debates", items: debateItems })}
        />
      </div>

      <div className="rail__footer rail__footer--left">
        <div className="rail__footer-sync">
          <button
            type="button"
            className={`sync-btn${syncing ? " sync-btn--busy" : ""}`}
            onClick={onSync}
            disabled={syncing}
            title="Scan the projects folder for newly added directories"
          >
            {syncing ? <span className="spinner" /> : "↻"}
            {syncing ? " Scanning…" : " Sync Files"}
          </button>
          {syncResult != null && (
            <div className="sync-result">
              {syncResult === 0 ? "Up to date" : `+${syncResult} project${syncResult === 1 ? "" : "s"} found`}
            </div>
          )}
        </div>
        <div className="rail__footer-actions">
          <button type="button" className="ghost-btn" onClick={() => setShowNewModal(true)}>+ New project</button>
          <button type="button" className="ghost-btn">Import samples</button>
        </div>
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

      {artifactModal && (
        <ArtifactListModal
          kind={artifactModal.kind}
          title={artifactModal.title}
          items={artifactModal.items}
          onClose={() => setArtifactModal(null)}
        />
      )}
    </aside>
  );
}

window.ArtifactBrowser = ArtifactBrowser;
