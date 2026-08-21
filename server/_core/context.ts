import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { parse } from "cookie";
import { COOKIE_NAME } from "@shared/const";
import { getUserBySession } from "../auth";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(opts: CreateExpressContextOptions): Promise<TrpcContext> {
  const cookies = parse(opts.req.headers.cookie ?? "");
  const user = await getUserBySession(cookies[COOKIE_NAME]);
  return { req: opts.req, res: opts.res, user };
}
