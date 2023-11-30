// Applies next-auth to every page (private app)
export { default } from "next-auth/middleware";

// Applies next-auth only to matching routes (REGEX or Not)
// Ref: https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
export const config = { matcher: ["/dashboard"] };
