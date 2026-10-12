import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { parseRegistrationBody } from '../lib/registrationInput.ts';

test('invalid JSON shapes and nonstring registration fields are rejected without throwing', () => {
  for (const body of [
    null, undefined, '', 'email@example.com', [], 7, true, {},
    { email: 12 }, { email: { toString: 'bad' } },
    { email: 'hello@example.com', token: 42 },
    { email: 'a'.repeat(255) + '@example.com' },
    { email: 'hello@example.com', token: 'x'.repeat(4097) },
  ]) {
    assert.equal(parseRegistrationBody(body), null);
  }
});

test('bounded and normalized email with optional captcha token remains valid', () => {
  assert.deepEqual(
    parseRegistrationBody({ email: '  Example@Email.Com  ', token: 'captcha-token' }),
    { email: 'example@email.com', token: 'captcha-token' },
  );
  assert.deepEqual(
    parseRegistrationBody({ email: 'user@example.com' }),
    { email: 'user@example.com', token: '' },
  );
});

test('real registration route parses and validates body before redis or email checking', () => {
  const source = readFileSync(new URL('../pages/api/register.ts', import.meta.url), 'utf8');
  assert.match(source, /parseRegistrationBody\(req\.body\)/);
  assert.doesNotMatch(source, /req\.body\.email as string/);
  assert.ok(source.indexOf('parseRegistrationBody(req.body)') < source.indexOf('validator.isEmail'));
});
