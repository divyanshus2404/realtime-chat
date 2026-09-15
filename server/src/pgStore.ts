import pg from "pg";
import type { ChatMessage } from "./types.js";

/**
 * Durable message history backed by PostgreSQL.
 *
 * Presence and typing stay in-memory here (they're ephemeral — a user is only
 * "online" while a socket is live). In a multi-instance deploy those move to
 * Redis; message history is the part that must survive a restart, so it lives
 * in Postgres. This class implements the same surface as ChatStore, so the
 * server code doesn't change — you pick the store at startup.
 */
export class PgStore {
  private pool: pg.Pool;
  private presence = new Map<string, Set<string>>();
  private typing = new Map<string, Set<string>>();
  private readonly limit: number;

  constructor(connectionString: string, historyLimit = 50) {
    this.pool = new pg.Pool({
      connectionString,
      ssl: connectionString.includes("localhost") ? undefined : { rejectUnauthorized: false },
    });
    this.limit = historyLimit;
  }

  async init(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id   UUID PRIMARY KEY,
        room TEXT NOT NULL,
        "user" TEXT NOT NULL,
        text TEXT NOT NULL,
        ts   BIGINT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_messages_room_ts ON messages(room, ts);
    `);
  }

  async addMessage(msg: ChatMessage): Promise<void> {
    await this.pool.query(
      `INSERT INTO messages (id, room, "user", text, ts) VALUES ($1,$2,$3,$4,$5)`,
      [msg.id, msg.room, msg.user, msg.text, msg.ts]
    );
  }

  async getHistory(room: string): Promise<ChatMessage[]> {
    const { rows } = await this.pool.query(
      `SELECT id, room, "user", text, ts FROM messages
       WHERE room = $1 ORDER BY ts DESC LIMIT $2`,
      [room, this.limit]
    );
    return rows.map((r) => ({ ...r, ts: Number(r.ts) })).reverse();
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
