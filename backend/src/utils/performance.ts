import { performance } from 'perf_hooks';

export class PerformanceMonitor {
  private static timers = new Map<string, number>();
  private static metrics = new Map<string, number[]>();

  static start(operationId: string): void {
    this.timers.set(operationId, performance.now());
  }

  static end(operationId: string): number {
    const startTime = this.timers.get(operationId);
    if (!startTime) {
      return 0;
    }

    const duration = performance.now() - startTime;
    this.timers.delete(operationId);

    if (!this.metrics.has(operationId)) {
      this.metrics.set(operationId, []);
    }
    this.metrics.get(operationId)!.push(duration);

    if (duration > 1000) {
      console.error(`🐌 SLOW OP: ${operationId} took ${duration.toFixed(2)}ms`);
    } else if (duration > 500) {
      console.warn(`⚠️  MODERATE DELAY: ${operationId} took ${duration.toFixed(2)}ms`);
    } else if (process.env.NODE_ENV === 'development') {
      console.log(`✅ ${operationId}: ${duration.toFixed(2)}ms`);
    }

    return duration;
  }

  static getStats(operationId: string): {
    count: number;
    avg: number;
    min: number;
    max: number;
    p95: number;
  } | null {
    const durations = this.metrics.get(operationId);
    if (!durations || durations.length === 0) {
      return null;
    }

    const sorted = [...durations].sort((a, b) => a - b);
    const count = sorted.length;
    const sum = sorted.reduce((a, b) => a + b, 0);
    const avg = sum / count;
    const min = sorted[0];
    const max = sorted[count - 1];
    const p95Index = Math.floor(count * 0.95);
    const p95 = sorted[p95Index];

    return { count, avg, min, max, p95 };
  }

  static getAllStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    for (const [operationId] of this.metrics) {
      stats[operationId] = this.getStats(operationId);
    }
    return stats;
  }

  static clear(): void {
    this.timers.clear();
    this.metrics.clear();
  }

  static middleware(operationName: string) {
    return (req: any, res: any, next: any) => {
      const operationId = `${operationName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      PerformanceMonitor.start(operationId);
      
      const originalEnd = res.end;
      res.end = function(...args: any[]) {
        const duration = PerformanceMonitor.end(operationId);
        
        res.setHeader('X-Response-Time', `${duration.toFixed(2)}ms`);
        
        originalEnd.apply(this, args);
      };
      
      next();
    };
  }
}

export async function measureDbQuery<T>(
  queryName: string,
  queryFn: () => Promise<T>
): Promise<T> {
  const operationId = `db_${queryName}_${Date.now()}`;
  
  PerformanceMonitor.start(operationId);
  
  try {
    const result = await queryFn();
    PerformanceMonitor.end(operationId);
    return result;
  } catch (error) {
    PerformanceMonitor.end(operationId);
    throw error;
  }
}

export async function measureCacheOp<T>(
  operation: string,
  key: string,
  cacheFn: () => Promise<T>
): Promise<T> {
  const operationId = `cache_${operation}_${key}`;
  
  PerformanceMonitor.start(operationId);
  
  try {
    const result = await cacheFn();
    PerformanceMonitor.end(operationId);
    return result;
  } catch (error) {
    PerformanceMonitor.end(operationId);
    throw error;
  }
}

export async function measureApiCall<T>(
  endpoint: string,
  apiFn: () => Promise<T>
): Promise<T> {
  const operationId = `api_${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`;
  
  PerformanceMonitor.start(operationId);
  
  try {
    const result = await apiFn();
    PerformanceMonitor.end(operationId);
    return result;
  } catch (error) {
    PerformanceMonitor.end(operationId);
    throw error;
  }
}

export function generatePerformanceReport(): string {
  const stats = PerformanceMonitor.getAllStats();
  const report = ['🔍 PERFORMANCE REPORT', '=' .repeat(50)];
  
  for (const [operation, data] of Object.entries(stats)) {
    if (data) {
      report.push(`\n📊 ${operation}:`);
      report.push(`   Count: ${data.count}`);
      report.push(`   Average: ${data.avg.toFixed(2)}ms`);
      report.push(`   Min: ${data.min.toFixed(2)}ms`);
      report.push(`   Max: ${data.max.toFixed(2)}ms`);
      report.push(`   95th Percentile: ${data.p95.toFixed(2)}ms`);
      
      if (data.avg > 1000) {
        report.push(`   🚨 CRITICAL: Average response time over 1 second!`);
      } else if (data.avg > 500) {
        report.push(`   ⚠️  WARNING: Average response time over 500ms`);
      } else if (data.avg < 100) {
        report.push(`   ✅ GOOD: Fast response times`);
      }
    }
  }
  
  return report.join('\n');
}

export default PerformanceMonitor;