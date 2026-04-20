/*
 * App shell — composes the left rail, center conversation, right rail.
 * Owns the chat history, agent state machine, and artifact reader state.
 */

const { useState: useStateA, useEffect: useEffectA, useRef: useRefA, useMemo: useMemoA } = React;

function useAgentStates() {
  const initial = {};
  for (const a of window.AGENTS) initial[a.id] = { status: "idle", work: null };
  const [states, setStates] = useStateA(initial);
  const timers = useRefA([]);

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
  return { states, runScenario };
}

function App() {
  const [activeProjectId, setActiveProjectId] = useStateA("vertical-void");
  const [projects, setProjects] = useStateA(window.ARTIFACTS.projects);
  const activeProject = projects.find((p) => p.id === activeProjectId);

  const [activeArtifact, setActiveArtifact] = useStateA(null); // { type, data }
  const openArtifact = (leaf) => setActiveArtifact(leaf.payload);
  const activeArtifactId = activeArtifact ? activeArtifact.data.id : null;

  const { states, runScenario } = useAgentStates();
  const [busy, setBusy] = useStateA(false);
  const [typingAgent, setTypingAgent] = useStateA(null);

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

  const handleNewProject = ({ title, type, genre, description }) => {
    const id = `proj-${Date.now()}`;
    const newProject = {
      id,
      name: title,
      status: "ideation",
      created: new Date().toISOString().slice(0, 10),
      wordCount: 0,
      chapters: 0,
      updated: "just now",
    };
    setProjects((prev) => [...prev, newProject]);
    setActiveProjectId(id);
    setActiveArtifact(null);

    const parts = [`I'm starting a new ${type} book project: **${title}**.`];
    if (genre) parts.push(`Genre: ${genre}.`);
    if (description) parts.push(description);
    const initMessage = parts.join(" ");

    setTimeout(() => send(initMessage), 100);
  };

  const handleProjectSwitch = (project) => {
    setBusy(true);

    const ideas = window.ARTIFACTS.ideas.filter((a) => a.project === project.id);
    const outlines = window.ARTIFACTS.outlines.filter((a) => a.project === project.id);
    const drafts = window.ARTIFACTS.drafts.filter((a) => a.project === project.id);

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

  const send = (text) => {
    const scenario = window.pickScenario(text);
    const userMsg = { id: `u-${Date.now()}`, role: "user", time: window.now(), text };
    setMessages((m) => [...m, userMsg]);
    setBusy(true);

    // Coordinator acknowledges routing.
    if (scenario.route) {
      setTimeout(() => {
        setMessages((m) => [...m, {
          id: `c-${Date.now()}`,
          role: "assistant",
          agentId: "coordinator",
          time: window.now(),
          text: scenario.route,
          handoff: scenario.target !== "coordinator" ? scenario.target : null,
        }]);
      }, 700);
    }

    // Run the agent state machine, and show a typing bubble for the target.
    runScenario(scenario);
    setTimeout(() => setTypingAgent(scenario.target), 1600);

    // Compute total scripted duration.
    const total = scenario.steps.reduce((sum, s) => sum + s.ms, 900);
    setTimeout(() => {
      setTypingAgent(null);

      // Build a project-aware reply using the active project's real artifacts.
      const projectArtifacts = {
        ideas:         window.ARTIFACTS.ideas.filter((a) => a.project === activeProjectId),
        outlines:      window.ARTIFACTS.outlines.filter((a) => a.project === activeProjectId),
        drafts:        window.ARTIFACTS.drafts.filter((a) => a.project === activeProjectId),
        voiceProfiles: window.ARTIFACTS.voiceProfiles,
      };
      const replyText = window.buildProjectReply(scenario.target, activeProject, projectArtifacts);

      setMessages((m) => [...m, {
        id: `a-${Date.now()}`,
        role: "assistant",
        agentId: scenario.target,
        time: window.now(),
        text: replyText,
      }]);
      setBusy(false);

      // If the reply created / updated an artifact, open it in the reader.
      const maybe = {
        research: null, // research reader not yet built; left rail stays the main surface
        outline: projectArtifacts.outlines[0] ?? null,
        voice: projectArtifacts.voiceProfiles[0] ?? null,
        writer: projectArtifacts.drafts[0] ?? null,
        editor: projectArtifacts.drafts[0] ?? null,
        idea: projectArtifacts.ideas[0] ?? null,
      }[scenario.target];
      if (maybe) {
        const typeMap = { outline: "outline", voice: "voice", writer: "draft", editor: "draft", idea: "idea" };
        setActiveArtifact({ type: typeMap[scenario.target], data: maybe });
      }
    }, total + 700);
  };

  return (
    <div className="shell">
      <window.ArtifactBrowser
        projects={projects}
        activeProjectId={activeProjectId}
        setActiveProjectId={handleSelectProject}
        openArtifact={openArtifact}
        activeArtifactId={activeArtifactId}
        onNewProject={handleNewProject}
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
