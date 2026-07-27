import crypto from 'crypto';

// Secret used to sign the public "client review" links (e.g.
// /client/project/[id]?token=...). Falls back to the Supabase service role
// key (already a private, server-only secret) so this works without extra
// configuration; set CLIENT_LINK_SECRET explicitly to rotate independently.
const SECRET = process.env.CLIENT_LINK_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;

export function generateClientToken(projectId: string): string {
  if (!SECRET) {
    throw new Error('Client link signing secret is not configured on the server.');
  }
  return crypto.createHmac('sha256', SECRET).update(projectId).digest('hex');
}

export function verifyClientToken(projectId: string, token: string | null | undefined): boolean {
  if (!SECRET || !token) return false;
  let expectedBuf: Buffer;
  let providedBuf: Buffer;
  try {
    expectedBuf = Buffer.from(generateClientToken(projectId), 'hex');
    providedBuf = Buffer.from(token, 'hex');
  } catch {
    return false;
  }
  return expectedBuf.length === providedBuf.length && crypto.timingSafeEqual(expectedBuf, providedBuf);
}
