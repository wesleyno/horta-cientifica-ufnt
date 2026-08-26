CREATE TYPE "public"."event_type" AS ENUM('planting', 'nutrient_replenishment', 'cleaning', 'harvest', 'other');--> statement-breakpoint
CREATE TYPE "public"."invitation_role" AS ENUM('professor', 'student');--> statement-breakpoint
CREATE TYPE "public"."membership_role" AS ENUM('owner', 'professor', 'student');--> statement-breakpoint
CREATE TYPE "public"."project_type" AS ENUM('hydroponics', 'garden');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('global_admin', 'professor', 'student');--> statement-breakpoint
CREATE TABLE "auditLogs" (
	"id" serial PRIMARY KEY NOT NULL,
	"workspaceId" integer,
	"actorId" integer NOT NULL,
	"action" varchar(80) NOT NULL,
	"entityType" varchar(80) NOT NULL,
	"entityId" integer,
	"previousValues" jsonb,
	"newValues" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calendarEvents" (
	"id" serial PRIMARY KEY NOT NULL,
	"workspaceId" integer NOT NULL,
	"projectId" integer NOT NULL,
	"createdBy" integer NOT NULL,
	"eventType" "event_type" NOT NULL,
	"title" varchar(180) NOT NULL,
	"notes" text,
	"eventDate" timestamp NOT NULL,
	"reminderAt" timestamp,
	"completed" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitations" (
	"id" serial PRIMARY KEY NOT NULL,
	"workspaceId" integer NOT NULL,
	"invitedBy" integer NOT NULL,
	"email" varchar(320) NOT NULL,
	"role" "invitation_role" NOT NULL,
	"token" varchar(96) NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"acceptedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "measurements" (
	"id" serial PRIMARY KEY NOT NULL,
	"workspaceId" integer NOT NULL,
	"projectId" integer NOT NULL,
	"recordedBy" integer NOT NULL,
	"recordedAt" timestamp NOT NULL,
	"waterLevel" numeric(10, 2),
	"waterTemperature" numeric(10, 2),
	"ph" numeric(10, 2),
	"ec" numeric(10, 2),
	"tds" numeric(10, 2),
	"plantHeight" numeric(10, 2),
	"leafCount" integer,
	"developmentNotes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notificationSubscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"workspaceId" integer,
	"type" varchar(80) NOT NULL,
	"title" varchar(180) NOT NULL,
	"body" text NOT NULL,
	"readAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projectPhotos" (
	"id" serial PRIMARY KEY NOT NULL,
	"workspaceId" integer NOT NULL,
	"projectId" integer NOT NULL,
	"uploadedBy" integer NOT NULL,
	"fileKey" varchar(500) NOT NULL,
	"fileUrl" varchar(1000) NOT NULL,
	"caption" text,
	"takenAt" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"workspaceId" integer NOT NULL,
	"studentId" integer NOT NULL,
	"name" varchar(180) NOT NULL,
	"description" text,
	"projectType" "project_type" DEFAULT 'hydroponics' NOT NULL,
	"startDate" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" varchar(96) PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" varchar(180) NOT NULL,
	"email" varchar(320) NOT NULL,
	"cpf" varchar(14) NOT NULL,
	"birthDate" timestamp NOT NULL,
	"passwordHash" text NOT NULL,
	"role" "user_role" DEFAULT 'student' NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp,
	CONSTRAINT "users_openId_unique" UNIQUE("openId"),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_cpf_unique" UNIQUE("cpf")
);
--> statement-breakpoint
CREATE TABLE "workspaceMembers" (
	"id" serial PRIMARY KEY NOT NULL,
	"workspaceId" integer NOT NULL,
	"userId" integer NOT NULL,
	"membershipRole" "membership_role" NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(180) NOT NULL,
	"slug" varchar(180) NOT NULL,
	"description" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "workspaces_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE INDEX "audit_logs_time_idx" ON "auditLogs" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "measurements_project_date_idx" ON "measurements" USING btree ("projectId","recordedAt");--> statement-breakpoint
CREATE INDEX "projects_workspace_idx" ON "projects" USING btree ("workspaceId");--> statement-breakpoint
CREATE INDEX "projects_student_idx" ON "projects" USING btree ("studentId");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_member_unique" ON "workspaceMembers" USING btree ("workspaceId","userId");