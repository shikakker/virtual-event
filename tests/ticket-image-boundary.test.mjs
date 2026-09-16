import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const route = await readFile(
  new URL('../pages/api/ticket-images/[username].tsx', import.meta.url),
  'utf8',
);

test('ticket image endpoint is GET-only and advertises the allowed method', () => {
  assert.match(route, /req\.method !== ['"]GET['"]/);
  assert.match(route, /setHeader\(['"]Allow['"],\s*['"]GET['"]\)/);
  assert.match(route, /status\(405\)/);
});

test('ticket image endpoint bounds the GitHub username before Redis or Chromium work', () => {
  assert.match(route, /GITHUB_USERNAME_PATTERN/);
  assert.match(route, /username\.length > 39/);
  assert.match(route, /status\(400\)/);
});

test('screenshot failures return a controlled recoverable response', () => {
  assert.match(route, /catch\s*\(/);
  assert.match(route, /status\(503\)/);
  assert.match(route, /Image generation unavailable/);
  assert.match(route, /Cache-Control['"],\s*['"]no-store/);
});
