import { PrismaClient } from '@prisma/client';

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// CRITICAL PERFORMANCE FIX: Configure connection pooling via environment variables
// Add these to your DATABASE_URL: ?connection_limit=20&pool_timeout=10&connect_timeout=5
if (!process.env.DATABASE_URL?.includes('connection_limit')) {
  console.warn('⚠️  DATABASE_URL missing connection pooling parameters. Add: ?connection_limit=20&pool_timeout=10&connect_timeout=5');
}

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Graceful shutdown
if (process.env.NODE_ENV === 'production') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect();
  });
} 