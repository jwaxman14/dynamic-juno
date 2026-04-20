/*
 * Dynamic Juno — workspace UI
 *
 * Center: conversation with the coordinator and specialist agents.
 * Left: artifact browser (ideas, outlines, drafts, voice, world).
 * Right: live agent status rail (idle / listening / working).
 */

const { useState, useEffect, useRef, useMemo, useCallback, Fragment } = React;

// -------------------- utilities --------------------

const now = () => {
  const d = new Date();
  return d.toTimeString().slice(0, 5);
};

const agentById = (id) => window.AGENTS.find((a) => a.id === id);

// Tiny markdown → HTML (headings, bold, italic, lists, paragraphs).
// Deliberately small; artifact content is writer-authored, not untrusted.
function mdToHtml(src) {
  const lines = src.split(/\n/);
  const out = [];
  let listOpen = false;
  const closeList = () => { if (listOpen) { out.push("</ul>"); listOpen = false; } };
  const inline = (s) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      .replace(/`([^`]+)`/g, "<code>$1</code>");
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (/^###\s+/.test(line)) { closeList(); out.push(`<h4>${inline(line.replace(/^###\s+/, ""))}</h4>`); continue; }
    if (/^##\s+/.test(line))  { closeList(); out.push(`<h3>${inline(line.replace(/^##\s+/, ""))}</h3>`); continue; }
    if (/^#\s+/.test(line))   { closeList(); out.push(`<h2>${inline(line.replace(/^#\s+/, ""))}</h2>`); continue; }
    if (/^\s*-\s+/.test(line)) {
      if (!listOpen) { out.push("<ul>"); listOpen = true; }
      out.push(`<li>${inline(line.replace(/^\s*-\s+/, ""))}</li>`);
      continue;
    }
    if (line.trim() === "") { closeList(); continue; }
    closeList();
    out.push(`<p>${inline(line)}</p>`);
  }
  closeList();
  return out.join("\n");
}

// -------------------- status rail (right) --------------------

function AgentCard({ agent, state }) {
  const s = state || { status: "idle", work: null };
  return (
    <div className={`agent-card state-${s.status}`}>
      <div className="agent-card__head">
        <div className="agent-card__dot" aria-hidden="true">
          <span className="agent-card__dot-inner" />
        </div>
        <div className="agent-card__id">
          <div className="agent-card__name">
            {agent.name}
            {agent.isHub ? <span className="agent-card__hub">hub</span> : null}
          </div>
          <div className="agent-card__role">{agent.role}</div>
        </div>
        <div className="agent-card__state-label">{s.status}</div>
      </div>
      <div className="agent-card__work">
        {s.status === "idle" ? (
          <span className="agent-card__idle">—</span>
        ) : (
          <span className="agent-card__work-line">
            {s.status === "working" ? <span className="spinner" /> : null}
            {s.work || "…"}
          </span>
        )}
      </div>
      <div className="agent-card__tools">
        {agent.tools.map((t) => (
          <span key={t} className="tool-chip">{t}</span>
        ))}
      </div>
    </div>
  );
}

function StatusRail({ states, activeProject }) {
  const hub = window.AGENTS.find((a) => a.isHub);
  const specialists = window.AGENTS.filter((a) => !a.isHub);
  const workingCount = Object.values(states).filter((s) => s && s.status === "working").length;
  return (
    <aside className="rail rail--right">
      <div className="rail__header">
        <div className="rail__title">Agents</div>
        <div className="rail__meta">
          <span className={`pulse-pill ${workingCount ? "pulse-pill--on" : ""}`}>
            <span className="pulse-pill__dot" />
            {workingCount ? `${workingCount} working` : "all idle"}
          </span>
        </div>
      </div>
      <div className="rail__section">
        <div className="rail__section-label">Orchestrator</div>
        <AgentCard agent={hub} state={states[hub.id]} />
      </div>
      <div className="rail__section">
        <div className="rail__section-label">Specialists</div>
        <div className="agent-list">
          {specialists.map((a) => (
            <AgentCard key={a.id} agent={a} state={states[a.id]} />
          ))}
        </div>
      </div>
      <div className="rail__footer">
        <div className="rail__footer-row">
          <span className="kbd">session</span>
          <span className="rail__footer-value">{activeProject.name}</span>
        </div>
        <div className="rail__footer-row">
          <span className="kbd">model</span>
          <span className="rail__footer-value">gemini-3.1-pro-preview</span>
        </div>
      </div>
    </aside>
  );
}

window.StatusRail = StatusRail;
window.mdToHtml = mdToHtml;
window.agentById = agentById;
window.now = now;
