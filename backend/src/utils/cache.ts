import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  retry: {
    retries: 2,
    backoff: (retryCount) => Math.min(retryCount * 50, 500),
  },
});

const REDIS_TIMEOUT = 1000;

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number = REDIS_TIMEOUT): Promise<T | null> => {
  const timeoutPromise = new Promise<null>((_, reject) => {
    setTimeout(() => reject(new Error('Redis operation timeout')), timeoutMs);
  });
  
  try {
    return await Promise.race([promise, timeoutPromise]);
  } catch (error) {
    console.error('Redis operation failed:', error);
    return null;
  }
};

const TTL = {
  SHORT: 30,
  MEDIUM: 300,
  LONG: 3600,
} as const;

export const cacheKeys = {
  milestoneProgress: (milestoneId: string) => `milestone:progress:${milestoneId}`,
  milestoneTasksCount: (milestoneId: string) => `milestone:tasks:count:${milestoneId}`,
  tasksByStatus: (milestoneId: string, status: string) => `milestone:${milestoneId}:tasks:${status}`,
  userTasks: (userId: string) => `user:${userId}:tasks`,
  projectMilestones: (projectId: string) => `project:${projectId}:milestones`,
};

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await withTimeout(redis.get(key));
      return data as T;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  },

  async set<T>(key: string, value: T, ttl: number = TTL.MEDIUM): Promise<boolean> {
    try {
      withTimeout(redis.setex(key, ttl, JSON.stringify(value))).catch(error => {
      });
      return true;
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  },

  async del(key: string): Promise<boolean> {
    try {
      await redis.del(key);
      return true;
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  },

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

  async exists(key: string): Promise<boolean> {
    try {
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  },

  async ttl(key: string): Promise<number> {
    try {
      return await redis.ttl(key);
    } catch (error) {
      console.error(`Cache TTL error for key ${key}:`, error);
      return -1;
    }
  },
};

export const invalidateCache = {
  async milestone(milestoneId: string): Promise<void> {
    const patterns = [
      cacheKeys.milestoneProgress(milestoneId),
      cacheKeys.milestoneTasksCount(milestoneId),
    ];
    
    ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELLED'].forEach(status => {
      patterns.push(cacheKeys.tasksByStatus(milestoneId, status));
    });
    
    await Promise.all(patterns.map(key => cache.del(key)));
  },
  
  async project(projectId: string): Promise<void> {
    const key = cacheKeys.projectMilestones(projectId);
    await cache.del(key);
  },
  
  async user(userId: string): Promise<void> {
    const key = cacheKeys.userTasks(userId);
    await cache.del(key);
  },

  async projectMilestones(projectId: string): Promise<void> {
    await cache.delPattern(`milestone:*`);
    await cache.delPattern(`project:${projectId}:*`);
  },
};

export async function cacheOrFetch<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = TTL.MEDIUM
): Promise<T> {
  const cachePromise = cache.get<T>(key);
  const fetchPromise = fetchFn();
  
  try {
    const cached = await Promise.race([
      cachePromise,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 100))
    ]);
    
    if (cached !== null) {
      fetchPromise.then(data => {
        cache.set(key, data, ttl).catch(error => {
        });
      }).catch(() => {});
      
      return cached;
    }
  } catch (error) {
  }

  const data = await fetchPromise;
  
  cache.set(key, data, ttl).catch(error => {
    console.error(`Failed to cache data for key ${key}:`, error);
  });
  
  return data;
}

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

export const warmCache = {
  async milestoneProgress(milestoneId: string, progress: number): Promise<void> {
    const key = cacheKeys.milestoneProgress(milestoneId);
    await cache.set(key, progress, TTL.SHORT);
  },

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