import { createApp } from "../server/_core/index.ts";

const appPromise = createApp().then(({ app }) => app);

export default async function handler(req: any, res: any) {
  const app = await appPromise;
  return app.handle(req, res);
}
