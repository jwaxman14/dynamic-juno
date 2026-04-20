// Agent registry + scripted routing scenarios.
// Each agent has: id, name, role, tools, and a small catalogue of
// `work` strings used to simulate activity lines.

window.AGENTS = [
  {
    id: "coordinator",
    name: "Coordinator",
    role: "Routes requests, manages handoffs",
    tools: ["routing", "session-state"],
    isHub: true,
    workSamples: [
      "Routing your message…",
      "Handing off to a specialist",
      "Summarizing context for next agent",
    ],
  },
  {
    id: "idea",
    name: "Idea Agent",
    role: "Brainstorms thesis, themes, framing",
    tools: ["ideas.md", "debater consult"],
    workSamples: [
      "Expanding on the paradox-of-stillness angle",
      "Drafting three alternative framings",
      "Sharpening the unique-angle statement",
    ],
  },
  {
    id: "research",
    name: "Research Agent",
    role: "Evidence, citations, fact-checking",
    tools: ["arxiv", "semantic-scholar", "zotero"],
    workSamples: [
      "Searching Semantic Scholar for flow-state studies",
      "Pulling 6 sources from arXiv on risk cognition",
      "Compiling citations into research/ directory",
    ],
  },
  {
    id: "outline",
    name: "Outline Agent",
    role: "Book structure, chapter scaffolding",
    tools: ["outline.md"],
    workSamples: [
      "Rebalancing Chapter 2 sub-sections",
      "Inserting a new 3.4 on re-entry",
      "Reviewing beat flow across chapters",
    ],
  },
  {
    id: "voice",
    name: "Voice Agent",
    role: "Builds and applies voice profiles",
    tools: ["voice_profiles/*", "text-analysis"],
    workSamples: [
      "Analyzing 4 uploaded samples",
      "Computing sentence-length variance",
      "Refining the Climber profile",
    ],
  },
  {
    id: "writer",
    name: "Writer Agent",
    role: "Drafts and revises chapter content",
    tools: ["chapters/*", "voice consult"],
    workSamples: [
      "Drafting Chapter 1.2 — The Threshold of Risk",
      "Consulting the Climber voice profile",
      "Revising opening 400 words",
    ],
  },
  {
    id: "editor",
    name: "Editor Agent",
    role: "Polishes, reviews, produces edit reports",
    tools: ["edits/*.md"],
    workSamples: [
      "Reading Chapter 1 at the line level",
      "Flagging 8 sentences for tightening",
      "Writing edit report for Chapter 2",
    ],
  },
  {
    id: "debater",
    name: "Debater Agent",
    role: "Stress-tests ideas, argues the opposition",
    tools: ["idea consult"],
    workSamples: [
      "Constructing the strongest counter-argument",
      "Running a three-exchange devil's-advocate pass",
      "Pressure-testing the central metaphor",
    ],
  },
];

