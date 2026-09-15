import { describe, it, expect } from "vitest";
import { ChatStore } from "./store.js";

describe("ChatStore", () => {
  it("tracks presence per room and dedupes users", () => {
    const s = new ChatStore();
    expect(s.join("general", "alice")).toEqual(["alice"]);
    expect(s.join("general", "bob")).toEqual(["alice", "bob"]);
    expect(s.join("general", "alice")).toEqual(["alice", "bob"]); // no dup
    expect(s.leave("general", "alice")).toEqual(["bob"]);
  });

  it("bounds history to maxHistory", () => {
    const s = new ChatStore(3);
    for (let i = 0; i < 5; i++) {
      s.addMessage({ id: String(i), room: "r", user: "u", text: `m${i}`, ts: i });
    }
    const h = s.getHistory("r");
    expect(h).toHaveLength(3);
    expect(h.map((m) => m.text)).toEqual(["m2", "m3", "m4"]); // oldest dropped
  });

  it("toggles typing state", () => {
    const s = new ChatStore();
    expect(s.setTyping("r", "alice", true)).toEqual(["alice"]);
    expect(s.setTyping("r", "bob", true)).toEqual(["alice", "bob"]);
    expect(s.setTyping("r", "alice", false)).toEqual(["bob"]);
  });
});
