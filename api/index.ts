import type { Request, Response } from "express";
import { createApp } from "../server/_core/index";

const appPromise = createApp().then(({ app }) => app);

export default async function handler(req: Request, res: Response) {
  const app = await appPromise;
  return app.handle(req, res);
}

