import express, { type Application, type Request, type Response } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Application) {
  const distPath = path.resolve(import.meta.dirname, "..", "..", "dist", "public");

  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));
  app.use("*", (_req: Request, res: Response) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}

