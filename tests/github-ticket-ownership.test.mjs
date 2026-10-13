import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(new URL('../pages/api/save-github-token.ts', import.meta.url), 'utf8');
const register = await readFile(new URL('../pages/api/register.ts', import.meta.url), 'utf8');

test('Github identity association requires the session cookie to match the requested registration', () => {
  assert.match(source, /req\.cookies\[COOKIE\]/);
  assert.match(source, /body\.id !== sessionId/);
  assert.match(source, /status\(403\)/);
  assert.ok(source.indexOf('body.id !== sessionId') < source.indexOf("redis.hget("));
  assert.match(register, /httpOnly: true/);
  assert.match(register, /path: '\/api'/);
});

test('malformed registration linking payloads fail with 400, without Redis operations', () => {
  assert.match(source, /req\.body && typeof req\.body === 'object'/);
  assert.match(source, /typeof body\.token !== 'string'/);
  assert.match(source, /typeof body\.id !== 'string'/);
  assert.match(source, /status\(400\)/);
});

test('same-origin request metadata is guarded before registration linking', () => {
  assert.match(source, /sec-fetch-site/);
  assert.match(source, /same-origin/);
  assert.match(source, /status\(403\)/);
});
