import { TRPCError } from "@trpc/server";
import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { createLocalSession, deleteSession, hashPassword, verifyPassword } from "./auth";
import { getDb, getProjectForUser, listCalendarEvents, listMeasurements, listProjectsForUser, listWorkspacesForUser, recordAudit } from "./db";
import { auditLogs, calendarEvents, measurements, projects, users, workspaceMembers, workspaces } from "../drizzle/schema";
import { randomBytes } from "node:crypto";
import { storagePut } from "./storage";
import { projectPhotos, notificationSubscriptions } from "../drizzle/schema";

const profileSchema = z.object({ name: z.string().min(2), email: z.string().email(), cpf: z.string().min(11), birthDate: z.coerce.date(), password: z.string().min(8) });
const measurementSchema = z.object({ projectId: z.number().int(), recordedAt: z.coerce.date(), waterLevel: z.number().optional(), waterTemperature: z.number().optional(), ph: z.number().optional(), ec: z.number().optional(), tds: z.number().optional(), plantHeight: z.number().optional(), leafCount: z.number().int().nonnegative().optional(), developmentNotes: z.string().max(2000).optional() });

function normalizeEmail(email: string) { return email.trim().toLowerCase(); }
function sessionCookie(ctx: any, value: string, expires: Date) { ctx.res.cookie(COOKIE_NAME, value, { ...getSessionCookieOptions(ctx.req), expires, maxAge: 1000 * 60 * 60 * 24 * 30 }); }
function requireRole(user: any, roles: string[]) { if (!roles.includes(user.role)) throw new TRPCError({ code: "FORBIDDEN", message: "Você não tem permissão para esta ação." }); }

