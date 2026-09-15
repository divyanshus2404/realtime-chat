import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { SERVER_URL } from "./config";

export interface ChatMessage {
  id: string;
  room: string;
  user: string;
  text: string;
  ts: number;
}

/**
 * Same socket lifecycle as the web client, reused verbatim for the mobile app:
 * authenticated connect, join room, history + live messages, presence, typing.
 * Proof that the Socket.io backend is a real product API, not tied to a website.
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
    const socket = io(SERVER_URL, { auth: { token }, transports: ["websocket"] });
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

  const notifyTyping = useCallback(() => {
    const s = socketRef.current;
    if (!s) return;
    s.emit("typing:start", room);
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => s.emit("typing:stop", room), 1500);
  }, [room]);

  return { messages, online, typing, connected, send, notifyTyping };
}
