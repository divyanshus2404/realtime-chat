export interface ChatMessage {
  id: string;
  room: string;
  user: string;
  text: string;
  ts: number;
}

export interface Presence {
  user: string;
  room: string;
}

// Payloads the client emits
export interface ClientToServerEvents {
  "room:join": (room: string) => void;
  "room:leave": (room: string) => void;
  "message:send": (payload: { room: string; text: string }) => void;
  "typing:start": (room: string) => void;
  "typing:stop": (room: string) => void;
}

// Payloads the server emits
export interface ServerToClientEvents {
  "message:new": (msg: ChatMessage) => void;
  "history": (msgs: ChatMessage[]) => void;
  "presence:update": (payload: { room: string; users: string[] }) => void;
  "typing:update": (payload: { room: string; users: string[] }) => void;
  "error:auth": (reason: string) => void;
}

export interface SocketData {
  user: string;
}
