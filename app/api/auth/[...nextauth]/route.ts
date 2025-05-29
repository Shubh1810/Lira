import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { SupabaseAdapter } from "@auth/supabase-adapter";

// Validate required environment variables for build time
if (!process.env.GOOGLE_CLIENT_ID) {
  throw new Error("Missing GOOGLE_CLIENT_ID environment variable");
}
if (!process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error("Missing GOOGLE_CLIENT_SECRET environment variable");
}
if (!process.env.NEXTAUTH_SECRET) {
  throw new Error("Missing NEXTAUTH_SECRET environment variable");
}
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable");
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable");
}

// Note: SupabaseAdapter creates its own client internally

const handler = NextAuth({
  // Configure Supabase adapter for database sessions
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY,
  }),
  
  // Use database sessions instead of JWT
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
  ],
  
  secret: process.env.NEXTAUTH_SECRET,
  
  callbacks: {
    async session({ session, user }) {
      // Add user id to session
      if (session?.user && user) {
        session.user.id = user.id;
      }
      return session;
    },
    
    async jwt({ token, user, account }) {
      // This callback is called whenever a JWT is created, updated, or accessed
      if (user) {
        token.id = user.id;
      }
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    
    async signIn() {
      // Allow sign in
      return true;
    },
    
    async redirect({ baseUrl }) {
      // Always redirect to home page after sign in
      return baseUrl;
    },
  },
  
  pages: {
    error: '/account', // Redirect errors to account page
    signIn: '/account', // Redirect sign in to account page
  },
  
  events: {
    async signIn({ user, isNewUser }) {
      console.log(`User ${user.email} signed in${isNewUser ? ' (new user)' : ''}`);
    },
    async signOut() {
      console.log(`User signed out`);
    },
    async createUser({ user }) {
      console.log(`New user created: ${user.email}`);
    },
  },
  
  debug: process.env.NODE_ENV === 'development', // Enable debug logs in development
});

export { handler as GET, handler as POST }; 