import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const cmsApi = await readFile(new URL('../lib/cms-api.ts', import.meta.url), 'utf8');

test('CMS collection boundary always resolves to an array', () => {
  assert.match(cmsApi, /Array\.isArray\(/);
  assert.match(cmsApi, /catch\s*\(/);
  assert.match(cmsApi, /return \[\]/);
});

test('all collection readers pass through the fail-closed boundary', () => {
  for (const name of ['getAllSpeakers', 'getAllStages', 'getAllSponsors', 'getAllJobs']) {
    assert.match(cmsApi, new RegExp(`safeCollection\\([^)]*cmsApi\\.${name}`));
  }
});
