import { describe, it, expect } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';

const cookiesOf = (res: request.Response): string[] => (res.headers['set-cookie'] as unknown as string[]) || [];
const cookieValue = (res: request.Response, name: string): string | undefined => {
  const line = cookiesOf(res).find(c => c.startsWith(`${name}=`));
  return line?.split(';')[0].slice(name.length + 1);
};

let n = 0;
async function login() {
  const email = `refresh${Date.now()}${n++}@test.dev`;
  const res = await request(app).post('/api/auth/signup').send({ email, password: 'password123' });
  expect(res.status).toBe(200);
  return {
    res,
    userId: res.body.user.id as string,
    access: cookieValue(res, 'token')!,
    refresh: cookieValue(res, 'refresh_token')!
  };
}

const refreshWith = (refresh: string) =>
  request(app).post('/api/auth/refresh').set('Cookie', `refresh_token=${refresh}`);

describe('session cookies', () => {
  it('issues a short-lived access token and a path-scoped httpOnly refresh token', async () => {
    const { res, access, refresh } = await login();
    expect(refresh).toBeTruthy();

    const claims = jwt.decode(access) as { exp: number; iat: number };
    expect(claims.exp - claims.iat).toBe(15 * 60);

    const line = cookiesOf(res).find(c => c.startsWith('refresh_token='))!;
    expect(line).toContain('HttpOnly');
    expect(line).toContain('Path=/api/auth');
  });

  it('stores only a hash of the refresh token', async () => {
    const { refresh, userId } = await login();
    const rows = await prisma.refreshToken.findMany({ where: { userId } });
    expect(rows).toHaveLength(1);
    expect(rows[0].tokenHash).not.toBe(refresh);
    expect(rows[0].tokenHash).toHaveLength(64);
  });
});

describe('refresh', () => {
  it('renews an expired access token', async () => {
    const { userId, refresh } = await login();
    const expired = jwt.sign({ userId }, 'test-secret', { expiresIn: -10 });

    await request(app).get('/api/auth/me').set('Cookie', `token=${expired}`).expect(401);

    const res = await refreshWith(refresh);
    expect(res.status).toBe(200);
    const fresh = cookieValue(res, 'token')!;
    await request(app).get('/api/auth/me').set('Cookie', `token=${fresh}`).expect(200);
  });

  it('rotates the refresh token on every use', async () => {
    const { refresh } = await login();
    const res = await refreshWith(refresh);
    const next = cookieValue(res, 'refresh_token');
    expect(next).toBeTruthy();
    expect(next).not.toBe(refresh);
    // The new token keeps working
    await refreshWith(next!).expect(200);
  });

  it('treats an immediate replay as a concurrent request, not theft', async () => {
    const { refresh } = await login();
    const winner = await refreshWith(refresh);
    const next = cookieValue(winner, 'refresh_token')!;

    const loser = await refreshWith(refresh); // same token, a moment later
    expect(loser.status).toBe(200);
    expect(cookieValue(loser, 'refresh_token')).toBeUndefined(); // no second refresh token minted
    await refreshWith(next).expect(200); // the family is still alive
  });

  it('revokes the whole family when a rotated token is replayed later (theft)', async () => {
    const { refresh, userId } = await login();
    const winner = await refreshWith(refresh);
    const next = cookieValue(winner, 'refresh_token')!;

    // Pretend the rotation happened a minute ago
    await prisma.refreshToken.updateMany({
      where: { userId, rotatedAt: { not: null } },
      data: { rotatedAt: new Date(Date.now() - 60_000) }
    });

    await refreshWith(refresh).expect(401); // attacker replays the stolen old token
    await refreshWith(next).expect(401); // ...which also kills the legitimate user's newer token
  });

  it('rejects missing, unknown and expired refresh tokens', async () => {
    await request(app).post('/api/auth/refresh').expect(401);
    await refreshWith('not-a-real-token').expect(401);

    const { refresh, userId } = await login();
    await prisma.refreshToken.updateMany({ where: { userId }, data: { expiresAt: new Date(Date.now() - 1000) } });
    await refreshWith(refresh).expect(401);
  });

  it('does not refresh for a deleted account', async () => {
    const { refresh, userId } = await login();
    await prisma.user.delete({ where: { id: userId } });
    await refreshWith(refresh).expect(401);
  });
});

describe('logout', () => {
  it('revokes the refresh token server-side', async () => {
    const { refresh } = await login();
    const out = await request(app).post('/api/auth/logout').set('Cookie', `refresh_token=${refresh}`);
    expect(out.status).toBe(200);
    // Even a copy of the cookie taken before logout is now useless
    await refreshWith(refresh).expect(401);
  });
});
