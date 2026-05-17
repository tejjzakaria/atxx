import NextAuth from "next-auth";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import client, { getDb } from "@/lib/mongodb";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: MongoDBAdapter(client),
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email:    { label: "Email",    type: "email"    },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const db   = getDb();
        const user = await db.collection("User").findOne({ email: credentials.email });

        if (!user || !user.password) return null;

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.password as string,
        );
        if (!valid) return null;

        return {
          id:    user._id.toString(),
          name:  user.name  ?? null,
          email: user.email as string,
          role:  user.role  ?? "owner",
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id   = user.id;
        token.role = user.role ?? "owner";
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id   = token.id as string;
      session.user.role = token.role as string;
      return session;
    },
  },
});
