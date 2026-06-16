import { randomUUID } from 'node:crypto';
import { mkdir, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

const RENAME_RETRIES = 5;
const BASE_DELAY_MS = 10;

/**
 * Write a file atomically: write to a temp sibling, then rename over the
 * target. A crash mid-write leaves the original intact instead of a truncated
 * file that JSON.parse would silently reset to empty.
 *
 * On Windows, rename can fail with EPERM or EBUSY when multiple writes race to the same
 * target file.  The retry loop with backoff handles this transparently.
 */
export async function writeFileAtomic(file: string, data: string): Promise<void> {
  await mkdir(path.dirname(file), { recursive: true });
  // A UUID per write: pid+timestamp can collide for two writes in the same
  // millisecond, making them clobber each other's temp file.
  const tmp = `${file}.${randomUUID()}.tmp`;
  await writeFile(tmp, data);

  for (let attempt = 0; ; attempt++) {
    try {
      await rename(tmp, file);
      return;
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code !== 'EPERM' && code !== 'EBUSY') throw err;
      if (attempt >= RENAME_RETRIES) throw err;
      await new Promise((r) => setTimeout(r, BASE_DELAY_MS * 2 ** attempt));
    }
  }
}
