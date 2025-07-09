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

/**
 * Updates a user's profile in the database.
 * @param userId The ID of the user to update.
 * @param profileData The profile data to update.
 */
export async function updateUserProfile(userId: string, profileData: {
  name?: string;
  username?: string;
  bio?: string;
  location?: string;
  website?: string;
}) {
  // Check if username is already taken (if being changed)
  if (profileData.username) {
    const existingUser = await prisma.user.findFirst({
      where: {
        username: profileData.username,
        NOT: { id: userId }
      }
    });

    if (existingUser) {
      throw new AppError("Username is already taken", 400, "USERNAME_TAKEN");
    }
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: profileData,
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

  return user;
}

/**
 * Deletes a user account and all associated data.
 * @param userId The ID of the user to delete.
 */
export async function deleteUserAccount(userId: string) {
  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new AppError("User not found", 404, "USER_NOT_FOUND");
  }

  // Delete user and all associated data (cascade should handle this)
  await prisma.user.delete({
    where: { id: userId }
  });

  return { success: true, message: "Account deleted successfully" };
} 