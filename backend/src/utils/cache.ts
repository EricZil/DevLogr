import { Redis } from '@upstash/redis';

// Initialize Upstash Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Cache TTL settings (in seconds)
const TTL = {
  SHORT: 30,    // 30 seconds for frequently changing data
  MEDIUM: 300,  // 5 minutes for semi-static data
  LONG: 3600,   // 1 hour for static data
} as const;

// Cache key generators
export const cacheKeys = {
  milestoneProgress: (milestoneId: string) => `milestone:progress:${milestoneId}`,
  milestoneTasksCount: (milestoneId: string) => `milestone:tasks:count:${milestoneId}`,
  tasksByStatus: (milestoneId: string, status: string) => `milestone:${milestoneId}:tasks:${status}`,
  userTasks: (userId: string) => `user:${userId}:tasks`,
  projectMilestones: (projectId: string) => `project:${projectId}:milestones`,
};

// Cache wrapper functions with Redis
export const cache = {
  // Get data from cache
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redis.get(key);
      return data as T;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  },

  // Set data in cache with TTL
  async set<T>(key: string, value: T, ttl: number = TTL.MEDIUM): Promise<boolean> {
    try {
      await redis.setex(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  },

  // Delete data from cache
  async del(key: string): Promise<boolean> {
    try {
      await redis.del(key);
      return true;
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  },

  // Delete multiple keys matching a pattern
  async delPattern(pattern: string): Promise<number> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
        return keys.length;
      }
      return 0;
    } catch (error) {
      console.error(`Cache delete pattern error for pattern ${pattern}:`, error);
      return 0;
    }
  },

  // Check if key exists
  async exists(key: string): Promise<boolean> {
    try {
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  },

  // Get TTL for a key
  async ttl(key: string): Promise<number> {
    try {
      return await redis.ttl(key);
    } catch (error) {
      console.error(`Cache TTL error for key ${key}:`, error);
      return -1;
    }
  },
};

// Cache invalidation helpers
export const invalidateCache = {
  // Invalidate all caches related to a milestone
  async milestone(milestoneId: string): Promise<void> {
    const patterns = [
      cacheKeys.milestoneProgress(milestoneId),
      cacheKeys.milestoneTasksCount(milestoneId),
    ];
    
    // Also invalidate task status caches
    ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELLED'].forEach(status => {
      patterns.push(cacheKeys.tasksByStatus(milestoneId, status));
    });
    
    await Promise.all(patterns.map(key => cache.del(key)));
  },
  
  // Invalidate all caches related to a project
  async project(projectId: string): Promise<void> {
    const key = cacheKeys.projectMilestones(projectId);
    await cache.del(key);
  },
  
  // Invalidate all caches related to a user
  async user(userId: string): Promise<void> {
    const key = cacheKeys.userTasks(userId);
    await cache.del(key);
  },

  // Invalidate all milestone-related caches for a project
  async projectMilestones(projectId: string): Promise<void> {
    await cache.delPattern(`milestone:*`);
    await cache.delPattern(`project:${projectId}:*`);
  },
};

// Utility function for cache-or-fetch pattern
export async function cacheOrFetch<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = TTL.MEDIUM
): Promise<T> {
  // Try to get from cache first
  const cached = await cache.get<T>(key);
  if (cached !== null) {
    return cached;
  }
  
  // If not in cache, fetch the data
  const data = await fetchFn();
  
  // Store in cache for next time (fire and forget)
  cache.set(key, data, ttl).catch(error => {
    console.error(`Failed to cache data for key ${key}:`, error);
  });
  
  return data;
}

// Performance monitoring and cache statistics
export const cacheStats = {
  async keyCount(): Promise<number> {
    try {
      const keys = await redis.keys('*');
      return keys.length;
    } catch (error) {
      console.error('Cache key count error:', error);
      return 0;
    }
  },

  async getStats(): Promise<{ keyCount: number; status: string }> {
    try {
      const keyCount = await this.keyCount();
      return {
        keyCount,
        status: 'connected'
      };
    } catch (error) {
      console.error('Cache stats error:', error);
      return {
        keyCount: 0,
        status: 'error'
      };
    }
  },
};

// Cache warming functions for frequently accessed data
export const warmCache = {
  // Pre-warm milestone progress data
  async milestoneProgress(milestoneId: string, progress: number): Promise<void> {
    const key = cacheKeys.milestoneProgress(milestoneId);
    await cache.set(key, progress, TTL.SHORT);
  },

  // Pre-warm task counts
  async taskCounts(milestoneId: string, counts: Record<string, number>): Promise<void> {
    const promises = Object.entries(counts).map(([status, count]) => {
      const key = cacheKeys.tasksByStatus(milestoneId, status);
      return cache.set(key, count, TTL.SHORT);
    });
    await Promise.all(promises);
  },
};

export { TTL };
export default cache;