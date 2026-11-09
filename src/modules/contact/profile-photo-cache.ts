import { createHash } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

/** Best-effort local snapshot of WhatsApp's short-lived profile-photo URLs. */
export async function saveProfilePhoto(sessionId: string, contactId: string, url: string): Promise<void> {
  const source = new URL(url);
  if (source.protocol !== 'https:') return;
  const response = await fetch(source, { signal: AbortSignal.timeout(8000), redirect: 'error' });
  if (!response.ok || !response.headers.get('content-type')?.toLowerCase().startsWith('image/')) return;
  if (Number(response.headers.get('content-length') || 0) > 2_000_000) return;
  const data = Buffer.from(await response.arrayBuffer());
  if (data.length > 2_000_000) return;
  const key = createHash('sha256').update(`${sessionId}\0${contactId}`).digest('hex');
  const directory = join(process.env.PROFILE_PHOTO_DIR || './data/profile-photos', key.slice(0, 2));
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, `${key}.image`), data);
}
