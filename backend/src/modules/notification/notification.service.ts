import { eq, and, desc } from 'drizzle-orm';
import { db } from '../../config/db';
import { notifications } from '../../db/schema';

export type NotificationCategory = 'orders' | 'stock' | 'tokens' | 'payouts' | 'system';

/**
 * Insert a vendor notification. Best-effort: notification failures must never
 * break the primary flow (placing an order, updating stock), so callers wrap
 * this in a try/catch or `.catch()` and swallow errors.
 */
export async function createNotification(
  vendorId: string,
  category: NotificationCategory,
  text: string,
  link?: string,
) {
  const [row] = await db
    .insert(notifications)
    .values({ vendorId, category, text, link })
    .returning();
  return row;
}

export async function getNotifications(vendorId: string) {
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.vendorId, vendorId))
    .orderBy(desc(notifications.createdAt))
    .limit(50);
}

export async function markAllRead(vendorId: string) {
  await db
    .update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.vendorId, vendorId), eq(notifications.read, false)));
  return { success: true };
}
