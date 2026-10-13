/** Bounded JSON shape normalization before email, captcha, or storage work. */
export function parseRegistrationBody(value: unknown): { email: string; token: string } | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const body = value as Record<string, unknown>;
  if (typeof body.email !== 'string') return null;
  if (body.token !== undefined && typeof body.token !== 'string') return null;

  const email = body.email.trim().toLowerCase();
  const token = typeof body.token === 'string' ? body.token : '';
  if (!email || email.length > 254 || token.length > 4096) return null;
  return { email, token };
}
