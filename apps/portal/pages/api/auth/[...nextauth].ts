import NextAuth from "next-auth";
import AzureADB2CProvider from "next-auth/providers/azure-ad-b2c";

export default NextAuth({
  providers: [
    AzureADB2CProvider({
      clientId: process.env.AZURE_AD_B2C_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_B2C_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_B2C_TENANT_NAME!,
      primaryUserFlow: process.env.AZURE_AD_B2C_PRIMARY_USER_FLOW!,
      authorization: { params: { scope: "openid profile email offline_access" } }
    })
  ],
  secret: process.env.NEXTAUTH_SECRET!,
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = (user as any).id;
      return token;
    },
    async session({ session, token }) {
      (session.user as any).id = token.id as string;
      return session;
    }
  }
}); 