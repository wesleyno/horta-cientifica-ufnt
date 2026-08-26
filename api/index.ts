// The server bundle is produced by `pnpm build` before Vercel bundles this function.
// @ts-nocheck
import { appPromise } from "../dist/serverless.js";

export default async function handler(req, res) {
  const app = await appPromise;
  return app.handle(req, res);
}

