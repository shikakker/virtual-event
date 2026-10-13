import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createGithubTokenExchangeRequest } from '../lib/githubOAuthTokenRequest.ts';

test('GitHub OAuth client secret stays in a URL-encoded POST body, never in request URL', () => {
  const request = createGithubTokenExchangeRequest('client-id', 'sensitive-secret-value', 'oauth-code');
  assert.ok(request);
  assert.equal(request.url, 'https://github.com/login/oauth/access_token');
  assert.equal(new URL(request.url).search, '');
  assert.equal(request.init.method, 'POST');
  assert.equal(request.init.redirect, 'error');
  assert.equal(new Headers(request.init.headers).get('content-type'), 'application/x-www-form-urlencoded');
  assert.equal(new Headers(request.init.headers).get('accept'), 'application/json');
  const body = new URLSearchParams(String(request.init.body));
  assert.equal(body.get('client_id'), 'client-id');
  assert.equal(body.get('client_secret'), 'sensitive-secret-value');
  assert.equal(body.get('code'), 'oauth-code');
});

test('OAuth exchange fails closed on missing configuration or malformed authorization code', () => {
  for (const code of [undefined, null, 2, {}, [], '', 'x'.repeat(257), 'malformed code']) {
    assert.equal(createGithubTokenExchangeRequest('client-id', 'secret', code), null);
  }
  assert.equal(createGithubTokenExchangeRequest(undefined, 'secret', 'code'), null);
  assert.equal(createGithubTokenExchangeRequest('client-id', '', 'code'), null);
});

test('callback actually uses the safe exchange request and does not log provider token response bodies', () => {
  const callback = readFileSync(new URL('../pages/api/github-oauth.ts', import.meta.url), 'utf8');
  assert.match(callback, /createGithubTokenExchangeRequest\(/);
  assert.doesNotMatch(callback, /login\/oauth\/access_token\?\$\{q\}/);
  assert.doesNotMatch(callback, /accessTokenRes\.text\(\)/);
});