export const appRouter = router({
  system: router({ health: publicProcedure.query(() => ({ ok: true })) }),
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    register: publicProcedure.input(profileSchema).mutation(async ({ input, ctx }) => {
      const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco indisponível." });
      const existing = await db.select({ id: users.id }).from(users).limit(1);
      const email = normalizeEmail(input.email);
      const duplicate = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
      if (duplicate.length) throw new TRPCError({ code: "CONFLICT", message: "Este e-mail já está cadastrado." });
      const [created] = await db.insert(users).values({ openId: `local_${randomBytes(16).toString("hex")}`, name: input.name, email, cpf: input.cpf, birthDate: input.birthDate, passwordHash: await hashPassword(input.password), role: existing.length ? "student" : "global_admin" }).returning();
      const session = await createLocalSession(created.id); sessionCookie(ctx, session.id, session.expiresAt);
      return { success: true };
    }),
    login: publicProcedure.input(z.object({ email: z.string().email(), password: z.string().min(1) })).mutation(async ({ input, ctx }) => {
      const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco indisponível." });
      const rows = await db.select().from(users).where(eq(users.email, normalizeEmail(input.email))).limit(1); const user = rows[0];
      if (!user || !user.isActive || !(await verifyPassword(input.password, user.passwordHash))) throw new TRPCError({ code: "UNAUTHORIZED", message: "E-mail ou senha inválidos." });
      await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, user.id));
      const session = await createLocalSession(user.id); sessionCookie(ctx, session.id, session.expiresAt); return { success: true };
    }),
    logout: publicProcedure.mutation(async ({ ctx }) => { const cookie = ctx.req.headers.cookie?.split(";").map(v => v.trim()).find(v => v.startsWith(`${COOKIE_NAME}=`))?.split("=")[1]; await deleteSession(cookie); ctx.res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 }); return { success: true } as const; }),
  }),
  workspaces: router({
    mine: protectedProcedure.query(({ ctx }) => listWorkspacesForUser(ctx.user.id, ctx.user.role === "global_admin")),
    create: adminProcedure.input(z.object({ name: z.string().min(2), slug: z.string().min(2).regex(/^[a-z0-9-]+$/), description: z.string().optional() })).mutation(async ({ input, ctx }) => { const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" }); const [workspace] = await db.insert(workspaces).values(input).returning(); await db.insert(workspaceMembers).values({ workspaceId: workspace.id, userId: ctx.user.id, membershipRole: "owner" }); await recordAudit({ actorId: ctx.user.id, action: "create", entityType: "workspace", entityId: workspace.id, newValues: input }); return workspace; }),
    members: protectedProcedure.input(z.object({ workspaceId: z.number().int() })).query(async ({ input, ctx }) => { requireRole(ctx.user, ["global_admin", "professor"]); const db = await getDb(); if (!db) return []; if (ctx.user.role !== "global_admin") { const own = await db.select().from(workspaceMembers).where(and(eq(workspaceMembers.workspaceId, input.workspaceId), eq(workspaceMembers.userId, ctx.user.id))).limit(1); if (!own.length) throw new TRPCError({ code: "FORBIDDEN" }); } return db.select({ user: users, membership: workspaceMembers }).from(workspaceMembers).innerJoin(users, eq(users.id, workspaceMembers.userId)).where(eq(workspaceMembers.workspaceId, input.workspaceId)); }),
    addMember: protectedProcedure.input(z.object({ workspaceId: z.number().int(), name: z.string().min(2), email: z.string().email(), cpf: z.string().min(11), birthDate: z.coerce.date(), password: z.string().min(8), role: z.enum(["professor", "student"]) })).mutation(async ({ input, ctx }) => { requireRole(ctx.user, ["global_admin", "professor"]); const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" }); if (ctx.user.role === "professor") { const own = await db.select().from(workspaceMembers).where(and(eq(workspaceMembers.workspaceId, input.workspaceId), eq(workspaceMembers.userId, ctx.user.id))).limit(1); if (!own.length) throw new TRPCError({ code: "FORBIDDEN" }); } const [created] = await db.insert(users).values({ openId: `local_${randomBytes(16).toString("hex")}`, name: input.name, email: normalizeEmail(input.email), cpf: input.cpf, birthDate: input.birthDate, passwordHash: await hashPassword(input.password), role: input.role }).returning(); await db.insert(workspaceMembers).values({ workspaceId: input.workspaceId, userId: created.id, membershipRole: input.role }); await recordAudit({ workspaceId: input.workspaceId, actorId: ctx.user.id, action: "create", entityType: "workspace_member", entityId: created.id, newValues: { ...input, password: undefined } }); return { id: created.id }; }),
  }),
  projects: router({
    list: protectedProcedure.query(({ ctx }) => listProjectsForUser(ctx.user)),
    create: protectedProcedure.input(z.object({ workspaceId: z.number().int(), name: z.string().min(2), description: z.string().optional(), projectType: z.enum(["hydroponics", "garden"]), startDate: z.coerce.date() })).mutation(async ({ input, ctx }) => { requireRole(ctx.user, ["student"]); const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" }); const membership = await db.select().from(workspaceMembers).where(and(eq(workspaceMembers.workspaceId, input.workspaceId), eq(workspaceMembers.userId, ctx.user.id))).limit(1); if (!membership.length) throw new TRPCError({ code: "FORBIDDEN" }); const [project] = await db.insert(projects).values({ ...input, studentId: ctx.user.id }).returning(); await recordAudit({ workspaceId: input.workspaceId, actorId: ctx.user.id, action: "create", entityType: "project", entityId: project.id, newValues: input }); return project; }),
    get: protectedProcedure.input(z.object({ id: z.number().int() })).query(async ({ input, ctx }) => { const project = await getProjectForUser(input.id, ctx.user); if (!project) throw new TRPCError({ code: "NOT_FOUND" }); return project; }),
  }),
  measurements: router({
    list: protectedProcedure.input(z.object({ projectId: z.number().int() })).query(async ({ input, ctx }) => { const project = await getProjectForUser(input.projectId, ctx.user); if (!project) throw new TRPCError({ code: "NOT_FOUND" }); return listMeasurements(input.projectId); }),
    create: protectedProcedure.input(measurementSchema).mutation(async ({ input, ctx }) => { const project = await getProjectForUser(input.projectId, ctx.user); if (!project) throw new TRPCError({ code: "NOT_FOUND" }); const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" }); const decimalFields = ["waterLevel", "waterTemperature", "ph", "ec", "tds", "plantHeight"] as const; const measurementValues = { ...input, workspaceId: project.workspaceId, recordedBy: ctx.user.id } as any; for (const field of decimalFields) { if (typeof measurementValues[field] === "number") measurementValues[field] = measurementValues[field].toFixed(2); } const [created] = await db.insert(measurements).values(measurementValues).returning(); await recordAudit({ workspaceId: project.workspaceId, actorId: ctx.user.id, action: "create", entityType: "measurement", entityId: created.id, newValues: input }); return created; }),
  }),
  calendar: router({ list: protectedProcedure.input(z.object({ projectId: z.number().int() })).query(async ({ input, ctx }) => { const project = await getProjectForUser(input.projectId, ctx.user); if (!project) throw new TRPCError({ code: "NOT_FOUND" }); return listCalendarEvents(input.projectId); }), create: protectedProcedure.input(z.object({ projectId: z.number().int(), eventType: z.enum(["planting", "nutrient_replenishment", "cleaning", "harvest", "other"]), title: z.string().min(2), notes: z.string().optional(), eventDate: z.coerce.date(), reminderAt: z.coerce.date().optional() })).mutation(async ({ input, ctx }) => { const project = await getProjectForUser(input.projectId, ctx.user); if (!project) throw new TRPCError({ code: "NOT_FOUND" }); const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" }); const [event] = await db.insert(calendarEvents).values({ ...input, workspaceId: project.workspaceId, createdBy: ctx.user.id }).returning(); await recordAudit({ workspaceId: project.workspaceId, actorId: ctx.user.id, action: "create", entityType: "calendar_event", entityId: event.id, newValues: input }); return event; }) }),
  photos: router({
    list: protectedProcedure.input(z.object({ projectId: z.number().int() })).query(async ({ input, ctx }) => { const project = await getProjectForUser(input.projectId, ctx.user); if (!project) throw new TRPCError({ code: "NOT_FOUND" }); const db = await getDb(); if (!db) return []; return db.select().from(projectPhotos).where(eq(projectPhotos.projectId, input.projectId)).orderBy(desc(projectPhotos.takenAt)); }),
    upload: protectedProcedure.input(z.object({ projectId: z.number().int(), filename: z.string().min(1), mimeType: z.string().startsWith("image/"), base64: z.string().min(10), caption: z.string().max(500).optional(), takenAt: z.coerce.date() })).mutation(async ({ input, ctx }) => { const project = await getProjectForUser(input.projectId, ctx.user); if (!project) throw new TRPCError({ code: "NOT_FOUND" }); const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" }); const buffer = Buffer.from(input.base64.replace(/^data:[^;]+;base64,/, ""), "base64"); const stored = await storagePut("workspaces/" + project.workspaceId + "/projects/" + project.id + "/" + Date.now() + "-" + input.filename.replace(/[^a-zA-Z0-9._-]/g, "_"), buffer, input.mimeType); const [photo] = await db.insert(projectPhotos).values({ workspaceId: project.workspaceId, projectId: project.id, uploadedBy: ctx.user.id, fileKey: stored.key, fileUrl: stored.url, caption: input.caption, takenAt: input.takenAt }).returning(); await recordAudit({ workspaceId: project.workspaceId, actorId: ctx.user.id, action: "create", entityType: "project_photo", entityId: photo.id, newValues: { caption: input.caption, takenAt: input.takenAt } }); return photo; })
  }),
  notifications: router({
    subscribePush: protectedProcedure.input(z.object({ endpoint: z.string(), p256dh: z.string(), auth: z.string() })).mutation(async ({ input, ctx }) => { const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" }); await db.insert(notificationSubscriptions).values({ userId: ctx.user.id, ...input }); return { success: true }; })
  }),
  audit: router({ mine: protectedProcedure.query(async ({ ctx }) => { const db = await getDb(); if (!db) return []; if (ctx.user.role === "global_admin") return db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(200); return db.select().from(auditLogs).where(eq(auditLogs.actorId, ctx.user.id)).orderBy(desc(auditLogs.createdAt)).limit(200); }) }),
});

export type AppRouter = typeof appRouter;
