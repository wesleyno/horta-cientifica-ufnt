// The server bundle is produced by `pnpm build` before Vercel bundles this function.
// @ts-nocheck
import { createApp } from "../dist/index.js";

const appPromise = createApp().then(({ app }) => app);

export default async function handler(req, res) {
  const app = await appPromise;
  return app.handle(req, res);
}

