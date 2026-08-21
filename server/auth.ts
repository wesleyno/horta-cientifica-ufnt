import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { and, eq, gt } from "drizzle-orm";
import { getDb } from "./db";
import { sessions, users, workspaceMembers } from "../drizzle/schema";

const scrypt = promisify(scryptCallback);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, encoded: string) {
  const [salt, expectedHex] = encoded.split(":");
  if (!salt || !expectedHex) return false;
  const expected = Buffer.from(expectedHex, "hex");
  const actual = (await scrypt(password, salt, 64)) as Buffer;
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export async function createLocalSession(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const id = randomBytes(48).toString("base64url");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
  await db.insert(sessions).values({ id, userId, expiresAt });
  return { id, expiresAt };
}

export async function getUserBySession(sessionId?: string) {
  if (!sessionId) return null;
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select({ user: users })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.id, sessionId), gt(sessions.expiresAt, new Date()), eq(users.isActive, true)))
    .limit(1);
  return rows[0]?.user ?? null;
}

export async function deleteSession(sessionId?: string) {
  if (!sessionId) return;
  const db = await getDb();
  if (!db) return;
  await db.delete(sessions).where(eq(sessions.id, sessionId));
}

export async function userHasWorkspace(userId: number, workspaceId: number) {
  const db = await getDb();
  if (!db) return false;
  const rows = await db.select({ id: workspaceMembers.id }).from(workspaceMembers)
    .where(and(eq(workspaceMembers.userId, userId), eq(workspaceMembers.workspaceId, workspaceId))).limit(1);
  return rows.length > 0;
}
