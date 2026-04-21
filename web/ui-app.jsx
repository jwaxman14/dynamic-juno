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

  const setAgentStatus = (agentId, status, work = null) =>
    setStates((s) => ({ ...s, [agentId]: { status, work } }));

  const setAllIdle = () => {
    setStates(() => {
      const next = {};
      for (const a of window.AGENTS) next[a.id] = { status: "idle", work: null };
      return next;
    });
  };

  return { states, setAgentStatus, setAllIdle };
}

function App() {
  const [activeProjectId, setActiveProjectIdRaw] = useStateA(window.ARTIFACTS.projects[0]?.id ?? null);
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

  const { states, setAgentStatus, setAllIdle } = useAgentStates();
  const [busy, setBusy] = useStateA(false);
  const [typingAgent, setTypingAgent] = useStateA(null);
  const [sessionState, setSessionState] = useStateA({});
  const sessionIdRef = useRefA(`session-${Date.now()}`);

  const [messages, setMessages] = useStateA(() => ([
    {
      id: "m-welcome",
      role: "assistant",
      agentId: "coordinator",
      time: window.now(),
      text: `Welcome back. I can route to any specialist: **@idea**, **@research**, **@outline**, **@voice**, **@writer**, **@editor**, or **@debater**. Or just tell me what you want to do and I'll hand off.`,
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
    setMessages((m) => [
      ...m,
      { id: `ctx-${Date.now()}`, role: "system", text: `Project: ${project.name}`, time: window.now() },
    ]);
    setTimeout(() => {
      send(`I've switched to the project "${project.name}". Please review the current state of this project and tell me where we left off and what the best next step is.`);
    }, 100);
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
          } else if (evt.type === "state") {
            setSessionState(evt);
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

  if (!activeProject) return (
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
      <main className="stage"><div className="thread"><div className="thread__inner" /></div></main>
      <window.StatusRail states={states} activeProject={null} sessionState={sessionState} />
    </div>
  );

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
          <window.ReaderPanel
            item={activeArtifact}
            onClose={() => setActiveArtifact(null)}
            onSave={(updatedData) => {
              setActiveArtifact({ type: activeArtifact.type, data: updatedData });
              const kind = { idea: "ideas", outline: "outlines", draft: "drafts" }[activeArtifact.type];
              if (kind) addArtifact(kind, updatedData);
            }}
          />
        ) : null}

        <div className="thread" ref={listRef}>
          <div className="thread__inner">
            {messages.map((m) => <window.Message key={m.id} msg={m} />)}
            {typingAgent ? <window.TypingBubble agentId={typingAgent} /> : null}
          </div>
        </div>

        <window.Composer onSend={send} disabled={busy} />
      </main>

      <window.StatusRail states={states} activeProject={activeProject} sessionState={sessionState} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
