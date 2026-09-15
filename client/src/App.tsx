import { useEffect, useRef, useState } from "react";
import { useChat } from "./useChat.js";

const SERVER = import.meta.env.VITE_SERVER_URL ?? "http://localhost:4000";
const ROOMS = ["general", "random", "tech"];

export function App() {
  const [user, setUser] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [room, setRoom] = useState(ROOMS[0]);

  if (!token || !user) {
    return <Login onLogin={(u, t) => { setUser(u); setToken(t); }} />;
  }
  return <Chat user={user} token={token} room={room} setRoom={setRoom} />;
}

function Login({ onLogin }: { onLogin: (user: string, token: string) => void }) {
  const [name, setName] = useState("");
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      const res = await fetch(`${SERVER}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: name.trim() }),
      });
      const data = await res.json();
      if (data.token) onLogin(data.user, data.token);
      else setErr(data.error ?? "login failed");
    } catch {
      setErr("cannot reach server — is it running on :4000?");
    }
  }

  return (
    <div className="center">
      <form className="card" onSubmit={submit}>
        <h1>💬 Realtime Chat</h1>
        <p className="muted">Pick a username to join.</p>
        <input
          autoFocus
          placeholder="username"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button type="submit">Join</button>
        {err && <p className="error">{err}</p>}
      </form>
    </div>
  );
}

function Chat({
  user, token, room, setRoom,
}: {
  user: string; token: string; room: string; setRoom: (r: string) => void;
}) {
  const { messages, online, typing, connected, send, notifyTyping } = useChat(token, user, room);
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    send(text);
    setText("");
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="me">
          <span className={connected ? "dot on" : "dot off"} /> {user}
        </div>
        <h3>Rooms</h3>
        {["general", "random", "tech"].map((r) => (
          <button
            key={r}
            className={r === room ? "room active" : "room"}
            onClick={() => setRoom(r)}
          >
            # {r}
          </button>
        ))}
        <h3>Online — {online.length}</h3>
        <ul className="online">
          {online.map((u) => (
            <li key={u}><span className="dot on" /> {u}</li>
          ))}
        </ul>
      </aside>

      <main className="main">
        <header className="header"># {room}</header>
        <div className="messages">
          {messages.map((m) => (
            <div key={m.id} className={m.user === user ? "msg mine" : "msg"}>
              <div className="meta">
                <b>{m.user}</b>
                <span className="time">
                  {new Date(m.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <div className="bubble">{m.text}</div>
            </div>
          ))}
          <div ref={endRef} />
        </div>
        <div className="typing">
          {typing.length > 0 &&
            `${typing.join(", ")} ${typing.length === 1 ? "is" : "are"} typing…`}
        </div>
        <form className="composer" onSubmit={submit}>
          <input
            value={text}
            placeholder={`Message #${room}`}
            onChange={(e) => { setText(e.target.value); notifyTyping(); }}
          />
          <button type="submit">Send</button>
        </form>
      </main>
    </div>
  );
}
