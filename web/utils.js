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

// Pick a scripted scenario based on message text
window.pickScenario = function (text) {
  for (const s of window.SCENARIOS) {
    if (s.match && s.match.test(text)) return s;
  }
  return window.DEFAULT_SCENARIO;
};

// Build a project-aware agent reply based on the active project and its artifacts.
// artifacts = { ideas, outlines, drafts, voiceProfiles } — all pre-filtered to the project,
// except voiceProfiles which are global.
window.buildProjectReply = function (target, project, artifacts) {
  const { ideas = [], outlines = [], drafts = [], voiceProfiles = [] } = artifacts;
  const idea     = ideas[0];
  const outline  = outlines[0];
  const name     = project.name;

  // Pull the first sentence of the Core Thesis section from an idea body.
  const getThesis = () => {
    if (!idea) return null;
    const match = idea.body.match(/##\s*Core Thesis\s*\n+([\s\S]*?)(?=\n##|$)/);
    if (!match) return null;
    const raw = match[1].trim();
    return raw.match(/^[^.!?]+[.!?]/)?.[0] ?? raw.split("\n")[0];
  };

  // Extract ### chapter title lines from an outline body.
  const getChapters = () => {
    if (!outline) return [];
    return outline.body
      .split("\n")
      .filter((l) => l.startsWith("###"))
      .map((l) => l.replace(/^###\s*/, "").trim());
  };

  switch (target) {

    case "idea": {
      if (!idea) {
        return `No idea document yet for **${name}**. Let's start there — what's the core question or observation the book is built around?`;
      }
      if (project.id === "vertical-void") {
        return `Three directions to consider:\n\n- *Solo climbing as unchosen meditation* — forced presence rather than cultivated; the mountain removes the option to look away.\n- *The mountain as the only honest mirror* — every other context lets you perform a self; the wall doesn't.\n- *Risk as the price of attention* — the thesis becomes argumentative rather than just evocative.\n\nMy lean is the third — it invites the hardest pushback, which is where the book will be sharpest. Want me to work up the argument structure for that framing?`;
      }
      if (project.id === "weakest-form") {
        return `Three angles worth pressure-testing:\n\n- *Reframe "alien environment" as the book's operating lens* — every chapter runs art through it; the frame does the structural work.\n- *The peppered moth as the load-bearing metaphor* — it carries the evolutionary drift argument in one image; if it holds, the book holds.\n- *Art as symptom, not cure* — the book should diagnose rather than prescribe; that's a harder and more honest position.\n\nWhich angle feels like your centre of gravity?`;
      }
      const thesis = getThesis();
      return `Pulling from the idea doc for **${name}**.\n\n${thesis ? `**Core thesis:** ${thesis}\n\n` : ""}Three directions to consider — I can sharpen the central claim, find the strongest counter-framing, or develop the unique angle that separates this from existing work. What's the priority?`;
    }

    case "outline": {
      const chapters = getChapters();
      if (!outline) {
        return `No outline yet for **${name}**. Want to start with a chapter count and work backwards from the ending, map themes first and find the structure from there, or rough a three-act arc to test the logic?`;
      }
      if (project.id === "vertical-void") {
        return `Structure looks solid — the three-act form maps well onto the climb. The main risk: Chapter 2 (The Paradox of Stillness) is doing a lot — the moving meditation, the alchemy of suffering, and the eradication of time are each book-sized ideas. Worth considering whether one becomes its own chapter or a bridge into Chapter 3. Want me to sketch an alternative beat arrangement?`;
      }
      if (project.id === "weakest-form") {
        return `Six-chapter arc is well-sequenced. Two structural notes:\n\n- The gap between Chapter 3 (The Peppered Moth) and Chapter 4 (The Bottleneck of Propaganda) needs a bridge — the jump from evolutionary drift to media theory is the book's hardest move.\n- Chapter 6 (Bending the Arc) is the toughest chapter to write: you're committing to a prescriptive position after five chapters of diagnosis. What's the thesis of that final chapter?\n\nWant me to draft transition language for the Ch 3→4 gap, or work on the Ch 6 argument structure?`;
      }
      const chList = chapters.map((c) => `- ${c}`).join("\n");
      return `Reviewed the **${name}** outline — ${outline.chapters}-chapter structure:\n\n${chList}\n\nWhat do you want to adjust — sequencing, chapter scope, or the overall arc?`;
    }

    case "writer": {
      if (project.id === "vertical-void") {
        return `Ready to draft. Chapter 1.1 (The Noise of the Modern Mind) is the natural entry — it sets the contrast that earns everything that follows. Two options: open with the chaos of the modern mind, or cut straight to the first move on the wall and let the contrast emerge. The Climber voice profile is calibrated.\n\nWhich approach?`;
      }
      if (project.id === "weakest-form") {
        return `Chapters 4 and 5 are the gaps — *The Bottleneck of Propaganda* and *Art as Canary*.\n\nChapter 4 is the argumentative hinge: the claim that when a medium collapses into one dominant channel it loses its canary function needs to land precisely or Chapter 5 doesn't follow. Want to start with the central claim and build outward, or find the right case study first and let the argument emerge?`;
      }
      if (!outline && drafts.length === 0) {
        return `No outline or drafts yet for **${name}**. Once you have a structure I can draft to spec — or I can rough a first chapter cold to find the voice. Which would be more useful?`;
      }
      const chapters = getChapters();
      const draftTitles = drafts.map((d) => d.title.toLowerCase());
      const unwritten = chapters.filter(
        (c) => !draftTitles.some((t) => t.includes(c.split("—")[0].trim().toLowerCase()))
      );
      if (unwritten.length > 0) {
        return `Next up for **${name}**: *${unwritten[0]}*. Want me to draft from the outline structure, or do you have specific content direction for this chapter?`;
      }
      return `All outlined chapters have drafts for **${name}**. Want me to start a revision pass, or expand any chapter that's running short?`;
    }

    case "editor": {
      if (drafts.length === 0) {
        return `Nothing to edit yet for **${name}** — no drafts are in. Once the first chapter is drafted I'll do a line-level pass focused on voice consistency and argument clarity.`;
      }
      if (project.id === "weakest-form") {
        return `Reviewed the draft state for **${name}**:\n\n- **Chapter 1 — The Alien Environment** (4,820 w) — edited ✓\n- **Chapter 2 — The Exponential Shift** (5,104 w) — edited ✓\n- **Chapter 3 — The Peppered Moth** (3,911 w) — draft\n- **Chapter 6 — Bending the Arc** (4,585 w) — draft\n\nChapters 1 and 2 are clean. Chapter 3 needs one more argumentative turn — the moth metaphor is well established but needs to do more work before the pivot to Chapter 4. Chapter 6 is roughed but the closing argument isn't landing yet; you're diagnosing without committing to a position in the final pages.\n\nWhat do you want to tackle first?`;
      }
      const lines = drafts.map((d) => `- **${d.title}**: ${d.words.toLocaleString()} w — ${d.status}`).join("\n");
      return `Reviewed drafts for **${name}**:\n\n${lines}\n\nWhat's the priority — a fresh editorial pass, specific sections, or the overall argument arc?`;
    }

    case "research": {
      if (project.id === "vertical-void") {
        return `Research directions for **${name}**:\n\n- Flow state in high-risk sport (Csíkszentmihályi's lineage, climbing-specific studies)\n- Ego dissolution under physical exertion\n- The psychology of voluntary suffering and chosen hardship\n- Phenomenology of extreme presence\n\nWhere do you want to start — the philosophical framing or the empirical backbone?`;
      }
      if (project.id === "weakest-form") {
        return `Research directions for **${name}**:\n\n- Evolutionary mismatch theory (the cognitive science behind the alien environment argument)\n- The peppered moth case — Kettlewell's original 1950s study and the 2000s replication controversies\n- Attention economics and cognitive load in digital environments\n- Art historical cases of environmental response\n\nAny of those a priority, or is there a specific claim in the manuscript that needs sourcing?`;
      }
      const thesis = getThesis();
      return `Ready to research for **${name}**. ${thesis ? `Central thesis: *${thesis}*\n\n` : ""}What's the angle — philosophical grounding, empirical support, or finding the right case studies?`;
    }

    case "debater": {
      if (project.id === "vertical-void") {
        return `Hardest version of the counter: solo climbing isn't meditation — it's dissociation under duress. The stillness you describe is a trauma response, not a practice. The book risks romanticising a coping mechanism rather than describing a discipline. If that's true, you're not writing about presence — you're writing about avoidance.\n\nHow do you want to answer that?`;
      }
      if (project.id === "weakest-form") {
        return `Steel-man counter: the "alien environment" frame is unfalsifiable. Every generation believes itself uniquely mismatched to its moment. Humans adapt — that's the evolutionary story. If the peppered moth adapts, why doesn't the book predict that art will adapt too? And if it does, art isn't a canary — it's just another moth.\n\nWhat's your answer to the adaptation objection?`;
      }
      const thesis = getThesis();
      return `Ready to stress-test **${name}**. ${thesis ? `Thesis under pressure: *${thesis}*\n\nThe core claim is compelling but the premises need either empirical grounding or a cleaner logical chain. ` : "Give me the strongest version of your argument and I'll find its weakest point. "}What's your strongest defence?`;
    }

    case "voice": {
      const profile = voiceProfiles[0];
      if (!profile) {
        return `No voice samples yet for **${name}**. Upload some writing samples — finished prose, published work, or personal essays — and I'll build a profile covering sentence rhythm, vocabulary range, punctuation habits, and tonal markers.`;
      }
      if (project.id === "vertical-void") {
        return `The Climber profile is holding — meditative, visceral, second-person pivots for immediacy. One pattern to watch: the tricolon habit is strong in the samples (*the breath, the grip, and the void*) but if it appears more than once per chapter it starts to feel mannered. Otherwise the profile is well-calibrated for the material.\n\nWant me to run the latest draft against the profile, or refine any specific dimension?`;
      }
      if (project.id === "weakest-form") {
        return `The Analytical profile is consistent across the four drafted chapters — clause-dense with sharp declaratives for emphasis. One pattern worth flagging: em-dash sidebars are appearing every 2–3 sentences in Chapter 2, which is one parenthetical layer too many. The voice is rigorous; watch the density in the argumentative sections.\n\nWant me to run a rhythm check on Chapter 3 before the editorial pass?`;
      }
      return `Voice profile **${profile.name}** is active for **${name}** — ${profile.samples} sample${profile.samples === 1 ? "" : "s"} analysed. Want me to run the latest draft against the profile, or refine any dimension of the voice?`;
    }

    default:
      return window.DEFAULT_SCENARIO.reply;
  }
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
