# Realtime Chat

A multi-room chat application built on **WebSockets (Socket.io)** with live presence,
typing indicators, message history, and JWT-authenticated connections.

**Stack:** TypeScript · Node.js · Express · Socket.io · React (Vite)

![rooms · presence · typing](docs/demo.png)

## Features

- **Multi-room chat** — join `#general`, `#random`, `#tech`; messages broadcast only to the room.
- **Live presence** — see who is online in each room, updated on join/leave/disconnect.
- **Typing indicators** — debounced `typing:start` / `typing:stop` events, auto-clear after 1.5s.
- **Message history** — new joiners receive the last 50 messages of a room.
- **Authenticated handshake** — every socket connection is verified against a JWT before any event is processed.
- **Graceful disconnect** — leaving/closing a tab removes the user from presence in all their rooms.

## Architecture

```
┌──────────────┐   WebSocket (Socket.io)   ┌──────────────────────────┐
│  React client │◄─────────────────────────►│  Node + Socket.io server │
│  (useChat)    │   auth: JWT on handshake  │  io.use(auth) → rooms    │
└──────────────┘                            │  ChatStore (in-memory)   │
       ▲  REST /login (get JWT)             └──────────────────────────┘
       └────────────────────────────────────────────┘
```

- `server/src/index.ts` — Express + Socket.io server; auth middleware, room/message/typing/presence event handlers.
- `server/src/store.ts` — `ChatStore`: bounded per-room history, presence sets, typing sets. **Swappable** for Redis + Postgres (see below).
- `server/src/auth.ts` — issue/verify JWTs.
- `client/src/useChat.ts` — a hook that owns the socket lifecycle; the UI just renders its state.

## Run locally

```bash
# terminal 1 — server (:4000)
cd server && npm install && npm run dev

# terminal 2 — client (:5173)
cd client && npm install && npm run dev
```

Open http://localhost:5173 in **two browser windows**, join with different usernames, and chat in real time.

Run the tests:

```bash
cd server && npm test
```

## Scaling WebSockets (the hard part)

A single Node process holds every socket in memory, so this design doesn't
horizontally scale as-is. To run multiple instances behind a load balancer:

1. **Sticky sessions** — a socket is a long-lived TCP connection bound to one
   instance, so the LB must route a client back to the same node (or use the
   Socket.io session affinity / connection-state recovery).
2. **Redis pub-sub adapter** — instances don't share memory, so a message sent
   on node A won't reach a client connected to node B. `@socket.io/redis-adapter`
   publishes room broadcasts through Redis so every node delivers them. Presence
   and typing sets move from the in-memory `ChatStore` to Redis for the same reason.
3. **Durable history** — swap the in-memory history for **PostgreSQL** (append
   messages, page backwards) so history survives restarts and isn't capped at 50.

The `ChatStore` class is the seam: its interface (`addMessage`, `getHistory`,
`join`, `leave`, `setTyping`) is exactly what a Redis/Postgres adapter would
implement, so scaling is a store swap, not a rewrite.

## Deploy

- **Server** → Render / Railway / Fly.io (set `CLIENT_ORIGIN`, `JWT_SECRET`).
- **Client** → Vercel / Netlify (set `VITE_SERVER_URL` to the deployed server URL).

## Environment

| Var | Where | Default |
|---|---|---|
| `PORT` | server | `4000` |
| `CLIENT_ORIGIN` | server | `http://localhost:5173` |
| `JWT_SECRET` | server | `dev-secret-change-me` |
| `VITE_SERVER_URL` | client | `http://localhost:4000` |