// Scripted routing scenarios keyed by a trigger regex OR by @mention.
// Each entry defines: the target agent, the coordinator's handoff line,
// the agent's reply, and a sequence of status transitions for the
// right-rail (agent → state → work line → duration ms).
window.SCENARIOS = [
  {
    match: /@research|research|citation|evidence|source/i,
    target: "research",
    route: "Routing to the Research Agent — they'll dig up sources on that.",
    steps: [
      { agent: "research", state: "listening", work: "Reading your request", ms: 900 },
      { agent: "research", state: "working", work: "Searching Semantic Scholar", ms: 2200 },
      { agent: "research", state: "working", work: "Cross-referencing with arXiv", ms: 1800 },
      { agent: "research", state: "working", work: "Compiling 6 sources into research/", ms: 1600 },
    ],
    reply:
      "I pulled six peer-reviewed sources on flow state in high-risk sports — three from Csíkszentmihályi's lineage, two on climbing specifically, one on base-jumping psychophysiology. I've saved them to `research/flowstatehighrisksports.md` with annotations. Want me to line up quotes against Chapter 2.1?",
  },
  {
    match: /@outline|outline|structure|chapter/i,
    target: "outline",
    route: "Handing off to the Outline Agent.",
    steps: [
      { agent: "outline", state: "listening", work: "Reviewing the current outline", ms: 900 },
      { agent: "outline", state: "working", work: "Rebalancing Chapter 2 sub-sections", ms: 2400 },
      { agent: "outline", state: "working", work: "Inserting a new 3.4 on re-entry", ms: 1800 },
    ],
    reply:
      "I've rebalanced Chapter 2 so *The Alchemy of Suffering* leads into *The Moving Meditation* rather than the other way around — the physicality earns the stillness. Also added a small 3.4 on re-entry into ordinary life. Outline is updated.",
  },
  {
    match: /@voice|voice|style|tone|sample/i,
    target: "voice",
    route: "Passing this to the Voice Agent.",
    steps: [
      { agent: "voice", state: "listening", work: "Receiving samples", ms: 800 },
      { agent: "voice", state: "working", work: "Analyzing 4 samples for rhythm", ms: 2000 },
      { agent: "voice", state: "working", work: "Computing sentence-length variance", ms: 1600 },
      { agent: "voice", state: "working", work: "Refining the active voice profile", ms: 1400 },
    ],
    reply:
      "Profile updated. Sentence variation is wider than I first measured — you alternate grounding declaratives (8–10 words) with long observational sweeps (25+). I've noted the tricolon habit and the second-person pivot. See `voice_profiles/climber.json`.",
  },
  {
    match: /@writer|write|draft|chapter \d/i,
    target: "writer",
    route: "Writer Agent, over to you.",
    steps: [
      { agent: "writer", state: "listening", work: "Pulling outline + voice profile", ms: 1000 },
      { agent: "voice", state: "listening", work: "Consulting voice profile", ms: 1200 },
      { agent: "writer", state: "working", work: "Drafting the requested section", ms: 2600 },
      { agent: "writer", state: "working", work: "Revising opening 400 words", ms: 2000 },
    ],
    reply:
      "First pass of 1.2 is down — 980 words. I leaned on the Climber profile for rhythm, kept the tricolons, and opened with the threshold moment rather than a frame. Saved to `chapters/chapter-01.md`. Ready for the Editor when you are.",
  },
  {
    match: /@editor|edit|polish|review/i,
    target: "editor",
    route: "Editor's taking a look now.",
    steps: [
      { agent: "editor", state: "listening", work: "Loading the latest chapter", ms: 900 },
      { agent: "editor", state: "working", work: "Reading Chapter 1 line by line", ms: 2400 },
      { agent: "editor", state: "working", work: "Flagging 8 sentences for tightening", ms: 1800 },
      { agent: "editor", state: "working", work: "Writing edit report", ms: 1600 },
    ],
    reply:
      "Edit report is in `edits/chapter-01-report.md`. Highlights: three sentences in 1.1 are doing the same work — I'd cut one. The peppered-moth transition in 1.3 is doing a lot; I've suggested a two-sentence bridge. Otherwise the voice is holding.",
  },
  {
    match: /@debat|debate|challenge|argue|counter/i,
    target: "debater",
    route: "Routing to the Debater — bracing for opposition.",
    steps: [
      { agent: "debater", state: "listening", work: "Reading your thesis", ms: 900 },
      { agent: "debater", state: "working", work: "Constructing the steel-man counter", ms: 2400 },
      { agent: "debater", state: "working", work: "Running a three-exchange pass", ms: 2000 },
    ],
    reply:
      "Here's the hardest version of the counter: solo climbing isn't meditation, it's dissociation under duress — the 'stillness' you describe is a trauma response, not a practice. If that's true, your book is romanticizing a symptom. How do you want to answer that?",
  },
  {
    match: /@idea|idea|brainstorm|theme|thesis|angle/i,
    target: "idea",
    route: "Handing off to the Idea Agent.",
    steps: [
      { agent: "idea", state: "listening", work: "Absorbing the brief", ms: 900 },
      { agent: "idea", state: "working", work: "Generating three framings", ms: 2200 },
      { agent: "idea", state: "working", work: "Sharpening the unique-angle statement", ms: 1600 },
    ],
    reply:
      "Three directions to consider: (1) *solo climbing as unchosen meditation* — forced presence rather than cultivated; (2) *the mountain as the only honest mirror*; (3) *risk as the price of attention*. My lean is (3) — it makes the thesis argumentative, not just evocative.",
  },
];

// Fallback when nothing matches.
window.DEFAULT_SCENARIO = {
  target: "coordinator",
  route: null,
  steps: [
    { agent: "coordinator", state: "working", work: "Classifying your intent", ms: 1400 },
  ],
  reply:
    "I can route this to any of the seven specialists — tell me whether you want to brainstorm ideas, research, outline, build voice, draft, edit, or debate. You can also prefix with @idea, @research, @outline, @voice, @writer, @editor, or @debater.",
};
