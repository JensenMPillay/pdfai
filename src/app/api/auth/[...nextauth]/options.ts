import type { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { randomBytes, randomUUID } from "crypto";
import { db } from "@/db";
// import { PrismaAdapter } from "@next-auth/prisma-adapter";
const bcrypt = require("bcrypt");

export const options: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  // adapter: PrismaAdapter(db),
  session: {
    // Choose how you want to save the user session.
    // The default is `"jwt"`, an encrypted JWT (JWE) stored in the session cookie.
    // If you use an `adapter` however, we default it to `"database"` instead.
    // You can still force a JWT session by explicitly defining `"jwt"`.
    // When using `"database"`, the session cookie will only contain a `sessionToken` value,
    // which is used to look up the session in the database.
    // strategy: "database",
    strategy: "jwt",

    // Seconds - How long until an idle session expires and is no longer valid.
    maxAge: 30 * 24 * 60 * 60, // 30 days

    // Seconds - Throttle how frequently to write to database to extend a session.
    // Use it to limit write operations. Set to 0 to always update the database.
    // Note: This option is ignored if using JSON Web Tokens
    updateAge: 24 * 60 * 60, // 24 hours

    // The session token is usually either a random UUID or string, however if you
    // need a more customized session token string, you can define your own generate function.
    generateSessionToken: () => {
      return randomUUID?.() ?? randomBytes(32).toString("hex");
    },
  },
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID as string,
      clientSecret: process.env.GITHUB_SECRET as string,
    }),
    CredentialsProvider({
      // The name to display on the sign in form (e.g. 'Sign in with...')
      name: "Credentials",
      // The credentials is used to generate a suitable form on the sign in page.
      // You can specify whatever fields you are expecting to be submitted.
      // e.g. domain, username, password, 2FA token, etc.
      // You can pass any HTML attribute to the <input> tag through the object.
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "example@example.com",
        },
        password: { label: "Password", type: "password" },
      },
      //   async authorize(credentials, req) {
      //     // You need to provide your own logic here that takes the credentials
      //     // submitted and returns either a object representing a user or value
      //     // that is false/null if the credentials are invalid.
      //     // e.g. return { id: 1, name: 'J Smith', email: 'jsmith@example.com' }
      //     // You can also use the `req` object to obtain additional parameters
      //     // (i.e., the request IP address)
      //     const res = await fetch("/your/endpoint", {
      //       method: "POST",
      //       body: JSON.stringify(credentials),
      //       headers: { "Content-Type": "application/json" },
      //     });
      //     const user = await res.json();

      //     // If no error and we have user data, return it
      //     if (res.ok && user) {
      //       return user;
      //     }
      //     // Return null if user data could not be retrieved
      //     return null;
      //   },
      async authorize(credentials, req) {
        const dbUser = await db.user.findUnique({
          where: {
            email: credentials?.email,
          },
        });

        return dbUser &&
          (await bcrypt.compare(credentials?.password, dbUser?.password))
          ? dbUser
          : null;
      },
    }),
  ],
  callbacks: {
    async session({ session, token, user }) {
      // Send properties to the client, like an access_token and user id from a provider.
      // session.accessToken = token.accessToken
      return {
        ...session,
        user: {
          ...session.user,
          id: token.sub,
        },
      };
    },
  },
  theme: {
    colorScheme: "dark", // "auto" | "dark" | "light"
    brandColor: "", // Hex color code
    logo: "", // Absolute URL to image
    buttonText: "", // Hex color code
  },
  // pages: {
  //     signIn: "/signIn"
  // }
  // session: {    }
};
