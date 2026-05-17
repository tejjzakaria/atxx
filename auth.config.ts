import type { NextAuthConfig } from "next-auth";

// Edge-compatible config — no DB imports, no Node.js-only modules.
// Used exclusively by middleware for lightweight session checks.
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/",
  },
  providers: [], // providers are registered in auth.ts (Node.js runtime only)
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const PUBLIC = ["/", "/register", "/api/auth"];
      const isPublic = PUBLIC.some(p => nextUrl.pathname.startsWith(p));
      if (isPublic) return true;
      if (!isLoggedIn) return false;
      return true;
    },
  },
};
