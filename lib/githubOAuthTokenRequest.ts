/**
 * Keep OAuth application credentials out of URLs, redirect destinations and
 * ordinary HTTP request logs. The provider accepts URL-encoded POST bodies.
 */
export function createGithubTokenExchangeRequest(
  clientId: string | undefined,
  clientSecret: string | undefined,
  code: unknown,
): { url: string; init: RequestInit } | null {
  if (!clientId || !clientSecret || typeof code !== 'string'
      || !/^[A-Za-z0-9_-]{1,256}$/.test(code)) {
    return null;
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
  });

  return {
    url: 'https://github.com/login/oauth/access_token',
    init: {
      method: 'POST',
      redirect: 'error',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    },
  };
}

/** GitHub can return HTTP 200 with an error object rather than an access token. */
export function parseGithubOAuthTokenResponse(value: unknown): string | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const token = (value as Record<string, unknown>).access_token;
  return typeof token === 'string' && /^[A-Za-z0-9_-]{12,512}$/.test(token)
    ? token : null;
}

/** Bound untrusted provider JSON before writing it into Redis or rendering UI. */
export function parseGithubUserProfile(value: unknown): { id: number; login: string; name: string } | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const { id, login, name } = value as Record<string, unknown>;
  if (typeof id !== 'number' || !Number.isSafeInteger(id) || id <= 0 ||
      typeof login !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9-]{0,38}$/.test(login) ||
      (name != null && (typeof name !== 'string' || name.length > 256))) {
    return null;
  }
  return { id, login, name: typeof name === 'string' ? name : '' };
}
