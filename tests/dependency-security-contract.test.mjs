import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

test('patched production dependency resolutions cover disclosed sharp and source-map-js advisories', () => {
  assert.equal(manifest.resolutions?.['**/source-map-js'], '1.2.2');
  assert.equal(manifest.resolutions?.['**/sharp'], '0.35.5');
  assert.equal(manifest.resolutions?.['next/postcss'], '8.5.23');
});
