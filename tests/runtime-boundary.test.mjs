import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));

function parseVersion(value) {
  const match = String(value ?? '').match(/(\d+)\.(\d+)\.(\d+)/);
  return match ? match.slice(1).map(Number) : null;
}

test('production runtime uses the patched Next.js 15 security line', () => {
  const version = parseVersion(pkg.dependencies?.next);
  assert.ok(version, 'next version should be an explicit semver');
  assert.ok(
    version[0] > 15 ||
      (version[0] === 15 &&
        (version[1] > 5 || (version[1] === 5 && version[2] >= 24))),
    `expected next >= 15.5.24, received ${pkg.dependencies?.next}`,
  );
});

test('React runtime is a stable release rather than the inherited prerelease', () => {
  assert.doesNotMatch(String(pkg.dependencies?.react), /alpha|beta|rc/i);
  assert.doesNotMatch(String(pkg.dependencies?.['react-dom']), /alpha|beta|rc/i);
});

test('Node runtime is pinned to a supported production line without legacy OpenSSL bypasses', () => {
  assert.match(String(pkg.engines?.node), /22/);
  const scripts = JSON.stringify(pkg.scripts ?? {});
  assert.doesNotMatch(scripts, /openssl-legacy-provider/i);
});
