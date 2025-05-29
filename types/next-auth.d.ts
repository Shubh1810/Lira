import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { JWT as NextAuthJWT } from "next-auth/jwt";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user?: {
      id?: string | null;
      displayName?: string | null;
      profileThemeId?: string | null;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    displayName?: string | null;
    profileThemeId?: string | null;
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT extends NextAuthJWT {
    id?: string;
    displayName?: string | null;
    profileThemeId?: string | null;
  }
}