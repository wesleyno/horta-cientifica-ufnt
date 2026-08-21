import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, json, index, uniqueIndex } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 180 }).notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  cpf: varchar("cpf", { length: 14 }).notNull().unique(),
  birthDate: timestamp("birthDate").notNull(),
  passwordHash: text("passwordHash").notNull(),
  role: mysqlEnum("role", ["global_admin", "professor", "student"]).default("student").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn"),
});

export const sessions = mysqlTable("sessions", {
  id: varchar("id", { length: 96 }).primaryKey(),
  userId: int("userId").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => ({ userIdx: index("sessions_user_idx").on(table.userId) }));

export const workspaces = mysqlTable("workspaces", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 180 }).notNull(),
  slug: varchar("slug", { length: 180 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const workspaceMembers = mysqlTable("workspaceMembers", {
  id: int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull(),
  userId: int("userId").notNull(),
  membershipRole: mysqlEnum("membershipRole", ["owner", "professor", "student"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => ({ uniqueMember: uniqueIndex("workspace_member_unique").on(table.workspaceId, table.userId) }));

export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull(),
  studentId: int("studentId").notNull(),
  name: varchar("name", { length: 180 }).notNull(),
  description: text("description"),
  projectType: mysqlEnum("projectType", ["hydroponics", "garden"]).default("hydroponics").notNull(),
  startDate: timestamp("startDate").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({ workspaceIdx: index("projects_workspace_idx").on(table.workspaceId), studentIdx: index("projects_student_idx").on(table.studentId) }));

export const measurements = mysqlTable("measurements", {
  id: int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull(),
  projectId: int("projectId").notNull(),
  recordedBy: int("recordedBy").notNull(),
  recordedAt: timestamp("recordedAt").notNull(),
  waterLevel: decimal("waterLevel", { precision: 10, scale: 2 }),
  waterTemperature: decimal("waterTemperature", { precision: 10, scale: 2 }),
  ph: decimal("ph", { precision: 10, scale: 2 }),
  ec: decimal("ec", { precision: 10, scale: 2 }),
  tds: decimal("tds", { precision: 10, scale: 2 }),
  plantHeight: decimal("plantHeight", { precision: 10, scale: 2 }),
  leafCount: int("leafCount"),
  developmentNotes: text("developmentNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => ({ projectDateIdx: index("measurements_project_date_idx").on(table.projectId, table.recordedAt) }));

export const calendarEvents = mysqlTable("calendarEvents", {
  id: int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull(),
  projectId: int("projectId").notNull(),
  createdBy: int("createdBy").notNull(),
  eventType: mysqlEnum("eventType", ["planting", "nutrient_replenishment", "cleaning", "harvest", "other"]).notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  notes: text("notes"),
  eventDate: timestamp("eventDate").notNull(),
  reminderAt: timestamp("reminderAt"),
  completed: boolean("completed").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const projectPhotos = mysqlTable("projectPhotos", {
  id: int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull(),
  projectId: int("projectId").notNull(),
  uploadedBy: int("uploadedBy").notNull(),
  fileKey: varchar("fileKey", { length: 500 }).notNull(),
  fileUrl: varchar("fileUrl", { length: 1000 }).notNull(),
  caption: text("caption"),
  takenAt: timestamp("takenAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId"),
  actorId: int("actorId").notNull(),
  action: varchar("action", { length: 80 }).notNull(),
  entityType: varchar("entityType", { length: 80 }).notNull(),
  entityId: int("entityId"),
  previousValues: json("previousValues"),
  newValues: json("newValues"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => ({ auditTimeIdx: index("audit_logs_time_idx").on(table.createdAt) }));

export const notificationSubscriptions = mysqlTable("notificationSubscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  workspaceId: int("workspaceId"),
  type: varchar("type", { length: 80 }).notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  body: text("body").notNull(),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const invitations = mysqlTable("invitations", {
  id: int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull(),
  invitedBy: int("invitedBy").notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  role: mysqlEnum("role", ["professor", "student"]).notNull(),
  token: varchar("token", { length: 96 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  acceptedAt: timestamp("acceptedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Workspace = typeof workspaces.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Measurement = typeof measurements.$inferSelect;
