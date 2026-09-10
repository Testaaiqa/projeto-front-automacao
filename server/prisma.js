import fs from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';

function loadDotEnv() {
  if (process.env.DATABASE_URL && process.env.AUTH_SECRET) {
    return;
  }

  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    return;
  }

  const raw = fs.readFileSync(envPath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');
    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadDotEnv();

const globalForPrisma = globalThis;

export const prisma = globalForPrisma.__prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__prisma = prisma;
}