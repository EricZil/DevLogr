import { prisma } from "../lib/prisma";
import { AppError } from "../lib/error-handler";

/**
 * Gets a user's profile from the database.
 * @param userId The ID of the user to fetch.
 */
export async function getUserProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      username: true,
      name: true,
      bio: true,
      avatar: true,
      location: true,
      website: true,
      role: true,
      status: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new AppError("User not found", 404, "USER_NOT_FOUND");
  }

  return user;
} 