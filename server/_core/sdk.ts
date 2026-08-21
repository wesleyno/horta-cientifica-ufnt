import type { Request } from "express";
import type { User } from "../../drizzle/schema";
import { getUserBySession } from "../auth";
import { parse } from "cookie";
import { COOKIE_NAME } from "@shared/const";

export type AuthenticatedUser = User;

class LocalAuthSDK {
  async authenticateRequest(req: Request): Promise<User> {
    const cookies = parse(req.headers.cookie ?? "");
    const user = await getUserBySession(cookies[COOKIE_NAME]);
    if (!user) throw new Error("Invalid local session");
    return user;
  }
}

export const sdk = new LocalAuthSDK();
