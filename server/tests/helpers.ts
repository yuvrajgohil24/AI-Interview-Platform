import request from 'supertest';
import { app } from '../src/app';

let counter = 0;

// Signs up a fresh user and returns a supertest agent that carries the session cookie
export async function newUser() {
  const agent = request.agent(app);
  const email = `user${Date.now()}${counter++}@test.dev`;
  const res = await agent.post('/api/auth/signup').send({ email, password: 'password123', name: 'Test' });
  if (res.status !== 200) throw new Error(`signup failed: ${res.status} ${JSON.stringify(res.body)}`);
  return { agent, email, id: res.body.user.id as string };
}
