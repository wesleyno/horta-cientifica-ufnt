import {
  boolean,
  integer,
  index,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["global_admin", "professor", "student"]);
export const membershipRoleEnum = pgEnum("membership_role", ["owner", "professor", "student"]);
export const projectTypeEnum = pgEnum("project_type", ["hydroponics", "garden"]);
export const eventTypeEnum = pgEnum("event_type", ["planting", "nutrient_replenishment", "cleaning", "harvest", "other"]);
export const invitationRoleEnum = pgEnum("invitation_role", ["professor", "student"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 180 }).notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  cpf: varchar("cpf", { length: 14 }).notNull().unique(),
  birthDate: timestamp("birthDate", { mode: "date" }).notNull(),
  passwordHash: text("passwordHash").notNull(),
  role: userRoleEnum("role").default("student").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn", { mode: "date" }),
});

export const sessions = pgTable("sessions", {
  id: varchar("id", { length: 96 }).primaryKey(),
  userId: integer("userId").notNull(),
  expiresAt: timestamp("expiresAt", { mode: "date" }).notNull(),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
}, table => ({ userIdx: index("sessions_user_idx").on(table.userId) }));

export const workspaces = pgTable("workspaces", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 180 }).notNull(),
  slug: varchar("slug", { length: 180 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
});

export const workspaceMembers = pgTable("workspaceMembers", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspaceId").notNull(),
  userId: integer("userId").notNull(),
  membershipRole: membershipRoleEnum("membershipRole").notNull(),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
}, table => ({ uniqueMember: uniqueIndex("workspace_member_unique").on(table.workspaceId, table.userId) }));

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspaceId").notNull(),
  studentId: integer("studentId").notNull(),
  name: varchar("name", { length: 180 }).notNull(),
  description: text("description"),
  projectType: projectTypeEnum("projectType").default("hydroponics").notNull(),
  startDate: timestamp("startDate", { mode: "date" }).notNull(),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
}, table => ({ workspaceIdx: index("projects_workspace_idx").on(table.workspaceId), studentIdx: index("projects_student_idx").on(table.studentId) }));

export const measurements = pgTable("measurements", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspaceId").notNull(),
  projectId: integer("projectId").notNull(),
  recordedBy: integer("recordedBy").notNull(),
  recordedAt: timestamp("recordedAt", { mode: "date" }).notNull(),
  waterLevel: numeric("waterLevel", { precision: 10, scale: 2 }),
  waterTemperature: numeric("waterTemperature", { precision: 10, scale: 2 }),
  ph: numeric("ph", { precision: 10, scale: 2 }),
  ec: numeric("ec", { precision: 10, scale: 2 }),
  tds: numeric("tds", { precision: 10, scale: 2 }),
  plantHeight: numeric("plantHeight", { precision: 10, scale: 2 }),
  leafCount: integer("leafCount"),
  developmentNotes: text("developmentNotes"),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
}, table => ({ projectDateIdx: index("measurements_project_date_idx").on(table.projectId, table.recordedAt) }));

export const calendarEvents = pgTable("calendarEvents", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspaceId").notNull(),
  projectId: integer("projectId").notNull(),
  createdBy: integer("createdBy").notNull(),
  eventType: eventTypeEnum("eventType").notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  notes: text("notes"),
  eventDate: timestamp("eventDate", { mode: "date" }).notNull(),
  reminderAt: timestamp("reminderAt", { mode: "date" }),
  completed: boolean("completed").default(false).notNull(),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
});

export const projectPhotos = pgTable("projectPhotos", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspaceId").notNull(),
  projectId: integer("projectId").notNull(),
  uploadedBy: integer("uploadedBy").notNull(),
  fileKey: varchar("fileKey", { length: 500 }).notNull(),
  fileUrl: varchar("fileUrl", { length: 1000 }).notNull(),
  caption: text("caption"),
  takenAt: timestamp("takenAt", { mode: "date" }).notNull(),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
});

export const auditLogs = pgTable("auditLogs", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspaceId"),
  actorId: integer("actorId").notNull(),
  action: varchar("action", { length: 80 }).notNull(),
  entityType: varchar("entityType", { length: 80 }).notNull(),
  entityId: integer("entityId"),
  previousValues: jsonb("previousValues"),
  newValues: jsonb("newValues"),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
}, table => ({ auditTimeIdx: index("audit_logs_time_idx").on(table.createdAt) }));

export const notificationSubscriptions = pgTable("notificationSubscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  workspaceId: integer("workspaceId"),
  type: varchar("type", { length: 80 }).notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  body: text("body").notNull(),
  readAt: timestamp("readAt", { mode: "date" }),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
});

export const invitations = pgTable("invitations", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspaceId").notNull(),
  invitedBy: integer("invitedBy").notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  role: invitationRoleEnum("role").notNull(),
  token: varchar("token", { length: 96 }).notNull().unique(),
  expiresAt: timestamp("expiresAt", { mode: "date" }).notNull(),
  acceptedAt: timestamp("acceptedAt", { mode: "date" }),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Workspace = typeof workspaces.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Measurement = typeof measurements.$inferSelect;
