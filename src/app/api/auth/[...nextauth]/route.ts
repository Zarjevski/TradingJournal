import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { Adapter } from "next-auth/adapters";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

// NextAuth's adapter contract expects a User shaped like { name, email, image, emailVerified }.
// Our schema instead stores firstName/lastName/photoURL (no emailVerified), so we wrap the
// stock PrismaAdapter and translate between the two shapes on the handful of methods that
// touch the User model. Account/Session/VerificationToken pass through untouched.
function mapUser(user: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  photoURL: string | null;
}) {
  return {
    id: user.id,
    email: user.email,
    name: `${user.firstName} ${user.lastName}`,
    image: user.photoURL,
    emailVerified: null,
  };
}

const baseAdapter = PrismaAdapter(prisma);

const authAdapter: Adapter = {
  ...baseAdapter,
  async createUser(data: any) {
    const firstName = data.given_name || data.name?.split(" ")[0] || "New";
    const lastName =
      data.family_name || data.name?.split(" ").slice(1).join(" ") || "User";

    const user = await prisma.user.create({
      data: {
        email: data.email,
        firstName,
        lastName,
        photoURL: data.image ?? null,
        password: null,
      },
    });

    return mapUser(user) as any;
  },
  async getUser(id) {
    const user = await prisma.user.findUnique({ where: { id } });
    return user ? (mapUser(user) as any) : null;
  },
  async getUserByEmail(email) {
    const user = await prisma.user.findUnique({ where: { email } });
    return user ? (mapUser(user) as any) : null;
  },
  async getUserByAccount({ provider, providerAccountId }) {
    const account = await prisma.account.findUnique({
      where: { provider_providerAccountId: { provider, providerAccountId } },
      include: { user: true },
    });
    return account ? (mapUser(account.user) as any) : null;
  },
  async updateUser(data: any) {
    const updateData: Record<string, unknown> = {};
    if (data.email) updateData.email = data.email;
    if (data.image !== undefined) updateData.photoURL = data.image;
    if (data.given_name) updateData.firstName = data.given_name;
    if (data.family_name) updateData.lastName = data.family_name;

    const user = await prisma.user.update({
      where: { id: data.id },
      data: updateData,
    });

    return mapUser(user) as any;
  },
};

export const authOptions: NextAuthOptions = {
  adapter: authAdapter,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        try {
          const ip = getClientIp(req?.headers);
          if (!checkRateLimit(`login:${ip}`, 10, 60_000)) {
            throw new Error("Too many login attempts. Please try again later.");
          }

          if (!credentials?.email || !credentials?.password) {
            throw new Error("invalid credentials");
          }
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email,
            },
          });
          if (!user || !user.password) {
            throw new Error("invalid credentails no user");
          }

          const isCorrectPassword = await bcrypt.compare(
            credentials.password,
            user.password
          );
          if (!isCorrectPassword) {
            throw new Error("Invalid credentials");
          }

          return {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
          };
        } catch (error) {
          console.error("Authentication error:", error);
          return null;
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.sub,
          email: profile.email,
          given_name: profile.given_name,
          family_name: profile.family_name,
          image: profile.picture,
        } as any;
      },
    }),
  ],
  debug: process.env.NODE_ENV === "development",
  session: {
    strategy: "jwt",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = (user as { id?: string }).id;
        token.email = (user as { email?: string }).email;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
        (session.user as { email?: string }).email = token.email as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
