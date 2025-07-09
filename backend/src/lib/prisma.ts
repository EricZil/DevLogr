import { PrismaClient } from '@prisma/client/edge';

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Process the DATABASE_URL to ensure it has the correct protocol
const processDbUrl = (url: string | undefined): string => {
  if (!url) return '';
  
  // If the URL already starts with prisma:// or prisma+postgres://, return it as is
  if (url.startsWith('prisma://') || url.startsWith('prisma+postgres://')) {
    return url;
  }
  
  // If it starts with postgres://, replace with prisma+postgres://
  if (url.startsWith('postgres://')) {
    return url.replace('postgres://', 'prisma+postgres://');
  }
  
  // If it starts with mysql://, replace with prisma://
  if (url.startsWith('mysql://')) {
    return url.replace('mysql://', 'prisma://');
  }
  
  // Default case: prepend prisma:// if no protocol is detected
  if (!url.includes('://')) {
    return `prisma://${url}`;
  }
  
  return url;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: processDbUrl(process.env.DATABASE_URL),
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