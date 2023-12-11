import { options } from "@/app/api/auth/[...nextauth]/options";
import { TRPCError, initTRPC } from "@trpc/server";
import { getServerSession } from "next-auth";
import superjson from 'superjson';

/**
 * Initialization of tRPC backend
 * Should be done only once per backend!
 */
const t = initTRPC.create({
  transformer: superjson,
});
const middleware = t.middleware;

const isAuth = middleware(async (opts) => {
  const session = await getServerSession(options);
  const user = session?.user;

  if (!session || !user || !user.id) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return opts.next({
    ctx: {
      userId: user.id,
      user,
    },
  });
});

/**
 * Export reusable router and procedure helpers
 * that can be used throughout the router
 */
export const router = t.router;
export const publicProcedure = t.procedure;
// Middleware Needing
export const privateProcedure = t.procedure.use(isAuth);
