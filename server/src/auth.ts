import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET ?? "dev-secret-change-me";

/**
 * Minimal auth: a user "logs in" with just a username and gets a signed JWT.
 * In a real app this would verify a password / OAuth. The point here is to
 * show the WebSocket handshake being authenticated via a token, not to build
 * a full identity provider.
 */
export function issueToken(user: string): string {
  return jwt.sign({ user }, SECRET, { expiresIn: "24h" });
}

export function verifyToken(token: string): string | null {
  try {
    const decoded = jwt.verify(token, SECRET) as { user: string };
    return decoded.user;
  } catch {
    return null;
  }
}
