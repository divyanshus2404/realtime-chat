import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import { issueToken, verifyToken } from "./auth.js";
import { createStore } from "./storeFactory.js";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  SocketData,
} from "./types.js";

const PORT = Number(process.env.PORT ?? 4000);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";

const app = express();
app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

// "Login" endpoint — trade a username for a JWT (see auth.ts for the caveat).
app.post("/login", (req, res) => {
  const user = String(req.body?.user ?? "").trim();
  if (!user) return res.status(400).json({ error: "username required" });
  return res.json({ token: issueToken(user), user });
});

const httpServer = createServer(app);
const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>(httpServer, { cors: { origin: CLIENT_ORIGIN } });

const store = await createStore();

// Authenticate the WebSocket handshake before any events flow.
io.use((socket, next) => {
  const token = socket.handshake.auth?.token as string | undefined;
  const user = token ? verifyToken(token) : null;
  if (!user) return next(new Error("unauthorized"));
  socket.data.user = user;
  next();
});

io.on("connection", (socket) => {
  const user = socket.data.user;

  socket.on("room:join", async (room) => {
    socket.join(room);
    const users = store.join(room, user);
    socket.emit("history", await store.getHistory(room));
    io.to(room).emit("presence:update", { room, users });
  });

  socket.on("room:leave", (room) => {
    socket.leave(room);
    const users = store.leave(room, user);
    io.to(room).emit("presence:update", { room, users });
  });

  socket.on("message:send", async ({ room, text }) => {
    const clean = String(text ?? "").slice(0, 2000).trim();
    if (!clean) return;
    const msg = { id: randomUUID(), room, user, text: clean, ts: Date.now() };
    await store.addMessage(msg);
    // Stop showing this user as "typing" once they send.
    io.to(room).emit("typing:update", { room, users: store.setTyping(room, user, false) });
    io.to(room).emit("message:new", msg);
  });

  socket.on("typing:start", (room) => {
    io.to(room).emit("typing:update", { room, users: store.setTyping(room, user, true) });
  });

  socket.on("typing:stop", (room) => {
    io.to(room).emit("typing:update", { room, users: store.setTyping(room, user, false) });
  });

  // On disconnect, drop the user from every room they were in.
  socket.on("disconnecting", () => {
    for (const room of socket.rooms) {
      if (room === socket.id) continue;
      const users = store.leave(room, user);
      store.setTyping(room, user, false);
      io.to(room).emit("presence:update", { room, users });
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`chat server on :${PORT} (client origin ${CLIENT_ORIGIN})`);
});

export { app, io };
