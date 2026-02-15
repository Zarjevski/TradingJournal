import { prisma } from "./prisma";

const OBJECT_ID_REGEX = /^[a-f0-9]{24}$/i;

export function isValidObjectId(id: string): boolean {
  return typeof id === "string" && OBJECT_ID_REGEX.test(id);
}

/**
 * Normalize (userA, userB) so that the same pair always maps to [smaller, greater].
 * Used to enforce unique friendship regardless of order.
 */
export function normalizeFriendshipPair(
  userIdA: string,
  userIdB: string
): [string, string] {
  if (userIdA === userIdB) return [userIdA, userIdB];
  return userIdA < userIdB ? [userIdA, userIdB] : [userIdB, userIdA];
}

export async function isFriend(userIdA: string, userIdB: string): Promise<boolean> {
  if (userIdA === userIdB) return false;
  const [a, b] = normalizeFriendshipPair(userIdA, userIdB);
  const friendship = await prisma.friendship.findUnique({
    where: {
      userAID_userBID: { userAID: a, userBID: b },
    },
  });
  return !!friendship;
}

export async function isBlocked(blockerId: string, blockedId: string): Promise<boolean> {
  if (blockerId === blockedId) return false;
  const block = await prisma.block.findUnique({
    where: {
      blockerID_blockedID: { blockerID: blockerId, blockedID: blockedId },
    },
  });
  return !!block;
}

/** True if either user has blocked the other */
export async function hasBlockBetween(userIdA: string, userIdB: string): Promise<boolean> {
  const [a, b] = [userIdA, userIdB];
  const b1 = await prisma.block.findUnique({
    where: { blockerID_blockedID: { blockerID: a, blockedID: b } },
  });
  if (b1) return true;
  const b2 = await prisma.block.findUnique({
    where: { blockerID_blockedID: { blockerID: b, blockedID: a } },
  });
  return !!b2;
}

export async function getOrCreateUserPrivacy(userId: string) {
  let privacy = await prisma.userPrivacy.findUnique({
    where: { userID: userId },
  });
  if (!privacy) {
    privacy = await prisma.userPrivacy.create({
      data: { userID: userId },
    });
  }
  return privacy;
}
