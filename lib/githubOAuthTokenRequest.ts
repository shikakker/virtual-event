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
