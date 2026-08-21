import { and, desc, eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { auditLogs, calendarEvents, measurements, projects, users, workspaceMembers, workspaces } from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
  return result[0];
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function listWorkspacesForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ workspace: workspaces, membership: workspaceMembers })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
    .where(eq(workspaceMembers.userId, userId));
}

export async function listProjectsForUser(user: { id: number; role: string }) {
  const db = await getDb();
  if (!db) return [];
  if (user.role === "global_admin") return db.select().from(projects).orderBy(desc(projects.createdAt));
  const memberships = await db.select({ workspaceId: workspaceMembers.workspaceId }).from(workspaceMembers).where(eq(workspaceMembers.userId, user.id));
  const workspaceIds = memberships.map(row => row.workspaceId);
  if (workspaceIds.length === 0) return [];
  if (user.role === "student") return db.select().from(projects).where(and(eq(projects.studentId, user.id), inArray(projects.workspaceId, workspaceIds))).orderBy(desc(projects.createdAt));
  return db.select().from(projects).where(inArray(projects.workspaceId, workspaceIds)).orderBy(desc(projects.createdAt));
}

export async function getProjectForUser(projectId: number, user: { id: number; role: string }) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await listProjectsForUser(user);
  return rows.find(project => project.id === projectId);
}

export async function recordAudit(input: {
  workspaceId?: number | null;
  actorId: number;
  action: string;
  entityType: string;
  entityId?: number | null;
  previousValues?: unknown;
  newValues?: unknown;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(auditLogs).values({
    workspaceId: input.workspaceId ?? null,
    actorId: input.actorId,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId ?? null,
    previousValues: input.previousValues as any,
    newValues: input.newValues as any,
  });
}

export async function listMeasurements(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(measurements).where(eq(measurements.projectId, projectId)).orderBy(desc(measurements.recordedAt));
}

export async function listCalendarEvents(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(calendarEvents).where(eq(calendarEvents.projectId, projectId)).orderBy(calendarEvents.eventDate);
}
