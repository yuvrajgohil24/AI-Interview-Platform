import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { prisma } from '../lib/prisma';

export const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000;

// A rotated token presented again within this window is treated as a concurrent request
// (e.g. two tabs refreshing at once), not as theft.
const ROTATION_GRACE_MS = 10 * 1000;

// Only a hash is stored, so a database leak doesn't hand out usable tokens
const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');
const newRawToken = () => randomBytes(32).toString('base64url');

export type RotationResult =
  | { status: 'rotated'; userId: string; refreshToken: string }
  | { status: 'grace'; userId: string } // concurrent refresh: the winner already set a new cookie
  | { status: 'invalid' };

// Starts a new login "family" and returns the raw refresh token to put in the cookie
export async function issueRefreshToken(userId: string, familyId: string = randomUUID()): Promise<string> {
  const raw = newRawToken();
  await prisma.refreshToken.create({
    data: { userId, familyId, tokenHash: sha256(raw), expiresAt: new Date(Date.now() + REFRESH_TTL_MS) }
  });
  return raw;
}

const revokeFamily = (familyId: string) =>
  prisma.refreshToken.updateMany({
    where: { familyId, revokedAt: null },
    data: { revokedAt: new Date() }
  });

// Exchanges a refresh token for a new one (rotation). Presenting an already-used token
// outside the grace window means it was likely stolen, so the whole family is revoked.
export async function rotateRefreshToken(raw: string): Promise<RotationResult> {
  const record = await prisma.refreshToken.findUnique({ where: { tokenHash: sha256(raw) } });
  if (!record) return { status: 'invalid' };

  const now = Date.now();

  if (record.revokedAt) {
    const justRotated = record.rotatedAt && now - record.rotatedAt.getTime() <= ROTATION_GRACE_MS;
    if (justRotated) return { status: 'grace', userId: record.userId };
    await revokeFamily(record.familyId);
    return { status: 'invalid' };
  }
  if (record.expiresAt.getTime() <= now) return { status: 'invalid' };

  const next = newRawToken();
  const rotated = await prisma.$transaction(async tx => {
    // Atomic claim: only one concurrent request can rotate this token
    const claimed = await tx.refreshToken.updateMany({
      where: { id: record.id, revokedAt: null },
      data: { revokedAt: new Date(), rotatedAt: new Date() }
    });
    if (claimed.count !== 1) return false;
    await tx.refreshToken.create({
      data: {
        userId: record.userId,
        familyId: record.familyId,
        tokenHash: sha256(next),
        // Absolute lifetime: rotation doesn't extend the original login's expiry
        expiresAt: record.expiresAt
      }
    });
    return true;
  });

  if (!rotated) return { status: 'grace', userId: record.userId };
  return { status: 'rotated', userId: record.userId, refreshToken: next };
}

// Logout: invalidate every token from this login
export async function revokeRefreshToken(raw: string): Promise<void> {
  const record = await prisma.refreshToken.findUnique({ where: { tokenHash: sha256(raw) } });
  if (record) await revokeFamily(record.familyId);
}

// Housekeeping, called opportunistically at login
export const deleteExpiredTokens = (userId: string) =>
  prisma.refreshToken.deleteMany({ where: { userId, expiresAt: { lt: new Date() } } });
