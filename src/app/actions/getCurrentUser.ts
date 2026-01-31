import { prisma } from "@/lib/prisma";
import getSession from "./getSession";

interface CurrentUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  photoURL?: string | null;
  status?: string | null;
}

const getCurrentUser = async (): Promise<CurrentUser | null> => {
  try {
    const session = await getSession();
    if (!session?.user?.email) {
      return null;
    }

    const currentUser = await prisma.user.findUnique({
      where: {
        email: session.user.email as string,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        photoURL: true,
        status: true,
      },
    });

    if (!currentUser) {
      return null;
    }

    return currentUser;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
};

export default getCurrentUser;
