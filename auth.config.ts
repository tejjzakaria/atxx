import type { NextAuthConfig } from "next-auth";
import type { Role } from "@/lib/auth/role";

// Edge-compatible config — no DB imports, no Node.js-only modules.
// Used exclusively by middleware for lightweight session checks.
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/",
  },
  providers: [], // providers are registered in auth.ts (Node.js runtime only)
  callbacks: {
    // middleware runs a separate NextAuth instance from auth.ts, so it needs its own
    // session callback to expose role on auth.user — otherwise it'd be undefined here.
    session({ session, token }) {
      if (token?.id)   session.user.id   = token.id as string;
      if (token?.role) session.user.role = token.role as Role;
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const PUBLIC = ["/", "/register", "/api/auth"];
      const isPublic = PUBLIC.some(p => nextUrl.pathname.startsWith(p));
      if (isPublic) return true;
      if (!isLoggedIn) return false;
      // Role gating for /admin/* is enforced in app/admin/layout.tsx (notFound() for
      // non-admins) — same pattern as every per-store route today. Tried a custom
      // redirect here too, but this next-auth beta doesn't honor a Response return from
      // authorized(), so it's left out rather than kept as silently-dead code.
      return true;
    },
  },
};
