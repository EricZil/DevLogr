import { PrismaClient } from '@prisma/client/edge';

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Format MySQL URL for Edge compatibility
const formatDatabaseUrl = (): string => {
  const url = process.env.DATABASE_URL;
  
  if (!url) {
    console.error('DATABASE_URL environment variable is not set');
    return '';
  }
  
  // For edge compatibility, MySQL URLs need to be formatted as:
  // mysql://USER:PASSWORD@HOST:PORT/DATABASE
  if (url.startsWith('mysql://')) {
    // The URL is already in the correct format, just return it
    return url;
  }
  
  console.error('DATABASE_URL must start with mysql:// for this configuration');
  return url;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: formatDatabaseUrl(),
    },
  },
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Graceful shutdown
if (process.env.NODE_ENV === 'production') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect();
  });
} 