import jwt, { type SignOptions } from "jsonwebtoken";
import crypto from "node:crypto";

const ACCESS_SECRET = () => requireEnv("JWT_ACCESS_SECRET");
const REFRESH_SECRET = () => requireEnv("JWT_REFRESH_SECRET");

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env: ${name}`);
  return v;
}

export type AccessPayload = { sub: string; role: "customer" | "operator" };

export function signAccessToken(payload: AccessPayload, expiresSeconds = 900) {
  const options: SignOptions = { expiresIn: expiresSeconds, issuer: "towit" };
  return jwt.sign(payload, ACCESS_SECRET(), options);
}

export function verifyAccessToken(token: string): AccessPayload {
  const decoded = jwt.verify(token, ACCESS_SECRET(), { issuer: "towit" });
  if (typeof decoded === "string" || !decoded || typeof decoded !== "object")
    throw new Error("Invalid token");
  const sub = (decoded as jwt.JwtPayload).sub;
  const role = (decoded as jwt.JwtPayload).role;
  if (!sub || (role !== "customer" && role !== "operator"))
    throw new Error("Invalid token payload");
  return { sub, role };
}

export function signRefreshToken() {
  return crypto.randomBytes(48).toString("base64url");
}

export function hashRefreshToken(raw: string) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}
