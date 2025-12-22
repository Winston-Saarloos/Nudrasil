import NextAuth from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";

const handler = NextAuth({
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_CLIENT_ID!,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
      issuer: process.env.KEYCLOAK_ISSUER!,
      authorization: {
        params: {
          scope: "openid email profile",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      // Persist the OAuth access_token to the token right after signin
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.idToken = account.id_token;

        // Decode the access token to extract roles
        if (account.access_token) {
          try {
            // Decode JWT without verification (we trust Keycloak)
            const base64Url = account.access_token.split(".")[1];
            const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
            const jsonPayload = Buffer.from(base64, "base64").toString("utf-8");
            const decodedToken = JSON.parse(jsonPayload);

            // Extract roles from realm_access
            const roles = decodedToken.realm_access?.roles || [];
            token.roles = roles;
          } catch (error) {
            console.error("Error decoding access token:", error);
            token.roles = [];
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client
      session.accessToken = token.accessToken as string;
      session.roles = token.roles as string[];
      return session;
    },
  },
  session: {
    strategy: "jwt", // Use JWT strategy for better compatibility
  },
});

export { handler as GET, handler as POST };
