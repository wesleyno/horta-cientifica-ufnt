import type { Express } from "express";

/**
 * OAuth is intentionally disabled for this project. Authentication is handled
 * by the local email-and-password procedures in server/routers.ts.
 */
export function registerOAuthRoutes(_app: Express) {
  // Kept as a no-op compatibility hook for the template bootstrap.
}
