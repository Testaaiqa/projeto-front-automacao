import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = dirname(fileURLToPath(import.meta.url));
const usersFilePath = resolve(currentDir, '../src/data/users.json');

export async function readUsers() {
  const usersFile = await readFile(usersFilePath, 'utf-8');
  return JSON.parse(usersFile);
}

export async function writeUsers(users) {
  await writeFile(usersFilePath, `${JSON.stringify(users, null, 2)}\n`, 'utf-8');
}
