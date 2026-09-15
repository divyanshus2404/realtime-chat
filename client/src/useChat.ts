import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

const SERVER = import.meta.env.VITE_SERVER_URL ?? "http://localhost:4000";

export interface ChatMessage {
  id: string;
  room: string;
  user: string;
  text: string;
  ts: number;
}

/**
 * Encapsulates the whole socket lifecycle: authenticated connect, join a room,
 * receive history + live messages, presence, and typing indicators. The
 * component just calls send()/setTyping() and renders the returned state.
 */
export function useChat(token: string | null, user: string | null, room: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [online, setOnline] = useState<string[]>([]);
  const [typing, setTyping] = useState<string[]>([]);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!token) return;
    const socket = io(SERVER, { auth: { token } });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("room:join", room);
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on("history", (msgs: ChatMessage[]) => setMessages(msgs));
    socket.on("message:new", (msg: ChatMessage) =>
      setMessages((prev) => [...prev, msg])
    );
    socket.on("presence:update", (p: { room: string; users: string[] }) => {
      if (p.room === room) setOnline(p.users);
    });
    socket.on("typing:update", (p: { room: string; users: string[] }) => {
      if (p.room === room) setTyping(p.users.filter((u) => u !== user));
    });

    return () => {
      socket.emit("room:leave", room);
      socket.disconnect();
    };
  }, [token, room, user]);

  const send = useCallback(
    (text: string) => {
      socketRef.current?.emit("message:send", { room, text });
    },
    [room]
  );

  // Emit typing:start, then auto-stop after 1.5s of no keystrokes (debounced).
  const notifyTyping = useCallback(() => {
    const s = socketRef.current;
    if (!s) return;
    s.emit("typing:start", room);
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => s.emit("typing:stop", room), 1500);
  }, [room]);

  return { messages, online, typing, connected, send, notifyTyping };
}
