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
  const activeProject = window.ARTIFACTS.projects.find((p) => p.id === activeProjectId);

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
      setMessages((m) => [...m, {
        id: `a-${Date.now()}`,
        role: "assistant",
        agentId: scenario.target,
        time: window.now(),
        text: scenario.reply,
      }]);
      setBusy(false);

      // If the reply created / updated an artifact, open it in the reader.
      const maybe = {
        research: null, // research reader not yet built; left rail stays the main surface
        outline: window.ARTIFACTS.outlines.find((o) => o.project === activeProjectId),
        voice: window.ARTIFACTS.voiceProfiles[0],
        writer: window.ARTIFACTS.drafts.find((d) => d.project === activeProjectId),
        editor: window.ARTIFACTS.drafts.find((d) => d.project === activeProjectId),
        idea: window.ARTIFACTS.ideas.find((i) => i.project === activeProjectId),
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
        projects={window.ARTIFACTS.projects}
        activeProjectId={activeProjectId}
        setActiveProjectId={setActiveProjectId}
        openArtifact={openArtifact}
        activeArtifactId={activeArtifactId}
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
