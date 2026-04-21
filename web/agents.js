window.AGENTS = [
  {
    id: "coordinator",
    name: "Coordinator",
    role: "Routes requests, manages handoffs",
    tools: ["routing", "session-state"],
    isHub: true,
    icon: "🧠",
  },
  {
    id: "idea",
    name: "Idea Agent",
    role: "Brainstorms thesis, themes, framing",
    tools: ["ideas.md", "debater consult"],
    icon: "💡",
  },
  {
    id: "research",
    name: "Research Agent",
    role: "Evidence, citations, fact-checking",
    tools: ["arxiv", "semantic-scholar", "zotero"],
    icon: "🔍",
  },
  {
    id: "outline",
    name: "Outline Agent",
    role: "Book structure, chapter scaffolding",
    tools: ["outline.md"],
    icon: "📋",
  },
  {
    id: "voice",
    name: "Voice Agent",
    role: "Builds and applies voice profiles",
    tools: ["voice_profiles/*", "text-analysis"],
    icon: "🗣️",
  },
  {
    id: "writer",
    name: "Writer Agent",
    role: "Drafts and revises chapter content",
    tools: ["chapters/*", "voice consult"],
    icon: "✍️",
  },
  {
    id: "editor",
    name: "Editor Agent",
    role: "Polishes, reviews, produces edit reports",
    tools: ["edits/*.md"],
    icon: "✂️",
  },
  {
    id: "debater",
    name: "Debater Agent",
    role: "Stress-tests ideas, argues the opposition",
    tools: ["idea consult"],
    icon: "⚖️",
  },
];

// Fallback when nothing matches — used by DEFAULT_SCENARIO only.
window.DEFAULT_SCENARIO = {
  target: "coordinator",
  route: null,
  steps: [
    { agent: "coordinator", state: "working", work: "Classifying your intent", ms: 1400 },
  ],
  reply:
    "I can route this to any of the seven specialists — tell me whether you want to brainstorm ideas, research, outline, build voice, draft, edit, or debate. You can also prefix with @idea, @research, @outline, @voice, @writer, @editor, or @debater.",
};
