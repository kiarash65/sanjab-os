import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * لاگ کوئری فقط در توسعه فعال است — لاگِ SQL در Production هم کارایی را
 * پایین می‌آورد و هم می‌تواند داده‌های حساس را به لاگ‌ها نشت بدهد.
 */
const isDev = process.env.NODE_ENV !== 'production'

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: isDev ? ['query', 'warn', 'error'] : ['warn', 'error'],
  })

if (isDev) globalForPrisma.prisma = db
