import { mkdirSync } from 'fs';
import { join } from 'path';

export function ensureDirectoryExists(path: string): void {
  try {
    mkdirSync(path, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
}