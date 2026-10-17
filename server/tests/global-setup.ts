import { execSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import path from 'node:path';

const dbFiles = ['test.db', 'test.db-journal'].map(f => path.join(__dirname, '..', 'prisma', f));

// Fresh database from the real migrations for every test run
export default function setup() {
  dbFiles.forEach(f => rmSync(f, { force: true }));
  execSync('npx prisma migrate deploy', {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, DATABASE_URL: 'file:./test.db' },
    stdio: 'pipe'
  });
  return () => dbFiles.forEach(f => rmSync(f, { force: true }));
}
