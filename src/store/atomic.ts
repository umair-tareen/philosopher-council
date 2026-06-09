import { randomUUID } from 'node:crypto';
import { mkdir, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

/**
 * Write a file atomically: write to a temp sibling, then rename over the
 * target. A crash mid-write leaves the original intact instead of a truncated
 * file that JSON.parse would silently reset to empty.
 */
export async function writeFileAtomic(file: string, data: string): Promise<void> {
  await mkdir(path.dirname(file), { recursive: true });
  // A UUID per write: pid+timestamp can collide for two writes in the same
  // millisecond, making them clobber each other's temp file.
  const tmp = `${file}.${randomUUID()}.tmp`;
  await writeFile(tmp, data);
  await rename(tmp, file);
}
