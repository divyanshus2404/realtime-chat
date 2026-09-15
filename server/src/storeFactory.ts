import { ChatStore } from "./store.js";
import { PgStore } from "./pgStore.js";
import type { ChatMessage } from "./types.js";

/**
 * The seam that makes storage swappable. Both stores expose the same surface;
 * getHistory/addMessage are declared async so the server can `await` either one
 * (awaiting a sync return value is a no-op, so ChatStore still works unchanged).
 */
export interface Store {
  addMessage(msg: ChatMessage): void | Promise<void>;
  getHistory(room: string): ChatMessage[] | Promise<ChatMessage[]>;
  join(room: string, user: string): string[];
  leave(room: string, user: string): string[];
  getPresence(room: string): string[];
  setTyping(room: string, user: string, isTyping: boolean): string[];
}

export async function createStore(): Promise<Store> {
  const url = process.env.DATABASE_URL;
  if (url) {
    const pg = new PgStore(url);
    await pg.init();
    console.log("store: PostgreSQL (durable history)");
    return pg;
  }
  console.log("store: in-memory (set DATABASE_URL for durable history)");
  return new ChatStore();
}
