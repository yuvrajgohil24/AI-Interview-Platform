import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { newUser } from './helpers';

describe('auth', () => {
  it('rejects invalid signup input', async () => {
    const res = await request(app).post('/api/auth/signup').send({ email: 'nope', password: '1' });
    expect(res.status).toBe(400);
  });

  it('signs up with an httpOnly cookie and never returns the token', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'Cookie@Test.dev', password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeUndefined();
    expect(res.body.user.email).toBe('cookie@test.dev'); // normalized
    const cookie = (res.headers['set-cookie'] as unknown as string[]).join(';');
    expect(cookie).toContain('token=');
    expect(cookie).toContain('HttpOnly');
  });

  it('rejects duplicate emails regardless of case', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'COOKIE@test.dev', password: 'password123' });
    expect(res.status).toBe(400);
  });

  it('logs in, serves /me, and logs out', async () => {
    const { agent, email } = await newUser();
    expect((await agent.get('/api/auth/me')).body.user.email).toBe(email);

    await agent.post('/api/auth/logout').expect(200);
    await agent.get('/api/auth/me').expect(401);

    const login = await request(app).post('/api/auth/login').send({ email, password: 'password123' });
    expect(login.status).toBe(200);
    const bad = await request(app).post('/api/auth/login').send({ email, password: 'wrong-password' });
    expect(bad.status).toBe(401);
  });

  it('requires auth on interview routes', async () => {
    await request(app).get('/api/interview/sessions').expect(401);
  });
});
