/*
 * App shell — composes the left rail, center conversation, right rail.
 * Owns the chat history, agent state machine, and artifact reader state.
 */

const { useState: useStateA, useEffect: useEffectA, useRef: useRefA, useMemo: useMemoA } = React;

// Maps ADK agent names → frontend agent IDs
const AUTHOR_TO_ID = {
  coordinator: "coordinator",
  idea_agent: "idea",
  research_agent: "research",
  outline_agent: "outline",
  voice_agent: "voice",
  writer_agent: "writer",
  editor_agent: "editor",
  debater_agent: "debater",
  world_builder_agent: "world",
};
const authorToId = (author) => AUTHOR_TO_ID[author] || author;

function useAgentStates() {
  const initial = {};
  for (const a of window.AGENTS) initial[a.id] = { status: "idle", work: null };
  const [states, setStates] = useStateA(initial);
  const timers = useRefA([]);

  const setAgentStatus = (agentId, status, work = null) =>
    setStates((s) => ({ ...s, [agentId]: { status, work } }));

  const setAllIdle = () => {
    setStates(() => {
      const next = {};
      for (const a of window.AGENTS) next[a.id] = { status: "idle", work: null };
      return next;
    });
  };

  const clear = () => {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
  };

  const runScenario = (scenario, onComplete) => {
    clear();
    // Coordinator is always "working" at the top of a route.
    setStates((s) => ({ ...s, coordinator: { status: "working", work: "Classifying intent" } }));

    let elapsed = 0;
    // Coordinator routes briefly, then hands off.
    timers.current.push(setTimeout(() => {
      setStates((s) => ({ ...s, coordinator: { status: "communicating", work: `→ ${window.agentById(scenario.target).name}` } }));
    }, 900));
    elapsed += 900;

    for (const step of scenario.steps) {
      const at = elapsed;
      timers.current.push(setTimeout(() => {
        setStates((s) => ({ ...s, [step.agent]: { status: step.state, work: step.work } }));
      }, at));
      elapsed += step.ms;
    }

    // After the last step: return everyone to idle except the target agent,
    // which stays "communicating" (delivering reply), then goes idle.
    const finalAt = elapsed;
    timers.current.push(setTimeout(() => {
      setStates((s) => {
        const next = { ...s };
        for (const a of window.AGENTS) {
          next[a.id] = a.id === scenario.target
            ? { status: "communicating", work: "Delivering response" }
            : { status: "idle", work: null };
        }
        return next;
      });
    }, finalAt));

    timers.current.push(setTimeout(() => {
      setStates((s) => {
        const next = { ...s };
        for (const a of window.AGENTS) next[a.id] = { status: "idle", work: null };
        return next;
      });
      onComplete && onComplete();
    }, finalAt + 900));

    return finalAt + 900;
  };

  useEffectA(() => () => clear(), []);
  return { states, runScenario, setAgentStatus, setAllIdle };
}

