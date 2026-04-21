/* =========================================================
 * Dynamic Juno — utils.js
 * Global utility functions used across the React UI.
 * Must be loaded AFTER artifacts.js and agents.js.
 * ========================================================= */

// Current time as HH:MM
window.now = function () {
  return new Date().toTimeString().slice(0, 5);
};

// Retrieve an agent by id (falls back to coordinator)
window.agentById = function (id) {
  return window.AGENTS.find((a) => a.id === id) || window.AGENTS[0];
};

// Tiny markdown → HTML converter (no external dependencies)
window.mdToHtml = function (src) {
  if (!src) return "";
  const lines = src.split(/\n/);
  const out = [];
  let listOpen = false;

  const closeList = () => {
    if (listOpen) { out.push("</ul>"); listOpen = false; }
  };

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
};
