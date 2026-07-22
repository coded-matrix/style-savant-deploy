import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { db } from '../../config/db';
import { users, vendors } from '../../db/schema';
import { TokenPayload, UserRole } from '../../middleware/auth';
import { config } from '../../config/env';
import { ensureTrialSubscription } from '../payments/payment.service';

function signToken(payload: TokenPayload): string {
  if (!config.jwt.secret) throw new Error('JWT_SECRET is not set');
  const options: SignOptions = { expiresIn: config.jwt.expiresIn as SignOptions['expiresIn'] };
  return jwt.sign(payload, config.jwt.secret, options);
}

interface RegisterInput {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role: UserRole;
  businessName?: string;
  businessCallNumber?: string;
  businessWhatsapp?: string;
}

export async function register(input: RegisterInput) {
  const { email, password, name, phone, role, businessName, businessCallNumber, businessWhatsapp } = input;

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  if (existing) throw new Error('Email already registered');

  // Vendors need a business name so we can create their vendor profile
  if (role === 'vendor' && !businessName) {
    throw new Error('businessName is required for vendor accounts');
  }

  const passwordHash = await bcrypt.hash(password, config.jwt.saltRounds);

  const [user] = await db
    .insert(users)
    .values({ email, password: passwordHash, name, phone, role })
    .returning({
      id: users.id,
      email: users.email,
      name: users.name,
      phone: users.phone,
      role: users.role,
      avatar: users.avatar,
      fitPhoto: users.fitPhoto,
      createdAt: users.createdAt,
    });

  let vendorId: string | undefined;
  if (role === 'vendor') {
    const [vendor] = await db
      .insert(vendors)
      .values({ userId: user.id, businessName: businessName as string, businessCallNumber, businessWhatsapp })
      .returning({ id: vendors.id });
    vendorId = vendor.id;
    // Every new vendor starts on a free trial month with the full monthly
    // token allocation (see payment.service for the paid renewal flow).
    await ensureTrialSubscription(vendorId);
  }

  const token = signToken({ userId: user.id, role: user.role, vendorId });
  return { user, vendorId, token };
}

export async function login(email: string, password: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email));

  // Same error for missing email or wrong password so we don't leak which emails exist
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new Error('Invalid email or password');
  }

  let vendorId: string | undefined;
  if (user.role === 'vendor') {
    const [vendor] = await db.select({ id: vendors.id }).from(vendors).where(eq(vendors.userId, user.id));
    vendorId = vendor?.id;
  }

  const token = signToken({ userId: user.id, role: user.role, vendorId });

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      avatar: user.avatar,
      fitPhoto: user.fitPhoto,
      createdAt: user.createdAt,
    },
    vendorId,
    token,
  };
}

export async function getMe(userId: string) {
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      phone: users.phone,
      role: users.role,
      avatar: users.avatar,
      fitPhoto: users.fitPhoto,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId));

  if (!user) throw new Error('User not found');

  let vendor = null;
  if (user.role === 'vendor') {
    const [v] = await db.select().from(vendors).where(eq(vendors.userId, user.id));
    vendor = v ?? null;
  }

  return { user, vendor };
}

export async function updateProfilePhoto(userId: string, buffer: Buffer) {
  const base64 = buffer.toString('base64');
  const [user] = await db
    .update(users)
    .set({ fitPhoto: base64, avatar: base64 })
    .where(eq(users.id, userId))
    .returning({
      fitPhoto: users.fitPhoto,
      avatar: users.avatar,
    });

  if (!user) throw new Error('User not found');
  return { fitPhoto: user.fitPhoto, avatar: user.avatar };
}
