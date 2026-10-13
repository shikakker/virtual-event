import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { parseGithubOAuthTokenResponse, parseGithubUserProfile } from '../lib/githubOAuthTokenRequest.ts';

test('GitHub OAuth exchange rejects HTTP-200 errors, malformed bodies and unsafe token shapes', () => {
  const token = 'gho_' + 'A'.repeat(36);
  assert.equal(parseGithubOAuthTokenResponse({ access_token: token, token_type: 'bearer' }), token);
  for (const body of [null, undefined, [], {}, { error: 'bad_verification_code' },
    { access_token: 123 }, { access_token: '' }, { access_token: 'invalid token' },
    { access_token: 'tiny' }, { access_token: 'x'.repeat(513) }]) {
    assert.equal(parseGithubOAuthTokenResponse(body), null);
  }
});

test('GitHub user profile must have a safe numeric ID and bounded login', () => {
  assert.deepEqual(parseGithubUserProfile({ id: 123, login: 'example-user', name: null }), {
    id: 123, login: 'example-user', name: ''
  });
  for (const bad of [null, [], {}, { id: '123', login: 'sample' },
    { id: 0, login: 'sample' }, { id: 123, login: 'bad space' },
    { id: 123, login: 'x'.repeat(40) }, { id: 123, login: 'sample', name: {} }]) {
    assert.equal(parseGithubUserProfile(bad), null);
  }
});

test('OAuth callback validates provider responses before network/Redis side effects', () => {
  const route = readFileSync(new URL('../pages/api/github-oauth.ts', import.meta.url), 'utf8');
  assert.match(route, /parseGithubOAuthTokenResponse/);
  assert.match(route, /parseGithubUserProfile/);
  assert.doesNotMatch(route, /const \\{ access_token: accessToken \\} = await accessTokenRes\\.json\\(\\)/);
  assert.ok(route.indexOf('parseGithubOAuthTokenResponse(') < route.indexOf("fetch('https://api.github.com/user'"));
  assert.doesNotMatch(route, /await userRes\\.text\\(\\)/);
});
