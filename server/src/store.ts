import type { ChatMessage } from "./types.js";

/**
 * In-memory message + presence store.
 *
 * This is deliberately swappable: in production you'd back `history` with
 * PostgreSQL (durable) and `presence`/`typing` with Redis (shared across
 * server instances). See README "Scaling WebSockets". The interface below is
 * what a Redis/Postgres adapter would implement.
 */
export class ChatStore {
  private history = new Map<string, ChatMessage[]>();
  private presence = new Map<string, Set<string>>(); // room -> users
  private typing = new Map<string, Set<string>>(); // room -> users
  private readonly maxHistory: number;

  constructor(maxHistory = 50) {
    this.maxHistory = maxHistory;
  }

  addMessage(msg: ChatMessage): void {
    const list = this.history.get(msg.room) ?? [];
    list.push(msg);
    // Keep only the last N messages per room (bounded memory).
    if (list.length > this.maxHistory) list.splice(0, list.length - this.maxHistory);
    this.history.set(msg.room, list);
  }

  getHistory(room: string): ChatMessage[] {
    return this.history.get(room) ?? [];
  }

  join(room: string, user: string): string[] {
    const set = this.presence.get(room) ?? new Set();
    set.add(user);
    this.presence.set(room, set);
    return [...set];
  }

  leave(room: string, user: string): string[] {
    const set = this.presence.get(room);
    if (!set) return [];
    set.delete(user);
    return [...set];
  }

  getPresence(room: string): string[] {
    return [...(this.presence.get(room) ?? [])];
  }

  setTyping(room: string, user: string, isTyping: boolean): string[] {
    const set = this.typing.get(room) ?? new Set();
    if (isTyping) set.add(user);
    else set.delete(user);
    this.typing.set(room, set);
    return [...set];
  }
}
