import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { getDb } from "./db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider !== "google" || !profile?.email) return false;

      const db = getDb();
      const now = new Date().toISOString();
      const googleId = profile.sub!;
      const email = profile.email;
      const name = profile.name || "";
      const image = (profile as { picture?: string }).picture || "";

      // Check admin status from env var
      const envAdmins = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase());
      // Check admin status from DB settings
      const dbRow = db.prepare("SELECT value FROM settings WHERE key = 'adminEmails'").get() as { value: string } | undefined;
      const dbAdmins = dbRow ? (dbRow.value || "").split(",").map((e: string) => e.trim().toLowerCase()).filter(Boolean) : [];
      const allAdmins = [...new Set([...envAdmins, ...dbAdmins])];
      const isAdmin = allAdmins.includes(email.toLowerCase()) ? 1 : 0;

      const existing = db.prepare("SELECT id FROM users WHERE googleId = ?").get(googleId) as { id: string } | undefined;

      if (existing) {
        db.prepare("UPDATE users SET email = ?, name = ?, image = ?, isAdmin = ?, updatedAt = ? WHERE id = ?")
          .run(email, name, image, isAdmin, now, existing.id);
      } else {
        const id = crypto.randomUUID();
        db.prepare("INSERT INTO users (id, googleId, email, name, image, isAdmin, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
          .run(id, googleId, email, name, image, isAdmin, now, now);
      }

      return true;
    },

    async jwt({ token, account, profile }) {
      if (account?.provider === "google" && profile?.sub) {
        const db = getDb();
        const user = db.prepare("SELECT id, isAdmin FROM users WHERE googleId = ?").get(profile.sub) as { id: string; isAdmin: number } | undefined;
        if (user) {
          token.userId = user.id;
          token.isAdmin = !!user.isAdmin;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (token.userId) {
        session.user.userId = token.userId as string;
        session.user.isAdmin = token.isAdmin as boolean;
      }
      return session;
    },
  },
});
