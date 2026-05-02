import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { verifyLocalJwt, type LocalUser } from "../lib/localAuth";
import { COOKIE_NAME } from "../../shared/const";
import cookie from "cookie";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  /**
   * Authenticated local user, or null for unauthenticated requests.
   * protectedProcedure will throw UNAUTHORIZED if this is null.
   */
  user: LocalUser | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: LocalUser | null = null;

  try {
    const rawCookies = opts.req.headers.cookie ?? "";
    const cookies = cookie.parse(rawCookies);
    const token = cookies[COOKIE_NAME];
    if (token) {
      user = await verifyLocalJwt(token);
    }
  } catch {
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
