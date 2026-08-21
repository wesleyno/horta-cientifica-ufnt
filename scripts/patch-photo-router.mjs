import fs from "node:fs";
const path = "/home/ubuntu/horta-cientifica-ufnt/server/routers.ts";
let source = fs.readFileSync(path, "utf8");
source = source.replace('import { randomBytes } from "node:crypto";', 'import { randomBytes } from "node:crypto";\nimport { storagePut } from "./storage";\nimport { projectPhotos, notificationSubscriptions } from "../drizzle/schema";');
const marker = '  audit: router({';
const insert = `  photos: router({
    list: protectedProcedure.input(z.object({ projectId: z.number().int() })).query(async ({ input, ctx }) => { const project = await getProjectForUser(input.projectId, ctx.user); if (!project) throw new TRPCError({ code: "NOT_FOUND" }); const db = await getDb(); if (!db) return []; return db.select().from(projectPhotos).where(eq(projectPhotos.projectId, input.projectId)).orderBy(desc(projectPhotos.takenAt)); }),
    upload: protectedProcedure.input(z.object({ projectId: z.number().int(), filename: z.string().min(1), mimeType: z.string().startsWith("image/"), base64: z.string().min(10), caption: z.string().max(500).optional(), takenAt: z.coerce.date() })).mutation(async ({ input, ctx }) => { const project = await getProjectForUser(input.projectId, ctx.user); if (!project) throw new TRPCError({ code: "NOT_FOUND" }); const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" }); const buffer = Buffer.from(input.base64.replace(/^data:[^;]+;base64,/, ""), "base64"); const stored = await storagePut([backtick]workspaces/[backtick] + project.workspaceId + [backtick]/projects/[backtick] + project.id + [backtick]/[backtick] + Date.now() + [backtick]-[backtick] + input.filename.replace(/[^a-zA-Z0-9._-]/g, "_"), buffer, input.mimeType); const [photo] = await db.insert(projectPhotos).values({ workspaceId: project.workspaceId, projectId: project.id, uploadedBy: ctx.user.id, fileKey: stored.key, fileUrl: stored.url, caption: input.caption, takenAt: input.takenAt }).$returningId(); await recordAudit({ workspaceId: project.workspaceId, actorId: ctx.user.id, action: "create", entityType: "project_photo", entityId: photo.id, newValues: { caption: input.caption, takenAt: input.takenAt } }); return photo; })
  }),
  notifications: router({
    subscribePush: protectedProcedure.input(z.object({ endpoint: z.string(), p256dh: z.string(), auth: z.string() })).mutation(async ({ input, ctx }) => { const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" }); await db.insert(notificationSubscriptions).values({ userId: ctx.user.id, ...input }); return { success: true }; })
  }),
`;
source = source.replace(marker, insert + marker);
fs.writeFileSync(path, source);
