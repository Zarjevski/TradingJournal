import { prisma } from "./prisma";
import { isValidObjectId } from "./friends";
import { hasBlockBetween } from "./friends";

export { isValidObjectId };

/**
 * Normalize (a, b) so the same pair always maps to [smaller, greater].
 * Use for Conversation uniqueness (userAID < userBID).
 */
export function normalizePair(userIdA: string, userIdB: string): [string, string] {
  if (userIdA === userIdB) return [userIdA, userIdB];
  return userIdA < userIdB ? [userIdA, userIdB] : [userIdB, userIdA];
}

export async function requireFriendship(userId: string, friendId: string): Promise<void> {
  if (!isValidObjectId(userId) || !isValidObjectId(friendId)) {
    throw new Error("Invalid user id");
  }
  if (userId === friendId) throw new Error("Cannot chat with yourself");
  if (await hasBlockBetween(userId, friendId)) {
    throw new Error("Blocked");
  }
  const [a, b] = normalizePair(userId, friendId);
  const friendship = await prisma.friendship.findUnique({
    where: { userAID_userBID: { userAID: a, userBID: b } },
  });
  if (!friendship) throw new Error("Not friends");
}

export async function getConversationForPair(
  userId: string,
  friendId: string
): Promise<{ id: string; userAID: string; userBID: string } | null> {
  const [a, b] = normalizePair(userId, friendId);
  const conv = await prisma.conversation.findUnique({
    where: { userAID_userBID: { userAID: a, userBID: b } },
    select: { id: true, userAID: true, userBID: true },
  });
  return conv;
}

export async function getOrCreateConversationForPair(
  userId: string,
  friendId: string
): Promise<{ id: string; userAID: string; userBID: string }> {
  await requireFriendship(userId, friendId);
  const [a, b] = normalizePair(userId, friendId);
  const conv = await prisma.conversation.upsert({
    where: { userAID_userBID: { userAID: a, userBID: b } },
    create: { userAID: a, userBID: b },
    update: {},
    select: { id: true, userAID: true, userBID: true },
  });
  return conv;
}

export async function isUserInConversation(
  userId: string,
  conversationId: string
): Promise<boolean> {
  if (!isValidObjectId(conversationId)) return false;
  const conv = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { userAID: true, userBID: true },
  });
  if (!conv) return false;
  return conv.userAID === userId || conv.userBID === userId;
}

/** In-memory rate limiter: max N actions per window (e.g. 20 messages per 60s per userId). */
const messageCountByUser = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 20;

export function checkMessageRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = messageCountByUser.get(userId);
  if (!entry) {
    messageCountByUser.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (now >= entry.resetAt) {
    entry.count = 1;
    entry.resetAt = now + RATE_LIMIT_WINDOW_MS;
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

export async function getFriendIds(userId: string): Promise<string[]> {
  const friendships = await prisma.friendship.findMany({
    where: { OR: [{ userAID: userId }, { userBID: userId }] },
    select: { userAID: true, userBID: true },
  });
  return friendships.map((f) => (f.userAID === userId ? f.userBID : f.userAID));
}