function App() {
  const [activeProjectId, setActiveProjectIdRaw] = useStateA("vertical-void");
  const [projects, setProjects] = useStateA(window.ARTIFACTS.projects);
  const activeProject = projects.find((p) => p.id === activeProjectId) || projects[0];

  const setActiveProjectId = (id) => {
    if (projects.find((p) => p.id === id)) setActiveProjectIdRaw(id);
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      if (!res.ok) return;
      const data = await res.json();
      if (data.length === 0) return;
      setProjects(data);
      setActiveProjectIdRaw((curr) => (data.find((p) => p.id === curr) ? curr : data[0].id));
    } catch (_) {}
  };

  useEffectA(() => {
    fetchProjects();
    const onFocus = () => fetchProjects();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm(`Delete this project? All files will be permanently removed.`)) return;
    try {
      await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
    } catch (_) {}
    setProjects((prev) => {
      const next = prev.filter((p) => p.id !== projectId);
      if (activeProjectId === projectId && next.length > 0) {
        setActiveProjectIdRaw(next[0].id);
        setActiveArtifact(null);
      }
      return next;
    });
  };

  const [artifacts, setArtifacts] = useStateA(() => ({ ...window.ARTIFACTS }));

  const addArtifact = (kind, data) => {
    setArtifacts((prev) => ({
      ...prev,
      [kind]: [...(prev[kind] || []).filter((x) => x.id !== data.id), data],
    }));
  };

  const [activeArtifact, setActiveArtifact] = useStateA(null); // { type, data }
  const openArtifact = (leaf) => setActiveArtifact(leaf.payload);
  const activeArtifactId = activeArtifact ? activeArtifact.data.id : null;

  const [syncing, setSyncing] = useStateA(false);
  const [syncResult, setSyncResult] = useStateA(null);

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/sync", { method: "POST" });
      if (!res.ok) return;
      const data = await res.json();
      if (data.projects) {
        setProjects(data.projects);
        if (data.projects.length > 0) {
          setActiveProjectIdRaw((curr) =>
            data.projects.find((p) => p.id === curr) ? curr : data.projects[0].id
          );
        }
      }
      if (data.artifacts) {
        Object.entries(data.artifacts).forEach(([kind, items]) => {
          items.forEach((item) => addArtifact(kind, item));
        });
      }
      setSyncResult(data.synced ?? 0);
    } catch (_) {
      setSyncResult(0);
    } finally {
      setSyncing(false);
    }
  };

  const { states, runScenario, setAgentStatus, setAllIdle } = useAgentStates();
  const [busy, setBusy] = useStateA(false);
  const [typingAgent, setTypingAgent] = useStateA(null);
  const sessionIdRef = useRefA(`session-${Date.now()}`);

  const [messages, setMessages] = useStateA(() => ([
    {
      id: "m-welcome",
      role: "assistant",
      agentId: "coordinator",
      time: window.now(),
      text: `Welcome back. You're working on **The Vertical Void** — we left off in ideation, with the 3-chapter structure drafted.\n\nI can route to any specialist: **@idea**, **@research**, **@outline**, **@voice**, **@writer**, **@editor**, or **@debater**. Or just tell me what you want to do and I'll hand off.`,
    },
  ]));

  const listRef = useRefA(null);
  useEffectA(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, typingAgent, activeArtifact]);

  const handleNewProject = async ({ title, type, genre, description }) => {
    let newProject;
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, type, genre, description }),
      });
      newProject = await res.json();
    } catch (_) {
      const id = `proj-${Date.now()}`;
      newProject = { id, name: title, status: "ideation", created: new Date().toISOString().slice(0, 10), wordCount: 0, chapters: 0, updated: "just now" };
    }
    setProjects((prev) => [...prev, newProject]);
    setActiveProjectIdRaw(newProject.id);
    setActiveArtifact(null);

    const parts = [`I'm starting a new ${type} book project: **${title}**.`];
    if (genre) parts.push(`Genre: ${genre}.`);
    if (description) parts.push(description);
    setTimeout(() => send(parts.join(" ")), 100);
  };

  const handleProjectSwitch = (project) => {
    setBusy(true);

    const ideas = (artifacts.ideas || []).filter((a) => a.project === project.id);
    const outlines = (artifacts.outlines || []).filter((a) => a.project === project.id);
    const drafts = (artifacts.drafts || []).filter((a) => a.project === project.id);

    setMessages((m) => [
      ...m,
      { id: `ctx-${Date.now()}`, role: "system", text: `Project: ${project.name}`, time: window.now() },
    ]);

    let reviewAgentId, coordinatorText, agentReply, reviewSteps, artifactToOpen;

    if (project.status === "drafting" && drafts.length > 0) {
      reviewAgentId = "editor";
      const totalWords = drafts.reduce((s, d) => s + d.words, 0);
      const outline = outlines[0];
      const unwritten = outline ? outline.chapters - drafts.length : 0;
      coordinatorText = `Switching to **${project.name}** — ${drafts.length} chapter${drafts.length !== 1 ? "s" : ""} drafted, ${totalWords.toLocaleString()} words. Routing to Editor for a status review.`;
      const draftLines = drafts
        .map((d) => `- **${d.title}**: ${d.words.toLocaleString()} w — ${d.status}`)
        .join("\n");
      agentReply = `Reviewed **${project.name}** — ${drafts.length} chapters drafted, ${totalWords.toLocaleString()} words.\n\n${draftLines}${unwritten > 0 ? `\n\n${unwritten} chapter${unwritten !== 1 ? "s" : ""} in the outline are not yet written.` : ""}\n\nReady to keep drafting, do an editorial pass, or tackle the structure gaps — what's the priority?`;
      reviewSteps = [
        { agent: "editor", state: "working", work: "Reading draft files", ms: 1100 },
        { agent: "editor", state: "working", work: "Assessing chapter status", ms: 1000 },
        { agent: "editor", state: "working", work: "Flagging editorial priorities", ms: 800 },
      ];
      artifactToOpen = drafts[0] ? { type: "draft", data: drafts[0] } : null;
    } else {
      reviewAgentId = "idea";
      const idea = ideas[0];
      const outline = outlines[0];
      coordinatorText = `Switching to **${project.name}** — currently in ${project.status}.${outline ? ` ${outline.chapters}-chapter structure is sketched.` : ""} I'll have Idea Agent pull up what we have.`;
      const thesisMatch = idea?.body.match(/##\s*Core Thesis\s*\n+([\s\S]*?)(?=\n##|$)/);
      const rawThesis = thesisMatch ? thesisMatch[1].trim() : null;
      const thesis = rawThesis
        ? (rawThesis.match(/^[^.!?]+[.!?]/)?.[0] ?? rawThesis.split("\n")[0])
        : null;
      const chapterLines = outline
        ? outline.body
            .split("\n")
            .filter((l) => l.startsWith("###"))
            .map((l) => `- ${l.replace(/^###\s*/, "")}`)
            .join("\n")
        : null;
      agentReply = [
        `Pulled up **${project.name}**.`,
        thesis
          ? `\n\n**Core thesis:** ${thesis}`
          : idea
          ? "\n\nIdea document is loaded."
          : "\n\nNo idea document yet.",
        chapterLines
          ? `\n\n**${outline.chapters}-chapter structure:**\n${chapterLines}`
          : "\n\nNo outline yet — ready to start structuring.",
        `\n\nWhat do you want to work on?`,
      ].join("");
      reviewSteps = [
        { agent: "idea", state: "working", work: "Reading idea document", ms: 1200 },
        { agent: "idea", state: "working", work: "Reviewing chapter structure", ms: 900 },
        { agent: "idea", state: "working", work: "Assessing voice calibration", ms: 700 },
      ];
      artifactToOpen = idea
        ? { type: "idea", data: idea }
        : outline
        ? { type: "outline", data: outline }
        : null;
    }

    setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          id: `coord-${Date.now()}`,
          role: "assistant",
          agentId: "coordinator",
          time: window.now(),
          text: coordinatorText,
          handoff: reviewAgentId,
        },
      ]);
    }, 600);

    runScenario({ target: reviewAgentId, steps: reviewSteps });
    setTimeout(() => setTypingAgent(reviewAgentId), 1600);

    const total = reviewSteps.reduce((s, step) => s + step.ms, 900);
    setTimeout(() => {
      setTypingAgent(null);
      setMessages((m) => [
        ...m,
        {
          id: `rev-${Date.now()}`,
          role: "assistant",
          agentId: reviewAgentId,
          time: window.now(),
          text: agentReply,
        },
      ]);
      setBusy(false);
      if (artifactToOpen) setActiveArtifact(artifactToOpen);
    }, total + 700);
  };

  const handleSelectProject = (id) => {
    const project = projects.find((p) => p.id === id);
    if (!project || id === activeProjectId) return;
    setActiveProjectId(id);
    setActiveArtifact(null);
    if (!busy) handleProjectSwitch(project);
  };

  const send = async (text) => {
    const userMsg = { id: `u-${Date.now()}`, role: "user", time: window.now(), text };
    setMessages((m) => [...m, userMsg]);
    setBusy(true);
    setAgentStatus("coordinator", "working", "Classifying intent");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          session_id: sessionIdRef.current,
          project_id: activeProjectId,
          book_name: activeProject?.name ?? "",
        }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let activeAgent = "coordinator";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop(); // hold incomplete line

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          let evt;
          try { evt = JSON.parse(line.slice(6)); } catch { continue; }

          if (evt.type === "status" && evt.author) {
            const agentId = authorToId(evt.author);
            if (agentId !== activeAgent) {
              setAgentStatus(activeAgent, "idle", null);
              activeAgent = agentId;
              setAgentStatus(agentId, "working", "Working…");
              setTypingAgent(agentId);
            }
          } else if (evt.type === "project_update") {
            setProjects((prev) => prev.map((p) =>
              p.id === evt.id ? { ...p, wordCount: evt.wordCount, chapters: evt.chapters, updated: evt.updated } : p
            ));
          } else if (evt.type === "artifact") {
            addArtifact(evt.kind, evt.data);
            const readerKind = { drafts: "draft", outlines: "outline", ideas: "idea", world: "world" }[evt.kind];
            if (readerKind) setActiveArtifact({ type: readerKind, data: evt.data });
          } else if (evt.type === "message") {
            const agentId = authorToId(evt.author || "coordinator");
            setTypingAgent(null);
            setAllIdle();
            setMessages((m) => [...m, {
              id: `a-${Date.now()}`,
              role: "assistant",
              agentId,
              time: window.now(),
              text: evt.text,
            }]);
            setBusy(false);
          } else if (evt.type === "error") {
            setTypingAgent(null);
            setAllIdle();
            setMessages((m) => [...m, {
              id: `e-${Date.now()}`,
              role: "assistant",
              agentId: "coordinator",
              time: window.now(),
              text: `Something went wrong: ${evt.text}`,
            }]);
            setBusy(false);
          }
        }
      }
    } catch (err) {
      setTypingAgent(null);
      setAllIdle();
      setMessages((m) => [...m, {
        id: `e-${Date.now()}`,
        role: "assistant",
        agentId: "coordinator",
        time: window.now(),
        text: `Connection error: ${err.message}`,
      }]);
      setBusy(false);
    }
  };

  return (
    <div className="shell">
      <window.ArtifactBrowser
        projects={projects}
        artifacts={artifacts}
        activeProjectId={activeProjectId}
        setActiveProjectId={handleSelectProject}
        openArtifact={openArtifact}
        activeArtifactId={activeArtifactId}
        onNewProject={handleNewProject}
        onDeleteProject={handleDeleteProject}
        onSync={handleSync}
        syncing={syncing}
        syncResult={syncResult}
      />

      <main className="stage">
        <header className="stage__header">
          <div className="stage__breadcrumb">
            <span className="stage__crumb">{activeProject.name}</span>
            <span className="stage__sep">/</span>
            <span className="stage__crumb stage__crumb--muted">Conversation</span>
          </div>
          <div className="stage__header-right">
            <span className={`status-pill status-pill--${activeProject.status}`}>
              <span className="status-pill__dot" />
              {activeProject.status}
            </span>
            <span className="stage__sep">·</span>
            <span className="stage__meta">last activity {activeProject.updated}</span>
          </div>
        </header>

        {activeArtifact ? (
          <window.ReaderPanel item={activeArtifact} onClose={() => setActiveArtifact(null)} />
        ) : null}

        <div className="thread" ref={listRef}>
          <div className="thread__inner">
            {messages.map((m) => <window.Message key={m.id} msg={m} />)}
            {typingAgent ? <window.TypingBubble agentId={typingAgent} /> : null}
          </div>
        </div>

        <window.Composer onSend={send} disabled={busy} />
      </main>

      <window.StatusRail states={states} activeProject={activeProject} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
