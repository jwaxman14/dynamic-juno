/*
 * Center stage: conversation panel + artifact reader.
 * When an artifact is opened from the left rail it appears as a docked
 * reader panel above the chat, like a second-monitor reference.
 */

const { useState: useStateC, useEffect: useEffectC, useRef: useRefC, useCallback: useCallbackC } = React;

function Message({ msg }) {
  const agent = msg.agentId ? window.AGENTS.find((a) => a.id === msg.agentId) : null;
  const isUser = msg.role === "user";
  const isSystem = msg.role === "system";
  if (isSystem) {
    return (
      <div className="msg msg--system">
        <div className="msg--system__line">
          <span className="msg--system__hand" />
          <span>{msg.text}</span>
          <span className="msg--system__time">{msg.time}</span>
        </div>
      </div>
    );
  }
  return (
    <div className={`msg ${isUser ? "msg--user" : "msg--agent"} ${agent ? `msg--${agent.id}` : ""}`}>
      <div className="msg__gutter">
        {isUser ? (
          <div className="avatar avatar--user">YOU</div>
        ) : (
          <div className={`avatar avatar--agent avatar--${agent.id}`}>
            {agent.name.split(" ")[0].slice(0, 2).toUpperCase()}
          </div>
        )}
      </div>
      <div className="msg__body">
        <div className="msg__header">
          <span className="msg__who">{isUser ? "You" : agent.name}</span>
          {!isUser ? <span className="msg__role">{agent.role}</span> : null}
          <span className="msg__time">{msg.time}</span>
        </div>
        <div className="msg__text" dangerouslySetInnerHTML={{ __html: window.mdToHtml(msg.text) }} />
        {msg.handoff ? (
          <div className="msg__handoff">
            <span className="handoff__arrow" aria-hidden="true">↳</span>
            <span>Handing off to <strong>{window.agentById(msg.handoff).name}</strong></span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function TypingBubble({ agentId }) {
  const agent = window.AGENTS.find((a) => a.id === agentId);
  return (
    <div className={`msg msg--agent msg--typing msg--${agent.id}`}>
      <div className="msg__gutter">
        <div className={`avatar avatar--agent avatar--${agent.id}`}>
          {agent.name.split(" ")[0].slice(0, 2).toUpperCase()}
        </div>
      </div>
      <div className="msg__body">
        <div className="msg__header">
          <span className="msg__who">{agent.name}</span>
          <span className="msg__role">{agent.role}</span>
        </div>
        <div className="typing">
          <span /><span /><span />
        </div>
      </div>
    </div>
  );
}

function Composer({ onSend, disabled }) {
  const [value, setValue] = useStateC("");
  const taRef = useRefC(null);
  const mentions = ["@idea", "@research", "@outline", "@voice", "@writer", "@editor", "@debater"];

  const submit = () => {
    const t = value.trim();
    if (!t || disabled) return;
    onSend(t);
    setValue("");
    if (taRef.current) taRef.current.style.height = "auto";
  };

  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const insertMention = (m) => {
    setValue((v) => (v ? `${m} ${v.replace(/^@\w+\s*/, "")}` : `${m} `));
    setTimeout(() => taRef.current?.focus(), 0);
  };

  return (
    <div className="composer">
      <div className="composer__mentions">
        <span className="composer__mentions-label">Route to</span>
        {mentions.map((m) => (
          <button
            key={m}
            type="button"
            className="mention-chip"
            onClick={() => insertMention(m)}
          >
            {m}
          </button>
        ))}
        <span className="composer__mentions-hint">or let the Coordinator decide</span>
      </div>
      <div className="composer__box">
        <textarea
          ref={taRef}
          value={value}
          placeholder="Message your team…"
          onChange={(e) => {
            setValue(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = Math.min(e.target.scrollHeight, 200) + "px";
          }}
          onKeyDown={onKey}
          rows={1}
          disabled={disabled}
        />
        <div className="composer__actions">
          <div className="composer__kb">
            <span className="kbd">⏎</span> send · <span className="kbd">⇧⏎</span> newline
          </div>
          <button type="button" className="send-btn" onClick={submit} disabled={!value.trim() || disabled}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M1.5 7h11M8 2.5l4.5 4.5L8 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Send</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function ReaderPanel({ item, onClose, onSave }) {
  if (!item) return null;
  const { type, data } = item;
  const owner = { idea: "idea", outline: "outline", draft: "writer", voice: "voice", world: "idea" }[type];
  const ownerAgent = window.agentById(owner);
  const kindLabel = { idea: "Idea document", outline: "Outline", draft: "Draft", voice: "Voice profile", world: "World building" }[type];
  const canEdit = type === "idea" || type === "outline" || type === "draft";

  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState(data.body || "");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    setIsEditing(false);
    setEditValue(data.body || "");
  }, [data.id]);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/artifacts/${data.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editValue }),
      });
      if (res.ok) {
        const updated = await res.json();
        onSave(updated);
        setIsEditing(false);
      }
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setEditValue(data.body || "");
    setIsEditing(false);
  }

  return (
    <div className="reader">
      <div className="reader__head">
        <div className="reader__head-main">
          <div className="reader__kind">{kindLabel}</div>
          <div className="reader__title">{data.title || data.name}</div>
          <div className="reader__meta">
            {ownerAgent ? <span className="reader__owner">maintained by {ownerAgent.name}</span> : null}
            <span className="reader__dot">·</span>
            <span>updated {data.updated}</span>
            {data.words ? <><span className="reader__dot">·</span><span>{data.words.toLocaleString()} words</span></> : null}
            {data.status ? <><span className="reader__dot">·</span><span className="tag tag--quiet">{data.status}</span></> : null}
          </div>
        </div>
        <div className="reader__actions">
          {canEdit && !isEditing && (
            <button type="button" className="reader__edit-btn" onClick={() => setIsEditing(true)}>Edit</button>
          )}
          {isEditing && (
            <>
              <button type="button" className="reader__save-btn" onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </button>
              <button type="button" className="reader__cancel-btn" onClick={handleCancel}>Cancel</button>
            </>
          )}
          <button type="button" className="reader__close" onClick={onClose} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
              <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>
      <div className="reader__body">
        {type === "voice" ? (
          <VoiceReader profile={data} />
        ) : isEditing ? (
          <textarea
            className="reader__editor"
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            spellCheck={false}
          />
        ) : (
          <div className="prose" dangerouslySetInnerHTML={{ __html: window.mdToHtml(data.body) }} />
        )}
      </div>
    </div>
  );
}

function VoiceReader({ profile }) {
  const rows = [
    ["Samples analyzed", profile.samples],
    ["Total words", profile.words.toLocaleString()],
    ["Avg sentence length", `${profile.avgSentence} words`],
    ["Sentence variation", profile.sentenceVariation],
    ["Vocabulary", profile.vocabulary],
    ["Punctuation", profile.punctuation],
    ["Voice indicators", profile.indicators],
    ["Tone markers", profile.tone],
  ];
  return (
    <div className="voice-grid">
      {rows.map(([k, v]) => (
        <div className="voice-row" key={k}>
          <div className="voice-row__k">{k}</div>
          <div className="voice-row__v">{v}</div>
        </div>
      ))}
    </div>
  );
}

window.Composer = Composer;
window.Message = Message;
window.TypingBubble = TypingBubble;
window.ReaderPanel = ReaderPanel;
