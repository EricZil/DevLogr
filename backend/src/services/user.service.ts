import { prisma } from "../lib/prisma";
import { AppError } from "../lib/error-handler";

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

export async function updateUserProfile(userId: string, profileData: {
  name?: string;
  username?: string;
  bio?: string;
  location?: string;
  website?: string;
}) {
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

export async function deleteUserAccount(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new AppError("User not found", 404, "USER_NOT_FOUND");
  }

  await prisma.user.delete({
    where: { id: userId }
  });

  return { success: true, message: "Account deleted successfully" };
} 