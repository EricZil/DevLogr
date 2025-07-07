import { prisma } from "@/lib/prisma";

/**
 * Get popular tags for quick selection
 * Fetches the 20 most popular tags based on project count.
 */
export async function getPopularTags() {
  const popularTags = await prisma.tag.findMany({
    select: {
      id: true,
      name: true,
      color: true,
      _count: {
        select: { projects: true },
      },
    },
    orderBy: {
      projects: {
        _count: "desc",
      },
    },
    take: 20,
  });

  return popularTags;
} 